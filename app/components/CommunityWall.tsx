"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Camera, Telescope, Clock } from 'lucide-react';

interface CommunityPost {
  id: string;
  image: string;
  title: string;
  author: {
    name: string;
    avatar: string;
    profileUrl: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  tags: string[];
  isFeatured?: boolean;
  isPhotoOfTheDay?: boolean;
}

const posts: CommunityPost[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1630358277232-5a14997a08bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Orion Constellation',
    author: {
      name: 'Marc Sendra Martorell',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
      profileUrl: '/profile/marc-sendra'
    },
    timestamp: '3h ago',
    likes: 153,
    comments: 12,
    tags: ['Nebula', 'Narrowband', 'HaRGB'],
    isPhotoOfTheDay: true
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1684019608073-e79bc1642ec5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Rosette Nebula - Deep Sky Capture',
    author: {
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
      profileUrl: '/profile/sarah'
    },
    timestamp: '5h ago',
    likes: 128,
    comments: 15,
    tags: ['Nebula', 'Deep Sky', 'DSLR']
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1716881139357-ddcb2f52940c?q=80&w=3018&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Wizard Nebula - Deep Sky Capture',
    author: {
      name: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
      profileUrl: '/profile/emily'
    },
    timestamp: '8h ago',
    likes: 182,
    comments: 15,
    tags: ['Nebula', 'Deep Sky', 'DSLR']
  },
  {
    id: '4',
    image: 'https://placehold.co/600x400/1a1a1a/ffffff?text=Rosette+Nebula',
    title: 'Rosette Nebula in HOO',
    author: {
      name: 'John Smith',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
      profileUrl: '/profile/john'
    },
    timestamp: '12h ago',
    likes: 241,
    comments: 18,
    tags: ['Nebula', 'Narrowband', 'HOO']
  }
]

export default function CommunityWall() {
  // Find the featured post (Photo of the Day)
  const featuredPost = posts.find(post => post.isPhotoOfTheDay);
  // Get the remaining posts (limit to 2 for a more compact display)
  const regularPosts = posts.filter(post => !post.isPhotoOfTheDay).slice(0, 2);

  return (
    <section className="relative py-24 overflow-hidden" aria-labelledby="community-heading">
      <div className="container mx-auto px-4 relative">
        <h2 id="community-heading" className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Community Wall</h2>
        
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-12">
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-64">
                <Image
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Photo of the Day
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-semibold mb-2">{featuredPost.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative w-10 h-10 mr-3">
                      <Image
                        src={featuredPost.author.avatar}
                        alt={featuredPost.author.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <Link href={featuredPost.author.profileUrl} className="text-white hover:text-blue-400 transition-colors">
                        {featuredPost.author.name}
                      </Link>
                      <p className="text-sm text-gray-400">{featuredPost.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center text-gray-400 hover:text-white transition-colors">
                      <Heart className="w-5 h-5 mr-1" />
                      <span>{featuredPost.likes}</span>
                    </button>
                    <button className="flex items-center text-gray-400 hover:text-white transition-colors">
                      <MessageCircle className="w-5 h-5 mr-1" />
                      <span>{featuredPost.comments}</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {featuredPost.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {regularPosts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="relative h-48">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative w-8 h-8 mr-2">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <Link href={post.author.profileUrl} className="text-white hover:text-blue-400 transition-colors">
                        {post.author.name}
                      </Link>
                      <p className="text-sm text-gray-400">{post.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center text-gray-400 hover:text-white transition-colors">
                      <Heart className="w-5 h-5 mr-1" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center text-gray-400 hover:text-white transition-colors">
                      <MessageCircle className="w-5 h-5 mr-1" />
                      <span>{post.comments}</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 