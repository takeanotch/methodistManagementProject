// // app/unauthorized/page.tsx (version simple sans animation)
// import Link from 'next/link'

// export default function UnauthorizedPage() {
//   return (
//     <div className="min-h-screen bg-red-50 flex items-center justify-center px-4">
//       <div className="max-w-md w-full">
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="bg-red-600 p-4">
//             <div className="flex justify-center">
//               <svg 
//                 className="w-16 h-16 text-white" 
//                 fill="none" 
//                 stroke="currentColor" 
//                 viewBox="0 0 24 24"
//               >
//                 <path 
//                   strokeLinecap="round" 
//                   strokeLinejoin="round" 
//                   strokeWidth={2} 
//                   d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
//                 />
//               </svg>
//             </div>
//           </div>
          
//           <div className="p-6 text-center">
//             <h1 className="text-2xl font-bold text-gray-900 mb-2">
//               Accès non autorisé
//             </h1>
//             <p className="text-gray-600 mb-6">
//               Vous n'avez pas les droits nécessaires pour accéder à cette page.
//             </p>
//             <Link
//               href="/"
//               className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
//             >
//               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
//               </svg>
//               Retour à l'accueil
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
// app/unauthorized/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentFidele } from '@/actions/auth'

export default async function UnauthorizedPage() {
  // Vérifier si l'utilisateur est connecté pour adapter le message
  const user = await getCurrentFidele()
  
  return (
    <div className="min-h-screen -100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Carte principale */}
        <div className="bg-white  shadow-xl overflow-hidden">
          {/* Bande rouge supérieure */}
          <div className="bg-red-600 h-2"></div>
          
          <div className="p-8">
            {/* Icône */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <svg 
                  className="w-10 h-10 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>
            
            {/* Titre */}
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              Accès non autorisé
            </h1>
            
            {/* Message */}
            <div className="text-center mb-8">
              <p className="text-gray-600 mb-2">
                {user 
                  ? `Bonjour ${user.prenom || ''} ${user.nom || ''}, vous n'avez pas les droits nécessaires pour accéder à cette page.`
                  : 'Vous n\'avez pas les droits nécessaires pour accéder à cette page.'
                }
              </p>
              <p className="text-sm text-gray-500">
                Veuillez contacter l'administrateur si vous pensez qu'il s'agit d'une erreur.
              </p>
            </div>
            
            {/* Boutons d'action */}
            <div className="space-y-3">
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white  hover:bg-red-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Retour à l'accueil
              </Link>
              
              {!user && (
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Se connecter
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Code d'erreur */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">
            Code d'erreur: 403 - Accès interdit
          </p>
        </div>
      </div>
    </div>
  )
}