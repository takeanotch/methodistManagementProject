
// // components/CreateProjetModalForConference.tsx - Version corrigée
// 'use client'

// import { useState, useEffect } from 'react'
// import { createProjet, getPlansActionForProjet, getBudgetsForProjet, type Projet } from '@/actions/projet'

// interface CreateProjetModalForConferenceProps {
//     isOpen: boolean
//     onClose: () => void
//     uniteId: number
//     conferenceNom: string
//     onSuccess?: (projet: Projet) => void
// }

// export function CreateProjetModalForConference({ 
//     isOpen, 
//     onClose, 
//     uniteId, 
//     conferenceNom, 
//     onSuccess 
// }: CreateProjetModalForConferenceProps) {
//     const [loading, setLoading] = useState(false)
//     const [loadingOptions, setLoadingOptions] = useState(true)
//     const [plansAction, setPlansAction] = useState<{ id: number; titre: string }[]>([])
//     const [budgets, setBudgets] = useState<{ id: number; libelle: string; montant: number; type: string; currency: string }[]>([])
    
//     const [formData, setFormData] = useState({
//         nom: '',
//         description: '',
//         type: 'court_terme' as 'court_terme' | 'moyen_terme' | 'long_terme',
//         date_debut: new Date().toISOString().split('T')[0],
//         date_fin: '',
//         plan_action_id: '',
//         budget_id: ''
//     })

//     useEffect(() => {
//         if (isOpen && uniteId) {
//             loadOptions()
//         }
//     }, [isOpen, uniteId])

//     async function loadOptions() {
//         setLoadingOptions(true)
//         const [plans, budgetsData] = await Promise.all([
//             getPlansActionForProjet(uniteId),
//             getBudgetsForProjet(uniteId)
//         ])
//         setPlansAction(plans)
//         setBudgets(budgetsData)
//         setLoadingOptions(false)
//     }

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault()
        
//         if (!formData.nom.trim()) {
//             alert('Veuillez saisir un nom pour le projet')
//             return
//         }

//         setLoading(true)

//         // Appel avec 2 arguments seulement (comme pour departement)
//         const result = await createProjet(uniteId, {
//             nom: formData.nom,
//             description: formData.description || null,
//             type: formData.type,
//             date_debut: new Date(formData.date_debut),
//             date_fin: formData.date_fin ? new Date(formData.date_fin) : null,
//             plan_action_id: formData.plan_action_id ? parseInt(formData.plan_action_id) : null,
//             budget_id: formData.budget_id ? parseInt(formData.budget_id) : null
//         })

//         if (result.success && result.projet) {
//             onSuccess?.(result.projet)
//             onClose()
//             resetForm()
//         } else {
//             alert(result.error || 'Erreur lors de la création du projet')
//         }

//         setLoading(false)
//     }

//     function resetForm() {
//         setFormData({
//             nom: '',
//             description: '',
//             type: 'court_terme',
//             date_debut: new Date().toISOString().split('T')[0],
//             date_fin: '',
//             plan_action_id: '',
//             budget_id: ''
//         })
//     }

//     if (!isOpen) return null

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//             <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
//                 <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
//                     <div>
//                         <h2 className="text-xl font-semibold text-gray-900">Nouveau projet</h2>
//                         <p className="text-sm text-gray-500 mt-1">Pour la conférence : {conferenceNom}</p>
//                     </div>
//                     <button
//                         onClick={onClose}
//                         className="text-gray-400 hover:text-gray-600 transition-colors"
//                     >
//                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                     </button>
//                 </div>

//                 <form onSubmit={handleSubmit} className="p-6 space-y-5">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Nom du projet <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                             type="text"
//                             value={formData.nom}
//                             onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                             placeholder="Ex: Construction du nouveau bâtiment"
//                             required
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Description
//                         </label>
//                         <textarea
//                             value={formData.description}
//                             onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//                             rows={3}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                             placeholder="Décrivez les objectifs et la portée du projet..."
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Type de projet <span className="text-red-500">*</span>
//                         </label>
//                         <select
//                             value={formData.type}
//                             onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                         >
//                             <option value="court_terme">📋 Court terme (&lt; 3 mois)</option>
//                             <option value="moyen_terme">📊 Moyen terme (3-12 mois)</option>
//                             <option value="long_terme">🎯 Long terme (&gt; 12 mois)</option>
//                         </select>
//                     </div>

//                     <div className="grid grid-cols-2 gap-4">
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                 Date de début
//                             </label>
//                             <input
//                                 type="date"
//                                 value={formData.date_debut}
//                                 onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                             />
//                         </div>
//                         <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-1">
//                                 Date de fin (optionnelle)
//                             </label>
//                             <input
//                                 type="date"
//                                 value={formData.date_fin}
//                                 onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
//                                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                                 min={formData.date_debut}
//                             />
//                         </div>
//                     </div>

//                     {!loadingOptions && (
//                         <>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Plan d'action lié (optionnel)
//                                 </label>
//                                 <select
//                                     value={formData.plan_action_id}
//                                     onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                                 >
//                                     <option value="">Aucun plan d'action</option>
//                                     {plansAction.map(plan => (
//                                         <option key={plan.id} value={plan.id}>
//                                             {plan.titre}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>

//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                                     Budget lié (optionnel)
//                                 </label>
//                                 <select
//                                     value={formData.budget_id}
//                                     onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
//                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
//                                 >
//                                     <option value="">Aucun budget</option>
//                                     {budgets.map(budget => (
//                                         <option key={budget.id} value={budget.id}>
//                                             {budget.libelle} - {budget.type === 'recette' ? '💰' : '💸'} {budget.montant.toLocaleString()} {budget.currency}
//                                         </option>
//                                     ))}
//                                 </select>
//                             </div>
//                         </>
//                     )}

//                     {loadingOptions && (
//                         <div className="text-center py-4">
//                             <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
//                             <p className="text-sm text-gray-500 mt-2">Chargement des options...</p>
//                         </div>
//                     )}

//                     <div className="flex gap-3 pt-4 border-t">
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                         >
//                             Annuler
//                         </button>
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//                         >
//                             {loading ? (
//                                 <span className="flex items-center justify-center gap-2">
//                                     <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                                     Création...
//                                 </span>
//                             ) : (
//                                 'Créer le projet'
//                             )}
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     )
// }