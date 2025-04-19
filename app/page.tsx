'use client';

import Image from 'next/image'
import Link from 'next/link'
import Hero from '@/components/Hero'
import PricingSection from '@/components/PricingSection'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/nebula-hero.jpg"
            alt="Nebula background"
            fill
            className="object-cover brightness-75"
            priority
            quality={100}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/90" />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-300">
            Process Your<br />
            Astrophotography<br />
            Online
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-200">
            Upload, process, and store your astrophotography projects securely in the cloud.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Features Section */}
      <section className="py-20 bg-astro-dark">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/web.svg" alt="Web-Based" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Web-Based</h3>
              <p>Access from any device, no downloads required</p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/beginner.svg" alt="Beginner-Friendly" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Beginner-Friendly</h3>
              <p>Intuitive tools for processing deep-sky images</p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/collaborate.svg" alt="Collaborate" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Collaborate Anywhere</h3>
              <p>Work on projects together in real-time</p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/community.svg" alt="Community" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Community-Led</h3>
              <p>Share your results and get feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-astro-dark">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                image: '/community/placeholder.svg',
                title: 'Horsehead Nebula',
                author: 'Sarah',
                likes: 153,
                comments: 12
              },
              {
                image: '/community/placeholder.svg',
                title: 'Andromeda Galaxy',
                author: 'Mark',
                likes: 206,
                comments: 6
              },
              {
                image: '/community/placeholder.svg',
                title: 'Lagoon Nebula',
                author: 'Emily',
                likes: 182,
                comments: 15
              },
              {
                image: '/community/placeholder.svg',
                title: 'Rosette Nebula',
                author: 'John',
                likes: 241,
                comments: 18
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-gray-400 mb-2">{item.author}</p>
                  <div className="flex gap-4 text-gray-400">
                    <span>❤️ {item.likes}</span>
                    <span>💬 {item.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 
 