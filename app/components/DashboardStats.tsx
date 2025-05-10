import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, Image as ImageIcon, Clock, Zap, Star, HardDrive, Users, Share2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const statIcons = {
  totalProjects: <Folder className="h-7 w-7 text-blue-400" />,
  totalImages: <ImageIcon className="h-7 w-7 text-blue-400" />,
  totalProcessingHours: <Clock className="h-7 w-7 text-blue-400" />,
  recentActivity: <Zap className="h-7 w-7 text-blue-400" />,
  mostActiveProject: <Star className="h-7 w-7 text-blue-400" />,
  storageUsed: <HardDrive className="h-7 w-7 text-blue-400" />,
};

const statLabels = {
  totalProjects: 'Projects',
  totalImages: 'Images Uploaded',
  totalProcessingHours: 'Processing Hours',
  recentActivity: 'Recent Activities',
  mostActiveProject: 'Most Active Project',
  storageUsed: 'Storage Used',
};

function formatStorage(bytes: number) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
  if (bytes > 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
  return bytes + ' B';
}

export default function DashboardStats({ user }: { user: { id: string; email: string } | null }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const supabase = createClient();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user?.id) {
        setError('You must be logged in to view dashboard stats.');
        setLoading(false);
        return;
      }
      const userId = user.id;
      // Fetch all the stats in parallel
      // First, fetch the user's projects to get their IDs
      const { data: userProjects } = await supabase.from('projects').select('id').eq('user_id', userId);
      const userProjectIds = (userProjects || []).map((p: any) => p.id);
      const [
        { count: totalProjects },
        { count: totalImages },
        { count: totalProcessingSteps },
        { count: recentActivity },
        { data: activity },
        { data: files }
      ] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('project_files').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        userProjectIds.length > 0
          ? supabase.from('processing_steps').select('id', { count: 'exact', head: true }).in('project_id', userProjectIds)
          : Promise.resolve({ count: 0 }),
        supabase.from('activity_log').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('activity_log').select('project_id').eq('user_id', userId),
        supabase.from('project_files').select('id').eq('user_id', userId),
      ]);

      // Calculate stats
      const totalProcessingHours = 0; // Not available
      let mostActiveProject = null;
      if (activity && activity.length > 0) {
        const counts: Record<string, number> = {};
        for (const a of activity) {
          if (a.project_id) counts[a.project_id] = (counts[a.project_id] || 0) + 1;
        }
        const topProjectId = Object.entries(counts).sort(([, acount], [, bcount]) => bcount - acount)[0]?.[0];
        if (topProjectId) {
          const { data: project } = await supabase.from('projects').select('title').eq('id', topProjectId).single();
          mostActiveProject = project?.title || null;
        }
      }
      const storageUsed = 0; // No size info available

      setStats({
        totalProjects: totalProjects || 0,
        totalImages: totalImages || 0,
        totalProcessingSteps: totalProcessingSteps || 0,
        totalProcessingHours: Math.round(totalProcessingHours * 10) / 10,
        recentActivity: recentActivity || 0,
        mostActiveProject,
        storageUsed,
      });
    } catch (e: any) {
      setError(e.message || 'Error loading stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    intervalRef.current = setInterval(fetchStats, 30000); // 30 seconds
    const handleFocus = () => fetchStats();
    window.addEventListener('focus', handleFocus);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  if (loading) return <div className="text-white py-8">Loading stats...</div>;
  if (error) return <div className="text-red-400 py-8">{error}</div>;
  if (!stats) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center mb-2">
        <span className="text-blue-300 text-xs font-semibold mr-2">LIVE</span>
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-2" />
        <span className="text-xs text-blue-200">Stats auto-refresh every 30s</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={statIcons.totalProjects} label={statLabels.totalProjects} value={stats.totalProjects} />
        <StatCard icon={statIcons.totalImages} label={statLabels.totalImages} value={stats.totalImages} />
        <StatCard icon={statIcons.totalProcessingHours} label={statLabels.totalProcessingHours} value={stats.totalProcessingHours} />
        <StatCard icon={statIcons.recentActivity} label={statLabels.recentActivity} value={stats.recentActivity} />
        <StatCard icon={statIcons.mostActiveProject} label={statLabels.mostActiveProject} value={stats.mostActiveProject || '—'} />
        <StatCard icon={statIcons.storageUsed} label={statLabels.storageUsed} value={formatStorage(stats.storageUsed)} />
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-4 p-5 rounded-xl bg-gradient-to-br from-sky-900/80 via-blue-900/70 to-indigo-900/60 border border-blue-700 shadow-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-blue-200 text-sm mt-1">{label}</div>
      </div>
    </div>
  );
} 