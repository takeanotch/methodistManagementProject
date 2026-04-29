// // app/paroisse/commissions/[id]/budget/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import Link from 'next/link'
// import { 
//   Plus, 
//   Search, 
//   ChevronLeft,
//   MoreVertical,
//   Edit,
//   Trash2,
//   Loader2,
//   Calendar,
//   DollarSign,
//   TrendingUp,
//   TrendingDown,
//   Wallet,
//   X,
//   Filter,
//   ArrowUp,
//   ArrowDown,
//   Receipt,
//   History,
//   FileText
// } from 'lucide-react'
// import toast from 'react-hot-toast'
// import { supabase } from '@/lib/supabase'
// import { getCommissionUnite } from '@/actions/unite-organisation'
// import { getAnneesConferenceForCommission } from '@/actions/activite-commission'
// import {
//   getBudgetsByCommission,
//   getBudgetSummaryForCommission,
//   getPlansActionForCommissionBudget,
//   createBudgetForCommission,
//   updateBudgetForCommission,
//   deleteBudgetForCommission,
//   type BudgetLineCommission
// } from '@/actions/budget-commission'
// import {
//   getMouvementsByBudget,
//   createMouvementFinance,
//   deleteMouvementFinance,
//   getBudgetMouvementSummary,
//   type MouvementFinance
// } from '@/actions/finance'
// import { type Currency, CURRENCIES, formatCurrency } from '@/lib/currency'

// interface Commission {
//   id: number
//   nom: string
//   description: string | null
//   departement_id: number
//   paroisse_id: number
//   departement?: { id: number; nom: string }
//   paroisse?: { id: number; nom: string }
// }

// interface AnneeConference {
//   id: number
//   annee_id: number
//   label: string
//   is_current: boolean
// }

// interface PlanActionSimple {
//   id: number
//   titre: string
//   annee_conference_id: number
// }

// export default function CommissionBudgetPage() {
//   const params = useParams()
//   const router = useRouter()
//   const commissionId = parseInt(params.id as string)

//   // États
//   const [commission, setCommission] = useState<Commission | null>(null)
//   const [budgets, setBudgets] = useState<BudgetLineCommission[]>([])
//   const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
//   const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
//   const [plansAction, setPlansAction] = useState<PlanActionSimple[]>([])
//   const [summary, setSummary] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filterType, setFilterType] = useState<'all' | 'recette' | 'depense'>('all')
  
//   // Modal budget
//   const [showModal, setShowModal] = useState(false)
//   const [editingBudget, setEditingBudget] = useState<BudgetLineCommission | null>(null)
//   const [formData, setFormData] = useState({
//     libelle: '',
//     type: 'depense' as 'recette' | 'depense',
//     montant: '',
//     currency: 'USD' as Currency,
//     plan_action_id: '',
//     annee_conference_id: 0
//   })
//   const [isSubmitting, setIsSubmitting] = useState(false)
  
//   // Modal mouvement
//   const [showMouvementModal, setShowMouvementModal] = useState(false)
//   const [selectedBudget, setSelectedBudget] = useState<BudgetLineCommission | null>(null)
//   const [mouvementFormData, setMouvementFormData] = useState({
//     montant: '',
//     currency: 'USD' as Currency,
//     date_mouvement: new Date().toISOString().split('T')[0],
//     description: ''
//   })
//   const [isSubmittingMouvement, setIsSubmittingMouvement] = useState(false)
  
//   // Modal détails budget (mouvements)
//   const [showDetailsModal, setShowDetailsModal] = useState(false)
//   const [detailsBudget, setDetailsBudget] = useState<BudgetLineCommission | null>(null)
//   const [mouvements, setMouvements] = useState<MouvementFinance[]>([])
//   const [mouvementSummary, setMouvementSummary] = useState<any>(null)
//   const [loadingMouvements, setLoadingMouvements] = useState(false)
  
//   // Menu
//   const [menuOpen, setMenuOpen] = useState<number | null>(null)
//   const [actionLoading, setActionLoading] = useState<number | null>(null)

//   // Chargement initial
//   useEffect(() => {
//     loadCommission()
//     loadAnneesConference()
//   }, [commissionId])

//   useEffect(() => {
//     if (selectedAnneeConference) {
//       loadBudgets()
//       loadPlansAction()
//     }
//   }, [selectedAnneeConference, filterType])

//   async function loadCommission() {
//     try {
//       const { data, error } = await supabase
//         .from('commission')
//         .select(`
//           id,
//           nom,
//           description,
//           departement_id,
//           paroisse_id,
//           departement:departement_id (id, nom),
//           paroisse:paroisse_id (id, nom)
//         `)
//         .eq('id', commissionId)
//         .single()

//       if (error) throw error

//       const departement = Array.isArray(data.departement) ? data.departement[0] : data.departement
//       const paroisse = Array.isArray(data.paroisse) ? data.paroisse[0] : data.paroisse

//       setCommission({
//         ...data,
//         departement,
//         paroisse
//       })
//     } catch (error) {
//       console.error('Erreur chargement commission:', error)
//       toast.error('Erreur lors du chargement de la commission')
//     }
//   }

//   async function loadAnneesConference() {
//     try {
//       const annees = await getAnneesConferenceForCommission(commissionId)
//       setAnneesConference(annees)
      
//       const current = annees.find(a => a.is_current) || annees[0]
//       if (current) {
//         setSelectedAnneeConference(current)
//         setFormData(prev => ({ ...prev, annee_conference_id: current.id }))
//       }
//     } catch (error) {
//       console.error('Erreur chargement années:', error)
//     }
//   }

//   async function loadPlansAction() {
//     if (!selectedAnneeConference) return
    
//     try {
//       const plans = await getPlansActionForCommissionBudget(commissionId, selectedAnneeConference.id)
//       setPlansAction(plans)
//     } catch (error) {
//       console.error('Erreur chargement plans:', error)
//     }
//   }

//   async function loadBudgets() {
//     if (!selectedAnneeConference) return
    
//     setLoading(true)
//     try {
//       const type = filterType === 'all' ? undefined : filterType
//       const data = await getBudgetsByCommission(commissionId, selectedAnneeConference.id, type)
//       setBudgets(data)
      
//       const summaryData = await getBudgetSummaryForCommission(commissionId, selectedAnneeConference.id)
//       setSummary(summaryData)
//     } catch (error) {
//       console.error('Erreur chargement budgets:', error)
//       toast.error('Erreur lors du chargement du budget')
//     } finally {
//       setLoading(false)
//     }
//   }

//   async function loadMouvementsForBudget(budgetId: number) {
//     setLoadingMouvements(true)
//     try {
//       const data = await getMouvementsByBudget(budgetId)
//       setMouvements(data)
      
//       const summaryData = await getBudgetMouvementSummary(budgetId)
//       setMouvementSummary(summaryData)
//     } catch (error) {
//       console.error('Erreur chargement mouvements:', error)
//     } finally {
//       setLoadingMouvements(false)
//     }
//   }

//   const filteredBudgets = budgets.filter(budget =>
//     budget.libelle.toLowerCase().includes(searchTerm.toLowerCase())
//   )

//   const recettes = budgets.filter(b => b.type === 'recette')
//   const depenses = budgets.filter(b => b.type === 'depense')

//   function openCreateModal() {
//     setEditingBudget(null)
//     setFormData({
//       libelle: '',
//       type: 'depense',
//       montant: '',
//       currency: 'USD',
//       plan_action_id: '',
//       annee_conference_id: selectedAnneeConference?.id || 0
//     })
//     setShowModal(true)
//   }

//   function openEditModal(budget: BudgetLineCommission) {
//     setEditingBudget(budget)
//     setFormData({
//       libelle: budget.libelle,
//       type: budget.type,
//       montant: budget.montant.toString(),
//       currency: budget.currency,
//       plan_action_id: budget.plan_action_id?.toString() || '',
//       annee_conference_id: budget.annee_conference_id
//     })
//     setShowModal(true)
//     setMenuOpen(null)
//   }

//   function openMouvementModal(budget: BudgetLineCommission) {
//     setSelectedBudget(budget)
//     setMouvementFormData({
//       montant: '',
//       currency: budget.currency,
//       date_mouvement: new Date().toISOString().split('T')[0],
//       description: ''
//     })
//     setShowMouvementModal(true)
//     setMenuOpen(null)
//   }

//   async function openDetailsModal(budget: BudgetLineCommission) {
//     setDetailsBudget(budget)
//     setShowDetailsModal(true)
//     setMenuOpen(null)
//     await loadMouvementsForBudget(budget.id)
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setIsSubmitting(true)
    
//     const montant = parseFloat(formData.montant)
//     if (isNaN(montant) || montant <= 0) {
//       toast.error('Le montant doit être supérieur à 0')
//       setIsSubmitting(false)
//       return
//     }
    
//     const formDataObj = new FormData()
//     formDataObj.append('commission_id', commissionId.toString())
//     formDataObj.append('libelle', formData.libelle)
//     formDataObj.append('type', formData.type)
//     formDataObj.append('montant', montant.toString())
//     formDataObj.append('currency', formData.currency)
//     formDataObj.append('annee_conference_id', formData.annee_conference_id.toString())
    
//     if (formData.plan_action_id) {
//       formDataObj.append('plan_action_id', formData.plan_action_id)
//     }
    
//     if (editingBudget) {
//       formDataObj.append('id', editingBudget.id.toString())
//       const result = await updateBudgetForCommission(formDataObj)
//       if (result.success) {
//         toast.success('Ligne budgétaire modifiée')
//         setShowModal(false)
//         loadBudgets()
//       } else {
//         toast.error(result.error || 'Erreur lors de la modification')
//       }
//     } else {
//       const result = await createBudgetForCommission(formDataObj)
//       if (result.success) {
//         toast.success('Ligne budgétaire créée')
//         setShowModal(false)
//         loadBudgets()
//       } else {
//         toast.error(result.error || 'Erreur lors de la création')
//       }
//     }
    
//     setIsSubmitting(false)
//   }

//   async function handleSubmitMouvement(e: React.FormEvent) {
//     e.preventDefault()
//     if (!selectedBudget) return
    
//     setIsSubmittingMouvement(true)
    
//     const montant = parseFloat(mouvementFormData.montant)
//     if (isNaN(montant) || montant <= 0) {
//       toast.error('Le montant doit être supérieur à 0')
//       setIsSubmittingMouvement(false)
//       return
//     }
    
//     const formDataObj = new FormData()
//     formDataObj.append('budget_id', selectedBudget.id.toString())
//     formDataObj.append('type', selectedBudget.type)
//     formDataObj.append('montant', montant.toString())
//     formDataObj.append('currency', mouvementFormData.currency)
//     formDataObj.append('date_mouvement', mouvementFormData.date_mouvement)
//     formDataObj.append('description', mouvementFormData.description)
    
//     const result = await createMouvementFinance(formDataObj)
    
//     if (result.success) {
//       toast.success('Mouvement enregistré')
//       setShowMouvementModal(false)
//       loadBudgets()
      
//       if (showDetailsModal && detailsBudget?.id === selectedBudget.id) {
//         await loadMouvementsForBudget(selectedBudget.id)
//       }
//     } else {
//       toast.error(result.error || 'Erreur lors de l\'enregistrement')
//     }
    
//     setIsSubmittingMouvement(false)
//   }

//   async function handleDelete(budget: BudgetLineCommission) {
//     if (!confirm(`Supprimer la ligne "${budget.libelle}" ?`)) return
    
//     setActionLoading(budget.id)
//     const result = await deleteBudgetForCommission(budget.id, commissionId)
    
//     if (result.success) {
//       toast.success('Ligne supprimée')
//       loadBudgets()
//       if (showDetailsModal) setShowDetailsModal(false)
//     } else {
//       toast.error(result.error || 'Erreur lors de la suppression')
//     }
    
//     setActionLoading(null)
//     setMenuOpen(null)
//   }

//   async function handleDeleteMouvement(mouvementId: number) {
//     if (!confirm('Supprimer ce mouvement ?')) return
    
//     const result = await deleteMouvementFinance(mouvementId)
    
//     if (result.success) {
//       toast.success('Mouvement supprimé')
//       if (detailsBudget) {
//         await loadMouvementsForBudget(detailsBudget.id)
//       }
//       loadBudgets()
//     } else {
//       toast.error(result.error || 'Erreur lors de la suppression')
//     }
//   }

//   if (!commission) {
//     return (
//       <div className="p-8 text-center">
//         <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-2">
//           <Link
//             href={`/paroisse/commissions/${commissionId}`}
//             className="text-gray-400 hover:text-black transition-colors"
//           >
//             <ChevronLeft size={20} />
//           </Link>
//           <div>
//             <h1 className="text-2xl font-light tracking-wide">{commission.nom}</h1>
//             <p className="text-sm text-gray-500 mt-0.5">Budget</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 text-xs text-gray-400">
//           <span>{commission.departement?.nom}</span>
//           <span>•</span>
//           <span>{commission.paroisse?.nom}</span>
//         </div>
//       </div>

//       {/* Navigation secondaire */}
//       <div className="flex gap-6 mb-6 border-b border-gray-200">
//         <Link
//           href={`/paroisse/commissions/${commissionId}`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Membres
//         </Link>
//         <Link
//           href={`/paroisse/commissions/${commissionId}/activites`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Activités
//         </Link>
//         <Link
//           href={`/paroisse/commissions/${commissionId}/plans-action`}
//           className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
//         >
//           Plans d&apos;action
//         </Link>
//         <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
//           Budget
//         </span>
//       </div>

//       {/* Résumé */}
//       {summary && (
//         <div className="grid grid-cols-6 gap-3 mb-6">
//           <div className="bg-white border border-gray-200 p-3">
//             <div className="text-xl font-light">{summary.totalLines}</div>
//             <div className="text-xs text-gray-500">Total lignes</div>
//           </div>
//           <div className="bg-green-50 border border-green-200 p-3">
//             <div className="text-xl font-light text-green-700">
//               ${summary.totalUSD.recettes.toLocaleString(undefined, { maximumFractionDigits: 0 })}
//             </div>
//             <div className="text-xs text-green-600">Recettes (USD)</div>
//           </div>
//           <div className="bg-red-50 border border-red-200 p-3">
//             <div className="text-xl font-light text-red-700">
//               ${summary.totalUSD.depenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}
//             </div>
//             <div className="text-xs text-red-600">Dépenses (USD)</div>
//           </div>
//           <div className={`border p-3 ${summary.totalUSD.solde >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
//             <div className={`text-xl font-light ${summary.totalUSD.solde >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
//               ${summary.totalUSD.solde.toLocaleString(undefined, { maximumFractionDigits: 0 })}
//             </div>
//             <div className={`text-xs ${summary.totalUSD.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
//               Solde (USD)
//             </div>
//           </div>
//           <div className="bg-purple-50 border border-purple-200 p-3">
//             <div className="text-xl font-light text-purple-700">{recettes.length}</div>
//             <div className="text-xs text-purple-600">Lignes recettes</div>
//           </div>
//           <div className="bg-gray-50 border border-gray-200 p-3">
//             <div className="text-xl font-light">{depenses.length}</div>
//             <div className="text-xs text-gray-500">Lignes dépenses</div>
//           </div>
//         </div>
//       )}

//       {/* Barre d'outils */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <select
//             value={selectedAnneeConference?.id || ''}
//             onChange={(e) => {
//               const ac = anneesConference.find(a => a.id === parseInt(e.target.value))
//               if (ac) {
//                 setSelectedAnneeConference(ac)
//                 setFormData(prev => ({ ...prev, annee_conference_id: ac.id }))
//               }
//             }}
//             className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
//           >
//             {anneesConference.map(annee => (
//               <option key={annee.id} value={annee.id}>
//                 {annee.label} {annee.is_current ? '(en cours)' : ''}
//               </option>
//             ))}
//           </select>

//           <div className="flex border border-gray-300">
//             <button
//               onClick={() => setFilterType('all')}
//               className={`px-3 py-2 text-sm ${filterType === 'all' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
//             >
//               Tous
//             </button>
//             <button
//               onClick={() => setFilterType('recette')}
//               className={`px-3 py-2 text-sm ${filterType === 'recette' ? 'bg-green-600 text-white' : 'bg-white hover:bg-gray-50'}`}
//             >
//               Recettes
//             </button>
//             <button
//               onClick={() => setFilterType('depense')}
//               className={`px-3 py-2 text-sm ${filterType === 'depense' ? 'bg-red-600 text-white' : 'bg-white hover:bg-gray-50'}`}
//             >
//               Dépenses
//             </button>
//           </div>

//           <div className="relative">
//             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Rechercher..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
//             />
//           </div>
//         </div>

//         <button
//           onClick={openCreateModal}
//           className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
//         >
//           <Plus size={16} />
//           Nouvelle ligne
//         </button>
//       </div>

//       {/* Résumé par devise */}
//       {summary && summary.byCurrency.length > 0 && (
//         <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
//           <h3 className="text-sm font-medium mb-3">Résumé par devise</h3>
//           <div className="grid grid-cols-4 gap-4">
//             {summary.byCurrency.map((item: any) => (
//               <div key={item.currency} className="text-center p-2 bg-white border border-gray-200">
//                 <div className="text-lg font-medium">{item.currency}</div>
//                 <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
//                   <div>
//                     <span className="text-green-600">+{item.recettes.toLocaleString()}</span>
//                   </div>
//                   <div>
//                     <span className="text-red-600">-{item.depenses.toLocaleString()}</span>
//                   </div>
//                 </div>
//                 <div className={`text-sm font-medium mt-1 ${item.solde >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
//                   {item.solde >= 0 ? '+' : ''}{item.solde.toLocaleString()} {item.currency}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Liste des budgets */}
//       {loading ? (
//         <div className="flex justify-center py-20">
//           <Loader2 size={32} className="animate-spin text-gray-400" />
//         </div>
//       ) : filteredBudgets.length === 0 ? (
//         <div className="border border-gray-200 py-16 text-center">
//           <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400">Aucune ligne budgétaire pour cette période</p>
//           <button
//             onClick={openCreateModal}
//             className="mt-4 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 inline-flex items-center gap-2"
//           >
//             <Plus size={16} />
//             Créer une ligne
//           </button>
//         </div>
//       ) : (
//         <div className="space-y-6">
//           {/* Recettes */}
//           {recettes.length > 0 && (filterType === 'all' || filterType === 'recette') && (
//             <div>
//               <h2 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
//                 <TrendingUp size={16} />
//                 Recettes
//               </h2>
//               <div className="space-y-2">
//                 {recettes.filter(b => filteredBudgets.includes(b)).map(budget => (
//                   <BudgetRow
//                     key={budget.id}
//                     budget={budget}
//                     plansAction={plansAction}
//                     menuOpen={menuOpen}
//                     setMenuOpen={setMenuOpen}
//                     actionLoading={actionLoading}
//                     onEdit={openEditModal}
//                     onDelete={handleDelete}
//                     onAddMouvement={openMouvementModal}
//                     onViewDetails={openDetailsModal}
//                   />
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* Dépenses */}
//           {depenses.length > 0 && (filterType === 'all' || filterType === 'depense') && (
//             <div>
//               <h2 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
//                 <TrendingDown size={16} />
//                 Dépenses
//               </h2>
//               <div className="space-y-2">
//                 {depenses.filter(b => filteredBudgets.includes(b)).map(budget => (
//                   <BudgetRow
//                     key={budget.id}
//                     budget={budget}
//                     plansAction={plansAction}
//                     menuOpen={menuOpen}
//                     setMenuOpen={setMenuOpen}
//                     actionLoading={actionLoading}
//                     onEdit={openEditModal}
//                     onDelete={handleDelete}
//                     onAddMouvement={openMouvementModal}
//                     onViewDetails={openDetailsModal}
//                   />
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Modal création/édition budget */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <h3 className="text-lg font-light">
//                 {editingBudget ? 'Modifier la ligne' : 'Nouvelle ligne budgétaire'}
//               </h3>
//               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Type *</label>
//                 <select
//                   value={formData.type}
//                   onChange={(e) => setFormData({ ...formData, type: e.target.value as 'recette' | 'depense' })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   required
//                 >
//                   <option value="recette">Recette</option>
//                   <option value="depense">Dépense</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Libellé *</label>
//                 <input
//                   type="text"
//                   value={formData.libelle}
//                   onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   required
//                   placeholder="Ex: Dîmes et offrandes"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Montant *</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     min="0.01"
//                     value={formData.montant}
//                     onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
//                     className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Devise *</label>
//                   <select
//                     value={formData.currency}
//                     onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
//                     className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                     required
//                   >
//                     {Object.keys(CURRENCIES).map(c => (
//                       <option key={c} value={c}>{c}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Plan d&apos;action (optionnel)</label>
//                 <select
//                   value={formData.plan_action_id}
//                   onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                 >
//                   <option value="">Aucun</option>
//                   {plansAction.map(plan => (
//                     <option key={plan.id} value={plan.id}>
//                       {plan.titre}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Année conférence *</label>
//                 <select
//                   value={formData.annee_conference_id}
//                   onChange={(e) => setFormData({ ...formData, annee_conference_id: parseInt(e.target.value) })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   required
//                 >
//                   <option value="">Sélectionner une année</option>
//                   {anneesConference.map(annee => (
//                     <option key={annee.id} value={annee.id}>
//                       {annee.label} {annee.is_current ? '(en cours)' : ''}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </form>

//             <div className="p-4 border-t border-gray-200 flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => setShowModal(false)}
//                 className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
//               >
//                 Annuler
//               </button>
//               <button
//                 type="button"
//                 onClick={handleSubmit}
//                 disabled={isSubmitting}
//                 className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
//               >
//                 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingBudget ? 'Modifier' : 'Créer'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal ajout mouvement */}
//       {showMouvementModal && selectedBudget && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <h3 className="text-lg font-light">
//                 Ajouter un mouvement - {selectedBudget.libelle}
//               </h3>
//               <button onClick={() => setShowMouvementModal(false)} className="text-gray-400 hover:text-black">
//                 <X size={20} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmitMouvement} className="flex-1 overflow-y-auto p-4 space-y-4">
//               <div className="bg-gray-50 p-3 text-sm">
//                 <span className="text-gray-500">Budget prévu :</span>{' '}
//                 <span className="font-medium">{formatCurrency(selectedBudget.montant, selectedBudget.currency)}</span>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Montant *</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     min="0.01"
//                     value={mouvementFormData.montant}
//                     onChange={(e) => setMouvementFormData({ ...mouvementFormData, montant: e.target.value })}
//                     className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                     required
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">Devise</label>
//                   <input
//                     type="text"
//                     value={mouvementFormData.currency}
//                     disabled
//                     className="w-full border border-gray-200 bg-gray-50 px-3 py-2 text-gray-500"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Date *</label>
//                 <input
//                   type="date"
//                   value={mouvementFormData.date_mouvement}
//                   onChange={(e) => setMouvementFormData({ ...mouvementFormData, date_mouvement: e.target.value })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   required
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Description</label>
//                 <textarea
//                   value={mouvementFormData.description}
//                   onChange={(e) => setMouvementFormData({ ...mouvementFormData, description: e.target.value })}
//                   className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                   rows={2}
//                   placeholder="Description du mouvement..."
//                 />
//               </div>
//             </form>

//             <div className="p-4 border-t border-gray-200 flex gap-3">
//               <button
//                 type="button"
//                 onClick={() => setShowMouvementModal(false)}
//                 className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
//               >
//                 Annuler
//               </button>
//               <button
//                 type="button"
//                 onClick={handleSubmitMouvement}
//                 disabled={isSubmittingMouvement}
//                 className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
//               >
//                 {isSubmittingMouvement ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Modal détails budget (mouvements) */}
//       {showDetailsModal && detailsBudget && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
//             <div className="flex justify-between items-center p-4 border-b border-gray-200">
//               <div>
//                 <h3 className="text-lg font-light">{detailsBudget.libelle}</h3>
//                 <p className="text-sm text-gray-500">
//                   Budget prévu : {formatCurrency(detailsBudget.montant, detailsBudget.currency)}
//                 </p>
//               </div>
//               <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-black">
//                 <X size={20} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4">
//               {/* Résumé mouvements */}
//               {mouvementSummary && (
//                 <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-600">Total réalisé :</span>
//                     <span className="text-lg font-medium">
//                       {formatCurrency(mouvementSummary.total, detailsBudget.currency)}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between mt-1">
//                     <span className="text-sm text-gray-600">Reste à réaliser :</span>
//                     <span className={`font-medium ${mouvementSummary.reste >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                       {formatCurrency(mouvementSummary.reste, detailsBudget.currency)}
//                     </span>
//                   </div>
//                   <div className="mt-2 text-xs text-gray-400">
//                     {mouvementSummary.nombreMouvements} mouvement(s)
//                   </div>
//                 </div>
//               )}

//               {/* Liste des mouvements */}
//               {loadingMouvements ? (
//                 <div className="flex justify-center py-10">
//                   <Loader2 size={24} className="animate-spin text-gray-400" />
//                 </div>
//               ) : mouvements.length === 0 ? (
//                 <div className="text-center py-10 text-gray-400">
//                   <History size={32} className="mx-auto mb-2 opacity-50" />
//                   <p>Aucun mouvement enregistré</p>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {mouvements.map(mouvement => (
//                     <div key={mouvement.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-gray-300">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-2">
//                           <span className="font-medium">
//                             {formatCurrency(mouvement.montant, mouvement.currency)}
//                           </span>
//                           <span className="text-xs text-gray-400">
//                             {new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR')}
//                           </span>
//                         </div>
//                         {mouvement.description && (
//                           <p className="text-sm text-gray-500 mt-1">{mouvement.description}</p>
//                         )}
//                       </div>
//                       <button
//                         onClick={() => handleDeleteMouvement(mouvement.id)}
//                         className="p-1 text-gray-400 hover:text-red-500"
//                         title="Supprimer"
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>

//             <div className="p-4 border-t border-gray-200">
//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowDetailsModal(false)
//                   openMouvementModal(detailsBudget)
//                 }}
//                 className="w-full px-4 py-2 bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
//               >
//                 <Plus size={16} />
//                 Ajouter un mouvement
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {menuOpen && (
//         <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
//       )}
//     </div>
//   )
// }

// // Composant ligne de budget
// function BudgetRow({ 
//   budget, 
//   plansAction, 
//   menuOpen, 
//   setMenuOpen, 
//   actionLoading, 
//   onEdit, 
//   onDelete, 
//   onAddMouvement, 
//   onViewDetails 
// }: {
//   budget: BudgetLineCommission
//   plansAction: PlanActionSimple[]
//   menuOpen: number | null
//   setMenuOpen: (id: number | null) => void
//   actionLoading: number | null
//   onEdit: (budget: BudgetLineCommission) => void
//   onDelete: (budget: BudgetLineCommission) => void
//   onAddMouvement: (budget: BudgetLineCommission) => void
//   onViewDetails: (budget: BudgetLineCommission) => void
// }) {
//   const planAssocie = plansAction.find(p => p.id === budget.plan_action_id)
//   const isRecette = budget.type === 'recette'

//   return (
//     <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group">
//       <div className="flex items-start justify-between">
//         <div className="flex-1">
//           <div className="flex items-center gap-3">
//             <h3 className="font-medium">{budget.libelle}</h3>
//             <span className={`text-xs px-2 py-0.5 border ${isRecette ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
//               {isRecette ? 'Recette' : 'Dépense'}
//             </span>
//           </div>
          
//           <div className="flex items-center gap-4 mt-2">
//             <div className="flex items-center gap-1">
//               <DollarSign size={14} className={isRecette ? 'text-green-500' : 'text-red-500'} />
//               <span className="text-lg font-light">
//                 {formatCurrency(budget.montant, budget.currency)}
//               </span>
//             </div>
//             {planAssocie && (
//               <div className="flex items-center gap-1 text-xs text-gray-400">
//                 <FileText size={12} />
//                 <span>{planAssocie.titre}</span>
//               </div>
//             )}
//             <div className="flex items-center gap-1 text-xs text-gray-400">
//               <Calendar size={12} />
//               <span>Créé le {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
//             </div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={() => onAddMouvement(budget)}
//             className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isRecette ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
//             title={isRecette ? 'Enregistrer une recette' : 'Enregistrer une dépense'}
//           >
//             {isRecette ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
//           </button>
          
//           <button
//             onClick={() => onViewDetails(budget)}
//             className="p-1.5 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
//             title="Voir les mouvements"
//           >
//             <Receipt size={16} />
//           </button>
          
//           <div className="relative">
//             <button
//               onClick={() => setMenuOpen(menuOpen === budget.id ? null : budget.id)}
//               className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
//             >
//               <MoreVertical size={16} />
//             </button>
            
//             {menuOpen === budget.id && (
//               <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[150px]">
//                 <button
//                   onClick={() => onEdit(budget)}
//                   className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
//                 >
//                   <Edit size={14} /> Modifier
//                 </button>
//                 <button
//                   onClick={() => onDelete(budget)}
//                   disabled={actionLoading === budget.id}
//                   className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
//                 >
//                   {actionLoading === budget.id ? (
//                     <Loader2 size={14} className="animate-spin" />
//                   ) : (
//                     <Trash2 size={14} />
//                   )}
//                   Supprimer
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
// app/paroisse/commissions/[id]/budget/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  X,
  ArrowUp,
  ArrowDown,
  Receipt,
  History,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { getCommissionUnite } from '@/actions/unite-organisation'
import { getAnneesConferenceForCommission } from '@/actions/activite-commission'
import {
  getBudgetsByCommission,
  getBudgetSummaryForCommission,
  getPlansActionForCommissionBudget,
  createBudgetForCommission,
  updateBudgetForCommission,
  deleteBudgetForCommission,
  getRealiseTotalsForCommission,
  type BudgetLineCommission
} from '@/actions/budget-commission'
import {
  getMouvementsByBudget,
  createMouvementFinance,
  deleteMouvementFinance,
  getBudgetMouvementSummary,
  type MouvementFinance
} from '@/actions/finance'
import { getConfiguration } from '@/actions/configurations'
import { type Currency, CURRENCIES, formatCurrency } from '@/lib/currency'

interface Commission {
  id: number
  nom: string
  description: string | null
  departement_id: number
  paroisse_id: number
  departement?: { id: number; nom: string }
  paroisse?: { id: number; nom: string }
}

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

interface PlanActionSimple {
  id: number
  titre: string
  annee_conference_id: number
}

export default function CommissionBudgetPage() {
  const params = useParams()
  const router = useRouter()
  const commissionId = parseInt(params.id as string)

  // États
  const [commission, setCommission] = useState<Commission | null>(null)
  const [budgets, setBudgets] = useState<BudgetLineCommission[]>([])
  const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
  const [plansAction, setPlansAction] = useState<PlanActionSimple[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'recette' | 'depense'>('all')
  
  // Configuration et totaux réalisés
  const [configTaux, setConfigTaux] = useState<number>(2800)
  const [configLoading, setConfigLoading] = useState(true)
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [realiseTotals, setRealiseTotals] = useState({ 
    recettes: 0, 
    depenses: 0,
    recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
    depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
  })
  
  // Modal budget
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetLineCommission | null>(null)
  const [formData, setFormData] = useState({
    libelle: '',
    type: 'depense' as 'recette' | 'depense',
    montant: '',
    currency: 'USD' as Currency,
    plan_action_id: '',
    annee_conference_id: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modal mouvement
  const [showMouvementModal, setShowMouvementModal] = useState(false)
  const [selectedBudget, setSelectedBudget] = useState<BudgetLineCommission | null>(null)
  const [mouvementFormData, setMouvementFormData] = useState({
    montant: '',
    currency: 'USD' as Currency,
    date_mouvement: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [isSubmittingMouvement, setIsSubmittingMouvement] = useState(false)
  
  // Modal détails budget (mouvements)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [detailsBudget, setDetailsBudget] = useState<BudgetLineCommission | null>(null)
  const [mouvements, setMouvements] = useState<MouvementFinance[]>([])
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const [loadingMouvements, setLoadingMouvements] = useState(false)
  
  // Menu
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Devise du budget (déterminée par la première ligne)
  const budgetCurrency: Currency = budgets.length > 0 ? budgets[0].currency : 'CDF'
  const hasBudget = budgets.length > 0

  // Chargement initial
  useEffect(() => {
    loadCommission()
    loadAnneesConference()
  }, [commissionId])

  useEffect(() => {
    if (selectedAnneeConference) {
      loadBudgets()
      loadPlansAction()
      loadRealiseTotals()
    }
  }, [selectedAnneeConference, filterType])

  // Charger la configuration quand l'unité est disponible
  useEffect(() => {
    if (uniteId) {
      loadConfiguration()
    }
  }, [uniteId])

  async function loadConfiguration() {
    if (!uniteId) return
    try {
      const config = await getConfiguration(uniteId)
      if (config) {
        setConfigTaux(config.taux)
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  async function loadCommission() {
    try {
      const { data, error } = await supabase
        .from('commission')
        .select(`
          id,
          nom,
          description,
          departement_id,
          paroisse_id,
          departement:departement_id (id, nom),
          paroisse:paroisse_id (id, nom)
        `)
        .eq('id', commissionId)
        .single()

      if (error) throw error

      const departement = Array.isArray(data.departement) ? data.departement[0] : data.departement
      const paroisse = Array.isArray(data.paroisse) ? data.paroisse[0] : data.paroisse

      setCommission({
        ...data,
        departement,
        paroisse
      })

      // Récupérer l'unité de la commission
      const unite = await getCommissionUnite(commissionId, data.paroisse_id)
      if (unite) {
        setUniteId(unite.id)
      }
    } catch (error) {
      console.error('Erreur chargement commission:', error)
      toast.error('Erreur lors du chargement de la commission')
    }
  }

  async function loadAnneesConference() {
    try {
      const annees = await getAnneesConferenceForCommission(commissionId)
      setAnneesConference(annees)
      
      const current = annees.find(a => a.is_current) || annees[0]
      if (current) {
        setSelectedAnneeConference(current)
        setFormData(prev => ({ ...prev, annee_conference_id: current.id }))
      }
    } catch (error) {
      console.error('Erreur chargement années:', error)
    }
  }

  async function loadPlansAction() {
    if (!selectedAnneeConference) return
    
    try {
      const plans = await getPlansActionForCommissionBudget(commissionId, selectedAnneeConference.id)
      setPlansAction(plans)
    } catch (error) {
      console.error('Erreur chargement plans:', error)
    }
  }

  async function loadBudgets() {
    if (!selectedAnneeConference) return
    
    setLoading(true)
    try {
      const type = filterType === 'all' ? undefined : filterType
      const data = await getBudgetsByCommission(commissionId, selectedAnneeConference.id, type)
      setBudgets(data)
      
      const summaryData = await getBudgetSummaryForCommission(commissionId, selectedAnneeConference.id)
      setSummary(summaryData)
    } catch (error) {
      console.error('Erreur chargement budgets:', error)
      toast.error('Erreur lors du chargement du budget')
    } finally {
      setLoading(false)
    }
  }

  async function loadRealiseTotals() {
    if (!selectedAnneeConference) return
    try {
      const totals = await getRealiseTotalsForCommission(commissionId, selectedAnneeConference.id)
      setRealiseTotals(totals)
    } catch (error) {
      console.error('Erreur chargement totaux réalisés:', error)
    }
  }

  async function loadMouvementsForBudget(budgetId: number) {
    setLoadingMouvements(true)
    try {
      const data = await getMouvementsByBudget(budgetId)
      setMouvements(data)
      
      const summaryData = await getBudgetMouvementSummary(budgetId)
      setMouvementSummary(summaryData)
    } catch (error) {
      console.error('Erreur chargement mouvements:', error)
    } finally {
      setLoadingMouvements(false)
    }
  }

  const filteredBudgets = budgets.filter(budget =>
    budget.libelle.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const recettes = budgets.filter(b => b.type === 'recette')
  const depenses = budgets.filter(b => b.type === 'depense')

  // Convertir un montant en CDF selon le taux de configuration
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }

  // Formater avec équivalent CDF si devise différente
  const formatWithCDF = (montant: number, currency: Currency) => {
    const formatted = formatCurrency(montant, currency)
    if (currency !== 'CDF') {
      const cdfAmount = convertToCDF(montant, currency)
      return `${formatted} (${formatCurrency(cdfAmount, 'CDF')})`
    }
    return formatted
  }

  // Calculer les totaux prévus en CDF
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

  function openCreateModal() {
    setEditingBudget(null)
    setFormData({
      libelle: '',
      type: 'depense',
      montant: '',
      currency: hasBudget ? budgetCurrency : 'USD',
      plan_action_id: '',
      annee_conference_id: selectedAnneeConference?.id || 0
    })
    setShowModal(true)
  }

  function openEditModal(budget: BudgetLineCommission) {
    setEditingBudget(budget)
    setFormData({
      libelle: budget.libelle,
      type: budget.type,
      montant: budget.montant.toString(),
      currency: budget.currency,
      plan_action_id: budget.plan_action_id?.toString() || '',
      annee_conference_id: budget.annee_conference_id
    })
    setShowModal(true)
    setMenuOpen(null)
  }

  function openMouvementModal(budget: BudgetLineCommission) {
    setSelectedBudget(budget)
    setMouvementFormData({
      montant: '',
      currency: 'USD' as Currency,
      date_mouvement: new Date().toISOString().split('T')[0],
      description: ''
    })
    setShowMouvementModal(true)
    setMenuOpen(null)
  }

  async function openDetailsModal(budget: BudgetLineCommission) {
    setDetailsBudget(budget)
    setShowDetailsModal(true)
    setMenuOpen(null)
    await loadMouvementsForBudget(budget.id)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    
    const montant = parseFloat(formData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      setIsSubmitting(false)
      return
    }
    
    const formDataObj = new FormData()
    formDataObj.append('commission_id', commissionId.toString())
    formDataObj.append('libelle', formData.libelle)
    formDataObj.append('type', formData.type)
    formDataObj.append('montant', montant.toString())
    formDataObj.append('currency', formData.currency)
    formDataObj.append('annee_conference_id', formData.annee_conference_id.toString())
    
    if (formData.plan_action_id) {
      formDataObj.append('plan_action_id', formData.plan_action_id)
    }
    
    if (editingBudget) {
      formDataObj.append('id', editingBudget.id.toString())
      const result = await updateBudgetForCommission(formDataObj)
      if (result.success) {
        toast.success('Ligne budgétaire modifiée')
        setShowModal(false)
        loadBudgets()
        loadRealiseTotals()
      } else {
        toast.error(result.error || 'Erreur lors de la modification')
      }
    } else {
      const result = await createBudgetForCommission(formDataObj)
      if (result.success) {
        toast.success('Ligne budgétaire créée')
        setShowModal(false)
        loadBudgets()
        loadRealiseTotals()
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    }
    
    setIsSubmitting(false)
  }

  async function handleSubmitMouvement(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedBudget) return
    
    setIsSubmittingMouvement(true)
    
    const montant = parseFloat(mouvementFormData.montant)
    if (isNaN(montant) || montant <= 0) {
      toast.error('Le montant doit être supérieur à 0')
      setIsSubmittingMouvement(false)
      return
    }
    
    const formDataObj = new FormData()
    formDataObj.append('budget_id', selectedBudget.id.toString())
    formDataObj.append('type', selectedBudget.type)
    formDataObj.append('montant', montant.toString())
    formDataObj.append('currency', mouvementFormData.currency)
    formDataObj.append('date_mouvement', mouvementFormData.date_mouvement)
    formDataObj.append('description', mouvementFormData.description)
    
    const result = await createMouvementFinance(formDataObj)
    
    if (result.success) {
      toast.success('Mouvement enregistré')
      setShowMouvementModal(false)
      loadBudgets()
      loadRealiseTotals()
      
      if (showDetailsModal && detailsBudget?.id === selectedBudget.id) {
        await loadMouvementsForBudget(selectedBudget.id)
      }
    } else {
      toast.error(result.error || 'Erreur lors de l\'enregistrement')
    }
    
    setIsSubmittingMouvement(false)
  }

  async function handleDelete(budget: BudgetLineCommission) {
    if (!confirm(`Supprimer la ligne "${budget.libelle}" ?`)) return
    
    setActionLoading(budget.id)
    const result = await deleteBudgetForCommission(budget.id, commissionId)
    
    if (result.success) {
      toast.success('Ligne supprimée')
      loadBudgets()
      loadRealiseTotals()
      if (showDetailsModal) setShowDetailsModal(false)
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  async function handleDeleteMouvement(mouvementId: number) {
    if (!confirm('Supprimer ce mouvement ?')) return
    
    const result = await deleteMouvementFinance(mouvementId)
    
    if (result.success) {
      toast.success('Mouvement supprimé')
      if (detailsBudget) {
        await loadMouvementsForBudget(detailsBudget.id)
      }
      loadBudgets()
      loadRealiseTotals()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  if (!commission) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={`/paroisse/commissions/${commissionId}`}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">{commission.nom}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Budget</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{commission.departement?.nom}</span>
          <span>•</span>
          <span>{commission.paroisse?.nom}</span>
        </div>
      </div>

       <div className="flex gap-6 mb-6 border-b border-gray-200">
            <Link
              href={`/paroisse/commissions/${commissionId}`}
              className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
            >
              Membres
            </Link>
            <Link
              href={`/paroisse/commissions/${commissionId}/activites`}
              className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
            >
              Activités
            </Link>
            <Link
              href={`/paroisse/commissions/${commissionId}/plans-action`}
              className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
            >
              Plans d&apos;action
            </Link>
            <Link
              href={`/paroisse/commissions/${commissionId}/budget`}
              className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
            >
              Budget
            </Link>
            <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
              Projets
            </span>
          </div>

      {/* Taux de configuration */}
      {!configLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-sm">
          <span className="text-blue-700">
            💱 Taux de conversion : 1 USD = {formatCurrency(configTaux, 'CDF')}
          </span>
        </div>
      )}

      {/* STATISTIQUES - VUE D'ENSEMBLE EN CDF */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Carte Recettes */}
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

        {/* Carte Dépenses */}
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

      {/* Barre d'outils */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select
            value={selectedAnneeConference?.id || ''}
            onChange={(e) => {
              const ac = anneesConference.find(a => a.id === parseInt(e.target.value))
              if (ac) {
                setSelectedAnneeConference(ac)
                setFormData(prev => ({ ...prev, annee_conference_id: ac.id }))
              }
            }}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            {anneesConference.map(annee => (
              <option key={annee.id} value={annee.id}>
                {annee.label} {annee.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>

          <div className="flex border border-gray-300 overflow-hidden">
            {['all', 'recette', 'depense'].map(f => (
              <button
                key={f}
                onClick={() => setFilterType(f as 'all' | 'recette' | 'depense')}
                className={`px-3 py-2 text-sm ${
                  filterType === f 
                    ? (f === 'recette' ? 'bg-green-600 text-white' : f === 'depense' ? 'bg-red-600 text-white' : 'bg-black text-white') 
                    : 'bg-white hover:bg-gray-50'
                } ${f !== 'all' ? 'border-l border-gray-300' : ''}`}
              >
                {f === 'all' ? 'Tous' : f === 'recette' ? 'Recettes' : 'Dépenses'}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
        >
          <Plus size={16} />
          Nouvelle ligne
        </button>
      </div>

      {/* Liste des budgets */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="border border-gray-200 py-16 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune ligne budgétaire pour cette période</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Créer une ligne
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Recettes */}
          {recettes.length > 0 && (filterType === 'all' || filterType === 'recette') && (
            <div>
              <h2 className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                <TrendingUp size={16} />
                Recettes
              </h2>
              <div className="space-y-2">
                {recettes.filter(b => filteredBudgets.includes(b)).map(budget => (
                  <BudgetRow
                    key={budget.id}
                    budget={budget}
                    plansAction={plansAction}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    actionLoading={actionLoading}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onAddMouvement={openMouvementModal}
                    onViewDetails={openDetailsModal}
                    formatWithCDF={formatWithCDF}
                    configTaux={configTaux}
                    budgetCurrency={budgetCurrency}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dépenses */}
          {depenses.length > 0 && (filterType === 'all' || filterType === 'depense') && (
            <div>
              <h2 className="text-sm font-medium text-red-600 mb-2 flex items-center gap-2">
                <TrendingDown size={16} />
                Dépenses
              </h2>
              <div className="space-y-2">
                {depenses.filter(b => filteredBudgets.includes(b)).map(budget => (
                  <BudgetRow
                    key={budget.id}
                    budget={budget}
                    plansAction={plansAction}
                    menuOpen={menuOpen}
                    setMenuOpen={setMenuOpen}
                    actionLoading={actionLoading}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onAddMouvement={openMouvementModal}
                    onViewDetails={openDetailsModal}
                    formatWithCDF={formatWithCDF}
                    configTaux={configTaux}
                    budgetCurrency={budgetCurrency}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal création/édition budget */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                {editingBudget ? 'Modifier la ligne' : 'Nouvelle ligne budgétaire'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {!editingBudget && hasBudget && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                  ⚠️ Le budget est en {budgetCurrency}. Toutes les lignes doivent utiliser cette devise.
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'recette' | 'depense' })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                >
                  <option value="recette">Recette</option>
                  <option value="depense">Dépense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Libellé *</label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                  placeholder="Ex: Dîmes et offrandes"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                  {formData.montant && formData.currency !== 'CDF' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {formatCurrency(parseFloat(formData.montant) * configTaux, 'CDF')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Devise *</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    required
                    disabled={!editingBudget && hasBudget}
                  >
                    {Object.keys(CURRENCIES).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Plan d&apos;action (optionnel)</label>
                <select
                  value={formData.plan_action_id}
                  onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                >
                  <option value="">Aucun</option>
                  {plansAction.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.titre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Année conférence *</label>
                <select
                  value={formData.annee_conference_id}
                  onChange={(e) => setFormData({ ...formData, annee_conference_id: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                  disabled={!!editingBudget}
                >
                  <option value="">Sélectionner une année</option>
                  {anneesConference.map(annee => (
                    <option key={annee.id} value={annee.id}>
                      {annee.label} {annee.is_current ? '(en cours)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </form>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : editingBudget ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout mouvement */}
      {showMouvementModal && selectedBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                {selectedBudget.type === 'recette' ? 'Recette' : 'Dépense'} - {selectedBudget.libelle}
              </h3>
              <button onClick={() => setShowMouvementModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitMouvement} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-gray-50 p-3 text-sm">
                <div>Budget prévu : <span className="font-medium">{formatCurrency(selectedBudget.montant, selectedBudget.currency)}</span></div>
                <div className="text-xs text-gray-500 mt-1">
                  ≈ {formatCurrency(convertToCDF(selectedBudget.montant, selectedBudget.currency), 'CDF')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Montant *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={mouvementFormData.montant}
                    onChange={(e) => setMouvementFormData({ ...mouvementFormData, montant: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    required
                    autoFocus
                  />
                  {mouvementFormData.montant && mouvementFormData.currency !== 'CDF' && (
                    <p className="text-xs text-gray-500 mt-1">
                      ≈ {formatCurrency(parseFloat(mouvementFormData.montant) * configTaux, 'CDF')}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Devise</label>
                  <select
                    value={mouvementFormData.currency}
                    onChange={(e) => setMouvementFormData({ ...mouvementFormData, currency: e.target.value as Currency })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CDF">CDF (FC)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Date *</label>
                <input
                  type="date"
                  value={mouvementFormData.date_mouvement}
                  onChange={(e) => setMouvementFormData({ ...mouvementFormData, date_mouvement: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Description (optionnelle)</label>
                <textarea
                  value={mouvementFormData.description}
                  onChange={(e) => setMouvementFormData({ ...mouvementFormData, description: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  rows={2}
                  placeholder="Description du mouvement..."
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700">
                💡 Le mouvement sera enregistré en {mouvementFormData.currency}. 
                L'équivalent en CDF sera calculé automatiquement pour les statistiques.
              </div>
            </form>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowMouvementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmitMouvement}
                disabled={isSubmittingMouvement}
                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmittingMouvement ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détails budget (mouvements) */}
      {showDetailsModal && detailsBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-light">{detailsBudget.libelle}</h3>
                <p className="text-sm text-gray-500">
                  Budget : {formatWithCDF(detailsBudget.montant, detailsBudget.currency)}
                </p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Résumé mouvements */}
              {mouvementSummary && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {(mouvementSummary.totalParDevise || []).map((devise: any) => (
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
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total en CDF :</span>
                      <span className="font-medium">{formatCurrency(mouvementSummary.totalCDF, 'CDF')}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-sm text-gray-600">Reste :</span>
                      <span className={`font-medium ${mouvementSummary.resteCDF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(mouvementSummary.resteCDF, 'CDF')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">{mouvementSummary.nombreMouvements} mouvement(s)</div>
                </div>
              )}

              {/* Liste des mouvements */}
              {loadingMouvements ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
              ) : mouvements.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <History size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Aucun mouvement enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mouvements.map(mouvement => (
                    <div key={mouvement.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 hover:border-gray-300">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {formatCurrency(mouvement.montant, mouvement.currency)}
                          </span>
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5">{mouvement.currency}</span>
                        </div>
                        {mouvement.currency !== 'CDF' && (
                          <div className="text-xs text-gray-400 mt-0.5">
                            ≈ {formatCurrency(convertToCDF(mouvement.montant, mouvement.currency), 'CDF')}
                          </div>
                        )}
                        <span className="text-xs text-gray-400 block mt-1">
                          {new Date(mouvement.date_mouvement).toLocaleDateString('fr-FR')}
                        </span>
                        {mouvement.description && (
                          <p className="text-sm text-gray-500 mt-1">{mouvement.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMouvement(mouvement.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false)
                  openMouvementModal(detailsBudget)
                }}
                className="w-full px-4 py-2 bg-black text-white hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <Plus size={16} />
                Ajouter un mouvement
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}

// Composant ligne de budget avec progression
function BudgetRow({ 
  budget, 
  plansAction, 
  menuOpen, 
  setMenuOpen, 
  actionLoading, 
  onEdit, 
  onDelete, 
  onAddMouvement, 
  onViewDetails,
  formatWithCDF,
  configTaux,
  budgetCurrency
}: {
  budget: BudgetLineCommission
  plansAction: PlanActionSimple[]
  menuOpen: number | null
  setMenuOpen: (id: number | null) => void
  actionLoading: number | null
  onEdit: (budget: BudgetLineCommission) => void
  onDelete: (budget: BudgetLineCommission) => void
  onAddMouvement: (budget: BudgetLineCommission) => void
  onViewDetails: (budget: BudgetLineCommission) => void
  formatWithCDF: (montant: number, currency: Currency) => string
  configTaux: number
  budgetCurrency: Currency
}) {
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const planAssocie = plansAction.find(p => p.id === budget.plan_action_id)
  const isRecette = budget.type === 'recette'
  
  useEffect(() => {
    loadMouvementSummary()
  }, [budget.id])
  
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

  return (
    <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{budget.libelle}</h3>
            <span className={`text-xs px-2 py-0.5 border ${isRecette ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isRecette ? 'Recette' : 'Dépense'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className={isRecette ? 'text-green-500' : 'text-red-500'} />
              <span className="text-lg font-light">
                {formatWithCDF(budget.montant, budget.currency)}
              </span>
            </div>
            {planAssocie && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <FileText size={12} />
                <span>{planAssocie.titre}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={12} />
              <span>Créé le {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          {/* Détail des mouvements par devise */}
          {mouvementSummary && mouvementsParDevise.length > 0 && (
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
          
          {/* Barre de progression */}
          {mouvementSummary && (
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddMouvement(budget)}
            className={`p-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isRecette ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
            title={isRecette ? 'Enregistrer une recette' : 'Enregistrer une dépense'}
          >
            {isRecette ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
          
          <button
            onClick={() => onViewDetails(budget)}
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Voir les détails"
          >
            <Receipt size={16} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setMenuOpen(menuOpen === budget.id ? null : budget.id)}
              className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </button>
            
            {menuOpen === budget.id && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[150px]">
                <button
                  onClick={() => onEdit(budget)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Edit size={14} /> Modifier
                </button>
                <button
                  onClick={() => onDelete(budget)}
                  disabled={actionLoading === budget.id}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  {actionLoading === budget.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}