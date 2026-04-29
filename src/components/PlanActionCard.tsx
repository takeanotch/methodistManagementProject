

// components/PlanActionCard.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

interface PlanActionCardProps {
  plan: {
    id: number
    titre: string
    description: string | null
    created_at: string
    updated_at: string
  }
  departementId: number
  canEdit?: boolean
}

export default function PlanActionCard({ plan, departementId, canEdit }: PlanActionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan d\'action ?')) {
      return
    }

    setIsDeleting(true)
    try {
      // Appeler l'action de suppression
      const { deletePlanActionDepartement } = await import('@/actions/plan-action-departement')
      const result = await deletePlanActionDepartement(plan.id, departementId, 0) // paroisseId sera récupéré côté serveur
      if (result.success) {
        window.location.reload()
      } else {
        alert(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <Link href={`/paroisse/departements/${departementId}/plans-action/${plan.id}`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
              {plan.titre}
            </h3>
            {canEdit && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          {plan.description && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {plan.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Voir détails
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}