"use client";

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Camera,
  Download,
  FileText,
  Filter,
  Info,
  Share2,
  Telescope,
  Trash2,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  Card,
} from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { getSkyViewThumbnailUrl } from '@/src/lib/client/skyview';
import { useToast } from '@/src/hooks/useToast';
import Image from 'next/image';

interface Equipment {
  type: "telescope" | "camera" | "filter";
  name: string;
}

interface ProjectTarget {
  name: string;
  coordinates: { ra: string; dec: string };
  category?: string;
  angularSizeArcmin?: number;
  catalogIds?: string[];
  constellation?: string;
  type?: string;
  commonNames?: string[];
  fitsMetadata?: Record<string, unknown>;
}

interface ProjectCardProps {
  id: string;
  targetName: string;
  status: "new" | "in_progress" | "completed";
  thumbnailUrl: string;
  userImageUrl?: string;
  creationDate: string;
  frameCount: number;
  fileSize: string;
  equipment: Equipment[];
  onDelete?: (id: string) => void;
  onExport?: (id: string) => void;
  onShare?: (id: string) => void;
  className?: string;
  onClick?: () => void;
  title?: string;
  name?: string;
  updatedAt?: string;
  onProjectNameUpdate?: (id: string, newName: string) => Promise<void>;
  target?: ProjectTarget;
  onProjectDeleted?: () => void;
}

function ProjectCard({
  id,
  targetName,
  status,
  thumbnailUrl,
  userImageUrl,
  creationDate,
  frameCount,
  fileSize,
  equipment,
  onDelete,
  onExport,
  onShare,
  className,
  onClick,
  title,
  name,
  updatedAt,
  onProjectNameUpdate,
  target,
  onProjectDeleted,
}: ProjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(title || name || 'Untitled Project');
  const [isSavingName, setIsSavingName] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [deletedProject, setDeletedProject] = useState<{
    id: string;
    targetName: string;
    status: "new" | "in_progress" | "completed";
    thumbnailUrl: string;
    userImageUrl?: string;
    creationDate: string;
    frameCount: number;
    fileSize: string;
    equipment: Equipment[];
    title?: string;
    name?: string;
    updatedAt?: string;
    target?: ProjectTarget;
  } | null>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToast } = useToast();
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  
  const handleDelete = async () => {
    console.log('[ProjectCard] handleDelete called for project:', id);
    if (onDelete) await onDelete(id);
    setShowDeleteConfirm(false);
    if (onProjectDeleted) onProjectDeleted();
    // Show undo UI
    setShowUndo(true);
    setDeletedProject({
      id,
      targetName,
      status,
      thumbnailUrl,
      userImageUrl,
      creationDate,
      frameCount,
      fileSize,
      equipment,
      title,
      name,
      updatedAt,
      target,
    });
    // Hide undo after 5 seconds
    if (undoTimeout) clearTimeout(undoTimeout);
    const timeout = setTimeout(() => setShowUndo(false), 5000);
    setUndoTimeout(timeout);
  };

  const getStatusBadgeVariant = () => {
    switch (status) {
      case "new": return "bg-blue-100 text-blue-600";
      case "in_progress": return "bg-amber-100 text-amber-600";
      case "completed": return "bg-green-100 text-green-600";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "new": return "New";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "new": return <Info className="w-3.5 h-3.5 mr-1 text-blue-500" />;
      case "in_progress": return <Clock className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />;
      case "completed": return <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />;
    }
  };

  // SkyView dynamic thumbnail logic
  let skyviewUrl: string | undefined = undefined;
  if (target && target.coordinates && target.coordinates.ra && target.coordinates.dec) {
    // Determine FOV (arcmin)
    let fovArcmin = 30;
    if (target.angularSizeArcmin) {
      fovArcmin = Math.max(target.angularSizeArcmin * 1.5, 15); // Add padding, min 15'
    } else if (target.category === 'galaxy') {
      fovArcmin = 40;
    } else if (target.category === 'nebula') {
      fovArcmin = 30;
    } else if (target.category === 'star cluster') {
      fovArcmin = 20;
    }
    skyviewUrl = getSkyViewThumbnailUrl({
      ra: target.coordinates.ra,
      dec: target.coordinates.dec,
      fovArcmin,
    });
  }
  const displayImage = skyviewUrl || (status === "completed" && userImageUrl ? userImageUrl : thumbnailUrl);

  const getEquipmentIcon = (type: Equipment["type"]) => {
    switch (type) {
      case "telescope": return <Telescope className="h-3 w-3 mr-1" />;
      case "camera": return <Camera className="h-3 w-3 mr-1" />;
      case "filter": return <Filter className="h-3 w-3 mr-1" />;
    }
  };

  const projectName = title || name || 'Untitled Project';

  // Format dates and active time
  const formatDate = (date: string | Date | undefined | null) => {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Fallbacks for missing fields
  const dataFallbacks: string[] = [];
  const safeTargetName = targetName || title || name || '—';
  if (!targetName && !title && !name) dataFallbacks.push('targetName');
  const safeFrameCount = typeof frameCount === 'number' ? frameCount : 0;
  if (typeof frameCount !== 'number') dataFallbacks.push('frameCount');
  const safeFileSize = fileSize || '—';
  if (!fileSize) dataFallbacks.push('fileSize');
  const safeCreationDate = formatDate(creationDate);
  if (!creationDate) dataFallbacks.push('creationDate');
  const safeUpdatedAt = formatDate(updatedAt);
  if (!updatedAt) dataFallbacks.push('updatedAt');
  const safeEquipment = Array.isArray(equipment) ? equipment : [];
  if (!Array.isArray(equipment) || equipment.length === 0) dataFallbacks.push('equipment');
  const safeDisplayImage = displayImage || '/images/placeholder.jpg';
  if (!displayImage) dataFallbacks.push('displayImage');

  // Log when the delete confirmation dialog renders and relevant state/props
  useEffect(() => {
    if (showDeleteConfirm) {
      console.log('[ProjectCard] Delete confirmation popup shown for project:', id);
      console.log('[ProjectCard] Props:', { id, onDelete, onProjectDeleted });
    }
  }, [showDeleteConfirm, id, onDelete, onProjectDeleted]);

  // Placeholder async update function (to be implemented)
  async function handleInlineEditSave(field: string, value: string) {
    setIsSavingName(true);
    try {
      if (field === 'object') setThumbnailLoading(true);
      const res = await fetch('/api/project-file-metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: id, field, value }),
      });
      if (!res.ok) throw new Error('Failed to update metadata');
      setIsEditingName(false);
      setEditedName(value);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      if (onProjectDeleted) onProjectDeleted();
      if (onProjectNameUpdate) {
        await onProjectNameUpdate(id, value.trim());
      }
      addToast('success', `${field === 'object' ? 'Object name' : 'Equipment'} updated!`);
    } finally {
      setIsSavingName(false);
      if (field === 'object') setTimeout(() => setThumbnailLoading(false), 1200);
    }
  }

  return (
    <div className={className} data-fallbacks={dataFallbacks.join(',')}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        whileHover={{ scale: 1.035, boxShadow: "0 4px 32px 0 rgba(56,189,248,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.10)" }}
      >
        <Card
          className={`w-full max-w-[400px] min-h-[340px] max-h-[400px] bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col transition-all duration-300 ${onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-[0.98]' : ''}`}
          tabIndex={onClick ? 0 : undefined}
          aria-label={onClick ? `Project card for ${safeTargetName}` : undefined}
          role={onClick ? 'button' : undefined}
          onClick={onClick}
          onKeyDown={onClick ? (e => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
              e.preventDefault();
              onClick();
            }
          }) : undefined}
        >
          {/* Top Section: Image with overlays */}
          <div className="relative flex-1 min-h-[180px] max-h-[180px] aspect-square bg-gray-900">
            {thumbnailLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
                <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </div>
            )}
            <Image
              src={safeDisplayImage}
              alt={safeTargetName}
              className="object-cover w-full h-full min-h-[180px] max-h-[180px] aspect-square bg-black"
              onError={e => {
                const img = e.target as HTMLImageElement;
                if (!img.src.endsWith('/images/placeholder.jpg')) {
                  img.src = '/images/placeholder.jpg';
                }
              }}
              onLoad={() => setThumbnailLoading(false)}
              width={180}
              height={180}
            />
            {/* Project Name (centered top) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-full flex flex-col items-center pointer-events-auto group">
              {isEditingName ? (
                <form
                  className="flex items-center gap-2"
                  onClick={e => e.stopPropagation()}
                  onSubmit={async e => {
                    e.preventDefault();
                    if (!editedName.trim()) return;
                    await handleInlineEditSave('object', editedName.trim());
                  }}
                >
                  <input
                    className="text-lg font-bold text-white bg-gray-800/80 rounded px-2 py-1 outline-none border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    disabled={isSavingName}
                    autoFocus
                    maxLength={64}
                    onClick={e => e.stopPropagation()}
                  />
                  <button
                    type="submit"
                    className="text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 text-sm font-semibold disabled:opacity-50"
                    disabled={isSavingName || !editedName.trim()}
                    title="Save"
                    onClick={e => e.stopPropagation()}
                  >
                    {isSavingName ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg> : 'Save'}
                  </button>
                  <button
                    type="button"
                    className="text-white bg-gray-600 hover:bg-gray-700 rounded px-2 py-1 text-sm font-semibold ml-1"
                    onClick={e => { e.stopPropagation(); setIsEditingName(false); setEditedName(projectName); }}
                    disabled={isSavingName}
                    title="Cancel"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2 group pointer-events-auto">
                  <h3
                    className="text-lg font-bold text-white drop-shadow text-center px-2"
                    title={projectName}
                    onClick={e => e.stopPropagation()}
                  >
                    {projectName}
                  </h3>
                </div>
              )}
              {showSuccess && <div className="text-green-400 text-xs mt-1 flex items-center gap-1"><span>✓</span> Updated!</div>}
            </div>
          </div>
          {/* Bottom Section: Blue background with project name, tags and actions */}
          <div className="bg-primary text-primary-foreground p-1 flex flex-col gap-1 rounded-b-3xl text-xs">
            {/* Object/Target Name and Status Badge Row */}
            <div className="flex items-center justify-between mb-0.5">
              <div className="font-semibold text-xs flex items-center gap-1">
                Object:
                <span className="font-mono">{safeTargetName}</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="default"
                      className={
                        getStatusBadgeVariant() +
                        ' text-xs px-3 py-1 shadow rounded-full whitespace-nowrap min-w-[90px] text-center flex items-center gap-1 status-badge-animate'
                      }
                    >
                      {getStatusIcon()}
                      {getStatusLabel()}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Project status: {getStatusLabel()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {/* Metadata Block */}
            <div className="flex flex-col gap-0.5 text-[10px] text-primary-foreground/80 mb-1 bg-primary/60 rounded-md px-1 py-0.5">
              <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap overflow-hidden">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="truncate max-w-[90px]">{safeCreationDate}</span>
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-primary-foreground/20 my-0.5" />
            {/* Equipment Block - now with inline editing */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-1 justify-start items-center text-white text-xs font-medium">
              {safeEquipment.length === 0 ? (
                <span className="text-gray-400 italic">No equipment info</span>
              ) : (
                safeEquipment.map((item, index) => (
                  <TooltipProvider key={index}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800/70 border border-gray-700 text-xs font-medium equipment-pill-animate">
                          {getEquipmentIcon(item.type)}
                          <span>{item.name}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}: {item.name}
                      </TooltipContent>
                    </Tooltip>
                    {index < safeEquipment.length - 1 && <span className="mx-1 text-white/40">&bull;</span>}
                  </TooltipProvider>
                ))
              )}
            </div>
            {/* Stats & Actions */}
            <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1">
              <div className="flex flex-row gap-3 text-xs items-center">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span className="font-mono">{safeFrameCount}</span>
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span className="font-mono">{safeFileSize}</span>
                </span>
              </div>
              <div className="flex gap-2 justify-center w-full">
                <Dialog>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-primary text-white shadow-lg" aria-label="Project Info" onClick={e => { e.stopPropagation(); }}>
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Project Info</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <DialogContent className="bg-gray-900 border border-gray-800 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle>Project Information</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto px-1 py-2 space-y-6 text-sm text-primary-foreground">
                      {/* Project Info Section */}
                      <div>
                        <h3 className="font-bold text-base mb-2 text-blue-300">Project Info</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                          <div><span className="text-gray-400">Created:</span> {safeCreationDate}</div>
                          <div><span className="text-gray-400">Updated:</span> {safeUpdatedAt}</div>
                          <div><span className="text-gray-400">Frames:</span> {safeFrameCount}</div>
                          <div><span className="text-gray-400">Size:</span> {safeFileSize}</div>
                          <div><span className="text-gray-400">Status:</span> {getStatusLabel()}</div>
                          <div><span className="text-gray-400">Project ID:</span> <span className="font-mono text-xs break-all">{id}</span></div>
                        </div>
                      </div>
                      {/* Target Details Section */}
                      {target && (
                        <div>
                          <h3 className="font-bold text-base mb-2 text-blue-300">Target Details</h3>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {target.name && <div><span className="text-gray-400">Name:</span> {target.name}</div>}
                            {target.catalogIds && target.catalogIds.length > 0 && <div><span className="text-gray-400">Catalog IDs:</span> {target.catalogIds.join(', ')}</div>}
                            {target.constellation && <div><span className="text-gray-400">Constellation:</span> {target.constellation}</div>}
                            {target.type && <div><span className="text-gray-400">Type:</span> {target.type}</div>}
                            {target.category && <div><span className="text-gray-400">Category:</span> {target.category}</div>}
                            {target.commonNames && target.commonNames.length > 0 && <div><span className="text-gray-400">Common Names:</span> {target.commonNames.join(', ')}</div>}
                            {target.coordinates && (target.coordinates.ra || target.coordinates.dec) && (
                              <div className="col-span-2"><span className="text-gray-400">Coordinates:</span> RA: {target.coordinates.ra}, Dec: {target.coordinates.dec}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Equipment Section */}
                      {safeEquipment.length > 0 && (
                        <div>
                          <h3 className="font-bold text-base mb-2 text-blue-300">Equipment</h3>
                          <div className="flex flex-wrap gap-4">
                            {safeEquipment.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-800/60 rounded px-2 py-1">
                                {getEquipmentIcon(item.type)}
                                <span className="capitalize text-white/90">{item.type}:</span>
                                <span className="font-mono text-xs text-blue-200">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* FITS Metadata Section (if available) */}
                      {target && target.fitsMetadata && (
                        <div>
                          <h3 className="font-bold text-base mb-2 text-blue-300">FITS Metadata</h3>
                          <div className="bg-gray-900/80 rounded p-3 text-xs text-blue-100 grid grid-cols-2 gap-x-6 gap-y-1">
                            {/* Standard important fields */}
                            {[
                              ['exposure_time', 'Exposure Time (s)'],
                              ['gain', 'Gain'],
                              ['egain', 'eGain'],
                              ['temperature', 'Temperature (°C)'],
                              ['binning', 'Binning'],
                              ['focal_length', 'Focal Length (mm)'],
                              ['offset', 'Offset'],
                              ['pixel_size', 'Pixel Size (μm)'],
                              ['image_type', 'Image Type'],
                              ['object', 'Object'],
                              ['filter', 'Filter'],
                              ['date_obs', 'Date Obs'],
                              ['telescope', 'Telescope'],
                              ['instrument', 'Instrument'],
                              ['creator', 'Creator'],
                              ['observation_type', 'Observation Type'],
                              ['ra', 'RA'],
                              ['dec', 'Dec'],
                            ].map(([key, label]) => (
                              <div key={key}><span className="text-gray-400">{label}:</span> <span className="font-mono">{target.fitsMetadata && target.fitsMetadata[key] != null && target.fitsMetadata[key] !== '' ? String(target.fitsMetadata[key]) : '—'}</span></div>
                            ))}
                            {/* Show any other metadata fields not in the above list */}
                            {Object.entries(target.fitsMetadata)
                              .filter(([key]) => ![
                                'exposure_time','gain','egain','temperature','binning','focal_length','offset','pixel_size','image_type','object','filter','date_obs','telescope','instrument','creator','observation_type','ra','dec'
                              ].includes(key))
                              .map(([key, value]) => (
                                <div key={key}><span className="text-gray-400">{key}:</span> <span className="font-mono">{value != null && value !== '' ? String(value) : '—'}</span></div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onExport && onExport(id); }} aria-label="Export Project">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onShare && onShare(id); }} aria-label="Share Project">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-red-600 hover:text-white text-white border-none" onClick={e => { e.stopPropagation(); console.log('[ProjectCard] Delete button clicked for project:', id); setShowDeleteConfirm(true); }} aria-label="Delete Project">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Delete confirmation dialog (now in a portal) */}
          {showDeleteConfirm && typeof window !== 'undefined' && ReactDOM.createPortal(
            <AnimatePresence>
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={e => e.stopPropagation()}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="bg-gray-900 rounded-lg p-8 max-w-sm w-full shadow-xl border border-gray-700" onClick={e => e.stopPropagation()}>
                    <h2 className="text-lg font-bold text-white mb-4">Delete Project?</h2>
                    <p className="text-gray-300 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => { console.log('[ProjectCard] Delete cancel clicked for project:', id); setShowDeleteConfirm(false); }}>
                        Cancel
                      </Button>
                      <Button variant="destructive" 
                        onClick={async (e) => { 
                          console.log('[ProjectCard] Delete confirm button rendered for project:', id, 'event:', e);
                          try {
                            console.log('[ProjectCard] Delete confirm clicked for project:', id);
                            await handleDelete();
                          } catch (err) {
                            console.error('[ProjectCard] Error in handleDelete for project:', id, err);
                          }
                        }}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </AnimatePresence>,
            document.body
          )}
          {/* Undo UI (simple inline alert for now) */}
          {showUndo && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 border border-gray-700">
              <span>Project deleted.</span>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-semibold"
                onClick={() => {
                  setShowUndo(false);
                  if (undoTimeout) clearTimeout(undoTimeout);
                  // Optionally: call a prop or context to restore the project
                  // For now, just log
                  console.log('[ProjectCard] Undo clicked for project:', deletedProject);
                  // You would need to implement actual restore logic in the parent/dashboard
                }}
              >
                Undo
              </button>
            </div>
          )}
        </Card>
      </motion.div>
      <style jsx>{`
        @media (max-width: 640px) {
          .max-w-[400px] { max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

// Skeleton loading state for ProjectCard
export function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse w-full max-w-4xl bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="relative flex-1 min-h-[266px] max-h-[400px] bg-gray-800">
          <div className="w-full h-full min-h-[266px] max-h-[400px] bg-gray-700 shimmer" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-gray-700 rounded-lg shimmer" />
        </div>
        <div className="bg-primary text-primary-foreground p-1.5 flex flex-col gap-1.5 rounded-b-3xl text-sm">
          <div className="flex items-center justify-between mb-0.5">
            <div className="h-4 w-24 bg-gray-700 rounded shimmer" />
            <div className="h-4 w-12 bg-gray-700 rounded shimmer" />
          </div>
          <div className="flex flex-col gap-0.5 text-[11px] mb-1">
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 bg-gray-700 rounded shimmer" />
              <div className="h-3 w-16 bg-gray-700 rounded shimmer" />
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 my-0.5" />
          <div className="flex flex-wrap gap-1.5 mb-1 justify-center">
            <div className="h-4 w-16 bg-gray-700 rounded-full shimmer" />
            <div className="h-4 w-12 bg-gray-700 rounded-full shimmer" />
          </div>
          <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1.5">
            <div className="flex flex-row gap-3 text-xs">
              <div className="h-3 w-10 bg-gray-700 rounded shimmer" />
              <div className="h-3 w-10 bg-gray-700 rounded shimmer" />
            </div>
            <div className="flex gap-1.5 ml-auto">
              <div className="h-8 w-8 bg-gray-700 rounded-full shimmer" />
              <div className="h-8 w-8 bg-gray-700 rounded-full shimmer" />
              <div className="h-8 w-8 bg-gray-700 rounded-full shimmer" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default ProjectCard; 