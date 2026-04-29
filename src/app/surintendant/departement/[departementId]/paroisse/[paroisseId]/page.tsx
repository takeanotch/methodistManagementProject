
// app/surintendant/departement/[departementId]/paroisse/[paroisseId]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { 
  Loader2, 
  ChevronLeft, 
  Users, 
  Calendar, 
  Target, 
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  FolderOpen,
  Activity,
  Eye,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  FileText,
  Download,
  Paperclip,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  Phone
} from 'lucide-react'
import { getSurintendantInfo, getDepartementDataForParoisse } from '@/actions/surintendant'
import { getAnneesDisponiblesForDepartementInDistrict } from '@/actions/surintendant'
import { getProjetFichiers, getProjetFichierDownloadUrl } from '@/actions/projet'
import { getDepartementUnite } from '@/actions/unite-organisation'
import { getBudgetsByUnite, getUniteBudgetSummary, getRealiseTotals } from '@/actions/budget'
import { getConfiguration } from '@/actions/configurations'
import { BudgetClientReadOnly } from '@/components/BudgetClientReadOnly'
import { supabase } from '@/lib/supabase'
import { getUserNiveau } from '@/actions/auth' // ← AJOUTER CET IMPORT

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📅' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '⚡' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200', icon: '❌' }
]

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const TYPE_LABELS: Record<string, string> = {
  court_terme: 'Court terme',
  moyen_terme: 'Moyen terme',
  long_terme: 'Long terme'
}

export default function SurintendantParoisseDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const departementId = parseInt(params.departementId as string)
  const paroisseId = parseInt(params.paroisseId as string)
  const anneeParam = searchParams.get('annee')
  
  const [loading, setLoading] = useState(true)
  const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
  const [departementInfo, setDepartementInfo] = useState<any>(null)
  const [paroisseInfo, setParoisseInfo] = useState<any>(null)
  const [paroisseData, setParoisseData] = useState<any>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'membres' | 'activites' | 'plans' | 'projets' | 'budget'>('membres')
  
  // États pour la vue activités
  const [currentView, setCurrentView] = useState<'liste' | 'calendrier'>('liste')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedActivite, setSelectedActivite] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // États pour les projets
  const [expandedProjet, setExpandedProjet] = useState<number | null>(null)
  const [projetFichiers, setProjetFichiers] = useState<Record<number, any[]>>({})
  const [loadingFichiers, setLoadingFichiers] = useState<Record<number, boolean>>({})
  const [selectedProjet, setSelectedProjet] = useState<any>(null)
  const [showProjetModal, setShowProjetModal] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<number | null>(null)
const [userNiveau, setUserNiveau] = useState<'region' | 'conference' | 'district' | 'paroisse' | null>(null)
  // États pour le budget
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [budgets, setBudgets] = useState<any[]>([])
  const [budgetSummary, setBudgetSummary] = useState<any>(null)
  const [configTaux, setConfigTaux] = useState<number>(2800)
  const [currentFilter, setCurrentFilter] = useState<'all' | 'recette' | 'depense'>('all')

  useEffect(() => {
    loadInitialData()
  }, [departementId, paroisseId])

  useEffect(() => {
    if (selectedAnnee) {
      loadParoisseData()
    }
  }, [selectedAnnee])

   useEffect(() => {
    async function loadUserNiveau() {
      try {
        const niveau = await getUserNiveau()
        console.log('👤 Surintendant - Niveau utilisateur récupéré:', niveau)
        setUserNiveau(niveau)
      } catch (error) {
        console.error('Erreur récupération niveau:', error)
        // Valeur par défaut basée sur l'URL - surintendant = district
        setUserNiveau('district')
      }
    }
    
    loadUserNiveau()
  }, [])


  useEffect(() => {
    if (selectedAnnee && uniteId) {
      loadBudgetData()
      loadConfiguration()
    }
  }, [selectedAnnee, uniteId])

  async function loadInitialData() {
    try {
      setLoading(true)
      
      // Vérifier le surintendant
      const info = await getSurintendantInfo()
      if (!info) {
        setLoading(false)
        return
      }
      setSurintendantInfo(info)

      // Récupérer les infos du département
      const { data: departement } = await supabase
        .from('departement')
        .select('id, nom, type, description')
        .eq('id', departementId)
        .single()
      
      setDepartementInfo(departement)

      // Récupérer les infos de la paroisse
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('id, nom')
        .eq('id', paroisseId)
        .single()
      
      setParoisseInfo(paroisse)

      // Récupérer les années disponibles
      const annees = await getAnneesDisponiblesForDepartementInDistrict(departementId, info.district_id)
      setAnneesDisponibles(annees)
      
      let anneeId: number | null = null
      if (anneeParam && !isNaN(parseInt(anneeParam))) {
        anneeId = parseInt(anneeParam)
      } else {
        const currentAnnee = annees.find((a: any) => a.is_current)
        if (currentAnnee) {
          anneeId = currentAnnee.id
        } else if (annees.length > 0) {
          anneeId = annees[0].id
        }
      }
      
      setSelectedAnnee(anneeId)
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadInitialData:', error)
      setLoading(false)
    }
  }

  async function loadParoisseData() {
    if (!selectedAnnee) return
    
    try {
      setLoading(true)
      
      // Récupérer l'uniteId du département dans cette paroisse
      const unite = await getDepartementUnite(departementId, paroisseId)
      if (unite) {
        setUniteId(unite.id)
      }
      
      const data = await getDepartementDataForParoisse(departementId, paroisseId, selectedAnnee)
      setParoisseData(data)
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadParoisseData:', error)
      setLoading(false)
    }
  }

  async function loadBudgetData() {
    if (!uniteId || !selectedAnnee) return
    
    try {
      const [budgetsData, totalsData, summaryData] = await Promise.all([
        getBudgetsByUnite(uniteId, selectedAnnee),
        getRealiseTotals(uniteId, selectedAnnee),
        getUniteBudgetSummary(uniteId, selectedAnnee)
      ])
      setBudgets(budgetsData)
      setBudgetSummary(summaryData)
    } catch (error) {
      console.error('Erreur chargement budget:', error)
    }
  }

  async function loadConfiguration() {
    if (!paroisseId) return
    try {
      const config = await getConfiguration(paroisseId)
      if (config) {
        setConfigTaux(config.taux)
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error)
    }
  }

  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    const url = new URL(window.location.href)
    url.searchParams.set('annee', anneeId.toString())
    router.replace(url.pathname + url.search)
  }

  // Fonctions pour les projets
  async function toggleProjetExpanded(projetId: number) {
    if (expandedProjet === projetId) {
      setExpandedProjet(null)
    } else {
      setExpandedProjet(projetId)
      if (!projetFichiers[projetId]) {
        await loadProjetFichiers(projetId)
      }
    }
  }

  async function loadProjetFichiers(projetId: number) {
    setLoadingFichiers(prev => ({ ...prev, [projetId]: true }))
    try {
      const fichiers = await getProjetFichiers(projetId)
      setProjetFichiers(prev => ({ ...prev, [projetId]: fichiers }))
    } catch (error) {
      console.error('Erreur chargement fichiers:', error)
    } finally {
      setLoadingFichiers(prev => ({ ...prev, [projetId]: false }))
    }
  }

  async function handleDownloadFichier(fichierId: number, nomFichier: string) {
    setDownloadingFile(fichierId)
    try {
      const result = await getProjetFichierDownloadUrl(fichierId)
      if (result.success && result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.nom_fichier || nomFichier
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(result.error || 'Erreur lors du téléchargement')
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
      alert('Erreur lors du téléchargement du fichier')
    } finally {
      setDownloadingFile(null)
    }
  }

  function getFileIcon(typeFichier: string) {
    if (typeFichier.startsWith('image/')) return <ImageIcon size={16} className="text-blue-500" />
    if (typeFichier.includes('pdf')) return <FileText size={16} className="text-red-500" />
    if (typeFichier.includes('spreadsheet') || typeFichier.includes('excel')) return <FileSpreadsheet size={16} className="text-green-500" />
    if (typeFichier.includes('document') || typeFichier.includes('word')) return <FileText size={16} className="text-blue-500" />
    if (typeFichier.includes('zip') || typeFichier.includes('rar')) return <FileArchive size={16} className="text-purple-500" />
    return <File size={16} className="text-gray-500" />
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const statutColors: Record<string, string> = {
    planifie: 'bg-blue-50 text-blue-700 border-blue-200',
    en_cours: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    termine: 'bg-green-50 text-green-700 border-green-200',
    annule: 'bg-red-50 text-red-700 border-red-200'
  }

  // Filtrer les activités
  const filteredActivites = (paroisseData?.activites || []).filter((activite: any) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      activite.titre.toLowerCase().includes(searchLower) ||
      (activite.description || '').toLowerCase().includes(searchLower)
    const matchesStatut = !filterStatut || activite.statut === filterStatut
    return matchesSearch && matchesStatut
  })

  const groupedActivites = filteredActivites.reduce((acc: any, activite: any) => {
    const date = activite.date
    if (!acc[date]) acc[date] = []
    acc[date].push(activite)
    return acc
  }, {})

  const sortedDates = Object.keys(groupedActivites).sort((a, b) => a.localeCompare(b))

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  function getStatutInfo(statut: string) {
    return STATUTS.find(s => s.value === statut) || STATUTS[0]
  }

  function openDetailsModal(activite: any) {
    setSelectedActivite(activite)
    setShowDetailsModal(true)
  }

  function openProjetModal(projet: any) {
    setSelectedProjet(projet)
    setShowProjetModal(true)
    if (!projetFichiers[projet.id]) {
      loadProjetFichiers(projet.id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  if (!surintendantInfo || !departementInfo || !paroisseInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-medium mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous n'avez pas accès à cette page</p>
          <Link href={`/surintendant/district/${surintendantInfo?.district_id || ''}`} className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour au district
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          href={`/surintendant/district/${surintendantInfo.district_id}?annee=${selectedAnnee || ''}&departement=${departementId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
        >
          <ChevronLeft size={18} />
          Retour au district
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-light tracking-wide">{paroisseInfo.nom}</h1>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-500">{departementInfo.nom}</span>
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">{departementInfo.type}</span>
        </div>
      </div>

      {/* Sélecteur d'année */}
      {anneesDisponibles.length > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
          <select
            value={selectedAnnee || ''}
            onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            {anneesDisponibles.map((annee: any) => (
              <option key={annee.id} value={annee.id}>
                {annee.label}
                {annee.is_current && ' (en cours)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {paroisseData && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <Users size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{paroisseData.totalFideles}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total fidèles</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <UserCheck size={18} className="text-green-600" />
                <span className="text-2xl font-light text-green-700">{paroisseData.actifs}</span>
              </div>
              <p className="text-xs text-green-600">Actifs</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <UserX size={18} className="text-gray-400" />
                <span className="text-2xl font-light text-gray-500">{paroisseData.inactifs}</span>
              </div>
              <p className="text-xs text-gray-500">Inactifs</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <Activity size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{paroisseData.activites?.length || 0}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Activités</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <FolderOpen size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{paroisseData.projets?.length || 0}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Projets</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('membres')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'membres' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              Membres ({paroisseData.totalFideles})
            </button>
            <button
              onClick={() => setActiveTab('activites')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'activites' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              Activités ({paroisseData.activites?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'plans' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              Plans d'action ({paroisseData.plansAction?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('projets')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'projets' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              Projets ({paroisseData.projets?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'budget' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
              }`}
            >
              Budget {budgets.length > 0 && `(${budgets.length})`}
            </button>
          </div>

          {/* Contenu des tabs */}
          <div>
            {/* TAB MEMBRES */}
            {activeTab === 'membres' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Fidèle</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rôle</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paroisseData.fideles?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          Aucun membre dans ce département
                        </td>
                      </tr>
                    ) : (
                      paroisseData.fideles.map((affectation: any) => {
                        const fidele = affectation.fidele
                        return (
                          <tr key={affectation.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {fidele?.profile_img ? (
                                  <img src={fidele.profile_img} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                    <Users size={14} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{fidele?.prenom} {fidele?.nom}</div>
                                  {fidele?.post_nom && <div className="text-xs text-gray-400">{fidele.post_nom}</div>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {fidele?.contact && (
                                <div className="flex items-center gap-1">
                                  <Phone size={12} /> {fidele.contact}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {affectation.role_details?.label_role || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {affectation.est_actif ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle size={12} /> Actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <XCircle size={12} /> Inactif
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB ACTIVITES */}
            {activeTab === 'activites' && (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex border border-gray-300">
                      <button
                        onClick={() => setCurrentView('liste')}
                        className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'liste' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <List size={14} /> Liste
                      </button>
                      <button
                        onClick={() => setCurrentView('calendrier')}
                        className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'calendrier' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <LayoutGrid size={14} /> Calendrier
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
                      className={`p-2 border ${showFilters || filterStatut ? 'border-black bg-gray-50' : 'border-gray-300'}`}
                    >
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="mb-4 p-4 border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-600">Statut :</label>
                      <div className="flex gap-2">
                        <button onClick={() => setFilterStatut('')} className={`px-3 py-1 text-sm border ${!filterStatut ? 'bg-black text-white border-black' : 'bg-white'}`}>Tous</button>
                        {STATUTS.map(s => (
                          <button key={s.value} onClick={() => setFilterStatut(s.value)} className={`px-3 py-1 text-sm border ${filterStatut === s.value ? 'bg-black text-white border-black' : 'bg-white'}`}>{s.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentView === 'calendrier' ? (
                  <CalendrierView activites={filteredActivites} currentMonth={new Date()} onViewDetails={openDetailsModal} statutColors={statutColors} getStatutInfo={getStatutInfo} />
                ) : filteredActivites.length === 0 ? (
                  <div className="border border-gray-200 py-16 text-center bg-white">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucune activité pour cette période</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {sortedDates.map(date => {
                      const activitesDuJour = groupedActivites[date]
                      return (
                        <div key={date}>
                          <div className="text-sm font-medium text-gray-500 mb-2">{formatDate(date)}</div>
                          <div className="space-y-2">
                            {activitesDuJour.map((activite: any) => {
                              const statutInfo = getStatutInfo(activite.statut)
                              const isPast = new Date(activite.date) < new Date()
                              const isEnRetard = isPast && activite.statut !== 'termine' && activite.statut !== 'annule'
                              
                              return (
                                <div
                                  key={activite.id}
                                  className="bg-white border border-gray-200 p-4 hover:border-gray-300 cursor-pointer"
                                  onClick={() => openDetailsModal(activite)}
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
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{activite.description}</p>
                                          )}
                                          {activite.plan_action && (
                                            <p className="text-xs text-gray-400 mt-1">Plan: {activite.plan_action.titre}</p>
                                          )}
                                          {activite.commentaire && activite.statut === 'termine' && (
                                            <div className="flex items-start gap-1 mt-2 text-xs text-gray-500 bg-gray-50 p-2 border border-gray-100">
                                              <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                                              <span className="italic">{activite.commentaire}</span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs px-2 py-1 border ${statutInfo.color}`}>
                                            <span className="mr-1">{statutInfo.icon}</span>{statutInfo.label}
                                          </span>
                                          {isEnRetard && <span className="text-xs text-orange-600 font-medium">En retard</span>}
                                          <Eye size={14} className="text-gray-400" />
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
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB PLANS D'ACTION */}
            {activeTab === 'plans' && (
              <div className="space-y-3">
                {!paroisseData.plansAction || paroisseData.plansAction.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200">
                    <Target size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucun plan d'action pour cette année</p>
                  </div>
                ) : (
                  paroisseData.plansAction.map((plan: any) => (
                    <div key={plan.id} className="bg-white border border-gray-200 p-4">
                      <h3 className="font-medium">{plan.titre}</h3>
                      {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>Date limite: {new Date(plan.date_limite).toLocaleDateString('fr-FR')}</span>
                        <span className={`px-2 py-1 ${plan.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' : plan.statut === 'termine' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
                          {plan.statut === 'en_cours' ? 'En cours' : plan.statut === 'termine' ? 'Terminé' : 'Planifié'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB PROJETS */}
            {activeTab === 'projets' && (
              <div className="space-y-3">
                {!paroisseData.projets || paroisseData.projets.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200">
                    <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucun projet pour cette année</p>
                  </div>
                ) : (
                  paroisseData.projets.map((projet: any) => {
                    const isExpanded = expandedProjet === projet.id
                    return (
                      <div key={projet.id} className="bg-white border border-gray-200">
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium">{projet.nom}</h3>
                                <span className={`text-xs px-2 py-1 ${projet.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                                  {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                                </span>
                              </div>
                              {projet.description && <p className="text-sm text-gray-500 mt-1">{projet.description}</p>}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>Début: {new Date(projet.date_debut).toLocaleDateString('fr-FR')}</span>
                                {projet.date_fin && <span>Fin: {new Date(projet.date_fin).toLocaleDateString('fr-FR')}</span>}
                                <span className="px-2 py-0.5 bg-gray-100">{TYPE_LABELS[projet.type] || projet.type}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => toggleProjetExpanded(projet.id)} className="flex items-center gap-1 px-2 py-1 text-xs border border-gray-300 hover:border-black">
                                <Paperclip size={12} /> Fichiers
                                <ChevronLeft size={12} className={`transition-transform ${isExpanded ? '-rotate-90' : ''}`} style={{ transform: isExpanded ? 'rotate(-90deg)' : 'none' }} />
                              </button>
                              <button onClick={() => openProjetModal(projet)} className="p-1 text-gray-400 hover:text-black">
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <h4 className="text-xs font-medium text-gray-600 mb-2">Fichiers attachés</h4>
                            {loadingFichiers[projet.id] ? (
                              <Loader2 className="animate-spin text-gray-400" size={16} />
                            ) : (projetFichiers[projet.id] || []).length === 0 ? (
                              <p className="text-sm text-gray-400">Aucun fichier</p>
                            ) : (
                              <div className="space-y-2">
                                {(projetFichiers[projet.id] || []).map((f: any) => (
                                  <div key={f.id} className="flex items-center justify-between bg-white border p-2">
                                    <div className="flex items-center gap-2">
                                      {getFileIcon(f.type_fichier)}
                                      <span className="text-sm">{f.nom_fichier}</span>
                                      <span className="text-xs text-gray-400">{formatFileSize(f.taille_fichier)}</span>
                                    </div>
                                    <button onClick={() => handleDownloadFichier(f.id, f.nom_fichier)} disabled={downloadingFile === f.id} className="p-1 text-gray-500 hover:text-black">
                                      {downloadingFile === f.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* TAB BUDGET - Utilisation du BudgetClientReadOnly */}
            {activeTab === 'budget' && (
              <div>
                {uniteId && selectedAnnee ? (
                  <BudgetClientReadOnly
                    uniteId={uniteId}
                    departementId={departementId}
                    anneesDisponibles={anneesDisponibles}
                    anneeConferenceId={selectedAnnee}
                    budgets={budgets}
                     userNiveau={userNiveau}
                    summary={budgetSummary}
                    currentFilter={currentFilter}
                  />
                ) : (
                  <div className="border border-gray-200 py-16 text-center bg-white">
                    <Loader2 className="animate-spin mx-auto text-gray-300 mb-3" size={32} />
                    <p className="text-gray-400">Chargement du budget...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal détails activité */}
      {showDetailsModal && selectedActivite && (
        <DetailsModal activite={selectedActivite} onClose={() => { setShowDetailsModal(false); setSelectedActivite(null); }} statutColors={statutColors} getStatutInfo={getStatutInfo} />
      )}

      {/* Modal détails projet */}
      {showProjetModal && selectedProjet && (
        <ProjetDetailModal 
          projet={selectedProjet} 
          fichiers={projetFichiers[selectedProjet.id] || []} 
          loading={loadingFichiers[selectedProjet.id] || false}
          onClose={() => { setShowProjetModal(false); setSelectedProjet(null); }} 
          onDownload={handleDownloadFichier} 
          downloading={downloadingFile}
          getFileIcon={getFileIcon}
          formatFileSize={formatFileSize}
        />
      )}
    </div>
  )
}

// Composant CalendrierView
function CalendrierView({ activites, currentMonth: initialMonth, onViewDetails, statutColors, getStatutInfo }: any) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    const startDay = firstDay.getDay() || 7
    for (let i = 1; i < startDay; i++) {
      days.unshift({ date: new Date(year, month, 1 - i), isCurrentMonth: false })
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
    return activites.filter((a: any) => a.date === dateStr)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-light">{MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100">
          <ChevronLeft size={20} className="rotate-180" />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {getDaysInMonth(currentMonth).map((day: any, idx: number) => {
          const activitesDuJour = getActivitesForDate(day.date)
          return (
            <div key={idx} className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${!day.isCurrentMonth ? 'bg-gray-50' : ''} ${isToday(day.date) ? 'bg-blue-50/30' : ''}`}>
              <div className={`text-xs mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>{day.date.getDate()}</div>
              <div className="space-y-1">
                {activitesDuJour.slice(0, 3).map((activite: any) => {
                  const statutInfo = getStatutInfo(activite.statut)
                  return (
                    <button
                      key={activite.id}
                      onClick={() => onViewDetails(activite)}
                      className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color}`}
                      title={`${activite.heure} - ${activite.titre}`}
                    >
                      {activite.heure} {activite.titre}
                    </button>
                  )
                })}
                {activitesDuJour.length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">+{activitesDuJour.length - 3}</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant DetailsModal
function DetailsModal({ activite, onClose, statutColors, getStatutInfo }: any) {
  const statutInfo = getStatutInfo(activite.statut)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Détails de l'activité</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <h2 className="text-xl font-medium mb-2">{activite.titre}</h2>
            {activite.description && <p className="text-gray-600">{activite.description}</p>}
            {activite.plan_action && <p className="text-sm text-gray-500 mt-2">Plan d'action: {activite.plan_action.titre}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="text-sm">{new Date(activite.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Heure</div>
                <div className="text-sm">{activite.heure}</div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Statut</div>
            <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 border ${statutInfo.color}`}>
              <span className="mr-1">{statutInfo.icon}</span>{statutInfo.label}
            </span>
          </div>
          {activite.commentaire && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Commentaire</div>
              <div className="bg-gray-50 p-3 border border-gray-200 text-sm">{activite.commentaire}</div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 hover:border-black text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}

// Composant ProjetDetailModal
function ProjetDetailModal({ projet, fichiers, loading, onClose, onDownload, downloading, getFileIcon, formatFileSize }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">{projet.nom}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-1 ${projet.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100">{TYPE_LABELS[projet.type] || projet.type}</span>
            </div>
            {projet.description && <p className="text-gray-600">{projet.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs text-gray-500">Date de début</div><div className="text-sm">{new Date(projet.date_debut).toLocaleDateString('fr-FR')}</div></div>
            {projet.date_fin && <div><div className="text-xs text-gray-500">Date de fin</div><div className="text-sm">{new Date(projet.date_fin).toLocaleDateString('fr-FR')}</div></div>}
          </div>
          {projet.budget && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Budget</div>
              <div className="text-sm">{new Intl.NumberFormat('fr-FR').format(projet.budget.montant)} {projet.budget.currency}</div>
            </div>
          )}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Paperclip size={14} /> Fichiers ({fichiers.length})</h4>
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : fichiers.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun fichier</p>
            ) : (
              <div className="space-y-2">
                {fichiers.map((f: any) => (
                  <div key={f.id} className="flex items-center justify-between border p-2">
                    <div className="flex items-center gap-2">
                      {getFileIcon(f.type_fichier)}
                      <span className="text-sm">{f.nom_fichier}</span>
                      <span className="text-xs text-gray-400">{formatFileSize(f.taille_fichier)}</span>
                    </div>
                    <button onClick={() => onDownload(f.id, f.nom_fichier)} disabled={downloading === f.id} className="p-1 text-gray-500 hover:text-black">
                      {downloading === f.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={onClose} className="w-full px-4 py-2 border border-gray-300 hover:border-black text-sm">Fermer</button>
        </div>
      </div>
    </div>
  )
}