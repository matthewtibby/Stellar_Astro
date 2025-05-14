"use client";

import React, { useState } from "react";
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

interface Equipment {
  type: "telescope" | "camera" | "filter";
  name: string;
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
  target?: any;
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
}: ProjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(title || name || 'Untitled Project');
  const [isSavingName, setIsSavingName] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = () => {
    if (onDelete) onDelete(id);
    setShowDeleteConfirm(false);
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
  const safeCreationDate = formatDate(creationDate);
  if (!creationDate) dataFallbacks.push('creationDate');
  const safeUpdatedAt = formatDate(updatedAt);
  if (!updatedAt) dataFallbacks.push('updatedAt');
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

  return (
    <div
      className={`transition-all duration-300 ${className || ''} focus:outline-none focus:ring-2 focus:ring-blue-500 hover:shadow-xl active:scale-[0.98]`}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-fallbacks={dataFallbacks.join(',')}
      tabIndex={0}
      aria-label={`Project card for ${safeTargetName}`}
      role="button"
      onKeyDown={e => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(); } }}
    >
      <Card className="w-full max-w-[340px] min-h-[340px] max-h-[380px] bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col">
        {/* Top Section: Image with overlays */}
        <div className="relative flex-1 min-h-[180px] max-h-[180px] aspect-square bg-gray-900">
          {/* Fallback badge with tooltip */}
          {dataFallbacks.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="absolute top-2 left-2 z-20 cursor-help" tabIndex={0} aria-label={`Fallback fields: ${dataFallbacks.join(', ')}`}> 
                    <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded shadow flex items-center gap-1">
                      <AlertCircle className="h-4 w-4 text-yellow-900" /> Fallback
                    </span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="text-xs font-mono text-yellow-900">
                    Fallback fields:<br />{dataFallbacks.join(', ')}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <img
            src={safeDisplayImage}
            alt={safeTargetName}
            className="object-cover w-full h-full min-h-[180px] max-h-[180px] aspect-square bg-black"
            onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder.jpg'; }}
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
                  setIsSavingName(true);
                  setError(null);
                  try {
                    if (onProjectNameUpdate) {
                      await onProjectNameUpdate(id, editedName.trim());
                    } else {
                      // fallback: update via Supabase directly
                      const supabase = await getSupabaseClient();
                      if (supabase) {
                        const { error } = await supabase
                          .from('projects')
                          .update({ title: editedName.trim() })
                          .eq('id', id);
                        if (error) throw error;
                      }
                    }
                    setIsEditingName(false);
                  } catch (err: any) {
                    setError(err.message || 'Failed to update name');
                  } finally {
                    setIsSavingName(false);
                  }
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
                  Save
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
                  title={safeTargetName}
                  onClick={e => e.stopPropagation()}
                >
                  {safeTargetName}
                </h3>
                {hovered && (
                  <button
                    className="text-white hover:text-blue-400 p-1 rounded-full transition"
                    style={{ marginLeft: '-8px' }}
                    title="Edit project name"
                    onClick={e => { e.stopPropagation(); setIsEditingName(true); }}
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            {error && <div className="text-red-400 text-xs mt-1">{error}</div>}
          </div>
          {/* Status Badge and Info Icon (top right) */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-primary text-white shadow-lg" aria-label="Project Info">
                        <Info className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Project Info</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Project Metadata</DialogTitle>
                  <DialogDescription>
                    Information about your astrophotography project.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Created: {safeCreationDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Size: {safeFileSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Frames: {safeFrameCount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status: {getStatusLabel()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Project ID:</span>
                    <span className="text-xs font-mono text-gray-400 break-all">{id}</span>
                  </div>
                </div>
                {target && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Target Details</h4>
                    <div className="text-xs text-gray-300 space-y-1">
                      {target.name && <div><span className="font-medium">Name:</span> {target.name}</div>}
                      {target.catalogIds && target.catalogIds.length > 0 && <div><span className="font-medium">Catalog IDs:</span> {target.catalogIds.join(', ')}</div>}
                      {target.constellation && <div><span className="font-medium">Constellation:</span> {target.constellation}</div>}
                      {target.type && <div><span className="font-medium">Type:</span> {target.type}</div>}
                      {target.category && <div><span className="font-medium">Category:</span> {target.category}</div>}
                      {target.commonNames && target.commonNames.length > 0 && <div><span className="font-medium">Common Names:</span> {target.commonNames.join(', ')}</div>}
                      {target.coordinates && (target.coordinates.ra || target.coordinates.dec) && (
                        <div><span className="font-medium">Coordinates:</span> RA: {target.coordinates.ra}, Dec: {target.coordinates.dec}</div>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        {/* Warning for critical missing fields */}
        {criticalMissing && (
          <div className="flex items-center gap-2 bg-yellow-100/90 text-yellow-900 text-xs px-2 py-1 rounded mb-1 mt-1 mx-1 shadow border border-yellow-300" role="alert" aria-live="polite">
            <AlertCircle className="h-4 w-4" />
            <span>Some critical project info is missing or incomplete. Please review this card.</span>
          </div>
        )}
        {/* Bottom Section: Blue background with project name, tags and actions */}
        <div className="bg-primary text-primary-foreground p-1 flex flex-col gap-1 rounded-b-3xl text-xs">
          {/* Object/Target Name and Status Badge Row */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="font-semibold text-xs">Object: <span className="font-mono">{safeTargetName}</span></div>
            <Badge variant="default" className={getStatusBadgeVariant() + ' text-[10px] px-2 py-0.5 shadow'}>
              {getStatusLabel()}
            </Badge>
          </div>
          {/* Metadata Block */}
          <div className="flex flex-col gap-0.5 text-[10px] text-primary-foreground/80 mb-1 bg-primary/60 rounded-md px-1 py-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-3 h-3" /> {safeCreationDate}
              <span className="mx-1">•</span>
              <Edit3 className="w-3 h-3" /> {safeUpdatedAt}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-primary-foreground/20 my-0.5" />
          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-1 justify-center">
            {safeEquipment.length === 0 ? (
              <span className="text-gray-500 text-xs italic">No equipment info</span>
            ) : (
              safeEquipment.map((item, index) => (
                <Badge key={index} variant="outline" className="bg-white/90 text-primary border border-primary px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  {getEquipmentIcon(item.type)}
                  {item.name}
                </Badge>
              ))
            )}
          </div>
          {/* Stats & Actions */}
          <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1">
            <div className="flex flex-row gap-2 text-xs">
              <span>Frames: <span className="font-mono">{safeFrameCount}</span></span>
              <span>Size: <span className="font-mono">{safeFileSize}</span></span>
            </div>
            <div className="flex gap-1 ml-auto">
              <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onExport && onExport(id); }} aria-label="Export Project">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onShare && onShare(id); }} aria-label="Share Project">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-red-600 hover:text-white text-white border-none" onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }} aria-label="Delete Project">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Delete confirmation dialog */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-gray-900 rounded-lg p-8 max-w-sm w-full shadow-xl border border-gray-700">
                  <h2 className="text-lg font-bold text-white mb-4">Delete Project?</h2>
                  <p className="text-gray-300 mb-6">Are you sure you want to delete this project? This action cannot be undone.</p>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDelete}>
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Card>
      <style jsx>{`
        @media (max-width: 640px) {
          .max-w-[340px] { max-width: 100% !important; }
        }
      `}</style>
    </div>
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