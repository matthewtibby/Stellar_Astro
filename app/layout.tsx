'use client';
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
import ClientLayout from './client-layout'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans'
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable} h-full`}>
      <body className={`${inter.className} min-h-full flex flex-col font-sans bg-black`}>
        <CurrencyProvider>
          <ClientProviders>
            <ClientLayout>
              {children}
            </ClientLayout>
          </ClientProviders>
        </CurrencyProvider>
      </body>
    </html>
  )
} 