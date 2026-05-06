import type { Metadata } from 'next'

import Navbar from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'



export const metadata: Metadata = {
  title: 'Auth System',
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

<main className=" mx-auto px-2 py-4">
  {children}
</main>
<Toaster position="top-right" />
</>
    
  )
}