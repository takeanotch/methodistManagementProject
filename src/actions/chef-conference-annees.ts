// // // actions/chef-conference-annees.ts
// // 'use server'

// // import { supabase } from '@/lib/supabase'
// // import { revalidatePath } from 'next/cache'
// // import { getUser } from './auth'

// // export interface ChefConferenceInfo {
// //   id: number
// //   fidele_id: number
// //   departement_id: number
// //   conference_id: number
// //   departement_nom: string
// //   conference_nom: string
// //   region_nom: string
// //   fidele_nom: string
// //   fidele_prenom: string
// //   date_nomination: string
// // }

// // export interface AnneeConference {
// //   id: number
// //   label: string
// //   date_debut: string
// //   date_fin: string
// // }

// // export interface AnneeConferenceData {
// //   id: number
// //   conference_id: number
// //   departement_id: number
// //   annee_conference_id: number
// //   is_current: boolean
// //   created_at: string
// //   updated_at: string
// //   annee?: AnneeConference
// // }

// // /**
// //  * Récupère les infos du chef de département connecté au niveau conférence
// //  */
// // export async function getChefConferenceInfo(): Promise<ChefConferenceInfo | null> {
// //   try {
// //     const user = await getUser()
// //     if (!user || !user.fidele_id) return null

// //     const { data: chef, error: chefError } = await supabase
// //       .from('chef_departement')
// //       .select(`
// //         id,
// //         fidele_id,
// //         departement_id,
// //         conference_id,
// //         date_nomination,
// //         departement:departement_id (
// //           nom
// //         ),
// //         conference:conference_id (
// //           nom,
// //           region:region_id (nom)
// //         ),
// //         fidele:fidele_id (
// //           nom,
// //           prenom
// //         )
// //       `)
// //       .eq('fidele_id', user.fidele_id)
// //       .eq('niveau', 'conference')
// //       .eq('est_actif', true)
// //       .maybeSingle()

// //     if (chefError || !chef) {
// //       console.log('Aucun chef trouvé:', chefError)
// //       return null
// //     }

// //     const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
// //     const conference = Array.isArray(chef.conference) ? chef.conference[0] : chef.conference
// //     const region = conference?.region ? (Array.isArray(conference.region) ? conference.region[0] : conference.region) : null
// //     const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele

// //     return {
// //       id: chef.id,
// //       fidele_id: chef.fidele_id,
// //       departement_id: chef.departement_id,
// //       conference_id: chef.conference_id,
// //       departement_nom: departement?.nom || '',
// //       conference_nom: conference?.nom || '',
// //       region_nom: region?.nom || '',
// //       fidele_nom: fidele?.nom || '',
// //       fidele_prenom: fidele?.prenom || '',
// //       date_nomination: chef.date_nomination
// //     }
// //   } catch (error) {
// //     console.error('Erreur getChefConferenceInfo:', error)
// //     return null
// //   }
// // }

// // /**
// //  * Vérifier l'accès du chef à une conférence
// //  */
// // export async function verifyChefConferenceAccess(conferenceId: number, departementId: number): Promise<boolean> {
// //   try {
// //     const user = await getUser()
// //     if (!user || !user.fidele_id) return false

// //     const { data, error } = await supabase
// //       .from('chef_departement')
// //       .select('id')
// //       .eq('fidele_id', user.fidele_id)
// //       .eq('departement_id', departementId)
// //       .eq('conference_id', conferenceId)
// //       .eq('niveau', 'conference')
// //       .eq('est_actif', true)
// //       .maybeSingle()

// //     return !error && !!data
// //   } catch (error) {
// //     console.error('Erreur verifyChefConferenceAccess:', error)
// //     return false
// //   }
// // }

// // /**
// //  * Récupère l'année en cours pour une conférence et département
// //  */
// // export async function getCurrentAnneeForConference(conferenceId: number, departementId: number) {
// //   try {
// //     const hasAccess = await verifyChefConferenceAccess(conferenceId, departementId)
// //     if (!hasAccess) {
// //       console.error('Accès non autorisé')
// //       return null
// //     }

// //     const { data, error } = await supabase
// //       .from('annee_conference')
// //       .select(`
// //         *,
// //         annee:annee_conference_id (id, label, date_debut, date_fin)
// //       `)
// //       .eq('conference_id', conferenceId)
// //       .eq('departement_id', departementId)
// //       .eq('is_current', true)
// //       .maybeSingle()

// //     if (error) throw error
    
// //     if (data) {
// //       return {
// //         ...data,
// //         annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
// //       }
// //     }
    
// //     return null
// //   } catch (error) {
// //     console.error('Erreur getCurrentAnneeForConference:', error)
// //     return null
// //   }
// // }

// // /**
// //  * Récupère toutes les années d'une conférence pour un département
// //  */
// // export async function getAllAnneesForConference(conferenceId: number, departementId: number) {
// //   try {
// //     const hasAccess = await verifyChefConferenceAccess(conferenceId, departementId)
// //     if (!hasAccess) {
// //       console.error('Accès non autorisé')
// //       return []
// //     }

// //     const { data, error } = await supabase
// //       .from('annee_conference')
// //       .select(`
// //         *,
// //         annee:annee_conference_id (id, label, date_debut, date_fin)
// //       `)
// //       .eq('conference_id', conferenceId)
// //       .eq('departement_id', departementId)
// //       .order('annee_conference_id', { ascending: false })

// //     if (error) throw error
    
// //     // Transformer les données et ajouter le statut calculé
// //     const transformedData = data?.map(item => ({
// //       ...item,
// //       annee: Array.isArray(item.annee) ? item.annee[0] : item.annee,
// //       status: item.is_current ? 'current' : 
// //               item.annee_conference_id < (data.find(a => a.is_current)?.annee_conference_id || 0) ? 'past' : 'future'
// //     })) || []
    
// //     return transformedData
// //   } catch (error) {
// //     console.error('Erreur getAllAnneesForConference:', error)
// //     return []
// //   }
// // }
// // src/actions/chef-conference-annees.ts
// 'use server'

// import { supabase } from '@/lib/supabase'
// import { getUser } from './auth'

// export interface ChefConferenceInfo {
//   id: number
//   fidele_id: number
//   departement_id: number
//   conference_id: number
//   departement_nom: string
//   conference_nom: string
//   region_nom: string
//   fidele_nom: string
//   fidele_prenom: string
//   date_nomination: string
// }

// export interface AnneeConference {
//   id: number
//   label: string
//   date_debut: string
//   date_fin: string
// }

// export interface AnneeConferenceData {
//   id: number
//   conference_id: number
//   departement_id: number
//   annee_conference_id: number
//   is_current: boolean
//   created_at: string
//   updated_at: string
//   annee?: AnneeConference
// }

// /**
//  * Récupère les infos du chef de département connecté au niveau conférence
//  */
// export async function getChefConferenceInfo(): Promise<ChefConferenceInfo | null> {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) return null

//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         conference_id,
//         date_nomination,
//         departement:departement_id (
//           nom
//         ),
//         conference:conference_id (
//           nom,
//           region:region_id (nom)
//         ),
//         fidele:fidele_id (
//           nom,
//           prenom
//         )
//       `)
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (chefError || !chef) {
//       console.log('Aucun chef trouvé:', chefError)
//       return null
//     }

//     const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
//     const conference = Array.isArray(chef.conference) ? chef.conference[0] : chef.conference
//     const region = conference?.region ? (Array.isArray(conference.region) ? conference.region[0] : conference.region) : null
//     const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele

//     return {
//       id: chef.id,
//       fidele_id: chef.fidele_id,
//       departement_id: chef.departement_id,
//       conference_id: chef.conference_id,
//       departement_nom: departement?.nom || '',
//       conference_nom: conference?.nom || '',
//       region_nom: region?.nom || '',
//       fidele_nom: fidele?.nom || '',
//       fidele_prenom: fidele?.prenom || '',
//       date_nomination: chef.date_nomination
//     }
//   } catch (error) {
//     console.error('Erreur getChefConferenceInfo:', error)
//     return null
//   }
// }

// /**
//  * Vérifier l'accès du chef à une conférence
//  */
// export async function verifyChefConferenceAccess(conferenceId: number, departementId: number): Promise<boolean> {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) return false

//     const { data, error } = await supabase
//       .from('chef_departement')
//       .select('id')
//       .eq('fidele_id', user.fidele_id)
//       .eq('departement_id', departementId)
//       .eq('conference_id', conferenceId)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .maybeSingle()

//     return !error && !!data
//   } catch (error) {
//     console.error('Erreur verifyChefConferenceAccess:', error)
//     return false
//   }
// }

// /**
//  * Récupère l'année en cours pour une conférence et département
//  */
// export async function getCurrentAnneeForConference(conferenceId: number, departementId: number) {
//   try {
//     const hasAccess = await verifyChefConferenceAccess(conferenceId, departementId)
//     if (!hasAccess) {
//       console.error('Accès non autorisé')
//       return null
//     }

//     const { data, error } = await supabase
//       .from('annee_conference')
//       .select(`
//         *,
//         annee:annee_conference_id (id, label, date_debut, date_fin)
//       `)
//       .eq('conference_id', conferenceId)
//       .eq('departement_id', departementId)
//       .eq('is_current', true)
//       .maybeSingle()

//     if (error) throw error
    
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
//  * Récupère toutes les années d'une conférence pour un département
//  */
// export async function getAllAnneesForConference(conferenceId: number, departementId: number) {
//   try {
//     const hasAccess = await verifyChefConferenceAccess(conferenceId, departementId)
//     if (!hasAccess) {
//       console.error('Accès non autorisé')
//       return []
//     }

//     const { data, error } = await supabase
//       .from('annee_conference')
//       .select(`
//         *,
//         annee:annee_conference_id (id, label, date_debut, date_fin)
//       `)
//       .eq('conference_id', conferenceId)
//       .eq('departement_id', departementId)
//       .order('annee_conference_id', { ascending: false })

//     if (error) throw error
    
//     // Transformer les données et ajouter le statut calculé
//     const transformedData = data?.map(item => ({
//       ...item,
//       annee: Array.isArray(item.annee) ? item.annee[0] : item.annee,
//       status: item.is_current ? 'current' : 
//               item.annee_conference_id < (data.find(a => a.is_current)?.annee_conference_id || 0) ? 'past' : 'future'
//     })) || []
    
//     return transformedData
//   } catch (error) {
//     console.error('Erreur getAllAnneesForConference:', error)
//     return []
//   }
// }

// src/actions/chef-conference-annees.ts
'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'

export interface ChefConferenceInfo {
  id: number
  fidele_id: number
  departement_id: number
  conference_id: number
  departement_nom: string
  conference_nom: string
  region_nom: string
  fidele_nom: string
  fidele_prenom: string
  date_nomination: string
}

export interface AnneeConference {
  id: number
  label: string
  date_debut: string
  date_fin: string
}

/**
 * Récupère les infos du chef de département connecté au niveau conférence
 */
export async function getChefConferenceInfo(): Promise<ChefConferenceInfo | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        conference_id,
        date_nomination,
        departement:departement_id (
          nom
        ),
        conference:conference_id (
          nom,
          region:region_id (nom)
        ),
        fidele:fidele_id (
          nom,
          prenom
        )
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()

    if (chefError || !chef) {
      console.log('Aucun chef trouvé:', chefError)
      return null
    }

    const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
    const conference = Array.isArray(chef.conference) ? chef.conference[0] : chef.conference
    const region = conference?.region ? (Array.isArray(conference.region) ? conference.region[0] : conference.region) : null
    const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele

    return {
      id: chef.id,
      fidele_id: chef.fidele_id,
      departement_id: chef.departement_id,
      conference_id: chef.conference_id,
      departement_nom: departement?.nom || '',
      conference_nom: conference?.nom || '',
      region_nom: region?.nom || '',
      fidele_nom: fidele?.nom || '',
      fidele_prenom: fidele?.prenom || '',
      date_nomination: chef.date_nomination
    }
  } catch (error) {
    console.error('Erreur getChefConferenceInfo:', error)
    return null
  }
}

/**
 * Vérifier l'accès du chef à une conférence
 */
export async function verifyChefConferenceAccess(conferenceId: number, departementId: number): Promise<boolean> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return false

    const { data, error } = await supabase
      .from('chef_departement')
      .select('id')
      .eq('fidele_id', user.fidele_id)
      .eq('departement_id', departementId)
      .eq('conference_id', conferenceId)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()

    return !error && !!data
  } catch (error) {
    console.error('Erreur verifyChefConferenceAccess:', error)
    return false
  }
}

// /**
//  * Récupère l'année en cours pour une conférence
//  */
// export async function getCurrentAnneeForConference(conferenceId: number): Promise<any | null> {
//   try {
//     const { data, error } = await supabase
//       .from('annee_conference')
//       .select(`
//         *,
//         annee:annee_id (id, label, date_debut, date_fin)
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
//         annee:annee_id (id, label, date_debut, date_fin)
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

// src/actions/chef-conference-annees.ts - Version corrigée

/**
 * Récupère l'année en cours pour une conférence
 */
export async function getCurrentAnneeForConference(conferenceId: number): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conferenceId)
      .eq('is_current', true)
      .maybeSingle()

    if (error) {
      console.error('Erreur getCurrentAnneeForConference:', error)
      return null
    }
    
    if (data) {
      return {
        ...data,
        annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getCurrentAnneeForConference:', error)
    return null
  }
}

/**
 * Récupère toutes les années d'une conférence
 */
export async function getAllAnneesForConference(conferenceId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('Erreur getAllAnneesForConference:', error)
      return []
    }
    
    // Transformer les données
    const transformedData = data?.map(item => ({
      ...item,
      annee: Array.isArray(item.annee) ? item.annee[0] : item.annee,
      status: item.is_current ? 'current' : 
              item.annee_id < (data.find(a => a.is_current)?.annee_id || 0) ? 'past' : 'future'
    })) || []
    
    return transformedData
  } catch (error) {
    console.error('Erreur getAllAnneesForConference:', error)
    return []
  }
}