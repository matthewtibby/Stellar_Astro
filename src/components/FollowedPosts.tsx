"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, X } from 'lucide-react';

interface Post {
  id: string;
  image: string;
  title: string;
  username: string;
  userAvatar: string;
  likes: number;
  comments: number;
  description: string;
  timestamp: string;
  tags: string[];
}

// Mock data for followed users' posts
const followedPosts: Post[] = [
  {
    id: 'f1',
    image: 'https://images.unsplash.com/photo-1630358277232-5a14997a08bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Orion Constellation',
    username: 'marc_sendra',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    likes: 153,
    comments: 12,
    description: 'Captured this stunning view of the Orion Constellation last night. The colors are vibrant and the detail is exceptional. Used a 30-second exposure with my new telescope.',
    timestamp: '3h ago',
    tags: ['Nebula', 'Narrowband', 'HaRGB']
  },
  {
    id: 'f2',
    image: 'https://images.unsplash.com/photo-1684019608073-e79bc1642ec5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Rosette Nebula',
    username: 'sarah_chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    likes: 128,
    comments: 15,
    description: 'The Rosette Nebula captured with exceptional clarity and color balance. This is one of my favorite deep sky objects to photograph.',
    timestamp: '5h ago',
    tags: ['Nebula', 'Deep Sky', 'DSLR']
  },
  {
    id: 'f3',
    image: 'https://images.unsplash.com/photo-1716881139357-ddcb2f52940c?q=80&w=3018&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    title: 'Wizard Nebula',
    username: 'emily_astro',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    likes: 182,
    comments: 15,
    description: 'The Wizard Nebula captured with unprecedented detail and depth. This image took over 20 hours of exposure time to achieve this level of detail.',
    timestamp: '8h ago',
    tags: ['Nebula', 'Deep Sky', 'DSLR']
  }
];

// Mock data for recommended accounts
const recommendedPosts: Post[] = [
  {
    id: 'r1',
    image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Milky Way Over Mountains',
    username: 'astro_dave',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    likes: 241,
    comments: 18,
    description: 'Captured this stunning view of the Milky Way over the mountains. The colors are vibrant and the detail is exceptional.',
    timestamp: '12h ago',
    tags: ['Milky Way', 'Landscape', 'Night Sky']
  },
  {
    id: 'r2',
    image: 'https://images.unsplash.com/photo-1532968379173-523e16f371f9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Aurora Borealis',
    username: 'northern_lights',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    likes: 312,
    comments: 24,
    description: 'The Northern Lights were particularly vibrant last night. This image captures the full spectrum of colors in the aurora.',
    timestamp: '1d ago',
    tags: ['Aurora', 'Night Sky', 'Landscape']
  },
  {
    id: 'r3',
    image: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    title: 'Andromeda Galaxy',
    username: 'galaxy_hunter',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80',
    likes: 198,
    comments: 16,
    description: 'The Andromeda Galaxy captured with my new telescope. The detail in the spiral arms is incredible.',
    timestamp: '2d ago',
    tags: ['Galaxy', 'Deep Sky', 'Telescope']
  }
];

export default function FollowedPosts() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const openPostModal = (post: Post) => {
    setSelectedPost(post);
  };

  const closePostModal = () => {
    setSelectedPost(null);
  };

  return (
    <div className="w-full">
      {/* Followed Users Posts */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Posts from People You Follow</h3>
        <div className="relative">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex space-x-4">
              {followedPosts.map((post) => (
                <div 
                  key={post.id}
                  className="flex-none w-64 bg-slate-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => openPostModal(post)}
                >
                  <div className="relative h-40">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center mb-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                        <Image
                          src={post.userAvatar}
                          alt={post.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white text-sm font-medium">{post.username}</span>
                    </div>
                    <h4 className="text-white text-sm font-medium mb-1 truncate">{post.title}</h4>
                    <div className="flex items-center text-gray-400 text-xs">
                      <div className="flex items-center mr-3">
                        <Heart className="w-3 h-3 mr-1" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Posts */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Recommended for You</h3>
        <div className="relative">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex space-x-4">
              {recommendedPosts.map((post) => (
                <div 
                  key={post.id}
                  className="flex-none w-64 bg-slate-900 rounded-lg overflow-hidden shadow-lg cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => openPostModal(post)}
                >
                  <div className="relative h-40">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex items-center mb-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                        <Image
                          src={post.userAvatar}
                          alt={post.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="text-white text-sm font-medium">{post.username}</span>
                    </div>
                    <h4 className="text-white text-sm font-medium mb-1 truncate">{post.title}</h4>
                    <div className="flex items-center text-gray-400 text-xs">
                      <div className="flex items-center mr-3">
                        <Heart className="w-3 h-3 mr-1" />
                        <span>{post.likes}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 rounded-lg overflow-hidden max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative h-80">
              <Image
                src={selectedPost.image}
                alt={selectedPost.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <button 
                onClick={closePostModal}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="relative w-10 h-10 rounded-full overflow-hidden mr-3">
                  <Image
                    src={selectedPost.userAvatar}
                    alt={selectedPost.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-white font-medium">{selectedPost.username}</h3>
                  <p className="text-gray-400 text-sm">{selectedPost.timestamp}</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">{selectedPost.title}</h2>
              <p className="text-gray-300 mb-4">{selectedPost.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedPost.tags.map((tag) => (
                  <span 
                    key={tag}
                    className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center mr-6">
                  <Heart className="w-5 h-5 mr-1" />
                  <span>{selectedPost.likes}</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-1" />
                  <span>{selectedPost.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 