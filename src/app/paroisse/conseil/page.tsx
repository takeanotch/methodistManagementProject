// // app/paroisse/conseil/page.tsx
// import { redirect } from 'next/navigation'
// import { getUser, getCurrentFidele } from '@/actions/auth'
// import { getCurrentAnneeConference, getAnneesByConference } from '@/actions/annee-conference'
// import { supabase } from '@/lib/supabase'
// import ConseilClient from './ConseilClient'

// async function getConferenceFromParoisse(paroisseId: number) {
//   try {
//     const { data: paroisse } = await supabase
//       .from('paroisse')
//       .select(`
//         district:district_id (
//           conference:conference_id (id, nom)
//         )
//       `)
//       .eq('id', paroisseId)
//       .single()

//     if (paroisse?.district) {
//       const district = Array.isArray(paroisse.district) 
//         ? paroisse.district[0] 
//         : paroisse.district
      
//       if (district?.conference) {
//         const conference = Array.isArray(district.conference) 
//           ? district.conference[0] 
//           : district.conference
//         return conference
//       }
//     }
    
//     return null
//   } catch (error) {
//     console.error('Erreur getConferenceFromParoisse:', error)
//     return null
//   }
// }

// async function getConseilMembres(paroisseId: number, anneeConferenceId: number) {
//   const { data, error } = await supabase
//     .from('conseil_admin_membre')
//     .select(`
//       id,
//       role,
//       fidele:fidele_id (
//         id, 
//         nom, 
//         post_nom, 
//         prenom, 
//         contact, 
//         profile_img,
//         sexe
//       )
//     `)
//     .eq('paroisse_id', paroisseId)
//     .eq('annee_conference_id', anneeConferenceId)

//   if (error) {
//     console.error('Erreur récupération membres conseil:', error)
//     return []
//   }

//   return data
// }

// async function getConseils(paroisseId: number, anneeConferenceId: number) {
//   const { data, error } = await supabase
//     .from('conseil_admin')
//     .select(`
//       *,
//       documents:conseil_admin_document(*)
//     `)
//     .eq('paroisse_id', paroisseId)
//     .eq('annee_conference_id', anneeConferenceId)
//     .order('date_reunion', { ascending: false })

//   if (error) {
//     console.error('Erreur récupération conseils:', error)
//     return []
//   }

//   return data
// }

// export default async function ConseilPage(props: {
//   searchParams?: Promise<{ annee_conference?: string }>
// }) {
//   const searchParams = await props.searchParams || {}
  
//   const user = await getUser()
//   const currentFidele = await getCurrentFidele()

//   if (!user) {
//     redirect('/login')
//   }
  
//   if (!currentFidele?.paroisse_id) {
//     return (
//       <div className="p-8 max-w-7xl mx-auto">
//         <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
//           <div className="w-16 h-16 mx-auto mb-4 text-yellow-400">
//             <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//           </div>
//           <h2 className="text-lg font-light text-yellow-800 mb-2">Paroisse non définie</h2>
//           <p className="text-sm text-yellow-600">
//             Vous n'êtes pas rattaché à une paroisse. Contactez un administrateur.
//           </p>
//         </div>
//       </div>
//     )
//   }

//   // Récupérer la conférence de la paroisse
//   const conference = await getConferenceFromParoisse(currentFidele.paroisse_id)
  
//   let anneesConference: any[] = []
//   let currentAnneeConference: any = null
  
//   if (conference?.id) {
//     anneesConference = await getAnneesByConference(conference.id)
//     currentAnneeConference = await getCurrentAnneeConference(conference.id)
//   }
  
//   // Déterminer l'année de conférence sélectionnée
//   let anneeConferenceSelectionneeId: number | undefined
//   if (searchParams.annee_conference) {
//     anneeConferenceSelectionneeId = parseInt(searchParams.annee_conference)
//   } else if (currentAnneeConference?.id) {
//     anneeConferenceSelectionneeId = currentAnneeConference.id
//   }

//   // Récupérer les données du conseil
//   let membres: any[] = []
//   let conseils: any[] = []
  
//   if (anneeConferenceSelectionneeId) {
//     membres = await getConseilMembres(currentFidele.paroisse_id, anneeConferenceSelectionneeId)
//     conseils = await getConseils(currentFidele.paroisse_id, anneeConferenceSelectionneeId)
//   }

//   const anneesSimplifiees = anneesConference.map(ac => ({
//     id: ac.id,
//     label: ac.annee?.label || '',
//     is_current: ac.is_current
//   }))

//   const paroisse = currentFidele.paroisse
//   const dashboardPath = user.role?.nom === 'admin' ? '/admin' : '/gestion'

//   return (
//     <div className="p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="mb-6">
//         <div className="flex items-center gap-4 mb-2">
//           <a
//             href={dashboardPath}
//             className="text-gray-400 hover:text-black transition-colors"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
//             </svg>
//           </a>
//           <div>
//             <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
//               <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">
//                 {user.role?.nom || 'Membre'}
//               </span>
//               <span>•</span>
//               <span>{user.nom_complet}</span>
//               <span>•</span>
//               <span>Paroisse {paroisse?.nom}</span>
//             </div>
//             <h1 className="text-2xl font-light tracking-wide">Conseil d'administration</h1>
//             <p className="text-sm text-gray-500 mt-0.5">
//               Gestion des membres et des réunions du conseil
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Navigation secondaire */}
//       <div className="flex gap-6 mb-6 border-b border-gray-200">
//         <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
//           Conseil d'administration
//         </span>
//       </div>

//       {/* Client Component */}
//       <ConseilClient 
//         membres={membres}
//         conseils={conseils}
//         paroisseId={currentFidele.paroisse_id}
//         paroisseNom={paroisse?.nom}
//         anneeActuelleId={currentAnneeConference?.id}
//         anneesDisponibles={anneesSimplifiees}
//         anneeSelectionneeId={anneeConferenceSelectionneeId}
//       />
//     </div>
//   )
// }
// app/paroisse/conseil/page.tsx
import { redirect } from 'next/navigation'
import { getUser, getCurrentFidele } from '@/actions/auth'
import { getCurrentAnneeConference, getAnneesByConference } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'
import ConseilClient from './ConseilClient'

async function getConferenceFromParoisse(paroisseId: number) {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id, nom)
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (paroisse?.district) {
      const district = Array.isArray(paroisse.district) 
        ? paroisse.district[0] 
        : paroisse.district
      
      if (district?.conference) {
        const conference = Array.isArray(district.conference) 
          ? district.conference[0] 
          : district.conference
        return conference
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getConferenceFromParoisse:', error)
    return null
  }
}

async function getConseilMembres(paroisseId: number, anneeConferenceId: number) {
  const { data, error } = await supabase
    .from('conseil_admin_membre')
    .select(`
      id,
      role,
      fidele:fidele_id (
        id, 
        nom, 
        post_nom, 
        prenom, 
        contact, 
        profile_img,
        sexe
      )
    `)
    .eq('paroisse_id', paroisseId)
    .eq('annee_conference_id', anneeConferenceId)

  if (error) {
    console.error('Erreur récupération membres conseil:', error)
    return []
  }

  return data
}

async function getConseils(paroisseId: number, anneeConferenceId: number) {
  const { data, error } = await supabase
    .from('conseil_admin')
    .select(`
      *,
      documents:conseil_admin_document(*)
    `)
    .eq('paroisse_id', paroisseId)
    .eq('annee_conference_id', anneeConferenceId)
    .order('date_reunion', { ascending: false })

  if (error) {
    console.error('Erreur récupération conseils:', error)
    return []
  }

  return data
}

export default async function ConseilPage(props: {
  searchParams?: Promise<{ annee_conference?: string }>
}) {
  const searchParams = await props.searchParams || {}
  
  const user = await getUser()
  const currentFidele = await getCurrentFidele()

  if (!user) {
    redirect('/login')
  }
  
  if (!currentFidele?.paroisse_id) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-yellow-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-light text-yellow-800 mb-2">Paroisse non définie</h2>
          <p className="text-sm text-yellow-600">
            Vous n'êtes pas rattaché à une paroisse. Contactez un administrateur.
          </p>
        </div>
      </div>
    )
  }

  // Récupérer la conférence de la paroisse
  const conference = await getConferenceFromParoisse(currentFidele.paroisse_id)
  
  let anneesConference: any[] = []
  let currentAnneeConference: any = null
  
  if (conference?.id) {
    anneesConference = await getAnneesByConference(conference.id)
    currentAnneeConference = await getCurrentAnneeConference(conference.id)
  }
  
  // Déterminer l'année de conférence sélectionnée
  let anneeConferenceSelectionneeId: number | undefined
  if (searchParams.annee_conference) {
    anneeConferenceSelectionneeId = parseInt(searchParams.annee_conference)
  } else if (currentAnneeConference?.id) {
    anneeConferenceSelectionneeId = currentAnneeConference.id
  }

  // Récupérer les données du conseil
  let membres: any[] = []
  let conseils: any[] = []
  
  if (anneeConferenceSelectionneeId) {
    membres = await getConseilMembres(currentFidele.paroisse_id, anneeConferenceSelectionneeId)
    conseils = await getConseils(currentFidele.paroisse_id, anneeConferenceSelectionneeId)
  }

  const anneesSimplifiees = anneesConference.map(ac => ({
    id: ac.id,
    label: ac.annee?.label || '',
    is_current: ac.is_current
  }))

  const paroisse = currentFidele.paroisse
  const dashboardPath = user.role?.nom === 'admin' ? '/admin' : '/gestion'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <a
            href={dashboardPath}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {user.role?.nom || 'Membre'}
              </span>
              <span>•</span>
              <span>{user.nom_complet}</span>
              <span>•</span>
              <span>Paroisse {paroisse?.nom}</span>
            </div>
            <h1 className="text-2xl font-light tracking-wide">Conseil d'administration</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion des membres et des réunions du conseil
            </p>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Conseil d'administration
        </span>
      </div>

      {/* Client Component */}
      <ConseilClient 
        membres={membres}
        conseils={conseils}
        paroisseId={currentFidele.paroisse_id}
        paroisseNom={paroisse?.nom}
        anneeActuelleId={currentAnneeConference?.id}
        anneesDisponibles={anneesSimplifiees}
        anneeSelectionneeId={anneeConferenceSelectionneeId}
      />
    </div>
  )
}