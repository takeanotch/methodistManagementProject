import { getCurrentFidele } from '@/actions/auth'
import { getChefConferenceInfo, getParoisseById, getDepartementDataForParoisse, getAnneesDisponiblesForParoisse } from '@/actions/chef-conference'
import { getDepartementById } from '@/actions/departements'
import { getAnneesConferenceDisponiblesForDepartement, getCurrentAnneeConferenceForDepartement } from '@/actions/fidele-departement'
import { redirect } from 'next/navigation'
import ConferenceParoisseClient from './ConferenceParoisseClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    departement_id?: string
    annee_conference?: string
    tab?: string
  }>
}

export default async function ConferenceParoissePage({ params, searchParams }: PageProps) {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const chefInfo = await getChefConferenceInfo()
  
  if (!chefInfo) {
    redirect('/conference')
  }
  
  const { id } = await params
  const search = await (searchParams || {}) as {
    departement_id?: string
    annee_conference?: string
    tab?: string
  }
  
  const paroisseId = parseInt(id)
  const departementId = search.departement_id ? parseInt(search.departement_id) : chefInfo.departement_id
  const anneeConferenceParam = search.annee_conference as string | undefined
  const tabParam = search.tab as string | undefined
  
  if (isNaN(paroisseId)) {
    redirect('/conference')
  }
  
  const paroisse = await getParoisseById(paroisseId)
  if (!paroisse) {
    redirect('/conference')
  }
  
  const departement = await getDepartementById(departementId)
  if (!departement) {
    redirect('/conference')
  }
  
  // Récupérer les années de conférence disponibles
  const anneesDisponibles = await getAnneesConferenceDisponiblesForDepartement(departementId)
  const anneeEnCours = await getCurrentAnneeConferenceForDepartement(departementId)
  
  // Gestion de l'année
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
  
  // Récupérer les données de la paroisse
  const paroisseData = await getDepartementDataForParoisse(
    departementId,
    paroisseId,
    anneeConferenceId
  )
  
  const anneesParoisse = await getAnneesDisponiblesForParoisse(paroisseId, departementId)
  
  return (
    <ConferenceParoisseClient
      currentFidele={currentFidele}
      chefInfo={chefInfo}
      departement={departement}
      paroisse={paroisse}
      paroisseData={paroisseData}
      anneeConferenceId={anneeConferenceId}
      anneesDisponibles={anneesDisponibles}
      anneesParoisse={anneesParoisse}
      anneeEnCours={anneeEnCours}
      currentTab={tabParam}
    />
  )
}