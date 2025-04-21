"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/src/store/user';
import { User } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useUserStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user?.isAuthenticated) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user?.isAuthenticated) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-900/50 rounded-lg shadow-xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-medium">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={24} />}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Welcome, {user.fullName || 'User'}!</h1>
                <p className="text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="bg-black/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Projects</span>
                  <span className="text-white font-medium">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Storage Used</span>
                  <span className="text-white font-medium">0 MB</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Account Type</span>
                  <span className="text-white font-medium">Free</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-black/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
              <div className="text-gray-400 text-center py-8">
                No recent activity
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/30 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <button className="w-full px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                  New Project
                </button>
                <button className="w-full px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">
                  Upload Files
                </button>
                <button className="w-full px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600 transition-colors">
                  View Gallery
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 