import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

if (process.env.NEXT_RUNTIME === 'nodejs') {
  const { server } = await import('@/mocks/node')

  server.listen({
    remote: {
      enabled: true,
    },
  })
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Next.js RSC Testing',
  description: 'Example of testing React Server Component in Next.js using MSW',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable}`}>{children}</body>
    </html>
  )
}
