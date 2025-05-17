"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Trophy, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface Award {
  id: string;
  title: string;
  image: string;
  photographer: string;
  date: string;
  description: string;
}

const awards: Award[] = [
  {
    id: '1',
    title: 'Image of the Day',
    image: 'https://images.unsplash.com/photo-1630358277232-5a14997a08bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    photographer: 'Marc Sendra Martorell',
    date: 'April 21, 2025',
    description: 'Stunning capture of the Orion Constellation with vibrant colors and exceptional detail.'
  },
  {
    id: '2',
    title: 'Image of the Month',
    image: 'https://images.unsplash.com/photo-1684019608073-e79bc1642ec5?q=80&w=2948&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Sarah Chen',
    date: 'April 2025',
    description: 'The Rosette Nebula captured with exceptional clarity and color balance.'
  },
  {
    id: '3',
    title: 'Image of the Year',
    image: 'https://images.unsplash.com/photo-1716881139357-ddcb2f52940c?q=80&w=3018&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    photographer: 'Emily Rodriguez',
    date: '2025',
    description: 'The Wizard Nebula captured with unprecedented detail and depth.'
  }
];

export default function AwardsBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHallOfFameOpen, setIsHallOfFameOpen] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleSwipe = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? awards.length - 1 : prevIndex - 1));
      } else {
        // Swipe left - go to next
        setCurrentIndex((prevIndex) => (prevIndex === awards.length - 1 ? 0 : prevIndex + 1));
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    handleSwipe();
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? awards.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === awards.length - 1 ? 0 : prevIndex + 1));
  };

  const toggleHallOfFame = () => {
    setIsHallOfFameOpen(!isHallOfFameOpen);
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg overflow-hidden shadow-lg">
      {/* Awards Banner */}
      <div className="relative">
        <div 
          className="relative h-64 md:h-80 w-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={awards[currentIndex].image}
            alt={awards[currentIndex].title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white text-lg font-bold">{awards[currentIndex].title}</h3>
              </div>
              <p className="text-white text-sm mb-1">by {awards[currentIndex].photographer}</p>
              <p className="text-gray-300 text-xs">{awards[currentIndex].date}</p>
            </div>
          </div>
          
          {/* Navigation Arrows */}
          <button 
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
            aria-label="Previous award"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
            aria-label="Next award"
          >
            <ChevronRight size={20} />
          </button>
          
          {/* Indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
            {awards.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
        
        {/* Award Description */}
        <div className="p-4 bg-slate-800">
          <p className="text-gray-300 text-sm">{awards[currentIndex].description}</p>
        </div>
      </div>
      
      {/* Hall of Fame Toggle */}
      <button
        onClick={toggleHallOfFame}
        className="w-full flex items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <span className="text-white font-medium">Hall of Fame</span>
        </div>
        {isHallOfFameOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      
      {/* Hall of Fame Content */}
      {isHallOfFameOpen && (
        <div className="p-4 bg-slate-800 border-t border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {awards.map((award) => (
              <div key={award.id} className="bg-slate-900 rounded-lg overflow-hidden">
                <div className="relative h-40">
                  <Image
                    src={award.image}
                    alt={award.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
                <div className="p-3">
                  <h4 className="text-white font-medium text-sm">{award.title}</h4>
                  <p className="text-gray-400 text-xs">by {award.photographer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 