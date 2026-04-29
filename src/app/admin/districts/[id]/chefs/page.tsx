

// app/admin/districts/[id]/chefs/page.tsx
import { supabase } from '@/lib/supabase'
import { getUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { getChefsByDistrict } from '@/actions/chef-departement'
import { getNombrePostesByType } from '@/actions/roles'
import ChefsClientDistrict from './ChefsClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChefsPage({ params }: PageProps) {
  const { id } = await params
  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  const districtId = parseInt(id)
  if (isNaN(districtId)) {
    redirect('/admin/districts')
  }

  // Récupérer les infos du district
  const { data: district } = await supabase
    .from('district')
    .select('*')
    .eq('id', districtId)
    .single()

  if (!district) {
    redirect('/admin/districts')
  }

  // Récupérer tous les départements
  const { data: departements } = await supabase
    .from('departement')
    .select('*')
    .order('nom')

  // Récupérer les chefs actuels avec leurs rôles
  const chefs = await getChefsByDistrict(districtId)

  // Récupérer le nombre de postes maximum par département
  const maxPostesParDepartement = await getNombrePostesByType('district')

  return (
    <ChefsClientDistrict
      districtId={districtId}
      districtNom={district.nom}
      departements={departements || []}
      chefs={chefs}
      maxPostesParDepartement={maxPostesParDepartement}
      user={user}
    />
  )
}