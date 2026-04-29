import type { Metadata } from 'next'

import Navbar from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'



export const metadata: Metadata = {
  title: 'Gestion Conference',
  description: '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<>
<Navbar />

<main className=" mx-auto px-4 py-8">
  {children}
</main>
<Toaster position="top-right" />
</>
    
  )
}