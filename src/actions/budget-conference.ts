// actions/budget-conference.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getDepartementUniteForConference } from './unite-organisation'
import { type Currency, convertToUSD } from '@/lib/currency'

export interface BudgetLineConference {
  id: number
  unite_id: number
  plan_action_id: number | null
  annee_conference_id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: Currency
  created_at: string
  updated_at: string
  unite?: { id: number; nom: string; niveau: string }
  plan_action?: { id: number; titre: string } | null
  annee_conference?: {
    id: number
    is_current: boolean
    annee?: { id: number; label: string }
  }
}

export interface BudgetSummaryConference {
  recettes: number
  depenses: number
  solde: number
  totalLines: number
  recettesList: BudgetLineConference[]
  depensesList: BudgetLineConference[]
  byCurrency: Array<{
    currency: Currency
    recettes: number
    depenses: number
    solde: number
    lines: BudgetLineConference[]
  }>
  totalUSD: { recettes: number; depenses: number; solde: number }
}

/**
 * Récupère les lignes budgétaires de la conférence
 */
export async function getBudgetsByConference(anneeConferenceId?: number): Promise<BudgetLineConference[]> {
  try {
    const user = await getUser()
    if (!user?.fidele_id) return []

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) return []

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite) return []

    let query = supabase
      .from('budget')
      .select('*')
      .eq('unite_id', unite.id)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: budgets, error } = await query.order('type').order('created_at', { ascending: false })

    if (error) return []
    if (!budgets?.length) return []

    // Récupérer les plans d'action
    const planActionIds = [...new Set(budgets.filter(b => b.plan_action_id).map(b => b.plan_action_id))]
    let planActionsMap = new Map()
    if (planActionIds.length) {
      const { data: planActions } = await supabase
        .from('plan_action')
        .select('id, titre')
        .in('id', planActionIds)
      planActions?.forEach(plan => planActionsMap.set(plan.id, plan))
    }

    return budgets.map(budget => ({
      ...budget,
      plan_action: budget.plan_action_id ? planActionsMap.get(budget.plan_action_id) || null : null
    }))
  } catch (error) {
    console.error('Erreur getBudgetsByConference:', error)
    return []
  }
}

/**
 * Récupère le résumé du budget
 */
export async function getBudgetSummaryConference(uniteId: number, anneeConferenceId?: number): Promise<BudgetSummaryConference> {
  try {
    let query = supabase.from('budget').select('*').eq('unite_id', uniteId)
    if (anneeConferenceId) query = query.eq('annee_conference_id', anneeConferenceId)
    
    const { data: budgets, error } = await query
    if (error) throw error

    const byCurrency = new Map<Currency, { recettes: number; depenses: number; lines: BudgetLineConference[] }>()
    let totalRecettesUSD = 0, totalDepensesUSD = 0

    budgets?.forEach(budget => {
      const currency = budget.currency
      if (!byCurrency.has(currency)) {
        byCurrency.set(currency, { recettes: 0, depenses: 0, lines: [] })
      }
      const summary = byCurrency.get(currency)!
      summary.lines.push(budget)
      
      if (budget.type === 'recette') {
        summary.recettes += budget.montant
        totalRecettesUSD += convertToUSD(budget.montant, budget.currency)
      } else {
        summary.depenses += budget.montant
        totalDepensesUSD += convertToUSD(budget.montant, budget.currency)
      }
    })

    const recettes = budgets?.filter(b => b.type === 'recette').reduce((s, b) => s + b.montant, 0) || 0
    const depenses = budgets?.filter(b => b.type === 'depense').reduce((s, b) => s + b.montant, 0) || 0

    return {
      recettes,
      depenses,
      solde: recettes - depenses,
      totalLines: budgets?.length || 0,
      recettesList: budgets?.filter(b => b.type === 'recette') || [],
      depensesList: budgets?.filter(b => b.type === 'depense') || [],
      byCurrency: Array.from(byCurrency.entries()).map(([currency, data]) => ({
        currency,
        recettes: data.recettes,
        depenses: data.depenses,
        solde: data.recettes - data.depenses,
        lines: data.lines
      })),
      totalUSD: { recettes: totalRecettesUSD, depenses: totalDepensesUSD, solde: totalRecettesUSD - totalDepensesUSD }
    }
  } catch (error) {
    console.error('Erreur getBudgetSummaryConference:', error)
    return { recettes: 0, depenses: 0, solde: 0, totalLines: 0, recettesList: [], depensesList: [], byCurrency: [], totalUSD: { recettes: 0, depenses: 0, solde: 0 } }
  }
}

/**
 * Crée une ligne budgétaire
 */
export async function createBudgetConference(formData: FormData) {
  try {
    const user = await getUser()
    if (!user?.fidele_id) return { error: 'Vous devez être connecté' }

    const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
    const type = formData.get('type') as string
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as Currency

    if (!annee_conference_id || isNaN(annee_conference_id)) return { error: 'Année de conférence invalide' }
    if (type !== 'recette' && type !== 'depense') return { error: 'Type invalide' }
    if (!libelle?.trim()) return { error: 'Le libellé est requis' }
    if (!montant || montant <= 0) return { error: 'Le montant doit être supérieur à 0' }
    if (!currency || !['USD', 'CDF', 'EUR'].includes(currency)) return { error: 'Devise invalide' }

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) return { error: 'Vous n\'êtes pas autorisé' }

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite) return { error: 'Unité non trouvée' }

    // Vérifier le plan d'action
    if (plan_action_id) {
      const { data: plan } = await supabase
        .from('plan_action')
        .select('unite_id, annee_conference_id')
        .eq('id', plan_action_id)
        .single()

      if (!plan) return { error: 'Plan d\'action non trouvé' }
      if (plan.unite_id !== unite.id) return { error: 'Le plan d\'action n\'appartient pas à cette unité' }
      if (plan.annee_conference_id !== annee_conference_id) {
        return { error: 'L\'année du plan d\'action ne correspond pas' }
      }
    }

    const { data: budget, error } = await supabase
      .from('budget')
      .insert([{
        unite_id: unite.id,
        plan_action_id,
        annee_conference_id,
        type,
        libelle: libelle.trim(),
        montant,
        currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) return { error: 'Erreur lors de la création' }

    revalidatePath('/conference/budget')
    if (plan_action_id) revalidatePath(`/conference/plans-action/${plan_action_id}`)

    return { success: true, budget }
  } catch (error) {
    console.error('Erreur createBudgetConference:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Met à jour une ligne budgétaire
 */
export async function updateBudgetConference(formData: FormData) {
  try {
    const user = await getUser()
    if (!user?.fidele_id) return { error: 'Vous devez être connecté' }

    const id = parseInt(formData.get('id') as string)
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as Currency

    if (!id) return { error: 'ID invalide' }
    if (!libelle?.trim()) return { error: 'Le libellé est requis' }
    if (!montant || montant <= 0) return { error: 'Le montant doit être supérieur à 0' }

    const { data: budget, error: fetchError } = await supabase
      .from('budget')
      .select('unite_id, plan_action_id')
      .eq('id', id)
      .single()

    if (fetchError || !budget) return { error: 'Budget non trouvé' }

    const { data: chef } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (!chef) return { error: 'Vous n\'êtes pas autorisé' }

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite || unite.id !== budget.unite_id) return { error: 'Vous ne pouvez modifier ce budget' }

    const updateData: any = { libelle: libelle.trim(), montant, updated_at: new Date().toISOString() }
    if (currency) updateData.currency = currency

    const { error } = await supabase.from('budget').update(updateData).eq('id', id)
    if (error) return { error: 'Erreur lors de la mise à jour' }

    revalidatePath('/conference/budget')
    if (budget.plan_action_id) revalidatePath(`/conference/plans-action/${budget.plan_action_id}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur updateBudgetConference:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime une ligne budgétaire
 */
export async function deleteBudgetConference(id: number) {
  try {
    const user = await getUser()
    if (!user?.fidele_id) return { error: 'Vous devez être connecté' }

    const { data: budget, error: fetchError } = await supabase
      .from('budget')
      .select('unite_id, plan_action_id')
      .eq('id', id)
      .single()

    if (fetchError || !budget) return { error: 'Budget non trouvé' }

    const { data: chef } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (!chef) return { error: 'Vous n\'êtes pas autorisé' }

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite || unite.id !== budget.unite_id) return { error: 'Vous ne pouvez supprimer ce budget' }

    const { error } = await supabase.from('budget').delete().eq('id', id)
    if (error) return { error: 'Erreur lors de la suppression' }

    revalidatePath('/conference/budget')
    if (budget.plan_action_id) revalidatePath(`/conference/plans-action/${budget.plan_action_id}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur deleteBudgetConference:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// actions/budget-conference.ts - Ajouter cette fonction

/**
 * Récupère les lignes budgétaires d'un plan d'action spécifique
 */
export async function getBudgetsByPlanActionConference(planActionId: number): Promise<BudgetLineConference[]> {
  try {
    const { data: budgets, error } = await supabase
      .from('budget')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getBudgetsByPlanActionConference:', error)
      return []
    }

    if (!budgets || budgets.length === 0) {
      return []
    }

    // Fetch related data
    const uniteIds = [...new Set(budgets.map(b => b.unite_id))]
    const anneeConferenceIds = [...new Set(budgets.map(b => b.annee_conference_id).filter(id => id !== null))]

    // Fetch unites
    let unitesMap = new Map()
    if (uniteIds.length > 0) {
      const { data: unites } = await supabase
        .from('unite_organisation')
        .select('*')
        .in('id', uniteIds)
      
      if (unites) {
        unites.forEach(unite => {
          unitesMap.set(unite.id, unite)
        })
      }
    }

    // Fetch plan action
    let planActionsMap = new Map()
    const { data: planAction } = await supabase
      .from('plan_action')
      .select('id, titre')
      .eq('id', planActionId)
      .single()
    
    if (planAction) {
      planActionsMap.set(planAction.id, planAction)
    }

    // Fetch annee_conference
    let anneesMap = new Map()
    if (anneeConferenceIds.length > 0) {
      const { data: anneesConferences } = await supabase
        .from('annee_conference')
        .select(`
          id,
          annee_id,
          conference_id,
          is_current,
          annee:annee_id (id, label)
        `)
        .in('id', anneeConferenceIds)
      
      if (anneesConferences) {
        anneesConferences.forEach(annee => {
          anneesMap.set(annee.id, annee)
        })
      }
    }

    return budgets.map(budget => ({
      ...budget,
      unite: unitesMap.get(budget.unite_id) || null,
      plan_action: budget.plan_action_id ? (planActionsMap.get(budget.plan_action_id) || null) : null,
      annee_conference: anneesMap.get(budget.annee_conference_id) || null
    }))
    
  } catch (error) {
    console.error('Erreur inattendue getBudgetsByPlanActionConference:', error)
    return []
  }
}


// actions/budget-conference.ts - Ajouter cette fonction

export async function getPlansActionForBudgetConference(uniteId: number, anneeConferenceId?: number) {
  try {
    let query = supabase
      .from('plan_action')
      .select('id, titre, annee_conference_id')
      .eq('unite_id', uniteId)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionForBudgetConference:', error)
    return []
  }
}