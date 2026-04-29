

// app/surintendant/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, 
  Users, 
  Calendar, 
  Target,
  Building2,
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Briefcase,
  ChevronRight,
  Clock,
  MapPin,
  BarChart3,
  ArrowUpRight,
  LayoutDashboard
} from 'lucide-react'
import { getSurintendantInfo } from '@/actions/surintendant'
import { getDistrictStatsForSurintendant, getAllDepartementsDataForSurintendant } from '@/actions/surintendant'
import { getAnneesDisponiblesForDepartementInDistrict } from '@/actions/surintendant'
import { supabase } from '@/lib/supabase'
import {  getAllDistrictData } from '@/actions/surintendant'

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200' }
]

interface ActiviteAffichee {
  id: number
  uniqueKey: string
  titre: string
  description?: string
  date: string
  heure: string
  statut: string
  paroisse_nom: string
  paroisse_id: number
  departement_nom: string
  departement_id: number
  plan_action?: any
  commentaire?: string
}

export default function SurintendantDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
  const [districtStats, setDistrictStats] = useState<any>(null)
  const [departementsData, setDepartementsData] = useState<any[]>([])
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [recentActivities, setRecentActivities] = useState<ActiviteAffichee[]>([])
  const [upcomingActivities, setUpcomingActivities] = useState<ActiviteAffichee[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      
      // Récupérer les infos du surintendant connecté
      const info = await getSurintendantInfo()
      if (!info) {
        setLoading(false)
        return
      }
      setSurintendantInfo(info)

      // Récupérer les années disponibles pour le district
      const { data: firstDepartement } = await supabase
        .from('departement')
        .select('id')
        .limit(1)
        .single()

      let currentAnneeId: number | null = null
      
      if (firstDepartement) {
        const annees = await getAnneesDisponiblesForDepartementInDistrict(
          firstDepartement.id,
          info.district_id
        )
        setAnneesDisponibles(annees)
        
        const currentAnnee = annees.find((a: any) => a.is_current)
        if (currentAnnee) {
          currentAnneeId = currentAnnee.id
          setSelectedAnnee(currentAnnee.id)
        } else if (annees.length > 0) {
          currentAnneeId = annees[0].id
          setSelectedAnnee(annees[0].id)
        }
      }

      // Charger les statistiques et données du district
      if (currentAnneeId) {
        await loadDataWithAnnee(info.district_id, currentAnneeId)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadDashboardData:', error)
      setLoading(false)
    }
  }

  // async function loadDataWithAnnee(districtId: number, anneeId: number) {
  //   // Charger en parallèle
  //   const [stats, deptData] = await Promise.all([
  //     getDistrictStatsForSurintendant(districtId, anneeId),
  //     getAllDepartementsDataForSurintendant(districtId, anneeId)
  //   ])
    
  //   setDistrictStats(stats)
  //   setDepartementsData(deptData)
    
  //   // Extraire les activités récentes et à venir
  //   extractActivities(deptData)
  // }
// Dans surintendant/page.tsx - Remplacer loadDataWithAnnee

async function loadDataWithAnnee(districtId: number, anneeId: number) {
  // UN SEUL appel qui retourne tout !
  const { departementsData, districtStats } = await getAllDistrictData(districtId, anneeId)
  
  setDistrictStats(districtStats)
  setDepartementsData(departementsData)
  
  // Extraire les activités
  extractActivities(departementsData)
}
  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    setLoading(true)
    
    if (surintendantInfo) {
      await loadDataWithAnnee(surintendantInfo.district_id, anneeId)
    }
    
    setLoading(false)
  }

  function extractActivities(deptData: any[]) {
    const allActivities: ActiviteAffichee[] = []
    
    deptData.forEach(dept => {
      dept.paroissesData.forEach((paroisse: any) => {
        paroisse.data.activites.forEach((activite: any) => {
          allActivities.push({
            ...activite,
            // Clé unique combinée pour éviter les doublons React
            uniqueKey: `${activite.id}-${paroisse.paroisse_id}-${dept.departement.id}`,
            paroisse_nom: paroisse.paroisse_nom,
            paroisse_id: paroisse.paroisse_id,
            departement_nom: dept.departement.nom,
            departement_id: dept.departement.id
          })
        })
      })
    })
    
    const maintenant = new Date()
    maintenant.setHours(0, 0, 0, 0)
    
    // Activités récentes (terminées ou passées) - dédupliquées par uniqueKey
    const recentesMap = new Map<string, ActiviteAffichee>()
    allActivities
      .filter(a => new Date(a.date) < maintenant || a.statut === 'termine')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(a => {
        if (!recentesMap.has(a.uniqueKey)) {
          recentesMap.set(a.uniqueKey, a)
        }
      })
    
    // Activités à venir - dédupliquées par uniqueKey
    const aVenirMap = new Map<string, ActiviteAffichee>()
    allActivities
      .filter(a => new Date(a.date) >= maintenant && a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(a => {
        if (!aVenirMap.has(a.uniqueKey)) {
          aVenirMap.set(a.uniqueKey, a)
        }
      })
    
    setRecentActivities(Array.from(recentesMap.values()).slice(0, 5))
    setUpcomingActivities(Array.from(aVenirMap.values()).slice(0, 5))
  }

  function getStatutColor(statut: string) {
    return STATUTS.find(s => s.value === statut)?.color || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr)
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)
    
    const diffTime = date.getTime() - aujourdhui.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Aujourd'hui"
    if (diffDays === 1) return "Demain"
    if (diffDays === -1) return "Hier"
    if (diffDays < 0) return `Il y a ${Math.abs(diffDays)} jours`
    if (diffDays < 7) return `Dans ${diffDays} jours`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  // Si l'utilisateur n'est pas surintendant
  if (!surintendantInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'êtes pas surintendant de ce district</p>
          <Link href="/gestion" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour à l'accueil
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
     {/* Header */}
<div className="mb-8">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-black text-white">
        <LayoutDashboard size={20} />
      </div>
      <div>
        <h1 className="text-2xl font-light tracking-wide">
          Tableau de bord - Surintendant
        </h1>
        <p className="text-sm text-gray-500">
          District de {surintendantInfo.district_nom} • 
          Bienvenue, {surintendantInfo.fidele_prenom} {surintendantInfo.fidele_nom}
        </p>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {/* NOUVEAU BOUTON ACTIVITÉS */}
      <Link
        href={`/surintendant/district/${surintendantInfo.district_id}/activites?annee=${selectedAnnee || ''}`}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:border-black hover:bg-gray-50 transition-colors"
      >
        <Calendar size={16} />
        Toutes les activités
      </Link>
      
      <Link
        href={`/surintendant/district/${surintendantInfo.district_id}?annee=${selectedAnnee || ''}`}
        className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
      >
        Voir tous les départements
        <ArrowUpRight size={14} />
      </Link>
    </div>
  </div>
</div>

      {/* Sélecteur d'année */}
      {anneesDisponibles.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
            <select
              value={selectedAnnee || ''}
              onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px]"
            >
              {anneesDisponibles.map((annee: any) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                  {annee.is_current && ' (en cours)'}
                </option>
              ))}
            </select>
          </div>
          
          {districtStats && (
            <span className="text-xs text-gray-400">
              Données mises à jour pour l'année sélectionnée
            </span>
          )}
        </div>
      )}

      {/* Message si pas d'année */}
      {anneesDisponibles.length === 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          Aucune année de conférence n&apos;est configurée pour votre district.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Users size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalFideles}</span>
          </div>
          <p className="text-xs text-gray-500">Total fidèles</p>
          <div className="flex gap-3 mt-3 text-xs">
            <span className="text-green-600">Actifs: {totalActifs}</span>
            <span className="text-gray-400">Inactifs: {totalFideles - totalActifs}</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Building2 size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalParoisses}</span>
          </div>
          <p className="text-xs text-gray-500">Paroisses</p>
          <p className="text-xs text-gray-400 mt-3">{totalDepartements} départements</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalActivites}</span>
          </div>
          <p className="text-xs text-gray-500">Activités totales</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Target size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalPlans}</span>
          </div>
          <p className="text-xs text-gray-500">Plans d&apos;action</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Briefcase size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalDepartements}</span>
          </div>
          <p className="text-xs text-gray-500">Départements</p>
        </div>
      </div>

      {/* Budget Summary */}
      {districtStats?.totalBudget && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-xs text-green-600 font-medium">RECETTES TOTALES</span>
            </div>
            <p className="text-2xl font-light text-green-700">
              {new Intl.NumberFormat('fr-FR').format(districtStats.totalBudget.recettes)} FC
            </p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">DÉPENSES TOTALES</span>
            </div>
            <p className="text-2xl font-light text-orange-700">
              {new Intl.NumberFormat('fr-FR').format(districtStats.totalBudget.depenses)} FC
            </p>
          </div>
          
          <div className={`border p-4 ${districtStats.totalBudget.solde >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className={districtStats.totalBudget.solde >= 0 ? 'text-blue-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${districtStats.totalBudget.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>SOLDE</span>
            </div>
            <p className={`text-2xl font-light ${districtStats.totalBudget.solde >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {new Intl.NumberFormat('fr-FR').format(districtStats.totalBudget.solde)} FC
            </p>
          </div>
        </div>
      )}

      {/* Deux colonnes : Activités récentes et À venir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activités récentes */}
        <div className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Activités récentes</h3>
            <Link 
              href={`/surintendant/district/${surintendantInfo.district_id}?annee=${selectedAnnee || ''}`}
              className="text-xs text-gray-400 hover:text-black flex items-center gap-1"
            >
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Aucune activité récente
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activite) => (
                  <div key={activite.uniqueKey} className="flex items-start gap-3 p-2 hover:bg-gray-50 transition-colors">
                    <div className="text-center min-w-[50px]">
                      <Clock size={14} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">{formatDate(activite.date)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activite.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={10} />
                          {activite.paroisse_nom}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                          {activite.departement_nom}
                        </span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 border ${getStatutColor(activite.statut)} whitespace-nowrap`}>
                      {STATUTS.find(s => s.value === activite.statut)?.label || activite.statut}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activités à venir */}
        <div className="bg-white border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Activités à venir</h3>
            <Link 
              href={`/surintendant/district/${surintendantInfo.district_id}?annee=${selectedAnnee || ''}`}
              className="text-xs text-gray-400 hover:text-black flex items-center gap-1"
            >
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>
          <div className="p-4">
            {upcomingActivities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Aucune activité à venir
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingActivities.map((activite) => (
                  <div key={activite.uniqueKey} className="flex items-start gap-3 p-2 hover:bg-gray-50 transition-colors">
                    <div className="text-center min-w-[50px]">
                      <Clock size={14} className="mx-auto text-gray-400 mb-1" />
                      <span className="text-xs font-medium text-blue-600">{formatDate(activite.date)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activite.titre}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={10} />
                          {activite.paroisse_nom}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600">
                          {activite.departement_nom}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{activite.heure}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aperçu des départements */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Aperçu des départements</h3>
          <Link 
            href={`/surintendant/district/${surintendantInfo.district_id}?annee=${selectedAnnee || ''}`}
            className="text-xs text-gray-400 hover:text-black flex items-center gap-1"
          >
            Voir tous les départements <ChevronRight size={12} />
          </Link>
        </div>
        <div className="p-4">
          {departementsData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Aucun département trouvé
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departementsData.slice(0, 6).map((deptData: any) => {
                  const totalDeptFideles = deptData.stats?.totalFideles || 
                    deptData.paroissesData.reduce((sum: number, p: any) => sum + p.data.totalFideles, 0)
                  const totalDeptActivites = deptData.stats?.totalActivites || 
                    deptData.paroissesData.reduce((sum: number, p: any) => sum + p.data.activites.length, 0)
                  
                  return (
            <Link
  key={deptData.departement.id}
  href={`/surintendant/departement/${deptData.departement.id}?annee=${selectedAnnee || ''}`}
  className="block p-4 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{deptData.departement.nom}</h4>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                          {deptData.departement.type}
                        </span>
                      </div>
                      {deptData.departement.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{deptData.departement.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={12} />
                          {totalDeptFideles} fidèles
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity size={12} />
                          {totalDeptActivites} activités
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 size={12} />
                          {deptData.paroissesData.length} paroisses
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
              
              {departementsData.length > 6 && (
                <div className="text-center mt-4">
                  <Link
                    href={`/surintendant/district/${surintendantInfo.district_id}?annee=${selectedAnnee || ''}`}
                    className="text-sm text-gray-500 hover:text-black"
                  >
                    Voir les {departementsData.length - 6} autres départements
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}