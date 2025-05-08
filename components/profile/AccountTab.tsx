"use client";

import { useState } from 'react';
import { useUserStore } from '@/src/store/user';
import { UserState } from '@/src/types/store';
import { Camera, Check, X } from 'lucide-react';
import Image from 'next/image';
import { User } from '@supabase/supabase-js';
import { useSupabaseClient } from '../../app/SupabaseProvider';
import { uploadProfilePicture } from '@/src/utils/storage';
import { sendNotification } from '@/src/utils/sendNotification';

interface AccountTabProps {
  user: UserState | null;
}

export default function AccountTab({ user }: AccountTabProps) {
  const { setUser, user: supabaseUser } = useUserStore();
  const supabase = useSupabaseClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      // Validate passwords if changing
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setMessage({ type: 'error', text: 'New passwords do not match' });
          return;
        }
        if (formData.newPassword.length < 8) {
          setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
          return;
        }
      }

      let avatarUrl = supabaseUser?.user_metadata?.avatar_url || '';
      // If avatar was changed, upload it
      if (avatarFile && supabaseUser?.id) {
        avatarUrl = await uploadProfilePicture(supabase, supabaseUser.id, avatarFile);
      }

      // Debug logs
      console.log('[AccountTab] Attempting profile update for user ID:', supabaseUser?.id);
      console.log('[AccountTab] Update payload:', {
        username: formData.username,
        full_name: formData.fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });

      // Update profiles table
      const { error: profileError, data: profileData } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supabaseUser?.id)
        .select();

      console.log('[AccountTab] Supabase update result:', { profileError, profileData });

      if (profileError) {
        setMessage({ type: 'error', text: 'Failed to update profile: ' + profileError.message });
        await sendNotification({
          req: { headers: { origin: window.location.origin, authorization: '' } },
          eventType: 'account_changed',
          type: 'error',
          message: 'Failed to update profile',
        });
        return;
      }

      // If password was changed, update via Supabase Auth
      if (formData.newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });
        if (pwError) {
          setMessage({ type: 'error', text: 'Failed to update password: ' + pwError.message });
          await sendNotification({
            req: { headers: { origin: window.location.origin, authorization: '' } },
            eventType: 'account_changed',
            type: 'error',
            message: 'Failed to update password',
          });
          return;
        }
      }

      // Update Zustand state
      const updatedUser = {
        ...supabaseUser,
        id: supabaseUser?.id || '',
        user_metadata: {
          ...supabaseUser?.user_metadata,
          username: formData.username,
          full_name: formData.fullName,
          avatar_url: avatarUrl,
        },
      } as User;
      setUser(updatedUser);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
      setIsEditing(false);
      await sendNotification({
        req: { headers: { origin: window.location.origin, authorization: '' } },
        eventType: 'account_changed',
        type: 'success',
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to update profile: ' + (error?.message || error) });
      await sendNotification({
        req: { headers: { origin: window.location.origin, authorization: '' } },
        eventType: 'account_changed',
        type: 'error',
        message: 'Failed to update profile',
      });
      console.error('[AccountTab] Error updating profile:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Save
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-md ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-700">
              {avatarPreview ? (
                <Image 
                  src={avatarPreview} 
                  alt="Profile" 
                  width={128} 
                  height={128} 
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">
                  <Camera className="h-12 w-12" />
                </div>
              )}
            </div>
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="h-4 w-4 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <p className="mt-2 text-sm text-gray-400">Profile picture</p>
        </div>

        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:opacity-50"
          />
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            disabled={!isEditing}
            className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:opacity-50"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:opacity-50"
          />
          <p className="mt-1 text-xs text-gray-400">Email cannot be changed directly. Contact support if needed.</p>
        </div>

        {/* Password Change Section */}
        {isEditing && (
          <div className="pt-6 border-t border-gray-700">
            <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-700 bg-slate-900 text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
} 