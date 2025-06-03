import Image from 'next/image';
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Gradient background (behind image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black z-0" />
      {/* Nebula image (on top of gradient) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <Image
          src="/images/nebula-hero.jpg"
          alt="Nebula"
          fill
          className="object-cover opacity-90"
          priority
        />
      </div>
      <div className="relative z-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-400 drop-shadow-lg mb-6">
          Stellar Astro
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto drop-shadow">
          Cloud-based astrophotography calibration, stacking, and processing. Upload your FITS files, create master frames, and process your data with ease.
        </p>
        <Link href="/dashboard" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform text-lg">
          Get Started
        </Link>
      </div>
    </section>
  );
}
