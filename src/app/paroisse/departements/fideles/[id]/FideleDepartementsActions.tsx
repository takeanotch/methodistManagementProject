
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateFideleRole, desactiverFideleFromDepartement, deleteFideleFromDepartement } from '@/actions/fidele-departement'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Affectation {
  id: number
  role_id: number
  role_details?: {
    id: number
    nom: string
    label: string
    couleur: string
    niveau: number
  }
  departement?: {
    id: number
    nom: string
    type: string
  }
  departement_id: number
  annee_id: number
  annee?: {
    id: number
    label: string
  }
  est_actif: boolean
}

interface FideleDepartementsActionsProps {
  affectations: Affectation[]
  fideleId: number
  fideleNom: string
}

export default function FideleDepartementsActions({ 
  affectations, 
  fideleId,
  fideleNom 
}: FideleDepartementsActionsProps) {
  const router = useRouter()
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  async function toggleActif(affectation: Affectation) {
    setActionLoading(affectation.id)
    
    try {
      const formData = new FormData()
      formData.append('id', affectation.id.toString())
      formData.append('role_id', affectation.role_id.toString())
      formData.append('est_actif', (!affectation.est_actif).toString())

      const result = await updateFideleRole(formData)

      if (result.success) {
        toast.success(
          affectation.est_actif 
            ? `${fideleNom} a été désactivé du département ${affectation.departement?.nom}` 
            : `${fideleNom} a été réactivé dans le département ${affectation.departement?.nom}`
        )
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDesactiver(affectation: Affectation) {
    if (!confirm(`Voulez-vous désactiver ${fideleNom} du département ${affectation.departement?.nom} ? (L'historique sera conservé)`)) {
      return
    }

    setActionLoading(affectation.id)
    
    try {
      const result = await desactiverFideleFromDepartement(affectation.id)

      if (result.success) {
        toast.success(`${fideleNom} a été désactivé du département ${affectation.departement?.nom}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la désactivation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(affectation: Affectation) {
    if (!confirm(`⚠️ SUPPRESSION DÉFINITIVE\n\nVoulez-vous vraiment supprimer définitivement ${fideleNom} du département ${affectation.departement?.nom} ?\n\nCette action est irréversible et supprimera l'historique.`)) {
      return
    }

    setActionLoading(affectation.id)
    
    try {
      const result = await deleteFideleFromDepartement(affectation.id)

      if (result.success) {
        toast.success(`${fideleNom} a été supprimé définitivement du département ${affectation.departement?.nom}`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  // Séparer les affectations actives et inactives
  const actives = affectations.filter(a => a.est_actif)
  const inactives = affectations.filter(a => !a.est_actif)

  return (
    <div className="space-y-6">
      {/* Affectations actives */}
      {actives.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <span>Affectations actuelles</span>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
              {actives.length}
            </span>
          </h3>
          <div className="space-y-2">
            {actives.map((affectation) => (
              <div
                key={affectation.id}
                className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: affectation.role_details?.couleur || '#9CA3AF' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link 
                        href={`/paroisse/departements/${affectation.departement_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-gray-700 hover:underline"
                      >
                        {affectation.departement?.nom}
                      </Link>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${affectation.role_details?.couleur}15`,
                          color: affectation.role_details?.couleur || '#6B7280',
                          border: `1px solid ${affectation.role_details?.couleur}30`
                        }}
                      >
                        {affectation.role_details?.label || 'Rôle inconnu'}
                      </span>
                      {affectation.annee && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          {affectation.annee.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDesactiver(affectation)}
                    disabled={actionLoading === affectation.id}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors relative group/btn"
                    title="Désactiver (conserver l'historique)"
                  >
                    {actionLoading === affectation.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none">
                          Désactiver
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(affectation)}
                    disabled={actionLoading === affectation.id}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors relative group/btn"
                    title="Supprimer définitivement"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none">
                      Supprimer
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anciennes affectations (inactives) */}
      {inactives.length > 0 && (
        <div className="space-y-3 mt-8 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider px-1 flex items-center gap-2">
            <span>Historique des affectations</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              {inactives.length}
            </span>
          </h3>
          <div className="space-y-2">
            {inactives.map((affectation) => (
              <div
                key={affectation.id}
                className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600">
                        {affectation.departement?.nom}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                        {affectation.role_details?.label || 'Rôle inconnu'}
                      </span>
                      {affectation.annee && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          {affectation.annee.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons pour l'historique */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActif(affectation)}
                    disabled={actionLoading === affectation.id}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors relative group/btn"
                    title="Réactiver"
                  >
                    {actionLoading === affectation.id ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none">
                          Réactiver
                        </span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(affectation)}
                    disabled={actionLoading === affectation.id}
                    className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors relative group/btn"
                    title="Supprimer de l'historique"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover/btn:opacity-100 whitespace-nowrap pointer-events-none">
                      Supprimer
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}