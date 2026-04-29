
// app/paroisse/activites/[id]/page.tsx
'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentFidele } from '@/actions/auth'
import { getActiviteById, updateActiviteStatut, deleteActivite, getActiviteFiles } from '@/actions/activite'
import { getUniteOrganisationById } from '@/actions/unite-organisation'
import { getDepartementByReferenceId } from '@/actions/departements'

// Types
interface ActiviteDetails {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  plan_action_id: number | null
  plan_action?: {
    id: number
    titre: string
  } | null
  unite_id: number
  created_at: string
  updated_at: string
  annee_conference?: {
    id: number
    annee?: {
      id: number
      label: string
    }
  }
}

interface UniteOrganisation {
  id: number
  nom: string
  reference_id: number
  reference_table: string
  id_niveau: number
  niveau: string
}

interface Departement {
  id: number
  nom: string
  type: string
  description: string | null
}

interface ActiviteFichier {
  id: number
  activite_id: number
  nom_fichier: string
  chemin_fichier: string
  type_fichier: string
}

const STATUT_CONFIG = {
  planifie: { 
    label: 'Planifiée', 
    color: 'blue', 
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: '📅',
    description: 'Cette activité est planifiée et en attente de réalisation'
  },
  en_cours: { 
    label: 'En cours', 
    color: 'yellow', 
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    icon: '⚡',
    description: 'Cette activité est actuellement en cours de réalisation'
  },
  termine: { 
    label: 'Terminée', 
    color: 'green', 
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    icon: '✅',
    description: 'Cette activité a été terminée avec succès'
  },
  annule: { 
    label: 'Annulée', 
    color: 'red', 
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '❌',
    description: 'Cette activité a été annulée'
  }
}

export default function ActivitePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [loading, setLoading] = useState(true)
  const [activite, setActivite] = useState<ActiviteDetails | null>(null)
  const [unite, setUnite] = useState<UniteOrganisation | null>(null)
  const [departement, setDepartement] = useState<Departement | null>(null)
  const [fichiers, setFichiers] = useState<ActiviteFichier[]>([])
  const [currentFidele, setCurrentFidele] = useState<any>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      
      // Vérifier l'authentification
      const fidele = await getCurrentFidele()
      if (!fidele) {
        router.push('/login')
        return
      }
      setCurrentFidele(fidele)

      // Charger l'activité avec getActiviteById
      const activiteData = await getActiviteById(parseInt(id))
      if (!activiteData) {
        console.error('Activité non trouvée')
        router.push('/paroisse/activites')
        return
      }
      setActivite(activiteData)

      // Charger l'unité d'organisation
      if (activiteData.unite_id) {
        const uniteData = await getUniteOrganisationById(activiteData.unite_id)
        setUnite(uniteData)

        // Charger le département si l'unité est liée à un département
        if (uniteData && uniteData.reference_table === 'departement') {
          const departementData = await getDepartementByReferenceId(uniteData.reference_id)
          setDepartement(departementData)
        }
      }

      // Charger les fichiers joints
      const fichiersData = await getActiviteFiles(parseInt(id))
      setFichiers(fichiersData)

      setLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatut: string) => {
    if (!activite) return
    
    setIsUpdating(true)
    try {
      const result = await updateActiviteStatut(activite.id, newStatut as any)
      if (result.success) {
        setActivite({ ...activite, statut: newStatut as any })
        setShowStatusMenu(false)
      } else {
        alert(result.error || 'Erreur lors de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!activite) return
    
    setIsDeleting(true)
    try {
      const result = await deleteActivite(activite.id)
      if (result.success) {
        router.push('/paroisse/activites')
      } else {
        alert(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatFileSize = (fileUrl: string) => {
    // Estimation basique basée sur l'extension
    const ext = fileUrl.split('.').pop()?.toLowerCase()
    const sizes: Record<string, string> = {
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'jpg': 'Image',
      'jpeg': 'Image',
      'png': 'Image',
      'gif': 'Image',
      'mp4': 'Vidéo',
      'mp3': 'Audio'
    }
    return sizes[ext || ''] || 'Fichier'
  }

  const getFileIcon = (type: string) => {
    const icons: Record<string, string> = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'gif': '🖼️',
      'mp4': '🎥',
      'mp3': '🎵'
    }
    return icons[type] || '📎'
  }

  const isPast = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  const getStatusOptions = () => {
    if (!activite) return []
    const options = []
    if (activite.statut !== 'planifie') options.push({ value: 'planifie', label: '📅 Planifiée' })
    if (activite.statut !== 'en_cours') options.push({ value: 'en_cours', label: '⚡ En cours' })
    if (activite.statut !== 'termine') options.push({ value: 'termine', label: '✅ Terminée' })
    if (activite.statut !== 'annule') options.push({ value: 'annule', label: '❌ Annulée' })
    return options
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!activite) {
    return null
  }

  const statut = STATUT_CONFIG[activite.statut]
  const isActivityPast = isPast(activite.date)
  const isEnRetard = isActivityPast && activite.statut !== 'termine' && activite.statut !== 'annule'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/paroisse" className="hover:text-gray-700">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/paroisse/activites" className="hover:text-gray-700">
          Activités
        </Link>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-md">{activite.titre}</span>
      </div>

      {/* En-tête avec titre et statut */}
      <div className={`${statut.bgColor} border ${statut.borderColor} rounded-lg p-6 mb-6`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {activite.titre}
            </h1>
            
            {/* Département et Unité */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {departement && (
                <div className="flex items-center gap-2 text-indigo-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">{departement.nom}</span>
                  {departement.type && (
                    <span className="text-xs text-indigo-400 ml-1">({departement.type})</span>
                  )}
                </div>
              )}
              {unite && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{unite.nom}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statut.bgColor} ${statut.textColor} text-sm font-medium`}>
              <span>{statut.icon}</span>
              <span>{statut.label}</span>
            </span>
            
            {/* Menu d'actions */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUpdating}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {showStatusMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowStatusMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    <div className="py-1">
                      {getStatusOptions().map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(opt.value)}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-gray-100 py-1">
                      <Link
                        href={`/paroisse/activites/${activite.id}/modifier`}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        ✏️ Modifier l'activité
                      </Link>
                      <button
                        onClick={() => {
                          setShowStatusMenu(false)
                          setShowDeleteConfirm(true)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🗑️ Supprimer l'activité
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">
          {statut.description}
        </p>
        
        {isEnRetard && (
          <div className="mt-3 flex items-center gap-2 text-orange-700 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Cette activité est en retard</span>
          </div>
        )}
      </div>

      {/* Informations principales */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de l'activité</h2>
        
        {/* Date et heure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">Date</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-900">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="font-medium capitalize">{formatDate(activite.date)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-500 mb-2">Heure</div>
            <div className="flex items-center gap-2 text-gray-900">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{activite.heure}</span>
            </div>
          </div>
        </div>

        {/* Année de conférence */}
        {activite.annee_conference?.annee && (
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">Année</div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-900">{activite.annee_conference.annee.label}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {activite.description ? (
          <div>
            <div className="text-sm text-gray-500 mb-2">Description</div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">
                {activite.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">Aucune description fournie</div>
        )}
      </div>

      {/* Fichiers joints */}
      {fichiers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Fichiers joints ({fichiers.length})
          </h2>
          <div className="space-y-2">
            {fichiers.map((fichier) => (
              <a
                key={fichier.id}
                href={fichier.chemin_fichier}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getFileIcon(fichier.type_fichier)}</span>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {fichier.nom_fichier}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(fichier.chemin_fichier)}
                    </div>
                  </div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Plan d'action lié */}
      {activite.plan_action && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan d'action associé</h2>
          <Link
            href={`/paroisse/departements/${departement?.id}/plans-action/${activite.plan_action.id}`}
            className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors group"
          >
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <div className="flex-1">
              <div className="font-medium text-indigo-900">{activite.plan_action.titre}</div>
              <div className="text-sm text-indigo-700">Voir le plan d'action complet</div>
            </div>
            <svg className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Métadonnées */}
      <div className="text-xs text-gray-400 flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Créée le {new Date(activite.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Modifiée le {new Date(activite.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirmer la suppression
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Supprimer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
