// components/auth/Authorize.client.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, AlertCircle } from 'lucide-react'

interface AuthorizeClientProps {
  redirectTo?: string
  showUnauthorized?: boolean
  message?: string
  userRole?: string
  requiredRoles?: string[]
  requiredNiveaux?: string[]
  minNiveau?: string
}

export default function AuthorizeClient({
  redirectTo,
  showUnauthorized = false,
  message,
  userRole,
  requiredRoles,
  requiredNiveaux,
  minNiveau
}: AuthorizeClientProps) {
  const router = useRouter()

  useEffect(() => {
    if (redirectTo) {
      router.push(redirectTo)
    }
  }, [redirectTo, router])

  if (redirectTo) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin -full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  if (showUnauthorized) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white -lg shadow-lg border border-gray-200 overflow-hidden">
            {/* En-tête */}
            <div className="bg-red-50 px-6 py-4 border-b border-red-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Lock className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-red-900">
                    Accès non autorisé
                  </h2>
                  <p className="text-sm text-red-700 mt-0.5">
                    Vous n'avez pas les permissions nécessaires
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="px-6 py-5">
              {message ? (
                <p className="text-gray-700">{message}</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Votre rôle actuel
                      </p>
                      <span className="inline-flex items-center px-2.5 py-0.5 -full text-xs font-medium bg-gray-100 text-gray-800">
                        {userRole || 'Non défini'}
                      </span>
                    </div>
                  </div>

                  {(requiredRoles || requiredNiveaux || minNiveau) && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Accès requis :
                      </p>
                      <div className="space-y-2">
                        {requiredRoles && requiredRoles.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Rôle(s)</p>
                            <div className="flex flex-wrap gap-1">
                              {requiredRoles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center px-2 py-0.5 -full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {requiredNiveaux && requiredNiveaux.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Niveau(x)</p>
                            <div className="flex flex-wrap gap-1">
                              {requiredNiveaux.map((niveau) => (
                                <span
                                  key={niveau}
                                  className="inline-flex items-center px-2 py-0.5 -full text-xs font-medium bg-green-100 text-green-800 capitalize"
                                >
                                  {niveau}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {minNiveau && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Niveau minimum</p>
                            <span className="inline-flex items-center px-2 py-0.5 -full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                              {minNiveau}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex items-center gap-2 p-3 bg-amber-50 -lg border border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Contactez votre administrateur si vous pensez que c'est une erreur.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <button
                onClick={() => window.history.back()}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}