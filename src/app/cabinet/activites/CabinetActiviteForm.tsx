// components/forms/CabinetActiviteForm.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createActivite, updateActivite, getPlansActionForUnite, getAnneesConferenceForUnite } from '@/actions/activite'
import { Loader2 } from 'lucide-react'

interface PlanAction {
  id: number
  titre: string
  annee_conference_id: number
}

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

interface CabinetActiviteFormProps {
  uniteId: number
  activite?: {
    id: number
    titre: string
    description: string | null
    date: string
    heure: string
    statut: string
    annee_conference_id: number
    plan_action_id: number | null
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

const STATUTS = [
  { value: 'planifie', label: 'Planifiée' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminée' },
  { value: 'annule', label: 'Annulée' }
]

export function CabinetActiviteForm({ uniteId, activite, onSuccess, onCancel }: CabinetActiviteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<PlanAction[]>([])
  const [annees, setAnnees] = useState<AnneeConference[]>([])
  const [formData, setFormData] = useState({
    titre: activite?.titre || '',
    description: activite?.description || '',
    date: activite?.date ? new Date(activite.date).toISOString().split('T')[0] : '',
    heure: activite?.heure || '',
    annee_conference_id: activite?.annee_conference_id?.toString() || '',
    plan_action_id: activite?.plan_action_id?.toString() || '',
    statut: activite?.statut || 'planifie'
  })

  const isEditing = !!activite

  useEffect(() => {
    async function loadData() {
      const anneesData = await getAnneesConferenceForUnite(uniteId)
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
    loadData()
  }, [uniteId, isEditing])

  useEffect(() => {
    async function loadPlans() {
      if (formData.annee_conference_id) {
        const plansData = await getPlansActionForUnite(uniteId, parseInt(formData.annee_conference_id))
        setPlans(plansData)
      } else {
        setPlans([])
      }
    }
    loadPlans()
  }, [uniteId, formData.annee_conference_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.annee_conference_id) {
      setError('Veuillez sélectionner une année')
      setLoading(false)
      return
    }

    const form = new FormData()
    form.append('unite_id', uniteId.toString())
    form.append('titre', formData.titre)
    form.append('description', formData.description)
    form.append('date', formData.date)
    form.append('heure', formData.heure)
    form.append('statut', formData.statut)
    form.append('annee_conference_id', formData.annee_conference_id)
    if (formData.plan_action_id) {
      form.append('plan_action_id', formData.plan_action_id)
    }

    let result
    if (isEditing && activite) {
      form.append('id', activite.id.toString())
      result = await updateActivite(form)
    } else {
      result = await createActivite(form)
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titre */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Titre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
          placeholder="Ex: Réunion du cabinet pastoral"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"
          placeholder="Décrivez l'activité du cabinet..."
        />
      </div>

      {/* Date et Heure */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Heure <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            value={formData.heure}
            onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors"
            required
          />
        </div>
      </div>

      {/* Année */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Année de conférence <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.annee_conference_id}
          onChange={(e) => setFormData({ ...formData, annee_conference_id: e.target.value, plan_action_id: '' })}
          className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-500"
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
          <p className="text-xs text-gray-400 mt-1">L'année ne peut pas être modifiée après création</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Plan d'action */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Plan d'action
            <span className="text-gray-400 font-normal lowercase tracking-normal ml-1">(optionnel)</span>
          </label>
          <select
            value={formData.plan_action_id}
            onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-500"
            disabled={!formData.annee_conference_id}
          >
            <option value="">Aucun plan d'action</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.titre}
              </option>
            ))}
          </select>
          {!formData.annee_conference_id && plans.length === 0 && (
            <p className="text-xs text-gray-400 mt-1">Sélectionnez d'abord une année</p>
          )}
        </div>

        {/* Statut */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
            Statut
          </label>
          <select
            value={formData.statut}
            onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors bg-white"
          >
            {STATUTS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-3 border border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 hover:border-black transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer l\'activité'}
        </button>
      </div>
    </form>
  )
}