import { Info, Clock, CheckCircle, Telescope, Camera, Filter } from "lucide-react";
import { Equipment, ProjectCardProps } from "../types/projectCard.types";
import React from "react";

export function getStatusBadgeVariant(status: ProjectCardProps["status"]): string {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-600";
    case "in_progress": return "bg-amber-100 text-amber-600";
    case "completed": return "bg-green-100 text-green-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

export function getStatusLabel(status: ProjectCardProps["status"]): string {
  switch (status) {
    case "new": return "New";
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    default: return "Unknown";
  }
}

export function getStatusIcon(status: ProjectCardProps["status"]): React.ReactNode {
  switch (status) {
    case "new": return <Info className="w-3.5 h-3.5 mr-1 text-blue-500" />;
    case "in_progress": return <Clock className="w-3.5 h-3.5 mr-1 text-amber-500 animate-pulse" />;
    case "completed": return <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />;
    default: return null;
  }
}

export function getEquipmentIcon(type: Equipment["type"]): React.ReactNode {
  switch (type) {
    case "telescope": return <Telescope className="w-4 h-4 mr-1 text-indigo-500" />;
    case "camera": return <Camera className="w-4 h-4 mr-1 text-pink-500" />;
    case "filter": return <Filter className="w-4 h-4 mr-1 text-cyan-500" />;
    default: return null;
  }
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
} 