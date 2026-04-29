// // app/cabinet/membres/client-page.tsx
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { ChevronLeft, Plus, Calendar, Users } from 'lucide-react'
// import MembresCabinetList from './MembresCabinetList'
// import AjouterMembreModal from './AjouterMembreModal'

// interface ClientMembresPageProps {
//   paroisseId: number
//   paroisseNom: string
//   anneesDisponibles: any[]
//   anneeConferenceId: number | null
//   anneeEnCours: any | null
//   membres: any[]
//   fidelesParoisse: any[]
//   totalMembres: number
//   actifs: number
//   inactifs: number
//   isCurrentYear: boolean
//   anneeSelectionnee: any | null
// }

// export default function ClientMembresPage({
//   paroisseId,
//   paroisseNom,
//   anneesDisponibles,
//   anneeConferenceId,
//   anneeEnCours,
//   membres,
//   fidelesParoisse,
//   totalMembres,
//   actifs,
//   inactifs,
//   isCurrentYear,
//   anneeSelectionnee
// }: ClientMembresPageProps) {
//   const [isModalOpen, setIsModalOpen] = useState(false)
//   const [refreshKey, setRefreshKey] = useState(0)

//   const handleSuccess = () => {
//     setRefreshKey(prev => prev + 1)
//   }

//   return (
//     <div className=" max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-2">
//           <Link
//             href="/cabinet"
//             className="text-gray-400 hover:text-black transition-colors"
//           >
//             <ChevronLeft size={20} />
//           </Link>
//           <div>
//             <h1 className="text-2xl font-light tracking-wide">Membres du Cabinet</h1>
//             <p className="text-sm text-gray-500 mt-0.5">{paroisseNom}</p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2 text-xs text-gray-400 ml-9">
//           <Link href="/cabinet" className="hover:text-black">
//             Vue d&apos;ensemble
//           </Link>
//           <span>•</span>
//           <Link href="/cabinet/activites" className="hover:text-black">
//             Activités
//           </Link>
//           <span>•</span>
//           <span className="font-medium text-black">Membres</span>
//         </div>
//       </div>

//       {/* Stats rapides */}
//       <div className="grid grid-cols-3 gap-3 mb-6">
//         <div className="bg-white border border-gray-200 p-3">
//           <div className="text-xl font-light">{totalMembres}</div>
//           <div className="text-xs text-gray-500">Total membres</div>
//         </div>
//         <div className="bg-green-50 border border-green-200 p-3">
//           <div className="text-xl font-light text-green-700">{actifs}</div>
//           <div className="text-xs text-green-600">Actifs</div>
//         </div>
//         <div className="bg-gray-50 border border-gray-200 p-3">
//           <div className="text-xl font-light text-gray-500">{inactifs}</div>
//           <div className="text-xs text-gray-500">Inactifs</div>
//         </div>
//       </div>

    
//       {/* Barre d'outils */}
//       <div className="flex gap-3 items-center ">
//         <button
//           onClick={() => setIsModalOpen(true)}
//           className="flex items-center gap-2 px-4   flex-grow-0 h-10 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
//           disabled={!isCurrentYear}
//         >
//           <Plus size={16} />
//           Ajouter un membre
//         </button>
//           {/* Sélecteur d'année */}
//       {anneesDisponibles && anneesDisponibles.length > 0 && (
//         <div className="mb-6">
//           <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Année de conférence</div>
//           <div className="flex gap-2 flex-wrap">
//             {anneesDisponibles.map((annee) => (
//               <a
//                 key={annee.id}
//                 href={`/cabinet/membres?annee_conference=${annee.id}`}
//                 className={`px-4 py-2 text-sm border transition-colors ${
//                   anneeConferenceId === annee.id
//                     ? 'bg-black text-white border-black'
//                     : 'bg-white border-gray-300 text-gray-600 hover:border-black'
//                 }`}
//               >
//                 {annee.label}
//                 {annee.is_current && ' (en cours)'}
//               </a>
//             ))}
//           </div>
//         </div>
//       )}

//       </div>
//       {/* Indicateur d'historique */}
//       {anneeSelectionnee && anneeConferenceId !== anneeEnCours?.id && (
//         <div className="mb-4 p-3 border border-amber-200 bg-amber-50 text-amber-700 text-sm">
//           <Calendar size={14} className="inline mr-2" />
//           Affichage de l&apos;historique pour l&apos;année {anneeSelectionnee.label}
//         </div>
//       )}


//       {/* Liste des membres */}
//       {membres.length === 0 ? (
//         <div className="border border-gray-200 py-9 text-center bg-white">
//           <Users size={48} className="mx-auto text-gray-300 mb-3" />
//           <p className="text-gray-400 mb-4">Aucun membre dans le cabinet pastoral</p>
//           {isCurrentYear && (
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
//             >
//               <Plus size={16} />
//               Ajouter un membre
//             </button>
//           )}
//         </div>
//       ) : (
//         <div className="bg-white ">
//           <MembresCabinetList
//             key={refreshKey}
//             membres={membres}
//             paroisseId={paroisseId}
//             paroisseNom={paroisseNom}
//             isCurrentYear={isCurrentYear}
//           />
//         </div>
//       )}

//       {/* Modal d'ajout */}
//       <AjouterMembreModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         paroisseId={paroisseId}
//         paroisseNom={paroisseNom}
//         fidelesParoisse={fidelesParoisse}
//         anneeConferenceId={anneeConferenceId}
//         onSuccess={handleSuccess}
//       />
//     </div>
//   )
// }