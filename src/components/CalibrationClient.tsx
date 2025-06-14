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
    <div className="min-h-screen bg-transparent text-white flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl mx-auto py-8 px-4">
        <div className="mb-6 flex items-center justify-between">
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