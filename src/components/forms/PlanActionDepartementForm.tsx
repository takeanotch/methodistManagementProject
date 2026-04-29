// components/forms/PlanActionDepartementForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface PlanActionDepartementFormProps {
  departementId: number
  paroisseId: number
  onSuccess?: () => void
  initialData?: {
    id: number
    titre: string
    description?: string | null
  }
}

export default function PlanActionDepartementForm({ 
  departementId,
  paroisseId,
  onSuccess,
  initialData 
}: PlanActionDepartementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [titre, setTitre] = useState(initialData?.titre || '')
  const [description, setDescription] = useState(initialData?.description || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (initialData?.id) {
        // Mode modification
        const { updatePlanActionDepartement } = await import('@/actions/plan-action-departement')
        const result = await updatePlanActionDepartement(
          initialData.id,
          departementId,
          paroisseId,
          titre,
          description
        )
        
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success('Plan d\'action modifié')
          if (onSuccess) {
            onSuccess()
          } else {
            router.push(`/paroisse/departements/${departementId}/plans-action/${initialData.id}`)
            router.refresh()
          }
        }
      } else {
        // Mode création
        const { createPlanActionForDepartement } = await import('@/actions/plan-action-departement')
        const result = await createPlanActionForDepartement(
          departementId,
          paroisseId,
          titre,
          description
        )
        
        if (result.error) {
          toast.error(result.error)
        } else if (result.plan) {
          toast.success('Plan d\'action créé')
          if (onSuccess) {
            onSuccess()
          } else {
            router.push(`/paroisse/departements/${departementId}/plans-action/${result.plan.id}`)
            router.refresh()
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Ex: Plan d'action 2024"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Décrivez les objectifs de ce plan d'action..."
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Enregistrement...' : (initialData ? 'Modifier' : 'Créer')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}