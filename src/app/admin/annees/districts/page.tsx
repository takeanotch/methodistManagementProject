
'use client'

import { useState, useEffect } from 'react'
import {
  getDistricts,
  getDepartements,
  getAnnees,
  getAnneesDistrict,
  getCurrentAnneeDistrict,
  ajouterAnneeDistrict,
  setCurrentAnneeDistrict,
  supprimerAnneeDistrict
} from '@/actions/annee-district'
import { 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  History, 
  MoreHorizontal, 
  Plus, 
  Search, 
  Trash2,
  Building2,
  Layers,
  Clock,
  TrendingUp,
  X,
  Loader2,
  Globe
} from 'lucide-react'
import { getCurrentAnneeConferenceGlobal } from '@/actions/annee-conference'
import { ouvrirAnneePourTous } from '@/actions/annee-district'

// On réutilise getDistricts depuis annee-district
// Pas besoin de l'importer depuis annee-conference

interface Annee {
  id: number
  label: string
}

interface District {
  id: number
  nom: string
}

interface Departement {
  id: number
  nom: string
}

interface AnneeDistrict {
  id: number
  district_id: number
  departement_id: number
  annee_id: number
  is_current: boolean
  created_at: string
  annee?: Annee
  district?: District
  departement?: Departement
  status?: 'current' | 'past' | 'future'
}

export default function OuvertureAnneesPage() {
  const [districts, setDistricts] = useState<District[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [annees, setAnnees] = useState<Annee[]>([])
  const [historique, setHistorique] = useState<AnneeDistrict[]>([])
  const [anneeEnCours, setAnneeEnCours] = useState<AnneeDistrict | null>(null)
  
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [selectedDepartement, setSelectedDepartement] = useState<Departement | null>(null)
  
  const [districtSearch, setDistrictSearch] = useState('')
  const [departementSearch, setDepartementSearch] = useState('')
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showDepartementDropdown, setShowDepartementDropdown] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAnnee, setSelectedAnnee] = useState<Annee | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [openingAll, setOpeningAll] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDistrict && selectedDepartement) {
      loadHistorique(selectedDistrict.id, selectedDepartement.id)
    } else {
      setHistorique([])
      setAnneeEnCours(null)
    }
  }, [selectedDistrict, selectedDepartement])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [districtsData, departementsData, anneesData] = await Promise.all([
        getDistricts(),
        getDepartements(),
        getAnnees()
      ])
      setDistricts(districtsData)
      setDepartements(departementsData)
      setAnnees(anneesData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const loadHistorique = async (districtId: number, departementId: number) => {
    try {
      const [historiqueData, anneeEnCoursData] = await Promise.all([
        getAnneesDistrict(districtId, departementId),
        getCurrentAnneeDistrict(districtId, departementId)
      ])
      setHistorique(historiqueData)
      setAnneeEnCours(anneeEnCoursData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement historique' })
    }
  }

  const handleAjouterAnnee = async (formData: FormData) => {
    setActionLoading(true)
    setMessage(null)
    
    if (!selectedDistrict || !selectedDepartement || !selectedAnnee) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner tous les champs' })
      setActionLoading(false)
      return
    }
    
    formData.append('district_id', selectedDistrict.id.toString())
    formData.append('departement_id', selectedDepartement.id.toString())
    formData.append('annee_id', selectedAnnee.id.toString())
    
    const result = await ajouterAnneeDistrict(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Année ajoutée avec succès' })
      setShowAddModal(false)
      setSelectedAnnee(null)
      loadHistorique(selectedDistrict.id, selectedDepartement.id)
    }
    
    setActionLoading(false)
  }

  const handleSetCurrent = async (item: AnneeDistrict) => {
    setActionLoading(true)
    setMenuOpen(null)
    
    const formData = new FormData()
    formData.append('district_id', item.district_id.toString())
    formData.append('departement_id', item.departement_id.toString())
    formData.append('annee_id', item.annee_id.toString())
    
    const result = await setCurrentAnneeDistrict(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année en cours modifiée' })
      loadHistorique(item.district_id, item.departement_id)
    }
    
    setActionLoading(false)
  }

  const handleSupprimer = async (item: AnneeDistrict) => {
    if (item.is_current) {
      setMessage({ type: 'error', text: 'Impossible de supprimer l\'année en cours' })
      setMenuOpen(null)
      return
    }
    
    setActionLoading(true)
    setMenuOpen(null)
    
    const formData = new FormData()
    formData.append('id', item.id.toString())
    
    const result = await supprimerAnneeDistrict(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année supprimée' })
      loadHistorique(item.district_id, item.departement_id)
    }
    
    setActionLoading(false)
  }

// Dans le composant, remplacer handleOpenForAll par :

const handleOpenForAll = async () => {
  setOpeningAll(true)
  setMessage(null)
  
  try {
    // Récupérer l'année de conférence en cours
    const currentConferenceAnnee = await getCurrentAnneeConferenceGlobal()
    
    if (!currentConferenceAnnee) {
      setMessage({ type: 'error', text: 'Aucune année de conférence en cours trouvée' })
      setOpeningAll(false)
      return
    }
    
    const anneeId = currentConferenceAnnee.annee_id
    const anneeLabel = currentConferenceAnnee.annee?.label
    
    // Appeler l'action server unique
    const formData = new FormData()
    formData.append('annee_id', anneeId.toString())
    
    const result = await ouvrirAnneePourTous(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ 
        type: 'success', 
        text: `Année ${anneeLabel || anneeId} : ${result.message}`
      })
    }
    
    // Recharger l'historique si un district/département est sélectionné
    if (selectedDistrict && selectedDepartement) {
      loadHistorique(selectedDistrict.id, selectedDepartement.id)
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'ouverture globale:', error)
    setMessage({ type: 'error', text: 'Erreur lors de l\'ouverture des années' })
  } finally {
    setOpeningAll(false)
  }
}

  const filteredDistricts = districts.filter(d => 
    d.nom.toLowerCase().includes(districtSearch.toLowerCase())
  )
  
  const filteredDepartements = departements.filter(d => 
    d.nom.toLowerCase().includes(departementSearch.toLowerCase())
  )

  const anneesIdsDansDistrict = historique.map(h => h.annee_id)
  const anneesDisponibles = annees.filter(a => !anneesIdsDansDistrict.includes(a.id))

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'current':
        return {
          label: 'En cours',
          icon: TrendingUp,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }
      case 'future':
        return {
          label: 'À venir',
          icon: Clock,
          className: 'bg-sky-50 text-sky-700 border-sky-200'
        }
      default:
        return {
          label: 'Passée',
          icon: History,
          className: 'bg-gray-50 text-gray-500 border-gray-200'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white border border-gray-200">
                  <Calendar size={20} className="text-gray-700" />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-gray-900">
                  Gestion des années
                </h1>
              </div>
              <p className="text-gray-500 ml-14">
                Gérez les années d'exercice pour chaque district et département
              </p>
            </div>
            
            {/* Bouton Ouvrir pour tous */}
            <button
              onClick={handleOpenForAll}
              disabled={openingAll}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {openingAll ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Globe size={16} />
              )}
              Ouvrir l'année pour tous
            </button>
          </div>
        </div>

        {/* Message toast */}
        {message && (
          <div className={`mb-8 p-4 border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <X size={18} />
              )}
              <span className="text-sm">{message.text}</span>
            </div>
          </div>
        )}

        {/* Sélecteurs */}
        <div className="bg-white border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* District Selector */}
            <div className="relative">
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
                <Building2 size={14} />
                District
              </label>
              <button
                onClick={() => {
                  setShowDistrictDropdown(!showDistrictDropdown)
                  setShowDepartementDropdown(false)
                }}
                className="w-full px-4 py-3 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white"
              >
                <span className={selectedDistrict ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedDistrict ? selectedDistrict.nom : 'Sélectionner un district'}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDistrictDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDistrictDropdown(false)} 
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 max-h-64 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={districtSearch}
                          onChange={(e) => setDistrictSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-gray-400"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredDistricts.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Aucun résultat</div>
                      ) : (
                        filteredDistricts.map(district => (
                          <button
                            key={district.id}
                            onClick={() => {
                              setSelectedDistrict(district)
                              setShowDistrictDropdown(false)
                              setDistrictSearch('')
                              setSelectedDepartement(null)
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <span>{district.nom}</span>
                            {selectedDistrict?.id === district.id && (
                              <CheckCircle2 size={16} className="text-emerald-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Département Selector */}
            <div className="relative">
              <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
                <Layers size={14} />
                Département
              </label>
              <button
                onClick={() => {
                  setShowDepartementDropdown(!showDepartementDropdown)
                  setShowDistrictDropdown(false)
                }}
                className="w-full px-4 py-3 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedDistrict}
              >
                <span className={selectedDepartement ? 'text-gray-900' : 'text-gray-400'}>
                  {selectedDepartement 
                    ? selectedDepartement.nom 
                    : selectedDistrict 
                      ? 'Sélectionner un département' 
                      : 'Sélectionnez d\'abord un district'}
                </span>
                <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDepartementDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDepartementDropdown && selectedDistrict && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowDepartementDropdown(false)} 
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 max-h-64 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={departementSearch}
                          onChange={(e) => setDepartementSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-gray-400"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredDepartements.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-400">Aucun résultat</div>
                      ) : (
                        filteredDepartements.map(departement => (
                          <button
                            key={departement.id}
                            onClick={() => {
                              setSelectedDepartement(departement)
                              setShowDepartementDropdown(false)
                              setDepartementSearch('')
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                          >
                            <span>{departement.nom}</span>
                            {selectedDepartement?.id === departement.id && (
                              <CheckCircle2 size={16} className="text-emerald-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {selectedDistrict && selectedDepartement && (
          <>
            {/* Année en cours - Carte redesigned */}
            {anneeEnCours && (
              <div className="mb-10">
                <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Année en cours</p>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Calendar size={24} className="text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-3xl font-semibold text-emerald-800">
                            {anneeEnCours.annee?.label}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-xs font-medium">
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-emerald-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={14} />
                            {anneeEnCours.district?.nom}
                          </div>
                          <div className="w-px h-3 bg-emerald-300" />
                          <div className="flex items-center gap-1.5">
                            <Layers size={14} />
                            {anneeEnCours.departement?.nom}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-emerald-500">
                      Ouverte le {new Date(anneeEnCours.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton Ajouter */}
            <div className="flex justify-end mb-8">
              <button
                onClick={() => setShowAddModal(true)}
                disabled={anneesDisponibles.length === 0}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Ajouter une année
                {anneesDisponibles.length === 0 && (
                  <span className="absolute -bottom-6 right-0 text-xs text-amber-600 whitespace-nowrap">
                    Toutes les années sont déjà ajoutées
                  </span>
                )}
              </button>
            </div>

            {/* Liste des années - Style carte */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-gray-400" />
                <h3 className="text-sm uppercase tracking-wider text-gray-400">Historique</h3>
              </div>
              
              {historique.length > 0 ? (
                <div className="grid gap-3">
                  {historique.map((item) => {
                    const statusInfo = getStatusInfo(item.status || 'past')
                    const StatusIcon = statusInfo.icon
                    
                    return (
                      <div
                        key={item.id}
                        className={`bg-white border p-5 transition-all ${
                          item.status === 'current' 
                            ? 'border-emerald-200 bg-emerald-50/30' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="w-16">
                              <span className="text-2xl font-light text-gray-900">
                                {item.annee?.label}
                              </span>
                            </div>
                            
                            <div className={`flex items-center gap-2 px-3 py-1 border text-xs ${statusInfo.className}`}>
                              <StatusIcon size={12} />
                              {statusInfo.label}
                            </div>
                            
                            <div className="text-xs text-gray-400">
                              Ouverte le {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                          
                          <div className="relative">
                            <button
                              onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            
                            {menuOpen === item.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setMenuOpen(null)} 
                                />
                                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[180px]">
                                  {item.status !== 'current' && (
                                    <>
                                      <button
                                        onClick={() => handleSetCurrent(item)}
                                        disabled={actionLoading}
                                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
                                      >
                                        <TrendingUp size={14} className="text-gray-400" />
                                        Définir comme courante
                                      </button>
                                      <div className="border-t border-gray-100"></div>
                                      <button
                                        onClick={() => handleSupprimer(item)}
                                        disabled={actionLoading}
                                        className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                                      >
                                        <Trash2 size={14} />
                                        Supprimer
                                      </button>
                                    </>
                                  )}
                                  {item.status === 'current' && (
                                    <div className="px-4 py-2.5 text-sm text-gray-400">
                                      Année active
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-16 text-center">
                  <Calendar size={40} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-400 text-sm">
                    Aucune année ouverte pour ce district/département
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 text-sm text-gray-600 hover:text-black underline underline-offset-4"
                  >
                    Ajouter une première année
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Modal d'ajout moderne */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-light text-gray-900">
                    Nouvelle année
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                      Année à ajouter
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {anneesDisponibles.map((annee) => (
                        <button
                          key={annee.id}
                          type="button"
                          onClick={() => setSelectedAnnee(annee)}
                          className={`p-4 border text-center transition-all ${
                            selectedAnnee?.id === annee.id
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl font-light">{annee.label}</span>
                        </button>
                      ))}
                    </div>
                    {anneesDisponibles.length === 0 && (
                      <p className="text-sm text-amber-600 mt-2">
                        Toutes les années disponibles ont déjà été ajoutées
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Récapitulatif</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="text-gray-600">District :</span>
                        <span className="font-medium">{selectedDistrict?.nom}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers size={14} className="text-gray-400" />
                        <span className="text-gray-600">Département :</span>
                        <span className="font-medium">{selectedDepartement?.nom}</span>
                      </div>
                      {selectedAnnee && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-gray-600">Année :</span>
                          <span className="font-medium">{selectedAnnee.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    const formData = new FormData()
                    handleAjouterAnnee(formData)
                  }}
                  disabled={!selectedAnnee || actionLoading}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Ajout...
                    </>
                  ) : (
                    'Confirmer'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}