// // components/ActiviteDistrictCard.tsx
// 'use client'

// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { Calendar, Clock, Edit2, Trash2, CheckCircle, XCircle, Clock as ClockIcon, AlertCircle } from 'lucide-react'
// import toast from 'react-hot-toast'

// interface ActiviteDistrictCardProps {
//   activite: {
//     id: number
//     titre: string
//     description: string | null
//     date: string
//     heure: string
//     statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
//     plan_action_id: number
//   }
//   canEdit?: boolean
//   onStatusChange?: () => void
//   basePath?: string
// }

// export default function ActiviteDistrictCard({ 
//   activite, 
//   canEdit = true, 
//   onStatusChange, 
//   basePath = '' 
// }: ActiviteDistrictCardProps) {
//   const router = useRouter()

//   const statusConfig = {
//     planifie: { label: 'Planifié', color: 'bg-blue-100 text-blue-700', icon: Calendar },
//     en_cours: { label: 'En cours', color: 'bg-yellow-100 text-yellow-700', icon: ClockIcon },
//     termine: { label: 'Terminé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
//     annule: { label: 'Annulé', color: 'bg-red-100 text-red-700', icon: XCircle }
//   }

//   const config = statusConfig[activite.statut]
//   const StatusIcon = config.icon

//   const isPast = new Date(activite.date) < new Date()
//   const isToday = new Date(activite.date).toDateString() === new Date().toDateString()
//   const isDelayed = isPast && activite.statut !== 'termine' && activite.statut !== 'annule'

//   const handleDelete = async () => {
//     if (!confirm('Supprimer cette activité ?')) return
//     try {
//       const { deleteActiviteDistrict } = await import('@/actions/activite-district')
//       const result = await deleteActiviteDistrict(activite.id)
//       if (result.error) {
//         toast.error(result.error)
//         console.error('Erreur suppression:', result.error)
//       } else {
//         toast.success('Activité supprimée')
//         router.refresh()
//         onStatusChange?.()
//       }
//     } catch (error) {
//       console.error('Erreur lors de la suppression:', error)
//       toast.error('Erreur lors de la suppression')
//     }
//   }

//   const handleStatusChange = async (newStatus: string) => {
//     try {
//       const { updateActiviteStatutDistrict } = await import('@/actions/activite-district')
//       const result = await updateActiviteStatutDistrict(activite.id, newStatus as any)
//       if (result.error) {
//         toast.error(result.error)
//         console.error('Erreur changement statut:', result.error)
//       } else {
//         toast.success('Statut modifié')
//         router.refresh()
//         onStatusChange?.()
//       }
//     } catch (error) {
//       console.error('Erreur lors du changement de statut:', error)
//       toast.error('Erreur lors du changement de statut')
//     }
//   }

//   const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
//   const editLink = basePath ? `${basePath}/activites/${activite.id}/edit` : `/district/activites/${activite.id}/edit`

//   return (
//     <div className={`group bg-white rounded-lg border transition-all ${isDelayed ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'} hover:shadow-md`}>
//       <div className="p-4">
//         <div className="flex items-start justify-between gap-3">
//           {/* Contenu principal */}
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 mb-2 flex-wrap">
//               <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
//                 <StatusIcon className="w-3 h-3" />
//                 {config.label}
//               </span>
//               {isToday && (
//                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
//                   <AlertCircle className="w-3 h-3" />
//                   Aujourd'hui
//                 </span>
//               )}
//               {isDelayed && (
//                 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
//                   <AlertCircle className="w-3 h-3" />
//                   Retard
//                 </span>
//               )}
//             </div>
            
//             <Link href={`/district/activites/${activite.id}`}>
//               <h3 className="font-medium text-gray-900 hover:text-indigo-600 transition-colors truncate">
//                 {activite.titre}
//               </h3>
//             </Link>
            
//             {activite.description && (
//               <p className="text-sm text-gray-500 mt-1 line-clamp-1">{activite.description}</p>
//             )}
            
//             <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
//               <span className="flex items-center gap-1">
//                 <Calendar className="w-3 h-3" />
//                 {formatDate(activite.date)}
//               </span>
//               <span className="flex items-center gap-1">
//                 <Clock className="w-3 h-3" />
//                 {activite.heure}
//               </span>
//             </div>
//           </div>

//           {/* Actions */}
//           {canEdit && activite.statut !== 'termine' && activite.statut !== 'annule' && (
//             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//               <select
//                 value={activite.statut}
//                 onChange={(e) => handleStatusChange(e.target.value)}
//                 className="text-xs border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
//               >
//                 <option value="planifie">Planifié</option>
//                 <option value="en_cours">En cours</option>
//                 <option value="termine">Terminé</option>
//                 <option value="annule">Annulé</option>
//               </select>
              
//               <Link href={editLink} className="p-1 text-gray-400 hover:text-indigo-600 transition-colors">
//                 <Edit2 className="w-4 h-4" />
//               </Link>
//               <button onClick={handleDelete} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
//                 <Trash2 className="w-4 h-4" />
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }