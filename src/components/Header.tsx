"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { useUserStore } from "@/src/store/user";

export default function Header() {
  const router = useRouter();
  const isAuthenticated = useUserStore(state => state.isAuthenticated);
  const isLoading = useUserStore(state => state.isLoading);
  const fullName = useUserStore(state => state.fullName);
  const logout = useUserStore(state => state.logout);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-lg border-b border-white/10 shadow-md">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Stellar Astro
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
                  Pricing
                </Link>
              </>
            )}
            <Link href="/community" className="text-gray-300 hover:text-white transition-colors">
              Community
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="h-9 w-20 bg-gray-700 rounded-md animate-pulse"></div>
            ) : isAuthenticated ? (
              <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shadow hover:shadow-blue-400/50 transition-shadow focus:outline-none">
                  {fullName ? fullName.charAt(0).toUpperCase() : <User size={18} />}
                </button>
                <div className="absolute right-0 mt-2 w-40 bg-white/90 backdrop-blur-lg rounded-lg shadow-lg border border-white/20 py-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                  <Link href="/profile" className="block px-4 py-2 text-gray-800 hover:bg-blue-100 transition-colors">Profile</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100 transition-colors">Logout</button>
                </div>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-white bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
            <button
              className="relative p-2 text-gray-300 hover:text-blue-400 transition-colors hover:drop-shadow-[0_0_8px_#4f8cff]"
              aria-label="Notifications"
            >
              {/* Airbnb-style bell icon (Heroicons/rounded) */}
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
