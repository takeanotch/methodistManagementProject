

// components/FidelesDepartementList.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface FideleDepartement {
  id: number
  fidele_id: number
  role_id: number
  est_actif: boolean
  created_at?: string
  annee_id?: number
  annee?: {
    id: number
    label: string
  }
  fidele?: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact?: string
    profile_img?: string
    sexe?: string
    actif?: boolean
  }
  role_details?: {
    id: number
    nom: string
    label: string
    niveau: number
    couleur: string
  }
}

interface FidelesDepartementListProps {
  fideles: FideleDepartement[]
  departementId: number
  departementNom: string
  totalFideles?: number
  actifs?: number
  inactifs?: number
  isParoisse?: boolean
  paroisseId?: number
  anneeId?: number | null
  isCurrentYear?: boolean
  showRoleBadge?: boolean
  basePath?: string
  canEdit?: boolean
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  onToggleStatus?: (id: number, estActif: boolean) => void
}

export default function FidelesDepartementList({
  fideles = [],
  departementId,
  departementNom,
  totalFideles: initialTotal,
  actifs: initialActifs,
  inactifs: initialInactifs,
  isParoisse = true,
  paroisseId = 1,
  anneeId = null,
  isCurrentYear = true,
  showRoleBadge = true,
  basePath = '/paroisse',
  canEdit = false,
  onEdit,
  onDelete,
  onToggleStatus
}: FidelesDepartementListProps) {
  const router = useRouter()
  const [fidelesList, setFidelesList] = useState<FideleDepartement[]>(fideles)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    setFidelesList(fideles)
  }, [fideles])

  // Fonction pour obtenir les initiales
  const getInitials = (prenom?: string, nom?: string, postNom?: string) => {
    const prenomInitial = prenom?.charAt(0) || ''
    const nomInitial = nom?.charAt(0) || ''
    const postNomInitial = postNom?.charAt(0) || ''
    
    if (prenomInitial && nomInitial) {
      return `${prenomInitial}${nomInitial}`.toUpperCase()
    }
    if (prenomInitial) {
      return prenomInitial.toUpperCase()
    }
    if (nomInitial) {
      return nomInitial.toUpperCase()
    }
    if (postNomInitial) {
      return postNomInitial.toUpperCase()
    }
    return '?'
  }

  // Extraire les rôles uniques pour le filtre
  const roles = Array.from(new Set(
    fidelesList.map(f => f.role_details?.label || 'Sans rôle')
  ))

  // Filtrer les fidèles
  const filteredFideles = fidelesList.filter(fidele => {
    const nomComplet = `${fidele.fidele?.prenom || ''} ${fidele.fidele?.nom || ''} ${fidele.fidele?.post_nom || ''}`.toLowerCase()
    const matchesSearch = searchTerm === '' || nomComplet.includes(searchTerm.toLowerCase())
    
    const roleLabel = fidele.role_details?.label || 'Sans rôle'
    const matchesRole = filterRole === 'all' || roleLabel === filterRole
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'actif' && fidele.est_actif) ||
      (filterStatus === 'inactif' && !fidele.est_actif)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const actifsList = filteredFideles.filter(f => f.est_actif === true)
  const inactifsList = filteredFideles.filter(f => f.est_actif === false)

  const getRoleBadge = (role?: { label: string; couleur: string }) => {
    if (!role) return null
    return (
      <span 
        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs"
        style={{ 
          backgroundColor: role.couleur + '20',
          color: role.couleur 
        }}
      >
        {role.label}
      </span>
    )
  }

  const handleViewDetails = (fideleId: number) => {
    router.push(`${basePath}/fidele/${fideleId}`)
  }

  const handleDesactiver = async (membre: FideleDepartement) => {
    if (!confirm(`Voulez-vous désactiver ${membre.fidele?.prenom} ${membre.fidele?.nom} du département ${departementNom} ?`)) {
      return
    }

    setActionLoading(membre.id)
    
    try {
      const response = await fetch(`/api/fidele-departement/${membre.id}/desactiver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paroisseId })
      })
      
      const result = await response.json()

      if (result.success) {
        toast.success(`${membre.fidele?.prenom} ${membre.fidele?.nom} a été désactivé`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la désactivation')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (membre: FideleDepartement) => {
    if (!confirm(`Supprimer définitivement ${membre.fidele?.prenom} ${membre.fidele?.nom} ?`)) {
      return
    }

    setActionLoading(membre.id)
    
    try {
      const response = await fetch(`/api/fidele-departement/${membre.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paroisseId })
      })
      
      const result = await response.json()

      if (result.success) {
        toast.success(`${membre.fidele?.prenom} ${membre.fidele?.nom} a été supprimé`)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  if (fidelesList.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-gray-100">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-400">
          {anneeId ? 'Aucun fidèle pour cette année' : 'Aucun fidèle dans ce département'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un fidèle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">Tous les rôles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
      </div>

      {filteredFideles.length === 0 ? (
        <div className="text-center py-8 bg-gray-50/50 rounded-lg border border-gray-100">
          <p className="text-gray-400 text-sm">Aucun résultat trouvé</p>
        </div>
      ) : (
        <>
          {/* Membres actifs */}
          {actifsList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membres actifs
                </h3>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                  {actifsList.length}
                </span>
              </div>
              <div className="space-y-2">
                {actifsList.map((membre) => {
                  const initials = getInitials(
                    membre.fidele?.prenom,
                    membre.fidele?.nom,
                    membre.fidele?.post_nom
                  )
                  const profileLink = isParoisse 
                    ? `/paroisse/fideles/${membre.fidele_id}`
                    : `${basePath}/fidele/${membre.fidele_id}`

                  return (
                    <div
                      key={membre.id}
                      className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Avatar - Image ou initiales */}
                        <div className="shrink-0">
                          {membre.fidele?.profile_img ? (
                            <img
                              src={membre.fidele.profile_img}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium text-sm">
                              {initials}
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link 
                              href={profileLink}
                              className="text-sm font-medium text-gray-900 hover:text-gray-700 hover:underline"
                            >
                              {membre.fidele?.prenom} {membre.fidele?.nom} {membre.fidele?.post_nom}
                            </Link>
                            {showRoleBadge && getRoleBadge(membre.role_details)}
                            {membre.annee && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                {membre.annee.label}
                              </span>
                            )}
                          </div>
                          {membre.fidele?.contact && (
                            <p className="text-xs text-gray-400 mt-1">{membre.fidele.contact}</p>
                          )}
                        </div>
                      </div>

                      {canEdit && isCurrentYear && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDesactiver(membre)}
                            disabled={actionLoading === membre.id}
                            className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Désactiver"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(membre)}
                            disabled={actionLoading === membre.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Anciens membres
                </h3>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {inactifsList.length}
                </span>
              </div>
              <div className="space-y-2">
                {inactifsList.map((membre) => {
                  const initials = getInitials(
                    membre.fidele?.prenom,
                    membre.fidele?.nom,
                    membre.fidele?.post_nom
                  )

                  return (
                    <div
                      key={membre.id}
                      className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg border border-gray-100 opacity-75"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Avatar - Image ou initiales pour inactifs */}
                        <div className="shrink-0">
                          {membre.fidele?.profile_img ? (
                            <img
                              src={membre.fidele.profile_img}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover opacity-60"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                              {initials}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-600">
                              {membre.fidele?.prenom} {membre.fidele?.nom} {membre.fidele?.post_nom}
                            </span>
                            {showRoleBadge && getRoleBadge(membre.role_details)}
                            {membre.annee && (
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                                {membre.annee.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}