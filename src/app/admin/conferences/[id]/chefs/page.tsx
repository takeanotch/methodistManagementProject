
// app/admin/conferences/[id]/chefs/page.tsx
import { supabase } from '@/lib/supabase'
import { getUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { getChefsByConference } from '@/actions/chef-departement-conference'
import { getNombrePostesByType } from '@/actions/roles'
import ChefsConferenceClient from './ChefsConferenceClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ChefsConferencePage({ params }: PageProps) {
  const { id } = await params
  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  const conferenceId = parseInt(id)
  if (isNaN(conferenceId)) {
    redirect('/admin/conferences')
  }

  // Récupérer les infos de la conférence
  const { data: conference } = await supabase
    .from('conference')
    .select('*')
    .eq('id', conferenceId)
    .single()

  if (!conference) {
    redirect('/admin/conferences')
  }

  // Récupérer tous les départements
  const { data: departements } = await supabase
    .from('departement')
    .select('*')
    .order('nom')

  // Récupérer les chefs actuels avec leurs rôles
  const chefs = await getChefsByConference(conferenceId)

  // Récupérer le nombre de postes maximum par département
  const maxPostesParDepartement = await getNombrePostesByType('conference')

  return (
    <ChefsConferenceClient
      conferenceId={conferenceId}
      conferenceNom={conference.nom}
      departements={departements || []}
      chefs={chefs}
      maxPostesParDepartement={maxPostesParDepartement}
      user={user}
    />
  )
}