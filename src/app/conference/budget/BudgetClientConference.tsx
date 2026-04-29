
// app/conference/budget/BudgetClientConference.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, X, Loader2, MoreVertical, Edit, Trash2, DollarSign, Calendar, TrendingUp, TrendingDown, Receipt, ArrowUp, ArrowDown, History, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  createBudgetNiveau, 
  updateBudgetNiveau, 
  deleteBudgetNiveau, 
  getPlansActionForBudgetNiveau, 
  getAnneesConferenceForUniteBudgetNiveau, 
  getRealiseTotalsNiveau 
} from '@/actions/budget-niveaux'
import { createMouvementFinance, getMouvementsByBudget, deleteMouvementFinance, getBudgetMouvementSummary } from '@/actions/finance'
import { getConfiguration } from '@/actions/configurations'
import { CURRENCIES, type Currency, formatCurrency } from '@/lib/currency'

// Types
interface BudgetLine {
  id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: Currency
  created_at: string
  annee_conference_id: number
  plan_action_id: number | null
}

interface BudgetClientConferenceProps {
  uniteId: number
  conferenceId: number
  anneesDisponibles: any[]
  anneeConferenceId: number | undefined
  budgets: BudgetLine[]
  summary: any
  canEdit: boolean
  currentFilter: string
}

type ModalType = 'budget' | 'mouvement' | 'details' | null

export function BudgetClientConference({ 
  uniteId, 
  conferenceId, 
  anneesDisponibles, 
  anneeConferenceId, 
  budgets, 
  summary, 
  canEdit, 
  currentFilter 
}: BudgetClientConferenceProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // États
  const [modalType, setModalType] = useState<ModalType>(null)
  const [editingBudget, setEditingBudget] = useState<BudgetLine | null>(null)
  const [selectedBudget, setSelectedBudget] = useState<BudgetLine | null>(null)
  const [mouvements, setMouvements] = useState<any[]>([])
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [annees, setAnnees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // États pour la configuration et les totaux réalisés
  const [configTaux, setConfigTaux] = useState<number>(2800)
  const [configLoading, setConfigLoading] = useState(true)
  const [realiseTotals, setRealiseTotals] = useState({ 
    recettes: 0, 
    depenses: 0,
    recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
    depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
  })

  // Devise du budget (déterminée par la première ligne)
  const budgetCurrency: Currency = budgets.length > 0 ? budgets[0].currency : 'CDF'

  // Charger la configuration et les totaux réalisés
  useEffect(() => {
    loadConfiguration()
    if (anneeConferenceId) {
      loadRealiseTotals()
    }
  }, [uniteId, anneeConferenceId])

  async function loadConfiguration() {
    try {
      const config = await getConfiguration(uniteId)
      if (config) {
        setConfigTaux(config.taux)
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  async function loadRealiseTotals() {
    if (!anneeConferenceId) return
    try {
      const totals = await getRealiseTotalsNiveau(uniteId, anneeConferenceId)
      setRealiseTotals(totals)
    } catch (error) {
      console.error('Erreur chargement totaux réalisés:', error)
    }
  }

  const recettes = budgets.filter(b => b.type === 'recette')
  const depenses = budgets.filter(b => b.type === 'depense')
  const filteredBudgets = currentFilter === 'recette' ? recettes : currentFilter === 'depense' ? depenses : budgets

  const handleAnneeChange = (anneeId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('annee', anneeId)
    router.push(`/conference/budget?${params.toString()}`)
  }

  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams(searchParams.toString())
    filter === 'all' ? params.delete('filter') : params.set('filter', filter)
    router.push(`/conference/budget?${params.toString()}`)
  }

  const loadModalData = async (type: ModalType, budget?: BudgetLine) => {
    if (type === 'budget') {
      const [anneesData, plansData] = await Promise.all([
        getAnneesConferenceForUniteBudgetNiveau(uniteId, 'conference'),
        getPlansActionForBudgetNiveau(uniteId, anneeConferenceId)
      ])
      setAnnees(anneesData)
      setPlans(plansData)
    }
    if (type === 'details' && budget) {
      setLoading(true)
      const [mouv, summ] = await Promise.all([
        getMouvementsByBudget(budget.id),
        getBudgetMouvementSummary(budget.id)
      ])
      setMouvements(mouv)
      setMouvementSummary(summ)
      setLoading(false)
    }
  }

  const openModal = (type: ModalType, budget?: BudgetLine) => {
    setSelectedBudget(budget || null)
    setEditingBudget(budget || null)
    setModalType(type)
    loadModalData(type, budget)
  }

  const closeModal = () => {
    setModalType(null)
    setSelectedBudget(null)
    setEditingBudget(null)
    setMouvements([])
  }

  const handleSuccess = () => { 
    closeModal()
    router.refresh()
    loadConfiguration()
    loadRealiseTotals()
  }

  const handleDeleteBudget = async (id: number, libelle: string) => {
    if (!confirm(`Supprimer "${libelle}" ?`)) return
    const result = await deleteBudgetNiveau(id, 'conference')
    if (result.success) {
      toast.success('Supprimé')
      router.refresh()
      loadRealiseTotals()
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  const handleDeleteMouvement = async (id: number) => {
    if (!confirm('Supprimer ce mouvement ?')) return
    const result = await deleteMouvementFinance(id)
    if (result.success) {
      toast.success('Supprimé')
      if (selectedBudget) {
        const [mouv, summ] = await Promise.all([
          getMouvementsByBudget(selectedBudget.id),
          getBudgetMouvementSummary(selectedBudget.id)
        ])
        setMouvements(mouv)
        setMouvementSummary(summ)
      }
      loadRealiseTotals()
      router.refresh()
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  // Convertir un montant en CDF selon le taux de configuration
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }

  // Formater avec équivalent CDF si devise différente
  const formatWithCDF = (montant: number, currency: Currency) => {
    const formatted = formatCurrency(montant, currency)
    if (currency !== 'CDF') {
      const cdfAmount = convertToCDF(montant, currency)
      return `${formatted} (${formatCurrency(cdfAmount, 'CDF')})`
    }
    return formatted
  }

  // Calculer les totaux prévus en CDF
  const calculateTotals = () => {
    const totalRecettesPrevu = recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)
    const totalDepensesPrevu = depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0)

    return {
      totalRecettesPrevu,
      totalDepensesPrevu,
      recettesRealisees: realiseTotals.recettes,
      depensesRealisees: realiseTotals.depenses,
      progressionRecettes: totalRecettesPrevu > 0 ? (realiseTotals.recettes / totalRecettesPrevu) * 100 : 0,
      progressionDepenses: totalDepensesPrevu > 0 ? (realiseTotals.depenses / totalDepensesPrevu) * 100 : 0,
      resteRecettes: totalRecettesPrevu - realiseTotals.recettes,
      resteDepenses: totalDepensesPrevu - realiseTotals.depenses
    }
  }

  const totals = calculateTotals()

  // Vérifier si le budget a une devise définie
  const hasBudget = budgets.length > 0

  return (
    <>
      {/* Taux de configuration */}
      {!configLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-sm">
          <span className="text-blue-700">
            💱 Taux de conversion : 1 USD = {formatCurrency(configTaux, 'CDF')}
          </span>
        </div>
      )}

      {/* STATISTIQUES - VUE D'ENSEMBLE EN CDF */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Carte Recettes */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp size={16} className="text-green-600" />
              Recettes
            </h3>
            <span className="text-xs text-gray-500">
              {totals.progressionRecettes.toFixed(1)}% réalisé
            </span>
          </div>
          
          {/* Barre de progression */}
          <div className="w-full h-2 bg-gray-100 mb-3 overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${Math.min(totals.progressionRecettes, 100)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-light text-gray-900">
                {formatCurrency(totals.totalRecettesPrevu, 'CDF')}
              </div>
              <div className="text-xs text-gray-500">Prévu</div>
            </div>
            <div>
              <div className="text-lg font-light text-green-700">
                {formatCurrency(totals.recettesRealisees, 'CDF')}
              </div>
              <div className="text-xs text-green-600">Réalisé</div>
            </div>
            <div>
              <div className={`text-lg font-light ${totals.resteRecettes > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(Math.abs(totals.resteRecettes), 'CDF')}
              </div>
              <div className="text-xs text-gray-500">
                {totals.resteRecettes > 0 ? 'Restant' : 'Dépassement'}
              </div>
            </div>
          </div>
        </div>

        {/* Carte Dépenses */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingDown size={16} className="text-red-600" />
              Dépenses
            </h3>
            <span className="text-xs text-gray-500">
              {totals.progressionDepenses.toFixed(1)}% utilisé
            </span>
          </div>
          
          <div className="w-full h-2 bg-gray-100 mb-3 overflow-hidden">
            <div 
              className={`h-full transition-all ${
                totals.progressionDepenses > 100 ? 'bg-red-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(totals.progressionDepenses, 100)}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-light text-gray-900">
                {formatCurrency(totals.totalDepensesPrevu, 'CDF')}
              </div>
              <div className="text-xs text-gray-500">Budget</div>
            </div>
            <div>
              <div className="text-lg font-light text-red-700">
                {formatCurrency(totals.depensesRealisees, 'CDF')}
              </div>
              <div className="text-xs text-red-600">Dépensé</div>
            </div>
            <div>
              <div className={`text-lg font-light ${totals.resteDepenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(totals.resteDepenses), 'CDF')}
              </div>
              <div className="text-xs text-gray-500">
                {totals.resteDepenses >= 0 ? 'Disponible' : 'Dépassement'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RÉSUMÉ PAR DEVISE - RECETTES */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-600" />
          Recettes réalisées par devise
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xs text-green-600 mb-1">USD</div>
            <div className="text-xl font-light text-green-800">
              {formatCurrency(realiseTotals.recettesParDevise.USD, 'USD')}
            </div>
            <div className="text-xs text-green-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.recettesParDevise.USD, 'USD'), 'CDF')}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xs text-green-600 mb-1">CDF</div>
            <div className="text-xl font-light text-green-800">
              {formatCurrency(realiseTotals.recettesParDevise.CDF, 'CDF')}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xs text-green-600 mb-1">EUR</div>
            <div className="text-xl font-light text-green-800">
              {formatCurrency(realiseTotals.recettesParDevise.EUR, 'EUR')}
            </div>
            <div className="text-xs text-green-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.recettesParDevise.EUR, 'EUR'), 'CDF')}
            </div>
          </div>
        </div>
      </div>

      {/* RÉSUMÉ PAR DEVISE - DÉPENSES */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
          <TrendingDown size={16} className="text-red-600" />
          Dépenses réalisées par devise
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-xs text-red-600 mb-1">USD</div>
            <div className="text-xl font-light text-red-800">
              {formatCurrency(realiseTotals.depensesParDevise.USD, 'USD')}
            </div>
            <div className="text-xs text-red-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.depensesParDevise.USD, 'USD'), 'CDF')}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-xs text-red-600 mb-1">CDF</div>
            <div className="text-xl font-light text-red-800">
              {formatCurrency(realiseTotals.depensesParDevise.CDF, 'CDF')}
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-xs text-red-600 mb-1">EUR</div>
            <div className="text-xl font-light text-red-800">
              {formatCurrency(realiseTotals.depensesParDevise.EUR, 'EUR')}
            </div>
            <div className="text-xs text-red-600 mt-1">
              ≈ {formatCurrency(convertToCDF(realiseTotals.depensesParDevise.EUR, 'EUR'), 'CDF')}
            </div>
          </div>
        </div>
      </div>

      {/* PRÉVISIONS BUDGÉTAIRES */}
      {hasBudget && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <Wallet size={16} />
            Prévisions budgétaires
            <span className="text-xs font-normal text-gray-400 ml-2">
              (Budget en {budgetCurrency === 'USD' ? 'Dollars US' : budgetCurrency === 'EUR' ? 'Euros' : 'Francs Congolais'})
            </span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Prévisions Recettes */}
            <div className="bg-white border border-gray-200 p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                Recettes prévues
              </h4>
              <div className="text-2xl font-light text-green-700">
                {formatCurrency(recettes.reduce((sum, b) => sum + b.montant, 0), budgetCurrency)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {recettes.length} ligne(s)
              </div>
              {budgetCurrency !== 'CDF' && (
                <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  ≈ {formatCurrency(recettes.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0), 'CDF')}
                </div>
              )}
            </div>
            
            {/* Prévisions Dépenses */}
            <div className="bg-white border border-gray-200 p-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingDown size={16} className="text-red-600" />
                Dépenses prévues
              </h4>
              <div className="text-2xl font-light text-red-700">
                {formatCurrency(depenses.reduce((sum, b) => sum + b.montant, 0), budgetCurrency)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {depenses.length} ligne(s)
              </div>
              {budgetCurrency !== 'CDF' && (
                <div className="text-sm text-gray-500 mt-2 pt-2 border-t border-gray-100">
                  ≈ {formatCurrency(depenses.reduce((sum, b) => sum + convertToCDF(b.montant, b.currency), 0), 'CDF')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select 
            value={anneeConferenceId || ''} 
            onChange={e => handleAnneeChange(e.target.value)} 
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            {anneesDisponibles.map(a => (
              <option key={a.id} value={a.id}>
                {a.label} {a.is_current ? '(en cours)' : ''}
              </option>
            ))}
          </select>
          <div className="flex border border-gray-300 overflow-hidden">
            {['all', 'recette', 'depense'].map(f => (
              <button 
                key={f} 
                onClick={() => handleFilterChange(f)} 
                className={`px-3 py-2 text-sm ${
                  currentFilter === f 
                    ? (f === 'recette' ? 'bg-green-600 text-white' : f === 'depense' ? 'bg-red-600 text-white' : 'bg-black text-white') 
                    : 'bg-white hover:bg-gray-50'
                } ${f !== 'all' ? 'border-l border-gray-300' : ''}`}
              >
                {f === 'all' ? 'Tous' : f === 'recette' ? 'Recettes' : 'Dépenses'}
              </button>
            ))}
          </div>
        </div>
        {canEdit && (
          <button 
            onClick={() => openModal('budget')} 
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
          >
            <Plus size={16} />Nouvelle ligne
          </button>
        )}
      </div>

      {/* Liste budgets */}
      {!anneeConferenceId ? (
        <div className="border border-gray-200 py-16 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune année disponible</p>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="border border-gray-200 py-16 text-center">
          <Wallet size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune ligne budgétaire</p>
          {canEdit && (
            <button 
              onClick={() => openModal('budget')} 
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
            >
              <Plus size={16} />Créer une première ligne
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(['recette', 'depense'] as const).map(type => {
            const items = type === 'recette' ? recettes : depenses
            if (!items.length || (currentFilter !== 'all' && currentFilter !== type)) return null
            return (
              <div key={type}>
                <h2 className={`text-sm font-medium mb-2 flex items-center gap-2 ${type === 'recette' ? 'text-green-600' : 'text-red-600'}`}>
                  {type === 'recette' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {type === 'recette' ? 'Recettes' : 'Dépenses'}
                  <span className="text-gray-400 font-normal ml-2">({items.length})</span>
                </h2>
                <div className="space-y-2">
                  {items.map(budget => (
                    <BudgetRowConference 
                      key={budget.id} 
                      budget={budget} 
                      canEdit={canEdit} 
                      onEdit={() => openModal('budget', budget)} 
                      onMouvement={() => openModal('mouvement', budget)} 
                      onDetails={() => openModal('details', budget)} 
                      onDelete={handleDeleteBudget}
                      formatWithCDF={formatWithCDF}
                      configTaux={configTaux}
                      budgetCurrency={budgetCurrency}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      {modalType === 'budget' && (
        <BudgetModalConference 
          isOpen 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
          uniteId={uniteId} 
          anneeConferenceId={anneeConferenceId} 
          budget={editingBudget} 
          annees={annees} 
          plans={plans} 
          configTaux={configTaux}
          existingBudgets={budgets}
        />
      )}
      {modalType === 'mouvement' && selectedBudget && (
        <MouvementModalConference 
          isOpen 
          onClose={closeModal} 
          onSuccess={handleSuccess} 
          budget={selectedBudget} 
          configTaux={configTaux}
        />
      )}
      {modalType === 'details' && selectedBudget && (
        <DetailsModalConference 
          isOpen 
          onClose={closeModal} 
          budget={selectedBudget} 
          mouvements={mouvements} 
          summary={mouvementSummary} 
          loading={loading} 
          onAddMouvement={() => openModal('mouvement', selectedBudget)} 
          onDeleteMouvement={handleDeleteMouvement}
          configTaux={configTaux}
          formatWithCDF={formatWithCDF}
        />
      )}
    </>
  )
}

// BudgetRow avec progression par ligne
function BudgetRowConference({ budget, canEdit, onEdit, onMouvement, onDetails, onDelete, formatWithCDF, configTaux, budgetCurrency }: any) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mouvementSummary, setMouvementSummary] = useState<any>(null)
  const isRecette = budget.type === 'recette'
  
  useEffect(() => {
    loadMouvementSummary()
  }, [budget.id])
  
  async function loadMouvementSummary() {
    try {
      const summary = await getBudgetMouvementSummary(budget.id)
      setMouvementSummary(summary)
    } catch (error) {
      console.error('Erreur chargement résumé:', error)
    }
  }
  
  // Convertir en CDF pour la comparaison
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }
  
  // Total réalisé dans la devise du budget (pour l'affichage principal)
  const totalRealiseDevise = mouvementSummary?.totalParDevise?.find((d: any) => d.currency === budget.currency)?.montant || 0
  
  // Total réalisé converti en CDF pour la progression
  const totalRealiseCDF = mouvementSummary?.totalCDF || 0
  const prevuCDF = convertToCDF(budget.montant, budget.currency)
  const progression = prevuCDF > 0 ? (totalRealiseCDF / prevuCDF) * 100 : 0
  const resteCDF = prevuCDF - totalRealiseCDF
  
  // Récupérer les totaux par devise pour l'affichage détaillé
  const mouvementsParDevise = mouvementSummary?.totalParDevise || []
  
  return (
    <div className="bg-white border border-gray-200 p-4 hover:border-gray-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium">{budget.libelle}</h3>
            <span className={`text-xs px-2 py-0.5 border ${isRecette ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {isRecette ? 'Recette' : 'Dépense'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <DollarSign size={14} className={isRecette ? 'text-green-500' : 'text-red-500'} />
              <span className="text-lg font-light">{formatWithCDF(budget.montant, budget.currency)}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar size={12} />
              <span>Créé le {new Date(budget.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
          
          {/* Détail des mouvements par devise */}
          {mouvementSummary && mouvementsParDevise.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3">
              {mouvementsParDevise.map((devise: any) => (
                <div key={devise.currency} className="text-xs">
                  <span className="text-gray-500">{devise.currency}:</span>{' '}
                  <span className="font-medium">{formatCurrency(devise.montant, devise.currency)}</span>
                  {devise.currency !== 'CDF' && (
                    <span className="text-gray-400 ml-1">
                      (≈ {formatCurrency(convertToCDF(devise.montant, devise.currency), 'CDF')})
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Barre de progression par ligne (en CDF pour cohérence) */}
          {mouvementSummary && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  Réalisé: {formatCurrency(totalRealiseCDF, 'CDF')}
                </span>
                <span className="text-gray-400">
                  {progression.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    isRecette ? 'bg-green-500' : 
                    progression > 100 ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(progression, 100)}%` }}
                />
              </div>
              {resteCDF !== 0 && (
                <div className={`text-xs mt-1 ${resteCDF > 0 ? 'text-gray-500' : (isRecette ? 'text-green-600' : 'text-red-600')}`}>
                  {isRecette 
                    ? (resteCDF > 0 ? `Reste à percevoir: ${formatCurrency(resteCDF, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(resteCDF), 'CDF')}`)
                    : (resteCDF >= 0 ? `Reste disponible: ${formatCurrency(resteCDF, 'CDF')}` : `Dépassement: ${formatCurrency(Math.abs(resteCDF), 'CDF')}`)
                  }
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onMouvement} 
            className={`p-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isRecette ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
            title={isRecette ? 'Enregistrer une recette' : 'Enregistrer une dépense'}
          >
            {isRecette ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
          <button 
            onClick={onDetails} 
            className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Voir les détails"
          >
            <Receipt size={16} />
          </button>
          {canEdit && (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                title="Plus d'options"
              >
                <MoreVertical size={16} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[150px]">
                    <button 
                      onClick={() => { setMenuOpen(false); onEdit() }} 
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit size={14} />Modifier
                    </button>
                    <button 
                      onClick={() => { setMenuOpen(false); onDelete(budget.id, budget.libelle) }} 
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} />Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Modal Budget
function BudgetModalConference({ isOpen, onClose, onSuccess, uniteId, anneeConferenceId, budget, annees, plans, configTaux, existingBudgets }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Déterminer la devise par défaut : si des budgets existent, utiliser leur devise, sinon CDF
  const defaultCurrency = existingBudgets && existingBudgets.length > 0 ? existingBudgets[0].currency : 'CDF'
  
  const [formData, setFormData] = useState({
    type: budget?.type || 'depense',
    libelle: budget?.libelle || '',
    montant: budget?.montant?.toString() || '',
    currency: budget?.currency || defaultCurrency,
    annee_conference_id: budget?.annee_conference_id?.toString() || anneeConferenceId?.toString() || '',
    plan_action_id: budget?.plan_action_id?.toString() || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData()
    form.append('unite_id', uniteId.toString())
    Object.entries(formData).forEach(([k, v]) => form.append(k, v as string))
    if (budget) form.append('id', budget.id.toString())
    const result = await (budget ? updateBudgetNiveau(form, 'conference') : createBudgetNiveau(form, 'conference'))
    if (result.success) {
      toast.success(budget ? 'Modifié' : 'Créé')
      onSuccess()
    } else {
      toast.error(result.error || 'Erreur')
    }
    setIsSubmitting(false)
  }

  const montantNum = parseFloat(formData.montant) || 0
  const equivalentCDF = formData.currency !== 'CDF' ? montantNum * configTaux : null

  // Vérifier si c'est une modification ou si des budgets existent déjà
  const isCurrencyLocked = !budget && existingBudgets && existingBudgets.length > 0

  if (!isOpen) return null
  return (
    <ModalWrapperConference title={budget ? 'Modifier la ligne' : 'Nouvelle ligne'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {isCurrencyLocked && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
            ⚠️ Le budget est en {defaultCurrency}. Toutes les lignes doivent utiliser cette devise.
          </div>
        )}
        <select 
          value={formData.type} 
          onChange={e => setFormData({...formData, type: e.target.value})} 
          className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black"
        >
          <option value="recette">Recette</option>
          <option value="depense">Dépense</option>
        </select>
        <input 
          type="text" 
          value={formData.libelle} 
          onChange={e => setFormData({...formData, libelle: e.target.value})} 
          placeholder="Libellé" 
          className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
          required 
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <input 
              type="number" 
              step="0.01" 
              min="0.01" 
              value={formData.montant} 
              onChange={e => setFormData({...formData, montant: e.target.value})} 
              placeholder="Montant" 
              className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
              required 
            />
            {equivalentCDF && (
              <p className="text-xs text-gray-500 mt-1">≈ {formatCurrency(equivalentCDF, 'CDF')}</p>
            )}
          </div>
          <select 
            value={formData.currency} 
            onChange={e => setFormData({...formData, currency: e.target.value as Currency})} 
            className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black"
            disabled={isCurrencyLocked}
          >
            {Object.keys(CURRENCIES).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <select 
          value={formData.annee_conference_id} 
          onChange={e => setFormData({...formData, annee_conference_id: e.target.value, plan_action_id: ''})} 
          className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
          required 
          disabled={!!budget}
        >
          <option value="">Sélectionner une année</option>
          {annees.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.annee?.label || a.annee_id} {a.is_current ? '(en cours)' : ''}
            </option>
          ))}
        </select>
        <select 
          value={formData.plan_action_id} 
          onChange={e => setFormData({...formData, plan_action_id: e.target.value})} 
          className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
          disabled={!formData.annee_conference_id}
        >
          <option value="">Aucun plan d'action</option>
          {plans.map((p: any) => <option key={p.id} value={p.id}>{p.titre}</option>)}
        </select>
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm">Annuler</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (budget ? 'Modifier' : 'Créer')}
          </button>
        </div>
      </form>
    </ModalWrapperConference>
  )
}

// Modal Mouvement
function MouvementModalConference({ isOpen, onClose, onSuccess, budget, configTaux }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ 
    montant: '', 
    currency: 'USD' as Currency,
    date_mouvement: new Date().toISOString().split('T')[0], 
    description: '' 
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const form = new FormData()
    form.append('budget_id', budget.id.toString())
    form.append('type', budget.type)
    form.append('montant', formData.montant)
    form.append('currency', formData.currency)
    form.append('date_mouvement', formData.date_mouvement)
    form.append('description', formData.description)
    const result = await createMouvementFinance(form)
    if (result.success) {
      toast.success('Enregistré')
      onSuccess()
    } else {
      toast.error(result.error || 'Erreur')
    }
    setIsSubmitting(false)
  }

  // Convertir en CDF
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }

  const montantNum = parseFloat(formData.montant) || 0
  const equivalentCDF = formData.currency !== 'CDF' ? convertToCDF(montantNum, formData.currency) : null
  const budgetCDF = convertToCDF(budget.montant, budget.currency)

  if (!isOpen) return null
  return (
    <ModalWrapperConference 
      title={`${budget.type === 'recette' ? 'Recette' : 'Dépense'} - ${budget.libelle}`} 
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-gray-50 p-3 text-sm border border-gray-200">
          <div>Budget prévu : <span className="font-medium">{formatCurrency(budget.montant, budget.currency)}</span></div>
          <div className="text-xs text-gray-500 mt-1">≈ {formatCurrency(budgetCDF, 'CDF')}</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Montant</label>
            <input 
              type="number" 
              step="0.01" 
              min="0.01" 
              value={formData.montant} 
              onChange={e => setFormData({...formData, montant: e.target.value})} 
              className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
              placeholder="Montant" 
              required 
              autoFocus 
            />
            {equivalentCDF && (
              <p className="text-xs text-gray-500 mt-1">≈ {formatCurrency(equivalentCDF, 'CDF')}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Devise</label>
            <select 
              value={formData.currency} 
              onChange={e => setFormData({...formData, currency: e.target.value as Currency})} 
              className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black"
            >
              <option value="USD">USD ($)</option>
              <option value="CDF">CDF (FC)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Date</label>
          <input 
            type="date" 
            value={formData.date_mouvement} 
            onChange={e => setFormData({...formData, date_mouvement: e.target.value})} 
            className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
            required 
          />
        </div>
        
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description (optionnelle)</label>
          <textarea 
            value={formData.description} 
            onChange={e => setFormData({...formData, description: e.target.value})} 
            className="w-full border border-gray-300 p-2 focus:outline-none focus:border-black" 
            rows={2} 
            placeholder="Description du mouvement" 
          />
        </div>
        
        <div className="flex gap-3 border-gray-200">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm">Annuler</button>
          <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center">
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Enregistrer'}
          </button>
        </div>
        <div className="p-3 pt-4 border-t bg-blue-50 border border-blue-200 text-xs text-blue-700">
          💡 Le mouvement sera enregistré en {formData.currency}. 
          L'équivalent en CDF sera calculé automatiquement pour les statistiques.
        </div>
      </form>
    </ModalWrapperConference>
  )
}

// Modal Détails
function DetailsModalConference({ isOpen, onClose, budget, mouvements, summary, loading, onAddMouvement, onDeleteMouvement, configTaux, formatWithCDF }: any) {
  const convertToCDF = (montant: number, currency: Currency): number => {
    if (currency === 'CDF') return montant
    if (currency === 'USD') return montant * configTaux
    if (currency === 'EUR') return montant * 1.08 * configTaux
    return montant
  }

  if (!isOpen) return null
  
  // Grouper les mouvements par devise
  const mouvementsParDevise = summary?.totalParDevise || []
  
  return (
    <ModalWrapperConference 
      title={budget.libelle} 
      subtitle={`Budget: ${formatWithCDF(budget.montant, budget.currency)}`} 
      onClose={onClose}
    >
      <div className="p-4">
        {summary && (
          <>
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200">
              <div className="grid grid-cols-2 gap-2">
                {mouvementsParDevise.map((devise: any) => (
                  <div key={devise.currency} className="text-center p-2 bg-white border border-gray-100">
                    <div className="text-xs text-gray-500">{devise.currency}</div>
                    <div className="font-medium">{formatCurrency(devise.montant, devise.currency)}</div>
                    {devise.currency !== 'CDF' && (
                      <div className="text-xs text-gray-400">
                        ≈ {formatCurrency(convertToCDF(devise.montant, devise.currency), 'CDF')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total en CDF :</span>
                  <span className="font-medium">{formatCurrency(summary.totalCDF, 'CDF')}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-sm text-gray-600">Reste :</span>
                  <span className={`font-medium ${summary.resteCDF >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.resteCDF, 'CDF')}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">{summary.nombreMouvements} mouvement(s)</div>
            </div>
          </>
        )}
        
        {loading ? (
          <Loader2 className="animate-spin mx-auto my-10" />
        ) : mouvements.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <History size={32} className="mx-auto mb-2" />
            <p className="text-sm">Aucun mouvement</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {mouvements.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between p-3 border border-gray-200 hover:bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatCurrency(m.montant, m.currency)}</span>
                    <span className="text-xs bg-gray-100 px-1.5 py-0.5">{m.currency}</span>
                  </div>
                  {m.currency !== 'CDF' && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      ≈ {formatCurrency(convertToCDF(m.montant, m.currency), 'CDF')}
                    </div>
                  )}
                  <span className="text-xs text-gray-400 block mt-1">
                    {new Date(m.date_mouvement).toLocaleDateString('fr-FR')}
                  </span>
                  {m.description && (
                    <p className="text-sm text-gray-500 mt-1">{m.description}</p>
                  )}
                </div>
                <button 
                  onClick={() => onDeleteMouvement(m.id)} 
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        
        <button 
          onClick={onAddMouvement} 
          className="w-full mt-4 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 flex items-center justify-center gap-2"
        >
          <Plus size={16} />Ajouter un mouvement
        </button>
      </div>
    </ModalWrapperConference>
  )
}

// ModalWrapper
function ModalWrapperConference({ children, title, subtitle, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}