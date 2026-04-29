// components/forms/ActiviteFormNiveau.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { createActiviteNiveau, updateActiviteNiveau, getAnneesConferenceForUniteNiveau, getPlansActionForUniteNiveau } from '@/actions/activite-niveaux'

interface ActiviteFormNiveauProps {
  uniteId: number
  niveau: 'district' | 'conference'
  niveauId: number
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
  onSuccess: () => void
  onCancel: () => void
}

export function ActiviteFormNiveau({ 
  uniteId, 
  niveau,
  niveauId,
  activite, 
  onSuccess, 
  onCancel 
}: ActiviteFormNiveauProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [annees, setAnnees] = useState<any[]>([])
  const [plansAction, setPlansAction] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const [formData, setFormData] = useState({
    titre: activite?.titre || '',
    description: activite?.description || '',
    date: activite?.date || new Date().toISOString().split('T')[0],
    heure: activite?.heure || '09:00',
    statut: activite?.statut || 'planifie',
    annee_conference_id: activite?.annee_conference_id || '',
    plan_action_id: activite?.plan_action_id || ''
  })

  useEffect(() => {
    loadData()
  }, [uniteId])

  useEffect(() => {
    if (formData.annee_conference_id) {
      loadPlansAction(parseInt(formData.annee_conference_id as string))
    }
  }, [formData.annee_conference_id])

  async function loadData() {
    try {
      const anneesData = await getAnneesConferenceForUniteNiveau(uniteId, niveau)
      setAnnees(anneesData)

      if (!activite) {
        const currentAnnee = anneesData.find(a => a.is_current)
        if (currentAnnee) {
          setFormData(prev => ({ ...prev, annee_conference_id: currentAnnee.id.toString() }))
        } else if (anneesData.length > 0) {
          setFormData(prev => ({ ...prev, annee_conference_id: anneesData[0].id.toString() }))
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
    } finally {
      setLoadingData(false)
    }
  }

  async function loadPlansAction(anneeConferenceId: number) {
    try {
      const plans = await getPlansActionForUniteNiveau(uniteId, anneeConferenceId)
      setPlansAction(plans)
    } catch (error) {
      console.error('Erreur chargement plans d\'action:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formDataObj = new FormData()
      formDataObj.append('unite_id', uniteId.toString())
      formDataObj.append('titre', formData.titre)
      formDataObj.append('description', formData.description)
      formDataObj.append('date', formData.date)
      formDataObj.append('heure', formData.heure)
      formDataObj.append('statut', formData.statut)
      formDataObj.append('annee_conference_id', formData.annee_conference_id.toString())
      
      if (formData.plan_action_id) {
        formDataObj.append('plan_action_id', formData.plan_action_id.toString())
      }

      if (activite) {
        formDataObj.append('id', activite.id.toString())
        const result = await updateActiviteNiveau(formDataObj, niveau)
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
          router.refresh()
        }
      } else {
        const result = await createActiviteNiveau(formDataObj, niveau, niveauId)
        if (result.error) {
          setError(result.error)
        } else {
          onSuccess()
          router.refresh()
        }
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const niveauLabel = niveau === 'district' ? 'District' : 'Conférence'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {loadingData ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black resize-none"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={formData.heure}
                  onChange={(e) => setFormData({ ...formData, heure: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Année de conférence
              </label>
              <select
                value={formData.annee_conference_id}
                onChange={(e) => setFormData({ ...formData, annee_conference_id: e.target.value, plan_action_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
                disabled={loading}
              >
                <option value="">Sélectionner une année</option>
                {annees.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.annee?.label || `Année ${annee.annee_id}`}
                    {annee.is_current ? ' (en cours)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
                disabled={loading}
              >
                <option value="planifie">Planifié</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan d'action (optionnel)
            </label>
            <select
              value={formData.plan_action_id}
              onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black bg-white"
              disabled={loading || !formData.annee_conference_id}
            >
              <option value="">Aucun plan d'action</option>
              {plansAction.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.titre}
                </option>
              ))}
            </select>
            {!formData.annee_conference_id && (
              <p className="text-xs text-gray-400 mt-1">
                Sélectionnez d'abord une année de conférence
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 hover:border-black text-sm"
          disabled={loading}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading || loadingData}
          className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {activite ? 'Modification...' : 'Création...'}
            </>
          ) : (
            activite ? 'Modifier' : 'Créer'
          )}
        </button>
      </div>
    </form>
  )
}