// actions/budget-commission.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'
import { getCommissionUnite, ensureCommissionUniteExists } from './unite-organisation'
import { type Currency, CURRENCIES } from '@/lib/currency'

export interface BudgetLineCommission {
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
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

async function getConferenceFromParoisse(paroisseId: number): Promise<number | null> {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (paroisse?.district) {
      const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
      if (district?.conference) {
        const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
        return conference?.id || null
      }
    }
    return null
  } catch (error) {
    console.error('Erreur getConferenceFromParoisse:', error)
    return null
  }
}

async function getUserParoisseId(userId: string): Promise<number | null> {
  try {
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', userId)
      .single()
    return fidele?.paroisse_id || null
  } catch (error) {
    console.error('Erreur getUserParoisseId:', error)
    return null
  }
}

async function userHasAccessToCommission(
  userId: string,
  commissionId: number
): Promise<{ hasAccess: boolean; paroisseId: number | null; error?: string }> {
  try {
    const userParoisseId = await getUserParoisseId(userId)
    if (!userParoisseId) {
      return { hasAccess: false, paroisseId: null, error: 'Utilisateur sans paroisse' }
    }

    const { data: commission, error } = await supabase
      .from('commission')
      .select('paroisse_id, departement_id')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      return { hasAccess: false, paroisseId: null, error: 'Commission non trouvée' }
    }

    if (commission.paroisse_id !== userParoisseId) {
      return { hasAccess: false, paroisseId: null, error: 'Accès non autorisé à cette commission' }
    }

    return { hasAccess: true, paroisseId: userParoisseId }
  } catch (error) {
    console.error('Erreur userHasAccessToCommission:', error)
    return { hasAccess: false, paroisseId: null, error: 'Erreur de vérification des droits' }
  }
}

async function getOrCreateCommissionUnite(
  commissionId: number,
  paroisseId: number
): Promise<{ id: number } | null> {
  try {
    let unite = await getCommissionUnite(commissionId, paroisseId)
    
    if (unite) {
      return unite
    }

    const { data: commission, error } = await supabase
      .from('commission')
      .select('departement_id, nom')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      console.error('Commission non trouvée:', error)
      return null
    }

    const result = await ensureCommissionUniteExists(
      commissionId,
      commission.departement_id,
      paroisseId
    )

    if (!result.success || !result.unite) {
      console.error('Impossible de créer l\'unité de la commission:', result.error)
      return null
    }

    return result.unite
  } catch (error) {
    console.error('Erreur getOrCreateCommissionUnite:', error)
    return null
  }
}

// ============================================
// RÉCUPÉRATION DES DONNÉES
// ============================================

export async function getAnneesConferenceForCommissionBudget(commissionId: number) {
  try {
    const { data: commission, error } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      return []
    }

    const conferenceId = await getConferenceFromParoisse(commission.paroisse_id)
    if (!conferenceId) {
      return []
    }

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error('Erreur getAnneesConferenceForCommissionBudget:', error)
    return []
  }
}

export async function getBudgetsByCommission(
  commissionId: number,
  anneeConferenceId?: number,
  type?: 'recette' | 'depense',
  planActionId?: number
): Promise<BudgetLineCommission[]> {
  try {
    console.log('🔍 getBudgetsByCommission - Début', { commissionId, anneeConferenceId, type })

    const { data: commission, error: commError } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (commError || !commission) {
      console.error('❌ Commission non trouvée:', commError)
      return []
    }

    const unite = await getOrCreateCommissionUnite(commissionId, commission.paroisse_id)
    
    if (!unite) {
      console.error('❌ Impossible de récupérer l\'unité de la commission')
      return []
    }

    let query = supabase
      .from('budget')
      .select('*')
      .eq('unite_id', unite.id)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (planActionId) {
      query = query.eq('plan_action_id', planActionId)
    }

    const { data: budgets, error } = await query
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur getBudgetsByCommission:', error)
      return []
    }

    console.log(`✅ ${budgets?.length || 0} lignes budgétaires trouvées`)
    return (budgets || []) as BudgetLineCommission[]
  } catch (error) {
    console.error('❌ Erreur inattendue getBudgetsByCommission:', error)
    return []
  }
}

export async function getBudgetSummaryForCommission(
  commissionId: number,
  anneeConferenceId?: number,
  planActionId?: number
) {
  try {
    const budgets = await getBudgetsByCommission(commissionId, anneeConferenceId, undefined, planActionId)

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

    const summaryByCurrency = new Map<Currency, { recettes: number; depenses: number; lines: BudgetLineCommission[] }>()
    
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
    console.error('Erreur getBudgetSummaryForCommission:', error)
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

export async function getPlansActionForCommissionBudget(
  commissionId: number,
  anneeConferenceId?: number
) {
  try {
    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (!commission) {
      return []
    }

    const unite = await getCommissionUnite(commissionId, commission.paroisse_id)
    
    if (!unite) {
      return []
    }

    let query = supabase
      .from('plan_action')
      .select('id, titre, annee_conference_id')
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query
    
    if (error) {
      console.error('Erreur getPlansActionForCommissionBudget:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionForCommissionBudget:', error)
    return []
  }
}

// ============================================
// CRUD BUDGET
// ============================================

export async function createBudgetForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const commissionId = parseInt(formData.get('commission_id') as string)
    const plan_action_id = formData.get('plan_action_id') 
      ? parseInt(formData.get('plan_action_id') as string) 
      : null
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
    const type = formData.get('type') as string
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as Currency

    if (!commissionId || isNaN(commissionId)) {
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

    if (!currency || !(currency in CURRENCIES)) {
      return { error: 'Devise invalide' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getOrCreateCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Impossible de créer l\'unité d\'organisation pour cette commission' }
    }

    if (plan_action_id) {
      const { data: plan } = await supabase
        .from('plan_action')
        .select('id, unite_id')
        .eq('id', plan_action_id)
        .single()

      if (!plan) {
        return { error: 'Plan d\'action non trouvé' }
      }

      if (plan.unite_id !== unite.id) {
        return { error: 'Le plan d\'action n\'appartient pas à cette commission' }
      }
    }

    const { data, error } = await supabase
      .from('budget')
      .insert([{
        unite_id: unite.id,
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
      console.error('Erreur createBudgetForCommission:', error)
      return { error: 'Erreur lors de la création' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}/budget`)
    if (plan_action_id) {
      revalidatePath(`/paroisse/commissions/${commissionId}/plans-action/${plan_action_id}`)
    }

    return { success: true, budget: data }
  } catch (error) {
    console.error('Erreur inattendue createBudgetForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function updateBudgetForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const commissionId = parseInt(formData.get('commission_id') as string)
    const libelle = formData.get('libelle') as string
    const montant = parseFloat(formData.get('montant') as string)
    const currency = formData.get('currency') as Currency

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    if (!commissionId || isNaN(commissionId)) {
      return { error: 'Commission invalide' }
    }

    if (!libelle || libelle.trim() === '') {
      return { error: 'Le libellé est requis' }
    }

    if (!montant || isNaN(montant) || montant <= 0) {
      return { error: 'Le montant doit être supérieur à 0' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { data: budget, error: budgetError } = await supabase
      .from('budget')
      .select('id, plan_action_id')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (budgetError || !budget) {
      return { error: 'Budget non trouvé ou accès non autorisé' }
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
      .from('budget')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erreur updateBudgetForCommission:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}/budget`)
    if (budget.plan_action_id) {
      revalidatePath(`/paroisse/commissions/${commissionId}/plans-action/${budget.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateBudgetForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function deleteBudgetForCommission(id: number, commissionId: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { data: budget, error: budgetError } = await supabase
      .from('budget')
      .select('id, plan_action_id')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (budgetError || !budget) {
      return { error: 'Budget non trouvé ou accès non autorisé' }
    }

    const { error } = await supabase
      .from('budget')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deleteBudgetForCommission:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}/budget`)
    if (budget.plan_action_id) {
      revalidatePath(`/paroisse/commissions/${commissionId}/plans-action/${budget.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteBudgetForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}


// Ajouter cette fonction à la fin du fichier actions/budget-commission.ts

/**
 * Récupérer les totaux réalisés (mouvements) pour une commission et une année
 */
export async function getRealiseTotalsForCommission(
  commissionId: number,
  anneeConferenceId: number
): Promise<{
  recettes: number
  depenses: number
  recettesParDevise: { USD: number; CDF: number; EUR: number }
  depensesParDevise: { USD: number; CDF: number; EUR: number }
}> {
  try {
    // Récupérer la commission pour avoir la paroisse
    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (!commission) {
      return { 
        recettes: 0, 
        depenses: 0,
        recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
        depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
      }
    }

    // Récupérer l'unité de la commission
    const unite = await getCommissionUnite(commissionId, commission.paroisse_id)
    if (!unite) {
      return { 
        recettes: 0, 
        depenses: 0,
        recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
        depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
      }
    }

    // Récupérer la configuration pour le taux
    const { data: config } = await supabase
      .from('configuration')
      .select('taux')
      .eq('unite_id', unite.id)
      .maybeSingle()
    
    const tauxConfig = config?.taux || 2800
    
    // Récupérer tous les budgets de la commission pour cette année
    const { data: budgets, error: budgetsError } = await supabase
      .from('budget')
      .select('id, type')
      .eq('unite_id', unite.id)
      .eq('annee_conference_id', anneeConferenceId)

    if (budgetsError || !budgets || budgets.length === 0) {
      return { 
        recettes: 0, 
        depenses: 0,
        recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
        depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
      }
    }

    const budgetIds = budgets.map(b => b.id)
    const recetteIds = budgets.filter(b => b.type === 'recette').map(b => b.id)
    const depenseIds = budgets.filter(b => b.type === 'depense').map(b => b.id)

    // Récupérer tous les mouvements pour ces budgets
    const { data: mouvements, error: mouvementsError } = await supabase
      .from('mouvement_finance')
      .select(`
        montant,
        currency,
        budget_id
      `)
      .in('budget_id', budgetIds)

    if (mouvementsError || !mouvements) {
      return { 
        recettes: 0, 
        depenses: 0,
        recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
        depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
      }
    }

    let totalRecettesCDF = 0
    let totalDepensesCDF = 0
    
    // Par devise (montants bruts, sans conversion)
    const recettesParDevise = { USD: 0, CDF: 0, EUR: 0 }
    const depensesParDevise = { USD: 0, CDF: 0, EUR: 0 }

    mouvements.forEach(m => {
      // Ajouter au total par devise (montant brut)
      if (recetteIds.includes(m.budget_id)) {
        if (m.currency === 'USD') recettesParDevise.USD += m.montant
        else if (m.currency === 'CDF') recettesParDevise.CDF += m.montant
        else if (m.currency === 'EUR') recettesParDevise.EUR += m.montant
      } else if (depenseIds.includes(m.budget_id)) {
        if (m.currency === 'USD') depensesParDevise.USD += m.montant
        else if (m.currency === 'CDF') depensesParDevise.CDF += m.montant
        else if (m.currency === 'EUR') depensesParDevise.EUR += m.montant
      }
      
      // Convertir en CDF pour le total consolidé
      let montantCDF = m.montant
      if (m.currency === 'USD') {
        montantCDF = m.montant * tauxConfig
      } else if (m.currency === 'EUR') {
        montantCDF = m.montant * 1.08 * tauxConfig
      }
      
      if (recetteIds.includes(m.budget_id)) {
        totalRecettesCDF += montantCDF
      } else if (depenseIds.includes(m.budget_id)) {
        totalDepensesCDF += montantCDF
      }
    })

    return {
      recettes: totalRecettesCDF,
      depenses: totalDepensesCDF,
      recettesParDevise,
      depensesParDevise
    }
  } catch (error) {
    console.error('Erreur getRealiseTotalsForCommission:', error)
    return { 
      recettes: 0, 
      depenses: 0,
      recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
      depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
    }
  }
}