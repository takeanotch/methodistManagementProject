

// app/paroisse/admin/departements/[id]/plans-action/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
  getPlansActionByDepartement,
  getPlansActionStatsForDepartement,
  createPlanActionForDepartement,
  updatePlanActionDepartement,
  deletePlanActionDepartement,
  type PlanActionDepartement
} from '@/actions/plan-action-departement'
import { getAnneesConferenceByConference } from '@/actions/annee-conference'
import { getConferenceFromParoisse } from '@/actions/structures'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'

interface Departement {
  id: number
  nom: string
  description: string | null
  paroisse_id?: number
}

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
  annee?: { id: number; label: string }
}

interface PlanActionWithStats extends PlanActionDepartement {
  activites_count?: number
  budget_total?: number
}

export default function DepartementPlansActionPage() {
  const params = useParams()
  const router = useRouter()
  const departementId = parseInt(params.id as string)

  const [departement, setDepartement] = useState<Departement | null>(null)
  const [paroisseId, setParoisseId] = useState<number | null>(null)
  const [plans, setPlans] = useState<PlanActionWithStats[]>([])
  const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
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
  }, [departementId])

  useEffect(() => {
    if (selectedAnneeConference && paroisseId) {
      loadPlans()
    }
  }, [selectedAnneeConference, paroisseId])

  async function loadInitialData() {
    try {
      // Récupérer le fidèle connecté pour avoir la paroisse
      const fidele = await getCurrentFidele()
      if (!fidele) {
        router.push('/login')
        return
      }
      setParoisseId(fidele.paroisse_id)

      // Récupérer le département
      const dep = await getDepartementById(departementId)
      if (!dep) {
        router.push('/paroisse/admin/departements')
        return
      }
      setDepartement(dep)

      // Récupérer la conférence et les années
      const conferenceId = await getConferenceFromParoisse(fidele.paroisse_id)
      if (conferenceId) {
        const annees = await getAnneesConferenceByConference(conferenceId)
        setAnneesConference(annees)
        
        const current = annees.find(a => a.is_current) || annees[0]
        if (current) {
          setSelectedAnneeConference(current)
          setFormData(prev => ({ ...prev, annee_conference_id: current.id }))
        }
      }
    } catch (error) {
      console.error('Erreur chargement initial:', error)
      toast.error('Erreur lors du chargement des données')
    }
  }

  async function loadPlans() {
    if (!selectedAnneeConference || !paroisseId) return
    
    setLoading(true)
    try {
      // Récupérer tous les plans du département pour cette paroisse
      const allPlans = await getPlansActionByDepartement(departementId, paroisseId)
      
      // Filtrer par année sélectionnée
      const filteredPlans = allPlans.filter(p => p.annee_conference_id === selectedAnneeConference.id)
      
      // Enrichir avec les statistiques (activités et budget)
      const plansWithStats = await Promise.all(
        filteredPlans.map(async (plan) => {
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
      const statsData = await getPlansActionStatsForDepartement(departementId, paroisseId, selectedAnneeConference.id)
      setStats(statsData)
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
      annee_conference_id: selectedAnneeConference?.id || 0
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
    
    if (!paroisseId) {
      toast.error('Paroisse non trouvée')
      return
    }
    
    setIsSubmitting(true)
    
    if (editingPlan) {
      const result = await updatePlanActionDepartement(
        editingPlan.id,
        departementId,
        paroisseId,
        formData.titre,
        formData.description || null
      )
      if (result.success) {
        toast.success('Plan d\'action modifié')
        setShowModal(false)
        loadPlans()
      } else {
        toast.error(result.error || 'Erreur lors de la modification')
      }
    } else {
      const result = await createPlanActionForDepartement(
        departementId,
        paroisseId,
        formData.titre,
        formData.description || null
      )
      if (result.success) {
        toast.success('Plan d\'action créé')
        setShowModal(false)
        loadPlans()
      } else {
        toast.error(result.error || 'Erreur lors de la création')
      }
    }
    
    setIsSubmitting(false)
  }

  async function handleDelete(plan: PlanActionWithStats) {
    if (!confirm(`Supprimer le plan "${plan.titre}" ?`)) return
    
    if (!paroisseId) {
      toast.error('Paroisse non trouvée')
      return
    }
    
    setActionLoading(plan.id)
    const result = await deletePlanActionDepartement(plan.id, departementId, paroisseId)
    
    if (result.success) {
      toast.success('Plan supprimé')
      loadPlans()
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  if (!departement) {
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
            href={`/paroisse/admin/departements/${departementId}`}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">{departement.nom}</h1>
            <p className="text-sm text-gray-500 mt-0.5">Plans d'action</p>
          </div>
        </div>
      </div>
 
      {/* Navigation secondaire */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <Link
          href={`/paroisse/admin/departements/${departementId}`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Aperçu
        </Link>
        <Link
          href={`/paroisse/admin/departements/${departementId}/membres`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Membres
        </Link>
        <Link
          href={`/paroisse/admin/departements/${departementId}/activites`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Activités
        </Link>
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Plans d'action
        </span>
       
        <Link
          href={`/paroisse/admin/departements/${departementId}/projets`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Projet
        </Link>
      </div>

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
        <div className="flex items-center gap-3">
          <select
            value={selectedAnneeConference?.id || ''}
            onChange={(e) => {
              const ac = anneesConference.find(a => a.id === parseInt(e.target.value))
              if (ac) {
                setSelectedAnneeConference(ac)
                setFormData(prev => ({ ...prev, annee_conference_id: ac.id }))
              }
            }}
            className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
          >
            {anneesConference.map(annee => (
              <option key={annee.id} value={annee.id}>
                {annee.annee?.label || annee.label} {annee.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
            />
          </div>
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
        <div className="border border-gray-200 py-16 text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucun plan d'action pour cette période</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 inline-flex items-center gap-2"
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
                    href={`/paroisse/admin/departements/${departementId}/plans-action/${plan.id}`}
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
                <label className="block text-sm font-medium mb-1">Année conférence *</label>
                <select
                  value={formData.annee_conference_id}
                  onChange={(e) => setFormData({ ...formData, annee_conference_id: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                  disabled={!!editingPlan}
                >
                  <option value="">Sélectionner une année</option>
                  {anneesConference.map(annee => (
                    <option key={annee.id} value={annee.id}>
                      {annee.annee?.label || annee.label} {annee.is_current ? '(en cours)' : ''}
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
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
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