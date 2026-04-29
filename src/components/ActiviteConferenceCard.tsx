// // components/ActiviteConferenceCard.tsx
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { updateActiviteStatutConference, deleteActiviteConference } from '@/actions/activite-conference'

// interface ActiviteConferenceCardProps {
//   activite: {
//     id: number
//     titre: string
//     description?: string | null
//     date: string
//     heure: string
//     statut: string
//   }
//   canEdit: boolean
//   basePath: string
// }

// export default function ActiviteConferenceCard({ activite, canEdit, basePath }: ActiviteConferenceCardProps) {
//   const router = useRouter()
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
//   const [isUpdating, setIsUpdating] = useState(false)

//   const getStatutColor = (statut: string) => {
//     switch (statut) {
//       case 'planifie':
//         return 'bg-blue-100 text-blue-800'
//       case 'en_cours':
//         return 'bg-yellow-100 text-yellow-800'
//       case 'termine':
//         return 'bg-green-100 text-green-800'
//       case 'annule':
//         return 'bg-gray-100 text-gray-800'
//       default:
//         return 'bg-gray-100 text-gray-800'
//     }
//   }

//   const getStatutLabel = (statut: string) => {
//     switch (statut) {
//       case 'planifie':
//         return 'Planifiée'
//       case 'en_cours':
//         return 'En cours'
//       case 'termine':
//         return 'Terminée'
//       case 'annule':
//         return 'Annulée'
//       default:
//         return statut
//     }
//   }

//   const handleStatutChange = async (newStatut: string) => {
//     setIsUpdating(true)
//     const result = await updateActiviteStatutConference(
//       activite.id,
//       newStatut as 'planifie' | 'en_cours' | 'termine' | 'annule'
//     )
//     if (result.success) {
//       router.refresh()
//     }
//     setIsUpdating(false)
//   }

//   const handleDelete = async () => {
//     setIsUpdating(true)
//     const result = await deleteActiviteConference(activite.id)
//     if (result.success) {
//       router.refresh()
//     }
//     setShowDeleteConfirm(false)
//     setIsUpdating(false)
//   }

//   const formatDateTime = (date: string, heure: string) => {
//     const dateObj = new Date(date)
//     return `${dateObj.toLocaleDateString('fr-FR')} à ${heure.substring(0, 5)}`
//   }

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <Link
//             href={`${basePath}?modal=edit&activiteId=${activite.id}`}
//             className="group"
//           >
//             <h4 className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
//               {activite.titre}
//             </h4>
//           </Link>
//           {activite.description && (
//             <p className="text-sm text-gray-500 mt-1 line-clamp-2">
//               {activite.description}
//             </p>
//           )}
//           <div className="flex items-center gap-3 mt-2">
//             <span className="text-xs text-gray-400">
//               📅 {formatDateTime(activite.date, activite.heure)}
//             </span>
//             <span className={`text-xs px-2 py-1 rounded-full ${getStatutColor(activite.statut)}`}>
//               {getStatutLabel(activite.statut)}
//             </span>
//           </div>
//         </div>

//         {canEdit && (
//           <div className="flex items-center gap-1 ml-2">
//             {activite.statut !== 'termine' && activite.statut !== 'annule' && (
//               <select
//                 value={activite.statut}
//                 onChange={(e) => handleStatutChange(e.target.value)}
//                 disabled={isUpdating}
//                 className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
//               >
//                 <option value="planifie">Planifiée</option>
//                 <option value="en_cours">En cours</option>
//                 <option value="termine">Terminée</option>
//                 <option value="annule">Annulée</option>
//               </select>
//             )}
//             <Link
//               href={`${basePath}?modal=edit&activiteId=${activite.id}`}
//               className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
//               title="Modifier"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//               </svg>
//             </Link>
//             <button
//               onClick={() => setShowDeleteConfirm(true)}
//               className="p-1 text-gray-400 hover:text-red-600 transition-colors"
//               title="Supprimer"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//               </svg>
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Modal de confirmation de suppression */}
//       {showDeleteConfirm && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
//             <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmer la suppression</h3>
//             <p className="text-gray-600 mb-4">
//               Êtes-vous sûr de vouloir supprimer l'activité <strong>"{activite.titre}"</strong> ?
//               Cette action est irréversible.
//             </p>
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => setShowDeleteConfirm(false)}
//                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={handleDelete}
//                 disabled={isUpdating}
//                 className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
//               >
//                 {isUpdating ? 'Suppression...' : 'Supprimer'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }