// app/surintendant/activites/[id]/page.tsx
import { getCurrentFidele } from '@/actions/auth'
import { getSurintendantInfo } from '@/actions/surintendant'
import { getActiviteById, getActiviteFiles } from '@/actions/activite'
import { redirect } from 'next/navigation'
import SurintendantActiviteDetailClient from './SurintendantActiviteDetailClient'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function SurintendantActiviteDetailPage({ params }: PageProps) {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const surintendantInfo = await getSurintendantInfo()
  
  if (!surintendantInfo) {
    redirect('/surintendant')
  }
  
  const { id } = await params
  const activiteId = parseInt(id)
  
  if (isNaN(activiteId)) {
    redirect('/surintendant')
  }
  
  const activite = await getActiviteById(activiteId)
  
  if (!activite) {
    redirect('/surintendant')
  }
  
  const fichiers = await getActiviteFiles(activiteId)
  
  return (
    <SurintendantActiviteDetailClient
      surintendantInfo={surintendantInfo}
      activite={activite}
      fichiers={fichiers}
    />
  )
}