

// app/paroisse/departements/[id]/membres/page.tsx
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getFidelesByDepartementAndAnneeConference, getAnneesConferenceDisponiblesForDepartement, getCurrentAnneeConferenceForDepartement } from '@/actions/fidele-departement'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ClientMembresPage from './client-page'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ annee_conference?: string }>
}

export default async function MembresPage({ params, searchParams }: PageProps) {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const { id } = await params
  const search = await searchParams
  const anneeConferenceParam = search?.annee_conference
  
  const departementId = parseInt(id)
  
  if (isNaN(departementId)) {
    redirect('/paroisse/departements?error=invalid-id')
  }
  
  const departement = await getDepartementById(departementId)
  
  if (!departement) {
    redirect('/paroisse/departements')
  }
  
  // Récupération des années de conférence
  const anneesDisponibles = await getAnneesConferenceDisponiblesForDepartement(departementId)
  const anneeEnCours = await getCurrentAnneeConferenceForDepartement(departementId)
  
  // Gestion de l'année sélectionnée
  let anneeConferenceId: number | null = null
  
  if (anneeConferenceParam) {
    anneeConferenceId = parseInt(anneeConferenceParam)
    const anneeExiste = anneesDisponibles.some(a => a.id === anneeConferenceId)
    if (!anneeExiste) {
      anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
    }
  } else {
    anneeConferenceId = anneeEnCours?.id || (anneesDisponibles[0]?.id || null)
  }
  
  // Récupération des fidèles
  const fideles = anneeConferenceId 
    ? await getFidelesByDepartementAndAnneeConference(departementId, anneeConferenceId, currentFidele.paroisse_id)
    : []
  
  // Statistiques
  const totalFideles = fideles.length
  const actifs = fideles.filter((f: any) => f.est_actif).length
  const inactifs = totalFideles - actifs
  
  // Transformation des données
  const transformedFideles = fideles.map((affectation: any) => ({
    id: affectation.id,
    fidele_id: affectation.fidele_id,
    role_id: affectation.role_id,
    role_details: affectation.role_details,
    annee_id: anneeConferenceId || 0,
    est_actif: affectation.est_actif,
    paroisse_id: currentFidele.paroisse_id,
    fidele: affectation.fidele || {
      id: 0,
      nom: 'Inconnu',
      post_nom: '',
      prenom: '',
      contact: '',
      profile_img: undefined,
      sexe: undefined,
      actif: undefined
    },
    created_at: affectation.created_at
  }))
  
  const isCurrentYear = anneeConferenceId === anneeEnCours?.id
  const anneeSelectionnee = anneesDisponibles.find(a => a.id === anneeConferenceId)

  return (
    <ClientMembresPage
      departementId={departementId}
      departementNom={departement.nom}
      paroisseId={currentFidele.paroisse_id}
      anneesDisponibles={anneesDisponibles}
      anneeConferenceId={anneeConferenceId}
      anneeEnCours={anneeEnCours}
      transformedFideles={transformedFideles}
      totalFideles={totalFideles}
      actifs={actifs}
      inactifs={inactifs}
      isCurrentYear={isCurrentYear}
      anneeSelectionnee={anneeSelectionnee}
    />
  )
}