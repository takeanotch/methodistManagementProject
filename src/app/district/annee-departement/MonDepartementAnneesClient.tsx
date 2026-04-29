
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { openNewYearForDepartement, closeYearForDepartement } from '@/actions/annee-district'

interface ChefInfo {
  id: number
  fidele_id: number
  departement_id: number
  district_id: number
  departement_nom: string
  departement_type: string
  district_nom: string
  fidele_nom: string
  fidele_prenom: string
}

interface Annee {
  id: number
  label: string
}

interface AnneeHistoryItem {
  id: number
  annee_id: number
  is_current: boolean
  created_at: string
  annee?: {
    id: number
    label: string
  }
  status?: 'current' | 'past' | 'future'
}

interface Props {
  chefInfo: ChefInfo
  anneesDisponibles: Annee[]
  anneesHistory: AnneeHistoryItem[]
  currentAnnee: AnneeHistoryItem | null
}

export default function MonDepartementAnneesClient({
  chefInfo,
  anneesDisponibles,
  anneesHistory,
  currentAnnee
}: Props) {
  const router = useRouter()
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [closingYear, setClosingYear] = useState<number | null>(null)
  const [settingCurrent, setSettingCurrent] = useState<number | null>(null)

  const typeLabels: Record<string, { label: string; color: string }> = {
    commite: { label: 'Comité', color: 'bg-purple-100 text-purple-700' },
    agence_programme: { label: 'Agence/Programme', color: 'bg-blue-100 text-blue-700' },
    normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' }
  }

  const typeInfo = typeLabels[chefInfo.departement_type] || typeLabels.normal

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return <span className="px-2 py-1 text-xs -full bg-green-100 text-green-700">En cours</span>
      case 'future':
        return <span className="px-2 py-1 text-xs -full bg-blue-100 text-blue-700">À venir</span>
      default:
        return <span className="px-2 py-1 text-xs -full bg-gray-100 text-gray-600">Passée</span>
    }
  }

  const handleOpenYear = async () => {
    if (!selectedAnnee) {
      toast.error('Veuillez sélectionner une année')
      return
    }

    setLoading(true)
    
    try {
      const result = await openNewYearForDepartement(
        chefInfo.district_id,
        chefInfo.departement_id,
        parseInt(selectedAnnee)
      )

      if (result.success) {
        toast.success(result.message || 'Année ouverte avec succès')
        setShowAddModal(false)
        setSelectedAnnee('')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de l\'ouverture de l\'année')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseYear = async () => {
    if (!currentAnnee) {
      toast.error('Aucune année en cours à fermer')
      return
    }

    if (!confirm(`Voulez-vous fermer l'année ${currentAnnee.annee?.label} ?\n\nCette action est irréversible. Les fidèles ne pourront plus être ajoutés à cette année.`)) {
      return
    }

    setClosingYear(currentAnnee.id)
    
    try {
      const result = await closeYearForDepartement(
        chefInfo.district_id,
        chefInfo.departement_id
      )

      if (result.success) {
        toast.success(result.message || 'Année fermée avec succès')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la fermeture de l\'année')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setClosingYear(null)
    }
  }

  const handleSetCurrent = async (anneeId: number, anneeLabel: string) => {
    if (!confirm(`Voulez-vous définir l'année ${anneeLabel} comme année en cours ?\n\nL'année précédente sera automatiquement fermée.`)) {
      return
    }

    setSettingCurrent(anneeId)
    
    try {
      // Ouvrir l'année (la fonction openNewYearForDepartement gère automatiquement le changement)
      const result = await openNewYearForDepartement(
        chefInfo.district_id,
        chefInfo.departement_id,
        anneeId
      )

      if (result.success) {
        toast.success(`Année ${anneeLabel} définie comme année en cours`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors du changement d\'année')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setSettingCurrent(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto ">
      {/* En-tête */}
      <div className="mb-8">
       

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">
              Gestion des années
            </h1>
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-500">
                {chefInfo.departement_nom}
              </p>
              <span className={`text-xs px-2 py-0.5 -full ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              <span className="text-xs text-gray-400">
                District : {chefInfo.district_nom}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm -lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une année
          </button>
        </div>
      </div>

      {/* Carte de l'année en cours */}
      {currentAnnee && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 -lg border border-green-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 uppercase tracking-wider mb-2">
                Année en cours
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-light text-gray-900">
                  {currentAnnee.annee?.label}
                </span>
                <span className="px-2 py-1 text-xs -full bg-green-200 text-green-800">
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Ouverte le {new Date(currentAnnee.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <button
              onClick={handleCloseYear}
              disabled={closingYear === currentAnnee.id}
              className="px-4 py-2 bg-white text-orange-600 text-sm -lg border border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {closingYear === currentAnnee.id ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Fermeture...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Fermer l'année
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Liste de toutes les années */}
      <div className="bg-white  -lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Toutes les années</h2>
          <p className="text-xs text-gray-500 mt-1">
            Historique complet des années pour ce département
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {anneesHistory.map((annee) => (
            <div key={annee.id} className="p-5 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <span className="text-base font-medium text-gray-900">
                  {annee.annee?.label}
                </span>
                {getStatusBadge(annee.status || (annee.is_current ? 'current' : 'past'))}
                <span className="text-xs text-gray-400">
                  Ajoutée le {new Date(annee.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {annee.is_current && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 -full animate-pulse"></span>
                    En cours
                  </span>
                )}
                
                {/* Bouton pour définir comme année en cours (sauf si c'est déjà l'année en cours) */}
                {!annee.is_current && (
                  <button
                    onClick={() => handleSetCurrent(annee.annee_id, annee.annee?.label || '')}
                    disabled={settingCurrent === annee.annee_id}
                    className="text-xs text-blue-600 hover:text-blue-800 px-3 py-1  hover:bg-blue-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    {settingCurrent === annee.annee_id ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Définition...
                      </>
                    ) : (
                      'Définir comme en cours'
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {anneesHistory.length === 0 && (
            <div className="py-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm mb-3">Aucune année ouverte</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm text-green-600 hover:text-green-700"
              >
                + Ajouter une première année
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Note d'information */}
      <div className="mt-6 p-4 bg-blue-50 -lg border border-blue-100">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-800 font-medium mb-1">Information</p>
            <p className="text-xs text-blue-600">
              Vous pouvez ajouter n'importe quelle année (passée, présente ou future). 
              Une seule année peut être définie comme "en cours" à la fois. 
              Définir une nouvelle année comme "en cours" fermera automatiquement l'année précédente.
            </p>
          </div>
        </div>
      </div>

      {/* Modal d'ajout d'année */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white -lg max-w-md w-full p-6">
            <h3 className="text-lg font-light text-gray-900 mb-4">
              Ajouter une année
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Département
                </label>
                <input
                  type="text"
                  value={chefInfo.departement_nom}
                  disabled
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 -lg text-sm text-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Année
                </label>
                <select
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400"
                  required
                >
                  <option value="">Sélectionner une année</option>
                  {anneesDisponibles.map((annee) => {
                    const isAlreadyAdded = anneesHistory.some(h => h.annee_id === annee.id)
                    return (
                      <option key={annee.id} value={annee.id}>
                        {annee.label} {isAlreadyAdded ? '(Déjà ajoutée)' : ''}
                      </option>
                    )
                  })}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Vous pouvez ajouter une année déjà existante, elle sera simplement réactivée
                </p>
              </div>

              {currentAnnee && (
                <div className="p-3 bg-yellow-50 -lg border border-yellow-200">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Une année est déjà en cours ({currentAnnee.annee?.label}). 
                    L'ajout d'une nouvelle année et sa définition comme "en cours" fermera automatiquement l'année actuelle.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedAnnee('')
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  Annuler
                </button>
                <button
                  onClick={handleOpenYear}
                  disabled={loading || !selectedAnnee}
                  className="px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 -lg disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Ajout...
                    </>
                  ) : (
                    'Ajouter l\'année'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}