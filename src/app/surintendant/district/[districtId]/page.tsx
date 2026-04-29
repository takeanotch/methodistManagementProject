// app/surintendant/district/[districtId]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { 
  Loader2, 
  Users, 
  Calendar, 
  Target,
  ChevronRight,
  Building2,
  Activity,
  AlertCircle,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Clock,
  Eye,
  ChevronLeft,
  MessageSquare,
  MapPin,
  TrendingUp,
  TrendingDown,
  FolderOpen,
  Briefcase,
  BarChart3,
  Download,
  FileText,
  Paperclip,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileArchive,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX
} from 'lucide-react'
import { getSurintendantInfo, getAllDistrictData } from '@/actions/surintendant'
import { getProjetFichiers, getProjetFichierDownloadUrl } from '@/actions/projet'
import { supabase } from '@/lib/supabase'

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

export default function SurintendantDistrictPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const districtId = parseInt(params.districtId as string)
  const anneeParam = searchParams.get('annee')
  const departementParam = searchParams.get('departement')
  
  const [loading, setLoading] = useState(true)
  const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
  const [departementsData, setDepartementsData] = useState<any[]>([])
  const [districtStats, setDistrictStats] = useState<any>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // États pour l'onglet actif
  const [activeMainTab, setActiveMainTab] = useState<'departements' | 'activites' | 'statistiques' | 'projets'>('departements')
  
  // États pour les activités
  const [currentView, setCurrentView] = useState<'liste' | 'calendrier'>('liste')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [filterDepartement, setFilterDepartement] = useState<string>(departementParam || '')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedActivite, setSelectedActivite] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // États pour les départements
  const [expandedDepartement, setExpandedDepartement] = useState<number | null>(
    departementParam ? parseInt(departementParam) : null
  )
  const [selectedDepartementForDetail, setSelectedDepartementForDetail] = useState<any>(null)
  const [showDepartementDetailModal, setShowDepartementDetailModal] = useState(false)
  
  // États pour les projets
  const [expandedProjet, setExpandedProjet] = useState<number | null>(null)
  const [projetFichiers, setProjetFichiers] = useState<Record<number, any[]>>({})
  const [loadingFichiers, setLoadingFichiers] = useState<Record<number, boolean>>({})
  const [selectedProjet, setSelectedProjet] = useState<any>(null)
  const [showProjetModal, setShowProjetModal] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<number | null>(null)
  const [filterProjetStatut, setFilterProjetStatut] = useState<string>('')
  const [filterProjetDepartement, setFilterProjetDepartement] = useState<string>(departementParam || '')

  useEffect(() => {
    loadData()
  }, [districtId])

  useEffect(() => {
    if (selectedAnnee && selectedAnnee.toString() !== anneeParam) {
      const url = new URL(window.location.href)
      url.searchParams.set('annee', selectedAnnee.toString())
      router.replace(url.pathname + url.search)
    }
  }, [selectedAnnee])

  async function loadData() {
    try {
      setLoading(true)
      
      const info = await getSurintendantInfo()
      if (!info || info.district_id !== districtId) {
        setLoading(false)
        return
      }
      setSurintendantInfo(info)

      // Récupérer les années disponibles
      const { data: firstDepartement } = await supabase
        .from('departement')
        .select('id')
        .limit(1)
        .single()

      if (firstDepartement) {
        const { data: district } = await supabase
          .from('district')
          .select('conference_id')
          .eq('id', districtId)
          .single()

        if (district?.conference_id) {
          const { data: annees } = await supabase
            .from('annee_conference')
            .select(`
              id,
              annee_id,
              is_current,
              annee:annee_id (id, label)
            `)
            .eq('conference_id', district.conference_id)
            .order('annee_id', { ascending: false })

          if (annees) {
            const formattedAnnees = annees.map((item: any) => {
              const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
              return {
                id: item.id,
                annee_id: item.annee_id,
                label: annee?.label || `Année ${item.annee_id}`,
                is_current: item.is_current
              }
            })
            setAnneesDisponibles(formattedAnnees)
            
            let anneeId: number | null = null
            if (anneeParam && !isNaN(parseInt(anneeParam))) {
              anneeId = parseInt(anneeParam)
            } else {
              const currentAnnee = formattedAnnees.find((a: any) => a.is_current)
              if (currentAnnee) {
                anneeId = currentAnnee.id
              } else if (formattedAnnees.length > 0) {
                anneeId = formattedAnnees[0].id
              }
            }
            
            if (anneeId) {
              setSelectedAnnee(anneeId)
              await loadAllData(anneeId)
            }
          }
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
    }
  }

  async function loadAllData(anneeId: number) {
    setIsLoadingData(true)
    const { departementsData, districtStats } = await getAllDistrictData(districtId, anneeId)
    setDepartementsData(departementsData)
    setDistrictStats(districtStats)
    setIsLoadingData(false)
  }

  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    await loadAllData(anneeId)
  }

  // Toutes les activités
  const allActivites = departementsData.flatMap(dept => 
    dept.paroissesData.flatMap((paroisse: any) =>
      (paroisse.data.activites || []).map((activite: any) => ({
        ...activite,
        uniqueKey: `${activite.id}-${paroisse.paroisse_id}-${dept.departement.id}`,
        paroisse_nom: paroisse.paroisse_nom,
        paroisse_id: paroisse.paroisse_id,
        departement_nom: dept.departement.nom,
        departement_id: dept.departement.id
      }))
    )
  )

  // Tous les projets
  const allProjets = departementsData.flatMap(dept => 
    dept.paroissesData.flatMap((paroisse: any) =>
      (paroisse.data.projets || []).map((projet: any) => ({
        ...projet,
        uniqueKey: `${projet.id}-${paroisse.paroisse_id}-${dept.departement.id}`,
        paroisse_nom: paroisse.paroisse_nom,
        paroisse_id: paroisse.paroisse_id,
        departement_nom: dept.departement.nom,
        departement_id: dept.departement.id
      }))
    )
  )

  // Filtrer les activités
  const filteredActivites = allActivites.filter(activite => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      activite.titre.toLowerCase().includes(searchLower) ||
      (activite.description || '').toLowerCase().includes(searchLower) ||
      activite.paroisse_nom.toLowerCase().includes(searchLower) ||
      activite.departement_nom.toLowerCase().includes(searchLower)
    const matchesStatut = !filterStatut || activite.statut === filterStatut
    const matchesDepartement = !filterDepartement || activite.departement_id.toString() === filterDepartement
    return matchesSearch && matchesStatut && matchesDepartement
  })

  // Filtrer les projets
  const filteredProjets = allProjets.filter(projet => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      projet.nom.toLowerCase().includes(searchLower) ||
      (projet.description || '').toLowerCase().includes(searchLower)
    const matchesStatut = !filterProjetStatut || projet.statut === filterProjetStatut
    const matchesDepartement = !filterProjetDepartement || projet.departement_id.toString() === filterProjetDepartement
    return matchesSearch && matchesStatut && matchesDepartement
  })

  // Grouper les activités par date
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

  const statutColors: Record<string, string> = {
    planifie: 'bg-blue-50 text-blue-700 border-blue-200',
    en_cours: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    termine: 'bg-green-50 text-green-700 border-green-200',
    annule: 'bg-red-50 text-red-700 border-red-200'
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

  function openDepartementDetailModal(deptData: any) {
    setSelectedDepartementForDetail(deptData)
    setShowDepartementDetailModal(true)
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

  if (!surintendantInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'êtes pas le surintendant de ce district</p>
          <Link href="/surintendant" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  const totalFideles = districtStats?.totalFideles || 0
  const totalActifs = districtStats?.totalActifs || 0
  const totalParoisses = districtStats?.totalParoisses || 0
  const totalDepartements = districtStats?.totalDepartements || 0
  const totalActivites = districtStats?.totalActivites || 0
  const totalPlans = districtStats?.totalPlansAction || 0
  const totalProjets = districtStats?.totalProjets || 0

  return (
    <div className=" py-3 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/surintendant"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
        >
          <ChevronLeft size={18} />
          Retour au tableau de bord
        </Link>
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              District de {surintendantInfo.district_nom}
            </h1>
            <p className="text-sm text-gray-500">
              {totalParoisses} paroisses • {totalDepartements} départements
            </p>
          </div>
        </div>
      </div>

      {/* Sélecteur d'année */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
          <select
            value={selectedAnnee || ''}
            onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px]"
            disabled={isLoadingData}
          >
            {anneesDisponibles.map((annee: any) => (
              <option key={annee.id} value={annee.id}>
                {annee.label}
                {annee.is_current && ' (en cours)'}
              </option>
            ))}
          </select>
          {isLoadingData && <Loader2 size={16} className="animate-spin text-gray-400" />}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <Users size={16} className="text-gray-400" />
            <span className="text-xl font-light">{totalFideles}</span>
          </div>
          <p className="text-xs text-gray-500">Fidèles</p>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <UserCheck size={16} className="text-green-500" />
            <span className="text-xl font-light text-green-600">{totalActifs}</span>
          </div>
          <p className="text-xs text-gray-500">Actifs</p>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <Activity size={16} className="text-gray-400" />
            <span className="text-xl font-light">{totalActivites}</span>
          </div>
          <p className="text-xs text-gray-500">Activités</p>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <Target size={16} className="text-gray-400" />
            <span className="text-xl font-light">{totalPlans}</span>
          </div>
          <p className="text-xs text-gray-500">Plans</p>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <FolderOpen size={16} className="text-gray-400" />
            <span className="text-xl font-light">{totalProjets}</span>
          </div>
          <p className="text-xs text-gray-500">Projets</p>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <Briefcase size={16} className="text-gray-400" />
            <span className="text-xl font-light">{totalDepartements}</span>
          </div>
          <p className="text-xs text-gray-500">Départements</p>
        </div>
      </div>

      {/* Budget Summary */}
      {districtStats?.totalBudget && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-600" />
              <span className="text-xs text-green-600">RECETTES</span>
            </div>
            <p className="text-xl font-light text-green-700">
              {new Intl.NumberFormat('fr-FR').format(districtStats.totalBudget.recettes)} FC
            </p>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3">
            <div className="flex items-center gap-2">
              <TrendingDown size={14} className="text-orange-600" />
              <span className="text-xs text-orange-600">DÉPENSES</span>
            </div>
            <p className="text-xl font-light text-orange-700">
              {new Intl.NumberFormat('fr-FR').format(districtStats.totalBudget.depenses)} FC
            </p>
          </div>
          <div className={`border p-3 ${districtStats.totalBudget.solde >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className={districtStats.totalBudget.solde >= 0 ? 'text-blue-600' : 'text-red-600'} />
              <span className={`text-xs ${districtStats.totalBudget.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>SOLDE</span>
            </div>
            <p className={`text-xl font-light ${districtStats.totalBudget.solde >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {new Intl.NumberFormat('fr-FR').format(districtStats.totalBudget.solde)} FC
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('departements')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'departements' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
          }`}
        >
          Départements ({departementsData.length})
        </button>
        <button
          onClick={() => setActiveMainTab('activites')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'activites' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
          }`}
        >
          Activités ({filteredActivites.length})
        </button>
        <button
          onClick={() => setActiveMainTab('projets')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'projets' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
          }`}
        >
          Projets ({filteredProjets.length})
        </button>
        <button
          onClick={() => setActiveMainTab('statistiques')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'statistiques' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'
          }`}
        >
          Statistiques
        </button>
      </div>

      {/* Contenu - Départements */}
      {activeMainTab === 'departements' && (
        <div className="space-y-4">
          {departementsData.length === 0 ? (
            <div className="bg-white border border-gray-200 py-12 text-center">
              <Briefcase size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Aucun département trouvé</p>
            </div>
          ) : (
            departementsData.map((deptData) => {
              const isExpanded = expandedDepartement === deptData.departement.id
              
              return (
                <div key={deptData.departement.id} className="bg-white border border-gray-200">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedDepartement(isExpanded ? null : deptData.departement.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-lg">{deptData.departement.nom}</h3>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                            {deptData.departement.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Users size={14} />{deptData.stats.totalFideles} fidèles</span>
                          <span className="flex items-center gap-1"><Activity size={14} />{deptData.stats.totalActivites} activités</span>
                          <span className="flex items-center gap-1"><Target size={14} />{deptData.stats.totalPlans} plans</span>
                          <span className="flex items-center gap-1"><FolderOpen size={14} />{deptData.stats.totalProjets} projets</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); openDepartementDetailModal(deptData); }}
                          className="p-2 text-gray-400 hover:text-black"
                        >
                          <Eye size={16} />
                        </button>
                        <ChevronRight size={20} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <h4 className="text-xs font-medium text-gray-600 mb-3">Paroisses du district</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {deptData.paroissesData.map((paroisse: any) => (
                          <Link
                            key={paroisse.paroisse_id}
                            href={`/surintendant/departement/${deptData.departement.id}/paroisse/${paroisse.paroisse_id}?annee=${selectedAnnee || ''}`}
                            className="block bg-white border border-gray-200 p-3 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{paroisse.paroisse_nom}</h5>
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span>{paroisse.data.totalFideles} fidèles</span>
                                  <span>{paroisse.data.activites.length} activités</span>
                                </div>
                              </div>
                              <ChevronRight size={14} className="text-gray-400" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Contenu - Activités */}
      {activeMainTab === 'activites' && (
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
                className={`p-2 border ${showFilters || filterStatut || filterDepartement ? 'border-black bg-gray-50' : 'border-gray-300'}`}
              >
                <Filter size={18} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-4 p-4 border border-gray-200 bg-gray-50 space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600 w-24">Statut :</label>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilterStatut('')} className={`px-3 py-1 text-sm border ${!filterStatut ? 'bg-black text-white border-black' : 'bg-white'}`}>Tous</button>
                  {STATUTS.map(s => (
                    <button key={s.value} onClick={() => setFilterStatut(s.value)} className={`px-3 py-1 text-sm border ${filterStatut === s.value ? 'bg-black text-white border-black' : 'bg-white'}`}>{s.label}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-gray-600 w-24">Département :</label>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setFilterDepartement('')} className={`px-3 py-1 text-sm border ${!filterDepartement ? 'bg-black text-white border-black' : 'bg-white'}`}>Tous</button>
                  {departementsData.map(d => (
                    <button key={d.departement.id} onClick={() => setFilterDepartement(d.departement.id.toString())} className={`px-3 py-1 text-sm border ${filterDepartement === d.departement.id.toString() ? 'bg-black text-white border-black' : 'bg-white'}`}>{d.departement.nom}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === 'calendrier' ? (
<CalendrierView 
  activites={filteredActivites} 
  currentMonth={new Date()} 
  onViewDetails={(activite: any) => { 
    setSelectedActivite(activite); 
    setShowDetailsModal(true); 
  }} 
  statutColors={statutColors} 
  getStatutInfo={getStatutInfo} 
/>
            // <CalendrierView activites={filteredActivites} currentMonth={new Date()} onViewDetails={(a) => { setSelectedActivite(a); setShowDetailsModal(true); }} statutColors={statutColors} getStatutInfo={getStatutInfo} />
          ) : filteredActivites.length === 0 ? (
            <div className="border border-gray-200 py-16 text-center bg-white">
              <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Aucune activité trouvée</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map(date => (
                <div key={date}>
                  <div className="text-sm font-medium text-gray-500 mb-2">{formatDate(date)}</div>
                  <div className="space-y-2">
                    {groupedActivites[date].map((activite: any) => {
                      const statutInfo = getStatutInfo(activite.statut)
                      return (
                        <div key={activite.uniqueKey} className="bg-white border border-gray-200 p-3 hover:border-gray-300 cursor-pointer" onClick={() => { setSelectedActivite(activite); setShowDetailsModal(true); }}>
                          <div className="flex items-start gap-3">
                            <div className="text-center min-w-[50px]">
                              <Clock size={14} className="mx-auto text-gray-400 mb-1" />
                              <span className="text-sm font-medium">{activite.heure}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-medium">{activite.titre}</h3>
                                    <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{activite.paroisse_nom}</span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100">{activite.departement_nom}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 border ${statutInfo.color}`}>{statutInfo.label}</span>
                                  </div>
                                </div>
                                <Eye size={14} className="text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenu - Projets */}
      {activeMainTab === 'projets' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
              />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterProjetStatut} onChange={(e) => setFilterProjetStatut(e.target.value)} className="border border-gray-300 px-3 py-2 text-sm bg-white">
                <option value="">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
              <select value={filterProjetDepartement} onChange={(e) => setFilterProjetDepartement(e.target.value)} className="border border-gray-300 px-3 py-2 text-sm bg-white">
                <option value="">Tous les départements</option>
                {departementsData.map(d => <option key={d.departement.id} value={d.departement.id}>{d.departement.nom}</option>)}
              </select>
            </div>
          </div>

          {filteredProjets.length === 0 ? (
            <div className="border border-gray-200 py-16 text-center bg-white">
              <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400">Aucun projet trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjets.map((projet: any) => {
                const isExpanded = expandedProjet === projet.id
                return (
                  <div key={projet.uniqueKey} className="bg-white border border-gray-200">
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{projet.nom}</h3>
                            <span className="text-xs px-2 py-0.5 bg-gray-100">{projet.paroisse_nom}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100">{projet.departement_nom}</span>
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
                            <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
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
              })}
            </div>
          )}
        </div>
      )}

      {/* Contenu - Statistiques */}
      {activeMainTab === 'statistiques' && districtStats && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700">Statistiques par département</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Département</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Fidèles</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Activités</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Plans</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Projets</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Recettes</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Dépenses</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {districtStats.parDepartement.map((stat: any) => (
                    <tr key={stat.departementId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{stat.departementNom}</td>
                      <td className="py-3 px-4">{stat.totalFideles}</td>
                      <td className="py-3 px-4">{stat.totalActivites}</td>
                      <td className="py-3 px-4">{stat.totalPlansAction}</td>
                      <td className="py-3 px-4">{stat.totalProjets}</td>
                      <td className="py-3 px-4 text-green-600">{new Intl.NumberFormat('fr-FR').format(stat.budgetRecettes)} FC</td>
                      <td className="py-3 px-4 text-orange-600">{new Intl.NumberFormat('fr-FR').format(stat.budgetDepenses)} FC</td>
                      <td className={`py-3 px-4 ${stat.budgetSolde >= 0 ? 'text-green-600' : 'text-red-600'}`}>{new Intl.NumberFormat('fr-FR').format(stat.budgetSolde)} FC</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Activités par statut</h3>
              <div className="space-y-2">
                {Object.entries(districtStats.activitesParStatut).map(([statut, count]) => (
                  <div key={statut} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{statut.replace('_', ' ')}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Projets par statut</h3>
              <div className="space-y-2">
                {Object.entries(districtStats.projetsParStatut).map(([statut, count]) => (
                  <div key={statut} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{statut.replace('_', ' ')}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails activité */}
      {showDetailsModal && selectedActivite && (
        <DetailsModal activite={selectedActivite} onClose={() => { setShowDetailsModal(false); setSelectedActivite(null); }} statutColors={statutColors} getStatutInfo={getStatutInfo} />
      )}

      {/* Modal détails département */}
      {showDepartementDetailModal && selectedDepartementForDetail && (
        <DepartementDetailModal deptData={selectedDepartementForDetail} onClose={() => { setShowDepartementDetailModal(false); setSelectedDepartementForDetail(null); }} />
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
// function CalendrierView({ activites, currentMonth: initialMonth, onViewDetails, statutColors, getStatutInfo }: any) {
//   const [currentMonth, setCurrentMonth] = useState(initialMonth)

//   const getDaysInMonth = (date: Date) => {
//     const year = date.getFullYear()
//     const month = date.getMonth()
//     const firstDay = new Date(year, month, 1)
//     const lastDay = new Date(year, month + 1, 0)
//     const days = []
    
//     const startDay = firstDay.getDay() || 7
//     for (let i = 1; i < startDay; i++) {
//       days.unshift({ date: new Date(year, month, 1 - i), isCurrentMonth: false })
//     }
//     for (let i = 1; i <= lastDay.getDate(); i++) {
//       days.push({ date: new Date(year, month, i), isCurrentMonth: true })
//     }
//     const remainingDays = 42 - days.length
//     for (let i = 1; i <= remainingDays; i++) {
//       days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
//     }
//     return days
//   }

//   const getActivitesForDate = (date: Date) => {
//     const dateStr = date.toISOString().split('T')[0]
//     return activites.filter((a: any) => a.date === dateStr)
//   }

//   const isToday = (date: Date) => {
//     const today = new Date()
//     return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
//   }

//   return (
//     <div className="border border-gray-200 bg-white">
//       <div className="flex items-center justify-between p-4 border-b border-gray-200">
//         <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100"><ChevronLeft size={20} /></button>
//         <h3 className="text-lg font-light">{MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
//         <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100"><ChevronRight size={20} /></button>
//       </div>
//       <div className="grid grid-cols-7 border-b border-gray-200">
//         {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">{day}</div>)}
//       </div>
//       <div className="grid grid-cols-7">
//         {getDaysInMonth(currentMonth).map((day: any, idx: number) => {
//           const activitesDuJour = getActivitesForDate(day.date)
//           return (
//             <div key={idx} className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${!day.isCurrentMonth ? 'bg-gray-50' : ''} ${isToday(day.date) ? 'bg-blue-50/30' : ''}`}>
//               <div className={`text-xs mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>{day.date.getDate()}</div>
//               <div className="space-y-1">
//                 {activitesDuJour.slice(0, 3).map((activite: any) => {
//                   const statutInfo = getStatutInfo(activite.statut)
//                   return (
//                     <button key={activite.uniqueKey} onClick={() => onViewDetails(activite)} className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color}`} title={`${activite.heure} - ${activite.titre}`}>
//                       {activite.heure} {activite.titre}
//                     </button>
//                   )
//                 })}
//                 {activitesDuJour.length > 3 && <div className="text-xs text-gray-400 pl-1">+{activitesDuJour.length - 3}</div>}
//               </div>
//             </div>
//           )
//         })}
//       </div>
//     </div>
//   )
// }


// Remplacer tout le composant CalendrierView par :
function CalendrierView({ 
  activites, 
  currentMonth: initialMonth, 
  onViewDetails, 
  statutColors, 
  getStatutInfo 
}: { 
  activites: any[];
  currentMonth: Date;
  onViewDetails: (activite: any) => void;
  statutColors: Record<string, string>;
  getStatutInfo: (statut: string) => any;
}) {
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

  // Utiliser "activites" au lieu de "filteredActivites"
  const getActivitesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return activites.filter((a: any) => a.date === dateStr)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} 
          className="p-1 hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-light">
          {MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button 
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} 
          className="p-1 hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => 
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        )}
      </div>
      <div className="grid grid-cols-7">
        {getDaysInMonth(currentMonth).map((day: any, idx: number) => {
          const activitesDuJour = getActivitesForDate(day.date)
          return (
            <div 
              key={idx} 
              className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                !day.isCurrentMonth ? 'bg-gray-50' : ''
              } ${
                isToday(day.date) ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className={`text-xs mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1">
                {activitesDuJour.slice(0, 3).map((activite: any) => {
                  const statutInfo = getStatutInfo(activite.statut)
                  return (
                    <button 
                      key={activite.uniqueKey} 
                      onClick={() => onViewDetails(activite)} 
                      className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color}`}
                      title={`${activite.heure} - ${activite.titre}`}
                    >
                      {activite.heure} {activite.titre}
                    </button>
                  )
                })}
                {activitesDuJour.length > 3 && 
                  <div className="text-xs text-gray-400 pl-1">
                    +{activitesDuJour.length - 3}
                  </div>
                }
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
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-medium">{activite.titre}</h2>
              <span className="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 px-2 py-1"><MapPin size={12} />{activite.paroisse_nom}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100">{activite.departement_nom}</span>
            </div>
            {activite.description && <p className="text-gray-600">{activite.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3"><Calendar size={18} className="text-gray-400" /><div><div className="text-xs text-gray-500">Date</div><div className="text-sm">{new Date(activite.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div></div>
            <div className="flex items-center gap-3"><Clock size={18} className="text-gray-400" /><div><div className="text-xs text-gray-500">Heure</div><div className="text-sm">{activite.heure}</div></div></div>
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Statut</div>
            <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 border ${statutInfo.color}`}><span className="mr-1">{statutInfo.icon}</span>{statutInfo.label}</span>
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

// Composant DepartementDetailModal
function DepartementDetailModal({ deptData, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">{deptData.departement.nom}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4">
            <span className="text-xs px-2 py-1 bg-gray-100">{deptData.departement.type}</span>
            {deptData.departement.description && <p className="text-sm text-gray-500 mt-2">{deptData.departement.description}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 text-center"><div className="text-2xl font-light">{deptData.stats.totalFideles}</div><div className="text-xs text-gray-500">Fidèles</div></div>
            <div className="bg-gray-50 p-3 text-center"><div className="text-2xl font-light">{deptData.stats.totalActivites}</div><div className="text-xs text-gray-500">Activités</div></div>
            <div className="bg-gray-50 p-3 text-center"><div className="text-2xl font-light">{deptData.stats.totalProjets}</div><div className="text-xs text-gray-500">Projets</div></div>
          </div>
          <h4 className="text-sm font-medium mb-2">Paroisses</h4>
          <div className="space-y-2">
            {deptData.paroissesData.map((p: any) => (
              <div key={p.paroisse_id} className="border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{p.paroisse_nom}</span>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{p.data.totalFideles} fidèles</span>
                    <span>{p.data.activites.length} activités</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              <span className="text-xs px-2 py-0.5 bg-gray-100">{projet.paroisse_nom}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-100">{projet.departement_nom}</span>
              <span className={`text-xs px-2 py-1 ${projet.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
              </span>
            </div>
            {projet.description && <p className="text-gray-600">{projet.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><div className="text-xs text-gray-500">Date de début</div><div className="text-sm">{new Date(projet.date_debut).toLocaleDateString('fr-FR')}</div></div>
            {projet.date_fin && <div><div className="text-xs text-gray-500">Date de fin</div><div className="text-sm">{new Date(projet.date_fin).toLocaleDateString('fr-FR')}</div></div>}
          </div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Type</div>
            <span className="text-sm px-2 py-1 bg-gray-100">{TYPE_LABELS[projet.type] || projet.type}</span>
          </div>
          {projet.budget && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Budget</div>
              <div className="text-sm">{new Intl.NumberFormat('fr-FR').format(projet.budget.montant)} {projet.budget.currency}</div>
            </div>
          )}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><Paperclip size={14} /> Fichiers ({fichiers.length})</h4>
            {loading ? <Loader2 className="animate-spin" size={16} /> : fichiers.length === 0 ? <p className="text-sm text-gray-400">Aucun fichier</p> : (
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