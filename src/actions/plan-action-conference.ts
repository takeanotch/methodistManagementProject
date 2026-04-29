// // // actions/plan-action-conference.ts
// // 'use server'

// // import { supabase } from '@/lib/supabase'
// // import { revalidatePath } from 'next/cache'
// // import { getUser } from './auth'
// // import { ensureDepartementUniteExistsForConference, getDepartementUniteForConference } from './unite-organisation'
// // import { getCurrentAnneeConference } from './annee-conference'

// // export interface PlanActionConference {
// //   id: number
// //   unite_id: number
// //   annee_conference_id: number
// //   titre: string
// //   description: string | null
// //   created_at: string
// //   updated_at: string
// // }

// // /**
// //  * Récupère tous les plans d'action de la conférence pour le chef connecté
// //  */
// // export async function getPlansActionByConference(): Promise<PlanActionConference[]> {
// //   try {
// //     const user = await getUser()
// //     if (!user || !user.fidele_id) return []

// //     // Récupérer les infos du chef (conference_id et departement_id)
// //     const { data: chef, error: chefError } = await supabase
// //       .from('chef_departement')
// //       .select('conference_id, departement_id')
// //       .eq('fidele_id', user.fidele_id)
// //       .eq('niveau', 'conference')
// //       .eq('est_actif', true)
// //       .single()

// //     if (chefError || !chef) {
// //       console.error('Chef non trouvé:', chefError)
// //       return []
// //     }

// //     // Récupérer l'unité du département pour cette conférence
// //     const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    
// //     if (!unite) {
// //       console.log('Aucune unité trouvée pour ce département dans cette conférence')
// //       return []
// //     }
    
// //     const { data, error } = await supabase
// //       .from('plan_action')
// //       .select('*')
// //       .eq('unite_id', unite.id)
// //       .order('created_at', { ascending: false })
    
// //     if (error) {
// //       console.error('Erreur récupération plans action:', error)
// //       return []
// //     }
    
// //     return data || []
// //   } catch (error) {
// //     console.error('Erreur getPlansActionByConference:', error)
// //     return []
// //   }
// // }

// // /**
// //  * Crée un plan d'action pour le département du chef de conférence
// //  */
// // export async function createPlanActionForConference(
// //   titre: string,
// //   description?: string | null
// // ): Promise<{ success: boolean; plan?: PlanActionConference; error?: string }> {
// //   try {
// //     if (!titre || titre.trim() === '') {
// //       return { success: false, error: 'Le titre est requis' }
// //     }
    
// //     const user = await getUser()
// //     if (!user || !user.fidele_id) {
// //       return { success: false, error: 'Utilisateur non connecté' }
// //     }

// //     // Récupérer les infos du chef
// //     const { data: chef, error: chefError } = await supabase
// //       .from('chef_departement')
// //       .select(`
// //         conference_id,
// //         departement_id,
// //         conference:conference_id (
// //           id,
// //           region_id
// //         )
// //       `)
// //       .eq('fidele_id', user.fidele_id)
// //       .eq('niveau', 'conference')
// //       .eq('est_actif', true)
// //       .single()

// //     if (chefError || !chef) {
// //       console.error('Chef non trouvé:', chefError)
// //       return { success: false, error: 'Vous n\'êtes pas chef de département' }
// //     }

// //     console.log('Création plan action pour:', {
// //       departement_id: chef.departement_id,
// //       conference_id: chef.conference_id
// //     })
    
// //     // 1. S'assurer que l'unité du département existe pour cette conférence
// //     const { success: unitSuccess, unite, error: unitError } = await ensureDepartementUniteExistsForConference(
// //       chef.departement_id, 
// //       chef.conference_id
// //     )
    
// //     if (!unitSuccess || !unite) {
// //       return { success: false, error: unitError || 'Impossible de créer l\'unité du département' }
// //     }
    
// //     // 2. Récupérer l'année en cours pour cette conférence
// //     const currentAnnee = await getCurrentAnneeConference(chef.conference_id)
// //     if (!currentAnnee) {
// //       return { success: false, error: 'Aucune année en cours' }
// //     }
    
// //     // 3. Créer le plan d'action
// //     const { data: plan, error } = await supabase
// //       .from('plan_action')
// //       .insert([{
// //         unite_id: unite.id,
// //         annee_conference_id: currentAnnee.id,
// //         titre: titre.trim(),
// //         description: description?.trim() || null,
// //         created_at: new Date().toISOString(),
// //         updated_at: new Date().toISOString()
// //       }])
// //       .select()
// //       .single()
    
// //     if (error) {
// //       console.error('Erreur création plan action:', error)
// //       return { success: false, error: error.message }
// //     }
    
// //     revalidatePath('/conference/plans-action')
    
// //     return { success: true, plan }
// //   } catch (error) {
// //     console.error('Erreur createPlanActionForConference:', error)
// //     return { success: false, error: 'Une erreur est survenue' }
// //   }
// // }

// // /**
// //  * Récupère un plan d'action par son ID au niveau conférence
// //  */
// // export async function getPlanActionConferenceById(planId: number): Promise<PlanActionConference | null> {
// //   try {
// //     const user = await getUser()
// //     if (!user || !user.fidele_id) return null

// //     // Récupérer les infos du chef
// //     const { data: chef, error: chefError } = await supabase
// //       .from('chef_departement')
// //       .select('departement_id, conference_id')
// //       .eq('fidele_id', user.fidele_id)
// //       .eq('niveau', 'conference')
// //       .eq('est_actif', true)
// //       .single()

// //     if (chefError || !chef) return null

// //     // Récupérer l'unité
// //     const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
// //     if (!unite) return null

// //     const { data, error } = await supabase
// //       .from('plan_action')
// //       .select('*')
// //       .eq('id', planId)
// //       .eq('unite_id', unite.id)
// //       .single()

// //     if (error) {
// //       if (error.code === 'PGRST116') return null
// //       throw error
// //     }
// //     return data
// //   } catch (error) {
// //     console.error('Erreur getPlanActionConferenceById:', error)
// //     return null
// //   }
// // }

// // /**
// //  * Met à jour un plan d'action au niveau conférence
// //  */
// // export async function updatePlanActionConference(
// //   planId: number,
// //   titre: string,
// //   description?: string | null
// // ): Promise<{ success: boolean; error?: string }> {
// //   try {
// //     if (!titre || titre.trim() === '') {
// //       return { success: false, error: 'Le titre est requis' }
// //     }

// //     // Vérifier que le plan appartient bien au chef connecté
// //     const user = await getUser()
// //     if (!user || !user.fidele_id) {
// //       return { success: false, error: 'Utilisateur non connecté' }
// //     }

// //     const plan = await getPlanActionConferenceById(planId)
    
// //     if (!plan) {
// //       return { success: false, error: 'Plan d\'action introuvable' }
// //     }

// //     const { error } = await supabase
// //       .from('plan_action')
// //       .update({
// //         titre: titre.trim(),
// //         description: description?.trim() || null,
// //         updated_at: new Date().toISOString()
// //       })
// //       .eq('id', planId)

// //     if (error) throw error

// //     revalidatePath('/conference/plans-action')
// //     revalidatePath(`/conference/plans-action/${planId}`)

// //     return { success: true }
// //   } catch (error) {
// //     console.error('Erreur updatePlanActionConference:', error)
// //     return { success: false, error: 'Une erreur est survenue' }
// //   }
// // }

// // /**
// //  * Supprime un plan d'action au niveau conférence
// //  */
// // export async function deletePlanActionConference(planId: number): Promise<{ success: boolean; error?: string }> {
// //   try {
// //     const plan = await getPlanActionConferenceById(planId)
    
// //     if (!plan) {
// //       return { success: false, error: 'Plan d\'action introuvable' }
// //     }

// //     const { error } = await supabase
// //       .from('plan_action')
// //       .delete()
// //       .eq('id', planId)

// //     if (error) throw error

// //     revalidatePath('/conference/plans-action')

// //     return { success: true }
// //   } catch (error) {
// //     console.error('Erreur deletePlanActionConference:', error)
// //     return { success: false, error: 'Une erreur est survenue' }
// //   }
// // }


// // actions/plan-action-conference.ts
// 'use server'

// import { supabase } from '@/lib/supabase'
// import { revalidatePath } from 'next/cache'
// import { getUser } from './auth'
// import { ensureDepartementUniteExistsForConference, getDepartementUniteForConference } from './unite-organisation'
// // import { getCurrentAnneeForConference } from './chef-conference-annees'
// export interface PlanActionConference {
//   id: number
//   unite_id: number
//   annee_conference_id: number
//   titre: string
//   description: string | null
//   created_at: string
//   updated_at: string
// }

// /**
//  * Récupère tous les plans d'action de la conférence pour le département du chef
//  */
// export async function getPlansActionByConference(): Promise<PlanActionConference[]> {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) return []

//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select('departement_id, conference_id')
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .single()

//     if (chefError || !chef) {
//       console.log('Chef non trouvé:', chefError)
//       return []
//     }

//     const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
//     if (!unite) {
//       console.log('Unité non trouvée')
//       return []
//     }

//     const { data, error } = await supabase
//       .from('plan_action')
//       .select('*')
//       .eq('unite_id', unite.id)
//       .order('created_at', { ascending: false })

//     if (error) {
//       console.error('Erreur getPlansActionByConference:', error)
//       return []
//     }
    
//     return data || []
//   } catch (error) {
//     console.error('Erreur getPlansActionByConference:', error)
//     return []
//   }
// }

// /**
//  * Crée un plan d'action pour la conférence
//  */
// export async function createPlanActionForConference(
//   titre: string,
//   description?: string | null
// ): Promise<{ success: boolean; plan?: PlanActionConference; error?: string }> {
//   try {
//     if (!titre?.trim()) {
//       return { success: false, error: 'Le titre est requis' }
//     }
    
//     const user = await getUser()
//     if (!user?.fidele_id) {
//       return { success: false, error: 'Utilisateur non connecté' }
//     }

//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select('departement_id, conference_id')
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .single()

//     if (chefError || !chef) {
//       return { success: false, error: 'Vous n\'êtes pas chef de département' }
//     }
    
//     // 1. Créer l'unité si nécessaire
//     const { success: unitSuccess, unite, error: unitError } = await ensureDepartementUniteExistsForConference(
//       chef.departement_id,
//       chef.conference_id
//     )
    
//     if (!unitSuccess || !unite) {
//       return { success: false, error: unitError || 'Impossible de créer l\'unité' }
//     }
    
//     // 2. Récupérer l'année en cours
//     const currentAnnee = await getCurrentAnneeForConference(chef.conference_id)
//     if (!currentAnnee) {
//       return { success: false, error: 'Aucune année en cours' }
//     }
    
//     // 3. Créer le plan d'action
//     const { data: plan, error } = await supabase
//       .from('plan_action')
//       .insert([{
//         unite_id: unite.id,
//         annee_conference_id: currentAnnee.id,
//         titre: titre.trim(),
//         description: description?.trim() || null,
//         created_at: new Date().toISOString(),
//         updated_at: new Date().toISOString()
//       }])
//       .select()
//       .single()
    
//     if (error) {
//       console.error('Erreur création plan action:', error)
//       return { success: false, error: error.message }
//     }
    
//     revalidatePath('/conference/plans-action')
    
//     return { success: true, plan }
//   } catch (error) {
//     console.error('Erreur createPlanActionForConference:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

// /**
//  * Récupère un plan d'action par son ID
//  */
// export async function getPlanActionConferenceById(planId: number): Promise<PlanActionConference | null> {
//   try {
//     const user = await getUser()
//     if (!user?.fidele_id) return null

//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select('departement_id, conference_id')
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .single()

//     if (chefError || !chef) return null

//     const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
//     if (!unite) return null

//     const { data, error } = await supabase
//       .from('plan_action')
//       .select('*')
//       .eq('id', planId)
//       .eq('unite_id', unite.id)
//       .single()

//     if (error) return null
//     return data
//   } catch (error) {
//     console.error('Erreur getPlanActionConferenceById:', error)
//     return null
//   }
// }

// /**
//  * Met à jour un plan d'action
//  */
// export async function updatePlanActionConference(
//   planId: number,
//   titre: string,
//   description?: string | null
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     if (!titre?.trim()) {
//       return { success: false, error: 'Le titre est requis' }
//     }

//     const plan = await getPlanActionConferenceById(planId)
//     if (!plan) {
//       return { success: false, error: 'Plan d\'action introuvable' }
//     }

//     const { error } = await supabase
//       .from('plan_action')
//       .update({
//         titre: titre.trim(),
//         description: description?.trim() || null,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', planId)

//     if (error) throw error

//     revalidatePath('/conference/plans-action')
//     revalidatePath(`/conference/plans-action/${planId}`)

//     return { success: true }
//   } catch (error) {
//     console.error('Erreur updatePlanActionConference:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

// /**
//  * Supprime un plan d'action
//  */
// export async function deletePlanActionConference(planId: number): Promise<{ success: boolean; error?: string }> {
//   try {
//     const plan = await getPlanActionConferenceById(planId)
//     if (!plan) {
//       return { success: false, error: 'Plan d\'action introuvable' }
//     }

//     // Vérifier si des activités sont liées
//     const { count } = await supabase
//       .from('activite')
//       .select('*', { count: 'exact', head: true })
//       .eq('plan_action_id', planId)

//     if (count && count > 0) {
//       return { success: false, error: 'Impossible de supprimer : des activités sont liées à ce plan d\'action' }
//     }

//     const { error } = await supabase
//       .from('plan_action')
//       .delete()
//       .eq('id', planId)

//     if (error) throw error

//     revalidatePath('/conference/plans-action')
//     return { success: true }
//   } catch (error) {
//     console.error('Erreur deletePlanActionConference:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

// // src/actions/chef-conference-annees.ts - Version corrigée

// /**
//  * Récupère l'année en cours pour une conférence
//  */
// export async function getCurrentAnneeForConference(conferenceId: number): Promise<any | null> {
//   try {
//     const { data, error } = await supabase
//       .from('annee_conference')
//       .select(`
//         *,
//         annee:annee_id (id, label)
//       `)
//       .eq('conference_id', conferenceId)
//       .eq('is_current', true)
//       .maybeSingle()

//     if (error) {
//       console.error('Erreur getCurrentAnneeForConference:', error)
//       return null
//     }
    
//     if (data) {
//       return {
//         ...data,
//         annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
//       }
//     }
    
//     return null
//   } catch (error) {
//     console.error('Erreur getCurrentAnneeForConference:', error)
//     return null
//   }
// }

// /**
//  * Récupère toutes les années d'une conférence
//  */
// export async function getAllAnneesForConference(conferenceId: number): Promise<any[]> {
//   try {
//     const { data, error } = await supabase
//       .from('annee_conference')
//       .select(`
//         *,
//         annee:annee_id (id, label)
//       `)
//       .eq('conference_id', conferenceId)
//       .order('annee_id', { ascending: false })

//     if (error) {
//       console.error('Erreur getAllAnneesForConference:', error)
//       return []
//     }
    
//     // Transformer les données
//     const transformedData = data?.map(item => ({
//       ...item,
//       annee: Array.isArray(item.annee) ? item.annee[0] : item.annee,
//       status: item.is_current ? 'current' : 
//               item.annee_id < (data.find(a => a.is_current)?.annee_id || 0) ? 'past' : 'future'
//     })) || []
    
//     return transformedData
//   } catch (error) {
//     console.error('Erreur getAllAnneesForConference:', error)
//     return []
//   }
// }

// actions/plan-action-conference.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { ensureDepartementUniteExistsForConference, getDepartementUniteForConference } from './unite-organisation'
import { getCurrentAnneeForConference } from './chef-conference-annees'

export interface PlanActionConference {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * Récupère tous les plans d'action de la conférence
 */
export async function getPlansActionByConference(): Promise<PlanActionConference[]> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return []

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      console.log('Chef non trouvé:', chefError)
      return []
    }

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
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
      console.error('Erreur getPlansActionByConference:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionByConference:', error)
    return []
  }
}

/**
 * Crée un plan d'action pour la conférence
 */
export async function createPlanActionForConference(
  titre: string,
  description?: string | null
): Promise<{ success: boolean; plan?: PlanActionConference; error?: string }> {
  try {
    if (!titre?.trim()) {
      return { success: false, error: 'Le titre est requis' }
    }
    
    const user = await getUser()
    if (!user?.fidele_id) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas chef de département' }
    }
    
    // 1. Créer l'unité si nécessaire
    const { success: unitSuccess, unite, error: unitError } = await ensureDepartementUniteExistsForConference(
      chef.departement_id,
      chef.conference_id
    )
    
    if (!unitSuccess || !unite) {
      return { success: false, error: unitError || 'Impossible de créer l\'unité' }
    }
    
    // 2. Récupérer l'année en cours
    const currentAnnee = await getCurrentAnneeForConference(chef.conference_id)
    if (!currentAnnee) {
      return { success: false, error: 'Aucune année en cours' }
    }
    
    // 3. Créer le plan d'action
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
    
    revalidatePath('/conference/plans-action')
    
    return { success: true, plan }
  } catch (error) {
    console.error('Erreur createPlanActionForConference:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}