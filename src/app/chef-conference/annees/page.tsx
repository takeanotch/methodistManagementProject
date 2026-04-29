

// app/chef-conference/annees/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, 
  Plus, 
  Loader2, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2,Trash2,
  X,
  TrendingUp,
  Clock,
  History,
  Layers,
  Building2,
  ChevronDown,
  Search,
  Globe,
  Lock,
  Unlock,
  Check,
  MoreHorizontal,
  CheckSquare,
  Square,
  Zap
} from 'lucide-react'

// Types
interface Annee {
  id: number
  label: string
}

interface District {
  id: number
  nom: string
  conference_id: number
}

interface Departement {
  id: number
  nom: string
}

interface AnneeConferenceItem {
  id: number
  annee_id: number
  conference_id: number
  is_current: boolean
  created_at: string
  annee?: Annee
  status?: 'current' | 'past' | 'future'
}

interface AnneeDistrictItem {
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

type TabType = 'conference' | 'districts' | 'masse'

export default function ChefConferenceAnneesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('conference')
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<ChefConferenceInfo | null>(null)

  useEffect(() => {
    const loadChefInfo = async () => {
      try {
        const { getChefConferenceInfo } = await import('@/actions/chef-conference')
        const info = await getChefConferenceInfo()
        
        if (!info) {
          router.push('/profile')
          return
        }
        
        setChefInfo(info)
      } catch (error) {
        console.error('Erreur chargement chef:', error)
        router.push('/profile')
      } finally {
        setLoading(false)
      }
    }
    
    loadChefInfo()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!chefInfo) {
    return null
  }

  const tabs = [
    { 
      id: 'conference' as TabType, 
      label: 'Conférence', 
      icon: Globe, 
      description: `Gérer les années de la conférence ${chefInfo.conference_nom}` 
    },
    { 
      id: 'districts' as TabType, 
      label: 'Districts', 
      icon: Building2, 
      description: 'Gérer les années par district et département' 
    },
    { 
      id: 'masse' as TabType, 
      label: 'Affectation en masse', 
      icon: Zap, 
      description: 'Affecter une année à plusieurs districts et départements simultanément' 
    },
  ]

  return (
    <div className="min-h-screen ">
      <div className="max-w-7xl mx-auto ">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white border border-gray-200 -lg">
                  <Calendar size={20} className="text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-light tracking-tight text-gray-900">
                    Gestion des années
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Conférence {chefInfo.conference_nom} • Département {chefInfo.departement_nom}
                  </p>
                </div>
              </div>
              <p className="text-gray-500 ml-14">
                Gérez l'ouverture et la fermeture des années pour votre conférence et ses districts
              </p>
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

        {/* Navigation par onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-all
                      ${isActive 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-6">
          {activeTab === 'conference' && (
            <ConferenceTabContent 
              conferenceId={chefInfo.conference_id} 
              conferenceNom={chefInfo.conference_nom}
            />
          )}
          {activeTab === 'districts' && (
            <DistrictsTabContent 
              conferenceId={chefInfo.conference_id}
            />
          )}
          {activeTab === 'masse' && (
            <AffectationMasseTabContent 
              conferenceId={chefInfo.conference_id}
            />
          )}
        </div>

      </div>
    </div>
  )
}








function ConferenceTabContent({ 
  conferenceId, 
  conferenceNom 
}: { 
  conferenceId: number
  conferenceNom: string 
}) {
  const [loading, setLoading] = useState(true)
  const [annees, setAnnees] = useState<AnneeConferenceItem[]>([])
  const [anneesDisponibles, setAnneesDisponibles] = useState<Annee[]>([])
  const [currentAnnee, setCurrentAnnee] = useState<AnneeConferenceItem | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [addingAnnee, setAddingAnnee] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [conferenceId])

  const loadData = async () => {
    try {
      setLoading(true)
      const { getAnneesByConference, getCurrentAnneeConference, getAnnees } = await import('@/actions/annee-conference')
      
      const [anneesData, currentData, allAnneesData] = await Promise.all([
        getAnneesByConference(conferenceId),
        getCurrentAnneeConference(conferenceId),
        getAnnees()
      ])

      setAnnees(anneesData)
      setCurrentAnnee(currentData)
      setAnneesDisponibles(allAnneesData)
    } catch (error) {
      console.error('Erreur chargement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const getProchaineAnnee = () => {
    const anneesIdsDansConference = annees.map(ac => ac.annee_id)
    const anneesNonOuvertes = anneesDisponibles.filter(a => !anneesIdsDansConference.includes(a.id))
    const anneesTriees = [...anneesNonOuvertes].sort((a, b) => b.id - a.id)
    return anneesTriees[0] || null
  }

  const handleAjouterAnneeSuivante = async () => {
    const prochaineAnnee = getProchaineAnnee()
    if (!prochaineAnnee) {
      setMessage({ type: 'error', text: 'Aucune année disponible à ajouter' })
      return
    }

    setAddingAnnee(true)
    setMessage(null)

    try {
      const { ajouterAnneeConference } = await import('@/actions/annee-conference')
      
      const formData = new FormData()
      formData.append('conference_id', conferenceId.toString())
      formData.append('annee_id', prochaineAnnee.id.toString())

      const result = await ajouterAnneeConference(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Année ${prochaineAnnee.label} ajoutée avec succès` })
        await loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de l\'année' })
    } finally {
      setAddingAnnee(false)
    }
  }

  const handleSetCurrent = async (anneeId: number, anneeLabel: string) => {
    if (!confirm(`Voulez-vous définir ${anneeLabel} comme année en cours pour cette conférence ?`)) return

    setActionLoading(true)
    setMessage(null)

    try {
      const { setCurrentAnnee } = await import('@/actions/annee-conference')
      
      const formData = new FormData()
      formData.append('annee_id', anneeId.toString())
      formData.append('conference_id', conferenceId.toString())

      const result = await setCurrentAnnee(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: result.message || `${anneeLabel} est maintenant l'année en cours` })
        await loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement d\'année en cours' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFermerAnnee = async (id: number, anneeLabel: string, isCurrent: boolean) => {
    if (isCurrent) {
      setMessage({ type: 'error', text: 'Impossible de fermer l\'année en cours' })
      return
    }

    if (!confirm(`Fermer l'année ${anneeLabel} de la conférence ?`)) return

    setDeletingId(id)
    setMessage(null)

    try {
      const { supprimerAnneeConference } = await import('@/actions/annee-conference')
      
      const formData = new FormData()
      formData.append('id', id.toString())
      formData.append('conference_id', conferenceId.toString())

      const result = await supprimerAnneeConference(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: result.message || `Année ${anneeLabel} fermée` })
        await loadData()
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la fermeture de l\'année' })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
            <Check size={12} />En cours
          </span>
        )
      case 'future':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs border border-blue-200">
            <Clock size={12} />À venir
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 text-xs border border-gray-200">
            <History size={12} />Passée
          </span>
        )
    }
  }

  const prochaineAnnee = getProchaineAnnee()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-light text-gray-900">{conferenceNom}</h2>
          {prochaineAnnee && (
            <button
              onClick={handleAjouterAnneeSuivante}
              disabled={addingAnnee || actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingAnnee ? (
                <><Loader2 size={16} className="animate-spin" />Ajout...</>
              ) : (
                <><Plus size={16} />Ajouter {prochaineAnnee.label}</>
              )}
            </button>
          )}
        </div>

        {currentAnnee && (
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Année en cours</p>
            <div className="flex items-center gap-3">
              <span className="text-xl font-light text-gray-900">{currentAnnee.annee?.label}</span>
              {getStatusBadge('current')}
            </div>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ajoutée le</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {annees.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">{item.annee?.label}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status || 'past')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'current' && (
                      <button
                        onClick={() => handleSetCurrent(item.annee_id, item.annee?.label || '')}
                        disabled={actionLoading}
                        className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        Définir en cours
                      </button>
                    )}
                    {item.status !== 'current' && (
                      <button
                        onClick={() => handleFermerAnnee(item.id, item.annee?.label || '', item.is_current)}
                        disabled={deletingId === item.id}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Fermer l'année"
                      >
                        {deletingId === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {annees.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                    <Calendar size={48} className="w-full h-full" />
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Aucune année pour cette conférence</p>
                  {prochaineAnnee && (
                    <button
                      onClick={handleAjouterAnneeSuivante}
                      disabled={addingAnnee}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingAnnee ? (
                        <><Loader2 size={16} className="animate-spin" />Création...</>
                      ) : (
                        <><Plus size={16} />Ajouter {prochaineAnnee.label}</>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            {annees.length} année{annees.length > 1 ? 's' : ''} associée{annees.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}



// ==================== ONGLET 2 : DISTRICTS ====================
function DistrictsTabContent({ conferenceId }: { conferenceId: number }) {
  const [districts, setDistricts] = useState<District[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [annees, setAnnees] = useState<Annee[]>([])
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [selectedDepartement, setSelectedDepartement] = useState<Departement | null>(null)
  const [historique, setHistorique] = useState<AnneeDistrictItem[]>([])
  const [anneeEnCours, setAnneeEnCours] = useState<AnneeDistrictItem | null>(null)
  
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

  useEffect(() => {
    loadInitialData()
  }, [conferenceId])

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
      const { getDistrictsByConference } = await import('@/actions/chef-conference')
      const { getDepartements, getAnnees } = await import('@/actions/annee-district')
      
      const [districtsData, departementsData, anneesData] = await Promise.all([
        getDistrictsByConference(conferenceId),
        getDepartements(),
        getAnnees()
      ])
      
      setDistricts(districtsData)
      setDepartements(departementsData)
      setAnnees(anneesData)
    } catch (error) {
      console.error('Erreur chargement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const loadHistorique = async (districtId: number, departementId: number) => {
    try {
      const { getAnneesDistrict, getCurrentAnneeDistrict } = await import('@/actions/annee-district')
      
      const [historiqueData, anneeEnCoursData] = await Promise.all([
        getAnneesDistrict(districtId, departementId),
        getCurrentAnneeDistrict(districtId, departementId)
      ])
      
      setHistorique(historiqueData)
      setAnneeEnCours(anneeEnCoursData)
    } catch (error) {
      console.error('Erreur historique:', error)
    }
  }

  const handleOuvrirAnnee = async () => {
    if (!selectedDistrict || !selectedDepartement || !selectedAnnee) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner tous les champs' })
      return
    }

    setActionLoading(true)
    setMessage(null)

    try {
      const { ajouterAnneeDistrict } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('district_id', selectedDistrict.id.toString())
      formData.append('departement_id', selectedDepartement.id.toString())
      formData.append('annee_id', selectedAnnee.id.toString())

      const result = await ajouterAnneeDistrict(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Année ${selectedAnnee.label} ouverte avec succès` })
        setShowAddModal(false)
        setSelectedAnnee(null)
        await loadHistorique(selectedDistrict.id, selectedDepartement.id)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'ouverture de l\'année' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetCurrent = async (item: AnneeDistrictItem) => {
    setActionLoading(true)
    setMenuOpen(null)
    setMessage(null)

    try {
      const { setCurrentAnneeDistrict } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('district_id', item.district_id.toString())
      formData.append('departement_id', item.departement_id.toString())
      formData.append('annee_id', item.annee_id.toString())

      const result = await setCurrentAnneeDistrict(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${item.annee?.label} est maintenant l'année en cours` })
        await loadHistorique(item.district_id, item.departement_id)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du changement d\'année en cours' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFermerAnnee = async (item: AnneeDistrictItem) => {
    if (item.is_current) {
      setMessage({ type: 'error', text: 'Impossible de fermer l\'année en cours' })
      setMenuOpen(null)
      return
    }

    setActionLoading(true)
    setMenuOpen(null)
    setMessage(null)

    try {
      const { supprimerAnneeDistrict } = await import('@/actions/annee-district')
      
      const formData = new FormData()
      formData.append('id', item.id.toString())

      const result = await supprimerAnneeDistrict(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `Année ${item.annee?.label} fermée` })
        await loadHistorique(item.district_id, item.departement_id)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la fermeture de l\'année' })
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'current':
        return { label: 'En cours', icon: TrendingUp, className: 'bg-green-50 text-green-700 border-green-200' }
      case 'future':
        return { label: 'À venir', icon: Clock, className: 'bg-blue-50 text-blue-700 border-blue-200' }
      default:
        return { label: 'Passée', icon: History, className: 'bg-gray-50 text-gray-500 border-gray-200' }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message toast */}
      {message && (
        <div className={`p-4 border -lg ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Sélecteurs District/Département */}
      <div className="bg-white border border-gray-200 -xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* District */}
          <div className="relative">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
              <Building2 size={14} />District
            </label>
            <button
              onClick={() => { 
                setShowDistrictDropdown(!showDistrictDropdown)
                setShowDepartementDropdown(false)
              }}
              className="w-full px-4 py-3 border border-gray-200 -lg text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white"
            >
              <span className={selectedDistrict ? 'text-gray-900' : 'text-gray-400'}>
                {selectedDistrict ? selectedDistrict.nom : 'Sélectionner un district'}
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDistrictDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDistrictDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 -lg shadow-lg z-20 max-h-64 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 -lg focus:outline-none focus:border-blue-400"
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
                            <CheckCircle2 size={16} className="text-green-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Département */}
          <div className="relative">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
              <Layers size={14} />Département
            </label>
            <button
              onClick={() => { 
                setShowDepartementDropdown(!showDepartementDropdown)
                setShowDistrictDropdown(false)
              }}
              className="w-full px-4 py-3 border border-gray-200 -lg text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedDistrict}
            >
              <span className={selectedDepartement ? 'text-gray-900' : 'text-gray-400'}>
                {selectedDepartement 
                  ? selectedDepartement.nom 
                  : selectedDistrict 
                    ? 'Sélectionner un département' 
                    : 'Sélectionnez d\'abord un district'
                }
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDepartementDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDepartementDropdown && selectedDistrict && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDepartementDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 -lg shadow-lg z-20 max-h-64 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        value={departementSearch}
                        onChange={(e) => setDepartementSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 -lg focus:outline-none focus:border-blue-400"
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
                            <CheckCircle2 size={16} className="text-green-600" />
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
          {/* Année en cours */}
          {anneeEnCours && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 -xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 -full flex items-center justify-center">
                    <TrendingUp size={28} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-green-600 mb-1">Année en cours</p>
                    <p className="text-3xl font-light text-green-900">{anneeEnCours.annee?.label}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Building2 size={12} />{anneeEnCours.district?.nom}
                      </span>
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <Layers size={12} />{anneeEnCours.departement?.nom}
                      </span>
                    </div>
                  </div>
                </div>
                <Lock size={16} className="text-green-500" />
              </div>
            </div>
          )}

          {/* Bouton Ouvrir une année */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={anneesDisponibles.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm -lg hover:bg-blue-700 transition-colors disabled:opacity-40"
            >
              <Unlock size={16} />
              Ouvrir une année
            </button>
          </div>

          {/* Historique */}
          <div className="bg-white border border-gray-200 -xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2">
                <History size={16} className="text-gray-400" />
                <h3 className="text-sm font-medium text-gray-700">Historique des années</h3>
              </div>
            </div>

            {historique.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {historique.map((item) => {
                  const statusInfo = getStatusInfo(item.status || 'past')
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <span className="text-xl font-light text-gray-900 w-24">
                            {item.annee?.label}
                          </span>
                          <div className={`flex items-center gap-2 px-3 py-1 border -full text-xs ${statusInfo.className}`}>
                            <StatusIcon size={12} />
                            {statusInfo.label}
                          </div>
                          <span className="text-xs text-gray-400">
                            Ouverte le {new Date(item.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 -lg hover:bg-gray-100"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {menuOpen === item.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 -lg shadow-lg z-20 min-w-[200px]">
                                {!item.is_current && (
                                  <>
                                    <button 
                                      onClick={() => handleSetCurrent(item)} 
                                      disabled={actionLoading}
                                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
                                    >
                                      <TrendingUp size={14} className="text-blue-600" />
                                      Définir comme en cours
                                    </button>
                                    <div className="border-t border-gray-100"></div>
                                    <button 
                                      onClick={() => handleFermerAnnee(item)} 
                                      disabled={actionLoading}
                                      className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                    >
                                      <Lock size={14} />
                                      Fermer l'année
                                    </button>
                                  </>
                                )}
                                {item.is_current && (
                                  <div className="px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                                    <Lock size={14} className="text-green-500" />
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
              <div className="p-16 text-center">
                <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">Aucune année ouverte pour ce district/département</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm -lg hover:bg-blue-700"
                >
                  <Unlock size={16} />
                  Ouvrir une première année
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Note d'information */}
      {!selectedDistrict && !selectedDepartement && (
        <div className="bg-blue-50 border border-blue-200 -xl p-6 text-center">
          <Building2 size={32} className="mx-auto text-blue-400 mb-3" />
          <p className="text-blue-800 font-medium mb-1">Sélectionnez un district et un département</p>
          <p className="text-sm text-blue-600">
            Pour gérer les années, veuillez d'abord sélectionner un district et un département
          </p>
        </div>
      )}

      {/* Modal d'ouverture d'année */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full -xl shadow-xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-gray-900">Ouvrir une année</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                    Sélectionner l'année à ouvrir
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {anneesDisponibles.map((annee) => (
                      <button
                        key={annee.id}
                        type="button"
                        onClick={() => setSelectedAnnee(annee)}
                        className={`p-4 border -lg text-center transition-all ${
                          selectedAnnee?.id === annee.id 
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl font-light">{annee.label}</span>
                      </button>
                    ))}
                  </div>
                  {anneesDisponibles.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">Toutes les années sont déjà ouvertes</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 -lg border border-gray-200">
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
                onClick={handleOuvrirAnnee}
                disabled={!selectedAnnee || actionLoading}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm -lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <><Loader2 size={16} className="animate-spin" />Ouverture...</>
                ) : (
                  <><Unlock size={16} />Ouvrir</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}





// // ==================== ONGLET 3 : AFFECTATION EN MASSE (AVEC DÉFINIR EN COURS ET FERMETURE) ====================
// function AffectationMasseTabContent({ conferenceId }: { conferenceId: number }) {
//   const [loading, setLoading] = useState(true)
//   const [districts, setDistricts] = useState<District[]>([])
//   const [departements, setDepartements] = useState<Departement[]>([])
//   const [anneesConference, setAnneesConference] = useState<any[]>([])
  
//   // Sélections
//   const [selectedDistricts, setSelectedDistricts] = useState<Set<number>>(new Set())
//   const [selectedDepartements, setSelectedDepartements] = useState<Set<number>>(new Set())
//   const [selectedAnneeConference, setSelectedAnneeConference] = useState<any | null>(null)
  
//   // Type d'action : "ajouter", "definir_en_cours" ou "fermer_toutes"
//   const [actionType, setActionType] = useState<'ajouter' | 'definir_en_cours' | 'fermer_toutes'>('ajouter')
  
//   // UI states
//   const [districtSearch, setDistrictSearch] = useState('')
//   const [departementSearch, setDepartementSearch] = useState('')
//   const [showAnneeDropdown, setShowAnneeDropdown] = useState(false)
//   const [selectAllDistricts, setSelectAllDistricts] = useState(false)
//   const [selectAllDepartements, setSelectAllDepartements] = useState(false)
  
//   const [actionLoading, setActionLoading] = useState(false)
//   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
//   const [previewData, setPreviewData] = useState<{
//     total: number
//     existants: number
//     aCreer: number
//     aDefinirEnCours: number
//     dejaEnCours: number
//     aFermer: number
//     dejaFermees: number
//     details: Array<{
//       district_id: number
//       district_nom: string
//       departement_id: number
//       departement_nom: string
//       existeDeja?: boolean
//       estEnCours?: boolean
//       anneesAFermer?: string
//       anneesDejaFermees?: string
//       action: 'creer' | 'definir_en_cours' | 'rien' | 'deja_en_cours' | 'fermer'
//     }>
//   } | null>(null)

//   useEffect(() => {
//     loadInitialData()
//   }, [conferenceId])

//   const loadInitialData = async () => {
//     try {
//       setLoading(true)
//       const { getDistrictsByConference } = await import('@/actions/chef-conference')
//       const { getDepartements } = await import('@/actions/annee-district')
//       const { getAnneesForConference } = await import('@/actions/chef-conference')
      
//       const [districtsData, departementsData, anneesData] = await Promise.all([
//         getDistrictsByConference(conferenceId),
//         getDepartements(),
//         getAnneesForConference(conferenceId)
//       ])
      
//       setDistricts(districtsData)
//       setDepartements(departementsData)
//       setAnneesConference(anneesData)
      
//       // Présélectionner l'année en cours
//       const anneeEnCours = anneesData.find((a: any) => a.is_current)
//       if (anneeEnCours) {
//         setSelectedAnneeConference(anneeEnCours)
//       }
//     } catch (error) {
//       console.error('Erreur chargement:', error)
//       setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Gérer la sélection/déselection de tous les districts
//   const handleSelectAllDistricts = () => {
//     if (selectAllDistricts) {
//       setSelectedDistricts(new Set())
//     } else {
//       setSelectedDistricts(new Set(filteredDistricts.map(d => d.id)))
//     }
//     setSelectAllDistricts(!selectAllDistricts)
//   }

//   // Gérer la sélection/déselection de tous les départements
//   const handleSelectAllDepartements = () => {
//     if (selectAllDepartements) {
//       setSelectedDepartements(new Set())
//     } else {
//       setSelectedDepartements(new Set(filteredDepartements.map(d => d.id)))
//     }
//     setSelectAllDepartements(!selectAllDepartements)
//   }

//   // Gérer la sélection/déselection d'un district
//   const toggleDistrict = (districtId: number) => {
//     const newSelected = new Set(selectedDistricts)
//     if (newSelected.has(districtId)) {
//       newSelected.delete(districtId)
//     } else {
//       newSelected.add(districtId)
//     }
//     setSelectedDistricts(newSelected)
//     setSelectAllDistricts(newSelected.size === filteredDistricts.length)
//   }

//   // Gérer la sélection/déselection d'un département
//   const toggleDepartement = (departementId: number) => {
//     const newSelected = new Set(selectedDepartements)
//     if (newSelected.has(departementId)) {
//       newSelected.delete(departementId)
//     } else {
//       newSelected.add(departementId)
//     }
//     setSelectedDepartements(newSelected)
//     setSelectAllDepartements(newSelected.size === filteredDepartements.length)
//   }

//   // Prévisualiser l'affectation
//   const handlePreview = async () => {
//     if (selectedDistricts.size === 0) {
//       setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un district' })
//       return
//     }
    
//     if (selectedDepartements.size === 0) {
//       setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un département' })
//       return
//     }
    
//     if (actionType !== 'fermer_toutes' && !selectedAnneeConference) {
//       setMessage({ type: 'error', text: 'Veuillez sélectionner une année de conférence' })
//       return
//     }

//     setActionLoading(true)
//     setMessage(null)

//     try {
//       const selectedDistrictsList = districts.filter(d => selectedDistricts.has(d.id))
//       const selectedDepartementsList = departements.filter(d => selectedDepartements.has(d.id))
      
//       const details: any[] = []
//       let existants = 0
//       let aCreer = 0
//       let aDefinirEnCours = 0
//       let dejaEnCours = 0
//       let aFermer = 0
//       let dejaFermees = 0
      
//       for (const district of selectedDistrictsList) {
//         for (const departement of selectedDepartementsList) {
//           const { getAnneesDistrict } = await import('@/actions/annee-district')
//           const anneesExistantes = await getAnneesDistrict(district.id, departement.id)
          
//           if (actionType === 'fermer_toutes') {
//             // Pour la fermeture, on compte les années en cours à fermer (is_current = true)
//             const anneesEnCoursList = anneesExistantes.filter((a: any) => a.is_current)
//             const anneesDejaFermeesList = anneesExistantes.filter((a: any) => !a.is_current)
            
//             if (anneesEnCoursList.length > 0) {
//               aFermer += anneesEnCoursList.length
//             }
//             if (anneesDejaFermeesList.length > 0) {
//               dejaFermees += anneesDejaFermeesList.length
//             }
            
//             details.push({
//               district_id: district.id,
//               district_nom: district.nom,
//               departement_id: departement.id,
//               departement_nom: departement.nom,
//               anneesAFermer: anneesEnCoursList.map((a: any) => a.annee?.label).join(', '),
//               anneesDejaFermees: anneesDejaFermeesList.map((a: any) => a.annee?.label).join(', '),
//               totalAnnees: anneesExistantes.length,
//               action: anneesEnCoursList.length > 0 ? 'fermer' : 'rien'
//             })
//           } else {
//             const anneeExiste = anneesExistantes.some((a: any) => a.annee_id === selectedAnneeConference.annee_id)
//             const estEnCours = anneesExistantes.some((a: any) => a.annee_id === selectedAnneeConference.annee_id && a.is_current)
            
//             let action: 'creer' | 'definir_en_cours' | 'rien' | 'deja_en_cours' = 'rien'
            
//             if (actionType === 'ajouter') {
//               if (!anneeExiste) {
//                 action = 'creer'
//                 aCreer++
//               } else {
//                 existants++
//               }
//             } else if (actionType === 'definir_en_cours') {
//               if (!anneeExiste) {
//                 action = 'creer'
//                 aCreer++
//               } else if (!estEnCours) {
//                 action = 'definir_en_cours'
//                 aDefinirEnCours++
//               } else {
//                 action = 'deja_en_cours'
//                 dejaEnCours++
//               }
//             }
            
//             details.push({
//               district_id: district.id,
//               district_nom: district.nom,
//               departement_id: departement.id,
//               departement_nom: departement.nom,
//               existeDeja: anneeExiste,
//               estEnCours,
//               action
//             })
//           }
//         }
//       }
      
//       setPreviewData({
//         total: selectedDistrictsList.length * selectedDepartementsList.length,
//         existants,
//         aCreer,
//         aDefinirEnCours,
//         dejaEnCours,
//         aFermer,
//         dejaFermees,
//         details
//       })
//     } catch (error) {
//       console.error('Erreur prévisualisation:', error)
//       setMessage({ type: 'error', text: 'Erreur lors de la prévisualisation' })
//     } finally {
//       setActionLoading(false)
//     }
//   }

//   // Exécuter l'affectation en masse
//   const handleExecuteAffectation = async () => {
//     if (!previewData) {
//       setMessage({ type: 'error', text: 'Veuillez d\'abord prévisualiser' })
//       return
//     }

//     let actionsPossibles = false
    
//     if (actionType === 'ajouter') {
//       actionsPossibles = previewData.aCreer > 0
//     } else if (actionType === 'definir_en_cours') {
//       actionsPossibles = previewData.aCreer > 0 || previewData.aDefinirEnCours > 0
//     } else if (actionType === 'fermer_toutes') {
//       actionsPossibles = previewData.aFermer > 0
//     }

//     if (!actionsPossibles) {
//       setMessage({ type: 'error', text: 'Aucune action à effectuer' })
//       return
//     }

//     // Confirmation pour la fermeture
//     if (actionType === 'fermer_toutes') {
//       if (!confirm(`⚠️ Confirmation : Vous allez fermer ${previewData.aFermer} année(s) en cours. Les années déjà fermées (${previewData.dejaFermees}) resteront inchangées. Confirmer ?`)) {
//         return
//       }
//     }

//     setActionLoading(true)
//     setMessage(null)

//     try {
//       if (actionType === 'ajouter') {
//         const { ajouterAnneePourTous } = await import('@/actions/annee-district')
//         const formData = new FormData()
//         formData.append('annee_id', selectedAnneeConference.annee_id.toString())
//         formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
//         formData.append('departement_ids', JSON.stringify(Array.from(selectedDepartements)))
//         const result = await ajouterAnneePourTous(formData)
        
//         if (result.error) {
//           setMessage({ type: 'error', text: result.error })
//         } else {
//           const messageText = `${result.ajoutes || 0} année(s) créée(s), ${result.ignores || 0} déjà existante(s)`
//           setMessage({ type: 'success', text: messageText })
//           setPreviewData(null)
//           setSelectedDistricts(new Set())
//           setSelectedDepartements(new Set())
//           setSelectAllDistricts(false)
//           setSelectAllDepartements(false)
//         }
//       } else if (actionType === 'definir_en_cours') {
//         const { definirAnneeEnCoursPourTous } = await import('@/actions/annee-district')
//         const formData = new FormData()
//         formData.append('annee_id', selectedAnneeConference.annee_id.toString())
//         formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
//         formData.append('departement_ids', JSON.stringify(Array.from(selectedDepartements)))
//         const result = await definirAnneeEnCoursPourTous(formData)
        
//         if (result.error) {
//           setMessage({ type: 'error', text: result.error })
//         } else {
//           const messageText = `${result.creees || 0} créée(s), ${result.actives || 0} définie(s) en cours`
//           setMessage({ type: 'success', text: messageText })
//           setPreviewData(null)
//           setSelectedDistricts(new Set())
//           setSelectedDepartements(new Set())
//           setSelectAllDistricts(false)
//           setSelectAllDepartements(false)
//         }
//       } else if (actionType === 'fermer_toutes') {
//         const { fermerAnneesPourTous } = await import('@/actions/annee-district')
//         const formData = new FormData()
//         formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
//         formData.append('departement_ids', JSON.stringify(Array.from(selectedDepartements)))
//         const result = await fermerAnneesPourTous(formData)
        
//         if (result.error) {
//           setMessage({ type: 'error', text: result.error })
//         } else {
//           const messageText = `${result.fermees || 0} année(s) fermée(s), ${result.dejaFermees || 0} déjà fermée(s)`
//           setMessage({ type: 'success', text: messageText })
//           setPreviewData(null)
//           setSelectedDistricts(new Set())
//           setSelectedDepartements(new Set())
//           setSelectAllDistricts(false)
//           setSelectAllDepartements(false)
//         }
//       }
//     } catch (error) {
//       console.error('Erreur affectation:', error)
//       setMessage({ type: 'error', text: 'Erreur lors de l\'opération' })
//     } finally {
//       setActionLoading(false)
//     }
//   }

//   const filteredDistricts = districts.filter(d => 
//     d.nom.toLowerCase().includes(districtSearch.toLowerCase())
//   )
  
//   const filteredDepartements = departements.filter(d => 
//     d.nom.toLowerCase().includes(departementSearch.toLowerCase())
//   )

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center py-16">
//         <Loader2 size={32} className="animate-spin text-gray-400" />
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Message toast */}
//       {message && (
//         <div className={`p-4 border -lg ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
//           <div className="flex items-center gap-2">
//             {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
//             <span className="text-sm">{message.text}</span>
//             <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
//               <X size={16} />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Choix du type d'action */}
//       <div className="bg-white border border-gray-200 -xl p-6">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">Type d'action</h3>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           {/* Ajouter l'année */}
//           <button
//             onClick={() => {
//               setActionType('ajouter')
//               setPreviewData(null)
//             }}
//             className={`p-4 border -lg text-left transition-all ${
//               actionType === 'ajouter'
//                 ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
//                 : 'border-gray-200 hover:border-gray-300'
//             }`}
//           >
//             <div className="flex items-center gap-3 mb-2">
//               <div className={`p-2 -full ${actionType === 'ajouter' ? 'bg-blue-100' : 'bg-gray-100'}`}>
//                 <Plus size={20} className={actionType === 'ajouter' ? 'text-blue-600' : 'text-gray-500'} />
//               </div>
//               <span className="font-medium text-gray-900">Ajouter l'année</span>
//             </div>
//             <p className="text-sm text-gray-500">
//               Ajoute l'année sélectionnée aux districts/départements choisis sans changer l'année en cours
//             </p>
//           </button>

//           {/* Définir comme année en cours */}
//           <button
//             onClick={() => {
//               setActionType('definir_en_cours')
//               setPreviewData(null)
//             }}
//             className={`p-4 border -lg text-left transition-all ${
//               actionType === 'definir_en_cours'
//                 ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
//                 : 'border-gray-200 hover:border-gray-300'
//             }`}
//           >
//             <div className="flex items-center gap-3 mb-2">
//               <div className={`p-2 -full ${actionType === 'definir_en_cours' ? 'bg-green-100' : 'bg-gray-100'}`}>
//                 <TrendingUp size={20} className={actionType === 'definir_en_cours' ? 'text-green-600' : 'text-gray-500'} />
//               </div>
//               <span className="font-medium text-gray-900">Définir comme année en cours</span>
//             </div>
//             <p className="text-sm text-gray-500">
//               Ajoute l'année si nécessaire et la définit comme année en cours (is_current = true)
//             </p>
//           </button>

//           {/* Fermer toutes les années */}
//           <button
//             onClick={() => {
//               setActionType('fermer_toutes')
//               setPreviewData(null)
//               setSelectedAnneeConference(null)
//             }}
//             className={`p-4 border -lg text-left transition-all ${
//               actionType === 'fermer_toutes'
//                 ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
//                 : 'border-gray-200 hover:border-gray-300'
//             }`}
//           >
//             <div className="flex items-center gap-3 mb-2">
//               <div className={`p-2 -full ${actionType === 'fermer_toutes' ? 'bg-orange-100' : 'bg-gray-100'}`}>
//                 <Lock size={20} className={actionType === 'fermer_toutes' ? 'text-orange-600' : 'text-gray-500'} />
//               </div>
//               <span className="font-medium text-gray-900">Fermer toutes les années</span>
//             </div>
//             <p className="text-sm text-gray-500">
//               Passe is_current = false pour TOUTES les années en cours des combinaisons sélectionnées
//             </p>
//           </button>
//         </div>
//       </div>

//       {/* Étape 1 : Sélection de l'année de conférence (sauf pour fermeture) */}
//       {actionType !== 'fermer_toutes' && (
//         <div className="bg-white border border-gray-200 -xl p-6">
//           <h3 className="text-lg font-medium text-gray-900 mb-4">1. Sélectionner l'année de conférence</h3>
          
//           <div className="relative">
//             <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
//               Année à {actionType === 'ajouter' ? 'ajouter' : 'définir en cours'}
//             </label>
//             <button
//               onClick={() => setShowAnneeDropdown(!showAnneeDropdown)}
//               className="w-full md:w-96 px-4 py-3 border border-gray-200 -lg text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white"
//             >
//               <span className={selectedAnneeConference ? 'text-gray-900' : 'text-gray-400'}>
//                 {selectedAnneeConference ? selectedAnneeConference.label : 'Sélectionner une année'}
//               </span>
//               <ChevronDown size={18} className={`text-gray-400 transition-transform ${showAnneeDropdown ? 'rotate-180' : ''}`} />
//             </button>
            
//             {showAnneeDropdown && (
//               <>
//                 <div className="fixed inset-0 z-10" onClick={() => setShowAnneeDropdown(false)} />
//                 <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 -lg shadow-lg z-20 max-h-64 overflow-y-auto">
//                   {anneesConference.length === 0 ? (
//                     <div className="px-4 py-3 text-sm text-gray-400">Aucune année disponible</div>
//                   ) : (
//                     anneesConference.map((annee) => (
//                       <button
//                         key={annee.id}
//                         onClick={() => {
//                           setSelectedAnneeConference(annee)
//                           setShowAnneeDropdown(false)
//                         }}
//                         className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
//                       >
//                         <div className="flex items-center gap-3">
//                           <span className="text-sm font-medium">{annee.label}</span>
//                           {annee.is_current && (
//                             <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs -full">
//                               En cours (conférence)
//                             </span>
//                           )}
//                         </div>
//                         {selectedAnneeConference?.id === annee.id && (
//                           <CheckCircle2 size={16} className="text-blue-600" />
//                         )}
//                       </button>
//                     ))
//                   )}
//                 </div>
//               </>
//             )}
            
//             {selectedAnneeConference && (
//               <p className="text-sm text-gray-500 mt-2">
//                 Année sélectionnée : <strong>{selectedAnneeConference.label}</strong>
//                 {selectedAnneeConference.is_current && (
//                   <span className="ml-2 text-green-600">(Année en cours de la conférence)</span>
//                 )}
//               </p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Étape 2 : Sélection des districts */}
//       <div className="bg-white border border-gray-200 -xl p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             {actionType === 'fermer_toutes' ? '1' : '2'}. Sélectionner les districts
//           </h3>
//           <button
//             onClick={handleSelectAllDistricts}
//             className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
//           >
//             {selectAllDistricts ? (
//               <><Square size={16} /> Tout désélectionner</>
//             ) : (
//               <><CheckSquare size={16} /> Tout sélectionner</>
//             )}
//           </button>
//         </div>

//         <div className="mb-4">
//           <div className="relative">
//             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Rechercher un district..."
//               value={districtSearch}
//               onChange={(e) => setDistrictSearch(e.target.value)}
//               className="w-full pl-10 pr-4 py-2.5 border border-gray-200 -lg focus:outline-none focus:border-blue-400"
//             />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
//           {filteredDistricts.length === 0 ? (
//             <p className="text-gray-400 col-span-full text-center py-4">Aucun district trouvé</p>
//           ) : (
//             filteredDistricts.map(district => (
//               <button
//                 key={district.id}
//                 onClick={() => toggleDistrict(district.id)}
//                 className={`p-3 border -lg text-left transition-all flex items-center gap-3 ${
//                   selectedDistricts.has(district.id)
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 hover:border-gray-300'
//                 }`}
//               >
//                 {selectedDistricts.has(district.id) ? (
//                   <CheckSquare size={18} className="text-blue-600 flex-shrink-0" />
//                 ) : (
//                   <Square size={18} className="text-gray-400 flex-shrink-0" />
//                 )}
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">{district.nom}</p>
//                 </div>
//               </button>
//             ))
//           )}
//         </div>

//         <div className="mt-3 text-sm text-gray-500">
//           {selectedDistricts.size} district(s) sélectionné(s) sur {districts.length}
//         </div>
//       </div>

//       {/* Étape 3 : Sélection des départements */}
//       <div className="bg-white border border-gray-200 -xl p-6">
//         <div className="flex items-center justify-between mb-4">
//           <h3 className="text-lg font-medium text-gray-900">
//             {actionType === 'fermer_toutes' ? '2' : '3'}. Sélectionner les départements
//           </h3>
//           <button
//             onClick={handleSelectAllDepartements}
//             className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
//           >
//             {selectAllDepartements ? (
//               <><Square size={16} /> Tout désélectionner</>
//             ) : (
//               <><CheckSquare size={16} /> Tout sélectionner</>
//             )}
//           </button>
//         </div>

//         <div className="mb-4">
//           <div className="relative">
//             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Rechercher un département..."
//               value={departementSearch}
//               onChange={(e) => setDepartementSearch(e.target.value)}
//               className="w-full pl-10 pr-4 py-2.5 border border-gray-200 -lg focus:outline-none focus:border-blue-400"
//             />
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
//           {filteredDepartements.length === 0 ? (
//             <p className="text-gray-400 col-span-full text-center py-4">Aucun département trouvé</p>
//           ) : (
//             filteredDepartements.map(departement => (
//               <button
//                 key={departement.id}
//                 onClick={() => toggleDepartement(departement.id)}
//                 className={`p-3 border -lg text-left transition-all flex items-center gap-3 ${
//                   selectedDepartements.has(departement.id)
//                     ? 'border-blue-500 bg-blue-50'
//                     : 'border-gray-200 hover:border-gray-300'
//                 }`}
//               >
//                 {selectedDepartements.has(departement.id) ? (
//                   <CheckSquare size={18} className="text-blue-600 flex-shrink-0" />
//                 ) : (
//                   <Square size={18} className="text-gray-400 flex-shrink-0" />
//                 )}
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-gray-900 truncate">{departement.nom}</p>
//                 </div>
//               </button>
//             ))
//           )}
//         </div>

//         <div className="mt-3 text-sm text-gray-500">
//           {selectedDepartements.size} département(s) sélectionné(s) sur {departements.length}
//         </div>
//       </div>

//       {/* Étape 4 : Récapitulatif et actions */}
//       <div className="bg-white border border-gray-200 -xl p-6">
//         <h3 className="text-lg font-medium text-gray-900 mb-4">
//           {actionType === 'fermer_toutes' ? '3' : '4'}. Récapitulatif
//         </h3>
        
//         <div className="bg-gray-50 -lg p-4 mb-4">
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div>
//               <p className="text-xs text-gray-500 mb-1">Districts</p>
//               <p className="text-2xl font-light text-gray-900">{selectedDistricts.size}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 mb-1">Départements</p>
//               <p className="text-2xl font-light text-gray-900">{selectedDepartements.size}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 mb-1">Combinaisons</p>
//               <p className="text-2xl font-light text-gray-900">
//                 {selectedDistricts.size * selectedDepartements.size}
//               </p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500 mb-1">Action</p>
//               <p className={`text-sm font-medium ${
//                 actionType === 'ajouter' ? 'text-blue-600' : 
//                 actionType === 'definir_en_cours' ? 'text-green-600' : 
//                 'text-orange-600'
//               }`}>
//                 {actionType === 'ajouter' ? 'Ajouter' : 
//                  actionType === 'definir_en_cours' ? 'Définir en cours' : 
//                  'Fermer les années'}
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={handlePreview}
//             disabled={
//               selectedDistricts.size === 0 || 
//               selectedDepartements.size === 0 || 
//               (actionType !== 'fermer_toutes' && !selectedAnneeConference) || 
//               actionLoading
//             }
//             className="flex-1 px-4 py-2.5 bg-blue-600 text-white text-sm -lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//           >
//             {actionLoading ? (
//               <><Loader2 size={16} className="animate-spin" /> Analyse...</>
//             ) : (
//               <><Search size={16} /> Prévisualiser</>
//             )}
//           </button>
//         </div>

//         {/* Résultats de la prévisualisation */}
//         {previewData && (
//           <div className="mt-6 border-t border-gray-200 pt-6">
//             <div className="flex items-center justify-between mb-4">
//               <h4 className="font-medium text-gray-900">Résultat de l'analyse</h4>
//               <div className="flex gap-4">
//                 {actionType === 'fermer_toutes' ? (
//                   <>
//                     {previewData.aFermer > 0 && (
//                       <span className="text-sm text-orange-600">
//                         <Lock size={14} className="inline mr-1" />
//                         {previewData.aFermer} année(s) à fermer
//                       </span>
//                     )}
//                     {previewData.dejaFermees > 0 && (
//                       <span className="text-sm text-gray-500">
//                         <CheckCircle2 size={14} className="inline mr-1" />
//                         {previewData.dejaFermees} déjà fermée(s)
//                       </span>
//                     )}
//                   </>
//                 ) : (
//                   <>
//                     {previewData.aCreer > 0 && (
//                       <span className="text-sm text-blue-600">
//                         <Plus size={14} className="inline mr-1" />
//                         {previewData.aCreer} à créer
//                       </span>
//                     )}
//                     {actionType === 'definir_en_cours' && previewData.aDefinirEnCours > 0 && (
//                       <span className="text-sm text-green-600">
//                         <TrendingUp size={14} className="inline mr-1" />
//                         {previewData.aDefinirEnCours} à définir en cours
//                       </span>
//                     )}
//                     {(previewData.existants > 0 || previewData.dejaEnCours > 0) && (
//                       <span className="text-sm text-gray-500">
//                         <CheckCircle2 size={14} className="inline mr-1" />
//                         {actionType === 'ajouter' ? previewData.existants : previewData.dejaEnCours} déjà OK
//                       </span>
//                     )}
//                   </>
//                 )}
//               </div>
//             </div>

//             <div className="max-h-64 overflow-y-auto border border-gray-200 -lg">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50 sticky top-0">
//                   <tr>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">District</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Département</th>
//                     <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action prévue</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200 bg-white">
//                   {previewData.details.map((item, index) => (
//                     <tr key={index}>
//                       <td className="px-4 py-2 text-sm text-gray-900">{item.district_nom}</td>
//                       <td className="px-4 py-2 text-sm text-gray-900">{item.departement_nom}</td>
//                       <td className="px-4 py-2">
//                         {actionType === 'fermer_toutes' ? (
//                           item.action === 'fermer' ? (
//                             <span className="inline-flex items-center gap-1 text-xs text-orange-600">
//                               <Lock size={12} />
//                               Fermer : {item.anneesAFermer}
//                             </span>
//                           ) : (
//                             <span className="inline-flex items-center gap-1 text-xs text-gray-400">
//                               <CheckCircle2 size={12} className="text-green-500" />
//                               Aucune année à fermer
//                               {item.anneesDejaFermees && (
//                                 <span className="text-gray-500 ml-1">
//                                   (Déjà fermées: {item.anneesDejaFermees})
//                                 </span>
//                               )}
//                             </span>
//                           )
//                         ) : (
//                           <>
//                             {item.action === 'creer' && (
//                               <span className="inline-flex items-center gap-1 text-xs text-blue-600">
//                                 <Plus size={12} />
//                                 Créer l'année
//                               </span>
//                             )}
//                             {item.action === 'definir_en_cours' && (
//                               <span className="inline-flex items-center gap-1 text-xs text-green-600">
//                                 <TrendingUp size={12} />
//                                 Définir en cours
//                               </span>
//                             )}
//                             {item.action === 'deja_en_cours' && (
//                               <span className="inline-flex items-center gap-1 text-xs text-gray-500">
//                                 <CheckCircle2 size={12} className="text-green-500" />
//                                 Déjà en cours
//                               </span>
//                             )}
//                             {item.action === 'rien' && (
//                               <span className="inline-flex items-center gap-1 text-xs text-gray-400">
//                                 <CheckCircle2 size={12} />
//                                 Déjà existante
//                               </span>
//                             )}
//                           </>
//                         )}
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Bouton d'exécution */}
//             {((actionType === 'ajouter' && previewData.aCreer > 0) ||
//               (actionType === 'definir_en_cours' && (previewData.aCreer > 0 || previewData.aDefinirEnCours > 0)) ||
//               (actionType === 'fermer_toutes' && previewData.aFermer > 0)) && (
//               <div className="mt-4 flex justify-end">
//                 <button
//                   onClick={handleExecuteAffectation}
//                   disabled={actionLoading}
//                   className={`px-6 py-2.5 text-white text-sm -lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
//                     actionType === 'ajouter' 
//                       ? 'bg-blue-600 hover:bg-blue-700' 
//                       : actionType === 'definir_en_cours'
//                       ? 'bg-green-600 hover:bg-green-700'
//                       : 'bg-orange-600 hover:bg-orange-700'
//                   }`}
//                 >
//                   {actionLoading ? (
//                     <><Loader2 size={16} className="animate-spin" /> Exécution...</>
//                   ) : (
//                     <>
//                       {actionType === 'ajouter' && <Plus size={16} />}
//                       {actionType === 'definir_en_cours' && <TrendingUp size={16} />}
//                       {actionType === 'fermer_toutes' && <Lock size={16} />}
//                       {actionType === 'ajouter' 
//                         ? `Créer ${previewData.aCreer} année(s)` 
//                         : actionType === 'definir_en_cours'
//                         ? `Exécuter (${previewData.aCreer} créations, ${previewData.aDefinirEnCours} mises en cours)`
//                         : `Fermer ${previewData.aFermer} année(s)`
//                       }
//                     </>
//                   )}
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Note d'information */}
//       <div className="bg-blue-50 border border-blue-200 -lg p-4">
//         <div className="flex items-start gap-3">
//           <AlertCircle size={18} className="text-blue-500 mt-0.5" />
//           <div>
//             <p className="text-sm font-medium text-blue-800 mb-1">Comment ça marche ?</p>
//             <p className="text-xs text-blue-700">
//               <strong>Ajouter l'année :</strong> Crée l'année pour les combinaisons sélectionnées sans changer l'année en cours.<br />
//               <strong>Définir comme année en cours :</strong> Crée l'année si nécessaire ET la définit comme année en cours (is_current = true).<br />
//               <strong>Fermer toutes les années :</strong> Passe is_current = false pour toutes les années en cours des combinaisons sélectionnées.
//             </p>
//             <p className="text-xs text-gray-600 mt-2">
//               Les années déjà fermées (is_current = false) ne sont pas modifiées.
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }































// ==================== ONGLET 3 : AFFECTATION EN MASSE (AVEC DÉFINIR EN COURS ET FERMETURE) ====================
function AffectationMasseTabContent({ conferenceId }: { conferenceId: number }) {
  const [loading, setLoading] = useState(true)
  const [districts, setDistricts] = useState<District[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [anneesConference, setAnneesConference] = useState<any[]>([])
  
  // Sélections
  const [selectedDistricts, setSelectedDistricts] = useState<Set<number>>(new Set())
  const [selectedDepartements, setSelectedDepartements] = useState<Set<number>>(new Set())
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<any | null>(null)
  
  // Type d'action : "ajouter", "definir_en_cours" ou "fermer_toutes"
  const [actionType, setActionType] = useState<'ajouter' | 'definir_en_cours' | 'fermer_toutes'>('ajouter')
  
  // UI states
  const [districtSearch, setDistrictSearch] = useState('')
  const [departementSearch, setDepartementSearch] = useState('')
  const [showAnneeDropdown, setShowAnneeDropdown] = useState(false)
  const [selectAllDistricts, setSelectAllDistricts] = useState(false)
  const [selectAllDepartements, setSelectAllDepartements] = useState(false)
  
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [previewData, setPreviewData] = useState<{
    total: number
    existants: number
    aCreer: number
    aDefinirEnCours: number
    dejaEnCours: number
    aFermer: number
    dejaFermees: number
    details: Array<{
      district_id: number
      district_nom: string
      departement_id: number
      departement_nom: string
      existeDeja?: boolean
      estEnCours?: boolean
      anneesAFermer?: string
      anneesDejaFermees?: string
      action: 'creer' | 'definir_en_cours' | 'rien' | 'deja_en_cours' | 'fermer'
    }>
  } | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [conferenceId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const { getDistrictsByConference } = await import('@/actions/chef-conference')
      const { getDepartements } = await import('@/actions/annee-district')
      const { getAnneesForConference } = await import('@/actions/chef-conference')
      
      const [districtsData, departementsData, anneesData] = await Promise.all([
        getDistrictsByConference(conferenceId),
        getDepartements(),
        getAnneesForConference(conferenceId)
      ])
      
      setDistricts(districtsData)
      setDepartements(departementsData)
      setAnneesConference(anneesData)
      
      // Présélectionner l'année en cours
      const anneeEnCours = anneesData.find((a: any) => a.is_current)
      if (anneeEnCours) {
        setSelectedAnneeConference(anneeEnCours)
      }
    } catch (error) {
      console.error('Erreur chargement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  // Gérer la sélection/déselection de tous les districts
  const handleSelectAllDistricts = () => {
    if (selectAllDistricts) {
      setSelectedDistricts(new Set())
    } else {
      setSelectedDistricts(new Set(filteredDistricts.map(d => d.id)))
    }
    setSelectAllDistricts(!selectAllDistricts)
  }

  // Gérer la sélection/déselection de tous les départements
  const handleSelectAllDepartements = () => {
    if (selectAllDepartements) {
      setSelectedDepartements(new Set())
    } else {
      setSelectedDepartements(new Set(filteredDepartements.map(d => d.id)))
    }
    setSelectAllDepartements(!selectAllDepartements)
  }

  // Gérer la sélection/déselection d'un district
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

  // Gérer la sélection/déselection d'un département
  const toggleDepartement = (departementId: number) => {
    const newSelected = new Set(selectedDepartements)
    if (newSelected.has(departementId)) {
      newSelected.delete(departementId)
    } else {
      newSelected.add(departementId)
    }
    setSelectedDepartements(newSelected)
    setSelectAllDepartements(newSelected.size === filteredDepartements.length)
  }

  // Prévisualiser l'affectation
  const handlePreview = async () => {
    if (selectedDistricts.size === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un district' })
      return
    }
    
    if (selectedDepartements.size === 0) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner au moins un département' })
      return
    }
    
    if (actionType !== 'fermer_toutes' && !selectedAnneeConference) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une année de conférence' })
      return
    }

    setActionLoading(true)
    setMessage(null)

    try {
      const selectedDistrictsList = districts.filter(d => selectedDistricts.has(d.id))
      const selectedDepartementsList = departements.filter(d => selectedDepartements.has(d.id))
      
      const details: any[] = []
      let existants = 0
      let aCreer = 0
      let aDefinirEnCours = 0
      let dejaEnCours = 0
      let aFermer = 0
      let dejaFermees = 0
      
      for (const district of selectedDistrictsList) {
        for (const departement of selectedDepartementsList) {
          const { getAnneesDistrict } = await import('@/actions/annee-district')
          const anneesExistantes = await getAnneesDistrict(district.id, departement.id)
          
          if (actionType === 'fermer_toutes') {
            // Pour la fermeture, on compte les années en cours à fermer (is_current = true)
            const anneesEnCoursList = anneesExistantes.filter((a: any) => a.is_current)
            const anneesDejaFermeesList = anneesExistantes.filter((a: any) => !a.is_current)
            
            if (anneesEnCoursList.length > 0) {
              aFermer += anneesEnCoursList.length
            }
            if (anneesDejaFermeesList.length > 0) {
              dejaFermees += anneesDejaFermeesList.length
            }
            
            details.push({
              district_id: district.id,
              district_nom: district.nom,
              departement_id: departement.id,
              departement_nom: departement.nom,
              anneesAFermer: anneesEnCoursList.map((a: any) => a.annee?.label).join(', '),
              anneesDejaFermees: anneesDejaFermeesList.map((a: any) => a.annee?.label).join(', '),
              totalAnnees: anneesExistantes.length,
              action: anneesEnCoursList.length > 0 ? 'fermer' : 'rien'
            })
          } else {
            const anneeExiste = anneesExistantes.some((a: any) => a.annee_id === selectedAnneeConference.annee_id)
            const estEnCours = anneesExistantes.some((a: any) => a.annee_id === selectedAnneeConference.annee_id && a.is_current)
            
            let action: 'creer' | 'definir_en_cours' | 'rien' | 'deja_en_cours' = 'rien'
            
            if (actionType === 'ajouter') {
              if (!anneeExiste) {
                action = 'creer'
                aCreer++
              } else {
                existants++
              }
            } else if (actionType === 'definir_en_cours') {
              if (!anneeExiste) {
                action = 'creer'
                aCreer++
              } else if (!estEnCours) {
                action = 'definir_en_cours'
                aDefinirEnCours++
              } else {
                action = 'deja_en_cours'
                dejaEnCours++
              }
            }
            
            details.push({
              district_id: district.id,
              district_nom: district.nom,
              departement_id: departement.id,
              departement_nom: departement.nom,
              existeDeja: anneeExiste,
              estEnCours,
              action
            })
          }
        }
      }
      
      setPreviewData({
        total: selectedDistrictsList.length * selectedDepartementsList.length,
        existants,
        aCreer,
        aDefinirEnCours,
        dejaEnCours,
        aFermer,
        dejaFermees,
        details
      })
    } catch (error) {
      console.error('Erreur prévisualisation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la prévisualisation' })
    } finally {
      setActionLoading(false)
    }
  }

  // Exécuter l'affectation en masse
  const handleExecuteAffectation = async () => {
    if (!previewData) {
      setMessage({ type: 'error', text: 'Veuillez d\'abord prévisualiser' })
      return
    }

    let actionsPossibles = false
    
    if (actionType === 'ajouter') {
      actionsPossibles = previewData.aCreer > 0
    } else if (actionType === 'definir_en_cours') {
      actionsPossibles = previewData.aCreer > 0 || previewData.aDefinirEnCours > 0
    } else if (actionType === 'fermer_toutes') {
      actionsPossibles = previewData.aFermer > 0
    }

    if (!actionsPossibles) {
      setMessage({ type: 'error', text: 'Aucune action à effectuer' })
      return
    }

    // Confirmation pour la fermeture
    if (actionType === 'fermer_toutes') {
      if (!confirm(`⚠️ Confirmation : Vous allez fermer ${previewData.aFermer} année(s) en cours. Les années déjà fermées (${previewData.dejaFermees}) resteront inchangées. Confirmer ?`)) {
        return
      }
    }

    setActionLoading(true)
    setMessage(null)

    try {
      if (actionType === 'ajouter') {
        const { ajouterAnneePourTous } = await import('@/actions/annee-district')
        const formData = new FormData()
        formData.append('annee_id', selectedAnneeConference.annee_id.toString())
        formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
        formData.append('departement_ids', JSON.stringify(Array.from(selectedDepartements)))
        const result = await ajouterAnneePourTous(formData)
        
        if (result.error) {
          setMessage({ type: 'error', text: result.error })
        } else {
          const messageText = `${result.ajoutes || 0} année(s) créée(s), ${result.ignores || 0} déjà existante(s)`
          setMessage({ type: 'success', text: messageText })
          setPreviewData(null)
          setSelectedDistricts(new Set())
          setSelectedDepartements(new Set())
          setSelectAllDistricts(false)
          setSelectAllDepartements(false)
        }
      } else if (actionType === 'definir_en_cours') {
        const { definirAnneeEnCoursPourTous } = await import('@/actions/annee-district')
        const formData = new FormData()
        formData.append('annee_id', selectedAnneeConference.annee_id.toString())
        formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
        formData.append('departement_ids', JSON.stringify(Array.from(selectedDepartements)))
        const result = await definirAnneeEnCoursPourTous(formData)
        
        if (result.error) {
          setMessage({ type: 'error', text: result.error })
        } else {
          const messageText = `${result.creees || 0} créée(s), ${result.actives || 0} définie(s) en cours`
          setMessage({ type: 'success', text: messageText })
          setPreviewData(null)
          setSelectedDistricts(new Set())
          setSelectedDepartements(new Set())
          setSelectAllDistricts(false)
          setSelectAllDepartements(false)
        }
      } else if (actionType === 'fermer_toutes') {
        const { fermerAnneesPourTous } = await import('@/actions/annee-district')
        const formData = new FormData()
        formData.append('district_ids', JSON.stringify(Array.from(selectedDistricts)))
        formData.append('departement_ids', JSON.stringify(Array.from(selectedDepartements)))
        const result = await fermerAnneesPourTous(formData)
        
        if (result.error) {
          setMessage({ type: 'error', text: result.error })
        } else {
          const messageText = `${result.fermees || 0} année(s) fermée(s), ${result.dejaFermees || 0} déjà fermée(s)`
          setMessage({ type: 'success', text: messageText })
          setPreviewData(null)
          setSelectedDistricts(new Set())
          setSelectedDepartements(new Set())
          setSelectAllDistricts(false)
          setSelectAllDepartements(false)
        }
      }
    } catch (error) {
      console.error('Erreur affectation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'opération' })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredDistricts = districts.filter(d => 
    d.nom.toLowerCase().includes(districtSearch.toLowerCase())
  )
  
  const filteredDepartements = departements.filter(d => 
    d.nom.toLowerCase().includes(departementSearch.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Message toast - minimal mais lisible */}
      {message && (
        <div className={`p-4 border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-gray-50' : 'border-l-red-500 bg-gray-50'}`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
            <span className="text-sm text-gray-700">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Choix du type d'action */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">Type d'action</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ajouter l'année */}
          <button
            onClick={() => {
              setActionType('ajouter')
              setPreviewData(null)
            }}
            className={`p-4 border text-left transition-all ${
              actionType === 'ajouter'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 bg-opacity-10 ${actionType === 'ajouter' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                <Plus size={20} className={actionType === 'ajouter' ? 'text-blue-600' : 'text-gray-500'} />
              </div>
              <span className="font-medium text-gray-900">Ajouter l'année</span>
            </div>
            <p className="text-sm text-gray-500">
              Ajoute l'année sélectionnée aux districts/départements choisis sans changer l'année en cours
            </p>
          </button>

          {/* Définir comme année en cours */}
          <button
            onClick={() => {
              setActionType('definir_en_cours')
              setPreviewData(null)
            }}
            className={`p-4 border text-left transition-all ${
              actionType === 'definir_en_cours'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 bg-opacity-10 ${actionType === 'definir_en_cours' ? 'bg-green-100' : 'bg-gray-100'}`}>
                <TrendingUp size={20} className={actionType === 'definir_en_cours' ? 'text-green-600' : 'text-gray-500'} />
              </div>
              <span className="font-medium text-gray-900">Définir comme année en cours</span>
            </div>
            <p className="text-sm text-gray-500">
              Ajoute l'année si nécessaire et la définit comme année en cours (is_current = true)
            </p>
          </button>

          {/* Fermer toutes les années */}
          <button
            onClick={() => {
              setActionType('fermer_toutes')
              setPreviewData(null)
              setSelectedAnneeConference(null)
            }}
            className={`p-4 border text-left transition-all ${
              actionType === 'fermer_toutes'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 bg-opacity-10 ${actionType === 'fermer_toutes' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Lock size={20} className={actionType === 'fermer_toutes' ? 'text-orange-600' : 'text-gray-500'} />
              </div>
              <span className="font-medium text-gray-900">Fermer toutes les années</span>
            </div>
            <p className="text-sm text-gray-500">
              Passe is_current = false pour TOUTES les années en cours des combinaisons sélectionnées
            </p>
          </button>
        </div>
      </div>
<div className='grid md:grid-cols-2 gap-4'>

      {/* Étape 1 : Sélection de l'année de conférence (sauf pour fermeture) */}
      {actionType !== 'fermer_toutes' && (
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">1. SÉLECTIONNER L'ANNÉE DE CONFÉRENCE</h3>
          
          <div className="relative">
            <button
              onClick={() => setShowAnneeDropdown(!showAnneeDropdown)}
              className="w-full md:w-96 px-4 py-3 border border-gray-200 text-left flex items-center justify-between hover:border-gray-400 transition-colors bg-white"
            >
              <span className={selectedAnneeConference ? 'text-gray-900' : 'text-gray-400'}>
                {selectedAnneeConference ? selectedAnneeConference.label : 'Sélectionner une année'}
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showAnneeDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showAnneeDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowAnneeDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-gray-200 shadow-lg z-20 max-h-64 overflow-y-auto">
                  {anneesConference.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">Aucune année disponible</div>
                  ) : (
                    anneesConference.map((annee) => (
                      <button
                        key={annee.id}
                        onClick={() => {
                          setSelectedAnneeConference(annee)
                          setShowAnneeDropdown(false)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{annee.label}</span>
                          {annee.is_current && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs">
                              En cours (conférence)
                            </span>
                          )}
                        </div>
                        {selectedAnneeConference?.id === annee.id && (
                          <CheckCircle2 size={16} className="text-blue-600" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
            
            {selectedAnneeConference && (
              <p className="text-sm text-gray-500 mt-2">
                Année sélectionnée : <strong className="text-gray-900">{selectedAnneeConference.label}</strong>
                {selectedAnneeConference.is_current && (
                  <span className="ml-2 text-green-600">(Année en cours de la conférence)</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Étape 2 : Sélection des districts */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">
            {actionType === 'fermer_toutes' ? '1. DISTRICTS' : '2. DISTRICTS'}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
          {filteredDistricts.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-4">Aucun district trouvé</p>
          ) : (
            filteredDistricts.map(district => (
              <button
                key={district.id}
                onClick={() => toggleDistrict(district.id)}
                className={`p-3 border text-left transition-all flex items-center gap-3 ${
                  selectedDistricts.has(district.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {selectedDistricts.has(district.id) ? (
                  <CheckSquare size={18} className="text-blue-600 flex-shrink-0" />
                ) : (
                  <Square size={18} className="text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{district.nom}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          {selectedDistricts.size} district(s) sélectionné(s) sur {districts.length}
        </div>
      </div>

      {/* Étape 3 : Sélection des départements */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-500">
            {actionType === 'fermer_toutes' ? '2. DÉPARTEMENTS' : '3. DÉPARTEMENTS'}
          </h3>
          <button
            onClick={handleSelectAllDepartements}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            {selectAllDepartements ? (
              <><Square size={16} /> Tout désélectionner</>
            ) : (
              <><CheckSquare size={16} /> Tout sélectionner</>
            )}
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un département..."
              value={departementSearch}
              onChange={(e) => setDepartementSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-1">
          {filteredDepartements.length === 0 ? (
            <p className="text-gray-400 col-span-full text-center py-4">Aucun département trouvé</p>
          ) : (
            filteredDepartements.map(departement => (
              <button
                key={departement.id}
                onClick={() => toggleDepartement(departement.id)}
                className={`p-3 border text-left transition-all flex items-center gap-3 ${
                  selectedDepartements.has(departement.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {selectedDepartements.has(departement.id) ? (
                  <CheckSquare size={18} className="text-blue-600 flex-shrink-0" />
                ) : (
                  <Square size={18} className="text-gray-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{departement.nom}</p>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-3 text-sm text-gray-500">
          {selectedDepartements.size} département(s) sélectionné(s) sur {departements.length}
        </div>
      </div>

</div>
      {/* Étape 4 : Récapitulatif et actions */}
      <div className="bg-white border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">
          {actionType === 'fermer_toutes' ? '3. RÉCAPITULATIF' : '4. RÉCAPITULATIF'}
        </h3>
        
        <div className="bg-gray-50 p-4 mb-4 border border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Districts</p>
              <p className="text-2xl font-light text-gray-900">{selectedDistricts.size}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Départements</p>
              <p className="text-2xl font-light text-gray-900">{selectedDepartements.size}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Combinaisons</p>
              <p className="text-2xl font-light text-gray-900">
                {selectedDistricts.size * selectedDepartements.size}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Action</p>
              <p className={`text-sm font-medium ${
                actionType === 'ajouter' ? 'text-blue-600' : 
                actionType === 'definir_en_cours' ? 'text-green-600' : 
                'text-orange-600'
              }`}>
                {actionType === 'ajouter' ? 'Ajouter' : 
                 actionType === 'definir_en_cours' ? 'Définir en cours' : 
                 'Fermer les années'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={
              selectedDistricts.size === 0 || 
              selectedDepartements.size === 0 || 
              (actionType !== 'fermer_toutes' && !selectedAnneeConference) || 
              actionLoading
            }
            className="flex-1 px-4 py-2.5 bg-black text-white text-sm border border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <><Loader2 size={16} className="animate-spin rounded-full" /> Analyse...</>
            ) : (
              <><Search size={16} /> Prévisualiser</>
            )}
          </button>
        </div>

        {/* Résultats de la prévisualisation */}
        {previewData && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900">Résultat de l'analyse</h4>
              <div className="flex gap-4">
                {actionType === 'fermer_toutes' ? (
                  <>
                    {previewData.aFermer > 0 && (
                      <span className="text-sm text-orange-600">
                        <Lock size={14} className="inline mr-1" />
                        {previewData.aFermer} année(s) à fermer
                      </span>
                    )}
                    {previewData.dejaFermees > 0 && (
                      <span className="text-sm text-gray-500">
                        <CheckCircle2 size={14} className="inline mr-1" />
                        {previewData.dejaFermees} déjà fermée(s)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {previewData.aCreer > 0 && (
                      <span className="text-sm text-blue-600">
                        <Plus size={14} className="inline mr-1" />
                        {previewData.aCreer} à créer
                      </span>
                    )}
                    {actionType === 'definir_en_cours' && previewData.aDefinirEnCours > 0 && (
                      <span className="text-sm text-green-600">
                        <TrendingUp size={14} className="inline mr-1" />
                        {previewData.aDefinirEnCours} à définir en cours
                      </span>
                    )}
                    {(previewData.existants > 0 || previewData.dejaEnCours > 0) && (
                      <span className="text-sm text-gray-500">
                        <CheckCircle2 size={14} className="inline mr-1" />
                        {actionType === 'ajouter' ? previewData.existants : previewData.dejaEnCours} déjà OK
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r border-gray-200">District</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 border-r border-gray-200">Département</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action prévue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {previewData.details.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">{item.district_nom}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">{item.departement_nom}</td>
                      <td className="px-4 py-2">
                        {actionType === 'fermer_toutes' ? (
                          item.action === 'fermer' ? (
                            <span className="inline-flex items-center gap-1 text-sm text-orange-600">
                              <Lock size={14} />
                              Fermer : {item.anneesAFermer}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                              <CheckCircle2 size={14} className="text-green-500" />
                              Aucune année à fermer
                              {item.anneesDejaFermees && (
                                <span className="text-gray-500 ml-1">
                                  (Déjà fermées: {item.anneesDejaFermees})
                                </span>
                              )}
                            </span>
                          )
                        ) : (
                          <>
                            {item.action === 'creer' && (
                              <span className="inline-flex items-center gap-1 text-sm text-blue-600">
                                <Plus size={14} />
                                Créer l'année
                              </span>
                            )}
                            {item.action === 'definir_en_cours' && (
                              <span className="inline-flex items-center gap-1 text-sm text-green-600">
                                <TrendingUp size={14} />
                                Définir en cours
                              </span>
                            )}
                            {item.action === 'deja_en_cours' && (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                                <CheckCircle2 size={14} className="text-green-500" />
                                Déjà en cours
                              </span>
                            )}
                            {item.action === 'rien' && (
                              <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                                <CheckCircle2 size={14} />
                                Déjà existante
                              </span>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bouton d'exécution */}
            {((actionType === 'ajouter' && previewData.aCreer > 0) ||
              (actionType === 'definir_en_cours' && (previewData.aCreer > 0 || previewData.aDefinirEnCours > 0)) ||
              (actionType === 'fermer_toutes' && previewData.aFermer > 0)) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleExecuteAffectation}
                  disabled={actionLoading}
                  className={`px-6 py-2.5 text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border ${
                    actionType === 'ajouter' 
                      ? 'bg-blue-600 border-blue-600 hover:bg-blue-700' 
                      : actionType === 'definir_en_cours'
                      ? 'bg-green-600 border-green-600 hover:bg-green-700'
                      : 'bg-orange-600 border-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {actionLoading ? (
                    <><Loader2 size={16} className="animate-spin rounded-full" /> Exécution...</>
                  ) : (
                    <>
                      {actionType === 'ajouter' && <Plus size={16} />}
                      {actionType === 'definir_en_cours' && <TrendingUp size={16} />}
                      {actionType === 'fermer_toutes' && <Lock size={16} />}
                      {actionType === 'ajouter' 
                        ? `Créer ${previewData.aCreer} année(s)` 
                        : actionType === 'definir_en_cours'
                        ? `Exécuter (${previewData.aCreer} créations, ${previewData.aDefinirEnCours} mises en cours)`
                        : `Fermer ${previewData.aFermer} année(s)`
                      }
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note d'information */}
      <div className="bg-gray-50 border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-gray-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Comment ça marche ?</p>
            <p className="text-sm text-gray-600">
              <strong>Ajouter l'année :</strong> Crée l'année pour les combinaisons sélectionnées sans changer l'année en cours.<br />
              <strong>Définir comme année en cours :</strong> Crée l'année si nécessaire ET la définit comme année en cours (is_current = true).<br />
              <strong>Fermer toutes les années :</strong> Passe is_current = false pour toutes les années en cours des combinaisons sélectionnées.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Les années déjà fermées (is_current = false) ne sont pas modifiées.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}