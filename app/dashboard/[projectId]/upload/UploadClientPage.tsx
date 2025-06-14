"use client";
import { UniversalFileUpload } from '@/src/components/UniversalFileUpload';
import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function UploadClientPage({ projectId, userId }: { projectId: string, userId: string }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden bg-transparent">
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-12 flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-200/80 mb-2">
          <span className="hover:underline cursor-pointer">Dashboard</span>
          <ChevronRight size={16} className="text-blue-300/60" />
          <span className="hover:underline cursor-pointer">Project</span>
          <ChevronRight size={16} className="text-blue-300/60" />
          <span className="text-white font-semibold">Upload</span>
        </div>
        {/* Glassy upload panel */}
        <div className="w-full rounded-3xl bg-black/30 backdrop-blur-md border border-blue-200/10 shadow-2xl shadow-blue-900/20 p-8 flex flex-col items-center gap-6 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-bold text-white animate-fade-in mb-2">Upload Files for Project</h1>
          <p className="text-blue-200/80 text-base mb-4">Drag and drop your FITS files or click to browse.</p>
          <UniversalFileUpload projectId={projectId} userId={userId} />
        </div>
      </div>
    </div>
  );
} 