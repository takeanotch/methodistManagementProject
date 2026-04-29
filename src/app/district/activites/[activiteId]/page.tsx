// app/district/activites/[activiteId]/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentFidele } from '@/actions/auth'
import { getChefDistrictInfo } from '@/actions/chef-district-annees'
import { getActiviteById, getActiviteFiles } from '@/actions/activite-district'
import { getBudgetsByPlanAction } from '@/actions/budget'
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
    redirect('/district/activites')
  }

  // Récupérer les infos du chef de district
  const chefInfo = await getChefDistrictInfo()

  if (!chefInfo) {
    redirect('/unauthorized')
  }

  const activite = await getActiviteById(activiteIdNum)

  if (!activite) {
    redirect('/district/activites')
  }

  const fichiers = await getActiviteFiles(activiteIdNum)
  
  let budgetInfo = null
  if (activite.plan_action_id) {
    const budgets = await getBudgetsByPlanAction(activite.plan_action_id)
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