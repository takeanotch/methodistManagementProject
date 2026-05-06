// // app/paroisse/commissions/page.tsx - Page des commissions pour la paroisse
// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { 
//   Users, 
//   Plus, 
//   Church, 
//   Eye, 
//   Trash2, 
//   Loader2,
//   Calendar,
//   UserCheck,
//   Activity,
//   Building2,
//   ChevronRight,
//   X,
//   Search,
//   Filter,
//   AlertCircle
// } from 'lucide-react'
// import { getCommissionsByParoisse, createCommission, deleteCommission } from '@/actions/commissions'
// import { getDepartements } from '@/actions/departements'
// import { getCurrentFidele } from '@/actions/auth'

// interface Commission {
//   id: number
//   nom: string
//   description: string | null
//   departement_id: number
//   paroisse_id: number
//   created_at: string
//   stats?: {
//     total_membres: number
//     membres_actifs: number
//   }
//   departement?: {
//     id: number
//     nom: string
//     type: string
//   }
// }

// export default function ParoisseCommissionsPage() {
//   const router = useRouter()
//   const [commissions, setCommissions] = useState<Commission[]>([])
//   const [filteredCommissions, setFilteredCommissions] = useState<Commission[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedDepartement, setSelectedDepartement] = useState<string>('')
//   const [showFilters, setShowFilters] = useState(false)
//   const [deletingId, setDeletingId] = useState<number | null>(null)
//   const [showModal, setShowModal] = useState(false)
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [paroisseInfo, setParoisseInfo] = useState<any>(null)
//   const [departements, setDepartements] = useState<any[]>([])
//   const [formData, setFormData] = useState({
//     nom: '',
//     description: '',
//     departement_id: ''
//   })
//   const [formErrors, setFormErrors] = useState<Record<string, string>>({})

//   useEffect(() => {
//     loadInitialData()
//   }, [])

//   useEffect(() => {
//     filterCommissions()
//   }, [commissions, searchTerm, selectedDepartement])

//   async function loadInitialData() {
//     setLoading(true)
    
//     // Récupérer la paroisse de l'utilisateur connecté
//     const fidele = await getCurrentFidele()
    
//     if (!fidele || !fidele.paroisse) {
//       setLoading(false)
//       return
//     }
    
//     setParoisseInfo({
//       id: fidele.paroisse.id,
//       nom: fidele.paroisse.nom,
//       fidele_nom: `${fidele.nom} ${fidele.post_nom || ''} ${fidele.prenom || ''}`
//     })
    
//     // Récupérer les départements disponibles
//     const allDepartements = await getDepartements()
//     setDepartements(allDepartements)
    
//     // Récupérer les commissions de la paroisse
//     await loadCommissions(fidele.paroisse.id)
    
//     setLoading(false)
//   }

//   async function loadCommissions(paroisseId: number) {
//     const commissionsData = await getCommissionsByParoisse(paroisseId)
//     setCommissions(commissionsData)
//     setFilteredCommissions(commissionsData)
//   }

//   function filterCommissions() {
//     let filtered = [...commissions]
    
//     if (searchTerm) {
//       filtered = filtered.filter(comm => 
//         comm.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (comm.description && comm.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
//         (comm.departement?.nom && comm.departement.nom.toLowerCase().includes(searchTerm.toLowerCase()))
//       )
//     }
    
//     if (selectedDepartement) {
//       filtered = filtered.filter(comm => comm.departement_id === parseInt(selectedDepartement))
//     }
    
//     setFilteredCommissions(filtered)
//   }

//   async function handleCreateCommission(e: React.FormEvent) {
//     e.preventDefault()
//     setIsSubmitting(true)
//     setFormErrors({})
    
//     const errors: Record<string, string> = {}
//     if (!formData.nom.trim()) errors.nom = 'Le nom est requis'
//     if (!formData.departement_id) errors.departement_id = 'Le département est requis'
    
//     if (Object.keys(errors).length > 0) {
//       setFormErrors(errors)
//       setIsSubmitting(false)
//       return
//     }
    
//     const submitFormData = new FormData()
//     submitFormData.append('nom', formData.nom)
//     submitFormData.append('description', formData.description)
//     submitFormData.append('departement_id', formData.departement_id)
//     submitFormData.append('paroisse_id', paroisseInfo.id.toString())
    
//     const result = await createCommission(submitFormData)
    
//     if (result.success) {
//       setShowModal(false)
//       resetForm()
//       await loadCommissions(paroisseInfo.id)
//     } else {
//       setFormErrors({ general: result.error || 'Erreur lors de la création' })
//     }
    
//     setIsSubmitting(false)
//   }

//   function resetForm() {
//     setFormData({
//       nom: '',
//       description: '',
//       departement_id: ''
//     })
//     setFormErrors({})
//   }

//   async function handleDeleteCommission(id: number) {
//     if (!confirm('Supprimer cette commission ?')) return
    
//     setDeletingId(id)
//     const commission = commissions.find(c => c.id === id)
//     if (!commission) return
    
//     const result = await deleteCommission(id, commission.departement_id)
//     if (result.success) {
//       await loadCommissions(paroisseInfo.id)
//     } else {
//       alert(result.error)
//     }
//     setDeletingId(null)
//   }

//   function clearFilters() {
//     setSearchTerm('')
//     setSelectedDepartement('')
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <Loader2 className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
//           <p className="text-gray-500">Chargement de votre espace...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!paroisseInfo) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center max-w-md mx-auto p-8">
//           <div className="w-20 h-20 bg-red-100 -full flex items-center justify-center mx-auto mb-4">
//             <AlertCircle className="w-10 h-10 text-red-600" />
//           </div>
//           <h2 className="text-xl font-semibold text-gray-800 mb-2">Accès non autorisé</h2>
//           <p className="text-gray-600 mb-6">
//             Vous n'êtes pas associé à une paroisse. Contactez l'administrateur.
//           </p>
//           <button
//             onClick={() => router.push('/')}
//             className="px-6 py-2 bg-blue-600 text-white -lg hover:bg-blue-700 transition-colors"
//           >
//             Retour à l'accueil
//           </button>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//             <div>
//               <div className="flex items-center gap-3 mb-2">
//                 <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 -xl flex items-center justify-center shadow-lg">
//                   <Church className="w-5 h-5 text-white" />
//                 </div>
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-900">Commissions</h1>
//                   <p className="text-sm text-gray-500">Gestion des commissions paroissiales</p>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2 mt-2">
//                 <Building2 className="w-4 h-4 text-blue-600" />
//                 <span className="text-gray-700 font-medium">{paroisseInfo.nom}</span>
//                 <span className="text-xs text-gray-400">|</span>
//                 <UserCheck className="w-4 h-4 text-green-600" />
//                 <span className="text-sm text-gray-600">{paroisseInfo.fidele_nom}</span>
//               </div>
//             </div>
//             <button
//               onClick={() => setShowModal(true)}
//               className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium -xl transition-all duration-300 shadow-md hover:shadow-lg"
//             >
//               <Plus size={18} />
//               Nouvelle commission
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Stats Cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
//           <div className="bg-white -xl shadow-sm border border-gray-100 p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Total commissions</p>
//                 <p className="text-2xl font-bold text-gray-900">{commissions.length}</p>
//               </div>
//               <div className="w-10 h-10 bg-blue-100 -lg flex items-center justify-center">
//                 <Users className="w-5 h-5 text-blue-600" />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white -xl shadow-sm border border-gray-100 p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Commissions actives</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {commissions.filter(c => (c.stats?.membres_actifs ?? 0) > 0).length}
//                 </p>
//               </div>
//               <div className="w-10 h-10 bg-green-100 -lg flex items-center justify-center">
//                 <Activity className="w-5 h-5 text-green-600" />
//               </div>
//             </div>
//           </div>
//           <div className="bg-white -xl shadow-sm border border-gray-100 p-5">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Total membres</p>
//                 <p className="text-2xl font-bold text-gray-900">
//                   {commissions.reduce((sum, c) => sum + (c.stats?.total_membres || 0), 0)}
//                 </p>
//               </div>
//               <div className="w-10 h-10 bg-purple-100 -lg flex items-center justify-center">
//                 <UserCheck className="w-5 h-5 text-purple-600" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Search and Filters */}
//         <div className="mb-6 space-y-4">
//           <div className="flex gap-3">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
//               <input
//                 type="text"
//                 placeholder="Rechercher une commission..."
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//                 className="w-full pl-10 pr-4 py-2.5 border border-gray-200 -xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//             </div>
//             <button
//               onClick={() => setShowFilters(!showFilters)}
//               className={`flex items-center gap-2 px-4 py-2.5 border border-gray-200 -xl hover:border-gray-300 transition-all ${
//                 selectedDepartement ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white'
//               }`}
//             >
//               <Filter size={18} />
//               Filtres
//             </button>
//           </div>

//           {showFilters && (
//             <div className="bg-white border border-gray-200 -xl p-4">
//               <div className="flex justify-between items-center mb-4">
//                 <span className="text-sm font-medium text-gray-700">Filtrer par département</span>
//                 <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-700">
//                   Effacer
//                 </button>
//               </div>
//               <select
//                 value={selectedDepartement}
//                 onChange={(e) => setSelectedDepartement(e.target.value)}
//                 className="w-full border border-gray-200 -lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Tous les départements</option>
//                 {departements.map((dept) => (
//                   <option key={dept.id} value={dept.id}>{dept.nom}</option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>

//         {/* Commissions List */}
//         {filteredCommissions.length === 0 ? (
//           <div className="bg-white -xl border border-gray-200 py-16 text-center">
//             <div className="w-20 h-20 bg-gray-100 -full flex items-center justify-center mx-auto mb-4">
//               <Users size={40} className="text-gray-400" />
//             </div>
//             <h3 className="text-lg font-medium text-gray-700 mb-2">Aucune commission</h3>
//             <p className="text-gray-500 text-sm mb-6">
//               {searchTerm || selectedDepartement 
//                 ? "Aucune commission ne correspond à vos critères"
//                 : "Commencez par créer votre première commission"}
//             </p>
//             {!searchTerm && !selectedDepartement && (
//               <button
//                 onClick={() => setShowModal(true)}
//                 className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white -xl hover:bg-blue-700 transition-colors"
//               >
//                 <Plus size={18} />
//                 Créer une commission
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//             {filteredCommissions.map((commission) => (
//               <div
//                 key={commission.id}
//                 className="group bg-white -xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
//               >
//                 {/* Card Header */}
//                 <div className="p-5 border-b border-gray-100">
//                   <div className="flex justify-between items-start mb-2">
//                     <h3 className="font-semibold text-lg text-gray-800 line-clamp-1">
//                       {commission.nom}
//                     </h3>
//                     <div className="bg-gray-100 -lg px-2 py-1">
//                       <span className="text-xs font-medium text-gray-600">
//                         {commission.stats?.membres_actifs || 0}/{commission.stats?.total_membres || 0}
//                       </span>
//                     </div>
//                   </div>
//                   {commission.departement && (
//                     <div className="flex items-center gap-1.5">
//                       <Building2 size={12} className="text-gray-400" />
//                       <span className="text-xs text-gray-500">{commission.departement.nom}</span>
//                     </div>
//                   )}
//                 </div>

//                 {/* Card Body */}
//                 <div className="p-5">
//                   {commission.description ? (
//                     <p className="text-sm text-gray-600 line-clamp-2 mb-4">
//                       {commission.description}
//                     </p>
//                   ) : (
//                     <p className="text-sm text-gray-400 italic mb-4">Aucune description</p>
//                   )}
                  
//                   <div className="flex items-center justify-between pt-3 border-t border-gray-100">
//                     <div className="flex items-center gap-1.5 text-xs text-gray-400">
//                       <Calendar size={12} />
//                       <span>Créée le {new Date(commission.created_at).toLocaleDateString('fr-FR')}</span>
//                     </div>
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => router.push(`/paroisse/commissions/${commission.id}`)}
//                         className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors"
//                         title="Voir les détails"
//                       >
//                         <Eye size={16} />
//                       </button>
//                       <button
//                         onClick={() => handleDeleteCommission(commission.id)}
//                         disabled={deletingId === commission.id}
//                         className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
//                         title="Supprimer"
//                       >
//                         {deletingId === commission.id ? (
//                           <Loader2 size={16} className="animate-spin" />
//                         ) : (
//                           <Trash2 size={16} />
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal de création */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
//           <div className="bg-white -2xl shadow-xl w-full max-w-md transform transition-all">
//             <div className="flex justify-between items-center p-5 border-b border-gray-100">
//               <div>
//                 <h3 className="text-lg font-semibold text-gray-800">Nouvelle commission</h3>
//                 <p className="text-sm text-gray-500 mt-0.5">
//                   Pour la paroisse {paroisseInfo.nom}
//                 </p>
//               </div>
//               <button
//                 onClick={() => {
//                   setShowModal(false)
//                   resetForm()
//                 }}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleCreateCommission} className="p-5 space-y-4">
//               {formErrors.general && (
//                 <div className="bg-red-50 border border-red-200 -xl p-3 text-sm text-red-700">
//                   {formErrors.general}
//                 </div>
//               )}

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                   Nom de la commission *
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.nom}
//                   onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
//                   className={`w-full border border-gray-200 -xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
//                     formErrors.nom ? 'border-red-500' : ''
//                   }`}
//                   placeholder="Ex: Commission Évangélisation"
//                   autoFocus
//                 />
//                 {formErrors.nom && <p className="text-red-500 text-xs mt-1">{formErrors.nom}</p>}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                   Département *
//                 </label>
//                 <select
//                   value={formData.departement_id}
//                   onChange={(e) => setFormData({ ...formData, departement_id: e.target.value })}
//                   className={`w-full border border-gray-200 -xl px-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
//                     formErrors.departement_id ? 'border-red-500' : ''
//                   }`}
//                 >
//                   <option value="">Sélectionner un département</option>
//                   {departements.map((dept) => (
//                     <option key={dept.id} value={dept.id}>{dept.nom}</option>
//                   ))}
//                 </select>
//                 {formErrors.departement_id && <p className="text-red-500 text-xs mt-1">{formErrors.departement_id}</p>}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1.5">
//                   Description (optionnel)
//                 </label>
//                 <textarea
//                   value={formData.description}
//                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                   className="w-full border border-gray-200 -xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
//                   rows={3}
//                   placeholder="Décrivez les objectifs et missions de cette commission..."
//                 />
//               </div>

//               <div className="flex gap-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setShowModal(false)
//                     resetForm()
//                   }}
//                   className="flex-1 px-4 py-2.5 border border-gray-200 -xl text-gray-700 hover:bg-gray-50 transition-colors"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white -xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
//                 >
//                   {isSubmitting ? (
//                     <>
//                       <Loader2 size={18} className="animate-spin" />
//                       Création...
//                     </>
//                   ) : (
//                     <>
//                       <Plus size={18} />
//                       Créer
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }
// app/paroisse/commissions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Plus, 
  Eye, 
  Trash2, 
  Loader2,
  Calendar,
  UserCheck,
  Activity,
  Building2,
  X,
  Search,
  Filter,
  AlertCircle,
  Layers
} from 'lucide-react'
import { getCommissionsByParoisse, createCommission, deleteCommission } from '@/actions/commissions'
import { getDepartements } from '@/actions/departements'
import { getCurrentFidele } from '@/actions/auth'

interface Commission {
  id: number
  nom: string
  description: string | null
  departement_id: number
  paroisse_id: number
  created_at: string
  stats?: {
    total_membres: number
    membres_actifs: number
  }
  departement?: {
    id: number
    nom: string
    type: string
  }
}

export default function ParoisseCommissionsPage() {
  const router = useRouter()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeDepartementId, setActiveDepartementId] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paroisseInfo, setParoisseInfo] = useState<any>(null)
  const [departements, setDepartements] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    departement_id: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    
    const fidele = await getCurrentFidele()
    
    if (!fidele || !fidele.paroisse) {
      setLoading(false)
      return
    }
    
    setParoisseInfo({
      id: fidele.paroisse.id,
      nom: fidele.paroisse.nom,
      fidele_nom: `${fidele.nom} ${fidele.post_nom || ''} ${fidele.prenom || ''}`
    })
    
    const allDepartements = await getDepartements()
    setDepartements(allDepartements)
    
    const commissionsData = await getCommissionsByParoisse(fidele.paroisse.id)
    setCommissions(commissionsData)
    
    setLoading(false)
  }

  async function loadCommissions(paroisseId: number) {
    const commissionsData = await getCommissionsByParoisse(paroisseId)
    setCommissions(commissionsData)
  }

  // Filtrer les commissions selon l'onglet actif et la recherche
  const filteredCommissions = commissions.filter(comm => {
    const matchesSearch = searchTerm === '' || 
      comm.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comm.description && comm.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDepartement = activeDepartementId === 'all' || 
      comm.departement_id === parseInt(activeDepartementId)
    
    return matchesSearch && matchesDepartement
  })

  const activeDepartement = activeDepartementId !== 'all' 
    ? departements.find(d => d.id === parseInt(activeDepartementId))
    : null

  async function handleCreateCommission(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setFormErrors({})
    
    const submitDepartementId = activeDepartementId !== 'all' ? activeDepartementId : formData.departement_id
    
    const errors: Record<string, string> = {}
    if (!formData.nom.trim()) errors.nom = 'Le nom est requis'
    if (!submitDepartementId) errors.departement_id = 'Le département est requis'
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      setIsSubmitting(false)
      return
    }
    
    const submitFormData = new FormData()
    submitFormData.append('nom', formData.nom)
    submitFormData.append('description', formData.description)
    submitFormData.append('departement_id', submitDepartementId)
    submitFormData.append('paroisse_id', paroisseInfo.id.toString())
    
    const result = await createCommission(submitFormData)
    
    if (result.success) {
      setShowModal(false)
      resetForm()
      await loadCommissions(paroisseInfo.id)
    } else {
      setFormErrors({ general: result.error || 'Erreur lors de la création' })
    }
    
    setIsSubmitting(false)
  }

  function openCreateModal() {
    resetForm()
    // Si on est sur un département spécifique, pré-remplir
    if (activeDepartementId !== 'all') {
      setFormData(prev => ({ ...prev, departement_id: activeDepartementId }))
    }
    setShowModal(true)
  }

  function resetForm() {
    setFormData({
      nom: '',
      description: '',
      departement_id: activeDepartementId !== 'all' ? activeDepartementId : ''
    })
    setFormErrors({})
  }

  async function handleDeleteCommission(id: number) {
    if (!confirm('Supprimer cette sous-commission ?')) return
    
    setDeletingId(id)
    const commission = commissions.find(c => c.id === id)
    if (!commission) return
    
    const result = await deleteCommission(id, commission.departement_id)
    if (result.success) {
      await loadCommissions(paroisseInfo.id)
    } else {
      alert(result.error)
    }
    setDeletingId(null)
  }

  // Calculs pour l'onglet "Tous"
  const totalMembres = filteredCommissions.reduce((sum, c) => sum + (c.stats?.total_membres || 0), 0)
  const totalActifs = filteredCommissions.reduce((sum, c) => sum + (c.stats?.membres_actifs || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gray-300 mx-auto mb-4" />
          <p className="text-gray-400 font-light">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!paroisseInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white border border-gray-200 py-16 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Accès non autorisé. Contactez l'administrateur.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Layers size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              Sous-commissions de {paroisseInfo.nom}
            </h1>
            <p className="text-sm text-gray-500">
              {commissions.length} sous-commission{commissions.length > 1 ? 's' : ''} • organisées par département
            </p>
          </div>
        </div>
      </div>

      {/* Navigation par onglets - Départements */}
      <div className="mb-8">
        <div className="border-b border-gray-200 flex items-center gap-1 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveDepartementId('all')}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeDepartementId === 'all'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Building2 size={14} />
              Tous les départements
              <span className="text-xs text-gray-400">({commissions.length})</span>
            </span>
          </button>
          
          {departements.map((dept) => {
            const deptCount = commissions.filter(c => c.departement_id === dept.id).length
            return (
              <button
                key={dept.id}
                onClick={() => setActiveDepartementId(dept.id.toString())}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeDepartementId === dept.id.toString()
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {dept.nom}
                {deptCount > 0 && (
                  <span className="ml-1.5 text-xs text-gray-400">({deptCount})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Barre d'actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une sous-commission..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-300 transition-colors"
          />
        </div>
        
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors ml-4"
        >
          <Plus size={16} />
          Nouvelle sous-commission
          {activeDepartement && (
            <span className="text-gray-300 font-light">• {activeDepartement.nom}</span>
          )}
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid sm:grid-cols-4 grid-cols-1 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Layers size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{filteredCommissions.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Sous-commissions</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Users size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalMembres}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Membres totaux</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalActifs}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Membres actifs</p>
        </div>
      </div>

      {/* Liste des sous-commissions */}
      {filteredCommissions.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Layers size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 mb-1">
            {searchTerm 
              ? "Aucune sous-commission ne correspond à votre recherche"
              : activeDepartement 
                ? `Aucune sous-commission dans le département "${activeDepartement.nom}"`
                : "Aucune sous-commission trouvée"}
          </p>
          <p className="text-xs text-gray-400">
            {activeDepartement 
              ? "Utilisez le bouton ci-dessus pour en créer une"
              : "Sélectionnez un département ou créez-en une depuis l'onglet approprié"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCommissions.map((commission) => (
            <div
              key={commission.id}
              className="bg-white border border-gray-200 hover:border-gray-300 transition-all group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg mb-1">{commission.nom}</h3>
                    {commission.departement && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Building2 size={10} />
                        {commission.departement.nom}
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 px-2 py-1">
                    <span className="text-xs font-medium text-gray-500">
                      {commission.stats?.membres_actifs || 0}/{commission.stats?.total_membres || 0}
                    </span>
                  </div>
                </div>
                
                {commission.description ? (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {commission.description}
                  </p>
                ) : (
                  <p className="text-sm text-gray-300 italic mb-3">Aucune description</p>
                )}
                
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{commission.stats?.total_membres || 0}</div>
                      <div className="text-xs text-gray-400">Membres</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <UserCheck size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{commission.stats?.membres_actifs || 0}</div>
                      <div className="text-xs text-gray-400">Actifs</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Créée le</div>
                      <div className="text-sm font-medium text-gray-500">
                        {new Date(commission.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-400">Dépt.</div>
                      <div className="text-sm font-medium text-gray-500">
                        {commission.departement?.nom || '-'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/paroisse/commissions/${commission.id}`)}
                    className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-black transition-colors"
                  >
                    <Eye size={14} />
                    Voir détails
                  </button>
                  
                  <button
                    onClick={() => handleDeleteCommission(commission.id)}
                    disabled={deletingId === commission.id}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Supprimer"
                  >
                    {deletingId === commission.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 shadow-lg w-full max-w-md">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-light">Nouvelle sous-commission</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeDepartement 
                    ? `Département : ${activeDepartement.nom}`
                    : paroisseInfo.nom}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCommission} className="p-5 space-y-4">
              {formErrors.general && (
                <div className="bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  {formErrors.general}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Nom *
                </label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className={`w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-300 transition-colors ${
                    formErrors.nom ? 'border-red-300' : ''
                  }`}
                  placeholder="Nom de la sous-commission"
                  autoFocus
                />
                {formErrors.nom && <p className="text-red-500 text-xs mt-1">{formErrors.nom}</p>}
              </div>

              {activeDepartementId === 'all' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                    Département *
                  </label>
                  <select
                    value={formData.departement_id}
                    onChange={(e) => setFormData({ ...formData, departement_id: e.target.value })}
                    className={`w-full border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-300 transition-colors ${
                      formErrors.departement_id ? 'border-red-300' : ''
                    }`}
                  >
                    <option value="">Sélectionner un département</option>
                    {departements.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.nom}</option>
                    ))}
                  </select>
                  {formErrors.departement_id && <p className="text-red-500 text-xs mt-1">{formErrors.departement_id}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-gray-300 transition-colors"
                  rows={3}
                  placeholder="Description de la sous-commission..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Créer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}