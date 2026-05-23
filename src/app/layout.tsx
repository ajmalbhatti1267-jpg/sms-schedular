import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import { SessionProvider } from './session-provider'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'Lumio — Bulk Message Scheduler',
  description: 'Schedule and send bulk messages to thousands of contacts with ease.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: { iconTheme: { primary: '#a78bfa', secondary: '#0f172a' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#0f172a' } },
            }}
          />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
