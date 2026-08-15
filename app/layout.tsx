import type { Metadata } from 'next'
import { Inter, Orbitron } from 'next/font/google'
import './globals-premium.css'
import ToastProvider from './providers/ToastProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  weight: ['400', '500', '600', '700', '800', '900']
})

export const metadata: Metadata = {
  title: 'TigreBet - Premium Gaming Platform',
  description: 'Experience premium gaming with TigreBet. Professional casino-level entertainment with real rewards.',
  keywords: ['premium gaming', 'casino', 'tigrebet', 'online betting', 'professional gaming', 'vip casino'],
  icons: {
    icon: '/logo-premium.svg',
    apple: '/logo-premium.svg',
  },
  openGraph: {
    title: 'TigreBet - Premium Gaming Platform',
    description: 'Experience premium gaming with TigreBet. Professional casino-level entertainment.',
    images: ['/logo-premium.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TigreBet - Premium Gaming Platform',
    description: 'Experience premium gaming with TigreBet.',
    images: ['/logo-premium.svg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="premium-grid-bg min-h-screen">
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}
