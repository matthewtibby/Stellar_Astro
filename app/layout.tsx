import type { Metadata } from 'next'
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CurrencyProvider } from '@/components/CurrencyProvider'
import { ToastProvider } from '@/src/hooks/useToast'
import ToastContainer from '@/src/components/ToastContainer'
import ClientProviders from './ClientProviders'
import AuthSync from '@/components/AuthSync'
import SupabaseProvider from './SupabaseProvider'
import { createServerClient } from '@supabase/ssr'
import { getSSRClientCookies } from '@/src/lib/ssrCookies'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans'
})

export const metadata: Metadata = {
  title: 'Stellar Astro - AI-Powered Image Processing',
  description: 'Transform your images with advanced AI processing and cloud integration.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get session from cookies for initial hydration
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: getSSRClientCookies() }
  );
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} h-full`}>
      <body className={`${inter.className} min-h-full flex flex-col font-sans bg-black`}>
        <SupabaseProvider initialSession={session ?? undefined}>
          <CurrencyProvider>
            <ClientProviders>
              <AuthSync />
              <Header />
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </ClientProviders>
          </CurrencyProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
} 