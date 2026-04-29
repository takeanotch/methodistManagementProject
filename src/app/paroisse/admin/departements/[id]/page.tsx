
// // app/paroisse/admin/departements/[id]/page.tsx
// import { getCurrentFidele } from '@/actions/auth'
// import { getDepartementById } from '@/actions/departements'
// import { 
//   getDepartementUnite, 
//   ensureDepartementUniteExists,
//   ensureDepartementUniteExistsForDistrict,
//   ensureDepartementUniteExistsForConference
// } from '@/actions/unite-organisation'
// import { getActivitesByUnite, getActivitesStats } from '@/actions/activite'
// import { getUniteBudgetSummary, getRealiseTotals } from '@/actions/budget'
// import { getPlansActionByDepartement } from '@/actions/plan-action-departement'
// import { getAnneesConferenceDisponiblesForDepartement, getCurrentAnneeConferenceForDepartement } from '@/actions/fidele-departement'
// import { getProjetsByUnite, getProjetsStats } from '@/actions/projet'
// import { redirect } from 'next/navigation'
// import { ConfigButton } from '@/components/ConfigButton'
// import { getConfiguration } from '@/actions/configurations'
// import { getAnnees } from '@/actions/fidele-departement'
// import AnneeDistrictDepartementGuard from '@/components/AnneeDepartementGuard'
// import { supabase } from '@/lib/supabase'

// import Link from 'next/link'
// import { formatCurrency } from '@/lib/currency'
// import { 
//   ChevronLeft, 
//   Calendar, 
//   TrendingUp, 
//   TrendingDown, 
//   CheckCircle, 
//   Clock, 
//   XCircle,
//   FileText,
//   Users,
//   Target,
//   Wallet
// } from 'lucide-react'
// import { Suspense } from 'react'
// import { DepartmentGestionSkeleton } from '@/components/skeletons/DepartmentGestionSkeleton'
// import { DepartmentProjetsClient } from './DepartmentProjetsClient'

// interface PageProps {
//   params: Promise<{ id: string }>
//   searchParams?: Promise<{ annee_conference?: string }>
// }

// // Composant pour le contenu principal (quand l'année district est ouverte)
// async function DepartementContent({ 
//   departementId, 
//   paroisseId,
//   anneeConferenceParam 
// }: { 
//   departementId: number
//   paroisseId: number
//   anneeConferenceParam?: string
// }) {
//   const departement = await getDepartementById(departementId)
  
//   if (!departement) {
//     redirect('/paroisse/admin/departements')
//   }
  
//   // Récupération des années de conférence
//   const anneesDisponibles = await getAnneesConferenceDisponiblesForDepartement(departementId)
//   const anneeEnCours = await getCurrentAnneeConferenceForDepartement(departementId)
  
//   // Gestion de l'année sélectionnée
//   let anneeConferenceId: number | null = null
  
//   if (anneeConferenceParam) {
//     anneeConferenceId = parseInt(anneeConferenceParam)
//     const anneeExiste = anneesDisponibles.some(a => a.id === anneeConferenceId)
//     if (!anneeExiste) {
//       anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
//     }
//   } else {
//     anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
//   }
  
//   // ========== CRÉATION AUTOMATIQUE DE L'UNITÉ SI ELLE N'EXISTE PAS ==========
//   let unite = await getDepartementUnite(departementId, paroisseId)

//   if (!unite) {
//     console.log('🔄 Unité non trouvée, tentative de création automatique...')
    
//     // Essayer de créer l'unité avec différents niveaux selon le contexte
//     let creationResult = await ensureDepartementUniteExists(departementId, paroisseId)
    
//     // Si la création a échoué, essayer avec le district
//     if (!creationResult.success) {
//       console.log('⚠️ Échec création niveau paroisse, tentative niveau district...')
//       // Récupérer le district_id de la paroisse
//       const { data: paroisseData } = await supabase
//         .from('paroisse')
//         .select('district_id')
//         .eq('id', paroisseId)
//         .single()
      
//       if (paroisseData?.district_id) {
//         creationResult = await ensureDepartementUniteExistsForDistrict(departementId, paroisseData.district_id)
//       }
//     }
    
//     // Si toujours échec, essayer avec la conférence
//     if (!creationResult.success) {
//       console.log('⚠️ Échec création niveau district, tentative niveau conférence...')
      
//       // Récupérer d'abord le district_id
//       const { data: paroisseData } = await supabase
//         .from('paroisse')
//         .select('district_id')
//         .eq('id', paroisseId)
//         .single()
      
//       if (paroisseData?.district_id) {
//         // Ensuite récupérer le conference_id du district
//         const { data: districtData } = await supabase
//           .from('district')
//           .select('conference_id')
//           .eq('id', paroisseData.district_id)
//           .single()
        
//         if (districtData?.conference_id) {
//           creationResult = await ensureDepartementUniteExistsForConference(
//             departementId, 
//             districtData.conference_id
//           )
//         }
//       }
//     }
    
//     if (creationResult.success && creationResult.unite) {
//       console.log('✅ Unité créée avec succès:', creationResult.unite.id)
//       unite = creationResult.unite
//     } else {
//       console.error('❌ Impossible de créer l\'unité:', creationResult.error)
//       // Afficher une erreur à l'utilisateur
//       return (
//         <div className="p-8 text-center">
//           <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
//             <Users size={48} className="mx-auto text-red-300 mb-3" />
//             <p className="text-red-600 font-medium mb-2">
//               Impossible de créer l&apos;unité d&apos;organisation
//             </p>
//             <p className="text-red-500 text-sm mb-4">
//               {creationResult.error || 'Une erreur inattendue est survenue'}
//             </p>
//             <p className="text-gray-500 text-xs mb-4">
//               Département ID: {departementId}, Paroisse ID: {paroisseId}
//             </p>
//             <Link
//               href="/paroisse/admin/departements"
//               className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
//             >
//               Retour aux départements
//             </Link>
//           </div>
//         </div>
//       )
//     }
//   }
  
//   if (!unite) {
//     return (
//       <div className="p-8 text-center">
//         <div className="border border-gray-200 py-16">
//           <Users size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400">
//             L&apos;unité d&apos;organisation pour ce département n&apos;a pas encore été créée.
//           </p>
//           <p className="text-gray-400 text-sm mt-2">
//             Département ID: {departementId}, Paroisse ID: {paroisseId}
//           </p>
//         </div>
//       </div>
//     )
//   }
  
//   // Récupération des données
//   const [
//     activites, 
//     budgetSummary, 
//     plansAction, 
//     projets, 
//     realiseTotals,
//     configuration
//   ] = await Promise.all([
//     anneeConferenceId ? getActivitesByUnite(unite.id, anneeConferenceId) : [],
//     anneeConferenceId ? getUniteBudgetSummary(unite.id, anneeConferenceId) : null,
//     getPlansActionByDepartement(departementId, paroisseId),
//     anneeConferenceId ? getProjetsByUnite(unite.id, anneeConferenceId) : [],
//     anneeConferenceId ? getRealiseTotals(unite.id, anneeConferenceId) : { recettes: 0, depenses: 0 },
//     getConfiguration(unite.id)
//   ])
  
//   const configTaux = configuration?.taux || 2800
  
//   const plansFiltres = anneeConferenceId 
//     ? plansAction.filter(plan => plan.annee_conference_id === anneeConferenceId)
//     : plansAction
    
//   const activitesStats = unite && anneeConferenceId ? await getActivitesStats(undefined, unite.id, anneeConferenceId) : null
//   const projetsStats = unite && anneeConferenceId ? await getProjetsStats(unite.id, anneeConferenceId) : null
  
//   const activitesRecentes = activites
//     .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//     .slice(0, 5)
  
//   const activitesProchaines = activites
//     .filter(a => new Date(a.date) >= new Date() && a.statut !== 'termine' && a.statut !== 'annule')
//     .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
//     .slice(0, 5)
  
//   const buildUrl = (path: string) => {
//     if (anneeConferenceId) {
//       return `${path}?annee_conference=${anneeConferenceId}`
//     }
//     return path
//   }
  
//   // Fonction pour convertir en CDF
//   const convertToCDF = (montant: number, currency: string): number => {
//     if (currency === 'CDF') return montant
//     if (currency === 'USD') return montant * configTaux
//     if (currency === 'EUR') return montant * configTaux * 1.08 // Approximation
//     return montant
//   }
  
//   // Calculer les totaux en CDF
//   const totalRecettesPrevu = (budgetSummary?.recettesList || []).reduce(
//     (sum: number, b: any) => sum + convertToCDF(b.montant, b.currency), 0
//   )
//   const totalDepensesPrevu = (budgetSummary?.depensesList || []).reduce(
//     (sum: number, b: any) => sum + convertToCDF(b.montant, b.currency), 0
//   )
  
//   const recettesRealisees = realiseTotals?.recettes || 0
//   const depensesRealisees = realiseTotals?.depenses || 0
  
//   const progressionRecettes = totalRecettesPrevu > 0 ? (recettesRealisees / totalRecettesPrevu) * 100 : 0
//   const progressionDepenses = totalDepensesPrevu > 0 ? (depensesRealisees / totalDepensesPrevu) * 100 : 0
  
//   const hasBudget = budgetSummary && budgetSummary.totalLines > 0
//   const anneeSelectionnee = anneesDisponibles.find(a => a.id === anneeConferenceId)
  
//   // Statistiques des activités
//   const activitesTerminees = activitesStats?.terminees || 0
//   const activitesEnCours = activitesStats?.enCours || 0
//   const activitesPlanifiees = activitesStats?.planifiees || 0
//   const activitesAnnulees = activitesStats?.annulees || 0
//   const tauxRealisation = activites.length > 0 ? Math.round((activitesTerminees / activites.length) * 100) : 0

//   // Statistiques des projets
//   const projetsEnCours = projetsStats?.enCours || 0
//   const projetsTermines = projetsStats?.termines || 0

//   return (
//     <div className="max-w-7xl mx-auto">
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-2">
//           <Link
//             href="/paroisse/admin/departements"
//             className="text-gray-400 hover:text-black transition-colors"
//           >
//             <ChevronLeft size={20} />
//           </Link>
//           <div className="flex-1">
//             <div className="flex items-center gap-3 mt-1">
//               <h1 className="text-2xl font-light tracking-wide">{departement.nom}</h1>
//               {unite && (
//                 <ConfigButton 
//                   uniteId={unite.id}
//                   uniteNom={departement.nom}
//                   uniteNiveau="Département"
//                 />
//               )}
//             </div>
//             <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
//           {anneeSelectionnee && (
//             <>
//               <span>•</span>
//               <span>{anneeSelectionnee.label} {anneeSelectionnee.is_current && '(en cours)'}</span>
//             </>
//           )}
//         </div>
//       </div>

//       <div className="flex gap-6 mb-6 border-b border-gray-200">
//         <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
//           Aperçu
//         </span>
//         <Link
//           href={`/paroisse/admin/departements/${departementId}/membres`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Membres
//         </Link>
//         <Link
//           href={`/paroisse/admin/departements/${departementId}/activites`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Activités
//         </Link>
//         <Link
//           href={`/paroisse/admin/departements/${departementId}/plan-action`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Plan d&apos;action
//         </Link>
//         <Link
//           href={`/paroisse/admin/departements/${departementId}/budget`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Budget
//         </Link>
//         <Link
//           href={`/paroisse/admin/departements/${departementId}/projets`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Projet
//         </Link>
//       </div>

//       {anneesDisponibles && anneesDisponibles.length > 0 && (
//         <div className="flex gap-2 mb-6">
//           {anneesDisponibles.map((annee) => (
//             <a
//               key={annee.id}
//               href={`/paroisse/admin/departements/${departementId}?annee_conference=${annee.id}`}
//               className={`px-3 py-1.5 text-sm border transition-colors ${
//                 anneeConferenceId === annee.id
//                   ? 'bg-black text-white border-black'
//                   : 'bg-white border-gray-300 hover:border-black text-gray-600'
//               }`}
//             >
//               {annee.label}
//               {annee.is_current && ' ✓'}
//             </a>
//           ))}
//         </div>
//       )}

//       {/* Stats principales */}
//       <div className="grid grid-cols-6 gap-3 mb-6">
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="text-xl font-light">{plansFiltres.length}</div>
//           <div className="text-xs text-gray-500">Plans d&apos;action</div>
//         </div>
//         <div className="bg-purple-50 border border-purple-200 p-3">
//           <div className="text-xl font-light text-purple-700">{activites.length}</div>
//           <div className="text-xs text-purple-600">Activités</div>
//         </div>
//         <div className="bg-indigo-50 border border-indigo-200 p-3">
//           <div className="text-xl font-light text-indigo-700">{projets.length}</div>
//           <div className="text-xs text-indigo-600">Projets</div>
//         </div>
//         <div className="bg-green-50 border border-green-200 p-3">
//           <div className="text-xl font-light text-green-700">
//             {formatCurrency(totalRecettesPrevu, 'CDF')}
//           </div>
//           <div className="text-xs text-green-600">Recettes prévues</div>
//         </div>
//         <div className="bg-red-50 border border-red-200 p-3">
//           <div className="text-xl font-light text-red-700">
//             {formatCurrency(totalDepensesPrevu, 'CDF')}
//           </div>
//           <div className="text-xs text-red-600">Budget dépenses</div>
//         </div>
//         <div className="bg-gray-50 border border-gray-200 p-3">
//           <div className="text-xl font-light">{activitesProchaines.length}</div>
//           <div className="text-xs text-gray-500">À venir</div>
//         </div>
//       </div>

//       {/* Stats secondaires */}
//       <div className="grid grid-cols-5 gap-3 mb-6">
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-light">{activitesTerminees}</span>
//             <CheckCircle size={14} className="text-green-500" />
//           </div>
//           <div className="text-xs text-gray-500">Activités terminées</div>
//         </div>
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-light">{activitesEnCours + activitesPlanifiees}</span>
//             <Clock size={14} className="text-yellow-500" />
//           </div>
//           <div className="text-xs text-gray-500">En cours / planifiées</div>
//         </div>
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-light">{activitesAnnulees}</span>
//             <XCircle size={14} className="text-red-500" />
//           </div>
//           <div className="text-xs text-gray-500">Annulées</div>
//         </div>
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-light">{projetsEnCours}</span>
//             <Target size={14} className="text-indigo-500" />
//           </div>
//           <div className="text-xs text-gray-500">Projets en cours</div>
//         </div>
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="flex items-center justify-between">
//             <span className="text-sm font-light">{tauxRealisation}%</span>
//             <CheckCircle size={14} className="text-orange-500" />
//           </div>
//           <div className="text-xs text-gray-500">Taux réalisation</div>
//         </div>
//       </div>

//       {/* Budget - Recettes et Dépenses (indépendants) */}
//       {hasBudget && (
//         <div className="grid grid-cols-2 gap-4 mb-8">
//           {/* Carte Recettes */}
//           <div className="bg-white border border-gray-200 p-4">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
//                 <TrendingUp size={16} className="text-green-600" />
//                 Prévisions de recettes
//               </h3>
//               <span className="text-xs text-gray-500">
//                 {progressionRecettes.toFixed(1)}% réalisé
//               </span>
//             </div>
            
//             <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
//               <div 
//                 className="h-full bg-green-500 rounded-full"
//                 style={{ width: `${Math.min(progressionRecettes, 100)}%` }}
//               />
//             </div>
            
//             <div className="grid grid-cols-3 gap-2 text-center">
//               <div>
//                 <div className="text-base font-light text-gray-900">
//                   {formatCurrency(totalRecettesPrevu, 'CDF')}
//                 </div>
//                 <div className="text-xs text-gray-500">Prévu</div>
//               </div>
//               <div>
//                 <div className="text-base font-light text-green-700">
//                   {formatCurrency(recettesRealisees, 'CDF')}
//                 </div>
//                 <div className="text-xs text-green-600">Réalisé</div>
//               </div>
//               <div>
//                 <div className={`text-base font-light ${totalRecettesPrevu - recettesRealisees > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
//                   {formatCurrency(Math.max(totalRecettesPrevu - recettesRealisees, 0), 'CDF')}
//                 </div>
//                 <div className="text-xs text-gray-500">Restant</div>
//               </div>
//             </div>
//           </div>

//           {/* Carte Dépenses */}
//           <div className="bg-white border border-gray-200 p-4">
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
//                 <TrendingDown size={16} className="text-red-600" />
//                 Budget de dépenses
//               </h3>
//               <span className="text-xs text-gray-500">
//                 {progressionDepenses.toFixed(1)}% utilisé
//               </span>
//             </div>
            
//             <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
//               <div 
//                 className={`h-full rounded-full ${progressionDepenses > 100 ? 'bg-red-500' : 'bg-orange-500'}`}
//                 style={{ width: `${Math.min(progressionDepenses, 100)}%` }}
//               />
//             </div>
            
//             <div className="grid grid-cols-3 gap-2 text-center">
//               <div>
//                 <div className="text-base font-light text-gray-900">
//                   {formatCurrency(totalDepensesPrevu, 'CDF')}
//                 </div>
//                 <div className="text-xs text-gray-500">Budget</div>
//               </div>
//               <div>
//                 <div className="text-base font-light text-red-700">
//                   {formatCurrency(depensesRealisees, 'CDF')}
//                 </div>
//                 <div className="text-xs text-red-600">Dépensé</div>
//               </div>
//               <div>
//                 <div className={`text-base font-light ${totalDepensesPrevu - depensesRealisees >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                   {formatCurrency(totalDepensesPrevu - depensesRealisees, 'CDF')}
//                 </div>
//                 <div className="text-xs text-gray-500">Disponible</div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Pas de budget */}
//       {!hasBudget && anneeConferenceId && (
//         <div className="mb-8 p-8 border border-gray-200 bg-gray-50 text-center">
//           <Wallet size={32} className="mx-auto text-gray-300 mb-2" />
//           <p className="text-sm text-gray-400">Aucune ligne budgétaire pour cette année</p>
//           <Link
//             href={buildUrl(`/paroisse/admin/departements/${departementId}/budget`)}
//             className="inline-block mt-3 text-sm text-black underline"
//           >
//             Créer un budget →
//           </Link>
//         </div>
//       )}

//       {/* Section Projets */}
//       <div className="mb-8">
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Projets</h2>
//           <Link
//             href={buildUrl(`/paroisse/admin/departements/${departementId}/projets`)}
//             className="text-xs text-gray-400 hover:text-black"
//           >
//             Voir tout →
//           </Link>
//         </div>
//         <DepartmentProjetsClient 
//           uniteId={unite.id} 
//           departementNom={departement.nom}
//         />
//       </div>

//       {/* Activités récentes et à venir */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//         {/* Activités récentes */}
//         <div>
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Activités récentes</h2>
//             <Link
//               href={buildUrl(`/paroisse/admin/departements/${departementId}/activites`)}
//               className="text-xs text-gray-400 hover:text-black"
//             >
//               Voir tout →
//             </Link>
//           </div>
//           <div className="border border-gray-200 bg-white">
//             {activitesRecentes.length === 0 ? (
//               <div className="py-8 text-center">
//                 <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
//                 <p className="text-sm text-gray-400">Aucune activité récente</p>
//               </div>
//             ) : (
//               activitesRecentes.map((activite) => (
//                 <Link
//                   key={activite.id}
//                   href={buildUrl(`/paroisse/admin/departements/${departementId}/activites/${activite.id}`)}
//                   className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-sm font-medium truncate">{activite.titre}</h3>
//                       <p className="text-xs text-gray-500 mt-1">
//                         {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
//                       </p>
//                     </div>
//                     <span className={`text-xs px-2 py-0.5 border ml-2 ${
//                       activite.statut === 'termine' ? 'bg-green-50 text-green-700 border-green-200' :
//                       activite.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
//                       activite.statut === 'annule' ? 'bg-red-50 text-red-700 border-red-200' :
//                       'bg-blue-50 text-blue-700 border-blue-200'
//                     }`}>
//                       {activite.statut === 'termine' ? 'Terminé' :
//                        activite.statut === 'en_cours' ? 'En cours' :
//                        activite.statut === 'annule' ? 'Annulé' : 'Planifié'}
//                     </span>
//                   </div>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Prochaines activités */}
//         <div>
//           <div className="flex items-center justify-between mb-3">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">À venir</h2>
//             <Link
//               href={buildUrl(`/paroisse/admin/departements/${departementId}/activites`)}
//               className="text-xs text-gray-400 hover:text-black"
//             >
//               Voir tout →
//             </Link>
//           </div>
//           <div className="border border-gray-200 bg-white">
//             {activitesProchaines.length === 0 ? (
//               <div className="py-8 text-center">
//                 <Clock size={32} className="mx-auto text-gray-300 mb-2" />
//                 <p className="text-sm text-gray-400">Aucune activité à venir</p>
//               </div>
//             ) : (
//               activitesProchaines.map((activite) => (
//                 <Link
//                   key={activite.id}
//                   href={buildUrl(`/paroisse/admin/departements/${departementId}/activites/${activite.id}`)}
//                   className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-sm font-medium truncate">{activite.titre}</h3>
//                       <p className="text-xs text-gray-500 mt-1">
//                         {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
//                       </p>
//                     </div>
//                     <span className={`text-xs px-2 py-0.5 border ml-2 ${
//                       new Date(activite.date) < new Date() 
//                         ? 'bg-orange-50 text-orange-700 border-orange-200' 
//                         : 'bg-blue-50 text-blue-700 border-blue-200'
//                     }`}>
//                       {new Date(activite.date) < new Date() ? 'En retard' : 'Planifié'}
//                     </span>
//                   </div>
//                 </Link>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Plans d'action récents */}
//       <div>
//         <div className="flex items-center justify-between mb-3">
//           <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Plans d&apos;action récents</h2>
//           <Link
//             href={buildUrl(`/paroisse/admin/departements/${departementId}/plans-action`)}
//             className="text-xs text-gray-400 hover:text-black"
//           >
//             Voir tout →
//           </Link>
//         </div>
//         <div className="border border-gray-200 bg-white">
//           {plansFiltres.length === 0 ? (
//             <div className="py-8 text-center">
//               <FileText size={32} className="mx-auto text-gray-300 mb-2" />
//               <p className="text-sm text-gray-400">Aucun plan d&apos;action</p>
//             </div>
//           ) : (
//             plansFiltres.slice(0, 5).map((plan) => (
//               <Link
//                 key={plan.id}
//                 href={buildUrl(`/paroisse/admin/departements/${departementId}/plans-action/${plan.id}`)}
//                 className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
//               >
//                 <h3 className="text-sm font-medium">{plan.titre}</h3>
//                 {plan.description && (
//                   <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
//                 )}
//                 <p className="text-xs text-gray-400 mt-2">
//                   Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}
//                 </p>
//               </Link>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// // Page principale
// export default async function DepartementDetailPage({ params, searchParams }: PageProps) {
//   const currentFidele = await getCurrentFidele()
  
//   if (!currentFidele) {
//     redirect('/login')
//   }
  
//   const { id } = await params
//   const search = (await searchParams) ?? {}
//   const anneeConferenceParam = search.annee_conference as string | undefined
  
//   const departementId = parseInt(id)
  
//   if (isNaN(departementId)) {
//     redirect('/paroisse/admin/departements?error=invalid-id')
//   }
  
//   const departement = await getDepartementById(departementId)
  
//   if (!departement) {
//     redirect('/paroisse/admin/departements')
//   }
  
//   // Récupérer le district_id de la paroisse
//   const { data: paroisseData } = await supabase
//     .from('paroisse')
//     .select('district_id')
//     .eq('id', currentFidele.paroisse_id)
//     .single()
  
//   const districtId = paroisseData?.district_id
  
//   if (!districtId) {
//     return (
//       <div className="p-8 text-center">
//         <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
//           <Users size={48} className="mx-auto text-red-300 mb-3" />
//           <p className="text-red-600 font-medium mb-2">
//             District non trouvé
//           </p>
//           <p className="text-red-500 text-sm mb-4">
//             Cette paroisse n'est associée à aucun district.
//           </p>
//           <Link
//             href="/paroisse/admin/departements"
//             className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
//           >
//             Retour aux départements
//           </Link>
//         </div>
//       </div>
//     )
//   }
  
//   // Récupérer les années disponibles pour le district
//   const anneesDisponibles = await getAnnees()
  
//   return (
//     <Suspense fallback={<DepartmentGestionSkeleton />}>
//       <AnneeDistrictDepartementGuard
//         departementId={departementId}
//         districtId={districtId}
//         departementNom={departement.nom}
//         redirectOnClosed={false}
//         fallbackUrl="/paroisse/admin/departements"
//       >
//         <DepartementContent
//           departementId={departementId}
//           paroisseId={currentFidele.paroisse_id}
//           anneeConferenceParam={anneeConferenceParam}
//         />
//       </AnneeDistrictDepartementGuard>
//     </Suspense>
//   )
// }

// app/paroisse/admin/departements/[id]/page.tsx
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { 
  getDepartementUnite, 
  ensureDepartementUniteExists,
  ensureDepartementUniteExistsForDistrict,
  ensureDepartementUniteExistsForConference
} from '@/actions/unite-organisation'
import { getActivitesByUnite, getActivitesStats } from '@/actions/activite'
import { getPlansActionByDepartement } from '@/actions/plan-action-departement'
import { getAnneesConferenceDisponiblesForDepartement, getCurrentAnneeConferenceForDepartement } from '@/actions/fidele-departement'
import { getProjetsByUnite, getProjetsStats } from '@/actions/projet'
import { redirect } from 'next/navigation'
import { ConfigButton } from '@/components/ConfigButton'
import { getConfiguration } from '@/actions/configurations'
import { getAnnees } from '@/actions/fidele-departement'
import AnneeDistrictDepartementGuard from '@/components/AnneeDepartementGuard'
import { supabase } from '@/lib/supabase'

import Link from 'next/link'
import { 
  ChevronLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileText,
  Users,
  Target
} from 'lucide-react'
import { Suspense } from 'react'
import { DepartmentGestionSkeleton } from '@/components/skeletons/DepartmentGestionSkeleton'
import { DepartmentProjetsClient } from './DepartmentProjetsClient'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ annee_conference?: string }>
}

// Composant pour le contenu principal (quand l'année district est ouverte)
async function DepartementContent({ 
  departementId, 
  paroisseId,
  anneeConferenceParam 
}: { 
  departementId: number
  paroisseId: number
  anneeConferenceParam?: string
}) {
  const departement = await getDepartementById(departementId)
  
  if (!departement) {
    redirect('/paroisse/admin/departements')
  }
  
  // Récupération des années de conférence
  const anneesDisponibles = await getAnneesConferenceDisponiblesForDepartement(departementId)
  const anneeEnCours = await getCurrentAnneeConferenceForDepartement(departementId)
  
  // Gestion de l'année sélectionnée
  let anneeConferenceId: number | null = null
  
  if (anneeConferenceParam) {
    anneeConferenceId = parseInt(anneeConferenceParam)
    const anneeExiste = anneesDisponibles.some(a => a.id === anneeConferenceId)
    if (!anneeExiste) {
      anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
    }
  } else {
    anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
  }
  
  // ========== CRÉATION AUTOMATIQUE DE L'UNITÉ SI ELLE N'EXISTE PAS ==========
  let unite = await getDepartementUnite(departementId, paroisseId)

  if (!unite) {
    console.log('🔄 Unité non trouvée, tentative de création automatique...')
    
    // Essayer de créer l'unité avec différents niveaux selon le contexte
    let creationResult = await ensureDepartementUniteExists(departementId, paroisseId)
    
    // Si la création a échoué, essayer avec le district
    if (!creationResult.success) {
      console.log('⚠️ Échec création niveau paroisse, tentative niveau district...')
      // Récupérer le district_id de la paroisse
      const { data: paroisseData } = await supabase
        .from('paroisse')
        .select('district_id')
        .eq('id', paroisseId)
        .single()
      
      if (paroisseData?.district_id) {
        creationResult = await ensureDepartementUniteExistsForDistrict(departementId, paroisseData.district_id)
      }
    }
    
    // Si toujours échec, essayer avec la conférence
    if (!creationResult.success) {
      console.log('⚠️ Échec création niveau district, tentative niveau conférence...')
      
      // Récupérer d'abord le district_id
      const { data: paroisseData } = await supabase
        .from('paroisse')
        .select('district_id')
        .eq('id', paroisseId)
        .single()
      
      if (paroisseData?.district_id) {
        // Ensuite récupérer le conference_id du district
        const { data: districtData } = await supabase
          .from('district')
          .select('conference_id')
          .eq('id', paroisseData.district_id)
          .single()
        
        if (districtData?.conference_id) {
          creationResult = await ensureDepartementUniteExistsForConference(
            departementId, 
            districtData.conference_id
          )
        }
      }
    }
    
    if (creationResult.success && creationResult.unite) {
      console.log('✅ Unité créée avec succès:', creationResult.unite.id)
      unite = creationResult.unite
    } else {
      console.error('❌ Impossible de créer l\'unité:', creationResult.error)
      // Afficher une erreur à l'utilisateur
      return (
        <div className="p-8 text-center">
          <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
            <Users size={48} className="mx-auto text-red-300 mb-3" />
            <p className="text-red-600 font-medium mb-2">
              Impossible de créer l&apos;unité d&apos;organisation
            </p>
            <p className="text-red-500 text-sm mb-4">
              {creationResult.error || 'Une erreur inattendue est survenue'}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              Département ID: {departementId}, Paroisse ID: {paroisseId}
            </p>
            <Link
              href="/paroisse/admin/departements"
              className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
            >
              Retour aux départements
            </Link>
          </div>
        </div>
      )
    }
  }
  
  if (!unite) {
    return (
      <div className="p-8 text-center">
        <div className="border border-gray-200 py-16">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            L&apos;unité d&apos;organisation pour ce département n&apos;a pas encore été créée.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Département ID: {departementId}, Paroisse ID: {paroisseId}
          </p>
        </div>
      </div>
    )
  }
  
  // Récupération des données
  const [
    activites, 
    plansAction, 
    projets, 
    configuration
  ] = await Promise.all([
    anneeConferenceId ? getActivitesByUnite(unite.id, anneeConferenceId) : [],
    getPlansActionByDepartement(departementId, paroisseId),
    anneeConferenceId ? getProjetsByUnite(unite.id, anneeConferenceId) : [],
    getConfiguration(unite.id)
  ])
  
  const plansFiltres = anneeConferenceId 
    ? plansAction.filter(plan => plan.annee_conference_id === anneeConferenceId)
    : plansAction
    
  const activitesStats = unite && anneeConferenceId ? await getActivitesStats(undefined, unite.id, anneeConferenceId) : null
  const projetsStats = unite && anneeConferenceId ? await getProjetsStats(unite.id, anneeConferenceId) : null
  
  const activitesRecentes = activites
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
  
  const activitesProchaines = activites
    .filter(a => new Date(a.date) >= new Date() && a.statut !== 'termine' && a.statut !== 'annule')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)
  
  const buildUrl = (path: string) => {
    if (anneeConferenceId) {
      return `${path}?annee_conference=${anneeConferenceId}`
    }
    return path
  }
  
  const anneeSelectionnee = anneesDisponibles.find(a => a.id === anneeConferenceId)
  
  // Statistiques des activités
  const activitesTerminees = activitesStats?.terminees || 0
  const activitesEnCours = activitesStats?.enCours || 0
  const activitesPlanifiees = activitesStats?.planifiees || 0
  const activitesAnnulees = activitesStats?.annulees || 0
  const tauxRealisation = activites.length > 0 ? Math.round((activitesTerminees / activites.length) * 100) : 0

  // Statistiques des projets
  const projetsEnCours = projetsStats?.enCours || 0
  const projetsTermines = projetsStats?.termines || 0

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/paroisse/admin/departements"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-light tracking-wide">{departement.nom}</h1>
              {unite && (
                <ConfigButton 
                  uniteId={unite.id}
                  uniteNom={departement.nom}
                  uniteNiveau="Département"
                />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
          {anneeSelectionnee && (
            <>
              <span>•</span>
              <span>{anneeSelectionnee.label} {anneeSelectionnee.is_current && '(en cours)'}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Aperçu
        </span>
        <Link
          href={`/paroisse/admin/departements/${departementId}/membres`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Membres
        </Link>
        <Link
          href={`/paroisse/admin/departements/${departementId}/activites`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Activités
        </Link>
        <Link
          href={`/paroisse/admin/departements/${departementId}/plan-action`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plan d&apos;action
        </Link>
        <Link
          href={`/paroisse/admin/departements/${departementId}/projets`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Projet
        </Link>
      </div>

      {anneesDisponibles && anneesDisponibles.length > 0 && (
        <div className="flex gap-2 mb-6">
          {anneesDisponibles.map((annee) => (
            <a
              key={annee.id}
              href={`/paroisse/admin/departements/${departementId}?annee_conference=${annee.id}`}
              className={`px-3 py-1.5 text-sm border transition-colors ${
                anneeConferenceId === annee.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-gray-300 hover:border-black text-gray-600'
              }`}
            >
              {annee.label}
              {annee.is_current && ' ✓'}
            </a>
          ))}
        </div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="text-xl font-light">{plansFiltres.length}</div>
          <div className="text-xs text-gray-500">Plans d&apos;action</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3">
          <div className="text-xl font-light text-purple-700">{activites.length}</div>
          <div className="text-xs text-purple-600">Activités</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 p-3">
          <div className="text-xl font-light text-indigo-700">{projets.length}</div>
          <div className="text-xs text-indigo-600">Projets</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-3">
          <div className="text-xl font-light">{activitesProchaines.length}</div>
          <div className="text-xs text-gray-500">À venir</div>
        </div>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{activitesTerminees}</span>
            <CheckCircle size={14} className="text-green-500" />
          </div>
          <div className="text-xs text-gray-500">Activités terminées</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{activitesEnCours + activitesPlanifiees}</span>
            <Clock size={14} className="text-yellow-500" />
          </div>
          <div className="text-xs text-gray-500">En cours / planifiées</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{activitesAnnulees}</span>
            <XCircle size={14} className="text-red-500" />
          </div>
          <div className="text-xs text-gray-500">Annulées</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{projetsEnCours}</span>
            <Target size={14} className="text-indigo-500" />
          </div>
          <div className="text-xs text-gray-500">Projets en cours</div>
        </div>
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-light">{tauxRealisation}%</span>
            <CheckCircle size={14} className="text-orange-500" />
          </div>
          <div className="text-xs text-gray-500">Taux réalisation</div>
        </div>
      </div>

      {/* Section Projets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Projets</h2>
          <Link
            href={buildUrl(`/paroisse/admin/departements/${departementId}/projets`)}
            className="text-xs text-gray-400 hover:text-black"
          >
            Voir tout →
          </Link>
        </div>
        <DepartmentProjetsClient 
          uniteId={unite.id} 
          departementNom={departement.nom}
        />
      </div>

      {/* Activités récentes et à venir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Activités récentes */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Activités récentes</h2>
            <Link
              href={buildUrl(`/paroisse/admin/departements/${departementId}/activites`)}
              className="text-xs text-gray-400 hover:text-black"
            >
              Voir tout →
            </Link>
          </div>
          <div className="border border-gray-200 bg-white">
            {activitesRecentes.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune activité récente</p>
              </div>
            ) : (
              activitesRecentes.map((activite) => (
                <Link
                  key={activite.id}
                  href={buildUrl(`/paroisse/admin/departements/${departementId}/activites/${activite.id}`)}
                  className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{activite.titre}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 border ml-2 ${
                      activite.statut === 'termine' ? 'bg-green-50 text-green-700 border-green-200' :
                      activite.statut === 'en_cours' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      activite.statut === 'annule' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {activite.statut === 'termine' ? 'Terminé' :
                       activite.statut === 'en_cours' ? 'En cours' :
                       activite.statut === 'annule' ? 'Annulé' : 'Planifié'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Prochaines activités */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">À venir</h2>
            <Link
              href={buildUrl(`/paroisse/admin/departements/${departementId}/activites`)}
              className="text-xs text-gray-400 hover:text-black"
            >
              Voir tout →
            </Link>
          </div>
          <div className="border border-gray-200 bg-white">
            {activitesProchaines.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">Aucune activité à venir</p>
              </div>
            ) : (
              activitesProchaines.map((activite) => (
                <Link
                  key={activite.id}
                  href={buildUrl(`/paroisse/admin/departements/${departementId}/activites/${activite.id}`)}
                  className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{activite.titre}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activite.date).toLocaleDateString('fr-FR')} à {activite.heure}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 border ml-2 ${
                      new Date(activite.date) < new Date() 
                        ? 'bg-orange-50 text-orange-700 border-orange-200' 
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {new Date(activite.date) < new Date() ? 'En retard' : 'Planifié'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Plans d'action récents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Plans d&apos;action récents</h2>
          <Link
            href={buildUrl(`/paroisse/admin/departements/${departementId}/plans-action`)}
            className="text-xs text-gray-400 hover:text-black"
          >
            Voir tout →
          </Link>
        </div>
        <div className="border border-gray-200 bg-white">
          {plansFiltres.length === 0 ? (
            <div className="py-8 text-center">
              <FileText size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">Aucun plan d&apos;action</p>
            </div>
          ) : (
            plansFiltres.slice(0, 5).map((plan) => (
              <Link
                key={plan.id}
                href={buildUrl(`/paroisse/admin/departements/${departementId}/plans-action/${plan.id}`)}
                className="block p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-sm font-medium">{plan.titre}</h3>
                {plan.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Page principale
export default async function DepartementDetailPage({ params, searchParams }: PageProps) {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const { id } = await params
  const search = (await searchParams) ?? {}
  const anneeConferenceParam = search.annee_conference as string | undefined
  
  const departementId = parseInt(id)
  
  if (isNaN(departementId)) {
    redirect('/paroisse/admin/departements?error=invalid-id')
  }
  
  const departement = await getDepartementById(departementId)
  
  if (!departement) {
    redirect('/paroisse/admin/departements')
  }
  
  // Récupérer le district_id de la paroisse
  const { data: paroisseData } = await supabase
    .from('paroisse')
    .select('district_id')
    .eq('id', currentFidele.paroisse_id)
    .single()
  
  const districtId = paroisseData?.district_id
  
  if (!districtId) {
    return (
      <div className="p-8 text-center">
        <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
          <Users size={48} className="mx-auto text-red-300 mb-3" />
          <p className="text-red-600 font-medium mb-2">
            District non trouvé
          </p>
          <p className="text-red-500 text-sm mb-4">
            Cette paroisse n'est associée à aucun district.
          </p>
          <Link
            href="/paroisse/admin/departements"
            className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
          >
            Retour aux départements
          </Link>
        </div>
      </div>
    )
  }
  
  // Récupérer les années disponibles pour le district
  const anneesDisponibles = await getAnnees()
  
  return (
    <Suspense fallback={<DepartmentGestionSkeleton />}>
      <AnneeDistrictDepartementGuard
        departementId={departementId}
        districtId={districtId}
        departementNom={departement.nom}
        redirectOnClosed={false}
        fallbackUrl="/paroisse/admin/departements"
      >
        <DepartementContent
          departementId={departementId}
          paroisseId={currentFidele.paroisse_id}
          anneeConferenceParam={anneeConferenceParam}
        />
      </AnneeDistrictDepartementGuard>
    </Suspense>
  )
}