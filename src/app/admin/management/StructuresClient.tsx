// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   createRegion, updateRegion, deleteRegion,
//   createConference, updateConference, deleteConference,
//   createDistrict, updateDistrict, deleteDistrict,
//   createParoisse, updateParoisse, deleteParoisse,
//   getConferences, getDistricts, getParoisses,getRegions
// } from '@/actions/structures'
// import Link from 'next/link';

// type Region = { id: number; nom: string; created_at: string }
// type Conference = { id: number; nom: string; region_id: number; region?: { id: number; nom: string } }
// type District = { id: number; nom: string; conference_id: number; conference?: { id: number; nom: string; region?: { id: number; nom: string } } }
// type Paroisse = { id: number; nom: string; district_id: number; district?: { id: number; nom: string; conference?: { id: number; nom: string; region?: { id: number; nom: string } } } }

// interface Props {
//   initialRegions: Region[]
//   initialConferences: Conference[]
//   initialDistricts: District[]
//   initialParoisses: Paroisse[]
//   initialStats: { regions: number; conferences: number; districts: number; paroisses: number }
// }

// type ActiveTab = 'regions' | 'conferences' | 'districts' | 'paroisses'

// export default function StructuresClient({ 
//   initialRegions, 
//   initialConferences, 
//   initialDistricts, 
//   initialParoisses,
//   initialStats 
// }: Props) {
//   const [activeTab, setActiveTab] = useState<ActiveTab>('regions')
//   const [regions, setRegions] = useState(initialRegions)
//   const [conferences, setConferences] = useState(initialConferences)
//   const [districts, setDistricts] = useState(initialDistricts)
//   const [paroisses, setParoisses] = useState(initialParoisses)
//   const [stats, setStats] = useState(initialStats)
  
//   const [showModal, setShowModal] = useState(false)
//   const [editingItem, setEditingItem] = useState<any>(null)
//   const [formData, setFormData] = useState({ nom: '', parent_id: '' })
//   const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

//   // Rafraîchir les données quand l'onglet change
//   useEffect(() => {
//     const refreshData = async () => {
//       if (activeTab === 'conferences') {
//         const data = await getConferences()
//         setConferences(data)
//       } else if (activeTab === 'districts') {
//         const data = await getDistricts()
//         setDistricts(data)
//       } else if (activeTab === 'paroisses') {
//         const data = await getParoisses()
//         setParoisses(data)
//       }
//     }
//     refreshData()
//   }, [activeTab])

//   const handleOpenModal = (item?: any) => {
//     if (item) {
//       setEditingItem(item)
//       setFormData({ 
//         nom: item.nom, 
//         parent_id: item[getParentField()]?.toString() || '' 
//       })
//     } else {
//       setEditingItem(null)
//       setFormData({ nom: '', parent_id: '' })
//     }
//     setShowModal(true)
//     setMessage(null)
//   }

//   const getParentField = () => {
//     switch (activeTab) {
//       case 'conferences': return 'region_id'
//       case 'districts': return 'conference_id'
//       case 'paroisses': return 'district_id'
//       default: return ''
//     }
//   }

//   const getParentLabel = () => {
//     switch (activeTab) {
//       case 'conferences': return 'Région'
//       case 'districts': return 'Conférence'
//       case 'paroisses': return 'District'
//       default: return ''
//     }
//   }

//   const getParentOptions = () => {
//     switch (activeTab) {
//       case 'conferences': return regions
//       case 'districts': return conferences
//       case 'paroisses': return districts
//       default: return []
//     }
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     const form = new FormData()
//     form.append('nom', formData.nom)
//     if (editingItem) {
//       form.append('id', editingItem.id.toString())
//     }
//     if (getParentField()) {
//       form.append(getParentField(), formData.parent_id)
//     }

//     let result
//     if (editingItem) {
//       switch (activeTab) {
//         case 'regions':
//           result = await updateRegion(form)
//           break
//         case 'conferences':
//           result = await updateConference(form)
//           break
//         case 'districts':
//           result = await updateDistrict(form)
//           break
//         case 'paroisses':
//           result = await updateParoisse(form)
//           break
//       }
//     } else {
//       switch (activeTab) {
//         case 'regions':
//           result = await createRegion(form)
//           break
//         case 'conferences':
//           result = await createConference(form)
//           break
//         case 'districts':
//           result = await createDistrict(form)
//           break
//         case 'paroisses':
//           result = await createParoisse(form)
//           break
//       }
//     }

//     if (result?.error) {
//       setMessage({ type: 'error', text: result.error })
//     } else {
//       setMessage({ type: 'success', text: `${
//         editingItem ? 'Modification' : 'Création'
//       } effectuée avec succès` })
      
//       // Rafraîchir les données
//       setTimeout(async () => {
//         if (activeTab === 'regions') {
//           const newRegions = await getRegions()
//           setRegions(newRegions)
//         } else if (activeTab === 'conferences') {
//           const newConferences = await getConferences()
//           setConferences(newConferences)
//         } else if (activeTab === 'districts') {
//           const newDistricts = await getDistricts()
//           setDistricts(newDistricts)
//         } else if (activeTab === 'paroisses') {
//           const newParoisses = await getParoisses()
//           setParoisses(newParoisses)
//         }
        
//         // Mettre à jour les stats
//         setStats(prev => ({
//           ...prev,
//           [activeTab]: prev[activeTab as keyof typeof prev] + (editingItem ? 0 : 1)
//         }))
        
//         setShowModal(false)
//         setMessage(null)
//       }, 1000)
//     }
//   }

//   const handleDelete = async (id: number) => {
//     if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return

//     let result
//     switch (activeTab) {
//       case 'regions':
//         result = await deleteRegion(id)
//         break
//       case 'conferences':
//         result = await deleteConference(id)
//         break
//       case 'districts':
//         result = await deleteDistrict(id)
//         break
//       case 'paroisses':
//         result = await deleteParoisse(id)
//         break
//     }

//     if (result?.error) {
//       setMessage({ type: 'error', text: result.error })
//     } else {
//       setMessage({ type: 'success', text: 'Suppression effectuée avec succès' })
      
//       // Rafraîchir les données
//       setTimeout(async () => {
//         if (activeTab === 'regions') {
//           setRegions(await getRegions())
//         } else if (activeTab === 'conferences') {
//           setConferences(await getConferences())
//         } else if (activeTab === 'districts') {
//           setDistricts(await getDistricts())
//         } else if (activeTab === 'paroisses') {
//           setParoisses(await getParoisses())
//         }
        
//         setStats(prev => ({
//           ...prev,
//           [activeTab]: Math.max(0, prev[activeTab as keyof typeof prev] - 1)
//         }))
        
//         setMessage(null)
//       }, 1000)
//     }
//   }

//   const getCurrentData = () => {
//     switch (activeTab) {
//       case 'regions': return regions
//       case 'conferences': return conferences
//       case 'districts': return districts
//       case 'paroisses': return paroisses
//       default: return []
//     }
//   }

//   const getItemParentName = (item: any) => {
//     switch (activeTab) {
//       case 'conferences':
//         return item.region?.nom
//       case 'districts':
//         return item.conference?.nom
//       case 'paroisses':
//         return item.district?.nom
//       default:
//         return null
//     }
//   }

//   const getFullHierarchy = (item: any) => {
//     if (activeTab === 'paroisses' && item.district) {
//       const district = item.district
//       const conference = district.conference
//       const region = conference?.region
//       return (
//         <div className="text-xs text-gray-400">
//           {region?.nom} / {conference?.nom} / {district.nom}
//         </div>
//       )
//     }
//     return null
//   }

//   const tabs = [
//     { id: 'regions', label: 'Régions', count: stats.regions },
//     { id: 'conferences', label: 'Conférences', count: stats.conferences },
//     { id: 'districts', label: 'Districts', count: stats.districts },
//     { id: 'paroisses', label: 'Paroisses', count: stats.paroisses }
//   ]

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       {/* En-tête */}
//       <div className="mb-8 ">
//         <div className="flex items-center justify-between">
//           <h1 className="text-2xl font-light text-gray-900">Structures</h1>
//         <Link href='/admin/role' className="text-sm   text-gray-400 hover:text-gray-600 transition-colors">
//           Gérer les rôles associés →
//         </Link>
//         </div>
//           <p className="text-sm text-gray-500 mt-1">
//             Gestion de la hiérarchie des entités
//           </p>
//       </div>

//       {/* Message de notification */}
//       {message && (
//         <div className={`mb-6 p-4 rounded-lg ${
//           message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
//         }`}>
//           {message.text}
//         </div>
//       )}

//       {/* Tabs */}
//       <div className="border-b border-gray-100 mb-6">
//         <nav className="flex gap-8">
//           {tabs.map(tab => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id as ActiveTab)}
//               className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
//                 activeTab === tab.id
//                   ? 'text-gray-900 border-b-2 border-gray-900'
//                   : 'text-gray-400 hover:text-gray-600'
//               }`}
//             >
//               {tab.label}
//               <span className="ml-2 text-xs text-gray-300">
//                 ({tab.count})
//               </span>
//             </button>
//           ))}
//         </nav>
//       </div>

//       {/* Barre d'action */}
//       <div className="flex justify-end mb-6">
//         <button
//           onClick={() => handleOpenModal()}
//           className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
//         >
//           + Nouveau
//         </button>
//       </div>

//       {/* Liste */}
//       <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-50">
//           <thead>
//             <tr className="bg-gray-50/50">
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
//                 Nom
//               </th>
//               {activeTab !== 'regions' && (
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
//                   {getParentLabel()}
//                 </th>
//               )}
//               {activeTab === 'paroisses' && (
//                 <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
//                   Hiérarchie
//                 </th>
//               )}
//               <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
//                 Date création
//               </th>
//               <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-gray-50">
//             {getCurrentData().map((item: any) => (
//               <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm font-medium text-gray-900">
//                     {item.nom}
//                   </div>
//                 </td>
                
//                 {activeTab !== 'regions' && (
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm text-gray-500">
//                       {getItemParentName(item)}
//                     </div>
//                   </td>
//                 )}

//                 {activeTab === 'paroisses' && (
//                   <td className="px-6 py-4">
//                     {getFullHierarchy(item)}
//                   </td>
//                 )}
                
//                 <td className="px-6 py-4 whitespace-nowrap">
//                   <div className="text-sm text-gray-400">
//                     {new Date(item.created_at).toLocaleDateString('fr-FR', {
//                       day: 'numeric',
//                       month: 'short',
//                       year: 'numeric'
//                     })}
//                   </div>
//                 </td>
                
//                 <td className="px-6 py-4 whitespace-nowrap text-right">
//                   <button
//                     onClick={() => handleOpenModal(item)}
//                     className="text-gray-400 hover:text-gray-600 text-sm mr-4 transition-colors"
//                   >
//                     Modifier
//                   </button>
//                   <button
//                     onClick={() => handleDelete(item.id)}
//                     className="text-gray-300 hover:text-red-400 text-sm transition-colors"
//                   >
//                     Supprimer
//                   </button>
//                 </td>
//               </tr>
//             ))}

//             {getCurrentData().length === 0 && (
//               <tr>
//                 <td colSpan={activeTab === 'paroisses' ? 5 : 4} className="text-center py-12">
//                   <div className="text-gray-300 text-sm">
//                     Aucun élément pour le moment
//                   </div>
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-md w-full p-6">
//             <h3 className="text-lg font-light text-gray-900 mb-4">
//               {editingItem ? 'Modifier' : 'Nouvelle'} {activeTab.slice(0, -1)}
//             </h3>
            
//             <form onSubmit={handleSubmit}>
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
//                     Nom
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.nom}
//                     onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
//                     className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                     required
//                     autoFocus
//                   />
//                 </div>

//                 {getParentField() && (
//                   <div>
//                     <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
//                       {getParentLabel()}
//                     </label>
//                     <select
//                       value={formData.parent_id}
//                       onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
//                       className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                       required
//                     >
//                       <option value="">Sélectionner...</option>
//                       {getParentOptions().map((option: any) => (
//                         <option key={option.id} value={option.id}>
//                           {option.nom}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 )}
//               </div>

//               <div className="flex justify-end gap-3 mt-6">
//                 <button
//                   type="button"
//                   onClick={() => setShowModal(false)}
//                   className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
//                 >
//                   Annuler
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
//                 >
//                   {editingItem ? 'Modifier' : 'Créer'}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Footer */}
//       <div className="mt-4 text-xs text-gray-300 text-right">
//         Dernière mise à jour : {new Date().toLocaleDateString()}
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import { 
  createRegion, updateRegion, deleteRegion,
  createConference, updateConference, deleteConference,
  createDistrict, updateDistrict, deleteDistrict,
  createParoisse, updateParoisse, deleteParoisse,
  getConferences, getDistricts, getParoisses,getRegions
} from '@/actions/structures'
import Link from 'next/link';

type Region = { id: number; nom: string; created_at: string }
type Conference = { id: number; nom: string; region_id: number; region?: { id: number; nom: string } }
type District = { id: number; nom: string; conference_id: number; conference?: { id: number; nom: string; region?: { id: number; nom: string } } }
type Paroisse = { id: number; nom: string; district_id: number; district?: { id: number; nom: string; conference?: { id: number; nom: string; region?: { id: number; nom: string } } } }

interface Props {
  initialRegions: Region[]
  initialConferences: Conference[]
  initialDistricts: District[]
  initialParoisses: Paroisse[]
  initialStats: { regions: number; conferences: number; districts: number; paroisses: number }
}

type ActiveTab = 'regions' | 'conferences' | 'districts' | 'paroisses'

export default function StructuresClient({ 
  initialRegions, 
  initialConferences, 
  initialDistricts, 
  initialParoisses,
  initialStats 
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('regions')
  const [regions, setRegions] = useState(initialRegions)
  const [conferences, setConferences] = useState(initialConferences)
  const [districts, setDistricts] = useState(initialDistricts)
  const [paroisses, setParoisses] = useState(initialParoisses)
  const [stats, setStats] = useState(initialStats)
  
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [formData, setFormData] = useState({ nom: '', parent_id: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Rafraîchir les données quand l'onglet change
  useEffect(() => {
    const refreshData = async () => {
      if (activeTab === 'conferences') {
        const data = await getConferences()
        setConferences(data)
      } else if (activeTab === 'districts') {
        const data = await getDistricts()
        setDistricts(data)
      } else if (activeTab === 'paroisses') {
        const data = await getParoisses()
        setParoisses(data)
      }
    }
    refreshData()
  }, [activeTab])

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item)
      setFormData({ 
        nom: item.nom, 
        parent_id: item[getParentField()]?.toString() || '' 
      })
    } else {
      setEditingItem(null)
      setFormData({ nom: '', parent_id: '' })
    }
    setShowModal(true)
    setMessage(null)
  }

  const getParentField = () => {
    switch (activeTab) {
      case 'conferences': return 'region_id'
      case 'districts': return 'conference_id'
      case 'paroisses': return 'district_id'
      default: return ''
    }
  }

  const getParentLabel = () => {
    switch (activeTab) {
      case 'conferences': return 'Région'
      case 'districts': return 'Conférence'
      case 'paroisses': return 'District'
      default: return ''
    }
  }

  const getParentOptions = () => {
    switch (activeTab) {
      case 'conferences': return regions
      case 'districts': return conferences
      case 'paroisses': return districts
      default: return []
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const form = new FormData()
    form.append('nom', formData.nom)
    if (editingItem) {
      form.append('id', editingItem.id.toString())
    }
    if (getParentField()) {
      form.append(getParentField(), formData.parent_id)
    }

    let result
    if (editingItem) {
      switch (activeTab) {
        case 'regions':
          result = await updateRegion(form)
          break
        case 'conferences':
          result = await updateConference(form)
          break
        case 'districts':
          result = await updateDistrict(form)
          break
        case 'paroisses':
          result = await updateParoisse(form)
          break
      }
    } else {
      switch (activeTab) {
        case 'regions':
          result = await createRegion(form)
          break
        case 'conferences':
          result = await createConference(form)
          break
        case 'districts':
          result = await createDistrict(form)
          break
        case 'paroisses':
          result = await createParoisse(form)
          break
      }
    }

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `${
        editingItem ? 'Modification' : 'Création'
      } effectuée avec succès` })
      
      // Rafraîchir les données
      setTimeout(async () => {
        if (activeTab === 'regions') {
          const newRegions = await getRegions()
          setRegions(newRegions)
        } else if (activeTab === 'conferences') {
          const newConferences = await getConferences()
          setConferences(newConferences)
        } else if (activeTab === 'districts') {
          const newDistricts = await getDistricts()
          setDistricts(newDistricts)
        } else if (activeTab === 'paroisses') {
          const newParoisses = await getParoisses()
          setParoisses(newParoisses)
        }
        
        // Mettre à jour les stats
        setStats(prev => ({
          ...prev,
          [activeTab]: prev[activeTab as keyof typeof prev] + (editingItem ? 0 : 1)
        }))
        
        setShowModal(false)
        setMessage(null)
      }, 1000)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return

    let result
    switch (activeTab) {
      case 'regions':
        result = await deleteRegion(id)
        break
      case 'conferences':
        result = await deleteConference(id)
        break
      case 'districts':
        result = await deleteDistrict(id)
        break
      case 'paroisses':
        result = await deleteParoisse(id)
        break
    }

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Suppression effectuée avec succès' })
      
      // Rafraîchir les données
      setTimeout(async () => {
        if (activeTab === 'regions') {
          setRegions(await getRegions())
        } else if (activeTab === 'conferences') {
          setConferences(await getConferences())
        } else if (activeTab === 'districts') {
          setDistricts(await getDistricts())
        } else if (activeTab === 'paroisses') {
          setParoisses(await getParoisses())
        }
        
        setStats(prev => ({
          ...prev,
          [activeTab]: Math.max(0, prev[activeTab as keyof typeof prev] - 1)
        }))
        
        setMessage(null)
      }, 1000)
    }
  }

  const getCurrentData = () => {
    switch (activeTab) {
      case 'regions': return regions
      case 'conferences': return conferences
      case 'districts': return districts
      case 'paroisses': return paroisses
      default: return []
    }
  }

  const getItemParentName = (item: any) => {
    switch (activeTab) {
      case 'conferences':
        return item.region?.nom
      case 'districts':
        return item.conference?.nom
      case 'paroisses':
        return item.district?.nom
      default:
        return null
    }
  }

  const getFullHierarchy = (item: any) => {
    if (activeTab === 'paroisses' && item.district) {
      const district = item.district
      const conference = district.conference
      const region = conference?.region
      return (
        <div className="text-xs text-gray-400">
          {region?.nom} / {conference?.nom} / {district.nom}
        </div>
      )
    }
    return null
  }

  const tabs = [
    { id: 'regions', label: 'Régions', count: stats.regions },
    { id: 'conferences', label: 'Conférences', count: stats.conferences },
    { id: 'districts', label: 'Districts', count: stats.districts },
    { id: 'paroisses', label: 'Paroisses', count: stats.paroisses }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8 ">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-900 uppercase tracking-wider">Structures</h1>
        <Link href='/admin/role' className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Gérer les rôles associés →
        </Link>
        </div>
          <p className="text-sm text-gray-500 mt-1">
            Gestion de la hiérarchie des entités
          </p>
      </div>

      {/* Message de notification */}
      {message && (
        <div className={`mb-6 p-4 border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-700' 
            : 'bg-red-50 text-red-700 border-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`pb-4 px-1 text-sm font-medium transition-colors relative uppercase tracking-wider ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs text-gray-300">
                ({tab.count})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Barre d'action */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors uppercase tracking-wider border border-gray-900"
        >
          + Nouveau
        </button>
      </div>

      {/* Liste */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Nom
              </th>
              {activeTab !== 'regions' && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  {getParentLabel()}
                </th>
              )}
              {activeTab === 'paroisses' && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Hiérarchie
                </th>
              )}
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Date création
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {getCurrentData().map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.nom}
                  </div>
                </td>
                
                {activeTab !== 'regions' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {getItemParentName(item)}
                    </div>
                  </td>
                )}

                {activeTab === 'paroisses' && (
                  <td className="px-6 py-4">
                    {getFullHierarchy(item)}
                  </td>
                )}
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(item.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="text-gray-500 hover:text-gray-900 text-sm mr-4 transition-colors uppercase tracking-wider"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-gray-400 hover:text-red-600 text-sm transition-colors uppercase tracking-wider"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}

            {getCurrentData().length === 0 && (
              <tr>
                <td colSpan={activeTab === 'paroisses' ? 5 : 4} className="text-center py-12">
                  <div className="text-gray-400 text-sm uppercase tracking-wider">
                    Aucun élément pour le moment
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal - Garde les inputs avec un design légèrement adouci mais globalement carré */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-300 max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-light text-gray-900 mb-6 uppercase tracking-wider border-b border-gray-200 pb-2">
              {editingItem ? 'Modifier' : 'Nouvelle'} {activeTab.slice(0, -1)}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900 transition-colors bg-white"
                    required
                    autoFocus
                  />
                </div>

                {getParentField() && (
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                      {getParentLabel()}
                    </label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-900 transition-colors bg-white"
                      required
                    >
                      <option value="">Sélectionner...</option>
                      {getParentOptions().map((option: any) => (
                        <option key={option.id} value={option.id}>
                          {option.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors uppercase tracking-wider border border-gray-900"
                >
                  {editingItem ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-400 text-right uppercase tracking-wider">
        Dernière mise à jour : {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}