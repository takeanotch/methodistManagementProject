

// actions/budget-district.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getDepartementUniteForDistrict } from './unite-organisation'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'
import { type Currency, CURRENCIES, EXCHANGE_RATES, convertToUSD, formatCurrency } from '@/lib/currency'

export interface BudgetLineDistrict {
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
  unite?: {
    id: number
    nom: string
    niveau: string
    reference_id: number
  }
  plan_action?: {
    id: number
    titre: string
  } | null
  annee_conference?: {
    id: number
    annee_id: number
    conference_id: number
    is_current: boolean
    annee?: {
      id: number
      label: string
    }
  }
}

export interface BudgetSummaryDistrict {
  recettes: number
  depenses: number
  solde: number
  totalLines: number
  recettesList: BudgetLineDistrict[]
  depensesList: BudgetLineDistrict[]
  byCurrency: Array<{
    currency: Currency
    recettes: number
    depenses: number
    solde: number
    lines: BudgetLineDistrict[]
  }>
  totalUSD: {
    recettes: number
    depenses: number
    solde: number
  }
}

// Récupérer la conférence d'un district
async function getConferenceFromDistrict(districtId: number): Promise<number | null> {
  try {
    const { data: district } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()
    return district?.conference_id || null
  } catch (error) {
    console.error('Erreur getConferenceFromDistrict:', error)
    return null
  }
}

// Récupérer l'unité complète
async function getUniteComplete(uniteId: number) {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('*')
      .eq('id', uniteId)
      .single()
    if (error) return null
    return data
  } catch (error) {
    console.error('Erreur getUniteComplete:', error)
    return null
  }
}

// Récupérer toutes les années de conférence disponibles pour le district
export async function getAnneesConferenceForDistrictBudget(districtId: number) {
  try {
    const conferenceId = await getConferenceFromDistrict(districtId)
    if (!conferenceId) return []

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error('Erreur getAnneesConferenceForDistrictBudget:', error)
    return []
  }
}

// Récupérer les plans d'action disponibles pour une unité
export async function getPlansActionForBudgetDistrict(uniteId: number, anneeConferenceId?: number) {
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
    console.error('Erreur getPlansActionForBudgetDistrict:', error)
    return []
  }
}

/**
 * Récupère les lignes budgétaires d'une unité
 */
export async function getBudgetsByUniteDistrict(uniteId: number, anneeConferenceId?: number, type?: 'recette' | 'depense', currency?: Currency): Promise<BudgetLineDistrict[]> {
  try {
    // Build the query
    let query = supabase
      .from('budget')
      .select('*')
      .eq('unite_id', uniteId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (currency) {
      query = query.eq('currency', currency)
    }

    const { data: budgets, error } = await query
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getBudgetsByUniteDistrict:', error)
      return []
    }

    if (!budgets || budgets.length === 0) {
      return []
    }

    // Fetch related data separately
    const uniteIds = [...new Set(budgets.map(b => b.unite_id))]
    const planActionIds = budgets.filter(b => b.plan_action_id).map(b => b.plan_action_id).filter(id => id !== null)
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

    // Fetch plan actions
    let planActionsMap = new Map()
    if (planActionIds.length > 0) {
      const { data: planActions } = await supabase
        .from('plan_action')
        .select('id, titre')
        .in('id', planActionIds)
      
      if (planActions) {
        planActions.forEach(plan => {
          planActionsMap.set(plan.id, plan)
        })
      }
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
    console.error('Erreur inattendue getBudgetsByUniteDistrict:', error)
    return []
  }
}

/**
 * Récupère les lignes budgétaires du district du chef connecté
 */
export async function getBudgetsByDistrict(anneeConferenceId?: number): Promise<BudgetLineDistrict[]> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return []

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) return []

    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
    if (!unite) return []

    return await getBudgetsByUniteDistrict(unite.id, anneeConferenceId)
  } catch (error) {
    console.error('Erreur getBudgetsByDistrict:', error)
    return []
  }
}

/**
 * Récupère les lignes budgétaires d'un plan d'action spécifique
 */
export async function getBudgetsByPlanActionDistrict(planActionId: number): Promise<BudgetLineDistrict[]> {
  try {
    const { data: budgets, error } = await supabase
      .from('budget')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getBudgetsByPlanActionDistrict:', error)
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
    console.error('Erreur inattendue getBudgetsByPlanActionDistrict:', error)
    return []
  }
}

/**
 * Récupère le résumé du budget d'une unité
 */
export async function getBudgetSummaryDistrict(uniteId: number, anneeConferenceId?: number): Promise<BudgetSummaryDistrict> {
  try {
    const budgets = await getBudgetsByUniteDistrict(uniteId, anneeConferenceId)

    // Grouper par devise
    const summaryByCurrency = new Map<Currency, { recettes: number; depenses: number; lines: BudgetLineDistrict[] }>()
    
    budgets.forEach(budget => {
      const currency = budget.currency
      if (!summaryByCurrency.has(currency)) {
        summaryByCurrency.set(currency, { recettes: 0, depenses: 0, lines: [] })
      }
      
      const summary = summaryByCurrency.get(currency)!
      summary.lines.push(budget)
      
      if (budget.type === 'recette') {
        summary.recettes += budget.montant
      } else {
        summary.depenses += budget.montant
      }
    })

    // Convertir en USD pour le total général
    let totalRecettesUSD = 0
    let totalDepensesUSD = 0
    
    budgets.forEach(budget => {
      const amountUSD = convertToUSD(budget.montant, budget.currency)
      if (budget.type === 'recette') {
        totalRecettesUSD += amountUSD
      } else {
        totalDepensesUSD += amountUSD
      }
    })

    const totalSoldeUSD = totalRecettesUSD - totalDepensesUSD

    return {
      recettes: budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + b.montant, 0),
      depenses: budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + b.montant, 0),
      solde: budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + b.montant, 0) - 
             budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + b.montant, 0),
      totalLines: budgets.length,
      recettesList: budgets.filter(b => b.type === 'recette'),
      depensesList: budgets.filter(b => b.type === 'depense'),
      byCurrency: Array.from(summaryByCurrency.entries()).map(([currency, data]) => ({
        currency,
        recettes: data.recettes,
        depenses: data.depenses,
        solde: data.recettes - data.depenses,
        lines: data.lines
      })),
      totalUSD: {
        recettes: totalRecettesUSD,
        depenses: totalDepensesUSD,
        solde: totalSoldeUSD
      }
    }
  } catch (error) {
    console.error('Erreur getBudgetSummaryDistrict:', error)
    return {
      recettes: 0,
      depenses: 0,
      solde: 0,
      totalLines: 0,
      recettesList: [],
      depensesList: [],
      byCurrency: [],
      totalUSD: { recettes: 0, depenses: 0, solde: 0 }
    }
  }
}

/**
 * Récupère le résumé du budget pour un plan d'action
 */
export async function getPlanBudgetSummaryDistrict(planActionId: number) {
  try {
    const budgets = await getBudgetsByPlanActionDistrict(planActionId)

    const recettes = budgets
      .filter(b => b.type === 'recette')
      .reduce((sum, b) => sum + (b.montant || 0), 0)

    const depenses = budgets
      .filter(b => b.type === 'depense')
      .reduce((sum, b) => sum + (b.montant || 0), 0)

    const solde = recettes - depenses

    // Grouper par devise
    const byCurrency = new Map<Currency, { recettes: number; depenses: number }>()
    budgets.forEach(b => {
      if (!byCurrency.has(b.currency)) {
        byCurrency.set(b.currency, { recettes: 0, depenses: 0 })
      }
      const data = byCurrency.get(b.currency)!
      if (b.type === 'recette') {
        data.recettes += b.montant
      } else {
        data.depenses += b.montant
      }
    })

    return {
      recettes,
      depenses,
      solde,
      totalLines: budgets.length,
      recettesList: budgets.filter(b => b.type === 'recette'),
      depensesList: budgets.filter(b => b.type === 'depense'),
      byCurrency: Array.from(byCurrency.entries()).map(([currency, data]) => ({
        currency,
        recettes: data.recettes,
        depenses: data.depenses,
        solde: data.recettes - data.depenses
      }))
    }
  } catch (error) {
    console.error('Erreur getPlanBudgetSummaryDistrict:', error)
    return {
      recettes: 0,
      depenses: 0,
      solde: 0,
      totalLines: 0,
      recettesList: [],
      depensesList: [],
      byCurrency: []
    }
  }
}

/**
 * Crée une ligne budgétaire
 */
export async function createBudgetDistrict(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const unite_id = parseInt(formData.get('unite_id') as string)
    const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
    const type = formData.get('type') as string
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as Currency

    if (!unite_id || isNaN(unite_id)) {
      return { error: 'Unité invalide' }
    }

    if (!annee_conference_id || isNaN(annee_conference_id)) {
      return { error: 'Année de conférence invalide' }
    }

    if (type !== 'recette' && type !== 'depense') {
      return { error: 'Type invalide' }
    }

    if (!libelle || libelle.trim() === '') {
      return { error: 'Le libellé est requis' }
    }

    if (!montant || isNaN(montant) || montant <= 0) {
      return { error: 'Le montant doit être supérieur à 0' }
    }

    if (!currency || !['USD', 'CDF', 'EUR'].includes(currency)) {
      return { error: 'Devise invalide' }
    }

    // Vérifier que l'unité appartient au district du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { error: 'Vous n\'êtes pas autorisé' }
    }

    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id_niveau, reference_id')
      .eq('id', unite_id)
      .eq('reference_table', 'departement')
      .eq('reference_id', chef.departement_id)
      .eq('niveau', 'district')
      .single()

    if (uniteError || !unite || unite.id_niveau !== chef.district_id) {
      return { error: 'Unité non trouvée' }
    }

    // Vérifier le plan d'action si fourni
    if (plan_action_id) {
      const { data: plan } = await supabase
        .from('plan_action')
        .select('id, unite_id, annee_conference_id')
        .eq('id', plan_action_id)
        .single()

      if (!plan) {
        return { error: 'Plan d\'action non trouvé' }
      }

      if (plan.unite_id !== unite_id) {
        return { error: 'Le plan d\'action n\'appartient pas à cette unité' }
      }

      if (plan.annee_conference_id !== annee_conference_id) {
        return { error: 'L\'année du plan d\'action ne correspond pas à l\'année sélectionnée' }
      }
    }

    // Créer la ligne budgétaire
    const { data: budget, error } = await supabase
      .from('budget')
      .insert([{
        unite_id,
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

    if (error) {
      console.error('Erreur création budget:', error)
      return { error: 'Erreur lors de la création' }
    }

    revalidatePath('/district/budget')
    if (plan_action_id) {
      revalidatePath(`/district/plans-action/${plan_action_id}`)
    }

    return { success: true, budget }
  } catch (error) {
    console.error('Erreur inattendue createBudgetDistrict:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Met à jour une ligne budgétaire
 */
export async function updateBudgetDistrict(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as Currency

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    if (!libelle || libelle.trim() === '') {
      return { error: 'Le libellé est requis' }
    }

    if (!montant || isNaN(montant) || montant <= 0) {
      return { error: 'Le montant doit être supérieur à 0' }
    }

    if (currency && !['USD', 'CDF', 'EUR'].includes(currency)) {
      return { error: 'Devise invalide' }
    }

    // Vérifier les droits
    const { data: budget, error: fetchError } = await supabase
      .from('budget')
      .select('*, unite:unite_id(*)')
      .eq('id', id)
      .single()

    if (fetchError || !budget) {
      return { error: 'Budget non trouvé' }
    }

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { error: 'Vous n\'êtes pas autorisé' }
    }

    const unite = Array.isArray(budget.unite) ? budget.unite[0] : budget.unite
    if (!unite || unite.id_niveau !== chef.district_id) {
      return { error: 'Vous ne pouvez modifier ce budget' }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      libelle: libelle.trim(),
      montant,
      updated_at: new Date().toISOString()
    }
    
    if (currency) {
      updateData.currency = currency
    }

    // Mise à jour
    const { error } = await supabase
      .from('budget')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erreur updateBudgetDistrict:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath('/district/budget')
    if (budget.plan_action_id) {
      revalidatePath(`/district/plans-action/${budget.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateBudgetDistrict:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime une ligne budgétaire
 */
export async function deleteBudgetDistrict(id: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: budget, error: fetchError } = await supabase
      .from('budget')
      .select('*, unite:unite_id(*)')
      .eq('id', id)
      .single()

    if (fetchError || !budget) {
      return { error: 'Budget non trouvé' }
    }

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { error: 'Vous n\'êtes pas autorisé' }
    }

    const unite = Array.isArray(budget.unite) ? budget.unite[0] : budget.unite
    if (!unite || unite.id_niveau !== chef.district_id) {
      return { error: 'Vous ne pouvez supprimer ce budget' }
    }

    const { error } = await supabase
      .from('budget')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deleteBudgetDistrict:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath('/district/budget')
    if (budget.plan_action_id) {
      revalidatePath(`/district/plans-action/${budget.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteBudgetDistrict:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function getBudgetSummaryByUniteAndAnnee(uniteId: number, anneeConferenceId: number) {
  try {
    console.log('getBudgetSummaryByUniteAndAnnee - uniteId:', uniteId, 'anneeConferenceId:', anneeConferenceId)
    
    const { data: budgets, error } = await supabase
      .from('budget')
      .select('type, montant')
      .eq('unite_id', uniteId)
      .eq('annee_conference_id', anneeConferenceId)

    if (error) {
      console.error('Erreur getBudgetSummaryByUniteAndAnnee:', error)
      return { recettes: 0, depenses: 0, solde: 0, totalLines: 0 }
    }

    const recettes = budgets?.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
    const depenses = budgets?.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
    const totalLines = budgets?.length || 0

    const summary = {
      recettes,
      depenses,
      solde: recettes - depenses,
      totalLines
    }

    console.log('Budget summary calculé:', summary)

    return summary
  } catch (error) {
    console.error('Erreur getBudgetSummaryByUniteAndAnnee:', error)
    return { recettes: 0, depenses: 0, solde: 0, totalLines: 0 }
  }
}