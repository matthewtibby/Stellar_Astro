"use client";
import React, { useRef, useEffect } from 'react';
import { useSignUpForm } from './hooks/useSignUpForm';
import { NameInput } from './components/NameInput';
import { EmailInput } from './components/EmailInput';
import { PasswordInput } from './components/PasswordInput';
import { ConfirmPasswordInput } from './components/ConfirmPasswordInput';
import { ErrorMessage } from './components/ErrorMessage';
import Image from 'next/image';

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid #ccc',
        borderTop: '2px solid #333',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: 8,
        verticalAlign: 'middle',
      }}
      aria-label="Loading"
    />
  );
}

export default function SignUpPage() {
  const {
    firstName,
    lastName,
    email,
    password,
    confirmPassword,
    error,
    setField,
    handleSubmit,
    loading,
    serverError,
    success,
  } = useSignUpForm();

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error === 'Invalid first name' && firstNameRef.current) {
      firstNameRef.current.focus();
    } else if (error === 'Invalid last name' && lastNameRef.current) {
      lastNameRef.current.focus();
    } else if (error === 'Invalid email' && emailRef.current) {
      emailRef.current.focus();
    } else if (error === 'Password is too weak' && passwordRef.current) {
      passwordRef.current.focus();
    } else if (error === 'Passwords do not match' && confirmPasswordRef.current) {
      confirmPasswordRef.current.focus();
    }
  }, [error]);

  // Inline spinner keyframes
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const isDisabled = loading || success;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_50%)]" />
      <div className="relative flex min-h-screen flex-col items-center py-4 sm:px-6 lg:px-8">
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="relative px-6 py-10 sm:px-10 rounded-2xl bg-gradient-to-br from-purple-800/80 via-indigo-800/70 to-slate-900/60 border border-slate-700 shadow-2xl ring-1 ring-blue-900/40 backdrop-blur-md transition-transform duration-300 hover:scale-[1.025] hover:shadow-blue-500/30 animate-fade-in animate-float">
            <div className="flex justify-center">
              <Image src="/logo/logo.png" alt="Stellar Astro Logo" width={128} height={128} className="rounded-full shadow-lg" priority />
            </div>
            <h1 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">Sign Up</h1>
            <p className="mt-2 text-center text-sm text-gray-400">Create your Stellar Astro account</p>
            <div className="mt-6">
              {success ? (
                <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
                  <svg className="w-16 h-16 text-green-400 mb-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <div className="text-green-400 text-lg font-semibold mb-2">Signup successful!</div>
                  <div className="text-gray-300 text-sm mb-2">Redirecting to login...</div>
                  {/* Confetti animation placeholder (add real confetti if desired) */}
                </div>
              ) : (
                <>
                  {/* Social signup buttons */}
                  <div className="flex flex-col gap-3 mb-6">
                    <button type="button" className="flex items-center justify-center gap-2 w-full rounded-lg bg-white/10 border border-slate-600 text-white font-semibold py-2 shadow hover:bg-white/20 transition">
                      <svg width="20" height="20" viewBox="0 0 48 48" className="inline-block"><g><circle fill="#4285F4" cx="24" cy="24" r="24"/><path fill="#fff" d="M34.6 24.2c0-.7-.1-1.4-.2-2H24v4.1h6c-.3 1.5-1.3 2.7-2.7 3.5v2.9h4.4c2.6-2.4 4.1-5.9 4.1-9.5z"/><path fill="#fff" d="M24 36c2.7 0 5-0.9 6.7-2.4l-4.4-2.9c-1.2.8-2.7 1.3-4.3 1.3-3.3 0-6-2.2-7-5.2h-4.5v3.2C13.7 33.7 18.5 36 24 36z"/><path fill="#fff" d="M17 27.8c-.3-.8-.5-1.7-.5-2.8s.2-2 .5-2.8v-3.2h-4.5C11.2 21.1 12 23.4 13.7 25.2l3.3-2.4z"/><path fill="#fff" d="M24 16.7c1.5 0 2.8.5 3.8 1.4l2.8-2.8C29 13.5 26.7 12.5 24 12.5c-5.5 0-10.3 2.3-13.3 6.1l4.5 3.2c1-3 3.7-5.2 7-5.2z"/></g></svg>
                      Sign up with Google
                    </button>
                  </div>
                  <div className="flex items-center mb-6">
                    <div className="flex-grow border-t border-slate-700" />
                    <span className="mx-4 text-gray-400 text-xs">or</span>
                    <div className="flex-grow border-t border-slate-700" />
                  </div>
                  <form
                    onSubmit={handleSubmit}
                    aria-busy={loading || success}
                    role="form"
                  >
                    <NameInput
                      label="First Name"
                      name="firstName"
                      value={firstName}
                      onChange={e => setField('firstName', e.target.value)}
                      required
                      error={error === 'Invalid first name' ? error : undefined}
                      disabled={isDisabled}
                      autoFocus={!!(error === 'Invalid first name')}
                      ref={firstNameRef}
                    />
                    <NameInput
                      label="Last Name"
                      name="lastName"
                      value={lastName}
                      onChange={e => setField('lastName', e.target.value)}
                      required
                      error={error === 'Invalid last name' ? error : undefined}
                      disabled={isDisabled}
                      autoFocus={!!(error === 'Invalid last name') && !error}
                      ref={lastNameRef}
                    />
                    <EmailInput
                      value={email}
                      onChange={e => setField('email', e.target.value)}
                      required
                      error={error === 'Invalid email' ? error : undefined}
                      disabled={isDisabled}
                      autoFocus={!!(error === 'Invalid email') && !error}
                      ref={emailRef}
                    />
                    <PasswordInput
                      value={password}
                      onChange={e => setField('password', e.target.value)}
                      required
                      error={error === 'Password is too weak' ? error : undefined}
                      disabled={isDisabled}
                      autoFocus={!!(error === 'Password is too weak') && !error}
                      ref={passwordRef}
                    />
                    <ConfirmPasswordInput
                      value={confirmPassword}
                      onChange={e => setField('confirmPassword', e.target.value)}
                      required
                      error={error === 'Passwords do not match' ? error : undefined}
                      disabled={isDisabled}
                      autoFocus={!!(error === 'Passwords do not match') && !error}
                      ref={confirmPasswordRef}
                    />
                    <div className="flex items-center mb-4 mt-2">
                      <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500" />
                      <label htmlFor="terms" className="ml-2 block text-xs text-gray-300">
                        I agree to the <a href="/terms" className="underline hover:text-blue-400">Terms</a> and <a href="/privacy" className="underline hover:text-blue-400">Privacy Policy</a>
                      </label>
                    </div>
                    {/* Show any other error */}
                    <ErrorMessage error={
                      error && !['Invalid email', 'Password is too weak', 'Passwords do not match'].includes(error)
                        ? error
                        : undefined
                    } />
                    {/* Show server error */}
                    {serverError && (
                      <div aria-live="polite" style={{ color: 'red', marginBottom: 8 }}>{serverError}</div>
                    )}
                    <button type="submit" disabled={isDisabled} className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed mt-4" aria-label="Sign up">
                      {loading && <Spinner />}
                      {loading ? 'Signing up...' : 'Sign Up'}
                    </button>
                  </form>
                  <div className="mt-6 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <a href="/login" className="font-semibold text-blue-400 hover:underline">Log in</a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 