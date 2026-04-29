// // app/cabinet/membres/page.tsx
// import { getCabinetInfo, getMembresCabinet, getAnneesForCabinet, getFidelesByParoisse } from '@/actions/cabinet-pastoral'
// import { redirect } from 'next/navigation'
// import ClientMembresPage from './client-page'

// interface PageProps {
//   searchParams?: Promise<{ annee_conference?: string }>
// }

// export default async function MembresPage({ searchParams }: PageProps) {
//   const cabinetInfo = await getCabinetInfo()
  
//   if (!cabinetInfo) {
//     redirect('/')
//   }
  
//   const search = await searchParams
//   const anneeConferenceParam = search?.annee_conference
  
//   const paroisseId = cabinetInfo.paroisse_id
  
//   // Récupération des années de conférence
//   const anneesDisponibles = await getAnneesForCabinet(paroisseId)
//   const anneeEnCours = anneesDisponibles.find(a => a.is_current) || null
  
//   // Gestion de l'année sélectionnée
//   let anneeConferenceId: number | null = null
  
//   if (anneeConferenceParam) {
//     anneeConferenceId = parseInt(anneeConferenceParam)
//     const anneeExiste = anneesDisponibles.some(a => a.id === anneeConferenceId)
//     if (!anneeExiste) {
//       anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
//     }
//   } else {
//     anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
//   }
  
//   // Récupération des membres du cabinet
//   const membres = await getMembresCabinet(paroisseId,anneeConferenceId)
  
//   // Récupération des fidèles de la paroisse pour l'année sélectionnée
//   const fidelesParoisse = anneeConferenceId 
//     ? await getFidelesByParoisse(paroisseId)
//     // ? await getFidelesByParoisse(paroisseId, anneeConferenceId)
//     : []
  
//   // Statistiques
//   const totalMembres = membres.length
//   const actifs = membres.filter(m => m.est_actif).length
//   const inactifs = totalMembres - actifs
  
//   const isCurrentYear = anneeConferenceId === anneeEnCours?.id
//   const anneeSelectionnee = anneesDisponibles.find(a => a.id === anneeConferenceId)

//   return (
//     <ClientMembresPage
//       paroisseId={paroisseId}
//       paroisseNom={cabinetInfo.paroisse_nom}
//       anneesDisponibles={anneesDisponibles}
//       anneeConferenceId={anneeConferenceId}
//       anneeEnCours={anneeEnCours}
//       membres={membres}
//       fidelesParoisse={fidelesParoisse}
//       totalMembres={totalMembres}
//       actifs={actifs}
//       inactifs={inactifs}
//       isCurrentYear={isCurrentYear}
//       anneeSelectionnee={anneeSelectionnee}
//     />
//   )
// }
// app/cabinet/membres/page.tsx
import { getCabinetInfo, getMembresCabinet, getAnneesForCabinet, getFidelesByParoisse } from '@/actions/cabinet-pastoral'
import { redirect } from 'next/navigation'
import MembresPageClient from './MembresPageClient'

interface PageProps {
  searchParams?: Promise<{ annee_conference?: string }>
}

export default async function MembresPage({ searchParams }: PageProps) {
  const cabinetInfo = await getCabinetInfo()
  
  if (!cabinetInfo) redirect('/')
  
  const { annee_conference } = await searchParams || {}
  const paroisseId = cabinetInfo.paroisse_id
  
  const [anneesDisponibles, membres] = await Promise.all([
    getAnneesForCabinet(paroisseId),
    getMembresCabinet(paroisseId, annee_conference ? parseInt(annee_conference) : undefined)
  ])

  const anneeEnCours = anneesDisponibles.find(a => a.is_current) || null
  const anneeConferenceId = annee_conference 
    ? parseInt(annee_conference) 
    : anneeEnCours?.id || anneesDisponibles[0]?.id || null

  // Validation année
  const anneeValide = anneeConferenceId && anneesDisponibles.some(a => a.id === anneeConferenceId)
  const anneeFinale = anneeValide ? anneeConferenceId : (anneeEnCours?.id || anneesDisponibles[0]?.id || null)
  
  // Données conditionnelles
  const membresFinaux = anneeFinale === anneeConferenceId 
    ? membres 
    : await getMembresCabinet(paroisseId, anneeFinale)
  
  const fidelesParoisse = anneeFinale ? await getFidelesByParoisse(paroisseId) : []

  return (
    <MembresPageClient 
      paroisseId={paroisseId}
      paroisseNom={cabinetInfo.paroisse_nom}
      anneesDisponibles={anneesDisponibles}
      anneeConferenceId={anneeFinale}
      anneeEnCours={anneeEnCours}
      membres={membresFinaux}
      fidelesParoisse={fidelesParoisse}
    />
  )
}