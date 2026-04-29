
// app/chef/departement/district/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, 
  Users, 
  Target,
  ChevronRight,
  Building2,
  UserCheck,
  Activity,
  AlertCircle,
  ChevronLeft
} from 'lucide-react'
import { getChefInfo } from '@/actions/chef-district'
import { getAllParoissesDepartementData } from '@/actions/chef-district'
import { getAnneesDisponiblesForParoisse } from '@/actions/chef-district'
import { getActivitesByUnite } from '@/actions/activite'
import { supabase } from '@/lib/supabase'
import { 
  ActivitesPage, 
  type UniteOrganisationSimple, 
  type AnneeConference, 
  type ActiviteAffichee 
} from '@/components/ActivitesPage'

interface ParoisseData {
  paroisse_id: number
  paroisse_nom: string
  unite_id: number | null
  data: {
    fideles: any[]
    totalFideles: number
    actifs: number
    inactifs: number
    activites: any[]
    budgetSummary: any | null
    plansAction: any[]
    activitesStats: any | null
    activitesRecentes: any[]
    activitesProchaines: any[]
  }
}

// Composants Skeleton
function HeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-6 h-6 bg-gray-200 rounded" />
        <div>
          <div className="w-48 h-8 bg-gray-200 rounded mb-1" />
          <div className="w-64 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-4 rounded-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="w-12 h-8 bg-gray-200 rounded" />
          </div>
          <div className="w-20 h-3 bg-gray-200 rounded mt-1" />
          <div className="flex gap-3 mt-2">
            <div className="w-16 h-3 bg-gray-200 rounded" />
            <div className="w-16 h-3 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function AnneeSelectorSkeleton() {
  return (
    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-sm animate-pulse">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-40 h-5 bg-gray-200 rounded" />
        <div className="w-[200px] h-10 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

function TabsSkeleton() {
  return (
    <div className="flex gap-6 mb-6 border-b border-gray-200 animate-pulse">
      <div className="w-24 h-10 bg-gray-200 rounded" />
      <div className="w-24 h-10 bg-gray-200 rounded" />
    </div>
  )
}

function ParoisseCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 p-5 rounded-sm animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="w-40 h-6 bg-gray-200 rounded mb-3" />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
          <div className="mt-4">
            <div className="w-28 h-3 bg-gray-200 rounded mb-2" />
            <div className="flex flex-wrap gap-2">
              <div className="w-20 h-6 bg-gray-200 rounded" />
              <div className="w-24 h-6 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

function ParoissesListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <ParoisseCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function ChefDistrictPage() {
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<any>(null)
  const [paroissesData, setParoissesData] = useState<ParoisseData[]>([])
  const [anneeConferenceId, setAnneeConferenceId] = useState<number | null>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  
  // États pour l'onglet activités
  const [activeMainTab, setActiveMainTab] = useState<'paroisses' | 'activites'>('paroisses')
  const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationSimple[]>([])
  const [loadingActivitesConfig, setLoadingActivitesConfig] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      const chef = await getChefInfo()
      if (!chef) {
        setLoading(false)
        setInitialDataLoaded(true)
        return
      }
      setChefInfo(chef)

      const { data: firstParoisse } = await supabase
        .from('paroisse')
        .select('id')
        .eq('district_id', chef.district_id)
        .limit(1)
        .single()

      if (firstParoisse) {
        const annees = await getAnneesDisponiblesForParoisse(
          firstParoisse.id,
          chef.departement_id
        )
        
        const anneesFormatted: AnneeConference[] = annees.map((a: any) => ({
          id: a.id,
          label: a.label,
          is_current: a.is_current || false
        }))
        setAnneesDisponibles(anneesFormatted)
        
        let selectedAnnee: number | null = null
        const currentAnnee = annees.find((a: any) => a.is_current)
        if (currentAnnee) {
          selectedAnnee = currentAnnee.id
        } else if (annees.length > 0) {
          selectedAnnee = annees[0].id
        }
        
        if (selectedAnnee) {
          setAnneeConferenceId(selectedAnnee)
          await loadParoissesWithAnnee(chef.departement_id, chef.district_id, selectedAnnee)
          await loadUnitesForActivites(chef.departement_id, chef.district_id)
        } else {
          await loadParoissesWithAnnee(chef.departement_id, chef.district_id, null)
        }
      } else {
        setParoissesData([])
      }
      
      setLoading(false)
      setInitialDataLoaded(true)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
      setInitialDataLoaded(true)
    }
  }

  async function loadParoissesWithAnnee(departementId: number, districtId: number, anneeId: number | null) {
    setIsLoadingData(true)
    const data = await getAllParoissesDepartementData(departementId, districtId, anneeId)
    setParoissesData(data)
    setIsLoadingData(false)
  }

  async function loadUnitesForActivites(departementId: number, districtId: number) {
    try {
      setLoadingActivitesConfig(true)
      
      const { data: paroisses } = await supabase
        .from('paroisse')
        .select('id, nom')
        .eq('district_id', districtId)
        .order('nom', { ascending: true })
      
      if (!paroisses) {
        setUnitesForActivites([])
        return
      }

      const unites: UniteOrganisationSimple[] = []
      
      for (const paroisse of paroisses) {
        const { data: uniteData } = await supabase
          .from('unite_organisation')
          .select('id, nom, reference_id')
          .eq('reference_table', 'departement')
          .eq('reference_id', departementId)
          .eq('id_niveau', paroisse.id)
          .eq('niveau', 'paroisse')
          .single()
        
        if (uniteData) {
          unites.push({
            id: uniteData.id,
            nom: uniteData.nom,
            reference_id: uniteData.reference_id,
            paroisse_id: paroisse.id,
            paroisse_nom: paroisse.nom
          })
        }
      }
      
      setUnitesForActivites(unites)
    } catch (error) {
      console.error('Erreur chargement unités:', error)
    } finally {
      setLoadingActivitesConfig(false)
    }
  }

  async function handleAnneeChange(anneeId: number) {
    setAnneeConferenceId(anneeId)
    if (chefInfo) {
      await loadParoissesWithAnnee(chefInfo.departement_id, chefInfo.district_id, anneeId)
    }
  }

  async function loadActivitesForUnite(uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> {
    return await getActivitesByUnite(uniteId, anneeId)
  }

  const totalFideles = paroissesData.reduce((sum, p) => sum + p.data.totalFideles, 0)
  const totalActifs = paroissesData.reduce((sum, p) => sum + p.data.actifs, 0)
  const totalActivites = paroissesData.reduce((sum, p) => sum + p.data.activites.length, 0)
  const totalPlans = paroissesData.reduce((sum, p) => sum + p.data.plansAction.length, 0)

  // Rendu pour l'état de chargement initial
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <HeaderSkeleton />
        <StatsSkeleton />
        <AnneeSelectorSkeleton />
        <TabsSkeleton />
        <ParoissesListSkeleton />
      </div>
    )
  }

  if (!chefInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'êtes pas chef de département au niveau district</p>
        </div>
      </div>
    )
  }

  // Si l'onglet activités est actif, on affiche le composant ActivitesPage
  if (activeMainTab === 'activites') {
    return (
      <div className=" max-w-7xl mx-auto">
        {/* Bouton de retour personnalisé */}
        <button
          onClick={() => setActiveMainTab('paroisses')}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-4"
        >
          <ChevronLeft size={18} />
          <span>Retour au tableau de bord</span>
        </button>

        <ActivitesPage
          config={{
            title: "Activités de tous les departements du districts",
            subtitle: `${chefInfo.departement_nom} - ${chefInfo.district_nom}`,
            backUrl: "", // On n'utilise pas le backUrl du composant
            backLabel: "",
            showParoisseColumn: true,
            showDepartementColumn: false,
            unites: unitesForActivites,
            anneesDisponibles: anneesDisponibles,
            currentAnneeId: anneeConferenceId || undefined,
            onLoadActivites: loadActivitesForUnite,
            onAnneeChange: handleAnneeChange,
            emptyStateMessage: "Aucune activité pour ce district"
          }}
          loading={loadingActivitesConfig}
        />
      </div>
    )
  }

  // Vue paroisses (tableau de bord)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              {chefInfo.departement_nom}
            </h1>
            <p className="text-sm text-gray-500">
              District: {chefInfo.district_nom} • {paroissesData.length} paroisses
            </p>
          </div>
        </div>
      </div>

      {/* Stats globales - avec skeleton pendant le chargement */}
      {isLoadingData && !initialDataLoaded ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <Users size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalFideles}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total fidèles</p>
            <div className="flex gap-3 mt-2 text-xs">
              <span className="text-green-600">Actifs: {totalActifs}</span>
              <span className="text-gray-400">Inactifs: {totalFideles - totalActifs}</span>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <Activity size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalActivites}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Activités totales</p>
          </div>
          
          <div className="bg-white border border-gray-200 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <Target size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalPlans}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Plans d'action</p>
          </div>
          
          <div className="bg-white border border-gray-200 p-4 rounded-sm">
            <div className="flex items-center justify-between">
              <UserCheck size={20} className="text-gray-400" />
              <span className="text-2xl font-light">
                {paroissesData.filter(p => p.unite_id).length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Unités actives</p>
          </div>
        </div>
      )}

      {/* Sélecteur d'année */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
          {anneesDisponibles.length > 0 ? (
            <select
              value={anneeConferenceId || ''}
              onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px] rounded-sm"
              disabled={isLoadingData}
            >
              {anneesDisponibles.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                  {annee.is_current && ' (en cours)'}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-orange-600 flex items-center gap-2">
              <AlertCircle size={16} />
              Aucune année configurée pour ce district
            </span>
          )}
          
          {isLoadingData && (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* Tabs principaux */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('paroisses')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'paroisses' 
              ? 'font-medium text-black border-b-2 border-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Paroisses ({paroissesData.length})
        </button>
        <button
          onClick={() => setActiveMainTab('activites')}
          className="px-1 py-3 text-sm transition-colors text-gray-500 hover:text-black"
        >
          Activités ({totalActivites})
        </button>
      </div>

      {/* Message si pas d'année */}
      {anneesDisponibles.length > 0 && !anneeConferenceId && !isLoadingData && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-sm">
          Veuillez sélectionner une année pour voir les activités et plans d'action
        </div>
      )}

      {/* Liste des paroisses - avec skeleton pendant le chargement */}
      {isLoadingData ? (
        <ParoissesListSkeleton />
      ) : paroissesData.length === 0 ? (
        <div className="bg-white border border-gray-200 py-12 text-center rounded-sm">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune paroisse trouvée</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 space-y-3 sm:space-y-0">
          {paroissesData.map((paroisse) => (
            <Link
              key={paroisse.paroisse_id}
              href={`/chef/departement/paroisse/${paroisse.paroisse_id}?departementId=${chefInfo.departement_id}&annee=${anneeConferenceId || ''}`}
              className="block bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-sm"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{paroisse.paroisse_nom}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {paroisse.data.totalFideles} fidèles
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity size={14} />
                        {paroisse.data.activites.length} activités
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={14} />
                        {paroisse.data.plansAction.length} plans
                      </span>
                    </div>
                    
                    {paroisse.data.activitesRecentes && paroisse.data.activitesRecentes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">Activités récentes:</p>
                        <div className="flex flex-wrap gap-2">
                          {paroisse.data.activitesRecentes.slice(0, 2).map((act: any) => (
                            <span key={act.id} className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm">
                              {act.titre}
                            </span>
                          ))}
                          {paroisse.data.activitesRecentes.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{paroisse.data.activitesRecentes.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {!paroisse.unite_id && (
                      <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200 rounded-sm">
                        Unité non configurée
                      </span>
                    )}
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}