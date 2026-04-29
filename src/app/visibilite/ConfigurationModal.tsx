// // app/visibilite/ConfigurationModal.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   Eye, 
//   EyeOff, 
//   Building2, 
//   Home, 
//   Users,
//   AlertCircle,
//   CheckCircle2,
//   X,
//   Save,
//   Loader2,
//   DollarSign
// } from 'lucide-react'
// import { saveConfiguration } from '@/actions/configurations'

// interface UniteWithVisibility {
//   id: number
//   nom: string
//   niveau: string
//   configuration: any | null
//   hierarchie_complete?: {
//     conference?: { id: number; nom: string } | null
//     district?: { id: number; nom: string } | null
//     paroisse?: { id: number; nom: string } | null
//     region?: { id: number; nom: string } | null
//   }
// }

// interface ConfigurationModalProps {
//   isOpen: boolean
//   onClose: () => void
//   unite: UniteWithVisibility
//   onSave: () => void
// }

// export function ConfigurationModal({ 
//   isOpen, 
//   onClose, 
//   unite,
//   onSave 
// }: ConfigurationModalProps) {
//   const [visibilite, setVisibilite] = useState({
//     conference: 'visible' as 'visible' | 'masque',
//     district: 'visible' as 'visible' | 'masque',
//     paroisse: 'visible' as 'visible' | 'masque'
//   })
//   const [taux, setTaux] = useState('2800.00')
//   const [isSaving, setIsSaving] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const [successMessage, setSuccessMessage] = useState<string | null>(null)

//   useEffect(() => {
//     if (unite.configuration) {
//       setVisibilite({
//         conference: unite.configuration.visibilite_budget.conference,
//         district: unite.configuration.visibilite_budget.district,
//         paroisse: unite.configuration.visibilite_budget.paroisse
//       })
//       setTaux(unite.configuration.taux.toString())
//     }
//   }, [unite])

//   const handleSave = async () => {
//     setIsSaving(true)
//     setError(null)
//     setSuccessMessage(null)

//     try {
//       const result = await saveConfiguration(unite.id, {
//         taux: parseFloat(taux),
//         visibilite_budget: visibilite
//       })

//       if (result.success) {
//         setSuccessMessage('Configuration sauvegardée avec succès !')
//         onSave()
//         setTimeout(() => {
//           onClose()
//         }, 1500)
//       } else {
//         setError(result.error || 'Erreur lors de la sauvegarde')
//       }
//     } catch (err) {
//       setError('Une erreur est survenue')
//     } finally {
//       setIsSaving(false)
//     }
//   }

//   if (!isOpen) return null

//   const getNiveauIcon = () => {
//     switch (unite.niveau) {
//       case 'conference':
//         return <Building2 size={20} className="text-purple-600" />
//       case 'district':
//         return <Building2 size={20} className="text-blue-600" />
//       case 'paroisse':
//         return <Home size={20} className="text-green-600" />
//       case 'departement':
//         return <Users size={20} className="text-orange-600" />
//       default:
//         return <Building2 size={20} className="text-gray-600" />
//     }
//   }

//   const getFullPath = () => {
//     const parts: string[] = []
//     if (unite.hierarchie_complete?.region?.nom) parts.push(unite.hierarchie_complete.region.nom)
//     if (unite.hierarchie_complete?.conference?.nom) parts.push(unite.hierarchie_complete.conference.nom)
//     if (unite.hierarchie_complete?.district?.nom) parts.push(unite.hierarchie_complete.district.nom)
//     if (unite.hierarchie_complete?.paroisse?.nom) parts.push(unite.hierarchie_complete.paroisse.nom)
//     if (unite.nom && unite.niveau !== 'paroisse') parts.push(unite.nom)
//     return parts.join(' > ')
//   }

//   return (
//     <div className="fixed inset-0 z-50 overflow-y-auto">
//       <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//         <div 
//           className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
//           onClick={onClose}
//         />

//         <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
//           <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 {getNiveauIcon()}
//                 <div>
//                   <h3 className="text-lg font-medium text-gray-900">
//                     {unite.nom}
//                   </h3>
//                   <p className="text-xs text-gray-500">
//                     {getFullPath()}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={onClose}
//                 className="text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </div>
//           </div>

//           <div className="bg-white px-6 py-5">
//             <div className="space-y-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   <div className="flex items-center gap-2">
//                     <DollarSign size={16} className="text-gray-400" />
//                     Taux de change
//                   </div>
//                 </label>
//                 <div className="relative">
//                   <input
//                     type="number"
//                     step="0.01"
//                     min="0"
//                     value={taux}
//                     onChange={(e) => setTaux(e.target.value)}
//                     className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
//                     placeholder="2800.00"
//                   />
//                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
//                     CDF
//                   </span>
//                 </div>
//                 <p className="text-xs text-gray-500 mt-1.5">
//                   1 USD = {taux} CDF
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-3">
//                   Visibilité budgétaire
//                 </label>
                
//                 <div className="space-y-2">
//                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
//                         <Building2 size={16} className="text-purple-600" />
//                       </div>
//                       <div>
//                         <span className="text-sm font-medium text-gray-900">Conférence</span>
//                         <p className="text-xs text-gray-500">Niveau supérieur</p>
//                       </div>
//                     </div>
//                     <div className="flex gap-1">
//                       <button
//                         onClick={() => setVisibilite({ ...visibilite, conference: 'visible' })}
//                         className={`px-3 py-1.5 text-xs rounded-md transition-all ${
//                           visibilite.conference === 'visible'
//                             ? 'bg-green-500 text-white shadow-sm'
//                             : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
//                         }`}
//                       >
//                         <Eye size={14} className="inline mr-1" />
//                         Visible
//                       </button>
//                       <button
//                         onClick={() => setVisibilite({ ...visibilite, conference: 'masque' })}
//                         className={`px-3 py-1.5 text-xs rounded-md transition-all ${
//                           visibilite.conference === 'masque'
//                             ? 'bg-red-500 text-white shadow-sm'
//                             : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
//                         }`}
//                       >
//                         <EyeOff size={14} className="inline mr-1" />
//                         Masqué
//                       </button>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
//                         <Building2 size={16} className="text-blue-600" />
//                       </div>
//                       <div>
//                         <span className="text-sm font-medium text-gray-900">District</span>
//                         <p className="text-xs text-gray-500">Niveau intermédiaire</p>
//                       </div>
//                     </div>
//                     <div className="flex gap-1">
//                       <button
//                         onClick={() => setVisibilite({ ...visibilite, district: 'visible' })}
//                         className={`px-3 py-1.5 text-xs rounded-md transition-all ${
//                           visibilite.district === 'visible'
//                             ? 'bg-green-500 text-white shadow-sm'
//                             : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
//                         }`}
//                       >
//                         <Eye size={14} className="inline mr-1" />
//                         Visible
//                       </button>
//                       <button
//                         onClick={() => setVisibilite({ ...visibilite, district: 'masque' })}
//                         className={`px-3 py-1.5 text-xs rounded-md transition-all ${
//                           visibilite.district === 'masque'
//                             ? 'bg-red-500 text-white shadow-sm'
//                             : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
//                         }`}
//                       >
//                         <EyeOff size={14} className="inline mr-1" />
//                         Masqué
//                       </button>
//                     </div>
//                   </div>

//                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
//                     <div className="flex items-center gap-3">
//                       <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
//                         <Home size={16} className="text-green-600" />
//                       </div>
//                       <div>
//                         <span className="text-sm font-medium text-gray-900">Paroisse</span>
//                         <p className="text-xs text-gray-500">Niveau local</p>
//                       </div>
//                     </div>
//                     <div className="flex gap-1">
//                       <button
//                         onClick={() => setVisibilite({ ...visibilite, paroisse: 'visible' })}
//                         className={`px-3 py-1.5 text-xs rounded-md transition-all ${
//                           visibilite.paroisse === 'visible'
//                             ? 'bg-green-500 text-white shadow-sm'
//                             : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
//                         }`}
//                       >
//                         <Eye size={14} className="inline mr-1" />
//                         Visible
//                       </button>
//                       <button
//                         onClick={() => setVisibilite({ ...visibilite, paroisse: 'masque' })}
//                         className={`px-3 py-1.5 text-xs rounded-md transition-all ${
//                           visibilite.paroisse === 'masque'
//                             ? 'bg-red-500 text-white shadow-sm'
//                             : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
//                         }`}
//                       >
//                         <EyeOff size={14} className="inline mr-1" />
//                         Masqué
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {error && (
//                 <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
//                   <div className="flex items-start gap-2">
//                     <AlertCircle size={18} className="text-red-500 mt-0.5" />
//                     <p className="text-sm text-red-700">{error}</p>
//                   </div>
//                 </div>
//               )}

//               {successMessage && (
//                 <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//                   <div className="flex items-start gap-2">
//                     <CheckCircle2 size={18} className="text-green-500 mt-0.5" />
//                     <p className="text-sm text-green-700">{successMessage}</p>
//                   </div>
//                 </div>
//               )}

//               {!unite.configuration && (
//                 <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                   <div className="flex items-start gap-2">
//                     <AlertCircle size={18} className="text-blue-500 mt-0.5" />
//                     <div>
//                       <p className="text-sm text-blue-700 font-medium mb-1">
//                         Première configuration
//                       </p>
//                       <p className="text-xs text-blue-600">
//                         Une configuration par défaut sera créée avec les valeurs ci-dessus.
//                       </p>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-row-reverse gap-3">
//             <button
//               type="button"
//               onClick={handleSave}
//               disabled={isSaving}
//               className="inline-flex items-center justify-center px-4 py-2 bg-black text-sm font-medium text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               {isSaving ? (
//                 <>
//                   <Loader2 size={16} className="animate-spin mr-2" />
//                   Sauvegarde...
//                 </>
//               ) : (
//                 <>
//                   <Save size={16} className="mr-2" />
//                   Sauvegarder
//                 </>
//               )}
//             </button>
//             <button
//               type="button"
//               onClick={onClose}
//               className="inline-flex items-center justify-center px-4 py-2 bg-white text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
//             >
//               Annuler
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


// app/visibilite/ConfigurationModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Eye, 
  EyeOff, 
  Building2, 
  Home, 
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Save,
  Loader2,
  DollarSign
} from 'lucide-react'
import { saveConfiguration } from '@/actions/configurations'

interface UniteWithVisibility {
  id: number
  nom: string
  niveau: string
  configuration: any | null
  hierarchie_complete?: {
    conference?: { id: number; nom: string } | null
    district?: { id: number; nom: string } | null
    paroisse?: { id: number; nom: string } | null
    region?: { id: number; nom: string } | null
  }
}

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  unite: UniteWithVisibility
  onSave: () => void
}

export function ConfigurationModal({ 
  isOpen, 
  onClose, 
  unite,
  onSave 
}: ConfigurationModalProps) {
  const [visibilite, setVisibilite] = useState({
    conference: 'visible' as 'visible' | 'masque',
    district: 'visible' as 'visible' | 'masque',
    paroisse: 'visible' as 'visible' | 'masque'
  })
  const [taux, setTaux] = useState('2800.00')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (unite.configuration) {
      setVisibilite({
        conference: unite.configuration.visibilite_budget.conference,
        district: unite.configuration.visibilite_budget.district,
        paroisse: unite.configuration.visibilite_budget.paroisse
      })
      setTaux(unite.configuration.taux.toString())
    }
  }, [unite])

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const result = await saveConfiguration(unite.id, {
        taux: parseFloat(taux),
        visibilite_budget: visibilite
      })

      if (result.success) {
        setSuccessMessage('Configuration sauvegardée avec succès !')
        onSave()
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const getNiveauIcon = () => {
    switch (unite.niveau) {
      case 'conference':
        return <Building2 size={18} className="text-gray-600" />
      case 'district':
        return <Building2 size={18} className="text-gray-600" />
      case 'paroisse':
        return <Home size={18} className="text-gray-600" />
      case 'departement':
        return <Users size={18} className="text-gray-600" />
      default:
        return <Building2 size={18} className="text-gray-600" />
    }
  }

  const getFullPath = () => {
    const parts: string[] = []
    if (unite.hierarchie_complete?.region?.nom) parts.push(unite.hierarchie_complete.region.nom)
    if (unite.hierarchie_complete?.conference?.nom) parts.push(unite.hierarchie_complete.conference.nom)
    if (unite.hierarchie_complete?.district?.nom) parts.push(unite.hierarchie_complete.district.nom)
    if (unite.hierarchie_complete?.paroisse?.nom) parts.push(unite.hierarchie_complete.paroisse.nom)
    if (unite.nom && unite.niveau !== 'paroisse') parts.push(unite.nom)
    return parts.join(' > ')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal - sans arrondis */}
        <div className="relative bg-white w-full max-w-md shadow-xl transform transition-all">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getNiveauIcon()}
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    {unite.nom}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {getFullPath()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <div className="space-y-5">
              {/* Taux de change */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <DollarSign size={14} className="text-gray-400" />
                    Taux de change
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taux}
                    onChange={(e) => setTaux(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                    placeholder="2800.00"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    CDF
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  1 USD = {taux} CDF
                </p>
              </div>

              {/* Visibilité budgétaire */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Visibilité budgétaire
                </label>
                
                <div className="space-y-1.5">
                  {/* Conférence */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-900">Conférence</span>
                        <span className="text-xs text-gray-400 ml-2">Niveau supérieur</span>
                      </div>
                    </div>
                    <div className="flex border border-gray-300">
                      <button
                        onClick={() => setVisibilite({ ...visibilite, conference: 'visible' })}
                        className={`px-2.5 py-1 text-xs transition-colors ${
                          visibilite.conference === 'visible'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Eye size={12} className="inline mr-0.5" />
                        Visible
                      </button>
                      <button
                        onClick={() => setVisibilite({ ...visibilite, conference: 'masque' })}
                        className={`px-2.5 py-1 text-xs transition-colors border-l border-gray-300 ${
                          visibilite.conference === 'masque'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <EyeOff size={12} className="inline mr-0.5" />
                        Masqué
                      </button>
                    </div>
                  </div>

                  {/* District */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-900">District</span>
                        <span className="text-xs text-gray-400 ml-2">Niveau intermédiaire</span>
                      </div>
                    </div>
                    <div className="flex border border-gray-300">
                      <button
                        onClick={() => setVisibilite({ ...visibilite, district: 'visible' })}
                        className={`px-2.5 py-1 text-xs transition-colors ${
                          visibilite.district === 'visible'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Eye size={12} className="inline mr-0.5" />
                        Visible
                      </button>
                      <button
                        onClick={() => setVisibilite({ ...visibilite, district: 'masque' })}
                        className={`px-2.5 py-1 text-xs transition-colors border-l border-gray-300 ${
                          visibilite.district === 'masque'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <EyeOff size={12} className="inline mr-0.5" />
                        Masqué
                      </button>
                    </div>
                  </div>

                  {/* Paroisse */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <Home size={16} className="text-gray-500" />
                      <div>
                        <span className="text-sm text-gray-900">Paroisse</span>
                        <span className="text-xs text-gray-400 ml-2">Niveau local</span>
                      </div>
                    </div>
                    <div className="flex border border-gray-300">
                      <button
                        onClick={() => setVisibilite({ ...visibilite, paroisse: 'visible' })}
                        className={`px-2.5 py-1 text-xs transition-colors ${
                          visibilite.paroisse === 'visible'
                            ? 'bg-black text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Eye size={12} className="inline mr-0.5" />
                        Visible
                      </button>
                      <button
                        onClick={() => setVisibilite({ ...visibilite, paroisse: 'masque' })}
                        className={`px-2.5 py-1 text-xs transition-colors border-l border-gray-300 ${
                          visibilite.paroisse === 'masque'
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <EyeOff size={12} className="inline mr-0.5" />
                        Masqué
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 mt-0.5" />
                    <p className="text-sm text-green-700">{successMessage}</p>
                  </div>
                </div>
              )}

              {!unite.configuration && (
                <div className="p-3 bg-gray-50 border border-gray-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-600">
                        Première configuration - Une configuration par défaut sera créée.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-black transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin mr-1.5" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save size={14} className="mr-1.5" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}