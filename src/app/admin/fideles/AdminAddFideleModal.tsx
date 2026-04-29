
// app/admin/fideles/AdminAddFideleModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Calendar, Building } from 'lucide-react'
import { createFidele } from '@/actions/fidele'
import { getCurrentAnneeConference, getConferenceIdByParoisse } from '@/actions/annee-conference'
import toast from 'react-hot-toast'

interface Paroisse {
  id: number
  nom: string
}

interface AdminAddFideleModalProps {
  paroisses: Paroisse[]
  onClose: () => void
  onSuccess: () => void
}

export default function AdminAddFideleModal({
  paroisses,
  onClose,
  onSuccess
}: AdminAddFideleModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    // ✅ Récupérer l'année de conférence active de la paroisse sélectionnée
    let anneeConferenceId: number | undefined = undefined
    
    if (formData.paroisse_id) {
      try {
        const paroisseId = parseInt(formData.paroisse_id)
        const conferenceId = await getConferenceIdByParoisse(paroisseId)
        
        if (conferenceId) {
          const currentAnneeConf = await getCurrentAnneeConference(conferenceId)
          anneeConferenceId = currentAnneeConf?.id
          
          if (!anneeConferenceId) {
            console.warn('⚠️ Aucune année de conférence active trouvée pour cette paroisse')
          }
        } else {
          console.warn('⚠️ Aucune conférence trouvée pour cette paroisse')
        }
      } catch (error) {
        console.error('❌ Erreur lors de la récupération de l\'année de conférence:', error)
      }
    }
    
    const submitFormData = new FormData()
    submitFormData.append('nom', formData.nom)
    submitFormData.append('post_nom', formData.post_nom)
    submitFormData.append('prenom', formData.prenom)
    submitFormData.append('contact', formData.contact)
    submitFormData.append('adresse', formData.adresse)
    if (formData.annee_naissance) {
      submitFormData.append('annee_naissance', formData.annee_naissance)
    }
    if (formData.sexe) {
      submitFormData.append('sexe', formData.sexe)
    }
    submitFormData.append('actif', formData.actif ? 'true' : 'false')
    if (formData.paroisse_id) {
      submitFormData.append('paroisse_id', formData.paroisse_id)
    }

    // ✅ Passer anneeConferenceId à createFidele
    const result = await createFidele(submitFormData, anneeConferenceId)

    if (result.success) {
      toast.success('Fidèle ajouté avec succès')
      onSuccess()
      onClose()
    } else {
      toast.error(result.error || 'Erreur lors de la création')
    }

    setIsSubmitting(false)
  }

  const paroisseSelectionnee = paroisses.find(p => p.id.toString() === formData.paroisse_id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">Nouveau fidèle</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Ajouter un membre à la base de données
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Nom et Post-nom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Nom <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                placeholder="Ex: KABONGO"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Post-nom <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.post_nom}
                onChange={(e) => setFormData({ ...formData, post_nom: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                placeholder="Ex: MBUYAMBA"
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
              value={formData.prenom}
              onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
              placeholder="Ex: Jean"
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
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
              placeholder="Ex: +243 812 345 678"
              required
            />
          </div>

          {/* Année naissance et Sexe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Année naissance</label>
              <input
                type="number"
                value={formData.annee_naissance}
                onChange={(e) => setFormData({ ...formData, annee_naissance: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
                placeholder="YYYY"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sexe</label>
              <select
                value={formData.sexe}
                onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
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
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black resize-none"
              rows={2}
              placeholder="Adresse complète..."
            />
          </div>

          {/* Paroisse */}
          <div>
            <label className="block text-sm font-medium mb-1">Paroisse</label>
            <select
              value={formData.paroisse_id}
              onChange={(e) => setFormData({ ...formData, paroisse_id: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-black"
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
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Fidèle actif</span>
            </label>
          </div>

          {/* Informations sur la paroisse */}
          {paroisseSelectionnee && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Building size={14} />
                <span>Paroisse sélectionnée : <strong>{paroisseSelectionnee.nom}</strong></span>
              </div>
              <p className="text-xs text-blue-600 mt-1 ml-6">
                Le fidèle sera associé à l'année de conférence active de cette paroisse
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-black transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Création...
              </>
            ) : (
              'Créer le fidèle'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}