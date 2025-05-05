"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/src/store/user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Settings } from 'lucide-react';
import AccountTab from '@/components/profile/AccountTab';
import SubscriptionTab from '@/components/profile/SubscriptionTab';
import SettingsTab from '@/components/profile/SettingsTab';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, id, email, username, fullName, avatarUrl, subscription, isLoading, error, subscriptionLoading } = useUserStore();
  const [activeTab, setActiveTab] = useState('account');
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch user role on mount
  useEffect(() => {
    async function fetchUserRole() {
      const supabase = (await import('@/src/lib/supabase')).getSupabaseClient();
      const { data, error } = await supabase.rpc('get_user_role');
      if (!error) setUserRole(data);
    }
    if (isAuthenticated) fetchUserRole();
  }, [isAuthenticated]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (subscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white text-xl">
        Loading subscription...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Account Settings
            {userRole === 'super_user' && (
              <span className="ml-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-pink-500 text-white text-xs font-bold rounded-full shadow">ADMIN</span>
            )}
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-6 shadow-xl border border-gray-700">
          <Tabs defaultValue="account" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Account</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="account">
              <AccountTab user={{ id, email, username, fullName, avatarUrl, isAuthenticated, subscription, isLoading, error }} />
            </TabsContent>
            
            <TabsContent value="subscription">
              <SubscriptionTab user={{ id, email, username, fullName, avatarUrl, isAuthenticated, subscription, isLoading, error }} />
            </TabsContent>
            
            <TabsContent value="settings">
              <SettingsTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 