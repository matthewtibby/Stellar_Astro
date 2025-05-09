'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrowserClient } from '@/src/lib/supabase';

export default function VerifyEmailPage() {
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const resendEmail = async () => {
    setError('');
    setResent(false);
    setIsLoading(true);
    try {
      const supabase = getBrowserClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && user.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });
        if (error) setError(error.message);
        else setResent(true);
      } else {
        setError('You must be logged in to resend the verification email.');
      }
    } catch (e) {
      setError('Failed to resend verification email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="bg-gray-900/50 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-white">Check your email</h1>
        <p className="mb-4 text-gray-300">
          We've sent a confirmation link to your email address.<br />
          <span className="font-semibold text-yellow-400">You must verify your email before you can log in or access your dashboard.</span>
        </p>
        <button
          onClick={resendEmail}
          className="mt-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Resending...' : 'Resend Email'}
        </button>
        {resent && <p className="text-green-500 mt-2">Verification email resent!</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
        <div className="mt-6">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
} 