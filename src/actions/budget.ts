


'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'
import { type Currency, CURRENCIES, EXCHANGE_RATES, convertToUSD, formatCurrency } from '@/lib/currency'

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

// Récupérer la paroisse d'un utilisateur
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

// Récupérer la conférence d'une paroisse
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

// Récupérer toutes les années de conférence disponibles pour une unité
export async function getAnneesConferenceForUniteBudget(uniteId: number) {
  try {
    const unite = await getUniteComplete(uniteId)
    if (!unite) return []

    const conferenceId = await getConferenceFromParoisse(unite.id_niveau)
    if (!conferenceId) return []

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error('Erreur getAnneesConferenceForUniteBudget:', error)
    return []
  }
}

// Récupérer les plans d'action disponibles pour une unité
export async function getPlansActionForBudget(uniteId: number, anneeConferenceId?: number) {
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
    console.error('Erreur getPlansActionForBudget:', error)
    return []
  }
}

// Récupérer les lignes budgétaires d'un plan d'action
export async function getBudgetsByPlanAction(planActionId: number): Promise<BudgetLine[]> {
  try {
    // First, verify the plan action exists
    const { data: planExists, error: planError } = await supabase
      .from('plan_action')
      .select('id')
      .eq('id', planActionId)
      .single()
    
    if (planError || !planExists) {
      console.error('Plan action not found:', planActionId)
      return []
    }

    // Build the query
    let query = supabase
      .from('budget')
      .select('*')
      .eq('plan_action_id', planActionId)

    const { data: budgets, error } = await query
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase query error in getBudgetsByPlanAction:', error)
      return []
    }

    if (!budgets || budgets.length === 0) {
      return []
    }

    // Fetch related data separately
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

    // Combine the data
    return budgets.map(budget => ({
      ...budget,
      unite: unitesMap.get(budget.unite_id) || null,
      plan_action: budget.plan_action_id ? (planActionsMap.get(budget.plan_action_id) || null) : null,
      annee_conference: anneesMap.get(budget.annee_conference_id) || null
    }))
    
  } catch (error) {
    console.error('Erreur getBudgetsByPlanAction:', error)
    return []
  }
}

// Récupérer le résumé du budget pour une unité


// Récupérer le résumé du budget pour un plan d'action
export async function getPlanBudgetSummary(planActionId: number) {
  try {
    const budgets = await getBudgetsByPlanAction(planActionId)

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
    console.error('Erreur getPlanBudgetSummary:', error)
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

// Créer une ligne budgétaire
// export async function createBudget(formData: FormData) {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) {
//       return { error: 'Vous devez être connecté' }
//     }

//     const unite_id = parseInt(formData.get('unite_id') as string)
//     const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
//     const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
//     const type = formData.get('type') as string
//     const libelle = formData.get('libelle') as string
//     const montant = parseFloat(formData.get('montant') as string)
//     const currency = formData.get('currency') as Currency

//     if (!unite_id || isNaN(unite_id)) {
//       return { error: 'Unité invalide' }
//     }

//     if (!annee_conference_id || isNaN(annee_conference_id)) {
//       return { error: 'Année de conférence invalide' }
//     }

//     if (type !== 'recette' && type !== 'depense') {
//       return { error: 'Type invalide' }
//     }

//     if (!libelle || libelle.trim() === '') {
//       return { error: 'Le libellé est requis' }
//     }

//     if (!montant || isNaN(montant) || montant <= 0) {
//       return { error: 'Le montant doit être supérieur à 0' }
//     }

//     if (!currency || !['USD', 'CDF', 'EUR'].includes(currency)) {
//       return { error: 'Devise invalide' }
//     }

//     // Vérifier l'unité et les droits
//     const unite = await getUniteComplete(unite_id)
//     if (!unite) {
//       return { error: 'Unité non trouvée' }
//     }

//     const userParoisseId = await getUserParoisseId(user.fidele_id)
//     if (!userParoisseId || unite.id_niveau !== userParoisseId) {
//       return { error: 'Vous ne pouvez créer un budget que pour votre paroisse' }
//     }

//     // Vérifier le plan d'action si fourni
//     if (plan_action_id) {
//       const { data: plan } = await supabase
//         .from('plan_action')
//         .select('id, unite_id, annee_conference_id')
//         .eq('id', plan_action_id)
//         .single()

//       if (!plan) {
//         return { error: 'Plan d\'action non trouvé' }
//       }

//       if (plan.unite_id !== unite_id) {
//         return { error: 'Le plan d\'action n\'appartient pas à cette unité' }
//       }

//       if (plan.annee_conference_id !== annee_conference_id) {
//         return { error: 'L\'année du plan d\'action ne correspond pas à l\'année sélectionnée' }
//       }
//     }

//     // Créer la ligne budgétaire
//     const { data, error } = await supabase
//       .from('budget')
//       .insert([{
//         unite_id,
//         plan_action_id,
//         annee_conference_id,
//         type,
//         libelle: libelle.trim(),
//         montant,
//         currency,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       }])
//       .select()
//       .single()

//     if (error) {
//       console.error('Erreur createBudget:', error)
//       return { error: 'Erreur lors de la création' }
//     }

//     // Revalidation
//     revalidatePath(`/paroisse/departements/${unite.reference_id}/budget`)
//     if (plan_action_id) {
//       revalidatePath(`/paroisse/departements/${unite.reference_id}/plans-action/${plan_action_id}`)
//     }

//     return { success: true, budget: data }
//   } catch (error) {
//     console.error('Erreur inattendue createBudget:', error)
//     return { error: 'Une erreur est survenue' }
//   }
// }




// actions/budget.ts - Fonction corrigée (sans relations)

/**
 * Récupérer les lignes budgétaires par unité - Version corrigée sans relations
 */
export async function getBudgetsByUnite(
  uniteId: number,
  anneeConferenceId?: number,
  type?: 'recette' | 'depense',
  currency?: Currency
): Promise<BudgetLine[]> {
  try {
    console.log('🔍 getBudgetsByUnite - Début', { uniteId, anneeConferenceId })
    
    // Requête simple sans relations
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
      console.error('❌ Erreur getBudgetsByUnite:', error)
      return []
    }

    if (!budgets || budgets.length === 0) {
      console.log('📋 Aucun budget trouvé')
      return []
    }

    console.log(`✅ ${budgets.length} lignes budgétaires trouvées`)
    
    // Retourner les données brutes
    return budgets as BudgetLine[]
    
  } catch (error) {
    console.error('❌ Erreur inattendue getBudgetsByUnite:', error)
    return []
  }
}

// actions/budget.ts - Fonction getUniteBudgetSummary corrigée

/**
 * Récupérer le résumé du budget pour une unité - Version corrigée
 */
// export async function getUniteBudgetSummary(uniteId: number, anneeConferenceId?: number) {
//   try {
//     console.log('🔍 getUniteBudgetSummary - Début', { uniteId, anneeConferenceId })
    
//     const budgets = await getBudgetsByUnite(uniteId, anneeConferenceId)

//     if (!budgets || budgets.length === 0) {
//       console.log('📋 Aucun budget trouvé pour cette unité')
//       return {
//         recettes: 0,
//         depenses: 0,
//         solde: 0,
//         totalLines: 0,
//         recettesList: [],
//         depensesList: [],
//         byCurrency: [],
//         totalUSD: { recettes: 0, depenses: 0, solde: 0 }
//       }
//     }

//     // Grouper par devise
//     const summaryByCurrency = new Map<Currency, { recettes: number; depenses: number; lines: BudgetLine[] }>()
    
//     budgets.forEach(budget => {
//       const currency = budget.currency
//       if (!summaryByCurrency.has(currency)) {
//         summaryByCurrency.set(currency, { recettes: 0, depenses: 0, lines: [] })
//       }
      
//       const summary = summaryByCurrency.get(currency)!
//       summary.lines.push(budget)
      
//       if (budget.type === 'recette') {
//         summary.recettes += budget.montant
//       } else {
//         summary.depenses += budget.montant
//       }
//     })

//     // Calculer les totaux
//     const totalRecettes = budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + b.montant, 0)
//     const totalDepenses = budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + b.montant, 0)
    
//     // Convertir en USD pour le total général (taux de change simplifiés)
//     let totalRecettesUSD = 0
//     let totalDepensesUSD = 0
    
//     budgets.forEach(budget => {
//       let amountUSD = budget.montant
//       if (budget.currency === 'CDF') {
//         amountUSD = budget.montant / 2500 // Taux approximatif
//       } else if (budget.currency === 'EUR') {
//         amountUSD = budget.montant * 1.08 // Taux approximatif
//       }
//       // USD reste USD
      
//       if (budget.type === 'recette') {
//         totalRecettesUSD += amountUSD
//       } else {
//         totalDepensesUSD += amountUSD
//       }
//     })

//     const totalSoldeUSD = totalRecettesUSD - totalDepensesUSD

//     const result = {
//       recettes: totalRecettes,
//       depenses: totalDepenses,
//       solde: totalRecettes - totalDepenses,
//       totalLines: budgets.length,
//       recettesList: budgets.filter(b => b.type === 'recette'),
//       depensesList: budgets.filter(b => b.type === 'depense'),
//       byCurrency: Array.from(summaryByCurrency.entries()).map(([currency, data]) => ({
//         currency,
//         recettes: data.recettes,
//         depenses: data.depenses,
//         solde: data.recettes - data.depenses,
//         lines: data.lines
//       })),
//       totalUSD: {
//         recettes: totalRecettesUSD,
//         depenses: totalDepensesUSD,
//         solde: totalSoldeUSD
//       }
//     }
    
//     console.log('✅ Budget summary calculé', { 
//       totalLines: result.totalLines, 
//       recettes: result.recettes, 
//       depenses: result.depenses 
//     })
    
//     return result
//   } catch (error) {
//     console.error('❌ Erreur getUniteBudgetSummary:', error)
//     return {
//       recettes: 0,
//       depenses: 0,
//       solde: 0,
//       totalLines: 0,
//       recettesList: [],
//       depensesList: [],
//       byCurrency: [],
//       totalUSD: { recettes: 0, depenses: 0, solde: 0 }
//     }
//   }
// }



// actions/budget.ts - Fonctions corrigées

// Mettre à jour une ligne budgétaire - VERSION CORRIGÉE
// export async function updateBudget(formData: FormData) {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) {
//       return { success: false, error: 'Vous devez être connecté' }
//     }

//     const id = formData.get('id')
//     const type = formData.get('type') as string
//     const libelle = formData.get('libelle') as string
//     const montant = formData.get('montant')
//     const currency = formData.get('currency') as Currency
//     const annee_conference_id = formData.get('annee_conference_id')
//     const plan_action_id = formData.get('plan_action_id')

//     console.log('📝 updateBudget - Données reçues:', { 
//       id, 
//       type, 
//       libelle, 
//       montant, 
//       currency, 
//       annee_conference_id,
//       plan_action_id 
//     })

//     if (!id) {
//       return { success: false, error: 'ID du budget manquant' }
//     }

//     const budgetId = parseInt(id as string)
//     if (isNaN(budgetId)) {
//       return { success: false, error: 'ID invalide' }
//     }

//     if (!libelle || libelle.trim() === '') {
//       return { success: false, error: 'Le libellé est requis' }
//     }

//     if (!montant) {
//       return { success: false, error: 'Le montant est requis' }
//     }

//     const montantNum = parseFloat(montant as string)
//     if (isNaN(montantNum) || montantNum <= 0) {
//       return { success: false, error: 'Le montant doit être supérieur à 0' }
//     }

//     if (currency && !['USD', 'CDF', 'EUR'].includes(currency)) {
//       return { success: false, error: 'Devise invalide' }
//     }

//     // Vérifier que le budget existe
//     const { data: existingBudget, error: fetchError } = await supabase
//       .from('budget')
//       .select('id, unite_id')
//       .eq('id', budgetId)
//       .single()

//     if (fetchError || !existingBudget) {
//       console.error('❌ Budget non trouvé:', fetchError)
//       return { success: false, error: 'Budget non trouvé' }
//     }

//     console.log('✅ Budget trouvé:', existingBudget)

//     // Préparer les données de mise à jour
//     const updateData: any = {
//       libelle: libelle.trim(),
//       montant: montantNum,
//       updated_at: new Date().toISOString()
//     }
    
//     // Ajouter les champs optionnels s'ils sont fournis
//     if (type && (type === 'recette' || type === 'depense')) {
//       updateData.type = type
//     }
    
//     if (currency) {
//       updateData.currency = currency
//     }
    
//     if (annee_conference_id) {
//       const anneeId = parseInt(annee_conference_id as string)
//       if (!isNaN(anneeId)) {
//         updateData.annee_conference_id = anneeId
//       }
//     }
    
//     if (plan_action_id && plan_action_id !== '') {
//       const planId = parseInt(plan_action_id as string)
//       if (!isNaN(planId)) {
//         updateData.plan_action_id = planId
//       }
//     } else if (plan_action_id === '') {
//       updateData.plan_action_id = null
//     }

//     console.log('📝 Données à mettre à jour:', updateData)

//     // Mise à jour
//     const { data, error } = await supabase
//       .from('budget')
//       .update(updateData)
//       .eq('id', budgetId)
//       .select()
//       .single()

//     if (error) {
//       console.error('❌ Erreur updateBudget:', error)
//       return { success: false, error: 'Erreur lors de la mise à jour' }
//     }

//     console.log('✅ Budget mis à jour avec succès:', data)

//     // Revalidation
//     revalidatePath('/paroisse/departements/[id]/budget', 'page')
    
//     return { success: true, budget: data }
//   } catch (error) {
//     console.error('❌ Erreur inattendue updateBudget:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

// Supprimer une ligne budgétaire - VERSION CORRIGÉE
// export async function deleteBudget(id: number) {
//   try {
//     console.log('🗑️ deleteBudget - ID reçu:', id)

//     if (!id || isNaN(id)) {
//       return { success: false, error: 'ID du budget invalide' }
//     }

//     // Vérifier que le budget existe
//     const { data: existingBudget, error: fetchError } = await supabase
//       .from('budget')
//       .select('id, unite_id, plan_action_id')
//       .eq('id', id)
//       .single()

//     if (fetchError || !existingBudget) {
//       console.error('❌ Budget non trouvé pour suppression:', fetchError)
//       return { success: false, error: 'Budget non trouvé' }
//     }

//     console.log('✅ Budget trouvé pour suppression:', existingBudget)

//     // Vérifier s'il y a des mouvements associés
//     const { data: mouvements, error: mouvementsError } = await supabase
//       .from('mouvement_finance')
//       .select('id')
//       .eq('budget_id', id)

//     if (mouvementsError) {
//       console.error('❌ Erreur vérification mouvements:', mouvementsError)
//     }

//     // Supprimer d'abord les mouvements s'il y en a
//     if (mouvements && mouvements.length > 0) {
//       console.log(`🗑️ Suppression de ${mouvements.length} mouvements associés`)
//       const { error: deleteMouvementsError } = await supabase
//         .from('mouvement_finance')
//         .delete()
//         .eq('budget_id', id)

//       if (deleteMouvementsError) {
//         console.error('❌ Erreur suppression mouvements:', deleteMouvementsError)
//         return { success: false, error: 'Erreur lors de la suppression des mouvements associés' }
//       }
//     }

//     // Supprimer le budget
//     const { error } = await supabase
//       .from('budget')
//       .delete()
//       .eq('id', id)

//     if (error) {
//       console.error('❌ Erreur deleteBudget:', error)
//       return { success: false, error: 'Erreur lors de la suppression' }
//     }

//     console.log('✅ Budget supprimé avec succès')

//     // Revalidation
//     revalidatePath('/paroisse/departements/[id]/budget', 'page')
    
//     return { success: true }
//   } catch (error) {
//     console.error('❌ Erreur inattendue deleteBudget:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

// Créer une ligne budgétaire - VERSION CORRIGÉE
export async function createBudget(formData: FormData) {
  try {
    const unite_id = formData.get('unite_id')
    const type = formData.get('type') as string
    const libelle = formData.get('libelle') as string
    const montant = formData.get('montant')
    const currency = formData.get('currency') as Currency
    const annee_conference_id = formData.get('annee_conference_id')
    const plan_action_id = formData.get('plan_action_id')

    console.log('➕ createBudget - Données reçues:', { 
      unite_id, 
      type, 
      libelle, 
      montant, 
      currency, 
      annee_conference_id,
      plan_action_id 
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

    // Préparer les données d'insertion
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

    // Créer la ligne budgétaire
    const { data, error } = await supabase
      .from('budget')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur createBudget:', error)
      return { success: false, error: 'Erreur lors de la création' }
    }

    console.log('✅ Budget créé avec succès:', data)

    // Revalidation
    revalidatePath('/paroisse/departements/[id]/budget', 'page')
    
    return { success: true, budget: data }
  } catch (error) {
    console.error('❌ Erreur inattendue createBudget:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}






























// actions/budget.ts - Remplacez updateBudget par cette version

export async function updateBudget(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const id = formData.get('id')
    const libelle = formData.get('libelle') as string
    const montant = formData.get('montant')
    const currency = formData.get('currency') as Currency

    console.log('📝 updateBudget - Données reçues:', { id, libelle, montant, currency })

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

    // Vérifier que le budget existe SANS jointure problématique
    const { data: existingBudget, error: fetchError } = await supabase
      .from('budget')
      .select('id, unite_id, plan_action_id')
      .eq('id', budgetId)
      .single()

    if (fetchError || !existingBudget) {
      console.error('❌ Budget non trouvé:', { budgetId, error: fetchError })
      return { success: false, error: 'Budget non trouvé' }
    }

    console.log('✅ Budget trouvé:', existingBudget)

    // Vérifier les droits en récupérant l'unité séparément
    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id, id_niveau, reference_id')
      .eq('id', existingBudget.unite_id)
      .single()

    if (uniteError || !unite) {
      console.error('❌ Unité non trouvée:', uniteError)
      return { success: false, error: 'Unité non trouvée' }
    }

    const userParoisseId = await getUserParoisseId(user.fidele_id)
    console.log('🔍 Vérification droits:', { userParoisseId, uniteNiveau: unite.id_niveau })

    if (!userParoisseId || unite.id_niveau !== userParoisseId) {
      return { success: false, error: 'Vous ne pouvez pas modifier ce budget' }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      libelle: libelle.trim(),
      montant: montantNum,
      updated_at: new Date().toISOString()
    }
    
    if (currency) {
      updateData.currency = currency
    }

    console.log('📝 Données à mettre à jour:', updateData)

    // Mise à jour
    const { data, error } = await supabase
      .from('budget')
      .update(updateData)
      .eq('id', budgetId)
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur updateBudget:', error)
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }

    console.log('✅ Budget mis à jour avec succès:', data)

    // Revalidation
    if (unite.reference_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/budget`)
    }
    if (existingBudget.plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/plans-action/${existingBudget.plan_action_id}`)
    }
    
    return { success: true, budget: data }
  } catch (error) {
    console.error('❌ Erreur inattendue updateBudget:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

export async function deleteBudget(id: number) {
  try {
    console.log('🗑️ deleteBudget - ID reçu:', id)

    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    if (!id || isNaN(id)) {
      return { success: false, error: 'ID du budget invalide' }
    }

    // Vérifier que le budget existe SANS jointure
    const { data: existingBudget, error: fetchError } = await supabase
      .from('budget')
      .select('id, unite_id, plan_action_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingBudget) {
      console.error('❌ Budget non trouvé pour suppression:', { id, error: fetchError })
      return { success: false, error: 'Budget non trouvé' }
    }

    console.log('✅ Budget trouvé pour suppression:', existingBudget)

    // Vérifier les droits
    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id, id_niveau, reference_id')
      .eq('id', existingBudget.unite_id)
      .single()

    if (uniteError || !unite) {
      console.error('❌ Unité non trouvée:', uniteError)
      return { success: false, error: 'Unité non trouvée' }
    }

    const userParoisseId = await getUserParoisseId(user.fidele_id)
    if (!userParoisseId || unite.id_niveau !== userParoisseId) {
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

    // Supprimer d'abord les mouvements s'il y en a
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

    // Supprimer le budget
    const { error } = await supabase
      .from('budget')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur deleteBudget:', error)
      return { success: false, error: 'Erreur lors de la suppression' }
    }

    console.log('✅ Budget supprimé avec succès')

    // Revalidation
    if (unite.reference_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/budget`)
    }
    if (existingBudget.plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/plans-action/${existingBudget.plan_action_id}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur inattendue deleteBudget:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


// actions/budget.ts - Remplacer getRealiseTotals par cette version

/**
 * Récupérer les totaux réalisés (mouvements) pour une unité et une année
 * Sépare les recettes et dépenses (indépendants)
 */
// export async function getRealiseTotals(uniteId: number, anneeConferenceId: number): Promise<{
//   recettes: number
//   depenses: number
// }> {
//   try {
//     // Récupérer tous les budgets de l'unité pour cette année
//     const { data: budgets, error: budgetsError } = await supabase
//       .from('budget')
//       .select('id, type')
//       .eq('unite_id', uniteId)
//       .eq('annee_conference_id', anneeConferenceId)

//     if (budgetsError || !budgets || budgets.length === 0) {
//       return { recettes: 0, depenses: 0 }
//     }

//     const budgetIds = budgets.map(b => b.id)
    
//     // Séparer les IDs par type pour faciliter
//     const recetteIds = budgets.filter(b => b.type === 'recette').map(b => b.id)
//     const depenseIds = budgets.filter(b => b.type === 'depense').map(b => b.id)

//     // Récupérer tous les mouvements pour ces budgets
//     const { data: mouvements, error: mouvementsError } = await supabase
//       .from('mouvement_finance')
//       .select(`
//         montant,
//         currency,
//         budget_id
//       `)
//       .in('budget_id', budgetIds)

//     if (mouvementsError || !mouvements) {
//       return { recettes: 0, depenses: 0 }
//     }

//     let totalRecettesCDF = 0
//     let totalDepensesCDF = 0

//     // Taux de conversion approximatifs (sera remplacé par la config dans le client)
//     const TAUX_USD_CDF = 2800
//     const TAUX_EUR_CDF = 3000

//     mouvements.forEach(m => {
//       // Convertir en CDF
//       let montantCDF = m.montant
//       if (m.currency === 'USD') {
//         montantCDF = m.montant * TAUX_USD_CDF
//       } else if (m.currency === 'EUR') {
//         montantCDF = m.montant * TAUX_EUR_CDF
//       }

//       // Ajouter au bon total selon le type du budget parent
//       if (recetteIds.includes(m.budget_id)) {
//         totalRecettesCDF += montantCDF
//       } else if (depenseIds.includes(m.budget_id)) {
//         totalDepensesCDF += montantCDF
//       }
//     })

//     return {
//       recettes: totalRecettesCDF,
//       depenses: totalDepensesCDF
//     }
//   } catch (error) {
//     console.error('Erreur getRealiseTotals:', error)
//     return { recettes: 0, depenses: 0 }
//   }
// }



// actions/budget.ts - Ajouter cette fonction corrigée

/**
 * Récupérer le résumé du budget pour une unité - VERSION CORRIGÉE
 * Utilise le taux de configuration et sépare correctement par devise
 */






// actions/budget.ts - Remplacer getRealiseTotals par cette version

/**
 * Récupérer les totaux réalisés (mouvements) pour une unité et une année
 * Utilise le taux de configuration
 */
// export async function getRealiseTotals(uniteId: number, anneeConferenceId: number): Promise<{
//   recettes: number
//   depenses: number
// }> {
//   try {
//     // Récupérer la configuration pour le taux
//     const { data: config } = await supabase
//       .from('configuration')
//       .select('taux')
//       .eq('unite_id', uniteId)
//       .maybeSingle()
    
//     const tauxConfig = config?.taux || 2800
    
//     // Récupérer tous les budgets de l'unité pour cette année
//     const { data: budgets, error: budgetsError } = await supabase
//       .from('budget')
//       .select('id, type')
//       .eq('unite_id', uniteId)
//       .eq('annee_conference_id', anneeConferenceId)

//     if (budgetsError || !budgets || budgets.length === 0) {
//       return { recettes: 0, depenses: 0 }
//     }

//     const budgetIds = budgets.map(b => b.id)
    
//     // Séparer les IDs par type
//     const recetteIds = budgets.filter(b => b.type === 'recette').map(b => b.id)
//     const depenseIds = budgets.filter(b => b.type === 'depense').map(b => b.id)

//     // Récupérer tous les mouvements pour ces budgets
//     const { data: mouvements, error: mouvementsError } = await supabase
//       .from('mouvement_finance')
//       .select(`
//         montant,
//         currency,
//         budget_id
//       `)
//       .in('budget_id', budgetIds)

//     if (mouvementsError || !mouvements) {
//       return { recettes: 0, depenses: 0 }
//     }

//     let totalRecettesCDF = 0
//     let totalDepensesCDF = 0

//     mouvements.forEach(m => {
//       // Convertir en CDF avec le taux de configuration
//       let montantCDF = m.montant
//       if (m.currency === 'USD') {
//         montantCDF = m.montant * tauxConfig
//       } else if (m.currency === 'EUR') {
//         // Approximation EUR -> USD -> CDF
//         montantCDF = m.montant * 1.08 * tauxConfig
//       }
//       // CDF reste CDF

//       // Ajouter au bon total selon le type du budget parent
//       if (recetteIds.includes(m.budget_id)) {
//         totalRecettesCDF += montantCDF
//       } else if (depenseIds.includes(m.budget_id)) {
//         totalDepensesCDF += montantCDF
//       }
//     })

//     return {
//       recettes: totalRecettesCDF,
//       depenses: totalDepensesCDF
//     }
//   } catch (error) {
//     console.error('Erreur getRealiseTotals:', error)
//     return { recettes: 0, depenses: 0 }
//   }
// }

// export async function getUniteBudgetSummary(uniteId: number, anneeConferenceId?: number) {
//   try {
//     console.log('🔍 getUniteBudgetSummary - Début', { uniteId, anneeConferenceId })
    
//     // Récupérer la configuration pour le taux
//     const { data: config } = await supabase
//       .from('configuration')
//       .select('taux')
//       .eq('unite_id', uniteId)
//       .maybeSingle()
    
//     const tauxConfig = config?.taux || 2800
    
//     const budgets = await getBudgetsByUnite(uniteId, anneeConferenceId)

//     if (!budgets || budgets.length === 0) {
//       return {
//         totalLines: 0,
//         recettesList: [],
//         depensesList: [],
//         byCurrency: [],
//         totalCDF: { recettes: 0, depenses: 0 }
//       }
//     }

//     // Grouper par devise (montants dans leur devise d'origine)
//     const byCurrency = new Map<Currency, { recettes: number; depenses: number; lines: BudgetLine[] }>()
    
//     // Totaux en CDF pour avoir une vue consolidée
//     let totalRecettesCDF = 0
//     let totalDepensesCDF = 0
    
//     budgets.forEach(budget => {
//       const currency = budget.currency
//       if (!byCurrency.has(currency)) {
//         byCurrency.set(currency, { recettes: 0, depenses: 0, lines: [] })
//       }
      
//       const summary = byCurrency.get(currency)!
//       summary.lines.push(budget)
      
//       if (budget.type === 'recette') {
//         summary.recettes += budget.montant
//       } else {
//         summary.depenses += budget.montant
//       }
      
//       // Calculer les totaux en CDF avec le taux de configuration
//       let montantCDF = budget.montant
//       if (budget.currency === 'USD') {
//         montantCDF = budget.montant * tauxConfig
//       } else if (budget.currency === 'EUR') {
//         // Approximation EUR -> USD -> CDF
//         montantCDF = budget.montant * 1.08 * tauxConfig
//       }
      
//       if (budget.type === 'recette') {
//         totalRecettesCDF += montantCDF
//       } else {
//         totalDepensesCDF += montantCDF
//       }
//     })

//     const result = {
//       totalLines: budgets.length,
//       recettesList: budgets.filter(b => b.type === 'recette'),
//       depensesList: budgets.filter(b => b.type === 'depense'),
//       byCurrency: Array.from(byCurrency.entries()).map(([currency, data]) => ({
//         currency,
//         recettes: data.recettes,
//         depenses: data.depenses,
//         lines: data.lines
//       })),
//       totalCDF: {
//         recettes: totalRecettesCDF,
//         depenses: totalDepensesCDF
//       }
//     }
    
//     return result
//   } catch (error) {
//     console.error('❌ Erreur getUniteBudgetSummary:', error)
//     return {
//       totalLines: 0,
//       recettesList: [],
//       depensesList: [],
//       byCurrency: [],
//       totalCDF: { recettes: 0, depenses: 0 }
//     }
//   }
// }

// actions/budget.ts - Version finale

export async function getUniteBudgetSummary(uniteId: number, anneeConferenceId?: number) {
  try {
    const { data: config } = await supabase
      .from('configuration')
      .select('taux')
      .eq('unite_id', uniteId)
      .maybeSingle()
    
    const tauxConfig = config?.taux || 2800
    
    const budgets = await getBudgetsByUnite(uniteId, anneeConferenceId)

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
      // Dans la devise principale (tous les budgets sont normalement dans la même devise)
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
    console.error('Erreur getUniteBudgetSummary:', error)
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


// actions/budget.ts - Remplacer getRealiseTotals par cette version

export async function getRealiseTotals(uniteId: number, anneeConferenceId: number): Promise<{
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
    console.error('Erreur getRealiseTotals:', error)
    return { 
      recettes: 0, 
      depenses: 0,
      recettesParDevise: { USD: 0, CDF: 0, EUR: 0 },
      depensesParDevise: { USD: 0, CDF: 0, EUR: 0 }
    }
  }
}