'use client';

import Image from 'next/image'
import Link from 'next/link'
import Hero from '@/components/Hero'
import PricingSection from '@/components/PricingSection'
import WhyChooseUs from '../components/WhyChooseUs'
import CommunitySection from '../components/CommunitySection'

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
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Pricing Section */}
      <PricingSection />

      {/* Community Section */}
      <CommunitySection />
    </div>
  )
} 
 