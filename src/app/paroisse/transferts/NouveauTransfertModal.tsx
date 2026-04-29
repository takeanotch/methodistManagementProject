
// app/paroisse/transferts/NouveauTransfertModal.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Loader2, Search, User, Calendar, Info } from 'lucide-react'
import { creerTransfertEnAttente } from '@/actions/transfert-paroisse'
import { getFidelesByParoisse } from '@/actions/fidele'
import { getCurrentAnneeConference } from '@/actions/annee-conference'
import toast from 'react-hot-toast'

interface NouveauTransfertModalProps {
  isOpen: boolean
  onClose: () => void
  paroisseActuelleId: number
  conferenceId?: number
  onSuccess?: () => void
}

export default function NouveauTransfertModal({ 
  isOpen, 
  onClose, 
  paroisseActuelleId,
  conferenceId,
  onSuccess 
}: NouveauTransfertModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingFideles, setLoadingFideles] = useState(true)
  const [selectedFidele, setSelectedFidele] = useState<any>(null)
  const [typeTransfert, setTypeTransfert] = useState('paroisse')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [fideles, setFideles] = useState<any[]>([])
  const [anneeActuelle, setAnneeActuelle] = useState<any>(null)
  const [formData, setFormData] = useState({
    date_debut: new Date().toISOString().split('T')[0],
    date_fin: '',
    motif: ''
  })
  
  const searchRef = useRef<HTMLDivElement>(null)

  // Charger les fidèles de la paroisse pour l'année en cours
  // useEffect(() => {
  //   const loadData = async () => {
  //     setLoadingFideles(true)
  //     try {
  //       // Récupérer l'année de conférence en cours
  //       let anneeId: number | undefined = undefined
  //       if (conferenceId) {
  //         const currentAnnee = await getCurrentAnneeConference(conferenceId)
  //         setAnneeActuelle(currentAnnee)
  //         anneeId = currentAnnee?.annee_id
  //       }
        
  //       // Récupérer les fidèles de la paroisse pour cette année
  //       const fidelesData = await getFidelesByParoisse(paroisseActuelleId, anneeId)
  //       // Ne garder que les fidèles actifs
  //       setFideles(fidelesData.filter((f: any) => f.actif))
  //     } catch (error) {
  //       console.error('Erreur chargement fidèles:', error)
  //     } finally {
  //       setLoadingFideles(false)
  //     }
  //   }
    
  //   if (isOpen && paroisseActuelleId) {
  //     loadData()
  //   }
  // }, [isOpen, paroisseActuelleId, conferenceId])
useEffect(() => {
  const loadData = async () => {
    setLoadingFideles(true)
    setFideles([])
    
    try {
      // Récupérer l'année de conférence en cours
      let anneeConferenceId: number | undefined = undefined
      
      if (conferenceId) {
        const currentAnnee = await getCurrentAnneeConference(conferenceId)
        setAnneeActuelle(currentAnnee)
        // Utiliser l'ID de annee_conference, pas annee_id
        anneeConferenceId = currentAnnee?.id
      }
      
      console.log('Chargement fidèles avec anneeConferenceId:', anneeConferenceId)
      
      // Récupérer les fidèles de la paroisse
      const fidelesData = await getFidelesByParoisse(paroisseActuelleId, anneeConferenceId)
      console.log('Fidèles trouvés:', fidelesData.length)
      
      // Ne garder que les fidèles actifs
      const actifs = fidelesData.filter((f: any) => f.actif)
      console.log('Fidèles actifs:', actifs.length)
      
      setFideles(actifs)
    } catch (error) {
      console.error('Erreur chargement fidèles:', error)
    } finally {
      setLoadingFideles(false)
    }
  }
  
  if (isOpen && paroisseActuelleId) {
    loadData()
  }
}, [isOpen, paroisseActuelleId, conferenceId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && event.target instanceof Node && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrer les fidèles localement
  const filteredFideles = fideles.filter(fidele => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const fullName = `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`.toLowerCase()
    
    return fullName.includes(query) ||
           fidele.contact?.toLowerCase().includes(query) ||
           fidele.nom?.toLowerCase().includes(query) ||
           fidele.prenom?.toLowerCase().includes(query)
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!selectedFidele) {
      toast.error('Veuillez sélectionner un fidèle')
      return
    }

    setLoading(true)

    const submitFormData = new FormData()
    submitFormData.append('fidele_id', selectedFidele.id.toString())
    submitFormData.append('paroisse_source_id', paroisseActuelleId.toString())
    submitFormData.append('type_transfert', typeTransfert)
    submitFormData.append('date_debut', formData.date_debut)
    if (formData.date_fin) {
      submitFormData.append('date_fin', formData.date_fin)
    }
    if (formData.motif) {
      submitFormData.append('motif', formData.motif)
    }

    const result = await creerTransfertEnAttente(submitFormData)

    setLoading(false)

    if (result.success) {
      toast.success('Demande de transfert créée avec succès')
      onSuccess?.()
      onClose()
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la création')
    }
  }

  const selectFidele = (fidele: any) => {
    setSelectedFidele(fidele)
    setSearchQuery(`${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`)
    setIsSearchOpen(false)
  }

  const clearSelectedFidele = () => {
    setSelectedFidele(null)
    setSearchQuery('')
  }

  const getInitials = (nom: string, prenom: string) => {
    return `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">Nouveau transfert</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Transférer un fidèle de votre paroisse
              {anneeActuelle?.annee?.label && (
                <span className="ml-2">• Année {anneeActuelle.annee.label}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Recherche de fidèle */}
            <div ref={searchRef}>
              <label className="block text-sm font-medium mb-1">
                Fidèle <span className="text-red-400">*</span>
              </label>
              
              {loadingFideles ? (
                <div className="p-4 bg-gray-50 border border-gray-200 text-center">
                  <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
                  <p className="text-xs text-gray-400 mt-2">Chargement des fidèles...</p>
                </div>
              ) : !selectedFidele ? (
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un fidèle de votre paroisse..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setIsSearchOpen(true)
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    autoComplete="off"
                  />
                  
                  {isSearchOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                      {filteredFideles.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-400">
                          {searchQuery.trim() ? 'Aucun fidèle trouvé' : `${fideles.length} fidèle(s) disponible(s)`}
                        </div>
                      ) : (
                        filteredFideles.map(fidele => (
                          <button
                            key={fidele.id}
                            type="button"
                            onClick={() => selectFidele(fidele)}
                            className="w-full p-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                          >
                            <div className="flex-shrink-0">
                              {fidele.profile_img ? (
                                <div className="w-10 h-10 border border-gray-200 overflow-hidden">
                                  <Image
                                    src={fidele.profile_img}
                                    alt={`${fidele.nom} ${fidele.prenom}`}
                                    width={40}
                                    height={40}
                                    className="object-cover w-full h-full"
                                  />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center">
                                  <span className="text-sm font-medium text-gray-600">
                                    {getInitials(fidele.nom, fidele.prenom)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {fidele.nom} {fidele.post_nom} {fidele.prenom}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {fidele.contact || 'Pas de contact'}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {selectedFidele.profile_img ? (
                        <div className="w-10 h-10 border border-gray-200 overflow-hidden">
                          <Image
                            src={selectedFidele.profile_img}
                            alt={`${selectedFidele.nom} ${selectedFidele.prenom}`}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-600">
                            {getInitials(selectedFidele.nom, selectedFidele.prenom)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedFidele.nom} {selectedFidele.post_nom} {selectedFidele.prenom}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedFidele.contact || 'Pas de contact'}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={clearSelectedFidele}
                    className="p-1 text-gray-400 hover:text-black"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {!loadingFideles && fideles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Aucun fidèle actif dans votre paroisse pour l'année en cours.
                </p>
              )}
            </div>

            {/* Type de transfert */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Type de transfert <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type_transfert"
                    value="paroisse"
                    checked={typeTransfert === 'paroisse'}
                    onChange={(e) => setTypeTransfert(e.target.value)}
                    className="w-4 h-4 border-gray-300 text-black focus:ring-0"
                  />
                  <span className="text-sm text-gray-700">Transfert de paroisse</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="type_transfert"
                    value="mission"
                    checked={typeTransfert === 'mission'}
                    onChange={(e) => setTypeTransfert(e.target.value)}
                    className="w-4 h-4 border-gray-300 text-black focus:ring-0"
                  />
                  <span className="text-sm text-gray-700">Mission temporaire</span>
                </label>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date de début <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              {typeTransfert === 'mission' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date de fin
                  </label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={formData.date_fin}
                      onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                      min={formData.date_debut}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Motif */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Motif / Commentaire
              </label>
              <textarea
                value={formData.motif}
                onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black resize-none"
                placeholder="Précisions sur le transfert..."
              />
            </div>

           
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFidele || loadingFideles}
              className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Création...
                </>
              ) : (
                'Créer la demande'
              )}
            </button>
          </div>

          {/* Information */}
          <div className="p-3 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-3">
              <Info size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-500">
                <p className="font-medium text-gray-700 mb-1">Transfert en attente</p>
                <p>
                  La demande de transfert sera visible par toutes les paroisses. 
                  Une paroisse pourra accepter ce transfert en choisissant d'accueillir ce fidèle.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}