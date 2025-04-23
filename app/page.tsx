import Image from 'next/image'

export default function HoldingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Stellar Astro</h1>
          <p className="text-xl mb-8 text-gray-300">
            Coming Soon - A revolutionary platform for astrophotography enthusiasts
          </p>
          <div className="mb-12">
            <Image
              src="/images/placeholder.jpg"
              alt="Stellar Astro"
              width={600}
              height={400}
              className="rounded-lg shadow-xl mx-auto"
            />
          </div>
          <div className="space-y-4">
            <p className="text-lg text-gray-300">
              We're working on something amazing. Stay tuned for updates!
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="https://twitter.com/yourhandle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="mailto:contact@stellar-astro.co.uk"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
 