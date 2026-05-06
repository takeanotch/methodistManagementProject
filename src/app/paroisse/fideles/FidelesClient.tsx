

// app/fideles/FidelesClient.tsx

'use client'

import { useState } from 'react'
import Image from 'next/image'
import ExportPDFButton from './ExportPDFButton'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
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
  Baby,
  User as UserIcon,
  Briefcase,
  Heart
} from 'lucide-react'
import { deleteFidele, updateFidele } from '@/actions/fidele'
import CreerCompteModal from '../../admin/fideles/CreerCompteModal'
import AddFideleModal from './AddFideleModal'
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
  fidele_type: string | null
  paroisse_id: number | null
  inscription_annee?: number
  date_inscription_paroisse?: string
  paroisse?: {          // Changed from paroisse? to allow both null and undefined
    id: number
    nom: string
  } | null              // Add null as possible type
  compte?: {
    id: number
    role_id: number
    role?: {
      id: number
      nom: string
      niveau: string
    }
  } | null              // Add null as possible type to match the data
}
interface AnneeDisponible {
  id: number
  label: string
  is_current: boolean
}

interface ParoisseStructure {
  id: number
  nom: string
  district: {
    id: number
    nom: string
    conference: {
      id: number
      nom: string
      region: {
        id: number
        nom: string
      }
    }
  } | null
}

interface FidelesClientProps {
  fideles: Fidele[]
  userRole?: string
  currentParoisseId?: number
  currentParoisseNom?: string
  paroisseStructure?: ParoisseStructure | null
  anneeActuelleId?: number
  anneeActuelleLabel?: string
  anneesDisponibles: AnneeDisponible[]
  anneeSelectionneeId?: number
  allRoles: { id: number; nom: string; niveau: string }[]  
}

// Types de fidèles avec leurs libellés et icônes
const FIDELE_TYPES = [
  { value: 'enfant', label: 'Enfant', icon: Baby, color: 'text-orange-500 bg-orange-50' },
  { value: 'jeune', label: 'Jeune', icon: UserIcon, color: 'text-green-500 bg-green-50' },
  { value: 'adulte', label: 'Adulte', icon: Briefcase, color: 'text-blue-500 bg-blue-50' },
  { value: 'vieillard', label: 'Vieillard', icon: Heart, color: 'text-purple-500 bg-purple-50' },
] as const

export default function FidelesClient({ 
  fideles, 
  userRole, 
  currentParoisseId,
  currentParoisseNom,
  paroisseStructure,
  anneeActuelleId,
  anneeActuelleLabel,
  anneesDisponibles,
  allRoles,
  anneeSelectionneeId
}: FidelesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Fonction pour extraire les informations de structure
  const getStructureInfo = () => {
    if (!paroisseStructure) return null
    
    const district = paroisseStructure.district
    const conference = district?.conference
    const region = conference?.region
    
    return {
      region: region?.nom || null,
      conference: conference?.nom || null,
      district: district?.nom || null,
      paroisse: paroisseStructure.nom
    }
  }

  const structureInfo = getStructureInfo()

  // États
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActif, setFilterActif] = useState<'all' | 'actif' | 'inactif'>('all')
  const [filterSexe, setFilterSexe] = useState<'all' | 'M' | 'F' | 'non_renseigne'>('all')
  const [filterType, setFilterType] = useState<'all' | 'enfant' | 'jeune' | 'adulte' | 'vieillard' | 'non_renseigne'>('all') // Nouveau filtre
  const [filterCompte, setFilterCompte] = useState<'all' | 'avec_compte' | 'sans_compte'>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [selectedAnnee, setSelectedAnnee] = useState<number | undefined>(anneeSelectionneeId)
  
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
    fidele_type: '', // Nouveau champ
    actif: true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Menu
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Gestion changement d'année
  const handleAnneeChange = (anneeConferenceId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (anneeConferenceId) {
      params.set('annee_conference', anneeConferenceId)
    } else {
      params.delete('annee_conference')
    }
    router.push(`/paroisse/fideles?${params.toString()}`)
  }

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

    // Nouveau filtre par type
    const matchesType = filterType === 'all' ||
      (filterType === 'non_renseigne' && !fidele.fidele_type) ||
      fidele.fidele_type === filterType

    const hasAccount = aUnCompte(fidele)
    const matchesCompte = filterCompte === 'all' ||
      (filterCompte === 'avec_compte' && hasAccount) ||
      (filterCompte === 'sans_compte' && !hasAccount)

    const roleNom = getRoleNom(fidele)
    const matchesRole = filterRole === 'all' || roleNom === filterRole
    
    return matchesSearch && matchesActif && matchesSexe && matchesType && matchesCompte && matchesRole
  })

  // Statistiques
  const stats = {
    total: filteredFideles.length,
    actifs: filteredFideles.filter(f => f.actif).length,
    inactifs: filteredFideles.filter(f => !f.actif).length,
    hommes: filteredFideles.filter(f => f.sexe === 'M').length,
    femmes: filteredFideles.filter(f => f.sexe === 'F').length,
    avecCompte: filteredFideles.filter(f => aUnCompte(f)).length,
    sansCompte: filteredFideles.filter(f => !aUnCompte(f)).length,
    // Statistiques par type
    enfants: filteredFideles.filter(f => f.fidele_type === 'enfant').length,
    jeunes: filteredFideles.filter(f => f.fidele_type === 'jeune').length,
    adultes: filteredFideles.filter(f => f.fidele_type === 'adulte').length,
    vieillards: filteredFideles.filter(f => f.fidele_type === 'vieillard').length,
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

  // Fonction pour obtenir les informations de type
  const getTypeInfo = (type: string | null) => {
    if (!type) return { label: 'Non renseigné', icon: Users, color: 'text-gray-400 bg-gray-50' }
    const typeInfo = FIDELE_TYPES.find(t => t.value === type)
    return typeInfo || { label: type, icon: Users, color: 'text-gray-400 bg-gray-50' }
  }

  const getRoleColor = (roleNom: string | null): string => {
    if (roleNom === 'admin') return 'bg-gray-100 text-gray-700'
    if (roleNom === 'gestion') return 'bg-blue-50 text-blue-600'
    return 'bg-gray-50 text-gray-500'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculer l'âge approximatif pour suggérer un type
  const getSuggestedType = (anneeNaissance: string): string => {
    if (!anneeNaissance) return ''
    const age = new Date().getFullYear() - parseInt(anneeNaissance)
    if (age <= 12) return 'enfant'
    if (age <= 25) return 'jeune'
    if (age <= 60) return 'adulte'
    return 'vieillard'
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
      fidele_type: fidele.fidele_type || '', // Nouveau champ
      actif: fidele.actif
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
    if (editFormData.fidele_type) {
      formData.append('fidele_type', editFormData.fidele_type) // Nouveau champ
    }
    formData.append('actif', editFormData.actif ? 'true' : 'false')
    if (currentParoisseId) {
      formData.append('paroisse_id', currentParoisseId.toString())
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

  const currentAnneeLabel = anneesDisponibles.find(a => a.id === selectedAnnee)?.label

  // Si aucun fidèle mais modal d'ajout fermé, afficher l'état vide
  if (fideles.length === 0 && !showAddModal) {
    return (
      <>
        <div className="border border-gray-200 py-16 text-center bg-white">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun fidèle pour cette période</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Ajouter un fidèle
          </button>
        </div>

        {/* Modal d'ajout */}
        {showAddModal && currentParoisseId && anneeActuelleId && (
          <AddFideleModal
            paroisseId={currentParoisseId}
            paroisseNom={currentParoisseNom || ''}
            anneeConferenceId={anneeActuelleId}
            anneeLabel={anneeActuelleLabel || currentAnneeLabel || ''}
            onClose={() => setShowAddModal(false)}
            onSuccess={handleAddSuccess}
          />
        )}
      </>
    )
  }

  return (
    <>
      {/* Sélecteur d'année de conférence */}
      {anneesDisponibles.length > 0 && (
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 border border-gray-200">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-sm text-gray-600">Année de conférence :</span>
          <select
            value={selectedAnnee || ''}
            onChange={(e) => handleAnneeChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:border-black bg-white"
          >
            {anneesDisponibles.map((annee) => (
              <option key={annee.id} value={annee.id}>
                {annee.label} {annee.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>
          {currentAnneeLabel && (
            <span className="text-xs text-gray-400">
              Affichage des fidèles pour {currentAnneeLabel}
            </span>
          )}
        </div>
      )}

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

          {/* Filtre sexe */}
          <select
            value={filterSexe}
            onChange={(e) => setFilterSexe(e.target.value as typeof filterSexe)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="all">Tous les sexes</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
            <option value="non_renseigne">Non renseigné</option>
          </select>

          {/* NOUVEAU : Filtre type de fidèle */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="all">Toutes les catégories</option>
            <option value="enfant">Enfants</option>
            <option value="jeune">Jeunes</option>
            <option value="adulte">Adultes</option>
            <option value="vieillard">Vieillards</option>
            <option value="non_renseigne">Non renseigné</option>
          </select>

          {/* Filtre compte */}
          <select
            value={filterCompte}
            onChange={(e) => setFilterCompte(e.target.value as typeof filterCompte)}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
          >
            <option value="all">Tous les comptes</option>
            <option value="avec_compte">Avec compte</option>
            <option value="sans_compte">Sans compte</option>
          </select>

          {/* Filtre rôle */}
          {filterCompte !== 'sans_compte' && allRoles.length > 0 && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
            >
              <option value="all">Tous les rôles</option>
              {allRoles.map((role) => (
                <option key={role.id} value={role.nom}>
                  {role.nom}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <ExportPDFButton 
            fideles={filteredFideles}
            filters={{
              anneeLabel: currentAnneeLabel || anneeActuelleLabel || 'En cours',
              paroisseNom: currentParoisseNom || null,
              filterActif,
              filterSexe,
              filterType // Ajout du filtre type dans l'export
            }}
            structureInfo={structureInfo} 
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            <Plus size={16} />
            Nouveau fidèle
          </button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-500">Actifs:</span>
          <span className="font-medium text-gray-700">{stats.actifs}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-gray-500">Inactifs:</span>
          <span className="font-medium text-gray-700">{stats.inactifs}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-blue-500">♂</span>
          <span className="text-gray-500">Hommes:</span>
          <span className="font-medium text-gray-700">{stats.hommes}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-pink-500">♀</span>
          <span className="text-gray-500">Femmes:</span>
          <span className="font-medium text-gray-700">{stats.femmes}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shield size={12} className="text-gray-400" />
          <span className="text-gray-500">Comptes:</span>
          <span className="font-medium text-gray-700">{stats.avecCompte}</span>
        </div>
        {/* Nouvelles stats par catégorie */}
        <div className="flex items-center gap-1.5">
          <Baby size={12} className="text-orange-400" />
          <span className="text-gray-500">Enfants:</span>
          <span className="font-medium text-gray-700">{stats.enfants}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <UserIcon size={12} className="text-green-400" />
          <span className="text-gray-500">Jeunes:</span>
          <span className="font-medium text-gray-700">{stats.jeunes}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Briefcase size={12} className="text-blue-400" />
          <span className="text-gray-500">Adultes:</span>
          <span className="font-medium text-gray-700">{stats.adultes}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Heart size={12} className="text-purple-400" />
          <span className="text-gray-500">Vieillards:</span>
          <span className="font-medium text-gray-700">{stats.vieillards}</span>
        </div>
      </div>

      {/* Liste des fidèles */}
      <div className="space-y-2">
        {filteredFideles.map((fidele) => {
          const age = getAge(fidele.annee_naissance)
          const hasAccount = aUnCompte(fidele)
          const roleNom = getRoleNom(fidele)
          const typeInfo = getTypeInfo(fidele.fidele_type)
          const TypeIcon = typeInfo.icon
          
          return (
            <div key={fidele.id} className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group">
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
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(fidele)} flex items-center justify-center`}>
                        <span className="text-base font-medium">{getInitials(fidele)}</span>
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium">
                        {fidele.nom} {fidele.post_nom} {fidele.prenom}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 border ${fidele.actif ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                        {fidele.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {/* Badge du type de fidèle */}
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${typeInfo.color}`}>
                        <TypeIcon size={12} />
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-gray-400">ID: {fidele.id}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Phone size={14} className="text-gray-400" />
                        <span>{fidele.contact}</span>
                      </div>
                      {fidele.adresse && (
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{fidele.adresse}</span>
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
                          <span className={`px-2 py-0.5 rounded-full ${getRoleColor(roleNom)}`}>
                            Rôle: {roleNom === 'admin' ? 'Administrateur' : roleNom === 'gestion' ? 'Gestionnaire' : roleNom || 'Utilisateur'}
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
                    href={`/paroisse/fideles/${fidele.id}`}
                    className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
                    title="Voir détails"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>

                  {!hasAccount && userRole === 'admin' && (
                    <button
                      onClick={() => handleCreerCompte(fidele)}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors"
                      title="Créer un compte"
                    >
                      <UserPlus size={18} />
                    </button>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === fidele.id ? null : fidele.id)}
                      className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {menuOpen === fidele.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[160px]">
                        <button
                          onClick={() => handleEditClick(fidele)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit size={14} /> Modifier
                        </button>
                        {userRole === 'admin' && (
                          <button
                            onClick={() => handleDelete(fidele.id)}
                            disabled={actionLoading === fidele.id}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            {actionLoading === fidele.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                            Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
      {showAddModal && currentParoisseId && anneeActuelleId && (
        <AddFideleModal
          paroisseId={currentParoisseId}
          paroisseNom={currentParoisseNom || ''}
          anneeConferenceId={anneeActuelleId}
          anneeLabel={anneeActuelleLabel || currentAnneeLabel || ''}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {/* Modal édition */}
      {showEditModal && editingFidele && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
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
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Post-nom</label>
                  <input
                    type="text"
                    value={editFormData.post_nom}
                    onChange={(e) => setEditFormData({ ...editFormData, post_nom: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Prénom *</label>
                <input
                  type="text"
                  value={editFormData.prenom}
                  onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact *</label>
                <input
                  type="tel"
                  value={editFormData.contact}
                  onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={editFormData.adresse}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Année naissance</label>
                  <input
                    type="number"
                    value={editFormData.annee_naissance}
                    onChange={(e) => {
                      const newAnnee = e.target.value
                      setEditFormData({ 
                        ...editFormData, 
                        annee_naissance: newAnnee,
                        // Suggérer automatiquement le type
                        fidele_type: getSuggestedType(newAnnee)
                      })
                    }}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                    placeholder="YYYY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sexe</label>
                  <select
                    value={editFormData.sexe}
                    onChange={(e) => setEditFormData({ ...editFormData, sexe: e.target.value })}
                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  >
                    <option value="">Non renseigné</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>

              {/* NOUVEAU : Champ type de fidèle dans l'édition */}
              <div>
                <label className="block text-sm font-medium mb-1">Catégorie</label>
                <select
                  value={editFormData.fidele_type}
                  onChange={(e) => setEditFormData({ ...editFormData, fidele_type: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black bg-white"
                >
                  <option value="">Non renseigné</option>
                  {FIDELE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {editFormData.annee_naissance && editFormData.fidele_type && (
                  <p className="text-xs text-gray-500 mt-1">
                    {editFormData.fidele_type === getSuggestedType(editFormData.annee_naissance) 
                      ? '✓ Catégorie cohérente avec l\'âge'
                      : '⚠️ Vérifiez la cohérence avec l\'âge'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.actif}
                    onChange={(e) => setEditFormData({ ...editFormData, actif: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Fidèle actif</span>
                </label>
              </div>
            </form>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleUpdateFidele}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
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