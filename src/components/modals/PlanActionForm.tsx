// components/forms/PlanActionForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPlanActionForDepartement, updatePlanActionDepartement } from '@/actions/plan-action-departement'
import { getAnneesConferenceByConference } from '@/actions/annee-conference'
import { getConferenceFromParoisse } from '@/actions/structures'

interface AnneeConference {
  id: number
  annee_id: number
  conference_id: number
  is_current: boolean
  annee?: {
    id: number
    label: string
  }
}

interface PlanActionFormProps {
  departementId: number
  paroisseId: number
  plan?: {
    id: number
    titre: string
    description: string | null
    annee_conference_id: number
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function PlanActionForm({ departementId, paroisseId, plan, onSuccess, onCancel }: PlanActionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [annees, setAnnees] = useState<AnneeConference[]>([])
  const [formData, setFormData] = useState({
    titre: plan?.titre || '',
    description: plan?.description || '',
    annee_conference_id: plan?.annee_conference_id?.toString() || ''
  })

  const isEditing = !!plan

  useEffect(() => {
    async function loadAnnees() {
      const conferenceId = await getConferenceFromParoisse(paroisseId)
      if (conferenceId) {
        const anneesData = await getAnneesConferenceByConference(conferenceId)
        setAnnees(anneesData)
        
        if (!isEditing) {
          const currentAnnee = anneesData.find(a => a.is_current)
          if (currentAnnee) {
            setFormData(prev => ({ ...prev, annee_conference_id: currentAnnee.id.toString() }))
          } else if (anneesData.length > 0) {
            setFormData(prev => ({ ...prev, annee_conference_id: anneesData[0].id.toString() }))
          }
        }
      }
    }
    loadAnnees()
  }, [paroisseId, isEditing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.annee_conference_id) {
      setError('Veuillez sélectionner une année')
      setLoading(false)
      return
    }

    if (!formData.titre.trim()) {
      setError('Le titre est requis')
      setLoading(false)
      return
    }

    let result
    if (isEditing && plan) {
      result = await updatePlanActionDepartement(
        plan.id,
        departementId,
        paroisseId,
        formData.titre,
        formData.description || null
      )
    } else {
      result = await createPlanActionForDepartement(
        departementId,
        paroisseId,
        formData.titre,
        formData.description || null
      )
    }

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      onSuccess?.()
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="Ex: Plan d'action 2024"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="Décrivez les objectifs et le contenu du plan d'action..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Année <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.annee_conference_id}
          onChange={(e) => setFormData({ ...formData, annee_conference_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          required
          disabled={isEditing}
        >
          <option value="">Sélectionner une année</option>
          {annees.map((annee) => (
            <option key={annee.id} value={annee.id}>
              {annee.annee?.label || `Année ${annee.annee_id}`} {annee.is_current ? '(En cours)' : ''}
            </option>
          ))}
        </select>
        {isEditing && (
          <p className="text-xs text-gray-500 mt-1">L'année ne peut pas être modifiée après création</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  )
}