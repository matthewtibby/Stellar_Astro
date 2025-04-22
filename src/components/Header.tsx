"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { useUserStore } from "@/src/store/user";

export default function Header() {
  const router = useRouter();
  const { user, logout } = useUserStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Stellar Astro
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {user?.isAuthenticated ? (
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
            {user?.isLoading ? (
              <div className="h-9 w-20 bg-gray-700 rounded-md animate-pulse"></div>
            ) : user?.isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Link href="/profile" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : <User size={16} />}
                      </span>
                    </div>
                    <span className="text-white text-sm hidden sm:inline-block">
                      {user.fullName || 'User'}
                    </span>
                  </Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  aria-label="Log out"
                >
                  <LogOut size={18} />
                </button>
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
          </div>
        </div>
      </nav>
    </header>
  );
}
