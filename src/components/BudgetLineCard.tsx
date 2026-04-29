// components/cards/BudgetLineCard.tsx
'use client'

import { useState } from 'react'
import { deleteBudget, updateBudget } from '@/actions/budget'

interface BudgetLineCardProps {
  budget: {
    id: number
    type: 'recette' | 'depense'
    libelle: string
    montant: number
    plan_action?: {
      id: number
      titre: string
    } | null
  }
  canEdit?: boolean
  onDelete?: () => void
  onUpdate?: () => void
}

export default function BudgetLineCard({ budget, canEdit = false, onDelete, onUpdate }: BudgetLineCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [libelle, setLibelle] = useState(budget.libelle)
  const [montant, setMontant] = useState(budget.montant.toString())
  const [showConfirm, setShowConfirm] = useState(false)

  const isRecette = budget.type === 'recette'
  const formattedMontant = budget.montant.toLocaleString('fr-FR')

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteBudget(budget.id)
      if (result.success) {
        onDelete?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const handleUpdate = async () => {
    const montantNum = parseFloat(montant)
    if (isNaN(montantNum) || montantNum <= 0) {
      alert('Le montant doit être supérieur à 0')
      return
    }

    setIsDeleting(true)
    try {
      const form = new FormData()
      form.append('id', budget.id.toString())
      form.append('libelle', libelle)
      form.append('montant', montantNum.toString())
      
      const result = await updateBudget(form)
      if (result.success) {
        setIsEditing(false)
        onUpdate?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="space-y-3">
          <input
            type="text"
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Libellé"
          />
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">FC</span>
              <input
                type="number"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Montant"
              />
            </div>
            <button
              onClick={handleUpdate}
              disabled={isDeleting}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Sauvegarder
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setLibelle(budget.libelle)
                setMontant(budget.montant.toString())
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${isRecette ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2 h-2 rounded-full ${isRecette ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium text-gray-900 truncate">{budget.libelle}</span>
        </div>
        {budget.plan_action && (
          <p className="text-xs text-gray-500 truncate">
            Plan: {budget.plan_action.titre}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-base font-semibold ${isRecette ? 'text-green-600' : 'text-red-600'}`}>
          {formattedMontant} FC
        </span>
        {canEdit && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Modifier"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            {showConfirm ? (
              <div className="flex items-center gap-1 ml-2">
                <span className="text-xs text-gray-500">Confirmer ?</span>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-red-600 hover:text-red-700 text-xs"
                >
                  Oui
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="p-1 text-gray-500 hover:text-gray-700 text-xs"
                >
                  Non
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}