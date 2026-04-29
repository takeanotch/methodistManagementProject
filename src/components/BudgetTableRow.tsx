
// components/BudgetTableRow.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { updateBudget, deleteBudget } from '@/actions/budget'
import { formatCurrency, type Currency } from '@/lib/currency'
import { MouvementModal } from './MouvementModal'
import { MouvementList } from './MouvementList'

interface BudgetTableRowProps {
    budget: {
        id: number
        type: 'recette' | 'depense'
        libelle: string
        montant: number
        currency: Currency
        plan_action_id: number | null
        plan_action?: { id: number; titre: string } | null
    }
    canEdit: boolean
    niveau?: 'paroisse' | 'district' | 'conference'
}

export function BudgetTableRow({ budget, canEdit, niveau = 'paroisse' }: BudgetTableRowProps) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [showMouvements, setShowMouvements] = useState(false)
    const [showMouvementModal, setShowMouvementModal] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [formData, setFormData] = useState({
        libelle: budget.libelle,
        montant: budget.montant.toString(),
        currency: budget.currency
    })

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    const getPlanActionLink = () => {
        if (!budget.plan_action_id) return '#'
        switch (niveau) {
            case 'paroisse':
                return `/paroisse/plans-action/${budget.plan_action_id}`
            case 'district':
                return `/district/plans-action/${budget.plan_action_id}`
            case 'conference':
                return `/conference/plans-action/${budget.plan_action_id}`
            default:
                return '#'
        }
    }

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault()
        const form = new FormData()
        form.append('id', budget.id.toString())
        form.append('libelle', formData.libelle)
        form.append('montant', formData.montant)
        form.append('currency', formData.currency)

        let result
        if (niveau === 'paroisse') {
            const { updateBudget: update } = await import('@/actions/budget')
            result = await update(form)
        } else if (niveau === 'district') {
            const { updateBudgetDistrict } = await import('@/actions/budget-district')
            result = await updateBudgetDistrict(form)
        } else {
            const { updateBudgetConference } = await import('@/actions/budget-conference')
            result = await updateBudgetConference(form)
        }

        if (result.success) {
            setIsEditing(false)
            router.refresh()
        } else {
            alert(result.error)
        }
    }

    async function handleDelete() {
        if (confirm('Supprimer cette ligne budgétaire ? Les mouvements associés seront également supprimés.')) {
            let result
            if (niveau === 'paroisse') {
                const { deleteBudget: del } = await import('@/actions/budget')
                result = await del(budget.id)
            } else if (niveau === 'district') {
                const { deleteBudgetDistrict } = await import('@/actions/budget-district')
                result = await deleteBudgetDistrict(budget.id)
            } else {
                const { deleteBudgetConference } = await import('@/actions/budget-conference')
                result = await deleteBudgetConference(budget.id)
            }

            if (result.success) {
                router.refresh()
            } else {
                alert(result.error)
            }
        }
    }

    if (isEditing) {
        return (
            <tr className="bg-yellow-50">
                <td colSpan={canEdit ? 4 : 3} className="px-4 py-2">
                    <form onSubmit={handleUpdate} className="flex gap-2">
                        <input
                            type="text"
                            value={formData.libelle}
                            onChange={e => setFormData({ ...formData, libelle: e.target.value })}
                            className="flex-1 px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <input
                            type="number"
                            step="0.01"
                            value={formData.montant}
                            onChange={e => setFormData({ ...formData, montant: e.target.value })}
                            className="w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                        <select
                            value={formData.currency}
                            onChange={e => setFormData({ ...formData, currency: e.target.value as Currency })}
                            className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="USD">USD</option>
                            <option value="CDF">CDF</option>
                            <option value="EUR">EUR</option>
                        </select>
                        <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">✓</button>
                        <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">✗</button>
                    </form>
                </td>
            </tr>
        )
    }

    return (
        <>
            <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{budget.libelle}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                    {formatCurrency(budget.montant, budget.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                    {budget.plan_action ? (
                        <Link 
                            href={getPlanActionLink()}
                            className="text-indigo-600 hover:text-indigo-800"
                        >
                            {budget.plan_action.titre}
                        </Link>
                    ) : '-'}
                </td>
                {canEdit && (
                    <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowMouvements(!showMouvements)}
                                className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                title="Voir les mouvements"
                            >
                                📊
                            </button>
                            <button
                                onClick={() => setShowMouvementModal(true)}
                                className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                title="Ajouter un mouvement"
                            >
                                +💰
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-indigo-600 hover:text-indigo-900 text-sm px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                            >
                                Modifier
                            </button>
                            <button
                                onClick={handleDelete}
                                className="text-red-600 hover:text-red-900 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                            >
                                Supprimer
                            </button>
                        </div>
                    </td>
                )}
            </tr>
            {showMouvements && (
                <tr>
                    <td colSpan={canEdit ? 4 : 3} className="px-4 py-3 bg-gray-50">
                        <div className="pl-6 border-l-4 border-blue-200">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-sm font-medium text-gray-700">
                                    📋 Historique des mouvements - {budget.libelle}
                                </h4>
                                <button
                                    onClick={() => setShowMouvements(false)}
                                    className="text-xs text-gray-400 hover:text-gray-600"
                                >
                                    Fermer ✕
                                </button>
                            </div>
                            <MouvementList 
                                budgetId={budget.id} 
                                budgetPrevu={budget.montant}
                                budgetCurrency={budget.currency}
                                onRefresh={() => router.refresh()} 
                            />
                        </div>
                    </td>
                </tr>
            )}
            {mounted && createPortal(
                <MouvementModal
                    isOpen={showMouvementModal}
                    onClose={() => setShowMouvementModal(false)}
                    budgetId={budget.id}
                    budgetType={budget.type}
                    budgetLibelle={budget.libelle}
                    onSuccess={() => {
                        router.refresh()
                        setShowMouvements(true)
                    }}
                />,
                document.body
            )}
        </>
    )
}