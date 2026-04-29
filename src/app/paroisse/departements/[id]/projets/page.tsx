// app/paroisse/departements/[id]/projets/page.tsx (version avec stats)
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader2, Target, Activity, DollarSign, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getDepartementUnite } from '@/actions/unite-organisation'
import { getProjetsByUnite, type Projet } from '@/actions/projet'
import { DepartmentProjetsClient } from '../DepartmentProjetsClient'
import { formatCurrency } from '@/lib/currency'

interface Departement {
  id: number
  nom: string
  description: string | null
}

export default function DepartementProjetsPage() {
  const params = useParams()
  const router = useRouter()
  const departementId = parseInt(params.id as string)

  const [departement, setDepartement] = useState<Departement | null>(null)
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
  }, [departementId])

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

      const dep = await getDepartementById(departementId)
      if (!dep) {
        router.push('/paroisse/departements')
        return
      }
      setDepartement(dep)

      const unite = await getDepartementUnite(departementId, fidele.paroisse_id)
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

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
      </div>
    )
  }

  if (!departement) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Département non trouvé</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={`/paroisse/departements/${departementId}`}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">{departement.nom}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Projets</p>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
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
          href={`/paroisse/departements/${departementId}/plans-action`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plans d'action
        </Link>
       
        <Link
          href={`/paroisse/departements/${departementId}/budget`}
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
        <DepartmentProjetsClient
          key={refreshKey}
          uniteId={uniteId}
          departementNom={departement.nom}
        />
      ) : (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <Target size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 text-sm">Unité d'organisation non trouvée</p>
          <p className="text-xs text-gray-400 mt-1">
            Impossible de gérer les projets pour ce département
          </p>
        </div>
      )}
    </div>
  )
}