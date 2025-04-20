import Link from "next/link";
import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";

// Define user type
interface UserType {
  name?: string;
  email?: string;
  // Add other user properties as needed
}

// Mock authentication state - replace with your actual auth logic
const useAuth = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking authentication status
    // Replace this with your actual auth check
    const checkAuth = async () => {
      try {
        // Mock API call to check if user is logged in
        // const response = await fetch('/api/auth/session');
        // const data = await response.json();
        // setUser(data.user);
        
        // For now, we'll just simulate a logged out state
        setUser(null);
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return { user, loading };
};

export default function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              Stellar Astro
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/features" className="text-gray-300 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="h-9 w-20 bg-gray-700 rounded-md animate-pulse"></div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                    </span>
                  </div>
                  <span className="text-white text-sm hidden sm:inline-block">
                    {user.name || 'User'}
                  </span>
                </div>
                <button 
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
