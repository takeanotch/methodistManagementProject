
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Building2, ChevronRight, MapPin, Users, Activity, Target, Calendar, AlertCircle } from 'lucide-react'
import { getChefConferenceInfo } from '@/actions/chef-conference'
import { getDistrictsByConference } from '@/actions/chef-conference'
import { getAllParoissesConferenceData, getAnneesForConference } from '@/actions/chef-conference'

interface DistrictWithStats {
  id: number
  nom: string
  paroisses_count: number
  total_fideles: number
  total_activites: number
  total_plans: number
  unites_actives: number
}

// Composant Skeleton pour les stats
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="w-5 h-5 bg-gray-200 rounded" />
            <div className="w-12 h-8 bg-gray-200 rounded" />
          </div>
          <div className="w-20 h-3 bg-gray-200 rounded mt-2" />
        </div>
      ))}
    </div>
  )
}

// Composant Skeleton pour un district
function DistrictCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-32 h-6 bg-gray-200 rounded" />
            <div className="w-20 h-5 bg-gray-200 rounded" />
          </div>
          <div className="flex items-center gap-6 mt-3">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded" />
      </div>
    </div>
  )
}

// Composant Skeleton pour la liste des districts
function DistrictsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <DistrictCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Composant Skeleton pour le header
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

export default function ChefConferencePage() {
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<any>(null)
  const [districts, setDistricts] = useState<DistrictWithStats[]>([])
  const [anneeConferenceId, setAnneeConferenceId] = useState<number | null>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (chefInfo && anneeConferenceId && initialDataLoaded) {
      loadDistrictsWithAnnee()
    }
  }, [anneeConferenceId])

  async function loadData() {
    try {
      setLoading(true)
      
      const chef = await getChefConferenceInfo()
      if (!chef) {
        setLoading(false)
        setInitialDataLoaded(true)
        return
      }
      setChefInfo(chef)
      console.log('👤 Chef conférence:', { departementId: chef.departement_id, conferenceId: chef.conference_id })

      // Récupérer les années disponibles pour la conférence
      const annees = await getAnneesForConference(chef.conference_id)
      console.log('📅 Années disponibles:', annees)
      setAnneesDisponibles(annees)
      
      // Sélectionner l'année courante ou la première
      let selectedAnnee: number | null = null
      const currentAnnee = annees.find((a: any) => a.is_current)
      if (currentAnnee) {
        selectedAnnee = currentAnnee.id
      } else if (annees.length > 0) {
        selectedAnnee = annees[0].id
      }
      
      if (selectedAnnee) {
        setAnneeConferenceId(selectedAnnee)
        await loadDistrictsWithAnnee(selectedAnnee)
      } else {
        // Aucune année, afficher les districts avec données vides
        const districtsList = await getDistrictsByConference(chef.conference_id)
        setDistricts(districtsList.map(d => ({
          id: d.id,
          nom: d.nom,
          paroisses_count: 0,
          total_fideles: 0,
          total_activites: 0,
          total_plans: 0,
          unites_actives: 0
        })))
        setInitialDataLoaded(true)
      }
      
      setLoading(false)
      setInitialDataLoaded(true)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
      setInitialDataLoaded(true)
    }
  }

  async function loadDistrictsWithAnnee(anneeId?: number) {
    const anneeToUse = anneeId || anneeConferenceId
    if (!chefInfo || !anneeToUse) return
    
    setIsLoadingData(true)
    console.log(`🔄 loadDistrictsWithAnnee: anneeConferenceId = ${anneeToUse}`)
    
    // Récupérer les districts
    const districtsList = await getDistrictsByConference(chefInfo.conference_id)
    
    // Récupérer toutes les paroisses avec l'année sélectionnée
    const allParoissesData = await getAllParoissesConferenceData(
      chefInfo.departement_id,
      chefInfo.conference_id,
      anneeToUse  // ← Passer l'année ici!
    )
    
    console.log(`📊 Données reçues pour ${allParoissesData.length} paroisses`)
    
    // Grouper par district
    const districtsWithStats: DistrictWithStats[] = districtsList.map(district => {
      const paroissesDuDistrict = allParoissesData.filter(p => p.district_id === district.id)
      
      console.log(`  District ${district.nom}: ${paroissesDuDistrict.length} paroisses, activités: ${paroissesDuDistrict.reduce((sum, p) => sum + p.data.activites.length, 0)}`)
      
      return {
        id: district.id,
        nom: district.nom,
        paroisses_count: paroissesDuDistrict.length,
        total_fideles: paroissesDuDistrict.reduce((sum, p) => sum + p.data.totalFideles, 0),
        total_activites: paroissesDuDistrict.reduce((sum, p) => sum + p.data.activites.length, 0),
        total_plans: paroissesDuDistrict.reduce((sum, p) => sum + p.data.plansAction.length, 0),
        unites_actives: paroissesDuDistrict.filter(p => p.unite_id).length
      }
    })
    
    setDistricts(districtsWithStats)
    setIsLoadingData(false)
  }

  async function handleAnneeChange(anneeId: number) {
    console.log(`📅 Changement année: ${anneeId}`)
    setAnneeConferenceId(anneeId)
    await loadDistrictsWithAnnee(anneeId)
  }

  // Rendu pour l'état de chargement initial
  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <HeaderSkeleton />
        <StatsSkeleton />
        <DistrictsListSkeleton />
      </div>
    )
  }

  if (!chefInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'êtes pas chef de département au niveau conférence</p>
        </div>
      </div>
    )
  }

  const totalFideles = districts.reduce((sum, d) => sum + d.total_fideles, 0)
  const totalParoisses = districts.reduce((sum, d) => sum + d.paroisses_count, 0)
  const totalActivites = districts.reduce((sum, d) => sum + d.total_activites, 0)
  const totalPlans = districts.reduce((sum, d) => sum + d.total_plans, 0)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              {chefInfo.departement_nom}
            </h1>
            <p className="text-sm text-gray-500">
              Conférence: {chefInfo.conference_nom} • {districts.length} districts • {totalParoisses} paroisses
            </p>
          </div>
        </div>
      </div>

      {/* Sélecteur d'année */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
          {anneesDisponibles.length > 0 ? (
            <select
              value={anneeConferenceId || ''}
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
          ) : (
            <span className="text-sm text-orange-600 flex items-center gap-2">
              <AlertCircle size={16} />
              Aucune année configurée pour cette conférence
            </span>
          )}
          
          {isLoadingData && (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          )}
          
          {anneeConferenceId && !isLoadingData && (
            <span className="text-xs text-gray-400">
              (Filtre actif)
            </span>
          )}
        </div>
      </div>

      {/* Message si pas d'année */}
      {anneesDisponibles.length > 0 && !anneeConferenceId && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
          Veuillez sélectionner une année pour voir les activités et plans d'action
        </div>
      )}

      {/* Stats globales - avec skeleton pendant le chargement */}
      {isLoadingData && !initialDataLoaded ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Users size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalFideles}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Total fidèles</p>
          </div>
          
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <MapPin size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{totalParoisses}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Paroisses</p>
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
        </div>
      )}

      {/* Liste des districts - avec skeleton pendant le chargement */}
      {isLoadingData ? (
        <DistrictsListSkeleton />
      ) : districts.length === 0 ? (
        <div className="bg-white border border-gray-200 py-12 text-center">
          <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun district trouvé</p>
        </div>
      ) : (
        <div className="gap-4 grid sm:grid-cols-2">
          {districts.map((district) => (
            <Link
              key={district.id}
              href={`/chef/departement/conference/${district.id}?annee=${anneeConferenceId || ''}`}
              className="block bg-white border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-lg">{district.nom}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                        {district.paroisses_count} paroisses
                      </span>
                      {district.unites_actives < district.paroisses_count && district.paroisses_count > 0 && (
                        <span className="text-xs px-2 py-1 bg-orange-50 text-orange-600 border border-orange-200">
                          {district.unites_actives}/{district.paroisses_count} unités actives
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                      <span className="flex sm:text-sm text-xs items-center gap-1">
                        <Users size={14} />
                        {district.total_fideles} fidèles
                      </span>
                      <span className="flex sm:text-sm text-xs items-center gap-1">
                        <Activity size={14} />
                        {district.total_activites} activités
                      </span>
                      <span className="flex sm:text-sm text-xs items-center gap-1">
                        <Target size={14} />
                        {district.total_plans} plans
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}