

// app/paroisse/departements/[id]/activites/[activiteId]/ActiviteDetailContent.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  Clock, 
  ChevronLeft,
  Edit,
  Trash2,
  Loader2,
  Upload,
  Download,
  X,
  CheckCircle,
  PlayCircle,
  XCircle,
  FileText
} from 'lucide-react'
import { updateActiviteStatut, deleteActivite, addFileToActivite, deleteActiviteFile } from '@/actions/activite'

interface ActiviteDetailContentProps {
  departementId: number
  departement: any
  activite: any
  fichiers: any[]
  budgetInfo: any
  canEdit: boolean
}

const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
  planifie: { 
    label: 'Planifié', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-50', 
    borderColor: 'border-blue-200',
    icon: '📅' 
  },
  en_cours: { 
    label: 'En cours', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-50', 
    borderColor: 'border-yellow-200',
    icon: '⚡' 
  },
  termine: { 
    label: 'Terminé', 
    color: 'text-green-700', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: '✅' 
  },
  annule: { 
    label: 'Annulé', 
    color: 'text-red-700', 
    bgColor: 'bg-red-50', 
    borderColor: 'border-red-200',
    icon: '❌' 
  }
}

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📅' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '⚡' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200', icon: '❌' }
]

export function ActiviteDetailContent({
  departementId,
  departement,
  activite,
  fichiers: initialFichiers,
  budgetInfo,
  canEdit
}: ActiviteDetailContentProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentStatut, setCurrentStatut] = useState(activite.statut)
  const [fichiers, setFichiers] = useState(initialFichiers)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const statutConfig = STATUT_CONFIG[currentStatut]

  const handleStatutChange = async (newStatut: string) => {
    if (!canEdit) return
    setIsUpdating(true)
    try {
      const result = await updateActiviteStatut(activite.id, newStatut as any)
      if (result.success) {
        setCurrentStatut(newStatut as any)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit) return
    
    setIsDeleting(true)
    try {
      const result = await deleteActivite(activite.id)
      if (result.success) {
        router.push(`/paroisse/departements/${departementId}/activites`)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
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
        // Recharger les fichiers
        const { getActiviteFiles } = await import('@/actions/activite')
        const updatedFiles = await getActiviteFiles(activite.id)
        setFichiers(updatedFiles)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const handleFileDelete = async (fichierId: number, fileUrl: string) => {
    if (!confirm('Supprimer ce fichier ?')) return
    
    try {
      const result = await deleteActiviteFile(fichierId, activite.id, fileUrl)
      if (result.success) {
        setFichiers(prev => prev.filter(f => f.id !== fichierId))
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  const isPast = new Date(activite.date) < new Date()
  const isToday = new Date(activite.date).toDateString() === new Date().toDateString()
  const isEnRetard = isPast && currentStatut !== 'termine' && currentStatut !== 'annule'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/paroisse/departements/${departementId}/activites`}
          className="text-gray-400 hover:text-black transition-colors"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link href="/paroisse/departements" className="hover:text-black">
            Départements
          </Link>
          <span>/</span>
          <Link href={`/paroisse/departements/${departementId}`} className="hover:text-black">
            {departement.nom}
          </Link>
          <span>/</span>
          <Link href={`/paroisse/departements/${departementId}/activites`} className="hover:text-black">
            Activités
          </Link>
          <span>/</span>
          <span className="text-black truncate max-w-md">{activite.titre}</span>
        </div>
      </div>

      {/* En-tête */}
      <div className={`border rounded-none p-6 mb-6 ${statutConfig.bgColor} ${statutConfig.borderColor}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-light tracking-wide mb-3">{activite.titre}</h1>
            {activite.plan_action && (
              <p className="text-sm text-gray-600">
                Plan d'action: {activite.plan_action.titre}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 border text-sm ${statutConfig.bgColor} ${statutConfig.color} ${statutConfig.borderColor}`}>
              <span>{statutConfig.icon}</span>
              <span>{statutConfig.label}</span>
            </span>
            
            {canEdit && (
              <div className="flex gap-1">
                <Link
                  href={`/paroisse/departements/${departementId}/activites/${activite.id}/modifier`}
                  className="p-2 text-gray-400 hover:text-black transition-colors"
                  title="Modifier"
                >
                  <Edit size={18} />
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {isEnRetard && (
          <div className="mt-3 flex items-center gap-2 text-orange-600 text-sm">
            <Clock size={14} />
            <span>Cette activité est en retard</span>
          </div>
        )}
      </div>

      {/* Détails */}
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-light mb-4">Détails de l'activité</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Date</div>
              <div className="text-sm">
                {formatDate(activite.date)}
                {isToday && <span className="text-gray-500 text-xs ml-2">(Aujourd'hui)</span>}
                {isPast && !isToday && <span className="text-orange-500 text-xs ml-2">(Passé)</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Heure</div>
              <div className="text-sm">{activite.heure}</div>
            </div>
          </div>
        </div>

        {activite.description ? (
          <div>
            <div className="text-xs text-gray-500 mb-2">Description</div>
            <div className="bg-gray-50 p-4 border border-gray-100">
              <p className="text-gray-700 whitespace-pre-wrap text-sm">
                {activite.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 italic text-sm">Aucune description fournie</div>
        )}
      </div>

      {/* Changement de statut */}
      {canEdit && (
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium mb-3">Changer le statut</h3>
          <div className="flex flex-wrap gap-2">
            {STATUTS.filter(s => s.value !== currentStatut).map((statut) => (
              <button
                key={statut.value}
                onClick={() => handleStatutChange(statut.value)}
                disabled={isUpdating}
                className={`px-4 py-2 border text-sm ${statut.color} hover:opacity-80 disabled:opacity-50`}
              >
                {isUpdating ? (
                  <Loader2 size={14} className="animate-spin inline mr-1" />
                ) : (
                  <span className="mr-1">{statut.icon}</span>
                )}
                {statut.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Budget associé */}
      {budgetInfo && (
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium mb-3">Budget du plan d'action</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs text-green-600 mb-1">Recettes</p>
              <p className="text-xl font-light text-green-700">{budgetInfo.recettes.toLocaleString()} FC</p>
            </div>
            <div className="border border-red-200 bg-red-50 p-4 text-center">
              <p className="text-xs text-red-600 mb-1">Dépenses</p>
              <p className="text-xl font-light text-red-700">{budgetInfo.depenses.toLocaleString()} FC</p>
            </div>
          </div>
        </div>
      )}

      {/* Fichiers joints */}
      <div className="bg-white border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">Fichiers joints ({fichiers.length})</h3>
          {canEdit && (
            <label className="cursor-pointer">
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
              <span className="flex items-center gap-2 text-sm text-gray-500 hover:text-black">
                {isUploading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Upload size={16} />
                )}
                Ajouter un fichier
              </span>
            </label>
          )}
        </div>

        {isUploading && (
          <div className="text-center py-8 text-gray-500">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" />
            <p className="text-sm">Upload en cours...</p>
          </div>
        )}

        {!isUploading && fichiers.length === 0 && (
          <div className="border border-gray-200 py-12 text-center bg-gray-50">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">Aucun fichier joint</p>
          </div>
        )}

        {!isUploading && fichiers.length > 0 && (
          <div className="space-y-2">
            {fichiers.map((fichier) => (
              <div key={fichier.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getFileIcon(fichier.type_fichier)}</span>
                  <div>
                    <p className="text-sm font-medium">{fichier.nom_fichier}</p>
                    <p className="text-xs text-gray-500 uppercase">{fichier.type_fichier}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={fichier.chemin_fichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                    title="Télécharger"
                  >
                    <Download size={16} />
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleFileDelete(fichier.id, fichier.chemin_fichier)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-500" />
                </div>
                <h3 className="text-lg font-light">Confirmer la suppression</h3>
              </div>
              <p className="text-gray-600 text-sm mb-6">
                Êtes-vous sûr de vouloir supprimer cette activité ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
                  disabled={isDeleting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Supprimer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}