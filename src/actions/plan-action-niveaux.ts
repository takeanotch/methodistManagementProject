// actions/plan-action-niveaux.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'

// ============================================================
// TYPES
// ============================================================

export interface PlanActionNiveau {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
  unite?: {
    id: number
    nom: string
    niveau: string
    reference_id?: number
    id_niveau?: number
  }
  annee_conference?: {
    id: number
    annee_id: number
    annee?: {
      id: number
      label: string
    }
  }
  activites_count?: number
  budget_total?: number
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
// RÉCUPÉRATION DES PLANS D'ACTION
// ============================================================

/**
 * Récupérer les plans d'action par unité
 */
export async function getPlansActionByUniteNiveau(
  uniteId: number,
  anneeConferenceId?: number
): Promise<PlanActionNiveau[]> {
  try {
    console.log('🔍 getPlansActionByUniteNiveau - Début', { uniteId, anneeConferenceId })
    
    let query = supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', uniteId)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur getPlansActionByUniteNiveau:', error)
      return []
    }

    console.log(`✅ getPlansActionByUniteNiveau - ${data?.length || 0} plans trouvés`)
    return data || []
  } catch (error) {
    console.error('❌ Erreur inattendue getPlansActionByUniteNiveau:', error)
    return []
  }
}




export async function getPlanActionByIdNiveau(id: number): Promise<PlanActionNiveau | null> {
  try {
    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur getPlanActionByIdNiveau:', error)
      return null
    }

    if (!data) return null

    // Récupérer les statistiques
    const { count: activitesCount } = await supabase
      .from('activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    const { data: budgetData } = await supabase
      .from('budget')
      .select('montant')
      .eq('plan_action_id', id)
      .eq('type', 'depense')

    const budgetTotal = budgetData?.reduce((sum, b) => sum + (b.montant || 0), 0) || 0

    return {
      ...data,
      activites_count: activitesCount || 0,
      budget_total: budgetTotal
    }
  } catch (error) {
    console.error('Erreur inattendue getPlanActionByIdNiveau:', error)
    return null
  }
}

// ============================================================
// CRUD PLANS D'ACTION
// ============================================================

/**
 * Créer un plan d'action pour un niveau (district ou conférence)
 */
export async function createPlanActionNiveau(
  uniteId: number,
  niveau: 'district' | 'conference',
  niveauId: number,
  titre: string,
  description: string | null,
  anneeConferenceId?: number
): Promise<{ success?: boolean; plan?: any; id?: number; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    if (!uniteId) {
      return { error: 'Unité invalide' }
    }

    // Vérifier que l'unité existe et correspond au bon niveau
    const unite = await getUniteComplete(uniteId)
    if (!unite) {
      return { error: 'Unité non trouvée' }
    }

    if (unite.niveau !== niveau) {
      return { error: `Cette unité n'est pas de niveau ${niveau}` }
    }

    if (unite.id_niveau !== niveauId) {
      return { error: `Cette unité n'appartient pas à ce ${niveau}` }
    }

    // Déterminer l'année de conférence si non fournie
    let finalAnneeConferenceId = anneeConferenceId
    
    if (!finalAnneeConferenceId) {
      let conferenceId: number | null = null
      
      if (niveau === 'district') {
        conferenceId = await getConferenceFromDistrict(niveauId)
      } else {
        conferenceId = niveauId
      }
      
      if (!conferenceId) {
        return { error: 'Impossible de déterminer la conférence' }
      }

      const currentAnnee = await getCurrentAnneeConference(conferenceId)
      if (!currentAnnee) {
        return { error: 'Aucune année en cours pour cette conférence' }
      }
      finalAnneeConferenceId = currentAnnee.id
    }

    const { data: newPlan, error } = await supabase
      .from('plan_action')
      .insert([{
        unite_id: uniteId,
        annee_conference_id: finalAnneeConferenceId,
        titre: titre.trim(),
        description
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur createPlanActionNiveau:', error)
      return { error: 'Erreur lors de la création du plan d\'action' }
    }

    // Revalidation
    if (niveau === 'district') {
      revalidatePath('/district/plans-action')
      revalidatePath('/district')
    } else {
      revalidatePath('/conference/plans-action')
      revalidatePath('/conference')
    }
    
    return { success: true, plan: newPlan, id: newPlan.id }
  } catch (error) {
    console.error('Erreur inattendue createPlanActionNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Mettre à jour un plan d'action
 */
export async function updatePlanActionNiveau(
  id: number,
  niveau: 'district' | 'conference',
  titre: string,
  description: string | null
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    if (!id) {
      return { error: 'ID invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    // Vérifier que le plan existe
    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('unite_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé' }
    }

    // Vérifier que l'unité correspond au bon niveau
    const unite = await getUniteComplete(plan.unite_id)
    if (!unite) {
      return { error: 'Unité non trouvée' }
    }

    if (unite.niveau !== niveau) {
      return { error: 'Vous ne pouvez modifier ce plan' }
    }

    const { error } = await supabase
      .from('plan_action')
      .update({
        titre: titre.trim(),
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erreur updatePlanActionNiveau:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    // Revalidation
    if (niveau === 'district') {
      revalidatePath('/district/plans-action')
      revalidatePath(`/district/plans-action/${id}`)
    } else {
      revalidatePath('/conference/plans-action')
      revalidatePath(`/conference/plans-action/${id}`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updatePlanActionNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Supprimer un plan d'action
 */
export async function deletePlanActionNiveau(
  id: number,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    // Vérifier que le plan existe
    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('unite_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé' }
    }

    // Vérifier que l'unité correspond au bon niveau
    const unite = await getUniteComplete(plan.unite_id)
    if (!unite) {
      return { error: 'Unité non trouvée' }
    }

    if (unite.niveau !== niveau) {
      return { error: 'Vous ne pouvez supprimer ce plan' }
    }

    // Vérifier s'il y a des activités associées
    const { count, error: countError } = await supabase
      .from('activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    if (countError) {
      console.error('Erreur vérification activités:', countError)
    }

    if (count && count > 0) {
      return { error: 'Impossible de supprimer ce plan car il contient des activités' }
    }

    // Vérifier s'il y a des budgets associés
    const { count: budgetCount, error: budgetError } = await supabase
      .from('budget')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    if (budgetError) {
      console.error('Erreur vérification budgets:', budgetError)
    }

    if (budgetCount && budgetCount > 0) {
      return { error: 'Impossible de supprimer ce plan car il contient des lignes budgétaires' }
    }

    const { error } = await supabase
      .from('plan_action')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deletePlanActionNiveau:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    // Revalidation
    if (niveau === 'district') {
      revalidatePath('/district/plans-action')
    } else {
      revalidatePath('/conference/plans-action')
    }
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deletePlanActionNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// ============================================================
// STATISTIQUES
// ============================================================

/**
 * Récupérer les statistiques des plans d'action pour une unité
 */
export async function getPlansActionStatsNiveau(
  uniteId: number,
  anneeConferenceId?: number
): Promise<any> {
  try {
    const plans = await getPlansActionByUniteNiveau(uniteId, anneeConferenceId)
    
    // Enrichir avec les statistiques
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
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
    
    const total = plansWithStats.length
    const totalActivites = plansWithStats.reduce((sum, p) => sum + (p.activites_count || 0), 0)
    const totalBudget = plansWithStats.reduce((sum, p) => sum + (p.budget_total || 0), 0)
    const plansAvecActivites = plansWithStats.filter(p => (p.activites_count || 0) > 0).length
    const plansSansActivites = total - plansAvecActivites

    return {
      total,
      totalActivites,
      totalBudget,
      plansAvecActivites,
      plansSansActivites,
      moyenneActivitesParPlan: total > 0 ? totalActivites / total : 0,
      budgetMoyenParPlan: total > 0 ? totalBudget / total : 0
    }
  } catch (error) {
    console.error('Erreur getPlansActionStatsNiveau:', error)
    return null
  }
}

/**
 * Récupérer les statistiques pour un district
//  */
// export async function getPlansActionStatsForDistrict(
//   districtId: number,
//   anneeConferenceId?: number
// ): Promise<any> {
//   try {
//     const { data: unite } = await supabase
//       .from('unite_organisation')
//       .select('id')
//       .eq('reference_table', 'departement')
//       .eq('niveau', 'district')
//       .eq('id_niveau', districtId)
//       .single()

//     if (!unite) return null

//     return getPlansActionStatsNiveau(unite.id, anneeConferenceId)
//   } catch (error) {
//     console.error('Erreur getPlansActionStatsForDistrict:', error)
//     return null
//   }
// }

// /**
//  * Récupérer les statistiques pour une conférence
//  */
// export async function getPlansActionStatsForConference(
//   conferenceId: number,
//   anneeConferenceId?: number
// ): Promise<any> {
//   try {
//     const { data: unite } = await supabase
//       .from('unite_organisation')
//       .select('id')
//       .eq('reference_table', 'departement')
//       .eq('niveau', 'conference')
//       .eq('id_niveau', conferenceId)
//       .single()

//     if (!unite) return null

//     return getPlansActionStatsNiveau(unite.id, anneeConferenceId)
//   } catch (error) {
//     console.error('Erreur getPlansActionStatsForConference:', error)
//     return null
//   }
// }

// ============================================================
// EXPORTS POUR COMPATIBILITÉ
// ============================================================

// // Alias pour le district
// export const getPlansActionByUniteForDistrict = getPlansActionByUniteNiveau
// export const createPlanActionForDistrict = (
//   districtId: number,
//   titre: string,
//   description: string | null,
//   anneeConferenceId?: number
// ) => {
//   // Cette fonction nécessite l'uniteId, à appeler après avoir récupéré l'unité
//   console.warn('createPlanActionForDistrict: utiliser createPlanActionNiveau avec uniteId')
//   return { error: 'Fonction non implémentée directement' }
// }

// export const updatePlanActionDistrict = updatePlanActionNiveau
// export const deletePlanActionDistrict = deletePlanActionNiveau

// Alias pour la conférence
// export const getPlansActionByUniteForConference = getPlansActionByUniteNiveau
// export const createPlanActionForConference = (
//   conferenceId: number,
//   titre: string,
//   description: string | null,
//   anneeConferenceId?: number
// ) => {
//   console.warn('createPlanActionForConference: utiliser createPlanActionNiveau avec uniteId')
//   return { error: 'Fonction non implémentée directement' }
// }

// export const updatePlanActionConference = updatePlanActionNiveau
// export const deletePlanActionConference = deletePlanActionNiveau










// Alias pour le district
export const getPlansActionByUniteForDistrict = getPlansActionByUniteNiveau

export const createPlanActionForDistrict = async (
  districtId: number,
  titre: string,
  description: string | null,
  anneeConferenceId?: number
) => {
  console.warn('createPlanActionForDistrict: utiliser createPlanActionNiveau avec uniteId')
  return { error: 'Fonction non implémentée directement' }
}

export const updatePlanActionDistrict = updatePlanActionNiveau
export const deletePlanActionDistrict = deletePlanActionNiveau

// Alias pour la conférence
export const getPlansActionByUniteForConference = getPlansActionByUniteNiveau

export const createPlanActionForConference = async (
  conferenceId: number,
  titre: string,
  description: string | null,
  anneeConferenceId?: number
) => {
  console.warn('createPlanActionForConference: utiliser createPlanActionNiveau avec uniteId')
  return { error: 'Fonction non implémentée directement' }
}

export const updatePlanActionConference = updatePlanActionNiveau
export const deletePlanActionConference = deletePlanActionNiveau



// actions/plan-action-niveaux.ts - CORRECTION FINALE

/**
 * Récupérer les plans d'action pour une conférence
 */
export async function getPlansActionByConference(
  conferenceId: number,
  anneeConferenceId?: number
): Promise<PlanActionNiveau[]> {
  try {
    console.log('🔍 getPlansActionByConference - Recherche unités pour conferenceId:', conferenceId)
    
    // Récupérer TOUTES les unités de cette conférence (peut y en avoir plusieurs)
    const { data: unites, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('niveau', 'conference')
      .eq('id_niveau', conferenceId)

    if (uniteError) {
      console.error('❌ Erreur recherche unités conférence:', uniteError)
      return []
    }
    
    if (!unites || unites.length === 0) {
      console.warn('⚠️ Aucune unité trouvée pour la conférence', conferenceId)
      return []
    }

    console.log(`✅ ${unites.length} unité(s) conférence trouvée(s):`, unites.map(u => u.id))
    
    // Récupérer les plans de toutes les unités
    const allPlans: PlanActionNiveau[] = []
    for (const unite of unites) {
      const plans = await getPlansActionByUniteNiveau(unite.id, anneeConferenceId)
      allPlans.push(...plans)
    }
    
    return allPlans
  } catch (error) {
    console.error('Erreur getPlansActionByConference:', error)
    return []
  }
}

/**
 * Récupérer les plans d'action pour un district
 */
export async function getPlansActionByDistrict(
  districtId: number,
  anneeConferenceId?: number
): Promise<PlanActionNiveau[]> {
  try {
    console.log('🔍 getPlansActionByDistrict - Recherche unités pour districtId:', districtId)
    
    // Récupérer TOUTES les unités de ce district
    const { data: unites, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('niveau', 'district')
      .eq('id_niveau', districtId)

    if (uniteError) {
      console.error('❌ Erreur recherche unités district:', uniteError)
      return []
    }
    
    if (!unites || unites.length === 0) {
      console.warn('⚠️ Aucune unité trouvée pour le district', districtId)
      return []
    }

    console.log(`✅ ${unites.length} unité(s) district trouvée(s):`, unites.map(u => u.id))
    
    // Récupérer les plans de toutes les unités
    const allPlans: PlanActionNiveau[] = []
    for (const unite of unites) {
      const plans = await getPlansActionByUniteNiveau(unite.id, anneeConferenceId)
      allPlans.push(...plans)
    }
    
    return allPlans
  } catch (error) {
    console.error('Erreur getPlansActionByDistrict:', error)
    return []
  }
}

/**
 * Récupérer les statistiques pour une conférence
 */
export async function getPlansActionStatsForConference(
  conferenceId: number,
  anneeConferenceId?: number
): Promise<any> {
  try {
    const { data: unites, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('niveau', 'conference')
      .eq('id_niveau', conferenceId)

    if (uniteError || !unites || unites.length === 0) {
      return null
    }

    // Combiner les stats de toutes les unités
    let totalStats = {
      total: 0,
      totalActivites: 0,
      totalBudget: 0,
      plansAvecActivites: 0,
      plansSansActivites: 0,
      moyenneActivitesParPlan: 0,
      budgetMoyenParPlan: 0
    }

    for (const unite of unites) {
      const stats = await getPlansActionStatsNiveau(unite.id, anneeConferenceId)
      if (stats) {
        totalStats.total += stats.total || 0
        totalStats.totalActivites += stats.totalActivites || 0
        totalStats.totalBudget += stats.totalBudget || 0
        totalStats.plansAvecActivites += stats.plansAvecActivites || 0
        totalStats.plansSansActivites += stats.plansSansActivites || 0
      }
    }

    if (totalStats.total > 0) {
      totalStats.moyenneActivitesParPlan = totalStats.totalActivites / totalStats.total
      totalStats.budgetMoyenParPlan = totalStats.totalBudget / totalStats.total
    }

    return totalStats
  } catch (error) {
    console.error('Erreur getPlansActionStatsForConference:', error)
    return null
  }
}

/**
 * Récupérer les statistiques pour un district
 */
export async function getPlansActionStatsForDistrict(
  districtId: number,
  anneeConferenceId?: number
): Promise<any> {
  try {
    const { data: unites, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('niveau', 'district')
      .eq('id_niveau', districtId)

    if (uniteError || !unites || unites.length === 0) {
      return null
    }

    // Combiner les stats de toutes les unités
    let totalStats = {
      total: 0,
      totalActivites: 0,
      totalBudget: 0,
      plansAvecActivites: 0,
      plansSansActivites: 0,
      moyenneActivitesParPlan: 0,
      budgetMoyenParPlan: 0
    }

    for (const unite of unites) {
      const stats = await getPlansActionStatsNiveau(unite.id, anneeConferenceId)
      if (stats) {
        totalStats.total += stats.total || 0
        totalStats.totalActivites += stats.totalActivites || 0
        totalStats.totalBudget += stats.totalBudget || 0
        totalStats.plansAvecActivites += stats.plansAvecActivites || 0
        totalStats.plansSansActivites += stats.plansSansActivites || 0
      }
    }

    if (totalStats.total > 0) {
      totalStats.moyenneActivitesParPlan = totalStats.totalActivites / totalStats.total
      totalStats.budgetMoyenParPlan = totalStats.totalBudget / totalStats.total
    }

    return totalStats
  } catch (error) {
    console.error('Erreur getPlansActionStatsForDistrict:', error)
    return null
  }
}