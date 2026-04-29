
// app/paroisse/departements/[id]/membres/FidelesDepartementList.tsx
'use client'

import { useState, useEffect } from 'react'
import { updateFideleRole, desactiverFideleFromDepartement, deleteFideleFromDepartement } from '@/actions/fidele-departement'
import Link from 'next/link'
import { MoreVertical, UserCheck, UserX, Trash2, Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface FideleDepartement {
  id: number
  role_id: number
  role_details?: {
    id: number
    nom: string
    label: string
    couleur: string
    niveau: number
  }
  annee_id: number
  annee?: {
    id: number
    label: string
  }
  est_actif: boolean
  paroisse_id: number
  fidele: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img?: string
    sexe?: string
    actif?: boolean
  }
  departement?: {
    id: number
    nom: string
    type: string
  }
}

interface FidelesDepartementListProps {
  fideles?: FideleDepartement[]
  departementId: number
  departementNom: string
  totalFideles?: number
  actifs?: number
  inactifs?: number
  isParoisse?: boolean
  paroisseId?: number
  anneeId?: number | null
  isCurrentYear?: boolean
}

export default function FidelesDepartementList({ 
  fideles = [],
  departementId, 
  departementNom,
  isParoisse = false,
  paroisseId = 1,
  anneeId = null,
  isCurrentYear = true
}: FidelesDepartementListProps) {
  const router = useRouter()
  const [fidelesList, setFidelesList] = useState<FideleDepartement[]>(fideles)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  useEffect(() => {
    setFidelesList(fideles)
  }, [fideles])

  const actifsList = (fidelesList || []).filter(f => f?.est_actif === true)
  const inactifsList = (fidelesList || []).filter(f => f?.est_actif === false)

  async function handleReactiver(affectation: FideleDepartement) {
    setActionLoading(affectation.id)
    
    try {
      const formData = new FormData()
      formData.append('id', affectation.id.toString())
      formData.append('role_id', affectation.role_id.toString())
      formData.append('est_actif', 'true')
      formData.append('paroisse_id', affectation.paroisse_id.toString())
      
      const result = await updateFideleRole(formData)

      if (result.success) {
        toast.success(`${affectation.fidele.prenom} ${affectation.fidele.nom} a été réactivé`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
      setMenuOpen(null)
    }
  }

  async function handleDesactiver(affectation: FideleDepartement) {
    if (!confirm(`Désactiver ${affectation.fidele.prenom} ${affectation.fidele.nom} ?`)) {
      return
    }

    setActionLoading(affectation.id)
    
    try {
      const result = await desactiverFideleFromDepartement(affectation.id, paroisseId)

      if (result.success) {
        toast.success(`${affectation.fidele.prenom} ${affectation.fidele.nom} a été désactivé`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
      setMenuOpen(null)
    }
  }

  async function handleDelete(affectation: FideleDepartement) {
    if (!confirm(`Supprimer définitivement ${affectation.fidele.prenom} ${affectation.fidele.nom} ?`)) {
      return
    }

    setActionLoading(affectation.id)
    
    try {
      const result = await deleteFideleFromDepartement(affectation.id, paroisseId)

      if (result.success) {
        toast.success('Membre supprimé')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
      setMenuOpen(null)
    }
  }

  if (!fidelesList || fidelesList.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-400">
          {anneeId ? 'Aucun membre pour cette année' : 'Aucun membre dans ce département'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Membres actifs */}
      {actifsList.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Membres actifs</h3>
            <span className="bg-green-100 text-green-700 px-2 py-0.5 text-xs">
              {actifsList.length}
            </span>
          </div>
          <div className="space-y-2">
            {actifsList.map((membre) => {
              const profileLink = isParoisse 
                ? `/paroisse/departements/fideles/${membre.fidele.id}`
                : `/admin/fideles/${membre.fidele.id}`

              return (
                <div
                  key={membre.id}
                  className="group flex items-center justify-between p-4 bg-white border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Link href={profileLink} className="shrink-0">
                      {membre.fidele.profile_img ? (
                        <img
                          src={membre.fidele.profile_img}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                          {membre.fidele.nom?.[0] || '?'}
                        </div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          href={profileLink}
                          className="text-sm font-medium text-gray-900 hover:text-black"
                        >
                          {membre.fidele.nom} {membre.fidele.post_nom} {membre.fidele.prenom}
                        </Link>
                        {membre.role_details && (
                          <span 
                            className="text-xs px-2 py-0.5 border"
                            style={{ 
                              backgroundColor: `${membre.role_details.couleur}15`,
                              color: membre.role_details.couleur,
                              borderColor: `${membre.role_details.couleur}30`
                            }}
                          >
                            {membre.role_details.label}
                          </span>
                        )}
                        {membre.annee && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">
                            {membre.annee.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1.5">
                        {membre.fidele.contact}
                      </div>
                    </div>
                  </div>

                  {isCurrentYear && (
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === membre.id ? null : membre.id)}
                        className="p-2 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {menuOpen === membre.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[160px]">
                          <button
                            onClick={() => handleDesactiver(membre)}
                            disabled={actionLoading === membre.id}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <UserX size={14} /> Désactiver
                          </button>
                          <button
                            onClick={() => handleDelete(membre)}
                            disabled={actionLoading === membre.id}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            {actionLoading === membre.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Anciens membres */}
      {inactifsList.length > 0 && (
        <div className="space-y-3 mt-8 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Historique</h3>
            <span className="bg-gray-100 text-gray-500 px-2 py-0.5 text-xs">
              {inactifsList.length}
            </span>
          </div>
          <div className="space-y-2">
            {inactifsList.map((membre) => (
              <div
                key={membre.id}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 opacity-75 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    {membre.fidele.nom?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-gray-600">
                        {membre.fidele.nom} {membre.fidele.prenom}
                      </span>
                      {membre.role_details && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 border border-gray-300">
                          {membre.role_details.label}
                        </span>
                      )}
                      {membre.annee && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200">
                          {membre.annee.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isCurrentYear && (
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === membre.id ? null : membre.id)}
                      className="p-2 text-gray-400 hover:text-black"
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {menuOpen === membre.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[140px]">
                        <button
                          onClick={() => handleReactiver(membre)}
                          disabled={actionLoading === membre.id}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <UserCheck size={14} /> Réactiver
                        </button>
                        <button
                          onClick={() => handleDelete(membre)}
                          disabled={actionLoading === membre.id}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  )
}