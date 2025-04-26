import Hero from '@/components/Hero'
import Features from '@/components/Features'
import Pricing from '@/components/Pricing'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <div className="relative">
        <Features />
        <Pricing />
      </div>
      <Footer />
    </main>
  )
}
