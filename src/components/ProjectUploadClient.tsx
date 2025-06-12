"use client";
import { useRouter } from 'next/navigation';
import ProjectUploadStep from './ProjectUploadStep';
import { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] via-[#1a223f] to-[#232946] text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto py-8 px-4 mt-20">
        <div className="mb-6 flex items-center gap-2">
          {editing ? (
            <form className="flex items-center gap-2 w-full" onSubmit={handleSave}>
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
            <>
              <h1 className="text-xl font-bold text-white mb-0" title={title}>{title}</h1>
              <button className="ml-2 text-blue-300 hover:text-blue-500" onClick={() => setEditing(true)} title="Edit project name">
                <Pencil className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <ProjectUploadStep projectId={projectId} userId={userId} onBack={() => router.push('/dashboard')} />
      </div>
    </div>
  );
} 