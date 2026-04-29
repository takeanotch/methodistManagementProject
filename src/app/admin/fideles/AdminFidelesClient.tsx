// app/admin/fideles/AdminFidelesClient.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  UserPlus,
  X,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Users,
  Shield,
  Phone,
  MapPin,
  Building,
  Filter
} from 'lucide-react'
import { deleteFidele, updateFidele } from '@/actions/fidele'
import CreerCompteModal from './CreerCompteModal'
import AdminAddFideleModal from './AdminAddFideleModal'
import toast from 'react-hot-toast'

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  contact: string
  adresse: string | null
  profile_img: string | null
  created_at: string
  annee_naissance: number | null
  actif: boolean
  sexe: string | null
  paroisse_id: number | null
  inscription_annee?: number
  date_inscription_paroisse?: string
  paroisse?: {
    id: number
    nom: string
  } | null
  compte?: {
    id: number
    role_id: number
    role?: {
      id: number
      nom: string
      niveau: string
    }
  } | null
}

interface Paroisse {
  id: number
  nom: string
}

interface Role {
  id: number
  nom: string
  niveau: string
}

interface AdminFidelesClientProps {
  fideles: Fidele[]
  paroisses: Paroisse[]
  allRoles: Role[]
}

export default function AdminFidelesClient({ 
  fideles, 
  paroisses,
  allRoles 
}: AdminFidelesClientProps) {
  const router = useRouter()
  
  // États
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActif, setFilterActif] = useState<'all' | 'actif' | 'inactif'>('all')
  const [filterSexe, setFilterSexe] = useState<'all' | 'M' | 'F' | 'non_renseigne'>('all')
  const [filterCompte, setFilterCompte] = useState<'all' | 'avec_compte' | 'sans_compte'>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterParoisse, setFilterParoisse] = useState<string>('all')
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCompteModal, setShowCompteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  
  // Édition
  const [editingFidele, setEditingFidele] = useState<Fidele | null>(null)
  const [editFormData, setEditFormData] = useState({
    nom: '',
    post_nom: '',
    prenom: '',
    contact: '',
    adresse: '',
    annee_naissance: '',
    sexe: '',
    actif: true,
    paroisse_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Menu
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Fonction pour récupérer le rôle
  const getRoleNom = (fidele: Fidele): string | null => {
    if (!fidele.compte) return null
    
    let compteData = fidele.compte
    if (Array.isArray(compteData)) {
      compteData = compteData[0]
      if (!compteData) return null
    }
    
    if (compteData.role) {
      let roleData = compteData.role
      if (Array.isArray(roleData)) {
        roleData = roleData[0]
      }
      return roleData?.nom || null
    }
    
    return null
  }

  // Fonction pour vérifier si un fidèle a un compte
  const aUnCompte = (fidele: Fidele): boolean => {
    if (!fidele.compte) return false
    
    if (Array.isArray(fidele.compte)) {
      return fidele.compte.length > 0 && fidele.compte[0] !== null
    }
    
    return true
  }

  // Filtrer les fidèles
  const filteredFideles = fideles.filter(fidele => {
    const fullName = `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`.toLowerCase()
    const matchesSearch = searchTerm === '' || 
      fullName.includes(searchTerm.toLowerCase()) ||
      fidele.contact.includes(searchTerm) ||
      (fidele.adresse && fidele.adresse.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesActif = filterActif === 'all' || 
      (filterActif === 'actif' && fidele.actif) ||
      (filterActif === 'inactif' && !fidele.actif)

    const matchesSexe = filterSexe === 'all' || 
      (filterSexe === 'M' && fidele.sexe === 'M') ||
      (filterSexe === 'F' && fidele.sexe === 'F') ||
      (filterSexe === 'non_renseigne' && !fidele.sexe)

    const hasAccount = aUnCompte(fidele)
    const matchesCompte = filterCompte === 'all' ||
      (filterCompte === 'avec_compte' && hasAccount) ||
      (filterCompte === 'sans_compte' && !hasAccount)

    const roleNom = getRoleNom(fidele)
    const matchesRole = filterRole === 'all' || roleNom === filterRole

    const matchesParoisse = filterParoisse === 'all' || 
      fidele.paroisse_id?.toString() === filterParoisse

    return matchesSearch && matchesActif && matchesSexe && matchesCompte && matchesRole && matchesParoisse
  })

  // Statistiques filtrées
  const stats = {
    total: filteredFideles.length,
    actifs: filteredFideles.filter(f => f.actif).length,
    inactifs: filteredFideles.filter(f => !f.actif).length,
    hommes: filteredFideles.filter(f => f.sexe === 'M').length,
    femmes: filteredFideles.filter(f => f.sexe === 'F').length,
    avecCompte: filteredFideles.filter(f => aUnCompte(f)).length,
    sansCompte: filteredFideles.filter(f => !aUnCompte(f)).length,
  }

  // Fonctions utilitaires
  const getAge = (anneeNaissance: number | null) => {
    if (!anneeNaissance) return null
    const currentYear = new Date().getFullYear()
    return currentYear - anneeNaissance
  }

  const getInitials = (fidele: Fidele) => {
    return `${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}`.toUpperCase()
  }

  const getAvatarColor = (fidele: Fidele) => {
    if (fidele.sexe === 'M') {
      return 'from-blue-50 to-blue-100 text-blue-600'
    } else if (fidele.sexe === 'F') {
      return 'from-pink-50 to-pink-100 text-pink-600'
    }
    return 'from-gray-50 to-gray-100 text-gray-600'
  }

  const getSexeLabel = (sexe: string | null) => {
    if (sexe === 'M') return 'Masculin'
    if (sexe === 'F') return 'Féminin'
    return 'Non renseigné'
  }

  const getRoleColor = (roleNom: string | null): string => {
    if (roleNom === 'admin') return 'bg-purple-100 text-purple-700'
    if (roleNom === 'gestion') return 'bg-blue-50 text-blue-600'
    if (roleNom === 'user') return 'bg-gray-100 text-gray-600'
    return 'bg-gray-50 text-gray-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  async function handleDelete(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fidèle ?')) return
    
    setActionLoading(id)
    const result = await deleteFidele(id)
    
    if (result.success) {
      toast.success('Fidèle supprimé')
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  function handleEditClick(fidele: Fidele) {
    setEditingFidele(fidele)
    setEditFormData({
      nom: fidele.nom,
      post_nom: fidele.post_nom,
      prenom: fidele.prenom,
      contact: fidele.contact,
      adresse: fidele.adresse || '',
      annee_naissance: fidele.annee_naissance?.toString() || '',
      sexe: fidele.sexe || '',
      actif: fidele.actif,
      paroisse_id: fidele.paroisse_id?.toString() || ''
    })
    setShowEditModal(true)
    setMenuOpen(null)
  }

  async function handleUpdateFidele(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    if (editingFidele) {
      formData.append('id', editingFidele.id.toString())
    }
    formData.append('nom', editFormData.nom)
    formData.append('post_nom', editFormData.post_nom)
    formData.append('prenom', editFormData.prenom)
    formData.append('contact', editFormData.contact)
    formData.append('adresse', editFormData.adresse)
    if (editFormData.annee_naissance) {
      formData.append('annee_naissance', editFormData.annee_naissance)
    }
    if (editFormData.sexe) {
      formData.append('sexe', editFormData.sexe)
    }
    formData.append('actif', editFormData.actif ? 'true' : 'false')
    if (editFormData.paroisse_id) {
      formData.append('paroisse_id', editFormData.paroisse_id)
    }

    const result = await updateFidele(formData)

    if (result.success) {
      toast.success('Fidèle modifié avec succès')
      setShowEditModal(false)
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la modification')
    }

    setIsSubmitting(false)
  }

  function handleCreerCompte(fidele: Fidele) {
    setSelectedFidele(fidele)
    setShowCompteModal(true)
    setMenuOpen(null)
  }

  function handleAddSuccess() {
    router.refresh()
  }

  // Réinitialiser les filtres
  const hasActiveFilters = searchTerm !== '' || 
    filterActif !== 'all' || 
    filterSexe !== 'all' || 
    filterCompte !== 'all' || 
    filterRole !== 'all' || 
    filterParoisse !== 'all'

  function resetFilters() {
    setSearchTerm('')
    setFilterActif('all')
    setFilterSexe('all')
    setFilterCompte('all')
    setFilterRole('all')
    setFilterParoisse('all')
  }

  return (
    <>
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Recherche */}
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un fidèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white -lg"
            />
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterActif}
              onChange={(e) => setFilterActif(e.target.value as typeof filterActif)}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white -lg"
            >
              <option value="all">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
            </select>

            <select
              value={filterSexe}
              onChange={(e) => setFilterSexe(e.target.value as typeof filterSexe)}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white -lg"
            >
              <option value="all">Tous les sexes</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="non_renseigne">Non renseigné</option>
            </select>

            <select
              value={filterCompte}
              onChange={(e) => setFilterCompte(e.target.value as typeof filterCompte)}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white -lg"
            >
              <option value="all">Tous les comptes</option>
              <option value="avec_compte">Avec compte</option>
              <option value="sans_compte">Sans compte</option>
            </select>

            {filterCompte !== 'sans_compte' && allRoles.length > 0 && (
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white -lg"
              >
                <option value="all">Tous les rôles</option>
                {allRoles.map((role) => (
                  <option key={role.id} value={role.nom}>
                    {role.nom}
                  </option>
                ))}
              </select>
            )}

            {paroisses.length > 0 && (
              <select
                value={filterParoisse}
                onChange={(e) => setFilterParoisse(e.target.value)}
                className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white -lg"
              >
                <option value="all">Toutes les paroisses</option>
                {paroisses.map((paroisse) => (
                  <option key={paroisse.id} value={paroisse.id.toString()}>
                    {paroisse.nom}
                  </option>
                ))}
              </select>
            )}

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="p-2 text-gray-400 hover:text-gray-600 -lg hover:bg-gray-100 transition-colors"
                title="Réinitialiser les filtres"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 -lg transition-colors"
        >
          <Plus size={16} />
          Nouveau fidèle
        </button>
      </div>

      {/* Statistiques rapides */}
      <div className="flex flex-wrap gap-6 mb-6 p-4 bg-gray-50 border border-gray-200 -lg">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm text-gray-500">Total:</span>
          <span className="font-medium text-gray-900">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 -full"></div>
          <span className="text-sm text-gray-500">Actifs:</span>
          <span className="font-medium text-gray-900">{stats.actifs}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gray-400 -full"></div>
          <span className="text-sm text-gray-500">Inactifs:</span>
          <span className="font-medium text-gray-900">{stats.inactifs}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-blue-500">♂</span>
          <span className="text-sm text-gray-500">Hommes:</span>
          <span className="font-medium text-gray-900">{stats.hommes}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-pink-500">♀</span>
          <span className="text-sm text-gray-500">Femmes:</span>
          <span className="font-medium text-gray-900">{stats.femmes}</span>
        </div>
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">Avec compte:</span>
          <span className="font-medium text-gray-900">{stats.avecCompte}</span>
        </div>
      </div>

      {/* Liste des fidèles */}
      {filteredFideles.length === 0 ? (
        <div className="bg-white border border-gray-200 -lg py-16 text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun fidèle trouvé</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-2"
            >
              <Filter size={14} />
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFideles.map((fidele) => {
            const age = getAge(fidele.annee_naissance)
            const hasAccount = aUnCompte(fidele)
            const roleNom = getRoleNom(fidele)
            
            return (
              <div key={fidele.id} className="bg-white border border-gray-200 -lg p-4 hover:border-gray-300 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {fidele.profile_img ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200">
                          <Image
                            src={fidele.profile_img}
                            alt={`${fidele.nom} ${fidele.prenom}`}
                            width={48}
                            height={48}
                            className="object-cover w-full rounded-full h-full"
                          />
                        </div>
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(fidele)} flex items-center justify-center`}>
                          <span className="text-base rounded-full font-medium">{getInitials(fidele)}</span>
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900">
                          {fidele.nom} {fidele.post_nom} {fidele.prenom}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 -full ${fidele.actif ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>
                          {fidele.actif ? 'Actif' : 'Inactif'}
                        </span>
                        {fidele.paroisse && (
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 -full flex items-center gap-1">
                            <Building size={10} />
                            {fidele.paroisse.nom}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone size={14} className="text-gray-400" />
                          <span>{fidele.contact}</span>
                        </div>
                        {fidele.adresse && (
                          <div className="flex items-center gap-1">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="truncate max-w-[200px]">{fidele.adresse}</span>
                          </div>
                        )}
                        {age && (
                          <div className="flex items-center gap-1">
                            <Calendar size={14} className="text-gray-400" />
                            <span>{age} ans</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          <span>{getSexeLabel(fidele.sexe)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                        {hasAccount ? (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} />
                              Compte actif
                            </span>
                            <span className={`px-2 py-0.5 -full ${getRoleColor(roleNom)}`}>
                              {roleNom || 'Utilisateur'}
                            </span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <XCircle size={12} />
                            Aucun compte
                          </span>
                        )}
                        <div className="text-gray-400">
                          Inscrit le {formatDate(fidele.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/fideles/${fidele.id}`}
                      className="p-2 text-gray-400 hover:text-black -full hover:bg-gray-100 transition-colors"
                      title="Voir détails"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>

                    {!hasAccount && (
                      <button
                        onClick={() => handleCreerCompte(fidele)}
                        className="p-2 text-gray-400 hover:text-green-600 -full hover:bg-green-50 transition-colors"
                        title="Créer un compte"
                      >
                        <UserPlus size={18} />
                      </button>
                    )}

                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(menuOpen === fidele.id ? null : fidele.id)}
                        className="p-2 text-gray-400 hover:text-black -full hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>
                      
                      {menuOpen === fidele.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg -lg z-10 min-w-[160px] overflow-hidden">
                          <button
                            onClick={() => handleEditClick(fidele)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit size={14} /> Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(fidele.id)}
                            disabled={actionLoading === fidele.id}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                          >
                            {actionLoading === fidele.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pied de tableau */}
      {filteredFideles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-400">
          <span>{filteredFideles.length} fidèle{filteredFideles.length > 1 ? 's' : ''} affiché{filteredFideles.length > 1 ? 's' : ''}</span>
          {fideles.length !== filteredFideles.length && (
            <span>(sur {fideles.length} total)</span>
          )}
        </div>
      )}

      {/* Modal d'ajout */}
      {showAddModal && (
        <AdminAddFideleModal
          paroisses={paroisses}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Modal édition */}
      {showEditModal && editingFidele && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col -lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                Modifier - {editingFidele.nom} {editingFidele.prenom}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateFidele} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Post-nom</label>
                  <input
                    type="text"
                    value={editFormData.post_nom}
                    onChange={(e) => setEditFormData({ ...editFormData, post_nom: e.target.value })}
                    className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prénom *</label>
                <input
                  type="text"
                  value={editFormData.prenom}
                  onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact *</label>
                <input
                  type="tel"
                  value={editFormData.contact}
                  onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={editFormData.adresse}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Année naissance</label>
                  <input
                    type="number"
                    value={editFormData.annee_naissance}
                    onChange={(e) => setEditFormData({ ...editFormData, annee_naissance: e.target.value })}
                    className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                    placeholder="YYYY"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sexe</label>
                  <select
                    value={editFormData.sexe}
                    onChange={(e) => setEditFormData({ ...editFormData, sexe: e.target.value })}
                    className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                  >
                    <option value="">Non renseigné</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Paroisse</label>
                <select
                  value={editFormData.paroisse_id}
                  onChange={(e) => setEditFormData({ ...editFormData, paroisse_id: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                >
                  <option value="">Aucune paroisse</option>
                  {paroisses.map((paroisse) => (
                    <option key={paroisse.id} value={paroisse.id.toString()}>
                      {paroisse.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.actif}
                    onChange={(e) => setEditFormData({ ...editFormData, actif: e.target.checked })}
                    className=" border-gray-300"
                  />
                  <span className="text-sm">Fidèle actif</span>
                </label>
              </div>
            </form>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 -lg hover:border-black transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleUpdateFidele}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white -lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création compte */}
      {showCompteModal && selectedFidele && (
        <CreerCompteModal
          fidele={selectedFidele}
          onClose={() => {
            setShowCompteModal(false)
            setSelectedFidele(null)
          }}
        />
      )}

      {/* Fond pour fermer le menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </>
  )
}