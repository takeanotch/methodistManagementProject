

// // app/paroisse/transferts/page.tsx
// import { getCurrentFidele } from '@/actions/auth'
// import { getAnneesDisponiblesForParoisse } from '@/actions/annee-conference'
// import { getTransfertsEntrants, getTransfertsSortants, getTransfertsAcceptes } from '@/actions/transfert-paroisse'
// import { notFound } from 'next/navigation'
// import Link from 'next/link'
// import TransfertsClient from './TransfertsClient'

// export default async function TransfertsPage({ searchParams }: { searchParams: Promise<{ tab?: string; annee?: string }> }) {
//   const params = await searchParams
//   const currentFidele = await getCurrentFidele()
  
//   if (!currentFidele?.paroisse_id) notFound()

//   const currentParoisseId = currentFidele.paroisse_id
//   const currentTab = params.tab || 'entrants'
//   const anneeFilter = params.annee ? parseInt(params.annee) : undefined

//   const [entrants, sortants, acceptes, anneesDisponibles] = await Promise.all([
//     getTransfertsEntrants(currentParoisseId, anneeFilter),
//     getTransfertsSortants(currentParoisseId, anneeFilter),
//     getTransfertsAcceptes(currentParoisseId, anneeFilter),
//     getAnneesDisponiblesForParoisse(currentParoisseId)
//   ])

//   const anneeActuelle = anneesDisponibles.find(a => a.is_current)
//   const paroisse = currentFidele.paroisse

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-2">
//           <Link
//             href="/paroisse"
//             className="text-gray-400 hover:text-black transition-colors"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
//             </svg>
//           </Link>
//           <div>
//             <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
//               <span>Paroisse {paroisse?.nom}</span>
//             </div>
//             <h1 className="text-2xl font-light tracking-wide">Transferts</h1>
//             <p className="text-sm text-gray-500 mt-0.5">
//               Gestion des transferts de fidèles
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation secondaire */}
//       <div className="flex gap-6 mb-6 border-b border-gray-200">
//         <Link
//           href={`/paroisse/transferts?tab=entrants${anneeFilter ? `&annee=${anneeFilter}` : ''}`}
//           className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
//             currentTab === 'entrants' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
//           }`}
//         >
//           Entrants ({entrants.length})
//         </Link>
//         <Link
//           href={`/paroisse/transferts?tab=sortants${anneeFilter ? `&annee=${anneeFilter}` : ''}`}
//           className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
//             currentTab === 'sortants' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
//           }`}
//         >
//           Sortants ({sortants.length})
//         </Link>
//         <Link
//           href={`/paroisse/transferts?tab=acceptes${anneeFilter ? `&annee=${anneeFilter}` : ''}`}
//           className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
//             currentTab === 'acceptes' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
//           }`}
//         >
//           Acceptés ({acceptes.length})
//         </Link>
//       </div>

//       {/* Client Component */}
//       <TransfertsClient
//         entrants={entrants}
//         sortants={sortants}
//         acceptes={acceptes}
//         anneesDisponibles={anneesDisponibles}
//         anneeActuelleId={anneeFilter || anneeActuelle?.annee_id}
//         currentParoisseId={currentParoisseId}
//         currentTab={currentTab}
//       />
//     </div>
//   )
// }


// app/paroisse/transferts/page.tsx
import { getCurrentFidele } from '@/actions/auth'
import { getAnneesDisponiblesForParoisse } from '@/actions/annee-conference'
import { getTransfertsEntrants, getTransfertsSortants, getTransfertsAcceptes } from '@/actions/transfert-paroisse'
import { getParoisseById } from '@/actions/structures'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TransfertsClient from './TransfertsClient'

export default async function TransfertsPage({ searchParams }: { searchParams: Promise<{ tab?: string; annee?: string }> }) {
  const params = await searchParams
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele?.paroisse_id) notFound()

  const currentParoisseId = currentFidele.paroisse_id
  const currentTab = params.tab || 'entrants'
  const anneeFilter = params.annee ? parseInt(params.annee) : undefined

  const [entrants, sortants, acceptes, anneesDisponibles, paroisseStructure] = await Promise.all([
    getTransfertsEntrants(currentParoisseId, anneeFilter),
    getTransfertsSortants(currentParoisseId, anneeFilter),
    getTransfertsAcceptes(currentParoisseId, anneeFilter),
    getAnneesDisponiblesForParoisse(currentParoisseId),
    getParoisseById(currentParoisseId)
  ])

  const anneeActuelle = anneesDisponibles.find(a => a.is_current)
  const paroisse = currentFidele.paroisse

  // Extraire les informations de structure
  const district = paroisseStructure?.district
  const conference = district?.conference
  const region = conference?.region

  const structureInfo = {
    region: region?.nom || null,
    conference: conference?.nom || null,
    district: district?.nom || null,
    paroisse: paroisseStructure?.nom || null
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/paroisse"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span>Paroisse {paroisse?.nom}</span>
            </div>
            <h1 className="text-2xl font-light tracking-wide">Transferts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion des transferts de fidèles
            </p>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <Link
          href={`/paroisse/transferts?tab=entrants${anneeFilter ? `&annee=${anneeFilter}` : ''}`}
          className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === 'entrants' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Entrants ({entrants.length})
        </Link>
        <Link
          href={`/paroisse/transferts?tab=sortants${anneeFilter ? `&annee=${anneeFilter}` : ''}`}
          className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === 'sortants' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Sortants ({sortants.length})
        </Link>
        <Link
          href={`/paroisse/transferts?tab=acceptes${anneeFilter ? `&annee=${anneeFilter}` : ''}`}
          className={`px-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            currentTab === 'acceptes' ? 'text-black border-black' : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          Acceptés ({acceptes.length})
        </Link>
      </div>

      {/* Client Component */}
      <TransfertsClient
        entrants={entrants}
        sortants={sortants}
        acceptes={acceptes}
        anneesDisponibles={anneesDisponibles}
        anneeActuelleId={anneeFilter || anneeActuelle?.annee_id}
        currentParoisseId={currentParoisseId}
        currentTab={currentTab}
        structureInfo={structureInfo}
      />
    </div>
  )
}