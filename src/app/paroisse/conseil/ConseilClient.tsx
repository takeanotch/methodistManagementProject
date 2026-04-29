// // app/paroisse/conseil/ConseilClient.tsx
// 'use client'

// import { useState } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import Image from 'next/image'
// import { 
//   Plus, 
//   Search,
//   Calendar,
//   Users,
//   FileText,
//   Edit,
//   Trash2,
//   Loader2,
//   X,
//   Eye,
//   Download,
//   Paperclip,
//   Upload,
//   File,
//   Image as ImageIcon,
//   FileSpreadsheet,
//   ChevronDown,
//   ChevronRight,
//   User,
//   Phone,
//   Check
// } from 'lucide-react'
// import { saveConseilMembre, createConseil, updateConseil, deleteConseil, uploadConseilDocument, deleteConseilDocument } from '@/actions/conseil-admin'
// import { getFidelesByParoisse } from '@/actions/fidele'
// import toast from 'react-hot-toast'

// interface Membre {
//   id: number
//   role: 'president' | 'vice_president' | 'secretaire'
//   fidele: {
//     id: number
//     nom: string
//     post_nom: string
//     prenom: string
//     contact: string
//     profile_img: string | null
//     sexe: string | null
//   }
// }

// interface Conseil {
//   id: number
//   libelle: string
//   date_reunion: string
//   commentaire: string | null
//   created_at: string
//   documents?: Document[]
// }

// interface Document {
//   id: number
//   nom_fichier: string
//   type_fichier: string | null
//   taille_fichier: number | null
//   url_fichier: string
//   created_at: string
// }

// interface AnneeDisponible {
//   id: number
//   label: string
//   is_current: boolean
// }

// interface ConseilClientProps {
//   membres: Membre[]
//   conseils: Conseil[]
//   paroisseId: number
//   paroisseNom: string
//   anneeActuelleId?: number
//   anneesDisponibles: AnneeDisponible[]
//   anneeSelectionneeId?: number
// }

// const ROLES = [
//   { value: 'president', label: 'Président', color: 'bg-blue-50 text-blue-700 border-blue-200' },
//   { value: 'vice_president', label: 'Vice-président', color: 'bg-green-50 text-green-700 border-green-200' },
//   { value: 'secretaire', label: 'Secrétaire', color: 'bg-purple-50 text-purple-700 border-purple-200' }
// ]

// export default function ConseilClient({ 
//   membres: initialMembres, 
//   conseils: initialConseils,
//   paroisseId,
//   paroisseNom,
//   anneeActuelleId,
//   anneesDisponibles,
//   anneeSelectionneeId
// }: ConseilClientProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()
  
//   const [membres, setMembres] = useState<Membre[]>(initialMembres)
//   const [conseils, setConseils] = useState<Conseil[]>(initialConseils)
//   const [selectedAnnee, setSelectedAnnee] = useState<number | undefined>(anneeSelectionneeId)
  
//   // États modals
//   const [showMembreModal, setShowMembreModal] = useState(false)
//   const [showConseilModal, setShowConseilModal] = useState(false)
//   const [showDetailsModal, setShowDetailsModal] = useState(false)
//   const [editingRole, setEditingRole] = useState<string | null>(null)
//   const [editingConseil, setEditingConseil] = useState<Conseil | null>(null)
//   const [selectedConseil, setSelectedConseil] = useState<Conseil | null>(null)
  
//   // États formulaire
//   const [fideles, setFideles] = useState<any[]>([])
//   const [selectedFidele, setSelectedFidele] = useState<number | null>(null)
//   const [searchFidele, setSearchFidele] = useState('')
//   const [conseilForm, setConseilForm] = useState({ libelle: '', date_reunion: '', commentaire: '' })
  
//   // États chargement
//   const [loading, setLoading] = useState(false)
//   const [loadingFideles, setLoadingFideles] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [uploading, setUploading] = useState(false)
//   const [deletingId, setDeletingId] = useState<number | null>(null)
//   const [expandedConseil, setExpandedConseil] = useState<number | null>(null)

//   // Gestion changement d'année
//   const handleAnneeChange = (anneeConferenceId: string) => {
//     const params = new URLSearchParams(searchParams.toString())
//     if (anneeConferenceId) {
//       params.set('annee_conference', anneeConferenceId)
//     } else {
//       params.delete('annee_conference')
//     }
//     router.push(`/paroisse/conseil?${params.toString()}`)
//     router.refresh()
//   }

//   // Charger les fidèles pour le modal
//   const loadFideles = async () => {
//     setLoadingFideles(true)
//     const data = await getFidelesByParoisse(paroisseId, selectedAnnee)
//     setFideles(data)
//     setLoadingFideles(false)
//   }

//   const openMembreModal = async (role: string) => {
//     setEditingRole(role)
//     await loadFideles()
//     setShowMembreModal(true)
//   }

//   const getMembreByRole = (role: string) => {
//     return membres.find(m => m.role === role)
//   }

//   const handleSaveMembre = async () => {
//     if (!selectedFidele || !editingRole || !selectedAnnee) return
    
//     setSaving(true)
//     const formData = new FormData()
//     formData.append('paroisse_id', paroisseId.toString())
//     formData.append('fidele_id', selectedFidele.toString())
//     formData.append('annee_conference_id', selectedAnnee.toString())
//     formData.append('role', editingRole)
    
//     const result = await saveConseilMembre(formData)
    
//     if (result.success) {
//       toast.success('Membre enregistré')
//       router.refresh()
//       setShowMembreModal(false)
//       setSelectedFidele(null)
//       setEditingRole(null)
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//     setSaving(false)
//   }

//   const openConseilModal = (conseil?: Conseil) => {
//     if (conseil) {
//       setEditingConseil(conseil)
//       setConseilForm({
//         libelle: conseil.libelle,
//         date_reunion: conseil.date_reunion,
//         commentaire: conseil.commentaire || ''
//       })
//     } else {
//       setEditingConseil(null)
//       setConseilForm({
//         libelle: '',
//         date_reunion: new Date().toISOString().split('T')[0],
//         commentaire: ''
//       })
//     }
//     setShowConseilModal(true)
//   }

//   const handleSaveConseil = async () => {
//     if (!selectedAnnee) return
    
//     setSaving(true)
//     const formData = new FormData()
//     formData.append('paroisse_id', paroisseId.toString())
//     formData.append('annee_conference_id', selectedAnnee.toString())
//     formData.append('libelle', conseilForm.libelle)
//     formData.append('date_reunion', conseilForm.date_reunion)
//     formData.append('commentaire', conseilForm.commentaire)
    
//     if (editingConseil) {
//       formData.append('id', editingConseil.id.toString())
//       const result = await updateConseil(formData)
//       if (result.success) {
//         toast.success('Conseil mis à jour')
//         router.refresh()
//         setShowConseilModal(false)
//       } else {
//         toast.error(result.error || 'Erreur')
//       }
//     } else {
//       const result = await createConseil(formData)
//       if (result.success) {
//         toast.success('Conseil créé')
//         router.refresh()
//         setShowConseilModal(false)
//       } else {
//         toast.error(result.error || 'Erreur')
//       }
//     }
//     setSaving(false)
//   }

//   const handleDeleteConseil = async (id: number) => {
//     if (!confirm('Supprimer ce conseil ?')) return
    
//     const result = await deleteConseil(id)
//     if (result.success) {
//       toast.success('Conseil supprimé')
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//   }

//   const openDetailsModal = (conseil: Conseil) => {
//     setSelectedConseil(conseil)
//     setShowDetailsModal(true)
//   }

//   const handleFileUpload = async (file: File) => {
//     if (!selectedConseil) return
    
//     setUploading(true)
//     const formData = new FormData()
//     formData.append('conseil_id', selectedConseil.id.toString())
//     formData.append('file', file)
    
//     const result = await uploadConseilDocument(formData)
    
//     if (result.success) {
//       toast.success('Document ajouté')
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//     setUploading(false)
//   }

//   const handleDeleteDocument = async (docId: number) => {
//     if (!confirm('Supprimer ce document ?')) return
    
//     setDeletingId(docId)
//     const result = await deleteConseilDocument(docId)
    
//     if (result.success) {
//       toast.success('Document supprimé')
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur')
//     }
//     setDeletingId(null)
//   }

//   const getFileIcon = (typeFichier: string | null) => {
//     if (typeFichier?.startsWith('image/')) {
//       return <ImageIcon size={16} className="text-blue-500" />
//     } else if (typeFichier?.includes('pdf')) {
//       return <FileText size={16} className="text-red-500" />
//     } else if (typeFichier?.includes('spreadsheet') || typeFichier?.includes('excel')) {
//       return <FileSpreadsheet size={16} className="text-green-500" />
//     }
//     return <File size={16} className="text-gray-500" />
//   }

//   const formatFileSize = (bytes: number | null): string => {
//     if (!bytes) return 'N/A'
//     if (bytes < 1024) return bytes + ' B'
//     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
//     return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
//   }

//   const handleDownload = (url: string, nom: string) => {
//     window.open(url, '_blank')
//   }

//   const getInitials = (fidele: any) => {
//     return `${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}`.toUpperCase()
//   }

//   const getAvatarColor = (fidele: any) => {
//     if (fidele.sexe === 'M') return 'from-blue-50 to-blue-100 text-blue-600'
//     if (fidele.sexe === 'F') return 'from-pink-50 to-pink-100 text-pink-600'
//     return 'from-gray-50 to-gray-100 text-gray-600'
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('fr-FR', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     })
//   }

//   const currentAnneeLabel = anneesDisponibles.find(a => a.id === selectedAnnee)?.label

//   const filteredFideles = fideles.filter(f => {
//     const fullName = `${f.nom} ${f.post_nom} ${f.prenom}`.toLowerCase()
//     return fullName.includes(searchFidele.toLowerCase()) || f.contact.includes(searchFidele)
//   })

//   return (
//     <>
//       {/* Sélecteur d'année */}
//       {anneesDisponibles.length > 0 && (
//         <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 border border-gray-200">
//           <Calendar size={18} className="text-gray-400" />
//           <span className="text-sm text-gray-600">Année de conférence :</span>
//           <select
//             value={selectedAnnee || ''}
//             onChange={(e) => handleAnneeChange(e.target.value)}
//             className="px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-black bg-white"
//           >
//             {anneesDisponibles.map((annee) => (
//               <option key={annee.id} value={annee.id}>
//                 {annee.label} {annee.is_current ? '(en cours)' : ''}
//               </option>
//             ))}
//           </select>
//           {currentAnneeLabel && (
//             <span className="text-xs text-gray-400">
//               Conseil pour {currentAnneeLabel}
//             </span>
//           )}
//         </div>
//       )}

//       {/* Section Membres */}
//       <div className="mb-8">
//         <h2 className="text-base font-medium mb-4 flex items-center gap-2">
//           <Users size={18} className="text-gray-400" />
//           Membres du bureau
//         </h2>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {ROLES.map(role => {
//             const membre = getMembreByRole(role.value)
//             return (
//               <div key={role.value} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
//                 <div className="flex items-center justify-between mb-3">
//                   <span className={`text-xs px-2 py-1 border ${role.color}`}>
//                     {role.label}
//                   </span>
//                   <button
//                     onClick={() => openMembreModal(role.value)}
//                     className="p-1 text-gray-400 hover:text-black"
//                     title="Modifier"
//                   >
//                     <Edit size={14} />
//                   </button>
//                 </div>
                
//                 {membre ? (
//                   <div className="flex items-center gap-3">
//                     {membre.fidele.profile_img ? (
//                       <Image
//                         src={membre.fidele.profile_img}
//                         alt=""
//                         width={48}
//                         height={48}
//                         className="w-12 h-12 rounded-full object-cover border border-gray-200"
//                       />
//                     ) : (
//                       <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(membre.fidele)} flex items-center justify-center`}>
//                         <span className="text-base font-medium">{getInitials(membre.fidele)}</span>
//                       </div>
//                     )}
//                     <div>
//                       <p className="font-medium">
//                         {membre.fidele.nom} {membre.fidele.post_nom} {membre.fidele.prenom}
//                       </p>
//                       {membre.fidele.contact && (
//                         <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
//                           <Phone size={12} />
//                           {membre.fidele.contact}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-center py-4 text-gray-400 text-sm">
//                     <User size={24} className="mx-auto mb-2 opacity-50" />
//                     Non désigné
//                   </div>
//                 )}
//               </div>
//             )
//           })}
//         </div>
//       </div>

//       {/* Section Conseils */}
//       <div>
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-base font-medium flex items-center gap-2">
//             <FileText size={18} className="text-gray-400" />
//             Réunions du conseil
//           </h2>
//           <button
//             onClick={() => openConseilModal()}
//             className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
//           >
//             <Plus size={16} />
//             Nouvelle réunion
//           </button>
//         </div>

//         {conseils.length === 0 ? (
//           <div className="border border-gray-200 py-12 text-center bg-white">
//             <FileText size={48} className="mx-auto text-gray-300 mb-3" />
//             <p className="text-gray-400">Aucune réunion pour cette année</p>
//           </div>
//         ) : (
//           <div className="space-y-3">
//             {conseils.map(conseil => (
//               <div key={conseil.id} className="bg-white border border-gray-200 hover:border-gray-300">
//                 <div className="p-4">
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-2">
//                         <h3 className="font-medium">{conseil.libelle}</h3>
//                         <span className="text-xs text-gray-500 flex items-center gap-1">
//                           <Calendar size={12} />
//                           {formatDate(conseil.date_reunion)}
//                         </span>
//                         {conseil.documents && conseil.documents.length > 0 && (
//                           <span className="text-xs text-gray-400 flex items-center gap-1">
//                             <Paperclip size={12} />
//                             {conseil.documents.length}
//                           </span>
//                         )}
//                       </div>
                      
//                       {conseil.commentaire && (
//                         <p className="text-sm text-gray-500 line-clamp-2">
//                           {conseil.commentaire}
//                         </p>
//                       )}
//                     </div>
                    
//                     <div className="flex items-center gap-2">
//                       <button
//                         onClick={() => openDetailsModal(conseil)}
//                         className="p-2 text-gray-400 hover:text-black"
//                         title="Voir détails"
//                       >
//                         <Eye size={16} />
//                       </button>
//                       <button
//                         onClick={() => openConseilModal(conseil)}
//                         className="p-2 text-gray-400 hover:text-black"
//                         title="Modifier"
//                       >
//                         <Edit size={16} />
//                       </button>
//                       <button
//                         onClick={() => handleDeleteConseil(conseil.id)}
//                         className="p-2 text-gray-400 hover:text-red-600"
//                         title="Supprimer"
//                       >
//                         <Trash2 size={16} />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal Sélection Membre */}
//       {showMembreModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <h3 className="text-lg font-light">
//                 Sélectionner {ROLES.find(r => r.value === editingRole)?.label}
//               </h3>
//               <button onClick={() => setShowMembreModal(false)} className="text-gray-400 hover:text-black">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="p-4 border-b border-gray-200">
//               <div className="relative">
//                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Rechercher un fidèle..."
//                   value={searchFidele}
//                   onChange={(e) => setSearchFidele(e.target.value)}
//                   className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
//                 />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4">
//               {loadingFideles ? (
//                 <div className="flex justify-center py-8">
//                   <Loader2 className="animate-spin text-gray-400" size={24} />
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {filteredFideles.map(fidele => (
//                     <div
//                       key={fidele.id}
//                       onClick={() => setSelectedFidele(fidele.id)}
//                       className={`p-3 border cursor-pointer transition-colors ${
//                         selectedFidele === fidele.id 
//                           ? 'border-black bg-gray-50' 
//                           : 'border-gray-200 hover:border-gray-300'
//                       }`}
//                     >
//                       <div className="flex items-center gap-3">
//                         {fidele.profile_img ? (
//                           <Image src={fidele.profile_img} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
//                         ) : (
//                           <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(fidele)} flex items-center justify-center`}>
//                             <span className="text-sm font-medium">{getInitials(fidele)}</span>
//                           </div>
//                         )}
//                         <div className="flex-1">
//                           <p className="font-medium">{fidele.nom} {fidele.post_nom} {fidele.prenom}</p>
//                           {fidele.contact && (
//                             <p className="text-xs text-gray-500">{fidele.contact}</p>
//                           )}
//                         </div>
//                         {selectedFidele === fidele.id && (
//                           <Check size={18} className="text-black" />
//                         )}
//                       </div>
//                     </div>
//                   ))}
//                   {filteredFideles.length === 0 && (
//                     <p className="text-center text-gray-400 py-8">Aucun fidèle trouvé</p>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="p-4 border-t border-gray-200">
//               <button
//                 onClick={handleSaveMembre}
//                 disabled={!selectedFidele || saving}
//                 className="w-full px-4 py-2 bg-black text-white text-sm disabled:bg-gray-300 flex items-center justify-center gap-2"
//               >
//                 {saving ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal Conseil */}
//       {showConseilModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <h3 className="text-lg font-light">
//                 {editingConseil ? 'Modifier la réunion' : 'Nouvelle réunion'}
//               </h3>
//               <button onClick={() => setShowConseilModal(false)} className="text-gray-400 hover:text-black">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Libellé *</label>
//                 <input
//                   type="text"
//                   value={conseilForm.libelle}
//                   onChange={(e) => setConseilForm({ ...conseilForm, libelle: e.target.value })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   placeholder="Ex: Conseil ordinaire..."
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Date *</label>
//                 <input
//                   type="date"
//                   value={conseilForm.date_reunion}
//                   onChange={(e) => setConseilForm({ ...conseilForm, date_reunion: e.target.value })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Commentaire (PV)</label>
//                 <textarea
//                   value={conseilForm.commentaire}
//                   onChange={(e) => setConseilForm({ ...conseilForm, commentaire: e.target.value })}
//                   rows={5}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black resize-none"
//                   placeholder="Résumé des décisions..."
//                 />
//               </div>
//             </div>

//             <div className="p-4 border-t border-gray-200 flex gap-3">
//               <button onClick={() => setShowConseilModal(false)} className="flex-1 px-4 py-2 border border-gray-300 hover:border-black">
//                 Annuler
//               </button>
//               <button
//                 onClick={handleSaveConseil}
//                 disabled={!conseilForm.libelle || !conseilForm.date_reunion || saving}
//                 className="flex-1 px-4 py-2 bg-black text-white disabled:bg-gray-300 flex items-center justify-center gap-2"
//               >
//                 {saving ? <Loader2 size={16} className="animate-spin" /> : (editingConseil ? 'Mettre à jour' : 'Créer')}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal Détails */}
//       {showDetailsModal && selectedConseil && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <div>
//                 <h3 className="text-lg font-light">{selectedConseil.libelle}</h3>
//                 <p className="text-sm text-gray-500">{formatDate(selectedConseil.date_reunion)}</p>
//               </div>
//               <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-black">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4">
//               {selectedConseil.commentaire && (
//                 <div className="mb-6">
//                   <h4 className="text-sm font-medium text-gray-700 mb-2">Procès-verbal</h4>
//                   <div className="bg-gray-50 p-4 border border-gray-200 text-sm whitespace-pre-wrap">
//                     {selectedConseil.commentaire}
//                   </div>
//                 </div>
//               )}

//               <div>
//                 <div className="flex items-center justify-between mb-3">
//                   <h4 className="text-sm font-medium text-gray-700">Documents joints</h4>
//                   <label className="cursor-pointer">
//                     <input
//                       type="file"
//                       className="hidden"
//                       onChange={(e) => {
//                         const file = e.target.files?.[0]
//                         if (file) handleFileUpload(file)
//                       }}
//                       disabled={uploading}
//                     />
//                     <span className="flex items-center gap-1 text-xs text-gray-500 hover:text-black border border-gray-300 px-3 py-1">
//                       {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
//                       Ajouter
//                     </span>
//                   </label>
//                 </div>

//                 {selectedConseil.documents && selectedConseil.documents.length > 0 ? (
//                   <div className="space-y-2">
//                     {selectedConseil.documents.map(doc => (
//                       <div key={doc.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3">
//                         <div className="flex items-center gap-3">
//                           {getFileIcon(doc.type_fichier)}
//                           <div>
//                             <p className="text-sm">{doc.nom_fichier}</p>
//                             <p className="text-xs text-gray-400">{formatFileSize(doc.taille_fichier)}</p>
//                           </div>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() => handleDownload(doc.url_fichier, doc.nom_fichier)}
//                             className="p-2 text-gray-400 hover:text-black"
//                           >
//                             <Download size={16} />
//                           </button>
//                           <button
//                             onClick={() => handleDeleteDocument(doc.id)}
//                             disabled={deletingId === doc.id}
//                             className="p-2 text-gray-400 hover:text-red-600"
//                           >
//                             {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
//                           </button>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200">
//                     Aucun document
//                   </p>
//                 )}
//               </div>
//             </div>

//             <div className="p-4 border-t border-gray-200">
//               <button
//                 onClick={() => setShowDetailsModal(false)}
//                 className="w-full px-4 py-2 border border-gray-300 hover:border-black text-sm"
//               >
//                 Fermer
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   )
// }

// app/paroisse/conseil/ConseilClient.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { 
  Plus, 
  Search,
  Calendar,
  Users,
  FileText,
  Edit,
  Trash2,
  Loader2,
  X,
  Eye,
  Download,
  Paperclip,
  Upload,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  User,
  Phone,
  Check
} from 'lucide-react'
import { saveConseilMembre, createConseil, updateConseil, deleteConseil, uploadConseilDocument, deleteConseilDocument } from '@/actions/conseil-admin'
import { getFidelesByParoisse } from '@/actions/fidele'
import toast from 'react-hot-toast'
import { PiFilePdf, PiImage } from 'react-icons/pi'

interface Membre {
  id: number
  role: 'president' | 'vice_president' | 'secretaire'
  fidele: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img: string | null
    sexe: string | null
  }
}

interface Conseil {
  id: number
  libelle: string
  date_reunion: string
  commentaire: string | null
  created_at: string
  documents?: Document[]
}

interface Document {
  id: number
  nom_fichier: string
  type_fichier: string | null
  taille_fichier: number | null
  url_fichier: string
  created_at: string
}

interface AnneeDisponible {
  id: number
  label: string
  is_current: boolean
}

interface ConseilClientProps {
  membres: Membre[]
  conseils: Conseil[]
  paroisseId: number
  paroisseNom: string
  anneeActuelleId?: number
  anneesDisponibles: AnneeDisponible[]
  anneeSelectionneeId?: number
}

const ROLES = [
  { value: 'president', label: 'Président', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'vice_president', label: 'Vice-président', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'secretaire', label: 'Secrétaire', color: 'bg-purple-50 text-purple-700 border-purple-200' }
]

export default function ConseilClient({ 
  membres: initialMembres, 
  conseils: initialConseils,
  paroisseId,
  paroisseNom,
  anneeActuelleId,
  anneesDisponibles,
  anneeSelectionneeId
}: ConseilClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [membres, setMembres] = useState<Membre[]>(initialMembres)
  const [conseils, setConseils] = useState<Conseil[]>(initialConseils)
  const [selectedAnnee, setSelectedAnnee] = useState<number | undefined>(anneeSelectionneeId)
  
  // États modals
  const [showMembreModal, setShowMembreModal] = useState(false)
  const [showConseilModal, setShowConseilModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [editingConseil, setEditingConseil] = useState<Conseil | null>(null)
  const [selectedConseil, setSelectedConseil] = useState<Conseil | null>(null)
  
  // États formulaire
  const [fideles, setFideles] = useState<any[]>([])
  const [selectedFidele, setSelectedFidele] = useState<number | null>(null)
  const [searchFidele, setSearchFidele] = useState('')
  const [conseilForm, setConseilForm] = useState({ libelle: '', date_reunion: '', commentaire: '' })
  
  // États chargement
  const [loadingFideles, setLoadingFideles] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Gestion changement d'année
  const handleAnneeChange = (anneeConferenceId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (anneeConferenceId) {
      params.set('annee_conference', anneeConferenceId)
    } else {
      params.delete('annee_conference')
    }
    router.push(`/paroisse/conseil?${params.toString()}`)
  }

  // Charger les fidèles pour le modal
  const loadFideles = async () => {
    setLoadingFideles(true)
    const data = await getFidelesByParoisse(paroisseId, selectedAnnee)
    setFideles(data)
    setLoadingFideles(false)
  }

  const openMembreModal = async (role: string) => {
    setEditingRole(role)
    await loadFideles()
    setShowMembreModal(true)
  }

  const getMembreByRole = (role: string) => {
    return membres.find(m => m.role === role)
  }

  const handleSaveMembre = async () => {
    if (!selectedFidele || !editingRole || !selectedAnnee) return
    
    setSaving(true)
    const formData = new FormData()
    formData.append('paroisse_id', paroisseId.toString())
    formData.append('fidele_id', selectedFidele.toString())
    formData.append('annee_conference_id', selectedAnnee.toString())
    formData.append('role', editingRole)
    
    const result = await saveConseilMembre(formData)
    
    if (result.success) {
      toast.success('Membre enregistré')
      
      // Récupérer le fidèle sélectionné pour l'ajouter à l'état local
      const fideleSelectionne = fideles.find(f => f.id === selectedFidele)
      
      if (fideleSelectionne) {
        // Mettre à jour l'état local des membres
        setMembres(prevMembres => {
          // Filtrer pour enlever l'ancien membre avec ce rôle s'il existe
          const filtered = prevMembres.filter(m => m.role !== editingRole)
          
          // Ajouter le nouveau membre avec un ID temporaire
          return [...filtered, {
            id: Date.now(), // ID temporaire
            role: editingRole as 'president' | 'vice_president' | 'secretaire',
            fidele: {
              id: fideleSelectionne.id,
              nom: fideleSelectionne.nom,
              post_nom: fideleSelectionne.post_nom || '',
              prenom: fideleSelectionne.prenom,
              contact: fideleSelectionne.contact || '',
              profile_img: fideleSelectionne.profile_img,
              sexe: fideleSelectionne.sexe
            }
          }]
        })
      }
      
      setShowMembreModal(false)
      setSelectedFidele(null)
      setEditingRole(null)
      setSearchFidele('')
    } else {
      toast.error(result.error || 'Erreur')
    }
    setSaving(false)
  }

  const openConseilModal = (conseil?: Conseil) => {
    if (conseil) {
      setEditingConseil(conseil)
      setConseilForm({
        libelle: conseil.libelle,
        date_reunion: conseil.date_reunion,
        commentaire: conseil.commentaire || ''
      })
    } else {
      setEditingConseil(null)
      setConseilForm({
        libelle: '',
        date_reunion: new Date().toISOString().split('T')[0],
        commentaire: ''
      })
    }
    setShowConseilModal(true)
  }

  const handleSaveConseil = async () => {
    if (!selectedAnnee) return
    
    setSaving(true)
    const formData = new FormData()
    formData.append('paroisse_id', paroisseId.toString())
    formData.append('annee_conference_id', selectedAnnee.toString())
    formData.append('libelle', conseilForm.libelle)
    formData.append('date_reunion', conseilForm.date_reunion)
    formData.append('commentaire', conseilForm.commentaire)
    
    if (editingConseil) {
      formData.append('id', editingConseil.id.toString())
      const result = await updateConseil(formData)
      if (result.success) {
        toast.success('Conseil mis à jour')
        
        // Mettre à jour l'état local
        setConseils(prevConseils => 
          prevConseils.map(c => 
            c.id === editingConseil.id 
              ? { 
                  ...c, 
                  libelle: conseilForm.libelle,
                  date_reunion: conseilForm.date_reunion,
                  commentaire: conseilForm.commentaire 
                } 
              : c
          )
        )
        
        // Mettre à jour aussi selectedConseil si nécessaire
        if (selectedConseil?.id === editingConseil.id) {
          setSelectedConseil(prev => prev ? {
            ...prev,
            libelle: conseilForm.libelle,
            date_reunion: conseilForm.date_reunion,
            commentaire: conseilForm.commentaire
          } : null)
        }
        
        setShowConseilModal(false)
      } else {
        toast.error(result.error || 'Erreur')
      }
    } else {
      const result = await createConseil(formData)
      if (result.success && result.conseil) {
        toast.success('Conseil créé')
        
        // Ajouter le nouveau conseil à l'état local
        const nouveauConseil: Conseil = {
          id: result.conseil.id,
          libelle: conseilForm.libelle,
          date_reunion: conseilForm.date_reunion,
          commentaire: conseilForm.commentaire || null,
          created_at: new Date().toISOString(),
          documents: []
        }
        
        setConseils(prevConseils => [nouveauConseil, ...prevConseils])
        setShowConseilModal(false)
      } else {
        toast.error(result.error || 'Erreur')
      }
    }
    setSaving(false)
  }

  const handleDeleteConseil = async (id: number) => {
    if (!confirm('Supprimer ce conseil ?')) return
    
    const result = await deleteConseil(id)
    if (result.success) {
      toast.success('Conseil supprimé')
      
      // Supprimer de l'état local
      setConseils(prevConseils => prevConseils.filter(c => c.id !== id))
      
      // Fermer le modal de détails si c'est le conseil supprimé
      if (selectedConseil?.id === id) {
        setShowDetailsModal(false)
        setSelectedConseil(null)
      }
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  const openDetailsModal = (conseil: Conseil) => {
    setSelectedConseil(conseil)
    setShowDetailsModal(true)
  }

  const handleFileUpload = async (file: File) => {
    if (!selectedConseil) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append('conseil_id', selectedConseil.id.toString())
    formData.append('file', file)
    
    const result = await uploadConseilDocument(formData)
    
    if (result.success && result.document) {
      toast.success('Document ajouté')
      
      // Ajouter le document à l'état local
      const nouveauDoc: Document = {
        id: result.document.id,
        nom_fichier: result.document.nom_fichier,
        type_fichier: result.document.type_fichier || null,
        taille_fichier: result.document.taille_fichier || null,
        url_fichier: result.document.url_fichier,
        created_at: new Date().toISOString()
      }
      
      // Mettre à jour dans conseils
      setConseils(prevConseils => 
        prevConseils.map(c => 
          c.id === selectedConseil.id 
            ? { ...c, documents: [...(c.documents || []), nouveauDoc] }
            : c
        )
      )
      
      // Mettre à jour selectedConseil
      setSelectedConseil(prev => prev ? {
        ...prev,
        documents: [...(prev.documents || []), nouveauDoc]
      } : null)
      
    } else {
      toast.error(result.error || 'Erreur')
    }
    setUploading(false)
  }

  const handleDeleteDocument = async (docId: number) => {
    if (!confirm('Supprimer ce document ?')) return
    
    setDeletingId(docId)
    const result = await deleteConseilDocument(docId)
    
    if (result.success) {
      toast.success('Document supprimé')
      
      // Supprimer le document de l'état local
      setConseils(prevConseils => 
        prevConseils.map(c => ({
          ...c,
          documents: c.documents?.filter(d => d.id !== docId) || []
        }))
      )
      
      // Mettre à jour selectedConseil
      setSelectedConseil(prev => prev ? {
        ...prev,
        documents: prev.documents?.filter(d => d.id !== docId) || []
      } : null)
      
    } else {
      toast.error(result.error || 'Erreur')
    }
    setDeletingId(null)
  }

  const getFileIcon = (typeFichier: string | null) => {
    if (typeFichier?.startsWith('image/')) {
      return <PiImage size={16} className="text-blue-500" />
    } else if (typeFichier?.includes('pdf')) {
      return <PiFilePdf size={16} className="text-red-500" />
    } else if (typeFichier?.includes('spreadsheet') || typeFichier?.includes('excel')) {
      return <FileSpreadsheet size={16} className="text-green-500" />
    }
    return <File size={16} className="text-gray-500" />
  }

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleDownload = (url: string, nom: string) => {
    window.open(url, '_blank')
  }

  const getInitials = (fidele: any) => {
    return `${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}`.toUpperCase()
  }

  const getAvatarColor = (fidele: any) => {
    if (fidele.sexe === 'M') return 'from-blue-50 to-blue-100 text-blue-600'
    if (fidele.sexe === 'F') return 'from-pink-50 to-pink-100 text-pink-600'
    return 'from-gray-50 to-gray-100 text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const currentAnneeLabel = anneesDisponibles.find(a => a.id === selectedAnnee)?.label

  const filteredFideles = fideles.filter(f => {
    const fullName = `${f.nom} ${f.post_nom || ''} ${f.prenom}`.toLowerCase()
    return fullName.includes(searchFidele.toLowerCase()) || (f.contact && f.contact.includes(searchFidele))
  })

  return (
    <>
      {/* Sélecteur d'année */}
      {anneesDisponibles.length > 0 && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 border border-gray-200">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-sm text-gray-600">Année de conférence :</span>
          <select
            value={selectedAnnee || ''}
            onChange={(e) => handleAnneeChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-black bg-white"
          >
            {anneesDisponibles.map((annee) => (
              <option key={annee.id} value={annee.id}>
                {annee.label} {annee.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>
          {currentAnneeLabel && (
            <span className="text-xs text-gray-400">
              Conseil pour {currentAnneeLabel}
            </span>
          )}
        </div>
      )}

      {/* Section Membres */}
      <div className="mb-8">
        <h2 className="text-base font-medium mb-4 flex items-center gap-2">
          <Users size={18} className="text-gray-400" />
          Membres du bureau
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map(role => {
            const membre = getMembreByRole(role.value)
            return (
              <div key={role.value} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs px-2 py-1 border ${role.color}`}>
                    {role.label}
                  </span>
                  <button
                    onClick={() => openMembreModal(role.value)}
                    className="p-1 text-gray-400 hover:text-black"
                    title="Modifier"
                  >
                    <Edit size={14} />
                  </button>
                </div>
                
                {membre ? (
                  <div className="flex items-center gap-3">
                    {membre.fidele.profile_img ? (
                      <Image
                        src={membre.fidele.profile_img}
                        alt=""
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(membre.fidele)} flex items-center justify-center`}>
                        <span className="text-base font-medium">{getInitials(membre.fidele)}</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {membre.fidele.nom} {membre.fidele.post_nom} {membre.fidele.prenom}
                      </p>
                      {membre.fidele.contact && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone size={12} />
                          {membre.fidele.contact}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <User size={24} className="mx-auto mb-2 opacity-50" />
                    Non désigné
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Section Conseils */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium flex items-center gap-2">
            <FileText size={18} className="text-gray-400" />
            Réunions du conseil
          </h2>
          <button
            onClick={() => openConseilModal()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Nouvelle réunion
          </button>
        </div>

        {conseils.length === 0 ? (
          <div className="border border-gray-200 py-12 text-center bg-white">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">Aucune réunion pour cette année</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conseils.map(conseil => (
              <div key={conseil.id} className="bg-white border border-gray-200 hover:border-gray-300">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{conseil.libelle}</h3>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(conseil.date_reunion)}
                        </span>
                        {conseil.documents && conseil.documents.length > 0 && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Paperclip size={12} />
                            {conseil.documents.length}
                          </span>
                        )}
                      </div>
                      
                      {conseil.commentaire && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {conseil.commentaire}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailsModal(conseil)}
                        className="p-2 text-gray-400 hover:text-black"
                        title="Voir détails"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openConseilModal(conseil)}
                        className="p-2 text-gray-400 hover:text-black"
                        title="Modifier"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteConseil(conseil.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Sélection Membre */}
      {showMembreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                Sélectionner {ROLES.find(r => r.value === editingRole)?.label}
              </h3>
              <button onClick={() => setShowMembreModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un fidèle..."
                  value={searchFidele}
                  onChange={(e) => setSearchFidele(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingFideles ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-gray-400" size={24} />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFideles.map(fidele => (
                    <div
                      key={fidele.id}
                      onClick={() => setSelectedFidele(fidele.id)}
                      className={`p-3 border cursor-pointer transition-colors ${
                        selectedFidele === fidele.id 
                          ? 'border-black bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {fidele.profile_img ? (
                          <Image src={fidele.profile_img} alt="" width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(fidele)} flex items-center justify-center`}>
                            <span className="text-sm font-medium">{getInitials(fidele)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{fidele.nom} {fidele.post_nom || ''} {fidele.prenom}</p>
                          {fidele.contact && (
                            <p className="text-xs text-gray-500">{fidele.contact}</p>
                          )}
                        </div>
                        {selectedFidele === fidele.id && (
                          <Check size={18} className="text-black" />
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredFideles.length === 0 && (
                    <p className="text-center text-gray-400 py-8">Aucun fidèle trouvé</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleSaveMembre}
                disabled={!selectedFidele || saving}
                className="w-full px-4 py-2 bg-black text-white text-sm disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conseil */}
      {showConseilModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                {editingConseil ? 'Modifier la réunion' : 'Nouvelle réunion'}
              </h3>
              <button onClick={() => setShowConseilModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Libellé *</label>
                <input
                  type="text"
                  value={conseilForm.libelle}
                  onChange={(e) => setConseilForm({ ...conseilForm, libelle: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  placeholder="Ex: Conseil ordinaire..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  value={conseilForm.date_reunion}
                  onChange={(e) => setConseilForm({ ...conseilForm, date_reunion: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Commentaire (PV)</label>
                <textarea
                  value={conseilForm.commentaire}
                  onChange={(e) => setConseilForm({ ...conseilForm, commentaire: e.target.value })}
                  rows={5}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black resize-none"
                  placeholder="Résumé des décisions..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowConseilModal(false)} className="flex-1 px-4 py-2 border border-gray-300 hover:border-black">
                Annuler
              </button>
              <button
                onClick={handleSaveConseil}
                disabled={!conseilForm.libelle || !conseilForm.date_reunion || saving}
                className="flex-1 px-4 py-2 bg-black text-white disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : (editingConseil ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetailsModal && selectedConseil && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-light">{selectedConseil.libelle}</h3>
                <p className="text-sm text-gray-500">{formatDate(selectedConseil.date_reunion)}</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedConseil.commentaire && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Procès-verbal</h4>
                  <div className="bg-gray-50 p-4 border border-gray-200 text-sm whitespace-pre-wrap">
                    {selectedConseil.commentaire}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Documents joints</h4>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      disabled={uploading}
                    />
                    <span className="flex items-center gap-1 text-xs text-gray-500 hover:text-black border border-gray-300 px-3 py-1">
                      {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      Ajouter
                    </span>
                  </label>
                </div>

                {selectedConseil.documents && selectedConseil.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedConseil.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.type_fichier)}
                          <div>
                            <p className="text-sm">{doc.nom_fichier}</p>
                            <p className="text-xs text-gray-400">{formatFileSize(doc.taille_fichier)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownload(doc.url_fichier, doc.nom_fichier)}
                            className="p-2 text-gray-400 hover:text-black"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deletingId === doc.id}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8 border border-dashed border-gray-200">
                    Aucun document
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-4 py-2 border border-gray-300 hover:border-black text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}