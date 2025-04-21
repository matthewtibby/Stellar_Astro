"use client";

import AwardsBanner from '@/src/components/AwardsBanner';
import FollowedPosts from '@/src/components/FollowedPosts';

export default function CommunityPage() {
  return (
    <main className="pt-16 min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Community Gallery</h1>
        
        {/* Awards Banner Section */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-4">Featured Awards</h2>
          <AwardsBanner />
        </div>
        
        {/* Followed Posts Section */}
        <div className="mb-12">
          <FollowedPosts />
        </div>
      </div>
    </main>
  );
} 