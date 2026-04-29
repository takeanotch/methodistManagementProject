// components/MouvementList.tsx
'use client'

import { useState, useEffect } from 'react'
import { getMouvementsByBudget, deleteMouvementFinance, getBudgetMouvementSummary, type MouvementFinance } from '@/actions/finance'
import { formatCurrency } from '@/lib/currency'

interface MouvementListProps {
    budgetId: number
    budgetPrevu?: number
    budgetCurrency?: string
    onRefresh?: () => void
}

export function MouvementList({ budgetId, budgetPrevu, budgetCurrency, onRefresh }: MouvementListProps) {
    const [mouvements, setMouvements] = useState<MouvementFinance[]>([])
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadMouvements()
    }, [budgetId])

    async function loadMouvements() {
        setLoading(true)
        const [mouvementsData, summaryData] = await Promise.all([
            getMouvementsByBudget(budgetId),
            getBudgetMouvementSummary(budgetId)
        ])
        setMouvements(mouvementsData)
        setSummary(summaryData)
        setLoading(false)
    }

    async function handleDelete(id: number) {
        if (confirm('Supprimer ce mouvement ? Cette action est irréversible.')) {
            const result = await deleteMouvementFinance(id)
            if (result.success) {
                await loadMouvements()
                onRefresh?.()
            } else {
                alert(result.error)
            }
        }
    }

    if (loading) {
        return (
            <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 mt-2">Chargement des mouvements...</p>
            </div>
        )
    }

    if (mouvements.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">Aucun mouvement enregistré</p>
                <p className="text-xs text-gray-400 mt-1">Cliquez sur +💰 pour ajouter un mouvement</p>
            </div>
        )
    }

    const prevuMontant = summary?.prevu || budgetPrevu || 0
    const prevuCurrency = summary?.prevuCurrency || budgetCurrency || 'USD'
    const reste = summary?.reste || (prevuMontant - mouvements.reduce((sum, m) => sum + m.montant, 0))

    return (
        <div className="space-y-4">
            {/* Résumé */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-green-600 font-medium">Prévu</div>
                    <div className="text-sm font-bold text-green-700">
                        {formatCurrency(prevuMontant, prevuCurrency as any)}
                    </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-blue-600 font-medium">Réalisé</div>
                    <div className="text-sm font-bold text-blue-700">
                        {formatCurrency(mouvements.reduce((sum, m) => sum + m.montant, 0), prevuCurrency as any)}
                    </div>
                </div>
                <div className={`rounded-lg p-3 text-center ${reste >= 0 ? 'bg-orange-50' : 'bg-red-50'}`}>
                    <div className={`text-xs font-medium ${reste >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                        {reste >= 0 ? 'Reste' : 'Dépassement'}
                    </div>
                    <div className={`text-sm font-bold ${reste >= 0 ? 'text-orange-700' : 'text-red-700'}`}>
                        {formatCurrency(Math.abs(reste), prevuCurrency as any)}
                        {reste < 0 && ' 🔴'}
                    </div>
                </div>
            </div>

            {/* Liste des mouvements */}
            <div className="space-y-2 max-h-80 overflow-y-auto">
                {mouvements.map(m => (
                    <div key={m.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    m.type === 'recette' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {m.type === 'recette' ? 'Recette' : 'Dépense'}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {new Date(m.date_mouvement).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                            </div>
                            {m.description && (
                                <div className="text-sm text-gray-600 mt-1">{m.description}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className={`font-semibold ${m.type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                                {m.type === 'recette' ? '+' : '-'} {formatCurrency(m.montant, m.currency)}
                            </span>
                            <button
                                onClick={() => handleDelete(m.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                                title="Supprimer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}