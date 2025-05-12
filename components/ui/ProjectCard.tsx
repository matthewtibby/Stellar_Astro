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
  X,
  Clock,
  Edit3,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSupabaseClient } from '@/src/lib/supabase';

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

  const displayImage = status === "completed" && userImageUrl ? userImageUrl : thumbnailUrl;

  const getEquipmentIcon = (type: Equipment["type"]) => {
    switch (type) {
      case "telescope": return <Telescope className="h-3 w-3 mr-1" />;
      case "camera": return <Camera className="h-3 w-3 mr-1" />;
      case "filter": return <Filter className="h-3 w-3 mr-1" />;
    }
  };

  const projectName = title || name || 'Untitled Project';

  // Format dates and active time
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const formatDuration = (start: string | Date, end: string | Date) => {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    const ms = Math.max(0, endDate.getTime() - startDate.getTime());
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    if (!result) result = '<1m';
    return result.trim();
  };

  return (
    <div
      className={`transition-all duration-300 ${className || ''}`}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="w-full max-w-4xl bg-gray-900/80 border border-gray-800 rounded-3xl overflow-hidden shadow-lg flex flex-col">
        {/* Top Section: Image with overlays */}
        <div className="relative flex-1 min-h-[266px] max-h-[400px] bg-gray-900">
          <img
            src={displayImage}
            alt={projectName}
            className="object-cover w-full h-full min-h-[266px] max-h-[400px] bg-black"
          />
          {/* Project Name (centered top) */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full flex flex-col items-center pointer-events-auto group">
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
                      const supabase = getSupabaseClient();
                      const { error } = await supabase
                        .from('projects')
                        .update({ title: editedName.trim() })
                        .eq('id', id);
                      if (error) throw error;
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
                  className="text-2xl font-bold text-white bg-gray-800/80 rounded px-2 py-1 outline-none border border-gray-600 focus:ring-2 focus:ring-blue-500"
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
                  className="text-2xl font-bold text-white drop-shadow text-center px-4"
                  title={projectName}
                  onClick={e => e.stopPropagation()}
                >
                  {projectName}
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
                      <span className="text-sm">Created: {creationDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Size: {fileSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Frames: {frameCount}</span>
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
        {/* Bottom Section: Blue background with project name, tags and actions */}
        <div className="bg-primary text-primary-foreground p-1.5 flex flex-col gap-1.5 rounded-b-3xl text-sm">
          {/* Object/Target Name and Status Badge Row */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="font-semibold text-sm">Object: <span className="font-mono">{targetName}</span></div>
            <Badge variant="default" className={getStatusBadgeVariant() + ' text-[10px] px-2 py-0.5 shadow'}>
              {getStatusLabel()}
            </Badge>
          </div>
          {/* Metadata Block */}
          <div className="flex flex-col gap-0.5 text-[11px] text-primary-foreground/80 mb-1 bg-primary/60 rounded-md px-1.5 py-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4" /> {formatDate(creationDate)}
              <span className="mx-1">•</span>
              <Edit3 className="w-4 h-4" /> {formatDate(updatedAt || creationDate)}
              <span className="mx-1">•</span>
              <Clock className="w-4 h-4" /> {formatDuration(creationDate, updatedAt || creationDate)}
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-primary-foreground/20 my-0.5" />
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-1 justify-center">
            {equipment.map((item, index) => (
              <Badge key={index} variant="outline" className="bg-white/90 text-primary border border-primary px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                {getEquipmentIcon(item.type)}
                {item.name}
              </Badge>
            ))}
          </div>
          {/* Stats & Actions */}
          <div className="flex items-center justify-between mt-0.5 flex-wrap gap-1.5">
            <div className="flex flex-row gap-3 text-xs">
              <span>Frames: <span className="font-mono">{frameCount}</span></span>
              <span>Size: <span className="font-mono">{fileSize}</span></span>
            </div>
            <div className="flex gap-1.5 ml-auto">
              <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onExport && onExport(id); }} aria-label="Export Project">
                <Download className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onShare && onShare(id); }} aria-label="Share Project">
                <Share2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:bg-red-600 hover:text-white text-white border-none" onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }} aria-label="Delete Project">
                <Trash2 className="h-5 w-5" />
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
    </div>
  );
}

export default ProjectCard; 