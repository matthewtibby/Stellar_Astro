import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
// import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="absolute top-0 left-0 w-full h-full" style={{ top: '0', height: '100%' }}>
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)] pointer-events-none z-0" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        </div>
        <div className="relative z-10">
          <div className="pt-20 md:pt-32">
            <Features />
          </div>
          <Pricing />
        </div>
      </div>
    </main>
  )
}
