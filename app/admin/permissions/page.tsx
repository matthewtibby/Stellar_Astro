'use client';

import { useEffect, useState } from 'react';
import { getBrowserClient } from '@/src/lib/supabase';
import { useUserStore } from '@/src/store/user';

interface PermissionError {
  id: string;
  error_time: string;
  user_id: string;
  error_message: string;
  table_name: string;
  operation: string;
  resolved: boolean;
  user_email?: string;
}

interface ErrorStats {
  error_count: number;
  latest_error: string;
  affected_tables: string[];
}

export default function PermissionsDashboard() {
  const [errors, setErrors] = useState<PermissionError[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUserStore();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchErrors();
    fetchStats();
  }, []);

  const checkAdminStatus = async () => {
    const supabase = getBrowserClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.role === 'admin') {
      setIsAdmin(true);
    }
  };

  const fetchErrors = async () => {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .from('maintenance.permission_errors')
      .select('*')
      .order('error_time', { ascending: false });

    if (error) {
      console.error('Error fetching permission errors:', error);
      return;
    }

    // Fetch user emails for the errors
    const userIds = Array.from(new Set(data?.map(error => error.user_id)));
    const { data: users } = await supabase
      .from('auth.users')
      .select('id, email')
      .in('id', userIds);

    const userMap = new Map(users?.map(user => [user.id, user.email]));
    
    const errorsWithUserInfo = data?.map(error => ({
      ...error,
      user_email: userMap.get(error.user_id)
    }));

    setErrors(errorsWithUserInfo || []);
    setLoading(false);
  };

  const fetchStats = async () => {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
      .rpc('maintenance.check_permission_errors');

    if (error) {
      console.error('Error fetching permission stats:', error);
      return;
    }

    setStats(data[0]);
  };

  const handleFixPermissions = async () => {
    const supabase = getBrowserClient();
    await supabase.rpc('maintenance.auto_fix_permissions');
    await fetchErrors();
    await fetchStats();
  };

  const handleMarkResolved = async (errorId: string) => {
    const supabase = getBrowserClient();
    await supabase
      .from('maintenance.permission_errors')
      .update({ resolved: true })
      .eq('id', errorId);
    await fetchErrors();
    await fetchStats();
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
        <p className="mt-4">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Permissions Dashboard</h1>
          <button
            onClick={handleFixPermissions}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Fix All Permissions
          </button>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Unresolved Errors</h3>
              <p className="text-3xl font-bold text-blue-500">{stats.error_count}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Latest Error</h3>
              <p className="text-sm text-gray-400">
                {new Date(stats.latest_error).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Affected Tables</h3>
              <div className="flex flex-wrap gap-2">
                {stats.affected_tables.map(table => (
                  <span
                    key={table}
                    className="px-2 py-1 bg-gray-700 rounded text-sm"
                  >
                    {table}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error List */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-700">
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Table</th>
                <th className="px-6 py-3 text-left">Operation</th>
                <th className="px-6 py-3 text-left">Message</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {errors.map(error => (
                <tr key={error.id} className="border-t border-gray-700">
                  <td className="px-6 py-4">
                    {new Date(error.error_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{error.user_email || error.user_id}</td>
                  <td className="px-6 py-4">{error.table_name}</td>
                  <td className="px-6 py-4">{error.operation}</td>
                  <td className="px-6 py-4">{error.error_message}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        error.resolved
                          ? 'bg-green-900 text-green-200'
                          : 'bg-red-900 text-red-200'
                      }`}
                    >
                      {error.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!error.resolved && (
                      <button
                        onClick={() => handleMarkResolved(error.id)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 