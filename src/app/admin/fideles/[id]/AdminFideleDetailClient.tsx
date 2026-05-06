
// app/admin/fideles/[id]/AdminFideleDetailClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  MapPin,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Building,
  History,
  Shield,
  Users,
  Loader2,
  UserPlus,
  ChevronRight,
  Clock,
  ArrowRightLeft,
  Church,
  GraduationCap,
  Award,
  X
} from 'lucide-react'
import { deleteFidele, updateFidele } from '@/actions/fidele'
import { createPasteur } from '@/actions/pasteurs'
import CreerCompteModal from '../CreerCompteModal'
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
  updated_at: string
  annee_naissance: number | null
  actif: boolean
  sexe: string | null
  paroisse_id: number | null
  paroisse?: {
    id: number
    nom: string
  } | null
  compte?: {
    id: number
    role_id: number
    email?: string | null
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

interface HistoriqueParoisse {
  id: number
  fidele_id: number
  paroisse_id: number
  annee_conference_id: number
  created_at: string
  paroisse: {
    id: number
    nom: string
  }
  annee_conference: {
    id: number
    is_current: boolean
    annee: {
      id: number
      label: string
    }
  }
}

interface Pasteur {
  id: number
  fidele_id: number
  etude: 'master' | 'licence' | 'phd' | 'autre'
  est_actif: boolean
  created_at: string
  updated_at: string
  affectations?: any[]
}

interface Transfert {
  id: number
  type_transfert: 'paroisse' | 'temporaire'
  statut: 'en_attente' | 'accepte' | 'refuse' | 'annule'
  date_debut: string
  date_fin: string | null
  motif: string | null
  code_transfert: string | null
  created_at: string
  source?: {
    id: number
    nom: string
  }
  destination?: {
    id: number
    nom: string
  }
  annee_conference?: {
    id: number
    annee: {
      id: number
      label: string
    }
  }
}

interface AdminFideleDetailClientProps {
  fidele: Fidele
  historiqueParoisses: HistoriqueParoisse[]
  pasteur: Pasteur | null
  transferts: Transfert[]
  paroisses: Paroisse[] // Ajout de la liste des paroisses pour le modal d'édition
}

export default function AdminFideleDetailClient({
  fidele: initialFidele,
  historiqueParoisses,
  pasteur,
  transferts,
  paroisses
}: AdminFideleDetailClientProps) {
  const router = useRouter()
  
  // États locaux
  const [fidele, setFidele] = useState(initialFidele)
  const [showCompteModal, setShowCompteModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasteurModal, setShowPasteurModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [etude, setEtude] = useState<Pasteur['etude']>('master')
  const [isCreatingPasteur, setIsCreatingPasteur] = useState(false)
  
  // État du formulaire d'édition
  const [editFormData, setEditFormData] = useState({
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

  // Mettre à jour le fidèle quand les données changent
  useEffect(() => {
    setFidele(initialFidele)
    setEditFormData({
      nom: initialFidele.nom,
      post_nom: initialFidele.post_nom,
      prenom: initialFidele.prenom,
      contact: initialFidele.contact,
      adresse: initialFidele.adresse || '',
      annee_naissance: initialFidele.annee_naissance?.toString() || '',
      sexe: initialFidele.sexe || '',
      actif: initialFidele.actif,
      paroisse_id: initialFidele.paroisse_id?.toString() || ''
    })
  }, [initialFidele])

  const hasAccount = !!fidele.compte
  const age = fidele.annee_naissance
    ? new Date().getFullYear() - fidele.annee_naissance
    : null

  const getInitials = () => {
    return `${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}`.toUpperCase()
  }

  const getAvatarColor = () => {
    if (fidele.sexe === 'M') return 'from-blue-500 to-blue-600'
    if (fidele.sexe === 'F') return 'from-pink-500 to-pink-600'
    return 'from-gray-500 to-gray-600'
  }

  const getSexeLabel = (sexe: string | null) => {
    if (sexe === 'M') return 'Masculin'
    if (sexe === 'F') return 'Féminin'
    return 'Non renseigné'
  }

  const getStatutTransfertBadge = (statut: Transfert['statut']) => {
    const badges = {
      en_attente: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      accepte: 'bg-green-50 text-green-700 border-green-200',
      refuse: 'bg-red-50 text-red-700 border-red-200',
      annule: 'bg-gray-50 text-gray-500 border-gray-200'
    }
    const labels = {
      en_attente: 'En attente',
      accepte: 'Accepté',
      refuse: 'Refusé',
      annule: 'Annulé'
    }
    return (
      <span className={`text-xs px-2 py-0.5 -full border ${badges[statut]}`}>
        {labels[statut]}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  async function handleDelete() {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fidèle ? Cette action est irréversible.')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteFidele(fidele.id)

    if (result.success) {
      toast.success('Fidèle supprimé avec succès')
      router.push('/admin/fideles')
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }

    setIsDeleting(false)
  }

  async function handleToggleActif() {
    const formData = new FormData()
    formData.append('id', fidele.id.toString())
    formData.append('nom', fidele.nom)
    formData.append('post_nom', fidele.post_nom)
    formData.append('prenom', fidele.prenom)
    formData.append('contact', fidele.contact)
    formData.append('adresse', fidele.adresse || '')
    if (fidele.annee_naissance) {
      formData.append('annee_naissance', fidele.annee_naissance.toString())
    }
    if (fidele.sexe) {
      formData.append('sexe', fidele.sexe)
    }
    formData.append('actif', (!fidele.actif).toString())
    if (fidele.paroisse_id) {
      formData.append('paroisse_id', fidele.paroisse_id.toString())
    }

    const result = await updateFidele(formData)

    if (result.success) {
      toast.success(`Fidèle ${fidele.actif ? 'désactivé' : 'activé'} avec succès`)
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la modification')
    }
  }

  async function handleUpdateFidele(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('id', fidele.id.toString())
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

  async function handleCreatePasteur() {
    setIsCreatingPasteur(true)
    
    const formData = new FormData()
    formData.append('fidele_id', fidele.id.toString())
    formData.append('etude', etude)

    const result = await createPasteur(formData)

    if (result.success) {
      toast.success('Pasteur créé avec succès')
      setShowPasteurModal(false)
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur lors de la création du pasteur')
    }

    setIsCreatingPasteur(false)
  }

  // Paroisse sélectionnée pour l'affichage
  const paroisseSelectionnee = paroisses.find(p => p.id.toString() === editFormData.paroisse_id)

  return (
    <>
      {/* En-tête avec actions */}
      <div className="flex items-center -full justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/fideles"
            className="p-2 hover:bg-gray-100 -full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </Link>
          <h1 className="text-2xl font-light text-gray-900">
            Détails du fidèle
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleActif}
            className={`px-4 py-2 text-sm border -lg transition-colors flex items-center gap-2 ${
              fidele.actif
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}
          >
            {fidele.actif ? (
              <>
                <XCircle size={16} />
                Désactiver
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Activer
              </>
            )}
          </button>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 text-sm border border-gray-300 -lg hover:border-gray-400 transition-colors flex items-center gap-2"
          >
            <Edit size={16} />
            Modifier
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm border border-red-200 text-red-600 -lg hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            Supprimer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - Informations principales */}
        <div className="lg:col-span-1 space-y-6">
          {/* Carte d'identité */}
          <div className="bg-white -xl border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="mb-4">
                  {fidele.profile_img ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image
                        src={fidele.profile_img}
                        alt={`${fidele.nom} ${fidele.prenom}`}
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center`}>
                      <span className="text-3xl font-medium text-white">
                        {getInitials()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nom et statut */}
                <h2 className="text-xl font-medium text-gray-900 mb-1">
                  {fidele.nom} {fidele.post_nom} {fidele.prenom}
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    fidele.actif
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {fidele.actif ? 'Actif' : 'Inactif'}
                  </span>
                  {fidele.sexe && (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 -full">
                      {getSexeLabel(fidele.sexe)}
                    </span>
                  )}
                </div>

                {/* ID */}
                <p className="text-xs text-gray-400 mb-4">
                  ID: {fidele.id} • Inscrit le {formatDate(fidele.created_at)}
                </p>

                {/* Badge compte */}
                {hasAccount ? (
                  <div className="w-full p-3 bg-green-50 border border-green-200 -lg mb-4">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Compte actif</span>
                    </div>
                    {fidele.compte?.role && (
                      <p className="text-xs text-green-600 mt-1">
                        Rôle: {fidele.compte.role.nom}
                      </p>
                    )}
                    {fidele.compte?.email && (
                      <p className="text-xs text-green-600 mt-0.5">
                        {fidele.compte.email}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full p-3 bg-gray-50 border border-gray-200 -lg mb-4">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <XCircle size={16} />
                      <span className="text-sm">Aucun compte</span>
                    </div>
                    <button
                      onClick={() => setShowCompteModal(true)}
                      className="mt-2 w-full px-3 py-1.5 bg-black text-white text-sm -lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserPlus size={14} />
                      Créer un compte
                    </button>
                  </div>
                )}

                {/* Badge pasteur */}
                {pasteur ? (
                  <div className="w-full p-3 bg-purple-50 border border-purple-200 -lg">
                    <div className="flex items-center justify-center gap-2 text-purple-700">
                      <Award size={16} />
                      <span className="text-sm font-medium">Pasteur</span>
                    </div>
                    <p className="text-xs text-purple-600 mt-1 capitalize">
                      Niveau: {pasteur.etude}
                    </p>
                    <p className="text-xs text-purple-600 mt-0.5">
                      Depuis le {formatDate(pasteur.created_at)}
                    </p>
                  </div>
                ) : (
                  <div className="w-full p-3 bg-gray-50 border border-gray-200 -lg">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <GraduationCap size={16} />
                      <span className="text-sm">Non pasteur</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Informations de contact */}
            <div className="border-t border-gray-200 px-6 py-4 space-y-3">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Informations de contact
              </h3>
              
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-400" />
                <span className="text-gray-600">{fidele.contact}</span>
              </div>
              
              {fidele.adresse && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin size={16} className="text-gray-400 mt-0.5" />
                  <span className="text-gray-600">{fidele.adresse}</span>
                </div>
              )}
              
              {age && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-gray-600">
                    {age} ans 
                    {fidele.annee_naissance && (
                      <span className="text-gray-400 ml-1">
                        (né(e) en {fidele.annee_naissance})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Paroisse actuelle */}
            <div className="border-t border-gray-200 px-6 py-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Paroisse actuelle
              </h3>
              {fidele.paroisse ? (
                <div className="flex items-center gap-3">
                  <Church size={16} className="text-gray-400" />
                  <span className="text-gray-600">{fidele.paroisse.nom}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Aucune paroisse</p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne de droite - Historique et transferts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Historique des paroisses */}
          <div className="bg-white -xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <History size={18} className="text-gray-400" />
                <h3 className="font-medium text-gray-900">
                  Historique des paroisses
                </h3>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {historiqueParoisses.length > 0 ? (
                historiqueParoisses.map((hp) => (
                  <div key={hp.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {hp.paroisse.nom}
                          </span>
                          {hp.annee_conference?.is_current && (
                            <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 -full border border-green-200">
                              Actuelle
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Année: {hp.annee_conference?.annee?.label || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          Inscrit le {formatDate(hp.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <Building size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">
                    Aucun historique de paroisse
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Historique des transferts */}
          <div className="bg-white -xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <ArrowRightLeft size={18} className="text-gray-400" />
                <h3 className="font-medium text-gray-900">
                  Historique des transferts
                </h3>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {transferts.length > 0 ? (
                transferts.map((transfert) => (
                  <div key={transfert.id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatutTransfertBadge(transfert.statut)}
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 -full">
                            {transfert.type_transfert === 'paroisse' ? 'Transfert définitif' : 'Transfert temporaire'}
                          </span>
                          {transfert.code_transfert && (
                            <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 ">
                              Code: {transfert.code_transfert}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <span>{transfert.source?.nom || 'N/A'}</span>
                          <ChevronRight size={14} className="text-gray-400" />
                          <span>{transfert.destination?.nom || 'En attente'}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>
                              Début: {formatDate(transfert.date_debut)}
                            </span>
                          </div>
                          {transfert.date_fin && (
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              <span>
                                Fin: {formatDate(transfert.date_fin)}
                              </span>
                            </div>
                          )}
                          {transfert.annee_conference?.annee && (
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              <span>
                                Année: {transfert.annee_conference.annee.label}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {transfert.motif && (
                          <p className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 ">
                            Motif: {transfert.motif}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {formatDateTime(transfert.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <ArrowRightLeft size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">
                    Aucun transfert enregistré
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Informations système */}
          <div className="bg-white -xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-gray-400" />
                <h3 className="font-medium text-gray-900">
                  Informations système
                </h3>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID fidèle:</span>
                <span className="text-gray-900 font-mono">{fidele.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Créé le:</span>
                <span className="text-gray-900">{formatDateTime(fidele.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Dernière modification:</span>
                <span className="text-gray-900">{formatDateTime(fidele.updated_at)}</span>
              </div>
              {fidele.compte && (
                <div className="flex justify-between">
                  <span className="text-gray-500">ID compte:</span>
                  <span className="text-gray-900 font-mono">{fidele.compte.id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col -lg">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-light">
                  Modifier - {fidele.nom} {fidele.prenom}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Modifier les informations du fidèle
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleUpdateFidele} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Nom et Post-nom */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({ ...editFormData, nom: e.target.value })}
                    className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Post-nom <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.post_nom}
                    onChange={(e) => setEditFormData({ ...editFormData, post_nom: e.target.value })}
                    className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                    required
                  />
                </div>
              </div>

              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prénom <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.prenom}
                  onChange={(e) => setEditFormData({ ...editFormData, prenom: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={editFormData.contact}
                  onChange={(e) => setEditFormData({ ...editFormData, contact: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black"
                  required
                />
              </div>

              {/* Année naissance et Sexe */}
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

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <textarea
                  value={editFormData.adresse}
                  onChange={(e) => setEditFormData({ ...editFormData, adresse: e.target.value })}
                  className="w-full border border-gray-300 -lg px-3 py-2 focus:outline-none focus:border-black resize-none"
                  rows={2}
                  placeholder="Adresse complète..."
                />
              </div>

              {/* Paroisse */}
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

              {/* Actif */}
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

              {/* Informations sur la paroisse */}
              {paroisseSelectionnee && (
                <div className="p-3 bg-blue-50 border border-blue-200 -lg">
                  <div className="flex items-center gap-2 text-xs text-blue-700">
                    <Building size={14} />
                    <span>Paroisse sélectionnée : <strong>{paroisseSelectionnee.nom}</strong></span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1 ml-6">
                    Le fidèle sera associé à cette paroisse
                  </p>
                </div>
              )}
            </form>

            {/* Footer */}
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
                className="flex-1 px-4  py-2 bg-black text-white -lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Modification...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création compte */}
      {showCompteModal && (
        <CreerCompteModal
          fidele={fidele}
          onClose={() => setShowCompteModal(false)}
        />
      )}

      {/* Modal création pasteur */}
      {showPasteurModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">Créer un pasteur</h3>
              <button onClick={() => setShowPasteurModal(false)} className="text-gray-400 hover:text-black">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Niveau d'étude</label>
                <select
                  value={etude}
                  onChange={(e) => setEtude(e.target.value as Pasteur['etude'])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                >
                  <option value="master">Master</option>
                  <option value="licence">Licence</option>
                  <option value="phd">Doctorat (PhD)</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowPasteurModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-black transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePasteur}
                disabled={isCreatingPasteur}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isCreatingPasteur ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}