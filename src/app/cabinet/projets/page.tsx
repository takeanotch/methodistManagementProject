// app/cabinet/projets/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCabinetInfo, ensureCabinetUniteExists } from '@/actions/cabinet-pastoral'
import { getProjetsByUnite } from '@/actions/projet'
import { CabinetProjetsClient } from '../CabinetProjetsClient'
import { formatCurrency } from '@/lib/currency'

export default function CabinetProjetsPage() {
  const router = useRouter()

  const [cabinetInfo, setCabinetInfo] = useState<any>(null)
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [paroisseNom, setParoisseNom] = useState<string>('')
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
      setLoading(true)
      
      const info = await getCabinetInfo()
      if (!info) {
        router.push('/')
        return
      }
      setCabinetInfo(info)
      setParoisseNom(info.paroisse_nom)

      // S'assurer que l'unité existe
      const uniteResult = await ensureCabinetUniteExists(info.paroisse_id)
      if (!uniteResult.success || !uniteResult.unite) {
        toast.error("Impossible de créer l'unité d'organisation")
        return
      }
      setUniteId(uniteResult.unite.id)
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
      
      // Calculer le budget total des projets
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

  const buildUrl = (path: string) => {
    return path
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
      </div>
    )
  }

  if (!cabinetInfo) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Cabinet non trouvé</p>
      </div>
    )
  }

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
            <h1 className="text-2xl font-light tracking-wide">Projets</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cabinet Pastoral - {paroisseNom}</p>
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
          href={buildUrl("/cabinet/activites")}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Activités
        </Link>
        <Link
          href={buildUrl("/cabinet/plan-action")}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plan d'action
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
          <div className="bg-yellow-50 border border-yellow-200 p-3">
            <div className="text-xl font-light text-yellow-700">{stats.enCours}</div>
            <div className="text-xs text-yellow-600">En cours</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xl font-light text-green-700">{stats.termines}</div>
            <div className="text-xs text-green-600">Terminés</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3">
            <div className="text-xl font-light text-blue-700">{formatCurrency(stats.budgetTotal, 'USD')}</div>
            <div className="text-xs text-blue-600">Budget total</div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {uniteId ? (
        <CabinetProjetsClient
          key={refreshKey}
          uniteId={uniteId}
          cabinetNom={`Cabinet Pastoral - ${paroisseNom}`}
          onRefresh={handleRefresh}
        />
      ) : (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <Target size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Unité d'organisation non trouvée</p>
          <p className="text-xs text-gray-400 mt-1">
            Impossible de gérer les projets pour ce cabinet
          </p>
        </div>
      )}
    </div>
  )
}