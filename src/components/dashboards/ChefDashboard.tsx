// // app/chef-district/annees/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import {
//   getChefDistrictInfo,
//   getDepartementsByDistrict,
//   getAnnees,
//   getAnneesDistrict,
//   getAnneeEnCours,
//   ouvrirNouvelleAnnee,
//   fermerAnnee,
//   reactiverAnnee
// } from '@/actions/chef-district-annees'

// interface ChefInfo {
//   id: number
//   fidele_id: number
//   departement_id: number
//   district_id: number
//   departement_nom: string
//   district_nom: string
//   fidele_nom: string
//   fidele_prenom: string
// }

// interface Annee {
//   id: number
//   label: string
// }

// interface AnneeDistrict {
//   id: number
//   district_id: number
//   departement_id: number
//   annee_id: number
//   state: 'current' | 'last_year' | 'next_year'
//   is_active: boolean
//   created_at: string
//   annee?: Annee
// }

// export default function ChefDistrictAnneesPage() {
//   const router = useRouter()
  
//   // États
//   const [chefInfo, setChefInfo] = useState<ChefInfo | null>(null)
//   const [departements, setDepartements] = useState<any[]>([])
//   const [annees, setAnnees] = useState<Annee[]>([])
//   const [anneesOuvertes, setAnneesOuvertes] = useState<{[key: number]: AnneeDistrict[]}>({})
//   const [anneesEnCours, setAnneesEnCours] = useState<{[key: number]: AnneeDistrict | null}>({})
  
//   const [selectedDepartement, setSelectedDepartement] = useState('')
//   const [selectedAnnee, setSelectedAnnee] = useState('')
//   const [departementCourant, setDepartementCourant] = useState<any>(null)
  
//   const [loading, setLoading] = useState(true)
//   const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
//   const [showForm, setShowForm] = useState(false)

//   // Charger les données initiales
//   useEffect(() => {
//     loadInitialData()
//   }, [])

//   // Charger l'historique quand un département est sélectionné
//   useEffect(() => {
//     if (selectedDepartement && chefInfo) {
//       loadHistoriqueDepartement(parseInt(selectedDepartement))
//       const dept = departements.find(d => d.id === parseInt(selectedDepartement))
//       setDepartementCourant(dept || null)
//     } else {
//       setDepartementCourant(null)
//     }
//   }, [selectedDepartement, chefInfo, departements])

//   const loadInitialData = async () => {
//     try {
//       setLoading(true)
      
//       // Récupérer les infos du chef connecté
//       const chefData = await getChefDistrictInfo()
      
//       if (!chefData) {
//         setMessage({ type: 'error', text: 'Vous n\'êtes pas autorisé à accéder à cette page' })
//         setTimeout(() => router.push('/'), 3000)
//         return
//       }
      
//       setChefInfo(chefData)
      
//       // Récupérer les départements du district
//       const depsData = await getDepartementsByDistrict(chefData.district_id)
//       setDepartements(depsData)
      
//       // Récupérer toutes les années
//       const anneesData = await getAnnees()
//       setAnnees(anneesData)
      
//       // Charger les années pour tous les départements
//       await loadAllAnnees(chefData.district_id, depsData)
      
//     } catch (error) {
//       setMessage({ type: 'error', text: 'Erreur chargement des données' })
//     } finally {
//       setLoading(false)
//     }
//   }

//   const loadAllAnnees = async (districtId: number, deps: any[]) => {
//     const anneesOuvertesMap: {[key: number]: AnneeDistrict[]} = {}
//     const anneesEnCoursMap: {[key: number]: AnneeDistrict | null} = {}
    
//     await Promise.all(deps.map(async (dep) => {
//       const [historique, enCours] = await Promise.all([
//         getAnneesDistrict(districtId, dep.id),
//         getAnneeEnCours(districtId, dep.id)
//       ])
//       anneesOuvertesMap[dep.id] = historique
//       anneesEnCoursMap[dep.id] = enCours
//     }))
    
//     setAnneesOuvertes(anneesOuvertesMap)
//     setAnneesEnCours(anneesEnCoursMap)
//   }

//   const loadHistoriqueDepartement = async (departementId: number) => {
//     if (!chefInfo) return
    
//     try {
//       const [historique, enCours] = await Promise.all([
//         getAnneesDistrict(chefInfo.district_id, departementId),
//         getAnneeEnCours(chefInfo.district_id, departementId)
//       ])
      
//       setAnneesOuvertes(prev => ({
//         ...prev,
//         [departementId]: historique
//       }))
      
//       setAnneesEnCours(prev => ({
//         ...prev,
//         [departementId]: enCours
//       }))
//     } catch (error) {
//       setMessage({ type: 'error', text: 'Erreur chargement historique' })
//     }
//   }

//   const handleOuvrirAnnee = async (formData: FormData) => {
//     if (!chefInfo) return
    
//     setMessage(null)
//     const result = await ouvrirNouvelleAnnee(formData)
    
//     if (result.error) {
//       setMessage({ type: 'error', text: result.error })
//     } else if (result.success) {
//       setMessage({ type: 'success', text: result.message || 'Année ouverte avec succès' })
//       if (selectedDepartement) {
//         loadHistoriqueDepartement(parseInt(selectedDepartement))
//       }
//       setSelectedAnnee('')
//       setShowForm(false)
//     }
//   }

//   const handleFermerAnnee = async (id: number) => {
//     if (!confirm('Voulez-vous vraiment fermer cette année ?')) return
    
//     const formData = new FormData()
//     formData.append('id', id.toString())
    
//     const result = await fermerAnnee(formData)
    
//     if (result.error) {
//       setMessage({ type: 'error', text: result.error })
//     } else {
//       setMessage({ type: 'success', text: result.message || 'Année fermée avec succès' })
//       if (selectedDepartement) {
//         loadHistoriqueDepartement(parseInt(selectedDepartement))
//       }
//     }
//   }

//   const handleReactiverAnnee = async (id: number) => {
//     if (!confirm('Voulez-vous vraiment réactiver cette année comme année en cours ?')) return
    
//     const formData = new FormData()
//     formData.append('id', id.toString())
    
//     const result = await reactiverAnnee(formData)
    
//     if (result.error) {
//       setMessage({ type: 'error', text: result.error })
//     } else {
//       setMessage({ type: 'success', text: result.message || 'Année réactivée avec succès' })
//       if (selectedDepartement) {
//         loadHistoriqueDepartement(parseInt(selectedDepartement))
//       }
//     }
//   }

//   const getStateBadge = (state: string, isActive: boolean) => {
//     if (!isActive) {
//       return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>
//     }
//     switch (state) {
//       case 'current':
//         return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">En cours</span>
//       case 'last_year':
//         return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">Année passée</span>
//       case 'next_year':
//         return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">Année suivante</span>
//       default:
//         return null
//     }
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-gray-500">Chargement...</div>
//       </div>
//     )
//   }

//   if (!chefInfo) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
//         <div className="text-red-500">Accès non autorisé</div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
//         {/* En-tête avec infos du chef */}
//         <div className="mb-8 bg-white rounded-lg shadow p-6">
//           <h1 className="text-2xl font-bold text-gray-900">
//             Gestion des années - {chefInfo.district_nom}
//           </h1>
//           <p className="text-gray-600 mt-2">
//             <span className="font-medium">Chef du département :</span> {chefInfo.departement_nom}
//           </p>
//           <p className="text-sm text-gray-500">
//             {chefInfo.fidele_prenom} {chefInfo.fidele_nom}
//           </p>
//         </div>

//         {message && (
//           <div className={`mb-6 p-4 rounded-md ${
//             message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
//           }`}>
//             {message.text}
//           </div>
//         )}

//         {/* Sélection du département */}
//         <div className="bg-white rounded-lg shadow p-6 mb-8">
//           <h2 className="text-lg font-semibold mb-4">Sélectionner un département</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Département
//               </label>
//               <select
//                 value={selectedDepartement}
//                 onChange={(e) => setSelectedDepartement(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Choisir un département</option>
//                 {departements.map((dep) => (
//                   <option key={dep.id} value={dep.id}>
//                     {dep.nom}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Formulaire d'ouverture */}
//         {selectedDepartement && (
//           <div className="bg-white rounded-lg shadow p-6 mb-8">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-lg font-semibold">
//                 Département : {departementCourant?.nom}
//               </h2>
//               <button
//                 onClick={() => setShowForm(!showForm)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//               >
//                 {showForm ? 'Annuler' : 'Ouvrir une nouvelle année'}
//               </button>
//             </div>
            
//             {anneesEnCours[parseInt(selectedDepartement)] && (
//               <div className="mb-4 p-4 bg-blue-50 rounded-md">
//                 <p className="text-sm text-blue-700">
//                   <span className="font-medium">Année en cours actuelle :</span>{' '}
//                   {anneesEnCours[parseInt(selectedDepartement)]?.annee?.label}
//                 </p>
//               </div>
//             )}

//             {showForm && (
//               <form action={handleOuvrirAnnee} className="space-y-4 mt-4">
//                 <input type="hidden" name="district_id" value={chefInfo.district_id} />
//                 <input type="hidden" name="departement_id" value={selectedDepartement} />
                
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Année à ouvrir
//                   </label>
//                   <select
//                     name="annee_id"
//                     value={selectedAnnee}
//                     onChange={(e) => setSelectedAnnee(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     required
//                   >
//                     <option value="">Sélectionner une année</option>
//                     {annees.map((annee) => (
//                       <option key={annee.id} value={annee.id}>
//                         {annee.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <button
//                   type="submit"
//                   className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
//                 >
//                   Confirmer l'ouverture
//                 </button>
//               </form>
//             )}

//             {/* Historique du département sélectionné */}
//             {selectedDepartement && anneesOuvertes[parseInt(selectedDepartement)]?.length > 0 && (
//               <div className="mt-8">
//                 <h3 className="text-md font-medium mb-4">Historique des années</h3>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200">
//                     <thead className="bg-gray-50">
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ouverture</th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-gray-200">
//                       {anneesOuvertes[parseInt(selectedDepartement)].map((item) => (
//                         <tr key={item.id}>
//                           <td className="px-6 py-4 whitespace-nowrap font-medium">
//                             {item.annee?.label}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             {getStateBadge(item.state, item.is_active)}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                             {new Date(item.created_at).toLocaleDateString('fr-FR')}
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
//                             {item.state === 'current' && item.is_active && (
//                               <button
//                                 onClick={() => handleFermerAnnee(item.id)}
//                                 className="text-yellow-600 hover:text-yellow-900"
//                               >
//                                 Fermer
//                               </button>
//                             )}
//                             {item.state !== 'current' && (
//                               <button
//                                 onClick={() => handleReactiverAnnee(item.id)}
//                                 className="text-green-600 hover:text-green-900"
//                               >
//                                 Réactiver
//                               </button>
//                             )}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {selectedDepartement && (!anneesOuvertes[parseInt(selectedDepartement)] || anneesOuvertes[parseInt(selectedDepartement)].length === 0) && (
//               <div className="mt-8 p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
//                 Aucune année n'a encore été ouverte pour ce département
//               </div>
//             )}
//           </div>
//         )}

//         {/* Vue d'ensemble de tous les départements */}
//         <div className="bg-white rounded-lg shadow overflow-hidden">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-lg font-semibold">État des années par département</h2>
//           </div>
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Département</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Année en cours</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre d'années</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière ouverture</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 {departements.map((dep) => {
//                   const enCours = anneesEnCours[dep.id]
//                   const historique = anneesOuvertes[dep.id] || []
//                   const derniereOuverture = historique[0]?.created_at
                  
//                   return (
//                     <tr key={dep.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedDepartement(dep.id.toString())}>
//                       <td className="px-6 py-4 whitespace-nowrap font-medium">{dep.nom}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {enCours ? (
//                           <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
//                             {enCours.annee?.label}
//                           </span>
//                         ) : (
//                           <span className="text-gray-400">Aucune</span>
//                         )}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {historique.length}
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                         {derniereOuverture ? new Date(derniereOuverture).toLocaleDateString('fr-FR') : '-'}
//                       </td>
//                     </tr>
//                   )
//                 })}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }