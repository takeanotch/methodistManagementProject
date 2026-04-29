import type { Metadata } from 'next'


import Navbar from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'


export const metadata: Metadata = {
  title: 'Conference',
  description: 'Simple authentication system with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<>
<Navbar />

<main className="container mx-auto px-4 py-8">
  {children}
</main>
<Toaster position="top-right" />
</>
    
  )
}