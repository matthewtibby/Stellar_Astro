"use client";
import { useRouter } from 'next/navigation';
import ProjectUploadStep from './ProjectUploadStep';
import { useState } from 'react';
import { Pencil, X, Check, ChevronRight } from 'lucide-react';
import { useProjectStore } from '@/src/store/project';

interface ProjectUploadClientProps {
  projectId: string;
  userId: string;
  projectName: string;
  onProjectNameUpdated?: () => void;
}

export default function ProjectUploadClient({ projectId, userId, projectName, onProjectNameUpdated }: ProjectUploadClientProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(projectName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateProject = useProjectStore((state) => state.updateProject);

  async function handleSave() {
    setLoading(true);
    setError(null);
    try {
      await updateProject(projectId, { title: title.trim() });
      setEditing(false);
      if (onProjectNameUpdated) onProjectNameUpdated();
    } catch {
      setError('Failed to update project name');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full">
      <img src="/images/hamish-Y61qTmRLcho-unsplash (1).jpg" alt="Starry background" className="absolute inset-0 w-full h-full object-cover opacity-60 z-[-1] pointer-events-none select-none" aria-hidden="true" />
      <div className="relative z-10 min-h-screen bg-transparent text-white w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-blue-200/80 mb-2 px-4 pt-4">
          <button className="hover:underline cursor-pointer" onClick={() => router.push('/dashboard')}>Dashboard</button>
          <ChevronRight size={16} className="text-blue-300/60" />
          <button className="hover:underline cursor-pointer" onClick={() => router.push(`/dashboard/${projectId}`)}>{title}</button>
          <ChevronRight size={16} className="text-blue-300/60" />
          <span className="text-white font-semibold">Upload</span>
        </div>
        {editing ? (
          <form className="flex items-center gap-2 w-full p-4" onSubmit={handleSave}>
            <input
              className="text-xl font-bold text-white bg-gray-800/80 rounded px-2 py-1 outline-none border border-gray-600 focus:ring-2 focus:ring-blue-500 flex-1"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={loading}
              autoFocus
              maxLength={64}
            />
            <button type="submit" className="text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 text-sm font-semibold disabled:opacity-50" disabled={loading || !title.trim()} title="Save">
              <Check className="w-4 h-4" />
            </button>
            <button type="button" className="text-white bg-gray-600 hover:bg-gray-700 rounded px-2 py-1 text-sm font-semibold ml-1" onClick={() => { setEditing(false); setTitle(projectName); }} disabled={loading} title="Cancel">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-2 p-4">
            <h1 className="text-lg font-bold text-white mb-0 truncate max-w-full" title={title}>{title}</h1>
            <button className="ml-2 text-blue-300 hover:text-blue-500" onClick={() => setEditing(true)} title="Edit project name">
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && <div className="text-red-400 text-sm mb-2 p-4">{error}</div>}
        <ProjectUploadStep projectId={projectId} userId={userId} onBack={() => router.push('/dashboard')} />
      </div>
    </div>
  );
} 