

'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { login } from '@/actions/auth'
import toast from 'react-hot-toast'
import Image from 'next/image'

// Type pour le retour de l'action login
type LoginResult = {
  error?: string
  success?: boolean
  redirectTo?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null) // Reset error on new submission
    
    startTransition(async () => {
      const result = await login(formData) as LoginResult
      
      if (result?.error) {
        // Afficher l'erreur avec toast
        toast.error(result.error)
        // Optionnel: aussi stocker l'erreur dans le state pour affichage inline
        setError(result.error)
      } 
      else if (result?.success && result.redirectTo) {
        // Succès - redirection
        router.push(result.redirectTo)
      }
      else {
        // Cas inattendu
        toast.error('Une erreur inattendue est survenue')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logoup.png" 
            alt="Logo" 
            
            className="w-16 "
           
          />
          
        </div>

        <h2 className="mt-6 text-center text-3xl font-light text-gray-900">
          Connexion
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Accédez à votre espace personnel
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 sm:px-10 border border-gray-100">
          
          {/* Affichage d'erreur inline (optionnel) */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            </div>
          )}

          <form action={handleSubmit} className="space-y-6">
            {/* Champ téléphone */}
            <div>
              <label htmlFor="numero" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Numéro de téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                    />
                  </svg>
                </div>
                <input
                  type="tel"
                  id="numero"
                  name="numero"
                  required
                  disabled={isPending}
                  placeholder="+243 81 234 5678"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Champ mot de passe */}
            <div>
              <label htmlFor="mot_de_passe" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg 
                    className="h-5 w-5 text-gray-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                    />
                  </svg>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="mot_de_passe"
                  name="mot_de_passe"
                  required
                  disabled={isPending}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors placeholder-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                  aria-label={showPassword ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <svg 
                      className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                      />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                      />
                    </svg>
                  ) : (
                    <svg 
                      className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" 
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Lien mot de passe oublié */}
            {/* <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={isPending}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:text-gray-600"
                onClick={() => toast.error('Contactez l\'administrateur pour réinitialiser votre mot de passe')}
              >
                Mot de passe oublié ?
              </button>
            </div> */}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <svg 
                    className="animate-spin h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Connexion...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </button>

          
          </form>
        </div>

        {/* Footer avec informations de sécurité */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Connexion sécurisée • Vos données sont protégées
          </p>
        </div>
      </div>
    </div>
  )
}