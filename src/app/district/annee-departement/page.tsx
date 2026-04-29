
// app/district/mon-departement/annees/page.tsx
import { redirect } from 'next/navigation'
import { getChefInfo } from '@/actions/chef-district'
import { getAnnees } from '@/actions/fidele-departement'
import { getMyDepartementAnneesHistory } from '@/actions/annee-district'
import MonDepartementAnneesClient from './MonDepartementAnneesClient'

export default async function MonDepartementAnneesPage() {
  // Récupérer les infos du chef connecté
  const chefInfo = await getChefInfo()
  
  if (!chefInfo) {
    redirect('/login')
  }

  // Récupérer toutes les années disponibles
  const anneesDisponibles = await getAnnees()
  
  // Récupérer l'historique des années pour ce département
  const anneesHistory = await getMyDepartementAnneesHistory(
    chefInfo.district_id,
    chefInfo.departement_id
  )

  // Trouver l'année en cours
  const currentAnnee = anneesHistory.find(a => a.is_current) || null

  return (
    <MonDepartementAnneesClient
      chefInfo={chefInfo}
      anneesDisponibles={anneesDisponibles}
      anneesHistory={anneesHistory}
      currentAnnee={currentAnnee}
    />
  )
}