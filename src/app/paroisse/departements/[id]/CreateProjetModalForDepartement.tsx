
// components/CreateProjetModalForDepartement.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
    createProjet, 
    getPlansActionForProjet, 
    getBudgetsForProjet, 
    type Projet 
} from '@/actions/projet'
import { X, Loader2, Target, Calendar, FileText, DollarSign } from 'lucide-react'

interface CreateProjetModalForDepartementProps {
    isOpen: boolean
    onClose: () => void
    uniteId: number
    departementNom: string
    onSuccess?: (projet: Projet) => void
}

export function CreateProjetModalForDepartement({ 
    isOpen, 
    onClose, 
    uniteId, 
    departementNom, 
    onSuccess 
}: CreateProjetModalForDepartementProps) {
    const [loading, setLoading] = useState(false)
    const [loadingOptions, setLoadingOptions] = useState(true)
    const [plansAction, setPlansAction] = useState<{ id: number; titre: string }[]>([])
    const [budgets, setBudgets] = useState<{ id: number; libelle: string; montant: number; type: string; currency: string }[]>([])
    
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        type: 'court_terme' as 'court_terme' | 'moyen_terme' | 'long_terme',
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: '',
        plan_action_id: '',
        budget_id: ''
    })

    useEffect(() => {
        if (isOpen && uniteId) {
            loadOptions()
        }
    }, [isOpen, uniteId])

    async function loadOptions() {
        setLoadingOptions(true)
        const [plans, budgetsData] = await Promise.all([
            getPlansActionForProjet(uniteId),
            getBudgetsForProjet(uniteId)
        ])
        setPlansAction(plans)
        setBudgets(budgetsData)
        setLoadingOptions(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        
        if (!formData.nom.trim()) {
            alert('Veuillez saisir un nom pour le projet')
            return
        }

        setLoading(true)

        const result = await createProjet(uniteId, {
            nom: formData.nom,
            description: formData.description || null,
            type: formData.type,
            date_debut: new Date(formData.date_debut),
            date_fin: formData.date_fin ? new Date(formData.date_fin) : null,
            plan_action_id: formData.plan_action_id ? parseInt(formData.plan_action_id) : null,
            budget_id: formData.budget_id ? parseInt(formData.budget_id) : null
        })

        if (result.success && result.projet) {
            onSuccess?.(result.projet)
            onClose()
            resetForm()
        } else {
            alert(result.error || 'Erreur lors de la création du projet')
        }

        setLoading(false)
    }

    function resetForm() {
        setFormData({
            nom: '',
            description: '',
            type: 'court_terme',
            date_debut: new Date().toISOString().split('T')[0],
            date_fin: '',
            plan_action_id: '',
            budget_id: ''
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                {/* En-tête */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-light">Nouveau projet</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Département : {departementNom}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-black"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Nom du projet */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Nom du projet <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                            placeholder="Ex: Construction du nouveau bâtiment"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                            placeholder="Décrivez les objectifs et la portée du projet..."
                        />
                    </div>

                    {/* Type de projet */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            Type de projet <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                        >
                            <option value="court_terme">Court terme (&lt; 3 mois)</option>
                            <option value="moyen_terme">Moyen terme (3-12 mois)</option>
                            <option value="long_terme">Long terme (&gt; 12 mois)</option>
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Date de début</label>
                            <input
                                type="date"
                                value={formData.date_debut}
                                onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Date de fin (optionnelle)</label>
                            <input
                                type="date"
                                value={formData.date_fin}
                                onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                min={formData.date_debut}
                            />
                        </div>
                    </div>

                    {/* Liens optionnels */}
                    {!loadingOptions ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Plan d&apos;action lié (optionnel)
                                </label>
                                <select
                                    value={formData.plan_action_id}
                                    onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                >
                                    <option value="">Aucun plan d&apos;action</option>
                                    {plansAction.map(plan => (
                                        <option key={plan.id} value={plan.id}>
                                            {plan.titre}
                                        </option>
                                    ))}
                                </select>
                                {plansAction.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">Aucun plan d&apos;action disponible</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Budget lié (optionnel)
                                </label>
                                <select
                                    value={formData.budget_id}
                                    onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                >
                                    <option value="">Aucun budget</option>
                                    {budgets.map(budget => (
                                        <option key={budget.id} value={budget.id}>
                                            {budget.libelle} - {budget.type === 'recette' ? '💰' : '💸'} {budget.montant.toLocaleString()} {budget.currency}
                                        </option>
                                    ))}
                                </select>
                                {budgets.length === 0 && (
                                    <p className="text-xs text-gray-400 mt-1">Aucun budget disponible</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
                            <p className="text-xs text-gray-500 mt-2">Chargement des options...</p>
                        </div>
                    )}
                </form>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Création...
                            </>
                        ) : (
                            'Créer le projet'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}