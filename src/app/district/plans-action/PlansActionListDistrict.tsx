// components/district/PlansActionListDistrict.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPlanActionForDistrict, deletePlanActionDistrict } from '@/actions/plan-action-district'

interface PlanAction {
  id: number
  titre: string
  description: string | null
  annee_conference_id: number
  created_at: string
}

interface PlansActionListDistrictProps {
  uniteId: number
  districtId: number
  departementId: number
  plansAction: PlanAction[]
  anneeConferenceId: number | null
  anneeEnCours: any | null
  anneesDisponibles: any[]
}

export function PlansActionListDistrict({
  uniteId,
  districtId,
  departementId,
  plansAction,
  anneeConferenceId,
  anneeEnCours,
  anneesDisponibles
}: PlansActionListDistrictProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnneeChange = (newAnneeConfId: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('annee_conference', newAnneeConfId.toString())
    router.push(`/district/plans-action?${params.toString()}`)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce plan d\'action ?')) {
      const result = await deletePlanActionDistrict(id)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titre.trim()) {
      setError('Le titre est requis')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createPlanActionForDistrict(titre, description || null)
    
    if (result.success) {
      setTitre('')
      setDescription('')
      setShowForm(false)
      router.refresh()
    } else {
      setError(result.error || 'Une erreur est survenue')
    }
    
    setLoading(false)
  }

  const anneeSelectionnee = anneesDisponibles?.find(a => a.id === anneeConferenceId)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Plans d'action</h1>
            <p className="text-sm text-gray-500 mt-1">District</p>
          </div>
          <Link
            href="/district"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round"strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>
      </div>

      {/* Sélecteur d'année */}
      {anneesDisponibles && anneesDisponibles.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 font-medium mb-2">Année de conférence</div>
          <div className="flex gap-2 flex-wrap">
            {anneesDisponibles.map((annee) => (
              <button
                key={annee.id}
                onClick={() => handleAnneeChange(annee.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  anneeConferenceId === annee.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {annee.label}
                {annee.is_current && ' ✓'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Indicateur d'historique */}
      {anneeSelectionnee && anneeConferenceId !== anneeEnCours?.id && (
        <div className="mb-4 text-xs bg-amber-50 text-amber-600 p-2 rounded-lg border border-amber-100">
          📅 Affichage de l'historique pour l'année {anneeSelectionnee.label}
        </div>
      )}

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Nouveau plan d'action</h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Plan d'action pour l'évangélisation"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optionnelle)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Description détaillée du plan d'action..."
              />
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des plans d'action */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Tous les plans d'action</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
              >
                + Nouveau plan
              </button>
            )}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {plansAction.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Aucun plan d'action pour cette année
            </div>
          ) : (
            plansAction.map((plan) => (
              <div key={plan.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link href={`/district/plans-action/${plan.id}`}>
                      <h3 className="text-base font-medium text-gray-900 hover:text-indigo-600">
                        {plan.titre}
                      </h3>
                    </Link>
                    {plan.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/district/plans-action/${plan.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      Voir détails
                    </Link>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}