import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center text-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.svg"
            alt="Space background"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 container mx-auto px-4">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6">
            Process Your<br />
            Astrophotography<br />
            Online
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Upload, process, and store your astrophotography projects securely in the cloud.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/dashboard"
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-astro-dark">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/web.svg" alt="Web-Based" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Web-Based</h3>
              <p>Access from any device, no downloads required</p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/beginner.svg" alt="Beginner-Friendly" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Beginner-Friendly</h3>
              <p>Intuitive tools for processing deep-sky images</p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/collaborate.svg" alt="Collaborate" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Collaborate Anywhere</h3>
              <p>Work on projects together in real-time</p>
            </div>
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/icons/community.svg" alt="Community" width={64} height={64} />
              </div>
              <h3 className="text-xl font-bold mb-2">Community-Led</h3>
              <p>Share your results and get feedback</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-xl text-center text-gray-400 mb-12">Choose the plan that works for you</p>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="bg-gray-900 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Free</h3>
              <p className="text-gray-400 mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-3xl font-bold">£0</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Basic calibration tools
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Limited number of projects
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Watermarked exports
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Limited export resolution
                </li>
              </ul>
              <Link 
                href="/signup"
                className="btn btn-secondary w-full"
              >
                Get Started
              </Link>
            </div>

            {/* Monthly Pro */}
            <div className="bg-gray-900 p-8 rounded-lg border-2 border-astro-primary relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-astro-primary text-white px-3 py-1 rounded-full text-sm">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro Monthly</h3>
              <p className="text-gray-400 mb-6">Full access, monthly billing</p>
              <div className="mb-6">
                <span className="text-3xl font-bold">£15</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Full processing suite
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Unlimited projects
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  No watermarks
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Full resolution exports
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Advanced calibration tools
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Priority support
                </li>
              </ul>
              <Link 
                href="/signup"
                className="btn btn-primary w-full"
              >
                Get Started
              </Link>
            </div>

            {/* Annual Pro */}
            <div className="bg-gray-900 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-4">Pro Annual</h3>
              <p className="text-gray-400 mb-6">Save 33% with annual billing</p>
              <div className="mb-6">
                <span className="text-3xl font-bold">£120</span>
                <span className="text-gray-400">/year</span>
              </div>
              <div className="text-sm text-green-500 mb-8">Save £60 per year</div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Everything in Pro Monthly
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  2 months free
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Extended storage retention
                </li>
              </ul>
              <Link 
                href="/signup"
                className="btn btn-primary w-full"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-20 bg-astro-dark">
        <div className="container">
          <h2 className="text-4xl font-bold text-center mb-16">Community</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                image: '/community/placeholder.svg',
                title: 'Horsehead Nebula',
                author: 'Sarah',
                likes: 153,
                comments: 12
              },
              {
                image: '/community/placeholder.svg',
                title: 'Andromeda Galaxy',
                author: 'Mark',
                likes: 206,
                comments: 6
              },
              {
                image: '/community/placeholder.svg',
                title: 'Lagoon Nebula',
                author: 'Emily',
                likes: 182,
                comments: 15
              },
              {
                image: '/community/placeholder.svg',
                title: 'Rosette Nebula',
                author: 'John',
                likes: 241,
                comments: 18
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={400}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{item.title}</h3>
                  <p className="text-gray-400 mb-2">{item.author}</p>
                  <div className="flex gap-4 text-gray-400">
                    <span>❤️ {item.likes}</span>
                    <span>💬 {item.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
} 
 