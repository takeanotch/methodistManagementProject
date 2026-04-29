


// // app/(app)/fideles/AddFideleModal.tsx
// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { X, Loader2, Calendar, MapPin, Phone, User, Building } from 'lucide-react'
// import { createFidele } from '@/actions/fidele'
// import toast from 'react-hot-toast'

// interface AddFideleModalProps {
//   paroisseId: number
//   paroisseNom: string
//   anneeConferenceId: number  // ✅ Changé de anneeId à anneeConferenceId
//   anneeLabel: string
//   onClose: () => void
//   onSuccess: () => void
// }

// export default function AddFideleModal({
//   paroisseId,
//   paroisseNom,
//   anneeConferenceId,  // ✅
//   anneeLabel,
//   onClose,
//   onSuccess
// }: AddFideleModalProps) {
//   const router = useRouter()
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [formData, setFormData] = useState({
//     nom: '',
//     post_nom: '',
//     prenom: '',
//     contact: '',
//     adresse: '',
//     annee_naissance: '',
//     sexe: '',
//     actif: true
//   })

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setIsSubmitting(true)

//     const submitFormData = new FormData()
//     submitFormData.append('nom', formData.nom)
//     submitFormData.append('post_nom', formData.post_nom)
//     submitFormData.append('prenom', formData.prenom)
//     submitFormData.append('contact', formData.contact)
//     submitFormData.append('adresse', formData.adresse)
//     if (formData.annee_naissance) {
//       submitFormData.append('annee_naissance', formData.annee_naissance)
//     }
//     if (formData.sexe) {
//       submitFormData.append('sexe', formData.sexe)
//     }
//     submitFormData.append('actif', formData.actif ? 'true' : 'false')
//     submitFormData.append('paroisse_id', paroisseId.toString())

//     // ✅ Passer anneeConferenceId à createFidele
//     const result = await createFidele(submitFormData, anneeConferenceId)

//     if (result.success) {
//       toast.success('Fidèle ajouté avec succès')
//       onSuccess()
//       onClose()
//     } else {
//       toast.error(result.error || 'Erreur lors de la création')
//     }

//     setIsSubmitting(false)
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
//         {/* Header */}
//         <div className="flex justify-between items-center p-4 border-b border-gray-200">
//           <div>
//             <h3 className="text-lg font-light">Nouveau fidèle</h3>
//             <p className="text-xs text-gray-400 mt-0.5">
//               Paroisse {paroisseNom}
//             </p>
//           </div>
//           <button onClick={onClose} className="text-gray-400 hover:text-black">
//             <X size={20} />
//           </button>
//         </div>

//         {/* Formulaire */}
//         <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
//           {/* Nom et Post-nom */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Nom <span className="text-red-400">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={formData.nom}
//                 onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
//                 className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                 placeholder="Ex: KABONGO"
//                 required
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Post-nom <span className="text-red-400">*</span>
//               </label>
//               <input
//                 type="text"
//                 value={formData.post_nom}
//                 onChange={(e) => setFormData({ ...formData, post_nom: e.target.value })}
//                 className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//                 placeholder="Ex: MBUYAMBA"
//                 required
//               />
//             </div>
//           </div>

//           {/* Prénom */}
//           <div>
//             <label className="block text-sm font-medium mb-1">
//               Prénom <span className="text-red-400">*</span>
//             </label>
//             <input
//               type="text"
//               value={formData.prenom}
//               onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
//               className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
//               placeholder="Ex: Jean"
//               required
//             />
//           </div>

//           {/* Contact */}
//           <div>
//             <label className="block text-sm font-medium mb-1">
//               Contact <span className="text-red-400">*</span>
//             </label>
//             <div className="relative">
//               <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//               <input
//                 type="tel"
//                 value={formData.contact}
//                 onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
//                 className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black"
//                 placeholder="Ex: +243 812 345 678"
//                 required
//               />
//             </div>
//           </div>

//           {/* Année naissance et Sexe */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Année naissance</label>
//               <div className="relative">
//                 <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <input
//                   type="number"
//                   value={formData.annee_naissance}
//                   onChange={(e) => setFormData({ ...formData, annee_naissance: e.target.value })}
//                   className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black"
//                   placeholder="YYYY"
//                   min="1900"
//                   max={new Date().getFullYear()}
//                 />
//               </div>
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Sexe</label>
//               <div className="relative">
//                 <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                 <select
//                   value={formData.sexe}
//                   onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
//                   className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black appearance-none bg-white"
//                 >
//                   <option value="">Non renseigné</option>
//                   <option value="M">Masculin</option>
//                   <option value="F">Féminin</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           {/* Adresse */}
//           <div>
//             <label className="block text-sm font-medium mb-1">Adresse</label>
//             <div className="relative">
//               <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
//               <textarea
//                 value={formData.adresse}
//                 onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
//                 className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black resize-none"
//                 rows={2}
//                 placeholder="Adresse complète..."
//               />
//             </div>
//           </div>

//           {/* Actif */}
//           <div>
//             <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 transition-colors">
//               <input
//                 type="checkbox"
//                 checked={formData.actif}
//                 onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
//                 className="rounded border-gray-300 w-4 h-4"
//               />
//               <span className="text-sm">Fidèle actif</span>
//             </label>
//           </div>

//           {/* Informations sur la paroisse et l'année de conférence */}
//           <div className="space-y-2 pt-2 border-t border-gray-100">
//             <div className="p-3 bg-gray-50 border border-gray-200 rounded">
//               <div className="flex items-center gap-2 text-xs text-gray-600">
//                 <Building size={14} className="text-gray-400" />
//                 <span>Paroisse : <strong className="text-gray-800">{paroisseNom}</strong></span>
//               </div>
//             </div>
//             <div className="p-3 bg-blue-50 border border-blue-200 rounded">
//               <div className="flex items-center gap-2 text-xs text-blue-700">
//                 <Calendar size={14} className="text-blue-500" />
//                 <span>Année de conférence : <strong className="text-blue-800">{anneeLabel}</strong></span>
//               </div>
//               <p className="text-xs text-blue-600 mt-1 ml-6">
//                 Le fidèle sera associé à cette année de conférence
//               </p>
//             </div>
//           </div>
//         </form>

//         {/* Footer */}
//         <div className="p-4 border-t border-gray-200 flex gap-3">
//           <button
//             type="button"
//             onClick={onClose}
//             className="flex-1 px-4 py-2 border border-gray-300 hover:border-black transition-colors"
//           >
//             Annuler
//           </button>
//           <button
//             type="button"
//             onClick={handleSubmit}
//             disabled={isSubmitting}
//             className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
//           >
//             {isSubmitting ? (
//               <>
//                 <Loader2 size={16} className="animate-spin" />
//                 Création...
//               </>
//             ) : (
//               'Créer le fidèle'
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }

// app/(app)/fideles/AddFideleModal.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Calendar, MapPin, Phone, User, Building, Users } from 'lucide-react'
import { createFidele } from '@/actions/fidele'
import toast from 'react-hot-toast'

interface AddFideleModalProps {
  paroisseId: number
  paroisseNom: string
  anneeConferenceId: number
  anneeLabel: string
  onClose: () => void
  onSuccess: () => void
}

// Types de fidèles avec leurs libellés
const FIDELE_TYPES = [
  { value: 'enfant', label: 'Enfant (0-12 ans)' },
  { value: 'jeune', label: 'Jeune (13-25 ans)' },
  { value: 'adulte', label: 'Adulte (26-60 ans)' },
  { value: 'vieillard', label: 'Vieillard (60+ ans)' },
] as const

export default function AddFideleModal({
  paroisseId,
  paroisseNom,
  anneeConferenceId,
  anneeLabel,
  onClose,
  onSuccess
}: AddFideleModalProps) {
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
    fidele_type: '', // Nouveau champ
    actif: true
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

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
    if (formData.fidele_type) {
      submitFormData.append('fidele_type', formData.fidele_type)
    }
    submitFormData.append('actif', formData.actif ? 'true' : 'false')
    submitFormData.append('paroisse_id', paroisseId.toString())

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

  // Calculer l'âge approximatif pour suggérer un type
  const getSuggestedType = (anneeNaissance: string): string => {
    if (!anneeNaissance) return ''
    const age = new Date().getFullYear() - parseInt(anneeNaissance)
    if (age <= 12) return 'enfant'
    if (age <= 25) return 'jeune'
    if (age <= 60) return 'adulte'
    return 'vieillard'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">Nouveau fidèle</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Paroisse {paroisseNom}
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
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
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
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
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
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
              placeholder="Ex: Jean"
              required
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Contact <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black"
                placeholder="Ex: +243 812 345 678"
                required
              />
            </div>
          </div>

          {/* Année naissance et Sexe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Année naissance</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  value={formData.annee_naissance}
                  onChange={(e) => {
                    const newAnnee = e.target.value
                    setFormData({ 
                      ...formData, 
                      annee_naissance: newAnnee,
                      // Suggérer automatiquement le type basé sur l'âge
                      fidele_type: getSuggestedType(newAnnee)
                    })
                  }}
                  className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black"
                  placeholder="YYYY"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sexe</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={formData.sexe}
                  onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
                  className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black appearance-none bg-white"
                >
                  <option value="">Non renseigné</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Type de fidèle - NOUVEAU CHAMP */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Catégorie <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={formData.fidele_type}
                onChange={(e) => setFormData({ ...formData, fidele_type: e.target.value })}
                className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black appearance-none bg-white"
                required
              >
                <option value="">Sélectionner une catégorie</option>
                {FIDELE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            {formData.annee_naissance && formData.fidele_type && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.fidele_type === getSuggestedType(formData.annee_naissance) 
                  ? '✓ Catégorie cohérente avec l\'âge'
                  : '⚠️ Vérifiez la cohérence avec l\'âge'}
              </p>
            )}
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium mb-1">Adresse</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
              <textarea
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                className="w-full border border-gray-300 pl-10 pr-3 py-2 focus:outline-none focus:border-black resize-none"
                rows={2}
                placeholder="Adresse complète..."
              />
            </div>
          </div>

          {/* Actif */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                className="rounded border-gray-300 w-4 h-4"
              />
              <span className="text-sm">Fidèle actif</span>
            </label>
          </div>

          {/* Informations sur la paroisse et l'année de conférence */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Building size={14} className="text-gray-400" />
                <span>Paroisse : <strong className="text-gray-800">{paroisseNom}</strong></span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Calendar size={14} className="text-blue-500" />
                <span>Année de conférence : <strong className="text-blue-800">{anneeLabel}</strong></span>
              </div>
              <p className="text-xs text-blue-600 mt-1 ml-6">
                Le fidèle sera associé à cette année de conférence
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 hover:border-black transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
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