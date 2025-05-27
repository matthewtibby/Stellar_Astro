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
  Edit3,
  AlertCircle,
  Layers,
  Copy,
  Archive as ArchiveIcon,
  X,
  Thermometer,
  Clock,
} from "lucide-react";
import {
  Card,
} from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Tooltip as TooltipComponent,
  TooltipContent as TooltipContentComponent,
  TooltipProvider as TooltipProviderComponent,
  TooltipTrigger as TooltipTriggerComponent,
} from "@/components/ui/tooltip";
import { getSkyViewThumbnailUrl } from '@/src/lib/client/skyview';
import { useToast } from '@/src/hooks/useToast';

interface Equipment {
  type: "telescope" | "camera" | "filter";
  name: string;
}

interface ProjectCardProps {
  id: string;
  targetName: string;
  status: "new" | "in_progress" | "completed" | "failed";
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
  target?: any;
  onProjectDeleted?: () => void;
}

// Helper for timeout
function useTimeout(callback: () => void, delay: number | null) {
  useEffect(() => {
    if (delay === null) return;
    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  }, [callback, delay]);
}

const MotionDiv = motion.div as any;
const MotionButton = motion.button as any;
const MotionMetaDiv = motion.div as any;

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
  console.log('ProjectCard props:', { id, frameCount, targetName, status, thumbnailUrl, userImageUrl, creationDate, fileSize, equipment, title, name, updatedAt, target });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(title || name || 'Untitled Project');
  const [isSavingName, setIsSavingName] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const [deletedProject, setDeletedProject] = useState<any>(null);
  const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const { addToast } = useToast();
  const [editingEquipment, setEditingEquipment] = useState<{ type: string; index: number } | null>(null);
  const [editedEquipmentName, setEditedEquipmentName] = useState('');
  const [thumbnailLoading, setThumbnailLoading] = useState(false);
  const [isEditingObject, setIsEditingObject] = useState(false);
  const [editedObject, setEditedObject] = useState(targetName || title || name || '—');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  
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
      case "in_progress": return "bg-gradient-to-r from-purple-500/80 to-blue-500/80 border border-purple-500/30";
      case "completed": return "bg-green-100 text-green-600";
      case "failed": return "bg-red-100 text-red-600";
      default: return "bg-gray-200 text-gray-600";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "new": return "New";
      case "in_progress": return "In Progress";
      case "completed": return "Completed";
      case "failed": return "Failed";
      default: return status;
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

  // Helper to format date range
  function formatDateRange(start: string | Date | undefined | null, end: string | Date | undefined | null) {
    if (!start && !end) return '—';
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (s && e && s.toDateString() === e.toDateString()) {
      return s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if (s && e) {
      return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`;
    }
    if (s) return s.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (e) return e.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return '—';
  }

  const getSupabaseClient = async () => {
    if (typeof window !== 'undefined') {
      const mod = await import('@/src/lib/supabaseClient');
      return mod.supabase;
    }
    return null;
  };

  // Fallbacks for missing fields
  const dataFallbacks: string[] = [];
  const safeTargetName = targetName || title || name || '—';
  if (!targetName && !title && !name) dataFallbacks.push('targetName');
  const safeFrameCount = typeof frameCount === 'number' ? frameCount : 0;
  if (typeof frameCount !== 'number') dataFallbacks.push('frameCount');
  const safeFileSize = fileSize || '—';
  if (!fileSize) dataFallbacks.push('fileSize');
  const safeCreationDate = formatDateRange(creationDate, updatedAt);
  if (!creationDate || !updatedAt) dataFallbacks.push('creationDate');
  const safeEquipment = Array.isArray(equipment) ? equipment : [];
  if (!Array.isArray(equipment) || equipment.length === 0) dataFallbacks.push('equipment');
  const safeStatus = ['new', 'in_progress', 'completed'].includes(status) ? status : 'new';
  if (!['new', 'in_progress', 'completed'].includes(status)) dataFallbacks.push('status');
  const safeDisplayImage = displayImage || '/images/placeholder.jpg';
  if (!displayImage) dataFallbacks.push('displayImage');

  // Determine if critical fields are missing
  const criticalMissing = [
    !safeTargetName || safeTargetName === '—',
    safeFrameCount === 0,
    safeFileSize === '—',
    !safeDisplayImage || safeDisplayImage === '/images/placeholder.jpg',
  ].some(Boolean);

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
    setError(null);
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
    } catch (err: any) {
      setError(err.message || 'Failed to update name');
      addToast('error', err.message || 'Failed to update');
    } finally {
      setIsSavingName(false);
      if (field === 'object') setTimeout(() => setThumbnailLoading(false), 1200);
    }
  }

  // Equipment inline edit handler
  const handleEquipmentEdit = (type: string, index: number, name: string) => {
    setEditingEquipment({ type, index });
    setEditedEquipmentName(name);
  };
  const handleEquipmentSave = async (type: string, index: number) => {
    await handleInlineEditSave(type, editedEquipmentName);
    setEditingEquipment(null);
    setEditedEquipmentName('');
  };

  // Remove duplicate equipment/camera/mount/file/size info from the card
  // Only show unique equipment items, and only once per type
  const uniqueEquipment = Array.isArray(equipment)
    ? equipment.filter((item, idx, arr) =>
        arr.findIndex(e => e.type === item.type && e.name.trim() === item.name.trim()) === idx
      )
    : [];

  // Helper to extract exposure and temperature
  function getExposureAndTemp(target: any, safeFrameCount: number) {
    let exposure = null;
    let temp = null;
    if (target && target.fitsMetadata) {
      // Exposure: try to get number of frames and exposure time per frame
      const frameCount = target.fitsMetadata.frame_count || safeFrameCount;
      const exposureTime = target.fitsMetadata.exposure_time || null;
      if (frameCount && exposureTime) {
        exposure = `${frameCount} x ${exposureTime}s`;
      } else if (exposureTime) {
        exposure = `${exposureTime}s`;
      }
      // Temperature
      if (typeof target.fitsMetadata.temperature === 'number') {
        temp = `${Math.round(target.fitsMetadata.temperature)}°C`;
      } else if (typeof target.fitsMetadata.temperature === 'string') {
        temp = `${target.fitsMetadata.temperature}°C`;
      }
    }
    return { exposure, temp };
  }

  const { exposure, temp } = getExposureAndTemp(target, safeFrameCount);

  return (
    <MotionDiv
      className={`transition-all duration-300 ${className || ''} focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-2xl hover:scale-[1.025] active:scale-[0.98] group relative hover:scale-[1.04] hover:shadow-2xl`}
      style={{ cursor: onClick ? 'pointer' : undefined, overflow: 'hidden' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-fallbacks={dataFallbacks.join(',')}
      tabIndex={0}
      aria-label={`Project card for ${safeTargetName}`}
      role="button"
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          onClick &&
          (e.key === 'Enter' || e.key === ' ') &&
          e.target === e.currentTarget
        ) {
          e.preventDefault();
          onClick();
        }
      }}
      initial={false}
      animate={{ height: 'fit-content' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Glass blur and drop shadow */}
      <div className="absolute inset-0 z-0 rounded-3xl backdrop-blur-md bg-gray-900/70 shadow-2xl pointer-events-none" />
      {/* Card Content */}
      <Card
        className="w-full max-w-[400px] min-h-[340px] max-h-[400px] border border-blue-400/20 rounded-3xl overflow-hidden flex flex-col relative bg-gray-900/80 group transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.04] hover:border-blue-400/60 focus-within:shadow-2xl focus-within:scale-[1.04] focus-within:border-blue-400/60 hover:ring-2 hover:ring-blue-400/40"
        style={{ boxShadow: '0 4px 32px 0 rgba(56, 189, 248, 0.18), 0 1.5px 8px 0 rgba(139, 92, 246, 0.10)' }}
      >
        {/* Top Section: Image with overlays */}
        <div className="relative flex-1 min-h-[180px] max-h-[180px] aspect-square bg-gray-900">
          {/* Project name in top-left over image */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
            <h3 className="text-xl font-extrabold text-white drop-shadow-sm leading-tight flex-1">
              {projectName}
            </h3>
            {/* Pencil icon only on hover and if editable */}
            {onProjectNameUpdate && !isEditingName && (
              <button
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/70 hover:text-blue-400 p-1 rounded-full"
                onClick={e => { e.stopPropagation(); setIsEditingName(true); }}
                title="Rename project"
              >
                <Edit3 className="h-5 w-5" />
              </button>
            )}
          </div>
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/15 z-10 pointer-events-none rounded-t-3xl" />
          {thumbnailLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
              <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
            </div>
          )}
          <img
            src={safeDisplayImage}
            alt={safeTargetName}
            className="object-cover w-full h-full min-h-[180px] max-h-[180px] aspect-square bg-black rounded-t-3xl"
            onError={e => {
              const img = e.target as HTMLImageElement;
              if (!img.src.endsWith('/images/placeholder.jpg')) {
                img.src = '/images/placeholder.jpg';
              }
            }}
            onLoad={() => setThumbnailLoading(false)}
          />
        </div>
        {/* Title, object, and tags */}
        <div className="px-4 pt-3 pb-1 flex flex-col gap-0.5 relative">
          {/* Status badge in top-right of blue section */}
          <div className="absolute top-2 right-2 z-10">
            <Badge
              variant="default"
              className={
                getStatusBadgeVariant() +
                (status === 'in_progress'
                  ? ' text-xs px-3 py-1 shadow rounded-full whitespace-nowrap min-w-[90px] text-center font-bold drop-shadow-lg border border-purple-500/30 bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : ' text-xs px-3 py-1 shadow rounded-full whitespace-nowrap min-w-[90px] text-center font-bold drop-shadow-lg border border-white/30')
              }
              style={status === 'in_progress' ? { filter: 'brightness(1.1) contrast(1.1)' } : { filter: 'brightness(1.2) contrast(1.2)' }}
            >
              <span className={status === 'in_progress' ? 'text-white' : ''}>
                {getStatusLabel()}
              </span>
            </Badge>
          </div>
          {/* Object as subheading */}
          <div className="text-base font-semibold text-blue-200 leading-tight">
            {safeTargetName}
          </div>
          {/* Target type/tags placeholder */}
          {target && target.category && (
            <div className="text-xs text-blue-400 font-medium mt-0.5">{target.category}</div>
          )}
        </div>
        {/* Metadata Block: Dates and frames/size condensed */}
        <div className="flex flex-col gap-0.5 text-[12px] text-primary-foreground/80 mb-1 bg-primary/60 rounded-md px-4 py-1">
          <div className="flex items-center gap-2">
            <ArchiveIcon className="w-4 h-4 flex-shrink-0 mr-1" />
            <span className="truncate" title="File Size">{safeFileSize}</span>
          </div>
        </div>
        {/* Metadata row at bottom with icons */}
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-t border-primary-foreground/10 mt-auto text-sm text-blue-100 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  <span>{safeFrameCount}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Frame Count</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{exposure || '—'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Frame Exposure</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Thermometer className="h-4 w-4" />
                  <span>{temp || '—'}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Sensor Temperature</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {/* Action icons hover cluster at bottom - now always visible */}
        <div className="flex gap-2 justify-center w-full mt-2 mb-8 opacity-100 transition-opacity duration-200">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-primary text-white shadow-lg ripple" aria-label="Project Info" onClick={e => { e.stopPropagation(); setShowInfoModal(true); }}>
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Project Info</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none ripple" onClick={e => { e.stopPropagation(); onExport && onExport(id); }} aria-label="Download Project">
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Download</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none ripple" onClick={e => { e.stopPropagation(); onShare && onShare(id); }} aria-label="Share Project">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="hover:bg-red-600 hover:text-white text-white border-none ripple" onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }} aria-label="Delete Project">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
            {/* 7. Contextual menu (⋮) for more actions, visible on hover */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none ripple" aria-label="More Actions" onClick={e => { e.stopPropagation(); /* open menu logic here */ }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/></svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>More</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        {/* Edit Project Info Modal */}
        {showEditModal && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="bg-gray-900 border border-gray-800 shadow-2xl">
              <DialogHeader>
                <DialogTitle>Edit Project Info</DialogTitle>
              </DialogHeader>
              {/* Form fields for editing object, telescope, camera, etc. */}
              {/* ... implement as needed ... */}
              <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded" onClick={() => setShowEditModal(false)}>Close</button>
            </DialogContent>
          </Dialog>
        )}
        {/* Project Info Modal */}
        {showInfoModal && (
          <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
            <DialogContent className="bg-gray-900 border border-gray-800 shadow-2xl max-w-lg">
              <DialogHeader>
                <DialogTitle>Project Info</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-blue-100">
                <div>
                  <span className="font-bold">Project Name:</span> {projectName}
                </div>
                <div>
                  <span className="font-bold">Object/Target:</span> {safeTargetName}
                </div>
                {target && target.category && (
                  <div><span className="font-bold">Type:</span> {target.category}</div>
                )}
                {Array.isArray(target?.catalogIds) && target.catalogIds.length > 0 && (
                  <div><span className="font-bold">Catalog IDs:</span> {target.catalogIds.join(', ')}</div>
                )}
                {Array.isArray(equipment) && equipment.length > 0 && (
                  <div>
                    <span className="font-bold">Equipment:</span>
                    <ul className="ml-4 list-disc">
                      {equipment.map((eq, i) => (
                        <li key={i}>{eq.type}: {eq.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div><span className="font-bold">File Size:</span> {safeFileSize}</div>
                <div><span className="font-bold">Frame Count:</span> {safeFrameCount}</div>
                <div><span className="font-bold">Exposure:</span> {exposure || '—'}</div>
                <div><span className="font-bold">Temperature:</span> {temp || '—'}</div>
                {target?.fitsMetadata && (
                  <div>
                    <span className="font-bold">FITS Metadata:</span>
                    <ul className="ml-4 list-disc">
                      {Object.entries(target.fitsMetadata).map(([key, value]) => (
                        <li key={key}><span className="capitalize">{key}</span>: {String(value)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Card>
      <style jsx global>{`
        .ripple {
          position: relative;
          overflow: hidden;
        }
        .ripple:after {
          content: '';
          display: block;
          position: absolute;
          border-radius: 50%;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          pointer-events: none;
          background: rgba(56,189,248,0.15);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .ripple:active:after {
          opacity: 1;
          transition: opacity 0s;
        }
      `}</style>
    </MotionDiv>
  );
}

// Skeleton loading state for ProjectCard
export function ProjectCardSkeleton() {
  return (
    <div className="animate-pulse w-full max-w-4xl bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col">
      <div className="relative flex-1 min-h-[266px] max-h-[400px] bg-gray-800">
        <div className="w-full h-full min-h-[266px] max-h-[400px] bg-gray-700" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-2/3 h-8 bg-gray-700 rounded-lg" />
      </div>
      <div className="bg-primary text-primary-foreground p-1.5 flex flex-col gap-1.5 rounded-b-3xl text-sm">
        <div className="flex items-center justify-between mb-0.5">
          <div className="h-4 w-24 bg-gray-700 rounded" />
          <div className="h-4 w-12 bg-gray-700 rounded" />
        </div>
        <div className="flex flex-col gap-0.5 text-[11px] mb-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-16 bg-gray-700 rounded" />
            <div className="h-3 w-16 bg-gray-700 rounded" />
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 my-0.5" />
        <div className="flex flex-wrap gap-1.5 mb-1 justify-center">
          <div className="h-4 w-16 bg-gray-700 rounded-full" />
          <div className="h-4 w-12 bg-gray-700 rounded-full" />
        </div>
        <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1.5">
          <div className="flex flex-row gap-3 text-xs">
            <div className="h-3 w-10 bg-gray-700 rounded" />
            <div className="h-3 w-10 bg-gray-700 rounded" />
          </div>
          <div className="flex gap-1.5 ml-auto">
            <div className="h-8 w-8 bg-gray-700 rounded-full" />
            <div className="h-8 w-8 bg-gray-700 rounded-full" />
            <div className="h-8 w-8 bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectCard; 