

// app/paroisse/departements/[id]/page.tsx

'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
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
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  DollarSign,
  Wallet,
  Receipt
} from 'lucide-react'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getDepartementUnite } from '@/actions/unite-organisation'
import { getActivitesByUnite, getActivitesStats } from '@/actions/activite'
import { getPlansActionByUnite } from '@/actions/plan-action'
import { getProjetsByUnite, getProjetsStats } from '@/actions/projet'
import { getUniteBudgetSummary, getBudgetsByUnite, getRealiseTotals } from '@/actions/budget'
import { getAnneesConferenceDisponiblesForDepartement, getCurrentAnneeConferenceForDepartement } from '@/actions/fidele-departement'
import { getBudgetMouvementSummary } from '@/actions/finance'
import { getConfiguration } from '@/actions/configurations'
import { type Currency, formatCurrency } from '@/lib/currency'
import { supabase } from '@/lib/supabase'
import { BudgetClientReadOnly } from '@/components/BudgetClientReadOnly'
import { getUserNiveau } from '@/actions/auth'
import { Spinner } from '@/components/Spinner'


interface PageProps {
  params: Promise<{ id: string }>
}

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

export default function DepartementDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const anneeParam = searchParams.get('annee_conference')
  const departementId = parseInt(id)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fidele, setFidele] = useState<any>(null)
  const [paroisseId, setParoisseId] = useState<number | null>(null)
  const [departement, setDepartement] = useState<any>(null)
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  
  // Données
  const [activites, setActivites] = useState<any[]>([])
  const [activitesStats, setActivitesStats] = useState<any>(null)
  const [plansAction, setPlansAction] = useState<any[]>([])
  const [projets, setProjets] = useState<any[]>([])
  const [projetsStats, setProjetsStats] = useState<any>(null)
  const [budgetSummary, setBudgetSummary] = useState<any>(null)
  const [budgets, setBudgets] = useState<BudgetLine[]>([])
  const [realiseTotals, setRealiseTotals] = useState({ recettes: 0, depenses: 0 })
  const [membresData, setMembresData] = useState<any>(null)
  const [configTaux, setConfigTaux] = useState<number>(2800)
  
  const [activeTab, setActiveTab] = useState<'membres' | 'activites' | 'plans' | 'projets' | 'budget'>('membres')
  
  // États pour la vue activités
  const [currentView, setCurrentView] = useState<'liste' | 'calendrier'>('liste')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedActivite, setSelectedActivite] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  
  // États pour le budget
  const [currentFilter, setCurrentFilter] = useState<'all' | 'recette' | 'depense'>('all')
  const [selectedBudget, setSelectedBudget] = useState<BudgetLine | null>(null)
  const [showBudgetDetailsModal, setShowBudgetDetailsModal] = useState(false)
  const [budgetMouvements, setBudgetMouvements] = useState<any[]>([])
  const [budgetMouvementSummary, setBudgetMouvementSummary] = useState<any>(null)
  const [budgetDetailsLoading, setBudgetDetailsLoading] = useState(false)



 const [userNiveau, setUserNiveau] = useState<'region' | 'conference' | 'district' | 'paroisse' | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [departementId])

  useEffect(() => {
    if (uniteId && selectedAnnee !== null && paroisseId) {
      loadDepartementData()
    }
  }, [uniteId, selectedAnnee, paroisseId])

  useEffect(() => {
    if (selectedAnnee && uniteId) {
      loadBudgetData()
      loadConfiguration()
    }
  }, [selectedAnnee, uniteId])

  async function loadConfiguration() {
    if (!uniteId) return
    try {
      const config = await getConfiguration(uniteId)
      if (config) {
        setConfigTaux(config.taux)
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error)
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
      setRealiseTotals(totalsData)
      setBudgetSummary(summaryData)
    } catch (error) {
      console.error('Erreur chargement budget:', error)
    }
  }

  async function loadInitialData() {
    try {
      setLoading(true)
      setError(null)
       const niveau = await getUserNiveau()
         console.log('👤 Niveau utilisateur récupéré:', niveau) 
      setUserNiveau(niveau)
      
      if (isNaN(departementId) || departementId <= 0) {
        setError('ID de département invalide')
        setLoading(false)
        return
      }
      
      const fideleData = await getCurrentFidele()
      
      if (!fideleData) {
        setError('Veuillez vous connecter')
        setLoading(false)
        return
      }
      
      setFidele(fideleData)
      setParoisseId(fideleData.paroisse_id)
      
      const dept = await getDepartementById(departementId)
      
      if (!dept) {
        setError(`Département non trouvé (ID: ${departementId})`)
        setLoading(false)
        return
      }
      
      setDepartement(dept)
      
      const unite = await getDepartementUnite(departementId, fideleData.paroisse_id)
      
      if (!unite) {
        setError(`Unité d'organisation non trouvée pour ce département`)
        setLoading(false)
        return
      }
      
      setUniteId(unite.id)
      
      await loadAnneesDisponibles()
      
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur loadInitialData:', error)
      setError('Une erreur est survenue lors du chargement')
      setLoading(false)
    }
  }

  async function loadAnneesDisponibles() {
    try {
      const annees = await getAnneesConferenceDisponiblesForDepartement(departementId)
      setAnneesDisponibles(annees)
      
      let anneeId: number | null = null
      
      if (anneeParam && !isNaN(parseInt(anneeParam))) {
        anneeId = parseInt(anneeParam)
        const anneeExiste = annees.some(a => a.id === anneeId)
        if (!anneeExiste) {
          const currentAnnee = await getCurrentAnneeConferenceForDepartement(departementId)
          anneeId = currentAnnee?.id || (annees[0]?.id || null)
        }
      } else {
        const currentAnnee = await getCurrentAnneeConferenceForDepartement(departementId)
        anneeId = currentAnnee?.id || (annees[0]?.id || null)
      }
      
      setSelectedAnnee(anneeId)
      
      if (anneeId && anneeId.toString() !== anneeParam) {
        router.replace(`/paroisse/in/departements/${departementId}?annee_conference=${anneeId}`)
      }
      
    } catch (error) {
      console.error('Erreur loadAnneesDisponibles:', error)
      setAnneesDisponibles([])
    }
  }

 


  async function loadDepartementData() {
    if (!uniteId || !selectedAnnee || !paroisseId) return
    
    try {
      setLoading(true)
      
      // ✅ CORRECTION : Utiliser annee_conference_id au lieu de juste est_actif
      const { data: affectations, error: affError } = await supabase
        .from('fidele_departement')
        .select(`
          *,
          fidele:fidele_id (
            id,
            nom,
            post_nom,
            prenom,
            contact,
            profile_img,
            sexe,
            actif
          )
        `)
        .eq('departement_id', departementId)
        .eq('paroisse_id', paroisseId)
        .eq('annee_conference_id', selectedAnnee)  // ← AJOUT : Filtrer par année de conférence
        .eq('est_actif', true)
      
      if (affError) {
        console.error('Erreur chargement membres:', affError)
      }
      
      // Ajouter des logs pour déboguer
      console.log(`📊 Membres trouvés pour annee_conference_id=${selectedAnnee}: ${affectations?.length || 0}`)
      
      const fideles = (affectations || []).map((aff: any) => {
        const fidele = Array.isArray(aff.fidele) ? aff.fidele[0] : aff.fidele
        const roleDetails = departement?.roles_config?.find((r: any) => r.id === aff.role_id)
        return {
          ...aff,
          fidele,
          role_details: roleDetails
        }
      })
      
      const totalFideles = fideles.length
      const actifs = fideles.filter((f: any) => f.est_actif).length
      const inactifs = totalFideles - actifs
      
      setMembresData({ fideles, totalFideles, actifs, inactifs })
      
      // Charger les activités
      const activitesData = await getActivitesByUnite(uniteId, selectedAnnee)
      setActivites(activitesData)
      
      // Charger les stats des activités
      const statsData = await getActivitesStats(undefined, uniteId, selectedAnnee)
      setActivitesStats(statsData)
      
      // Charger les plans d'action
      const plansData = await getPlansActionByUnite(uniteId, selectedAnnee)
      setPlansAction(plansData)
      
      // Charger les projets
      const projetsData = await getProjetsByUnite(uniteId, selectedAnnee)
      setProjets(projetsData)
      
      // Charger les stats des projets
      const projetsStatsData = await getProjetsStats(uniteId, selectedAnnee)
      setProjetsStats(projetsStatsData)
      
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur loadDepartementData:', error)
      setLoading(false)
    }
  }

  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    router.replace(`/paroisse/in/departements/${departementId}?annee_conference=${anneeId}`)
  }

  function openDetailsModal(activite: any) {
    setSelectedActivite(activite)
    setShowDetailsModal(true)
  }

  async function openBudgetDetailsModal(budget: BudgetLine) {
    setSelectedBudget(budget)
    setBudgetDetailsLoading(true)
    const [mouv, summ] = await Promise.all([
      getMouvementsByBudget(budget.id),
      getBudgetMouvementSummary(budget.id)
    ])
    setBudgetMouvements(mouv)
    setBudgetMouvementSummary(summ)
    setBudgetDetailsLoading(false)
    setShowBudgetDetailsModal(true)
  }

  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    return montant * configTaux
  }

  const formatWithCDF = (montant: number, currency: Currency) => {
    const formatted = formatCurrency(montant, currency)
    if (currency !== 'CDF') {
      const cdfAmount = convertToCDF(montant, currency)
      return `${formatted} (${formatCurrency(cdfAmount, 'CDF')})`
    }
    return formatted
  }

  const recettes = budgets.filter(b => b.type === 'recette')
  const depenses = budgets.filter(b => b.type === 'depense')
  const filteredBudgets = currentFilter === 'recette' ? recettes : currentFilter === 'depense' ? depenses : budgets

  const totalRecettesPrevu = recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)
  const totalDepensesPrevu = depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)

  const progressionRecettes = totalRecettesPrevu > 0 ? (realiseTotals.recettes / totalRecettesPrevu) * 100 : 0
  const progressionDepenses = totalDepensesPrevu > 0 ? (realiseTotals.depenses / totalDepensesPrevu) * 100 : 0

  const statutColors: Record<string, string> = {
    planifie: 'bg-blue-50 text-blue-700 border-blue-200',
    en_cours: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    termine: 'bg-green-50 text-green-700 border-green-200',
    annule: 'bg-red-50 text-red-700 border-red-200'
  }

  const typeLabels: Record<string, string> = {
    court_terme: 'Court terme',
    moyen_terme: 'Moyen terme',
    long_terme: 'Long terme'
  }

  const filteredActivites = (activites || []).filter((activite: any) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = activite.titre.toLowerCase().includes(searchLower) ||
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

  const selectedAnneeLabel = anneesDisponibles.find(a => a.id === selectedAnnee)?.label || ''
  const totalFideles = membresData?.totalFideles || 0
  const actifs = membresData?.actifs || 0
  const inactifs = membresData?.inactifs || 0

  if (loading) {
    return (
      <Spinner/>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-medium mb-2">Erreur</h2>
          <p className="text-gray-500">{error}</p>
          <Link href="/paroisse/departements" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour aux départements
          </Link>
        </div>
      </div>
    )
  }

  if (!fidele) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-medium mb-2">Non connecté</h2>
          <p className="text-gray-500">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    )
  }

  if (!departement) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-400">Département non trouvé</p>
          <Link href="/paroisse/departements" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour aux départements
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

       <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-sm">
        <span className="font-medium">🔍 Débogage - Niveau utilisateur : </span>
        <span className={`ml-2 px-2 py-0.5 rounded ${
          userNiveau === 'region' ? 'bg-purple-100 text-purple-800' :
          userNiveau === 'conference' ? 'bg-blue-100 text-blue-800' :
          userNiveau === 'district' ? 'bg-green-100 text-green-800' :
          userNiveau === 'paroisse' ? 'bg-orange-100 text-orange-800' :
          'bg-red-100 text-red-800'
        }`}>
          {userNiveau ? userNiveau : 'NULL - Non défini'}
        </span>
        <button 
          onClick={async () => {
            const niveau = await getUserNiveau()
            console.log('🔄 Re-test getUserNiveau:', niveau)
            alert(`Niveau: ${niveau || 'NULL'}`)
          }}
          className="ml-4 text-xs underline"
        >
          Re-tester
        </button>
      </div>
   
      <div className="mb-6">
        <Link
          href="/paroisse/departements"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
        >
          <ChevronLeft size={18} />
          Retour aux départements
        </Link>
        <h1 className="text-2xl font-light tracking-wide">{departement.nom}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {departement.type === 'commite' ? 'Comité' : 
           departement.type === 'agence_programme' ? 'Agence programme' : 'Département'}
        </p>
        {departement.description && (
          <p className="text-sm text-gray-500 mt-2">{departement.description}</p>
        )}
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

      {!selectedAnnee && anneesDisponibles.length > 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Veuillez sélectionner une année pour voir les données</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <Users size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{totalFideles}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total membres</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 p-4">
              <div className="flex items-center justify-between">
                <UserCheck size={18} className="text-green-600" />
                <span className="text-2xl font-light text-green-700">{actifs}</span>
              </div>
              <p className="text-xs text-green-600">Actifs</p>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <UserX size={18} className="text-gray-400" />
                <span className="text-2xl font-light text-gray-500">{inactifs}</span>
              </div>
              <p className="text-xs text-gray-500">Inactifs</p>
            </div>
            
            <div className="bg-white border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <Activity size={18} className="text-gray-400" />
                <span className="text-2xl font-light">{activites?.length || 0}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Activités</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('membres')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'membres' 
                  ? 'font-medium text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Membres ({totalFideles})
            </button>
            <button
              onClick={() => setActiveTab('activites')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'activites' 
                  ? 'font-medium text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Activités ({activites?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'plans' 
                  ? 'font-medium text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Plans d'action ({plansAction?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('projets')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'projets' 
                  ? 'font-medium text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Projets ({projets?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={`px-1 py-3 text-sm transition-colors whitespace-nowrap ${
                activeTab === 'budget' 
                  ? 'font-medium text-black border-b-2 border-black' 
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Budget
            </button>
          </div>

          {/* Contenu des tabs */}
          <div>
            {/* TAB MEMBRES */}
            {/* {activeTab === 'membres' && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Nom</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Rôle</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!membresData?.fideles || membresData.fideles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-400">
                          Aucun membre dans ce département
                        </td>
                      </tr>
                    ) : (
                      membresData.fideles.map((affectation: any) => {
                        const fidele = affectation.fidele
                        return (
                          <tr key={affectation.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{fidele?.prenom} {fidele?.nom}</div>
                                {fidele?.post_nom && (
                                  <div className="text-xs text-gray-400">{fidele.post_nom}</div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {affectation.role_details?.label || affectation.role_details?.nom || '-'}
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
            )} */}

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
        {!membresData?.fideles || membresData.fideles.length === 0 ? (
          <tr>
            <td colSpan={5} className="text-center py-8 text-gray-400">
              Aucun membre dans ce département
            </td>
          </tr>
        ) : (
          membresData.fideles.map((affectation: any) => {
            const fidele = affectation.fidele
            return (
              <tr key={affectation.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <Link href={`/paroisse/in/departements/fideles/${fidele?.id}`}>
                    {fidele?.profile_img ? (
                      <img
                        src={fidele.profile_img}
                        alt={`${fidele.prenom} ${fidele.nom}`}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
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
                    <Link 
                      href={`/paroisse/in/departements/fideles/${fidele?.id}`}
                      className="font-medium hover:text-gray-600 hover:underline"
                    >
                      {fidele?.prenom} {fidele?.nom}
                    </Link>
                    {fidele?.post_nom && (
                      <div className="text-xs text-gray-400">{fidele.post_nom}</div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm">
                  {affectation.role_details?.label || affectation.role_details?.nom || '-'}
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
                      <button
                        onClick={() => setCurrentView('liste')}
                        className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'liste' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <List size={14} />
                        Liste
                      </button>
                      <button
                        onClick={() => setCurrentView('calendrier')}
                        className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'calendrier' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <LayoutGrid size={14} />
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
                  </div>
                </div>

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

                {currentView === 'calendrier' ? (
                  <CalendrierView
                    activites={filteredActivites}
                    currentMonth={new Date()}
                    onViewDetails={openDetailsModal}
                    statutColors={statutColors}
                    getStatutInfo={getStatutInfo}
                  />
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
                          <div className="text-sm font-medium text-gray-500 mb-2">
                            {formatDate(date)}
                          </div>
                          <div className="space-y-2">
                            {activitesDuJour.map((activite: any) => {
                              const statutInfo = getStatutInfo(activite.statut)
                              const isPast = new Date(activite.date) < new Date()
                              const isEnRetard = isPast && activite.statut !== 'termine' && activite.statut !== 'annule'
                              
                              return (
                                <div
                                  key={activite.id}
                                  className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
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
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                              {activite.description}
                                            </p>
                                          )}
                                          {activite.plan_action && (
                                            <p className="text-xs text-gray-400 mt-1">
                                              Plan: {activite.plan_action.titre}
                                            </p>
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
                                          
                                          {isEnRetard && (
                                            <span className="text-xs text-orange-600 font-medium">
                                              En retard
                                            </span>
                                          )}
                                          
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              openDetailsModal(activite)
                                            }}
                                            className="p-1 text-gray-400 hover:text-black"
                                          >
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
                {!plansAction || plansAction.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200">
                    <Target size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucun plan d'action pour {selectedAnneeLabel}</p>
                  </div>
                ) : (
                  plansAction.map((plan: any) => (
                    <div key={plan.id} className="bg-white border border-gray-200 p-4">
                      <h3 className="font-medium">{plan.titre}</h3>
                      {plan.description && (
                        <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                      )}
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
                {!projets || projets.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-gray-200">
                    <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">Aucun projet pour {selectedAnneeLabel}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 p-4 text-center">
                        <div className="text-2xl font-light text-blue-700">{projetsStats?.total || 0}</div>
                        <div className="text-xs text-blue-600">Total projets</div>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 text-center">
                        <div className="text-2xl font-light text-yellow-700">{projetsStats?.enCours || 0}</div>
                        <div className="text-xs text-yellow-600">En cours</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 p-4 text-center">
                        <div className="text-2xl font-light text-green-700">{projetsStats?.termines || 0}</div>
                        <div className="text-xs text-green-600">Terminés</div>
                      </div>
                    </div>
                    
                    {projets.map((projet: any) => (
                      <div key={projet.id} className="bg-white border border-gray-200 p-4">
                        <h3 className="font-medium">{projet.nom}</h3>
                        {projet.description && (
                          <p className="text-sm text-gray-500 mt-1">{projet.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600">
                            {typeLabels[projet.type] || projet.type}
                          </span>
                          <span className="text-gray-500">
                            Début: {new Date(projet.date_debut).toLocaleDateString('fr-FR')}
                          </span>
                          {projet.date_fin && (
                            <span className="text-gray-500">
                              Fin: {new Date(projet.date_fin).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          <span className={`px-2 py-1 ${
                            projet.statut === 'en_cours' 
                              ? 'bg-yellow-50 text-yellow-700' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {projet.statut === 'en_cours' ? 'En cours' : 'Terminé'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

        {/* TAB BUDGET - Utilisation du BudgetClient en lecture seule */}
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
        <ActiviteDetailsModal
          activite={selectedActivite}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedActivite(null)
          }}
          statutColors={statutColors}
          getStatutInfo={getStatutInfo}
        />
      )}

      {/* Modal détails budget - Lecture seule */}
      {showBudgetDetailsModal && selectedBudget && (
        <BudgetDetailsModal
          budget={selectedBudget}
          mouvements={budgetMouvements}
          summary={budgetMouvementSummary}
          loading={budgetDetailsLoading}
          onClose={() => setShowBudgetDetailsModal(false)}
          formatWithCDF={formatWithCDF}
        />
      )}
    </div>
  )
}

// Composant BudgetRow - Lecture seule
function BudgetRow({ budget, onViewDetails, formatWithCDF, configTaux }: any) {
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const isRecette = budget.type === 'recette'
  
  useEffect(() => {
    loadMouvementSummary()
  }, [budget.id])
  
  async function loadMouvementSummary() {
    try {
      const summary = await getBudgetMouvementSummary(budget.id)
      setMouvementSummary(summary)
    } catch (error) {
      console.error('Erreur chargement résumé:', error)
    }
  }
  
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    return montant * configTaux
  }
  
  const totalRealise = mouvementSummary?.total || 0
  const totalRealiseCDF = convertToCDF(totalRealise, budget.currency)
  const prevuCDF = convertToCDF(budget.montant, budget.currency)
  const progression = prevuCDF > 0 ? (totalRealiseCDF / prevuCDF) * 100 : 0
  const reste = prevuCDF - totalRealiseCDF
  
  return (
    <div 
      className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{budget.libelle}</h3>
            <span className={`text-xs px-2 py-0.5 border ${isRecette ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isRecette ? 'Recette' : 'Dépense'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className={isRecette ? 'text-green-500' : 'text-red-500'} />
              <span className="text-lg font-light">{formatWithCDF(budget.montant, budget.currency)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={12} />
              <span>Créé le {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          {mouvementSummary && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  Réalisé: {formatCurrency(totalRealise, budget.currency)}
                </span>
                <span className="text-gray-400">
                  {progression.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    isRecette ? 'bg-green-500' : 
                    progression > 100 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(progression, 100)}%` }}
                />
              </div>
              {reste !== 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  {isRecette 
                    ? (reste > 0 ? `Reste à percevoir: ${formatCurrency(reste, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(reste), 'CDF')}`)
                    : (reste >= 0 ? `Reste disponible: ${formatCurrency(reste, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(reste), 'CDF')}`)
                  }
                </div>
              )}
            </div>
          )}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); onViewDetails() }} 
          className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          title="Voir les détails"
        >
          <Eye size={16} />
        </button>
      </div>
    </div>
  )
}

// Composant CalendrierView
function CalendrierView({ 
  activites, 
  currentMonth: initialMonth,
  onViewDetails,
  statutColors,
  getStatutInfo
}: { 
  activites: any[]
  currentMonth: Date
  onViewDetails: (activite: any) => void
  statutColors: Record<string, string>
  getStatutInfo: (statut: string) => any
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
          
          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                !day.isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday(day.date) ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`text-xs mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1">
                {activitesDuJour.slice(0, 3).map((activite: any) => {
                  const statutInfo = getStatutInfo(activite.statut)
                  return (
                    <button
                      key={activite.id}
                      onClick={() => onViewDetails(activite)}
                      className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color} cursor-pointer hover:opacity-80`}
                      title={`${activite.heure} - ${activite.titre}`}
                    >
                      {activite.heure} {activite.titre}
                    </button>
                  )
                })}
                {activitesDuJour.length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">
                    +{activitesDuJour.length - 3} autre(s)
                  </div>
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
function ActiviteDetailsModal({ 
  activite, 
  onClose,
  statutColors,
  getStatutInfo
}: { 
  activite: any
  onClose: () => void
  statutColors: Record<string, string>
  getStatutInfo: (statut: string) => any
}) {
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
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2">{activite.titre}</h2>
            {activite.description && <p className="text-gray-600">{activite.description}</p>}
            {activite.plan_action && (
              <p className="text-sm text-gray-500 mt-2">
                Plan d'action: {activite.plan_action.titre}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
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

          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-1">Statut</div>
            <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 border ${statutInfo.color}`}>
              <span className="mr-1">{statutInfo.icon}</span>
              {statutInfo.label}
            </span>
          </div>

          {activite.commentaire && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-1">Commentaire</div>
              <div className="bg-gray-50 p-3 border border-gray-200 text-sm text-gray-700">
                {activite.commentaire}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 hover:border-black text-center text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant BudgetDetailsModal - Lecture seule
function BudgetDetailsModal({ budget, mouvements, summary, loading, onClose, formatWithCDF }: any) {
  if (!budget) return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">{budget.libelle}</h3>
            <p className="text-sm text-gray-500">
              {budget.type === 'recette' ? 'Recette' : 'Dépense'} - Budget: {formatWithCDF(budget.montant, budget.currency)}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {summary && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Total réalisé :</span>
                <span className="font-medium">{formatWithCDF(summary.total, budget.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Reste :</span>
                <span className={`font-medium ${summary.reste >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatWithCDF(summary.reste, budget.currency)}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-400">{summary.nombreMouvements} mouvement(s)</div>
            </div>
          )}

          <h4 className="text-sm font-medium text-gray-700 mb-3">Historique des mouvements</h4>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={24} />
            </div>
          ) : mouvements.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded">
              <Receipt size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2">
              {mouvements.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${budget.type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatWithCDF(m.montant, m.currency)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(m.date_mouvement)}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 hover:border-black text-center text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper pour getMouvementsByBudget (à importer)
async function getMouvementsByBudget(budgetId: number): Promise<any[]> {
  const { getMouvementsByBudget: getMouvements } = await import('@/actions/finance')
  return getMouvements(budgetId)
}