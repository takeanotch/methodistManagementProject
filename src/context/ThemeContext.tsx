// 'use client'

// import React, { createContext, useContext, useEffect, useState } from 'react';

// type Theme = 'light' | 'dark';

// interface ThemeContextType {
//   theme: Theme;
//   toggleTheme: () => void;
// }

// const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// export function ThemeProvider({ children }: { children: React.ReactNode }) {
//   const [theme, setTheme] = useState<Theme>('light');

//   useEffect(() => {
//     // Vérifier le thème sauvegardé ou la préférence système
//     const savedTheme = localStorage.getItem('theme') as Theme;
//     const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
//     if (savedTheme) {
//       setTheme(savedTheme);
//     } else if (systemPrefersDark) {
//       setTheme('dark');
//     }
//   }, []);

//   useEffect(() => {
//     // Appliquer le thème au document
//     document.documentElement.classList.toggle('dark', theme === 'dark');
//     localStorage.setItem('theme', theme);
//   }, [theme]);

//   const toggleTheme = () => {
//     setTheme(prev => prev === 'light' ? 'dark' : 'light');
//   };

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// }

// export function useTheme() {
//   const context = useContext(ThemeContext);
//   if (context === undefined) {
//     throw new Error('useTheme must be used within a ThemeProvider');
//   }
//   return context;
// }
// 'use client'

// import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// type Theme = 'light' | 'dark'

// interface ThemeContextType {
//   theme: Theme
//   toggleTheme: () => void
// }

// const ThemeContext = createContext<ThemeContextType | null>(null)

// interface ThemeProviderProps {
//   children: ReactNode
// }

// export function ThemeProvider({ children }: ThemeProviderProps) {
//   const [theme, setTheme] = useState<Theme>('light')
//   const [mounted, setMounted] = useState(false)

//   useEffect(() => {
//     setMounted(true)
    
//     try {
//       // Vérifier le thème sauvegardé
//       const savedTheme = localStorage.getItem('theme') as Theme
//       if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
//         setTheme(savedTheme)
//         return
//       }
//     } catch (error) {
//       console.warn('Erreur lors de la lecture du localStorage:', error)
//     }

//     // Vérifier la préférence système
//     if (typeof window !== 'undefined') {
//       const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
//       setTheme(systemPreference)
//     }
//   }, [])

//   useEffect(() => {
//     if (!mounted) return

//     const root = document.documentElement
    
//     // Nettoyer les classes existantes
//     root.classList.remove('light', 'dark')
//     // Ajouter la nouvelle classe
//     root.classList.add(theme)
    
//     try {
//       localStorage.setItem('theme', theme)
//     } catch (error) {
//       console.warn('Erreur lors de la sauvegarde dans le localStorage:', error)
//     }
//   }, [theme, mounted])

//   const toggleTheme = () => {
//     setTheme(prev => prev === 'light' ? 'dark' : 'light')
//   }

//   const value: ThemeContextType = {
//     theme,
//     toggleTheme,
//   }

//   return (
//     <ThemeContext.Provider value={value}>
//       {children}
//     </ThemeContext.Provider>
//   )
// }

// export const useTheme = (): ThemeContextType => {
//   const context = useContext(ThemeContext)
  
//   if (!context) {
//     // Retourner des valeurs par défaut au lieu de throw une erreur
//     console.warn('useTheme used outside ThemeProvider - returning default values')
//     return {
//       theme: 'light',
//       toggleTheme: () => console.warn('ThemeProvider not available'),
//     }
//   }
  
//   return context
// }
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    try {
      const savedTheme = localStorage.getItem('theme') as Theme
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme)
        return
      }
    } catch (error) {
      console.warn('Erreur lors de la lecture du localStorage:', error)
    }

    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(systemPreference)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    
    try {
      localStorage.setItem('theme', theme)
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde dans le localStorage:', error)
    }
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
  }

  return (
    <ThemeProviderWithInlineScript theme={theme}>
      <ThemeContext.Provider value={value}>
        {children}
      </ThemeContext.Provider>
    </ThemeProviderWithInlineScript>
  )
}

// Composant pour gérer le script inline
function ThemeProviderWithInlineScript({ 
  children, 
  theme 
}: { 
  children: ReactNode 
  theme: Theme 
}) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                var initialTheme = theme === 'light' || theme === 'dark' ? theme : systemPreference;
                
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(initialTheme);
              } catch (e) {}
            })();
          `,
        }}
      />
      {children}
    </>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  
  if (!context) {
    console.warn('useTheme used outside ThemeProvider - returning default values')
    return {
      theme: 'light',
      toggleTheme: () => console.warn('ThemeProvider not available'),
    }
  }
  
  return context
}