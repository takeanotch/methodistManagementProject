import type { Metadata } from 'next'


import Navbar from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'



export const metadata: Metadata = {
  title: 'Paroisse | NAME',
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

<main className=" mx-auto  ">
  {children}
</main>
<Toaster position="top-right" />
</>
    
  )
}