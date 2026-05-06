// app/chef-conference/annees/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, 
  Loader2, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  Building2,
  Layers,
  ChevronDown,
  Search,
  Lock,
  Unlock,
  CheckSquare,
  Square,
} from 'lucide-react'

// Types
interface District {
  id: number
  nom: string
  conference_id: number
}

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

interface AnneeConference {
  id: number
  annee_id: number
  conference_id: number
  is_current: boolean
  created_at: string
  annee?: {
    id: number
    label: string
  }
}

export default function ChefConferenceAnneesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<ChefConferenceInfo | null>(null)
  const [districts, setDistricts] = useState<District[]>([])
  const [anneeEnCours, setAnneeEnCours] = useState<AnneeConference | null>(null)
  
  // États districts : true = année ouverte (is_current = true), false = fermée, null = pas encore chargé
  const [districtsStatus, setDistrictsStatus] = useState<Map<number, boolean>>(new Map())
  const [selectedDistricts, setSelectedDistricts] = useState<Set<number>>(new Set())
  const [selectAllDistricts, setSelectAllDistricts] = useState(false)
  const [districtSearch, setDistrictSearch] = useState('')
  
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

      const [
        { getDistrictsByConference },
        { getCurrentAnneeConference }
      ] = await Promise.all([
        import('@/actions/chef-conference'),
        import('@/actions/annee-conference')
      ])

      const [districtsData, anneeEnCoursData] = await Promise.all([
        getDistrictsByConference(info.conference_id),
        getCurrentAnneeConference(info.conference_id)
      ])

      setDistricts(districtsData)
      setAnneeEnCours(anneeEnCoursData)

      // Charger le statut de chaque district pour le département du chef
      if (anneeEnCoursData) {
        await loadDistrictsStatus(districtsData, info.departement_id, anneeEnCoursData)
      }

    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDistrictsStatus = async (districtsData: District[], departementId: number, annee: AnneeConference) => {
    const { getCurrentAnneeDistrict } = await import('@/actions/annee-district')
    
    const statusMap = new Map<number, boolean>()
    
    for (const district of districtsData) {
      try {
        const status = await getCurrentAnneeDistrict(district.id, departementId)
        // status !== null signifie que l'année est is_current = true pour ce district/département
        statusMap.set(district.id, status !== null)
      } catch (error) {
        statusMap.set(district.id, false)
      }
    }
    
    setDistrictsStatus(statusMap)
  }

  const handleSelectAllDistricts = () => {
    if (selectAllDistricts) {
      setSelectedDistricts(new Set())
    } else {
      setSelectedDistricts(new Set(filteredDistricts.map(d => d.id)))
    }
    setSelectAllDistricts(!selectAllDistricts)
  }

  const toggleDistrict = (districtId: number) => {
    const newSelected = new Set(selectedDistricts)
    if (newSelected.has(districtId)) {
      newSelected.delete(districtId)
    } else {
      newSelected.add(districtId)
    }
    setSelectedDistricts(newSelected)
    setSelectAllDistricts(newSelected.size === filteredDistricts.length)
  }

  // OUVRIR : mettre is_current = true
  const handleOuvrirAnnee = async () => {
    if (!anneeEnCours) {
      setMessage({ type: 'error', text: 'Aucune année en cours définie pour la conférence' })
      return
    }

    if (selectedDistricts.size === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un district' })
      return
    }

    setActionLoading(true)
    setMessage(null)

    try {
      const { definirAnneeEnCoursPourTous } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('annee_id', anneeEnCours.annee_id.toString())
      formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
      formData.append('departement_ids', JSON.stringify([chefInfo!.departement_id]))

      const result = await definirAnneeEnCoursPourTous(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        const actives = result.actives || 0
        const creees = result.creees || 0
        setMessage({ type: 'success', text: `${actives} district(s) ouvert(s)${creees > 0 ? `, ${creees} créé(s)` : ''}` })
        // Recharger les statuts
        if (anneeEnCours) {
          await loadDistrictsStatus(districts, chefInfo!.departement_id, anneeEnCours)
        }
        setSelectedDistricts(new Set())
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ouverture' })
    } finally {
      setActionLoading(false)
    }
  }

  // FERMER : mettre is_current = false
  const handleFermerAnnee = async () => {
    if (selectedDistricts.size === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un district' })
      return
    }

    if (!confirm(`⚠️ Fermer l'année en cours pour ${selectedDistricts.size} district(s) ?`)) return

    setActionLoading(true)
    setMessage(null)

    try {
      const { fermerAnneesPourTous } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
      formData.append('departement_ids', JSON.stringify([chefInfo!.departement_id]))

      const result = await fermerAnneesPourTous(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${result.fermees || 0} district(s) fermé(s)` })
        // Recharger les statuts
        if (anneeEnCours) {
          await loadDistrictsStatus(districts, chefInfo!.departement_id, anneeEnCours)
        }
        setSelectedDistricts(new Set())
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la fermeture' })
    } finally {
      setActionLoading(false)
    }
  }

  // OUVRIR TOUS
  const handleOuvrirTous = async () => {
    if (!anneeEnCours) {
      setMessage({ type: 'error', text: 'Aucune année en cours définie pour la conférence' })
      return
    }

    if (!confirm(`Ouvrir l'année ${anneeEnCours.annee?.label} pour TOUS les districts ?`)) return

    setActionLoading(true)
    setMessage(null)

    try {
      const { definirAnneeEnCoursPourTous } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('annee_id', anneeEnCours.annee_id.toString())
      formData.append('district_ids', JSON.stringify(districts.map(d => d.id)))
      formData.append('departement_ids', JSON.stringify([chefInfo!.departement_id]))

      const result = await definirAnneeEnCoursPourTous(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        const actives = result.actives || 0
        const creees = result.creees || 0
        setMessage({ type: 'success', text: `Tous les districts sont ouverts (${actives} actif(s)${creees > 0 ? `, ${creees} créé(s)` : ''})` })
        if (anneeEnCours) {
          await loadDistrictsStatus(districts, chefInfo!.departement_id, anneeEnCours)
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ouverture' })
    } finally {
      setActionLoading(false)
    }
  }

  // FERMER TOUS
  const handleFermerTous = async () => {
    if (!confirm(`⚠️ Fermer l'année en cours pour TOUS les districts ?`)) return

    setActionLoading(true)
    setMessage(null)

    try {
      const { fermerAnneesPourTous } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('district_ids', JSON.stringify(districts.map(d => d.id)))
      formData.append('departement_ids', JSON.stringify([chefInfo!.departement_id]))

      const result = await fermerAnneesPourTous(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Tous les districts sont fermés (${result.fermees || 0} fermé(s))` })
        if (anneeEnCours) {
          await loadDistrictsStatus(districts, chefInfo!.departement_id, anneeEnCours)
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la fermeture' })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredDistricts = districts.filter(d => 
    d.nom.toLowerCase().includes(districtSearch.toLowerCase())
  )

  const districtsOuverts = Array.from(districtsStatus.values()).filter(status => status === true).length
  const districtsFermes = districts.length - districtsOuverts

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!chefInfo) return null

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white border border-gray-200">
                  <Calendar size={20} className="text-gray-700" />
                </div>
                <div>
                  <h1 className="text-2xl font-light tracking-tight text-gray-900">
                    Gestion des années
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Conférence {chefInfo.conference_nom} • Département {chefInfo.departement_nom}
                  </p>
                </div>
              </div>
            </div>
            
            <Link
              href="/chef-conference"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Retour au tableau de bord
            </Link>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-gray-50' : 'border-l-red-500 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
              <span className="text-sm text-gray-700">{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Bannière Année en cours */}
        {anneeEnCours ? (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-5 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={24} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-600 mb-1">Année de conférence en cours</p>
                  <p className="text-2xl font-light text-emerald-900">{anneeEnCours.annee?.label}</p>
                  <p className="text-xs text-emerald-600 mt-1">
                    Département : {chefInfo.departement_nom}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOuvrirTous}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <Unlock size={16} />
                  Ouvrir pour tous les districts
                </button>
                <button
                  onClick={handleFermerTous}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Lock size={16} />
                  Fermer pour tous les districts
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> {districtsOuverts} district(s) ouvert(s)
              </span>
              <span className="text-gray-400 flex items-center gap-1">
                <Lock size={12} /> {districtsFermes} district(s) fermé(s)
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-5 mb-6">
            <div className="flex items-center gap-4">
              <AlertCircle size={24} className="text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Aucune année en cours</p>
                <p className="text-sm text-amber-600">
                  Aucune année de conférence n'est définie comme année en cours. Contactez l'administrateur.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sélection des districts */}
        {anneeEnCours && (
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                Districts de {chefInfo.conference_nom}
              </h3>
              <button
                onClick={handleSelectAllDistricts}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
              >
                {selectAllDistricts ? (
                  <><Square size={16} /> Tout désélectionner</>
                ) : (
                  <><CheckSquare size={16} /> Tout sélectionner</>
                )}
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un district..."
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-1">
                {filteredDistricts.length === 0 ? (
                  <p className="text-gray-400 col-span-full text-center py-8">Aucun district trouvé</p>
                ) : (
                  filteredDistricts.map(district => {
                    const isOpen = districtsStatus.get(district.id) === true
                    
                    return (
                      <button
                        key={district.id}
                        onClick={() => toggleDistrict(district.id)}
                        className={`p-4 border text-left transition-all ${
                          selectedDistricts.has(district.id)
                            ? 'border-blue-500 bg-blue-50'
                            : isOpen
                              ? 'border-emerald-200 bg-emerald-50/30'
                              : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {selectedDistricts.has(district.id) ? (
                            <CheckSquare size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{district.nom}</p>
                            <div className="mt-1.5">
                              {isOpen ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                                  <TrendingUp size={10} />
                                  Année ouverte (en cours)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-50 px-2 py-0.5 border border-gray-200">
                                  <Lock size={10} />
                                  Année fermée
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
                <span>{selectedDistricts.size} district(s) sélectionné(s) sur {districts.length}</span>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleOuvrirAnnee}
                    disabled={selectedDistricts.size === 0 || actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                    Ouvrir pour la sélection
                  </button>
                  <button
                    onClick={handleFermerAnnee}
                    disabled={selectedDistricts.size === 0 || actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                    Fermer pour la sélection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note */}
        <div className="bg-gray-50 border border-gray-200 p-4 mt-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Comment ça marche ?</p>
              <p className="text-sm text-gray-600">
                <strong>Ouvrir</strong> : définit l'année de conférence en cours (<strong>{anneeEnCours?.annee?.label || 'N/A'}</strong>) comme année active (is_current = true) pour les districts sélectionnés, dans votre département <strong>{chefInfo.departement_nom}</strong>.
                <br />
                <strong>Fermer</strong> : désactive l'année en cours (is_current = false) pour les districts sélectionnés.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}