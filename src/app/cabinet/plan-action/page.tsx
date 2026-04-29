// app/cabinet/plan-action/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  ChevronLeft,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  FileText,
  DollarSign,
  Activity,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import {
  getPlansActionByUnite,
  createPlanAction,
  updatePlanAction,
  deletePlanAction
} from '@/actions/plan-action'
import { getCabinetInfo, getAnneesForCabinet, ensureCabinetUniteExists } from '@/actions/cabinet-pastoral'
import { getCurrentFidele } from '@/actions/auth'

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

interface PlanActionWithStats {
  id: number
  titre: string
  description: string | null
  annee_conference_id: number
  unite_id: number
  created_at: string
  updated_at: string
  activites_count?: number
  budget_total?: number
}

export default function CabinetPlanActionPage() {
  const router = useRouter()

  const [cabinetInfo, setCabinetInfo] = useState<any>(null)
  const [uniteId, setUniteId] = useState<number | null>(null)
  const [paroisseNom, setParoisseNom] = useState<string>('')
  const [plans, setPlans] = useState<PlanActionWithStats[]>([])
  const [anneesDisponibles, setAnneesDisponibles] = useState<AnneeConference[]>([])
  const [selectedAnnee, setSelectedAnnee] = useState<AnneeConference | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanActionWithStats | null>(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    annee_conference_id: 0
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Menu
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedAnnee && uniteId) {
      loadPlans()
    }
  }, [selectedAnnee, uniteId])

  async function loadInitialData() {
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

      // Récupérer les années disponibles
      const annees = await getAnneesForCabinet(info.paroisse_id)
      setAnneesDisponibles(annees)
      
      const current = annees.find(a => a.is_current) || annees[0]
      if (current) {
        setSelectedAnnee(current)
        setFormData(prev => ({ ...prev, annee_conference_id: current.id }))
      }
    } catch (error) {
      console.error('Erreur chargement initial:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlans() {
    if (!selectedAnnee || !uniteId) return
    
    setLoading(true)
    try {
      // Récupérer tous les plans de l'unité
      const allPlans = await getPlansActionByUnite(uniteId, selectedAnnee.id)
      
      // Enrichir avec les statistiques (activités et budget)
      const plansWithStats = await Promise.all(
        allPlans.map(async (plan) => {
          const { count: activitesCount } = await supabase
            .from('activite')
            .select('*', { count: 'exact', head: true })
            .eq('plan_action_id', plan.id)

          const { data: budgetData } = await supabase
            .from('budget')
            .select('montant')
            .eq('plan_action_id', plan.id)
            .eq('type', 'depense')

          const budgetTotal = budgetData?.reduce((sum, b) => sum + (b.montant || 0), 0) || 0

          return {
            ...plan,
            activites_count: activitesCount || 0,
            budget_total: budgetTotal
          }
        })
      )
      
      setPlans(plansWithStats)
      
      // Calculer les stats
      const totalActivites = plansWithStats.reduce((sum, p) => sum + (p.activites_count || 0), 0)
      const totalBudget = plansWithStats.reduce((sum, p) => sum + (p.budget_total || 0), 0)
      const plansAvecActivites = plansWithStats.filter(p => (p.activites_count || 0) > 0).length
      const moyenneActivites = plansWithStats.length > 0 ? totalActivites / plansWithStats.length : 0
      
      setStats({
        total: plansWithStats.length,
        totalActivites,
        totalBudget,
        plansAvecActivites,
        moyenneActivitesParPlan: moyenneActivites
      })
    } catch (error) {
      console.error('Erreur chargement plans:', error)
      toast.error('Erreur lors du chargement des plans')
    } finally {
      setLoading(false)
    }
  }

  const filteredPlans = plans.filter(plan =>
    plan.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  function openCreateModal() {
    setEditingPlan(null)
    setFormData({
      titre: '',
      description: '',
      annee_conference_id: selectedAnnee?.id || 0
    })
    setShowModal(true)
  }

  function openEditModal(plan: PlanActionWithStats) {
    setEditingPlan(plan)
    setFormData({
      titre: plan.titre,
      description: plan.description || '',
      annee_conference_id: plan.annee_conference_id
    })
    setShowModal(true)
    setMenuOpen(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.titre.trim()) {
      toast.error('Le titre est requis')
      return
    }
    
    if (!uniteId) {
      toast.error('Unité non trouvée')
      return
    }
    
    setIsSubmitting(true)
    
    const form = new FormData()
    form.append('unite_id', uniteId.toString())
    form.append('titre', formData.titre)
    form.append('description', formData.description || '')
    form.append('annee_conference_id', formData.annee_conference_id.toString())
    
    let result
    if (editingPlan) {
      form.append('id', editingPlan.id.toString())
      result = await updatePlanAction(form)
    } else {
      result = await createPlanAction(form)
    }
    
    if (result.success) {
      toast.success(editingPlan ? 'Plan d\'action modifié' : 'Plan d\'action créé')
      setShowModal(false)
      loadPlans()
    } else {
      toast.error(result.error || 'Erreur lors de l\'opération')
    }
    
    setIsSubmitting(false)
  }

  async function handleDelete(plan: PlanActionWithStats) {
    if (!confirm(`Supprimer le plan "${plan.titre}" ?`)) return
    
    setActionLoading(plan.id)
    const result = await deletePlanAction(plan.id)
    
    if (result.success) {
      toast.success('Plan supprimé')
      loadPlans()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  const buildUrl = (path: string) => {
    if (selectedAnnee?.id) {
      const separator = path.includes('?') ? '&' : '?'
      return `${path}${separator}annee_conference=${selectedAnnee.id}`
    }
    return path
  }

  if (!cabinetInfo) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
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
            <h1 className="text-2xl font-light tracking-wide">Plans d'action</h1>
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
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Plan d'action
        </span>
        <Link
          href={buildUrl("/cabinet/budget")}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Budget
        </Link>
        <Link
          href={buildUrl("/cabinet/projets")}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Projets
        </Link>
      </div>

      {/* Sélecteur d'année */}
      {anneesDisponibles.length > 0 && (
        <div className="flex gap-2 mb-6">
          {anneesDisponibles.map((annee) => (
            <button
              key={annee.id}
              onClick={() => {
                setSelectedAnnee(annee)
                setFormData(prev => ({ ...prev, annee_conference_id: annee.id }))
              }}
              className={`px-3 py-1.5 text-sm border transition-colors ${
                selectedAnnee?.id === annee.id
                  ? 'bg-black text-white border-black'
                  : 'bg-white border-gray-300 hover:border-black text-gray-600'
              }`}
            >
              {annee.label}
              {annee.is_current && ' ✓'}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-3">
            <div className="text-xl font-light">{stats.total}</div>
            <div className="text-xs text-gray-500">Total plans</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3">
            <div className="text-xl font-light text-blue-700">{stats.totalActivites}</div>
            <div className="text-xs text-blue-600">Total activités</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xl font-light text-green-700">${stats.totalBudget.toLocaleString()}</div>
            <div className="text-xs text-green-600">Budget total</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-3">
            <div className="text-xl font-light text-purple-700">{stats.plansAvecActivites}</div>
            <div className="text-xs text-purple-600">Avec activités</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 p-3">
            <div className="text-xl font-light">{stats.moyenneActivitesParPlan.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Activités / plan</div>
          </div>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un plan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
        >
          <Plus size={16} />
          Nouveau plan
        </button>
      </div>

      {/* Liste des plans */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-gray-400" />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 mb-4">Aucun plan d'action pour cette période</p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            <Plus size={16} />
            Créer un plan
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPlans.map(plan => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Link
                    href={`/cabinet/plan-action/${plan.id}`}
                    className="text-lg font-medium hover:text-gray-600"
                  >
                    {plan.titre}
                  </Link>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Activity size={12} />
                      <span>{plan.activites_count || 0} activité(s)</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <DollarSign size={12} />
                      <span>${(plan.budget_total || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar size={12} />
                      <span>Créé le {new Date(plan.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(menuOpen === plan.id ? null : plan.id)}
                    className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {menuOpen === plan.id && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={() => openEditModal(plan)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit size={14} /> Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(plan)}
                        disabled={actionLoading === plan.id}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        {actionLoading === plan.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                {editingPlan ? 'Modifier le plan' : 'Nouveau plan d\'action'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre *</label>
                <input
                  type="text"
                  value={formData.titre}
                  onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                  placeholder="Ex: Plan d'évangélisation 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  rows={3}
                  placeholder="Description du plan d'action..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Année de conférence *</label>
                <select
                  value={formData.annee_conference_id}
                  onChange={(e) => setFormData({ ...formData, annee_conference_id: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                  disabled={!!editingPlan}
                >
                  <option value="">Sélectionner une année</option>
                  {anneesDisponibles.map(annee => (
                    <option key={annee.id} value={annee.id}>
                      {annee.label} {annee.is_current ? '(en cours)' : ''}
                    </option>
                  ))}
                </select>
                {editingPlan && (
                  <p className="text-xs text-gray-500 mt-1">L'année ne peut pas être modifiée</p>
                )}
              </div>
            </form>

            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : editingPlan ? (
                  'Modifier'
                ) : (
                  'Créer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}