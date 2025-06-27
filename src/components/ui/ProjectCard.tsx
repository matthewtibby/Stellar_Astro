"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Download,
  FileText,
  Info,
  Share2,
  Trash2,
} from "lucide-react";
import {
  Card,
} from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import {
  Dialog,
  DialogTrigger,
} from "./dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { getSkyViewThumbnailUrl } from '@/src/lib/client/skyview';
import Image from 'next/image';
import { ProjectCardProps } from "./types/projectCard.types";
import { getStatusBadgeVariant, getStatusLabel, getStatusIcon, getEquipmentIcon, formatDate } from "./utils/projectCardUtils";
import { useProjectCardState } from './hooks/useProjectCardState';
import { useProjectThumbnail } from './hooks/useProjectThumbnail';
import ProjectInfoDialog from './ProjectInfoDialog';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';
import UndoAlert from './UndoAlert';
import EquipmentPill from './EquipmentPill';
import { useProjectImage } from './hooks/useProjectImage';
import { getProjectCardFallbacks } from './utils/projectCardFallbacks';
import ProjectNameEditForm from './ProjectNameEditForm';
import { useDeleteConfirmLogger } from './hooks/useDeleteConfirmLogger';

function ProjectCard(props: ProjectCardProps) {
  const {
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
    target,
    onProjectDeleted,
  } = props;

  const state = useProjectCardState(props);
  const { safeDisplayImage } = useProjectThumbnail({ target, status, userImageUrl, thumbnailUrl });
  const { displayImage } = useProjectImage({ target, status, userImageUrl, thumbnailUrl });
  const {
    safeTargetName,
    safeFrameCount,
    safeFileSize,
    safeCreationDate,
    safeUpdatedAt,
    safeEquipment,
    dataFallbacks,
  } = getProjectCardFallbacks(props);
  useDeleteConfirmLogger({ showDeleteConfirm: state.showDeleteConfirm, id, onDelete, onProjectDeleted });

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
  const projectName = title || name || 'Untitled Project';

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
            {state.thumbnailLoading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30">
                <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
              </div>
            )}
            <Image
              src={displayImage}
              alt={safeTargetName}
              className="object-cover w-full h-full min-h-[180px] max-h-[180px] aspect-square bg-black"
              onError={e => {
                const img = e.target as HTMLImageElement;
                if (!img.src.endsWith('/images/placeholder.jpg')) {
                  img.src = '/images/placeholder.jpg';
                }
              }}
              onLoad={() => state.thumbnailLoading = false}
              width={180}
              height={180}
            />
            {/* Project Name (centered top) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 w-full flex flex-col items-center pointer-events-auto group">
              {state.isEditingName ? (
                <ProjectNameEditForm
                  value={state.editedName}
                  onChange={v => state.editedName = v}
                  onSave={async v => await state.handleInlineEditSave('object', v)}
                  onCancel={() => { state.isEditingName = false; state.editedName = projectName; }}
                  isSaving={state.isSavingName}
                  projectName={projectName}
                />
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
              {state.showSuccess && <div className="text-green-400 text-xs mt-1 flex items-center gap-1"><span>✓</span> Updated!</div>}
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
                        getStatusBadgeVariant(status) +
                        ' text-xs px-3 py-1 shadow rounded-full whitespace-nowrap min-w-[90px] text-center flex items-center gap-1 status-badge-animate'
                      }
                    >
                      {getStatusIcon(status)}
                      {getStatusLabel(status)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    Project status: {getStatusLabel(status)}
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
                  <EquipmentPill
                    key={index}
                    item={item}
                    index={index}
                    isLast={index === safeEquipment.length - 1}
                    getEquipmentIcon={getEquipmentIcon}
                  />
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
                  <ProjectInfoDialog
                    safeCreationDate={safeCreationDate}
                    safeUpdatedAt={safeUpdatedAt}
                    safeFrameCount={safeFrameCount}
                    safeFileSize={safeFileSize}
                    status={status}
                    id={id}
                    target={target}
                    safeEquipment={safeEquipment}
                    getStatusLabel={getStatusLabel}
                    getEquipmentIcon={getEquipmentIcon}
                  />
                </Dialog>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onExport?.(id); }} aria-label="Export Project">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-primary/80 text-white border-none" onClick={e => { e.stopPropagation(); onShare?.(id); }} aria-label="Share Project">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="hover:bg-red-600 hover:text-white text-white border-none" onClick={e => { e.stopPropagation(); console.log('[ProjectCard] Delete button clicked for project:', id); state.showDeleteConfirm = true; }} aria-label="Delete Project">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          {/* Delete confirmation dialog (now in a portal) */}
          <DeleteConfirmationDialog
            open={state.showDeleteConfirm}
            projectName={projectName}
            onCancel={() => { state.showDeleteConfirm = false; }}
            onConfirm={async () => { await state.handleDelete(); }}
          />
          {/* Undo UI (simple inline alert for now) */}
          <UndoAlert
            open={state.showUndo}
            onUndo={() => {
              state.showUndo = false;
              if (state.undoTimeout) clearTimeout(state.undoTimeout);
              // Optionally: call a prop or context to restore the project
              // For now, just log
              console.log('[ProjectCard] Undo clicked for project:', state.deletedProject);
              // You would need to implement actual restore logic in the parent/dashboard
            }}
            projectName={projectName}
          />
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

export default ProjectCard;