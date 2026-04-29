
// 'use client'

// import { useRouter, useSearchParams } from 'next/navigation'
// import Link from 'next/link'
// import { formatCurrency } from '@/lib/currency'
// import { 
//   ArrowLeft, 
//   Calendar, 
//   DollarSign, 
//   Target, 
//   TrendingUp, 
//   TrendingDown, 
//   CheckCircle, 
//   Clock, 
//   XCircle,
//   FileText,
//   Activity,
//   Building2,
//   MapPin,
//   Rocket
// } from 'lucide-react'
// import { ConferenceProjetsClient } from './ConferenceProjetsClient'
// import { ConfigButton } from '@/components/ConfigButton'


// interface ConferenceClientProps {
//   currentFidele: any
//   chefInfo: {
//     departement_id: number
//     departement_nom: string
//     conference_id: number
//     conference_nom: string
//     region_nom: string
//   }
//   unite: { id: number } | null
//   anneeConferenceId: number | null
//   anneeEnCours: any | null
//   anneesDisponibles: any[]
//   activites: any[]
//   activitesStats: any
//   budgetSummary: any
//   budgets: any[]
//   plansAction: any[]
//   projets: any[]
//   projetsStats: any
// }

// export default function ConferenceClient({
//   currentFidele,
//   chefInfo,
//   unite,
//   anneeConferenceId,
//   anneeEnCours,
//   anneesDisponibles,
//   activites,
//   activitesStats,
//   budgetSummary,
//   budgets,
//   plansAction,
//   projets,
//   projetsStats
// }: ConferenceClientProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()

//   const handleAnneeChange = (newAnneeConfId: number) => {
//     const params = new URLSearchParams(searchParams.toString())
//     params.set('annee_conference', newAnneeConfId.toString())
//     router.push(`/conference/management?${params.toString()}`)
//   }

//   const buildUrl = (path: string) => {
//     if (anneeConferenceId) {
//       return `${path}?annee_conference=${anneeConferenceId}`
//     }
//     return path
//   }

//   const anneeSelectionnee = anneesDisponibles?.find(a => a.id === anneeConferenceId)
  
//   const activitesRecentes = [...activites]
//     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//     .slice(0, 5)

//   const hasBudget = budgetSummary && (budgetSummary.recettes > 0 || budgetSummary.depenses > 0)
//   const mainCurrency = budgetSummary?.byCurrency?.[0]?.currency || 'CDF'
  
//   // Statistiques des activités
//   const activitesTerminees = activitesStats?.terminees || 0
//   const activitesEnCours = activitesStats?.enCours || 0
//   const activitesPlanifiees = activitesStats?.planifiees || 0
//   const activitesAnnulees = activitesStats?.annulees || 0
//   const tauxRealisation = activites.length > 0 ? Math.round((activitesTerminees / activites.length) * 100) : 0

//   // Statistiques des projets
//   const projetsEnCours = projetsStats?.enCours || 0
//   const projetsTermines = projetsStats?.termines || 0

//   if (!unite) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
//             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Building2 className="w-8 h-8 text-gray-400" />
//             </div>
//             <p className="text-gray-600">
//               L'unité d'organisation pour votre département n'a pas encore été créée.
//             </p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* En-tête */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
//             <Link
//               href="/"
//               className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors w-fit"
//             >
//               <ArrowLeft className="w-4 h-4" />
//               Retour à l'accueil
//             </Link>
            
//             {/* Sélecteur d'année */}
//             {anneesDisponibles && anneesDisponibles.length > 0 && (
//               <div className="flex gap-2 flex-wrap">
//                 {anneesDisponibles.map((annee) => (
//                   <button
//                     key={annee.id}
//                     onClick={() => handleAnneeChange(annee.id)}
//                     className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
//                       anneeConferenceId === annee.id
//                         ? 'bg-indigo-600 text-white shadow-sm'
//                         : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//                     }`}
//                   >
//                     {annee.annee?.label || annee.id}
//                     {annee.is_current && ' ✓'}
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>
//           <div className="flex items-center gap-2">
//     <h1 className="text-2xl font-bold text-gray-900">{chefInfo.departement_nom}</h1>
    
//     {/* BOUTON DE CONFIGURATION */}
//     {unite && (
//       <ConfigButton 
//         uniteId={unite.id}
//         uniteNom={chefInfo.departement_nom}
//         uniteNiveau="Conférence"
//       />
//     )}
//   </div>
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">{chefInfo.departement_nom}</h1>
//             <div className="flex items-center gap-3 mt-1">
//               <span className="inline-flex items-center gap-1 text-sm text-gray-600">
//                 <Building2 className="w-4 h-4" />
//                 {chefInfo.conference_nom}
//               </span>
//               <span className="text-gray-300">•</span>
//               <span className="inline-flex items-center gap-1 text-sm text-gray-600">
//                 <MapPin className="w-4 h-4" />
//                 {chefInfo.region_nom}
//               </span>
//             </div>
//             {anneeSelectionnee && anneeConferenceId !== anneeEnCours?.id && (
//               <p className="text-sm text-amber-600 mt-3 bg-amber-50 inline-block px-3 py-1 rounded-lg">
//                 📅 Affichage de l'historique pour l'année {anneeSelectionnee.annee?.label}
//               </p>
//             )}
//             {anneeSelectionnee && anneeConferenceId === anneeEnCours?.id && (
//               <p className="text-sm text-blue-600 mt-2">
//                 Affichage des données pour l'année en cours
//               </p>
//             )}
//           </div>
//         </div>

//         {/* Cartes statistiques */}
//         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-medium text-gray-500">Plans d&apos;action</span>
//               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
//                 <Target className="w-4 h-4 text-blue-600" />
//               </div>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">{plansAction.length}</p>
//             <p className="text-xs text-gray-500 mt-1">Plans créés</p>
//           </div>
          
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-medium text-gray-500">Activités</span>
//               <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
//                 <Calendar className="w-4 h-4 text-purple-600" />
//               </div>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">{activites.length}</p>
//             <div className="flex items-center gap-3 mt-1 text-xs">
//               <span className="text-green-600 flex items-center gap-1">
//                 <CheckCircle className="w-3 h-3" /> {activitesTerminees}
//               </span>
//               <span className="text-yellow-600 flex items-center gap-1">
//                 <Clock className="w-3 h-3" /> {activitesEnCours + activitesPlanifiees}
//               </span>
//               <span className="text-red-600 flex items-center gap-1">
//                 <XCircle className="w-3 h-3" /> {activitesAnnulees}
//               </span>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-medium text-gray-500">Projets</span>
//               <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
//                 <Rocket className="w-4 h-4 text-indigo-600" />
//               </div>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">{projets.length}</p>
//             <div className="flex items-center gap-3 mt-1 text-xs">
//               <span className="text-green-600 flex items-center gap-1">
//                 <CheckCircle className="w-3 h-3" /> {projetsEnCours}
//               </span>
//               <span className="text-gray-600 flex items-center gap-1">
//                 <Target className="w-3 h-3" /> {projetsTermines} terminés
//               </span>
//             </div>
//           </div>
          
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-medium text-gray-500">Budget total</span>
//               <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
//                 <DollarSign className="w-4 h-4 text-green-600" />
//               </div>
//             </div>
//             {hasBudget ? (
//               <>
//                 <p className={`text-2xl font-bold ${budgetSummary.solde >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
//                   {formatCurrency(budgetSummary.solde, mainCurrency)}
//                 </p>
//                 <div className="flex items-center gap-3 mt-1 text-xs">
//                   <span className="text-green-600 flex items-center gap-1">
//                     <TrendingUp className="w-3 h-3" /> {formatCurrency(budgetSummary.recettes, mainCurrency)}
//                   </span>
//                   <span className="text-red-600 flex items-center gap-1">
//                     <TrendingDown className="w-3 h-3" /> {formatCurrency(budgetSummary.depenses, mainCurrency)}
//                   </span>
//                 </div>
//               </>
//             ) : (
//               <>
//                 <p className="text-2xl font-bold text-gray-900">0 {mainCurrency}</p>
//                 <p className="text-xs text-gray-500 mt-1">Aucune donnée</p>
//               </>
//             )}
//           </div>
          
//           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
//             <div className="flex items-center justify-between mb-3">
//               <span className="text-sm font-medium text-gray-500">Taux de réalisation</span>
//               <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
//                 <Activity className="w-4 h-4 text-orange-600" />
//               </div>
//             </div>
//             <p className="text-2xl font-bold text-gray-900">{tauxRealisation}%</p>
//             <p className="text-xs text-gray-500 mt-1">Activités terminées</p>
//           </div>
//         </div>

//         {/* Navigation rapide */}
//         <div className="grid gap-6 md:grid-cols-4 mb-8">
//           <Link
//             href={buildUrl('/conference/activites')}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
//                 <Calendar className="w-6 h-6 text-purple-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Activités</h3>
//                 <p className="text-sm text-gray-500">Gérer toutes les activités</p>
//               </div>
//             </div>
//           </Link>
          
//           <Link
//             href={buildUrl('/conference/budget')}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
//                 <DollarSign className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Budget</h3>
//                 <p className="text-sm text-gray-500">Gérer le budget</p>
//               </div>
//             </div>
//           </Link>
          
//           <Link
//             href={buildUrl('/conference/plans-action')}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
//                 <FileText className="w-6 h-6 text-blue-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Plans d&apos;action</h3>
//                 <p className="text-sm text-gray-500">Gérer les plans d&apos;action</p>
//               </div>
//             </div>
//           </Link>

//           <Link
//             href={buildUrl('/conference/projets')}
//             className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
//           >
//             <div className="flex items-center gap-4">
//               <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
//                 <Rocket className="w-6 h-6 text-indigo-600" />
//               </div>
//               <div>
//                 <h3 className="font-semibold text-gray-900">Projets</h3>
//                 <p className="text-sm text-gray-500">Gérer les projets</p>
//               </div>
//             </div>
//           </Link>
//         </div>

//         {/* Section Projets */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex justify-between items-center">
//               <div>
//                 <h2 className="text-lg font-semibold text-gray-900">Projets</h2>
//                 <p className="text-sm text-gray-500 mt-0.5">Suivi des projets en cours et terminés</p>
//               </div>
//               <Link
//                 href={buildUrl('/conference/projets')}
//                 className="text-sm text-indigo-600 hover:text-indigo-700"
//               >
//                 Voir tous les projets →
//               </Link>
//             </div>
//           </div>
//           <div className="p-6">
//             {anneeConferenceId && unite ? (
//               <ConferenceProjetsClient 
//                 uniteId={unite.id} 
//                 anneeConferenceId={anneeConferenceId}
//                 conferenceNom={chefInfo.conference_nom}
//               />
//             ) : (
//               <div className="text-center py-8 text-gray-500">
//                 Sélectionnez une année pour voir les projets
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Activités récentes */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <div className="flex justify-between items-center">
//               <h2 className="text-lg font-semibold text-gray-900">Activités récentes</h2>
//               <Link
//                 href={buildUrl('/conference/activites')}
//                 className="text-sm text-indigo-600 hover:text-indigo-700"
//               >
//                 Voir tout
//               </Link>
//             </div>
//           </div>
//           <div className="divide-y divide-gray-200">
//             {activitesRecentes.length === 0 ? (
//               <div className="px-6 py-8 text-center text-gray-500">
//                 Aucune activité récente
//               </div>
//             ) : (
//               activitesRecentes.map((activite) => (
//                 <Link
//                   key={activite.id}
//                   href={`/conference/activites/${activite.id}?annee_conference=${anneeConferenceId}`}
//                   className="block px-6 py-4 hover:bg-gray-50 transition-colors"
//                 >
//                   <div className="flex justify-between items-start">
//                     <div className="flex-1">
//                       <h3 className="text-sm font-medium text-gray-900">{activite.titre}</h3>
//                       <p className="text-xs text-gray-500 mt-1">
//                         {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
//                       </p>
//                     </div>
//                     <span className={`px-2 py-1 text-xs rounded-full ${
//                       activite.statut === 'termine' ? 'bg-green-100 text-green-700' :
//                       activite.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
//                       activite.statut === 'annule' ? 'bg-red-100 text-red-700' :
//                       'bg-blue-100 text-blue-700'
//                     }`}>
//                       {activite.statut === 'termine' ? 'Terminée' :
//                        activite.statut === 'en_cours' ? 'En cours' :
//                        activite.statut === 'annule' ? 'Annulée' : 'Planifiée'}
//                     </span>
//                   </div>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }