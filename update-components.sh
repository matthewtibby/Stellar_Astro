#!/bin/bash

# Create components directory if it doesn't exist
mkdir -p src/components

# Update Hero component
echo 'import Link from "next/link";

export default function Hero() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden">
      <div 
        className="absolute inset-0 bg-[url(\'/images/hero-bg.jpg\')] bg-cover bg-center"
        style={{ 
          backgroundImage: "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.8))"
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-8">
          Process Your Astrophotos Online
        </h1>
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Web-based software for calibrating, stacking, and enhancing your astrophotos.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:text-lg transition-colors">Get Started</Link>
          <Link href="/learn-more" className="inline-flex items-center justify-center px-8 py-3 border-2 border-gray-300 text-base font-medium rounded-md text-white hover:bg-white/10 md:text-lg transition-colors">Learn More</Link>
        </div>
      </div>
    </div>
  );
}' > src/components/Hero.tsx

# Update Features component
echo 'import { Monitor, UserCheck, Users, MessageSquare } from "lucide-react";

const features = [
  {
    name: "Web-Based",
    description: "Access from any device, no downloads required",
    icon: Monitor
  },
  {
    name: "Beginner-Friendly",
    description: "Intuitive tools for processing deep-sky images",
    icon: UserCheck
  },
  {
    name: "Collaborate Anywhere",
    description: "Work on projects together in real-time",
    icon: Users
  },
  {
    name: "Community-Led",
    description: "Share your results and get feedback",
    icon: MessageSquare
  }
];

export default function Features() {
  return (
    <div className="bg-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Why Choose Us</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.name} className="relative group bg-gray-800 p-6 rounded-lg shadow-lg hover:bg-gray-700 transition-colors">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{feature.name}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}' > src/components/Features.tsx

# Update Pricing component
echo 'import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "0",
    description: "Limited features",
    features: [
      "Basic image processing",
      "Up to 3 projects",
      "Community support",
      "Watermarked exports"
    ],
    cta: "Get Started",
    href: "/signup"
  },
  {
    name: "Pro",
    price: "15",
    period: "/month",
    yearlyPrice: "120/year",
    description: "Full processing suite",
    features: [
      "Advanced processing tools",
      "Unlimited projects",
      "No export limits",
      "Priority support",
      "Cloud storage",
      "Collaboration features"
    ],
    cta: "Go Pro",
    href: "/pricing"
  }
];

export default function Pricing() {
  return (
    <div className="bg-black py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Simple Pricing</h2>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <div key={tier.name} className="relative bg-gray-900 rounded-2xl shadow-xl p-8 flex flex-col">
              <h3 className="text-xl font-semibold text-white mb-4">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">€{tier.price}</span>
                {tier.period && <span className="text-gray-400 ml-2">{tier.period}</span>}
                {tier.yearlyPrice && <p className="text-sm text-gray-400 mt-1">€{tier.yearlyPrice}</p>}
              </div>
              <p className="text-gray-400 mb-6">{tier.description}</p>
              <ul className="space-y-4 mb-8 flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-300">
                    <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={tier.href} className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full">{tier.cta}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}' > src/components/Pricing.tsx

# Update Footer component
echo 'import Link from "next/link";
import { Github, Twitter, Instagram } from "lucide-react";

const navigation = {
  main: [
    { name: "About", href: "/about" },
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Blog", href: "/blog" },
    { name: "Support", href: "/support" },
  ],
  social: [
    {
      name: "GitHub",
      href: "https://github.com",
      icon: Github
    },
    {
      name: "Twitter",
      href: "https://twitter.com",
      icon: Twitter
    },
    {
      name: "Instagram",
      href: "https://instagram.com",
      icon: Instagram
    },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center mb-8">
          {navigation.main.map((item) => (
            <div key={item.name} className="px-5 py-2">
              <Link href={item.href} className="text-gray-400 hover:text-gray-300 transition-colors">{item.name}</Link>
            </div>
          ))}
        </nav>
        <div className="flex justify-center space-x-6 mb-8">
          {navigation.social.map((item) => (
            <Link key={item.name} href={item.href} className="text-gray-400 hover:text-gray-300 transition-colors">
              <span className="sr-only">{item.name}</span>
              <item.icon className="h-6 w-6" />
            </Link>
          ))}
        </div>
        <div className="mt-8 border-t border-gray-800 pt-8">
          <p className="text-center text-gray-400 text-sm">&copy; {new Date().getFullYear()} Stellar Astro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}' > src/components/Footer.tsx 