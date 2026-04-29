
 
'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'

type AuthContextType = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const AUTH_EXPIRATION_KEY = 'auth-expiration'
const AUTH_TOKEN_KEY = 'auth-token'
const SESSION_DURATION = 20 * 60 * 1000 // 20 minutes en millisecondes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const cleanup = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(AUTH_EXPIRATION_KEY)
    setIsAuthenticated(false)
    cleanup()
  }

  const login = async (username: string, password: string): Promise<boolean> => {
    // Simulation d'une requête API
    return new Promise((resolve) => {
      setTimeout(() => {
        if (username === 'dan' && password === 'dan') {
          const expirationTime = Date.now() + SESSION_DURATION
          localStorage.setItem(AUTH_TOKEN_KEY, 'dummy-token')
          localStorage.setItem(AUTH_EXPIRATION_KEY, expirationTime.toString())
          
          cleanup()
          timeoutRef.current = setTimeout(logout, SESSION_DURATION)
          
          setIsAuthenticated(true)
          resolve(true)
        } else {
          resolve(false)
        }
      }, 500) // Simulation de délai réseau
    })
  }

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      const expiration = localStorage.getItem(AUTH_EXPIRATION_KEY)
      
      if (token && expiration) {
        const expirationTime = parseInt(expiration, 10)
        const currentTime = Date.now()

        if (currentTime < expirationTime) {
          const remainingTime = expirationTime - currentTime
          timeoutRef.current = setTimeout(logout, remainingTime)
          setIsAuthenticated(true)
        } else {
          logout()
        }
      }
      setLoading(false)
    }

    checkAuth()

    return () => cleanup()
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}