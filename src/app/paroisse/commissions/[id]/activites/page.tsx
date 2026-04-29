
// app/paroisse/commissions/[id]/activites/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  X, 
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  PlayCircle,
  XCircle,
  Loader2,
  FileText,
  Download,
  Upload,
  Eye
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import {
  getActivitesByCommission,
  getActivitesStatsForCommission,
  getAnneesConferenceForCommission,
  createActiviteForCommission,
  updateActiviteForCommission,
  deleteActiviteForCommission,
  updateActiviteStatutForCommission,
  getActiviteFilesForCommission,
  addFileToActiviteForCommission,
  deleteActiviteFileForCommission,
  type Activite
} from '@/actions/activite-commission'

import {
  getPlansActionForCommissionBudget
} from '@/actions/budget-commission'
import {
  getBudgetsByCommission
} from '@/actions/budget-commission'

interface Commission {
  id: number
  nom: string
  description: string | null
  departement_id: number
  paroisse_id: number
  departement?: { id: number; nom: string }
  paroisse?: { id: number; nom: string }
}

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

interface ActiviteFichier {
  id: number
  activite_id: number
  nom_fichier: string
  chemin_fichier: string
  type_fichier: string
}

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: PlayCircle },
  { value: 'termine', label: 'Terminé', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  { value: 'annule', label: 'Annulé', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle }
]

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function CommissionActivitesPage() {
  const params = useParams()
  const router = useRouter()
  const commissionId = parseInt(params.id as string)

  // États
  const [commission, setCommission] = useState<Commission | null>(null)
  const [activites, setActivites] = useState<Activite[]>([])
  const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [plansAction, setPlansAction] = useState<{ id: number; titre: string }[]>([])
const [budgets, setBudgets] = useState<{ id: number; libelle: string; type: 'recette' | 'depense' }[]>([])


  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Vue calendrier / liste
  const [viewMode, setViewMode] = useState<'liste' | 'calendrier'>('liste')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Modal création/édition
  const [showModal, setShowModal] = useState(false)
  const [editingActivite, setEditingActivite] = useState<Activite | null>(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    date: '',
    heure: '',
    statut: 'planifie',
    annee_conference_id: 0,
    plan_action_id: '',  // ← AJOUTER
  
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modal détails
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedActivite, setSelectedActivite] = useState<Activite | null>(null)
  const [activiteFiles, setActiviteFiles] = useState<ActiviteFichier[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  
  // Menu contextuel
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Chargement initial
  useEffect(() => {
    loadCommission()
    loadAnneesConference()
  }, [commissionId])

  // Recharger les activités quand l'année ou le filtre change
  useEffect(() => {
    if (selectedAnneeConference) {
      loadActivites()
      loadPlansAndBudgets()
    }
  }, [selectedAnneeConference, filterStatut])

  async function loadCommission() {
    try {
      const { data, error } = await supabase
        .from('commission')
        .select(`
          id,
          nom,
          description,
          departement_id,
          paroisse_id,
          departement:departement_id (id, nom),
          paroisse:paroisse_id (id, nom)
        `)
        .eq('id', commissionId)
        .single()

      if (error) throw error

      const departement = Array.isArray(data.departement) ? data.departement[0] : data.departement
      const paroisse = Array.isArray(data.paroisse) ? data.paroisse[0] : data.paroisse

      setCommission({
        ...data,
        departement,
        paroisse
      })
    } catch (error) {
      console.error('Erreur chargement commission:', error)
      toast.error('Erreur lors du chargement de la commission')
    }
  }


  async function loadAnneesConference() {
    try {
      const annees = await getAnneesConferenceForCommission(commissionId)
      setAnneesConference(annees)
      
      const current = annees.find(a => a.is_current) || annees[0]
      if (current) {
        setSelectedAnneeConference(current)
        setFormData(prev => ({ ...prev, annee_conference_id: current.id }))
      }
    } catch (error) {
      console.error('Erreur chargement années:', error)
    }
  }
  // Ajouter cette fonction après loadAnneesConference
async function loadPlansAndBudgets() {
  if (!selectedAnneeConference) return
  
  try {
    const plans = await getPlansActionForCommissionBudget(commissionId, selectedAnneeConference.id)
    setPlansAction(plans)
    
    const budgetsData = await getBudgetsByCommission(commissionId, selectedAnneeConference.id)
    setBudgets(budgetsData)
  } catch (error) {
    console.error('Erreur chargement plans/budgets:', error)
  }
}

  async function loadActivites() {
    if (!selectedAnneeConference) return
    
    setLoading(true)
    try {
      const data = await getActivitesByCommission(
        commissionId,
        selectedAnneeConference.id,
        filterStatut ? { statut: filterStatut } : undefined
      )
      setActivites(data)
      
      const statsData = await getActivitesStatsForCommission(commissionId, selectedAnneeConference.id)
      setStats(statsData)
    } catch (error) {
      console.error('Erreur chargement activités:', error)
      toast.error('Erreur lors du chargement des activités')
    } finally {
      setLoading(false)
    }
  }

  const filteredActivites = activites.filter(activite => {
    const searchLower = searchTerm.toLowerCase()
    return activite.titre.toLowerCase().includes(searchLower) ||
           (activite.description || '').toLowerCase().includes(searchLower)
  })

  const groupedActivites = filteredActivites.reduce((acc, activite) => {
    const date = activite.date
    if (!acc[date]) acc[date] = []
    acc[date].push(activite)
    return acc
  }, {} as Record<string, Activite[]>)

  const sortedDates = Object.keys(groupedActivites).sort((a, b) => a.localeCompare(b))

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    const startDay = firstDay.getDay() || 7
    for (let i = 1; i < startDay; i++) {
      const d = new Date(year, month, 1 - i)
      days.unshift({ date: d, isCurrentMonth: false })
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }
    
    return days
  }

  const getActivitesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return filteredActivites.filter(a => a.date === dateStr)
  }

  function openCreateModal() {
    setEditingActivite(null)
    setFormData({
      titre: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      heure: '09:00',
      statut: 'planifie',
      annee_conference_id: selectedAnneeConference?.id || 0,
    plan_action_id: '',  // ← AJOUTER
    
    })
    setShowModal(true)
  }

  function openEditModal(activite: Activite) {
    setEditingActivite(activite)
    setFormData({
      titre: activite.titre,
      description: activite.description || '',
      date: activite.date,
      heure: activite.heure,
      statut: activite.statut,
      annee_conference_id: activite.annee_conference_id,
        plan_action_id: activite.plan_action_id?.toString() || '',  // ← AJOUTER
    })
    setShowModal(true)
    setMenuOpen(null)
  }

  async function openDetailsModal(activite: Activite) {
    setSelectedActivite(activite)
    setShowDetailsModal(true)
    setMenuOpen(null)
    
    try {
      const files = await getActiviteFilesForCommission(activite.id, commissionId)
      setActiviteFiles(files)
    } catch (error) {
      console.error('Erreur chargement fichiers:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formDataObj = new FormData()
    formDataObj.append('commission_id', commissionId.toString())
    formDataObj.append('titre', formData.titre)
    formDataObj.append('description', formData.description || '')
    formDataObj.append('date', formData.date)
    formDataObj.append('heure', formData.heure)
    formDataObj.append('statut', formData.statut)
    formDataObj.append('annee_conference_id', formData.annee_conference_id.toString())
    // Dans handleSubmit, ajouter ces lignes avant l'appel API
if (formData.plan_action_id) {
  formDataObj.append('plan_action_id', formData.plan_action_id)
}

    if (editingActivite) {
      formDataObj.append('id', editingActivite.id.toString())
      const result = await updateActiviteForCommission(formDataObj)
      if (result.success) {
        toast.success('Activité modifiée')
        setShowModal(false)
        loadActivites()
      } else {
        toast.error(result.error || 'Erreur lors de la modification')
      }
    } else {
      const result = await createActiviteForCommission(formDataObj)
      if (result.success) {
        toast.success('Activité créée')
        setShowModal(false)
        loadActivites()
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    }
    
    setIsSubmitting(false)
  }

  async function handleDelete(activite: Activite) {
    if (!confirm(`Supprimer l'activité "${activite.titre}" ?`)) return
    
    setActionLoading(activite.id)
    const result = await deleteActiviteForCommission(activite.id, commissionId)
    
    if (result.success) {
      toast.success('Activité supprimée')
      loadActivites()
      if (showDetailsModal) setShowDetailsModal(false)
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  async function handleChangeStatut(activite: Activite, statut: string) {
    setActionLoading(activite.id)
    const result = await updateActiviteStatutForCommission(
      activite.id,
      commissionId,
      statut as any
    )
    
    if (result.success) {
      toast.success(`Statut mis à jour`)
      loadActivites()
      if (selectedActivite?.id === activite.id) {
        setSelectedActivite({ ...activite, statut: statut as any })
      }
    } else {
      toast.error(result.error || 'Erreur')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedActivite) return
    
    setUploadingFile(true)
    
    const formDataObj = new FormData()
    formDataObj.append('activite_id', selectedActivite.id.toString())
    formDataObj.append('commission_id', commissionId.toString())
    formDataObj.append('file', file)
    
    const result = await addFileToActiviteForCommission(formDataObj)
    
    if (result.success) {
      toast.success('Fichier ajouté')
      const files = await getActiviteFilesForCommission(selectedActivite.id, commissionId)
      setActiviteFiles(files)
    } else {
      toast.error(result.error || 'Erreur lors de l\'upload')
    }
    
    setUploadingFile(false)
    e.target.value = ''
  }

  async function handleDeleteFile(fileId: number, fileUrl: string) {
    if (!selectedActivite) return
    if (!confirm('Supprimer ce fichier ?')) return
    
    const result = await deleteActiviteFileForCommission(
      fileId,
      selectedActivite.id,
      commissionId,
      fileUrl
    )
    
    if (result.success) {
      toast.success('Fichier supprimé')
      setActiviteFiles(prev => prev.filter(f => f.id !== fileId))
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  function getStatutInfo(statut: string) {
    return STATUTS.find(s => s.value === statut) || STATUTS[0]
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!commission) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={`/paroisse/commissions/${commissionId}`}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">{commission.nom}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Activités</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{commission.departement?.nom}</span>
          <span>•</span>
          <span>{commission.paroisse?.nom}</span>
        </div>
      </div>

      {/* Tabs de navigation */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <Link
          href={`/paroisse/commissions/${commissionId}`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Membres
        </Link>
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Activités
        </span>
        <Link
          href={`/paroisse/commissions/${commissionId}/plans-action`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plans d&apos;action
        </Link>
        <Link
          href={`/paroisse/commissions/${commissionId}/budget`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Budget
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-3">
            <div className="text-xl font-light">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3">
            <div className="text-xl font-light text-blue-700">{stats.planifiees}</div>
            <div className="text-xs text-blue-600">Planifiées</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3">
            <div className="text-xl font-light text-yellow-700">{stats.enCours}</div>
            <div className="text-xs text-yellow-600">En cours</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xl font-light text-green-700">{stats.terminees}</div>
            <div className="text-xs text-green-600">Terminées</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3">
            <div className="text-xl font-light">{stats.aVenir}</div>
            <div className="text-xs text-gray-500">À venir</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3">
            <div className="text-xl font-light text-orange-700">{stats.enRetard}</div>
            <div className="text-xs text-orange-600">En retard</div>
          </div>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <select
            value={selectedAnneeConference?.id || ''}
            onChange={(e) => {
              const ac = anneesConference.find(a => a.id === parseInt(e.target.value))
              if (ac) {
                setSelectedAnneeConference(ac)
                setFormData(prev => ({ ...prev, annee_conference_id: ac.id }))
              }
            }}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            {anneesConference.map(annee => (
              <option key={annee.id} value={annee.id}>
                {annee.label} {annee.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>

          <div className="flex border border-gray-300">
            <button
              onClick={() => setViewMode('liste')}
              className={`px-3 py-2 text-sm ${viewMode === 'liste' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Liste
            </button>
            <button
              onClick={() => setViewMode('calendrier')}
              className={`px-3 py-2 text-sm ${viewMode === 'calendrier' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Calendrier
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border ${showFilters || filterStatut ? 'border-black bg-gray-50' : 'border-gray-300'} hover:border-black`}
          >
            <Filter size={18} />
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            <Plus size={16} />
            Nouvelle activité
          </button>
        </div>
      </div>

      {/* Filtres étendus */}
      {showFilters && (
        <div className="mb-6 p-4 border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600">Statut :</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-3 py-1 text-sm border ${!filterStatut ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
              >
                Tous
              </button>
              {STATUTS.map(statut => (
                <button
                  key={statut.value}
                  onClick={() => setFilterStatut(statut.value)}
                  className={`px-3 py-1 text-sm border ${filterStatut === statut.value ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
                >
                  {statut.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="ml-auto text-sm text-gray-500 hover:text-black"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      ) : viewMode === 'liste' ? (
        <div className="space-y-6">
          {sortedDates.length === 0 ? (
            <div className="border border-gray-200 py-16 text-center">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Aucune activité pour cette période</p>
              <button
                onClick={openCreateModal}
                className="mt-4 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 inline-flex items-center gap-2"
              >
                <Plus size={16} />
                Créer une activité
              </button>
            </div>
          ) : (
            sortedDates.map(date => {
              const activitesDuJour = groupedActivites[date]
              return (
                <div key={date}>
                  <div className="text-sm font-medium text-gray-500 mb-2">
                    {formatDate(date)}
                  </div>
                  <div className="space-y-2">
                    {activitesDuJour.map(activite => {
                      const statutInfo = getStatutInfo(activite.statut)
                      const StatutIcon = statutInfo.icon
                      
                      return (
                        <div
                          key={activite.id}
                          className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-center min-w-[60px]">
                              <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                              <span className="text-sm font-medium">{activite.heure}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium">{activite.titre}</h3>
                                  {activite.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {activite.description}
                                    </p>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 border ${statutInfo.color}`}>
                                    <StatutIcon size={12} className="inline mr-1" />
                                    {statutInfo.label}
                                  </span>
                                  
                                  <div className="relative">
                                    <button
                                      onClick={() => setMenuOpen(menuOpen === activite.id ? null : activite.id)}
                                      className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <MoreVertical size={16} />
                                    </button>
                                    
                                    {menuOpen === activite.id && (
                                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[180px]">
                                        <button
                                          onClick={() => openDetailsModal(activite)}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Eye size={14} /> Voir détails
                                        </button>
                                        <button
                                          onClick={() => openEditModal(activite)}
                                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Edit size={14} /> Modifier
                                        </button>
                                        
                                        <div className="border-t border-gray-100 my-1"></div>
                                        
                                        {STATUTS.filter(s => s.value !== activite.statut).map(statut => {
                                          const Icon = statut.icon
                                          return (
                                            <button
                                              key={statut.value}
                                              onClick={() => handleChangeStatut(activite, statut.value)}
                                              disabled={actionLoading === activite.id}
                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                            >
                                              <Icon size={14} /> Marquer {statut.label.toLowerCase()}
                                            </button>
                                          )
                                        })}
                                        
                                        <div className="border-t border-gray-100 my-1"></div>
                                        
                                        <button
                                          onClick={() => handleDelete(activite)}
                                          disabled={actionLoading === activite.id}
                                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                          {actionLoading === activite.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                          ) : (
                                            <Trash2 size={14} />
                                          )}
                                          Supprimer
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>
      ) : (
        <div className="border border-gray-200 bg-white">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
              className="p-1 hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg font-light">
              {MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
              className="p-1 hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {getDaysInMonth(currentMonth).map((day, idx) => {
              const activitesDuJour = getActivitesForDate(day.date)
              const isToday = day.date.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={idx}
                  className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${isToday ? 'bg-blue-50/30' : ''}`}
                >
                  <div className={`text-xs mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {activitesDuJour.slice(0, 2).map(activite => {
                      const statutInfo = getStatutInfo(activite.statut)
                      return (
                        <button
                          key={activite.id}
                          onClick={() => openDetailsModal(activite)}
                          className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color} cursor-pointer hover:opacity-80`}
                          title={`${activite.heure} - ${activite.titre}`}
                        >
                          {activite.heure} {activite.titre}
                        </button>
                      )
                    })}
                    {activitesDuJour.length > 2 && (
                      <div className="text-xs text-gray-400 pl-1">
                        +{activitesDuJour.length - 2} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                {editingActivite ? 'Modifier l\'activité' : 'Nouvelle activité'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Heure *</label>
                  <input
                    type="time"
                    value={formData.heure}
                    onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Statut</label>
                  <select
                    value={formData.statut}
                    onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  >
                    {STATUTS.map(statut => (
                      <option key={statut.value} value={statut.value}>
                        {statut.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Année conférence</label>
                  <select
                    value={formData.annee_conference_id}
                    onChange={(e) => setFormData({ ...formData, annee_conference_id: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  >
                    {anneesConference.map(annee => (
                      <option key={annee.id} value={annee.id}>
                        {annee.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Ajouter ce bloc après le select "Année conférence" */}
<div>
  <label className="block text-sm font-medium mb-1">Plan d&apos;action (optionnel)</label>
  <select
    value={formData.plan_action_id}
    onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
  >
    <option value="">Aucun</option>
    {plansAction.map(plan => (
      <option key={plan.id} value={plan.id}>
        {plan.titre}
      </option>
    ))}
  </select>
</div>


              </div>
            </form>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : editingActivite ? (
                  'Modifier'
                ) : (
                  'Créer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails */}
      {showDetailsModal && selectedActivite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">Détails de l&apos;activité</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">{selectedActivite.titre}</h2>
                {selectedActivite.description && (
                  <p className="text-gray-600">{selectedActivite.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Date</div>
                    <div className="text-sm">{formatDate(selectedActivite.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Heure</div>
                    <div className="text-sm">{selectedActivite.heure}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs text-gray-500 mb-1">Statut</div>
                {(() => {
                  const statutInfo = getStatutInfo(selectedActivite.statut)
                  const StatutIcon = statutInfo.icon
                  return (
                    <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 border ${statutInfo.color}`}>
                      <StatutIcon size={14} />
                      {statutInfo.label}
                    </span>
                  )
                })()}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Fichiers joints</h4>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                      className="hidden"
                    />
                    <span className="flex items-center gap-1 text-sm text-gray-500 hover:text-black">
                      {uploadingFile ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Upload size={16} />
                      )}
                      Ajouter
                    </span>
                  </label>
                </div>

                {activiteFiles.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    Aucun fichier joint
                  </p>
                ) : (
                  <div className="space-y-2">
                    {activiteFiles.map(file => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-gray-400" />
                          <span className="text-sm">{file.nom_fichier}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.chemin_fichier}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-black"
                            title="Télécharger"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id, file.chemin_fichier)}
                            className="p-1 text-gray-400 hover:text-red-500"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false)
                  openEditModal(selectedActivite)
                }}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black flex items-center justify-center gap-2"
              >
                <Edit size={16} />
                Modifier
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedActivite)}
                disabled={actionLoading === selectedActivite.id}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
              >
                {actionLoading === selectedActivite.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  )
}