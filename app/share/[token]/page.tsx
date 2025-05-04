"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/src/lib/supabase';
import { useToast } from '../../../src/hooks/useToast';
import { Loader2 } from 'lucide-react';

export default function SharedProjectPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedProject = async () => {
      if (!params?.token) {
        setError('Invalid share link');
        setIsLoading(false);
        return;
      }

      try {
        const token = params.token as string;
        const supabase = getSupabaseClient();

        // Get share token details
        const { data: shareToken, error: tokenError } = await supabase
          .from('project_shares')
          .select('*')
          .eq('id', token)
          .single();

        if (tokenError) throw tokenError;
        if (!shareToken) throw new Error('Share link not found');
        if (new Date(shareToken.expires_at) < new Date()) {
          throw new Error('Share link has expired');
        }

        // Get project details
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', shareToken.project_id)
          .single();

        if (projectError) throw projectError;
        if (!project) throw new Error('Project not found');

        // Redirect to project page
        router.push(`/dashboard/${project.id}`);
      } catch (error) {
        console.error('Error loading shared project:', error);
        setError(error instanceof Error ? error.message : 'Failed to load shared project');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedProject();
  }, [params?.token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading shared project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="p-4 bg-red-900/50 text-red-200 rounded-md border border-red-800">
            <p className="text-lg font-semibold">Error</p>
            <p className="mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 