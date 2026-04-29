
// components/ActiviteFiles.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Trash2, Download, X, Loader2, File as FileIcon } from 'lucide-react'
import { PiMicrosoftExcelLogoFill, PiFilePdfFill, PiFileDocFill, PiFileImageFill, PiFileTxtFill, PiFileZipFill, PiFileVideoFill, PiFileAudioFill } from "react-icons/pi"
import toast from 'react-hot-toast'

interface ActiviteFichier {
  id: number
  activite_id: number
  nom_fichier: string
  chemin_fichier: string
  type_fichier: string
}

interface ActiviteFilesProps {
  activiteId: number
  files: ActiviteFichier[]
  canEdit?: boolean
  planActionId?: number
  departementId?: number
}

export default function ActiviteFiles({ 
  activiteId, 
  files: initialFiles, 
  canEdit = true,
  planActionId,
  departementId
}: ActiviteFilesProps) {
  const router = useRouter()
  const [files, setFiles] = useState<ActiviteFichier[]>(initialFiles)
  const [isUploading, setIsUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [fileName, setFileName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (type: string, fileName?: string) => {
    const ext = type.toLowerCase()
    const name = fileName?.toLowerCase() || ''
    
    // Excel
    if (ext === 'xls' || ext === 'xlsx' || name.endsWith('.xls') || name.endsWith('.xlsx')) {
      return <PiMicrosoftExcelLogoFill className="w-5 h-5 text-green-600" />
    }
    // PDF
    if (ext === 'pdf' || name.endsWith('.pdf')) {
      return <PiFilePdfFill className="w-5 h-5 text-red-500" />
    }
    // Word
    if (ext === 'doc' || ext === 'docx' || name.endsWith('.doc') || name.endsWith('.docx')) {
      return <PiFileDocFill className="w-5 h-5 text-blue-600" />
    }
    // Images
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'webp' || 
        name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')) {
      return <PiFileImageFill className="w-5 h-5 text-purple-500" />
    }
    // Vidéos
    if (ext === 'mp4' || ext === 'avi' || ext === 'mov' || ext === 'wmv' || ext === 'mkv' ||
        name.endsWith('.mp4') || name.endsWith('.avi') || name.endsWith('.mov')) {
      return <PiFileVideoFill className="w-5 h-5 text-orange-500" />
    }
    // Audio
    if (ext === 'mp3' || ext === 'wav' || ext === 'ogg' || ext === 'flac' ||
        name.endsWith('.mp3') || name.endsWith('.wav')) {
      return <PiFileAudioFill className="w-5 h-5 text-yellow-500" />
    }
    // Texte
    if (ext === 'txt' || ext === 'md' || name.endsWith('.txt')) {
      return <PiFileTxtFill className="w-5 h-5 text-gray-500" />
    }
    // ZIP/Archive
    if (ext === 'zip' || ext === 'rar' || ext === '7z' || name.endsWith('.zip')) {
      return <PiFileZipFill className="w-5 h-5 text-gray-600" />
    }
    // Default
    return <FileIcon className="w-5 h-5 text-gray-500" />
  }

  const getFileColor = (type: string, fileName?: string) => {
    const ext = type.toLowerCase()
    const name = fileName?.toLowerCase() || ''
    
    if (ext === 'xls' || ext === 'xlsx' || name.endsWith('.xls') || name.endsWith('.xlsx')) return 'text-green-600'
    if (ext === 'pdf' || name.endsWith('.pdf')) return 'text-red-500'
    if (ext === 'doc' || ext === 'docx' || name.endsWith('.doc') || name.endsWith('.docx')) return 'text-blue-600'
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || name.endsWith('.jpg')) return 'text-purple-500'
    if (ext === 'mp4' || ext === 'avi' || name.endsWith('.mp4')) return 'text-orange-500'
    if (ext === 'mp3' || ext === 'wav' || name.endsWith('.mp3')) return 'text-yellow-500'
    return 'text-gray-500'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Extraire le nom sans extension
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    setSelectedFile(file)
    setFileName(nameWithoutExt)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Aucun fichier sélectionné')
      return
    }

    if (!fileName.trim()) {
      toast.error('Veuillez saisir un nom pour le fichier')
      return
    }

    setIsUploading(true)
    
    try {
      // Récupérer l'extension originale
      const originalExt = selectedFile.name.split('.').pop()
      // Créer un nouveau nom de fichier avec l'extension originale
      const newFileName = `${fileName.trim()}.${originalExt}`
      
      // Créer un nouveau File object avec le nouveau nom
      const renamedFile = new File([selectedFile], newFileName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      })

      const formData = new FormData()
      formData.append('activite_id', activiteId.toString())
      formData.append('file', renamedFile)

      const { addFileToActivite } = await import('@/actions/activite')
      const result = await addFileToActivite(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Fichier ajouté avec succès')
        setFiles([...files, result.fichier])
        router.refresh()
        // Réinitialiser
        setSelectedFile(null)
        setFileName('')
        setShowModal(false)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur lors de l\'upload')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleCancelUpload = () => {
    setSelectedFile(null)
    setFileName('')
    setShowModal(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async (file: ActiviteFichier) => {
    if (!confirm(`Supprimer le fichier "${file.nom_fichier}" ?`)) return

    try {
      const { deleteActiviteFile } = await import('@/actions/activite')
      const result = await deleteActiviteFile(file.id, activiteId, file.chemin_fichier)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Fichier supprimé')
        setFiles(files.filter(f => f.id !== file.id))
        router.refresh()
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleDownload = (file: ActiviteFichier) => {
    window.open(file.chemin_fichier, '_blank')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-700">
          Fichiers joints
          <span className="ml-2 text-xs text-gray-500">({files.length})</span>
        </h3>
        {canEdit && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <FileIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun fichier joint</p>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
            >
              + Ajouter un fichier
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(file.type_fichier, file.nom_fichier)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${getFileColor(file.type_fichier, file.nom_fichier)}`}>
                    {file.nom_fichier}
                  </p>
                  <p className="text-xs text-gray-400 uppercase">
                    {file.type_fichier}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(file)}
                  className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteFile(file)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'upload avec renommage */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancelUpload}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Ajouter un fichier</h3>
              <button onClick={handleCancelUpload} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {!selectedFile ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-300 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Cliquez pour sélectionner un fichier
                  </p>
                  <p className="text-xs text-gray-400">
                    PDF, JPG, PNG, DOC, XLS, MP4, MP3... (max 10 Mo)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt,.md,.mp4,.avi,.mov,.mp3,.wav,.zip"
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
                  >
                    Choisir un fichier
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {getFileIcon(selectedFile.name.split('.').pop() || '', selectedFile.name)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du fichier
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Entrez un nom pour le fichier"
                      autoFocus
                    />
                    <span className="px-3 py-2 text-gray-500 bg-gray-100 rounded-lg">
                      .{selectedFile.name.split('.').pop()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleCancelUpload}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || !fileName.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Upload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Uploader
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}