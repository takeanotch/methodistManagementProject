'use client'

import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import { useEffect, useState } from 'react'

export default function PathnameHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoginPage, setIsLoginPage] = useState(false)

  useEffect(() => {
    setIsLoginPage(pathname === '/login')
  }, [pathname])

  return (
    <>
      {!isLoginPage && <Navbar />}
      <main className={!isLoginPage ? 'pt-16' : ''}>
        {children}
      </main>
    </>
  )
}