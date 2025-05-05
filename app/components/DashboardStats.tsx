import React, { useEffect, useState, useRef } from 'react';
import { Folder, Image as ImageIcon, Clock, Zap, Star, HardDrive, Users, Share2 } from 'lucide-react';

const statIcons = {
  totalProjects: <Folder className="h-7 w-7 text-blue-400" />,
  totalImages: <ImageIcon className="h-7 w-7 text-blue-400" />,
  totalProcessingHours: <Clock className="h-7 w-7 text-blue-400" />,
  recentActivity: <Zap className="h-7 w-7 text-blue-400" />,
  mostActiveProject: <Star className="h-7 w-7 text-blue-400" />,
  storageUsed: <HardDrive className="h-7 w-7 text-blue-400" />,
  sharedProjects: <Share2 className="h-7 w-7 text-blue-400" />,
  collaboratorProjects: <Users className="h-7 w-7 text-blue-400" />,
};

const statLabels = {
  totalProjects: 'Projects',
  totalImages: 'Images Uploaded',
  totalProcessingHours: 'Processing Hours',
  recentActivity: 'Recent Activities',
  mostActiveProject: 'Most Active Project',
  storageUsed: 'Storage Used',
  sharedProjects: 'Projects Shared',
  collaboratorProjects: 'Projects Collaborating',
};

function formatStorage(bytes: number) {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
  if (bytes > 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
  if (bytes > 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
  return bytes + ' B';
}

export default function DashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dashboard-stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
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
  }, []);

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
        <StatCard icon={statIcons.sharedProjects} label={statLabels.sharedProjects} value={stats.sharedProjects} />
        <StatCard icon={statIcons.collaboratorProjects} label={statLabels.collaboratorProjects} value={stats.collaboratorProjects} />
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-4 p-5 rounded-xl bg-gradient-to-br from-blue-900/70 to-blue-800/60 border border-blue-700 shadow-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-blue-200 text-sm mt-1">{label}</div>
      </div>
    </div>
  );
} 