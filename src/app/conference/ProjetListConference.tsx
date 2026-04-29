// // components/ProjetListForConference.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { getProjetsByUnite, updateProjet, deleteProjet, type Projet } from '@/actions/projet'
// import { formatCurrency } from '@/lib/currency'

// interface ProjetListForConferenceProps {
//     uniteId: number
//     anneeConferenceId?: number
//     onRefresh?: () => void
// }

// export function ProjetListForConference({ uniteId, anneeConferenceId, onRefresh }: ProjetListForConferenceProps) {
//     const [projets, setProjets] = useState<Projet[]>([])
//     const [loading, setLoading] = useState(true)
//     const [updatingId, setUpdatingId] = useState<number | null>(null)

//     useEffect(() => {
//         loadProjets()
//     }, [uniteId, anneeConferenceId])

//     async function loadProjets() {
//         setLoading(true)
//         const data = await getProjetsByUnite(uniteId, anneeConferenceId)
//         setProjets(data)
//         setLoading(false)
//     }

//     async function handleToggleStatut(projet: Projet) {
//         setUpdatingId(projet.id)
//         const newStatut = projet.statut === 'en_cours' ? 'termine' : 'en_cours'
//         const result = await updateProjet(projet.id, { statut: newStatut })
//         if (result.success) {
//             await loadProjets()
//             onRefresh?.()
//         } else {
//             alert(result.error)
//         }
//         setUpdatingId(null)
//     }

//     async function handleDelete(projet: Projet) {
//         if (confirm(`Supprimer le projet "${projet.nom}" ? Cette action est irréversible.`)) {
//             const result = await deleteProjet(projet.id)
//             if (result.success) {
//                 await loadProjets()
//                 onRefresh?.()
//             } else {
//                 alert(result.error)
//             }
//         }
//     }

//     function getTypeLabel(type: string): { label: string; color: string; icon: string } {
//         switch (type) {
//             case 'court_terme':
//                 return { label: 'Court terme', color: 'bg-blue-100 text-blue-700', icon: '📋' }
//             case 'moyen_terme':
//                 return { label: 'Moyen terme', color: 'bg-yellow-100 text-yellow-700', icon: '📊' }
//             case 'long_terme':
//                 return { label: 'Long terme', color: 'bg-purple-100 text-purple-700', icon: '🎯' }
//             default:
//                 return { label: type, color: 'bg-gray-100 text-gray-700', icon: '📌' }
//         }
//     }

//     if (loading) {
//         return (
//             <div className="text-center py-8">
//                 <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
//                 <p className="text-gray-500 mt-2">Chargement des projets...</p>
//             </div>
//         )
//     }

//     if (projets.length === 0) {
//         return (
//             <div className="text-center py-8 bg-gray-50 rounded-lg">
//                 <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
//                 </svg>
//                 <p className="text-gray-500">Aucun projet pour le moment</p>
//                 <p className="text-xs text-gray-400 mt-1">Cliquez sur + pour créer un projet</p>
//             </div>
//         )
//     }

//     return (
//         <div className="space-y-3">
//             {projets.map(projet => {
//                 const typeInfo = getTypeLabel(projet.type)
//                 const isUpdating = updatingId === projet.id

//                 return (
//                     <div
//                         key={projet.id}
//                         className={`bg-white border rounded-lg p-4 transition-all hover:shadow-sm ${
//                             projet.statut === 'termine' ? 'border-gray-200 bg-gray-50/30' : 'border-gray-200'
//                         }`}
//                     >
//                         <div className="flex flex-wrap items-start justify-between gap-3">
//                             <div className="flex-1 min-w-0">
//                                 <div className="flex items-center gap-2 flex-wrap">
//                                     <h3 className="font-medium text-gray-900">
//                                         {projet.nom}
//                                     </h3>
//                                     <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
//                                         {typeInfo.icon} {typeInfo.label}
//                                     </span>
//                                     <span className={`text-xs px-2 py-0.5 rounded-full ${
//                                         projet.statut === 'en_cours' 
//                                             ? 'bg-green-100 text-green-700' 
//                                             : 'bg-gray-100 text-gray-700'
//                                     }`}>
//                                         {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
//                                     </span>
//                                 </div>

//                                 {projet.description && (
//                                     <p className="text-sm text-gray-600 mt-2 line-clamp-2">
//                                         {projet.description}
//                                     </p>
//                                 )}

//                                 <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
//                                     <div className="flex items-center gap-1">
//                                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                                         </svg>
//                                         Début : {new Date(projet.date_debut).toLocaleDateString('fr-FR')}
//                                     </div>
//                                     {projet.date_fin && (
//                                         <div className="flex items-center gap-1">
//                                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                                             </svg>
//                                             Fin : {new Date(projet.date_fin).toLocaleDateString('fr-FR')}
//                                         </div>
//                                     )}
//                                     {projet.plan_action && (
//                                         <div className="flex items-center gap-1">
//                                             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
//                                             </svg>
//                                             Plan : {projet.plan_action.titre}
//                                         </div>
//                                     )}
//                                     {projet.budget && (
//                                         <div className="flex items-center gap-1">
//                                             <span className={projet.budget.type === 'recette' ? 'text-green-600' : 'text-red-600'}>
//                                                 {projet.budget.type === 'recette' ? '💰' : '💸'}
//                                             </span>
//                                             Budget : {projet.budget.libelle} ({formatCurrency(projet.budget.montant, projet.budget.currency as any)})
//                                         </div>
//                                     )}
//                                 </div>
//                             </div>

//                             <div className="flex items-center gap-2">
//                                 <button
//                                     onClick={() => handleToggleStatut(projet)}
//                                     disabled={isUpdating}
//                                     className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
//                                         projet.statut === 'en_cours'
//                                             ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                                             : 'bg-green-100 text-green-700 hover:bg-green-200'
//                                     } disabled:opacity-50`}
//                                 >
//                                     {isUpdating ? (
//                                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
//                                     ) : projet.statut === 'en_cours' ? (
//                                         '✅ Marquer terminé'
//                                     ) : (
//                                         '🔄 Rouvrir'
//                                     )}
//                                 </button>
//                                 <button
//                                     onClick={() => handleDelete(projet)}
//                                     className="p-2 text-gray-400 hover:text-red-500 transition-colors"
//                                     title="Supprimer"
//                                 >
//                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                                     </svg>
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )
//             })}
//         </div>
//     )
// }