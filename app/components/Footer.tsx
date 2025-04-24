import Link from "next/link";
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
        <p className="text-center text-gray-400 text-sm">
          © 2024 Stellar Astro. All rights reserved.
        </p>
      </div>
    </footer>
  );
} 