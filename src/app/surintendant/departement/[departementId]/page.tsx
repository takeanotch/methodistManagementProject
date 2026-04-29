// // app/surintendant/departement/[departementId]/page.tsx

// 'use client'
// import { useCallback } from 'react'
// import { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { useParams, useSearchParams } from 'next/navigation'
// import { 
//   Loader2, 
//   Users, 
//   Calendar, 
//   Target,
//   ChevronRight,
//   Building2,
//   Activity,
//   AlertCircle,
//   ChevronLeft,
//   FolderOpen,
//   Briefcase,
//   LayoutDashboard
// } from 'lucide-react'
// import { getSurintendantInfo } from '@/actions/surintendant'
// import { getAllDistrictData } from '@/actions/surintendant'
// import { getActivitesByUnite } from '@/actions/activite'
// import { supabase } from '@/lib/supabase'
// import { 
//   ActivitesPage, 
//   type UniteOrganisationSimple, 
//   type AnneeConference, 
//   type ActiviteAffichee 
// } from '@/components/ActivitesPage'

// const STATUTS = [
//   { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200' },
//   { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
//   { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200' },
//   { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200' }
// ]

// interface ParoisseData {
//   paroisse_id: number
//   paroisse_nom: string
//   unite_id: number | null
//   data: {
//     totalFideles: number
//     actifs: number
//     inactifs: number
//     activites: any[]
//     plansAction: any[]
//     projets: any[]
//   }
// }

// export default function SurintendantDepartementPage() {
//   const params = useParams()
//   const searchParams = useSearchParams()
  
//   const departementId = parseInt(params.departementId as string)
//   const anneeParam = searchParams.get('annee')
  
//   const [loading, setLoading] = useState(true)
//   const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
//   const [departementInfo, setDepartementInfo] = useState<any>(null)
//   const [paroissesData, setParoissesData] = useState<ParoisseData[]>([])
//   const [departementStats, setDepartementStats] = useState<any>(null)
//   const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
//   const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
//   const [isLoadingData, setIsLoadingData] = useState(false)
  
//   // États pour l'onglet actif
//   const [activeTab, setActiveTab] = useState<'paroisses' | 'activites'>('paroisses')
  
//   // États pour l'onglet activités
//   const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationSimple[]>([])
//   const [loadingActivitesConfig, setLoadingActivitesConfig] = useState(false)

//   useEffect(() => {
//     loadData()
//   }, [departementId])

//   async function loadData() {
//     try {
//       setLoading(true)
      
//       const info = await getSurintendantInfo()
//       if (!info) {
//         setLoading(false)
//         return
//       }
//       setSurintendantInfo(info)

//       // Récupérer les infos du département
//       const { data: departement } = await supabase
//         .from('departement')
//         .select('id, nom, type, description')
//         .eq('id', departementId)
//         .single()

//       if (departement) {
//         setDepartementInfo(departement)
//       }

//       // Récupérer les années disponibles
//       const { data: district } = await supabase
//         .from('district')
//         .select('conference_id')
//         .eq('id', info.district_id)
//         .single()

//       if (district?.conference_id) {
//         const { data: annees } = await supabase
//           .from('annee_conference')
//           .select(`
//             id,
//             annee_id,
//             is_current,
//             annee:annee_id (id, label)
//           `)
//           .eq('conference_id', district.conference_id)
//           .order('annee_id', { ascending: false })

//         if (annees) {
//           const formattedAnnees: AnneeConference[] = annees.map((item: any) => {
//             const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
//             return {
//               id: item.id,
//               annee_id: item.annee_id,
//               label: annee?.label || `Année ${item.annee_id}`,
//               is_current: item.is_current
//             }
//           })
//           setAnneesDisponibles(formattedAnnees)

//           let currentAnneeId: number | null = null
//           if (anneeParam && !isNaN(parseInt(anneeParam))) {
//             currentAnneeId = parseInt(anneeParam)
//           } else {
//             const currentAnnee = formattedAnnees.find((a: any) => a.is_current)
//             if (currentAnnee) {
//               currentAnneeId = currentAnnee.id
//             } else if (formattedAnnees.length > 0) {
//               currentAnneeId = formattedAnnees[0].id
//             }
//           }

//           if (currentAnneeId) {
//             setSelectedAnnee(currentAnneeId)
//             await loadDepartementData(info.district_id, currentAnneeId)
//             await loadUnitesForActivites()
//           }
//         }
//       }

//       setLoading(false)
//     } catch (error) {
//       console.error('Erreur loadData:', error)
//       setLoading(false)
//     }
//   }

//   async function loadDepartementData(districtId: number, anneeId: number) {
//     setIsLoadingData(true)
//     try {
//       const { departementsData } = await getAllDistrictData(districtId, anneeId)
      
//       // Trouver le département spécifique
//       const deptData = departementsData.find((d: any) => d.departement.id === departementId)
      
//       if (deptData) {
//         setParoissesData(deptData.paroissesData)
//         setDepartementStats(deptData.stats)
//       }
//     } catch (error) {
//       console.error('Erreur chargement données département:', error)
//     } finally {
//       setIsLoadingData(false)
//     }
//   }



//   const loadActivitesForUnite = useCallback(async (uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> => {
//   console.log('🎯 loadActivitesForUnite appelé:', { uniteId, anneeId })
//   const result = await getActivitesByUnite(uniteId, anneeId)
//   console.log('📦 Résultat getActivitesByUnite:', result.length, 'activités')
//   return result
// }, []) // ← Dépendances vides = fonction stable




//   async function loadUnitesForActivites() {
//     try {
//       setLoadingActivitesConfig(true)
      
//       // Récupérer toutes les paroisses du département
//       const { data: paroisses } = await supabase
//         .from('paroisse')
//         .select('id, nom')
//         .eq('departement_id', departementId)
//         .order('nom', { ascending: true })
      
//       if (!paroisses) {
//         setUnitesForActivites([])
//         return
//       }

//       const unites: UniteOrganisationSimple[] = []
      
//       for (const paroisse of paroisses) {
//         const { data: uniteData } = await supabase
//           .from('unite_organisation')
//           .select('id, nom, reference_id')
//           .eq('reference_table', 'departement')
//           .eq('reference_id', departementId)
//           .eq('id_niveau', paroisse.id)
//           .eq('niveau', 'paroisse')
//           .single()
        
//         if (uniteData) {
//           unites.push({
//             id: uniteData.id,
//             nom: uniteData.nom,
//             reference_id: uniteData.reference_id,
//             paroisse_id: paroisse.id,
//             paroisse_nom: paroisse.nom
//           })
//         }
//       }
      
//       setUnitesForActivites(unites)
//     } catch (error) {
//       console.error('Erreur chargement unités:', error)
//     } finally {
//       setLoadingActivitesConfig(false)
//     }
//   }

//   async function handleAnneeChange(anneeId: number) {
//     setSelectedAnnee(anneeId)
//     if (surintendantInfo) {
//       await loadDepartementData(surintendantInfo.district_id, anneeId)
//     }
//   }

// //   async function loadActivitesForUnite(uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> {
// //     return await getActivitesByUnite(uniteId, anneeId)
// //   }

//   function getStatutColor(statut: string) {
//     return STATUTS.find(s => s.value === statut)?.color || 'bg-gray-50 text-gray-700 border-gray-200'
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Loader2 className="animate-spin text-gray-400" size={32} />
//       </div>
//     )
//   }

//   if (!surintendantInfo) {
//     return (
//       <div className="p-6 max-w-7xl mx-auto">
//         <div className="text-center py-12">
//           <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
//           <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
//           <p className="text-gray-500">Vous n'êtes pas surintendant de ce district</p>
//           <Link href="/surintendant" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
//             Retour au tableau de bord
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   const totalFideles = departementStats?.totalFideles || 
//     paroissesData.reduce((sum, p) => sum + p.data.totalFideles, 0)
//   const totalActifs = departementStats?.totalActifs || 
//     paroissesData.reduce((sum, p) => sum + p.data.actifs, 0)
//   const totalActivites = departementStats?.totalActivites || 
//     paroissesData.reduce((sum, p) => sum + p.data.activites.length, 0)
//   const totalPlans = departementStats?.totalPlans || 
//     paroissesData.reduce((sum, p) => sum + p.data.plansAction.length, 0)
//   const totalProjets = departementStats?.totalProjets || 
//     paroissesData.reduce((sum, p) => sum + (p.data.projets?.length || 0), 0)

//   // Si l'onglet activités est actif, on affiche le composant ActivitesPage
//   if (activeTab === 'activites') {
//     return (
//       <div className="p-6 max-w-7xl mx-auto">
//         <ActivitesPage
//           config={{
//             title: `Activités - ${departementInfo?.nom || 'Département'}`,
//             subtitle: `District de ${surintendantInfo.district_nom}`,
//             backUrl: `/surintendant/departement/${departementId}?annee=${selectedAnnee || ''}`,
//             backLabel: "Retour au département",
//             showParoisseColumn: true,
//             showDepartementColumn: false,
//             unites: unitesForActivites,
//             anneesDisponibles: anneesDisponibles,
//             currentAnneeId: selectedAnnee || undefined,
//             onLoadActivites: loadActivitesForUnite,
//             onAnneeChange: handleAnneeChange,
//             emptyStateMessage: "Aucune activité pour ce département"
//           }}
//           loading={loadingActivitesConfig}
//         />
//       </div>
//     )
//   }

//   // Vue paroisses (tableau de bord du département)
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <Link
//           href="/surintendant"
//           className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
//         >
//           <ChevronLeft size={18} />
//           Retour au tableau de bord
//         </Link>
        
//         <div className="flex items-start justify-between">
//           <div>
//             <div className="flex items-center gap-3 mb-2">
//               <Briefcase size={24} className="text-gray-400" />
//               <div>
//                 <h1 className="text-2xl font-light tracking-wide">
//                   {departementInfo?.nom || 'Département'}
//                 </h1>
//                 <p className="text-sm text-gray-500">
//                   District de {surintendantInfo.district_nom} • {paroissesData.length} paroisses
//                 </p>
//               </div>
//             </div>
//             {departementInfo?.description && (
//               <p className="text-sm text-gray-500 ml-11">{departementInfo.description}</p>
//             )}
//           </div>
          
//           <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-sm">
//             {departementInfo?.type || 'Département'}
//           </span>
//         </div>
//       </div>

//       {/* Sélecteur d'année */}
//       <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
//         <div className="flex items-center gap-4 flex-wrap">
//           <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
//           {anneesDisponibles.length > 0 ? (
//             <select
//               value={selectedAnnee || ''}
//               onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
//               className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px]"
//               disabled={isLoadingData}
//             >
//               {anneesDisponibles.map((annee) => (
//                 <option key={annee.id} value={annee.id}>
//                   {annee.label}
//                   {annee.is_current && ' (en cours)'}
//                 </option>
//               ))}
//             </select>
//           ) : (
//             <span className="text-sm text-orange-600 flex items-center gap-2">
//               <AlertCircle size={16} />
//               Aucune année configurée
//             </span>
//           )}
          
//           {isLoadingData && (
//             <Loader2 size={16} className="animate-spin text-gray-400" />
//           )}
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
//         <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
//           <div className="flex items-center justify-between">
//             <Users size={18} className="text-gray-400" />
//             <span className="text-xl font-light">{totalFideles}</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">Total fidèles</p>
//           <div className="flex gap-3 mt-2 text-xs">
//             <span className="text-green-600">Actifs: {totalActifs}</span>
//             <span className="text-gray-400">Inactifs: {totalFideles - totalActifs}</span>
//           </div>
//         </div>
        
//         <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
//           <div className="flex items-center justify-between">
//             <Activity size={18} className="text-gray-400" />
//             <span className="text-xl font-light">{totalActivites}</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">Activités</p>
//         </div>
        
//         <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
//           <div className="flex items-center justify-between">
//             <Target size={18} className="text-gray-400" />
//             <span className="text-xl font-light">{totalPlans}</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">Plans d'action</p>
//         </div>
        
//         <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
//           <div className="flex items-center justify-between">
//             <FolderOpen size={18} className="text-gray-400" />
//             <span className="text-xl font-light">{totalProjets}</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">Projets</p>
//         </div>
        
//         <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
//           <div className="flex items-center justify-between">
//             <Building2 size={18} className="text-gray-400" />
//             <span className="text-xl font-light">{paroissesData.length}</span>
//           </div>
//           <p className="text-xs text-gray-500 mt-1">Paroisses</p>
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-6 mb-6 border-b border-gray-200">
//         <button
//           onClick={() => setActiveTab('paroisses')}
//           className={`px-1 py-3 text-sm transition-colors ${
//             activeTab === 'paroisses' 
//               ? 'font-medium text-black border-b-2 border-black' 
//               : 'text-gray-500 hover:text-black'
//           }`}
//         >
//           <Building2 size={14} className="inline mr-1" />
//           Paroisses ({paroissesData.length})
//         </button>
//         <button
//           onClick={() => setActiveTab('activites')}
//           className={`px-1 py-3 text-sm transition-colors ${
//             activeTab === 'activites' 
//               ? 'font-medium text-black border-b-2 border-black' 
//               : 'text-gray-500 hover:text-black'
//           }`}
//         >
//           <Calendar size={14} className="inline mr-1" />
//           Activités ({totalActivites})
//         </button>
//       </div>

//       {/* Message si pas d'année */}
//       {anneesDisponibles.length > 0 && !selectedAnnee && !isLoadingData && (
//         <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-sm flex items-center gap-2">
//           <AlertCircle size={16} />
//           Veuillez sélectionner une année pour voir les activités et plans d'action
//         </div>
//       )}

//       {/* Liste des paroisses */}
//       {isLoadingData ? (
//         <div className="p-8 text-center">
//           <Loader2 className="animate-spin text-gray-400 mx-auto" size={24} />
//           <p className="text-sm text-gray-400 mt-2">Chargement des paroisses...</p>
//         </div>
//       ) : paroissesData.length === 0 ? (
//         <div className="bg-white border border-gray-200 py-12 text-center rounded-sm">
//           <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400">Aucune paroisse trouvée</p>
//         </div>
//       ) : (
//         <div className="space-y-4">
//           {paroissesData.map((paroisse) => (
//             <Link
//               key={paroisse.paroisse_id}
//               href={`/surintendant/departement/${departementId}/paroisse/${paroisse.paroisse_id}?annee=${selectedAnnee || ''}`}
//               className="block bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-sm"
//             >
//               <div className="p-5">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-2">
//                       <h3 className="font-medium text-lg">{paroisse.paroisse_nom}</h3>
//                       {!paroisse.unite_id && (
//                         <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-sm">
//                           Unité non configurée
//                         </span>
//                       )}
//                     </div>
                    
//                     <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
//                       <span className="flex items-center gap-1">
//                         <Users size={14} />
//                         {paroisse.data.totalFideles} fidèles
//                       </span>
//                       <span className="flex items-center gap-1">
//                         <Activity size={14} />
//                         {paroisse.data.activites.length} activités
//                       </span>
//                       <span className="flex items-center gap-1">
//                         <Target size={14} />
//                         {paroisse.data.plansAction.length} plans
//                       </span>
//                     </div>
                    
//                     {/* Activités récentes */}
//                     {paroisse.data.activites && paroisse.data.activites.length > 0 && (
//                       <div className="mt-4">
//                         <p className="text-xs text-gray-400 mb-2">Activités :</p>
//                         <div className="flex flex-wrap gap-2">
//                           {paroisse.data.activites.slice(0, 3).map((act: any) => (
//                             <span 
//                               key={act.id} 
//                               className={`text-xs px-2 py-1 border rounded-sm flex items-center gap-1 ${getStatutColor(act.statut)}`}
//                             >
//                               <Calendar size={10} />
//                               {act.titre}
//                             </span>
//                           ))}
//                           {paroisse.data.activites.length > 3 && (
//                             <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm">
//                               +{paroisse.data.activites.length - 3} autres
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     )}
//                   </div>
                  
//                   <ChevronRight size={18} className="text-gray-400" />
//                 </div>
//               </div>
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }


// app/surintendant/departement/[departementId]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { 
  Loader2, 
  Users, 
  Calendar, 
  Target,
  ChevronRight,
  Building2,
  Activity,
  AlertCircle,
  ChevronLeft,
  FolderOpen,
  Briefcase,
} from 'lucide-react'
import { getSurintendantInfo } from '@/actions/surintendant'
import { getAllDistrictData } from '@/actions/surintendant'
import { getActivitesByUnite } from '@/actions/activite'
import { supabase } from '@/lib/supabase'
import { 
  ActivitesPage, 
  type UniteOrganisationSimple, 
  type AnneeConference, 
  type ActiviteAffichee 
} from '@/components/ActivitesPage'

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200' }
]

interface ParoisseData {
  paroisse_id: number
  paroisse_nom: string
  unite_id: number | null
  data: {
    totalFideles: number
    actifs: number
    inactifs: number
    activites: any[]
    plansAction: any[]
    projets: any[]
  }
}

const TABS = {
  PAROISSES: 'paroisses' as const,
  ACTIVITES: 'activites' as const,
} as const

type TabType = typeof TABS[keyof typeof TABS]


export default function SurintendantDepartementPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  
  const departementId = parseInt(params.departementId as string)
  const anneeParam = searchParams.get('annee')
  
  const [loading, setLoading] = useState(true)
  const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
  const [departementInfo, setDepartementInfo] = useState<any>(null)
  const [paroissesData, setParoissesData] = useState<ParoisseData[]>([])
  const [departementStats, setDepartementStats] = useState<any>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>(TABS.PAROISSES)
  

  // États pour l'onglet activités - PLUS BESOIN de les charger séparément
  const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationSimple[]>([])

  useEffect(() => {
    loadData()
  }, [departementId])

  async function loadData() {
    try {
      setLoading(true)
      
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

      if (departement) {
        setDepartementInfo(departement)
      }

      // Récupérer les années disponibles
      const { data: district } = await supabase
        .from('district')
        .select('conference_id')
        .eq('id', info.district_id)
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
          const formattedAnnees: AnneeConference[] = annees.map((item: any) => {
            const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
            return {
              id: item.id,
              annee_id: item.annee_id,
              label: annee?.label || `Année ${item.annee_id}`,
              is_current: item.is_current
            }
          })
          setAnneesDisponibles(formattedAnnees)

          let currentAnneeId: number | null = null
          if (anneeParam && !isNaN(parseInt(anneeParam))) {
            currentAnneeId = parseInt(anneeParam)
          } else {
            const currentAnnee = formattedAnnees.find((a: any) => a.is_current)
            if (currentAnnee) {
              currentAnneeId = currentAnnee.id
            } else if (formattedAnnees.length > 0) {
              currentAnneeId = formattedAnnees[0].id
            }
          }

          if (currentAnneeId) {
            setSelectedAnnee(currentAnneeId)
            await loadDepartementData(info.district_id, currentAnneeId)
          }
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur loadData:', error)
      setLoading(false)
    }
  }

  async function loadDepartementData(districtId: number, anneeId: number) {
    setIsLoadingData(true)
    try {
      // UTILISER LA MÊME FONCTION QUE LE DASHBOARD
      const { departementsData } = await getAllDistrictData(districtId, anneeId)
      
      // Trouver le département spécifique
      const deptData = departementsData.find((d: any) => d.departement.id === departementId)
      
      if (deptData) {
        setParoissesData(deptData.paroissesData)
        setDepartementStats(deptData.stats)
        
        // EXTRAIRE LES UNITÉS DIRECTEMENT DES DONNÉES DU DÉPARTEMENT
        // Comme dans extractActivities du dashboard
        const unites: UniteOrganisationSimple[] = []
        
        for (const paroisse of deptData.paroissesData) {
          // L'unite_id est déjà dans les données !
          if (paroisse.unite_id) {
            // Récupérer le nom de l'unité si nécessaire
            const { data: uniteData } = await supabase
              .from('unite_organisation')
              .select('nom, reference_id')
              .eq('id', paroisse.unite_id)
              .single()
            
            unites.push({
              id: paroisse.unite_id,
              nom: uniteData?.nom || deptData.departement.nom,
              reference_id: uniteData?.reference_id || departementId,
              paroisse_id: paroisse.paroisse_id,
              paroisse_nom: paroisse.paroisse_nom
            })
          }
        }
        
        console.log('📊 Unités extraites des données:', unites.length)
        setUnitesForActivites(unites)
      }
    } catch (error) {
      console.error('Erreur chargement données département:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const loadActivitesForUnite = useCallback(async (uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> => {
    return await getActivitesByUnite(uniteId, anneeId)
  }, [])

  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    if (surintendantInfo) {
      await loadDepartementData(surintendantInfo.district_id, anneeId)
    }
  }

  function getStatutColor(statut: string) {
    return STATUTS.find(s => s.value === statut)?.color || 'bg-gray-50 text-gray-700 border-gray-200'
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
          <p className="text-gray-500">Vous n'êtes pas surintendant de ce district</p>
          <Link href="/surintendant" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  const totalFideles = departementStats?.totalFideles || 
    paroissesData.reduce((sum, p) => sum + p.data.totalFideles, 0)
  const totalActifs = departementStats?.totalActifs || 
    paroissesData.reduce((sum, p) => sum + p.data.actifs, 0)
  const totalActivites = departementStats?.totalActivites || 
    paroissesData.reduce((sum, p) => sum + p.data.activites.length, 0)
  const totalPlans = departementStats?.totalPlans || 
    paroissesData.reduce((sum, p) => sum + p.data.plansAction.length, 0)
  const totalProjets = departementStats?.totalProjets || 
    paroissesData.reduce((sum, p) => sum + (p.data.projets?.length || 0), 0)

  // Si l'onglet activités est actif
  if (activeTab === 'activites') {
    return (
      <ActivitesPage
        config={{
          title: `Activités - ${departementInfo?.nom || 'Département'}`,
          subtitle: `District de ${surintendantInfo.district_nom}`,
          backUrl: `/surintendant/departement/${departementId}?annee=${selectedAnnee || ''}`,
          backLabel: "Retour au département",
          showParoisseColumn: true,
          showDepartementColumn: false,
          unites: unitesForActivites,
          anneesDisponibles: anneesDisponibles,
          currentAnneeId: selectedAnnee || undefined,
          onLoadActivites: loadActivitesForUnite,
          onAnneeChange: handleAnneeChange,
          emptyStateMessage: "Aucune activité pour ce département"
        }}
        loading={false}
      />
    )
  }

  // Vue paroisses (tableau de bord du département)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/surintendant"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
        >
          <ChevronLeft size={18} />
          Retour au tableau de bord
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Briefcase size={24} className="text-gray-400" />
              <div>
                <h1 className="text-2xl font-light tracking-wide">
                  {departementInfo?.nom || 'Département'}
                </h1>
                <p className="text-sm text-gray-500">
                  District de {surintendantInfo.district_nom} • {paroissesData.length} paroisses
                </p>
              </div>
            </div>
            {departementInfo?.description && (
              <p className="text-sm text-gray-500 ml-11">{departementInfo.description}</p>
            )}
          </div>
          
          <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-sm">
            {departementInfo?.type || 'Département'}
          </span>
        </div>
      </div>

      {/* Sélecteur d'année */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
          {anneesDisponibles.length > 0 ? (
            <select
              value={selectedAnnee || ''}
              onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px]"
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
              Aucune année configurée
            </span>
          )}
          
          {isLoadingData && (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <Users size={18} className="text-gray-400" />
            <span className="text-xl font-light">{totalFideles}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total fidèles</p>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-600">Actifs: {totalActifs}</span>
            <span className="text-gray-400">Inactifs: {totalFideles - totalActifs}</span>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <Activity size={18} className="text-gray-400" />
            <span className="text-xl font-light">{totalActivites}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Activités</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <Target size={18} className="text-gray-400" />
            <span className="text-xl font-light">{totalPlans}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Plans d'action</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <FolderOpen size={18} className="text-gray-400" />
            <span className="text-xl font-light">{totalProjets}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Projets</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4 rounded-sm hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <Building2 size={18} className="text-gray-400" />
            <span className="text-xl font-light">{paroissesData.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Paroisses</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <button
    onClick={() => setActiveTab(TABS.PAROISSES)}
    className={`px-1 py-3 text-sm transition-colors ${
      activeTab === TABS.PAROISSES 
        ? 'font-medium text-black border-b-2 border-black' 
        : 'text-gray-500 hover:text-black'
    }`}
  >
          <Building2 size={14} className="inline mr-1" />
          Paroisses ({paroissesData.length})
        </button>
        <button
    onClick={() => setActiveTab(TABS.ACTIVITES as TabType)}
    className={`px-1 py-3 text-sm transition-colors ${
      (activeTab as TabType) === TABS.ACTIVITES 
        ? 'font-medium text-black border-b-2 border-black' 
        : 'text-gray-500 hover:text-black'
    }`}
  >
          <Calendar size={14} className="inline mr-1" />
          Activités ({totalActivites})
        </button>
      </div>

      {/* Liste des paroisses */}
      {isLoadingData ? (
        <div className="p-8 text-center">
          <Loader2 className="animate-spin text-gray-400 mx-auto" size={24} />
          <p className="text-sm text-gray-400 mt-2">Chargement des paroisses...</p>
        </div>
      ) : paroissesData.length === 0 ? (
        <div className="bg-white border border-gray-200 py-12 text-center rounded-sm">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune paroisse trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paroissesData.map((paroisse) => (
            <Link
              key={paroisse.paroisse_id}
              href={`/surintendant/departement/${departementId}/paroisse/${paroisse.paroisse_id}?annee=${selectedAnnee || ''}`}
              className="block bg-white border border-gray-200 hover:border-gray-300 transition-colors rounded-sm"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">{paroisse.paroisse_nom}</h3>
                      {!paroisse.unite_id && (
                        <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-sm">
                          Unité non configurée
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
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
                    
                    {paroisse.data.activites && paroisse.data.activites.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-400 mb-2">Activités :</p>
                        <div className="flex flex-wrap gap-2">
                          {paroisse.data.activites.slice(0, 3).map((act: any) => (
                            <span 
                              key={act.id} 
                              className={`text-xs px-2 py-1 border rounded-sm flex items-center gap-1 ${getStatutColor(act.statut)}`}
                            >
                              <Calendar size={10} />
                              {act.titre}
                            </span>
                          ))}
                          {paroisse.data.activites.length > 3 && (
                            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 border border-gray-200 rounded-sm">
                              +{paroisse.data.activites.length - 3} autres
                            </span>
                          )}
                        </div>
                      </div>
                    )}
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