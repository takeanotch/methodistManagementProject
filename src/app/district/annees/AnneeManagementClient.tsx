
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { openNewYearForDepartement, closeYearForDepartement } from '@/actions/annee-district'

interface Departement {
  id: number
  nom: string
  type: string
}

interface Annee {
  id: number
  label: string
}

// ✅ Correction : Aligner l'interface avec ce qui est retourné par getAnneesStatusForDistrict
interface AnneeStatusItem {
  id: number
  annee: Annee
  state: string
  is_active: boolean
}

interface AnneeStatus {
  departement: Departement
  annees: AnneeStatusItem[]
}

interface AnneeManagementClientProps {
  districtId: number
  departements: Departement[]
  annees: Annee[]
  anneesStatus: AnneeStatus[]  // ✅ Le type est maintenant cohérent
}

export default function AnneeManagementClient({
  districtId,
  departements,
  annees,
  anneesStatus
}: AnneeManagementClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)
  const [selectedDepartement, setSelectedDepartement] = useState<number | null>(null)
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)

  const typeLabels: Record<string, { label: string; color: string }> = {
    commite: { label: 'Comité', color: 'bg-purple-100 text-purple-700' },
    agence_programme: { label: 'Agence/Programme', color: 'bg-blue-100 text-blue-700' },
    normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' }
  }

  const stateLabels: Record<string, string> = {
    current: 'En cours',
    last_year: 'Année précédente',
    next_year: 'Année suivante',
    past: 'Passée',
    future: 'Future'
  }

  const stateColors: Record<string, string> = {
    current: 'bg-green-100 text-green-700 border-green-200',
    last_year: 'bg-gray-100 text-gray-600 border-gray-200',
    next_year: 'bg-blue-100 text-blue-600 border-blue-200',
    past: 'bg-gray-100 text-gray-500 border-gray-200',
    future: 'bg-blue-50 text-blue-500 border-blue-200'
  }

  async function handleOpenYear() {
    if (!selectedDepartement || !selectedAnnee) {
      toast.error('Veuillez sélectionner un département et une année')
      return
    }

    setLoading(selectedDepartement)
    
    try {
      const result = await openNewYearForDepartement(
        districtId,
        selectedDepartement,
        selectedAnnee
      )

      if (result.success) {
        toast.success(result.message || 'Année ouverte avec succès')
        setSelectedDepartement(null)
        setSelectedAnnee(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de l\'ouverture de l\'année')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(null)
    }
  }

  // ✅ Correction : closeYearForDepartement ne prend que 2 arguments (districtId, departementId)
  async function handleCloseYear(departementId: number, anneeLabel: string) {
    if (!confirm(`Voulez-vous fermer l'année ${anneeLabel} pour ce département ?\n\nLes fidèles ne pourront plus être ajoutés à cette année.`)) {
      return
    }

    setLoading(departementId)
    
    try {
      const result = await closeYearForDepartement(
        districtId,
        departementId
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
      setLoading(null)
    }
  }

  // Créer un map pour un accès facile aux statuts
  const statusMap = new Map<number, AnneeStatusItem[]>()
  anneesStatus.forEach((status) => {
    statusMap.set(status.departement.id, status.annees)
  })

  return (
    <div className="space-y-8">
      {/* Formulaire d'ouverture d'année */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <h2 className="text-lg font-light text-gray-900 mb-4">
          Ouvrir une nouvelle année
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Département
            </label>
            <select
              value={selectedDepartement || ''}
              onChange={(e) => setSelectedDepartement(parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Sélectionner un département</option>
              {departements.map((dept) => {
                const typeInfo = typeLabels[dept.type] || typeLabels.normal
                return (
                  <option key={dept.id} value={dept.id}>
                    {dept.nom} ({typeInfo.label})
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Année
            </label>
            <select
              value={selectedAnnee || ''}
              onChange={(e) => setSelectedAnnee(parseInt(e.target.value) || null)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Sélectionner une année</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleOpenYear}
              disabled={!selectedDepartement || !selectedAnnee || loading !== null}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === selectedDepartement ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Ouverture...
                </>
              ) : (
                'Ouvrir l\'année'
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Ouvrir une nouvelle année la définira comme année en cours
        </p>
      </div>

      {/* Liste des départements et leurs années */}
      <div className="space-y-6">
        <h2 className="text-lg font-light text-gray-900">
          Années par département
        </h2>

        {departements.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-gray-100">
            <p className="text-gray-400">Aucun département trouvé</p>
          </div>
        ) : (
          departements.map((departement) => {
            const deptAnnees = statusMap.get(departement.id) || []
            const currentAnnee = deptAnnees.find((a) => a.state === 'current' && a.is_active)
            const typeInfo = typeLabels[departement.type] || typeLabels.normal

            return (
              <div
                key={departement.id}
                className="bg-white rounded-lg border border-gray-100 overflow-hidden"
              >
                <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{departement.nom}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                    {currentAnnee && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          Année en cours: {currentAnnee.annee.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {deptAnnees.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-400 mb-3">
                        Aucune année ouverte pour ce département
                      </p>
                      <button
                        onClick={() => {
                          setSelectedDepartement(departement.id)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        + Ouvrir une année
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deptAnnees.map((anneeInfo) => (
                        <div
                          key={anneeInfo.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            anneeInfo.is_active 
                              ? 'bg-white border-gray-200' 
                              : 'bg-gray-50/50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`text-xs px-2 py-1 rounded-full border ${
                                stateColors[anneeInfo.state] || 'bg-gray-100 text-gray-600 border-gray-200'
                              }`}
                            >
                              {stateLabels[anneeInfo.state] || anneeInfo.state}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {anneeInfo.annee.label}
                            </span>
                            {!anneeInfo.is_active && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Fermée
                              </span>
                            )}
                          </div>

                          {anneeInfo.state === 'current' && anneeInfo.is_active && (
                            <button
                              onClick={() => handleCloseYear(
                                departement.id,
                                anneeInfo.annee.label
                              )}
                              disabled={loading === departement.id}
                              className="px-3 py-1 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {loading === departement.id ? (
                                <>
                                  <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Fermeture...
                                </>
                              ) : (
                                <>
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  Fermer l'année
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}