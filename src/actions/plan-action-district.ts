

// actions/plan-action-district.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { ensureDepartementUniteExistsForDistrict, getDepartementUniteForDistrict } from './unite-organisation'
import { getCurrentAnneeConference } from './annee-conference'

export interface PlanActionDistrict {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
}

// Assurez-vous que la fonction getPlansActionByDistrict retourne tous les plans d'action avec l'annee_conference_id
export async function getPlansActionByDistrict(): Promise<any[]> {
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

    if (chefError || !chef) {
      console.log('Chef non trouvé:', chefError)
      return []
    }

    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
    if (!unite) {
      console.log('Unité non trouvée')
      return []
    }

    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getPlansActionByDistrict:', error)
      return []
    }
    
    console.log('Plans d\'action trouvés:', data?.length)
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionByDistrict:', error)
    return []
  }
}

/**
 * Crée un plan d'action pour le département du chef de district
 */
export async function createPlanActionForDistrict(
  titre: string,
  description?: string | null
): Promise<{ success: boolean; plan?: PlanActionDistrict; error?: string }> {
  try {
    if (!titre || titre.trim() === '') {
      return { success: false, error: 'Le titre est requis' }
    }
    
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // Récupérer les infos du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select(`
        district_id,
        departement_id,
        district:district_id (
          conference_id,
          conference:conference_id (id)
        )
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      console.error('Chef non trouvé:', chefError)
      return { success: false, error: 'Vous n\'êtes pas chef de département' }
    }

    console.log('Création plan action pour:', {
      departement_id: chef.departement_id,
      district_id: chef.district_id
    })
    
    // 1. S'assurer que l'unité du département existe pour ce district
    const { success: unitSuccess, unite, error: unitError } = await ensureDepartementUniteExistsForDistrict(
      chef.departement_id, 
      chef.district_id
    )
    
    if (!unitSuccess || !unite) {
      return { success: false, error: unitError || 'Impossible de créer l\'unité du département' }
    }
    
    // 2. Récupérer la conférence à partir du district
    const district = Array.isArray(chef.district) ? chef.district[0] : chef.district
    const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null
    const conferenceId = conference?.id
    
    if (!conferenceId) {
      console.error('Conférence non trouvée pour le district:', chef.district_id)
      return { success: false, error: 'Impossible de déterminer la conférence' }
    }
    
    // 3. Récupérer l'année en cours
    const currentAnnee = await getCurrentAnneeConference(conferenceId)
    if (!currentAnnee) {
      return { success: false, error: 'Aucune année en cours' }
    }
    
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
    
    revalidatePath('/district/plans-action')
    
    return { success: true, plan }
  } catch (error) {
    console.error('Erreur createPlanActionForDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupère un plan d'action par son ID
 */
export async function getPlanActionDistrictById(planId: number): Promise<PlanActionDistrict | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    // Récupérer les infos du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, district_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) return null

    // Récupérer l'unité
    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
    if (!unite) return null

    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('id', planId)
      .eq('unite_id', unite.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  } catch (error) {
    console.error('Erreur getPlanActionDistrictById:', error)
    return null
  }
}

export async function deletePlanActionDistrict(planId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const plan = await getPlanActionDistrictById(planId)
    
    if (!plan) {
      return { success: false, error: 'Plan d\'action introuvable' }
    }

    const { error } = await supabase
      .from('plan_action')
      .delete()
      .eq('id', planId)

    if (error) throw error

    revalidatePath('/district/plans-action')

    return { success: true }
  } catch (error) {
    console.error('Erreur deletePlanActionDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


// Dans actions/plan-action-district.ts, ajouter/modifier:

/**
 * Met à jour un plan d'action
 */
export async function updatePlanActionDistrict(
  planId: number,
  titre: string,
  description?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!titre || titre.trim() === '') {
      return { success: false, error: 'Le titre est requis' }
    }

    // Vérifier que le plan appartient bien au chef connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    const plan = await getPlanActionDistrictById(planId)
    
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

    revalidatePath('/district/plans-action')
    revalidatePath(`/district/plans-action/${planId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur updatePlanActionDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
// Récupérer les lignes budgétaires d'un plan d'action
