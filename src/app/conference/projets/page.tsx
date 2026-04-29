// app/conference/projets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCurrentFidele } from '@/actions/auth'
import { getChefConferenceInfo } from '@/actions/chef-conference-annees'
import { getDepartementUniteForConference, ensureDepartementUniteExistsForConference } from '@/actions/unite-organisation'
import { getProjetsByUnite } from '@/actions/projet'
import { NiveauProjetsClient } from './NiveauProjetsClient'
import { formatCurrency } from '@/lib/currency'
import { Spinner } from '@/components/Spinner'

export default function ConferenceProjetsPage() {
  const router = useRouter()

  const [chefInfo, setChefInfo] = useState<any>(null)
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    termines: 0,
    budgetTotal: 0
  })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (uniteId) {
      loadStats()
    }
  }, [uniteId, refreshKey])

  async function loadData() {
    try {
      const fidele = await getCurrentFidele()
      if (!fidele) {
        router.push('/login')
        return
      }

      const info = await getChefConferenceInfo()
      if (!info) {
        router.push('/unauthorized')
        return
      }
      setChefInfo(info)

      // Vérifier et créer l'unité si nécessaire
      let unite = await getDepartementUniteForConference(info.departement_id, info.conference_id)
      
      if (!unite) {
        const result = await ensureDepartementUniteExistsForConference(
          info.departement_id,
          info.conference_id
        )
        if (result.success && result.unite) {
          unite = result.unite
        }
      }
      
      if (unite) {
        setUniteId(unite.id)
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats() {
    if (!uniteId) return

    try {
      const projets = await getProjetsByUnite(uniteId)
      
      const total = projets.length
      const enCours = projets.filter(p => p.statut === 'en_cours').length
      const termines = projets.filter(p => p.statut === 'termine').length
      
      let budgetTotal = 0
      for (const projet of projets) {
        if (projet.budget) {
          budgetTotal += projet.budget.montant
        }
      }

      setStats({ total, enCours, termines, budgetTotal })
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  if (loading) {
    return (
     <Spinner/>

    )
  }

  if (!chefInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Informations de la conférence non trouvées</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl py-3 mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/conference"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Projets de la Conférence</h1>
            <p className="text-sm text-gray-500 mt-0.5">{chefInfo.departement_nom}</p>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
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
        <Link
          href="/conference/budget"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Budget
        </Link>
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Projets
        </span>
      </div>

      {/* Stats */}
      {uniteId && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-3">
            <div className="text-xl font-light">{stats.total}</div>
            <div className="text-xs text-gray-500">Total projets</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xl font-light text-green-700">{stats.enCours}</div>
            <div className="text-xs text-green-600">En cours</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3">
            <div className="text-xl font-light text-gray-700">{stats.termines}</div>
            <div className="text-xs text-gray-500">Terminés</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3">
            <div className="text-xl font-light text-blue-700">{formatCurrency(stats.budgetTotal, 'USD')}</div>
            <div className="text-xs text-blue-600">Budget total</div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {uniteId ? (
        <NiveauProjetsClient
          key={refreshKey}
          uniteId={uniteId}
          niveauNom={chefInfo.departement_nom}
          niveau="conference"
          niveauId={chefInfo.conference_id}
          onRefresh={handleRefresh}
        />
      ) : (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <Target size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Unité d'organisation non trouvée</p>
          <p className="text-xs text-gray-400 mt-1">
            Impossible de gérer les projets pour cette conférence
          </p>
        </div>
      )}
    </div>
  )
}