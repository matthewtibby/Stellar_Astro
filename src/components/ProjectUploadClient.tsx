"use client";
import { useRouter } from 'next/navigation';
import ProjectUploadStep from './ProjectUploadStep';

interface ProjectUploadClientProps {
  projectId: string;
  userId: string;
  projectName: string;
}

export default function ProjectUploadClient({ projectId, userId, projectName }: ProjectUploadClientProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#1a223f] to-[#232946] text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-xl font-bold text-white mb-6">{projectName}</h1>
        <ProjectUploadStep projectId={projectId} userId={userId} onBack={() => router.push('/dashboard')} />
      </div>
    </div>
  );
} 