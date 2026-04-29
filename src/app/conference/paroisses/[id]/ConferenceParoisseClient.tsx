
// // app/conference/paroisses/[id]/ConferenceParoisseClient.tsx (version simplifiée sans onglets)
// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import Link from 'next/link'
// import { Calendar, DollarSign, FileText, Users, TrendingUp, TrendingDown, Activity, CheckCircle, Clock, ArrowRight } from 'lucide-react'

// interface ConferenceParoisseClientProps {
//   currentFidele: any
//   chefInfo: {
//     id: number
//     departement_nom: string
//     conference_nom: string
//     fidele_nom: string
//     fidele_prenom: string
//   }
//   departement: any
//   paroisse: { id: number; nom: string; district_id: number }
//   paroisseData: {
//     fideles: any[]
//     totalFideles: number
//     actifs: number
//     inactifs: number
//     activites: any[]
//     budgetSummary: any | null
//     plansAction: any[]
//     activitesStats: any | null
//     activitesRecentes: any[]
//     activitesProchaines: any[]
//   }
//   anneeConferenceId: number | null
//   anneesDisponibles: any[]
//   anneesParoisse: any[]
//   anneeEnCours: any | null
//   currentTab?: string
// }

// export default function ConferenceParoisseClient({
//   currentFidele,
//   chefInfo,
//   departement,
//   paroisse,
//   paroisseData,
//   anneeConferenceId,
//   anneesDisponibles,
//   anneesParoisse,
//   anneeEnCours
// }: ConferenceParoisseClientProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()
//   const [loading, setLoading] = useState(false)

//   const handleAnneeChange = (anneeId: number) => {
//     setLoading(true)
//     const params = new URLSearchParams(searchParams.toString())
//     params.set('annee_conference', anneeId.toString())
//     router.push(`/conference/paroisses/${paroisse.id}?${params.toString()}`)
//   }

//   useEffect(() => {
//     setLoading(false)
//   }, [anneeConferenceId, paroisseData])

//   const getStatutBadge = (statut: string) => {
//     switch (statut) {
//       case 'termine':
//         return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Terminée</span>
//       case 'en_cours':
//         return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">En cours</span>
//       case 'annule':
//         return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Annulée</span>
//       default:
//         return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Planifiée</span>
//     }
//   }

//   // Calcul du budget en USD pour l'affichage
//   const budgetRecettes = paroisseData.budgetSummary?.recettes || 0
//   const budgetDepenses = paroisseData.budgetSummary?.depenses || 0
//   const budgetSolde = budgetRecettes - budgetDepenses

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       {/* Fil d'Ariane */}
//       <div className="mb-6 flex items-center gap-2 text-sm">
//         <Link href="/conference" className="text-gray-500 hover:text-gray-700">
//           Conférence {chefInfo.conference_nom}
//         </Link>
//         <span className="text-gray-400">/</span>
//         <Link href={`/conference/districts/${paroisse.district_id}?departement_id=${departement.id}`} className="text-gray-500 hover:text-gray-700">
//           District
//         </Link>
//         <span className="text-gray-400">/</span>
//         <span className="text-gray-900 font-medium">{paroisse.nom}</span>
//       </div>

//       {/* En-tête */}
//       <div className="mb-6">
//         <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-100">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div>
//               <h1 className="text-2xl font-light text-gray-900">
//                 {departement.nom}
//               </h1>
//               <p className="text-sm text-gray-500 mt-1">
//                 Paroisse {paroisse.nom} - Conférence {chefInfo.conference_nom}
//               </p>
//               <div className="mt-3 flex items-center gap-2">
//                 <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
//                   <span className="text-purple-600 text-sm font-medium">
//                     {chefInfo.fidele_prenom?.[0]}{chefInfo.fidele_nom?.[0]}
//                   </span>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-700">
//                     {chefInfo.fidele_prenom} {chefInfo.fidele_nom}
//                   </p>
//                   <p className="text-xs text-gray-400">
//                     Chef de département - Niveau Conférence
//                   </p>
//                 </div>
//               </div>
//             </div>
            
//             <div className="px-3 py-1 bg-purple-100 rounded-full self-start">
//               <span className="text-xs font-medium text-purple-700">Niveau Conférence</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Sélecteur année */}
//       {anneesDisponibles.length > 0 && (
//         <div className="mb-6 bg-white rounded-lg border border-gray-100 p-4">
//           <div className="flex items-center gap-4 flex-wrap">
//             <label className="text-sm font-medium text-gray-700">Année de conférence:</label>
//             <div className="flex gap-2 flex-wrap">
//               {anneesDisponibles.map(annee => (
//                 <button
//                   key={annee.id}
//                   onClick={() => handleAnneeChange(annee.id)}
//                   className={`px-4 py-2 rounded-lg text-sm transition-colors ${
//                     anneeConferenceId === annee.id
//                       ? 'bg-purple-600 text-white'
//                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                   }`}
//                 >
//                   {annee.label}
//                   {annee.is_current && (
//                     <span className="ml-2 text-xs opacity-80">(En cours)</span>
//                   )}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Indicateur de chargement */}
//       {loading && (
//         <div className="mb-4 p-3 bg-purple-50 rounded-lg text-center text-sm text-purple-600">
//           Chargement des données...
//         </div>
//       )}

//       {/* Contenu principal - Sans onglets, tout sur une seule page */}
//       {!loading && (
//         <>
//           {/* Cartes statistiques - 3 colonnes */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//             <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-4">
//                 <Users className="w-8 h-8 text-purple-500" />
//                 <span className="text-xs text-gray-400">Membres</span>
//               </div>
//               <div className="text-3xl font-light text-gray-900">{paroisseData.totalFideles}</div>
//               <div className="mt-2 flex gap-4 text-sm">
//                 <span className="text-green-600">Actifs: {paroisseData.actifs}</span>
//                 <span className="text-red-600">Inactifs: {paroisseData.inactifs}</span>
//               </div>
//             </div>

//             <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-4">
//                 <Activity className="w-8 h-8 text-blue-500" />
//                 <span className="text-xs text-gray-400">Activités</span>
//               </div>
//               <div className="text-3xl font-light text-gray-900">{paroisseData.activites.length}</div>
//               {paroisseData.activitesStats && (
//                 <div className="mt-2 flex gap-4 text-sm">
//                   <span className="text-green-600">Terminées: {paroisseData.activitesStats.terminees}</span>
//                   <span className="text-blue-600">En cours: {paroisseData.activitesStats.enCours}</span>
//                 </div>
//               )}
//             </div>

//             <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow">
//               <div className="flex items-center justify-between mb-4">
//                 <FileText className="w-8 h-8 text-green-500" />
//                 <span className="text-xs text-gray-400">Plans d'action</span>
//               </div>
//               <div className="text-3xl font-light text-gray-900">{paroisseData.plansAction.length}</div>
//             </div>
//           </div>

//           {/* Section Budget - avec gestion des devises */}
//           {paroisseData.budgetSummary && (
//             <div className="bg-white rounded-lg border border-gray-100 mb-8 overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
//                 <div className="flex items-center gap-2">
//                   <DollarSign className="w-5 h-5 text-green-600" />
//                   <h2 className="text-lg font-medium text-gray-900">Budget</h2>
//                 </div>
//               </div>
//               <div className="p-6">
//                 {/* Résumé par devise */}
//                 {paroisseData.budgetSummary.byCurrency && paroisseData.budgetSummary.byCurrency.length > 0 ? (
//                   <div className="space-y-6">
//                     {paroisseData.budgetSummary.byCurrency.map((currencyData: any) => (
//                       <div key={currencyData.currency} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
//                         <div className="flex items-center justify-between mb-3">
//                           <span className="text-sm font-medium text-gray-700">
//                             Devise: {currencyData.currency}
//                           </span>
//                           <span className="text-xs text-gray-400">
//                             {currencyData.lines?.length || 0} ligne(s)
//                           </span>
//                         </div>
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                           <div className="bg-green-50 rounded-lg p-3">
//                             <div className="flex items-center gap-2 text-green-600 mb-1">
//                               <TrendingUp className="w-4 h-4" />
//                               <span className="text-xs">Recettes</span>
//                             </div>
//                             <div className="text-xl font-semibold text-green-700">
//                               {currencyData.recettes.toLocaleString()} {currencyData.currency}
//                             </div>
//                           </div>
//                           <div className="bg-red-50 rounded-lg p-3">
//                             <div className="flex items-center gap-2 text-red-600 mb-1">
//                               <TrendingDown className="w-4 h-4" />
//                               <span className="text-xs">Dépenses</span>
//                             </div>
//                             <div className="text-xl font-semibold text-red-700">
//                               {currencyData.depenses.toLocaleString()} {currencyData.currency}
//                             </div>
//                           </div>
//                           <div className={`rounded-lg p-3 ${currencyData.solde >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
//                             <div className={`flex items-center gap-2 mb-1 ${currencyData.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
//                               <Activity className="w-4 h-4" />
//                               <span className="text-xs">Solde</span>
//                             </div>
//                             <div className={`text-xl font-semibold ${currencyData.solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
//                               {currencyData.solde.toLocaleString()} {currencyData.currency}
//                             </div>
//                           </div>
//                         </div>

//                         {/* Liste des lignes budget pour cette devise */}
//                         {currencyData.lines && currencyData.lines.length > 0 && (
//                           <div className="mt-4">
//                             <div className="text-xs font-medium text-gray-500 mb-2">Détail des lignes</div>
//                             <div className="space-y-2">
//                               {currencyData.lines.slice(0, 5).map((line: any) => (
//                                 <div key={line.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
//                                   <div>
//                                     <span className={`px-2 py-0.5 text-xs rounded-full mr-2 ${
//                                       line.type === 'recette' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
//                                     }`}>
//                                       {line.type === 'recette' ? 'Recette' : 'Dépense'}
//                                     </span>
//                                     <span className="text-gray-700">{line.libelle}</span>
//                                   </div>
//                                   <span className={`font-medium ${
//                                     line.type === 'recette' ? 'text-green-600' : 'text-red-600'
//                                   }`}>
//                                     {line.montant.toLocaleString()} {line.currency}
//                                   </span>
//                                 </div>
//                               ))}
//                               {currencyData.lines.length > 5 && (
//                                 <p className="text-xs text-gray-400 text-center pt-2">
//                                   + {currencyData.lines.length - 5} autre(s) ligne(s)
//                                 </p>
//                               )}
//                             </div>
//                           </div>
//                         )}
//                       </div>
//                     ))}

//                     {/* Total en USD si plusieurs devises */}
//                     {paroisseData.budgetSummary.totalUSD && (
//                       <div className="mt-4 pt-4 border-t border-gray-200">
//                         <div className="text-sm font-medium text-gray-700 mb-2">Total (USD)</div>
//                         <div className="grid grid-cols-3 gap-4">
//                           <div className="text-center">
//                             <div className="text-xs text-gray-500">Recettes</div>
//                             <div className="text-lg font-semibold text-green-600">
//                               {paroisseData.budgetSummary.totalUSD.recettes.toLocaleString()} USD
//                             </div>
//                           </div>
//                           <div className="text-center">
//                             <div className="text-xs text-gray-500">Dépenses</div>
//                             <div className="text-lg font-semibold text-red-600">
//                               {paroisseData.budgetSummary.totalUSD.depenses.toLocaleString()} USD
//                             </div>
//                           </div>
//                           <div className="text-center">
//                             <div className="text-xs text-gray-500">Solde</div>
//                             <div className={`text-lg font-semibold ${paroisseData.budgetSummary.totalUSD.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
//                               {paroisseData.budgetSummary.totalUSD.solde.toLocaleString()} USD
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="text-center py-8 text-gray-400">
//                     Aucune donnée budgétaire pour cette période
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {/* Section Activités à venir */}
//           {paroisseData.activitesProchaines && paroisseData.activitesProchaines.length > 0 && (
//             <div className="bg-white rounded-lg border border-gray-100 mb-8 overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <Calendar className="w-5 h-5 text-purple-600" />
//                     <h2 className="text-lg font-medium text-gray-900">Activités à venir</h2>
//                   </div>
//                   <span className="text-xs text-gray-400">{paroisseData.activitesProchaines.length} activité(s)</span>
//                 </div>
//               </div>
//               <div className="divide-y divide-gray-100">
//                 {paroisseData.activitesProchaines.map((activite: any) => (
//                   <Link
//                     key={activite.id}
//                     href={`/conference/gestion/activites/${activite.id}`}
//                     className="block p-4 hover:bg-gray-50 transition-colors"
//                   >
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3 mb-2">
//                           <h3 className="font-medium text-gray-900">{activite.titre}</h3>
//                           {getStatutBadge(activite.statut)}
//                         </div>
//                         {activite.description && (
//                           <p className="text-sm text-gray-500 line-clamp-1">{activite.description}</p>
//                         )}
//                         <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
//                           <span className="flex items-center gap-1">
//                             <Calendar className="w-3 h-3" />
//                             {new Date(activite.date).toLocaleDateString()}
//                           </span>
//                           <span className="flex items-center gap-1">
//                             <Clock className="w-3 h-3" />
//                             {activite.heure}
//                           </span>
//                         </div>
//                       </div>
//                       <ArrowRight className="w-5 h-5 text-gray-400" />
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Section Activités récentes */}
//           {paroisseData.activitesRecentes && paroisseData.activitesRecentes.length > 0 && (
//             <div className="bg-white rounded-lg border border-gray-100 mb-8 overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <CheckCircle className="w-5 h-5 text-green-600" />
//                     <h2 className="text-lg font-medium text-gray-900">Activités récentes</h2>
//                   </div>
//                 </div>
//               </div>
//               <div className="divide-y divide-gray-100">
//                 {paroisseData.activitesRecentes.map((activite: any) => (
//                   <Link
//                     key={activite.id}
//                     href={`/conference/gestion/activites/${activite.id}`}
//                     className="block p-4 hover:bg-gray-50 transition-colors"
//                   >
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3 mb-2">
//                           <h3 className="font-medium text-gray-900">{activite.titre}</h3>
//                           {getStatutBadge(activite.statut)}
//                         </div>
//                         {activite.description && (
//                           <p className="text-sm text-gray-500 line-clamp-1">{activite.description}</p>
//                         )}
//                         <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
//                           <span className="flex items-center gap-1">
//                             <Calendar className="w-3 h-3" />
//                             {new Date(activite.date).toLocaleDateString()}
//                           </span>
//                           <span className="flex items-center gap-1">
//                             <Clock className="w-3 h-3" />
//                             {activite.heure}
//                           </span>
//                         </div>
//                       </div>
//                       <ArrowRight className="w-5 h-5 text-gray-400" />
//                     </div>
//                   </Link>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Section Plans d'action */}
//           {paroisseData.plansAction && paroisseData.plansAction.length > 0 && (
//             <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
//               <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-2">
//                     <FileText className="w-5 h-5 text-blue-600" />
//                     <h2 className="text-lg font-medium text-gray-900">Plans d'action</h2>
//                   </div>
//                   <span className="text-xs text-gray-400">{paroisseData.plansAction.length} plan(s)</span>
//                 </div>
//               </div>
//               <div className="divide-y divide-gray-100">
//                 {paroisseData.plansAction.map((plan: any) => (
//                   <div key={plan.id} className="p-4">
//                     <div className="flex justify-between items-start">
//                       <div>
//                         <h3 className="font-medium text-gray-900">{plan.titre}</h3>
//                         {plan.description && (
//                           <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
//                         )}
//                         <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
//                           <span>Activités: {plan.activites_count || 0}</span>
//                           <span>Budget: {(plan.budget_total || 0).toLocaleString()} FC</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Message si aucune donnée */}
//           {paroisseData.activites.length === 0 && 
//            paroisseData.plansAction.length === 0 && 
//            (!paroisseData.budgetSummary || paroisseData.budgetSummary.totalLines === 0) && (
//             <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
//               <div className="text-gray-400">Aucune donnée disponible pour cette période</div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }

// app/conference/paroisses/[id]/ConferenceParoisseClient.tsx (avec calendrier)
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Calendar as CalendarIcon, DollarSign, FileText, Users, TrendingUp, TrendingDown, Activity, CheckCircle, Clock, ArrowRight, List } from 'lucide-react'
import ActiviteCalendar from '@/components/ActiviteCalendar'

interface ConferenceParoisseClientProps {
  currentFidele: any
  chefInfo: {
    id: number
    departement_nom: string
    conference_nom: string
    fidele_nom: string
    fidele_prenom: string
  }
  departement: any
  paroisse: { id: number; nom: string; district_id: number }
  paroisseData: {
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
  anneeConferenceId: number | null
  anneesDisponibles: any[]
  anneesParoisse: any[]
  anneeEnCours: any | null
  currentTab?: string
}

export default function ConferenceParoisseClient({
  currentFidele,
  chefInfo,
  departement,
  paroisse,
  paroisseData,
  anneeConferenceId,
  anneesDisponibles,
  anneesParoisse,
  anneeEnCours
}: ConferenceParoisseClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const handleAnneeChange = (anneeId: number) => {
    setLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    params.set('annee_conference', anneeId.toString())
    router.push(`/conference/paroisses/${paroisse.id}?${params.toString()}`)
  }

  useEffect(() => {
    setLoading(false)
  }, [anneeConferenceId, paroisseData])

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'termine':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Terminée</span>
      case 'en_cours':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">En cours</span>
      case 'annule':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Annulée</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Planifiée</span>
    }
  }

  // Transformer les activités pour le calendrier
  const calendarActivites = paroisseData.activites.map(activite => ({
    id: activite.id,
    titre: activite.titre,
    description: activite.description,
    date: activite.date,
    heure: activite.heure,
    statut: activite.statut,
    plan_action_id: activite.plan_action_id
  }))

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/conference" className="text-gray-500 hover:text-gray-700">
          Conférence {chefInfo.conference_nom}
        </Link>
        <span className="text-gray-400">/</span>
        <Link href={`/conference/districts/${paroisse.district_id}?departement_id=${departement.id}`} className="text-gray-500 hover:text-gray-700">
          District
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{paroisse.nom}</span>
      </div>

      {/* En-tête */}
      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border border-purple-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-light text-gray-900">
                {departement.nom}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Paroisse {paroisse.nom} - Conférence {chefInfo.conference_nom}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 text-sm font-medium">
                    {chefInfo.fidele_prenom?.[0]}{chefInfo.fidele_nom?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    {chefInfo.fidele_prenom} {chefInfo.fidele_nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    Chef de département - Niveau Conférence
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Bouton bascule vue */}
              <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Vue liste"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === 'calendar' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Vue calendrier"
                >
                  <CalendarIcon className="w-4 h-4" />
                </button>
              </div>
              
              <div className="px-3 py-1 bg-purple-100 rounded-full">
                <span className="text-xs font-medium text-purple-700">Niveau Conférence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sélecteur année */}
      {anneesDisponibles.length > 0 && (
        <div className="mb-6 bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="text-sm font-medium text-gray-700">Année de conférence:</label>
            <div className="flex gap-2 flex-wrap">
              {anneesDisponibles.map(annee => (
                <button
                  key={annee.id}
                  onClick={() => handleAnneeChange(annee.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    anneeConferenceId === annee.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {annee.label}
                  {annee.is_current && (
                    <span className="ml-2 text-xs opacity-80">(En cours)</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de chargement */}
      {loading && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg text-center text-sm text-purple-600">
          Chargement des données...
        </div>
      )}

      {/* Contenu principal */}
      {!loading && (
        <>
          {/* Cartes statistiques - 3 colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Users className="w-8 h-8 text-purple-500" />
                <span className="text-xs text-gray-400">Membres</span>
              </div>
              <div className="text-3xl font-light text-gray-900">{paroisseData.totalFideles}</div>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-green-600">Actifs: {paroisseData.actifs}</span>
                <span className="text-red-600">Inactifs: {paroisseData.inactifs}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-blue-500" />
                <span className="text-xs text-gray-400">Activités</span>
              </div>
              <div className="text-3xl font-light text-gray-900">{paroisseData.activites.length}</div>
              {paroisseData.activitesStats && (
                <div className="mt-2 flex gap-4 text-sm">
                  <span className="text-green-600">Terminées: {paroisseData.activitesStats.terminees}</span>
                  <span className="text-blue-600">En cours: {paroisseData.activitesStats.enCours}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <FileText className="w-8 h-8 text-green-500" />
                <span className="text-xs text-gray-400">Plans d'action</span>
              </div>
              <div className="text-3xl font-light text-gray-900">{paroisseData.plansAction.length}</div>
            </div>
          </div>

          {/* Section Budget */}
          {paroisseData.budgetSummary && (
            <div className="bg-white rounded-lg border border-gray-100 mb-8 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-medium text-gray-900">Budget</h2>
                </div>
              </div>
              <div className="p-6">
                {paroisseData.budgetSummary.byCurrency && paroisseData.budgetSummary.byCurrency.length > 0 ? (
                  <div className="space-y-6">
                    {paroisseData.budgetSummary.byCurrency.map((currencyData: any) => (
                      <div key={currencyData.currency} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">
                            Devise: {currencyData.currency}
                          </span>
                          <span className="text-xs text-gray-400">
                            {currencyData.lines?.length || 0} ligne(s)
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs">Recettes</span>
                            </div>
                            <div className="text-xl font-semibold text-green-700">
                              {currencyData.recettes.toLocaleString()} {currencyData.currency}
                            </div>
                          </div>
                          <div className="bg-red-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-red-600 mb-1">
                              <TrendingDown className="w-4 h-4" />
                              <span className="text-xs">Dépenses</span>
                            </div>
                            <div className="text-xl font-semibold text-red-700">
                              {currencyData.depenses.toLocaleString()} {currencyData.currency}
                            </div>
                          </div>
                          <div className={`rounded-lg p-3 ${currencyData.solde >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                            <div className={`flex items-center gap-2 mb-1 ${currencyData.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                              <Activity className="w-4 h-4" />
                              <span className="text-xs">Solde</span>
                            </div>
                            <div className={`text-xl font-semibold ${currencyData.solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                              {currencyData.solde.toLocaleString()} {currencyData.currency}
                            </div>
                          </div>
                        </div>

                        {currencyData.lines && currencyData.lines.length > 0 && (
                          <div className="mt-4">
                            <div className="text-xs font-medium text-gray-500 mb-2">Détail des lignes</div>
                            <div className="space-y-2">
                              {currencyData.lines.slice(0, 5).map((line: any) => (
                                <div key={line.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                                  <div>
                                    <span className={`px-2 py-0.5 text-xs rounded-full mr-2 ${
                                      line.type === 'recette' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {line.type === 'recette' ? 'Recette' : 'Dépense'}
                                    </span>
                                    <span className="text-gray-700">{line.libelle}</span>
                                  </div>
                                  <span className={`font-medium ${
                                    line.type === 'recette' ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {line.montant.toLocaleString()} {line.currency}
                                  </span>
                                </div>
                              ))}
                              {currencyData.lines.length > 5 && (
                                <p className="text-xs text-gray-400 text-center pt-2">
                                  + {currencyData.lines.length - 5} autre(s) ligne(s)
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {paroisseData.budgetSummary.totalUSD && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Total (USD)</div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Recettes</div>
                            <div className="text-lg font-semibold text-green-600">
                              {paroisseData.budgetSummary.totalUSD.recettes.toLocaleString()} USD
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Dépenses</div>
                            <div className="text-lg font-semibold text-red-600">
                              {paroisseData.budgetSummary.totalUSD.depenses.toLocaleString()} USD
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Solde</div>
                            <div className={`text-lg font-semibold ${paroisseData.budgetSummary.totalUSD.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                              {paroisseData.budgetSummary.totalUSD.solde.toLocaleString()} USD
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Aucune donnée budgétaire pour cette période
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section Activités - Vue Liste ou Calendrier */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {viewMode === 'calendar' ? (
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                ) : (
                  <Activity className="w-5 h-5 text-blue-600" />
                )}
                <h2 className="text-lg font-medium text-gray-900">
                  {viewMode === 'calendar' ? 'Calendrier des activités' : 'Activités'}
                </h2>
              </div>
              <span className="text-xs text-gray-400">{paroisseData.activites.length} activité(s)</span>
            </div>

            {viewMode === 'calendar' ? (
              <ActiviteCalendar 
                activites={calendarActivites}
                basePath="/conference"
                canEdit={false}
              />
            ) : (
              <>
                {/* Activités à venir */}
                {paroisseData.activitesProchaines && paroisseData.activitesProchaines.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-100 mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">Activités à venir</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {paroisseData.activitesProchaines.map((activite: any) => (
                        <Link
                          key={activite.id}
                          href={`/conference/activites/${activite.id}`}
                          className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium text-gray-900">{activite.titre}</h3>
                                {getStatutBadge(activite.statut)}
                              </div>
                              {activite.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">{activite.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {new Date(activite.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activite.heure}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activités récentes */}
                {paroisseData.activitesRecentes && paroisseData.activitesRecentes.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-3 border-b border-gray-200">
                      <h3 className="text-sm font-medium text-gray-700">Activités récentes</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {paroisseData.activitesRecentes.map((activite: any) => (
                        <Link
                          key={activite.id}
                          href={`/conference/activites/${activite.id}`}
                          className="block p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium text-gray-900">{activite.titre}</h3>
                                {getStatutBadge(activite.statut)}
                              </div>
                              {activite.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">{activite.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {new Date(activite.date).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activite.heure}
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {paroisseData.activites.length === 0 && (
                  <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
                    <div className="text-gray-400">Aucune activité</div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Section Plans d'action */}
          {paroisseData.plansAction && paroisseData.plansAction.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-medium text-gray-900">Plans d'action</h2>
                  </div>
                  <span className="text-xs text-gray-400">{paroisseData.plansAction.length} plan(s)</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {paroisseData.plansAction.map((plan: any) => (
                  <div key={plan.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.titre}</h3>
                        {plan.description && (
                          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span>Activités: {plan.activites_count || 0}</span>
                          <span>Budget: {(plan.budget_total || 0).toLocaleString()} FC</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message si aucune donnée */}
          {paroisseData.activites.length === 0 && 
           paroisseData.plansAction.length === 0 && 
           (!paroisseData.budgetSummary || paroisseData.budgetSummary.totalLines === 0) && (
            <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
              <div className="text-gray-400">Aucune donnée disponible pour cette période</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}