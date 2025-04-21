import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageCircle, Camera, Telescope, Clock } from 'lucide-react'

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
  const featuredPost = posts.find(post => post.isPhotoOfTheDay);
  // Get the remaining posts (limit to 2 for a more compact display)
  const regularPosts = posts.filter(post => !post.isPhotoOfTheDay).slice(0, 2);

  return (
    <section className="py-8 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Community Gallery
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {/* Featured Post (Photo of the Day) */}
          {featuredPost && (
            <div className="md:col-span-2">
              <div className="group relative bg-slate-900 rounded-md overflow-hidden transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/10 h-full">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <Image
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-white text-sm font-semibold mb-1">{featuredPost.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {featuredPost.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Photo of the Day Badge */}
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                    <span>🌟</span> Photo of the Day
                  </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <Link
                      href={featuredPost.author.profileUrl}
                      className="flex items-center gap-1.5 group/avatar"
                    >
                      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-blue-500/50">
                        <Image
                          src={featuredPost.author.avatar}
                          alt={featuredPost.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium group-hover/avatar:text-blue-400 transition-colors">
                          {featuredPost.author.name}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-0.5 text-slate-300 hover:text-red-500 transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs">{featuredPost.likes}</span>
                      </button>
                      <button className="flex items-center gap-0.5 text-slate-300 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{featuredPost.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Regular Posts Grid */}
          <div className="grid grid-cols-1 gap-3">
            {regularPosts.map((post) => (
              <div
                key={post.id}
                className="group relative bg-slate-900 rounded-md overflow-hidden transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <h3 className="text-white text-xs font-semibold mb-1">{post.title}</h3>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {post.tags.slice(0, 1).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Info Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-between">
                    <Link
                      href={post.author.profileUrl}
                      className="flex items-center gap-1.5 group/avatar"
                    >
                      <div className="relative w-5 h-5 rounded-full overflow-hidden border border-blue-500/50">
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium group-hover/avatar:text-blue-400 transition-colors">
                          {post.author.name}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2">
                      <button className="flex items-center gap-0.5 text-slate-300 hover:text-red-500 transition-colors">
                        <Heart className="w-3.5 h-3.5" />
                        <span className="text-xs">{post.likes}</span>
                      </button>
                      <button className="flex items-center gap-0.5 text-slate-300 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-xs">{post.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/community"
            className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  )
} 