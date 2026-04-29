

// // app/paroisse/departements/[id]/plans-action/[planId]/page.tsx
// import { Suspense } from 'react'
// import { redirect } from 'next/navigation'
// import Link from 'next/link'
// import { getCurrentFidele } from '@/actions/auth'
// import { getDepartementById } from '@/actions/departements'
// import { getPlanActionDepartementById } from '@/actions/plan-action-departement'
// import { getActivitesByPlanAction, getActivitesStats } from '@/actions/activite'
// import { getPlanBudgetSummary, getBudgetsByPlanAction } from '@/actions/budget'
// import ActiviteCard from '@/components/ActiviteCard'
// import BudgetSummary from '@/components/BudgetSummary'
// import ActiviteModal from './ActiviteModal'
// import ActiviteCalendar from '@/components/ActiviteCalendar'
// import BudgetList from './BudgetList'
// import BudgetModalWrapper from './BudgetModalWrapper'

// interface PageProps {
//   params: Promise<{
//     id: string
//     planId: string
//   }>
//   searchParams?: Promise<{
//     modal?: string
//     activiteId?: string
//     budgetModal?: string
//   }>
// }

// export default async function PlanActionDetailPage({ params, searchParams }: PageProps) {
//   const currentFidele = await getCurrentFidele()
  
//   if (!currentFidele) {
//     redirect('/login')
//   }
  
//   const paroisseId = currentFidele.paroisse_id
//   const { id, planId } = await params
//   const { modal, activiteId } = await (searchParams || {})
//   const departementId = parseInt(id)
//   const planActionId = parseInt(planId)

//   if (isNaN(departementId) || isNaN(planActionId)) {
//     redirect('/paroisse/departements')
//   }

//   const [departement, plan] = await Promise.all([
//     getDepartementById(departementId),
//     getPlanActionDepartementById(planActionId, departementId, paroisseId)
//   ])

//   if (!departement || !plan) {
//     redirect(`/paroisse/departements/${departementId}/plans-action`)
//   }

//   // Récupérer les activités et le budget
//   const [activites, stats, budget, budgetsList] = await Promise.all([
//     getActivitesByPlanAction(plan.id),
//     getActivitesStats(plan.id),
//     getPlanBudgetSummary(plan.id),
//     getBudgetsByPlanAction(plan.id)
//   ])

//   // Récupérer l'activité à modifier si nécessaire
//   let activiteToEdit = null
//   if (modal === 'edit' && activiteId) {
//     const activiteIdNum = parseInt(activiteId)
//     activiteToEdit = activites.find(a => a.id === activiteIdNum)
//   }

//   const canEdit = true // Le fidèle connecté peut modifier car c'est sa paroisse

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('fr-FR', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     })
//   }

//   const formatDateTime = (date: string) => {
//     return new Date(date).toLocaleDateString('fr-FR', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       {/* Modal pour ajouter/modifier une activité - Ce composant doit aussi être un client wrapper */}
//       <ActiviteModal 
//         isOpen={modal === 'new' || modal === 'edit'}
//         planActionId={plan.id}
//         departementId={departementId}
//         activite={activiteToEdit}
//       />

//       {/* Modal pour ajouter une ligne budgétaire - Client wrapper */}
//       <BudgetModalWrapper
//         uniteId={plan.unite_id}
//         anneeConferenceId={plan.annee_conference_id}
//         planActionId={plan.id}
//         departementId={departementId}
//       />

//       {/* Header */}
//       <div className="mb-8">
//         <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
//           <Link href="/paroisse/departements" className="hover:text-gray-700">
//             Départements
//           </Link>
//           <span>/</span>
//           <Link href={`/paroisse/departements/${departementId}`} className="hover:text-gray-700">
//             {departement.nom}
//           </Link>
//           <span>/</span>
//           <Link href={`/paroisse/departements/${departementId}/plans-action`} className="hover:text-gray-700">
//             Plans d'action
//           </Link>
//           <span>/</span>
//           <span className="text-gray-900">{plan.titre}</span>
//         </div>

//         <div className="flex justify-between items-start">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900">{plan.titre}</h1>
//             {plan.description && (
//               <p className="text-gray-600 mt-2 max-w-2xl">{plan.description}</p>
//             )}
//             <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
//               <span>📅 Créé le {formatDate(plan.created_at)}</span>
//               <span>🏢 {departement.nom}</span>
//               <span>📍 {currentFidele.paroisse?.nom}</span>
//             </div>
//           </div>
//           {canEdit && (
//             <div className="flex gap-2">
//               <Link
//                 href={`/paroisse/departements/${departementId}/plans-action/${plan.id}/modifier`}
//                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Modifier
//               </Link>
//               <Link
//                 href={`/paroisse/departements/${departementId}/plans-action/${plan.id}?modal=new`}
//                 className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//               >
//                 + Ajouter une activité
//               </Link>
//               <Link
//                 href={`/paroisse/departements/${departementId}/plans-action`}
//                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//               >
//                 Retour
//               </Link>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Statistiques */}
//       {stats && (
//         <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
//           <div className="bg-white rounded-lg border border-gray-200 p-4">
//             <div className="text-sm text-gray-500">Total activités</div>
//             <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
//           </div>
//           <div className="bg-white rounded-lg border border-gray-200 p-4">
//             <div className="text-sm text-gray-500">Planifiées</div>
//             <div className="text-2xl font-bold text-blue-600">{stats.planifiees}</div>
//           </div>
//           <div className="bg-white rounded-lg border border-gray-200 p-4">
//             <div className="text-sm text-gray-500">En cours</div>
//             <div className="text-2xl font-bold text-yellow-600">{stats.enCours}</div>
//           </div>
//           <div className="bg-white rounded-lg border border-gray-200 p-4">
//             <div className="text-sm text-gray-500">Terminées</div>
//             <div className="text-2xl font-bold text-green-600">{stats.terminees}</div>
//           </div>
//           <div className="bg-white rounded-lg border border-gray-200 p-4">
//             <div className="text-sm text-gray-500">Taux réalisation</div>
//             <div className="text-2xl font-bold text-indigo-600">
//               {Math.round(stats.tauxRealisation)}%
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Alertes */}
//       {stats && stats.enRetard > 0 && (
//         <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
//           <div className="flex items-center gap-2">
//             <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <p className="text-orange-800">
//               <span className="font-semibold">{stats.enRetard}</span> activité{stats.enRetard !== 1 ? 's' : ''} en retard
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Section Budget */}
//       <div className="mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-900">Budget</h2>
//           {canEdit && (
//             <Link
//               href={`/paroisse/departements/${departementId}/plans-action/${plan.id}?budgetModal=new`}
//               className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm hover:bg-indigo-100 transition-colors rounded-lg"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
//               </svg>
//               Ajouter une ligne
//             </Link>
//           )}
//         </div>
        
//         <div className="space-y-4">
//           {/* Résumé du budget */}
//           <BudgetSummary budget={budget} />
          
//           {/* Liste détaillée des lignes budgétaires */}
//           {budgetsList.length > 0 && (
//             <BudgetList 
//               budgets={budgetsList}
//               planActionId={plan.id}
//               departementId={departementId}
//               canEdit={canEdit}
//             />
//           )}

//           {budgetsList.length === 0 && (
//             <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
//               <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <p className="text-gray-500 mb-2">Aucune ligne budgétaire</p>
//               <p className="text-sm text-gray-400">Ajoutez des recettes et dépenses pour suivre le budget</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Informations supplémentaires */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
//         <h2 className="text-sm font-medium text-gray-500 mb-4">Informations</h2>
//         <div className="grid grid-cols-2 gap-4">
//           <div>
//             <p className="text-xs text-gray-400">Créé le</p>
//             <p className="text-gray-900">{formatDateTime(plan.created_at)}</p>
//           </div>
//           <div>
//             <p className="text-xs text-gray-400">Dernière modification</p>
//             <p className="text-gray-900">{formatDateTime(plan.updated_at)}</p>
//           </div>
//           <div>
//             <p className="text-xs text-gray-400">Département</p>
//             <p className="text-gray-900">{departement.nom}</p>
//           </div>
//           <div>
//             <p className="text-xs text-gray-400">Paroisse</p>
//             <p className="text-gray-900">{currentFidele.paroisse?.nom}</p>
//           </div>
//         </div>
//       </div>

//       {/* Calendrier des activités */}
//       <div className="mb-8">
//         <h2 className="text-lg font-semibold text-gray-900 mb-4">Calendrier</h2>
//         <ActiviteCalendar 
//           activites={activites}
//           basePath={`/paroisse/departements/${departementId}/plans-action/${plan.id}`}
//           canEdit={canEdit}
//         />
//       </div>

//       {/* Liste des activités */}
//       <div>
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-900">
//             Activités
//             <span className="ml-2 text-sm font-normal text-gray-500">
//               ({activites.length})
//             </span>
//           </h2>
//         </div>

//         <Suspense fallback={<div>Chargement des activités...</div>}>
//           {activites.length === 0 ? (
//             <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
//               <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//               </svg>
//               <p className="text-gray-500 mb-4">Aucune activité pour ce plan d'action</p>
//               {canEdit && (
//                 <Link
//                   href={`/paroisse/departements/${departementId}/plans-action/${plan.id}?modal=new`}
//                   className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
//                 >
//                   <span>Ajouter une activité</span>
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                   </svg>
//                 </Link>
//               )}
//             </div>
//           ) : (
//             <div className="space-y-6">
//               {/* Activités à venir */}
//               {activites.filter(a => 
//                 new Date(a.date) >= new Date() && 
//                 a.statut !== 'termine' && 
//                 a.statut !== 'annule'
//               ).length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-medium text-gray-500 mb-3">À venir</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {activites
//                       .filter(a => 
//                         new Date(a.date) >= new Date() && 
//                         a.statut !== 'termine' && 
//                         a.statut !== 'annule'
//                       )
//                       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
//                       .map((activite) => (
//                         <ActiviteCard 
//                           key={activite.id} 
//                           activite={activite} 
//                           canEdit={canEdit}
//                           basePath={`/paroisse/departements/${departementId}/plans-action/${plan.id}`}
//                         />
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {/* Activités en retard */}
//               {activites.filter(a => 
//                 new Date(a.date) < new Date() && 
//                 a.statut !== 'termine' && 
//                 a.statut !== 'annule'
//               ).length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-medium text-orange-600 mb-3">En retard</h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {activites
//                       .filter(a => 
//                         new Date(a.date) < new Date() && 
//                         a.statut !== 'termine' && 
//                         a.statut !== 'annule'
//                       )
//                       .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
//                       .map((activite) => (
//                         <ActiviteCard 
//                           key={activite.id} 
//                           activite={activite} 
//                           canEdit={canEdit}
//                           basePath={`/paroisse/departements/${departementId}/plans-action/${plan.id}`}
//                         />
//                       ))}
//                   </div>
//                 </div>
//               )}

//               {/* Activités terminées */}
//               {activites.filter(a => a.statut === 'termine' || a.statut === 'annule').length > 0 && (
//                 <div>
//                   <h3 className="text-sm font-medium text-gray-500 mb-3">
//                     Terminées / Annulées
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     {activites
//                       .filter(a => a.statut === 'termine' || a.statut === 'annule')
//                       .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
//                       .map((activite) => (
//                         <ActiviteCard 
//                           key={activite.id} 
//                           activite={activite} 
//                           canEdit={canEdit}
//                           basePath={`/paroisse/departements/${departementId}/plans-action/${plan.id}`}
//                         />
//                       ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </Suspense>
//       </div>
//     </div>
//   )
// }

// app/paroisse/departements/[id]/plans-action/[planId]/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getPlanActionDepartementById } from '@/actions/plan-action-departement'
import { getActivitesByPlanAction, getActivitesStats } from '@/actions/activite'
import { getBudgetsByPlanAction, getPlanBudgetSummary } from '@/actions/budget'
import { PlanActionDetailContent } from './PlanActionDetailContent'

interface PageProps {
  params: Promise<{
    id: string
    planId: string
  }>
}

export default async function PlanActionDetailPage({ params }: PageProps) {
  const currentFidele = await getCurrentFidele()

  if (!currentFidele) {
    redirect('/login')
  }

  const paroisseId = currentFidele.paroisse_id
  const { id, planId } = await params
  const departementId = parseInt(id)
  const planActionId = parseInt(planId)

  if (isNaN(departementId) || isNaN(planActionId)) {
    redirect('/paroisse/departements')
  }

  const departement = await getDepartementById(departementId)

  if (!departement) {
    redirect('/paroisse/departements')
  }

  const plan = await getPlanActionDepartementById(planActionId, departementId, paroisseId)

  if (!plan) {
    redirect(`/paroisse/departements/${departementId}/plans-action`)
  }

  const [activites, stats, budgetSummary, budgetsList] = await Promise.all([
    getActivitesByPlanAction(plan.id),
    getActivitesStats(plan.id),
    getPlanBudgetSummary(plan.id),
    getBudgetsByPlanAction(plan.id)
  ])

  const canEdit = true

  return (
    <PlanActionDetailContent
      departementId={departementId}
      departement={departement}
      plan={plan}
      activites={activites}
      stats={stats}
      budgetSummary={budgetSummary}
      budgetsList={budgetsList}
      canEdit={canEdit}
    />
  )
}