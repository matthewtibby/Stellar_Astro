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
}: ProjectCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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

  return (
    <div className={`transition-all duration-300 ${className || ''}`} style={{ cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
      <motion.div whileHover={{ scale: 1.03, boxShadow: '0 8px 32px 0 rgba(0,0,0,0.45)' }}>
        <Card className="w-full max-w-md bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="relative aspect-video group">
            {/* Image with dark gradient overlay */}
            <img
              src={displayImage}
              alt={targetName}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            {/* Floating quick actions (top-right) */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Dialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                      <DialogTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-blue-700 text-white shadow-lg" onClick={e => e.stopPropagation()} aria-label="Project Info">
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Project Info</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <DialogContent onClick={e => e.stopPropagation()}>
                  <DialogHeader>
                    <DialogTitle>Project Details</DialogTitle>
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
                </DialogContent>
              </Dialog>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-red-700 text-red-400 shadow-lg" onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }} aria-label="Delete Project">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-green-700 text-green-400 shadow-lg" onClick={e => { e.stopPropagation(); onExport && onExport(id); }} aria-label="Export Project">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Export</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="secondary" className="bg-gray-800/80 hover:bg-blue-700 text-blue-400 shadow-lg" onClick={e => { e.stopPropagation(); onShare && onShare(id); }} aria-label="Share Project">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Frame count and file size badges (top-left) */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
              <span className="bg-gray-800/80 text-xs text-white px-3 py-1 rounded-full shadow border border-blue-700 mb-1">{frameCount} Frames</span>
              <span className="bg-gray-800/80 text-xs text-white px-3 py-1 rounded-full shadow border border-green-700">{fileSize}</span>
            </div>

            {/* Project name and status badge overlay (bottom) */}
            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-3 flex flex-col gap-2 z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white truncate" title={targetName}>{targetName}</h3>
                <Badge variant="secondary" className={getStatusBadgeVariant() + ' text-xs px-2 py-1 ml-2'}>
                  {getStatusLabel()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Equipment tags as glowing badges below image */}
          <CardContent className="pt-4 pb-2 px-4">
            <div className="flex flex-wrap gap-2">
              {equipment.map((item, index) => (
                <TooltipProvider key={index}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-pointer bg-gradient-to-r from-blue-800/60 to-indigo-700/60 border-blue-500 text-white shadow-md hover:bg-blue-700/80 hover:text-white transition-all duration-200">
                        {getEquipmentIcon(item.type)}
                        {item.name}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </CardContent>
        </Card>
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
      </motion.div>
    </div>
  );
}

export default ProjectCard; 