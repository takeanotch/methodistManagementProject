// app/admin/annees-district/page.tsx
import { redirect } from 'next/navigation'
import { getUser } from '@/actions/auth'
import { getDistricts } from '@/actions/structures'
import { getDepartements } from '@/actions/departements'
import { getAnnees } from '@/actions/fidele-departement'
import { getAllAnneesDistrict } from '@/actions/annee-district'
import AnneesDistrictAdminClient from './AnneesDistrictAdminClient'

export default async function AnneesDistrictAdminPage() {
  const user = await getUser()

  // Vérifier que l'utilisateur est admin
  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  // Récupérer toutes les données
  const [districts, departements, annees, anneesDistrict] = await Promise.all([
    getDistricts(),
    getDepartements(),
    getAnnees(),
    getAllAnneesDistrict()
  ])

  return (
    <AnneesDistrictAdminClient
      districts={districts}
      departements={departements}
      annees={annees}
      anneesDistrict={anneesDistrict}
    />
  )
}