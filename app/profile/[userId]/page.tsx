"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle } from 'lucide-react';

interface Post {
  id: string;
  image: string;
  title: string;
  likes: number;
  comments: number;
}

interface Profile {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  posts: Post[];
}

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [profile] = useState<Profile>({
    id: userId,
    name: userId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    avatar: `https://images.unsplash.com/profile-${userId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80`,
    bio: 'Passionate astrophotographer capturing the wonders of the cosmos.',
    followers: 1234,
    following: 567,
    posts: [
      {
        id: '1',
        image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        title: 'Orion Constellation',
        likes: 245,
        comments: 18,
      },
      {
        id: '2',
        image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
        title: 'Milky Way Galaxy',
        likes: 189,
        comments: 12,
      },
      // More posts would be loaded from the backend
    ],
  });

  return (
    <main className="pt-16 min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="flex items-center mb-8">
          <div className="relative w-24 h-24 rounded-full overflow-hidden mr-6">
            <Image
              src={profile.avatar}
              alt={profile.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{profile.name}</h1>
            <p className="text-slate-400 mb-4">{profile.bio}</p>
            <div className="flex space-x-6">
              <div className="text-white">
                <span className="font-bold">{profile.followers}</span>
                <span className="text-slate-400 ml-1">Followers</span>
              </div>
              <div className="text-white">
                <span className="font-bold">{profile.following}</span>
                <span className="text-slate-400 ml-1">Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profile.posts.map((post) => (
            <div key={post.id} className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
              <div className="relative h-64">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-4">{post.title}</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-slate-400">
                    <Heart className="w-5 h-5 mr-1" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <MessageCircle className="w-5 h-5 mr-1" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 