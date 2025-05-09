import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      {/* Gradient background (behind image) */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-black z-0" />
      {/* Nebula image (on top of gradient) */}
      <div className="absolute inset-0 z-10">
        <img src="/nebula-hero.jpg" alt="Nebula Hero" className="w-full h-full object-cover opacity-90" />
      </div>
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center z-20">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-8 drop-shadow-lg bg-gradient-to-r from-white via-white to-purple-400 bg-clip-text text-transparent">
          Process Your Astrophotography Online
        </h1>
        <p className="text-xl md:text-2xl text-white mb-12 max-w-3xl mx-auto">
          Manage, Calibrate, Stack and Process your Astrophotography in the Cosmos
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors">Get Started</Link>
          <Link href="/learn-more" className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-base font-medium rounded-md text-white hover:bg-white/10 md:text-lg transition-colors">Learn More</Link>
        </div>
      </div>
    </section>
  );
}
