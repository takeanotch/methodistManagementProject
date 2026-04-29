

// app/chef/departement/conference/[districtId]/page.tsx

'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Loader2, 
  Building2, 
  ChevronLeft, 
  Users, 
  Activity, 
  Target, 
  ChevronRight, 
  Calendar, 
  AlertCircle,
  UserCheck
} from 'lucide-react'
import { getChefConferenceInfo } from '@/actions/chef-conference'
import { getDistrictById, getAllParoissesConferenceData, getAnneesForConference } from '@/actions/chef-conference'
import { getActivitesByUnite } from '@/actions/activite'
import { supabase } from '@/lib/supabase'
import { 
  ActivitesPage, 
  type UniteOrganisationSimple, 
  type AnneeConference, 
  type ActiviteAffichee 
} from '@/components/ActivitesPage'

interface PageProps {
  params: Promise<{ districtId: string }>
}

export default function ConferenceDistrictPage({ params }: PageProps) {
  const { districtId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const anneeParam = searchParams.get('annee')
  
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<any>(null)
  const [district, setDistrict] = useState<any>(null)
  const [paroissesData, setParoissesData] = useState<any[]>([])
  const [anneeConferenceId, setAnneeConferenceId] = useState<number | null>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // États pour l'onglet activités
  const [activeMainTab, setActiveMainTab] = useState<'paroisses' | 'activites'>('paroisses')
  const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationSimple[]>([])
  const [loadingActivitesConfig, setLoadingActivitesConfig] = useState(false)

  useEffect(() => {
    loadData()
  }, [districtId])

  useEffect(() => {
    if (chefInfo && anneeConferenceId) {
      loadParoissesWithAnnee()
    }
  }, [anneeConferenceId])

  async function loadData() {
    try {
      setLoading(true)
      
      const chef = await getChefConferenceInfo()
      if (!chef) {
        router.push('/chef/departement')
        return
      }
      setChefInfo(chef)

      const districtData = await getDistrictById(parseInt(districtId))
      if (!districtData) {
        router.push('/chef/departement/conference')
        return
      }
      setDistrict(districtData)

      // Récupérer les années disponibles pour la conférence
      const annees = await getAnneesForConference(chef.conference_id)
      const anneesFormatted: AnneeConference[] = annees.map((a: any) => ({
        id: a.id,
        label: a.label,
        is_current: a.is_current || false
      }))
      setAnneesDisponibles(anneesFormatted)
      
      // Sélectionner l'année (depuis URL ou par défaut)
      let selectedAnnee: number | null = null
      
      if (anneeParam && !isNaN(parseInt(anneeParam))) {
        selectedAnnee = parseInt(anneeParam)
      } else {
        const currentAnnee = annees.find((a: any) => a.is_current)
        if (currentAnnee) {
          selectedAnnee = currentAnnee.id
        } else if (annees.length > 0) {
          selectedAnnee = annees[0].id
        }
      }
      
      if (selectedAnnee) {
        setAnneeConferenceId(selectedAnnee)
        await loadParoissesWithAnnee(selectedAnnee)
        await loadUnitesForActivites(chef.departement_id, parseInt(districtId))
      } else {
        setParoissesData([])
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
    }
  }

  async function loadParoissesWithAnnee(anneeId?: number) {
    const anneeToUse = anneeId || anneeConferenceId
    if (!chefInfo || !anneeToUse) return
    
    setIsLoadingData(true)
    console.log(`🔄 loadParoissesWithAnnee: anneeConferenceId = ${anneeToUse}`)
    
    // Récupérer toutes les paroisses de la conférence avec l'année
    const allParoisses = await getAllParoissesConferenceData(
      chefInfo.departement_id,
      chefInfo.conference_id,
      anneeToUse
    )
    
    // Filtrer par district
    const filtered = allParoisses.filter(p => p.district_id === parseInt(districtId))
    
    console.log(`📊 ${filtered.length} paroisses trouvées pour le district`)
    filtered.forEach(p => {
      console.log(`  - ${p.paroisse_nom}: ${p.data.activites.length} activités`)
    })
    
    setParoissesData(filtered)
    setIsLoadingData(false)
  }

  async function loadUnitesForActivites(departementId: number, districtId: number) {
    try {
      setLoadingActivitesConfig(true)
      
      // Récupérer toutes les paroisses du district
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
        // Récupérer l'unité départementale pour cette paroisse
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
    router.push(`/chef/departement/conference/${districtId}?annee=${anneeId}`)
  }

  async function loadActivitesForUnite(uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> {
    return await getActivitesByUnite(uniteId, anneeId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  if (!chefInfo || !district) {
    return null
  }

  const totalFideles = paroissesData.reduce((sum, p) => sum + p.data.totalFideles, 0)
  const totalActifs = paroissesData.reduce((sum, p) => sum + p.data.actifs, 0)
  const totalActivites = paroissesData.reduce((sum, p) => sum + p.data.activites.length, 0)
  const totalPlans = paroissesData.reduce((sum, p) => sum + p.data.plansAction.length, 0)

  // Si l'on  glet activités est actif, on affiche le composant ActivitesPage
  if (activeMainTab === 'activites') {
    return (
      <div className="max-w-7xl mx-auto">
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
            title: `Activités de tous les departements du district ${district.nom}`,
            subtitle: `${district.nom} - ${chefInfo.departement_nom}`,
            backUrl: "",
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
      {/* Header avec navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/chef/departement/conference"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">{district.nom}</h1>
            <p className="text-sm text-gray-500">
              {chefInfo.departement_nom} • {paroissesData.length} paroisses
            </p>
          </div>
        </div>
      </div>

      {/* Stats globales */}
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

      {/* Sélecteur d'année */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
          {anneesDisponibles.length > 0 ? (
            <select
              value={anneeConferenceId || ''}
              onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px] rounded-sm"
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
              Aucune année configurée
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
      {anneesDisponibles.length > 0 && !anneeConferenceId && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-sm">
          Veuillez sélectionner une année pour voir les activités et plans d'action
        </div>
      )}

      {/* Liste des paroisses */}
      <div className="space-y-4">
        {paroissesData.length === 0 ? (
          <div className="bg-white border border-gray-200 py-12 text-center rounded-sm">
            <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">
              {anneeConferenceId ? 'Aucune paroisse trouvée' : 'Sélectionnez une année pour voir les données'}
            </p>
          </div>
        ) : (
          paroissesData.map((paroisse) => (
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

                    {/* Activités récentes */}
                    {paroisse.data.activitesRecentes && paroisse.data.activitesRecentes.length > 0 && (
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <Calendar size={12} className="text-gray-400" />
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
                    )}
                    
                    {/* Message si pas d'activités mais unité existe */}
                    {anneeConferenceId && paroisse.data.activites.length === 0 && paroisse.unite_id && (
                      <p className="text-xs text-gray-400 mt-2">
                        Aucune activité pour l'année sélectionnée
                      </p>
                    )}
                  </div>
                  
                  <ChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}