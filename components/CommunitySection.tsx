import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Camera, Telescope, Clock } from 'lucide-react'
import React, { useState } from 'react'

interface CommunityPost {
  id: string
  image: string
  title: string
  author: {
    name: string
    avatar: string
    profileUrl: string
  }
  timestamp: string
  likes: number
  comments: number
  tags: string[]
  isFeatured?: boolean
  isPhotoOfTheDay?: boolean
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

export default function CommunitySection() {
  // Find the featured post (Photo of the Day)
  const [tagFilter, setTagFilter] = useState('');
  const featuredPost = posts.find(post => post.isPhotoOfTheDay);
  // Get the remaining posts (limit to 2 for a more compact display)
  const regularPosts = posts.filter(post => !post.isPhotoOfTheDay).slice(0, 2);

  // Filter posts by tag if tagFilter is set
  const filteredPosts = tagFilter
    ? posts.filter(post => post.tags.some(tag => tag.toLowerCase() === tagFilter.toLowerCase()))
    : posts;

  return (
    <section className="relative py-24 overflow-hidden" aria-labelledby="community-heading">
      <div className="container mx-auto px-4 relative">
        <h2 id="community-heading" className="text-4xl font-bold mb-12 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Community Wall</h2>
        {/* Tag filter UI */}
        <div className="mb-8 flex items-center gap-2">
          {tagFilter && (
            <span className="bg-blue-700 text-blue-100 text-xs px-3 py-1 rounded-full mr-2">
              Filter: {tagFilter}
              <button
                className="ml-2 text-white hover:text-red-400"
                onClick={() => setTagFilter('')}
                title="Clear tag filter"
              >
                ×
              </button>
            </span>
          )}
          {!tagFilter && (
            <span className="text-gray-400 text-sm">Click a tag below to filter posts</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
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
                {/* Render tags as clickable chips */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {post.tags.map((tag) => (
                    <button
                      key={tag}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium mr-1 mb-1 transition-colors ${tagFilter === tag ? 'bg-blue-900 text-blue-200' : 'bg-blue-700 text-blue-100 hover:bg-blue-800'}`}
                      onClick={() => setTagFilter(tag)}
                      type="button"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
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
                    <span className="text-sm text-gray-300">{post.author.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 