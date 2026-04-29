

// // components/AnneeDistrictDepartementGuard.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { getCurrentAnneeDistrict } from '@/actions/annee-district'
// import { Lock, Calendar } from 'lucide-react'

// interface AnneeDistrictDepartementGuardProps {
//   children: React.ReactNode
//   departementId: number
//   districtId: number
//   departementNom: string
//   redirectOnClosed?: boolean
//   fallbackUrl?: string
// }

// export default function AnneeDistrictDepartementGuard({
//   children,
//   departementId,
//   districtId,
//   departementNom,
//   redirectOnClosed = false,
//   fallbackUrl = '/paroisse/departements'
// }: AnneeDistrictDepartementGuardProps) {
//   const router = useRouter()
//   const [isOpen, setIsOpen] = useState<boolean | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const checkAnneeStatus = async () => {
//       try {
//         const result = await getCurrentAnneeDistrict(districtId, departementId)
//         setIsOpen(!!result)
//       } catch (error) {
//         console.error('Erreur vérification année district:', error)
//         setIsOpen(false)
//       } finally {
//         setLoading(false)
//       }
//     }

//     checkAnneeStatus()
//   }, [departementId, districtId])

//   // Redirection automatique si l'année est fermée
//   useEffect(() => {
//     if (!loading && isOpen === false && redirectOnClosed) {
//       const timer = setTimeout(() => {
//         router.push(fallbackUrl)
//       }, 5000)
      
//       return () => clearTimeout(timer)
//     }
//   }, [isOpen, loading, redirectOnClosed, router, fallbackUrl])

//   // Affichage pendant le chargement
//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <svg className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           <p className="text-sm text-gray-500">Vérification de l'année district...</p>
//         </div>
//       </div>
//     )
//   }

//   // Afficher le contenu si l'année est ouverte
//   if (isOpen) {
//     return <>{children}</>
//   }

//   // Message informatif quand l'année est fermée
//   return (
//     <div className="max-w-2xl mx-auto px-4 py-12">
//       <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200 p-8 shadow-sm">
//         <div className="text-center">
//           <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Lock size={32} className="text-gray-400" />
//           </div>
          
//           <h2 className="text-xl font-medium text-gray-900 mb-2">
//             Année district terminée
//           </h2>
          
//           <p className="text-gray-600 max-w-md mx-auto mb-4">
//             <span className="font-medium">{departementNom}</span> n'est pas accessible pour le moment.
//           </p>
          
//           <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
//             <div className="flex items-start gap-3">
//               <Calendar size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
//               <div className="text-left">
//                 <p className="text-sm text-amber-800 font-medium mb-1">
//                   En attente du lancement des activités du district
//                 </p>
//                 <p className="text-xs text-amber-700">
//                   L'interface sera disponible une fois que les activités du district seront lancées et qu'une année district sera définie comme "en cours".
//                 </p>
//               </div>
//             </div>
//           </div>

//           <p className="text-xs text-gray-400 mb-6">
//             Veuillez patienter ou contacter l'administrateur du district pour plus d'informations.
//           </p>

//           <Link
//             href={fallbackUrl}
//             className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
//           >
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//             </svg>
//             Retour aux départements
//           </Link>

//           {redirectOnClosed && (
//             <p className="text-xs text-gray-400 mt-4">
//               Redirection automatique dans 5 secondes...
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }


// components/AnneeDistrictDepartementGuard.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentAnneeDistrict } from '@/actions/annee-district'
import { Lock, Calendar } from 'lucide-react'

interface AnneeDistrictDepartementGuardProps {
  children: React.ReactNode
  departementId: number
  districtId: number
  departementNom: string
  redirectOnClosed?: boolean
  fallbackUrl?: string
}

export default function AnneeDistrictDepartementGuard({
  children,
  departementId,
  districtId,
  departementNom,
  redirectOnClosed = false,
  fallbackUrl = '/departement'
}: AnneeDistrictDepartementGuardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAnneeStatus = async () => {
      try {
        const result = await getCurrentAnneeDistrict(districtId, departementId)
        setIsOpen(!!result)
      } catch (error) {
        console.error('Erreur vérification année district:', error)
        setIsOpen(false)
      } finally {
        setLoading(false)
      }
    }

    checkAnneeStatus()
  }, [departementId, districtId])

  // Redirection automatique si l'année est fermée
  useEffect(() => {
    if (!loading && isOpen === false && redirectOnClosed) {
      const timer = setTimeout(() => {
        router.push(fallbackUrl)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, loading, redirectOnClosed, router, fallbackUrl])

  // Affichage pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <svg className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-sm text-gray-500">Vérification de l'année district...</p>
        </div>
      </div>
    )
  }

  // Afficher le contenu si l'année est ouverte
  if (isOpen) {
    return <>{children}</>
  }

  // Message informatif quand l'année est fermée
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="border border-gray-200 bg-white shadow-sm">
        {/* En-tête */}
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-gray-500" />
            <h2 className="text-base font-medium text-gray-900">
              Page Non Disponible pour le moment !
            </h2>
          </div>
        </div>
        
        {/* Corps */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-gray-600">
            Le département <span className="font-medium text-gray-900">{departementNom}</span> n'est pas accessible pour le moment.
          </p>
          
          <div className="bg-amber-50/50 border-l-4 border-amber-400 p-4">
            <div className="flex gap-3">
              <Calendar size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-amber-800">
                  En attente du lancement des activités du district
                </p>
                <p className="text-xs text-amber-700">
                  L'interface sera disponible une fois que les activités du district seront lancées et qu'une année district sera définie comme "en cours".
                </p>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-400">
            Veuillez patienter ou contacter l'administrateur du district pour plus d'informations.
          </p>
        </div>
        
        {/* Pied */}
        <div className="border-t border-gray-200 bg-gray-50/30 px-6 py-4 flex items-center justify-between">
          <Link
            href="/departement"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux départements
          </Link>
          
          {redirectOnClosed && (
            <p className="text-xs text-gray-400">
              Redirection automatique dans 5 secondes...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}