// import { Suspense } from 'react'
// import { getHebdosByParoisse, getUserParoisse, getHierarchyForHeader, generateNextHebdoNumber } from '@/actions/hebdo'
// import Link from 'next/link'
// import { format } from 'date-fns'
// import { fr } from 'date-fns/locale'

// export const dynamic = 'force-dynamic'

// async function HebdoList() {
//   const paroisse = await getUserParoisse()
  
//   if (!paroisse) {
//     return (
//       <div className="text-center py-12">
//         <p className="text-gray-500">Paroisse non trouvée</p>
//       </div>
//     )
//   }

//   const [hebdos, hierarchy, nextNumber] = await Promise.all([
//     getHebdosByParoisse(paroisse.id),
//     getHierarchyForHeader(paroisse.id),
//     generateNextHebdoNumber(paroisse.id)
//   ])

//   return (
//     <div className="container mx-auto px-4 py-6 max-w-6xl">
//       {/* En-tête avec hiérarchie */}
//       <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
//         <div className="text-sm text-gray-500 space-x-2">
//           <span>{hierarchy.region}</span>
//           <span>›</span>
//           <span>{hierarchy.conference}</span>
//           <span>›</span>
//           <span>{hierarchy.district}</span>
//           <span>›</span>
//           <span className="text-gray-900 font-medium">{paroisse.nom}</span>
//         </div>
        
//         <div className="mt-4 flex items-center justify-between">
//           <h1 className="text-2xl font-bold text-gray-900">Hebdomadaire</h1>
//           <Link 
//             href="/hebdo/nouveau"
//             className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
//           >
//             <span className="text-xl leading-none">+</span>
//             Nouvel Hebdo
//           </Link>
//         </div>
//       </div>

//       {/* Liste des hebdos */}
//       <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-900">Historique des Hebdos</h2>
//         </div>
        
//         <div className="p-6">
//           {hebdos.length === 0 ? (
//             <div className="text-center py-12 text-gray-500">
//               <div className="text-5xl mb-3 opacity-50">📄</div>
//               <p className="mb-4">Aucun hebdo créé</p>
//               <Link 
//                 href="/hebdo/nouveau"
//                 className="inline-block px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
//               >
//                 Créer votre premier hebdo
//               </Link>
//             </div>
//           ) : (
//             <div className="space-y-3">
//               {hebdos.map((hebdo) => (
//                 <Link
//                   key={hebdo.id}
//                   href={`/hebdo/${hebdo.id}`}
//                   className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
//                 >
//                   <div className="flex items-start justify-between">
//                     <div className="flex-1">
//                       <h3 className="text-lg font-semibold text-gray-900">{hebdo.numero}</h3>
//                       <div className="flex items-center text-sm text-gray-500 mt-1">
//                         <span className="mr-1">📅</span>
//                         {format(new Date(hebdo.date_emission), 'EEEE d MMMM yyyy', { locale: fr })}
//                       </div>
//                       {hebdo.theme && (
//                         <p className="text-sm text-gray-600 mt-2 truncate max-w-2xl">
//                           Thème : {hebdo.theme}
//                         </p>
//                       )}
//                     </div>
//                     <div className="text-sm text-gray-400">
//                       {format(new Date(hebdo.created_at), 'dd/MM/yyyy')}
//                     </div>
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default function HebdoPage() {
//   return (
//     <Suspense fallback={<div className="p-6">Chargement...</div>}>
//       <HebdoList />
//     </Suspense>
//   )
// }

import { Suspense } from 'react'
import { getHebdosByParoisse, getUserParoisse, getHierarchyForHeader, generateNextHebdoNumber } from '@/actions/hebdo'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, FileText, Plus, Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function HebdoList() {
  const paroisse = await getUserParoisse()
  
  if (!paroisse) {
    return (
      <div className="max-w-7xl mx-auto p-8 text-center">
        <div className="border border-red-200 bg-red-50 py-16 px-4 max-w-md mx-auto">
          <FileText size={48} className="mx-auto text-red-300 mb-3" />
          <p className="text-red-600 font-medium mb-2">
            Paroisse non trouvée
          </p>
          <p className="text-red-500 text-sm mb-4">
            Impossible de charger les informations de votre paroisse
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    )
  }

  const [hebdos, hierarchy, nextNumber] = await Promise.all([
    getHebdosByParoisse(paroisse.id),
    getHierarchyForHeader(paroisse.id),
    generateNextHebdoNumber(paroisse.id)
  ])

  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête avec navigation */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-light tracking-wide">
                Hebdomadaire - {paroisse.nom}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion des programmes hebdomadaires
            </p>
          </div>
        </div>
        
        {/* Fil d'Ariane hiérarchique */}
        <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
          <span>{hierarchy.region}</span>
          <span>•</span>
          <span>{hierarchy.conference}</span>
          <span>•</span>
          <span>{hierarchy.district}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <Link
            href="/hebdo/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            <Plus size={16} />
            Nouvel Hebdo
          </Link>
        </div>
        {nextNumber && (
          <div className="text-sm text-gray-500">
            Prochain numéro : <span className="font-medium text-gray-900">{nextNumber}</span>
          </div>
        )}
      </div>

      {/* Liste des hebdos */}
      <div className="border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
            Historique des Hebdos
          </h2>
        </div>
        
        <div className="p-6">
          {hebdos.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400 mb-4">Aucun hebdo créé</p>
              <Link 
                href="/hebdo/nouveau"
                className="inline-block px-4 py-2 border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                Créer votre premier hebdo
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {hebdos.map((hebdo) => (
                <Link
                  key={hebdo.id}
                  href={`/hebdo/${hebdo.id}`}
                  className="block p-4 border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-light text-gray-900">
                          {hebdo.numero}
                        </h3>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(hebdo.date_emission), 'EEEE d MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      {hebdo.theme && (
                        <p className="text-sm text-gray-600 truncate max-w-2xl">
                          {hebdo.theme}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 ml-4">
                      {format(new Date(hebdo.created_at), 'dd/MM/yyyy')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Skeleton pour le chargement
function HebdoListSkeleton() {
  return (
    <div className="max-w-7xl mx-auto animate-pulse">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-80 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-64"></div>
          </div>
        </div>
        <div className="flex gap-2 ml-10">
          <div className="h-3 bg-gray-100 rounded w-20"></div>
          <div className="h-3 bg-gray-100 rounded w-24"></div>
          <div className="h-3 bg-gray-100 rounded w-20"></div>
        </div>
      </div>

      <div className="flex justify-between mb-6">
        <div className="h-9 bg-gray-200 rounded w-32"></div>
        <div className="h-5 bg-gray-100 rounded w-40"></div>
      </div>

      <div className="border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="p-6 space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-100">
              <div className="h-5 bg-gray-200 rounded w-64 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-96"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function HebdoPage() {
  return (
    <Suspense fallback={<HebdoListSkeleton />}>
      <HebdoList />
    </Suspense>
  )
}