
// app/chef-conference/page.tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, 
  Building2,
  Activity,
  Target,
  AlertCircle,
  LayoutDashboard,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Users
} from 'lucide-react'
import { getChefConferenceInfo, getDistrictsByConference, getAnneesForConference } from '@/actions/chef-conference'
import { getDepartementUniteForDistrict } from '@/actions/unite-organisation'
import { getActivitesByUnite } from '@/actions/activite'
import { getPlansActionByUnite } from '@/actions/plan-action'
import { getProjetsByUnite } from '@/actions/projet'
import { supabase } from '@/lib/supabase'
import { 
  ActivitesPage, 
  type UniteOrganisationSimple, 
  type AnneeConference, 
  type ActiviteAffichee 
} from '@/components/ActivitesPage'

interface DistrictStats {
  district_id: number
  district_nom: string
  unite_id: number | null
  stats: {
    activites: number
    plansAction: number
    projets: number
  }
}

// Composants Skeleton
function HeaderSkeleton() {
  return (
    <div className="mb-8 animate-pulse">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-gray-200" />
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
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="w-8 h-8 bg-gray-200 rounded" />
          </div>
          <div className="w-20 h-3 bg-gray-200 rounded mt-1" />
        </div>
      ))}
    </div>
  )
}

function AnneeSelectorSkeleton() {
  return (
    <div className="mb-6 p-4 bg-gray-50 border border-gray-200 animate-pulse">
      <div className="flex items-center gap-4">
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

function DistrictCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="w-40 h-6 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
              <div className="w-8 h-7 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="w-20 h-3 bg-gray-200 rounded mb-1" />
              <div className="w-8 h-7 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
              <div className="w-8 h-7 bg-gray-200 rounded" />
            </div>
            <div>
              <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
              <div className="w-8 h-7 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

function DistrictsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <DistrictCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function ChefConferencePage() {
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<any>(null)
  const [districts, setDistricts] = useState<any[]>([])
  const [districtsStats, setDistrictsStats] = useState<DistrictStats[]>([])
  const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  
  // États pour l'onglet activités
  const [activeMainTab, setActiveMainTab] = useState<'districts' | 'activites'>('districts')
  const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationSimple[]>([])
  const [loadingActivitesConfig, setLoadingActivitesConfig] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      const info = await getChefConferenceInfo()
      if (!info) {
        setLoading(false)
        setInitialDataLoaded(true)
        return
      }
      setChefInfo(info)

      // Récupérer les districts de la conférence
      const districtsList = await getDistrictsByConference(info.conference_id)
      setDistricts(districtsList)

      // Récupérer les années disponibles
      const annees = await getAnneesForConference(info.conference_id)
      const anneesFormatted: AnneeConference[] = annees.map((a: any) => ({
        id: a.id,
        label: a.label,
        is_current: a.is_current || false
      }))
      setAnneesDisponibles(anneesFormatted)
      
      let anneeId: number | null = null
      const currentAnnee = annees.find((a: any) => a.is_current)
      if (currentAnnee) {
        anneeId = currentAnnee.id
        setSelectedAnnee(currentAnnee.id)
      } else if (annees.length > 0) {
        anneeId = annees[0].id
        setSelectedAnnee(annees[0].id)
      }

      // Charger les statistiques pour chaque district
      if (anneeId && districtsList.length > 0) {
        await loadDistrictsStats(info.departement_id, districtsList, anneeId)
      }

      // Charger les unités pour l'onglet activités
      if (info.departement_id) {
        await loadUnitesForActivites(info.departement_id, districtsList)
      }
      
      setLoading(false)
      setInitialDataLoaded(true)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
      setInitialDataLoaded(true)
    }
  }

  async function loadDistrictsStats(departementId: number, districtsList: any[], anneeId: number) {
    setLoadingStats(true)
    
    const stats: DistrictStats[] = []
    
    for (const district of districtsList) {
      // Récupérer l'unité du département pour ce district
      const unite = await getDepartementUniteForDistrict(departementId, district.id)
      
      let districtStats: DistrictStats = {
        district_id: district.id,
        district_nom: district.nom,
        unite_id: unite?.id || null,
        stats: {
          activites: 0,
          plansAction: 0,
          projets: 0
        }
      }
      
      if (unite?.id) {
        try {
          const [activites, plans, projets] = await Promise.all([
            getActivitesByUnite(unite.id, anneeId),
            getPlansActionByUnite(unite.id, anneeId),
            getProjetsByUnite(unite.id, anneeId)
          ])
          
          districtStats.stats = {
            activites: activites.length,
            plansAction: plans.length,
            projets: projets.length
          }
        } catch (error) {
          console.error(`Erreur chargement stats pour district ${district.id}:`, error)
        }
      }
      
      stats.push(districtStats)
    }
    
    setDistrictsStats(stats)
    setLoadingStats(false)
  }

  async function loadUnitesForActivites(departementId: number, districtsList: any[]) {
    try {
      setLoadingActivitesConfig(true)
      
      const unites: UniteOrganisationSimple[] = []
      
      for (const district of districtsList) {
        const { data: uniteData } = await supabase
          .from('unite_organisation')
          .select('id, nom, reference_id')
          .eq('reference_table', 'departement')
          .eq('reference_id', departementId)
          .eq('id_niveau', district.id)
          .eq('niveau', 'district')
          .single()
        
        if (uniteData) {
          unites.push({
            id: uniteData.id,
            nom: uniteData.nom,
            reference_id: uniteData.reference_id,
            district_id: district.id,
            district_nom: district.nom
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
    setSelectedAnnee(anneeId)
    if (chefInfo && districts.length > 0) {
      await loadDistrictsStats(chefInfo.departement_id, districts, anneeId)
    }
  }

  async function loadActivitesForUnite(uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> {
    return await getActivitesByUnite(uniteId, anneeId)
  }

  // Calculer les totaux
  const totalActivites = districtsStats.reduce((sum, d) => sum + d.stats.activites, 0)
  const totalPlans = districtsStats.reduce((sum, d) => sum + d.stats.plansAction, 0)
  const totalProjets = districtsStats.reduce((sum, d) => sum + d.stats.projets, 0)

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <HeaderSkeleton />
        <StatsSkeleton />
        <AnneeSelectorSkeleton />
        <TabsSkeleton />
        <DistrictsListSkeleton />
      </div>
    )
  }

  if (!chefInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'êtes pas chef de département au niveau conférence</p>
          <Link href="/gestion" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  // Si l'onglet activités est actif, on affiche le composant ActivitesPage
  if (activeMainTab === 'activites') {
    return (
      <div className=" max-w-7xl mx-auto">
        {/* Bouton de retour */}
        <button
          onClick={() => setActiveMainTab('districts')}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-"
        >
          <ChevronLeft size={18} />
          <span>Retour au tableau de bord</span>
        </button>

        <ActivitesPage
          config={{
            title: `Activités de districts de la conference ${chefInfo.conference_nom} pour ${chefInfo.departement_nom}  `,
            subtitle: `${chefInfo.departement_nom} - Conférence de ${chefInfo.conference_nom}`,
            backUrl: "",
            backLabel: "",
            showDistrictColumn: true,
            showDepartementColumn: false,
            unites: unitesForActivites,
            anneesDisponibles: anneesDisponibles,
            currentAnneeId: selectedAnnee || undefined,
            onLoadActivites: loadActivitesForUnite,
            onAnneeChange: handleAnneeChange,
            emptyStateMessage: "Aucune activité pour cette conférence"
          }}
          loading={loadingActivitesConfig}
        />
      </div>
    )
  }

  // Vue districts (tableau de bord)
  return (
    <div className=" max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-black text-white">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              {chefInfo.departement_nom} (Visualisation de tous les districts)
            </h1>
            <p className="text-sm text-gray-500">
              Conférence  {chefInfo.conference_nom} • 
              Bienvenue, {chefInfo.fidele_prenom} {chefInfo.fidele_nom}
            </p>
          </div>
        </div>
      </div>

      {/* Stats globales - avec skeleton pendant le chargement */}
      {loadingStats && !initialDataLoaded ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Building2 size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{districts.length}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Districts</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Activity size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalActivites}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Activités totales</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Target size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalPlans}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Plans d'action</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <FolderOpen size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalProjets}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Projets</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Users size={20} className="text-gray-400" />
              <span className="text-2xl font-light">
                {districtsStats.filter(d => d.unite_id).length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Unités configurées</p>
          </div>
        </div>
      )}

      {/* Sélecteur d'année */}
      {anneesDisponibles.length > 0 ? (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
            <select
              value={selectedAnnee || ''}
              onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px]"
              disabled={loadingStats}
            >
              {anneesDisponibles.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                  {annee.is_current && ' (en cours)'}
                </option>
              ))}
            </select>
            {loadingStats && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
          <span className="text-sm text-orange-600 flex items-center gap-2">
            <AlertCircle size={16} />
            Aucune année configurée pour cette conférence
          </span>
        </div>
      )}

      {/* Tabs principaux */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('districts')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'districts' 
              ? 'font-medium text-black border-b-2 border-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Districts ({districts.length})
        </button>
        <button
          onClick={() => setActiveMainTab('activites')}
          className="px-1 py-3 text-sm transition-colors text-gray-500 hover:text-black"
        >
          Activités ({totalActivites})
        </button>
      </div>

      {/* Message si pas d'année */}
      {anneesDisponibles.length > 0 && !selectedAnnee && !loadingStats && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
          Veuillez sélectionner une année pour voir les activités et plans d'action
        </div>
      )}

      {/* Liste des districts - avec skeleton pendant le chargement */}
      {loadingStats ? (
        <DistrictsListSkeleton />
      ) : districtsStats.length === 0 ? (
        <div className="bg-white border border-gray-200 py-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun district trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {districtsStats.map((district) => (
            <Link
              key={district.district_id}
              href={`/chef-conference/district/${district.district_id}?annee=${selectedAnnee || ''}`}
              className="block bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 size={18} className="text-gray-400" />
                      <h3 className="font-medium text-lg">{district.district_nom}</h3>
                      {!district.unite_id && (
                        <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200">
                          Unité non configurée
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Activités</p>
                        <p className="text-xl font-light">{district.stats.activites}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Plans d'action</p>
                        <p className="text-xl font-light">{district.stats.plansAction}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Projets</p>
                        <p className="text-xl font-light">{district.stats.projets}</p>
                      </div>
                    </div>
                  </div>
                  
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}