// // app/cabinet/membres/AjouterMembreModal.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { addMembreCabinet, getRolesCabinet } from '@/actions/cabinet-pastoral'
// import { X, Search, Loader2, User, ChevronLeft } from 'lucide-react'
// import toast from 'react-hot-toast'

// interface AjouterMembreModalProps {
//   isOpen: boolean
//   onClose: () => void
//   paroisseId: number
//   paroisseNom: string
//   fidelesParoisse: any[]
//   anneeConferenceId: number | null
//   onSuccess?: () => void
// }

// interface Role {
//   id: number
//   nom_role: string
//   label_role: string
// }

// export default function AjouterMembreModal({ 
//   isOpen, 
//   onClose, 
//   paroisseId,
//   paroisseNom,
//   fidelesParoisse,
//   anneeConferenceId,
//   onSuccess
// }: AjouterMembreModalProps) {
//   const [roles, setRoles] = useState<Role[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [selectedFidele, setSelectedFidele] = useState<any | null>(null)
//   const [selectedRole, setSelectedRole] = useState<Role | null>(null)
//   const [showFideleSelector, setShowFideleSelector] = useState(false)
//   const [submitting, setSubmitting] = useState(false)

//   useEffect(() => {
//     if (isOpen) {
//       loadRoles()
//     }
//   }, [isOpen])

//   async function loadRoles() {
//     try {
//       setLoading(true)
//       const rolesList = await getRolesCabinet()
//       setRoles(rolesList)
//     } catch (error) {
//       console.error('Erreur chargement rôles:', error)
//       toast.error('Erreur lors du chargement des rôles')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const filteredFideles = fidelesParoisse.filter(fidele => {
//     const fullName = `${fidele.nom || ''} ${fidele.post_nom || ''} ${fidele.prenom || ''}`.toLowerCase()
//     const searchLower = searchTerm.toLowerCase()
//     return fullName.includes(searchLower) || fidele.contact?.toLowerCase().includes(searchLower)
//   })

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setSubmitting(true)
    
//     if (!selectedFidele) {
//       toast.error('Veuillez sélectionner un fidèle')
//       setSubmitting(false)
//       return
//     }

//     try {
//       const result = await addMembreCabinet(
//         paroisseId,
//         selectedFidele.id,
//         selectedRole?.id || null
//       )

//       if (result.success) {
//         toast.success('Membre ajouté avec succès')
//         onSuccess?.()
//         onClose()
//         resetForm()
//       } else {
//         toast.error(result.error || 'Erreur lors de l\'ajout')
//       }
//     } catch (error) {
//       toast.error('Une erreur est survenue')
//     } finally {
//       setSubmitting(false)
//     }
//   }

//   function resetForm() {
//     setSelectedFidele(null)
//     setSelectedRole(null)
//     setSearchTerm('')
//   }

//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="flex justify-between items-center p-4 border-b border-gray-200">
//           <div>
//             <h3 className="text-lg font-light">Ajouter un membre au cabinet</h3>
//             <p className="text-sm text-gray-500 mt-0.5">{paroisseNom}</p>
//           </div>
//           <button onClick={onClose} className="text-gray-400 hover:text-black">
//             <X size={20} />
//           </button>
//         </div>

//         {/* Contenu */}
//         <div className="flex-1 overflow-y-auto p-4">
//           {loading ? (
//             <div className="flex justify-center py-12">
//               <Loader2 size={24} className="animate-spin text-gray-400" />
//             </div>
//           ) : (
//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Sélection du fidèle */}
//               <div>
//                 <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
//                   Fidèle <span className="text-red-400">*</span>
//                 </label>
                
//                 {selectedFidele ? (
//                   <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
//                     <div className="flex items-center gap-3">
//                       {selectedFidele.profile_img ? (
//                         <img src={selectedFidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
//                       ) : (
//                         <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-400 rounded-full">
//                           <User size={20} />
//                         </div>
//                       )}
//                       <div>
//                         <p className="text-sm font-medium">
//                           {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
//                         </p>
//                         <p className="text-xs text-gray-500">{selectedFidele.contact || 'Aucun contact'}</p>
//                       </div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => setSelectedFidele(null)}
//                       className="text-xs text-gray-400 hover:text-black"
//                     >
//                       Changer
//                     </button>
//                   </div>
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={() => setShowFideleSelector(true)}
//                     className="w-full px-4 py-3 border border-gray-300 text-left text-sm text-gray-500 hover:border-black transition-colors"
//                   >
//                     + Sélectionner un fidèle
//                   </button>
//                 )}
//               </div>

//               {/* Sélection du rôle */}
//               <div>
//                 <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
//                   Rôle (optionnel)
//                 </label>
//                 <select
//                   value={selectedRole?.id || ''}
//                   onChange={(e) => {
//                     const role = roles.find(r => r.id === parseInt(e.target.value))
//                     setSelectedRole(role || null)
//                   }}
//                   className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
//                 >
//                   <option value="">Sans rôle</option>
//                   {roles.map((role) => (
//                     <option key={role.id} value={role.id}>
//                       {role.label_role}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               {/* Récapitulatif */}
//               {selectedFidele && (
//                 <div className="p-4 border bg-gray-50">
//                   <p className="text-sm font-medium mb-2 text-gray-700">
//                     Récapitulatif
//                   </p>
//                   <div className="space-y-1 text-sm">
//                     <div className="flex justify-between">
//                       <span className="text-gray-500">Fidèle :</span>
//                       <span>{selectedFidele.prenom} {selectedFidele.nom}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-500">Rôle :</span>
//                       <span className={selectedRole ? 'text-purple-700' : 'text-gray-400'}>
//                         {selectedRole?.label_role || 'Non défini'}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </form>
//           )}
//         </div>

//         {/* Footer */}
//         <div className="p-4 border-t border-gray-200 flex gap-3">
//           <button
//             type="button"
//             onClick={onClose}
//             className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm transition-colors"
//           >
//             Annuler
//           </button>
//           <button
//             type="button"
//             onClick={handleSubmit}
//             disabled={!selectedFidele || submitting}
//             className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
//           >
//             {submitting ? (
//               <>
//                 <Loader2 size={14} className="animate-spin" />
//                 <span>Ajout...</span>
//               </>
//             ) : (
//               'Ajouter'
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Modal de sélection des fidèles */}
//       {showFideleSelector && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
//           <div className="bg-white w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
//             <div className="p-4 border-b border-gray-200">
//               <div className="flex items-center gap-3 mb-3">
//                 <button
//                   onClick={() => setShowFideleSelector(false)}
//                   className="text-gray-400 hover:text-black"
//                 >
//                   <ChevronLeft size={20} />
//                 </button>
//                 <h3 className="text-lg font-light">Sélectionner un fidèle</h3>
//               </div>
//               <div className="relative">
//                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Rechercher par nom ou contact..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
//                   autoFocus
//                 />
//               </div>
//             </div>
//             <div className="flex-1 overflow-y-auto p-2">
//               {filteredFideles.length === 0 ? (
//                 <p className="text-center text-gray-400 py-8">Aucun fidèle trouvé</p>
//               ) : (
//                 filteredFideles.map((fidele) => (
//                   <button
//                     key={fidele.id}
//                     type="button"
//                     onClick={() => {
//                       setSelectedFidele(fidele)
//                       setShowFideleSelector(false)
//                       setSearchTerm('')
//                     }}
//                     className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
//                   >
//                     {fidele.profile_img ? (
//                       <img src={fidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
//                     ) : (
//                       <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400 rounded-full">
//                         <User size={20} />
//                       </div>
//                     )}
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium truncate">
//                         {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
//                       </p>
//                       <p className="text-xs text-gray-500">{fidele.contact || 'Aucun contact'}</p>
//                     </div>
//                   </button>
//                 ))
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// app/cabinet/membres/AjouterMembreModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { addMembreCabinet, getRolesCabinet } from '@/actions/cabinet-pastoral'
import { getPasteursByParoisse } from '@/actions/pasteurs'
import { X, Search, Loader2, User, ChevronLeft, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

interface AjouterMembreModalProps {
  isOpen: boolean
  onClose: () => void
  paroisseId: number
  paroisseNom: string
  fidelesParoisse: any[]
  anneeConferenceId: number | null
  onSuccess?: () => void
}

interface Role {
  id: number
  nom_role: string
  label_role: string
}

interface PasteurAffecte {
  id: number
  pasteur_id: number
  paroisse_id: number
  pasteur: {
    id: number
    etude: string
    est_actif: boolean
    fidele: {
      id: number
      nom: string
      post_nom: string
      prenom: string
      contact: string
      profile_img: string | null
    }
  }
}

export default function AjouterMembreModal({ 
  isOpen, 
  onClose, 
  paroisseId,
  paroisseNom,
  fidelesParoisse,
  anneeConferenceId,
  onSuccess
}: AjouterMembreModalProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [pasteurs, setPasteurs] = useState<PasteurAffecte[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFidele, setSelectedFidele] = useState<any | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showFideleSelector, setShowFideleSelector] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadRoles()
      loadPasteurs()
    }
  }, [isOpen, paroisseId])

  async function loadRoles() {
    try {
      const rolesList = await getRolesCabinet()
      setRoles(rolesList)
    } catch (error) {
      console.error('Erreur chargement rôles:', error)
      toast.error('Erreur lors du chargement des rôles')
    }
  }

  async function loadPasteurs() {
    try {
      setLoading(true)
      const pasteursData = await getPasteursByParoisse(paroisseId)
      // Filtrer uniquement les affectations actives
      const actifs = pasteursData.filter((p: any) => p.active === true)
      setPasteurs(actifs)
    } catch (error) {
      console.error('Erreur chargement pasteurs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Vérifier si un fidèle est déjà dans les pasteurs suggérés
  const isFidelePasteur = (fideleId: number) => {
    return pasteurs.some(p => p.pasteur?.fidele?.id === fideleId)
  }

  const filteredFideles = fidelesParoisse.filter(fidele => {
    const fullName = `${fidele.nom || ''} ${fidele.post_nom || ''} ${fidele.prenom || ''}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) || fidele.contact?.toLowerCase().includes(searchLower)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    if (!selectedFidele) {
      toast.error('Veuillez sélectionner un fidèle')
      setSubmitting(false)
      return
    }

    try {
      const result = await addMembreCabinet(
        paroisseId,
        selectedFidele.id,
        selectedRole?.id || null
      )

      if (result.success) {
        toast.success('Membre ajouté avec succès')
        onSuccess?.()
        onClose()
        resetForm()
      } else {
        toast.error(result.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSelectedFidele(null)
    setSelectedRole(null)
    setSearchTerm('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">Ajouter un membre au cabinet</h3>
            <p className="text-sm text-gray-500 mt-0.5">{paroisseNom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pasteurs suggérés */}
              {pasteurs.length > 0 && !selectedFidele && (
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-3">
                    Pasteur(s) de la paroisse
                  </label>
                  <div className="space-y-2">
                    {pasteurs.map((affectation) => {
                      const pasteur = affectation.pasteur
                      const fidele = pasteur?.fidele
                      if (!fidele) return null
                      
                      return (
                        <button
                          key={affectation.id}
                          type="button"
                          onClick={() => setSelectedFidele(fidele)}
                          className="w-full flex items-center gap-3 p-3 border border-gray-200 hover:border-black hover:bg-gray-50 text-left transition-all"
                        >
                          {fidele.profile_img ? (
                            <img src={fidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 flex items-center justify-center text-purple-600 rounded-full">
                              <Briefcase size={18} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-purple-600 font-medium">
                                Pasteur
                              </span>
                              {pasteur.etude && (
                                <span className="text-xs text-gray-400">
                                  • {pasteur.etude}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400">+ Ajouter</span>
                        </button>
                      )
                    })}
                  </div>
                  
                  <div className="mt-4 mb-1 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-400">ou</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                </div>
              )}

              {/* Sélection du fidèle */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Fidèle <span className="text-red-400">*</span>
                </label>
                
                {selectedFidele ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-3">
                      {selectedFidele.profile_img ? (
                        <img src={selectedFidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
                      ) : isFidelePasteur(selectedFidele.id) ? (
                        <div className="w-10 h-10 bg-purple-100 flex items-center justify-center text-purple-600 rounded-full">
                          <Briefcase size={18} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-400 rounded-full">
                          <User size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isFidelePasteur(selectedFidele.id) ? 'Pasteur • ' : ''}
                          {selectedFidele.contact || 'Aucun contact'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFidele(null)}
                      className="text-xs text-gray-400 hover:text-black"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFideleSelector(true)}
                    className="w-full px-4 py-3 border border-gray-300 text-left text-sm text-gray-500 hover:border-black transition-colors"
                  >
                    + Sélectionner un fidèle
                  </button>
                )}
              </div>

              {/* Sélection du rôle */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Rôle (optionnel)
                </label>
                <select
                  value={selectedRole?.id || ''}
                  onChange={(e) => {
                    const role = roles.find(r => r.id === parseInt(e.target.value))
                    setSelectedRole(role || null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                >
                  <option value="">Sans rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label_role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Récapitulatif */}
              {selectedFidele && (
                <div className="p-4 border bg-gray-50">
                  <p className="text-sm font-medium mb-2 text-gray-700">
                    Récapitulatif
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fidèle :</span>
                      <span>
                        {selectedFidele.prenom} {selectedFidele.nom}
                        {isFidelePasteur(selectedFidele.id) && (
                          <span className="ml-1 text-purple-600 text-xs">(Pasteur)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rôle :</span>
                      <span className={selectedRole ? 'text-purple-700' : 'text-gray-400'}>
                        {selectedRole?.label_role || 'Non défini'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFidele || submitting}
            className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Ajout...</span>
              </>
            ) : (
              'Ajouter'
            )}
          </button>
        </div>
      </div>

      {/* Modal de sélection des fidèles */}
      {showFideleSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setShowFideleSelector(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-light">Sélectionner un fidèle</h3>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredFideles.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun fidèle trouvé</p>
              ) : (
                filteredFideles.map((fidele) => {
                  const estPasteur = isFidelePasteur(fidele.id)
                  return (
                    <button
                      key={fidele.id}
                      type="button"
                      onClick={() => {
                        setSelectedFidele(fidele)
                        setShowFideleSelector(false)
                        setSearchTerm('')
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      {fidele.profile_img ? (
                        <img src={fidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
                      ) : estPasteur ? (
                        <div className="w-10 h-10 bg-purple-100 flex items-center justify-center text-purple-600 rounded-full">
                          <Briefcase size={18} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400 rounded-full">
                          <User size={20} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {estPasteur ? 'Pasteur • ' : ''}
                          {fidele.contact || 'Aucun contact'}
                        </p>
                      </div>
                      {estPasteur && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5">
                          Pasteur
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}