// // app/paroisse/transferts/TransfertsClient.tsx
// 'use client'

// import { useState, useMemo,useEffect } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { 
//   Calendar, 
//   Search, 
//   ArrowRightLeft,
//   CheckCircle,
//   XCircle,
//   Clock,
//   Copy,
//   User,
//   Building,
//   ChevronRight,
//   Plus,
//   X,
//   Loader2,
//   MoreVertical,
//   Trash2
// } from 'lucide-react'
// import toast from 'react-hot-toast'
// import { accepterTransfert, annulerTransfert, accepterTransfertParCode, getTransfertByCode } from '@/actions/transfert-paroisse'
// import NouveauTransfertModal from './NouveauTransfertModal'



// import { getConferenceIdFromParoisse } from '@/actions/structures'
// // ========== TYPES ==========
// interface Transfert {
//   id: number
//   sens: 'entrant' | 'sortant'
//   statut: 'en_attente' | 'accepte' | 'refuse' | 'annule'
//   type_transfert: 'paroisse' | 'mission'
//   date_debut: string
//   date_fin: string | null
//   code_transfert: string | null
//   motif: string | null
//   fidele: {
//     id: number
//     nom: string
//     post_nom: string
//     prenom: string
//     contact: string
//     profile_img: string | null
//   }
//   source: {
//     id: number
//     nom: string
//   } | null
//   destination: {
//     id: number
//     nom: string
//   } | null
// }

// interface AnneeDisponible {
//   id: number
//   annee_id: number
//   label: string
//   is_current: boolean
// }

// interface TransfertsClientProps {
//   entrants: Transfert[]
//   sortants: Transfert[]
//   acceptes: Transfert[]
//   anneesDisponibles: AnneeDisponible[]
//   anneeActuelleId?: number
//   currentParoisseId: number
//   currentTab: string
// }

// // ========== COMPOSANT PRINCIPAL ==========
// export default function TransfertsClient({ 
//   entrants, sortants, acceptes, anneesDisponibles, 
//   anneeActuelleId, currentParoisseId, currentTab 
// }: TransfertsClientProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const [anneeFilter, setAnneeFilter] = useState<string>(anneeActuelleId?.toString() || '')
//   const [isNewTransfertModalOpen, setIsNewTransfertModalOpen] = useState(false)
// const [conferenceId, setConferenceId] = useState<number | null>(null)

//   useEffect(() => {
//     const fetchConferenceId = async () => {
//       const id = await getConferenceIdFromParoisse(currentParoisseId)
//       setConferenceId(id)
//     }
//     fetchConferenceId()
//   }, [currentParoisseId])

  
//   const handleAnneeChange = (anneeId: string) => {
//     setAnneeFilter(anneeId)
//     const params = new URLSearchParams(searchParams.toString())
//     if (anneeId) {
//       params.set('annee', anneeId)
//     } else {
//       params.delete('annee')
//     }
//     router.push(`?${params.toString()}`)
//   }

//   const currentData = currentTab === 'entrants' ? entrants : currentTab === 'sortants' ? sortants : acceptes

//   return (
//     <>
//       {/* Barre d'outils */}
//       <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
//         <div className="flex items-center gap-3">
//           {/* Filtre année */}
//           {anneesDisponibles.length > 0 && (
//             <div className="flex items-center gap-2">
//               <Calendar size={16} className="text-gray-400" />
//               <select
//                 value={anneeFilter}
//                 onChange={(e) => handleAnneeChange(e.target.value)}
//                 className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
//               >
//                 <option value="">Toutes les années</option>
//                 {anneesDisponibles.map((annee) => (
//                   <option key={annee.id} value={annee.annee_id}>
//                     {annee.label} {annee.is_current ? '(en cours)' : ''}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           )}
//         </div>

//         {currentTab === 'sortants' && (
//           <button
//             onClick={() => setIsNewTransfertModalOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
//           >
//             <Plus size={16} />
//             Nouveau transfert
//           </button>
//         )}
//       </div>

//       {/* Section Accepter par code (uniquement pour entrants) */}
//       {currentTab === 'entrants' && (
//         <AccepterParCodeSection />
//       )}

//       {/* Liste des transferts */}
//       <TransfertList
//         transferts={currentData}
//         type={currentTab as 'entrants' | 'sortants' | 'acceptes'}
//         currentParoisseId={currentParoisseId}
//       />

//      {isNewTransfertModalOpen && (
//   <NouveauTransfertModal
//     isOpen={isNewTransfertModalOpen}
//     paroisseActuelleId={currentParoisseId}
//     conferenceId={conferenceId || undefined} // À ajouter
//     onClose={() => setIsNewTransfertModalOpen(false)}
//     onSuccess={() => {
//       setIsNewTransfertModalOpen(false)
//       router.refresh()
//     }}
//   />
// )}
//     </>
//   )
// }

// // ========== SECTION ACCEPTER PAR CODE ==========
// function AccepterParCodeSection() {
//   const [code, setCode] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [previewTransfert, setPreviewTransfert] = useState<any>(null)
//   const [showConfirm, setShowConfirm] = useState(false)
//   const router = useRouter()

//   const handleSearch = async () => {
//     if (code.length !== 6) {
//       toast.error('Le code doit contenir 6 chiffres')
//       return
//     }
    
//     setIsLoading(true)
//     const result = await getTransfertByCode(code)
    
//     if (result.error) {
//       toast.error(result.error)
//     } else if (result.transfert) {
//       setPreviewTransfert(result.transfert)
//       if (result.transfert.statut !== 'en_attente') {
//         toast.error('Ce transfert a déjà été traité')
//       }
//     }
    
//     setIsLoading(false)
//   }

//   const handleAccept = async () => {
//     if (!previewTransfert) return
    
//     setIsLoading(true)
//     const result = await accepterTransfertParCode(code)
    
//     if (result.success) {
//       toast.success('Transfert accepté avec succès')
//       setCode('')
//       setPreviewTransfert(null)
//       setShowConfirm(false)
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur lors de l\'acceptation')
//     }
    
//     setIsLoading(false)
//   }

//   const getInitials = (nom: string, prenom: string) => {
//     return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
//   }

//   return (
//     <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center">
//           <ArrowRightLeft size={18} className="text-gray-600" />
//         </div>
//         <div>
//           <h3 className="font-medium text-gray-900">Accepter un transfert par code</h3>
//           <p className="text-xs text-gray-500">Entrez le code à 6 chiffres fourni par le fidèle</p>
//         </div>
//       </div>

//       <div className="flex gap-3">
//         <input
//           type="text"
//           inputMode="numeric"
//           pattern="\d*"
//           maxLength={6}
//           placeholder="Code à 6 chiffres"
//           value={code}
//           onChange={(e) => {
//             setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
//             setPreviewTransfert(null)
//             setShowConfirm(false)
//           }}
//           onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//           className="flex-1 px-4 py-2 text-lg text-center tracking-widest border border-gray-300 focus:outline-none focus:border-black bg-white"
//         />
//         <button
//           onClick={handleSearch}
//           disabled={isLoading || code.length !== 6}
//           className="px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Vérifier'}
//         </button>
//       </div>

//       {previewTransfert && (
//         <div className="mt-4 p-4 bg-white border border-gray-200">
//           <div className="flex items-start gap-4">
//             <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center">
//               <span className="text-gray-600 font-medium">
//                 {getInitials(previewTransfert.fidele?.nom || '', previewTransfert.fidele?.prenom || '')}
//               </span>
//             </div>
//             <div className="flex-1">
//               <div className="flex items-center gap-2 mb-1">
//                 <span className="font-medium">
//                   {previewTransfert.fidele?.nom} {previewTransfert.fidele?.post_nom} {previewTransfert.fidele?.prenom}
//                 </span>
//                 <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200">
//                   En attente
//                 </span>
//               </div>
//               <div className="text-sm text-gray-500 space-y-0.5">
//                 <div className="flex items-center gap-1">
//                   <Building size={12} />
//                   <span>De : {previewTransfert.source?.nom}</span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <Calendar size={12} />
//                   <span>À partir du {new Date(previewTransfert.date_debut).toLocaleDateString('fr-FR')}</span>
//                 </div>
//               </div>

//               {!showConfirm && previewTransfert.statut === 'en_attente' && (
//                 <button
//                   onClick={() => setShowConfirm(true)}
//                   className="mt-3 px-4 py-1.5 bg-black text-white text-sm hover:bg-gray-800"
//                 >
//                   Accepter ce transfert
//                 </button>
//               )}

//               {showConfirm && (
//                 <div className="mt-3 p-3 bg-gray-50 border border-gray-200">
//                   <p className="text-sm mb-3">Confirmer l'acceptation de ce transfert ?</p>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => setShowConfirm(false)}
//                       className="px-4 py-1.5 border border-gray-300 text-sm hover:border-black"
//                     >
//                       Annuler
//                     </button>
//                     <button
//                       onClick={handleAccept}
//                       disabled={isLoading}
//                       className="px-4 py-1.5 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
//                     >
//                       {isLoading && <Loader2 size={14} className="animate-spin" />}
//                       Confirmer
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// // ========== LISTE DES TRANSFERTS ==========
// function TransfertList({ 
//   transferts, 
//   type, 
//   currentParoisseId 
// }: { 
//   transferts: Transfert[], 
//   type: 'entrants' | 'sortants' | 'acceptes', 
//   currentParoisseId?: number 
// }) {
//   const router = useRouter()
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filterSens, setFilterSens] = useState<'tous' | 'entrant' | 'sortant'>('tous')
//   const [processingId, setProcessingId] = useState<number | null>(null)
//   const [showConfirmModal, setShowConfirmModal] = useState<{ id: number, action: 'accept' | 'cancel' } | null>(null)
//   const [menuOpen, setMenuOpen] = useState<number | null>(null)

//   // Filtrage
//   const filteredTransferts = useMemo(() => {
//     let filtered = transferts

//     // Filtre par sens (uniquement pour les acceptés)
//     if (type === 'acceptes' && filterSens !== 'tous') {
//       filtered = filtered.filter(t => t.sens === filterSens)
//     }

//     // Recherche
//     if (searchTerm.trim()) {
//       const q = searchTerm.toLowerCase()
//       filtered = filtered.filter(t => 
//         t.fidele?.nom?.toLowerCase().includes(q) ||
//         t.fidele?.prenom?.toLowerCase().includes(q) ||
//         t.source?.nom?.toLowerCase().includes(q) ||
//         t.destination?.nom?.toLowerCase().includes(q) ||
//         t.code_transfert?.toLowerCase().includes(q)
//       )
//     }

//     return filtered
//   }, [transferts, searchTerm, filterSens, type])

//   // Actions
//   const handleAccept = async (id: number) => {
//     setProcessingId(id)
//     const result = await accepterTransfert(id, currentParoisseId!)
    
//     if (result.success) {
//       toast.success('Transfert accepté avec succès')
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur lors de l\'acceptation')
//     }
    
//     setShowConfirmModal(null)
//     setProcessingId(null)
//   }

//   const handleCancel = async (id: number) => {
//     setProcessingId(id)
//     const result = await annulerTransfert(id)
    
//     if (result.success) {
//       toast.success('Transfert annulé')
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur lors de l\'annulation')
//     }
    
//     setShowConfirmModal(null)
//     setProcessingId(null)
//   }

//   const copyCode = (code: string) => {
//     navigator.clipboard.writeText(code)
//     toast.success('Code copié !')
//   }

//   const getInitials = (nom: string, prenom: string) => {
//     return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
//   }

//   const getStatutBadge = (statut: string, sens?: string) => {
//     if (type === 'acceptes') {
//       return sens === 'entrant' 
//         ? 'bg-green-50 text-green-700 border-green-200'
//         : 'bg-blue-50 text-blue-700 border-blue-200'
//     }
    
//     const badges: Record<string, string> = {
//       en_attente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
//       accepte: 'bg-green-50 text-green-700 border-green-200',
//       refuse: 'bg-red-50 text-red-700 border-red-200',
//       annule: 'bg-gray-50 text-gray-500 border-gray-200'
//     }
//     return badges[statut] || 'bg-gray-50 text-gray-500 border-gray-200'
//   }

//   const getTypeTransfertLabel = (type: string) => {
//     return type === 'paroisse' ? 'Transfert définitif' : 'Mission temporaire'
//   }

//   // Stats pour les acceptés
//   const stats = type === 'acceptes' ? {
//     entrants: transferts.filter(t => t.sens === 'entrant').length,
//     sortants: transferts.filter(t => t.sens === 'sortant').length,
//     total: transferts.length
//   } : null

//   if (transferts.length === 0) {
//     return (
//       <div className="border border-gray-200 bg-white py-16 text-center">
//         <ArrowRightLeft size={48} className="mx-auto text-gray-300 mb-3" />
//         <p className="text-gray-400">Aucun transfert pour cette période</p>
//       </div>
//     )
//   }

//   return (
//     <div>
//       {/* Filtres */}
//       <div className="mb-4 space-y-3">
//         {type === 'acceptes' && stats && (
//           <div className="flex gap-2">
//             <button
//               onClick={() => setFilterSens('tous')}
//               className={`px-3 py-1 text-xs border ${
//                 filterSens === 'tous' 
//                   ? 'bg-black text-white border-black' 
//                   : 'bg-white text-gray-600 border-gray-300 hover:border-black'
//               }`}
//             >
//               Tous ({stats.total})
//             </button>
//             <button
//               onClick={() => setFilterSens('entrant')}
//               className={`px-3 py-1 text-xs border ${
//                 filterSens === 'entrant' 
//                   ? 'bg-black text-white border-black' 
//                   : 'bg-white text-gray-600 border-gray-300 hover:border-black'
//               }`}
//             >
//               Entrants ({stats.entrants})
//             </button>
//             <button
//               onClick={() => setFilterSens('sortant')}
//               className={`px-3 py-1 text-xs border ${
//                 filterSens === 'sortant' 
//                   ? 'bg-black text-white border-black' 
//                   : 'bg-white text-gray-600 border-gray-300 hover:border-black'
//               }`}
//             >
//               Sortants ({stats.sortants})
//             </button>
//           </div>
//         )}

//         <div className="relative">
//           <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Rechercher un fidèle, une paroisse ou un code..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full pl-9 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
//           />
//         </div>
//       </div>

//       {/* Liste */}
//       <div className="space-y-2">
//         {filteredTransferts.map((transfert) => (
//           <div key={transfert.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
//             <div className="flex items-start justify-between">
//               <div className="flex items-start gap-4 flex-1">
//                 {/* Avatar */}
//                 <div className="flex-shrink-0">
//                   <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center">
//                     <span className="text-gray-600 font-medium">
//                       {getInitials(transfert.fidele.nom, transfert.fidele.prenom)}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Infos */}
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 flex-wrap mb-1">
//                     <span className="font-medium text-gray-900">
//                       {transfert.fidele.nom} {transfert.fidele.post_nom} {transfert.fidele.prenom}
//                     </span>
                    
//                     {type === 'sortants' && (
//                       <span className={`text-xs px-2 py-0.5 border ${getStatutBadge(transfert.statut)}`}>
//                         {transfert.statut.replace('_', ' ')}
//                       </span>
//                     )}
                    
//                     {type === 'acceptes' && (
//                       <>
//                         <span className={`text-xs px-2 py-0.5 border ${getStatutBadge('', transfert.sens)}`}>
//                           {transfert.sens === 'entrant' ? 'Entrant' : 'Sortant'}
//                         </span>
//                         <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
//                           Accepté
//                         </span>
//                       </>
//                     )}

//                     <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200">
//                       {getTypeTransfertLabel(transfert.type_transfert)}
//                     </span>
//                   </div>

//                   <div className="text-sm text-gray-500 space-y-1">
//                     {type === 'entrants' && transfert.source && (
//                       <div className="flex items-center gap-1">
//                         <Building size={12} />
//                         <span>De : {transfert.source.nom}</span>
//                       </div>
//                     )}
                    
//                     {type === 'sortants' && transfert.destination && (
//                       <div className="flex items-center gap-1">
//                         <Building size={12} />
//                         <span>Vers : {transfert.destination.nom}</span>
//                       </div>
//                     )}
                    
//                     {type === 'acceptes' && transfert.source && transfert.destination && (
//                       <div className="flex items-center gap-2">
//                         <span>{transfert.source.nom}</span>
//                         <ChevronRight size={12} className="text-gray-400" />
//                         <span>{transfert.destination.nom}</span>
//                       </div>
//                     )}

//                     <div className="flex items-center gap-1">
//                       <Calendar size={12} />
//                       <span>
//                         À partir du {new Date(transfert.date_debut).toLocaleDateString('fr-FR')}
//                         {transfert.date_fin && ` jusqu'au ${new Date(transfert.date_fin).toLocaleDateString('fr-FR')}`}
//                       </span>
//                     </div>

//                     {type === 'sortants' && transfert.statut === 'en_attente' && transfert.code_transfert && (
//                       <div className="flex items-center gap-2 mt-2">
//                         <span className="text-xs text-gray-400">Code de transfert :</span>
//                         <span className="font-mono text-sm bg-gray-100 px-3 py-1 border border-gray-200">
//                           {transfert.code_transfert}
//                         </span>
//                         <button
//                           onClick={() => copyCode(transfert.code_transfert!)}
//                           className="p-1 text-gray-400 hover:text-black"
//                           title="Copier le code"
//                         >
//                           <Copy size={14} />
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Actions */}
//               <div className="flex items-center gap-2">
//                 {type === 'entrants' && (
//                   <button
//                     onClick={() => setShowConfirmModal({ id: transfert.id, action: 'accept' })}
//                     className="px-4 py-1.5 bg-black text-white text-sm hover:bg-gray-800"
//                   >
//                     Accepter
//                   </button>
//                 )}

//                 {type === 'sortants' && transfert.statut === 'en_attente' && (
//                   <div className="relative">
//                     <button
//                       onClick={() => setMenuOpen(menuOpen === transfert.id ? null : transfert.id)}
//                       className="p-2 text-gray-400 hover:text-black"
//                     >
//                       <MoreVertical size={16} />
//                     </button>
                    
//                     {menuOpen === transfert.id && (
//                       <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[160px]">
//                         <button
//                           onClick={() => {
//                             setShowConfirmModal({ id: transfert.id, action: 'cancel' })
//                             setMenuOpen(null)
//                           }}
//                           className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
//                         >
//                           <Trash2 size={14} />
//                           Annuler le transfert
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pied de liste */}
//       {filteredTransferts.length > 0 && (
//         <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
//           <span>
//             {filteredTransferts.length} transfert{filteredTransferts.length > 1 ? 's' : ''} affiché{filteredTransferts.length > 1 ? 's' : ''}
//           </span>
//           {transferts.length !== filteredTransferts.length && (
//             <span>(sur {transferts.length} total)</span>
//           )}
//         </div>
//       )}

//       {/* Modal de confirmation */}
//       {showConfirmModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-md">
//             <div className="p-6">
//               <h3 className="text-lg font-light mb-4">
//                 {showConfirmModal.action === 'accept' ? 'Accepter le transfert ?' : 'Annuler le transfert ?'}
//               </h3>
//               <p className="text-sm text-gray-500 mb-6">
//                 {showConfirmModal.action === 'accept' 
//                   ? 'Le fidèle sera rattaché à votre paroisse à partir de la date indiquée.'
//                   : 'Cette action est irréversible. Le transfert sera annulé.'
//                 }
//               </p>
//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setShowConfirmModal(null)}
//                   className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   onClick={() => showConfirmModal.action === 'accept' 
//                     ? handleAccept(showConfirmModal.id) 
//                     : handleCancel(showConfirmModal.id)
//                   }
//                   disabled={processingId === showConfirmModal.id}
//                   className={`flex-1 px-4 py-2 text-white disabled:opacity-50 flex items-center justify-center gap-2 ${
//                     showConfirmModal.action === 'accept' 
//                       ? 'bg-black hover:bg-gray-800' 
//                       : 'bg-red-600 hover:bg-red-700'
//                   }`}
//                 >
//                   {processingId === showConfirmModal.id ? (
//                     <Loader2 size={16} className="animate-spin" />
//                   ) : (
//                     'Confirmer'
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Fond pour fermer le menu */}
//       {menuOpen && (
//         <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
//       )}
//     </div>
//   )
// }

// app/paroisse/transferts/TransfertsClient.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Calendar, 
  Search, 
  ArrowRightLeft,
  Copy,
  Building,
  ChevronRight,
  Plus,
  Loader2,
  MoreVertical,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { accepterTransfert, annulerTransfert, accepterTransfertParCode, getTransfertByCode } from '@/actions/transfert-paroisse'
import NouveauTransfertModal from './NouveauTransfertModal'
import ExportTransfertPDFButton from './ExportTransfertPDFButton'
import { getConferenceIdFromParoisse } from '@/actions/structures'

// ========== TYPES ==========
interface Transfert {
  id: number
  sens: 'entrant' | 'sortant'
  statut: 'en_attente' | 'accepte' | 'refuse' | 'annule'
  type_transfert: 'paroisse' | 'mission'
  date_debut: string
  date_fin: string | null
  code_transfert: string | null
  motif: string | null
  fidele: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img: string | null
    sexe: string | null
    annee_naissance: number | null
  }
  source: {
    id: number
    nom: string
  } | null
  destination: {
    id: number
    nom: string
  } | null
}

interface AnneeDisponible {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

interface StructureInfo {
  region: string | null
  conference: string | null
  district: string | null
  paroisse: string | null
}

interface TransfertsClientProps {
  entrants: Transfert[]
  sortants: Transfert[]
  acceptes: Transfert[]
  anneesDisponibles: AnneeDisponible[]
  anneeActuelleId?: number
  currentParoisseId: number
  currentTab: string
  structureInfo: StructureInfo | null
}

// ========== COMPOSANT PRINCIPAL ==========
export default function TransfertsClient({ 
  entrants, 
  sortants, 
  acceptes, 
  anneesDisponibles, 
  anneeActuelleId, 
  currentParoisseId, 
  currentTab,
  structureInfo
}: TransfertsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [anneeFilter, setAnneeFilter] = useState<string>(anneeActuelleId?.toString() || '')
  const [isNewTransfertModalOpen, setIsNewTransfertModalOpen] = useState(false)
  const [conferenceId, setConferenceId] = useState<number | null>(null)

  useEffect(() => {
    const fetchConferenceId = async () => {
      const id = await getConferenceIdFromParoisse(currentParoisseId)
      setConferenceId(id)
    }
    fetchConferenceId()
  }, [currentParoisseId])

  const handleAnneeChange = (anneeId: string) => {
    setAnneeFilter(anneeId)
    const params = new URLSearchParams(searchParams.toString())
    if (anneeId) {
      params.set('annee', anneeId)
    } else {
      params.delete('annee')
    }
    router.push(`?${params.toString()}`)
  }

  const currentData = currentTab === 'entrants' ? entrants : currentTab === 'sortants' ? sortants : acceptes

  return (
    <>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {/* Filtre année */}
          {anneesDisponibles.length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <select
                value={anneeFilter}
                onChange={(e) => handleAnneeChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
              >
                <option value="">Toutes les années</option>
                {anneesDisponibles.map((annee) => (
                  <option key={annee.id} value={annee.annee_id}>
                    {annee.label} {annee.is_current ? '(en cours)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {currentTab === 'sortants' && (
          <button
            onClick={() => setIsNewTransfertModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            <Plus size={16} />
            Nouveau transfert
          </button>
        )}
      </div>

      {/* Section Accepter par code (uniquement pour entrants) */}
      {currentTab === 'entrants' && (
        <AccepterParCodeSection />
      )}

      {/* Liste des transferts */}
      <TransfertList
        transferts={currentData}
        type={currentTab as 'entrants' | 'sortants' | 'acceptes'}
        currentParoisseId={currentParoisseId}
        structureInfo={structureInfo}
      />

      {isNewTransfertModalOpen && (
        <NouveauTransfertModal
          isOpen={isNewTransfertModalOpen}
          paroisseActuelleId={currentParoisseId}
          conferenceId={conferenceId || undefined}
          onClose={() => setIsNewTransfertModalOpen(false)}
          onSuccess={() => {
            setIsNewTransfertModalOpen(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

// ========== SECTION ACCEPTER PAR CODE ==========
// function AccepterParCodeSection() {
//   const [code, setCode] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [previewTransfert, setPreviewTransfert] = useState<any>(null)
//   const [showConfirm, setShowConfirm] = useState(false)
//   const router = useRouter()

//   const handleSearch = async () => {
//     if (code.length !== 6) {
//       toast.error('Le code doit contenir 6 chiffres')
//       return
//     }
    
//     setIsLoading(true)
//     const result = await getTransfertByCode(code)
    
//     if (result.error) {
//       toast.error(result.error)
//     } else if (result.transfert) {
//       setPreviewTransfert(result.transfert)
//       if (result.transfert.statut !== 'en_attente') {
//         toast.error('Ce transfert a déjà été traité')
//       }
//     }
    
//     setIsLoading(false)
//   }

//   const handleAccept = async () => {
//     if (!previewTransfert) return
    
//     setIsLoading(true)
//     const result = await accepterTransfertParCode(code)
    
//     if (result.success) {
//       toast.success('Transfert accepté avec succès')
//       setCode('')
//       setPreviewTransfert(null)
//       setShowConfirm(false)
//       router.refresh()
//     } else {
//       toast.error(result.error || 'Erreur lors de l\'acceptation')
//     }
    
//     setIsLoading(false)
//   }

//   const getInitials = (nom: string, prenom: string) => {
//     return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
//   }

//   return (
//     <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
//       <div className="flex items-center gap-3 mb-4">
//         <div className="w-10 h-10 bg-white border border-gray-200 flex items-center justify-center">
//           <ArrowRightLeft size={18} className="text-gray-600" />
//         </div>
//         <div>
//           <h3 className="font-medium text-gray-900">Accepter un transfert par code</h3>
//           <p className="text-xs text-gray-500">Entrez le code à 6 chiffres fourni par le fidèle</p>
//         </div>
//       </div>

//       <div className="flex gap-3">
//         <input
//           type="text"
//           inputMode="numeric"
//           pattern="\d*"
//           maxLength={6}
//           placeholder="Code à 6 chiffres"
//           value={code}
//           onChange={(e) => {
//             setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
//             setPreviewTransfert(null)
//             setShowConfirm(false)
//           }}
//           onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//           className="flex-1 px-4 py-2 text-lg text-center tracking-widest border border-gray-300 focus:outline-none focus:border-black bg-white"
//         />
//         <button
//           onClick={handleSearch}
//           disabled={isLoading || code.length !== 6}
//           className="px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
//         >
//           {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Vérifier'}
//         </button>
//       </div>

//       {previewTransfert && (
//         <div className="mt-4 p-4 bg-white border border-gray-200">
//           <div className="flex items-start gap-4">
//             <div className="w-12 h-12 bg-gray-100 border border-gray-200 flex items-center justify-center">
//               <span className="text-gray-600 font-medium">
//                 {getInitials(previewTransfert.fidele?.nom || '', previewTransfert.fidele?.prenom || '')}
//               </span>
//             </div>
//             <div className="flex-1">
//               <div className="flex items-center gap-2 mb-1">
//                 <span className="font-medium">
//                   {previewTransfert.fidele?.nom} {previewTransfert.fidele?.post_nom} {previewTransfert.fidele?.prenom}
//                 </span>
//                 <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200">
//                   En attente
//                 </span>
//               </div>
//               <div className="text-sm text-gray-500 space-y-0.5">
//                 <div className="flex items-center gap-1">
//                   <Building size={12} />
//                   <span>De : {previewTransfert.source?.nom}</span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <Calendar size={12} />
//                   <span>À partir du {new Date(previewTransfert.date_debut).toLocaleDateString('fr-FR')}</span>
//                 </div>
//               </div>

//               {!showConfirm && previewTransfert.statut === 'en_attente' && (
//                 <button
//                   onClick={() => setShowConfirm(true)}
//                   className="mt-3 px-4 py-1.5 bg-black text-white text-sm hover:bg-gray-800"
//                 >
//                   Accepter ce transfert
//                 </button>
//               )}

//               {showConfirm && (
//                 <div className="mt-3 p-3 bg-gray-50 border border-gray-200">
//                   <p className="text-sm mb-3">Confirmer l&apos;acceptation de ce transfert ?</p>
//                   <div className="flex gap-2">
//                     <button
//                       onClick={() => setShowConfirm(false)}
//                       className="px-4 py-1.5 border border-gray-300 text-sm hover:border-black"
//                     >
//                       Annuler
//                     </button>
//                     <button
//                       onClick={handleAccept}
//                       disabled={isLoading}
//                       className="px-4 py-1.5 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
//                     >
//                       {isLoading && <Loader2 size={14} className="animate-spin" />}
//                       Confirmer
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// ========== SECTION ACCEPTER PAR CODE ==========
function AccepterParCodeSection() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [previewTransfert, setPreviewTransfert] = useState<any>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  const handleSearch = async () => {
    if (code.length !== 6) {
      toast.error('Le code doit contenir 6 chiffres')
      return
    }
    
    setIsLoading(true)
    setImageError(false)
    const result = await getTransfertByCode(code)
    
    if (result.error) {
      toast.error(result.error)
    } else if (result.transfert) {
      setPreviewTransfert(result.transfert)
      if (result.transfert.statut !== 'en_attente') {
        toast.error('Ce transfert a déjà été traité')
      }
    }
    
    setIsLoading(false)
  }

  const handleAccept = async () => {
    if (!previewTransfert) return
    
    setIsLoading(true)
    const result = await accepterTransfertParCode(code)
    
    if (result.success) {
      toast.success('Transfert accepté avec succès')
      setCode('')
      setPreviewTransfert(null)
      setShowConfirm(false)
      setImageError(false)
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de l\'acceptation')
    }
    
    setIsLoading(false)
  }

  const getInitials = (nom: string, prenom: string) => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
  }

  const renderAvatar = (fidele: any) => {
    if (fidele?.profile_img && !imageError) {
      return (
        <img 
          src={fidele.profile_img} 
          alt={`${fidele.prenom || ''} ${fidele.nom || ''}`}
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
          onError={() => setImageError(true)}
        />
      )
    }
    
    const initials = getInitials(fidele?.nom || '', fidele?.prenom || '')
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
        <span className="text-gray-600 font-medium">
          {initials}
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white rounded-full border border-gray-200 flex items-center justify-center">
          <ArrowRightLeft size={18} className="text-gray-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">Accepter un transfert par code</h3>
          <p className="text-xs text-gray-500">Entrez le code à 6 chiffres fourni par le fidèle</p>
        </div>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          placeholder="Code à 6 chiffres"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setPreviewTransfert(null)
            setShowConfirm(false)
            setImageError(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 text-lg text-center tracking-widest border border-gray-300 focus:outline-none focus:border-black bg-white rounded-lg"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || code.length !== 6}
          className="px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Vérification...
            </>
          ) : (
            'Vérifier'
          )}
        </button>
      </div>

      {previewTransfert && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-start gap-4">
            {/* Avatar avec photo de profil */}
            <div className="flex-shrink-0">
              {renderAvatar(previewTransfert.fidele)}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium">
                  {previewTransfert.fidele?.nom} {previewTransfert.fidele?.post_nom} {previewTransfert.fidele?.prenom}
                </span>
                <span className="text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
                  En attente
                </span>
              </div>
              
              <div className="text-sm text-gray-500 space-y-1">
                <div className="flex items-center gap-1">
                  <Building size={12} />
                  <span>De : {previewTransfert.source?.nom}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>À partir du {new Date(previewTransfert.date_debut).toLocaleDateString('fr-FR')}</span>
                  {previewTransfert.date_fin && (
                    <span> jusqu'au {new Date(previewTransfert.date_fin).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                {previewTransfert.motif && (
                  <div className="flex items-start gap-1 mt-2">
                    <span className="text-xs text-gray-400">Motif :</span>
                    <span className="text-xs text-gray-600">{previewTransfert.motif}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-400">Type :</span>
                  <span className="text-xs text-gray-600">
                    {previewTransfert.type_transfert === 'paroisse' ? 'Transfert définitif' : 'Mission temporaire'}
                  </span>
                </div>
              </div>

              {!showConfirm && previewTransfert.statut === 'en_attente' && (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="mt-3 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Accepter ce transfert
                </button>
              )}

              {showConfirm && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm mb-3">
                    Êtes-vous sûr de vouloir accepter le transfert de <strong>{previewTransfert.fidele?.prenom} {previewTransfert.fidele?.nom}</strong> ?
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    Cette action rattachera définitivement ce fidèle à votre paroisse.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 border border-gray-300 text-sm hover:border-black rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleAccept}
                      disabled={isLoading}
                      className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2 rounded-lg transition-colors"
                    >
                      {isLoading && <Loader2 size={14} className="animate-spin" />}
                      Confirmer l'acceptation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ========== LISTE DES TRANSFERTS ==========
function TransfertList({ 
  transferts, 
  type, 
  currentParoisseId,
  structureInfo
}: { 
  transferts: Transfert[], 
  type: 'entrants' | 'sortants' | 'acceptes', 
  currentParoisseId?: number,
  structureInfo: StructureInfo | null
}) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSens, setFilterSens] = useState<'tous' | 'entrant' | 'sortant'>('tous')
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState<{ id: number, action: 'accept' | 'cancel' } | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  // Fonction pour rendre l'avatar
  const renderAvatar = (fidele: Transfert['fidele']) => {
    if (fidele.profile_img) {
      return (
        <img 
          src={fidele.profile_img} 
          alt={`${fidele.prenom} ${fidele.nom}`}
          className="w-12 h-12 rounded-full object-cover border border-gray-200"
          onError={(e) => {
            // Fallback si l'image ne charge pas
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              const fallback = document.createElement('div')
              fallback.className = 'w-12 h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center'
              fallback.innerHTML = `<span class="text-gray-600 font-medium">${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}</span>`
              parent.appendChild(fallback)
            }
          }}
        />
      )
    }
    
    const initials = `${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}`.toUpperCase()
    return (
      <div className="w-12 h-12 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center">
        <span className="text-gray-600 font-medium">
          {initials}
        </span>
      </div>
    )
  }

  // Filtrage
  const filteredTransferts = useMemo(() => {
    let filtered = transferts

    // Filtre par sens (uniquement pour les acceptés)
    if (type === 'acceptes' && filterSens !== 'tous') {
      filtered = filtered.filter(t => t.sens === filterSens)
    }

    // Recherche
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(t => 
        t.fidele?.nom?.toLowerCase().includes(q) ||
        t.fidele?.prenom?.toLowerCase().includes(q) ||
        t.source?.nom?.toLowerCase().includes(q) ||
        t.destination?.nom?.toLowerCase().includes(q) ||
        t.code_transfert?.toLowerCase().includes(q)
      )
    }

    return filtered
  }, [transferts, searchTerm, filterSens, type])

  // Actions
  const handleAccept = async (id: number) => {
    setProcessingId(id)
    const result = await accepterTransfert(id, currentParoisseId!)
    
    if (result.success) {
      toast.success('Transfert accepté avec succès')
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de l\'acceptation')
    }
    
    setShowConfirmModal(null)
    setProcessingId(null)
  }

  const handleCancel = async (id: number) => {
    setProcessingId(id)
    const result = await annulerTransfert(id)
    
    if (result.success) {
      toast.success('Transfert annulé')
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de l\'annulation')
    }
    
    setShowConfirmModal(null)
    setProcessingId(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copié !')
  }

  const getStatutBadge = (statut: string, sens?: string) => {
    if (type === 'acceptes') {
      return sens === 'entrant' 
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-blue-50 text-blue-700 border-blue-200'
    }
    
    const badges: Record<string, string> = {
      en_attente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      accepte: 'bg-green-50 text-green-700 border-green-200',
      refuse: 'bg-red-50 text-red-700 border-red-200',
      annule: 'bg-gray-50 text-gray-500 border-gray-200'
    }
    return badges[statut] || 'bg-gray-50 text-gray-500 border-gray-200'
  }

  const getTypeTransfertLabel = (type: string) => {
    return type === 'paroisse' ? 'Transfert définitif' : 'Mission temporaire'
  }

  // Stats pour les acceptés
  const stats = type === 'acceptes' ? {
    entrants: transferts.filter(t => t.sens === 'entrant').length,
    sortants: transferts.filter(t => t.sens === 'sortant').length,
    total: transferts.length
  } : null

  if (transferts.length === 0) {
    return (
      <div className="border border-gray-200 bg-white py-16 text-center">
        <ArrowRightLeft size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400">Aucun transfert pour cette période</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filtres */}
      <div className="mb-4 space-y-3">
        {type === 'acceptes' && stats && (
          <div className="flex gap-2">
            <button
              onClick={() => setFilterSens('tous')}
              className={`px-3 py-1 text-xs border ${
                filterSens === 'tous' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              Tous ({stats.total})
            </button>
            <button
              onClick={() => setFilterSens('entrant')}
              className={`px-3 py-1 text-xs border ${
                filterSens === 'entrant' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              Entrants ({stats.entrants})
            </button>
            <button
              onClick={() => setFilterSens('sortant')}
              className={`px-3 py-1 text-xs border ${
                filterSens === 'sortant' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              Sortants ({stats.sortants})
            </button>
          </div>
        )}

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un fidèle, une paroisse ou un code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
          />
        </div>
      </div>

      {/* Liste */}
      <div className="space-y-2">
        {filteredTransferts.map((transfert) => (
          <div key={transfert.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar avec photo de profil */}
                <div className="flex-shrink-0">
                  {renderAvatar(transfert.fidele)}
                </div>

                {/* Infos */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium text-gray-900">
                      {transfert.fidele.nom} {transfert.fidele.post_nom} {transfert.fidele.prenom}
                    </span>
                    
                    {type === 'sortants' && (
                      <span className={`text-xs px-2 py-0.5 border ${getStatutBadge(transfert.statut)}`}>
                        {transfert.statut.replace('_', ' ')}
                      </span>
                    )}
                    
                    {type === 'acceptes' && (
                      <>
                        <span className={`text-xs px-2 py-0.5 border ${getStatutBadge('', transfert.sens)}`}>
                          {transfert.sens === 'entrant' ? 'Entrant' : 'Sortant'}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 border border-green-200">
                          Accepté
                        </span>
                      </>
                    )}

                    <span className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-200">
                      {getTypeTransfertLabel(transfert.type_transfert)}
                    </span>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    {type === 'entrants' && transfert.source && (
                      <div className="flex items-center gap-1">
                        <Building size={12} />
                        <span>De : {transfert.source.nom}</span>
                      </div>
                    )}
                    
                    {type === 'sortants' && transfert.destination && (
                      <div className="flex items-center gap-1">
                        <Building size={12} />
                        <span>Vers : {transfert.destination.nom}</span>
                      </div>
                    )}
                    
                    {type === 'acceptes' && transfert.source && transfert.destination && (
                      <div className="flex items-center gap-2">
                        <span>{transfert.source.nom}</span>
                        <ChevronRight size={12} className="text-gray-400" />
                        <span>{transfert.destination.nom}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>
                        À partir du {new Date(transfert.date_debut).toLocaleDateString('fr-FR')}
                        {transfert.date_fin && ` jusqu'au ${new Date(transfert.date_fin).toLocaleDateString('fr-FR')}`}
                      </span>
                    </div>

                    {type === 'sortants' && transfert.statut === 'en_attente' && transfert.code_transfert && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-400">Code de transfert :</span>
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 border border-gray-200">
                          {transfert.code_transfert}
                        </span>
                        <button
                          onClick={() => copyCode(transfert.code_transfert!)}
                          className="p-1 text-gray-400 hover:text-black"
                          title="Copier le code"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Bouton PDF - toujours affiché */}
                <ExportTransfertPDFButton 
                  transfert={transfert}
                  structureInfo={structureInfo || {
                    region: null,
                    conference: null,
                    district: null,
                    paroisse: null
                  }}
                  currentUserName="Pasteur Principal"
                />

                {type === 'entrants' && transfert.statut === 'en_attente' && (
                  <button
                    onClick={() => setShowConfirmModal({ id: transfert.id, action: 'accept' })}
                    className="px-4 py-1.5 bg-black text-white text-sm hover:bg-gray-800"
                  >
                    Accepter
                  </button>
                )}

                {type === 'sortants' && transfert.statut === 'en_attente' && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === transfert.id ? null : transfert.id)}
                      className="p-2 text-gray-400 hover:text-black"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {menuOpen === transfert.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={() => {
                            setShowConfirmModal({ id: transfert.id, action: 'cancel' })
                            setMenuOpen(null)
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          Annuler le transfert
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pied de liste */}
      {filteredTransferts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
          <span>
            {filteredTransferts.length} transfert{filteredTransferts.length > 1 ? 's' : ''} affiché{filteredTransferts.length > 1 ? 's' : ''}
          </span>
          {transferts.length !== filteredTransferts.length && (
            <span>(sur {transferts.length} total)</span>
          )}
        </div>
      )}

      {/* Modal de confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-light mb-4">
                {showConfirmModal.action === 'accept' ? 'Accepter le transfert ?' : 'Annuler le transfert ?'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {showConfirmModal.action === 'accept' 
                  ? 'Le fidèle sera rattaché à votre paroisse à partir de la date indiquée.'
                  : 'Cette action est irréversible. Le transfert sera annulé.'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
                >
                  Annuler
                </button>
                <button
                  onClick={() => showConfirmModal.action === 'accept' 
                    ? handleAccept(showConfirmModal.id) 
                    : handleCancel(showConfirmModal.id)
                  }
                  disabled={processingId === showConfirmModal.id}
                  className={`flex-1 px-4 py-2 text-white disabled:opacity-50 flex items-center justify-center gap-2 ${
                    showConfirmModal.action === 'accept' 
                      ? 'bg-black hover:bg-gray-800' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingId === showConfirmModal.id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Confirmer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fond pour fermer le menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}