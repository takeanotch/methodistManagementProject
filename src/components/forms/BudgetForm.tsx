

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  createBudget, 
  updateBudget, 
  getPlansActionForBudget, 
  getAnneesConferenceForUniteBudget,
 type BudgetLine
} from '@/actions/budget'
import { CURRENCIES, type Currency } from '@/lib/currency'
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

interface BudgetFormProps {
  uniteId: number
  departementId: number
  budget?: {
    id: number
    type: 'recette' | 'depense'
    libelle: string
    montant: number
    currency: Currency
    annee_conference_id: number
    plan_action_id: number | null
  } | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function BudgetForm({ uniteId, departementId, budget, onSuccess, onCancel }: BudgetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<PlanAction[]>([])
  const [annees, setAnnees] = useState<AnneeConference[]>([])
  const [formData, setFormData] = useState({
    type: budget?.type || 'depense',
    libelle: budget?.libelle || '',
    montant: budget?.montant?.toString() || '',
    currency: budget?.currency || 'CDF',
    annee_conference_id: budget?.annee_conference_id?.toString() || '',
    plan_action_id: budget?.plan_action_id?.toString() || ''
  })

  const isEditing = !!budget

  useEffect(() => {
    async function loadData() {
      const anneesData = await getAnneesConferenceForUniteBudget(uniteId)
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
        const plansData = await getPlansActionForBudget(uniteId, parseInt(formData.annee_conference_id))
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

    const montantNum = parseFloat(formData.montant)
    if (isNaN(montantNum) || montantNum <= 0) {
      setError('Le montant doit être supérieur à 0')
      setLoading(false)
      return
    }

    const form = new FormData()
    form.append('unite_id', uniteId.toString())
    form.append('type', formData.type)
    form.append('libelle', formData.libelle)
    form.append('montant', montantNum.toString())
    form.append('currency', formData.currency)
    form.append('annee_conference_id', formData.annee_conference_id)
    if (formData.plan_action_id) {
      form.append('plan_action_id', formData.plan_action_id)
    }

    let result
    if (isEditing && budget) {
      form.append('id', budget.id.toString())
      result = await updateBudget(form)
    } else {
      result = await createBudget(form)
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="depense"
              checked={formData.type === 'depense'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'recette' | 'depense' })}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Dépense</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="recette"
              checked={formData.type === 'recette'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as 'recette' | 'depense' })}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-gray-700">Recette</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Libellé <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.libelle}
          onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="Ex: Achat de matériel, Dons, etc."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Montant <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              step="100"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="0"
              required
            />
          </div>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {Object.entries(CURRENCIES).map(([code, { symbol, label }]) => (
              <option key={code} value={code}>
                {symbol} - {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Année <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.annee_conference_id}
          onChange={(e) => setFormData({ ...formData, annee_conference_id: e.target.value, plan_action_id: '' })}
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Plan d'action (optionnel)
        </label>
        <select
          value={formData.plan_action_id}
          onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-100"
          disabled={!formData.annee_conference_id}
        >
          <option value="">Aucun plan d'action</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.titre}
            </option>
          ))}
        </select>
        {!formData.annee_conference_id && (
          <p className="text-xs text-amber-600 mt-1">Sélectionnez d'abord une année</p>
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
          {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}