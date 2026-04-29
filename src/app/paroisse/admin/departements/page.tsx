

// // app/paroisse/admin/departements/page.tsx
// import { getDepartements } from '@/actions/departements'
// import { getAffectationsStats } from '@/actions/fidele-departement'
// import { getCurrentFidele } from '@/actions/auth' // ✅ Importer la fonction
// import Link from 'next/link'
// import { redirect } from 'next/navigation'

// export default async function DepartementsPage() {
//   // ✅ Récupérer le fidèle connecté avec sa paroisse
//   const currentFidele = await getCurrentFidele()
  
//   // Si pas de fidèle connecté, rediriger vers login
//   if (!currentFidele) {
//     redirect('/login')
//   }
  
//   // ✅ Utiliser la paroisse du fidèle connecté
//   const paroisseId = currentFidele.paroisse_id
  
//   const departements = await getDepartements() 
//   const stats = await getAffectationsStats(paroisseId)

//   const typeLabels = {
//     commite: { label: 'Comité', color: 'bg-purple-50 text-purple-600' },
//     agence_programme: { label: 'Agence/Programme', color: 'bg-blue-50 text-blue-600' },
//     normal: { label: 'Normal', color: 'bg-gray-50 text-gray-600' }
//   }

//   return (
//     <div className="max-w-6xl mx-auto px-4 py-8">
//       {/* En-tête avec le nom de la paroisse */}
//       <div className="mb-8 flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-light text-gray-900">
//             Départements - {currentFidele.paroisse?.nom || 'Ma paroisse'}
//           </h1>
//           <p className="text-sm text-gray-500 mt-1">
//             {departements.length} département{departements.length > 1 ? 's' : ''} au total
//           </p>
//         </div>
//         <Link
//           href="/admin/departements/nouveau"
//           className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
//         >
//           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
//           </svg>
//           Nouveau département
//         </Link>
//       </div>

//       {/* Statistiques rapides - filtrées par la paroisse du fidèle */}
//       {stats && (
//         <div className="grid grid-cols-3 gap-4 mb-8">
//           <div className="bg-white rounded-lg border border-gray-100 p-4">
//             <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total affectations</p>
//             <p className="text-2xl font-light text-gray-900">{stats.total}</p>
//           </div>
//           <div className="bg-white rounded-lg border border-gray-100 p-4">
//             <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Actifs</p>
//             <p className="text-2xl font-light text-green-600">{stats.actifs}</p>
//           </div>
//           <div className="bg-white rounded-lg border border-gray-100 p-4">
//             <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Inactifs</p>
//             <p className="text-2xl font-light text-gray-400">{stats.inactifs}</p>
//           </div>
//         </div>
//       )}

//       {/* Grille des départements */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {departements.map((departement) => {
//           const typeInfo = typeLabels[departement.type as keyof typeof typeLabels] || typeLabels.normal
//           const deptStats = stats?.parDepartement[departement.id.toString()]
          
//           return (
//             <div
//               key={departement.id}
//               className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all group"
//             >
//               <div className="p-6">
//                 {/* En-tête avec type et date */}
//                 <div className="flex items-start justify-between mb-4">
//                   <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.color}`}>
//                     {typeInfo.label}
//                   </span>
//                   <span className="text-xs text-gray-400">
//                     {new Date(departement.created_at).toLocaleDateString('fr-FR', {
//                       day: '2-digit',
//                       month: '2-digit',
//                       year: 'numeric'
//                     })}
//                   </span>
//                 </div>

//                 {/* Nom du département */}
//                 <h2 className="text-lg font-medium text-gray-900 mb-2">
//                   {departement.nom}
//                 </h2>

//                 {/* Description (tronquée) */}
//                 {departement.description && (
//                   <p className="text-sm text-gray-500 mb-4 line-clamp-2">
//                     {departement.description}
//                   </p>
//                 )}

//                 {/* Statistiques du département - maintenant pour cette paroisse */}
//                 {deptStats ? (
//                   <div className="flex items-center gap-4 mb-4 text-sm">
//                     <div className="flex items-center gap-1">
//                       <span className="text-gray-700 font-medium">{deptStats.total}</span>
//                       <span className="text-gray-400 text-xs">membres</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <span className="text-green-600 font-medium">{deptStats.actifs}</span>
//                       <span className="text-gray-400 text-xs">actifs</span>
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="flex items-center gap-4 mb-4 text-sm">
//                     <div className="flex items-center gap-1">
//                       <span className="text-gray-400 font-medium">0</span>
//                       <span className="text-gray-400 text-xs">membres</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <span className="text-gray-400 font-medium">0</span>
//                       <span className="text-gray-400 text-xs">actifs</span>
//                     </div>
//                   </div>
//                 )}

//                 {/* Aperçu des rôles */}
//                 {departement.roles_config && departement.roles_config.length > 0 && (
//                   <div className="flex flex-wrap gap-1 mb-4">
//                     {departement.roles_config.slice(0, 4).map((role: any) => (
//                       <span
//                         key={role.id}
//                         className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-100"
//                         style={{ borderLeftColor: role.couleur, borderLeftWidth: '3px' }}
//                       >
//                         {role.label}
//                       </span>
//                     ))}
//                     {departement.roles_config.length > 4 && (
//                       <span className="text-xs px-2 py-1 bg-gray-50 text-gray-400 rounded-full">
//                         +{departement.roles_config.length - 4}
//                       </span>
//                     )}
//                   </div>
//                 )}

//                 {/* Bouton d'action */}
//                 <div className="flex items-center justify-between pt-4 border-t border-gray-50">
//                   <Link
//                     href={`/paroisse/departements/${departement.id}`}
//                     className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors group-hover:text-gray-600"
//                   >
//                     Voir les détails
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
//                     </svg>
//                   </Link>
                  
//                   <div className="flex items-center gap-2">
//                     <Link
//                       href={`/paroisse/departements/${departement.id}/modifier`}
//                       className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded"
//                       title="Modifier"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
//                       </svg>
//                     </Link>
//                     <Link
//                       href={`/paroisse/departements/${departement.id}/ajouter-fidele`}
//                       className="p-2 text-gray-300 hover:text-gray-600 transition-colors rounded"
//                       title="Ajouter un fidèle"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
//                       </svg>
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )
//         })}
//       </div>

//       {/* Message si aucun département */}
//       {departements.length === 0 && (
//         <div className="text-center py-16 bg-gray-50/50 rounded-lg border border-gray-100">
//           <p className="text-gray-400 mb-4">Aucun département n'a été créé</p>
//           <Link
//             href="/admin/departements/nouveau"
//             className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
//           >
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
//             </svg>
//             Créer le premier département
//           </Link>
//         </div>
//       )}
//     </div>
//   )
// }


// app/paroisse/admin/departements/page.tsx
import { getDepartements } from '@/actions/departements'
import { getAffectationsStats } from '@/actions/fidele-departement'
import { getCurrentFidele } from '@/actions/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { 
  Building2, 
  Users, 
  Activity, 
  FolderOpen,
  ChevronRight,
  Calendar,
  UserCheck
} from 'lucide-react'

export default async function DepartementsPage() {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const paroisseId = currentFidele.paroisse_id
  const paroisseNom = currentFidele.paroisse?.nom || 'ma paroisse'
  
  const departements = await getDepartements() 
  const stats = await getAffectationsStats(paroisseId)

  const typeLabels = {
    commite: { label: 'Comité', color: 'bg-purple-50 text-purple-600 border-purple-200' },
    agence_programme: { label: 'Agence/Programme', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    normal: { label: 'Normal', color: 'bg-gray-50 text-gray-600 border-gray-200' }
  }

  const totalMembres = stats?.total || 0
  const totalActifs = stats?.actifs || 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              Départements de {paroisseNom}
            </h1>
            <p className="text-sm text-gray-500">
              {departements.length} département{departements.length > 1 ? 's' : ''} • {totalMembres} membre{totalMembres > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Building2 size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{departements.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Départements</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Users size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalMembres}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Membres totaux</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalActifs}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Membres actifs</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <FolderOpen size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{departements.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total départements</p>
        </div>
      </div>

      {/* Bouton Nouveau département */}
      {/* <div className="flex justify-end mb-6">
        <Link
          href="/admin/departements/nouveau"
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau département
        </Link>
      </div> */}

      {/* Liste des départements */}
      {departements.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 mb-4">Aucun département trouvé paroisse !Veuillez rafraichir la page ou contacter un administrateur</p>
          {/* <Link
            href="/admin/departements/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Créer le premier département
          </Link> */}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departements.sort((a, b) => a.nom.localeCompare(b.nom)).map((departement) => {
            const typeInfo = typeLabels[departement.type as keyof typeof typeLabels] || typeLabels.normal
            const deptStats = stats?.parDepartement[departement.id.toString()]
            
            return (
              <div
                key={departement.id}
                className="bg-white border border-gray-200 hover:border-gray-300 transition-all group"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium text-lg">{departement.nom}</h3>
                      </div>
                      
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                  
                  {departement.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      {departement.description}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">{deptStats?.total || 0}</div>
                        <div className="text-xs text-gray-400">Membres</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <UserCheck size={14} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium">{deptStats?.actifs || 0}</div>
                        <div className="text-xs text-gray-400">Actifs</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-400">-</div>
                        <div className="text-xs text-gray-400">Activités</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FolderOpen size={14} className="text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-400">-</div>
                        <div className="text-xs text-gray-400">Projets</div>
                      </div>
                    </div>
                  </div>

                  {/* Rôles */}
                  {departement.roles_config && departement.roles_config.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                      {departement.roles_config.slice(0, 3).map((role: any) => (
                        <span
                          key={role.id}
                          className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-100"
                          style={{ borderLeftColor: role.couleur, borderLeftWidth: '3px' }}
                        >
                          {role.label}
                        </span>
                      ))}
                      {departement.roles_config.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-400 rounded-full">
                          +{departement.roles_config.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <Link
                      href={`/paroisse/admin/departements/${departement.id}`}
                      className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors"
                    >
                      Voir les détails
                      <ChevronRight size={14} />
                    </Link>
                    
                    {/* <div className="flex items-center gap-1">
                      <Link
                        href={`/paroisse/departements/${departement.id}/modifier`}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      <Link
                        href={`/paroisse/departements/${departement.id}/ajouter-fidele`}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded"
                        title="Ajouter un fidèle"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </Link>
                    </div> */}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}