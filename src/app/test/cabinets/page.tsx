// app/district/cabinets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Loader2, 
  Building2, 
  Users, 
  Activity, 
  Target,
  ChevronRight,
  Search,
  X,
  AlertCircle,
  Calendar,
  UserCheck,
  FolderOpen,
  Home,
  Wallet,
  FileText
} from 'lucide-react'
import { getCurrentFidele } from '@/actions/auth'
import { getCabinetUniteForParoisse } from '@/actions/unite-organisation-cabinet'
import { getActivitesByUnite, getActivitesStats } from '@/actions/activite'
import { getProjetsByUnite } from '@/actions/projet'
import { getPlansActionByUnite } from '@/actions/plan-action'
import { getUniteBudgetSummary } from '@/actions/budget'
import { supabase } from '@/lib/supabase'

interface CabinetAvecStats {
  paroisse_id: number
  paroisse_nom: string
  unite_id: number | null
  membres_count: number
  activites_count: number
  projets_count: number
  plans_count: number
  budget_total?: number
  activites_terminees?: number
  activites_en_cours?: number
  projets_en_cours?: number
  projets_termines?: number
}

export default function CabinetsDistrictPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fidele, setFidele] = useState<any>(null)
  const [districtId, setDistrictId] = useState<number | null>(null)
  const [districtNom, setDistrictNom] = useState<string>('')
  const [cabinets, setCabinets] = useState<CabinetAvecStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [statsGlobales, setStatsGlobales] = useState({
    totalParoisses: 0,
    totalMembres: 0,
    totalActivites: 0,
    totalProjets: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Récupérer le fidèle connecté
      const fideleData = await getCurrentFidele()
      
      if (!fideleData) {
        setError('Veuillez vous connecter')
        setLoading(false)
        return
      }
      
      setFidele(fideleData)
      
      // 2. Récupérer le district du fidèle
      const { data: paroisseData, error: paroisseError } = await supabase
        .from('paroisse')
        .select('district_id')
        .eq('id', fideleData.paroisse_id)
        .single()
      
      if (paroisseError || !paroisseData?.district_id) {
        setError('Impossible de déterminer votre district')
        setLoading(false)
        return
      }
      
      const currentDistrictId = paroisseData.district_id
      setDistrictId(currentDistrictId)
      
      // Récupérer le nom du district
      const { data: district, error: districtError } = await supabase
        .from('district')
        .select('nom')
        .eq('id', currentDistrictId)
        .single()
      
      if (!districtError && district) {
        setDistrictNom(district.nom)
      }
      
      // 3. Récupérer toutes les paroisses du district
      const { data: paroisses, error: paroissesError } = await supabase
        .from('paroisse')
        .select('id, nom')
        .eq('district_id', currentDistrictId)
        .order('nom')
      
      if (paroissesError) {
        console.error('Erreur chargement paroisses:', paroissesError)
        setError(`Erreur: ${paroissesError.message}`)
        setLoading(false)
        return
      }
      
      if (!paroisses || paroisses.length === 0) {
        setCabinets([])
        setLoading(false)
        return
      }
      
      // 4. Pour chaque paroisse, récupérer les infos du cabinet pastoral
      const cabinetsWithStats = await Promise.all(
        paroisses.map(async (paroisse) => {
          // Récupérer l'unité du cabinet pour cette paroisse
          const unite = await getCabinetUniteForParoisse(paroisse.id)
          const uniteId = unite?.id || null
          
          let membresCount = 0
          let activitesCount = 0
          let projetsCount = 0
          let plansCount = 0
          let budgetTotal = 0
          let activitesTerminees = 0
          let activitesEnCours = 0
          let projetsEnCours = 0
          let projetsTermines = 0
          
          // Compter les membres du cabinet
          const { count: membresCabinetCount } = await supabase
            .from('cabinet_pastoral')
            .select('id', { count: 'exact', head: true })
            .eq('paroisse_id', paroisse.id)
            .eq('est_actif', true)
          
          membresCount = membresCabinetCount || 0
          
          // Si l'unité existe, récupérer les statistiques
          if (uniteId) {
            // Récupérer l'année en cours
            const { data: anneeEnCours } = await supabase
              .from('annee_conference')
              .select('id')
              .eq('is_current', true)
              .single()
            
            const anneeId = anneeEnCours?.id
            
            // Activités
            const activites = await getActivitesByUnite(uniteId, anneeId)
            activitesCount = activites.length
            
            // Stats des activités
            if (anneeId) {
              const activitesStats = await getActivitesStats(undefined, uniteId, anneeId)
              activitesTerminees = activitesStats?.terminees || 0
              activitesEnCours = activitesStats?.enCours || 0
            }
            
            // Projets
            const projets = await getProjetsByUnite(uniteId, anneeId)
            projetsCount = projets.length
            projetsEnCours = projets.filter(p => p.statut === 'en_cours').length
            projetsTermines = projets.filter(p => p.statut === 'termine').length
            
            // Plans d'action
            const plans = await getPlansActionByUnite(uniteId, anneeId)
            plansCount = plans.length
            
            // Budget
            if (anneeId) {
              const budgetSummary = await getUniteBudgetSummary(uniteId, anneeId)
              if (budgetSummary) {
                budgetTotal = (budgetSummary.recettesList || []).reduce((sum: number, b: any) => sum + b.montant, 0)
              }
            }
          }
          
          return {
            paroisse_id: paroisse.id,
            paroisse_nom: paroisse.nom,
            unite_id: uniteId,
            membres_count: membresCount,
            activites_count: activitesCount,
            projets_count: projetsCount,
            plans_count: plansCount,
            budget_total: budgetTotal,
            activites_terminees: activitesTerminees,
            activites_en_cours: activitesEnCours,
            projets_en_cours: projetsEnCours,
            projets_termines: projetsTermines
          }
        })
      )
      
      setCabinets(cabinetsWithStats)
      
      // Calculer les statistiques globales
      setStatsGlobales({
        totalParoisses: cabinetsWithStats.length,
        totalMembres: cabinetsWithStats.reduce((sum, c) => sum + c.membres_count, 0),
        totalActivites: cabinetsWithStats.reduce((sum, c) => sum + c.activites_count, 0),
        totalProjets: cabinetsWithStats.reduce((sum, c) => sum + c.projets_count, 0)
      })
      
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur loadData:', error)
      setError('Une erreur inattendue est survenue')
      setLoading(false)
    }
  }

  // Filtrer les cabinets
  const filteredCabinets = cabinets.filter(cabinet => {
    const matchesSearch = cabinet.paroisse_nom.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Erreur</h1>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 border border-gray-300 hover:border-black text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!fidele) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Non connecté</h1>
          <p className="text-gray-500">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header avec breadcrumb */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
          <Link href="/district" className="hover:text-black">
            District
          </Link>
          <ChevronRight size={14} />
          <span className="text-black">Cabinets Pastoraux</span>
        </div>
        
        <div className="flex items-center gap-3 mb-2">
          <Home size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              Cabinets Pastoraux {districtNom && `- ${districtNom}`}
            </h1>
            <p className="text-sm text-gray-500">
              {cabinets.length} paroisse(s) • {statsGlobales.totalMembres} membre(s) au total
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Building2 size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{statsGlobales.totalParoisses}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Paroisses</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Users size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{statsGlobales.totalMembres}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Membres des cabinets</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{statsGlobales.totalActivites}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Activités</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <FolderOpen size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{statsGlobales.totalProjets}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Projets</p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une paroisse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
          />
        </div>
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
          >
            <X size={14} />
            Effacer
          </button>
        )}
      </div>

      {/* Liste des cabinets */}
      {filteredCabinets.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Home size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            {searchTerm 
              ? 'Aucune paroisse ne correspond à votre recherche'
              : 'Aucun cabinet pastoral trouvé dans ce district'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCabinets.map((cabinet) => (
            <Link
              key={cabinet.paroisse_id}
              href={`/test/cabinets/${cabinet.paroisse_id}`}
              className="block bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">
                      Cabinet Pastoral
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {cabinet.paroisse_nom}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </div>
                
                {/* Indicateur d'unité */}
                {!cabinet.unite_id && (
                  <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 text-xs text-yellow-700">
                    ⚠️ Unité d'organisation non configurée
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{cabinet.membres_count}</div>
                      <div className="text-xs text-gray-400">Membres</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{cabinet.activites_count}</div>
                      <div className="text-xs text-gray-400">Activités</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">
                        {cabinet.activites_terminees || 0}/{cabinet.activites_count}
                      </div>
                      <div className="text-xs text-gray-400">Terminées</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{cabinet.plans_count}</div>
                      <div className="text-xs text-gray-400">Plans</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FolderOpen size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{cabinet.projets_count}</div>
                      <div className="text-xs text-gray-400">Projets</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">
                        ${(cabinet.budget_total || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">Budget</div>
                    </div>
                  </div>
                </div>
                
                {/* Progression des projets */}
                {cabinet.projets_count > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500">Projets</span>
                      <span className="text-gray-400">
                        {cabinet.projets_termines || 0} terminés • {cabinet.projets_en_cours || 0} en cours
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ 
                          width: `${cabinet.projets_count > 0 
                            ? ((cabinet.projets_termines || 0) / cabinet.projets_count) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}