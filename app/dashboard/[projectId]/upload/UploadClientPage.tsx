"use client";
import { UniversalFileUpload } from '@/src/components/UniversalFileUpload';

export default function UploadClientPage({ projectId, userId }: { projectId: string, userId: string }) {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6 text-white">Upload Files for Project</h1>
      <UniversalFileUpload projectId={projectId} userId={userId} />
    </div>
  );
} 