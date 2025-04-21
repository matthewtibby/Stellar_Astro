"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, Star } from 'lucide-react';

interface Post {
  id: string;
  image: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  isStarred: boolean;
}

export default function FollowedPosts() {
  const [followedPosts, setFollowedPosts] = useState<Post[]>([
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Orion Constellation',
      author: 'AstroExplorer',
      likes: 245,
      comments: 18,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Milky Way Galaxy',
      author: 'StarChaser',
      likes: 189,
      comments: 12,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Andromeda Galaxy',
      author: 'CosmicObserver',
      likes: 312,
      comments: 24,
      isLiked: false,
      isStarred: false,
    }
  ]);

  const [recommendedPosts, setRecommendedPosts] = useState<Post[]>([
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Saturn Rings',
      author: 'PlanetHunter',
      likes: 156,
      comments: 9,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '5',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Jupiter Storm',
      author: 'SpaceExplorer',
      likes: 278,
      comments: 15,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '6',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Nebula Cloud',
      author: 'AstroPhotographer',
      likes: 423,
      comments: 31,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '7',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Solar Eclipse',
      author: 'SkyWatcher',
      likes: 567,
      comments: 42,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '8',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Meteor Shower',
      author: 'NightSky',
      likes: 198,
      comments: 16,
      isLiked: false,
      isStarred: false,
    },
    {
      id: '9',
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
      title: 'Aurora Borealis',
      author: 'NorthernLights',
      likes: 345,
      comments: 28,
      isLiked: false,
      isStarred: false,
    }
  ]);

  const handleLike = (postId: string, isFollowedPost: boolean) => {
    if (isFollowedPost) {
      setFollowedPosts(posts => posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    } else {
      setRecommendedPosts(posts => posts.map(post => 
        post.id === postId 
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    }
  };

  const handleStar = (postId: string, isFollowedPost: boolean) => {
    if (isFollowedPost) {
      setFollowedPosts(posts => posts.map(post => 
        post.id === postId 
          ? { ...post, isStarred: !post.isStarred }
          : post
      ));
    } else {
      setRecommendedPosts(posts => posts.map(post => 
        post.id === postId 
          ? { ...post, isStarred: !post.isStarred }
          : post
      ));
    }
  };

  const PostCard = ({ post, isFollowedPost }: { post: Post, isFollowedPost: boolean }) => (
    <div className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
      <div className="relative h-64">
        <Image
          src={post.image}
          alt={post.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{post.title}</h3>
        <p className="text-slate-400 text-sm mb-4">by {post.author}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLike(post.id, isFollowedPost)}
              className={`flex items-center space-x-1 ${
                post.isLiked ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              <Heart className="w-5 h-5" />
              <span>{post.likes}</span>
            </button>
            <button className="flex items-center space-x-1 text-slate-400">
              <MessageCircle className="w-5 h-5" />
              <span>{post.comments}</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleStar(post.id, isFollowedPost)}
              className={`${
                post.isStarred ? 'text-yellow-500' : 'text-slate-400'
              }`}
            >
              <Star className="w-5 h-5" />
            </button>
            <button className="text-slate-400">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Posts from People You Follow */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-6">Posts from People You Follow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {followedPosts.map((post) => (
            <PostCard key={post.id} post={post} isFollowedPost={true} />
          ))}
        </div>
      </div>
      
      {/* Recommended Posts */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-6">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendedPosts.map((post) => (
            <PostCard key={post.id} post={post} isFollowedPost={false} />
          ))}
        </div>
      </div>
    </div>
  );
} 