// // app/chef-conference/responsables/page.tsx
// 'use client'

// import { useState, useEffect, useCallback } from 'react'
// import { useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { 
//   Users, 
//   ChevronLeft, 
//   ChevronRight,
//   User,
//   Calendar,
//   Building2,
//   Shield,
//   Layers,
//   Globe,
//   Loader2,
//   CheckCircle,
//   XCircle,
//   Plus,
//   Search,
//   Trash2,
//   Edit2,
//   UserCheck,
//   AlertCircle,
//   X,
//   Filter,
//   FilterX,
//   ChevronDown,
//   MapPin,
//   Church,
//   Phone
// } from 'lucide-react'
// import { debounce } from 'lodash'

// // Types
// interface ChefConferenceInfo {
//   id: number
//   fidele_id: number
//   departement_id: number
//   conference_id: number
//   departement_nom: string
//   departement_type: string
//   conference_nom: string
//   fidele_nom: string
//   fidele_prenom: string
// }

// interface AnneeConference {
//   id: number
//   annee_id: number
//   conference_id: number
//   is_current: boolean
//   annee?: {
//     id: number
//     label: string
//   }
// }

// interface ChefDepartement {
//   id: number
//   fidele_id: number
//   departement_id: number
//   district_id: number
//   role_id: number | null
//   date_nomination: string
//   annee_conference_id: number | null
//   est_actif: boolean
//   fidele?: {
//     id: number
//     nom: string
//     post_nom: string | null
//     prenom: string
//     contact: string | null
//     profile_img: string | null
//     paroisse?: {
//       id: number
//       nom: string
//     }
//   }
//   departement?: {
//     id: number
//     nom: string
//   }
//   district?: {
//     id: number
//     nom: string
//   }
//   role?: {
//     id: number
//     nom_role: string
//     label_role: string
//   }
// }

// interface Role {
//   id: number
//   nom_role: string
//   label_role: string
// }


// type TabType = 'conference' | 'districts'

// export default function ChefsConferencePage() {
//   const router = useRouter()
//   const [activeTab, setActiveTab] = useState<TabType>('districts')
//   const [loading, setLoading] = useState(true)
//   const [chefInfo, setChefInfo] = useState<ChefConferenceInfo | null>(null)
  
//   // Données
//   const [chefsConference, setChefsConference] = useState<ChefDepartement[]>([])
//   const [chefsDistricts, setChefsDistricts] = useState<Record<number, ChefDepartement[]>>({})
//   const [districts, setDistricts] = useState<any[]>([])
//   const [departementRoles, setDepartementRoles] = useState<Role[]>([])
  
//   // Filtre par année
//   const [availableAnnees, setAvailableAnnees] = useState<AnneeConference[]>([])
//   const [selectedFilterAnneeId, setSelectedFilterAnneeId] = useState<number | null>(null)
//   const [showAnneeFilterDropdown, setShowAnneeFilterDropdown] = useState(false)
//   const [loadingAnnees, setLoadingAnnees] = useState(false)

//   // Modal ajout/édition chef
//   const [showChefModal, setShowChefModal] = useState(false)
//   const [editingChef, setEditingChef] = useState<ChefDepartement | null>(null)
//   const [selectedDistrictId, setSelectedDistrictId] = useState<string>('')
//   const [selectedRoleId, setSelectedRoleId] = useState<string>('')
//   const [fideleSearchTerm, setFideleSearchTerm] = useState('')
//   const [fideleResults, setFideleResults] = useState<any[]>([])
//   const [selectedFidele, setSelectedFidele] = useState<any>(null)
//   const [showFideleDropdown, setShowFideleDropdown] = useState(false)
//   const [searching, setSearching] = useState(false)
//   const [submitting, setSubmitting] = useState(false)
//   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState<ChefDepartement | null>(null)

//   useEffect(() => {
//     loadData()
//   }, [])

//   const loadData = async () => {
//     try {
//       setLoading(true)
      
//       const { getChefConferenceInfo } = await import('@/actions/chef-conference')
//       const info = await getChefConferenceInfo()
      
//       if (!info) {
//         router.push('/profile')
//         return
//       }
      
//       setChefInfo(info)
//       await loadAllData(info)
      
//     } catch (error) {
//       console.error('Erreur chargement:', error)
//     } finally {
//       setLoading(false)
//     }
//   }



// const loadAllData = async (info: ChefConferenceInfo) => {
//   try {
//     const { supabase } = await import('@/lib/supabase')
    
//     // 1. Récupérer les districts de la conférence
//     const { data: districtsData } = await supabase
//       .from('district')
//       .select('id, nom')
//       .eq('conference_id', info.conference_id)
//       .order('nom')
    
//     setDistricts(districtsData || [])

//     // 2. Récupérer les rôles du département
//     const { data: deptData } = await supabase
//       .from('departement')
//       .select('roles_config')
//       .eq('id', info.departement_id)
//       .single()
    
//     if (deptData?.roles_config) {
//       setDepartementRoles(deptData.roles_config)
//     }

//     // 3. Récupérer les chefs de conférence (niveau = 'conference')
//     const { data: chefsConfRaw } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         district_id,
//         role_id,
//         date_nomination,
//         annee_conference_id,
//         est_actif,
//         fidele:fidele_id (
//           id, nom, post_nom, prenom, contact, profile_img,
//           paroisse:paroisse_id (id, nom)
//         ),
//         departement:departement_id (id, nom),
//         district:district_id (id, nom)
//       `)
//       .eq('departement_id', info.departement_id)
//       .eq('niveau', 'conference')
//       .order('est_actif', { ascending: false })
//       .order('date_nomination', { ascending: false })

//     // ✅ Transformer les données : extraire le premier élément des tableaux
//     const chefsConfFormatted: ChefDepartement[] = (chefsConfRaw || []).map((item: any) => ({
//       id: item.id,
//       fidele_id: item.fidele_id,
//       departement_id: item.departement_id,
//       district_id: item.district_id,
//       role_id: item.role_id,
//       date_nomination: item.date_nomination,
//       annee_conference_id: item.annee_conference_id,
//       est_actif: item.est_actif,
//       fidele: item.fidele ? (Array.isArray(item.fidele) ? item.fidele[0] : item.fidele) : null,
//       departement: item.departement ? (Array.isArray(item.departement) ? item.departement[0] : item.departement) : null,
//       district: item.district ? (Array.isArray(item.district) ? item.district[0] : item.district) : null,
//       // ⚠️ Pour le sous-objet paroisse dans fidele, il faut aussi extraire
//       ...(item.fidele && {
//         fidele: item.fidele ? (() => {
//           const f = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
//           if (f?.paroisse) {
//             f.paroisse = Array.isArray(f.paroisse) ? f.paroisse[0] : f.paroisse
//           }
//           return f
//         })() : null
//       })
//     }))

//     setChefsConference(chefsConfFormatted)

//     // 4. Récupérer les chefs de district (niveau = 'district')
//     const { data: chefsDistRaw } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         district_id,
//         role_id,
//         date_nomination,
//         annee_conference_id,
//         est_actif,
//         fidele:fidele_id (
//           id, nom, post_nom, prenom, contact, profile_img,
//           paroisse:paroisse_id (id, nom)
//         ),
//         departement:departement_id (id, nom),
//         district:district_id (id, nom)
//       `)
//       .eq('departement_id', info.departement_id)
//       .eq('niveau', 'district')
//       .order('est_actif', { ascending: false })
//       .order('date_nomination', { ascending: false })

//     // ✅ Transformer les chefs de district de la même manière
//     const chefsDistFormatted: ChefDepartement[] = (chefsDistRaw || []).map((item: any) => ({
//       id: item.id,
//       fidele_id: item.fidele_id,
//       departement_id: item.departement_id,
//       district_id: item.district_id,
//       role_id: item.role_id,
//       date_nomination: item.date_nomination,
//       annee_conference_id: item.annee_conference_id,
//       est_actif: item.est_actif,
//       fidele: item.fidele ? (() => {
//         const f = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
//         if (f?.paroisse) {
//           f.paroisse = Array.isArray(f.paroisse) ? f.paroisse[0] : f.paroisse
//         }
//         return f
//       })() : null,
//       departement: item.departement ? (Array.isArray(item.departement) ? item.departement[0] : item.departement) : null,
//       district: item.district ? (Array.isArray(item.district) ? item.district[0] : item.district) : null
//     }))

//     // ✅ Grouper par district avec les données formatées
//     const grouped: Record<number, ChefDepartement[]> = {}
//     districtsData?.forEach(d => {
//       grouped[d.id] = []
//     })
//     chefsDistFormatted.forEach(chef => {
//       if (grouped[chef.district_id]) {
//         grouped[chef.district_id].push(chef)
//       }
//     })
//     setChefsDistricts(grouped)

//     // 5. Charger les années de conférence
//     const { getCurrentAnneeConference, getAnneesConference } = await import('@/actions/annee-conference')
//     const [anneeEnCours, toutesAnnees] = await Promise.all([
//       getCurrentAnneeConference(info.conference_id),
//       getAnneesConference(info.conference_id)
//     ])
    
//     toutesAnnees.sort((a, b) => (b.annee_id || 0) - (a.annee_id || 0))
//     setAvailableAnnees(toutesAnnees)
    
//     if (anneeEnCours) {
//       setSelectedFilterAnneeId(anneeEnCours.id)
//     }

//   } catch (error) {
//     console.error('Erreur loadAllData:', error)
//   }
// }




//   const filteredChefsConference = selectedFilterAnneeId
//     ? chefsConference.filter(c => c.annee_conference_id === selectedFilterAnneeId)
//     : chefsConference

//   const filteredChefsDistricts = Object.entries(chefsDistricts).reduce((acc, [districtId, chefs]) => {
//     const filtered = selectedFilterAnneeId
//       ? chefs.filter(c => c.annee_conference_id === selectedFilterAnneeId)
//       : chefs
//     if (filtered.length > 0) {
//       acc[parseInt(districtId)] = filtered
//     }
//     return acc
//   }, {} as Record<number, ChefDepartement[]>)

//   // Recherche de fidèles
//   const debouncedSearch = useCallback(
//     debounce(async (query: string) => {
//       if (query.length < 2) {
//         setFideleResults([])
//         return
//       }
//       setSearching(true)
//       try {
//         const { supabase } = await import('@/lib/supabase')
//         const { data } = await supabase
//           .from('fidele')
//           .select('id, nom, post_nom, prenom, contact, profile_img')
//           .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,post_nom.ilike.%${query}%`)
//           .eq('actif', true)
//           .limit(20)
//         setFideleResults(data || [])
//         setShowFideleDropdown(true)
//       } catch (error) {
//         console.error('Erreur recherche:', error)
//       } finally {
//         setSearching(false)
//       }
//     }, 400),
//     []
//   )

//   useEffect(() => {
//     debouncedSearch(fideleSearchTerm)
//     return () => debouncedSearch.cancel()
//   }, [fideleSearchTerm, debouncedSearch])

//   // Fonctions CRUD
//   const openAddModal = (districtId?: number) => {
//     setEditingChef(null)
//     setSelectedDistrictId(districtId?.toString() || '')
//     setSelectedRoleId('')
//     setFideleSearchTerm('')
//     setSelectedFidele(null)
//     setShowChefModal(true)
//   }

//   const openEditModal = (chef: ChefDepartement) => {
//     setEditingChef(chef)
//     setSelectedDistrictId(chef.district_id?.toString() || '')
//     setSelectedRoleId(chef.role_id?.toString() || '')
//     setSelectedFidele({
//       id: chef.fidele_id,
//       nom: chef.fidele?.nom,
//       post_nom: chef.fidele?.post_nom,
//       prenom: chef.fidele?.prenom,
//       contact: chef.fidele?.contact
//     })
//     setFideleSearchTerm(`${chef.fidele?.prenom || ''} ${chef.fidele?.nom || ''}`)
//     setShowChefModal(true)
//   }

//   const handleSelectFidele = (fidele: any) => {
//     setSelectedFidele(fidele)
//     setFideleSearchTerm(`${fidele.prenom} ${fidele.nom}`)
//     setShowFideleDropdown(false)
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setSubmitting(true)
//     setMessage(null)

//     try {
//       const { supabase } = await import('@/lib/supabase')
      
//       const niveau = activeTab === 'conference' ? 'conference' : 'district'
      
//       if (editingChef) {
//         // Mise à jour
//         const updateData: any = {
//           role_id: parseInt(selectedRoleId) || null,
//           district_id: parseInt(selectedDistrictId) || null,
//           updated_at: new Date().toISOString()
//         }
        
//         if (selectedFilterAnneeId) {
//           updateData.annee_conference_id = selectedFilterAnneeId
//         }

//         const { error } = await supabase
//           .from('chef_departement')
//           .update(updateData)
//           .eq('id', editingChef.id)

//         if (error) throw error
//         setMessage({ type: 'success', text: 'Chef mis à jour avec succès' })
//       } else {
//         // Création
//         if (!selectedFidele) {
//           setMessage({ type: 'error', text: 'Veuillez sélectionner un fidèle' })
//           setSubmitting(false)
//           return
//         }
//         if (!selectedRoleId) {
//           setMessage({ type: 'error', text: 'Veuillez sélectionner un rôle' })
//           setSubmitting(false)
//           return
//         }
//         if (niveau === 'district' && !selectedDistrictId) {
//           setMessage({ type: 'error', text: 'Veuillez sélectionner un district' })
//           setSubmitting(false)
//           return
//         }

//         const insertData: any = {
//           fidele_id: selectedFidele.id,
//           departement_id: chefInfo!.departement_id,
//           district_id: parseInt(selectedDistrictId) || null,
//           role_id: parseInt(selectedRoleId),
//           niveau: niveau,
//           est_actif: true,
//           date_nomination: new Date().toISOString()
//         }

//         if (selectedFilterAnneeId) {
//           insertData.annee_conference_id = selectedFilterAnneeId
//         }

//         const { error } = await supabase
//           .from('chef_departement')
//           .insert([insertData])

//         if (error) throw error
//         setMessage({ type: 'success', text: 'Chef ajouté avec succès' })
//       }

//       setShowChefModal(false)
//       if (chefInfo) await loadAllData(chefInfo)
//     } catch (error: any) {
//       setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   const handleToggleActif = async (chef: ChefDepartement) => {
//     try {
//       const { supabase } = await import('@/lib/supabase')
//       const { error } = await supabase
//         .from('chef_departement')
//         .update({ est_actif: !chef.est_actif, updated_at: new Date().toISOString() })
//         .eq('id', chef.id)

//       if (error) throw error
//       if (chefInfo) await loadAllData(chefInfo)
//     } catch (error) {
//       console.error('Erreur toggle:', error)
//     }
//   }

//   const handleDelete = async (chef: ChefDepartement) => {
//     try {
//       const { supabase } = await import('@/lib/supabase')
//       const { error } = await supabase
//         .from('chef_departement')
//         .delete()
//         .eq('id', chef.id)

//       if (error) throw error
//       setShowDeleteConfirm(null)
//       if (chefInfo) await loadAllData(chefInfo)
//       setMessage({ type: 'success', text: 'Chef supprimé avec succès' })
//     } catch (error: any) {
//       setMessage({ type: 'error', text: error.message })
//     }
//   }

//   const handleResetFilter = () => setSelectedFilterAnneeId(null)
  
//   const getSelectedAnneeLabel = () => {
//     if (!selectedFilterAnneeId) return null
//     const annee = availableAnnees.find(a => a.id === selectedFilterAnneeId)
//     return annee?.annee?.label || `Année #${selectedFilterAnneeId}`
//   }

//   const getRoleLabel = (chef: ChefDepartement) => {
//     if (!chef.role_id) return 'Rôle non défini'
//     const role = departementRoles.find(r => r.id === chef.role_id)
//     return role?.label_role || role?.nom_role || `Rôle #${chef.role_id}`
//   }

//   const getRoleBadgeColor = (chef: ChefDepartement) => {
//     const role = departementRoles.find(r => r.id === chef.role_id)
//     const nomRole = role?.nom_role || ''
    
//     switch (nomRole) {
//       case 'president': return 'bg-purple-50 text-purple-700 border-purple-200'
//       case 'vice_president': return 'bg-blue-50 text-blue-700 border-blue-200'
//       case 'secretaire': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
//       case 'vice_secretaire': return 'bg-teal-50 text-teal-700 border-teal-200'
//       case 'tresorier': return 'bg-amber-50 text-amber-700 border-amber-200'
//       case 'conseiller': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
//       default: return 'bg-green-50 text-green-700 border-green-200'
//     }
//   }

//   const formatDate = (dateString: string | null) => {
//     if (!dateString) return '—'
//     return new Date(dateString).toLocaleDateString('fr-FR', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     })
//   }

//   const totalChefsConf = filteredChefsConference.length
//   const totalChefsDist = Object.values(filteredChefsDistricts).reduce((sum, chefs) => sum + chefs.length, 0)

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <Loader2 size={32} className="animate-spin text-gray-400" />
//       </div>
//     )
//   }

//   if (!chefInfo) return null

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 py-6">
        
//         {/* Header */}
//         <div className="mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="p-2 bg-white border border-gray-200">
//                   <Shield size={20} className="text-gray-700" />
//                 </div>
//                 <div>
//                   <h1 className="text-2xl font-light tracking-tight text-gray-900">
//                     Responsables du département
//                   </h1>
//                   <p className="text-sm text-gray-500 mt-1">
//                     {chefInfo.departement_nom} • Conférence {chefInfo.conference_nom}
//                   </p>
//                 </div>
//               </div>
//             </div>
            
//             <Link
//               href="/chef-conference/annees"
//               className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               <ChevronLeft size={16} />
//               Retour
//             </Link>
//           </div>
//         </div>

//         {/* Message */}
//         {message && (
//           <div className={`mb-6 p-4 border-l-4 ${
//             message.type === 'success' ? 'border-l-green-500 bg-gray-50' : 'border-l-red-500 bg-gray-50'
//           }`}>
//             <div className="flex items-center gap-3">
//               {message.type === 'success' ? <CheckCircle size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
//               <span className="text-sm text-gray-700">{message.text}</span>
//               <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
//                 <X size={16} />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Barre de filtre */}
//         <div className="mb-6 bg-white border border-gray-200 p-4">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <Filter size={16} className="text-gray-400" />
//               <span className="text-sm text-gray-600">Filtrer par année :</span>
//               <div className="relative">
//                 <button
//                   onClick={() => setShowAnneeFilterDropdown(!showAnneeFilterDropdown)}
//                   disabled={loadingAnnees}
//                   className="min-w-[220px] px-4 py-2 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 bg-white disabled:opacity-50"
//                 >
//                   <span className={selectedFilterAnneeId ? 'text-gray-900' : 'text-gray-400'}>
//                     {loadingAnnees ? 'Chargement...' : selectedFilterAnneeId ? getSelectedAnneeLabel() : 'Toutes les années'}
//                   </span>
//                   <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAnneeFilterDropdown ? 'rotate-180' : ''}`} />
//                 </button>
                
//                 {showAnneeFilterDropdown && (
//                   <>
//                     <div className="fixed inset-0 z-10" onClick={() => setShowAnneeFilterDropdown(false)} />
//                     <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[220px] max-h-64 overflow-y-auto">
//                       <button
//                         onClick={() => { setSelectedFilterAnneeId(null); setShowAnneeFilterDropdown(false) }}
//                         className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${!selectedFilterAnneeId ? 'bg-gray-50' : ''}`}
//                       >
//                         Toutes les années
//                       </button>
//                       <div className="border-t border-gray-100" />
//                       {availableAnnees.map(ac => (
//                         <button
//                           key={ac.id}
//                           onClick={() => { setSelectedFilterAnneeId(ac.id); setShowAnneeFilterDropdown(false) }}
//                           className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${selectedFilterAnneeId === ac.id ? 'bg-gray-50' : ''}`}
//                         >
//                           <span>{ac.annee?.label || `Année ${ac.annee_id}`}</span>
//                           {ac.is_current && (
//                             <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium">En cours</span>
//                           )}
//                         </button>
//                       ))}
//                     </div>
//                   </>
//                 )}
//               </div>
//             </div>
//             {selectedFilterAnneeId && (
//               <button onClick={handleResetFilter} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
//                 <FilterX size={14} /> Réinitialiser
//               </button>
//             )}
//           </div>
//         </div>

//         {/* Onglets */}
//         <div className="mb-6">
//           <div className="border-b border-gray-200">
//             <nav className="-mb-px flex space-x-8">
//               <button
//                 onClick={() => setActiveTab('conference')}
//                 className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-all ${
//                   activeTab === 'conference' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 <Globe size={16} />
//                 Niveau Conférence
//                 <span className="text-xs text-gray-400 ml-1">({totalChefsConf})</span>
//               </button>
//               <button
//                 onClick={() => setActiveTab('districts')}
//                 className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-all ${
//                   activeTab === 'districts' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
//                 }`}
//               >
//                 <Layers size={16} />
//                 Niveau District
//                 <span className="text-xs text-gray-400 ml-1">({totalChefsDist})</span>
//               </button>
//             </nav>
//           </div>
//         </div>

//         {/* Contenu */}
//         {activeTab === 'conference' && (
//           <div>
//             <div className="flex justify-between items-center mb-4">
//               <p className="text-sm text-gray-500">
//                 {filteredChefsConference.length} responsable{filteredChefsConference.length > 1 ? 's' : ''}
//               </p>
//               <button
//                 onClick={() => openAddModal()}
//                 className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
//               >
//                 <Plus size={16} />
//                 Ajouter un responsable
//               </button>
//             </div>

//             {filteredChefsConference.length === 0 ? (
//               <div className="bg-white border border-gray-200 p-12 text-center">
//                 <Users size={48} className="text-gray-300 mx-auto mb-4" />
//                 <p className="text-gray-500">Aucun responsable au niveau conférence</p>
//               </div>
//             ) : (
//               <div className="bg-white border border-gray-200 overflow-hidden">
//                 <table className="min-w-full">
//                   <thead>
//                     <tr className="border-b border-gray-100 bg-gray-50">
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paroisse</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nommé le</th>
//                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
//                       <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-100">
//                     {filteredChefsConference.map(chef => {
//                       const roleLabel = getRoleLabel(chef)
//                       const badgeColor = getRoleBadgeColor(chef)
                      
//                       return (
//                         <tr key={chef.id} className="hover:bg-gray-50/50">
//                           <td className="px-6 py-3">
//                             <div className="flex items-center gap-3">
//                               <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
//                                 {chef.fidele?.profile_img ? (
//                                   <img src={chef.fidele.profile_img} alt="" className="w-full h-full object-cover" />
//                                 ) : (
//                                   <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
//                                     {chef.fidele?.prenom?.[0] || '?'}
//                                   </div>
//                                 )}
//                               </div>
//                               <div>
//                                 <p className="text-sm text-gray-900">
//                                   {chef.fidele?.prenom} {chef.fidele?.nom}
//                                 </p>
//                                 {chef.fidele?.contact && (
//                                   <p className="text-xs text-gray-400">{chef.fidele.contact}</p>
//                                 )}
//                               </div>
//                             </div>
//                           </td>
//                           <td className="px-6 py-3">
//                             {chef.role_id ? (
//                               <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${badgeColor}`}>
//                                 <Shield size={12} />
//                                 {roleLabel}
//                               </span>
//                             ) : (
//                               <span className="text-sm text-gray-400">—</span>
//                             )}
//                           </td>
//                           <td className="px-6 py-3">
//                             <span className="text-sm text-gray-600 flex items-center gap-1.5">
//                               <Church size={12} className="text-gray-400" />
//                               {chef.fidele?.paroisse?.nom || '—'}
//                             </span>
//                           </td>
//                           <td className="px-6 py-3">
//                             <span className="text-sm text-gray-500 flex items-center gap-1.5">
//                               <Calendar size={12} className="text-gray-400" />
//                               {formatDate(chef.date_nomination)}
//                             </span>
//                           </td>
//                           <td className="px-6 py-3">
//                             <button
//                               onClick={() => handleToggleActif(chef)}
//                               className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${
//                                 chef.est_actif 
//                                   ? 'bg-green-50 text-green-700 border-green-200' 
//                                   : 'bg-gray-50 text-gray-500 border-gray-200'
//                               }`}
//                             >
//                               {chef.est_actif ? <><CheckCircle size={12} /> Actif</> : <><XCircle size={12} /> Inactif</>}
//                             </button>
//                           </td>
//                           <td className="px-6 py-3 text-right">
//                             <div className="flex items-center justify-end gap-1">
//                               <button
//                                 onClick={() => openEditModal(chef)}
//                                 className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
//                               >
//                                 <Edit2 size={14} />
//                               </button>
//                               <button
//                                 onClick={() => setShowDeleteConfirm(chef)}
//                                 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
//                               >
//                                 <Trash2 size={14} />
//                               </button>
//                             </div>
//                           </td>
//                         </tr>
//                       )
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             )}
//           </div>
//         )}

//         {activeTab === 'districts' && (
//           <div className="space-y-4">
//             {districts.map(district => {
//               const chefs = filteredChefsDistricts[district.id] || []
              
//               return (
//                 <div key={district.id} className="bg-white border border-gray-200">
//                   <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
//                     <div className="flex items-center gap-3">
//                       <MapPin size={16} className="text-gray-400" />
//                       <h3 className="font-medium text-gray-900">{district.nom}</h3>
//                       <span className="text-xs text-gray-500">
//                         {chefs.length} responsable{chefs.length > 1 ? 's' : ''}
//                       </span>
//                     </div>
//                     <button
//                       onClick={() => openAddModal(district.id)}
//                       className="inline-flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-800 transition-colors"
//                     >
//                       <Plus size={14} />
//                       Ajouter
//                     </button>
//                   </div>

//                   <div className="p-4">
//                     {chefs.length === 0 ? (
//                       <p className="text-sm text-gray-400 text-center py-6">Aucun responsable</p>
//                     ) : (
//                       <div className="space-y-3">
//                         {chefs.map(chef => {
//                           const roleLabel = getRoleLabel(chef)
//                           const badgeColor = getRoleBadgeColor(chef)
                          
//                           return (
//                             <div key={chef.id} className="flex items-center gap-4 p-3 bg-gray-50">
//                               <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
//                                 {chef.fidele?.profile_img ? (
//                                   <img src={chef.fidele.profile_img} alt="" className="w-full h-full object-cover" />
//                                 ) : (
//                                   <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
//                                     {chef.fidele?.prenom?.[0] || '?'}
//                                   </div>
//                                 )}
//                               </div>
//                               <div className="flex-1 min-w-0">
//                                 <div className="flex items-center gap-2 flex-wrap">
//                                   <span className="text-sm font-medium text-gray-900">
//                                     {chef.fidele?.prenom} {chef.fidele?.nom}
//                                   </span>
//                                   {chef.role_id ? (
//                                     <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 border ${badgeColor}`}>
//                                       <Shield size={10} />
//                                       {roleLabel}
//                                     </span>
//                                   ) : (
//                                     <span className="text-xs text-gray-400">Rôle non défini</span>
//                                   )}
//                                 </div>
//                                 <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
//                                   {chef.fidele?.paroisse?.nom && (
//                                     <span className="flex items-center gap-1">
//                                       <Church size={10} /> {chef.fidele.paroisse.nom}
//                                     </span>
//                                   )}
//                                   {chef.fidele?.contact && (
//                                     <span className="flex items-center gap-1">
//                                       <Phone size={10} /> {chef.fidele.contact}
//                                     </span>
//                                   )}
//                                   <span>
//                                     <Calendar size={10} className="inline mr-0.5" />
//                                     {formatDate(chef.date_nomination)}
//                                   </span>
//                                 </div>
//                               </div>
//                               <button
//                                 onClick={() => handleToggleActif(chef)}
//                                 className={`text-xs px-2 py-0.5 border ${
//                                   chef.est_actif 
//                                     ? 'bg-green-50 text-green-700 border-green-200' 
//                                     : 'bg-gray-50 text-gray-500 border-gray-200'
//                                 }`}
//                               >
//                                 {chef.est_actif ? 'Actif' : 'Inactif'}
//                               </button>
//                               <button
//                                 onClick={() => openEditModal(chef)}
//                                 className="p-1 text-gray-400 hover:text-black"
//                               >
//                                 <Edit2 size={14} />
//                               </button>
//                               <button
//                                 onClick={() => setShowDeleteConfirm(chef)}
//                                 className="p-1 text-gray-400 hover:text-red-600"
//                               >
//                                 <Trash2 size={14} />
//                               </button>
//                             </div>
//                           )
//                         })}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         )}

//         {/* Modal Ajout/Édition */}
//         {showChefModal && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white w-full max-w-lg">
//               <div className="flex justify-between items-center p-4 border-b border-gray-200">
//                 <h3 className="text-lg font-light">
//                   {editingChef ? 'Modifier le responsable' : 'Ajouter un responsable'}
//                 </h3>
//                 <button onClick={() => setShowChefModal(false)} className="text-gray-400 hover:text-black">
//                   <X size={20} />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="p-4 space-y-4">
//                 {/* District (seulement pour niveau district) */}
//                 {activeTab === 'districts' && (
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">
//                       District <span className="text-red-500">*</span>
//                     </label>
//                     <select
//                       value={selectedDistrictId}
//                       onChange={(e) => setSelectedDistrictId(e.target.value)}
//                       className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
//                       required
//                     >
//                       <option value="">Sélectionner un district</option>
//                       {districts.map(d => (
//                         <option key={d.id} value={d.id}>{d.nom}</option>
//                       ))}
//                     </select>
//                   </div>
//                 )}

//                 {/* Fidèle */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Fidèle {!editingChef && <span className="text-red-500">*</span>}
//                   </label>
//                   {editingChef ? (
//                     <div className="p-3 bg-gray-50 border border-gray-200 text-sm">
//                   {editingChef.fidele?.prenom} {editingChef.fidele?.nom}
//                     </div>
//                   ) : (
//                     <div className="relative">
//                       <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                       <input
//                         type="text"
//                         placeholder="Rechercher un fidèle..."
//                         value={fideleSearchTerm}
//                         onChange={(e) => setFideleSearchTerm(e.target.value)}
//                         onFocus={() => fideleResults.length > 0 && setShowFideleDropdown(true)}
//                         className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
//                         autoComplete="off"
//                       />
//                       {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                      
//                       {showFideleDropdown && fideleResults.length > 0 && (
//                         <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-64 overflow-y-auto">
//                           {fideleResults.map(f => (
//                             <button
//                               key={f.id}
//                               type="button"
//                               onClick={() => handleSelectFidele(f)}
//                               className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100"
//                             >
//                               <p className="font-medium text-sm">{f.prenom} {f.nom} {f.post_nom || ''}</p>
//                               {f.contact && <p className="text-xs text-gray-400">{f.contact}</p>}
//                             </button>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}
//                   {selectedFidele && !editingChef && (
//                     <div className="mt-2 p-2 bg-green-50 border border-green-200 text-sm flex items-center justify-between">
//                       <span className="text-green-700">{selectedFidele.prenom} {selectedFidele.nom}</span>
//                       <button
//                         type="button"
//                         onClick={() => { setSelectedFidele(null); setFideleSearchTerm('') }}
//                         className="text-green-600 hover:text-green-800"
//                       >
//                         <X size={14} />
//                       </button>
//                     </div>
//                   )}
//                 </div>

//                 {/* Rôle */}
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Rôle <span className="text-red-500">*</span>
//                   </label>
//                   <select
//                     value={selectedRoleId}
//                     onChange={(e) => setSelectedRoleId(e.target.value)}
//                     className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
//                     required
//                   >
//                     <option value="">Sélectionner un rôle</option>
//                     {departementRoles.map(role => (
//                       <option key={role.id} value={role.id}>
//                         {role.label_role || role.nom_role}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div className="flex gap-3 pt-2">
//                   <button
//                     type="button"
//                     onClick={() => setShowChefModal(false)}
//                     className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm transition-colors"
//                   >
//                     Annuler
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={submitting || (!editingChef && !selectedFidele)}
//                     className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
//                   >
//                     {submitting && <Loader2 size={14} className="animate-spin" />}
//                     {editingChef ? 'Mettre à jour' : 'Ajouter'}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}

//         {/* Modal confirmation suppression */}
//         {showDeleteConfirm && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white w-full max-w-md p-6">
//               <div className="text-center mb-4">
//                 <AlertCircle size={48} className="mx-auto text-orange-500 mb-3" />
//                 <h3 className="text-lg font-medium mb-2">Supprimer ce responsable ?</h3>
//                 <p className="text-sm text-gray-500">
//                   {showDeleteConfirm.fidele?.prenom} {showDeleteConfirm.fidele?.nom} sera définitivement retiré.
//                 </p>
//               </div>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setShowDeleteConfirm(null)}
//                   className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   onClick={() => handleDelete(showDeleteConfirm)}
//                   className="flex-1 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700"
//                 >
//                   Supprimer
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   )
// }

// app/chef-conference/responsables/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  ChevronLeft, 
  User,
  Calendar,
  Shield,
  Layers,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Trash2,
  Edit2,
  AlertCircle,
  X,
  Filter,
  FilterX,
  ChevronDown,
  MapPin,
  Church,
  Phone
} from 'lucide-react'
import { debounce } from 'lodash'
import { getAnneesConference } from '@/actions/annee-conference'
import type { AnneeConference } from '@/actions/annee-conference'
import AjouterRoleModal from '@/components/AjouterRoleModal'

// Types
interface ChefConferenceInfo {
  id: number
  fidele_id: number
  departement_id: number
  conference_id: number
  departement_nom: string
  departement_type: string
  conference_nom: string
  fidele_nom: string
  fidele_prenom: string
}

interface ChefDepartement {
  id: number
  fidele_id: number
  departement_id: number
  district_id: number
  role_id: number | null
  date_nomination: string
  annee_conference_id: number | null
  est_actif: boolean
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
    paroisse?: {
      id: number
      nom: string
    }
  }
  departement?: {
    id: number
    nom: string
  }
  district?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role: string
    label_role: string
  }
}

type TabType = 'conference' | 'districts'

export default function ChefsConferencePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('districts')
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<ChefConferenceInfo | null>(null)
  
  // Données
  const [chefsConference, setChefsConference] = useState<ChefDepartement[]>([])
  const [chefsDistricts, setChefsDistricts] = useState<Record<number, ChefDepartement[]>>({})
  const [districts, setDistricts] = useState<any[]>([])
  
  // Filtre par année
  const [availableAnnees, setAvailableAnnees] = useState<AnneeConference[]>([])
  const [selectedFilterAnneeId, setSelectedFilterAnneeId] = useState<number | null>(null)
  const [showAnneeFilterDropdown, setShowAnneeFilterDropdown] = useState(false)
  const [loadingAnnees, setLoadingAnnees] = useState(false)

  // Modal ajout/édition chef
  const [showChefModal, setShowChefModal] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [editingChef, setEditingChef] = useState<ChefDepartement | null>(null)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [fideleSearchTerm, setFideleSearchTerm] = useState('')
  const [fideleResults, setFideleResults] = useState<any[]>([])
  const [selectedFidele, setSelectedFidele] = useState<any>(null)
  const [showFideleDropdown, setShowFideleDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<ChefDepartement | null>(null)

  // ✅ Rôles disponibles (chargés depuis les actions)
  const [rolesDisponibles, setRolesDisponibles] = useState<any[]>([])
  const [rolesFiltres, setRolesFiltres] = useState<any[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const { getChefConferenceInfo } = await import('@/actions/chef-conference')
      const info = await getChefConferenceInfo()
      
      if (!info) {
        router.push('/profile')
        return
      }
      
      setChefInfo(info)
      await loadAllData(info)
      
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Charger les rôles selon le niveau (conference ou district)
  const loadRoles = async () => {
    setLoadingRoles(true)
    try {
      if (activeTab === 'conference') {
        const { getRolesDisponiblesPourConference } = await import('@/actions/chef-departement-conference')
        const roles = await getRolesDisponiblesPourConference()
        setRolesDisponibles(roles)
        setRolesFiltres(roles)
      } else {
        const { getRolesDisponiblesPourDistrict } = await import('@/actions/chef-departement')
        const roles = await getRolesDisponiblesPourDistrict()
        setRolesDisponibles(roles)
        setRolesFiltres(roles)
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error)
    } finally {
      setLoadingRoles(false)
    }
  }

  // Recharger les rôles quand on change d'onglet
  useEffect(() => {
    if (chefInfo) {
      loadRoles()
    }
  }, [activeTab])

  // Filtrer les rôles déjà pris dans le département
  useEffect(() => {
    if (activeTab === 'conference') {
      // Pour la conférence, tous les rôles sont disponibles (pas de filtre par district)
      setRolesFiltres(rolesDisponibles)
    }
  }, [rolesDisponibles, activeTab])

  const loadAllData = async (info: ChefConferenceInfo) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      
      // 1. Récupérer les districts de la conférence
      const { data: districtsData } = await supabase
        .from('district')
        .select('id, nom')
        .eq('conference_id', info.conference_id)
        .order('nom')
      
      setDistricts(districtsData || [])

      // ✅ 2. Charger les rôles depuis les actions (selon le niveau)
      await loadRoles()

      // 3. Récupérer les chefs de conférence (niveau = 'conference')
      const { data: chefsConfRaw } = await supabase
        .from('chef_departement')
        .select(`
          id, fidele_id, departement_id, district_id, role_id,
          date_nomination, annee_conference_id, est_actif,
          fidele:fidele_id (id, nom, post_nom, prenom, contact, profile_img, paroisse:paroisse_id (id, nom)),
          departement:departement_id (id, nom),
          district:district_id (id, nom)
        `)
        .eq('departement_id', info.departement_id)
        .eq('niveau', 'conference')
        .order('est_actif', { ascending: false })
        .order('date_nomination', { ascending: false })

      setChefsConference(formatChefsData(chefsConfRaw || []))

      // 4. Récupérer les chefs de district (niveau = 'district')
      const { data: chefsDistRaw } = await supabase
        .from('chef_departement')
        .select(`
          id, fidele_id, departement_id, district_id, role_id,
          date_nomination, annee_conference_id, est_actif,
          fidele:fidele_id (id, nom, post_nom, prenom, contact, profile_img, paroisse:paroisse_id (id, nom)),
          departement:departement_id (id, nom),
          district:district_id (id, nom)
        `)
        .eq('departement_id', info.departement_id)
        .eq('niveau', 'district')
        .order('est_actif', { ascending: false })
        .order('date_nomination', { ascending: false })

      const chefsDistFormatted = formatChefsData(chefsDistRaw || [])
      
      // Grouper par district
      const grouped: Record<number, ChefDepartement[]> = {}
      districtsData?.forEach(d => { grouped[d.id] = [] })
      chefsDistFormatted.forEach(chef => {
        if (grouped[chef.district_id]) {
          grouped[chef.district_id].push(chef)
        }
      })
      setChefsDistricts(grouped)

      // 5. Charger les années de conférence
      const annees = await getAnneesConference(info.conference_id)
      annees.sort((a, b) => (b.annee_id || 0) - (a.annee_id || 0))
      setAvailableAnnees(annees)
      
      const anneeEnCours = annees.find(a => a.is_current)
      if (anneeEnCours) {
        setSelectedFilterAnneeId(anneeEnCours.id)
      }

    } catch (error) {
      console.error('Erreur loadAllData:', error)
    }
  }

  // ✅ Fonction utilitaire pour formater les données Supabase
  function formatChefsData(rawData: any[]): ChefDepartement[] {
    return rawData.map((item: any) => {
      const fidele = item.fidele ? (Array.isArray(item.fidele) ? item.fidele[0] : item.fidele) : null
      if (fidele?.paroisse) {
        fidele.paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
      }
      
      return {
        id: item.id,
        fidele_id: item.fidele_id,
        departement_id: item.departement_id,
        district_id: item.district_id,
        role_id: item.role_id,
        date_nomination: item.date_nomination,
        annee_conference_id: item.annee_conference_id,
        est_actif: item.est_actif,
        fidele,
        departement: item.departement ? (Array.isArray(item.departement) ? item.departement[0] : item.departement) : null,
        district: item.district ? (Array.isArray(item.district) ? item.district[0] : item.district) : null,
        role: item.role_id ? rolesDisponibles.find(r => r.id === item.role_id) || null : null
      }
    })
  }

  // Filtrer par année
  const filteredChefsConference = selectedFilterAnneeId
    ? chefsConference.filter(c => c.annee_conference_id === selectedFilterAnneeId)
    : chefsConference

  const filteredChefsDistricts = Object.entries(chefsDistricts).reduce((acc, [districtId, chefs]) => {
    const filtered = selectedFilterAnneeId
      ? chefs.filter(c => c.annee_conference_id === selectedFilterAnneeId)
      : chefs
    if (filtered.length > 0) acc[parseInt(districtId)] = filtered
    return acc
  }, {} as Record<number, ChefDepartement[]>)

  // Recherche de fidèles (debounced)
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) { setFideleResults([]); return }
      setSearching(true)
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase
          .from('fidele')
          .select('id, nom, post_nom, prenom, contact, profile_img')
          .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,post_nom.ilike.%${query}%`)
          .eq('actif', true)
          .limit(20)
        setFideleResults(data || [])
        setShowFideleDropdown(true)
      } catch (error) {
        console.error('Erreur recherche:', error)
      } finally {
        setSearching(false)
      }
    }, 400),
    []
  )

  useEffect(() => {
    debouncedSearch(fideleSearchTerm)
    return () => debouncedSearch.cancel()
  }, [fideleSearchTerm, debouncedSearch])

  // Fonctions CRUD
  const openAddModal = (districtId?: number) => {
    setEditingChef(null)
    setSelectedDistrictId(districtId?.toString() || '')
    setSelectedRoleId('')
    setFideleSearchTerm('')
    setSelectedFidele(null)
    setRolesFiltres(rolesDisponibles)
    setShowChefModal(true)
  }

  const openEditModal = (chef: ChefDepartement) => {
    setEditingChef(chef)
    setSelectedDistrictId(chef.district_id?.toString() || '')
    setSelectedRoleId(chef.role_id?.toString() || '')
    setSelectedFidele({
      id: chef.fidele_id,
      nom: chef.fidele?.nom,
      post_nom: chef.fidele?.post_nom,
      prenom: chef.fidele?.prenom,
      contact: chef.fidele?.contact
    })
    setFideleSearchTerm(`${chef.fidele?.prenom || ''} ${chef.fidele?.nom || ''}`)
    setRolesFiltres(rolesDisponibles)
    setShowChefModal(true)
  }

  const handleSelectFidele = (fidele: any) => {
    setSelectedFidele(fidele)
    setFideleSearchTerm(`${fidele.prenom} ${fidele.nom}`)
    setShowFideleDropdown(false)
  }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setSubmitting(true)
//     setMessage(null)

//     try {
//       const { supabase } = await import('@/lib/supabase')
//       const niveau = activeTab === 'conference' ? 'conference' : 'district'
      
//       if (editingChef) {
//         const updateData: any = {
//           role_id: parseInt(selectedRoleId) || null,
//           district_id: parseInt(selectedDistrictId) || null,
//           updated_at: new Date().toISOString()
//         }
//         if (selectedFilterAnneeId) updateData.annee_conference_id = selectedFilterAnneeId

//         const { error } = await supabase
//           .from('chef_departement')
//           .update(updateData)
//           .eq('id', editingChef.id)

//         if (error) throw error
//         setMessage({ type: 'success', text: 'Chef mis à jour avec succès' })
//       } else {
//         if (!selectedFidele) { setMessage({ type: 'error', text: 'Veuillez sélectionner un fidèle' }); setSubmitting(false); return }
//         if (!selectedRoleId) { setMessage({ type: 'error', text: 'Veuillez sélectionner un rôle' }); setSubmitting(false); return }
//         if (niveau === 'district' && !selectedDistrictId) { setMessage({ type: 'error', text: 'Veuillez sélectionner un district' }); setSubmitting(false); return }

//         const insertData: any = {
//           fidele_id: selectedFidele.id,
//           departement_id: chefInfo!.departement_id,
//           district_id: parseInt(selectedDistrictId) || null,
//           role_id: parseInt(selectedRoleId),
//           niveau: niveau,
//           est_actif: true,
//           date_nomination: new Date().toISOString()
//         }
//         if (selectedFilterAnneeId) insertData.annee_conference_id = selectedFilterAnneeId

//         const { error } = await supabase
//           .from('chef_departement')
//           .insert([insertData])

//         if (error) throw error
//         setMessage({ type: 'success', text: 'Chef ajouté avec succès' })
//       }

//       setShowChefModal(false)
//       if (chefInfo) await loadAllData(chefInfo)
//     } catch (error: any) {
//       setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
//     } finally {
//       setSubmitting(false)
//     }
//   }
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setSubmitting(true)
  setMessage(null)

  try {
    const { supabase } = await import('@/lib/supabase')
    const niveau = activeTab === 'conference' ? 'conference' : 'district'
    
    if (editingChef) {
      const updateData: any = {
        role_id: parseInt(selectedRoleId) || null,
        updated_at: new Date().toISOString()
      }
      
      // ✅ Ne pas modifier le district_id ou le niveau lors d'une édition
      // (sauf si on veut permettre de changer le district)
      if (activeTab === 'districts' && selectedDistrictId) {
        updateData.district_id = parseInt(selectedDistrictId)
      }
      
      if (selectedFilterAnneeId) updateData.annee_conference_id = selectedFilterAnneeId

      const { error } = await supabase
        .from('chef_departement')
        .update(updateData)
        .eq('id', editingChef.id)

      if (error) throw error
      setMessage({ type: 'success', text: 'Chef mis à jour avec succès' })
    } else {
      // Création
      if (!selectedFidele) { setMessage({ type: 'error', text: 'Veuillez sélectionner un fidèle' }); setSubmitting(false); return }
      if (!selectedRoleId) { setMessage({ type: 'error', text: 'Veuillez sélectionner un rôle' }); setSubmitting(false); return }
      
      // ✅ Construction de l'objet d'insertion selon le niveau
      const insertData: any = {
        fidele_id: selectedFidele.id,
        departement_id: chefInfo!.departement_id,
        role_id: parseInt(selectedRoleId),
        niveau: niveau,
        est_actif: true,
        date_nomination: new Date().toISOString()
      }

      if (niveau === 'conference') {
        // ✅ Niveau conférence : conference_id = l'ID de la conférence du chef
        insertData.conference_id = chefInfo!.conference_id
        insertData.district_id = null // ou ne pas mettre du tout
      } else {
        // ✅ Niveau district : district_id obligatoire
        if (!selectedDistrictId) { 
          setMessage({ type: 'error', text: 'Veuillez sélectionner un district' })
          setSubmitting(false)
          return 
        }
        insertData.district_id = parseInt(selectedDistrictId)
        insertData.conference_id = null // ou ne pas mettre du tout
      }

      if (selectedFilterAnneeId) insertData.annee_conference_id = selectedFilterAnneeId

      console.log('📝 Insertion chef:', insertData)

      const { error } = await supabase
        .from('chef_departement')
        .insert([insertData])

      if (error) {
        console.error('❌ Erreur insertion:', error)
        throw error
      }
      
      setMessage({ type: 'success', text: 'Chef ajouté avec succès' })
    }

    setShowChefModal(false)
    if (chefInfo) await loadAllData(chefInfo)
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    setMessage({ type: 'error', text: error.message || 'Une erreur est survenue' })
  } finally {
    setSubmitting(false)
  }
}
  const handleToggleActif = async (chef: ChefDepartement) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase
        .from('chef_departement')
        .update({ est_actif: !chef.est_actif, updated_at: new Date().toISOString() })
        .eq('id', chef.id)
      if (chefInfo) await loadAllData(chefInfo)
    } catch (error) { console.error('Erreur toggle:', error) }
  }

  const handleDelete = async (chef: ChefDepartement) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('chef_departement').delete().eq('id', chef.id)
      setShowDeleteConfirm(null)
      if (chefInfo) await loadAllData(chefInfo)
      setMessage({ type: 'success', text: 'Chef supprimé avec succès' })
    } catch (error: any) { setMessage({ type: 'error', text: error.message }) }
  }

  const handleRoleAdded = () => {
    setMessage({ type: 'success', text: 'Nouveau rôle ajouté avec succès' })
    loadRoles()
    if (chefInfo) loadAllData(chefInfo)
  }

  const handleResetFilter = () => setSelectedFilterAnneeId(null)
  
  const getSelectedAnneeLabel = () => {
    if (!selectedFilterAnneeId) return null
    const annee = availableAnnees.find(a => a.id === selectedFilterAnneeId)
    return annee?.annee?.label || `Année #${selectedFilterAnneeId}`
  }

  const getRoleLabel = (chef: ChefDepartement) => {
    if (!chef.role_id) return 'Rôle non défini'
    const role = rolesDisponibles.find(r => r.id === chef.role_id)
    return role?.label_role || role?.nom_role || `Rôle #${chef.role_id}`
  }

  const getRoleBadgeColor = (chef: ChefDepartement) => {
    const role = rolesDisponibles.find(r => r.id === chef.role_id)
    const nomRole = role?.nom_role || ''
    switch (nomRole) {
      case 'president': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'vice_president': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'secretaire': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'vice_secretaire': return 'bg-teal-50 text-teal-700 border-teal-200'
      case 'tresorier': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'conseiller': return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      default: return 'bg-green-50 text-green-700 border-green-200'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const totalChefsConf = filteredChefsConference.length
  const totalChefsDist = Object.values(filteredChefsDistricts).reduce((sum, chefs) => sum + chefs.length, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!chefInfo) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white border border-gray-200">
                  <Shield size={20} className="text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-light tracking-tight text-gray-900">
                    Responsables du département
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    {chefInfo.departement_nom} • Conférence {chefInfo.conference_nom}
                  </p>
                </div>
              </div>
            </div>
            <Link href="/chef-conference/annees" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600">
              <ChevronLeft size={16} /> Retour
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-gray-50' : 'border-l-red-500 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
              <span className="text-sm text-gray-700">{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* Barre de filtre */}
        <div className="mb-6 bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Filtrer par année :</span>
              <div className="relative">
                <button onClick={() => setShowAnneeFilterDropdown(!showAnneeFilterDropdown)} disabled={loadingAnnees}
                  className="min-w-[220px] px-4 py-2 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 bg-white disabled:opacity-50">
                  <span className={selectedFilterAnneeId ? 'text-gray-900' : 'text-gray-400'}>
                    {loadingAnnees ? 'Chargement...' : selectedFilterAnneeId ? getSelectedAnneeLabel() : 'Toutes les années'}
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAnneeFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showAnneeFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowAnneeFilterDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[220px] max-h-64 overflow-y-auto">
                      <button onClick={() => { setSelectedFilterAnneeId(null); setShowAnneeFilterDropdown(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 ${!selectedFilterAnneeId ? 'bg-gray-50' : ''}`}>Toutes les années</button>
                      <div className="border-t border-gray-100" />
                      {availableAnnees.map(ac => (
                        <button key={ac.id} onClick={() => { setSelectedFilterAnneeId(ac.id); setShowAnneeFilterDropdown(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${selectedFilterAnneeId === ac.id ? 'bg-gray-50' : ''}`}>
                          <span>{ac.annee?.label || `Année ${ac.annee_id}`}</span>
                          {ac.is_current && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium">En cours</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            {selectedFilterAnneeId && (
              <button onClick={handleResetFilter} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
                <FilterX size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button onClick={() => setActiveTab('conference')}
                className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'conference' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Globe size={16} /> Niveau Conférence <span className="text-xs text-gray-400 ml-1">({totalChefsConf})</span>
              </button>
              <button onClick={() => setActiveTab('districts')}
                className={`group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium ${activeTab === 'districts' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <Layers size={16} /> Niveau District <span className="text-xs text-gray-400 ml-1">({totalChefsDist})</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu Conférence */}
        {activeTab === 'conference' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">{filteredChefsConference.length} responsable{filteredChefsConference.length > 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowAddRoleModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                  <Plus size={16} /> Nouveau rôle
                </button>
                <button onClick={() => openAddModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800">
                  <Plus size={16} /> Ajouter un responsable
                </button>
              </div>
            </div>

            {filteredChefsConference.length === 0 ? (
              <div className="bg-white border border-gray-200 p-12 text-center">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun responsable au niveau conférence</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsable</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paroisse</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nommé le</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredChefsConference.map(chef => (
                      <tr key={chef.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                              {chef.fidele?.profile_img ? <img src={chef.fidele.profile_img} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{chef.fidele?.prenom?.[0] || '?'}</div>}
                            </div>
                            <div>
                              <p className="text-sm text-gray-900">{chef.fidele?.prenom} {chef.fidele?.nom}</p>
                              {chef.fidele?.contact && <p className="text-xs text-gray-400">{chef.fidele.contact}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {chef.role_id ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${getRoleBadgeColor(chef)}`}>
                              <Shield size={12} /> {getRoleLabel(chef)}
                            </span>
                          ) : <span className="text-sm text-gray-400">—</span>}
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-gray-600 flex items-center gap-1.5">
                            <Church size={12} className="text-gray-400" /> {chef.fidele?.paroisse?.nom || '—'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Calendar size={12} className="text-gray-400" /> {formatDate(chef.date_nomination)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button onClick={() => handleToggleActif(chef)}
                            className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${chef.est_actif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                            {chef.est_actif ? <><CheckCircle size={12} /> Actif</> : <><XCircle size={12} /> Inactif</>}
                          </button>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => openEditModal(chef)} className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100"><Edit2 size={14} /></button>
                          <button onClick={() => setShowDeleteConfirm(chef)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contenu Districts */}
        {activeTab === 'districts' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={() => setShowAddRoleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50">
                <Plus size={16} /> Nouveau rôle
              </button>
            </div>
            {districts.map(district => {
              const chefs = filteredChefsDistricts[district.id] || []
              return (
                <div key={district.id} className="bg-white border border-gray-200">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-gray-400" />
                      <h3 className="font-medium text-gray-900">{district.nom}</h3>
                      <span className="text-xs text-gray-500">({chefs.length})</span>
                    </div>
                    <button onClick={() => openAddModal(district.id)}
                      className="inline-flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-800">
                      <Plus size={14} /> Ajouter
                    </button>
                  </div>
                  <div className="p-4">
                    {chefs.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">Aucun responsable</p>
                    ) : (
                      <div className="space-y-3">
                        {chefs.map(chef => (
                          <div key={chef.id} className="flex items-center gap-4 p-3 bg-gray-50">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {chef.fidele?.profile_img ? <img src={chef.fidele.profile_img} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">{chef.fidele?.prenom?.[0] || '?'}</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">{chef.fidele?.prenom} {chef.fidele?.nom}</span>
                                {chef.role_id ? (
                                  <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 border ${getRoleBadgeColor(chef)}`}>
                                    <Shield size={10} /> {getRoleLabel(chef)}
                                  </span>
                                ) : <span className="text-xs text-gray-400">Rôle non défini</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                                {chef.fidele?.paroisse?.nom && <span className="flex items-center gap-1"><Church size={10} /> {chef.fidele.paroisse.nom}</span>}
                                {chef.fidele?.contact && <span className="flex items-center gap-1"><Phone size={10} /> {chef.fidele.contact}</span>}
                                <span><Calendar size={10} className="inline mr-0.5" />{formatDate(chef.date_nomination)}</span>
                              </div>
                            </div>
                            <button onClick={() => handleToggleActif(chef)}
                              className={`text-xs px-2 py-0.5 border ${chef.est_actif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                              {chef.est_actif ? 'Actif' : 'Inactif'}
                            </button>
                            <button onClick={() => openEditModal(chef)} className="p-1 text-gray-400 hover:text-black"><Edit2 size={14} /></button>
                            <button onClick={() => setShowDeleteConfirm(chef)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Ajout/Édition */}
        {showChefModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-light">{editingChef ? 'Modifier le responsable' : 'Ajouter un responsable'}</h3>
                <button onClick={() => setShowChefModal(false)} className="text-gray-400 hover:text-black"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {activeTab === 'districts' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">District <span className="text-red-500">*</span></label>
                    <select value={selectedDistrictId} onChange={(e) => setSelectedDistrictId(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black" required>
                      <option value="">Sélectionner un district</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fidèle {!editingChef && <span className="text-red-500">*</span>}</label>
                  {editingChef ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 text-sm">
                      {editingChef.fidele?.prenom} {editingChef.fidele?.nom}
                    </div>
                  ) : (
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Rechercher un fidèle..." value={fideleSearchTerm}
                        onChange={(e) => setFideleSearchTerm(e.target.value)}
                        onFocus={() => fideleResults.length > 0 && setShowFideleDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black" autoComplete="off" />
                      {searching && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
                      {showFideleDropdown && fideleResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-64 overflow-y-auto">
                          {fideleResults.map(f => (
                            <button key={f.id} type="button" onClick={() => handleSelectFidele(f)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                              <p className="font-medium text-sm">{f.prenom} {f.nom} {f.post_nom || ''}</p>
                              {f.contact && <p className="text-xs text-gray-400">{f.contact}</p>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {selectedFidele && !editingChef && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 text-sm flex items-center justify-between">
                      <span className="text-green-700">{selectedFidele.prenom} {selectedFidele.nom}</span>
                      <button type="button" onClick={() => { setSelectedFidele(null); setFideleSearchTerm('') }} className="text-green-600 hover:text-green-800"><X size={14} /></button>
                    </div>
                  )}
                </div>

                {/* ✅ Rôle - utilise rolesDisponibles depuis les actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle <span className="text-red-500">*</span></label>
                  {loadingRoles ? (
                    <div className="text-center py-4"><Loader2 size={20} className="animate-spin mx-auto text-gray-400" /></div>
                  ) : (
                    <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black" required>
                      <option value="">Sélectionner un rôle</option>
                      {rolesFiltres.map((role: any) => (
                        <option key={role.id} value={role.id}>{role.label_role || role.nom_role}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowChefModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm">Annuler</button>
                  <button type="submit" disabled={submitting || (!editingChef && !selectedFidele)}
                    className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {editingChef ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal confirmation suppression */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md p-6">
              <div className="text-center mb-4">
                <AlertCircle size={48} className="mx-auto text-orange-500 mb-3" />
                <h3 className="text-lg font-medium mb-2">Supprimer ce responsable ?</h3>
                <p className="text-sm text-gray-500">{showDeleteConfirm.fidele?.prenom} {showDeleteConfirm.fidele?.nom} sera définitivement retiré.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm">Annuler</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Modal Ajouter un rôle */}
        <AjouterRoleModal
          type={activeTab === 'conference' ? 'conference' : 'district'}
          isOpen={showAddRoleModal}
          onClose={() => setShowAddRoleModal(false)}
          onSuccess={handleRoleAdded}
        />
      </div>
    </div>
  )
}