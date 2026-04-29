
// app/paroisse/departements/[id]/budget/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Wallet } from 'lucide-react'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getDepartementUnite } from '@/actions/unite-organisation'
import { getBudgetsByUnite, getUniteBudgetSummary } from '@/actions/budget'
import { getAnneesConferenceByConference } from '@/actions/annee-conference'
import { getConferenceFromParoisse } from '@/actions/structures'
import { BudgetClient } from './BudgetClient'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ annee?: string; filter?: string }>
}

let anneeConferenceId: number | null = null
  
const buildUrl = (path: string) => {
    if (anneeConferenceId) {
      return `${path}?annee_conference=${anneeConferenceId}`
    }
    return path
  }

export default async function BudgetPage({ params, searchParams }: PageProps) {
  const currentFidele = await getCurrentFidele()
  if (!currentFidele) redirect('/login')

  const paroisseId = currentFidele.paroisse_id
  const { id } = await params
  const { annee: anneeParam, filter } = (await searchParams || {}) as any
  const departementId = parseInt(id)

  if (isNaN(departementId)) redirect('/paroisse/departements')

  const departement = await getDepartementById(departementId)
  if (!departement) redirect('/paroisse/departements')

  const unite = await getDepartementUnite(departementId, paroisseId)
  if (!unite) {
    return <div className="p-6 max-w-7xl mx-auto"><div className="border border-gray-200 py-16 text-center"><Wallet size={48} className="mx-auto text-gray-300 mb-3" /><h1 className="text-xl font-light mb-2">Configuration requise</h1><p className="text-gray-400">L&apos;unité d&apos;organisation n&apos;a pas encore été créée.</p></div></div>
  }

  const conferenceId = await getConferenceFromParoisse(paroisseId)
  const anneesDisponibles = conferenceId ? await getAnneesConferenceByConference(conferenceId) : []
  
  let anneeConferenceId: number | undefined
  if (anneeParam) anneeConferenceId = parseInt(anneeParam)
  else {
    const current = anneesDisponibles.find(a => a.is_current)
    anneeConferenceId = current?.id || anneesDisponibles[0]?.id
  }

  const budgets = anneeConferenceId ? await getBudgetsByUnite(unite.id, anneeConferenceId) : []
  const summary = anneeConferenceId ? await getUniteBudgetSummary(unite.id, anneeConferenceId) : null

  return (
    <div className="p- max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href={`/paroisse/departements/${departementId}`} className="text-gray-400 hover:text-black"><ChevronLeft size={20} /></Link>
          <div><h1 className="text-2xl font-light tracking-wide">{departement.nom}</h1><p className="text-sm text-gray-500 mt-0.5">Budget</p></div>
        </div>
      </div>

     
     <div className="flex gap-6 mb-6 border-b border-gray-200">
                  <Link
                    href={`/paroisse/departements/${departementId}`}
                    className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
                  >
                    Aperçu
                  </Link>
                  <Link
                    href={`/paroisse/departements/${departementId}/membres`}
                    className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
                  >
                    Membres
                  </Link>
                
                  <Link
                    href={`/paroisse/departements/${departementId}/activites`}
                    className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
                    >
                      Activités
                    
                  </Link>
                  <Link
                    href={`/paroisse/departements/${departementId}/activites`}
                    className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
                  >Plan d'action
                   
                  </Link>
                   <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
                  Budget
                  </span>
                  <Link
                    href={`/paroisse/departements/${departementId}/projets`}
                    className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
                  >
                    Projet
                  </Link>
                </div>

      <BudgetClient
        uniteId={unite.id}
        departementId={departementId}
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