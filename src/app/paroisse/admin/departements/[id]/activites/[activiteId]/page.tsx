// app/paroisse/departements/[id]/activites/[activiteId]/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getActiviteById, getActiviteFiles } from '@/actions/activite'
import { getBudgetsByPlanAction } from '@/actions/budget'
import { ActiviteDetailContent } from './ActiviteDetailContent'

interface PageProps {
  params: Promise<{
    id: string
    activiteId: string
  }>
}

export default async function ActiviteDetailPage({ params }: PageProps) {
  const currentFidele = await getCurrentFidele()

  if (!currentFidele) {
    redirect('/login')
  }

  const { id, activiteId } = await params
  const departementId = parseInt(id)
  const activiteIdNum = parseInt(activiteId)

  if (isNaN(departementId) || isNaN(activiteIdNum)) {
    redirect('/paroisse/departements')
  }

  const departement = await getDepartementById(departementId)

  if (!departement) {
    redirect('/paroisse/departements')
  }

  const activite = await getActiviteById(activiteIdNum)

  if (!activite) {
    redirect(`/paroisse/departements/${departementId}/activites`)
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
      departementId={departementId}
      departement={departement}
      activite={activite}
      fichiers={fichiers}
      budgetInfo={budgetInfo}
      canEdit={canEdit}
    />
  )
}