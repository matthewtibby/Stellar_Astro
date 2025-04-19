/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      colors: {
        'astro': {
          'dark': '#0a0a0a',
          'primary': '#3b82f6',
        },
        white: '#ffffff',
        gray: {
          100: '#f3f4f6',
          200: '#e5e7eb',
          900: '#111827',
        },
      }
    },
  },
  plugins: [],
  safelist: [
    'bg-white',
    'text-gray-900',
    'antialiased',
    'font-bold',
    'tracking-tight',
    'text-4xl',
    'md:text-5xl',
    'lg:text-6xl',
    'text-3xl',
    'md:text-4xl',
    'lg:text-5xl',
    'text-2xl',
    'md:text-3xl',
    'lg:text-4xl',
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'text-sm',
    'font-medium',
    'transition-colors',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'bg-astro-primary',
    'text-white',
    'hover:bg-astro-primary/90',
    'bg-gray-100',
    'hover:bg-gray-200',
    'mx-auto',
    'max-w-7xl',
    'px-4',
    'sm:px-6',
    'lg:px-8'
  ]
} 