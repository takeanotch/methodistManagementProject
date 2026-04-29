// // app/conference/pasteurs/AnneeSelector.tsx
// 'use client'

// import { useRouter, usePathname, useSearchParams } from 'next/navigation'

// interface AnneeSelectorProps {
//   anneesDisponibles: Array<{
//     id: number
//     annee_id: number
//     annee: {
//       id: number
//       label: string
//     }
//     is_current: boolean
//   }>
//   anneeActuelle: number | null
// }

// export default function AnneeSelector({ anneesDisponibles, anneeActuelle }: AnneeSelectorProps) {
//   const router = useRouter()
//   const pathname = usePathname()
//   const searchParams = useSearchParams()

//   const handleAnneeChange = (anneeId: number) => {
//     const params = new URLSearchParams(searchParams.toString())
//     if (anneeId) {
//       params.set('annee', anneeId.toString())
//     } else {
//       params.delete('annee')
//     }
//     router.push(`${pathname}?${params.toString()}`)
//   }

//   // Trouver l'année actuelle pour l'affichage
//   const anneeCourante = anneesDisponibles.find(a => a.is_current)
//   const anneeSelectionnee = anneesDisponibles.find(a => a.annee_id === anneeActuelle)

//   return (
//     <div className="flex items-center justify-between flex-wrap gap-4">
//       <div className="flex items-center gap-2">
//         <span className="text-xs text-gray-400 uppercase tracking-wider">Filtrer par année :</span>
//         <div className="flex flex-wrap gap-2">
//           {anneesDisponibles.map((annee) => (
//             <button
//               key={annee.id}
//               onClick={() => handleAnneeChange(annee.annee_id)}
//               className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ${
//                 anneeActuelle === annee.annee_id
//                   ? 'bg-gray-900 text-white shadow-sm'
//                   : annee.is_current
//                   ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
//                   : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
//               }`}
//             >
//               {annee.annee?.label || `Année ${annee.annee_id}`}
//               {annee.is_current && (
//                 <span className="ml-2 text-xs opacity-70">(En cours)</span>
//               )}
//             </button>
//           ))}
//         </div>
//       </div>
      
//       {anneeSelectionnee && !anneeSelectionnee.is_current && anneeCourante && (
//         <button
//           onClick={() => handleAnneeChange(anneeCourante.annee_id)}
//           className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
//         >
//           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//           </svg>
//           Revenir à l'année en cours
//         </button>
//       )}
//     </div>
//   )
// }

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

interface AnneeSelectorProps {
  anneesDisponibles: Array<{
    id: number  // C'est l'ID de annee_conference
    annee_id: number
    annee: {
      id: number
      label: string
    }
    is_current: boolean
  }>
  anneeActuelle: number | null  // Maintenant c'est l'ID de annee_conference
}

export default function AnneeSelector({ anneesDisponibles, anneeActuelle }: AnneeSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleAnneeChange = (anneeConferenceId: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (anneeConferenceId) {
      params.set('annee', anneeConferenceId.toString())
    } else {
      params.delete('annee')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  // Trouver l'année en cours (basé sur is_current)
  const anneeCourante = anneesDisponibles.find(a => a.is_current)
  
  // Trouver l'année sélectionnée (basé sur l'ID de annee_conference)
  const anneeSelectionnee = anneesDisponibles.find(a => a.id === anneeActuelle)

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Filtrer par année :</span>
        <div className="flex flex-wrap gap-1">
          {anneesDisponibles.map((anneeConference) => (
            <button
              key={anneeConference.id}
              onClick={() => handleAnneeChange(anneeConference.id)}
              className={`px-4 py-2 text-sm transition-all duration-200 border ${
                anneeActuelle === anneeConference.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : anneeConference.is_current
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              {anneeConference.annee?.label || `Année ${anneeConference.annee_id}`}
              {anneeConference.is_current && (
                <span className="ml-2 text-xs opacity-70">(En cours)</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {anneeSelectionnee && !anneeSelectionnee.is_current && anneeCourante && (
        <button
          onClick={() => handleAnneeChange(anneeCourante.id)}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Revenir à l'année en cours
        </button>
      )}
    </div>
  )
}