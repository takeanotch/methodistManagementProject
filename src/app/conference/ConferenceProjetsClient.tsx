
// // components/ConferenceProjetsClient.tsx
// 'use client'

// import { useState } from 'react'
// import { ProjetListForConference } from './ProjetListConference'

// import { CreateProjetModalForConference } from './CreateProjetModalForConference'

// interface ConferenceProjetsClientProps {
//     uniteId: number
//     conferenceNom: string
//     anneeConferenceId?: number  // Optionnel, pour filtrer l'affichage
// }

// export function ConferenceProjetsClient({ uniteId, conferenceNom, anneeConferenceId }: ConferenceProjetsClientProps) {
//     const [showCreateModal, setShowCreateModal] = useState(false)
//     const [refreshKey, setRefreshKey] = useState(0)

//     const handleRefresh = () => {
//         setRefreshKey(prev => prev + 1)
//     }

//     return (
//         <>
//             <div className="space-y-4">
//                 <div className="flex justify-end">
//                     <button
//                         onClick={() => setShowCreateModal(true)}
//                         className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
//                     >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                         </svg>
//                         Nouveau projet
//                     </button>
//                 </div>
                
//                 <ProjetListForConference
//                     key={refreshKey}
//                     uniteId={uniteId} 
//                     anneeConferenceId={anneeConferenceId}
//                     onRefresh={handleRefresh}
//                 />
//             </div>

//             <CreateProjetModalForConference
//                 isOpen={showCreateModal}
//                 onClose={() => setShowCreateModal(false)}
//                 uniteId={uniteId}
//                 conferenceNom={conferenceNom}
//                 onSuccess={handleRefresh}
//             />
//         </>
//     )
// }