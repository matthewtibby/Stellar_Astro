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
    <Card className={`w-full max-w-md transition-all duration-300 hover:shadow-lg ${className || ''}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : undefined }}>
      <CardHeader className="space-y-1 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <Dialog>
            <DialogTrigger asChild onClick={e => e.stopPropagation()}>
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={e => e.stopPropagation()}>
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
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
              </div>
            </DialogContent>
          </Dialog>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild onClick={e => e.stopPropagation()}>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete project</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Badge
          variant="secondary"
          className={getStatusBadgeVariant()}
        >
          {getStatusLabel()}
        </Badge>
        <h3 className="text-2xl font-semibold">{targetName}</h3>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
            <img
              src={displayImage}
              alt={targetName}
              className="object-cover w-full h-full"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {equipment.map((item, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent">
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
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onExport && onExport(id); }}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Export project data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onShare && onShare(id); }}>
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share with others</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="sm:max-w-[425px]" onClick={e => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this project? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </Card>
  );
}

export default ProjectCard; 