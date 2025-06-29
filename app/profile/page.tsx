import { createSupabaseServerClient } from '@/src/lib/supabaseServer';
import AccountTab from '@/components/profile/AccountTab';
import SubscriptionTab from '@/components/profile/SubscriptionTab';
import SettingsTab from '@/components/profile/SettingsTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, CreditCard, Settings } from 'lucide-react';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch profile data from 'profiles' table
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Compose UserState for AccountTab and SubscriptionTab
  const userState = {
    id: user.id,
    email: user.email || '',
    username: profile?.username || '',
    fullName: profile?.full_name || '',
    avatarUrl: profile?.avatar_url || '',
    isLoading: false,
    isAuthenticated: true,
    error: null,
    subscription: profile?.subscription || { type: 'FREE', projectLimit: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Account Settings
            {profile?.role === 'super_user' && (
              <span className="ml-4 px-3 py-1 bg-gradient-to-r from-yellow-400 to-pink-500 text-white text-xs font-bold rounded-full shadow">ADMIN</span>
            )}
          </h1>
          <p className="mt-2 text-lg text-gray-300">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <div className="bg-slate-800/30 rounded-2xl p-6 shadow-xl border border-gray-700">
          <Tabs defaultValue="account" className="w-full">
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
              <AccountTab user={userState} />
            </TabsContent>
            <TabsContent value="subscription">
              <SubscriptionTab user={userState} />
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