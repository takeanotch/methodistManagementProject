// import type { Metadata } from 'next'

// import './globals.css'
// import Navbar from '@/components/Navbar'
// import { Toaster } from 'react-hot-toast'



// export const metadata: Metadata = {
//   title: 'Auth System',
//   description: 'Simple authentication system with Next.js and Supabase',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="fr">
//       <body >
//         {/* <Navbar /> */}
//         <main className="container mx-auto px-4 py-8">
//           {children}
//         </main>
//         <Toaster position="top-right" />
//       </body>
//     </html>
//   )
// }

// app/layout.tsx
import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import { Toaster } from 'react-hot-toast'
import { Suspense } from 'react'
import { Spinner } from '@/components/Spinner'
import './globals.css'
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
    <html lang="fr">
      <body>
        {/* <Navbar /> */}
        <main className="container mx-auto px-4 py-8">
          <Suspense fallback={<Spinner />}>
            {children}
          </Suspense>
        </main>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}