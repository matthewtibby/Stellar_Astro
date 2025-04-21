"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUserStore } from '@/src/store/user';

// Dummy user credentials for testing
const DUMMY_USER = {
  email: 'demo@stellarastro.com',
  password: 'Demo123!',
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setUser, setLoading, setError: setStoreError } = useUserStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    setLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check against dummy credentials
      if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
        // Set user data in store
        setUser({
          id: '1',
          email: DUMMY_USER.email,
          fullName: 'Demo User',
          isAuthenticated: true,
          subscription: {
            type: 'free',
            projectLimit: 5
          }
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        throw new Error('Invalid email or password');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      setStoreError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-blue-500 animate-pulse"></div>
              <div className="absolute inset-1 rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-2xl font-bold">SA</span>
              </div>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to your Stellar Astro account
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-900/50 px-4 py-8 shadow sm:rounded-lg sm:px-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-500/10 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-400">Error</h3>
                      <div className="mt-2 text-sm text-red-400">{error}</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-md bg-black/50 px-3 py-2 text-white border border-gray-700 placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-md bg-black/50 px-3 py-2 text-white border border-gray-700 placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-700 bg-black/50 text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-semibold text-primary hover:text-primary/80">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-900/50 px-2 text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                >
                  <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.27498 6.60986C0.464979 8.22986 0 10.0599 0 11.9999C0 13.9399 0.464979 15.7699 1.27498 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24C15.2354 24 17.9504 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.87043 19.245 6.21543 17.135 5.27043 14.29L1.28043 17.385C3.25543 21.31 7.31043 24 12.0004 24Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Not a member?{' '}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/80">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 