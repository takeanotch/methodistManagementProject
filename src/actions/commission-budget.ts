// actions/commission-budget.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

export interface CommissionBudgetLine {
  id: number
  commission_id: number
  plan_action_id: number | null
  annee_conference_id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: 'USD' | 'CDF' | 'EUR'
  created_at: string
  updated_at: string
}

// Récupérer les lignes budgétaires d'une commission
export async function getBudgetsByCommission(
  commissionId: number,
  anneeConferenceId?: number,
  type?: 'recette' | 'depense'
): Promise<CommissionBudgetLine[]> {
  try {
    console.log('🔍 getBudgetsByCommission:', { commissionId, anneeConferenceId })
    
    let query = supabase
      .from('commission_budget')
      .select('*')
      .eq('commission_id', commissionId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }
    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur getBudgetsByCommission:', error)
      return []
    }

    console.log(`✅ ${data?.length || 0} lignes budgétaires trouvées`)
    return data || []
  } catch (error) {
    console.error('❌ Erreur getBudgetsByCommission:', error)
    return []
  }
}

// Récupérer les lignes budgétaires d'un plan d'action
export async function getBudgetsByCommissionPlanAction(planActionId: number): Promise<CommissionBudgetLine[]> {
  try {
    const { data, error } = await supabase
      .from('commission_budget')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur getBudgetsByCommissionPlanAction:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Erreur getBudgetsByCommissionPlanAction:', error)
    return []
  }
}

// Récupérer le résumé du budget d'une commission
export async function getCommissionBudgetSummary(commissionId: number, anneeConferenceId?: number) {
  try {
    const budgets = await getBudgetsByCommission(commissionId, anneeConferenceId)

    if (!budgets || budgets.length === 0) {
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

    // Grouper par devise
    const summaryByCurrency = new Map<string, { recettes: number; depenses: number; lines: CommissionBudgetLine[] }>()
    
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

    const totalRecettes = budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + b.montant, 0)
    const totalDepenses = budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + b.montant, 0)
    
    // Conversion en USD pour le total général
    let totalRecettesUSD = 0
    let totalDepensesUSD = 0
    
    budgets.forEach(budget => {
      let amountUSD = budget.montant
      if (budget.currency === 'CDF') {
        amountUSD = budget.montant / 2500
      } else if (budget.currency === 'EUR') {
        amountUSD = budget.montant * 1.08
      }
      
      if (budget.type === 'recette') {
        totalRecettesUSD += amountUSD
      } else {
        totalDepensesUSD += amountUSD
      }
    })

    return {
      recettes: totalRecettes,
      depenses: totalDepenses,
      solde: totalRecettes - totalDepenses,
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
        solde: totalRecettesUSD - totalDepensesUSD
      }
    }
  } catch (error) {
    console.error('❌ Erreur getCommissionBudgetSummary:', error)
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

// Récupérer le résumé du budget pour un plan d'action
export async function getCommissionPlanBudgetSummary(planActionId: number) {
  try {
    const budgets = await getBudgetsByCommissionPlanAction(planActionId)

    const recettes = budgets
      .filter(b => b.type === 'recette')
      .reduce((sum, b) => sum + (b.montant || 0), 0)

    const depenses = budgets
      .filter(b => b.type === 'depense')
      .reduce((sum, b) => sum + (b.montant || 0), 0)

    return {
      recettes,
      depenses,
      solde: recettes - depenses,
      totalLines: budgets.length,
      recettesList: budgets.filter(b => b.type === 'recette'),
      depensesList: budgets.filter(b => b.type === 'depense')
    }
  } catch (error) {
    console.error('❌ Erreur getCommissionPlanBudgetSummary:', error)
    return {
      recettes: 0,
      depenses: 0,
      solde: 0,
      totalLines: 0,
      recettesList: [],
      depensesList: []
    }
  }
}

// Créer une ligne budgétaire
export async function createCommissionBudget(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const commission_id = parseInt(formData.get('commission_id') as string)
    const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
    const type = formData.get('type') as string
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as string

    if (!commission_id || isNaN(commission_id)) {
      return { error: 'Commission invalide' }
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

    // Vérifier les droits
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele) {
      return { error: 'Fidèle non trouvé' }
    }

    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commission_id)
      .single()

    if (!commission || commission.paroisse_id !== fidele.paroisse_id) {
      return { error: 'Vous ne pouvez créer un budget que pour votre commission' }
    }

    // Vérifier le plan d'action si fourni
    if (plan_action_id) {
      const { data: plan } = await supabase
        .from('commission_plan_action')
        .select('id, commission_id, annee_conference_id')
        .eq('id', plan_action_id)
        .single()

      if (!plan) {
        return { error: 'Plan d\'action non trouvé' }
      }

      if (plan.commission_id !== commission_id) {
        return { error: 'Le plan d\'action n\'appartient pas à cette commission' }
      }

      if (plan.annee_conference_id !== annee_conference_id) {
        return { error: 'L\'année du plan d\'action ne correspond pas' }
      }
    }

    // Créer la ligne budgétaire
    const { data, error } = await supabase
      .from('commission_budget')
      .insert([{
        commission_id,
        plan_action_id,
        annee_conference_id,
        type,
        libelle: libelle.trim(),
        montant,
        currency
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur createCommissionBudget:', error)
      return { error: 'Erreur lors de la création' }
    }

    revalidatePath(`/paroisse/commissions/${commission_id}`)
    revalidatePath(`/paroisse/commissions/${commission_id}/budget`)
    if (plan_action_id) {
      revalidatePath(`/paroisse/commissions/${commission_id}/plans-action/${plan_action_id}`)
    }

    return { success: true, budget: data }
  } catch (error) {
    console.error('❌ Erreur createCommissionBudget:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Mettre à jour une ligne budgétaire
export async function updateCommissionBudget(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as string

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
      .from('commission_budget')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (fetchError || !budget) {
      return { error: 'Budget non trouvé' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', budget.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez modifier ce budget' }
      }
    }

    const updateData: any = {
      libelle: libelle.trim(),
      montant,
      updated_at: new Date().toISOString()
    }
    
    if (currency) {
      updateData.currency = currency
    }

    const { error } = await supabase
      .from('commission_budget')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur updateCommissionBudget:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/paroisse/commissions/${budget.commission_id}`)
    revalidatePath(`/paroisse/commissions/${budget.commission_id}/budget`)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur updateCommissionBudget:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Supprimer une ligne budgétaire
export async function deleteCommissionBudget(id: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: budget, error: fetchError } = await supabase
      .from('commission_budget')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (fetchError || !budget) {
      return { error: 'Budget non trouvé' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', budget.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez supprimer ce budget' }
      }
    }

    const { error } = await supabase
      .from('commission_budget')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur deleteCommissionBudget:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${budget.commission_id}`)
    revalidatePath(`/paroisse/commissions/${budget.commission_id}/budget`)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur deleteCommissionBudget:', error)
    return { error: 'Une erreur est survenue' }
  }
}