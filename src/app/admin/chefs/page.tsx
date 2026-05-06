
// app/admin/chef/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/actions/auth'
import { getConferencesWithChefs, getDistrictsWithChefs } from '@/actions/structures'
import { getAllSurintendants, createSurintendant, updateSurintendant, deleteSurintendant } from '@/actions/surintendant'
import { getFideles } from '@/actions/fidele'
import { getAnneesConference } from '@/actions/annee-conference'
import type { AnneeConference } from '@/actions/annee-conference'
import { 
  Users, 
  ChevronLeft, 
  ChevronRight,
  User,
  Calendar,
  Building2,
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
  UserCheck,
  AlertCircle,
  X,
  Filter,
  FilterX,
  ChevronDown
} from 'lucide-react'
import ExportResponsablesPDF from './ExportResponsablesPdf'
type TabType = 'conferences' | 'districts' | 'surintendants'
// app/admin/chef/page.tsx

// Interface pour les districts AVEC chefs (retournée par getDistrictsWithChefs)
// app/admin/chef/page.tsx

// Ajouter "export" devant chaque interface


export interface ChefConference {
  id: number
  fidele_id: number
  conference_id: number
  departement_id?: number | null
  role_id?: number | null
  date_nomination: string
  annee_conference_id?: number | null
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
  departement?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role?: string
    label_role?: string
  }
}

export interface ChefDistrict {
  id: number
  fidele_id: number
  district_id: number
  departement_id?: number | null
  role_id?: number | null
  date_nomination: string | null
  annee_conference_id?: number | null
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
  departement?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role?: string
    label_role?: string
  }
}

export interface ConferenceWithChefs {
  id: number
  nom: string
  region?: {
    id: number
    nom: string
  }
  chefs?: ChefConference[]
}
// Ajoute aussi l'export pour les types de chefs si nécessaire
export interface ChefConference {
  id: number
  fidele_id: number
  conference_id: number
  departement_id?: number | null
  role_id?: number | null
  date_nomination: string
  annee_conference_id?: number | null
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
  departement?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role?: string
    label_role?: string
  }
}

export interface ChefDistrict {
  id: number
  fidele_id: number
  district_id: number
  departement_id?: number | null
  role_id?: number | null
  date_nomination: string | null
  annee_conference_id?: number | null
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
  departement?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role?: string
    label_role?: string
  }
}

export interface ConferenceWithChefs {
  id: number
  nom: string
  region?: {
    id: number
    nom: string
  }
  chefs?: ChefConference[]
}
// Interface pour les districts AVEC chefs (retournée par getDistrictsWithChefs)
interface DistrictWithChefs {
  id: number
  nom: string
  conference?: {
    id: number
    nom: string
    region?: {
      id: number
      nom: string
    }
  }
  chefs?: any[]
}

interface Surintendant {
  id: number
  fidele_id: number
  district_id: number
  est_actif: boolean
  created_at: string
  annee_conference_id?: number | null
  district: {
    id: number
    nom: string
    conference?: {
      id: number
      nom: string
      region?: {
        id: number
        nom: string
      }
    }
  }
  fidele: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
}

interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  profile_img: string | null
  compte: {
    id: number
    role_id: number
    role: {
      nom: string
      niveau: string
    }
  } | null
}

export default function ChefsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('conferences')
  const [loading, setLoading] = useState(true)
  const [conferences, setConferences] = useState<any[]>([])
  const [districts, setDistricts] = useState<DistrictWithChefs[]>([])
  const [surintendants, setSurintendants] = useState<Surintendant[]>([])
  const [allFideles, setAllFideles] = useState<Fidele[]>([])

  // États pour les filtres par année
  const [selectedFilterAnneeId, setSelectedFilterAnneeId] = useState<number | null>(null)
  const [availableAnnees, setAvailableAnnees] = useState<AnneeConference[]>([])
  const [showAnneeFilterDropdown, setShowAnneeFilterDropdown] = useState(false)
  const [loadingAnnees, setLoadingAnnees] = useState(false)
  
  // État pour stocker les données filtrées
  const [filteredConferences, setFilteredConferences] = useState<any[]>([])
  const [filteredDistricts, setFilteredDistricts] = useState<DistrictWithChefs[]>([])
  const [filteredSurintendants, setFilteredSurintendants] = useState<Surintendant[]>([])

  // États pour le modal surintendant
  const [showSurintendantModal, setShowSurintendantModal] = useState(false)
  const [editingSurintendant, setEditingSurintendant] = useState<Surintendant | null>(null)
  const [fideleSearchTerm, setFideleSearchTerm] = useState('')
  const [filteredFideles, setFilteredFideles] = useState<Fidele[]>([])
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [showFideleDropdown, setShowFideleDropdown] = useState(false)
  const [formData, setFormData] = useState({ district_id: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Surintendant | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  // Appliquer le filtre quand les données ou le filtre changent
  useEffect(() => {
    applyFilter()
  }, [conferences, districts, surintendants, selectedFilterAnneeId])

  // const loadData = async () => {
  //   try {
  //     setLoading(true)
      
  //     const user = await getUser()
  //     if (!user || user.role?.nom !== 'admin') {
  //       router.push('/profile')
  //       return
  //     }

  //     const [conferencesData, districtsData, surintendantsData, fidelesData] = await Promise.all([
  //       getConferencesWithChefs(),
  //       getDistrictsWithChefs(),
  //       getAllSurintendants(),
  //       getFideles()
  //     ])

  //     setConferences(conferencesData)
  //     setDistricts(districtsData as DistrictWithChefs[])
  //     setSurintendants(surintendantsData)
  //     setAllFideles(fidelesData)

  //     // Charger toutes les années disponibles pour le filtre
  //     await loadAllAnneesForFilter(conferencesData)
  //   } catch (error) {
  //     console.error('Erreur chargement:', error)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  // Charger toutes les années disponibles à partir des conférences
  


  // app/admin/chef/page.tsx
// Modifier loadData pour passer le filtre d'année

const loadData = async () => {
  try {
    setLoading(true)
    
    const user = await getUser()
    if (!user || user.role?.nom !== 'admin') {
      router.push('/profile')
      return
    }

    // Charger les données avec le filtre d'année
    const [conferencesData, districtsData, surintendantsData, fidelesData] = await Promise.all([
      getConferencesWithChefs(),
      getDistrictsWithChefs(selectedFilterAnneeId),
      getAllSurintendants(selectedFilterAnneeId),
      getFideles()
    ])

    setConferences(conferencesData)
    setDistricts(districtsData as DistrictWithChefs[])
    setSurintendants(surintendantsData)
    setAllFideles(fidelesData)

    // Charger toutes les années disponibles pour le filtre
    await loadAllAnneesForFilter(conferencesData)
  } catch (error) {
    console.error('Erreur chargement:', error)
  } finally {
    setLoading(false)
  }
}

// Modifier loadAllAnneesForFilter pour utiliser getAnneesByConference
const loadAllAnneesForFilter = async (conferencesData: any[]) => {
  try {
    setLoadingAnnees(true)
    const allAnnees: AnneeConference[] = []
    const seenIds = new Set<number>()

    for (const conference of conferencesData) {
      if (conference.id) {
        const annees = await getAnneesConference(conference.id)  // ← Utiliser getAnneesByConference
        for (const annee of annees) {
          if (!seenIds.has(annee.id)) {
            seenIds.add(annee.id)
            allAnnees.push(annee)
          }
        }
      }
    }

    // Trier par année (plus récent en premier)
    allAnnees.sort((a, b) => (b.annee_id || 0) - (a.annee_id || 0))
    setAvailableAnnees(allAnnees)
  } catch (error) {
    console.error('Erreur chargement des années:', error)
  } finally {
    setLoadingAnnees(false)
  }
}

// Supprimer les useEffect de filtrage côté client car le filtrage est fait côté serveur maintenant
// Supprimer filteredConferences, filteredDistricts, filteredSurintendants
// Utiliser directement conferences, districts, surintendants

// Modifier l'effet du filtre pour recharger les données
useEffect(() => {
  if (!loading) {
    loadData()
  }
}, [selectedFilterAnneeId])

  // const loadAllAnneesForFilter = async (conferencesData: any[]) => {
  //   try {
  //     setLoadingAnnees(true)
  //     const allAnnees: AnneeConference[] = []
  //     const seenIds = new Set<number>()

  //     for (const conference of conferencesData) {
  //       if (conference.id) {
  //         const annees = await getAnneesConference(conference.id)
  //         for (const annee of annees) {
  //           if (!seenIds.has(annee.id)) {
  //             seenIds.add(annee.id)
  //             allAnnees.push(annee)
  //           }
  //         }
  //       }
  //     }

  //     // Trier par année (plus récent en premier)
  //     allAnnees.sort((a, b) => (b.annee_id || 0) - (a.annee_id || 0))
  //     setAvailableAnnees(allAnnees)
  //   } catch (error) {
  //     console.error('Erreur chargement des années:', error)
  //   } finally {
  //     setLoadingAnnees(false)
  //   }
  // }

  // Appliquer le filtre par année
  const applyFilter = () => {
    if (!selectedFilterAnneeId) {
      setFilteredConferences(conferences)
      setFilteredDistricts(districts)
      setFilteredSurintendants(surintendants)
      return
    }

    // Filtrer les conférences : garder seulement les chefs de l'année sélectionnée
    const filteredConf = conferences.map(conf => ({
      ...conf,
      chefs: (conf.chefs || []).filter((chef: any) => 
        chef.annee_conference_id === selectedFilterAnneeId
      )
    })).filter(conf => conf.chefs.length > 0)

    // Filtrer les districts : garder seulement les chefs de l'année sélectionnée
    const filteredDist = districts.map(dist => ({
      ...dist,
      chefs: (dist.chefs || []).filter((chef: any) => 
        chef.annee_conference_id === selectedFilterAnneeId
      )
    })).filter(dist => dist.chefs.length > 0)

    // Filtrer les surintendants
    const filteredSur = surintendants.filter(s => 
      s.annee_conference_id === selectedFilterAnneeId
    )

    setFilteredConferences(filteredConf)
    setFilteredDistricts(filteredDist)
    setFilteredSurintendants(filteredSur)
  }

  // Réinitialiser le filtre
  const handleResetFilter = () => {
    setSelectedFilterAnneeId(null)
  }

  // Obtenir le label de l'année sélectionnée
  const getSelectedAnneeLabel = () => {
    if (!selectedFilterAnneeId) return null
    const annee = availableAnnees.find(a => a.id === selectedFilterAnneeId)
    return annee?.annee?.label || `Année #${selectedFilterAnneeId}`
  }

  // Filtrer les fidèles pour la recherche
  useEffect(() => {
    if (fideleSearchTerm.trim() === '') {
      setFilteredFideles(allFideles.slice(0, 10))
    } else {
      const searchLower = fideleSearchTerm.toLowerCase()
      const filtered = allFideles.filter(f => 
        f.nom.toLowerCase().includes(searchLower) ||
        f.prenom.toLowerCase().includes(searchLower) ||
        (f.post_nom && f.post_nom.toLowerCase().includes(searchLower)) ||
        (f.contact && f.contact.includes(fideleSearchTerm))
      ).slice(0, 20)
      setFilteredFideles(filtered)
    }
  }, [fideleSearchTerm, allFideles])

  // Statistiques globales (basées sur les données filtrées)
  const totalChefsConferences = filteredConferences.reduce((acc, c) => acc + (c.chefs?.length || 0), 0)
  const totalChefsDistricts = filteredDistricts.reduce((acc, d) => acc + (d.chefs?.length || 0), 0)
  const totalSurintendantsActifs = filteredSurintendants.filter(s => s.est_actif).length
  const totalChefs = totalChefsConferences + totalChefsDistricts + totalSurintendantsActifs

  // Fonction pour obtenir le label du rôle
  const getRoleLabel = (chef: any) => {
    if (chef.role?.label_role) return chef.role.label_role
    
    if (chef.role?.nom_role) {
      const roleMapping: Record<string, string> = {
        'president': 'Président',
        'vice_president': 'Vice-président',
        'secretaire': 'Secrétaire',
        'vice_secretaire': 'Vice-secrétaire',
        'tresorier': 'Trésorier',
        'conseiller': 'Conseiller',
        'membre': 'Membre'
      }
      return roleMapping[chef.role.nom_role] || chef.role.nom_role
    }
    
    if (chef.role_id) return `Rôle #${chef.role_id}`
    return 'Rôle non défini'
  }

  // Fonction pour obtenir la couleur du badge selon le rôle
  const getRoleBadgeColor = (chef: any) => {
    if (!chef.role) return 'bg-gray-100 text-gray-600 border-gray-200'
    
    const nomRole = chef.role.nom_role || ''
    
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

  // Formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Récupérer le nom de la conférence pour un surintendant
  const getConferenceName = (surintendant: Surintendant) => {
    if (surintendant.district?.conference?.nom) {
      return surintendant.district.conference.nom
    }
    
    const district = districts.find(d => d.id === surintendant.district_id)
    if (district?.conference?.nom) {
      return district.conference.nom
    }
    
    return '—'
  }

  // Récupérer le nom de la région pour un surintendant
  const getRegionName = (surintendant: Surintendant) => {
    if (surintendant.district?.conference?.region?.nom) {
      return surintendant.district.conference.region.nom
    }
    
    const district = districts.find(d => d.id === surintendant.district_id)
    if (district?.conference?.region?.nom) {
      return district.conference.region.nom
    }
    
    return null
  }

  // Fonctions pour gérer les surintendants
  function openCreateSurintendantModal() {
    setEditingSurintendant(null)
    setFormData({ district_id: '' })
    setSelectedFidele(null)
    setFideleSearchTerm('')
    setError(null)
    setShowSurintendantModal(true)
  }

  function openEditSurintendantModal(surintendant: Surintendant) {
    setEditingSurintendant(surintendant)
    setFormData({
      district_id: surintendant.district_id.toString()
    })
    setSelectedFidele({
      id: surintendant.fidele.id,
      nom: surintendant.fidele.nom,
      post_nom: surintendant.fidele.post_nom,
      prenom: surintendant.fidele.prenom,
      contact: surintendant.fidele.contact,
      profile_img: surintendant.fidele.profile_img,
      compte: null
    })
    setError(null)
    setShowSurintendantModal(true)
  }

  function handleSelectFidele(fidele: Fidele) {
    setSelectedFidele(fidele)
    setFideleSearchTerm(`${fidele.prenom} ${fidele.nom}`)
    setShowFideleDropdown(false)
  }

  async function handleSurintendantSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingSurintendant) {
        const result = await updateSurintendant(editingSurintendant.id, {
          district_id: parseInt(formData.district_id)
        })
        
        if (result.success) {
          setShowSurintendantModal(false)
          loadData()
        } else {
          setError(result.error || 'Erreur lors de la mise à jour')
        }
      } else {
        if (!selectedFidele) {
          setError('Veuillez sélectionner un fidèle')
          setSubmitting(false)
          return
        }

        if (!formData.district_id) {
          setError('Veuillez sélectionner un district')
          setSubmitting(false)
          return
        }

        const result = await createSurintendant({
          fidele_id: selectedFidele.id,
          district_id: parseInt(formData.district_id)
        })
        
        if (result.success) {
          setShowSurintendantModal(false)
          loadData()
        } else {
          setError(result.error || 'Erreur lors de la création')
        }
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteSurintendant(surintendant: Surintendant) {
    const result = await deleteSurintendant(surintendant.id)
    if (result.success) {
      setShowDeleteConfirm(null)
      loadData()
    } else {
      alert(result.error || 'Erreur lors de la suppression')
    }
  }

  async function handleToggleSurintendantActif(surintendant: Surintendant) {
    const result = await updateSurintendant(surintendant.id, {
      est_actif: !surintendant.est_actif
    })
    if (result.success) {
      loadData()
    }
  }

  const tabs = [
    { 
      id: 'conferences' as TabType, 
      label: 'Conférences', 
      icon: Globe,
      count: filteredConferences.length,
      chefsCount: totalChefsConferences
    },
    { 
      id: 'districts' as TabType, 
      label: 'Districts', 
      icon: Layers,
      count: filteredDistricts.length,
      chefsCount: totalChefsDistricts
    },
    { 
      id: 'surintendants' as TabType, 
      label: 'Surintendants', 
      icon: Shield,
      count: filteredSurintendants.length,
      chefsCount: totalSurintendantsActifs
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  const conferencesAvecChefs = filteredConferences.filter((c: any) => c.chefs && c.chefs.length > 0).length
  const districtsAvecChefs = filteredDistricts.filter((d: DistrictWithChefs) => d.chefs && d.chefs.length > 0).length

  // Données à afficher selon l'onglet actif
  const displayConferences = selectedFilterAnneeId ? filteredConferences : conferences
  const displayDistricts = selectedFilterAnneeId ? filteredDistricts : districts
  const displaySurintendants = selectedFilterAnneeId ? filteredSurintendants : surintendants

  return (
    <div className="min-h-screen ">
      <div className="max-w-6xl mx-auto ">
        
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white border border-gray-200">
                  <Users size={20} className="text-gray-700" />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-gray-900">
                  Responsables
                </h1>
              </div>
              <p className="text-gray-500 ml-14">
                Gérez les responsables pour les conférences, les districts et les surintendants
              </p>
            </div>
               <ExportResponsablesPDF
        type={activeTab}
        conferences={displayConferences}
        districts={displayDistricts}
        surintendants={displaySurintendants}
        filterInfo={{
          anneeLabel: getSelectedAnneeLabel()
        }}
        stats={{
          totalChefs,
          totalChefsConferences,
          totalChefsDistricts,
          totalSurintendantsActifs
        }}
        getRoleLabel={getRoleLabel}
        getConferenceName={getConferenceName}
        getRegionName={getRegionName}
        formatDate={formatDate}
      />
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Retour à l&apos;administration
            </Link>
          </div>

          {/* Barre de filtre par année */}
          <div className="mt-6 bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Filtrer par année :</span>
                </div>
                
                {/* Dropdown du filtre */}
                <div className="relative">
                  <button
                    onClick={() => setShowAnneeFilterDropdown(!showAnneeFilterDropdown)}
                    disabled={loadingAnnees}
                    className="min-w-[220px] px-4 py-2 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white disabled:opacity-50"
                  >
                    <span className={selectedFilterAnneeId ? 'text-gray-900' : 'text-gray-400'}>
                      {loadingAnnees ? (
                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Chargement...</span>
                      ) : selectedFilterAnneeId ? (
                        getSelectedAnneeLabel()
                      ) : (
                        'Toutes les années'
                      )}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAnneeFilterDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAnneeFilterDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAnneeFilterDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[220px] max-h-64 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedFilterAnneeId(null); setShowAnneeFilterDropdown(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${!selectedFilterAnneeId ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                        >
                          <span>Toutes les années</span>
                          {!selectedFilterAnneeId && <CheckCircle size={14} className="text-emerald-600" />}
                        </button>
                        <div className="border-t border-gray-100"></div>
                        {availableAnnees.map((ac) => (
                          <button
                            key={ac.id}
                            onClick={() => { setSelectedFilterAnneeId(ac.id); setShowAnneeFilterDropdown(false) }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedFilterAnneeId === ac.id ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{ac.annee?.label || `Année ${ac.annee_id}`}</span>
                              {ac.is_current && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded">En cours</span>
                              )}
                            </div>
                            {selectedFilterAnneeId === ac.id && <CheckCircle size={14} className="text-emerald-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bouton pour réinitialiser le filtre */}
              {selectedFilterAnneeId && (
                <button
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FilterX size={14} />
                  Réinitialiser le filtre
                </button>
              )}
            </div>
            
            {/* Information sur le filtre actif */}
            {selectedFilterAnneeId && (
              <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                <span>Affichage des responsables pour l'année {getSelectedAnneeLabel()}</span>
              </div>
            )}
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
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={16} className={isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'} />
                    <span>{tab.label}</span>
                    <span className={`ml-2 text-xs ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                      {tab.id === 'surintendants' 
                        ? `${totalSurintendantsActifs} actif${totalSurintendantsActifs > 1 ? 's' : ''}`
                        : `${tab.chefsCount} responsable${tab.chefsCount > 1 ? 's' : ''}`
                      }
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-6">
          {activeTab === 'conferences' && (
            <div className="space-y-4">
              {/* Stats de l'onglet */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Conférences avec équipe
                  </p>
                  <p className="text-xl font-light text-gray-900">{conferencesAvecChefs}</p>
                </div>
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Sans responsable
                  </p>
                  <p className="text-xl font-light text-gray-900">{displayConferences.length - conferencesAvecChefs}</p>
                </div>
              </div>

              {/* Liste des conférences */}
              <div className="space-y-4">
                {displayConferences.map((conference: any) => {
                  const chefs = conference.chefs || []
                  const hasChefs = chefs.length > 0

                  return (
                    <div key={conference.id} className="bg-white border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-light text-gray-900">
                            {conference.nom}
                          </h2>
                          {conference.region && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {conference.region.nom}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/admin/conferences/${conference.id}/chefs`}
                          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Gérer
                          <ChevronRight size={14} />
                        </Link>
                      </div>

                      <div className="p-6">
                        {hasChefs ? (
                          <>
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Responsable
                                  </th>
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Département
                                  </th>
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rôle
                                  </th>
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Depuis le
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {chefs.map((chef: any) => {
                                  const roleLabel = getRoleLabel(chef)
                                  const badgeColor = getRoleBadgeColor(chef)

                                  return (
                                    <tr key={chef.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                            {chef.fidele?.profile_img ? (
                                              <img 
                                                src={chef.fidele.profile_img} 
                                                alt="" 
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <User size={14} />
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-sm text-gray-900">
                                            {chef.fidele?.prenom} {chef.fidele?.nom}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                          <Building2 size={12} className="text-gray-400" />
                                          {chef.departement?.nom}
                                        </span>
                                      </td>
                                      <td className="py-3">
                                        {chef.role ? (
                                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${badgeColor}`}>
                                            <Shield size={12} />
                                            {roleLabel}
                                          </span>
                                        ) : (
                                          <span className="text-sm text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="py-3">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                                          <Calendar size={12} className="text-gray-400" />
                                          {new Date(chef.date_nomination).toLocaleDateString('fr-FR')}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                {chefs.length} responsable{chefs.length > 1 ? 's' : ''} au total
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                              <Users size={48} className="w-full h-full" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                              {selectedFilterAnneeId 
                                ? `Aucun responsable pour l'année ${getSelectedAnneeLabel()}`
                                : 'Aucun responsable assigné dans cette conférence'
                              }
                            </p>
                            <Link
                              href={`/admin/conferences/${conference.id}/chefs`}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
                            >
                              <Users size={16} />
                              Assigner des responsables
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {displayConferences.length === 0 && (
                  <div className="bg-white border border-gray-200 p-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                      <Globe size={64} className="w-full h-full" />
                    </div>
                    <h3 className="text-xl font-light text-gray-900 mb-2">
                      Aucune conférence
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedFilterAnneeId 
                        ? `Aucune conférence avec des responsables pour l'année ${getSelectedAnneeLabel()}`
                        : 'Aucune conférence n\'a été trouvée.'
                      }
                    </p>
                    {selectedFilterAnneeId && (
                      <button
                        onClick={handleResetFilter}
                        className="mt-4 text-sm text-gray-600 hover:text-black underline underline-offset-4"
                      >
                        Voir toutes les années
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'districts' && (
            <div className="space-y-4">
              {/* Stats de l'onglet */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Districts avec équipe
                  </p>
                  <p className="text-xl font-light text-gray-900">{districtsAvecChefs}</p>
                </div>
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Sans responsable
                  </p>
                  <p className="text-xl font-light text-gray-900">{displayDistricts.length - districtsAvecChefs}</p>
                </div>
              </div>

              {/* Liste des districts */}
              <div className="space-y-4">
                {displayDistricts.map((district: DistrictWithChefs) => {
                  const chefs = district.chefs || []
                  const hasChefs = chefs.length > 0

                  return (
                    <div key={district.id} className="bg-white border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-light text-gray-900">
                            {district.nom}
                          </h2>
                          {district.conference && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {district.conference.nom} {district.conference.region && `• ${district.conference.region.nom}`}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/admin/districts/${district.id}/chefs`}
                          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          Gérer
                          <ChevronRight size={14} />
                        </Link>
                      </div>

                      <div className="p-6">
                        {hasChefs ? (
                          <>
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-100">
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Responsable
                                  </th>
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Département
                                  </th>
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Rôle
                                  </th>
                                  <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Depuis le
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {chefs.map((chef: any) => {
                                  const roleLabel = getRoleLabel(chef)
                                  const badgeColor = getRoleBadgeColor(chef)

                                  return (
                                    <tr key={chef.id} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="py-3">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                            {chef.fidele?.profile_img ? (
                                              <img 
                                                src={chef.fidele.profile_img} 
                                                alt="" 
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                {chef.fidele?.prenom?.[0] || chef.fidele?.nom?.[0] || '?'}
                                              </div>
                                            )}
                                          </div>
                                          <span className="text-sm text-gray-900">
                                            {chef.fidele?.prenom} {chef.fidele?.nom} {chef.fidele?.post_nom || ''}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="py-3">
                                        {chef.departement && (
                                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                            <Building2 size={12} className="text-gray-400" />
                                            {chef.departement.nom}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3">
                                        {chef.role ? (
                                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${badgeColor}`}>
                                            <Shield size={12} />
                                            {roleLabel}
                                          </span>
                                        ) : (
                                          <span className="text-sm text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="py-3">
                                        <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                                          <Calendar size={12} className="text-gray-400" />
                                          {chef.date_nomination 
                                            ? new Date(chef.date_nomination).toLocaleDateString('fr-FR')
                                            : '—'}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                {chefs.length} responsable{chefs.length > 1 ? 's' : ''} au total
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-12">
                            <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                              <Users size={48} className="w-full h-full" />
                            </div>
                            <p className="text-sm text-gray-500 mb-4">
                              {selectedFilterAnneeId 
                                ? `Aucun responsable pour l'année ${getSelectedAnneeLabel()}`
                                : 'Aucun responsable assigné dans ce district'
                              }
                            </p>
                            <Link
                              href={`/admin/districts/${district.id}/chefs`}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
                            >
                              <Users size={16} />
                              Assigner des responsables
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {displayDistricts.length === 0 && (
                  <div className="bg-white border border-gray-200 p-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                      <Building2 size={64} className="w-full h-full" />
                    </div>
                    <h3 className="text-xl font-light text-gray-900 mb-2">
                      Aucun district
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedFilterAnneeId 
                        ? `Aucun district avec des responsables pour l'année ${getSelectedAnneeLabel()}`
                        : 'Aucun district n\'a été trouvé.'
                      }
                    </p>
                    {selectedFilterAnneeId && (
                      <button
                        onClick={handleResetFilter}
                        className="mt-4 text-sm text-gray-600 hover:text-black underline underline-offset-4"
                      >
                        Voir toutes les années
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'surintendants' && (
            <div className="space-y-4">
              {/* Stats de l'onglet */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Total surintendants
                  </p>
                  <p className="text-xl font-light text-gray-900">{displaySurintendants.length}</p>
                </div>
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Actifs
                  </p>
                  <p className="text-xl font-light text-green-600">
                    {displaySurintendants.filter(s => s.est_actif).length}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 px-5 py-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                    Inactifs
                  </p>
                  <p className="text-xl font-light text-gray-400">
                    {displaySurintendants.filter(s => !s.est_actif).length}
                  </p>
                </div>
              </div>

              {/* Liste des surintendants */}
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-light text-gray-900">
                    Liste des surintendants
                  </h2>
                  <button
                    onClick={openCreateSurintendantModal}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={14} />
                    Nouveau
                  </button>
                </div>

                <div className="p-6">
                  {displaySurintendants.length > 0 ? (
                    <>
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Surintendant
                            </th>
                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              District
                            </th>
                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Conférence / Région
                            </th>
                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="pb-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nommé le
                            </th>
                            <th className="pb-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {displaySurintendants.map((surintendant) => {
                            const fidele = surintendant.fidele
                            const district = surintendant.district
                            const conferenceName = getConferenceName(surintendant)
                            const regionName = getRegionName(surintendant)

                            return (
                              <tr key={surintendant.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                                      {fidele?.profile_img ? (
                                        <img 
                                          src={fidele.profile_img} 
                                          alt="" 
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                          {fidele?.prenom?.[0] || fidele?.nom?.[0] || '?'}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <span className="text-sm text-gray-900 block">
                                        {fidele?.prenom} {fidele?.nom} {fidele?.post_nom || ''}
                                      </span>
                                      {fidele?.contact && (
                                        <span className="text-xs text-gray-400">
                                          {fidele.contact}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3">
                                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                    <Building2 size={12} className="text-gray-400" />
                                    {district?.nom || `District #${surintendant.district_id}`}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-600">
                                      {conferenceName}
                                    </span>
                                    {regionName && (
                                      <span className="text-xs text-gray-400">
                                        {regionName}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3">
                                  <button
                                    onClick={() => handleToggleSurintendantActif(surintendant)}
                                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 border ${
                                      surintendant.est_actif 
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    } transition-colors`}
                                  >
                                    {surintendant.est_actif ? (
                                      <><CheckCircle size={12} /> Actif</>
                                    ) : (
                                      <><XCircle size={12} /> Inactif</>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3">
                                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                                    <Calendar size={12} className="text-gray-400" />
                                    {formatDate(surintendant.created_at)}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => openEditSurintendantModal(surintendant)}
                                      className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                                      title="Modifier"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(surintendant)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                      title="Désactiver"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {displaySurintendants.length} surintendant{displaySurintendants.length > 1 ? 's' : ''} au total
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                        <Shield size={48} className="w-full h-full" />
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        {selectedFilterAnneeId 
                          ? `Aucun surintendant pour l'année ${getSelectedAnneeLabel()}`
                          : 'Aucun surintendant enregistré'
                        }
                      </p>
                      <button
                        onClick={openCreateSurintendantModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={16} />
                        Ajouter un surintendant
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de création/édition de surintendant */}
        {showSurintendantModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h3 className="text-lg font-light">
                  {editingSurintendant ? 'Modifier le surintendant' : 'Nouveau surintendant'}
                </h3>
                <button
                  onClick={() => setShowSurintendantModal(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSurintendantSubmit} className="p-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {/* Recherche de fidèle (seulement en création) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fidèle {editingSurintendant && <span className="text-gray-400 text-xs">(non modifiable)</span>}
                  </label>
                  
                  {editingSurintendant ? (
                    <div className="p-3 bg-gray-50 border border-gray-200 text-sm">
                      <div className="font-medium">
                        {selectedFidele?.prenom} {selectedFidele?.nom} {selectedFidele?.post_nom || ''}
                      </div>
                      {selectedFidele?.contact && (
                        <div className="text-xs text-gray-500 mt-1">{selectedFidele.contact}</div>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher un fidèle par nom, prénom ou contact..."
                          value={fideleSearchTerm}
                          onChange={(e) => {
                            setFideleSearchTerm(e.target.value)
                            setShowFideleDropdown(true)
                          }}
                          onFocus={() => setShowFideleDropdown(true)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          autoComplete="off"
                        />
                      </div>
                      
                      {showFideleDropdown && filteredFideles.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-64 overflow-y-auto">
                          {filteredFideles.map(fidele => (
                            <button
                              key={fidele.id}
                              type="button"
                              onClick={() => handleSelectFidele(fidele)}
                              className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {fidele.profile_img ? (
                                  <img 
                                    src={fidele.profile_img} 
                                    alt="" 
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <UserCheck size={14} className="text-gray-400" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <div className="font-medium">
                                    {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
                                  </div>
                                  {fidele.contact && (
                                    <div className="text-xs text-gray-500 mt-0.5">{fidele.contact}</div>
                                  )}
                                </div>
                                {fidele.compte && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200">
                                    {fidele.compte.role?.nom || 'Compte'}
                                  </span>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {showFideleDropdown && fideleSearchTerm && filteredFideles.length === 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg p-4 text-center text-gray-400 text-sm">
                          Aucun fidèle trouvé
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!editingSurintendant && selectedFidele && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 text-sm flex items-center justify-between">
                      <div>
                        <span className="font-medium text-green-700">
                          {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
                        </span>
                        {selectedFidele.contact && (
                          <span className="text-xs text-green-600 ml-2">({selectedFidele.contact})</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFidele(null)
                          setFideleSearchTerm('')
                        }}
                        className="text-green-600 hover:text-green-800"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Sélection du district */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <select
                    value={formData.district_id}
                    onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
                    required
                  >
                    <option value="">Sélectionner un district</option>
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.nom} {d.conference ? `(${d.conference.nom})` : '(Sans conférence)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSurintendantModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || (!editingSurintendant && !selectedFidele)}
                    className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    {editingSurintendant ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-md p-6">
              <div className="text-center mb-4">
                <AlertCircle size={48} className="mx-auto text-orange-500 mb-3" />
                <h3 className="text-lg font-medium mb-2">Désactiver le surintendant ?</h3>
                <p className="text-sm text-gray-500">
                  Êtes-vous sûr de vouloir désactiver <strong>{showDeleteConfirm.fidele.prenom} {showDeleteConfirm.fidele.nom}</strong> en tant que surintendant du district de <strong>{showDeleteConfirm.district.nom}</strong> ?
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Il pourra être réactivé ultérieurement.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteSurintendant(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
                >
                  Désactiver
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlay pour fermer le dropdown de recherche */}
        {showFideleDropdown && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowFideleDropdown(false)}
          />
        )}
      </div>
    </div>
  )
}