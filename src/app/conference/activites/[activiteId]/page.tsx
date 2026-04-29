// app/conference/activites/[activiteId]/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentFidele } from '@/actions/auth'
import { getChefConferenceInfo } from '@/actions/chef-conference-annees'
import { getActiviteByIdConference, getActiviteFiles } from '@/actions/activite-conference'
import { getBudgetsByPlanActionConference } from '@/actions/budget-conference'
import { ActiviteDetailContent } from './ActiviteDetailContent'

interface PageProps {
  params: Promise<{
    activiteId: string
  }>
}

export default async function ActiviteDetailPage({ params }: PageProps) {
  const currentFidele = await getCurrentFidele()

  if (!currentFidele) {
    redirect('/login')
  }

  const { activiteId } = await params
  const activiteIdNum = parseInt(activiteId)

  if (isNaN(activiteIdNum)) {
    redirect('/conference/activites')
  }

  // Récupérer les infos du chef de conférence
  const chefInfo = await getChefConferenceInfo()

  if (!chefInfo) {
    redirect('/unauthorized')
  }

  const activite = await getActiviteByIdConference(activiteIdNum)

  if (!activite) {
    redirect('/conference/activites')
  }

  const fichiers = await getActiviteFiles(activiteIdNum)
  
  let budgetInfo = null
  if (activite.plan_action_id) {
    const budgets = await getBudgetsByPlanActionConference(activite.plan_action_id)
    budgetInfo = {
      recettes: budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + b.montant, 0),
      depenses: budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + b.montant, 0)
    }
  }

  const canEdit = true

  return (
    <ActiviteDetailContent
      chefInfo={chefInfo}
      activite={activite}
      fichiers={fichiers}
      budgetInfo={budgetInfo}
      canEdit={canEdit}
    />
  )
}