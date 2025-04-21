'use client';

import Image from 'next/image'
import Link from 'next/link'
import Hero from '@/components/Hero'
import PricingSection from '@/components/PricingSection'
import WhyChooseUs from '../components/WhyChooseUs'
import CommunitySection from '../components/CommunitySection'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Hero Section */}
      <div className="relative h-screen">
        <div className="absolute inset-0">
          <Image
            src="/images/nebula-hero.jpg"
            alt="Nebula background"
            fill
            className="object-cover brightness-75"
            priority
            quality={100}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/90" />
        </div>
        <div className="relative h-full flex items-center justify-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-300">
              Process Your<br />
              Astrophotography<br />
              Online
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Upload, process, and store your astrophotography projects securely in the cosmos.
            </p>
            <div className="flex gap-4 justify-center mt-12">
              <Link
                href="/dashboard"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
              <Link
                href="/community"
                className="bg-transparent border border-gray-300 hover:bg-gray-800 text-white px-8 py-3 rounded-lg text-lg transition-all duration-200 transform hover:scale-105"
              >
                Explore Community
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Unified Background */}
      <div className="relative bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
        
        {/* Why Choose Us Section */}
        <div className="relative">
          <WhyChooseUs />
        </div>

        {/* Pricing Section */}
        <div className="relative">
          <PricingSection />
        </div>

        {/* Community Section */}
        <div className="relative">
          <CommunitySection />
        </div>
      </div>
    </div>
  )
} 
 