// app/district/activites/[activiteId]/ActiviteDetailContent.tsx
'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  updateActiviteDistrict, 
  deleteActiviteDistrict, 
  addFileToActivite, 
  deleteActiviteFile 
} from '@/actions/activite-district'
import { 
  PiFilePdf, 
  PiImage, 
  PiMicrosoftWordLogo, 
  PiVideo,
  PiCalendar,
  PiClock,
  PiArrowLeft,
  PiPencilSimple,
  PiTrash,
  PiUpload,
  PiDownload,
  PiCheckCircle,
  PiXCircle,
  PiWarning,
  PiSpinner
} from 'react-icons/pi'

// Types
interface ActiviteDetailContentProps {
  chefInfo: {
    departement_id: number
    departement_nom: string
    district_id: number
    district_nom: string
  }
  activite: any
  fichiers: any[]
  budgetInfo: any
  canEdit: boolean
}

interface StatutConfig {
  label: string
  bgColor: string
  textColor: string
  borderColor: string
  hoverBgColor: string
  icon: React.ReactNode
}

// Composants d'icônes SVG optimisés
const IconCalendar = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
    />
  </svg>
)

const IconClock = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
    />
  </svg>
)

const IconEdit = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
    />
  </svg>
)

const IconDelete = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
    />
  </svg>
)

const IconArrowLeft = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M10 19l-7-7m0 0l7-7m-7 7h18" 
    />
  </svg>
)

const IconAdd = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 4v16m8-8H4" 
    />
  </svg>
)

const IconEmpty = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" 
    />
  </svg>
)

// Utilitaires de date
const formatDateLong = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const isToday = (date: string | Date): boolean => {
  return new Date(date).toDateString() === new Date().toDateString()
}

const isPast = (date: string | Date): boolean => {
  const dateObj = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dateObj.setHours(0, 0, 0, 0)
  return dateObj < today
}

// Configuration des statuts (classes Tailwind complètes)
const STATUT_CONFIG: Record<string, StatutConfig> = {
  planifie: { 
    label: 'Planifiée', 
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    hoverBgColor: 'hover:bg-blue-50',
    icon: <PiCalendar className="w-4 h-4" />
  },
  en_cours: { 
    label: 'En cours', 
    bgColor: 'bg-yellow-100', 
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    hoverBgColor: 'hover:bg-yellow-50',
    icon: <PiClock className="w-4 h-4" />
  },
  termine: { 
    label: 'Terminée', 
    bgColor: 'bg-green-100', 
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    hoverBgColor: 'hover:bg-green-50',
    icon: <PiCheckCircle className="w-4 h-4" />
  },
  annule: { 
    label: 'Annulée', 
    bgColor: 'bg-red-100', 
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    hoverBgColor: 'hover:bg-red-50',
    icon: <PiXCircle className="w-4 h-4" />
  }
}

// Composant Notification
const Notification = ({ 
  type, 
  message, 
  onClose 
}: { 
  type: 'success' | 'error' | 'warning'
  message: string
  onClose: () => void 
}) => {
  const configs = {
    success: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    error: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' }
  }
  
  const config = configs[type]
  
  return (
    <div className={`mb-4 p-4 -lg border ${config.bg} ${config.text} ${config.border} flex items-center justify-between`}>
      <div className="flex items-center gap-2">
        {type === 'success' && <PiCheckCircle className="w-5 h-5" />}
        {type === 'error' && <PiXCircle className="w-5 h-5" />}
        {type === 'warning' && <PiWarning className="w-5 h-5" />}
        <span className="text-sm">{message}</span>
      </div>
      <button onClick={onClose} className="hover:opacity-70">
        <PiXCircle className="w-4 h-4" />
      </button>
    </div>
  )
}

// Composant pour afficher un fichier
const FileListItem = ({ 
  fichier, 
  canEdit, 
  onDelete 
}: { 
  fichier: any
  canEdit: boolean
  onDelete: (id: number, url: string) => void 
}) => {
  const getFileIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    
    if (lowerType === 'pdf') {
      return (
        <div className="bg-red-500/10 p-2 -lg">
          <PiFilePdf className="text-red-600 text-xl" />
        </div>
      )
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(lowerType)) {
      return (
        <div className="bg-orange-500/10 p-2 -lg">
          <PiImage className="text-orange-500 text-xl" />
        </div>
      )
    }
    
    if (['doc', 'docx'].includes(lowerType)) {
      return (
        <div className="bg-blue-500/10 p-2 -lg">
          <PiMicrosoftWordLogo className="text-blue-600 text-xl" />
        </div>
      )
    }
    
    if (['mp4', 'avi', 'mov', 'wmv'].includes(lowerType)) {
      return (
        <div className="bg-green-500/10 p-2 -lg">
          <PiVideo className="text-green-600 text-xl" />
        </div>
      )
    }
    
    // Icône par défaut
    return (
      <div className="bg-gray-500/10 p-2 -lg">
        <PiFilePdf className="text-gray-600 text-xl" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 -lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        {getFileIcon(fichier.type_fichier)}
        <div>
          <p className="text-sm font-medium text-gray-900 truncate max-w-md">
            {fichier.nom_fichier}
          </p>
          <p className="text-xs text-gray-500">
            {fichier.type_fichier.toUpperCase()}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={fichier.chemin_fichier}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors -lg hover:bg-white"
          aria-label="Télécharger le fichier"
          download
        >
          <PiDownload className="w-4 h-4" />
        </a>
        {canEdit && (
          <button
            onClick={() => onDelete(fichier.id, fichier.chemin_fichier)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors -lg hover:bg-white"
            aria-label="Supprimer le fichier"
          >
            <PiTrash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Hook personnalisé pour la gestion des actions asynchrones
const useAsyncAction = () => {
  const [loading, setLoading] = useState(false)
  
  const execute = async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    setLoading(true)
    try {
      return await action()
    } finally {
      setLoading(false)
    }
  }
  
  return { execute, loading }
}

// Composant principal
export function ActiviteDetailContent({
  chefInfo,
  activite: initialActivite,
  fichiers: initialFichiers,
  budgetInfo,
  canEdit
}: ActiviteDetailContentProps) {
  const router = useRouter()
  const [activite, setActivite] = useState(initialActivite)
  const [fichiers, setFichiers] = useState(initialFichiers)
  const [currentStatut, setCurrentStatut] = useState(initialActivite.statut)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'warning'
    message: string
  } | null>(null)
  
  const { execute, loading: isUpdating } = useAsyncAction()
  const [isUploading, setIsUploading] = useState(false)

  const statutConfig = STATUT_CONFIG[currentStatut]
  const dateFormatee = useMemo(() => formatDateLong(activite.date), [activite.date])
  const estAujourdhui = useMemo(() => isToday(activite.date), [activite.date])
  const estPasse = useMemo(() => isPast(activite.date), [activite.date])

  const showNotification = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }, [])

  const handleStatutChange = async (newStatut: string) => {
    if (!canEdit) return
    if (newStatut === currentStatut) return
    
    const result = await execute(async () => {
      return await updateActiviteDistrict(
        activite.id,
        activite.titre,
        activite.description,
        activite.date,
        activite.heure,
        newStatut,
        activite.plan_action_id
      )
    })
    
    if (result?.success) {
      setCurrentStatut(newStatut as any)
      setActivite({ ...activite, statut: newStatut })
      showNotification('success', `Statut changé en "${STATUT_CONFIG[newStatut].label}" avec succès`)
    } else {
      showNotification('error', result?.error || 'Erreur lors du changement de statut')
    }
  }

  const handleDelete = async () => {
    if (!canEdit) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.')) return
    
    const result = await execute(() => deleteActiviteDistrict(activite.id))
    
    if (result?.success) {
      showNotification('success', 'Activité supprimée avec succès')
      setTimeout(() => router.push('/district/activites'), 1000)
    } else {
      showNotification('error', result?.error || 'Erreur lors de la suppression')
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const form = new FormData()
      form.append('activite_id', activite.id.toString())
      form.append('file', file)

      const result = await addFileToActivite(form)
      if (result.success) {
        showNotification('success', 'Fichier ajouté avec succès')
        router.refresh()
      } else {
        showNotification('error', result.error || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('error', 'Une erreur est survenue lors de l\'upload')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleFileDelete = async (fichierId: number, fileUrl: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return
    
    try {
      const result = await deleteActiviteFile(fichierId, activite.id, fileUrl)
      if (result.success) {
        setFichiers(fichiers.filter(f => f.id !== fichierId))
        showNotification('success', 'Fichier supprimé avec succès')
        router.refresh()
      } else {
        showNotification('error', result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      showNotification('error', 'Une erreur est survenue')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notifications */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Fil d'Ariane */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Fil d'Ariane">
        <Link href="/district" className="hover:text-gray-700 transition-colors">
          District
        </Link>
        <span className="text-gray-400">/</span>
        <Link href="/district/activites" className="hover:text-gray-700 transition-colors">
          Activités
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 truncate max-w-md" title={activite.titre}>
          {activite.titre}
        </span>
      </nav>

      {/* En-tête de l'activité */}
      <div className="bg-white -xl border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {activite.titre}
            </h1>
            {activite.plan_action && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 -full">
                <span className="text-xs font-medium text-gray-600">Plan d'action:</span>
                <span className="text-sm text-gray-900">{activite.plan_action.titre}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 -full text-sm font-medium ${statutConfig.bgColor} ${statutConfig.textColor}`}>
              {statutConfig.icon}
              <span>{statutConfig.label}</span>
            </span>
            
            {canEdit && (
              <div className="flex gap-1 bg-gray-50 -lg p-1">
                <Link
                  href={`/district/activites/${activite.id}/modifier`}
                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white -md transition-all"
                  aria-label="Modifier l'activité"
                  title="Modifier"
                >
                  <IconEdit className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isUpdating}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-white -md transition-all disabled:opacity-50"
                  aria-label="Supprimer l'activité"
                  title="Supprimer"
                >
                  <IconDelete className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Date et heure */}
        <div className="flex flex-wrap gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 -lg">
              <IconCalendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Date</p>
              <p className="font-medium">
                {dateFormatee}
                {estAujourdhui && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 -full text-xs font-medium bg-blue-100 text-blue-700">
                    Aujourd'hui
                  </span>
                )}
                {estPasse && !estAujourdhui && currentStatut !== 'termine' && currentStatut !== 'annule' && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 -full text-xs font-medium bg-orange-100 text-orange-700">
                    En retard
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 -lg">
              <IconClock className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Heure</p>
              <p className="font-medium">{activite.heure}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {activite.description && (
          <div className="mt-6 p-4 bg-gray-50 -lg border border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-indigo-500 -full"></span>
              Description
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
              {activite.description}
            </p>
          </div>
        )}
        
        {/* Commentaire si terminé */}
        {currentStatut === 'termine' && activite.commentaire && (
          <div className="mt-4 p-4 bg-green-50 -lg border border-green-200">
            <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
              <PiCheckCircle className="w-4 h-4" />
              Commentaire de clôture
            </h3>
            <p className="text-green-600 whitespace-pre-wrap text-sm">
              {activite.commentaire}
            </p>
          </div>
        )}
      </div>

      {/* Changement de statut */}
      {canEdit && (
        <div className="bg-white -xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 -full"></span>
            Changer le statut
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(STATUT_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleStatutChange(key)}
                disabled={isUpdating || key === currentStatut}
                className={`
                  flex items-center gap-2 px-4 py-2.5 -lg text-sm font-medium transition-all
                  ${key === currentStatut
                    ? `${config.bgColor} ${config.textColor} cursor-default`
                    : `bg-gray-100 text-gray-700 ${config.hoverBgColor} hover:${config.textColor} border border-transparent hover:border-current`
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isUpdating && key !== currentStatut ? (
                  <PiSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  config.icon
                )}
                {config.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Budget associé */}
      {budgetInfo && (
        <div className="bg-white -xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 -full"></span>
            Budget du plan d'action
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 -lg border border-green-200">
              <p className="text-xs text-green-600 mb-1 font-medium">RECETTES</p>
              <p className="text-2xl font-bold text-green-700">
                {budgetInfo.recettes.toLocaleString()} <span className="text-sm">FC</span>
              </p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 -lg border border-red-200">
              <p className="text-xs text-red-600 mb-1 font-medium">DÉPENSES</p>
              <p className="text-2xl font-bold text-red-700">
                {budgetInfo.depenses.toLocaleString()} <span className="text-sm">FC</span>
              </p>
            </div>
          </div>
          {budgetInfo.recettes > 0 && budgetInfo.depenses > 0 && (
            <div className="mt-4 p-3 bg-gray-50 -lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Solde</span>
                <span className={`text-lg font-bold ${budgetInfo.recettes >= budgetInfo.depenses ? 'text-green-600' : 'text-red-600'}`}>
                  {(budgetInfo.recettes - budgetInfo.depenses).toLocaleString()} FC
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fichiers joints */}
      <div className="bg-white -xl border border-gray-200 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-1 h-4 bg-indigo-500 -full"></span>
            Fichiers joints
            {fichiers.length > 0 && (
              <span className="text-xs text-gray-500 ml-2">({fichiers.length})</span>
            )}
          </h3>
          
          {canEdit && (
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-colors -lg border border-indigo-200">
              <IconAdd className="w-4 h-4" />
              Ajouter un fichier
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4"
              />
            </label>
          )}
        </div>

        {isUploading && (
          <div className="flex items-center justify-center py-8">
            <PiSpinner className="w-6 h-6 animate-spin text-indigo-600 mr-2" />
            <span className="text-gray-600">Upload en cours...</span>
          </div>
        )}

        {!isUploading && fichiers.length === 0 && (
          <div className="text-center py-12">
            <IconEmpty className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Aucun fichier joint</p>
            {canEdit && (
              <p className="text-sm text-gray-400">
                Cliquez sur "Ajouter un fichier" pour joindre des documents
              </p>
            )}
          </div>
        )}

        {!isUploading && fichiers.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {fichiers.map((fichier) => (
              <FileListItem
                key={fichier.id}
                fichier={fichier}
                canEdit={canEdit}
                onDelete={handleFileDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Métadonnées */}
      <div className="mt-6 text-xs text-gray-400 flex justify-between items-center">
        <div>
          Créée le {new Date(activite.created_at).toLocaleDateString('fr-FR')}
          {activite.updated_at !== activite.created_at && (
            <> · Modifiée le {new Date(activite.updated_at).toLocaleDateString('fr-FR')}</>
          )}
        </div>
        <div>
          District de {chefInfo.district_nom} · {chefInfo.departement_nom}
        </div>
      </div>

      {/* Boutons de navigation */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
        <Link
          href="/district/activites"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 -lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <IconArrowLeft className="w-4 h-4" />
          Retour aux activités
        </Link>
        
        {canEdit && (
          <Link
            href={`/district/activites/${activite.id}/modifier`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white -lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <IconEdit className="w-4 h-4" />
            Modifier l'activité
          </Link>
        )}
      </div>
    </div>
  )
}