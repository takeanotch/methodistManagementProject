
// app/chef-conference/district/[districtId]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { 
  Loader2, 
  ChevronLeft, 
  Activity, 
  Target, 
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  Eye,
  FolderOpen,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  Download,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
  FileText,
  Users,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronRight,
  Paperclip,
  Wallet
} from 'lucide-react'
import { getChefConferenceInfo, getDistrictById, getAnneesForConference } from '@/actions/chef-conference'
import { getDepartementUniteForDistrict } from '@/actions/unite-organisation'
import { getActivitesByUnite } from '@/actions/activite'
import { getPlansActionByUnite } from '@/actions/plan-action'
import { getBudgetsByUnite, getUniteBudgetSummary } from '@/actions/budget'
import { getProjetsByUnite, getProjetsStats, getProjetFichiers, getProjetFichierDownloadUrl } from '@/actions/projet'
import { getConfiguration } from '@/actions/configurations'
import { getUserNiveau } from '@/actions/auth' // ← AJOUTER CET IMPORT
import { CURRENCIES, type Currency, formatCurrency } from '@/lib/currency'
import { supabase } from '@/lib/supabase'

// Importer le composant BudgetClientReadOnly depuis le bon chemin
import { BudgetClientReadOnly } from '@/components/BudgetClientReadOnly'
import { Spinner } from '@/components/Spinner'

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

interface BudgetLine {
  id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: Currency
  created_at: string
  annee_conference_id: number
  plan_action_id: number | null
}

export default function ChefConferenceDistrictPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const districtId = parseInt(params.districtId as string)
  const anneeParam = searchParams.get('annee')
  
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<any>(null)
  const [districtInfo, setDistrictInfo] = useState<any>(null)
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'membres' | 'activites' | 'plans' | 'projets' | 'budget'>('membres')
  
  // Données
  const [membresData, setMembresData] = useState<any>({ fideles: [], totalFideles: 0, actifs: 0, inactifs: 0 })
  const [activites, setActivites] = useState<any[]>([])
  const [plansAction, setPlansAction] = useState<any[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [projetsStats, setProjetsStats] = useState<any>({ total: 0, enCours: 0, termines: 0, parType: {} })
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  
  // États pour les activités
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
  const [selectedProjetDetails, setSelectedProjetDetails] = useState<any>(null)
  const [showProjetDetailsModal, setShowProjetDetailsModal] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<number | null>(null)

  // États pour le budget - Nouvelle approche avec BudgetClientReadOnly
  const [budgets, setBudgets] = useState<BudgetLine[]>([])
  const [budgetSummary, setBudgetSummary] = useState<any>(null)
  const [configTaux, setConfigTaux] = useState<number>(2800)
  const [configLoading, setConfigLoading] = useState(true)
  const [userNiveau, setUserNiveau] = useState<'region' | 'conference' | 'district' | 'paroisse' | null>(null) // ← AJOUTER
  const [currentFilter, setCurrentFilter] = useState<'all' | 'recette' | 'depense'>('all')

  useEffect(() => {
    loadData()
  }, [districtId])

  useEffect(() => {
    if (selectedAnnee && uniteId) {
      loadBudgetData()
    }
  }, [selectedAnnee, uniteId])

  // ← AJOUTER : Charger le niveau utilisateur
  useEffect(() => {
    async function loadUserNiveau() {
      try {
        const niveau = await getUserNiveau()
        console.log('👤 Chef Conference - Niveau utilisateur récupéré:', niveau)
        setUserNiveau(niveau)
      } catch (error) {
        console.error('Erreur récupération niveau:', error)
        // Valeur par défaut pour le chef de conférence
        setUserNiveau('conference')
      }
    }
    
    loadUserNiveau()
  }, [])

  async function loadConfiguration() {
    try {
      const config = await getConfiguration(uniteId!)
      if (config) {
        setConfigTaux(config.taux)
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  async function loadBudgetData() {
    if (!uniteId || !selectedAnnee) return
    try {
      const [budgetsData, summaryData] = await Promise.all([
        getBudgetsByUnite(uniteId, selectedAnnee),
        getUniteBudgetSummary(uniteId, selectedAnnee)
      ])
      setBudgets(budgetsData)
      setBudgetSummary(summaryData)
    } catch (error) {
      console.error('Erreur chargement budget:', error)
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      
      const info = await getChefConferenceInfo()
      if (!info) {
        setLoading(false)
        return
      }
      setChefInfo(info)

      const district = await getDistrictById(districtId)
      setDistrictInfo(district)

      if (district?.conference_id !== info.conference_id) {
        setLoading(false)
        return
      }

      const annees = await getAnneesForConference(info.conference_id)
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

      if (anneeId && anneeId.toString() !== anneeParam) {
        router.replace(`/chef-conference/district/${districtId}?annee=${anneeId}`)
      }

      const unite = await getDepartementUniteForDistrict(info.departement_id, districtId)
      if (unite?.id) {
        setUniteId(unite.id)
        await loadConfiguration()
        if (anneeId) {
          await loadDistrictData(unite.id, anneeId, info.departement_id)
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
    }
  }

  async function loadDistrictData(uId: number, anneeId: number, departementId: number) {
    // Récupérer les membres du district
    await loadMembresData(districtId, departementId, anneeId)
    
    const [
      activitesResult,
      plansResult,
      projetsResult,
      projetsStatsResult
    ] = await Promise.all([
      getActivitesByUnite(uId, anneeId),
      getPlansActionByUnite(uId, anneeId),
      getProjetsByUnite(uId, anneeId),
      getProjetsStats(uId, anneeId)
    ])
    
    setActivites(activitesResult)
    setPlansAction(plansResult)
    setProjets(projetsResult)
    setProjetsStats(projetsStatsResult)
  }

  async function loadMembresData(districtId: number, departementId: number, anneeConferenceId: number) {
    try {
      console.log('📋 Chargement des chefs de district:', { districtId, departementId })
      
      const { data: chefs, error: chefsError } = await supabase
        .from('chef_departement')
        .select(`
          id,
          fidele_id,
          departement_id,
          district_id,
          role_id,
          est_actif,
          date_nomination,
          date_fin
        `)
        .eq('departement_id', departementId)
        .eq('district_id', districtId)
        .eq('niveau', 'district')

      if (chefsError) {
        console.error('Erreur chargement chefs de district:', chefsError)
        setMembresData({ 
          fideles: [], 
          totalFideles: 0, 
          actifs: 0, 
          inactifs: 0 
        })
        return
      }

      if (!chefs || chefs.length === 0) {
        console.log('Aucun chef trouvé pour ce district')
        setMembresData({ 
          fideles: [], 
          totalFideles: 0, 
          actifs: 0, 
          inactifs: 0 
        })
        return
      }

      console.log(`${chefs.length} chefs trouvés`)
      
      const fideleIds = chefs.map(c => c.fidele_id).filter(Boolean)
      
      const { data: fideles, error: fidelesError } = await supabase
        .from('fidele')
        .select('id, nom, post_nom, prenom, contact, profile_img, sexe, actif')
        .in('id', fideleIds)
      
      if (fidelesError) {
        console.error('Erreur chargement fideles:', fidelesError)
      }
      
      const fidelesMap = new Map()
      if (fideles) {
        fideles.forEach(f => fidelesMap.set(f.id, f))
      }
      
      const roleIds = chefs.map(c => c.role_id).filter(Boolean)
      let rolesMap = new Map()
      
      if (roleIds.length > 0) {
        const { data: roles } = await supabase
          .from('role_config')
          .select('id, nom_role, label_role')
          .in('id', roleIds)
        
        if (roles) {
          roles.forEach(r => rolesMap.set(r.id, r))
        }
      }
      
      const { data: district } = await supabase
        .from('district')
        .select('nom')
        .eq('id', districtId)
        .single()
      
      const districtNom = district?.nom || 'District inconnu'
      
      const fidelesData: any[] = []
      
      for (const chef of chefs) {
        const fidele = fidelesMap.get(chef.fidele_id)
        const role = rolesMap.get(chef.role_id)
        
        fidelesData.push({
          id: chef.id,
          fidele_id: chef.fidele_id,
          fidele: fidele || null,
          role: role || null,
          district_nom: districtNom,
          est_actif: chef.est_actif,
          date_nomination: chef.date_nomination,
          date_fin: chef.date_fin
        })
      }
      
      const totalFideles = fidelesData.length
      const actifs = fidelesData.filter((f: any) => f.est_actif).length
      
      setMembresData({ 
        fideles: fidelesData, 
        totalFideles, 
        actifs, 
        inactifs: totalFideles - actifs 
      })
      
    } catch (error) {
      console.error('Erreur inattendue loadMembresData:', error)
      setMembresData({ 
        fideles: [], 
        totalFideles: 0, 
        actifs: 0, 
        inactifs: 0 
      })
    }
  }

  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    router.replace(`/chef-conference/district/${districtId}?annee=${anneeId}`)
    if (uniteId && chefInfo) {
      setLoading(true)
      await loadDistrictData(uniteId, anneeId, chefInfo.departement_id)
      setLoading(false)
    }
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
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error)
    } finally {
      setDownloadingFile(null)
    }
  }

  function openProjetDetailsModal(projet: any) {
    setSelectedProjetDetails(projet)
    setShowProjetDetailsModal(true)
    if (!projetFichiers[projet.id]) {
      loadProjetFichiers(projet.id)
    }
  }

  function getFileIcon(typeFichier: string) {
    if (typeFichier.startsWith('image/')) return <ImageIcon size={16} className="text-blue-500" />
    if (typeFichier.includes('pdf')) return <FileText size={16} className="text-red-500" />
    if (typeFichier.includes('spreadsheet') || typeFichier.includes('excel')) return <FileSpreadsheet size={16} className="text-green-500" />
    if (typeFichier.includes('document') || typeFichier.includes('word')) return <FileText size={16} className="text-blue-500" />
    return <File size={16} className="text-gray-500" />
  }

  function formatFileSize(bytes: number | null): string {
    if (!bytes) return 'N/A'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Filtrer les activités
  const filteredActivites = activites.filter((activite: any) => {
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

  const statutColors: Record<string, string> = {
    planifie: 'bg-blue-50 text-blue-700 border-blue-200',
    en_cours: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    termine: 'bg-green-50 text-green-700 border-green-200',
    annule: 'bg-red-50 text-red-700 border-red-200'
  }

  const selectedAnneeLabel = anneesDisponibles.find(a => a.id === selectedAnnee)?.label || ''

  if (loading || configLoading) {
    return (
     <Spinner/>
    )
  }

  if (!chefInfo || !districtInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-medium mb-2">Accès non autorisé</h2>
          <Link href="/chef-conference" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          href="/chef-conference"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
        >
          <ChevronLeft size={18} />
          Retour à la liste de districts
        </Link>
        <div className="flex items-center gap-3">
          <Building2 size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              District de {districtInfo.nom}
            </h1>
            <p className="text-sm text-gray-500">
              {chefInfo.departement_nom} • {chefInfo.conference_nom}
            </p>
          </div>
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
          {selectedAnnee && (
            <span className="text-xs text-gray-500">
              Affichage des données pour {selectedAnneeLabel}
            </span>
          )}
        </div>
      )}

      {!uniteId && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700">
          <AlertCircle size={16} className="inline mr-2" />
          L'unité du département pour ce district n'est pas encore configurée.
        </div>
      )}

      {!selectedAnnee && anneesDisponibles.length > 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Veuillez sélectionner une année pour voir les données</p>
        </div>
      ) : (
        <>
          {/* Stats - SANS LE BUDGET */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <Users size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{membresData.totalFideles}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total membres</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <UserCheck size={18} className="text-green-600" />
                <span className="text-2xl font-light text-green-700">{membresData.actifs}</span>
              </div>
              <p className="text-xs text-green-600">Actifs</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <UserX size={18} className="text-gray-400" />
                <span className="text-2xl font-light text-gray-500">{membresData.inactifs}</span>
              </div>
              <p className="text-xs text-gray-500">Inactifs</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <Activity size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{activites.length}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Activités</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-gray-200 overflow-x-auto">
            <button onClick={() => setActiveTab('membres')} className={`px-1 py-3 text-sm whitespace-nowrap ${activeTab === 'membres' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}>
              Membres ({membresData.totalFideles})
            </button>
            <button onClick={() => setActiveTab('activites')} className={`px-1 py-3 text-sm whitespace-nowrap ${activeTab === 'activites' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}>
              Activités ({activites.length})
            </button>
            <button onClick={() => setActiveTab('plans')} className={`px-1 py-3 text-sm whitespace-nowrap ${activeTab === 'plans' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}>
              Plans d'action ({plansAction.length})
            </button>
            <button onClick={() => setActiveTab('projets')} className={`px-1 py-3 text-sm whitespace-nowrap ${activeTab === 'projets' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}>
              Projets ({projets.length})
            </button>
            <button onClick={() => setActiveTab('budget')} className={`px-1 py-3 text-sm whitespace-nowrap ${activeTab === 'budget' ? 'font-medium text-black border-b-2 border-black' : 'text-gray-500 hover:text-black'}`}>
              Budget {budgets.length > 0 && `(${budgets.length})`}
            </button>
          </div>

          <div>
            {/* TAB MEMBRES */}
            {activeTab === 'membres' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 w-12"></th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Nom</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rôle</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membresData.fideles?.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          Aucun membre dans ce district
                        </td>
                      </tr>
                    ) : ( membresData.fideles.map((affectation: any) => {
                        const fidele = affectation.fidele
                        return (
                          <tr key={affectation.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <Link href={`/paroisse/fideles/${fidele?.id}`}>
                                  {fidele?.profile_img ? (
                                    <img
                                      src={fidele.profile_img}
                                      alt={`${fidele.prenom} ${fidele.nom}`}
                                      className="w-10 h-10  shrink-0 rounded-full object-cover border border-gray-200"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm border border-gray-200">
                                      {fidele?.prenom?.[0] || fidele?.nom?.[0] || '?'}
                                    </div>
                                  )}
                                </Link>
                              </td>
                                                        
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{fidele?.prenom} {fidele?.nom}</div>
                                {fidele?.post_nom && (
                                  <div className="text-xs text-gray-400">{fidele.post_nom}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {affectation.role?.label_role || affectation.role?.nom_role || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-500">
                              {fidele?.contact || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {affectation.est_actif ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <CheckCircle size={12} />
                                  Actif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                                  <XCircle size={12} />
                                  Inactif
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
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex border border-gray-300">
                      <button onClick={() => setCurrentView('liste')} className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'liste' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>
                        <List size={14} /> Liste
                      </button>
                      <button onClick={() => setCurrentView('calendrier')} className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'calendrier' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}>
                        <LayoutGrid size={14} /> Calendrier
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black" />
                    </div>
                    <button onClick={() => setShowFilters(!showFilters)} className={`p-2 border ${showFilters || filterStatut ? 'border-black bg-gray-50' : 'border-gray-300'} hover:border-black`}>
                      <Filter size={18} />
                    </button>
                  </div>
                </div>

                {showFilters && (
                  <div className="mb-6 p-4 border border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-gray-600">Statut :</label>
                      <div className="flex gap-2">
                        <button onClick={() => setFilterStatut('')} className={`px-3 py-1 text-sm border ${!filterStatut ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}>
                          Tous
                        </button>
                        {STATUTS.map(statut => (
                          <button key={statut.value} onClick={() => setFilterStatut(statut.value)} className={`px-3 py-1 text-sm border ${filterStatut === statut.value ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}>
                            {statut.label}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => setShowFilters(false)} className="ml-auto text-sm text-gray-500 hover:text-black">
                        Fermer
                      </button>
                    </div>
                  </div>
                )}

                {currentView === 'calendrier' ? (
                  <CalendrierView activites={filteredActivites} currentMonth={new Date()} onViewDetails={(a: any) => { setSelectedActivite(a); setShowDetailsModal(true); }} statutColors={statutColors} getStatutInfo={getStatutInfo} />
                ) : filteredActivites.length === 0 ? (
                  <div className="border border-gray-200 py-16 text-center bg-white">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 mb-4">Aucune activité pour {selectedAnneeLabel}</p>
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
                                <div key={activite.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer" onClick={() => { setSelectedActivite(activite); setShowDetailsModal(true); }}>
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
                                            <span className="mr-1">{statutInfo.icon}</span>
                                            {statutInfo.label}
                                          </span>
                                          {isEnRetard && <span className="text-xs text-orange-600 font-medium">En retard</span>}
                                          <button className="p-1 text-gray-400 hover:text-black">
                                            <Eye size={16} />
                                          </button>
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
                {plansAction.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200">
                    <Target size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucun plan d'action pour {selectedAnneeLabel}</p>
                  </div>
                ) : (
                  plansAction.map((plan: any) => (
                    <div key={plan.id} className="bg-white border border-gray-200 p-4">
                      <h3 className="font-medium">{plan.titre}</h3>
                      {plan.description && <p className="text-sm text-gray-500 mt-1">{plan.description}</p>}
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB PROJETS */}
            {activeTab === 'projets' && (
              <div className="space-y-4">
                {projets.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200">
                    <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucun projet pour {selectedAnneeLabel}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 p-4 text-center">
                        <div className="text-2xl font-light text-blue-700">{projetsStats.total || 0}</div>
                        <div className="text-xs text-blue-600">Total projets</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 text-center">
                        <div className="text-2xl font-light text-yellow-700">{projetsStats.enCours || 0}</div>
                        <div className="text-xs text-yellow-600">En cours</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 p-4 text-center">
                        <div className="text-2xl font-light text-green-700">{projetsStats.termines || 0}</div>
                        <div className="text-xs text-green-600">Terminés</div>
                      </div>
                    </div>
                    
                    {projets.map((projet: any) => {
                      const isExpanded = expandedProjet === projet.id
                      const fichiers = projetFichiers[projet.id] || []
                      const isLoadingFichiers = loadingFichiers[projet.id] || false
                      
                      return (
                        <div key={projet.id} className="bg-white border border-gray-200">
                          <div className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{projet.nom}</h3>
                                  <span className={`text-xs px-2 py-1 ${projet.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                                    {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-gray-100">{TYPE_LABELS[projet.type] || projet.type}</span>
                                </div>
                                {projet.description && <p className="text-sm text-gray-500 mt-1">{projet.description}</p>}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>Début: {new Date(projet.date_debut).toLocaleDateString('fr-FR')}</span>
                                  {projet.date_fin && <span>Fin: {new Date(projet.date_fin).toLocaleDateString('fr-FR')}</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => toggleProjetExpanded(projet.id)} className="flex items-center gap-1 px-3 py-1 text-xs border border-gray-300 hover:border-black hover:bg-gray-50 transition-colors">
                                  <Paperclip size={12} />
                                  Fichiers {fichiers.length > 0 && `(${fichiers.length})`}
                                  <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                <button onClick={() => openProjetDetailsModal(projet)} className="p-1 text-gray-400 hover:text-black" title="Voir les détails">
                                  <Eye size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                              <h4 className="text-xs font-medium text-gray-600 mb-3 flex items-center gap-2">
                                <Paperclip size={12} />
                                Fichiers attachés
                              </h4>
                              
                              {isLoadingFichiers ? (
                                <div className="flex justify-center py-4">
                                  <Loader2 className="animate-spin text-gray-400" size={20} />
                                </div>
                              ) : fichiers.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">Aucun fichier attaché à ce projet</p>
                              ) : (
                                <div className="space-y-2">
                                  {fichiers.map((fichier: any) => (
                                    <div key={fichier.id} className="flex items-center justify-between bg-white border border-gray-200 p-3 hover:border-gray-300">
                                      <div className="flex items-center gap-3">
                                        {getFileIcon(fichier.type_fichier)}
                                        <div>
                                          <p className="text-sm font-medium">{fichier.nom_fichier}</p>
                                          <p className="text-xs text-gray-400">
                                            {formatFileSize(fichier.taille_fichier)} • 
                                            {new Date(fichier.uploaded_at).toLocaleDateString('fr-FR')}
                                          </p>
                                        </div>
                                      </div>
                                      <button onClick={() => handleDownloadFichier(fichier.id, fichier.nom_fichier)} disabled={downloadingFile === fichier.id} className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 transition-colors" title="Télécharger">
                                        {downloadingFile === fichier.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
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
                  </>
                )}
              </div>
            )}

            {/* TAB BUDGET - Utilisation du composant BudgetClientReadOnly avec userNiveau */}
            {activeTab === 'budget' && (
              <div>
                {uniteId && selectedAnnee ? (
                  <BudgetClientReadOnly 
                    uniteId={uniteId}
                    departementId={chefInfo.departement_id}
                    userNiveau={userNiveau} // ← PASSER LE NIVEAU UTILISATEUR
                    anneesDisponibles={anneesDisponibles}
                    anneeConferenceId={selectedAnnee}
                    budgets={budgets}
                    summary={budgetSummary}
                    currentFilter={currentFilter}
                  />
                ) : (
                  <div className="border border-gray-200 py-16 text-center bg-white">
                    <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Configuration incomplète</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal détails activité */}
      {showDetailsModal && selectedActivite && (
        <ActiviteDetailsModal
          activite={selectedActivite}
          onClose={() => { setShowDetailsModal(false); setSelectedActivite(null); }}
          statutColors={statutColors}
          getStatutInfo={getStatutInfo}
        />
      )}

      {/* Modal détails projet */}
      {showProjetDetailsModal && selectedProjetDetails && (
        <ProjetDetailsModal
          projet={selectedProjetDetails}
          fichiers={projetFichiers[selectedProjetDetails.id] || []}
          loadingFichiers={loadingFichiers[selectedProjetDetails.id] || false}
          onClose={() => { setShowProjetDetailsModal(false); setSelectedProjetDetails(null); }}
          onDownload={handleDownloadFichier}
          downloadingFile={downloadingFile}
          getFileIcon={getFileIcon}
          formatFileSize={formatFileSize}
          typeLabels={TYPE_LABELS}
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
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-1 hover:bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-light">{MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-1 hover:bg-gray-100">
          <ChevronRight size={20} />
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
                    <button key={activite.id} onClick={() => onViewDetails(activite)} className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color} cursor-pointer hover:opacity-80`} title={`${activite.heure} - ${activite.titre}`}>
                      {activite.heure} {activite.titre}
                    </button>
                  )
                })}
                {activitesDuJour.length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">+{activitesDuJour.length - 3} autre(s)</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant ActiviteDetailsModal
function ActiviteDetailsModal({ activite, onClose, statutColors, getStatutInfo }: any) {
  const statutInfo = getStatutInfo(activite.statut)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Détails de l'activité</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xl font-medium mb-2">{activite.titre}</h2>
          {activite.description && <p className="text-gray-600 mb-4">{activite.description}</p>}
          {activite.plan_action && (
            <p className="text-sm text-gray-500 mb-4">Plan d'action: {activite.plan_action.titre}</p>
          )}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="text-sm">{formatDate(activite.date)}</div>
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
              <span className="mr-1">{statutInfo.icon}</span>
              {statutInfo.label}
            </span>
          </div>
          {activite.commentaire && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Commentaire</div>
              <div className="bg-gray-50 p-3 border border-gray-200 text-sm text-gray-700">{activite.commentaire}</div>
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

// Composant ProjetDetailsModal
function ProjetDetailsModal({ projet, fichiers, loadingFichiers, onClose, onDownload, downloadingFile, getFileIcon, formatFileSize, typeLabels }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Détails du projet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xl font-medium mb-2">{projet.nom}</h2>
          {projet.description && <p className="text-gray-600 mb-4">{projet.description}</p>}
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Type</div>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm">{typeLabels[projet.type] || projet.type}</span>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Statut</div>
              <span className={`px-2 py-1 text-sm ${projet.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Date de début</div>
              <div className="text-sm">{new Date(projet.date_debut).toLocaleDateString('fr-FR')}</div>
            </div>
            {projet.date_fin && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Date de fin prévue</div>
                <div className="text-sm">{new Date(projet.date_fin).toLocaleDateString('fr-FR')}</div>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Paperclip size={14} />
              Fichiers attachés ({fichiers.length})
            </h4>
            
            {loadingFichiers ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" size={24} /></div>
            ) : fichiers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun fichier attaché à ce projet</p>
            ) : (
              <div className="space-y-2">
                {fichiers.map((fichier: any) => (
                  <div key={fichier.id} className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 hover:border-gray-300">
                    <div className="flex items-center gap-3">
                      {getFileIcon(fichier.type_fichier)}
                      <div>
                        <p className="text-sm font-medium">{fichier.nom_fichier}</p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(fichier.taille_fichier)} • Ajouté le {new Date(fichier.uploaded_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => onDownload(fichier.id, fichier.nom_fichier)} disabled={downloadingFile === fichier.id} className="p-2 text-gray-500 hover:text-black hover:bg-gray-200">
                      {downloadingFile === fichier.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
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