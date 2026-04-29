

// actions/plan-action-departement.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getCurrentFidele } from './auth'
import { ensureDepartementUniteExists, getDepartementUnite } from './unite-organisation'
import { getCurrentAnneeConference } from './annee-conference'

export interface PlanActionDepartement {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Récupère tous les plans d'action d'un département pour une paroisse spécifique
 */
export async function getPlansActionByDepartement(
  departementId: number,
  paroisseId: number
): Promise<PlanActionDepartement[]> {
  try {
    console.log('getPlansActionByDepartement:', { departementId, paroisseId })
    
    // Récupérer l'unité du département pour cette paroisse
    const unite = await getDepartementUnite(departementId, paroisseId)
    
    if (!unite) {
      console.log('Aucune unité trouvée pour ce département dans cette paroisse')
      return []
    }
    
    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Erreur récupération plans action:', error)
      return []
    }
    
    console.log(`Plans action récupérés: ${data?.length || 0}`)
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionByDepartement:', error)
    return []
  }
}

/**
 * Crée un plan d'action pour un département
 */
export async function createPlanActionForDepartement(
  departementId: number,
  paroisseId: number,
  titre: string,
  description?: string | null
): Promise<{ success: boolean; plan?: PlanActionDepartement; error?: string }> {
  try {
    if (!titre || titre.trim() === '') {
      return { success: false, error: 'Le titre est requis' }
    }
    
    console.log('createPlanActionForDepartement:', { departementId, paroisseId, titre })
    
    // 1. S'assurer que l'unité du département existe pour cette paroisse
    const { success: unitSuccess, unite, error: unitError } = await ensureDepartementUniteExists(
      departementId, 
      paroisseId
    )
    
    if (!unitSuccess || !unite) {
      return { success: false, error: unitError || 'Impossible de créer l\'unité du département' }
    }
    
    // 2. Récupérer la conférence à partir de la paroisse
    const { data: paroisse, error: paroisseError } = await supabase
      .from('paroisse')
      .select(`
        id,
        district_id,
        district:district_id (
          id,
          conference_id,
          conference:conference_id (
            id
          )
        )
      `)
      .eq('id', paroisseId)
      .single()
    
    if (paroisseError || !paroisse) {
      console.error('Erreur récupération paroisse:', paroisseError)
      return { success: false, error: 'Impossible de déterminer la conférence' }
    }
    
    // Extraire la conférence en gérant les tableaux
    let conferenceId: number | null = null
    
    if (paroisse.district) {
      // district peut être un tableau ou un objet
      const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
      
      if (district?.conference) {
        // conference peut être un tableau ou un objet
        const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
        conferenceId = conference?.id || null
      }
    }
    
    if (!conferenceId) {
      console.error('Conférence non trouvée pour la paroisse:', paroisseId)
      return { success: false, error: 'Impossible de déterminer la conférence' }
    }
    
    console.log('Conférence trouvée:', conferenceId)
    
    // 3. Récupérer l'année en cours
    const currentAnnee = await getCurrentAnneeConference(conferenceId)
    if (!currentAnnee) {
      return { success: false, error: 'Aucune année en cours' }
    }
    
    console.log('Année en cours:', currentAnnee.id)
    
    // 4. Créer le plan d'action
    const { data: plan, error } = await supabase
      .from('plan_action')
      .insert([{
        unite_id: unite.id,
        annee_conference_id: currentAnnee.id,
        titre: titre.trim(),
        description: description?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Erreur création plan action:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath(`/paroisse/departements/${departementId}`)
    revalidatePath(`/paroisse/departements/${departementId}/plans-action`)
    
    return { success: true, plan }
  } catch (error) {
    console.error('Erreur createPlanActionForDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupère un plan d'action par son ID
 */
export async function getPlanActionDepartementById(
  planId: number,
  departementId: number,
  paroisseId: number
): Promise<PlanActionDepartement | null> {
  try {
    // Récupérer l'unité du département pour cette paroisse
    const unite = await getDepartementUnite(departementId, paroisseId)
    
    if (!unite) {
      console.log('Unité non trouvée pour ce département dans cette paroisse')
      return null
    }

    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('id', planId)
      .eq('unite_id', unite.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw error
    }
    return data
  } catch (error) {
    console.error('Erreur getPlanActionDepartementById:', error)
    return null
  }
}

/**
 * Met à jour un plan d'action
 */
export async function updatePlanActionDepartement(
  planId: number,
  departementId: number,
  paroisseId: number,
  titre: string,
  description?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!titre || titre.trim() === '') {
      return { success: false, error: 'Le titre est requis' }
    }

    const plan = await getPlanActionDepartementById(planId, departementId, paroisseId)
    
    if (!plan) {
      return { success: false, error: 'Plan d\'action introuvable' }
    }

    const { error } = await supabase
      .from('plan_action')
      .update({
        titre: titre.trim(),
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)

    if (error) throw error

    revalidatePath(`/paroisse/departements/${departementId}`)
    revalidatePath(`/paroisse/departements/${departementId}/plans-action/${planId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur updatePlanActionDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime un plan d'action
 */
export async function deletePlanActionDepartement(
  planId: number,
  departementId: number,
  paroisseId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const plan = await getPlanActionDepartementById(planId, departementId, paroisseId)
    
    if (!plan) {
      return { success: false, error: 'Plan d\'action introuvable' }
    }

    const { error } = await supabase
      .from('plan_action')
      .delete()
      .eq('id', planId)

    if (error) throw error

    revalidatePath(`/paroisse/departements/${departementId}`)
    revalidatePath(`/paroisse/departements/${departementId}/plans-action`)

    return { success: true }
  } catch (error) {
    console.error('Erreur deletePlanActionDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
// actions/plan-action-departement.ts
// Ajouter cette fonction à la fin du fichier existant

export async function getPlansActionStatsForDepartement(
  departementId: number,
  paroisseId: number,
  anneeConferenceId?: number
) {
  try {
    const allPlans = await getPlansActionByDepartement(departementId, paroisseId)
    
    // Filtrer par année si spécifiée
    const plans = anneeConferenceId 
      ? allPlans.filter(p => p.annee_conference_id === anneeConferenceId)
      : allPlans
    
    // Enrichir avec les compteurs
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
          activites_count: activitesCount || 0,
          budget_total: budgetTotal
        }
      })
    )
    
    const total = plans.length
    const totalActivites = plansWithStats.reduce((sum, p) => sum + (p.activites_count || 0), 0)
    const totalBudget = plansWithStats.reduce((sum, p) => sum + (p.budget_total || 0), 0)
    const plansAvecActivites = plansWithStats.filter(p => (p.activites_count || 0) > 0).length

    return {
      total,
      totalActivites,
      totalBudget,
      plansAvecActivites,
      plansSansActivites: total - plansAvecActivites,
      moyenneActivitesParPlan: total > 0 ? totalActivites / total : 0,
      budgetMoyenParPlan: total > 0 ? totalBudget / total : 0
    }
  } catch (error) {
    console.error('Erreur getPlansActionStatsForDepartement:', error)
    return null
  }
}