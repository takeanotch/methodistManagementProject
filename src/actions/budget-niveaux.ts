
// actions/budget-niveaux.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'
import { type Currency, CURRENCIES } from '@/lib/currency'

// ============================================================
// TYPES
// ============================================================

export interface BudgetLine {
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
    id_niveau: number
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

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

/**
 * Récupère l'unité complète par son ID
 */
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

/**
 * Récupère la conférence à partir d'un ID de district
 */
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

// ============================================================
// ANNÉES ET PLANS D'ACTION
// ============================================================

/**
 * Récupère toutes les années de conférence disponibles pour une unité
 */
export async function getAnneesConferenceForUniteBudgetNiveau(
  uniteId: number,
  niveau: 'district' | 'conference'
): Promise<any[]> {
  try {
    const unite = await getUniteComplete(uniteId)
    if (!unite) return []

    let conferenceId: number | null = null
    
    if (niveau === 'district') {
      conferenceId = await getConferenceFromDistrict(unite.id_niveau)
    } else {
      conferenceId = unite.id_niveau
    }
    
    if (!conferenceId) return []

    const annees = await getAnneesConferenceByConference(conferenceId)
    
    // Formater les données pour correspondre à la structure attendue
    return (annees || []).map((a: any) => ({
      ...a,
      label: a.annee?.label || `Année ${a.annee_id}`
    }))
  } catch (error) {
    console.error(`Erreur getAnneesConferenceForUniteBudgetNiveau (${niveau}):`, error)
    return []
  }
}

/**
 * Récupère les plans d'action disponibles pour une unité
 */
export async function getPlansActionForBudgetNiveau(
  uniteId: number,
  anneeConferenceId?: number
): Promise<any[]> {
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
    console.error('Erreur getPlansActionForBudgetNiveau:', error)
    return []
  }
}

// ============================================================
// CRUD BUDGET
// ============================================================

/**
 * Récupérer les lignes budgétaires par unité
 */
export async function getBudgetsByUniteNiveau(
  uniteId: number,
  anneeConferenceId?: number,
  type?: 'recette' | 'depense',
  currency?: Currency
): Promise<BudgetLine[]> {
  try {
    console.log('🔍 getBudgetsByUniteNiveau - Début', { uniteId, anneeConferenceId })
    
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
      console.error('❌ Erreur getBudgetsByUniteNiveau:', error)
      return []
    }

    if (!budgets || budgets.length === 0) {
      console.log('📋 Aucun budget trouvé')
      return []
    }

    console.log(`✅ ${budgets.length} lignes budgétaires trouvées`)
    return budgets as BudgetLine[]
    
  } catch (error) {
    console.error('❌ Erreur inattendue getBudgetsByUniteNiveau:', error)
    return []
  }
}

/**
 * Récupérer les lignes budgétaires d'un plan d'action
 */
export async function getBudgetsByPlanActionNiveau(planActionId: number): Promise<BudgetLine[]> {
  try {
    const { data: planExists, error: planError } = await supabase
      .from('plan_action')
      .select('id')
      .eq('id', planActionId)
      .single()
    
    if (planError || !planExists) {
      console.error('Plan action not found:', planActionId)
      return []
    }

    const { data: budgets, error } = await supabase
      .from('budget')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getBudgetsByPlanActionNiveau:', error)
      return []
    }

    if (!budgets || budgets.length === 0) {
      return []
    }

    return budgets as BudgetLine[]
    
  } catch (error) {
    console.error('Erreur getBudgetsByPlanActionNiveau:', error)
    return []
  }
}

/**
 * Récupérer le résumé du budget pour une unité
 */
export async function getUniteBudgetSummaryNiveau(
  uniteId: number, 
  anneeConferenceId?: number
): Promise<any> {
  try {
    console.log('🔍 getUniteBudgetSummaryNiveau - Début', { uniteId, anneeConferenceId })
    
    // Récupérer la configuration pour le taux
    const { data: config } = await supabase
      .from('configuration')
      .select('taux')
      .eq('unite_id', uniteId)
      .maybeSingle()
    
    const tauxConfig = config?.taux || 2800
    
    const budgets = await getBudgetsByUniteNiveau(uniteId, anneeConferenceId)

    if (!budgets || budgets.length === 0) {
      return {
        totalLines: 0,
        recettesList: [],
        depensesList: [],
        devisePrincipale: 'CDF',
        totalCDF: { recettes: 0, depenses: 0 }
      }
    }

    // Déterminer la devise principale (celle du premier budget trouvé)
    const devisePrincipale = budgets[0]?.currency || 'CDF'

    // Calculer les totaux dans la devise principale
    let totalRecettesDevise = 0
    let totalDepensesDevise = 0
    
    // Totaux en CDF pour consolidation
    let totalRecettesCDF = 0
    let totalDepensesCDF = 0
    
    budgets.forEach(budget => {
      // Dans la devise principale
      if (budget.type === 'recette') {
        totalRecettesDevise += budget.montant
      } else {
        totalDepensesDevise += budget.montant
      }
      
      // Conversion en CDF
      let montantCDF = budget.montant
      if (budget.currency === 'USD') {
        montantCDF = budget.montant * tauxConfig
      } else if (budget.currency === 'EUR') {
        montantCDF = budget.montant * 1.08 * tauxConfig
      }
      
      if (budget.type === 'recette') {
        totalRecettesCDF += montantCDF
      } else {
        totalDepensesCDF += montantCDF
      }
    })

    return {
      totalLines: budgets.length,
      recettesList: budgets.filter(b => b.type === 'recette'),
      depensesList: budgets.filter(b => b.type === 'depense'),
      devisePrincipale,
      totauxDevise: {
        recettes: totalRecettesDevise,
        depenses: totalDepensesDevise
      },
      totalCDF: {
        recettes: totalRecettesCDF,
        depenses: totalDepensesCDF
      }
    }
  } catch (error) {
    console.error('❌ Erreur getUniteBudgetSummaryNiveau:', error)
    return {
      totalLines: 0,
      recettesList: [],
      depensesList: [],
      devisePrincipale: 'CDF',
      totauxDevise: { recettes: 0, depenses: 0 },
      totalCDF: { recettes: 0, depenses: 0 }
    }
  }
}

/**
 * Récupérer le résumé du budget pour un plan d'action
 */
export async function getPlanBudgetSummaryNiveau(planActionId: number) {
  try {
    const budgets = await getBudgetsByPlanActionNiveau(planActionId)

    const recettes = budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0)
    const depenses = budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0)

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
      solde: recettes - depenses,
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
    console.error('Erreur getPlanBudgetSummaryNiveau:', error)
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
 * Créer une ligne budgétaire
 */
export async function createBudgetNiveau(
  formData: FormData,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; budget?: any; error?: string }> {
  try {
    const unite_id = formData.get('unite_id')
    const type = formData.get('type') as string
    const libelle = formData.get('libelle') as string
    const montant = formData.get('montant')
    const currency = formData.get('currency') as Currency
    const annee_conference_id = formData.get('annee_conference_id')
    const plan_action_id = formData.get('plan_action_id')

    console.log('➕ createBudgetNiveau - Données reçues:', { 
      unite_id, type, libelle, montant, currency, annee_conference_id, plan_action_id, niveau 
    })

    if (!unite_id) {
      return { success: false, error: 'ID de l\'unité manquant' }
    }

    const uniteId = parseInt(unite_id as string)
    if (isNaN(uniteId)) {
      return { success: false, error: 'ID d\'unité invalide' }
    }

    if (!annee_conference_id) {
      return { success: false, error: 'Année de conférence requise' }
    }

    const anneeId = parseInt(annee_conference_id as string)
    if (isNaN(anneeId)) {
      return { success: false, error: 'Année de conférence invalide' }
    }

    if (type !== 'recette' && type !== 'depense') {
      return { success: false, error: 'Type invalide' }
    }

    if (!libelle || libelle.trim() === '') {
      return { success: false, error: 'Le libellé est requis' }
    }

    if (!montant) {
      return { success: false, error: 'Le montant est requis' }
    }

    const montantNum = parseFloat(montant as string)
    if (isNaN(montantNum) || montantNum <= 0) {
      return { success: false, error: 'Le montant doit être supérieur à 0' }
    }

    if (!currency || !['USD', 'CDF', 'EUR'].includes(currency)) {
      return { success: false, error: 'Devise invalide' }
    }

    // Vérifier l'unité
    const unite = await getUniteComplete(uniteId)
    if (!unite) {
      return { success: false, error: 'Unité non trouvée' }
    }

    if (unite.niveau !== niveau) {
      return { success: false, error: `Cette unité n'est pas de niveau ${niveau}` }
    }

    const insertData: any = {
      unite_id: uniteId,
      type,
      libelle: libelle.trim(),
      montant: montantNum,
      currency,
      annee_conference_id: anneeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (plan_action_id && plan_action_id !== '') {
      const planId = parseInt(plan_action_id as string)
      if (!isNaN(planId)) {
        insertData.plan_action_id = planId
      }
    }

    console.log('📝 Données à insérer:', insertData)

    const { data, error } = await supabase
      .from('budget')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur createBudgetNiveau:', error)
      return { success: false, error: 'Erreur lors de la création' }
    }

    console.log('✅ Budget créé avec succès:', data)

    // Revalidation
    if (niveau === 'district') {
      revalidatePath('/district/budget')
      revalidatePath('/district')
    } else {
      revalidatePath('/conference/budget')
      revalidatePath('/conference')
    }
    
    if (plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${plan_action_id}`)
      }
    }
    
    return { success: true, budget: data }
  } catch (error) {
    console.error('❌ Erreur inattendue createBudgetNiveau:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Mettre à jour une ligne budgétaire
 */
export async function updateBudgetNiveau(
  formData: FormData,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; budget?: any; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const id = formData.get('id')
    const libelle = formData.get('libelle') as string
    const montant = formData.get('montant')
    const currency = formData.get('currency') as Currency

    console.log('📝 updateBudgetNiveau - Données reçues:', { id, libelle, montant, currency, niveau })

    if (!id) {
      return { success: false, error: 'ID du budget manquant' }
    }

    const budgetId = parseInt(id as string)
    if (isNaN(budgetId)) {
      return { success: false, error: 'ID invalide' }
    }

    if (!libelle || libelle.trim() === '') {
      return { success: false, error: 'Le libellé est requis' }
    }

    if (!montant) {
      return { success: false, error: 'Le montant est requis' }
    }

    const montantNum = parseFloat(montant as string)
    if (isNaN(montantNum) || montantNum <= 0) {
      return { success: false, error: 'Le montant doit être supérieur à 0' }
    }

    if (currency && !['USD', 'CDF', 'EUR'].includes(currency)) {
      return { success: false, error: 'Devise invalide' }
    }

    const { data: existingBudget, error: fetchError } = await supabase
      .from('budget')
      .select('id, unite_id, plan_action_id')
      .eq('id', budgetId)
      .single()

    if (fetchError || !existingBudget) {
      console.error('❌ Budget non trouvé:', { budgetId, error: fetchError })
      return { success: false, error: 'Budget non trouvé' }
    }

    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id, niveau, reference_id')
      .eq('id', existingBudget.unite_id)
      .single()

    if (uniteError || !unite) {
      console.error('❌ Unité non trouvée:', uniteError)
      return { success: false, error: 'Unité non trouvée' }
    }

    if (unite.niveau !== niveau) {
      return { success: false, error: 'Vous ne pouvez pas modifier ce budget' }
    }

    const updateData: any = {
      libelle: libelle.trim(),
      montant: montantNum,
      updated_at: new Date().toISOString()
    }
    
    if (currency) {
      updateData.currency = currency
    }

    console.log('📝 Données à mettre à jour:', updateData)

    const { data, error } = await supabase
      .from('budget')
      .update(updateData)
      .eq('id', budgetId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur updateBudgetNiveau:', error)
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }

    console.log('✅ Budget mis à jour avec succès:', data)

    if (niveau === 'district') {
      revalidatePath('/district/budget')
      revalidatePath('/district')
    } else {
      revalidatePath('/conference/budget')
      revalidatePath('/conference')
    }
    
    if (existingBudget.plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${existingBudget.plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${existingBudget.plan_action_id}`)
      }
    }
    
    return { success: true, budget: data }
  } catch (error) {
    console.error('❌ Erreur inattendue updateBudgetNiveau:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprimer une ligne budgétaire
 */
export async function deleteBudgetNiveau(
  id: number,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; error?: string }> {
  try {
    console.log('🗑️ deleteBudgetNiveau - ID reçu:', id, niveau)

    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    if (!id || isNaN(id)) {
      return { success: false, error: 'ID du budget invalide' }
    }

    const { data: existingBudget, error: fetchError } = await supabase
      .from('budget')
      .select('id, unite_id, plan_action_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingBudget) {
      console.error('❌ Budget non trouvé pour suppression:', { id, error: fetchError })
      return { success: false, error: 'Budget non trouvé' }
    }

    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id, niveau, reference_id')
      .eq('id', existingBudget.unite_id)
      .single()

    if (uniteError || !unite) {
      console.error('❌ Unité non trouvée:', uniteError)
      return { success: false, error: 'Unité non trouvée' }
    }

    if (unite.niveau !== niveau) {
      return { success: false, error: 'Vous ne pouvez pas supprimer ce budget' }
    }

    // Vérifier s'il y a des mouvements associés
    const { data: mouvements, error: mouvementsError } = await supabase
      .from('mouvement_finance')
      .select('id')
      .eq('budget_id', id)

    if (mouvementsError) {
      console.error('❌ Erreur vérification mouvements:', mouvementsError)
    }

    if (mouvements && mouvements.length > 0) {
      console.log(`🗑️ Suppression de ${mouvements.length} mouvements associés`)
      const { error: deleteMouvementsError } = await supabase
        .from('mouvement_finance')
        .delete()
        .eq('budget_id', id)

      if (deleteMouvementsError) {
        console.error('❌ Erreur suppression mouvements:', deleteMouvementsError)
        return { success: false, error: 'Erreur lors de la suppression des mouvements associés' }
      }
    }

    const { error } = await supabase
      .from('budget')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur deleteBudgetNiveau:', error)
      return { success: false, error: 'Erreur lors de la suppression' }
    }

    console.log('✅ Budget supprimé avec succès')

    if (niveau === 'district') {
      revalidatePath('/district/budget')
      revalidatePath('/district')
    } else {
      revalidatePath('/conference/budget')
      revalidatePath('/conference')
    }
    
    if (existingBudget.plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${existingBudget.plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${existingBudget.plan_action_id}`)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur inattendue deleteBudgetNiveau:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================
// TOTAUX RÉALISÉS
// ============================================================

/**
 * Récupérer les totaux réalisés (mouvements) pour une unité et une année
 */
export async function getRealiseTotalsNiveau(
  uniteId: number, 
  anneeConferenceId: number
): Promise<{
  recettes: number
  depenses: number
  recettesParDevise: { USD: number; CDF: number; EUR: number }
  depensesParDevise: { USD: number; CDF: number; EUR: number }
}> {
  try {
    // Récupérer la configuration pour le taux
    const { data: config } = await supabase
      .from('configuration')
      .select('taux')
      .eq('unite_id', uniteId)
      .maybeSingle()
    
    const tauxConfig = config?.taux || 2800
    
    // Récupérer tous les budgets de l'unité pour cette année
    const { data: budgets, error: budgetsError } = await supabase
      .from('budget')
      .select('id, type')
      .eq('unite_id', uniteId)
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
    console.error('Erreur getRealiseTotalsNiveau:', error)
    return { 
      recettes: 0, 
      depenses: 0,
      recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
      depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
    }
  }
}

// ============================================================
// EXPORTS POUR COMPATIBILITÉ
// ============================================================

// Alias pour le district
export async function getBudgetsByDistrict(anneeConferenceId?: number, type?: 'recette' | 'depense') {
  console.warn('getBudgetsByDistrict doit être appelé avec un uniteId valide')
  return []
}

export const getBudgetSummaryDistrict = getUniteBudgetSummaryNiveau
export const getRealiseTotalsDistrict = getRealiseTotalsNiveau

// Alias pour la conférence
export async function getBudgetsByConference(anneeConferenceId?: number, type?: 'recette' | 'depense') {
  console.warn('getBudgetsByConference doit être appelé avec un uniteId valide')
  return []
}

export const getBudgetSummaryConference = getUniteBudgetSummaryNiveau
export const getRealiseTotalsConference = getRealiseTotalsNiveau