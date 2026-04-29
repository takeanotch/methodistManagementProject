// app/conference/budget/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Wallet } from 'lucide-react'
import { getCurrentFidele } from '@/actions/auth'
import { getChefConferenceInfo } from '@/actions/chef-conference-annees'
import { getDepartementUniteForConference, ensureDepartementUniteExistsForConference } from '@/actions/unite-organisation'
import { getBudgetsByUniteNiveau, getUniteBudgetSummaryNiveau } from '@/actions/budget-niveaux'
import { getAnneesConferenceByConference } from '@/actions/annee-conference'
import { BudgetClientConference } from './BudgetClientConference'

interface PageProps {
  searchParams?: Promise<{ annee?: string; filter?: string }>
}

export default async function ConferenceBudgetPage({ searchParams }: PageProps) {
  const currentFidele = await getCurrentFidele()
  if (!currentFidele) redirect('/login')

  const chefInfo = await getChefConferenceInfo()
  if (!chefInfo) redirect('/unauthorized')

  const { annee: anneeParam, filter } = (await searchParams || {}) as any

  // Vérifier et créer l'unité si nécessaire
  let unite = await getDepartementUniteForConference(chefInfo.departement_id, chefInfo.conference_id)
  
  if (!unite) {
    const result = await ensureDepartementUniteExistsForConference(
      chefInfo.departement_id,
      chefInfo.conference_id
    )
    if (result.success && result.unite) {
      unite = result.unite
    }
  }

  if (!unite) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="border border-gray-200 py-16 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <h1 className="text-xl font-light mb-2">Configuration requise</h1>
          <p className="text-gray-400">L&apos;unité d&apos;organisation n&apos;a pas encore été créée.</p>
        </div>
      </div>
    )
  }

  // Récupérer les années disponibles pour cette conférence
  const conferenceId = chefInfo.conference_id
  const anneesDisponibles = conferenceId ? await getAnneesConferenceByConference(conferenceId) : []
  
  let anneeConferenceId: number | undefined
  if (anneeParam) {
    anneeConferenceId = parseInt(anneeParam)
  } else {
    const current = anneesDisponibles.find((a: any) => a.is_current)
    anneeConferenceId = current?.id || anneesDisponibles[0]?.id
  }

  const budgets = anneeConferenceId ? await getBudgetsByUniteNiveau(unite.id, anneeConferenceId) : []
  const summary = anneeConferenceId ? await getUniteBudgetSummaryNiveau(unite.id, anneeConferenceId) : null

  return (
    <div className=" max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/conference" className="text-gray-400 hover:text-black">
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Budget de la Conférence</h1>
            <p className="text-sm text-gray-500 mt-0.5">{chefInfo.departement_nom}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <Link
            href="/conference"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Tableau de bord
          </Link>
          <Link
            href="/conference/activites"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Activités
          </Link>
          <Link
            href="/conference/plans-action"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Plans d'action
          </Link>
          <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
            Budget
          </span>
          <Link
            href="/conference/projets"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Projets
          </Link>
        </div>
      </div>

      <BudgetClientConference
        uniteId={unite.id}
        conferenceId={chefInfo.conference_id}
        anneesDisponibles={anneesDisponibles}
        anneeConferenceId={anneeConferenceId}
        budgets={budgets}
        summary={summary}
        canEdit={true}
        currentFilter={filter || 'all'}
      />
    </div>
  )
}