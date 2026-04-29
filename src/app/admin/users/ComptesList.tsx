

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toggleCompteActif, deleteCompte } from '@/actions/compte'
import EditRoleModal from './EditRoleModal'
import toast from 'react-hot-toast'
import { 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Shield, 
  User,
  Phone,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react'

interface Role {
  id: number
  nom: string
  niveau: string
}

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  actif: boolean
  annee_naissance: number | null
  sexe: string | null
  paroisse?: {
    id: number
    nom: string
  } | null
}

interface Compte {
  id: number
  nom_complet: string
  numero: string
  adresse: string | null
  profile_img: string | null
  created_at: string
  role_id: number
  role: Role
  fidele: Fidele | null
}

interface ComptesListProps {
  comptes: Compte[]
  roles: Role[]
}

export default function ComptesList({ comptes, roles }: ComptesListProps) {
  const [selectedCompte, setSelectedCompte] = useState<Compte | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('tous')
  const [filterActif, setFilterActif] = useState<'all' | 'actif' | 'inactif'>('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const handleToggleActif = async (compte: Compte) => {
    if (!compte.fidele) return

    const action = compte.fidele.actif ? 'désactiver' : 'activer'
    if (!confirm(`Êtes-vous sûr de vouloir ${action} ce compte ?`)) return

    setActionLoading(compte.id)

    const form = new FormData()
    form.append('compte_id', compte.id.toString())
    form.append('actif', (!compte.fidele.actif).toString())

    const result = await toggleCompteActif(form)
    
    if (result.success) {
      toast.success(`Compte ${action} avec succès`)
      window.location.reload()
    } else {
      toast.error(result.error || `Erreur lors de la ${action}ion du compte`)
    }
    
    setActionLoading(null)
  }

  const handleDelete = async (compte: Compte) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ? Cette action est irréversible.')) return

    setActionLoading(compte.id)

    const result = await deleteCompte(compte.id)
    
    if (result.success) {
      toast.success('Compte supprimé avec succès')
      window.location.reload()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
  }

  const handleEditRole = (compte: Compte) => {
    setSelectedCompte(compte)
    setShowRoleModal(true)
  }

  // Filtrage
  const filteredComptes = comptes.filter(compte => {
    const matchesSearch = searchTerm === '' || 
      compte.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      compte.numero.includes(searchTerm) ||
      (compte.fidele?.paroisse?.nom?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = filterRole === 'tous' || 
      compte.role_id.toString() === filterRole

    const matchesActif = filterActif === 'all' ||
      (filterActif === 'actif' && compte.fidele?.actif) ||
      (filterActif === 'inactif' && !compte.fidele?.actif)

    return matchesSearch && matchesRole && matchesActif
  })

  // Calcul de l'âge
  const getAge = (anneeNaissance: number | null) => {
    if (!anneeNaissance) return null
    const currentYear = new Date().getFullYear()
    return currentYear - anneeNaissance
  }

  const getInitials = (compte: Compte) => {
    const parts = compte.nom_complet?.split(' ') || []
    return parts.slice(0, 2).map(p => p.charAt(0)).join('').toUpperCase()
  }

  const getAvatarColor = (compte: Compte) => {
    if (compte.fidele?.sexe === 'M') {
      return 'from-blue-50 to-blue-100 text-blue-600'
    } else if (compte.fidele?.sexe === 'F') {
      return 'from-pink-50 to-pink-100 text-pink-600'
    }
    return 'from-gray-50 to-gray-100 text-gray-600'
  }

  const getRoleColor = (roleNom: string | null): string => {
    if (roleNom === 'admin') return 'bg-gray-100 text-gray-700 border-gray-200'
    if (roleNom === 'gestion') return 'bg-blue-50 text-blue-600 border-blue-200'
    return 'bg-gray-50 text-gray-500 border-gray-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const stats = {
    total: filteredComptes.length,
    actifs: filteredComptes.filter(c => c.fidele?.actif).length,
    inactifs: filteredComptes.filter(c => !c.fidele?.actif).length,
  }

  return (
    <>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
            />
          </div>

          {/* Filtre rôle */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="tous">Tous les rôles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>
                {role.nom}
              </option>
            ))}
          </select>

          {/* Filtre statut */}
          <select
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value as typeof filterActif)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="all">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-gray-500">Actifs :</span>
          <span className="font-medium">{stats.actifs}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
          <span className="text-gray-500">Inactifs :</span>
          <span className="font-medium">{stats.inactifs}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-gray-400" />
          <span className="text-gray-500">Total :</span>
          <span className="font-medium">{stats.total}</span>
        </div>
      </div>

      {/* Liste des comptes */}
      <div className="space-y-2">
        {filteredComptes.map((compte) => {
          const age = compte.fidele ? getAge(compte.fidele.annee_naissance) : null
          const isLoading = actionLoading === compte.id
          
          return (
            <div key={compte.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {compte.profile_img ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                        <Image
                          src={compte.profile_img}
                          alt={compte.nom_complet}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(compte)} flex items-center justify-center border border-gray-200`}>
                        <span className="text-base font-medium">{getInitials(compte)}</span>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">{compte.nom_complet}</h3>
                      <span className={`text-xs px-2 py-0.5 border ${compte.fidele?.actif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {compte.fidele?.actif ? 'Actif' : 'Inactif'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 border ${getRoleColor(compte.role?.nom)}`}>
                        {compte.role?.nom}
                      </span>
                      <span className="text-xs text-gray-400">ID: {compte.id}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" />
                        <span>{compte.numero}</span>
                      </div>
                      {compte.adresse && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{compte.adresse}</span>
                        </div>
                      )}
                      {compte.fidele?.paroisse && (
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          <span>{compte.fidele.paroisse.nom}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar size={12} />
                        <span>Inscrit le {formatDate(compte.created_at)}</span>
                      </div>
                      {age && (
                        <div className="text-gray-400">
                          {age} ans
                          {compte.fidele?.sexe && ` • ${compte.fidele.sexe === 'M' ? 'Homme' : 'Femme'}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Modifier le rôle */}
                  <button
                    onClick={() => handleEditRole(compte)}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
                    title="Modifier le rôle"
                  >
                    <Edit size={18} />
                  </button>

                  {/* Activer/Désactiver */}
                  <button
                    onClick={() => handleToggleActif(compte)}
                    disabled={isLoading}
                    className={`p-2 transition-colors ${
                      compte.fidele?.actif 
                        ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50' 
                        : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={compte.fidele?.actif ? 'Désactiver' : 'Activer'}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : compte.fidele?.actif ? (
                      <XCircle size={18} />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={() => handleDelete(compte)}
                    disabled={isLoading}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* État vide */}
      {(!filteredComptes || filteredComptes.length === 0) && (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <User size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun compte trouvé</p>
        </div>
      )}

      {/* Pied */}
      {filteredComptes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
          <span>{filteredComptes.length} compte{filteredComptes.length > 1 ? 's' : ''} affiché{filteredComptes.length > 1 ? 's' : ''}</span>
          {comptes.length !== filteredComptes.length && (
            <span>(sur {comptes.length} total)</span>
          )}
        </div>
      )}

      {/* Modal de modification de rôle */}
      {showRoleModal && selectedCompte && (
        <EditRoleModal
          compteId={selectedCompte.id}
          currentRoleId={selectedCompte.role_id}
          roles={roles}
          onClose={() => {
            setShowRoleModal(false)
            setSelectedCompte(null)
          }}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}
    </>
  )
}