
// // app/paroisse/test/departements/[id]/BudgetClientReadOnly.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter, useSearchParams } from 'next/navigation'
// import { 
//   X, 
//   Loader2, 
//   DollarSign, 
//   Calendar, 
//   TrendingUp, 
//   TrendingDown, 
//   Receipt, 
//   Wallet,
//   Eye,
//   EyeOff,
//   Lock
// } from 'lucide-react'
// import { getBudgetMouvementSummary, getMouvementsByBudget } from '@/actions/finance'
// import { getConfiguration } from '@/actions/configurations'
// import { getRealiseTotals } from '@/actions/budget'
// import { type Currency, formatCurrency } from '@/lib/currency'

// interface BudgetLine {
//   id: number
//   type: 'recette' | 'depense'
//   libelle: string
//   montant: number
//   currency: Currency
//   created_at: string
//   annee_conference_id: number
//   plan_action_id: number | null
// }

// interface BudgetClientReadOnlyProps {
//   uniteId: number
//   departementId: number
//   userNiveau: 'region' | 'conference' | 'district' | 'paroisse' | null
//   anneesDisponibles: any[]
//   anneeConferenceId: number | null
//   budgets: BudgetLine[]
//   summary: any
//   currentFilter: string
// }

// export function BudgetClientReadOnly({ 
//   uniteId, 
//   departementId,
//   userNiveau,
//   anneesDisponibles, 
//   anneeConferenceId, 
//   budgets, 
//   summary, 
//   currentFilter 
// }: BudgetClientReadOnlyProps) {
//   const router = useRouter()
//   const searchParams = useSearchParams()

//   const [selectedBudget, setSelectedBudget] = useState<BudgetLine | null>(null)
//   const [showDetailsModal, setShowDetailsModal] = useState(false)
//   const [mouvements, setMouvements] = useState<any[]>([])
//   const [mouvementSummary, setMouvementSummary] = useState<any>(null)
//   const [detailsLoading, setDetailsLoading] = useState(false)
  
//   const [configTaux, setConfigTaux] = useState<number>(2800)
//   const [visibiliteBudget, setVisibiliteBudget] = useState<{
//     region: 'visible' | 'masque'
//     conference: 'visible' | 'masque'
//     district: 'visible' | 'masque'
//     paroisse: 'visible' | 'masque'
//   }>({
//     region: 'visible',   
//     conference: 'visible',
//     district: 'visible',
//     paroisse: 'visible'
//   })
//   const [configLoading, setConfigLoading] = useState(true)
//   const [realiseTotals, setRealiseTotals] = useState({ 
//     recettes: 0, 
//     depenses: 0,
//     recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
//     depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
//   })

//   const budgetCurrency: Currency = budgets.length > 0 ? budgets[0].currency : 'CDF'
//   const hasBudget = budgets.length > 0

//   // Vérifier si le budget est visible selon le niveau de l'utilisateur
//   const isBudgetVisible = userNiveau ? visibiliteBudget[userNiveau] === 'visible' : false

//   // Message personnalisé selon le niveau
//   const getVisibiliteMessage = () => {
//     switch (userNiveau) {
//       case 'region':
//         return "La visibilité du budget est masquée pour les régions."
//       case 'conference':
//         return "La visibilité du budget est masquée pour les conférences."
//       case 'district':
//         return "La visibilité du budget est masquée pour les districts."
//       case 'paroisse':
//         return "La visibilité du budget est masquée pour les paroisses."
//       default:
//         return "La visibilité du budget est masquée."
//     }
//   }

//   // Obtenir le libellé du niveau
//   const getNiveauLibelle = () => {
//     switch (userNiveau) {
//       case 'region':
//         return 'région'
//       case 'conference':
//         return 'conférence'
//       case 'district':
//         return 'district'
//       case 'paroisse':
//         return 'paroisse'
//       default:
//         return ''
//     }
//   }

//   useEffect(() => {
//     loadConfiguration()
//     if (anneeConferenceId && isBudgetVisible) {
//       loadRealiseTotals()
//     }
//   }, [uniteId, anneeConferenceId, isBudgetVisible])

//   // BudgetClientReadOnly.tsx - Modifier la fonction loadConfiguration

// async function loadConfiguration() {
//   try {
//     const config = await getConfiguration(uniteId)
//     if (config) {
//       setConfigTaux(config.taux)
      
//       // S'assurer que toutes les propriétés de visibilité sont définies
//       // avec des valeurs par défaut pour 'region' si elle n'existe pas
//       setVisibiliteBudget({
//         region: config.visibilite_budget?.region || 'visible', // ← Valeur par défaut
//         conference: config.visibilite_budget?.conference || 'visible',
//         district: config.visibilite_budget?.district || 'visible',
//         paroisse: config.visibilite_budget?.paroisse || 'visible'
//       })
//     }
//   } catch (error) {
//     console.error('Erreur chargement configuration:', error)
//   } finally {
//     setConfigLoading(false)
//   }
// }

//   async function loadRealiseTotals() {
//     if (!anneeConferenceId || !isBudgetVisible) return
//     try {
//       const totals = await getRealiseTotals(uniteId, anneeConferenceId)
//       setRealiseTotals(totals)
//     } catch (error) {
//       console.error('Erreur chargement totaux réalisés:', error)
//     }
//   }

//   const convertToCDF = (montant: number, currency: Currency): number => {
//     if (currency === 'CDF') return montant
//     if (currency === 'USD') return montant * configTaux
//     if (currency === 'EUR') return montant * 1.08 * configTaux
//     return montant
//   }

//   const formatWithCDF = (montant: number, currency: Currency) => {
//     const formatted = formatCurrency(montant, currency)
//     if (currency !== 'CDF') {
//       const cdfAmount = convertToCDF(montant, currency)
//       return `${formatted} (${formatCurrency(cdfAmount, 'CDF')})`
//     }
//     return formatted
//   }

//   const handleAnneeChange = (anneeId: string) => {
//     const params = new URLSearchParams(searchParams.toString())
//     params.set('annee_conference', anneeId)
//     router.push(`/paroisse/test/departements/${departementId}?${params.toString()}`)
//   }

//   const handleFilterChange = (filter: string) => {
//     const params = new URLSearchParams(searchParams.toString())
//     if (filter === 'all') {
//       params.delete('filter')
//     } else {
//       params.set('filter', filter)
//     }
//     router.push(`/paroisse/test/departements/${departementId}?${params.toString()}`)
//   }

//   async function openDetailsModal(budget: BudgetLine) {
//     if (!isBudgetVisible) return
    
//     setSelectedBudget(budget)
//     setDetailsLoading(true)
//     setShowDetailsModal(true)
    
//     const [mouv, summ] = await Promise.all([
//       getMouvementsByBudget(budget.id),
//       getBudgetMouvementSummary(budget.id)
//     ])
//     setMouvements(mouv)
//     setMouvementSummary(summ)
//     setDetailsLoading(false)
//   }

//   const recettes = budgets.filter(b => b.type === 'recette')
//   const depenses = budgets.filter(b => b.type === 'depense')
//   const filteredBudgets = currentFilter === 'recette' ? recettes : currentFilter === 'depense' ? depenses : budgets

//   const calculateTotals = () => {
//     const totalRecettesPrevu = recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)
//     const totalDepensesPrevu = depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)

//     return {
//       totalRecettesPrevu,
//       totalDepensesPrevu,
//       recettesRealisees: realiseTotals.recettes,
//       depensesRealisees: realiseTotals.depenses,
//       progressionRecettes: totalRecettesPrevu > 0 ? (realiseTotals.recettes / totalRecettesPrevu) * 100 : 0,
//       progressionDepenses: totalDepensesPrevu > 0 ? (realiseTotals.depenses / totalDepensesPrevu) * 100 : 0,
//       resteRecettes: totalRecettesPrevu - realiseTotals.recettes,
//       resteDepenses: totalDepensesPrevu - realiseTotals.depenses
//     }
//   }

//   const totals = calculateTotals()

//   // Loading state
//   if (configLoading) {
//     return (
//       <div className="flex items-center justify-center py-12">
//         <Loader2 className="animate-spin text-gray-400" size={32} />
//       </div>
//     )
//   }

//   // Message de budget masqué
//   if (!isBudgetVisible) {
//     return (
//       <div className="space-y-4">
//         {/* Message de taux */}
//         <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-sm">
//           <span className="text-blue-700">
//             💱 Taux de conversion : 1 USD = {formatCurrency(configTaux, 'CDF')}
//           </span>
//         </div>

//         {/* Message de visibilité masquée */}
//         <div className="border border-amber-200 bg-amber-50 p-8 text-center">
//           <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
//             <EyeOff size={32} className="text-amber-600" />
//           </div>
//           <h3 className="text-lg font-medium text-amber-800 mb-2">
//             Budget non disponible
//           </h3>
//           <p className="text-amber-600 max-w-md mx-auto">
//             {getVisibiliteMessage()}
//           </p>
//           <p className="text-amber-500 text-sm mt-3">
//             Contactez l'administrateur pour plus d'informations.
//           </p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <>
//       {/* Taux de configuration */}
//       <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-sm">
//         <span className="text-blue-700">
//           💱 Taux de conversion : 1 USD = {formatCurrency(configTaux, 'CDF')}
//         </span>
//         {isBudgetVisible && userNiveau && (
//           <span className="ml-4 text-green-600">
//             ✓ Budget visible pour {getNiveauLibelle()}
//           </span>
//         )}
//       </div>

//       {/* STATISTIQUES - VUE D'ENSEMBLE EN CDF */}
//       <div className="grid grid-cols-2 gap-4 mb-6">
//         <div className="bg-white border border-gray-200 p-4">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
//               <TrendingUp size={16} className="text-green-600" />
//               Recettes
//             </h3>
//             <span className="text-xs text-gray-500">
//               {totals.progressionRecettes.toFixed(1)}% réalisé
//             </span>
//           </div>
          
//           <div className="w-full h-2 bg-gray-100 mb-3 overflow-hidden">
//             <div 
//               className="h-full bg-green-500 transition-all"
//               style={{ width: `${Math.min(totals.progressionRecettes, 100)}%` }}
//             />
//           </div>
          
//           <div className="grid grid-cols-3 gap-2 text-center">
//             <div>
//               <div className="text-lg font-light text-gray-900">
//                 {formatCurrency(totals.totalRecettesPrevu, 'CDF')}
//               </div>
//               <div className="text-xs text-gray-500">Prévu</div>
//             </div>
//             <div>
//               <div className="text-lg font-light text-green-700">
//                 {formatCurrency(totals.recettesRealisees, 'CDF')}
//               </div>
//               <div className="text-xs text-green-600">Réalisé</div>
//             </div>
//             <div>
//               <div className={`text-lg font-light ${totals.resteRecettes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
//                 {formatCurrency(Math.abs(totals.resteRecettes), 'CDF')}
//               </div>
//               <div className="text-xs text-gray-500">
//                 {totals.resteRecettes > 0 ? 'Restant' : 'Dépassement'}
//               </div>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white border border-gray-200 p-4">
//           <div className="flex items-center justify-between mb-3">
//             <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
//               <TrendingDown size={16} className="text-red-600" />
//               Dépenses
//             </h3>
//             <span className="text-xs text-gray-500">
//               {totals.progressionDepenses.toFixed(1)}% utilisé
//             </span>
//           </div>
          
//           <div className="w-full h-2 bg-gray-100 mb-3 overflow-hidden">
//             <div 
//               className={`h-full transition-all ${
//                 totals.progressionDepenses > 100 ? 'bg-red-500' : 'bg-orange-500'
//               }`}
//               style={{ width: `${Math.min(totals.progressionDepenses, 100)}%` }}
//             />
//           </div>
          
//           <div className="grid grid-cols-3 gap-2 text-center">
//             <div>
//               <div className="text-lg font-light text-gray-900">
//                 {formatCurrency(totals.totalDepensesPrevu, 'CDF')}
//               </div>
//               <div className="text-xs text-gray-500">Budget</div>
//             </div>
//             <div>
//               <div className="text-lg font-light text-red-700">
//                 {formatCurrency(totals.depensesRealisees, 'CDF')}
//               </div>
//               <div className="text-xs text-red-600">Dépensé</div>
//             </div>
//             <div>
//               <div className={`text-lg font-light ${totals.resteDepenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                 {formatCurrency(Math.abs(totals.resteDepenses), 'CDF')}
//               </div>
//               <div className="text-xs text-gray-500">
//                 {totals.resteDepenses >= 0 ? 'Disponible' : 'Dépassement'}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* RÉSUMÉ PAR DEVISE - RECETTES */}
//       <div className="mb-6">
//         <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
//           <TrendingUp size={16} className="text-green-600" />
//           Recettes réalisées par devise
//         </h3>
//         <div className="grid grid-cols-3 gap-3">
//           <div className="bg-green-50 border border-green-200 p-3">
//             <div className="text-xs text-green-600 mb-1">USD</div>
//             <div className="text-xl font-light text-green-800">
//               {formatCurrency(realiseTotals.recettesParDevise.USD, 'USD')}
//             </div>
//             <div className="text-xs text-green-600 mt-1">
//               ≈ {formatCurrency(convertToCDF(realiseTotals.recettesParDevise.USD, 'USD'), 'CDF')}
//             </div>
//           </div>
//           <div className="bg-green-50 border border-green-200 p-3">
//             <div className="text-xs text-green-600 mb-1">CDF</div>
//             <div className="text-xl font-light text-green-800">
//               {formatCurrency(realiseTotals.recettesParDevise.CDF, 'CDF')}
//             </div>
//           </div>
//           <div className="bg-green-50 border border-green-200 p-3">
//             <div className="text-xs text-green-600 mb-1">EUR</div>
//             <div className="text-xl font-light text-green-800">
//               {formatCurrency(realiseTotals.recettesParDevise.EUR, 'EUR')}
//             </div>
//             <div className="text-xs text-green-600 mt-1">
//               ≈ {formatCurrency(convertToCDF(realiseTotals.recettesParDevise.EUR, 'EUR'), 'CDF')}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* RÉSUMÉ PAR DEVISE - DÉPENSES */}
//       <div className="mb-6">
//         <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
//           <TrendingDown size={16} className="text-red-600" />
//           Dépenses réalisées par devise
//         </h3>
//         <div className="grid grid-cols-3 gap-3">
//           <div className="bg-red-50 border border-red-200 p-3">
//             <div className="text-xs text-red-600 mb-1">USD</div>
//             <div className="text-xl font-light text-red-800">
//               {formatCurrency(realiseTotals.depensesParDevise.USD, 'USD')}
//             </div>
//             <div className="text-xs text-red-600 mt-1">
//               ≈ {formatCurrency(convertToCDF(realiseTotals.depensesParDevise.USD, 'USD'), 'CDF')}
//             </div>
//           </div>
//           <div className="bg-red-50 border border-red-200 p-3">
//             <div className="text-xs text-red-600 mb-1">CDF</div>
//             <div className="text-xl font-light text-red-800">
//               {formatCurrency(realiseTotals.depensesParDevise.CDF, 'CDF')}
//             </div>
//           </div>
//           <div className="bg-red-50 border border-red-200 p-3">
//             <div className="text-xs text-red-600 mb-1">EUR</div>
//             <div className="text-xl font-light text-red-800">
//               {formatCurrency(realiseTotals.depensesParDevise.EUR, 'EUR')}
//             </div>
//             <div className="text-xs text-red-600 mt-1">
//               ≈ {formatCurrency(convertToCDF(realiseTotals.depensesParDevise.EUR, 'EUR'), 'CDF')}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* PRÉVISIONS BUDGÉTAIRES */}
//       {hasBudget && (
//         <div className="mb-6">
//           <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
//             <Wallet size={16} />
//             Prévisions budgétaires
//             <span className="text-xs font-normal text-gray-400 ml-2">
//               (Budget en {budgetCurrency === 'USD' ? 'Dollars US' : budgetCurrency === 'EUR' ? 'Euros' : 'Francs Congolais'})
//             </span>
//           </h3>
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//             <div className="bg-white border border-gray-200 p-4">
//               <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
//                 <TrendingUp size={16} className="text-green-600" />
//                 Recettes prévues
//               </h4>
//               <div className="text-2xl font-light text-green-700">
//                 {formatCurrency(recettes.reduce((sum, b) => sum + b.montant, 0), budgetCurrency)}
//               </div>
//               <div className="text-xs text-gray-400 mt-1">
//                 {recettes.length} ligne(s)
//               </div>
//               {budgetCurrency !== 'CDF' && (
//                 <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
//                   ≈ {formatCurrency(recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0), 'CDF')}
//                 </div>
//               )}
//             </div>
            
//             <div className="bg-white border border-gray-200 p-4">
//               <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
//                 <TrendingDown size={16} className="text-red-600" />
//                 Dépenses prévues
//               </h4>
//               <div className="text-2xl font-light text-red-700">
//                 {formatCurrency(depenses.reduce((sum, b) => sum + b.montant, 0), budgetCurrency)}
//               </div>
//               <div className="text-xs text-gray-400 mt-1">
//                 {depenses.length} ligne(s)
//               </div>
//               {budgetCurrency !== 'CDF' && (
//                 <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
//                   ≈ {formatCurrency(depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0), 'CDF')}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Barre d'outils (lecture seule) */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <select 
//             value={anneeConferenceId || ''} 
//             onChange={e => handleAnneeChange(e.target.value)} 
//             className="border border-gray-300 px-3 py-2 text-sm bg-white"
//           >
//             {anneesDisponibles.map((a: any) => (
//               <option key={a.id} value={a.id}>
//                 {a.label} {a.is_current ? '(en cours)' : ''}
//               </option>
//             ))}
//           </select>
//           <div className="flex border border-gray-300 overflow-hidden">
//             <button 
//               onClick={() => handleFilterChange('all')} 
//               className={`px-3 py-2 text-sm ${currentFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
//             >
//               Tous
//             </button>
//             <button 
//               onClick={() => handleFilterChange('recette')} 
//               className={`px-3 py-2 text-sm border-l border-gray-300 ${currentFilter === 'recette' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50'}`}
//             >
//               Recettes
//             </button>
//             <button 
//               onClick={() => handleFilterChange('depense')} 
//               className={`px-3 py-2 text-sm border-l border-gray-300 ${currentFilter === 'depense' ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-50'}`}
//             >
//               Dépenses
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Liste budgets */}
//       {!anneeConferenceId ? (
//         <div className="border border-gray-200 py-16 text-center">
//           <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400">Aucune année disponible</p>
//         </div>
//       ) : filteredBudgets.length === 0 ? (
//         <div className="border border-gray-200 py-16 text-center">
//           <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400">Aucune ligne budgétaire</p>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {(['recette', 'depense'] as const).map(type => {
//             const items = type === 'recette' ? recettes : depenses
//             if (!items.length || (currentFilter !== 'all' && currentFilter !== type)) return null
//             return (
//               <div key={type}>
//                 <h2 className={`text-sm font-medium mb-2 flex items-center gap-2 ${type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
//                   {type === 'recette' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
//                   {type === 'recette' ? 'Recettes' : 'Dépenses'}
//                   <span className="text-gray-400 font-normal ml-2">({items.length})</span>
//                 </h2>
//                 <div className="space-y-2">
//                   {items.map(budget => (
//                     <BudgetRowReadOnly 
//                       key={budget.id} 
//                       budget={budget} 
//                       onDetails={() => openDetailsModal(budget)}
//                       formatWithCDF={formatWithCDF}
//                       configTaux={configTaux}
//                       isVisible={isBudgetVisible}
//                     />
//                   ))}
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       )}

//       {/* Modal Détails */}
//       {showDetailsModal && selectedBudget && isBudgetVisible && (
//         <DetailsModalReadOnly 
//           isOpen={showDetailsModal}
//           onClose={() => setShowDetailsModal(false)}
//           budget={selectedBudget}
//           mouvements={mouvements}
//           summary={mouvementSummary}
//           loading={detailsLoading}
//           configTaux={configTaux}
//           formatWithCDF={formatWithCDF}
//         />
//       )}
//     </>
//   )
// }

// // BudgetRow lecture seule
// function BudgetRowReadOnly({ budget, onDetails, formatWithCDF, configTaux, isVisible }: any) {
//   const [mouvementSummary, setMouvementSummary] = useState<any>(null)
//   const isRecette = budget.type === 'recette'
  
//   useEffect(() => {
//     if (isVisible) {
//       loadMouvementSummary()
//     }
//   }, [budget.id, isVisible])
  
//   async function loadMouvementSummary() {
//     try {
//       const summary = await getBudgetMouvementSummary(budget.id)
//       setMouvementSummary(summary)
//     } catch (error) {
//       console.error('Erreur chargement résumé:', error)
//     }
//   }
  
//   const convertToCDF = (montant: number, currency: Currency): number => {
//     if (currency === 'CDF') return montant
//     if (currency === 'USD') return montant * configTaux
//     if (currency === 'EUR') return montant * 1.08 * configTaux
//     return montant
//   }
  
//   const totalRealiseCDF = mouvementSummary?.totalCDF || 0
//   const prevuCDF = convertToCDF(budget.montant, budget.currency)
//   const progression = prevuCDF > 0 ? (totalRealiseCDF / prevuCDF) * 100 : 0
//   const resteCDF = prevuCDF - totalRealiseCDF
  
//   const mouvementsParDevise = mouvementSummary?.totalParDevise || []
  
//   const handleClick = () => {
//     if (isVisible) {
//       onDetails()
//     }
//   }
  
//   return (
//     <div 
//       className={`bg-white border border-gray-200 p-4 hover:border-gray-300 group ${
//         isVisible ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
//       }`}
//       onClick={handleClick}
//     >
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <div className="flex items-center gap-3">
//             <h3 className="font-medium">{budget.libelle}</h3>
//             <span className={`text-xs px-2 py-0.5 border ${isRecette ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
//               {isRecette ? 'Recette' : 'Dépense'}
//             </span>
//             {!isVisible && (
//               <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
//                 <Lock size={10} />
//                 Masqué
//               </span>
//             )}
//           </div>
          
//           <div className="flex items-center gap-4 mt-2">
//             <div className="flex items-center gap-1">
//               <DollarSign size={14} className={isRecette ? 'text-green-500' : 'text-red-500'} />
//               <span className="text-lg font-light">{formatWithCDF(budget.montant, budget.currency)}</span>
//             </div>
//             <div className="flex items-center gap-1 text-xs text-gray-400">
//               <Calendar size={12} />
//               <span>Créé le {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
//             </div>
//           </div>
          
//           {isVisible && mouvementSummary && mouvementsParDevise.length > 0 && (
//             <div className="mt-2 flex flex-wrap gap-3">
//               {mouvementsParDevise.map((devise: any) => (
//                 <div key={devise.currency} className="text-xs">
//                   <span className="text-gray-500">{devise.currency}:</span>{' '}
//                   <span className="font-medium">{formatCurrency(devise.montant, devise.currency)}</span>
//                   {devise.currency !== 'CDF' && (
//                     <span className="text-gray-400 ml-1">
//                       (≈ {formatCurrency(convertToCDF(devise.montant, devise.currency), 'CDF')})
//                     </span>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
          
//           {isVisible && mouvementSummary && (
//             <div className="mt-3">
//               <div className="flex items-center justify-between text-xs mb-1">
//                 <span className="text-gray-500">
//                   Réalisé: {formatCurrency(totalRealiseCDF, 'CDF')}
//                 </span>
//                 <span className="text-gray-400">
//                   {progression.toFixed(1)}%
//                 </span>
//               </div>
//               <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
//                 <div 
//                   className={`h-full transition-all ${
//                     isRecette ? 'bg-green-500' : 
//                     progression > 100 ? 'bg-red-500' : 'bg-orange-500'
//                   }`}
//                   style={{ width: `${Math.min(progression, 100)}%` }}
//                 />
//               </div>
//               {resteCDF !== 0 && (
//                 <div className={`text-xs mt-1 ${resteCDF > 0 ? 'text-gray-500' : (isRecette ? 'text-green-600' : 'text-red-600')}`}>
//                   {isRecette 
//                     ? (resteCDF > 0 ? `Reste à percevoir: ${formatCurrency(resteCDF, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(resteCDF), 'CDF')}`)
//                     : (resteCDF >= 0 ? `Reste disponible: ${formatCurrency(resteCDF, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(resteCDF), 'CDF')}`)
//                   }
//                 </div>
//               )}
//             </div>
//           )}

//           {!isVisible && (
//             <div className="mt-3 p-2 bg-gray-50 border border-gray-100 text-center">
//               <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
//                 <EyeOff size={12} />
//                 Détails non disponibles - Budget masqué
//               </p>
//             </div>
//           )}
//         </div>
        
//         {isVisible && (
//           <button 
//             onClick={(e) => { e.stopPropagation(); onDetails() }} 
//             className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
//             title="Voir les détails"
//           >
//             <Eye size={16} />
//           </button>
//         )}
//       </div>
//     </div>
//   )
// }

// // Modal Détails lecture seule
// function DetailsModalReadOnly({ isOpen, onClose, budget, mouvements, summary, loading, configTaux, formatWithCDF }: any) {
//   const convertToCDF = (montant: number, currency: Currency): number => {
//     if (currency === 'CDF') return montant
//     if (currency === 'USD') return montant * configTaux
//     if (currency === 'EUR') return montant * 1.08 * configTaux
//     return montant
//   }

//   if (!isOpen) return null
  
//   const mouvementsParDevise = summary?.totalParDevise || []
  
//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
//         <div className="flex justify-between items-center p-4 border-b border-gray-200">
//           <div>
//             <h3 className="text-lg font-light">{budget.libelle}</h3>
//             <p className="text-sm text-gray-500">Budget: {formatWithCDF(budget.montant, budget.currency)}</p>
//           </div>
//           <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
//             <X size={20} />
//           </button>
//         </div>
        
//         <div className="p-4 overflow-y-auto">
//           {summary && (
//             <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
//               <div className="grid grid-cols-2 gap-2">
//                 {mouvementsParDevise.map((devise: any) => (
//                   <div key={devise.currency} className="text-center p-2 bg-white border border-gray-100">
//                     <div className="text-xs text-gray-500">{devise.currency}</div>
//                     <div className="font-medium">{formatCurrency(devise.montant, devise.currency)}</div>
//                     {devise.currency !== 'CDF' && (
//                       <div className="text-xs text-gray-400">
//                         ≈ {formatCurrency(convertToCDF(devise.montant, devise.currency), 'CDF')}
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
              
//               <div className="mt-3 pt-3 border-t border-gray-200">
//                 <div className="flex justify-between">
//                   <span className="text-sm text-gray-600">Total en CDF :</span>
//                   <span className="font-medium">{formatCurrency(summary.totalCDF, 'CDF')}</span>
//                 </div>
//                 <div className="flex justify-between mt-1">
//                   <span className="text-sm text-gray-600">Reste :</span>
//                   <span className={`font-medium ${summary.resteCDF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                     {formatCurrency(summary.resteCDF, 'CDF')}
//                   </span>
//                 </div>
//               </div>
//               <div className="mt-2 text-xs text-gray-400">{summary.nombreMouvements} mouvement(s)</div>
//             </div>
//           )}
          
//           {loading ? (
//             <Loader2 className="animate-spin mx-auto my-10" />
//           ) : mouvements.length === 0 ? (
//             <div className="text-center py-10 text-gray-400">
//               <Receipt size={32} className="mx-auto mb-2 opacity-50" />
//               <p className="text-sm">Aucun mouvement enregistré</p>
//             </div>
//           ) : (
//             <div className="space-y-2 max-h-80 overflow-y-auto">
//               {mouvements.map((m: any) => (
//                 <div key={m.id} className="p-3 border border-gray-200 hover:bg-gray-50">
//                   <div className="flex items-center gap-2">
//                     <span className="font-medium">{formatCurrency(m.montant, m.currency)}</span>
//                     <span className="text-xs bg-gray-100 px-1.5 py-0.5">{m.currency}</span>
//                   </div>
//                   {m.currency !== 'CDF' && (
//                     <div className="text-xs text-gray-400 mt-0.5">
//                       ≈ {formatCurrency(convertToCDF(m.montant, m.currency), 'CDF')}
//                     </div>
//                   )}
//                   <span className="text-xs text-gray-400 block mt-1">
//                     {new Date(m.date_mouvement).toLocaleDateString('fr-FR')}
//                   </span>
//                   {m.description && (
//                     <p className="text-sm text-gray-500 mt-1">{m.description}</p>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
        
//         <div className="p-4 border-t border-gray-200">
//           <button
//             onClick={onClose}
//             className="w-full px-4 py-2 border border-gray-300 hover:border-black text-center text-sm"
//           >
//             Fermer
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// components/BudgetClientReadOnly.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  X, 
  Loader2, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Wallet,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react'
import { getBudgetMouvementSummary, getMouvementsByBudget } from '@/actions/finance'
import { getConfiguration } from '@/actions/configurations'
import { getRealiseTotals } from '@/actions/budget'
import { type Currency, formatCurrency } from '@/lib/currency'

interface BudgetLine {
  id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: Currency
  created_at: string
  annee_conference_id: number
  plan_action_id: number | null
}

interface BudgetClientReadOnlyProps {
  uniteId: number
  // Support pour département OU cabinet (l'un des deux doit être fourni)
  departementId?: number
  cabinetId?: number
  userNiveau: 'region' | 'conference' | 'district' | 'paroisse' | null
  anneesDisponibles: any[]
  anneeConferenceId: number | null
  budgets: BudgetLine[]
  summary: any
  currentFilter: string
}

export function BudgetClientReadOnly({ 
  uniteId, 
  departementId,
  cabinetId,
  userNiveau,
  anneesDisponibles, 
  anneeConferenceId, 
  budgets, 
  summary, 
  currentFilter 
}: BudgetClientReadOnlyProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Déterminer l'ID de l'entité (département ou cabinet)
  const entityId = departementId || cabinetId
  // Déterminer le type d'entité pour construire l'URL
  const entityType = departementId ? 'departements' : 'cabinets'
  const basePath = departementId 
    ? `/paroisse/test/departements/${departementId}`
    : `/district/cabinets/${cabinetId}`

  const [selectedBudget, setSelectedBudget] = useState<BudgetLine | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [mouvements, setMouvements] = useState<any[]>([])
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  
  const [configTaux, setConfigTaux] = useState<number>(2800)
  const [visibiliteBudget, setVisibiliteBudget] = useState<{
    region: 'visible' | 'masque'
    conference: 'visible' | 'masque'
    district: 'visible' | 'masque'
    paroisse: 'visible' | 'masque'
  }>({
    region: 'visible',   
    conference: 'visible',
    district: 'visible',
    paroisse: 'visible'
  })
  const [configLoading, setConfigLoading] = useState(true)
  const [realiseTotals, setRealiseTotals] = useState({ 
    recettes: 0, 
    depenses: 0,
    recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
    depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
  })

  const budgetCurrency: Currency = budgets.length > 0 ? budgets[0].currency : 'CDF'
  const hasBudget = budgets.length > 0

  // Vérifier si le budget est visible selon le niveau de l'utilisateur
  const isBudgetVisible = userNiveau ? visibiliteBudget[userNiveau] === 'visible' : false

  // Message personnalisé selon le niveau
  const getVisibiliteMessage = () => {
    switch (userNiveau) {
      case 'region':
        return "La visibilité du budget est masquée pour les régions."
      case 'conference':
        return "La visibilité du budget est masquée pour les conférences."
      case 'district':
        return "La visibilité du budget est masquée pour les districts."
      case 'paroisse':
        return "La visibilité du budget est masquée pour les paroisses."
      default:
        return "La visibilité du budget est masquée."
    }
  }

  // Obtenir le libellé du niveau
  const getNiveauLibelle = () => {
    switch (userNiveau) {
      case 'region':
        return 'région'
      case 'conference':
        return 'conférence'
      case 'district':
        return 'district'
      case 'paroisse':
        return 'paroisse'
      default:
        return ''
    }
  }

  useEffect(() => {
    loadConfiguration()
    if (anneeConferenceId && isBudgetVisible) {
      loadRealiseTotals()
    }
  }, [uniteId, anneeConferenceId, isBudgetVisible])

  async function loadConfiguration() {
    try {
      const config = await getConfiguration(uniteId)
      if (config) {
        setConfigTaux(config.taux)
        
        // S'assurer que toutes les propriétés de visibilité sont définies
        setVisibiliteBudget({
          region: config.visibilite_budget?.region || 'visible',
          conference: config.visibilite_budget?.conference || 'visible',
          district: config.visibilite_budget?.district || 'visible',
          paroisse: config.visibilite_budget?.paroisse || 'visible'
        })
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  async function loadRealiseTotals() {
    if (!anneeConferenceId || !isBudgetVisible) return
    try {
      const totals = await getRealiseTotals(uniteId, anneeConferenceId)
      setRealiseTotals(totals)
    } catch (error) {
      console.error('Erreur chargement totaux réalisés:', error)
    }
  }

  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }

  const formatWithCDF = (montant: number, currency: Currency) => {
    const formatted = formatCurrency(montant, currency)
    if (currency !== 'CDF') {
      const cdfAmount = convertToCDF(montant, currency)
      return `${formatted} (${formatCurrency(cdfAmount, 'CDF')})`
    }
    return formatted
  }

  const handleAnneeChange = (anneeId: string) => {
    if (!entityId) return
    
    const params = new URLSearchParams(searchParams.toString())
    params.set('annee_conference', anneeId)
    router.push(`${basePath}?${params.toString()}`)
  }

  const handleFilterChange = (filter: string) => {
    if (!entityId) return
    
    const params = new URLSearchParams(searchParams.toString())
    if (filter === 'all') {
      params.delete('filter')
    } else {
      params.set('filter', filter)
    }
    router.push(`${basePath}?${params.toString()}`)
  }

  async function openDetailsModal(budget: BudgetLine) {
    if (!isBudgetVisible) return
    
    setSelectedBudget(budget)
    setDetailsLoading(true)
    setShowDetailsModal(true)
    
    const [mouv, summ] = await Promise.all([
      getMouvementsByBudget(budget.id),
      getBudgetMouvementSummary(budget.id)
    ])
    setMouvements(mouv)
    setMouvementSummary(summ)
    setDetailsLoading(false)
  }

  const recettes = budgets.filter(b => b.type === 'recette')
  const depenses = budgets.filter(b => b.type === 'depense')
  const filteredBudgets = currentFilter === 'recette' ? recettes : currentFilter === 'depense' ? depenses : budgets

  const calculateTotals = () => {
    const totalRecettesPrevu = recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)
    const totalDepensesPrevu = depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)

    return {
      totalRecettesPrevu,
      totalDepensesPrevu,
      recettesRealisees: realiseTotals.recettes,
      depensesRealisees: realiseTotals.depenses,
      progressionRecettes: totalRecettesPrevu > 0 ? (realiseTotals.recettes / totalRecettesPrevu) * 100 : 0,
      progressionDepenses: totalDepensesPrevu > 0 ? (realiseTotals.depenses / totalDepensesPrevu) * 100 : 0,
      resteRecettes: totalRecettesPrevu - realiseTotals.recettes,
      resteDepenses: totalDepensesPrevu - realiseTotals.depenses
    }
  }

  const totals = calculateTotals()

  // Loading state
  if (configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  // Message de budget masqué
  if (!isBudgetVisible) {
    return (
      <div className="space-y-4">
        {/* Message de taux */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-sm">
          <span className="text-blue-700">
            💱 Taux de conversion : 1 USD = {formatCurrency(configTaux, 'CDF')}
          </span>
        </div>

        {/* Message de visibilité masquée */}
        <div className="border border-amber-200 bg-amber-50 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <EyeOff size={32} className="text-amber-600" />
          </div>
          <h3 className="text-lg font-medium text-amber-800 mb-2">
            Budget non disponible
          </h3>
          <p className="text-amber-600 max-w-md mx-auto">
            {getVisibiliteMessage()}
          </p>
          <p className="text-amber-500 text-sm mt-3">
            Contactez l'administrateur pour plus d'informations.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Taux de configuration */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-sm">
        <span className="text-blue-700">
          💱 Taux de conversion : 1 USD = {formatCurrency(configTaux, 'CDF')}
        </span>
        {isBudgetVisible && userNiveau && (
          <span className="ml-4 text-green-600">
            ✓ Budget visible pour {getNiveauLibelle()}
          </span>
        )}
      </div>

      {/* STATISTIQUES - VUE D'ENSEMBLE EN CDF */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              Recettes
            </h3>
            <span className="text-xs text-gray-500">
              {totals.progressionRecettes.toFixed(1)}% réalisé
            </span>
          </div>
          
          <div className="w-full h-2 bg-gray-100 mb-3 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(totals.progressionRecettes, 100)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-light text-gray-900">
                {formatCurrency(totals.totalRecettesPrevu, 'CDF')}
              </div>
              <div className="text-xs text-gray-500">Prévu</div>
            </div>
            <div>
              <div className="text-lg font-light text-green-700">
                {formatCurrency(totals.recettesRealisees, 'CDF')}
              </div>
              <div className="text-xs text-green-600">Réalisé</div>
            </div>
            <div>
              <div className={`text-lg font-light ${totals.resteRecettes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(totals.resteRecettes), 'CDF')}
              </div>
              <div className="text-xs text-gray-500">
                {totals.resteRecettes > 0 ? 'Restant' : 'Dépassement'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-600" />
              Dépenses
            </h3>
            <span className="text-xs text-gray-500">
              {totals.progressionDepenses.toFixed(1)}% utilisé
            </span>
          </div>
          
          <div className="w-full h-2 bg-gray-100 mb-3 overflow-hidden">
            <div 
              className={`h-full transition-all ${
                totals.progressionDepenses > 100 ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(totals.progressionDepenses, 100)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-light text-gray-900">
                {formatCurrency(totals.totalDepensesPrevu, 'CDF')}
              </div>
              <div className="text-xs text-gray-500">Budget</div>
            </div>
            <div>
              <div className="text-lg font-light text-red-700">
                {formatCurrency(totals.depensesRealisees, 'CDF')}
              </div>
              <div className="text-xs text-red-600">Dépensé</div>
            </div>
            <div>
              <div className={`text-lg font-light ${totals.resteDepenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(totals.resteDepenses), 'CDF')}
              </div>
              <div className="text-xs text-gray-500">
                {totals.resteDepenses >= 0 ? 'Disponible' : 'Dépassement'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RÉSUMÉ PAR DEVISE - RECETTES */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-600" />
          Recettes réalisées par devise
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xs text-green-600 mb-1">USD</div>
            <div className="text-xl font-light text-green-800">
              {formatCurrency(realiseTotals.recettesParDevise.USD, 'USD')}
            </div>
            <div className="text-xs text-green-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.recettesParDevise.USD, 'USD'), 'CDF')}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xs text-green-600 mb-1">CDF</div>
            <div className="text-xl font-light text-green-800">
              {formatCurrency(realiseTotals.recettesParDevise.CDF, 'CDF')}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xs text-green-600 mb-1">EUR</div>
            <div className="text-xl font-light text-green-800">
              {formatCurrency(realiseTotals.recettesParDevise.EUR, 'EUR')}
            </div>
            <div className="text-xs text-green-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.recettesParDevise.EUR, 'EUR'), 'CDF')}
            </div>
          </div>
        </div>
      </div>

      {/* RÉSUMÉ PAR DEVISE - DÉPENSES */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <TrendingDown size={16} className="text-red-600" />
          Dépenses réalisées par devise
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-xs text-red-600 mb-1">USD</div>
            <div className="text-xl font-light text-red-800">
              {formatCurrency(realiseTotals.depensesParDevise.USD, 'USD')}
            </div>
            <div className="text-xs text-red-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.depensesParDevise.USD, 'USD'), 'CDF')}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-xs text-red-600 mb-1">CDF</div>
            <div className="text-xl font-light text-red-800">
              {formatCurrency(realiseTotals.depensesParDevise.CDF, 'CDF')}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-xs text-red-600 mb-1">EUR</div>
            <div className="text-xl font-light text-red-800">
              {formatCurrency(realiseTotals.depensesParDevise.EUR, 'EUR')}
            </div>
            <div className="text-xs text-red-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.depensesParDevise.EUR, 'EUR'), 'CDF')}
            </div>
          </div>
        </div>
      </div>

      {/* PRÉVISIONS BUDGÉTAIRES */}
      {hasBudget && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Wallet size={16} />
            Prévisions budgétaires
            <span className="text-xs font-normal text-gray-400 ml-2">
              (Budget en {budgetCurrency === 'USD' ? 'Dollars US' : budgetCurrency === 'EUR' ? 'Euros' : 'Francs Congolais'})
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                Recettes prévues
              </h4>
              <div className="text-2xl font-light text-green-700">
                {formatCurrency(recettes.reduce((sum, b) => sum + b.montant, 0), budgetCurrency)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {recettes.length} ligne(s)
              </div>
              {budgetCurrency !== 'CDF' && (
                <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  ≈ {formatCurrency(recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0), 'CDF')}
                </div>
              )}
            </div>
            
            <div className="bg-white border border-gray-200 p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingDown size={16} className="text-red-600" />
                Dépenses prévues
              </h4>
              <div className="text-2xl font-light text-red-700">
                {formatCurrency(depenses.reduce((sum, b) => sum + b.montant, 0), budgetCurrency)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {depenses.length} ligne(s)
              </div>
              {budgetCurrency !== 'CDF' && (
                <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  ≈ {formatCurrency(depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0), 'CDF')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils (lecture seule) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select 
            value={anneeConferenceId || ''} 
            onChange={e => handleAnneeChange(e.target.value)} 
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            {anneesDisponibles.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.label} {a.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>
          <div className="flex border border-gray-300 overflow-hidden">
            <button 
              onClick={() => handleFilterChange('all')} 
              className={`px-3 py-2 text-sm ${currentFilter === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Tous
            </button>
            <button 
              onClick={() => handleFilterChange('recette')} 
              className={`px-3 py-2 text-sm border-l border-gray-300 ${currentFilter === 'recette' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Recettes
            </button>
            <button 
              onClick={() => handleFilterChange('depense')} 
              className={`px-3 py-2 text-sm border-l border-gray-300 ${currentFilter === 'depense' ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              Dépenses
            </button>
          </div>
        </div>
      </div>

      {/* Liste budgets */}
      {!anneeConferenceId ? (
        <div className="border border-gray-200 py-16 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune année disponible</p>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="border border-gray-200 py-16 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune ligne budgétaire</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['recette', 'depense'] as const).map(type => {
            const items = type === 'recette' ? recettes : depenses
            if (!items.length || (currentFilter !== 'all' && currentFilter !== type)) return null
            return (
              <div key={type}>
                <h2 className={`text-sm font-medium mb-2 flex items-center gap-2 ${type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                  {type === 'recette' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {type === 'recette' ? 'Recettes' : 'Dépenses'}
                  <span className="text-gray-400 font-normal ml-2">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map(budget => (
                    <BudgetRowReadOnly 
                      key={budget.id} 
                      budget={budget} 
                      onDetails={() => openDetailsModal(budget)}
                      formatWithCDF={formatWithCDF}
                      configTaux={configTaux}
                      isVisible={isBudgetVisible}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Détails */}
      {showDetailsModal && selectedBudget && isBudgetVisible && (
        <DetailsModalReadOnly 
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          budget={selectedBudget}
          mouvements={mouvements}
          summary={mouvementSummary}
          loading={detailsLoading}
          configTaux={configTaux}
          formatWithCDF={formatWithCDF}
        />
      )}
    </>
  )
}

// BudgetRow lecture seule
function BudgetRowReadOnly({ budget, onDetails, formatWithCDF, configTaux, isVisible }: any) {
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const isRecette = budget.type === 'recette'
  
  useEffect(() => {
    if (isVisible) {
      loadMouvementSummary()
    }
  }, [budget.id, isVisible])
  
  async function loadMouvementSummary() {
    try {
      const summary = await getBudgetMouvementSummary(budget.id)
      setMouvementSummary(summary)
    } catch (error) {
      console.error('Erreur chargement résumé:', error)
    }
  }
  
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }
  
  const totalRealiseCDF = mouvementSummary?.totalCDF || 0
  const prevuCDF = convertToCDF(budget.montant, budget.currency)
  const progression = prevuCDF > 0 ? (totalRealiseCDF / prevuCDF) * 100 : 0
  const resteCDF = prevuCDF - totalRealiseCDF
  
  const mouvementsParDevise = mouvementSummary?.totalParDevise || []
  
  const handleClick = () => {
    if (isVisible) {
      onDetails()
    }
  }
  
  return (
    <div 
      className={`bg-white border border-gray-200 p-4 hover:border-gray-300 group ${
        isVisible ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{budget.libelle}</h3>
            <span className={`text-xs px-2 py-0.5 border ${isRecette ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isRecette ? 'Recette' : 'Dépense'}
            </span>
            {!isVisible && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
                <Lock size={10} />
                Masqué
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className={isRecette ? 'text-green-500' : 'text-red-500'} />
              <span className="text-lg font-light">{formatWithCDF(budget.montant, budget.currency)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={12} />
              <span>Créé le {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          {isVisible && mouvementSummary && mouvementsParDevise.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {mouvementsParDevise.map((devise: any) => (
                <div key={devise.currency} className="text-xs">
                  <span className="text-gray-500">{devise.currency}:</span>{' '}
                  <span className="font-medium">{formatCurrency(devise.montant, devise.currency)}</span>
                  {devise.currency !== 'CDF' && (
                    <span className="text-gray-400 ml-1">
                      (≈ {formatCurrency(convertToCDF(devise.montant, devise.currency), 'CDF')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {isVisible && mouvementSummary && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  Réalisé: {formatCurrency(totalRealiseCDF, 'CDF')}
                </span>
                <span className="text-gray-400">
                  {progression.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    isRecette ? 'bg-green-500' : 
                    progression > 100 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(progression, 100)}%` }}
                />
              </div>
              {resteCDF !== 0 && (
                <div className={`text-xs mt-1 ${resteCDF > 0 ? 'text-gray-500' : (isRecette ? 'text-green-600' : 'text-red-600')}`}>
                  {isRecette 
                    ? (resteCDF > 0 ? `Reste à percevoir: ${formatCurrency(resteCDF, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(resteCDF), 'CDF')}`)
                    : (resteCDF >= 0 ? `Reste disponible: ${formatCurrency(resteCDF, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(resteCDF), 'CDF')}`)
                  }
                </div>
              )}
            </div>
          )}

          {!isVisible && (
            <div className="mt-3 p-2 bg-gray-50 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                <EyeOff size={12} />
                Détails non disponibles - Budget masqué
              </p>
            </div>
          )}
        </div>
        
        {isVisible && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDetails() }} 
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Voir les détails"
          >
            <Eye size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

// Modal Détails lecture seule
function DetailsModalReadOnly({ isOpen, onClose, budget, mouvements, summary, loading, configTaux, formatWithCDF }: any) {
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }

  if (!isOpen) return null
  
  const mouvementsParDevise = summary?.totalParDevise || []
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">{budget.libelle}</h3>
            <p className="text-sm text-gray-500">Budget: {formatWithCDF(budget.montant, budget.currency)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {summary && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                {mouvementsParDevise.map((devise: any) => (
                  <div key={devise.currency} className="text-center p-2 bg-white border border-gray-100">
                    <div className="text-xs text-gray-500">{devise.currency}</div>
                    <div className="font-medium">{formatCurrency(devise.montant, devise.currency)}</div>
                    {devise.currency !== 'CDF' && (
                      <div className="text-xs text-gray-400">
                        ≈ {formatCurrency(convertToCDF(devise.montant, devise.currency), 'CDF')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total en CDF :</span>
                  <span className="font-medium">{formatCurrency(summary.totalCDF, 'CDF')}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Reste :</span>
                  <span className={`font-medium ${summary.resteCDF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.resteCDF, 'CDF')}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">{summary.nombreMouvements} mouvement(s)</div>
            </div>
          )}
          
          {loading ? (
            <Loader2 className="animate-spin mx-auto my-10" />
          ) : mouvements.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Receipt size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucun mouvement enregistré</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {mouvements.map((m: any) => (
                <div key={m.id} className="p-3 border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(m.montant, m.currency)}</span>
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5">{m.currency}</span>
                  </div>
                  {m.currency !== 'CDF' && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      ≈ {formatCurrency(convertToCDF(m.montant, m.currency), 'CDF')}
                    </div>
                  )}
                  <span className="text-xs text-gray-400 block mt-1">
                    {new Date(m.date_mouvement).toLocaleDateString('fr-FR')}
                  </span>
                  {m.description && (
                    <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 hover:border-black text-center text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}