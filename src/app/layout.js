import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata = {
  title: 'CarRental — Fleet & Accounts Management',
  description: 'Professional car rental management platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-950 transition-colors`}
      >
        <ThemeProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              classNames: {
                toast: 'text-sm sm:text-base',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  )
}