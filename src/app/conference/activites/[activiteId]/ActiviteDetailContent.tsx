// // app/conference/activites/[activiteId]/ActiviteDetailContent.tsx
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { useRouter } from 'next/navigation'
// import { updateActiviteConference, deleteActiviteConference, addFileToActivite, deleteActiviteFile } from '@/actions/activite-conference'
// import { PiFilePdf, PiImage, PiMicrosoftWordLogo, PiVideo } from 'react-icons/pi'

// interface ActiviteDetailContentProps {
//   chefInfo: {
//     departement_id: number
//     departement_nom: string
//     conference_id: number
//     conference_nom: string
//     region_nom: string
//   }
//   activite: any
//   fichiers: any[]
//   budgetInfo: any
//   canEdit: boolean
// }

// export function ActiviteDetailContent({
//   chefInfo,
//   activite,
//   fichiers,
//   budgetInfo,
//   canEdit
// }: ActiviteDetailContentProps) {
//   const router = useRouter()
//   const [isUpdating, setIsUpdating] = useState(false)
//   const [isUploading, setIsUploading] = useState(false)
//   const [currentStatut, setCurrentStatut] = useState(activite.statut)

//   const STATUT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
//     planifie: { label: 'Planifiée', color: 'blue', icon: '📅' },
//     en_cours: { label: 'En cours', color: 'yellow', icon: '⚡' },
//     termine: { label: 'Terminée', color: 'green', icon: '✅' },
//     annule: { label: 'Annulée', color: 'red', icon: '❌' }
//   }

//   const statutConfig = STATUT_CONFIG[currentStatut]

//   const handleStatutChange = async (newStatut: string) => {
//     if (!canEdit) return
//     setIsUpdating(true)
//     try {
//       const result = await updateActiviteConference(
//         activite.id,
//         activite.titre,
//         activite.description,
//         activite.date,
//         activite.heure,
//         newStatut,
//         activite.plan_action_id
//       )
//       if (result.success) {
//         setCurrentStatut(newStatut as any)
//         router.refresh()
//       } else {
//         alert(result.error)
//       }
//     } catch (error) {
//       console.error('Erreur:', error)
//       alert('Une erreur est survenue')
//     } finally {
//       setIsUpdating(false)
//     }
//   }

//   const handleDelete = async () => {
//     if (!canEdit) return
//     if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return
    
//     try {
//       const result = await deleteActiviteConference(activite.id)
//       if (result.success) {
//         router.push('/conference/activites')
//       } else {
//         alert(result.error)
//       }
//     } catch (error) {
//       console.error('Erreur:', error)
//       alert('Une erreur est survenue')
//     }
//   }

//   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0]
//     if (!file) return

//     setIsUploading(true)
//     try {
//       const form = new FormData()
//       form.append('activite_id', activite.id.toString())
//       form.append('file', file)

//       const result = await addFileToActivite(form)
//       if (result.success) {
//         router.refresh()
//       } else {
//         alert(result.error)
//       }
//     } catch (error) {
//       console.error('Erreur:', error)
//       alert('Une erreur est survenue')
//     } finally {
//       setIsUploading(false)
//     }
//   }

//   const handleFileDelete = async (fichierId: number, fileUrl: string) => {
//     if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return
    
//     try {
//       const result = await deleteActiviteFile(fichierId, activite.id, fileUrl)
//       if (result.success) {
//         router.refresh()
//       } else {
//         alert(result.error)
//       }
//     } catch (error) {
//       console.error('Erreur:', error)
//       alert('Une erreur est survenue')
//     }
//   }

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('fr-FR', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     })
//   }

//   const isPast = new Date(activite.date) < new Date()
//   const isToday = new Date(activite.date).toDateString() === new Date().toDateString()

//   return (
//     <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       {/* Navigation */}
//       <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
//         <Link href="/conference" className="hover:text-gray-700">
//           Conférence
//         </Link>
//         <span>/</span>
//         <Link href="/conference/activites" className="hover:text-gray-700">
//           Activités
//         </Link>
//         <span>/</span>
//         <span className="text-gray-900 truncate">{activite.titre}</span>
//       </div>

//       {/* En-tête */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
//         <div className="flex justify-between items-start mb-4">
//           <div className="flex-1">
//             <h1 className="text-2xl font-bold text-gray-900">{activite.titre}</h1>
//             {activite.plan_action && (
//               <p className="text-sm text-gray-500 mt-1">
//                 Plan d'action: {activite.plan_action.titre}
//               </p>
//             )}
//             <div className="mt-2 flex items-center gap-2">
//               <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
//                 {chefInfo.conference_nom}
//               </span>
//               <span className="text-xs text-gray-400">
//                 {chefInfo.region_nom}
//               </span>
//             </div>
//           </div>
//           <div className="flex items-center gap-3">
//             <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-${statutConfig.color}-100 text-${statutConfig.color}-700`}>
//               <span>{statutConfig.icon}</span>
//               <span>{statutConfig.label}</span>
//             </span>
//             {canEdit && (
//               <div className="flex gap-2">
//                 <Link
//                   href={`/conference/activites/${activite.id}/modifier`}
//                   className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//                   </svg>
//                 </Link>
//                 <button
//                   onClick={handleDelete}
//                   className="p-2 text-gray-400 hover:text-red-600 transition-colors"
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                   </svg>
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Date et heure */}
//         <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
//           <div className="flex items-center gap-2">
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
//             </svg>
//             <span>{formatDate(activite.date)}</span>
//             {isToday && <span className="text-indigo-600 text-xs">(Aujourd'hui)</span>}
//             {isPast && !isToday && <span className="text-orange-600 text-xs">(Passé)</span>}
//           </div>
//           <div className="flex items-center gap-2">
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <span>{activite.heure}</span>
//           </div>
//         </div>

//         {/* Description */}
//         {activite.description && (
//           <div className="mt-4 p-4 bg-gray-50 rounded-lg">
//             <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
//             <p className="text-gray-600 whitespace-pre-wrap">{activite.description}</p>
//           </div>
//         )}
//       </div>

//       {/* Changement de statut */}
//       {canEdit && (
//         <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
//           <h3 className="text-sm font-medium text-gray-700 mb-3">Changer le statut</h3>
//           <div className="flex flex-wrap gap-2">
//             {Object.entries(STATUT_CONFIG).map(([key, config]) => (
//               <button
//                 key={key}
//                 onClick={() => handleStatutChange(key)}
//                 disabled={isUpdating || key === currentStatut}
//                 className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
//                   key === currentStatut
//                     ? `bg-${config.color}-100 text-${config.color}-700 cursor-default`
//                     : `bg-gray-100 text-gray-700 hover:bg-${config.color}-50 hover:text-${config.color}-700`
//                 }`}
//               >
//                 {config.icon} {config.label}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Budget associé */}
//       {budgetInfo && (
//         <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
//           <h3 className="text-sm font-medium text-gray-700 mb-3">Budget du plan d'action</h3>
//           <div className="grid grid-cols-2 gap-4">
//             <div className="text-center p-3 bg-green-50 rounded-lg">
//               <p className="text-xs text-green-600 mb-1">Recettes</p>
//               <p className="text-lg font-bold text-green-700">{budgetInfo.recettes.toLocaleString()} FC</p>
//             </div>
//             <div className="text-center p-3 bg-red-50 rounded-lg">
//               <p className="text-xs text-red-600 mb-1">Dépenses</p>
//               <p className="text-lg font-bold text-red-700">{budgetInfo.depenses.toLocaleString()} FC</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Fichiers joints */}
//       <div className="bg-white rounded-lg border border-gray-200 p-6">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-sm font-medium text-gray-700">Fichiers joints</h3>
//           {canEdit && (
//             <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm hover:bg-indigo-100 transition-colors rounded-lg">
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               Ajouter un fichier
//               <input
//                 type="file"
//                 onChange={handleFileUpload}
//                 disabled={isUploading}
//                 className="hidden"
//               />
//             </label>
//           )}
//         </div>

//         {isUploading && (
//           <div className="text-center py-4 text-gray-500">Upload en cours...</div>
//         )}

//         {fichiers.length === 0 && !isUploading && (
//           <div className="text-center py-8 text-gray-500">
//             <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
//             </svg>
//             <p>Aucun fichier joint</p>
//           </div>
//         )}

//         {fichiers.length > 0 && (
//           <div className="space-y-2">
//             {fichiers.map((fichier) => (
//               <div key={fichier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-lg flex items-center justify-center">
//                     {fichier.type_fichier === 'pdf' && (
//                       <div className="bg-red-500/10 p-2 rounded-lg">
//                         <PiFilePdf className='text-red-600 text-xl' />
//                       </div>
//                     )}
//                     {(fichier.type_fichier === 'jpg' || fichier.type_fichier === 'jpeg' || fichier.type_fichier === 'png') && (
//                       <div className="bg-orange-500/10 p-2 rounded-lg">
//                         <PiImage className='text-orange-500 text-xl' />
//                       </div>
//                     )}
//                     {(fichier.type_fichier === 'doc' || fichier.type_fichier === 'docx') && (
//                       <div className="bg-blue-500/10 p-2 rounded-lg">
//                         <PiMicrosoftWordLogo className='text-blue-600 text-xl' />
//                       </div>
//                     )}
//                     {fichier.type_fichier === 'mp4' && (
//                       <div className="bg-green-500/10 p-2 rounded-lg">
//                         <PiVideo className='text-green-600 text-xl' />
//                       </div>
//                     )}
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium text-gray-900">{fichier.nom_fichier}</p>
//                     <p className="text-xs text-gray-500">{fichier.type_fichier.toUpperCase()}</p>
//                   </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <a
//                     href={fichier.chemin_fichier}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
//                     </svg>
//                   </a>
//                   {canEdit && (
//                     <button
//                       onClick={() => handleFileDelete(fichier.id, fichier.chemin_fichier)}
//                       className="p-2 text-gray-400 hover:text-red-600 transition-colors"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                       </svg>
//                     </button>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Boutons de navigation */}
//       <div className="mt-6 flex justify-between">
//         <Link
//           href="/conference/activites"
//           className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
//         >
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
//           </svg>
//           Retour aux activités
//         </Link>
//         {canEdit && (
//           <Link
//             href={`/conference/activites/${activite.id}/modifier`}
//             className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//           >
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//             </svg>
//             Modifier
//           </Link>
//         )}
//       </div>
//     </div>
//   )
// }

// app/conference/activites/[activiteId]/ActiviteDetailContent.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateActiviteConference, deleteActiviteConference, addFileToActivite, deleteActiviteFile } from '@/actions/activite-conference'
import { PiFilePdf, PiImage, PiMicrosoftWordLogo, PiVideo } from 'react-icons/pi'

interface ActiviteDetailContentProps {
  chefInfo: {
    departement_id: number
    departement_nom: string
    conference_id: number
    conference_nom: string
    region_nom: string
  }
  activite: any
  fichiers: any[]
  budgetInfo: any
  canEdit: boolean
}

export function ActiviteDetailContent({
  chefInfo,
  activite,
  fichiers,
  budgetInfo,
  canEdit
}: ActiviteDetailContentProps) {
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [currentStatut, setCurrentStatut] = useState(activite.statut)

  const STATUT_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
    planifie: { label: 'Planifiée', color: 'blue', bgColor: 'bg-blue-50', icon: '📅' },
    en_cours: { label: 'En cours', color: 'amber', bgColor: 'bg-amber-50', icon: '⚡' },
    termine: { label: 'Terminée', color: 'green', bgColor: 'bg-green-50', icon: '✅' },
    annule: { label: 'Annulée', color: 'red', bgColor: 'bg-red-50', icon: '❌' }
  }

  const statutConfig = STATUT_CONFIG[currentStatut]

  const handleStatutChange = async (newStatut: string) => {
    if (!canEdit) return
    setIsUpdating(true)
    try {
      const result = await updateActiviteConference(
        activite.id,
        activite.titre,
        activite.description,
        activite.date,
        activite.heure,
        newStatut,
        activite.plan_action_id
      )
      if (result.success) {
        setCurrentStatut(newStatut as any)
        router.refresh()
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
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return
    
    try {
      const result = await deleteActiviteConference(activite.id)
      if (result.success) {
        router.push('/conference/activites')
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
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
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = async (fichierId: number, fileUrl: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return
    
    try {
      const result = await deleteActiviteFile(fichierId, activite.id, fileUrl)
      if (result.success) {
        router.refresh()
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

  const isPast = new Date(activite.date) < new Date()
  const isToday = new Date(activite.date).toDateString() === new Date().toDateString()

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation améliorée */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/conference" className="text-gray-500 hover:text-gray-700 transition-colors">
          Conférence
        </Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href="/conference/activites" className="text-gray-500 hover:text-gray-700 transition-colors">
          Activités
        </Link>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate">{activite.titre}</span>
      </nav>

      {/* En-tête avec design moderne */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statutConfig.bgColor} text-${statutConfig.color}-700`}>
                  <span>{statutConfig.icon}</span>
                  <span>{statutConfig.label}</span>
                </span>
                {activite.plan_action && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {activite.plan_action.titre}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{activite.titre}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{chefInfo.conference_nom}</span>
                <span>•</span>
                <span>{chefInfo.region_nom}</span>
              </div>
            </div>
            
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/conference/activites/${activite.id}/modifier`}
                  className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                  title="Modifier"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  title="Supprimer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Date et heure avec indicateurs visuels */}
          <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600">{formatDate(activite.date)}</p>
                {(isToday || isPast) && (
                  <span className={`text-xs ${isToday ? 'text-indigo-600' : 'text-orange-600'}`}>
                    {isToday ? 'Aujourd\'hui' : 'Date passée'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-gray-600">{activite.heure}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        {activite.description && (
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Description
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{activite.description}</p>
          </div>
        )}
      </div>

      {/* Changement de statut amélioré */}
      {canEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Changer le statut
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(STATUT_CONFIG).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleStatutChange(key)}
                disabled={isUpdating || key === currentStatut}
                className={`group relative px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  key === currentStatut
                    ? `${config.bgColor} text-${config.color}-700 ring-2 ring-${config.color}-500 ring-offset-2 cursor-default`
                    : `bg-gray-50 text-gray-600 hover:${config.bgColor} hover:text-${config.color}-700 hover:shadow-sm`
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <span>{config.label}</span>
                </div>
              </button>
            ))}
          </div>
          {isUpdating && (
            <div className="mt-3 text-center text-sm text-gray-500">
              Mise à jour en cours...
            </div>
          )}
        </div>
      )}

      {/* Budget associé amélioré */}
      {budgetInfo && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Budget du plan d'action
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-green-600 font-medium">Recettes</p>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-green-700">{budgetInfo.recettes.toLocaleString()} FC</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-red-600 font-medium">Dépenses</p>
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-red-700">{budgetInfo.depenses.toLocaleString()} FC</p>
            </div>
          </div>
        </div>
      )}

      {/* Fichiers joints améliorés */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Fichiers joints
            </h3>
            {canEdit && (
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 text-sm hover:bg-indigo-100 transition-all rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter un fichier
                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="p-8 text-center">
            <div className="inline-flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
              <span>Upload en cours...</span>
            </div>
          </div>
        )}

        {fichiers.length === 0 && !isUploading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <p className="text-gray-500">Aucun fichier joint</p>
            <p className="text-sm text-gray-400 mt-1">Ajoutez des documents, images ou vidéos</p>
          </div>
        )}

        {fichiers.length > 0 && (
          <div className="p-6 space-y-3">
            {fichiers.map((fichier) => (
              <div key={fichier.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-white shadow-sm">
                    {fichier.type_fichier === 'pdf' && (
                      <PiFilePdf className='text-red-600 text-2xl' />
                    )}
                    {(fichier.type_fichier === 'jpg' || fichier.type_fichier === 'jpeg' || fichier.type_fichier === 'png') && (
                      <PiImage className='text-orange-500 text-2xl' />
                    )}
                    {(fichier.type_fichier === 'doc' || fichier.type_fichier === 'docx') && (
                      <PiMicrosoftWordLogo className='text-blue-600 text-2xl' />
                    )}
                    {fichier.type_fichier === 'mp4' && (
                      <PiVideo className='text-green-600 text-2xl' />
                    )}
                    {!['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'mp4'].includes(fichier.type_fichier) && (
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{fichier.nom_fichier}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{fichier.type_fichier.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={fichier.chemin_fichier}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-white"
                    title="Télécharger"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => handleFileDelete(fichier.id, fichier.chemin_fichier)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-white"
                      title="Supprimer"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Boutons de navigation améliorés */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-between">
        <Link
          href="/conference/activites"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux activités
        </Link>
        {canEdit && (
          <Link
            href={`/conference/activites/${activite.id}/modifier`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier l'activité
          </Link>
        )}
      </div>
    </div>
  )
}