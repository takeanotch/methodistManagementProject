
// // app/cabinet/membres/MembresCabinetList.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { updateMembreRole, toggleMembreActif } from '@/actions/cabinet-pastoral'
// import { getRolesCabinet } from '@/actions/cabinet-pastoral'
// import Link from 'next/link'
// import { MoreVertical, UserCheck, UserX, Loader2, User } from 'lucide-react'
// import toast from 'react-hot-toast'
// import { useRouter } from 'next/navigation'

// interface MembreCabinet {
//   id: number
//   fidele_id: number
//   paroisse_id: number
//   role_id: number | null
//   role_nom: string | null
//   role_label: string | null
//   est_actif: boolean
//   fidele_nom: string
//   fidele_prenom: string
//   fidele_contact: string | null
//   fidele_profile_img?: string | null
//   fidele_pasteur?: boolean
// }

// interface MembresCabinetListProps {
//   membres: MembreCabinet[]
//   paroisseId: number
//   paroisseNom: string
//   isCurrentYear: boolean
// }

// export default function MembresCabinetList({ 
//   membres: initialMembres,
//   paroisseId,
//   paroisseNom,
//   isCurrentYear
// }: MembresCabinetListProps) {
//   const router = useRouter()
//   const [membres, setMembres] = useState<MembreCabinet[]>(initialMembres)
//   const [roles, setRoles] = useState<any[]>([])
//   const [actionLoading, setActionLoading] = useState<number | null>(null)
//   const [menuOpen, setMenuOpen] = useState<number | null>(null)
//   const [editingRole, setEditingRole] = useState<number | null>(null)

//   useEffect(() => {
//     setMembres(initialMembres)
//     loadRoles()
//   }, [initialMembres])

//   async function loadRoles() {
//     const rolesList = await getRolesCabinet()
//     setRoles(rolesList)
//   }

//   const actifsList = membres.filter(m => m.est_actif === true)
//   const inactifsList = membres.filter(m => m.est_actif === false)

//   async function handleChangeRole(membreId: number, roleId: number | null) {
//     setActionLoading(membreId)
    
//     try {
//       const result = await updateMembreRole(membreId, roleId)

//       if (result.success) {
//         toast.success('Rôle mis à jour')
//         setMembres(prev => prev.map(m => 
//           m.id === membreId 
//             ? { ...m, role_id: roleId, role_label: roles.find(r => r.id === roleId)?.label_role || null }
//             : m
//         ))
//         setEditingRole(null)
//         router.refresh()
//       } else {
//         toast.error(result.error || 'Erreur')
//       }
//     } catch (error) {
//       toast.error('Une erreur est survenue')
//     } finally {
//       setActionLoading(null)
//     }
//   }

//   async function handleToggleActif(membre: MembreCabinet) {
//     const nouveauStatut = !membre.est_actif
//     const action = nouveauStatut ? 'réactiver' : 'désactiver'
    
//     if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${membre.fidele_prenom} ${membre.fidele_nom} ?`)) {
//       return
//     }

//     setActionLoading(membre.id)
    
//     try {
//       const result = await toggleMembreActif(membre.id, nouveauStatut)

//       if (result.success) {
//         toast.success(`Membre ${nouveauStatut ? 'réactivé' : 'désactivé'}`)
//         setMembres(prev => prev.map(m => 
//           m.id === membre.id ? { ...m, est_actif: nouveauStatut } : m
//         ))
//         setMenuOpen(null)
//         router.refresh()
//       } else {
//         toast.error(result.error || 'Erreur')
//       }
//     } catch (error) {
//       toast.error('Une erreur est survenue')
//     } finally {
//       setActionLoading(null)
//     }
//   }

//   // Fonction pour rendre l'avatar (image ou initiales)
//   function renderAvatar(membre: MembreCabinet, isInactive: boolean = false) {
//     if (membre.fidele_profile_img) {
//       return (
//         <img 
//           src={membre.fidele_profile_img} 
//           alt={`${membre.fidele_prenom} ${membre.fidele_nom}`}
//           className={`w-10 h-10 rounded-full object-cover shrink-0 ${isInactive ? 'opacity-60' : ''}`}
//         />
//       )
//     }
    
//     // Fallback : initiales
//     return (
//       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${
//         isInactive 
//           ? 'bg-gray-200 text-gray-400' 
//           : 'bg-gray-100 text-gray-500'
//       }`}>
//         {membre.fidele_prenom?.[0]}{membre.fidele_nom?.[0]}
//       </div>
//     )
//   }

//   if (!membres || membres.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <UserCheck size={48} className="mx-auto text-gray-300 mb-3" />
//         <p className="text-gray-400">Aucun membre dans le cabinet pastoral</p>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Membres actifs */}
//       {actifsList.length > 0 && (
//         <div className="space-y-3">
//           <div className="flex items-center gap-2 px-1">
//             <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membres actifs</h3>
//             <span className="bg-green-100 text-green-700 px-2 py-0.5 text-xs">
//               {actifsList.length}
//             </span>
//           </div>
//           <div className="space-y-">
//             {actifsList.map((membre) => (
//               <div
//                 key={membre.id}
//                 className="group flex items-center justify-between p-4 bg-white border-b border-gray-200 hover:border-gray-300 transition-colors"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   {renderAvatar(membre)}

//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <span className="text-sm font-medium text-gray-900">
//                         {membre.fidele_prenom} {membre.fidele_nom}
//                       </span>
                      
//                       {membre.fidele_pasteur && (
//                         <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 border border-purple-200">
//                           Pasteur
//                         </span>
//                       )}
                      
//                       {editingRole === membre.id && isCurrentYear ? (
//                         <select
//                           value={membre.role_id || ''}
//                           onChange={(e) => handleChangeRole(membre.id, e.target.value ? parseInt(e.target.value) : null)}
//                           disabled={actionLoading === membre.id}
//                           className="text-xs px-2 py-1 border border-gray-300 bg-white focus:outline-none focus:border-black"
//                           autoFocus
//                           onBlur={() => setEditingRole(null)}
//                         >
//                           <option value="">Sans rôle</option>
//                           {roles.map((role) => (
//                             <option key={role.id} value={role.id}>
//                               {role.label_role}
//                             </option>
//                           ))}
//                         </select>
//                       ) : (
//                         <button
//                           onClick={() => isCurrentYear && setEditingRole(membre.id)}
//                           className={`text-xs px-2 py-0.5 border ${
//                             membre.role_label 
//                               ? 'bg-purple-50 text-purple-700 border-purple-200' 
//                               : 'bg-gray-50 text-gray-500 border-gray-200'
//                           } ${isCurrentYear ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
//                           disabled={!isCurrentYear}
//                         >
//                           {membre.role_label || 'Sans rôle'}
//                         </button>
//                       )}
//                     </div>
//                     <div className="text-xs text-gray-400 mt-1.5">
//                       {membre.fidele_contact || 'Aucun contact'}
//                     </div>
//                   </div>
//                 </div>

//                 {isCurrentYear && (
//                   <div className="relative">
//                     <button
//                       onClick={() => setMenuOpen(menuOpen === membre.id ? null : membre.id)}
//                       className="p-2 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
//                     >
//                       <MoreVertical size={16} />
//                     </button>
                    
//                     {menuOpen === membre.id && (
//                       <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[160px]">
//                         <button
//                           onClick={() => handleToggleActif(membre)}
//                           disabled={actionLoading === membre.id}
//                           className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
//                         >
//                           {actionLoading === membre.id ? (
//                             <Loader2 size={14} className="animate-spin" />
//                           ) : (
//                             <UserX size={14} />
//                           )}
//                           Désactiver
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Anciens membres */}
//       {inactifsList.length > 0 && (
//         <div className="space-y-3 mt-8 pt-4 border-t border-gray-100">
//           <div className="flex items-center gap-2 px-1">
//             <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Historique</h3>
//             <span className="bg-gray-100 text-gray-500 px-2 py-0.5 text-xs">
//               {inactifsList.length}
//             </span>
//           </div>
//           <div className="space-y-2">
//             {inactifsList.map((membre) => (
//               <div
//                 key={membre.id}
//                 className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 opacity-75 hover:opacity-100 transition-opacity"
//               >
//                 <div className="flex items-center gap-3 flex-1">
//                   {renderAvatar(membre, true)}
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2 flex-wrap">
//                       <span className="text-sm text-gray-600">
//                         {membre.fidele_prenom} {membre.fidele_nom}
//                       </span>
//                       {membre.fidele_pasteur && (
//                         <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 border border-purple-100">
//                           Pasteur
//                         </span>
//                       )}
//                       {membre.role_label && (
//                         <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 border border-gray-300">
//                           {membre.role_label}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {isCurrentYear && (
//                   <div className="relative">
//                     <button
//                       onClick={() => setMenuOpen(menuOpen === membre.id ? null : membre.id)}
//                       className="p-2 text-gray-400 hover:text-black"
//                     >
//                       <MoreVertical size={14} />
//                     </button>
                    
//                     {menuOpen === membre.id && (
//                       <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[140px]">
//                         <button
//                           onClick={() => handleToggleActif(membre)}
//                           disabled={actionLoading === membre.id}
//                           className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
//                         >
//                           {actionLoading === membre.id ? (
//                             <Loader2 size={14} className="animate-spin" />
//                           ) : (
//                             <UserCheck size={14} />
//                           )}
//                           Réactiver
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
      
//       {menuOpen && (
//         <div
//           className="fixed inset-0 z-0"
//           onClick={() => setMenuOpen(null)}
//         />
//       )}
//     </div>
//   )
// }