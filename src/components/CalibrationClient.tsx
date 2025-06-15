"use client";
import { useRouter } from 'next/navigation';
import CalibrationScaffoldUI from './CalibrationScaffoldUI';

interface CalibrationClientProps {
  projectId: string;
  userId: string;
  projectName: string;
}

export default function CalibrationClient({ projectId, userId, projectName }: CalibrationClientProps) {
  const router = useRouter();
  return (
    <div className="w-full min-h-screen flex flex-col bg-transparent text-white">
      <div className="w-full">
        <div className="mb-6 flex items-center justify-between px-8 pt-8">
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 shadow"
            onClick={() => router.push('/dashboard')}
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-bold text-white">{projectName}</h1>
        </div>
        <CalibrationScaffoldUI projectId={projectId} userId={userId} />
      </div>
    </div>
  );
} 