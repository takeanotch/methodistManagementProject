// app/cabinet/budget/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Wallet } from 'lucide-react'
import { getCabinetInfo, getAnneesForCabinet, ensureCabinetUniteExists } from '@/actions/cabinet-pastoral'
import { getBudgetsByUnite, getUniteBudgetSummary } from '@/actions/budget'
import { BudgetClient } from './BudgetClient'

interface PageProps {
  searchParams?: Promise<{ annee?: string; filter?: string }>
}

export default async function BudgetPage({ searchParams }: PageProps) {
  const cabinetInfo = await getCabinetInfo()
  if (!cabinetInfo) redirect('/')

const paroisseId = cabinetInfo.paroisse_id  
  const search = await searchParams
  const anneeParam = search?.annee
  const filter = search?.filter || 'all'

  // S'assurer que l'unité existe
  const uniteResult = await ensureCabinetUniteExists(paroisseId)
  if (!uniteResult.success || !uniteResult.unite) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="border border-gray-200 py-16 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <h1 className="text-xl font-light mb-2">Configuration requise</h1>
          <p className="text-gray-400">L&apos;unité d&apos;organisation n&apos;a pas encore été créée.</p>
        </div>
      </div>
    )
  }

  const unite = uniteResult.unite
  const anneesDisponibles = await getAnneesForCabinet(paroisseId)
  
  let anneeConferenceId: number | undefined
  if (anneeParam) {
    anneeConferenceId = parseInt(anneeParam)
  } else {
    const current = anneesDisponibles.find(a => a.is_current)
    anneeConferenceId = current?.id || anneesDisponibles[0]?.id
  }

  const budgets = anneeConferenceId ? await getBudgetsByUnite(unite.id, anneeConferenceId) : []
  const summary = anneeConferenceId ? await getUniteBudgetSummary(unite.id, anneeConferenceId) : null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/cabinet"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Budget</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cabinet Pastoral - {cabinetInfo.paroisse_nom}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <Link
          href="/cabinet"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Aperçu
        </Link>
        <Link
          href="/cabinet/membres"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Membres
        </Link>
        <Link
          href="/cabinet/activites"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Activités
        </Link>
        <Link
          href="/cabinet/plan-action"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plan d&apos;action
        </Link>
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Budget
        </span>
        <Link
          href="/cabinet/projets"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Projets
        </Link>
      </div>

      <BudgetClient
        uniteId={unite.id}
        cabinetId={paroisseId}
        cabinetNom={cabinetInfo.paroisse_nom}
        anneesDisponibles={anneesDisponibles}
        anneeConferenceId={anneeConferenceId}
        budgets={budgets}
        summary={summary}
        canEdit={true}
        currentFilter={filter}
      />
    </div>
  )
}