"use client";

import Hero from './components/Hero'
import Features from './components/Features'
import Pricing from './components/Pricing'
import CommunityWall from './components/CommunityWall'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
        </div>
        <div className="relative">
          <Features />
          <Pricing />
          <CommunityWall />
        </div>
      </div>
    </main>
  );
} 