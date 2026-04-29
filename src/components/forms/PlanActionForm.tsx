// // // components/forms/PlanActionForm.tsx
// // 'use client'

// // import { useState } from 'react'
// // import { useRouter } from 'next/navigation'
// // import toast from 'react-hot-toast'

// // interface PlanActionFormProps {
// //   uniteId: number
// //   anneeConferenceId: number
// //   onSuccess?: () => void
// //   initialData?: {
// //     id: number
// //     titre: string
// //     description?: string | null
// //   }
// // }

// // // Type guard pour vérifier si c'est un résultat de création
// // function isCreatePlanActionResult(result: any): result is { success: true; plan: any; error?: undefined } {
// //   return result && result.success === true && result.plan !== undefined
// // }

// // // Type guard pour vérifier si c'est un résultat de modification
// // function isUpdatePlanActionResult(result: any): result is { success: true; error?: undefined } {
// //   return result && result.success === true && result.plan === undefined
// // }

// // // Type guard pour vérifier s'il y a une erreur
// // function hasError(result: any): result is { error: string } {
// //   return result && result.error !== undefined
// // }

// // export default function PlanActionForm({ 
// //   uniteId, 
// //   anneeConferenceId, 
// //   onSuccess,
// //   initialData 
// // }: PlanActionFormProps) {
// //   const router = useRouter()
// //   const [loading, setLoading] = useState(false)
// //   const [titre, setTitre] = useState(initialData?.titre || '')
// //   const [description, setDescription] = useState(initialData?.description || '')

// //   const handleSubmit = async (e: React.FormEvent) => {
// //     e.preventDefault()
// //     setLoading(true)

// //     try {
// //       const formData = new FormData()
// //       formData.append('titre', titre)
// //       formData.append('description', description)
// //       formData.append('unite_id', uniteId.toString())
// //       formData.append('annee_conference_id', anneeConferenceId.toString())

// //       if (initialData?.id) {
// //         // Mode modification
// //         formData.append('id', initialData.id.toString())
// //         const { updatePlanAction } = await import('@/actions/plan-action')
// //         const result = await updatePlanAction(formData)
        
// //         if (hasError(result)) {
// //           toast.error(result.error)
// //         } else if (isUpdatePlanActionResult(result)) {
// //           toast.success('Plan d\'action modifié')
// //           if (onSuccess) {
// //             onSuccess()
// //           } else {
// //             router.push(`/plans-action/${initialData.id}`)
// //             router.refresh()
// //           }
// //         }
// //       } else {
// //         // Mode création
// //         const { createPlanAction } = await import('@/actions/plan-action')
// //         const result = await createPlanAction(formData)
        
// //         if (hasError(result)) {
// //           toast.error(result.error)
// //         } else if (isCreatePlanActionResult(result)) {
// //           toast.success('Plan d\'action créé')
// //           if (onSuccess) {
// //             onSuccess()
// //           } else if (result.plan) {
// //             router.push(`/plans-action/${result.plan.id}`)
// //             router.refresh()
// //           }
// //         }
// //       }
// //     } catch (error) {
// //       console.error('Erreur lors de la soumission:', error)
// //       toast.error('Une erreur est survenue')
// //     } finally {
// //       setLoading(false)
// //     }
// //   }

// //   return (
// //     <form onSubmit={handleSubmit} className="space-y-6">
// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-2">
// //           Titre <span className="text-red-500">*</span>
// //         </label>
// //         <input
// //           type="text"
// //           value={titre}
// //           onChange={(e) => setTitre(e.target.value)}
// //           required
// //           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
// //           placeholder="Ex: Plan d'action 2024"
// //         />
// //       </div>

// //       <div>
// //         <label className="block text-sm font-medium text-gray-700 mb-2">
// //           Description
// //         </label>
// //         <textarea
// //           value={description}
// //           onChange={(e) => setDescription(e.target.value)}
// //           rows={4}
// //           className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
// //           placeholder="Décrivez les objectifs de ce plan d'action..."
// //         />
// //       </div>

// //       <div className="flex gap-3">
// //         <button
// //           type="submit"
// //           disabled={loading}
// //           className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
// //         >
// //           {loading ? 'Enregistrement...' : (initialData ? 'Modifier' : 'Créer')}
// //         </button>
// //         <button
// //           type="button"
// //           onClick={() => router.back()}
// //           className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
// //         >
// //           Annuler
// //         </button>
// //       </div>
// //     </form>
// //   )
// // }

// // components/forms/PlanActionForm.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { createPlanActionForDepartement, updatePlanActionDepartement } from '@/actions/plan-action-departement'
// import { getAnneesConferenceByConference } from '@/actions/annee-conference'
// import { getConferenceFromParoisse } from '@/actions/structures'

// interface AnneeConference {
//   id: number
//   annee_id: number
//   conference_id: number
//   is_current: boolean
//   annee?: {
//     id: number
//     label: string
//   }
// }

// interface PlanActionFormProps {
//   departementId: number
//   paroisseId: number
//   plan?: {
//     id: number
//     titre: string
//     description: string | null
//     annee_conference_id: number
//   } | null
//   onSuccess?: () => void
//   onCancel?: () => void
// }

// export function PlanActionForm({ departementId, paroisseId, plan, onSuccess, onCancel }: PlanActionFormProps) {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [annees, setAnnees] = useState<AnneeConference[]>([])
//   const [formData, setFormData] = useState({
//     titre: plan?.titre || '',
//     description: plan?.description || '',
//     annee_conference_id: plan?.annee_conference_id?.toString() || ''
//   })

//   const isEditing = !!plan

//   useEffect(() => {
//     async function loadAnnees() {
//       const conferenceId = await getConferenceFromParoisse(paroisseId)
//       if (conferenceId) {
//         const anneesData = await getAnneesConferenceByConference(conferenceId)
//         setAnnees(anneesData)
        
//         if (!isEditing) {
//           const currentAnnee = anneesData.find(a => a.is_current)
//           if (currentAnnee) {
//             setFormData(prev => ({ ...prev, annee_conference_id: currentAnnee.id.toString() }))
//           } else if (anneesData.length > 0) {
//             setFormData(prev => ({ ...prev, annee_conference_id: anneesData[0].id.toString() }))
//           }
//         }
//       }
//     }
//     loadAnnees()
//   }, [paroisseId, isEditing])

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     setLoading(true)
//     setError(null)

//     if (!formData.annee_conference_id) {
//       setError('Veuillez sélectionner une année')
//       setLoading(false)
//       return
//     }

//     if (!formData.titre.trim()) {
//       setError('Le titre est requis')
//       setLoading(false)
//       return
//     }

//     let result
//     if (isEditing && plan) {
//       result = await updatePlanActionDepartement(
//         plan.id,
//         departementId,
//         paroisseId,
//         formData.titre,
//         formData.description || null
//       )
//     } else {
//       result = await createPlanActionForDepartement(
//         departementId,
//         paroisseId,
//         formData.titre,
//         formData.description || null
//       )
//     }

//     if (result.error) {
//       setError(result.error)
//     } else {
//       router.refresh()
//       onSuccess?.()
//     }

//     setLoading(false)
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-5">
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Titre <span className="text-red-500">*</span>
//         </label>
//         <input
//           type="text"
//           value={formData.titre}
//           onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
//           placeholder="Ex: Plan d'action 2024"
//           required
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Description
//         </label>
//         <textarea
//           value={formData.description}
//           onChange={(e) => setFormData({ ...formData, description: e.target.value })}
//           rows={4}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
//           placeholder="Décrivez les objectifs et le contenu du plan d'action..."
//         />
//       </div>

//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Année <span className="text-red-500">*</span>
//         </label>
//         <select
//           value={formData.annee_conference_id}
//           onChange={(e) => setFormData({ ...formData, annee_conference_id: e.target.value })}
//           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
//           required
//           disabled={isEditing}
//         >
//           <option value="">Sélectionner une année</option>
//           {annees.map((annee) => (
//             <option key={annee.id} value={annee.id}>
//               {annee.annee?.label || `Année ${annee.annee_id}`} {annee.is_current ? '(En cours)' : ''}
//             </option>
//           ))}
//         </select>
//         {isEditing && (
//           <p className="text-xs text-gray-500 mt-1">L'année ne peut pas être modifiée après création</p>
//         )}
//       </div>

//       {error && (
//         <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//           <p className="text-sm text-red-700">{error}</p>
//         </div>
//       )}

//       <div className="flex justify-end gap-3 pt-2">
//         <button
//           type="button"
//           onClick={onCancel}
//           className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//         >
//           Annuler
//         </button>
//         <button
//           type="submit"
//           disabled={loading}
//           className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//         >
//           {loading ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Créer'}
//         </button>
//       </div>
//     </form>
//   )
// }

// components/cards/PlanActionCard.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { deletePlanActionDepartement } from '@/actions/plan-action-departement'
import { getCurrentFidele } from '@/actions/auth'

interface PlanActionCardProps {
  plan: {
    id: number
    titre: string
    description: string | null
    created_at: string
    updated_at: string
    annee_conference_id: number
    annee_conference?: {
      annee?: {
        label: string
      }
    }
  }
  departementId: number
  canEdit?: boolean
  onDelete?: () => void
}

export default function PlanActionCard({ plan, departementId, canEdit = false, onDelete }: PlanActionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const currentFidele = await getCurrentFidele()
      if (!currentFidele) {
        alert('Vous devez être connecté')
        return
      }

      const result = await deletePlanActionDepartement(plan.id, departementId, currentFidele.paroisse_id)
      if (result.success) {
        onDelete?.()
      } else {
        alert(result.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  const anneeLabel = plan.annee_conference?.annee?.label || 'Année inconnue'

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all group">
      <Link href={`/paroisse/departements/${departementId}/plans-action/${plan.id}`}>
        <div className="p-6">
          {/* Badge année */}
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {anneeLabel}
            </span>
          </div>

          {/* Titre */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {plan.titre}
          </h3>

          {/* Description */}
          {plan.description && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-4">
              {plan.description}
            </p>
          )}

          {/* Date de création */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}
            </span>
            <span className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
              Voir détails
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {/* Actions */}
      {canEdit && (
        <div className="border-t border-gray-100 px-6 py-3 flex justify-end gap-3">
          <Link
            href={`/paroisse/departements/${departementId}/plans-action/${plan.id}/modifier`}
            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </Link>
          
          {showConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Confirmer ?</span>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Oui
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowConfirm(false)
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowConfirm(true)
              }}
              disabled={isDeleting}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}