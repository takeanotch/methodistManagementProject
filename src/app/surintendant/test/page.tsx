// // app/surintendant/test/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { 
//   Loader2, 
//   Building2,
//   Activity,
//   Target,
//   AlertCircle,
//   LayoutDashboard,
//   FolderOpen,
//   ChevronRight,
//   ChevronLeft,
//   Users,
//   Calendar,
//   CheckCircle2,
//   Clock,
//   XCircle
// } from 'lucide-react'
// import { 
//   getSurintendantInfo, 
//   getAllDepartementsDataForSurintendant, 
//   getDistrictStatsForSurintendant, 
//   getAnneesDisponiblesForDistrict,
//   getAllDepartements,
//   type DepartementSummary, 
//   type DistrictStats 
// } from '@/actions/surintendant'
// import { getActivitesByUnite } from '@/actions/activite'
// import { supabase } from '@/lib/supabase'
// import { 
//   ActivitesPage, 
//   type UniteOrganisationSimple, 
//   type AnneeConference, 
//   type ActiviteAffichee 
// } from '@/components/ActivitesPage'

// // Composants Skeleton
// function HeaderSkeleton() {
//   return (
//     <div className="mb-8 animate-pulse">
//       <div className="flex items-center gap-3 mb-2">
//         <div className="w-10 h-10 bg-gray-200" />
//         <div>
//           <div className="w-48 h-8 bg-gray-200 rounded mb-1" />
//           <div className="w-64 h-4 bg-gray-200 rounded" />
//         </div>
//       </div>
//     </div>
//   )
// }

// function StatsSkeleton() {
//   return (
//     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//       {[...Array(4)].map((_, i) => (
//         <div key={i} className="bg-white border border-gray-200 p-4 animate-pulse">
//           <div className="flex items-center justify-between">
//             <div className="w-5 h-5 bg-gray-200 rounded" />
//             <div className="w-8 h-8 bg-gray-200 rounded" />
//           </div>
//           <div className="w-20 h-3 bg-gray-200 rounded mt-1" />
//         </div>
//       ))}
//     </div>
//   )
// }

// function AnneeSelectorSkeleton() {
//   return (
//     <div className="mb-6 p-4 bg-gray-50 border border-gray-200 animate-pulse">
//       <div className="flex items-center gap-4">
//         <div className="w-40 h-5 bg-gray-200 rounded" />
//         <div className="w-[200px] h-10 bg-gray-200 rounded" />
//       </div>
//     </div>
//   )
// }

// function DepartementCardSkeleton() {
//   return (
//     <div className="bg-white border border-gray-200 p-5 animate-pulse">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-5 h-5 bg-gray-200 rounded" />
//             <div className="w-40 h-6 bg-gray-200 rounded" />
//           </div>
//           <div className="grid grid-cols-4 gap-4">
//             <div>
//               <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
//               <div className="w-8 h-7 bg-gray-200 rounded" />
//             </div>
//             <div>
//               <div className="w-20 h-3 bg-gray-200 rounded mb-1" />
//               <div className="w-8 h-7 bg-gray-200 rounded" />
//             </div>
//             <div>
//               <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
//               <div className="w-8 h-7 bg-gray-200 rounded" />
//             </div>
//             <div>
//               <div className="w-16 h-3 bg-gray-200 rounded mb-1" />
//               <div className="w-8 h-7 bg-gray-200 rounded" />
//             </div>
//           </div>
//         </div>
//         <div className="w-5 h-5 bg-gray-200 rounded" />
//       </div>
//     </div>
//   )
// }

// function DepartementsListSkeleton() {
//   return (
//     <div className="space-y-4">
//       {[...Array(4)].map((_, i) => (
//         <DepartementCardSkeleton key={i} />
//       ))}
//     </div>
//   )
// }

// export default function SurintendantTestPage() {
//   const [loading, setLoading] = useState(true)
//   const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
//   const [departementsData, setDepartementsData] = useState<DepartementSummary[]>([])
//   const [districtStats, setDistrictStats] = useState<DistrictStats | null>(null)
//   const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
//   const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
//   const [loadingStats, setLoadingStats] = useState(false)
//   const [initialDataLoaded, setInitialDataLoaded] = useState(false)
  
//   // États pour l'onglet activités
//   const [activeMainTab, setActiveMainTab] = useState<'departements' | 'activites'>('departements')
//   const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationSimple[]>([])
//   const [loadingActivitesConfig, setLoadingActivitesConfig] = useState(false)

//   useEffect(() => {
//     loadData()
//   }, [])

//   async function loadData() {
//     try {
//       setLoading(true)
      
//       const info = await getSurintendantInfo()
//       if (!info) {
//         setLoading(false)
//         setInitialDataLoaded(true)
//         return
//       }
//       setSurintendantInfo(info)

//       // Récupérer les années disponibles
//       const annees = await getAnneesDisponiblesForDistrict(info.district_id)
//       const anneesFormatted: AnneeConference[] = annees.map((a: any) => ({
//         id: a.id,
//         label: a.label,
//         is_current: a.is_current || false
//       }))
//       setAnneesDisponibles(anneesFormatted)
      
//       let anneeId: number | null = null
//       const currentAnnee = annees.find((a: any) => a.is_current)
//       if (currentAnnee) {
//         anneeId = currentAnnee.id
//         setSelectedAnnee(currentAnnee.id)
//       } else if (annees.length > 0) {
//         anneeId = annees[0].id
//         setSelectedAnnee(annees[0].id)
//       }

//       // Charger les données des départements et les stats du district
//       if (anneeId) {
//         await loadAllData(info.district_id, anneeId)
//       }

//       // Charger les unités pour l'onglet activités
//       await loadUnitesForActivites(info.district_id)
      
//       setLoading(false)
//       setInitialDataLoaded(true)
//     } catch (error) {
//       console.error('Erreur loadData:', error)
//       setLoading(false)
//       setInitialDataLoaded(true)
//     }
//   }

//   async function loadAllData(districtId: number, anneeId: number) {
//     setLoadingStats(true)
    
//     try {
//       const [departements, stats] = await Promise.all([
//         getAllDepartementsDataForSurintendant(districtId, anneeId),
//         getDistrictStatsForSurintendant(districtId, anneeId)
//       ])
      
//       setDepartementsData(departements)
//       setDistrictStats(stats)
//     } catch (error) {
//       console.error('Erreur chargement données:', error)
//     } finally {
//       setLoadingStats(false)
//     }
//   }

//   async function loadUnitesForActivites(districtId: number) {
//     try {
//       setLoadingActivitesConfig(true)
      
//       // Récupérer toutes les paroisses du district
//       const { data: paroisses, error: paroissesError } = await supabase
//         .from('paroisse')
//         .select('id, nom')
//         .eq('district_id', districtId)
//         .order('nom', { ascending: true })

//       if (paroissesError) {
//         console.error('Erreur récupération paroisses:', paroissesError)
//         setLoadingActivitesConfig(false)
//         return
//       }

//       if (!paroisses || paroisses.length === 0) {
//         setUnitesForActivites([])
//         setLoadingActivitesConfig(false)
//         return
//       }

//       const paroisseIds = paroisses.map(p => p.id)

//       // Récupérer toutes les unités de département pour ces paroisses
//       const { data: unites, error: unitesError } = await supabase
//         .from('unite_organisation')
//         .select(`
//           id,
//           nom,
//           reference_id,
//           id_niveau
//         `)
//         .eq('reference_table', 'departement')
//         .in('id_niveau', paroisseIds)
//         .eq('niveau', 'paroisse')

//       if (unitesError) {
//         console.error('Erreur récupération unités:', unitesError)
//         setLoadingActivitesConfig(false)
//         return
//       }

//       // Récupérer les noms des départements
//       const departementIds = [...new Set((unites || []).map(u => u.reference_id))]
//       const departements = await getAllDepartements()
//       const departementsMap = new Map<number, string>()
//       departements.forEach(d => departementsMap.set(d.id, d.nom))

//       // Formater les unités pour le composant ActivitesPage
//       const unitesFormatted: UniteOrganisationSimple[] = (unites || []).map(unite => {
//         const paroisse = paroisses.find(p => p.id === unite.id_niveau)
//         return {
//           id: unite.id,
//           nom: unite.nom,
//           reference_id: unite.reference_id,
//           district_id: districtId,
//           district_nom: surintendantInfo?.district_nom || '',
//           departement_id: unite.reference_id,
//           departement_nom: departementsMap.get(unite.reference_id) || 'Département'
//         }
//       })

//       setUnitesForActivites(unitesFormatted)
//     } catch (error) {
//       console.error('Erreur chargement unités:', error)
//     } finally {
//       setLoadingActivitesConfig(false)
//     }
//   }

//   async function handleAnneeChange(anneeId: number) {
//     setSelectedAnnee(anneeId)
//     if (surintendantInfo) {
//       await loadAllData(surintendantInfo.district_id, anneeId)
//     }
//   }

//   async function loadActivitesForUnite(uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> {
//     return await getActivitesByUnite(uniteId, anneeId)
//   }

//   const getStatutIcon = (statut: string) => {
//     switch (statut) {
//       case 'termine': return <CheckCircle2 size={14} className="text-green-500" />
//       case 'en_cours': return <Clock size={14} className="text-blue-500" />
//       case 'planifie': return <Calendar size={14} className="text-yellow-500" />
//       case 'annule': return <XCircle size={14} className="text-red-500" />
//       default: return null
//     }
//   }

//   const getStatutLabel = (statut: string) => {
//     switch (statut) {
//       case 'termine': return 'Terminé'
//       case 'en_cours': return 'En cours'
//       case 'planifie': return 'Planifié'
//       case 'annule': return 'Annulé'
//       default: return statut
//     }
//   }

//   if (loading) {
//     return (
//       <div className="p-6 max-w-7xl mx-auto">
//         <HeaderSkeleton />
//         <StatsSkeleton />
//         <AnneeSelectorSkeleton />
//         <div className="flex gap-6 mb-6 border-b border-gray-200">
//           <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
//           <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />
//         </div>
//         <DepartementsListSkeleton />
//       </div>
//     )
//   }

//   if (!surintendantInfo) {
//     return (
//       <div className="p-6 max-w-7xl mx-auto">
//         <div className="text-center py-12">
//           <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
//           <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
//           <p className="text-gray-500">Vous n'êtes pas surintendant de district</p>
//           <Link href="/gestion" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
//             Retour à l'accueil
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   // Si l'onglet activités est actif, on affiche le composant ActivitesPage
//   if (activeMainTab === 'activites') {
//     return (
//       <div className="p-6 max-w-7xl mx-auto">
//         {/* Bouton de retour */}
//         <button
//           onClick={() => setActiveMainTab('departements')}
//           className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-4"
//         >
//           <ChevronLeft size={18} />
//           <span>Retour au tableau de bord</span>
//         </button>

//         <ActivitesPage
//           config={{
//             title: "Activités de tous les départements du district",
//             subtitle: `District de ${surintendantInfo.district_nom}`,
//             backUrl: "",
//             backLabel: "",
//             showDistrictColumn: false,
//             showDepartementColumn: true,
//             unites: unitesForActivites,
//             anneesDisponibles: anneesDisponibles,
//             currentAnneeId: selectedAnnee || undefined,
//             onLoadActivites: loadActivitesForUnite,
//             onAnneeChange: handleAnneeChange,
//             emptyStateMessage: "Aucune activité pour ce district"
//           }}
//           loading={loadingActivitesConfig}
//         />
//       </div>
//     )
//   }

//   // Vue départements (tableau de bord)
//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-8">
//         <div className="flex items-center gap-3 mb-2">
//           <div className="p-2 bg-black text-white">
//             <LayoutDashboard size={20} />
//           </div>
//           <div>
//             <h1 className="text-2xl font-light tracking-wide">
//               District de {surintendantInfo.district_nom}
//             </h1>
//             <p className="text-sm text-gray-500">
//               {surintendantInfo.conference_nom && `Conférence de ${surintendantInfo.conference_nom} • `}
//               {surintendantInfo.region_nom && `Région ${surintendantInfo.region_nom} • `}
//               Bienvenue, {surintendantInfo.fidele_prenom} {surintendantInfo.fidele_nom}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Stats globales */}
//       {loadingStats && !initialDataLoaded ? (
//         <StatsSkeleton />
//       ) : (
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//           <div className="bg-white border border-gray-200 p-4">
//             <div className="flex items-center justify-between">
//               <Building2 size={20} className="text-gray-400" />
//               <span className="text-2xl font-light">{districtStats?.totalDepartements || departementsData.length}</span>
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Départements</p>
//           </div>
//           <div className="bg-white border border-gray-200 p-4">
//             <div className="flex items-center justify-between">
//               <Users size={20} className="text-gray-400" />
//               <span className="text-2xl font-light">{districtStats?.totalFideles || 0}</span>
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Fidèles totaux</p>
//           </div>
//           <div className="bg-white border border-gray-200 p-4">
//             <div className="flex items-center justify-between">
//               <Activity size={20} className="text-gray-400" />
//               <span className="text-2xl font-light">{districtStats?.totalActivites || 0}</span>
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Activités totales</p>
//           </div>
//           <div className="bg-white border border-gray-200 p-4">
//             <div className="flex items-center justify-between">
//               <Target size={20} className="text-gray-400" />
//               <span className="text-2xl font-light">{districtStats?.totalPlansAction || 0}</span>
//             </div>
//             <p className="text-xs text-gray-500 mt-1">Plans d'action</p>
//           </div>
//         </div>
//       )}

//       {/* Sélecteur d'année */}
//       {anneesDisponibles.length > 0 ? (
//         <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
//           <div className="flex items-center gap-4">
//             <label className="text-sm font-medium text-gray-700">Année de conférence :</label>
//             <select
//               value={selectedAnnee || ''}
//               onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
//               className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white min-w-[200px]"
//               disabled={loadingStats}
//             >
//               {anneesDisponibles.map((annee) => (
//                 <option key={annee.id} value={annee.id}>
//                   {annee.label}
//                   {annee.is_current && ' (en cours)'}
//                 </option>
//               ))}
//             </select>
//             {loadingStats && <Loader2 size={16} className="animate-spin text-gray-400" />}
//           </div>
//         </div>
//       ) : (
//         <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
//           <span className="text-sm text-orange-600 flex items-center gap-2">
//             <AlertCircle size={16} />
//             Aucune année configurée pour cette conférence
//           </span>
//         </div>
//       )}

//       {/* Tabs principaux */}
//       <div className="flex gap-6 mb-6 border-b border-gray-200">
//         <button
//           onClick={() => setActiveMainTab('departements')}
//           className={`px-1 py-3 text-sm transition-colors ${
//             activeMainTab === 'departements' 
//               ? 'font-medium text-black border-b-2 border-black' 
//               : 'text-gray-500 hover:text-black'
//           }`}
//         >
//           Départements ({departementsData.length})
//         </button>
//         <button
//           onClick={() => setActiveMainTab('activites')}
//           className="px-1 py-3 text-sm transition-colors text-gray-500 hover:text-black"
//         >
//           Activités ({districtStats?.totalActivites || 0})
//         </button>
//       </div>

//       {/* Message si pas d'année */}
//       {anneesDisponibles.length > 0 && !selectedAnnee && !loadingStats && (
//         <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
//           Veuillez sélectionner une année pour voir les données des départements
//         </div>
//       )}

//       {/* Liste des départements */}
//       {loadingStats ? (
//         <DepartementsListSkeleton />
//       ) : departementsData.length === 0 ? (
//         <div className="bg-white border border-gray-200 py-12 text-center">
//           <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400">Aucun département trouvé</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 gap-4">
//           {departementsData.map((dept) => (
//             <div key={dept.departement.id} className="bg-white border border-gray-200">
//               {/* En-tête du département */}
//               <div className="p-5 border-b border-gray-100">
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-3">
//                       <Building2 size={18} className="text-gray-400" />
//                       <h3 className="font-medium text-lg">{dept.departement.nom}</h3>
//                       <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
//                         {dept.departement.type}
//                       </span>
//                     </div>
                    
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <div>
//                         <p className="text-xs text-gray-400 mb-1">Fidèles</p>
//                         <p className="text-xl font-light">{dept.stats.totalFideles}</p>
//                         <p className="text-xs text-gray-400 mt-0.5">
//                           {dept.stats.totalActifs} actifs
//                         </p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-400 mb-1">Activités</p>
//                         <p className="text-xl font-light">{dept.stats.totalActivites}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-400 mb-1">Plans d'action</p>
//                         <p className="text-xl font-light">{dept.stats.totalPlans}</p>
//                       </div>
//                       <div>
//                         <p className="text-xs text-gray-400 mb-1">Budget</p>
//                         <p className="text-sm font-medium">
//                           {new Intl.NumberFormat('fr-FR', { 
//                             style: 'currency', 
//                             currency: 'CDF',
//                             maximumFractionDigits: 0 
//                           }).format(dept.stats.budgetTotal.recettes)}
//                         </p>
//                         <p className={`text-xs ${dept.stats.budgetTotal.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                           Solde: {new Intl.NumberFormat('fr-FR', { 
//                             style: 'currency', 
//                             currency: 'CDF',
//                             maximumFractionDigits: 0 
//                           }).format(dept.stats.budgetTotal.solde)}
//                         </p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Tableau des paroisses */}
//               <div className="p-5 bg-gray-50">
//                 <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
//                   Détail par paroisse
//                 </h4>
//                 <div className="overflow-x-auto">
//                   <table className="w-full text-sm">
//                     <thead>
//                       <tr className="border-b border-gray-200">
//                         <th className="text-left py-2 text-xs font-medium text-gray-500">Paroisse</th>
//                         <th className="text-center py-2 text-xs font-medium text-gray-500">Fidèles</th>
//                         <th className="text-center py-2 text-xs font-medium text-gray-500">Actifs</th>
//                         <th className="text-center py-2 text-xs font-medium text-gray-500">Activités</th>
//                         <th className="text-center py-2 text-xs font-medium text-gray-500">Plans</th>
//                         <th className="text-center py-2 text-xs font-medium text-gray-500">Projets</th>
//                         <th className="text-center py-2 text-xs font-medium text-gray-500">Statut</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {dept.paroissesData.map((paroisse) => (
//                         <tr key={paroisse.paroisse_id} className="border-b border-gray-100">
//                           <td className="py-2">
//                             <span className="font-medium">{paroisse.paroisse_nom}</span>
//                             {!paroisse.unite_id && (
//                               <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200">
//                                 Non configurée
//                               </span>
//                             )}
//                           </td>
//                           <td className="py-2 text-center">{paroisse.data.totalFideles}</td>
//                           <td className="py-2 text-center">{paroisse.data.actifs}</td>
//                           <td className="py-2 text-center">{paroisse.data.activites.length}</td>
//                           <td className="py-2 text-center">{paroisse.data.plansAction.length}</td>
//                           <td className="py-2 text-center">{paroisse.data.projets.length}</td>
//                           <td className="py-2 text-center">
//                             {paroisse.unite_id ? (
//                               <span className="inline-flex items-center gap-1 text-green-600">
//                                 <CheckCircle2 size={12} />
//                                 <span className="text-xs">Configurée</span>
//                               </span>
//                             ) : (
//                               <span className="inline-flex items-center gap-1 text-gray-400">
//                                 <AlertCircle size={12} />
//                                 <span className="text-xs">En attente</span>
//                               </span>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   )
// }

// app/surintendant/test/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { 
  Loader2, 
  Building2,
  Activity,
  Target,
  AlertCircle,
  LayoutDashboard,
  ChevronLeft,
  Users,
  CheckCircle2
} from 'lucide-react'
import { 
  getSurintendantInfo, 
  getAllDistrictData,
  getAnneesDisponiblesForDistrict,
  type DepartementSummary, 
  type DistrictStats 
} from '@/actions/surintendant'
import { getActivitesByUnite } from '@/actions/activite'
import { 
  ActivitesPage, 
  type UniteOrganisationSimple, 
  type AnneeConference, 
  type ActiviteAffichee 
} from '@/components/ActivitesPage'

// Composants Skeleton simplifiés
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
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

function DepartementsListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 p-5 animate-pulse">
          <div className="w-40 h-6 bg-gray-200 rounded mb-3" />
          <div className="grid grid-cols-4 gap-4">
            <div className="w-16 h-10 bg-gray-200 rounded" />
            <div className="w-16 h-10 bg-gray-200 rounded" />
            <div className="w-16 h-10 bg-gray-200 rounded" />
            <div className="w-16 h-10 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Type étendu pour nos besoins internes
interface UniteOrganisationEtendue extends UniteOrganisationSimple {
  departement_id?: number
  departement_nom?: string
  paroisse_id?: number
  paroisse_nom?: string
}

export default function SurintendantTestPage() {
  const [loading, setLoading] = useState(true)
  const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
  const [departementsData, setDepartementsData] = useState<DepartementSummary[]>([])
  const [districtStats, setDistrictStats] = useState<DistrictStats | null>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  
  // États pour l'onglet activités
  const [activeMainTab, setActiveMainTab] = useState<'departements' | 'activites'>('departements')
  const [unitesForActivites, setUnitesForActivites] = useState<UniteOrganisationEtendue[]>([])

  // Chargement initial
  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      setLoading(true)
      
      const info = await getSurintendantInfo()
      if (!info) {
        setLoading(false)
        return
      }
      setSurintendantInfo(info)

      // Récupérer les années disponibles
      const annees = await getAnneesDisponiblesForDistrict(info.district_id)
      const anneesFormatted: AnneeConference[] = annees.map((a: any) => ({
        id: a.id,
        label: a.label,
        is_current: a.is_current || false
      }))
      setAnneesDisponibles(anneesFormatted)
      
      // Trouver l'année à utiliser
      let anneeId: number | null = null
      const currentAnnee = annees.find((a: any) => a.is_current)
      if (currentAnnee) {
        anneeId = currentAnnee.id
        setSelectedAnnee(currentAnnee.id)
      } else if (annees.length > 0) {
        anneeId = annees[0].id
        setSelectedAnnee(annees[0].id)
      }

      // Charger TOUTES les données en une seule fois avec getAllDistrictData
      if (anneeId) {
        await loadAllDistrictData(info.district_id, anneeId)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur loadInitialData:', error)
      setLoading(false)
    }
  }

  async function loadAllDistrictData(districtId: number, anneeId: number) {
    setLoadingStats(true)
    
    try {
      const { departementsData, districtStats } = await getAllDistrictData(districtId, anneeId)
      
      setDepartementsData(departementsData)
      setDistrictStats(districtStats)
      
      // Extraire les unités pour l'onglet activités
      // On utilise le type étendu pour pouvoir passer les propriétés supplémentaires
      const unites: UniteOrganisationEtendue[] = []
      for (const dept of departementsData) {
        for (const p of dept.paroissesData) {
          if (p.unite_id) {
            unites.push({
              id: p.unite_id,
              nom: p.unite_nom || dept.departement.nom,
              reference_id: dept.departement.id,
              district_id: districtId,
              district_nom: surintendantInfo?.district_nom || '',
              // Propriétés supplémentaires (seront ignorées par ActivitesPage mais utiles pour nous)
              departement_id: dept.departement.id,
              departement_nom: dept.departement.nom,
              paroisse_id: p.paroisse_id,
              paroisse_nom: p.paroisse_nom
            } as UniteOrganisationEtendue)
          }
        }
      }
      setUnitesForActivites(unites)
      
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  async function handleAnneeChange(anneeId: number) {
    setSelectedAnnee(anneeId)
    if (surintendantInfo) {
      await loadAllDistrictData(surintendantInfo.district_id, anneeId)
    }
  }

  // Mémoïsé pour éviter les re-rendus inutiles
  const loadActivitesForUnite = useCallback(async (uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> => {
    return await getActivitesByUnite(uniteId, anneeId)
  }, [])

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <HeaderSkeleton />
        <StatsSkeleton />
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 animate-pulse">
          <div className="w-40 h-5 bg-gray-200 rounded" />
        </div>
        <DepartementsListSkeleton />
      </div>
    )
  }

  if (!surintendantInfo) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
          <p className="text-gray-500">Vous n'êtes pas surintendant de district</p>
          <Link href="/gestion" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  // Onglet activités
  if (activeMainTab === 'activites') {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <button
          onClick={() => setActiveMainTab('departements')}
          className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors mb-4"
        >
          <ChevronLeft size={18} />
          <span>Retour au tableau de bord</span>
        </button>

        <ActivitesPage
          config={{
            title: "Activités de tous les départements du district",
            subtitle: `District de ${surintendantInfo.district_nom}`,
            backUrl: "",
            backLabel: "",
            showDistrictColumn: false,
            showDepartementColumn: true,
            // On passe le tableau typé UniteOrganisationEtendue mais ActivitesPage n'utilisera que les propriétés de UniteOrganisationSimple
            unites: unitesForActivites as UniteOrganisationSimple[],
            anneesDisponibles: anneesDisponibles,
            currentAnneeId: selectedAnnee || undefined,
            onLoadActivites: loadActivitesForUnite,
            onAnneeChange: handleAnneeChange,
            emptyStateMessage: "Aucune activité pour ce district"
          }}
          loading={false}
        />
      </div>
    )
  }

  // Vue départements (tableau de bord)
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-black text-white">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              District de {surintendantInfo.district_nom}
            </h1>
            <p className="text-sm text-gray-500">
              {surintendantInfo.conference_nom && `Conférence de ${surintendantInfo.conference_nom} • `}
              {surintendantInfo.region_nom && `Région ${surintendantInfo.region_nom} • `}
              Bienvenue, {surintendantInfo.fidele_prenom} {surintendantInfo.fidele_nom}
            </p>
          </div>
        </div>
      </div>

      {/* Stats globales */}
      {loadingStats ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Building2 size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{districtStats?.totalDepartements || departementsData.length}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Départements</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Users size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{districtStats?.totalFideles || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Fidèles totaux</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Activity size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{districtStats?.totalActivites || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Activités totales</p>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <Target size={20} className="text-gray-400" />
              <span className="text-2xl font-light">{districtStats?.totalPlansAction || 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Plans d'action</p>
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

      {/* Tabs */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveMainTab('departements')}
          className={`px-1 py-3 text-sm transition-colors ${
            activeMainTab === 'departements' 
              ? 'font-medium text-black border-b-2 border-black' 
              : 'text-gray-500 hover:text-black'
          }`}
        >
          Départements ({departementsData.length})
        </button>
        <button
          onClick={() => setActiveMainTab('activites')}
          className="px-1 py-3 text-sm transition-colors text-gray-500 hover:text-black"
        >
          Activités ({districtStats?.totalActivites || 0})
        </button>
      </div>

      {/* Liste des départements */}
      {loadingStats ? (
        <DepartementsListSkeleton />
      ) : departementsData.length === 0 ? (
        <div className="bg-white border border-gray-200 py-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun département trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {departementsData.map((dept) => (
            <div key={dept.departement.id} className="bg-white border border-gray-200">
              {/* En-tête */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 size={18} className="text-gray-400" />
                  <h3 className="font-medium text-lg">{dept.departement.nom}</h3>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600">
                    {dept.departement.type}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Fidèles</p>
                    <p className="text-xl font-light">{dept.stats.totalFideles}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dept.stats.totalActifs} actifs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Activités</p>
                    <p className="text-xl font-light">{dept.stats.totalActivites}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Plans d'action</p>
                    <p className="text-xl font-light">{dept.stats.totalPlans}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Budget</p>
                    <p className="text-sm font-medium">
                      {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'CDF',
                        maximumFractionDigits: 0 
                      }).format(dept.stats.budgetTotal.recettes)}
                    </p>
                    <p className={`text-xs ${dept.stats.budgetTotal.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      Solde: {new Intl.NumberFormat('fr-FR', { 
                        style: 'currency', 
                        currency: 'CDF',
                        maximumFractionDigits: 0 
                      }).format(dept.stats.budgetTotal.solde)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Tableau des paroisses */}
              <div className="p-5 bg-gray-50">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Détail par paroisse
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-xs font-medium text-gray-500">Paroisse</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500">Fidèles</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500">Actifs</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500">Activités</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500">Plans</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500">Projets</th>
                        <th className="text-center py-2 text-xs font-medium text-gray-500">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dept.paroissesData.map((paroisse) => (
                        <tr key={paroisse.paroisse_id} className="border-b border-gray-100">
                          <td className="py-2">
                            <span className="font-medium">{paroisse.paroisse_nom}</span>
                            {!paroisse.unite_id && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200">
                                Non configurée
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-center">{paroisse.data.totalFideles}</td>
                          <td className="py-2 text-center">{paroisse.data.actifs}</td>
                          <td className="py-2 text-center">{paroisse.data.activites.length}</td>
                          <td className="py-2 text-center">{paroisse.data.plansAction.length}</td>
                          <td className="py-2 text-center">{paroisse.data.projets.length}</td>
                          <td className="py-2 text-center">
                            {paroisse.unite_id ? (
                              <span className="inline-flex items-center gap-1 text-green-600">
                                <CheckCircle2 size={12} />
                                <span className="text-xs">Configurée</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-gray-400">
                                <AlertCircle size={12} />
                                <span className="text-xs">En attente</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}