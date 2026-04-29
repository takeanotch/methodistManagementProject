// 'use client'

// import React from 'react'
// import { Filter } from 'lucide-react'

// interface AnneeSelectorProps {
//   currentAnneeId: number | null
//   anneesDisponibles: Array<{
//     id: number
//     label: string
//     is_current: boolean
//   }>
// }

// export default function AnneeSelector({ 
//   currentAnneeId,
//   anneesDisponibles 
// }: AnneeSelectorProps) {
//   const [selectedAnnee, setSelectedAnnee] = React.useState<string>(currentAnneeId?.toString() || '')
  
//   const handleAnneeChange = (anneeId: string) => {
//     setSelectedAnnee(anneeId)
//     const url = new URL(window.location.href)
//     if (anneeId) {
//       url.searchParams.set('annee_conference', anneeId)
//     } else {
//       url.searchParams.delete('annee_conference')
//     }
//     window.location.href = url.toString()
//   }
  
//   if (anneesDisponibles.length === 0) return null
  
//   return (
//     <div className="flex items-center gap-2">
//       <Filter className="w-4 h-4 text-gray-500" />
//       <select
//         value={selectedAnnee}
//         onChange={(e) => handleAnneeChange(e.target.value)}
//         className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
//       >
//         {anneesDisponibles.map((annee) => (
//           <option key={annee.id} value={annee.id}>
//             {annee.label} {annee.is_current && '(En cours)'}
//           </option>
//         ))}
//       </select>
//     </div>
//   )
// }