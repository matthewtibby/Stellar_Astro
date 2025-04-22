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
  const { user, isAuthenticated } = useUserStore();
  const [activeTab, setActiveTab] = useState('account');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Account Settings
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
              <AccountTab user={user} />
            </TabsContent>
            
            <TabsContent value="subscription">
              <SubscriptionTab user={user} />
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