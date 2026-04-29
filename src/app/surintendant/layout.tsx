

import type { Metadata } from 'next'


import Navbar from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'
import LiveDateTime from '@/components/LiveDateTime'



export const metadata: Metadata = {
  title: 'Profile',
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


<main className="mx-auto  py-8">
  {children}
</main>
<Toaster position="top-right" />
</>
    
  )
}