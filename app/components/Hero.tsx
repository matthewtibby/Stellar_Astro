import Link from "next/link";
import Image from "next/image";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/nebula-hero.jpg"
          alt="Stellar Astro Hero Background"
          fill
          priority
          className="object-cover"
          quality={100}
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8">
          Process Your Astrophotography Online
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Web-based software for calibrating, stacking, and enhancing your astrophotography.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/signup" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link 
            href="/learn-more" 
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-base font-medium rounded-md text-white hover:bg-white/10 md:text-lg transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
} 