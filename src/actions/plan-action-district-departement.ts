// actions/plan-action-district-departement.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { ensureDepartementUniteExistsForDistrict, getDepartementUniteForDistrict } from './unite-organisation'
import { getCurrentAnneeConference } from './annee-conference'

export interface PlanActionDistrictDepartement {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Récupère tous les plans d'action d'un département pour un district spécifique
 */
export async function getPlansActionByDepartementForDistrict(
  departementId: number,
  districtId: number
): Promise<PlanActionDistrictDepartement[]> {
  try {
    console.log('getPlansActionByDepartementForDistrict:', { departementId, districtId })
    
    // Récupérer l'unité du département pour ce district
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) {
      console.log('Aucune unité trouvée pour ce département dans ce district')
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
    console.error('Erreur getPlansActionByDepartementForDistrict:', error)
    return []
  }
}

/**
 * Crée un plan d'action pour un département au niveau district
 */
export async function createPlanActionForDistrictDepartement(
  departementId: number,
  districtId: number,
  titre: string,
  description?: string | null
): Promise<{ success: boolean; plan?: PlanActionDistrictDepartement; error?: string }> {
  try {
    if (!titre || titre.trim() === '') {
      return { success: false, error: 'Le titre est requis' }
    }
    
    console.log('createPlanActionForDistrictDepartement:', { departementId, districtId, titre })
    
    // 1. S'assurer que l'unité du département existe pour ce district
    const { success: unitSuccess, unite, error: unitError } = await ensureDepartementUniteExistsForDistrict(
      departementId, 
      districtId
    )
    
    if (!unitSuccess || !unite) {
      return { success: false, error: unitError || 'Impossible de créer l\'unité du département' }
    }
    
    // 2. Récupérer la conférence à partir du district
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select(`
        id,
        conference_id,
        conference:conference_id (
          id
        )
      `)
      .eq('id', districtId)
      .single()
    
    if (districtError || !district) {
      console.error('Erreur récupération district:', districtError)
      return { success: false, error: 'District introuvable' }
    }
    
    // Extraire la conférence
    let conferenceId: number | null = null
    
    if (district.conference) {
      const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
      conferenceId = conference?.id || null
    }
    
    if (!conferenceId) {
      console.error('Conférence non trouvée pour le district:', districtId)
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
    
    revalidatePath(`/district/departements/${departementId}`)
    revalidatePath(`/district/departements/${departementId}/plans-action`)
    
    return { success: true, plan }
  } catch (error) {
    console.error('Erreur createPlanActionForDistrictDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupère un plan d'action par son ID pour un district
 */
export async function getPlanActionDistrictDepartementById(
  planId: number,
  departementId: number,
  districtId: number
): Promise<PlanActionDistrictDepartement | null> {
  try {
    // Récupérer l'unité du département pour ce district
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) {
      console.log('Unité non trouvée pour ce département dans ce district')
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
    console.error('Erreur getPlanActionDistrictDepartementById:', error)
    return null
  }
}

/**
 * Met à jour un plan d'action pour un district
 */
export async function updatePlanActionDistrictDepartement(
  planId: number,
  departementId: number,
  districtId: number,
  titre: string,
  description?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!titre || titre.trim() === '') {
      return { success: false, error: 'Le titre est requis' }
    }

    const plan = await getPlanActionDistrictDepartementById(planId, departementId, districtId)
    
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

    revalidatePath(`/district/departements/${departementId}`)
    revalidatePath(`/district/departements/${departementId}/plans-action/${planId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur updatePlanActionDistrictDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime un plan d'action pour un district
 */
export async function deletePlanActionDistrictDepartement(
  planId: number,
  departementId: number,
  districtId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const plan = await getPlanActionDistrictDepartementById(planId, departementId, districtId)
    
    if (!plan) {
      return { success: false, error: 'Plan d\'action introuvable' }
    }

    const { error } = await supabase
      .from('plan_action')
      .delete()
      .eq('id', planId)

    if (error) throw error

    revalidatePath(`/district/departements/${departementId}`)
    revalidatePath(`/district/departements/${departementId}/plans-action`)

    return { success: true }
  } catch (error) {
    console.error('Erreur deletePlanActionDistrictDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}