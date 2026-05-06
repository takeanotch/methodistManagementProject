

// // app/admin/commissions/[id]/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { supabase } from '@/lib/supabase'
// import { updateCommission } from '@/actions/commissions'
// import { getFidelesByParoisse } from '@/actions/fidele'
// import { 
//   getAnneesConferenceDisponiblesForDepartement, 
//   getCurrentAnneeConferenceForDepartement,
//   addFideleToDepartement,
//   desactiverFideleFromDepartement,
//   deleteFideleFromDepartement,
//   getCurrentAnneeForDepartement,
//   getRolesByDepartement
// } from '@/actions/fidele-departement'
// import { Plus, Trash2, Users, X, Loader2, Search } from 'lucide-react'
// import toast from 'react-hot-toast'

// interface Fidele {
//   id: number
//   nom: string
//   post_nom: string
//   prenom: string
//   contact: string
//   telephone?: string
//   profile_img?: string
//   paroisse_id: number
//   actif?: boolean
// }

// interface Role {
//   id: number
//   nom: string
//   label: string
//   niveau: number
//   couleur: string
// }

// interface AnneeConference {
//   id: number
//   annee_id: number
//   label: string
//   is_current: boolean
// }

// interface MembreCommission {
//   id: number
//   fidele_id: number
//   commission_id: number
//   departement_id: number
//   role_id: number
//   annee_id: number
//   annee_conference_id: number
//   est_actif: boolean
//   fidele: Fidele
//   role_details?: Role
//   annee?: { id: number; label: string }
//   annee_conference?: AnneeConference
// }

// interface Commission {
//   id: number
//   nom: string
//   description: string | null
//   paroisse_id: number
//   departement_id: number
//   paroisse?: { id: number; nom: string }
//   departement?: { id: number; nom: string; roles_config: Role[] }
//   membres: MembreCommission[]
// }

// export default function CommissionDetailPage() {
//   const params = useParams()
//   const router = useRouter()
//   const [commission, setCommission] = useState<Commission | null>(null)
//   const [fideles, setFideles] = useState<Fidele[]>([])
//   const [roles, setRoles] = useState<Role[]>([])
//   const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
//   const [anneeEnCours, setAnneeEnCours] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [showModal, setShowModal] = useState(false)
//   const [showFideleSelector, setShowFideleSelector] = useState(false)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [fideleSearchTerm, setFideleSearchTerm] = useState('')
//   const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
//   const [selectedRole, setSelectedRole] = useState<Role | null>(null)
//   const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
//   const [isEditing, setIsEditing] = useState(false)
//   const [editNom, setEditNom] = useState('')
//   const [editDescription, setEditDescription] = useState('')
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [actionLoading, setActionLoading] = useState<number | null>(null)

//   useEffect(() => {
//     loadCommission()
//   }, [])

//   async function loadCommission() {
//     setLoading(true)
    
//     const commissionId = parseInt(params.id as string)
//     console.log('🔍 [DEBUG] Chargement commission ID:', commissionId)
    
//     try {
//       // 1. Récupérer la commission
//       const { data: commissionData, error: commissionError } = await supabase
//         .from('commission')
//         .select(`
//           id,
//           nom,
//           description,
//           paroisse_id,
//           departement_id,
//           paroisse:paroisse_id (id, nom),
//           departement:departement_id (id, nom, roles_config)
//         `)
//         .eq('id', commissionId)
//         .single()

//       if (commissionError) {
//         console.error('❌ [DEBUG] Erreur chargement commission:', commissionError)
//         toast.error('Erreur lors du chargement de la commission')
//         setLoading(false)
//         return
//       }

//       console.log('✅ [DEBUG] Commission chargée:', {
//         id: commissionData.id,
//         nom: commissionData.nom,
//         departement_id: commissionData.departement_id,
//         paroisse_id: commissionData.paroisse_id
//       })

//       const paroisse = Array.isArray(commissionData.paroisse) 
//         ? commissionData.paroisse[0] 
//         : commissionData.paroisse
      
//       const departement = Array.isArray(commissionData.departement) 
//         ? commissionData.departement[0] 
//         : commissionData.departement

//       // 2. Récupérer les membres - APPROCHE SIMPLIFIÉE ET FONCTIONNELLE
//       let membres: MembreCommission[] = []
      
//       if (commissionData.departement_id) {
//         console.log('🔍 [DEBUG] Récupération des membres...')
        
//         // Requête simple sans jointure complexe
//         const { data: membresData, error: membresError } = await supabase
//           .from('fidele_departement')
//           .select('*')
//           .eq('departement_id', commissionData.departement_id)
        
//         if (membresError) {
//           console.error('❌ Erreur récupération membres:', membresError)
//         } else if (membresData && membresData.length > 0) {
//           console.log(`✅ ${membresData.length} enregistrements trouvés dans fidele_departement`)
          
//           // Filtrer par commission_id si la colonne existe
//           const filteredData = membresData.filter((item: any) => {
//             // Si commission_id existe, filtrer par cette valeur
//             if (item.commission_id !== undefined) {
//               return item.commission_id === commissionId
//             }
//             // Sinon, on prend tout (à adapter selon votre logique)
//             return true
//           })
          
//           console.log(`✅ ${filteredData.length} membres après filtrage par commission`)
          
//           if (filteredData.length > 0) {
//             // Récupérer les fidèles séparément
//             const fideleIds = filteredData.map((item: any) => item.fidele_id).filter(Boolean)
//             console.log('📊 IDs des fidèles:', fideleIds)
            
//             const { data: fidelesData } = await supabase
//               .from('fidele')
//               .select('*')
//               .in('id', fideleIds)
            
//             console.log(`✅ ${fidelesData?.length || 0} fidèles récupérés`)
            
//             // Récupérer les années
//             const anneeIds = filteredData.map((item: any) => item.annee_id).filter(Boolean)
//             const { data: anneesData } = await supabase
//               .from('annee')
//               .select('*')
//               .in('id', anneeIds)
            
//             // Créer des maps pour un accès rapide
//             const fidelesMap = new Map()
//             if (fidelesData) {
//               fidelesData.forEach((f: any) => fidelesMap.set(f.id, f))
//             }
            
//             const anneesMap = new Map()
//             if (anneesData) {
//               anneesData.forEach((a: any) => anneesMap.set(a.id, a))
//             }
            
//             // Construire les membres
//             membres = filteredData.map((item: any) => {
//               const fidele = fidelesMap.get(item.fidele_id) || {}
//               const annee = anneesMap.get(item.annee_id)
              
//               const roleDetails = departement?.roles_config?.find(
//                 (r: Role) => r.id === item.role_id
//               )
              
//               return {
//                 id: item.id,
//                 fidele_id: item.fidele_id,
//                 commission_id: item.commission_id || commissionId,
//                 departement_id: item.departement_id,
//                 role_id: item.role_id,
//                 annee_id: item.annee_id,
//                 annee_conference_id: item.annee_conference_id,
//                 est_actif: item.est_actif,
//                 fidele: {
//                   id: fidele.id || 0,
//                   nom: fidele.nom || '',
//                   post_nom: fidele.post_nom || '',
//                   prenom: fidele.prenom || '',
//                   contact: fidele.contact || fidele.telephone || '',
//                   telephone: fidele.telephone || '',
//                   profile_img: fidele.profile_img,
//                   paroisse_id: commissionData.paroisse_id
//                 },
//                 role_details: roleDetails,
//                 annee: annee
//               }
//             })
            
//             console.log(`✅ ${membres.length} membres construits`)
//           }
//         }
//       }

//       const fullCommission: Commission = {
//         ...commissionData,
//         paroisse,
//         departement,
//         membres
//       }

//       setCommission(fullCommission)
      
//       // 3. Charger les données auxiliaires
//       await loadAuxiliaryData(commissionData)
      
//     } catch (error) {
//       console.error('❌ [DEBUG] Exception dans loadCommission:', error)
//       toast.error('Une erreur est survenue')
//     }
    
//     setLoading(false)
//   }

//   async function loadAuxiliaryData(commissionData: any) {
//     try {
//       // Charger les fidèles de la paroisse
//       console.log('📦 Chargement des fidèles pour la paroisse:', commissionData.paroisse_id)
//       const fidelesData = await getFidelesByParoisse(commissionData.paroisse_id)
//       const fidelesActifs = fidelesData.filter((f: Fidele) => f.actif !== false)
//       setFideles(fidelesActifs)
//       console.log(`✅ ${fidelesActifs.length} fidèles chargés`)

//       // Charger les rôles du département
//       if (commissionData.departement_id) {
//         console.log('📦 Chargement des rôles pour le département:', commissionData.departement_id)
//         const rolesData = await getRolesByDepartement(commissionData.departement_id)
//         setRoles(rolesData || [])
//         console.log(`✅ ${rolesData?.length || 0} rôles chargés`)

//         // Charger les années de conférence
//         console.log('📦 Chargement des années de conférence...')
//         const annees = await getAnneesConferenceDisponiblesForDepartement(
//           commissionData.departement_id
//         )
//         setAnneesConference(annees)
//         console.log(`✅ ${annees.length} années de conférence chargées`)

//         // Définir l'année en cours par défaut
//         const currentAnnee = await getCurrentAnneeConferenceForDepartement(
//           commissionData.departement_id
//         )
//         if (currentAnnee) {
//           setSelectedAnneeConference(currentAnnee)
//           console.log(`✅ Année en cours sélectionnée: ${currentAnnee.label}`)
//         } else if (annees.length > 0) {
//           setSelectedAnneeConference(annees[0])
//           console.log(`⚠️ Première année sélectionnée: ${annees[0].label}`)
//         }

//         // Récupérer l'année de base en cours
//         const anneeEnCoursData = await getCurrentAnneeForDepartement(
//           commissionData.departement_id
//         )
//         setAnneeEnCours(anneeEnCoursData)
//       }
//     } catch (error) {
//       console.error('❌ Erreur chargement données auxiliaires:', error)
//     }
//   }

//   // Filtrer les fidèles par recherche
//   const filteredFideles = fideles.filter(fidele => {
//     const fullName = `${fidele.nom || ''} ${fidele.post_nom || ''} ${fidele.prenom || ''}`.toLowerCase()
//     const searchLower = fideleSearchTerm.toLowerCase()
//     return fullName.includes(searchLower) ||
//            (fidele.contact || '').toLowerCase().includes(searchLower) ||
//            (fidele.telephone || '').toLowerCase().includes(searchLower)
//   })

//   async function handleAddMember(e: React.FormEvent) {
//     e.preventDefault()
    
//     if (!selectedFidele) {
//       toast.error('Veuillez sélectionner un fidèle')
//       return
//     }
    
//     if (!selectedRole) {
//       toast.error('Veuillez sélectionner un rôle')
//       return
//     }

//     if (!anneeEnCours) {
//       toast.error('Aucune année en cours disponible')
//       return
//     }

//     if (!selectedAnneeConference) {
//       toast.error('Veuillez sélectionner une année de conférence')
//       return
//     }

//     setIsSubmitting(true)
    
//     const formData = new FormData()
//     formData.append('fidele_id', selectedFidele.id.toString())
//     formData.append('departement_id', commission!.departement_id.toString())
//     formData.append('role_id', selectedRole.id.toString())
//     formData.append('annee_id', anneeEnCours.id.toString())
//     formData.append('annee_conference_id', selectedAnneeConference.id.toString())
//     formData.append('paroisse_id', commission!.paroisse_id.toString())
//     formData.append('commission_id', params.id as string)

//     console.log('📤 [DEBUG] Ajout membre avec données:', {
//       fidele_id: selectedFidele.id,
//       departement_id: commission!.departement_id,
//       role_id: selectedRole.id,
//       annee_id: anneeEnCours.id,
//       annee_conference_id: selectedAnneeConference.id,
//       commission_id: params.id
//     })

//     const result = await addFideleToDepartement(formData)

//     if (result.success) {
//       toast.success(`${selectedFidele.nom} ${selectedFidele.prenom} a été ajouté`)
//       setShowModal(false)
//       resetAddForm()
//       await loadCommission()
//     } else {
//       toast.error(result.error || 'Erreur lors de l\'ajout')
//     }
//     setIsSubmitting(false)
//   }

//   function resetAddForm() {
//     setSelectedFidele(null)
//     setSelectedRole(null)
//     setFideleSearchTerm('')
//     setShowFideleSelector(false)
//   }

//   async function handleDesactiver(memberId: number, fideleNom: string) {
//     if (!confirm(`Désactiver ${fideleNom} de cette commission ?`)) return
    
//     setActionLoading(memberId)
//     const result = await desactiverFideleFromDepartement(memberId)
    
//     if (result.success) {
//       toast.success(`${fideleNom} a été désactivé`)
//       await loadCommission()
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//     setActionLoading(null)
//   }

//   async function handleDelete(memberId: number, fideleNom: string) {
//     if (!confirm(`Supprimer définitivement ${fideleNom} de cette commission ?`)) return
    
//     setActionLoading(memberId)
//     const result = await deleteFideleFromDepartement(memberId)
    
//     if (result.success) {
//       toast.success(`${fideleNom} a été supprimé`)
//       await loadCommission()
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//     setActionLoading(null)
//   }

//   async function handleUpdateCommission(e: React.FormEvent) {
//     e.preventDefault()
//     const formData = new FormData()
//     formData.append('id', params.id as string)
//     formData.append('nom', editNom)
//     formData.append('description', editDescription)

//     const result = await updateCommission(formData)
//     if (result.success) {
//       toast.success('Commission modifiée')
//       setIsEditing(false)
//       await loadCommission()
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//   }

//   if (loading) return (
//     <div className="flex justify-center py-20">
//       <div className="text-gray-400">Chargement...</div>
//     </div>
//   )

//   if (!commission) return (
//     <div className="p-8 text-center">
//       <p className="text-gray-500">Commission non trouvée</p>
//       <button onClick={() => router.back()} className="mt-4 text-black underline">
//         Retour
//       </button>
//     </div>
//   )

//   const membresActifs = commission.membres?.filter((m) => m.est_actif) || []
//   const membresInactifs = commission.membres?.filter((m) => !m.est_actif) || []

//   return (
//     <div className="p-8 max-w-6xl mx-auto">
//       {/* Header */}
//       <div className="mb-8">
//         <button onClick={() => router.back()} className="text-gray-500 hover:text-black mb-4">
//           ← Retour
//         </button>
        
//         {isEditing ? (
//           <form onSubmit={handleUpdateCommission} className="border border-gray-200 p-4">
//             <input
//               type="text"
//               value={editNom}
//               onChange={(e) => setEditNom(e.target.value)}
//               className="w-full border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:border-black"
//               required
//             />
//             <textarea
//               value={editDescription}
//               onChange={(e) => setEditDescription(e.target.value)}
//               className="w-full border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:border-black"
//               rows={2}
//               placeholder="Description..."
//             />
//             <div className="flex gap-2">
//               <button type="submit" className="px-4 py-2 bg-black text-white hover:bg-gray-800">
//                 Enregistrer
//               </button>
//               <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 hover:border-black">
//                 Annuler
//               </button>
//             </div>
//           </form>
//         ) : (
//           <div className="flex justify-between items-start">
//             <div>
//               <h1 className="text-2xl font-light tracking-wide">{commission.nom}</h1>
//               {commission.description && (
//                 <p className="text-gray-500 text-sm mt-2">{commission.description}</p>
//               )}
//               <div className="flex gap-4 mt-3 text-sm text-gray-400">
//                 <span>{commission.departement?.nom}</span>
//                 <span>•</span>
//                 <span>{commission.paroisse?.nom}</span>
//               </div>
//             </div>
//             <button
//               onClick={() => {
//                 setEditNom(commission.nom)
//                 setEditDescription(commission.description || '')
//                 setIsEditing(true)
//               }}
//               className="px-3 py-1 border border-gray-300 hover:border-black text-sm"
//             >
//               Modifier
//             </button>
//           </div>
//         )}
//       </div>
// {/* Navigation secondaire - Tabs */}
// <div className="flex gap-6 mb-6 border-b border-gray-200">
//   <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
//     Membres
//   </span>
//   <button
//     onClick={() => router.push(`/paroisse/commissions/${params.id}/activites`)}
//     className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//   >
//     Activités
//   </button>
//   <button
//     onClick={() => router.push(`/paroisse/commissions/${params.id}/plans-action`)}
//     className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//   >
//     Plans d&apos;action
//   </button>
//   <button
//     onClick={() => router.push(`/paroisse/commissions/${params.id}/budget`)}
//     className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//   >
//     Budget
//   </button>
// </div>
//       {/* Stats */}
//       <div className="grid grid-cols-3 gap-4 mb-8">
//         <div className="border border-gray-200 p-4">
//           <div className="text-2xl font-light">{membresActifs.length}</div>
//           <div className="text-xs text-gray-500 mt-1">Actifs</div>
//         </div>
//         <div className="border border-gray-200 p-4">
//           <div className="text-2xl font-light">{membresInactifs.length}</div>
//           <div className="text-xs text-gray-500 mt-1">Inactifs</div>
//         </div>
//         <div className="border border-gray-200 p-4">
//           <div className="text-2xl font-light">{roles.length}</div>
//           <div className="text-xs text-gray-500 mt-1">Rôles</div>
//         </div>
//       </div>

//       {/* Année conférence courante */}
//       {anneesConference.length > 0 && (
//         <div className="mb-6 text-sm text-gray-500 border-b border-gray-100 pb-4">
//           Année conférence :{' '}
//           <span className="text-black font-medium">
//             {anneesConference.find(a => a.is_current)?.label || anneesConference[0]?.label}
//           </span>
//         </div>
//       )}

//       {/* Membres Actifs */}
//       <div className="mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-light tracking-wide">Membres actifs</h2>
//           <button
//             onClick={() => setShowModal(true)}
//             className="flex items-center gap-2 px-3 py-1 bg-black text-white text-sm hover:bg-gray-800"
//           >
//             <Plus size={16} />
//             Ajouter
//           </button>
//         </div>

//         {membresActifs.length === 0 ? (
//           <div className="border border-gray-200 py-12 text-center">
//             <Users size={32} className="mx-auto text-gray-300 mb-2" />
//             <p className="text-gray-400 text-sm">Aucun membre actif</p>
//           </div>
//         ) : (
//           <div className="border border-gray-200">
//             <table className="w-full">
//               <thead className="bg-gray-50 border-b border-gray-200">
//                 <tr>
//                   <th className="text-left p-3 text-sm font-medium text-gray-500">Membre</th>
//                   <th className="text-left p-3 text-sm font-medium text-gray-500">Rôle</th>
//                   <th className="text-left p-3 text-sm font-medium text-gray-500">Année</th>
//                   <th className="text-center p-3 text-sm font-medium text-gray-500"></th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {membresActifs.map((member: MembreCommission) => {
//                   const role = member.role_details
//                   const fideleNom = `${member.fidele?.nom || ''} ${member.fidele?.post_nom || ''} ${member.fidele?.prenom || ''}`.trim()
//                   const anneeLabel = member.annee?.label || '-'
                  
//                   return (
//                     <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
//                       <td className="p-3">
//                         <div className="flex items-center gap-3">
//                           {member.fidele?.profile_img ? (
//                             <img
//                               src={member.fidele.profile_img}
//                               alt=""
//                               className="w-8 h-8 rounded-full object-cover"
//                             />
//                           ) : (
//                             <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
//                               {member.fidele?.nom?.[0] || '?'}
//                             </div>
//                           )}
//                           <div>
//                             <div className="font-medium text-sm">{fideleNom || 'Sans nom'}</div>
//                             <div className="text-xs text-gray-400">{member.fidele?.contact || member.fidele?.telephone || '-'}</div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="p-3">
//                         <span 
//                           className="text-xs px-2 py-0.5 border"
//                           style={{ 
//                             borderColor: role?.couleur || '#ccc',
//                             color: role?.couleur || '#666'
//                           }}
//                         >
//                           {role?.label || 'Membre'}
//                         </span>
//                       </td>
//                       <td className="p-3">
//                         <span className="text-xs text-gray-500">{anneeLabel}</span>
//                       </td>
//                       <td className="p-3 text-center">
//                         <div className="flex justify-center gap-2">
//                           <button
//                             onClick={() => handleDesactiver(member.id, fideleNom)}
//                             disabled={actionLoading === member.id}
//                             className="text-gray-400 hover:text-orange-500"
//                             title="Désactiver"
//                           >
//                             {actionLoading === member.id ? (
//                               <Loader2 size={16} className="animate-spin" />
//                             ) : (
//                               <X size={16} />
//                             )}
//                           </button>
//                           <button
//                             onClick={() => handleDelete(member.id, fideleNom)}
//                             disabled={actionLoading === member.id}
//                             className="text-gray-400 hover:text-red-500"
//                             title="Supprimer"
//                           >
//                             <Trash2 size={16} />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Membres Inactifs (Historique) */}
//       {membresInactifs.length > 0 && (
//         <div className="mt-8 pt-4 border-t border-gray-100">
//           <h3 className="text-sm font-light text-gray-400 mb-3">Historique</h3>
//           <div className="space-y-2">
//             {membresInactifs.map((member: MembreCommission) => {
//               const role = member.role_details
//               const fideleNom = `${member.fidele?.nom || ''} ${member.fidele?.post_nom || ''} ${member.fidele?.prenom || ''}`.trim()
//               const anneeLabel = member.annee?.label || '-'
              
//               return (
//                 <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100">
//                   <div className="flex items-center gap-3 flex-1">
//                     {member.fidele?.profile_img ? (
//                       <img
//                         src={member.fidele.profile_img}
//                         alt=""
//                         className="w-8 h-8 rounded-full object-cover"
//                       />
//                     ) : (
//                       <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
//                         {member.fidele?.nom?.[0] || '?'}
//                       </div>
//                     )}
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 flex-wrap">
//                         <span className="text-sm text-gray-600">{fideleNom}</span>
//                         <span className="text-xs px-2 py-0.5 border border-gray-200 text-gray-500">
//                           {role?.label || 'Membre'}
//                         </span>
//                         <span className="text-xs text-gray-400">{anneeLabel}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <button
//                     onClick={() => handleDelete(member.id, fideleNom)}
//                     disabled={actionLoading === member.id}
//                     className="text-gray-300 hover:text-red-500 text-sm"
//                   >
//                     {actionLoading === member.id ? (
//                       <Loader2 size={14} className="animate-spin" />
//                     ) : (
//                       'Supprimer'
//                     )}
//                   </button>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       )}

//       {/* Modal d'ajout de membre */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <h3 className="text-lg font-light">Ajouter un membre</h3>
//               <button
//                 onClick={() => {
//                   setShowModal(false)
//                   resetAddForm()
//                 }}
//                 className="text-gray-400 hover:text-black"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               {/* Sélection du fidèle */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Fidèle *</label>
                
//                 {!showFideleSelector && !selectedFidele ? (
//                   <button
//                     type="button"
//                     onClick={() => setShowFideleSelector(true)}
//                     className="w-full px-4 py-3 border border-gray-300 text-left text-sm text-gray-400 hover:text-gray-600 hover:border-black transition-colors"
//                   >
//                     + Sélectionner un fidèle
//                   </button>
//                 ) : showFideleSelector ? (
//                   <div className="border border-gray-200">
//                     <div className="p-2 border-b border-gray-100">
//                       <div className="relative">
//                         <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                         <input
//                           type="text"
//                           placeholder="Rechercher par nom ou contact..."
//                           value={fideleSearchTerm}
//                           onChange={(e) => setFideleSearchTerm(e.target.value)}
//                           className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
//                           autoFocus
//                         />
//                       </div>
//                     </div>
//                     <div className="max-h-64 overflow-y-auto">
//                       {filteredFideles.length === 0 ? (
//                         <p className="text-center text-gray-400 py-6 text-sm">Aucun fidèle trouvé</p>
//                       ) : (
//                         filteredFideles.map((fidele) => (
//                           <button
//                             key={fidele.id}
//                             type="button"
//                             onClick={() => {
//                               setSelectedFidele(fidele)
//                               setShowFideleSelector(false)
//                               setFideleSearchTerm('')
//                             }}
//                             className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
//                           >
//                             {fidele.profile_img ? (
//                               <img
//                                 src={fidele.profile_img}
//                                 alt=""
//                                 className="w-10 h-10 rounded-full object-cover"
//                               />
//                             ) : (
//                               <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
//                                 {fidele.nom?.[0]}{fidele.prenom?.[0]}
//                               </div>
//                             )}
//                             <div className="flex-1 min-w-0">
//                               <p className="text-sm font-medium text-gray-900 truncate">
//                                 {fidele.nom} {fidele.post_nom} {fidele.prenom}
//                               </p>
//                               <p className="text-xs text-gray-500">{fidele.contact || fidele.telephone}</p>
//                             </div>
//                           </button>
//                         ))
//                       )}
//                     </div>
//                     <div className="p-2 border-t border-gray-100">
//                       <button
//                         type="button"
//                         onClick={() => {
//                           setShowFideleSelector(false)
//                           setFideleSearchTerm('')
//                         }}
//                         className="w-full px-4 py-2 border border-gray-300 text-gray-600 text-sm hover:border-black"
//                       >
//                         Annuler
//                       </button>
//                     </div>
//                   </div>
//                 ) : selectedFidele && (
//                   <div className="flex items-center justify-between p-3 border border-gray-200">
//                     <div className="flex items-center gap-3">
//                       {selectedFidele.profile_img ? (
//                         <img
//                           src={selectedFidele.profile_img}
//                           alt=""
//                           className="w-10 h-10 rounded-full object-cover"
//                         />
//                       ) : (
//                         <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
//                           {selectedFidele.nom?.[0]}
//                         </div>
//                       )}
//                       <div>
//                         <p className="text-sm font-medium">
//                           {selectedFidele.nom} {selectedFidele.post_nom} {selectedFidele.prenom}
//                         </p>
//                         <p className="text-xs text-gray-400">{selectedFidele.contact || selectedFidele.telephone}</p>
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setSelectedFidele(null)
//                         setShowFideleSelector(true)
//                       }}
//                       className="text-xs text-gray-400 hover:text-black"
//                     >
//                       Changer
//                     </button>
//                   </div>
//                 )}
//               </div>

//               {/* Sélection du rôle */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Rôle *</label>
//                 <select
//                   value={selectedRole?.id || ''}
//                   onChange={(e) => {
//                     const roleId = parseInt(e.target.value)
//                     const role = roles.find(r => r.id === roleId)
//                     setSelectedRole(role || null)
//                   }}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   required
//                 >
//                   <option value="">Sélectionner un rôle</option>
//                   {roles.map((role) => (
//                     <option key={role.id} value={role.id}>
//                       {role.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Sélection année conférence */}
//               <div>
//                 <label className="block text-sm font-medium mb-1">Année conférence *</label>
//                 <select
//                   value={selectedAnneeConference?.id || ''}
//                   onChange={(e) => {
//                     const acId = parseInt(e.target.value)
//                     const ac = anneesConference.find(a => a.id === acId)
//                     setSelectedAnneeConference(ac || null)
//                   }}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   required
//                 >
//                   <option value="">Sélectionner une année</option>
//                   {anneesConference.map((annee) => (
//                     <option key={annee.id} value={annee.id}>
//                       {annee.label} {annee.is_current ? '(en cours)' : ''}
//                     </option>
//                   ))}
//                 </select>
//                 {anneesConference.length === 0 && (
//                   <p className="text-xs text-amber-600 mt-1">
//                     Aucune année de conférence configurée pour ce département
//                   </p>
//                 )}
//               </div>
//             </div>

//             {/* Footer avec boutons */}
//             <div className="p-4 border-t border-gray-200">
//               <div className="flex gap-3">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowModal(false)
//                     resetAddForm()
//                   }}
//                   className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleAddMember}
//                   disabled={isSubmitting || !selectedFidele || !selectedRole || !selectedAnneeConference}
//                   className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//                 >
//                   {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Ajouter'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// app/paroisse/commissions/[id]/page.tsx
import { getCurrentFidele } from '@/actions/auth'
import { 
  getCommissionUnite, 
  ensureCommissionUniteExists 
} from '@/actions/unite-organisation'
import { getActivitesByCommission, getActivitesStatsForCommission } from '@/actions/activite-commission'
import { getBudgetsByCommission, getBudgetSummaryForCommission, getRealiseTotalsForCommission } from '@/actions/budget-commission'
import { getPlansActionByCommission, getPlansActionStatsForCommission } from '@/actions/plan-action-commission'
import { getAnneesConferenceForCommission } from '@/actions/activite-commission'
import { getProjetsByUnite, getProjetsStats } from '@/actions/projet'
import { redirect } from 'next/navigation'
import { ConfigButton } from '@/components/ConfigButton'
import { getConfiguration } from '@/actions/configurations'
import { supabase } from '@/lib/supabase'
import { CommissionProjetsClient } from './projets/CommissionProjetsClient'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'
import { 
  ChevronLeft, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Users,
  Target,
  Wallet
} from 'lucide-react'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ annee_conference?: string }>
}

// Composant squelette pour le chargement
function CommissionApercuSkeleton() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 w-64 mb-4"></div>
        <div className="h-4 bg-gray-200 w-48 mb-8"></div>
        <div className="grid grid-cols-6 gap-3 mb-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-20 bg-gray-100 border border-gray-200"></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Composant pour le contenu principal
async function CommissionContent({ 
  commissionId, 
  paroisseId,
  anneeConferenceParam 
}: { 
  commissionId: number
  paroisseId: number
  anneeConferenceParam?: string
}) {
  // Récupération de la commission
  const { data: commission, error: commissionError } = await supabase
    .from('commission')
    .select(`
      id,
      nom,
      description,
      departement_id,
      paroisse_id,
      departement:departement_id (id, nom),
      paroisse:paroisse_id (id, nom)
    `)
    .eq('id', commissionId)
    .single()
  
  if (commissionError || !commission) {
    redirect('/paroisse/commissions')
  }
  
  // Récupération des années de conférence
  const anneesDisponibles = await getAnneesConferenceForCommission(commissionId)
  const anneeEnCours = anneesDisponibles.find(a => a.is_current) || anneesDisponibles[0]
  
  // Gestion de l'année sélectionnée
  let anneeConferenceId: number | null = null
  
  if (anneeConferenceParam) {
    anneeConferenceId = parseInt(anneeConferenceParam)
    const anneeExiste = anneesDisponibles.some(a => a.id === anneeConferenceId)
    if (!anneeExiste) {
      anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
    }
  } else {
    anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
  }
  
  // Remplacer cette partie dans CommissionContent :

// ========== CRÉATION AUTOMATIQUE DE L'UNITÉ SI ELLE N'EXISTE PAS ==========
let unite = await getCommissionUnite(commissionId, paroisseId)

if (!unite) {
  console.log('🔄 Unité de commission non trouvée, tentative de création automatique...')
  
  // Récupérer le departement_id de la commission
  const { data: commissionData } = await supabase
    .from('commission')
    .select('departement_id')
    .eq('id', commissionId)
    .single()
  
  if (commissionData?.departement_id) {
    const creationResult = await ensureCommissionUniteExists(
      commissionId, 
      commissionData.departement_id,  // ← 2ème argument manquant
      paroisseId                       // ← 3ème argument
    )
    
    if (creationResult.success && creationResult.unite) {
      console.log('✅ Unité de commission créée avec succès:', creationResult.unite.id)
      unite = creationResult.unite
    } else {
      console.error('❌ Impossible de créer l\'unité de commission:', creationResult.error)
      return (
        <div className="p-8 text-center">
          <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
            <Users size={48} className="mx-auto text-red-300 mb-3" />
            <p className="text-red-600 font-medium mb-2">
              Impossible de créer l&apos;unité d&apos;organisation
            </p>
            <p className="text-red-500 text-sm mb-4">
              {creationResult.error || 'Une erreur inattendue est survenue'}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Commission ID: {commissionId}, Paroisse ID: {paroisseId}
            </p>
            <Link
              href="/paroisse/commissions"
              className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
            >
              Retour aux commissions
            </Link>
          </div>
        </div>
      )
    }
  } else {
    console.error('❌ Commission sans departement_id')
    return (
      <div className="p-8 text-center">
        <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
          <Users size={48} className="mx-auto text-red-300 mb-3" />
          <p className="text-red-600 font-medium mb-2">
            Commission sans département
          </p>
          <p className="text-red-500 text-sm mb-4">
            Cette commission n&apos;est rattachée à aucun département.
          </p>
          <Link
            href="/paroisse/commissions"
            className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
          >
            Retour aux commissions
          </Link>
        </div>
      </div>
    )
  }
}
  
  if (!unite) {
    return (
      <div className="p-8 text-center">
        <div className="border border-gray-200 py-16">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            L&apos;unité d&apos;organisation pour cette commission n&apos;a pas encore été créée.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Commission ID: {commissionId}, Paroisse ID: {paroisseId}
          </p>
        </div>
      </div>
    )
  }
  
  // Récupération des données en parallèle
  const [
    activites, 
    budgetSummary, 
    plansAction, 
    projets, 
    realiseTotals,
    configuration
  ] = await Promise.all([
    anneeConferenceId ? getActivitesByCommission(commissionId, anneeConferenceId) : [],
    anneeConferenceId ? getBudgetSummaryForCommission(commissionId, anneeConferenceId) : null,
    anneeConferenceId ? getPlansActionByCommission(commissionId, anneeConferenceId) : [],
    anneeConferenceId ? getProjetsByUnite(unite.id, anneeConferenceId) : [],
    anneeConferenceId ? getRealiseTotalsForCommission(commissionId, anneeConferenceId) : { recettes: 0, depenses: 0 },
    getConfiguration(unite.id)
  ])
  
  const configTaux = configuration?.taux || 2800
  
  const plansFiltres = anneeConferenceId 
    ? plansAction.filter(plan => plan.annee_conference_id === anneeConferenceId)
    : plansAction
    
  const activitesStats = anneeConferenceId ? await getActivitesStatsForCommission(commissionId, anneeConferenceId) : null
  const projetsStats = unite && anneeConferenceId ? await getProjetsStats(unite.id, anneeConferenceId) : null
  
  const activitesRecentes = activites
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
  
  const activitesProchaines = activites
    .filter(a => new Date(a.date) >= new Date() && a.statut !== 'termine' && a.statut !== 'annule')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
  
  const buildUrl = (path: string) => {
    if (anneeConferenceId) {
      return `${path}?annee_conference=${anneeConferenceId}`
    }
    return path
  }
  
  // Fonction pour convertir en CDF
  const convertToCDF = (montant: number, currency: string): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * configTaux * 1.08
    return montant
  }
  
  // Calculer les totaux en CDF
  const totalRecettesPrevu = (budgetSummary?.recettesList || []).reduce(
    (sum: number, b: any) => sum + convertToCDF(b.montant, b.currency), 0
  )
  const totalDepensesPrevu = (budgetSummary?.depensesList || []).reduce(
    (sum: number, b: any) => sum + convertToCDF(b.montant, b.currency), 0
  )
  
  const recettesRealisees = realiseTotals?.recettes || 0
  const depensesRealisees = realiseTotals?.depenses || 0
  
  const progressionRecettes = totalRecettesPrevu > 0 ? (recettesRealisees / totalRecettesPrevu) * 100 : 0
  const progressionDepenses = totalDepensesPrevu > 0 ? (depensesRealisees / totalDepensesPrevu) * 100 : 0
  
  const hasBudget = budgetSummary && budgetSummary.totalLines > 0
  const anneeSelectionnee = anneesDisponibles.find(a => a.id === anneeConferenceId)
  
  // Statistiques des activités
  const activitesTerminees = activitesStats?.terminees || 0
  const activitesEnCours = activitesStats?.enCours || 0
  const activitesPlanifiees = activitesStats?.planifiees || 0
  const activitesAnnulees = activitesStats?.annulees || 0
  const tauxRealisation = activites.length > 0 ? Math.round((activitesTerminees / activites.length) * 100) : 0

  // Statistiques des projets
  const projetsEnCours = projetsStats?.enCours || 0
  const projetsTermines = projetsStats?.termines || 0

  const departement = Array.isArray(commission.departement) ? commission.departement[0] : commission.departement
  const paroisse = Array.isArray(commission.paroisse) ? commission.paroisse[0] : commission.paroisse

  // Statistiques des plans d'action
  const plansActionStats = anneeConferenceId ? await getPlansActionStatsForCommission(commissionId, anneeConferenceId) : null

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/paroisse/commissions"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-light tracking-wide">{commission.nom}</h1>
              {unite && (
                <ConfigButton 
                  uniteId={unite.id}
                  uniteNom={commission.nom}
                  uniteNiveau="Commission"
                />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
          {departement && (
            <>
              <span>{departement.nom}</span>
              <span>•</span>
            </>
          )}
          <span>{paroisse?.nom}</span>
          {anneeSelectionnee && (
            <>
              <span>•</span>
              <span>{anneeSelectionnee.label} {anneeSelectionnee.is_current && '(en cours)'}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Aperçu
        </span>
        <Link
          href={`/paroisse/commissions/${commissionId}/activites`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Activités
        </Link>
        <Link
          href={`/paroisse/commissions/${commissionId}/membres`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Membres
        </Link>
        <Link
          href={`/paroisse/commissions/${commissionId}/plans-action`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plans d&apos;action
        </Link>
        <Link
          href={`/paroisse/commissions/${commissionId}/budget`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Budget
        </Link>
        <Link
          href={`/paroisse/commissions/${commissionId}/projets`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Projets
        </Link>
      </div>

      {anneesDisponibles && anneesDisponibles.length > 0 && (
        <div className="flex gap-2 mb-6">
          {anneesDisponibles.map((annee) => (
            <a
              key={annee.id}
              href={`/paroisse/commissions/${commissionId}?annee_conference=${annee.id}`}
              className={`px-3 py-1.5 text-sm border transition-colors ${
                anneeConferenceId === annee.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-gray-300 hover:border-black text-gray-600'
              }`}
            >
              {annee.label}
              {annee.is_current && ' ✓'}
            </a>
          ))}
        </div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="text-xl font-light">{plansFiltres.length}</div>
          <div className="text-xs text-gray-500">Plans d&apos;action</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3">
          <div className="text-xl font-light text-purple-700">{activites.length}</div>
          <div className="text-xs text-purple-600">Activités</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 p-3">
          <div className="text-xl font-light text-indigo-700">{projets.length}</div>
          <div className="text-xs text-indigo-600">Projets</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-3">
          <div className="text-xl font-light text-green-700">
            {formatCurrency(totalRecettesPrevu, 'CDF')}
          </div>
          <div className="text-xs text-green-600">Recettes prévues</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-3">
          <div className="text-xl font-light text-red-700">
            {formatCurrency(totalDepensesPrevu, 'CDF')}
          </div>
          <div className="text-xs text-red-600">Budget dépenses</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-3">
          <div className="text-xl font-light">{activitesProchaines.length}</div>
          <div className="text-xs text-gray-500">À venir</div>
        </div>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{activitesTerminees}</span>
            <CheckCircle size={14} className="text-green-500" />
          </div>
          <div className="text-xs text-gray-500">Activités terminées</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{activitesEnCours + activitesPlanifiees}</span>
            <Clock size={14} className="text-yellow-500" />
          </div>
          <div className="text-xs text-gray-500">En cours / planifiées</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{activitesAnnulees}</span>
            <XCircle size={14} className="text-red-500" />
          </div>
          <div className="text-xs text-gray-500">Annulées</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{projetsEnCours}</span>
            <Target size={14} className="text-indigo-500" />
          </div>
          <div className="text-xs text-gray-500">Projets en cours</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{tauxRealisation}%</span>
            <CheckCircle size={14} className="text-orange-500" />
          </div>
          <div className="text-xs text-gray-500">Taux réalisation</div>
        </div>
      </div>

      {/* Budget - Recettes et Dépenses (indépendants) */}
      {hasBudget && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Carte Recettes */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                Prévisions de recettes
              </h3>
              <span className="text-xs text-gray-500">
                {progressionRecettes.toFixed(1)}% réalisé
              </span>
            </div>
            
            <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${Math.min(progressionRecettes, 100)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-base font-light text-gray-900">
                  {formatCurrency(totalRecettesPrevu, 'CDF')}
                </div>
                <div className="text-xs text-gray-500">Prévu</div>
              </div>
              <div>
                <div className="text-base font-light text-green-700">
                  {formatCurrency(recettesRealisees, 'CDF')}
                </div>
                <div className="text-xs text-green-600">Réalisé</div>
              </div>
              <div>
                <div className={`text-base font-light ${totalRecettesPrevu - recettesRealisees > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                  {formatCurrency(Math.max(totalRecettesPrevu - recettesRealisees, 0), 'CDF')}
                </div>
                <div className="text-xs text-gray-500">Restant</div>
              </div>
            </div>
          </div>

          {/* Carte Dépenses */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <TrendingDown size={16} className="text-red-600" />
                Budget de dépenses
              </h3>
              <span className="text-xs text-gray-500">
                {progressionDepenses.toFixed(1)}% utilisé
              </span>
            </div>
            
            <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
              <div 
                className={`h-full rounded-full ${progressionDepenses > 100 ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(progressionDepenses, 100)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-base font-light text-gray-900">
                  {formatCurrency(totalDepensesPrevu, 'CDF')}
                </div>
                <div className="text-xs text-gray-500">Budget</div>
              </div>
              <div>
                <div className="text-base font-light text-red-700">
                  {formatCurrency(depensesRealisees, 'CDF')}
                </div>
                <div className="text-xs text-red-600">Dépensé</div>
              </div>
              <div>
                <div className={`text-base font-light ${totalDepensesPrevu - depensesRealisees >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(totalDepensesPrevu - depensesRealisees, 'CDF')}
                </div>
                <div className="text-xs text-gray-500">Disponible</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pas de budget */}
      {!hasBudget && anneeConferenceId && (
        <div className="mb-8 p-8 border border-gray-200 bg-gray-50 text-center">
          <Wallet size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Aucune ligne budgétaire pour cette année</p>
          <Link
            href={buildUrl(`/paroisse/commissions/${commissionId}/budget`)}
            className="inline-block mt-3 text-sm text-black underline"
          >
            Créer un budget →
          </Link>
        </div>
      )}

      {/* Section Projets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Projets</h2>
          <Link
            href={buildUrl(`/paroisse/commissions/${commissionId}/projets`)}
            className="text-xs text-gray-400 hover:text-black"
          >
            Voir tout →
          </Link>
        </div>
        <CommissionProjetsClient 
          uniteId={unite.id}
          anneeConferenceId={anneeConferenceId || undefined}
          commissionNom={commission.nom}
        />
      </div>

      {/* Activités récentes et à venir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activités récentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Activités récentes</h2>
            <Link
              href={buildUrl(`/paroisse/commissions/${commissionId}/activites`)}
              className="text-xs text-gray-400 hover:text-black"
            >
              Voir tout →
            </Link>
          </div>
          <div className="border border-gray-200 bg-white">
            {activitesRecentes.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune activité récente</p>
              </div>
            ) : (
              activitesRecentes.map((activite) => (
                <Link
                  key={activite.id}
                  href={buildUrl(`/paroisse/commissions/${commissionId}/activites/${activite.id}`)}
                  className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{activite.titre}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 border ml-2 ${
                      activite.statut === 'termine' ? 'bg-green-50 text-green-700 border-green-200' :
                      activite.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      activite.statut === 'annule' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {activite.statut === 'termine' ? 'Terminé' :
                       activite.statut === 'en_cours' ? 'En cours' :
                       activite.statut === 'annule' ? 'Annulé' : 'Planifié'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Prochaines activités */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">À venir</h2>
            <Link
              href={buildUrl(`/paroisse/commissions/${commissionId}/activites`)}
              className="text-xs text-gray-400 hover:text-black"
            >
              Voir tout →
            </Link>
          </div>
          <div className="border border-gray-200 bg-white">
            {activitesProchaines.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune activité à venir</p>
              </div>
            ) : (
              activitesProchaines.map((activite) => (
                <Link
                  key={activite.id}
                  href={buildUrl(`/paroisse/commissions/${commissionId}/activites/${activite.id}`)}
                  className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{activite.titre}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 border ml-2 ${
                      new Date(activite.date) < new Date() 
                        ? 'bg-orange-50 text-orange-700 border-orange-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {new Date(activite.date) < new Date() ? 'En retard' : 'Planifié'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Plans d'action récents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Plans d&apos;action récents</h2>
          <Link
            href={buildUrl(`/paroisse/commissions/${commissionId}/plans-action`)}
            className="text-xs text-gray-400 hover:text-black"
          >
            Voir tout →
          </Link>
        </div>
        <div className="border border-gray-200 bg-white">
          {plansFiltres.length === 0 ? (
            <div className="py-8 text-center">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Aucun plan d&apos;action</p>
            </div>
          ) : (
            plansFiltres.slice(0, 5).map((plan) => (
              <Link
                key={plan.id}
                href={buildUrl(`/paroisse/commissions/${commissionId}/plans-action/${plan.id}`)}
                className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm font-medium">{plan.titre}</h3>
                {plan.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Page principale
export default async function CommissionDetailPage({ params, searchParams }: PageProps) {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const { id } = await params
  const search = (await searchParams) ?? {}
  const anneeConferenceParam = search.annee_conference as string | undefined
  
  const commissionId = parseInt(id)
  
  if (isNaN(commissionId)) {
    redirect('/paroisse/commissions?error=invalid-id')
  }
  
  // Vérifier que la commission existe
  const { data: commission, error } = await supabase
    .from('commission')
    .select('id, nom')
    .eq('id', commissionId)
    .single()
  
  if (error || !commission) {
    redirect('/paroisse/commissions')
  }
  
  return (
    <Suspense fallback={<CommissionApercuSkeleton />}>
      <CommissionContent
        commissionId={commissionId}
        paroisseId={currentFidele.paroisse_id}
        anneeConferenceParam={anneeConferenceParam}
      />
    </Suspense>
  )
}