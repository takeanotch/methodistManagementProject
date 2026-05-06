

// // // app/admin/cabinet/page.tsx
// // 'use client'

// // import { useState, useEffect, useRef } from 'react'
// // import { 
// //   Users, 
// //   UserPlus, 
// //   Edit, 
// //   Power, 
// //   PowerOff, 
// //   Search,
// //   X,
// //   Check,
// //   AlertCircle,
// //   Loader2,
// //   Mail,
// //   Phone,
// //   MapPin,
// //   Shield,
// //   User,
// //   Calendar,
// //   RefreshCw,
// //   Eye,
// //   ChevronLeft,
// //   Building2,
// //   Filter
// // } from 'lucide-react'
// // import { supabase } from '@/lib/supabase'
// // import { 
// //   getMembresCabinet, 
// //   addMembreCabinet, 
// //   updateMembreRole, 
// //   toggleMembreActif,
// //   getRolesCabinet,
// //   getFidelesByParoisse,
// //   type CabinetMembre 
// // } from '@/actions/cabinet-pastoral'

// // interface Paroisse {
// //   id: number
// //   nom: string
// //   district: {
// //     id: number
// //     nom: string
// //     conference: {
// //       id: number
// //       nom: string
// //     }
// //   }
// // }

// // interface Fidele {
// //   id: number
// //   nom: string
// //   post_nom: string | null
// //   prenom: string
// //   contact: string | null
// //   sexe: string
// //   actif: boolean
// //   paroisse_id: number
// //   email?: string | null
// //   date_naissance?: string | null
// //   adresse?: string | null
// // }

// // interface Role {
// //   id: number
// //   nom_role: string
// //   label_role: string
// // }

// // interface Stats {
// //   total: number
// //   actifs: number
// //   inactifs: number
// //   avecRole: number
// // }

// // export default function AdminCabinetPage() {
// //   const [paroisses, setParoisses] = useState<Paroisse[]>([])
// //   const [selectedParoisse, setSelectedParoisse] = useState<Paroisse | null>(null)
// //   const [membres, setMembres] = useState<CabinetMembre[]>([])
// //   const [roles, setRoles] = useState<Role[]>([])
// //   const [fideles, setFideles] = useState<Fidele[]>([])
  
// //   const [loading, setLoading] = useState(true)
// //   const [loadingMembres, setLoadingMembres] = useState(false)
// //   const [searchTerm, setSearchTerm] = useState('')
// //   const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all')
// //   const [filterRole, setFilterRole] = useState<number | 'all'>('all')
// //   const [showAddModal, setShowAddModal] = useState(false)
// //   const [showEditRoleModal, setShowEditRoleModal] = useState(false)
// //   const [showConfirmModal, setShowConfirmModal] = useState(false)
// //   const [showFideleDetailModal, setShowFideleDetailModal] = useState(false)
// //   const [selectedMembre, setSelectedMembre] = useState<CabinetMembre | null>(null)
// //   const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
// //   const [selectedRole, setSelectedRole] = useState<number | null>(null)
// //   const [fideleSearchTerm, setFideleSearchTerm] = useState('')
// //   const [expandedParoisse, setExpandedParoisse] = useState<number | null>(null)
// //   const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, inactifs: 0, avecRole: 0 })
  
// //   const [error, setError] = useState<string | null>(null)
// //   const [success, setSuccess] = useState<string | null>(null)
// //   const [isSubmitting, setIsSubmitting] = useState(false)
  
// //   const modalRef = useRef<HTMLDivElement>(null)

// //   useEffect(() => {
// //     loadData()
// //   }, [])

// //   useEffect(() => {
// //     const handleClickOutside = (event: MouseEvent) => {
// //       if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
// //         // Ne pas fermer automatiquement pour éviter les fermetures accidentelles
// //       }
// //     }
// //     document.addEventListener('mousedown', handleClickOutside)
// //     return () => document.removeEventListener('mousedown', handleClickOutside)
// //   }, [])

// //   useEffect(() => {
// //     if (membres.length > 0) {
// //       calculateStats()
// //     }
// //   }, [membres])

// //   const calculateStats = () => {
// //     setStats({
// //       total: membres.length,
// //       actifs: membres.filter(m => m.est_actif).length,
// //       inactifs: membres.filter(m => !m.est_actif).length,
// //       avecRole: membres.filter(m => m.role_id).length
// //     })
// //   }

// //   const loadData = async () => {
// //     try {
// //       setLoading(true)
      
// //       const { data: paroissesData, error: paroissesError } = await supabase
// //         .from('paroisse')
// //         .select(`
// //           id,
// //           nom,
// //           district:district_id (
// //             id,
// //             nom,
// //             conference:conference_id (
// //               id,
// //               nom
// //             )
// //           )
// //         `)
// //         .order('nom')
      
// //       if (paroissesError) throw paroissesError
      
// //       const formattedParoisses = (paroissesData || []).map((p: any) => ({
// //         id: p.id,
// //         nom: p.nom,
// //         district: {
// //           id: (Array.isArray(p.district) ? p.district[0]?.id : p.district?.id) || 0,
// //           nom: (Array.isArray(p.district) ? p.district[0]?.nom : p.district?.nom) || '',
// //           conference: {
// //             id: (() => {
// //               const conf = Array.isArray(p.district) ? p.district[0]?.conference : p.district?.conference
// //               return Array.isArray(conf) ? conf[0]?.id : conf?.id
// //             })() || 0,
// //             nom: (() => {
// //               const conf = Array.isArray(p.district) ? p.district[0]?.conference : p.district?.conference
// //               return Array.isArray(conf) ? conf[0]?.nom : conf?.nom
// //             })() || ''
// //           }
// //         }
// //       })) as Paroisse[]
      
// //       setParoisses(formattedParoisses)
      
// //       const rolesData = await getRolesCabinet()
// //       setRoles(rolesData)
      
// //     } catch (error) {
// //       console.error('Erreur chargement données:', error)
// //       setError('Impossible de charger les données')
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   const loadMembres = async (paroisseId: number) => {
// //     try {
// //       setLoadingMembres(true)
// //       const membresData = await getMembresCabinet(paroisseId)
// //       setMembres(membresData)
// //     } catch (error) {
// //       console.error('Erreur chargement membres:', error)
// //       setError('Impossible de charger les membres')
// //     } finally {
// //       setLoadingMembres(false)
// //     }
// //   }

// //   const loadFideles = async (paroisseId: number) => {
// //     try {
// //       const fidelesData = await getFidelesByParoisse(paroisseId)
// //       setFideles(fidelesData)
// //        console.log(`✅ ${fidelesData.length} fidèles chargés pour la paroisse ${paroisseId}`)
// //     } catch (error) {
// //       console.error('Erreur chargement fidèles:', error)
// //       setError('Impossible de charger les fidèles')
// //     }
// //   }

// //   const handleParoisseSelect = async (paroisse: Paroisse) => {
// //     setSelectedParoisse(paroisse)
// //     setSearchTerm('')
// //     setFilterStatus('all')
// //     setFilterRole('all')
// //     setExpandedParoisse(expandedParoisse === paroisse.id ? null : paroisse.id)
// //     await Promise.all([
// //       loadMembres(paroisse.id),
// //       loadFideles(paroisse.id)
// //     ])
// //   }

// //   const handleAddMembre = async () => {
// //     if (!selectedParoisse || !selectedFidele) {
// //       setError('Veuillez sélectionner un fidèle')
// //       return
// //     }
    
// //     setIsSubmitting(true)
// //     setError(null)
    
// //     try {
// //       const result = await addMembreCabinet(
// //         selectedParoisse.id,
// //         selectedFidele.id,
// //         selectedRole
// //       )
      
// //       if (result.success) {
// //         setSuccess('Membre ajouté avec succès')
// //         setShowAddModal(false)
// //         setSelectedFidele(null)
// //         setSelectedRole(null)
// //         setFideleSearchTerm('')
// //         await loadMembres(selectedParoisse.id)
// //         setTimeout(() => setSuccess(null), 3000)
// //       } else {
// //         setError(result.error || 'Erreur lors de l\'ajout')
// //       }
// //     } catch (error) {
// //       console.error('Erreur addMembreCabinet:', error)
// //       setError('Une erreur est survenue')
// //     } finally {
// //       setIsSubmitting(false)
// //     }
// //   }

// //   const handleUpdateRole = async () => {
// //     if (!selectedMembre) return
    
// //     setIsSubmitting(true)
// //     setError(null)
    
// //     try {
// //       const result = await updateMembreRole(selectedMembre.id, selectedRole)
      
// //       if (result.success) {
// //         setSuccess('Rôle mis à jour avec succès')
// //         setShowEditRoleModal(false)
// //         setSelectedMembre(null)
// //         if (selectedParoisse) {
// //           await loadMembres(selectedParoisse.id)
// //         }
// //         setTimeout(() => setSuccess(null), 3000)
// //       } else {
// //         setError(result.error || 'Erreur lors de la mise à jour')
// //       }
// //     } catch (error) {
// //       console.error('Erreur updateMembreRole:', error)
// //       setError('Une erreur est survenue')
// //     } finally {
// //       setIsSubmitting(false)
// //     }
// //   }

// //   const handleToggleActif = async (membre: CabinetMembre) => {
// //     setSelectedMembre(membre)
// //     setShowConfirmModal(true)
// //   }

// //   const confirmToggleActif = async () => {
// //     if (!selectedMembre) return
    
// //     try {
// //       const result = await toggleMembreActif(selectedMembre.id, !selectedMembre.est_actif)
      
// //       if (result.success) {
// //         setSuccess(`Membre ${selectedMembre.est_actif ? 'désactivé' : 'activé'} avec succès`)
// //         setShowConfirmModal(false)
// //         setSelectedMembre(null)
// //         if (selectedParoisse) {
// //           await loadMembres(selectedParoisse.id)
// //         }
// //         setTimeout(() => setSuccess(null), 3000)
// //       } else {
// //         setError(result.error || 'Erreur lors de la modification')
// //       }
// //     } catch (error) {
// //       console.error('Erreur toggleMembreActif:', error)
// //       setError('Une erreur est survenue')
// //     }
// //   }

// //   const filteredMembres = membres.filter(m => {
// //     const searchLower = searchTerm.toLowerCase()
// //     const matchesSearch = (
// //       m.fidele_nom.toLowerCase().includes(searchLower) ||
// //       m.fidele_prenom.toLowerCase().includes(searchLower) ||
// //       m.role_label?.toLowerCase().includes(searchLower) ||
// //       m.fidele_contact?.toLowerCase().includes(searchLower)
// //     )
    
// //     const matchesStatus = filterStatus === 'all' || 
// //       (filterStatus === 'actif' && m.est_actif) || 
// //       (filterStatus === 'inactif' && !m.est_actif)
    
// //     const matchesRole = filterRole === 'all' || m.role_id === filterRole
    
// //     return matchesSearch && matchesStatus && matchesRole
// //   })

// //   const filteredFideles = fideles.filter(f => {
// //     if (!f.actif) return false
    
// //     const searchLower = fideleSearchTerm.toLowerCase()
// //     const fullName = `${f.prenom} ${f.nom} ${f.post_nom || ''}`.toLowerCase()
// //     return fullName.includes(searchLower) || f.contact?.toLowerCase().includes(searchLower)
// //   })

// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-screen bg-gray-50">
// //         <div className="text-center">
// //           <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
// //           <p className="text-sm text-gray-400">Chargement...</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 py-6">
// //       {/* Header */}
// //       <div className="mb-6">
// //         <div className="flex items-center gap-4 mb-2">
// //           <h1 className="text-2xl font-light tracking-wide">
// //             Gestion des cabinets pastoraux
// //           </h1>
// //           <button
// //             onClick={() => selectedParoisse && loadMembres(selectedParoisse.id)}
// //             className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
// //             disabled={!selectedParoisse || loadingMembres}
// //           >
// //             <RefreshCw className={`w-4 h-4 ${loadingMembres ? 'animate-spin' : ''}`} />
// //           </button>
// //         </div>
// //         {selectedParoisse && (
// //           <p className="text-sm text-gray-500 mt-0.5">
// //             {selectedParoisse.nom} • {stats.total} membres ({stats.actifs} actifs)
// //           </p>
// //         )}
// //       </div>

// //       {/* Messages */}
// //       {error && (
// //         <div className="mb-6 p-4 bg-red-50 border-l-2 border-red-500 text-sm text-red-700 flex items-start gap-3">
// //           <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
// //           <span className="flex-1">{error}</span>
// //           <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
// //             <X className="w-4 h-4" />
// //           </button>
// //         </div>
// //       )}
      
// //       {success && (
// //         <div className="mb-6 p-4 bg-green-50 border-l-2 border-green-500 text-sm text-green-700 flex items-start gap-3">
// //           <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
// //           <span className="flex-1">{success}</span>
// //           <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
// //             <X className="w-4 h-4" />
// //           </button>
// //         </div>
// //       )}

// //       {/* Grille des paroisses */}
// //       <div className="mb-8">
// //         <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Paroisses disponibles</h2>
// //         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
// //           {paroisses.map(paroisse => (
// //             <button
// //               key={paroisse.id}
// //               onClick={() => handleParoisseSelect(paroisse)}
// //               className={`
// //                 p-4 border text-left transition-all
// //                 ${selectedParoisse?.id === paroisse.id 
// //                   ? 'border-black bg-gray-50' 
// //                   : 'border-gray-200 hover:border-gray-300 bg-white'
// //                 }
// //               `}
// //             >
// //               <div className="flex items-start justify-between">
// //                 <div className="font-medium text-gray-900">
// //                   {paroisse.nom}
// //                 </div>
// //                 {selectedParoisse?.id === paroisse.id && (
// //                   <Check className="w-4 h-4 text-black" />
// //                 )}
// //               </div>
// //               <div className="text-xs text-gray-400 mt-1">
// //                 {paroisse.district?.nom} • {paroisse.district?.conference?.nom}
// //               </div>
// //             </button>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Gestion des membres */}
// //       {selectedParoisse && (
// //         <div>
// //           <div className="flex items-center justify-between mb-3">
// //             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
// //               Membres du cabinet
// //             </h2>
// //             <button
// //               onClick={() => setShowAddModal(true)}
// //               className="text-xs text-black border border-gray-300 px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-1"
// //             >
// //               <UserPlus className="w-3 h-3" />
// //               Nouveau membre
// //             </button>
// //           </div>
          
// //           {/* Barre de recherche et filtres */}
// //           <div className="flex gap-2 mb-4">
// //             <div className="relative flex-1">
// //               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
// //               <input
// //                 type="text"
// //                 placeholder="Rechercher..."
// //                 value={searchTerm}
// //                 onChange={(e) => setSearchTerm(e.target.value)}
// //                 className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
// //               />
// //             </div>
            
// //             <select
// //               value={filterStatus}
// //               onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
// //               className="px-3 py-2 text-sm border border-gray-200 bg-white focus:border-black focus:ring-0"
// //             >
// //               <option value="all">Tous</option>
// //               <option value="actif">Actifs</option>
// //               <option value="inactif">Inactifs</option>
// //             </select>
            
// //             <select
// //               value={filterRole}
// //               onChange={(e) => setFilterRole(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
// //               className="px-3 py-2 text-sm border border-gray-200 bg-white focus:border-black focus:ring-0"
// //             >
// //               <option value="all">Tous rôles</option>
// //               <option value="null">Sans rôle</option>
// //               {roles.map(role => (
// //                 <option key={role.id} value={role.id}>
// //                   {role.label_role}
// //                 </option>
// //               ))}
// //             </select>
// //           </div>
          
// //           {/* Liste des membres */}
// //           {loadingMembres ? (
// //             <div className="py-12 text-center">
// //               <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-3" />
// //               <p className="text-sm text-gray-400">Chargement des membres...</p>
// //             </div>
// //           ) : filteredMembres.length === 0 ? (
// //             <div className="py-12 text-center border border-gray-200 bg-gray-50">
// //               <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
// //               <p className="text-sm text-gray-400">
// //                 {searchTerm || filterStatus !== 'all' || filterRole !== 'all' 
// //                   ? 'Aucun membre trouvé' 
// //                   : 'Aucun membre dans ce cabinet'
// //                 }
// //               </p>
// //             </div>
// //           ) : (
// //             <div className="border border-gray-200 bg-white">
// //               {filteredMembres.map(membre => (
// //                 <div
// //                   key={membre.id}
// //                   className={`
// //                     p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors
// //                     ${!membre.est_actif ? 'opacity-60' : ''}
// //                   `}
// //                 >
// //                   <div className="flex items-center justify-between">
// //                     <div className="flex items-center gap-3">
// //                       <div className={`
// //                         w-10 h-10 flex items-center rounded-full justify-center text-sm font-medium
// //                         ${membre.est_actif 
// //                           ? 'bg-gray-100 text-gray-700' 
// //                           : 'bg-gray-100 text-gray-400'
// //                         }
// //                       `}>
// //                         {membre.fidele_prenom?.[0] || ''}{membre.fidele_nom?.[0] || ''}
// //                       </div>
// //                       <div>
// //                         <div className="flex items-center gap-2">
// //                           <span className="font-medium text-gray-900">
// //                             {membre.fidele_prenom} {membre.fidele_nom}
// //                           </span>
// //                           {membre.role_label && (
// //                             <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
// //                               {membre.role_label}
// //                             </span>
// //                           )}
// //                           {!membre.est_actif && (
// //                             <span className="text-xs text-gray-400">Inactif</span>
// //                           )}
// //                         </div>
// //                         <div className="text-xs text-gray-400 mt-0.5">
// //                           {membre.fidele_contact && `${membre.fidele_contact} • `}
// //                           {membre.role_nom || 'Membre simple'}
// //                         </div>
// //                       </div>
// //                     </div>
                    
// //                     <div className="flex items-center gap-1">
// //                       <button
// //                         onClick={() => {
// //                           setSelectedMembre(membre)
// //                           const fidele = fideles.find(f => f.id === membre.fidele_id)
// //                           if (fidele) {
// //                             setSelectedFidele(fidele)
// //                             setShowFideleDetailModal(true)
// //                           }
// //                         }}
// //                         className="p-2 text-gray-400 hover:text-black transition-colors"
// //                         title="Voir détails"
// //                       >
// //                         <Eye className="w-4 h-4" />
// //                       </button>
                      
// //                       <button
// //                         onClick={() => {
// //                           setSelectedMembre(membre)
// //                           setSelectedRole(membre.role_id)
// //                           setShowEditRoleModal(true)
// //                         }}
// //                         className="p-2 text-gray-400 hover:text-black transition-colors"
// //                         title="Modifier rôle"
// //                       >
// //                         <Edit className="w-4 h-4" />
// //                       </button>
                      
// //                       <button
// //                         onClick={() => handleToggleActif(membre)}
// //                         className={`
// //                           p-2 transition-colors
// //                           ${membre.est_actif 
// //                             ? 'text-gray-400 hover:text-red-600' 
// //                             : 'text-gray-400 hover:text-green-600'
// //                           }
// //                         `}
// //                         title={membre.est_actif ? 'Désactiver' : 'Activer'}
// //                       >
// //                         {membre.est_actif ? (
// //                           <PowerOff className="w-4 h-4" />
// //                         ) : (
// //                           <Power className="w-4 h-4" />
// //                         )}
// //                       </button>
// //                     </div>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           )}
// //         </div>
// //       )}

// //       {/* Modal d'ajout de membre */}
// //       {showAddModal && selectedParoisse && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
// //           <div 
// //             ref={modalRef}
// //             className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto"
// //           >
// //             <div className="border-b border-gray-200 px-6 py-4">
// //               <div className="flex items-center justify-between">
// //                 <div>
// //                   <h3 className="text-lg font-medium">Ajouter un membre</h3>
// //                   <p className="text-sm text-gray-500 mt-0.5">{selectedParoisse.nom}</p>
// //                 </div>
// //                 <button
// //                   onClick={() => {
// //                     setShowAddModal(false)
// //                     setSelectedFidele(null)
// //                     setSelectedRole(null)
// //                     setFideleSearchTerm('')
// //                   }}
// //                   className="text-gray-400 hover:text-black"
// //                 >
// //                   <X className="w-5 h-5" />
// //                 </button>
// //               </div>
// //             </div>
            
// //             <div className="p-6 space-y-6">
// //               {/* Recherche de fidèle */}
// //               <div>
// //                 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
// //                   Fidèle <span className="text-red-500">*</span>
// //                 </label>
                
// //                 {!selectedFidele ? (
// //                   <>
// //                     <div className="relative">
// //                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
// //                       <input
// //                         type="text"
// //                         placeholder="Rechercher par nom ou contact..."
// //                         value={fideleSearchTerm}
// //                         onChange={(e) => setFideleSearchTerm(e.target.value)}
// //                         className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0"
// //                         autoFocus
// //                       />
// //                     </div>
                    
// //                     {fideleSearchTerm && (
// //                       <div className="mt-2 border border-gray-200 max-h-64 overflow-y-auto">
// //                         {filteredFideles.length === 0 ? (
// //                           <div className="p-4 text-sm text-gray-400 text-center">
// //                             Aucun fidèle actif trouvé
// //                           </div>
// //                         ) : (
// //                           filteredFideles.slice(0, 10).map(fidele => (
// //                             <button
// //                               key={fidele.id}
// //                               onClick={() => setSelectedFidele(fidele)}
// //                               className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
// //                             >
// //                               <div className="font-medium text-gray-900">
// //                                 {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
// //                               </div>
// //                               <div className="text-xs text-gray-400 mt-1">
// //                                 {fidele.contact && `${fidele.contact} • `}
// //                                 {fidele.sexe}
// //                               </div>
// //                             </button>
// //                           ))
// //                         )}
// //                       </div>
// //                     )}
// //                   </>
// //                 ) : (
// //                   <div className="p-4 border border-gray-200 bg-gray-50">
// //                     <div className="flex items-start justify-between">
// //                       <div>
// //                         <div className="font-medium">
// //                           {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
// //                         </div>
// //                         <div className="text-xs text-gray-500 mt-1">
// //                           {selectedFidele.contact && `${selectedFidele.contact} • `}
// //                           {selectedFidele.sexe}
// //                         </div>
// //                       </div>
// //                       <button
// //                         onClick={() => setSelectedFidele(null)}
// //                         className="text-gray-400 hover:text-black"
// //                       >
// //                         <X className="w-4 h-4" />
// //                       </button>
// //                     </div>
// //                   </div>
// //                 )}
// //               </div>
              
// //               {/* Sélection du rôle */}
// //               <div>
// //                 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
// //                   Rôle dans le cabinet
// //                 </label>
// //                 <select
// //                   value={selectedRole || ''}
// //                   onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
// //                   className="w-full px-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
// //                 >
// //                   <option value="">Aucun rôle (membre simple)</option>
// //                   {roles.map(role => (
// //                     <option key={role.id} value={role.id}>
// //                       {role.label_role}
// //                     </option>
// //                   ))}
// //                 </select>
// //               </div>
// //             </div>
            
// //             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
// //               <button
// //                 onClick={() => {
// //                   setShowAddModal(false)
// //                   setSelectedFidele(null)
// //                   setSelectedRole(null)
// //                   setFideleSearchTerm('')
// //                 }}
// //                 className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors"
// //               >
// //                 Annuler
// //               </button>
// //               <button
// //                 onClick={handleAddMembre}
// //                 disabled={!selectedFidele || isSubmitting}
// //                 className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
// //               >
// //                 {isSubmitting ? (
// //                   <>
// //                     <Loader2 className="w-4 h-4 animate-spin" />
// //                     Ajout...
// //                   </>
// //                 ) : (
// //                   'Ajouter'
// //                 )}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Modal de modification du rôle */}
// //       {showEditRoleModal && selectedMembre && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
// //           <div className="bg-white max-w-md w-full">
// //             <div className="border-b border-gray-200 px-6 py-4">
// //               <div className="flex items-center justify-between">
// //                 <h3 className="text-lg font-medium">Modifier le rôle</h3>
// //                 <button
// //                   onClick={() => {
// //                     setShowEditRoleModal(false)
// //                     setSelectedMembre(null)
// //                   }}
// //                   className="text-gray-400 hover:text-black"
// //                 >
// //                   <X className="w-5 h-5" />
// //                 </button>
// //               </div>
// //               <p className="text-sm text-gray-500 mt-0.5">
// //                 {selectedMembre.fidele_prenom} {selectedMembre.fidele_nom}
// //               </p>
// //             </div>
            
// //             <div className="p-6">
// //               <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
// //                 Rôle
// //               </label>
// //               <select
// //                 value={selectedRole || ''}
// //                 onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
// //                 className="w-full px-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
// //               >
// //                 <option value="">Aucun rôle</option>
// //                 {roles.map(role => (
// //                   <option key={role.id} value={role.id}>
// //                     {role.label_role}
// //                   </option>
// //                 ))}
// //               </select>
// //               {selectedMembre.role_label && (
// //                 <p className="text-xs text-gray-400 mt-2">
// //                   Rôle actuel : {selectedMembre.role_label}
// //                 </p>
// //               )}
// //             </div>
            
// //             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
// //               <button
// //                 onClick={() => {
// //                   setShowEditRoleModal(false)
// //                   setSelectedMembre(null)
// //                 }}
// //                 className="px-4 py-2 text-sm text-gray-600 hover:text-black"
// //               >
// //                 Annuler
// //               </button>
// //               <button
// //                 onClick={handleUpdateRole}
// //                 disabled={isSubmitting}
// //                 className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
// //               >
// //                 {isSubmitting ? (
// //                   <>
// //                     <Loader2 className="w-4 h-4 animate-spin" />
// //                     Mise à jour...
// //                   </>
// //                 ) : (
// //                   'Mettre à jour'
// //                 )}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Modal de confirmation */}
// //       {showConfirmModal && selectedMembre && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
// //           <div className="bg-white max-w-md w-full">
// //             <div className="border-b border-gray-200 px-6 py-4">
// //               <h3 className="text-lg font-medium">
// //                 {selectedMembre.est_actif ? 'Désactiver' : 'Activer'} le membre ?
// //               </h3>
// //               <p className="text-sm text-gray-500 mt-0.5">
// //                 {selectedMembre.fidele_prenom} {selectedMembre.fidele_nom}
// //               </p>
// //             </div>
            
// //             <div className="p-6">
// //               <p className="text-sm text-gray-600">
// //                 {selectedMembre.est_actif 
// //                   ? 'Ce membre ne pourra plus exercer ses fonctions dans le cabinet pastoral.'
// //                   : 'Ce membre pourra à nouveau exercer ses fonctions dans le cabinet pastoral.'
// //                 }
// //               </p>
// //             </div>
            
// //             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
// //               <button
// //                 onClick={() => {
// //                   setShowConfirmModal(false)
// //                   setSelectedMembre(null)
// //                 }}
// //                 className="px-4 py-2 text-sm text-gray-600 hover:text-black"
// //               >
// //                 Annuler
// //               </button>
// //               <button
// //                 onClick={confirmToggleActif}
// //                 className={`px-4 py-2 text-sm text-white ${
// //                   selectedMembre.est_actif 
// //                     ? 'bg-red-600 hover:bg-red-700' 
// //                     : 'bg-green-600 hover:bg-green-700'
// //                 }`}
// //               >
// //                 {selectedMembre.est_actif ? 'Désactiver' : 'Activer'}
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}

// //       {/* Modal de détails du fidèle */}
// //       {showFideleDetailModal && selectedFidele && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
// //           <div className="bg-white max-w-xl w-full">
// //             <div className="border-b border-gray-200 px-6 py-4">
// //               <div className="flex items-center justify-between">
// //                 <h3 className="text-lg font-medium">Détails du fidèle</h3>
// //                 <button
// //                   onClick={() => {
// //                     setShowFideleDetailModal(false)
// //                     setSelectedFidele(null)
// //                   }}
// //                   className="text-gray-400 hover:text-black"
// //                 >
// //                   <X className="w-5 h-5" />
// //                 </button>
// //               </div>
// //             </div>
            
// //             <div className="p-6">
// //               <div className="flex items-center gap-4 mb-6">
// //                 <div className="w-16 h-16 bg-gray-100 text-gray-600 flex items-center justify-center text-xl font-light">
// //                   {selectedFidele.prenom[0]}{selectedFidele.nom[0]}
// //                 </div>
// //                 <div>
// //                   <h4 className="text-lg font-medium">
// //                     {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
// //                   </h4>
// //                   <span className={`text-xs ${selectedFidele.actif ? 'text-green-600' : 'text-gray-400'}`}>
// //                     {selectedFidele.actif ? 'Actif' : 'Inactif'}
// //                   </span>
// //                 </div>
// //               </div>
              
// //               <div className="space-y-3">
// //                 <div className="flex items-center gap-3 text-sm">
// //                   <Phone className="w-4 h-4 text-gray-300" />
// //                   <span className="text-gray-600">{selectedFidele.contact || 'Non renseigné'}</span>
// //                 </div>
// //                 <div className="flex items-center gap-3 text-sm">
// //                   <User className="w-4 h-4 text-gray-300" />
// //                   <span className="text-gray-600">{selectedFidele.sexe}</span>
// //                 </div>
// //                 {selectedFidele.email && (
// //                   <div className="flex items-center gap-3 text-sm">
// //                     <Mail className="w-4 h-4 text-gray-300" />
// //                     <span className="text-gray-600">{selectedFidele.email}</span>
// //                   </div>
// //                 )}
// //                 {selectedFidele.adresse && (
// //                   <div className="flex items-center gap-3 text-sm">
// //                     <MapPin className="w-4 h-4 text-gray-300" />
// //                     <span className="text-gray-600">{selectedFidele.adresse}</span>
// //                   </div>
// //                 )}
// //                 {selectedFidele.date_naissance && (
// //                   <div className="flex items-center gap-3 text-sm">
// //                     <Calendar className="w-4 h-4 text-gray-300" />
// //                     <span className="text-gray-600">
// //                       {new Date(selectedFidele.date_naissance).toLocaleDateString('fr-FR')}
// //                     </span>
// //                   </div>
// //                 )}
// //               </div>
// //             </div>
            
// //             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
// //               <button
// //                 onClick={() => {
// //                   setShowFideleDetailModal(false)
// //                   setSelectedFidele(null)
// //                 }}
// //                 className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800"
// //               >
// //                 Fermer
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   )
// // }
// // app/admin/cabinet/page.tsx
// 'use client'

// import { useState, useEffect, useRef } from 'react'
// import { 
//   Users, 
//   UserPlus, 
//   Edit, 
//   Power, 
//   PowerOff, 
//   Search,
//   X,
//   Check,
//   AlertCircle,
//   Loader2,
//   Mail,
//   Phone,
//   MapPin,
//   Shield,
//   User,
//   Calendar,
//   RefreshCw,
//   Eye,
//   ChevronLeft,
//   Building2,
//   Filter
// } from 'lucide-react'
// import { supabase } from '@/lib/supabase'
// import { 
//   getMembresCabinet, 
//   addMembreCabinet, 
//   updateMembreRole, 
//   toggleMembreActif,
//   getRolesCabinet,
//   getFidelesByParoisse,
//   type CabinetMembre 
// } from '@/actions/cabinet-pastoral'

// interface Paroisse {
//   id: number
//   nom: string
//   district: {
//     id: number
//     nom: string
//     conference: {
//       id: number
//       nom: string
//     }
//   }
// }

// interface Fidele {
//   id: number
//   nom: string
//   post_nom: string | null
//   prenom: string
//   contact: string | null
//   sexe: string
//   actif: boolean
//   paroisse_id: number
//   email?: string | null
//   date_naissance?: string | null
//   adresse?: string | null
//   profile_img?: string | null
// }

// interface Role {
//   id: number
//   nom_role: string
//   label_role: string
// }

// interface Stats {
//   total: number
//   actifs: number
//   inactifs: number
//   avecRole: number
// }

// export default function AdminCabinetPage() {
//   const [paroisses, setParoisses] = useState<Paroisse[]>([])
//   const [selectedParoisse, setSelectedParoisse] = useState<Paroisse | null>(null)
//   const [membres, setMembres] = useState<CabinetMembre[]>([])
//   const [roles, setRoles] = useState<Role[]>([])
//   const [fideles, setFideles] = useState<Fidele[]>([])
  
//   const [loading, setLoading] = useState(true)
//   const [loadingMembres, setLoadingMembres] = useState(false)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all')
//   const [filterRole, setFilterRole] = useState<number | 'all'>('all')
//   const [showAddModal, setShowAddModal] = useState(false)
//   const [showEditRoleModal, setShowEditRoleModal] = useState(false)
//   const [showConfirmModal, setShowConfirmModal] = useState(false)
//   const [showFideleDetailModal, setShowFideleDetailModal] = useState(false)
//   const [selectedMembre, setSelectedMembre] = useState<CabinetMembre | null>(null)
//   const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
//   const [selectedRole, setSelectedRole] = useState<number | null>(null)
//   const [fideleSearchTerm, setFideleSearchTerm] = useState('')
//   const [expandedParoisse, setExpandedParoisse] = useState<number | null>(null)
//   const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, inactifs: 0, avecRole: 0 })
  
//   const [error, setError] = useState<string | null>(null)
//   const [success, setSuccess] = useState<string | null>(null)
//   const [isSubmitting, setIsSubmitting] = useState(false)
  
//   const modalRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     loadData()
//   }, [])

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
//         // Ne pas fermer automatiquement pour éviter les fermetures accidentelles
//       }
//     }
//     document.addEventListener('mousedown', handleClickOutside)
//     return () => document.removeEventListener('mousedown', handleClickOutside)
//   }, [])

//   useEffect(() => {
//     if (membres.length > 0) {
//       calculateStats()
//     }
//   }, [membres])

//   const calculateStats = () => {
//     setStats({
//       total: membres.length,
//       actifs: membres.filter(m => m.est_actif).length,
//       inactifs: membres.filter(m => !m.est_actif).length,
//       avecRole: membres.filter(m => m.role_id).length
//     })
//   }

//   const loadData = async () => {
//     try {
//       setLoading(true)
      
//       const { data: paroissesData, error: paroissesError } = await supabase
//         .from('paroisse')
//         .select(`
//           id,
//           nom,
//           district:district_id (
//             id,
//             nom,
//             conference:conference_id (
//               id,
//               nom
//             )
//           )
//         `)
//         .order('nom')
      
//       if (paroissesError) throw paroissesError
      
//       const formattedParoisses = (paroissesData || []).map((p: any) => ({
//         id: p.id,
//         nom: p.nom,
//         district: {
//           id: (Array.isArray(p.district) ? p.district[0]?.id : p.district?.id) || 0,
//           nom: (Array.isArray(p.district) ? p.district[0]?.nom : p.district?.nom) || '',
//           conference: {
//             id: (() => {
//               const conf = Array.isArray(p.district) ? p.district[0]?.conference : p.district?.conference
//               return Array.isArray(conf) ? conf[0]?.id : conf?.id
//             })() || 0,
//             nom: (() => {
//               const conf = Array.isArray(p.district) ? p.district[0]?.conference : p.district?.conference
//               return Array.isArray(conf) ? conf[0]?.nom : conf?.nom
//             })() || ''
//           }
//         }
//       })) as Paroisse[]
      
//       setParoisses(formattedParoisses)
      
//       const rolesData = await getRolesCabinet()
//       setRoles(rolesData)
      
//     } catch (error) {
//       console.error('Erreur chargement données:', error)
//       setError('Impossible de charger les données')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const loadMembres = async (paroisseId: number) => {
//     try {
//       setLoadingMembres(true)
//       const membresData = await getMembresCabinet(paroisseId)
//       setMembres(membresData)
//     } catch (error) {
//       console.error('Erreur chargement membres:', error)
//       setError('Impossible de charger les membres')
//     } finally {
//       setLoadingMembres(false)
//     }
//   }

//   const loadFideles = async (paroisseId: number) => {
//     try {
//       const fidelesData = await getFidelesByParoisse(paroisseId)
//       setFideles(fidelesData)
//        console.log(`✅ ${fidelesData.length} fidèles chargés pour la paroisse ${paroisseId}`)
//     } catch (error) {
//       console.error('Erreur chargement fidèles:', error)
//       setError('Impossible de charger les fidèles')
//     }
//   }

//   const handleParoisseSelect = async (paroisse: Paroisse) => {
//     setSelectedParoisse(paroisse)
//     setSearchTerm('')
//     setFilterStatus('all')
//     setFilterRole('all')
//     setExpandedParoisse(expandedParoisse === paroisse.id ? null : paroisse.id)
//     await Promise.all([
//       loadMembres(paroisse.id),
//       loadFideles(paroisse.id)
//     ])
//   }

//   const handleAddMembre = async () => {
//     if (!selectedParoisse || !selectedFidele) {
//       setError('Veuillez sélectionner un fidèle')
//       return
//     }
    
//     setIsSubmitting(true)
//     setError(null)
    
//     try {
//       const result = await addMembreCabinet(
//         selectedParoisse.id,
//         selectedFidele.id,
//         selectedRole
//       )
      
//       if (result.success) {
//         setSuccess('Membre ajouté avec succès')
//         setShowAddModal(false)
//         setSelectedFidele(null)
//         setSelectedRole(null)
//         setFideleSearchTerm('')
//         await loadMembres(selectedParoisse.id)
//         setTimeout(() => setSuccess(null), 3000)
//       } else {
//         setError(result.error || 'Erreur lors de l\'ajout')
//       }
//     } catch (error) {
//       console.error('Erreur addMembreCabinet:', error)
//       setError('Une erreur est survenue')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleUpdateRole = async () => {
//     if (!selectedMembre) return
    
//     setIsSubmitting(true)
//     setError(null)
    
//     try {
//       const result = await updateMembreRole(selectedMembre.id, selectedRole)
      
//       if (result.success) {
//         setSuccess('Rôle mis à jour avec succès')
//         setShowEditRoleModal(false)
//         setSelectedMembre(null)
//         if (selectedParoisse) {
//           await loadMembres(selectedParoisse.id)
//         }
//         setTimeout(() => setSuccess(null), 3000)
//       } else {
//         setError(result.error || 'Erreur lors de la mise à jour')
//       }
//     } catch (error) {
//       console.error('Erreur updateMembreRole:', error)
//       setError('Une erreur est survenue')
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const handleToggleActif = async (membre: CabinetMembre) => {
//     setSelectedMembre(membre)
//     setShowConfirmModal(true)
//   }

//   const confirmToggleActif = async () => {
//     if (!selectedMembre) return
    
//     try {
//       const result = await toggleMembreActif(selectedMembre.id, !selectedMembre.est_actif)
      
//       if (result.success) {
//         setSuccess(`Membre ${selectedMembre.est_actif ? 'désactivé' : 'activé'} avec succès`)
//         setShowConfirmModal(false)
//         setSelectedMembre(null)
//         if (selectedParoisse) {
//           await loadMembres(selectedParoisse.id)
//         }
//         setTimeout(() => setSuccess(null), 3000)
//       } else {
//         setError(result.error || 'Erreur lors de la modification')
//       }
//     } catch (error) {
//       console.error('Erreur toggleMembreActif:', error)
//       setError('Une erreur est survenue')
//     }
//   }

//   const filteredMembres = membres.filter(m => {
//     const searchLower = searchTerm.toLowerCase()
//     const matchesSearch = (
//       m.fidele_nom.toLowerCase().includes(searchLower) ||
//       m.fidele_prenom.toLowerCase().includes(searchLower) ||
//       m.role_label?.toLowerCase().includes(searchLower) ||
//       m.fidele_contact?.toLowerCase().includes(searchLower)
//     )
    
//     const matchesStatus = filterStatus === 'all' || 
//       (filterStatus === 'actif' && m.est_actif) || 
//       (filterStatus === 'inactif' && !m.est_actif)
    
//     const matchesRole = filterRole === 'all' || m.role_id === filterRole
    
//     return matchesSearch && matchesStatus && matchesRole
//   })

//   const filteredFideles = fideles.filter(f => {
//     if (!f.actif) return false
    
//     const searchLower = fideleSearchTerm.toLowerCase()
//     const fullName = `${f.prenom} ${f.nom} ${f.post_nom || ''}`.toLowerCase()
//     return fullName.includes(searchLower) || f.contact?.toLowerCase().includes(searchLower)
//   })

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
//           <p className="text-sm text-gray-400">Chargement...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-2">
//           <h1 className="text-2xl font-light tracking-wide">
//             Gestion des cabinets pastoraux
//           </h1>
//           <button
//             onClick={() => selectedParoisse && loadMembres(selectedParoisse.id)}
//             className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
//             disabled={!selectedParoisse || loadingMembres}
//           >
//             <RefreshCw className={`w-4 h-4 ${loadingMembres ? 'animate-spin' : ''}`} />
//           </button>
//         </div>
//         {selectedParoisse && (
//           <p className="text-sm text-gray-500 mt-0.5">
//             {selectedParoisse.nom} • {stats.total} membres ({stats.actifs} actifs)
//           </p>
//         )}
//       </div>

//       {/* Messages */}
//       {error && (
//         <div className="mb-6 p-4 bg-red-50 border-l-2 border-red-500 text-sm text-red-700 flex items-start gap-3">
//           <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
//           <span className="flex-1">{error}</span>
//           <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       )}
      
//       {success && (
//         <div className="mb-6 p-4 bg-green-50 border-l-2 border-green-500 text-sm text-green-700 flex items-start gap-3">
//           <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
//           <span className="flex-1">{success}</span>
//           <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
//             <X className="w-4 h-4" />
//           </button>
//         </div>
//       )}

//       {/* Grille des paroisses */}
//       <div className="mb-8">
//         <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Paroisses disponibles</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
//           {paroisses.map(paroisse => (
//             <button
//               key={paroisse.id}
//               onClick={() => handleParoisseSelect(paroisse)}
//               className={`
//                 p-4 border text-left transition-all
//                 ${selectedParoisse?.id === paroisse.id 
//                   ? 'border-black bg-gray-50' 
//                   : 'border-gray-200 hover:border-gray-300 bg-white'
//                 }
//               `}
//             >
//               <div className="flex items-start justify-between">
//                 <div className="font-medium text-gray-900">
//                   {paroisse.nom}
//                 </div>
//                 {selectedParoisse?.id === paroisse.id && (
//                   <Check className="w-4 h-4 text-black" />
//                 )}
//               </div>
//               <div className="text-xs text-gray-400 mt-1">
//                 {paroisse.district?.nom} • {paroisse.district?.conference?.nom}
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Gestion des membres */}
//       {selectedParoisse && (
//         <div>
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//               Membres du cabinet
//             </h2>
//             <button
//               onClick={() => setShowAddModal(true)}
//               className="text-xs text-black border border-gray-300 px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-1"
//             >
//               <UserPlus className="w-3 h-3" />
//               Nouveau membre
//             </button>
//           </div>
          
//           {/* Barre de recherche et filtres */}
//           <div className="flex gap-2 mb-4">
//             <div className="relative flex-1">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
//               <input
//                 type="text"
//                 placeholder="Rechercher..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
//               />
//             </div>
            
//             <select
//               value={filterStatus}
//               onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
//               className="px-3 py-2 text-sm border border-gray-200 bg-white focus:border-black focus:ring-0"
//             >
//               <option value="all">Tous</option>
//               <option value="actif">Actifs</option>
//               <option value="inactif">Inactifs</option>
//             </select>
            
//             <select
//               value={filterRole}
//               onChange={(e) => setFilterRole(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
//               className="px-3 py-2 text-sm border border-gray-200 bg-white focus:border-black focus:ring-0"
//             >
//               <option value="all">Tous rôles</option>
//               <option value="null">Sans rôle</option>
//               {roles.map(role => (
//                 <option key={role.id} value={role.id}>
//                   {role.label_role}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           {/* Liste des membres */}
//           {loadingMembres ? (
//             <div className="py-12 text-center">
//               <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-3" />
//               <p className="text-sm text-gray-400">Chargement des membres...</p>
//             </div>
//           ) : filteredMembres.length === 0 ? (
//             <div className="py-12 text-center border border-gray-200 bg-gray-50">
//               <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
//               <p className="text-sm text-gray-400">
//                 {searchTerm || filterStatus !== 'all' || filterRole !== 'all' 
//                   ? 'Aucun membre trouvé' 
//                   : 'Aucun membre dans ce cabinet'
//                 }
//               </p>
//             </div>
//           ) : (
//             <div className="border border-gray-200 bg-white">
//               {filteredMembres.map(membre => (
//                 <div
//                   key={membre.id}
//                   className={`
//                     p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors
//                     ${!membre.est_actif ? 'opacity-60' : ''}
//                   `}
//                 >
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       {/* Avatar avec image de profil */}
//                       {membre.fidele_profile_img ? (
//                         <img
//                           src={membre.fidele_profile_img}
//                           alt={`${membre.fidele_prenom} ${membre.fidele_nom}`}
//                           className={`
//                             w-10 h-10 rounded-full object-cover
//                             ${!membre.est_actif ? 'grayscale opacity-70' : ''}
//                           `}
//                           onError={(e) => {
//                             // Fallback si l'image ne charge pas
//                             const target = e.target as HTMLImageElement;
//                             target.style.display = 'none';
//                             const parent = target.parentElement;
//                             if (parent) {
//                               const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
//                               if (fallback) {
//                                 fallback.classList.remove('hidden');
//                                 fallback.classList.add('flex');
//                               }
//                             }
//                           }}
//                         />
//                       ) : null}
                      
//                       {/* Fallback avec initiales si pas d'image */}
//                       <div className={`
//                         avatar-fallback w-10 h-10 items-center rounded-full justify-center text-sm font-medium
//                         ${membre.fidele_profile_img ? 'hidden' : 'flex'}
//                         ${membre.est_actif 
//                           ? 'bg-gray-100 text-gray-700' 
//                           : 'bg-gray-100 text-gray-400'
//                         }
//                       `}>
//                         {membre.fidele_prenom?.[0] || ''}{membre.fidele_nom?.[0] || ''}
//                       </div>
                      
//                       <div>
//                         <div className="flex items-center gap-2">
//                           <span className="font-medium text-gray-900">
//                             {membre.fidele_prenom} {membre.fidele_nom}
//                           </span>
//                           {membre.role_label && (
//                             <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
//                               {membre.role_label}
//                             </span>
//                           )}
//                           {!membre.est_actif && (
//                             <span className="text-xs text-gray-400">Inactif</span>
//                           )}
//                         </div>
//                         <div className="text-xs text-gray-400 mt-0.5">
//                           {membre.fidele_contact && `${membre.fidele_contact} • `}
//                           {membre.role_nom || 'Membre simple'}
//                         </div>
//                       </div>
//                     </div>
                    
//                     <div className="flex items-center gap-1">
//                       <button
//                         onClick={() => {
//                           setSelectedMembre(membre)
//                           const fidele = fideles.find(f => f.id === membre.fidele_id)
//                           if (fidele) {
//                             setSelectedFidele(fidele)
//                             setShowFideleDetailModal(true)
//                           }
//                         }}
//                         className="p-2 text-gray-400 hover:text-black transition-colors"
//                         title="Voir détails"
//                       >
//                         <Eye className="w-4 h-4" />
//                       </button>
                      
//                       <button
//                         onClick={() => {
//                           setSelectedMembre(membre)
//                           setSelectedRole(membre.role_id)
//                           setShowEditRoleModal(true)
//                         }}
//                         className="p-2 text-gray-400 hover:text-black transition-colors"
//                         title="Modifier rôle"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </button>
                      
//                       <button
//                         onClick={() => handleToggleActif(membre)}
//                         className={`
//                           p-2 transition-colors
//                           ${membre.est_actif 
//                             ? 'text-gray-400 hover:text-red-600' 
//                             : 'text-gray-400 hover:text-green-600'
//                           }
//                         `}
//                         title={membre.est_actif ? 'Désactiver' : 'Activer'}
//                       >
//                         {membre.est_actif ? (
//                           <PowerOff className="w-4 h-4" />
//                         ) : (
//                           <Power className="w-4 h-4" />
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* Modal d'ajout de membre */}
//       {showAddModal && selectedParoisse && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div 
//             ref={modalRef}
//             className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto"
//           >
//             <div className="border-b border-gray-200 px-6 py-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <h3 className="text-lg font-medium">Ajouter un membre</h3>
//                   <p className="text-sm text-gray-500 mt-0.5">{selectedParoisse.nom}</p>
//                 </div>
//                 <button
//                   onClick={() => {
//                     setShowAddModal(false)
//                     setSelectedFidele(null)
//                     setSelectedRole(null)
//                     setFideleSearchTerm('')
//                   }}
//                   className="text-gray-400 hover:text-black"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
            
//             <div className="p-6 space-y-6">
//               {/* Recherche de fidèle */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
//                   Fidèle <span className="text-red-500">*</span>
//                 </label>
                
//                 {!selectedFidele ? (
//                   <>
//                     <div className="relative">
//                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
//                       <input
//                         type="text"
//                         placeholder="Rechercher par nom ou contact..."
//                         value={fideleSearchTerm}
//                         onChange={(e) => setFideleSearchTerm(e.target.value)}
//                         className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0"
//                         autoFocus
//                       />
//                     </div>
                    
//                     {fideleSearchTerm && (
//                       <div className="mt-2 border border-gray-200 max-h-64 overflow-y-auto">
//                         {filteredFideles.length === 0 ? (
//                           <div className="p-4 text-sm text-gray-400 text-center">
//                             Aucun fidèle actif trouvé
//                           </div>
//                         ) : (
//                           filteredFideles.slice(0, 10).map(fidele => (
//                             <button
//                               key={fidele.id}
//                               onClick={() => setSelectedFidele(fidele)}
//                               className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
//                             >
//                               <div className="flex items-center gap-3">
//                                 {fidele.profile_img ? (
//                                   <img
//                                     src={fidele.profile_img}
//                                     alt={`${fidele.prenom} ${fidele.nom}`}
//                                     className="w-10 h-10 rounded-full object-cover"
//                                     onError={(e) => {
//                                       const target = e.target as HTMLImageElement;
//                                       target.style.display = 'none';
//                                     }}
//                                   />
//                                 ) : (
//                                   <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
//                                     {fidele.prenom[0]}{fidele.nom[0]}
//                                   </div>
//                                 )}
//                                 <div>
//                                   <div className="font-medium text-gray-900">
//                                     {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
//                                   </div>
//                                   <div className="text-xs text-gray-400 mt-1">
//                                     {fidele.contact && `${fidele.contact} • `}
//                                     {fidele.sexe}
//                                   </div>
//                                 </div>
//                               </div>
//                             </button>
//                           ))
//                         )}
//                       </div>
//                     )}
//                   </>
//                 ) : (
//                   <div className="p-4 border border-gray-200 bg-gray-50">
//                     <div className="flex items-start justify-between">
//                       <div className="flex items-center gap-3">
//                         {selectedFidele.profile_img ? (
//                           <img
//                             src={selectedFidele.profile_img}
//                             alt={`${selectedFidele.prenom} ${selectedFidele.nom}`}
//                             className="w-10 h-10 rounded-full object-cover"
//                             onError={(e) => {
//                               const target = e.target as HTMLImageElement;
//                               target.style.display = 'none';
//                             }}
//                           />
//                         ) : (
//                           <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
//                             {selectedFidele.prenom[0]}{selectedFidele.nom[0]}
//                           </div>
//                         )}
//                         <div>
//                           <div className="font-medium">
//                             {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
//                           </div>
//                           <div className="text-xs text-gray-500 mt-1">
//                             {selectedFidele.contact && `${selectedFidele.contact} • `}
//                             {selectedFidele.sexe}
//                           </div>
//                         </div>
//                       </div>
//                       <button
//                         onClick={() => setSelectedFidele(null)}
//                         className="text-gray-400 hover:text-black"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
              
//               {/* Sélection du rôle */}
//               <div>
//                 <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
//                   Rôle dans le cabinet
//                 </label>
//                 <select
//                   value={selectedRole || ''}
//                   onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
//                   className="w-full px-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
//                 >
//                   <option value="">Aucun rôle (membre simple)</option>
//                   {roles.map(role => (
//                     <option key={role.id} value={role.id}>
//                       {role.label_role}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>
            
//             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
//               <button
//                 onClick={() => {
//                   setShowAddModal(false)
//                   setSelectedFidele(null)
//                   setSelectedRole(null)
//                   setFideleSearchTerm('')
//                 }}
//                 className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={handleAddMembre}
//                 disabled={!selectedFidele || isSubmitting}
//                 className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                     Ajout...
//                   </>
//                 ) : (
//                   'Ajouter'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal de modification du rôle */}
//       {showEditRoleModal && selectedMembre && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white max-w-md w-full">
//             <div className="border-b border-gray-200 px-6 py-4">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-medium">Modifier le rôle</h3>
//                 <button
//                   onClick={() => {
//                     setShowEditRoleModal(false)
//                     setSelectedMembre(null)
//                   }}
//                   className="text-gray-400 hover:text-black"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//               <p className="text-sm text-gray-500 mt-0.5">
//                 {selectedMembre.fidele_prenom} {selectedMembre.fidele_nom}
//               </p>
//             </div>
            
//             <div className="p-6">
//               <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
//                 Rôle
//               </label>
//               <select
//                 value={selectedRole || ''}
//                 onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
//                 className="w-full px-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
//               >
//                 <option value="">Aucun rôle</option>
//                 {roles.map(role => (
//                   <option key={role.id} value={role.id}>
//                     {role.label_role}
//                   </option>
//                 ))}
//               </select>
//               {selectedMembre.role_label && (
//                 <p className="text-xs text-gray-400 mt-2">
//                   Rôle actuel : {selectedMembre.role_label}
//                 </p>
//               )}
//             </div>
            
//             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
//               <button
//                 onClick={() => {
//                   setShowEditRoleModal(false)
//                   setSelectedMembre(null)
//                 }}
//                 className="px-4 py-2 text-sm text-gray-600 hover:text-black"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={handleUpdateRole}
//                 disabled={isSubmitting}
//                 className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader2 className="w-4 h-4 animate-spin" />
//                     Mise à jour...
//                   </>
//                 ) : (
//                   'Mettre à jour'
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal de confirmation */}
//       {showConfirmModal && selectedMembre && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white max-w-md w-full">
//             <div className="border-b border-gray-200 px-6 py-4">
//               <h3 className="text-lg font-medium">
//                 {selectedMembre.est_actif ? 'Désactiver' : 'Activer'} le membre ?
//               </h3>
//               <p className="text-sm text-gray-500 mt-0.5">
//                 {selectedMembre.fidele_prenom} {selectedMembre.fidele_nom}
//               </p>
//             </div>
            
//             <div className="p-6">
//               <p className="text-sm text-gray-600">
//                 {selectedMembre.est_actif 
//                   ? 'Ce membre ne pourra plus exercer ses fonctions dans le cabinet pastoral.'
//                   : 'Ce membre pourra à nouveau exercer ses fonctions dans le cabinet pastoral.'
//                 }
//               </p>
//             </div>
            
//             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
//               <button
//                 onClick={() => {
//                   setShowConfirmModal(false)
//                   setSelectedMembre(null)
//                 }}
//                 className="px-4 py-2 text-sm text-gray-600 hover:text-black"
//               >
//                 Annuler
//               </button>
//               <button
//                 onClick={confirmToggleActif}
//                 className={`px-4 py-2 text-sm text-white ${
//                   selectedMembre.est_actif 
//                     ? 'bg-red-600 hover:bg-red-700' 
//                     : 'bg-green-600 hover:bg-green-700'
//                 }`}
//               >
//                 {selectedMembre.est_actif ? 'Désactiver' : 'Activer'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal de détails du fidèle */}
//       {showFideleDetailModal && selectedFidele && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white max-w-xl w-full">
//             <div className="border-b border-gray-200 px-6 py-4">
//               <div className="flex items-center justify-between">
//                 <h3 className="text-lg font-medium">Détails du fidèle</h3>
//                 <button
//                   onClick={() => {
//                     setShowFideleDetailModal(false)
//                     setSelectedFidele(null)
//                   }}
//                   className="text-gray-400 hover:text-black"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
            
//             <div className="p-6">
//               <div className="flex items-center gap-4 mb-6">
//                 {/* Avatar avec image de profil dans la modale */}
//                 {selectedFidele.profile_img ? (
//                   <img
//                     src={selectedFidele.profile_img}
//                     alt={`${selectedFidele.prenom} ${selectedFidele.nom}`}
//                     className="w-16 h-16 rounded-full object-cover"
//                     onError={(e) => {
//                       const target = e.target as HTMLImageElement;
//                       target.style.display = 'none';
//                       // Afficher le fallback avec initiales
//                       const fallback = document.getElementById(`fidele-detail-fallback-${selectedFidele.id}`);
//                       if (fallback) {
//                         fallback.classList.remove('hidden');
//                         fallback.classList.add('flex');
//                       }
//                     }}
//                   />
//                 ) : null}
                
//                 {/* Fallback avec initiales */}
//                 <div 
//                   id={`fidele-detail-fallback-${selectedFidele.id}`}
//                   className={`
//                     w-16 h-16 bg-gray-100 text-gray-600 items-center justify-center text-xl font-light
//                     ${selectedFidele.profile_img ? 'hidden' : 'flex'}
//                   `}
//                 >
//                   {selectedFidele.prenom[0]}{selectedFidele.nom[0]}
//                 </div>
                
//                 <div>
//                   <h4 className="text-lg font-medium">
//                     {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
//                   </h4>
//                   <span className={`text-xs ${selectedFidele.actif ? 'text-green-600' : 'text-gray-400'}`}>
//                     {selectedFidele.actif ? 'Actif' : 'Inactif'}
//                   </span>
//                 </div>
//               </div>
              
//               <div className="space-y-3">
//                 <div className="flex items-center gap-3 text-sm">
//                   <Phone className="w-4 h-4 text-gray-300" />
//                   <span className="text-gray-600">{selectedFidele.contact || 'Non renseigné'}</span>
//                 </div>
//                 <div className="flex items-center gap-3 text-sm">
//                   <User className="w-4 h-4 text-gray-300" />
//                   <span className="text-gray-600">{selectedFidele.sexe}</span>
//                 </div>
//                 {selectedFidele.email && (
//                   <div className="flex items-center gap-3 text-sm">
//                     <Mail className="w-4 h-4 text-gray-300" />
//                     <span className="text-gray-600">{selectedFidele.email}</span>
//                   </div>
//                 )}
//                 {selectedFidele.adresse && (
//                   <div className="flex items-center gap-3 text-sm">
//                     <MapPin className="w-4 h-4 text-gray-300" />
//                     <span className="text-gray-600">{selectedFidele.adresse}</span>
//                   </div>
//                 )}
//                 {selectedFidele.date_naissance && (
//                   <div className="flex items-center gap-3 text-sm">
//                     <Calendar className="w-4 h-4 text-gray-300" />
//                     <span className="text-gray-600">
//                       {new Date(selectedFidele.date_naissance).toLocaleDateString('fr-FR')}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
            
//             <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
//               <button
//                 onClick={() => {
//                   setShowFideleDetailModal(false)
//                   setSelectedFidele(null)
//                 }}
//                 className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800"
//               >
//                 Fermer
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// app/admin/cabinet/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Power, 
  PowerOff, 
  Search,
  X,
  Check,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Shield,
  User,
  Calendar,
  RefreshCw,
  Eye,
  ChevronLeft,
  Building2,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { 
  getMembresCabinet, 
  addMembreCabinet, 
  updateMembreRole, 
  toggleMembreActif,
  getRolesCabinet,
  getFidelesByParoisse,
  type CabinetMembre 
} from '@/actions/cabinet-pastoral'

interface Paroisse {
  id: number
  nom: string
  district: {
    id: number
    nom: string
    conference: {
      id: number
      nom: string
    }
  }
}

interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  sexe: string
  actif: boolean
  paroisse_id: number
  email?: string | null
  date_naissance?: string | null
  adresse?: string | null
  profile_img?: string | null
}

interface Role {
  id: number
  nom_role: string
  label_role: string
}

interface Stats {
  total: number
  actifs: number
  inactifs: number
  avecRole: number
}

export default function AdminCabinetPage() {
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [selectedParoisse, setSelectedParoisse] = useState<Paroisse | null>(null)
  const [membres, setMembres] = useState<CabinetMembre[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [fideles, setFideles] = useState<Fidele[]>([])
  
  const [loading, setLoading] = useState(true)
  const [loadingMembres, setLoadingMembres] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [paroisseSearchTerm, setParoisseSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'actif' | 'inactif'>('all')
  const [filterRole, setFilterRole] = useState<number | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showFideleDetailModal, setShowFideleDetailModal] = useState(false)
  const [selectedMembre, setSelectedMembre] = useState<CabinetMembre | null>(null)
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [fideleSearchTerm, setFideleSearchTerm] = useState('')
  const [expandedParoisse, setExpandedParoisse] = useState<number | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, inactifs: 0, avecRole: 0 })
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Ne pas fermer automatiquement pour éviter les fermetures accidentelles
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (membres.length > 0) {
      calculateStats()
    }
  }, [membres])

  const calculateStats = () => {
    setStats({
      total: membres.length,
      actifs: membres.filter(m => m.est_actif).length,
      inactifs: membres.filter(m => !m.est_actif).length,
      avecRole: membres.filter(m => m.role_id).length
    })
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      const { data: paroissesData, error: paroissesError } = await supabase
        .from('paroisse')
        .select(`
          id,
          nom,
          district:district_id (
            id,
            nom,
            conference:conference_id (
              id,
              nom
            )
          )
        `)
        .order('nom')
      
      if (paroissesError) throw paroissesError
      
      const formattedParoisses = (paroissesData || []).map((p: any) => ({
        id: p.id,
        nom: p.nom,
        district: {
          id: (Array.isArray(p.district) ? p.district[0]?.id : p.district?.id) || 0,
          nom: (Array.isArray(p.district) ? p.district[0]?.nom : p.district?.nom) || '',
          conference: {
            id: (() => {
              const conf = Array.isArray(p.district) ? p.district[0]?.conference : p.district?.conference
              return Array.isArray(conf) ? conf[0]?.id : conf?.id
            })() || 0,
            nom: (() => {
              const conf = Array.isArray(p.district) ? p.district[0]?.conference : p.district?.conference
              return Array.isArray(conf) ? conf[0]?.nom : conf?.nom
            })() || ''
          }
        }
      })) as Paroisse[]
      
      setParoisses(formattedParoisses)
      
      const rolesData = await getRolesCabinet()
      setRoles(rolesData)
      
    } catch (error) {
      console.error('Erreur chargement données:', error)
      setError('Impossible de charger les données')
    } finally {
      setLoading(false)
    }
  }

  const loadMembres = async (paroisseId: number) => {
    try {
      setLoadingMembres(true)
      const membresData = await getMembresCabinet(paroisseId)
      setMembres(membresData)
    } catch (error) {
      console.error('Erreur chargement membres:', error)
      setError('Impossible de charger les membres')
    } finally {
      setLoadingMembres(false)
    }
  }

  const loadFideles = async (paroisseId: number) => {
    try {
      const fidelesData = await getFidelesByParoisse(paroisseId)
      setFideles(fidelesData)
       console.log(`✅ ${fidelesData.length} fidèles chargés pour la paroisse ${paroisseId}`)
    } catch (error) {
      console.error('Erreur chargement fidèles:', error)
      setError('Impossible de charger les fidèles')
    }
  }

  const handleParoisseSelect = async (paroisse: Paroisse) => {
    setSelectedParoisse(paroisse)
    setSearchTerm('')
    setFilterStatus('all')
    setFilterRole('all')
    setExpandedParoisse(expandedParoisse === paroisse.id ? null : paroisse.id)
    await Promise.all([
      loadMembres(paroisse.id),
      loadFideles(paroisse.id)
    ])
  }

  const handleAddMembre = async () => {
    if (!selectedParoisse || !selectedFidele) {
      setError('Veuillez sélectionner un fidèle')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await addMembreCabinet(
        selectedParoisse.id,
        selectedFidele.id,
        selectedRole
      )
      
      if (result.success) {
        setSuccess('Membre ajouté avec succès')
        setShowAddModal(false)
        setSelectedFidele(null)
        setSelectedRole(null)
        setFideleSearchTerm('')
        await loadMembres(selectedParoisse.id)
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      console.error('Erreur addMembreCabinet:', error)
      setError('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!selectedMembre) return
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await updateMembreRole(selectedMembre.id, selectedRole)
      
      if (result.success) {
        setSuccess('Rôle mis à jour avec succès')
        setShowEditRoleModal(false)
        setSelectedMembre(null)
        if (selectedParoisse) {
          await loadMembres(selectedParoisse.id)
        }
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      console.error('Erreur updateMembreRole:', error)
      setError('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActif = async (membre: CabinetMembre) => {
    setSelectedMembre(membre)
    setShowConfirmModal(true)
  }

  const confirmToggleActif = async () => {
    if (!selectedMembre) return
    
    try {
      const result = await toggleMembreActif(selectedMembre.id, !selectedMembre.est_actif)
      
      if (result.success) {
        setSuccess(`Membre ${selectedMembre.est_actif ? 'désactivé' : 'activé'} avec succès`)
        setShowConfirmModal(false)
        setSelectedMembre(null)
        if (selectedParoisse) {
          await loadMembres(selectedParoisse.id)
        }
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Erreur toggleMembreActif:', error)
      setError('Une erreur est survenue')
    }
  }

  // Filtrage des paroisses
  const filteredParoisses = paroisses.filter(paroisse => {
    const searchLower = paroisseSearchTerm.toLowerCase()
    return (
      paroisse.nom.toLowerCase().includes(searchLower) ||
      paroisse.district?.nom.toLowerCase().includes(searchLower) ||
      paroisse.district?.conference?.nom.toLowerCase().includes(searchLower)
    )
  })

  // Filtrage des membres
  const filteredMembres = membres.filter(m => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      m.fidele_nom.toLowerCase().includes(searchLower) ||
      m.fidele_prenom.toLowerCase().includes(searchLower) ||
      m.role_label?.toLowerCase().includes(searchLower) ||
      m.fidele_contact?.toLowerCase().includes(searchLower)
    )
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'actif' && m.est_actif) || 
      (filterStatus === 'inactif' && !m.est_actif)
    
    const matchesRole = filterRole === 'all' || m.role_id === filterRole
    
    return matchesSearch && matchesStatus && matchesRole
  })

  const filteredFideles = fideles.filter(f => {
    if (!f.actif) return false
    
    const searchLower = fideleSearchTerm.toLowerCase()
    const fullName = `${f.prenom} ${f.nom} ${f.post_nom || ''}`.toLowerCase()
    return fullName.includes(searchLower) || f.contact?.toLowerCase().includes(searchLower)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-2xl font-light tracking-wide">
            Gestion des cabinets pastoraux
          </h1>
          <button
            onClick={() => selectedParoisse && loadMembres(selectedParoisse.id)}
            className="text-gray-400 hover:text-black transition-colors disabled:opacity-50"
            disabled={!selectedParoisse || loadingMembres}
          >
            <RefreshCw className={`w-4 h-4 ${loadingMembres ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {selectedParoisse ? (
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedParoisse.nom} • {stats.total} membres ({stats.actifs} actifs)
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-0.5">
            Sélectionnez une paroisse pour gérer son cabinet pastoral
          </p>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-2 border-red-500 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border-l-2 border-green-500 text-sm text-green-700 flex items-start gap-3">
          <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-400 hover:text-green-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Recherche et grille des paroisses */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Paroisses disponibles
          </h2>
          {paroisseSearchTerm && (
            <button
              onClick={() => setParoisseSearchTerm('')}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Effacer la recherche
            </button>
          )}
        </div>
        
        {/* Barre de recherche des paroisses */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher une paroisse, un district ou une conférence..."
            value={paroisseSearchTerm}
            onChange={(e) => setParoisseSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
          />
          {paroisseSearchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {filteredParoisses.length} résultat{filteredParoisses.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {/* Grille des paroisses filtrées */}
        {filteredParoisses.length === 0 ? (
          <div className="py-12 text-center border border-gray-200 bg-gray-50">
            <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {paroisseSearchTerm 
                ? 'Aucune paroisse ne correspond à votre recherche' 
                : 'Aucune paroisse disponible'
              }
            </p>
            {paroisseSearchTerm && (
              <button
                onClick={() => setParoisseSearchTerm('')}
                className="mt-2 text-xs text-gray-500 hover:text-black underline"
              >
                Réinitialiser la recherche
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredParoisses.map(paroisse => (
              <button
                key={paroisse.id}
                onClick={() => handleParoisseSelect(paroisse)}
                className={`
                  p-4 border text-left transition-all
                  ${selectedParoisse?.id === paroisse.id 
                    ? 'border-black bg-gray-50' 
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="font-medium text-gray-900">
                    {paroisse.nom}
                  </div>
                  {selectedParoisse?.id === paroisse.id && (
                    <Check className="w-4 h-4 text-black flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {paroisse.district?.nom && `${paroisse.district.nom}`}
                  {paroisse.district?.nom && paroisse.district?.conference?.nom && ' • '}
                  {paroisse.district?.conference?.nom && `${paroisse.district.conference.nom}`}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gestion des membres */}
      {selectedParoisse && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Membres du cabinet
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs text-black border border-gray-300 px-3 py-1.5 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" />
              Nouveau membre
            </button>
          </div>
          
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 text-sm border border-gray-200 bg-white focus:border-black focus:ring-0"
              >
                <option value="all">Tous</option>
                <option value="actif">Actifs</option>
                <option value="inactif">Inactifs</option>
              </select>
              
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 bg-white focus:border-black focus:ring-0"
              >
                <option value="all">Tous rôles</option>
                <option value="null">Sans rôle</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.label_role}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Liste des membres */}
          {loadingMembres ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Chargement des membres...</p>
            </div>
          ) : filteredMembres.length === 0 ? (
            <div className="py-12 text-center border border-gray-200 bg-gray-50">
              <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {searchTerm || filterStatus !== 'all' || filterRole !== 'all' 
                  ? 'Aucun membre trouvé' 
                  : 'Aucun membre dans ce cabinet'
                }
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 bg-white">
              {filteredMembres.map(membre => (
                <div
                  key={membre.id}
                  className={`
                    p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors
                    ${!membre.est_actif ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar avec image de profil */}
                      {membre.fidele_profile_img ? (
                        <img
                          src={membre.fidele_profile_img}
                          alt={`${membre.fidele_prenom} ${membre.fidele_nom}`}
                          className={`
                            w-10 h-10 rounded-full object-cover
                            ${!membre.est_actif ? 'grayscale opacity-70' : ''}
                          `}
                          onError={(e) => {
                            // Fallback si l'image ne charge pas
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              const fallback = parent.querySelector('.avatar-fallback') as HTMLElement;
                              if (fallback) {
                                fallback.classList.remove('hidden');
                                fallback.classList.add('flex');
                              }
                            }
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback avec initiales si pas d'image */}
                      <div className={`
                        avatar-fallback w-10 h-10 items-center rounded-full justify-center text-sm font-medium
                        ${membre.fidele_profile_img ? 'hidden' : 'flex'}
                        ${membre.est_actif 
                          ? 'bg-gray-100 text-gray-700' 
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}>
                        {membre.fidele_prenom?.[0] || ''}{membre.fidele_nom?.[0] || ''}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">
                            {membre.fidele_prenom} {membre.fidele_nom}
                          </span>
                          {membre.role_label && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                              {membre.role_label}
                            </span>
                          )}
                          {!membre.est_actif && (
                            <span className="text-xs text-gray-400">Inactif</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {membre.fidele_contact && `${membre.fidele_contact} • `}
                          {membre.role_nom || 'Membre simple'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedMembre(membre)
                          const fidele = fideles.find(f => f.id === membre.fidele_id)
                          if (fidele) {
                            setSelectedFidele(fidele)
                            setShowFideleDetailModal(true)
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedMembre(membre)
                          setSelectedRole(membre.role_id)
                          setShowEditRoleModal(true)
                        }}
                        className="p-2 text-gray-400 hover:text-black transition-colors"
                        title="Modifier rôle"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleToggleActif(membre)}
                        className={`
                          p-2 transition-colors
                          ${membre.est_actif 
                            ? 'text-gray-400 hover:text-red-600' 
                            : 'text-gray-400 hover:text-green-600'
                          }
                        `}
                        title={membre.est_actif ? 'Désactiver' : 'Activer'}
                      >
                        {membre.est_actif ? (
                          <PowerOff className="w-4 h-4" />
                        ) : (
                          <Power className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal d'ajout de membre */}
      {showAddModal && selectedParoisse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div 
            ref={modalRef}
            className="bg-white max-w-xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Ajouter un membre</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedParoisse.nom}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedFidele(null)
                    setSelectedRole(null)
                    setFideleSearchTerm('')
                  }}
                  className="text-gray-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Recherche de fidèle */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Fidèle <span className="text-red-500">*</span>
                </label>
                
                {!selectedFidele ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou contact..."
                        value={fideleSearchTerm}
                        onChange={(e) => setFideleSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0"
                        autoFocus
                      />
                    </div>
                    
                    {fideleSearchTerm && (
                      <div className="mt-2 border border-gray-200 max-h-64 overflow-y-auto">
                        {filteredFideles.length === 0 ? (
                          <div className="p-4 text-sm text-gray-400 text-center">
                            Aucun fidèle actif trouvé
                          </div>
                        ) : (
                          filteredFideles.slice(0, 10).map(fidele => (
                            <button
                              key={fidele.id}
                              onClick={() => setSelectedFidele(fidele)}
                              className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex items-center gap-3">
                                {fidele.profile_img ? (
                                  <img
                                    src={fidele.profile_img}
                                    alt={`${fidele.prenom} ${fidele.nom}`}
                                    className="w-10 h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                                    {fidele.prenom[0]}{fidele.nom[0]}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {fidele.contact && `${fidele.contact} • `}
                                    {fidele.sexe}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 border border-gray-200 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {selectedFidele.profile_img ? (
                          <img
                            src={selectedFidele.profile_img}
                            alt={`${selectedFidele.prenom} ${selectedFidele.nom}`}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                            {selectedFidele.prenom[0]}{selectedFidele.nom[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {selectedFidele.contact && `${selectedFidele.contact} • `}
                            {selectedFidele.sexe}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFidele(null)}
                        className="text-gray-400 hover:text-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sélection du rôle */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Rôle dans le cabinet
                </label>
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
                >
                  <option value="">Aucun rôle (membre simple)</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.label_role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedFidele(null)
                  setSelectedRole(null)
                  setFideleSearchTerm('')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMembre}
                disabled={!selectedFidele || isSubmitting}
                className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de modification du rôle */}
      {showEditRoleModal && selectedMembre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Modifier le rôle</h3>
                <button
                  onClick={() => {
                    setShowEditRoleModal(false)
                    setSelectedMembre(null)
                  }}
                  className="text-gray-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedMembre.fidele_prenom} {selectedMembre.fidele_nom}
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Rôle
              </label>
              <select
                value={selectedRole || ''}
                onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 focus:border-black focus:ring-0 bg-white"
              >
                <option value="">Aucun rôle</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>
                    {role.label_role}
                  </option>
                ))}
              </select>
              {selectedMembre.role_label && (
                <p className="text-xs text-gray-400 mt-2">
                  Rôle actuel : {selectedMembre.role_label}
                </p>
              )}
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditRoleModal(false)
                  setSelectedMembre(null)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  'Mettre à jour'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && selectedMembre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-medium">
                {selectedMembre.est_actif ? 'Désactiver' : 'Activer'} le membre ?
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {selectedMembre.fidele_prenom} {selectedMembre.fidele_nom}
              </p>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600">
                {selectedMembre.est_actif 
                  ? 'Ce membre ne pourra plus exercer ses fonctions dans le cabinet pastoral.'
                  : 'Ce membre pourra à nouveau exercer ses fonctions dans le cabinet pastoral.'
                }
              </p>
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setSelectedMembre(null)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-black"
              >
                Annuler
              </button>
              <button
                onClick={confirmToggleActif}
                className={`px-4 py-2 text-sm text-white ${
                  selectedMembre.est_actif 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {selectedMembre.est_actif ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails du fidèle */}
      {showFideleDetailModal && selectedFidele && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-xl w-full">
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Détails du fidèle</h3>
                <button
                  onClick={() => {
                    setShowFideleDetailModal(false)
                    setSelectedFidele(null)
                  }}
                  className="text-gray-400 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {/* Avatar avec image de profil dans la modale */}
                {selectedFidele.profile_img ? (
                  <img
                    src={selectedFidele.profile_img}
                    alt={`${selectedFidele.prenom} ${selectedFidele.nom}`}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Afficher le fallback avec initiales
                      const fallback = document.getElementById(`fidele-detail-fallback-${selectedFidele.id}`);
                      if (fallback) {
                        fallback.classList.remove('hidden');
                        fallback.classList.add('flex');
                      }
                    }}
                  />
                ) : null}
                
                {/* Fallback avec initiales */}
                <div 
                  id={`fidele-detail-fallback-${selectedFidele.id}`}
                  className={`
                    w-16 h-16 bg-gray-100 text-gray-600 items-center justify-center text-xl font-light
                    ${selectedFidele.profile_img ? 'hidden' : 'flex'}
                  `}
                >
                  {selectedFidele.prenom[0]}{selectedFidele.nom[0]}
                </div>
                
                <div>
                  <h4 className="text-lg font-medium">
                    {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
                  </h4>
                  <span className={`text-xs ${selectedFidele.actif ? 'text-green-600' : 'text-gray-400'}`}>
                    {selectedFidele.actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-600">{selectedFidele.contact || 'Non renseigné'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-gray-300" />
                  <span className="text-gray-600">{selectedFidele.sexe}</span>
                </div>
                {selectedFidele.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-gray-300" />
                    <span className="text-gray-600">{selectedFidele.email}</span>
                  </div>
                )}
                {selectedFidele.adresse && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-300" />
                    <span className="text-gray-600">{selectedFidele.adresse}</span>
                  </div>
                )}
                {selectedFidele.date_naissance && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-gray-300" />
                    <span className="text-gray-600">
                      {new Date(selectedFidele.date_naissance).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowFideleDetailModal(false)
                  setSelectedFidele(null)
                }}
                className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}