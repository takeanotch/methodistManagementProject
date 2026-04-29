

// actions/annee-conference.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

export interface Annee {
  id: number
  label: string
}

export interface AnneeConference {
  label: string
  id: number
  annee_id: number
  conference_id: number
  is_current: boolean
  created_at: string
  updated_at: string
  annee?: Annee
  conference?: {
    id: number
    nom: string
  }
  status?: 'current' | 'past' | 'future'
}

// Récupérer toutes les années disponibles
export async function getAnnees() {
  try {
    const { data, error } = await supabase
      .from('annee')
      .select('id, label')
      .order('label', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getAnnees:', error)
    return []
  }
}

// Récupérer les années pour une conférence spécifique
export async function getAnneesByConference(conferenceId: number) {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee!annee_conference_annee_id_fkey (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) throw error

    // Récupérer l'année en cours pour cette conférence
    const current = await getCurrentAnneeConference(conferenceId)

    // Transformer les données
    const anneesAvecStatut = (data || []).map((ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      
      let status: 'current' | 'past' | 'future' = 'past'
      if (ac.is_current) {
        status = 'current'
      } else if (current && ac.annee_id > current.annee_id) {
        status = 'future'
      }

      return {
        ...ac,
        annee,
        status
      }
    })

    return anneesAvecStatut
  } catch (error) {
    console.error('Erreur getAnneesByConference:', error)
    return []
  }
}



// Ajouter une année à une conférence spécifique
export async function ajouterAnneeConference(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || user.role?.nom !== 'admin') {
      return { error: 'Accès non autorisé' }
    }

    const annee_id = parseInt(formData.get('annee_id') as string)
    const conference_id = parseInt(formData.get('conference_id') as string)

    if (!annee_id || isNaN(annee_id)) {
      return { error: 'Veuillez sélectionner une année' }
    }

    if (!conference_id || isNaN(conference_id)) {
      return { error: 'Veuillez sélectionner une conférence' }
    }

    // Vérifier si l'année existe déjà pour cette conférence
    const { data: existing } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('annee_id', annee_id)
      .eq('conference_id', conference_id)
      .maybeSingle()

    if (existing) {
      return { error: 'Cette année est déjà ajoutée à cette conférence' }
    }

    // Vérifier si c'est la première année pour cette conférence
    const { count, error: countError } = await supabase
      .from('annee_conference')
      .select('*', { count: 'exact', head: true })
      .eq('conference_id', conference_id)

    if (countError) throw countError

    // Ajouter l'année (la première sera automatiquement en cours)
    const { data: newAnnee, error } = await supabase
      .from('annee_conference')
      .insert([{
        annee_id,
        conference_id,
        is_current: count === 0 // Si c'est la première année, elle devient automatiquement en cours
      }])
      .select()
      .single()

    if (error) throw error

    revalidatePath('/admin/annees-conference')
    return { success: true, message: 'Année ajoutée avec succès' }
  } catch (error) {
    console.error('Erreur ajouterAnneeConference:', error)
    return { error: 'Erreur lors de l\'ajout' }
  }
}

// Définir l'année en cours pour une conférence spécifique
export async function setCurrentAnnee(formData: FormData) {
  try {
    // const user = await getUser()
    // if (!user || user.role?.nom !== 'admin') {
    //   return { error: 'Accès non autorisé' }
    // }

    const annee_id = parseInt(formData.get('annee_id') as string)
    const conference_id = parseInt(formData.get('conference_id') as string)

    if (!annee_id || isNaN(annee_id)) {
      return { error: 'Année invalide' }
    }

    if (!conference_id || isNaN(conference_id)) {
      return { error: 'Conférence invalide' }
    }

    // Commencer une transaction
    // 1. Enlever le statut current de toutes les années de cette conférence
    const { error: resetError } = await supabase
      .from('annee_conference')
      .update({ is_current: false })
      .eq('conference_id', conference_id)

    if (resetError) throw resetError

    // 2. Définir la nouvelle année en cours
    const { error: setError } = await supabase
      .from('annee_conference')
      .update({ is_current: true })
      .eq('conference_id', conference_id)
      .eq('annee_id', annee_id)

    if (setError) throw setError

    revalidatePath('/admin/annees-conference')
    return { success: true, message: 'Année en cours définie avec succès' }
  } catch (error) {
    console.error('Erreur setCurrentAnnee:', error)
    return { error: 'Erreur lors du changement d\'année' }
  }
}

// Supprimer une année d'une conférence spécifique
export async function supprimerAnneeConference(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || user.role?.nom !== 'admin') {
      return { error: 'Accès non autorisé' }
    }

    const id = parseInt(formData.get('id') as string)
    const conference_id = parseInt(formData.get('conference_id') as string)

    // Vérifier si c'est l'année en cours
    const { data: annee } = await supabase
      .from('annee_conference')
      .select('is_current')
      .eq('id', id)
      .single()

    if (annee?.is_current) {
      return { error: 'Impossible de supprimer l\'année en cours' }
    }

    const { error } = await supabase
      .from('annee_conference')
      .delete()
      .eq('id', id)
      .eq('conference_id', conference_id)

    if (error) throw error

    // Après suppression, si aucune année n'existe pour cette conférence, on peut réinitialiser
    const { count } = await supabase
      .from('annee_conference')
      .select('*', { count: 'exact', head: true })
      .eq('conference_id', conference_id)

    // Si des années restent et qu'il n'y a pas d'année en cours, définir la plus récente
    if (count && count > 0) {
      const { data: lastAnnee } = await supabase
        .from('annee_conference')
        .select('id')
        .eq('conference_id', conference_id)
        .order('annee_id', { ascending: false })
        .limit(1)
        .single()

      const { data: hasCurrent } = await supabase
        .from('annee_conference')
        .select('id')
        .eq('conference_id', conference_id)
        .eq('is_current', true)
        .maybeSingle()

      if (!hasCurrent && lastAnnee) {
        await supabase
          .from('annee_conference')
          .update({ is_current: true })
          .eq('id', lastAnnee.id)
      }
    }

    revalidatePath('/admin/annees-conference')
    return { success: true, message: 'Année supprimée avec succès' }
  } catch (error) {
    console.error('Erreur supprimerAnneeConference:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

// Récupérer toutes les conférences pour le sélecteur
export async function getConferencesForSelector() {
  try {
    const { data, error } = await supabase
      .from('conference')
      .select('id, nom')
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getConferencesForSelector:', error)
    return []
  }
}
















// Récupérer l'année en cours globale (pour compatibilité)
export async function getCurrentAnneeConferenceGlobal() {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee!annee_conference_annee_id_fkey (id, label)
      `)
      .eq('is_current', true)
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        return null
      }
      throw error
    }

    if (data) {
      return {
        ...data,
        annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
      }
    }

    return null
  } catch (error) {
    console.error('Erreur getCurrentAnneeConferenceGlobal:', error)
    return null
  }
}

// Récupérer toutes les années groupées par conférence
export async function getAllAnneesConferenceGrouped() {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee!annee_conference_annee_id_fkey (id, label),
        conference:conference!annee_conference_conference_id_fkey (id, nom)
      `)
      .order('annee_id', { ascending: false })

    if (error) throw error

    const groupedByConference: { [key: number]: any } = {}
    
    for (const ac of data || []) {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      const conference = Array.isArray(ac.conference) ? ac.conference[0] : ac.conference
      
      if (!groupedByConference[ac.conference_id]) {
        groupedByConference[ac.conference_id] = {
          conference_id: ac.conference_id,
          conference_nom: conference?.nom || 'Inconnu',
          conference: conference,
          annees: []
        }
      }
      
      groupedByConference[ac.conference_id].annees.push({
        id: ac.id,
        annee_id: ac.annee_id,
        annee_label: annee?.label,
        annee: annee,
        is_current: ac.is_current,
        created_at: ac.created_at
      })
    }
    
    return Object.values(groupedByConference)
  } catch (error) {
    console.error('Erreur getAllAnneesConferenceGrouped:', error)
    return []
  }
}


// Récupérer la conférence d'un utilisateur
export async function getUserConference(userId: string) {
  try {
    const { data: fidele } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse:paroisse_id (
          id,
          district:district_id (
            id,
            conference:conference_id (
              id,
              nom
            )
          )
        )
      `)
      .eq('user_id', userId)
      .single()

    // Les relations retournées par Supabase sont des tableaux
    // Même avec une relation one-to-one, c'est un tableau d'un élément
    if (fidele?.paroisse) {
      // Accéder au premier élément du tableau de paroisse
      const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
      
      if (paroisse?.district) {
        // Accéder au premier élément du tableau de district
        const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
        
        if (district?.conference) {
          // Accéder au premier élément du tableau de conference
          const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
          
          if (conference) {
            return {
              id: conference.id,
              nom: conference.nom
            }
          }
        }
      }
    }

    return null
  } catch (error) {
    console.error('Erreur getUserConference:', error)
    return null
  }
}



// Récupérer les fidèles d'une paroisse pour une année spécifique
export async function getFidelesByParoisseAndAnnee(paroisseId: number, anneeId?: number) {
  try {
    // Si aucune année n'est fournie, essayer de trouver une année valide
    if (!anneeId) {
      // Option 1: Essayer de récupérer via la conférence de la paroisse
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('district_id')
        .eq('id', paroisseId)
        .single()
      
      if (paroisse?.district_id) {
        const { data: district } = await supabase
          .from('district')
          .select('conference_id')
          .eq('id', paroisse.district_id)
          .single()
        
        if (district?.conference_id) {
          const currentAnnee = await getCurrentAnneeConference(district.conference_id)
          if (currentAnnee?.annee_id) {
            anneeId = currentAnnee.annee_id
          }
        }
      }

      // Option 2: Fallback - prendre la première année disponible
      if (!anneeId) {
        const { data: firstAnnee } = await supabase
          .from('annee_conference')
          .select('annee_id')
          .limit(1)
          .single()
        
        anneeId = firstAnnee?.annee_id
      }
    }

    if (!anneeId) {
      return []
    }

    // Récupérer les fidèles
    const { data: fideleParoisse, error } = await supabase
      .from('fidele_paroisse')
      .select(`
        fidele_id,
        annee_id,
        created_at,
        fidele:fidele_id (
          *,
          compte:compte!left (
            id,
            role_id,
            role:role_id (
              nom
            )
          )
        )
      `)
      .eq('paroisse_id', paroisseId)
      .eq('annee_id', anneeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des fidèles:', error)
      return []
    }

    const fideles = (fideleParoisse || [])
      .map(item => {
        const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
        if (!fidele) return null
        
        return {
          ...fidele,
          inscription_annee: item.annee_id,
          date_inscription_paroisse: item.created_at
        }
      })
      .filter(Boolean)

    return fideles
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return []
  }
}

// Récupérer toutes les années de conférence (pour compatibilité)
// export async function getAnneesConference() {
//   try {
//     const { data, error } = await supabase
//       .from('annee_conference')
//       .select(`
//         *,
//         annee:annee!annee_conference_annee_id_fkey (id, label),
//         conference:conference!annee_conference_conference_id_fkey (id, nom)
//       `)
//       .order('annee_id', { ascending: false })

//     if (error) throw error

//     const anneesAvecStatut = await Promise.all((data || []).map(async (ac: any) => {
//       const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
//       const conference = Array.isArray(ac.conference) ? ac.conference[0] : ac.conference
      
//       // Vérifier si conference_id existe avant d'appeler getCurrentAnneeConference
//       let currentForConference = null
//       if (ac.conference_id && typeof ac.conference_id === 'number') {
//         try {
//           currentForConference = await getCurrentAnneeConference(ac.conference_id)
//         } catch (err) {
//           console.error(`Erreur pour conference_id ${ac.conference_id}:`, err)
//           currentForConference = null
//         }
//       }
      
//       let status: 'current' | 'past' | 'future' = 'past'
//       if (ac.is_current) {
//         status = 'current'
//       } else if (currentForConference && ac.annee_id > currentForConference.annee_id) {
//         status = 'future'
//       }

//       return {
//         ...ac,
//         annee,
//         conference,
//         status
//       }
//     }))

//     return anneesAvecStatut
//   } catch (error) {
//     console.error('Erreur getAnneesConference:', error)
//     return []
//   }
// }

// Récupérer l'année en cours pour une conférence spécifique (avec validation)
export async function getCurrentAnneeConference(conferenceId: number) {
  // Validation du paramètre
  if (!conferenceId || typeof conferenceId !== 'number' || isNaN(conferenceId)) {
    console.warn('getCurrentAnneeConference: conferenceId invalide:', conferenceId)
    return null
  }

  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee!annee_conference_annee_id_fkey (id, label)
      `)
      .eq('conference_id', conferenceId)
      .eq('is_current', true)
      .maybeSingle()

    if (error) {
      if (error.code === '42P01') {
        console.log('La table annee_conference n\'existe pas encore')
        return null
      }
      console.error(`Erreur pour conference_id ${conferenceId}:`, error)
      return null
    }

    if (data) {
      return {
        ...data,
        annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
      }
    }

    // Si aucune année en cours n'est trouvée, on prend la plus récente
    const { data: latestData, error: latestError } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee!annee_conference_annee_id_fkey (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      console.error(`Erreur latest pour conference_id ${conferenceId}:`, latestError)
      return null
    }

    if (latestData) {
      return {
        ...latestData,
        annee: Array.isArray(latestData.annee) ? latestData.annee[0] : latestData.annee
      }
    }

    return null
  } catch (error) {
    console.error(`Erreur getCurrentAnneeConference pour conference_id ${conferenceId}:`, error)
    return null
  }
}






export async function getAnneesConferenceByConference(conferenceId: number) {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        *,
        annee:annee!annee_conference_annee_id_fkey (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) throw error

    const anneesAvecStatut = (data || []).map((ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      
      return {
        id: ac.id,
        annee_id: ac.annee_id,
        conference_id: ac.conference_id,
        is_current: ac.is_current,
        created_at: ac.created_at,
        updated_at: ac.updated_at,
        annee: annee,
        label: annee?.label || `Année ${ac.annee_id}` // Fallback
      }
    })

    return anneesAvecStatut
  } catch (error) {
    console.error('Erreur getAnneesConference:', error)
    return []
  }
}


// actions/annee-conference.ts - Ajouter cette fonction

// Récupérer la conférence d'un fidèle
export async function getConferenceByFideleId(fideleId: number) {
  try {
    console.log('getConferenceByFideleId - fideleId:', fideleId)
    
    const { data: fidele, error } = await supabase
      .from('fidele')
      .select(`
        paroisse:paroisse_id (
          district:district_id (
            conference:conference_id (
              id,
              nom
            )
          )
        )
      `)
      .eq('id', fideleId)
      .single()

    if (error) {
      console.error('Erreur lors de la récupération du fidèle:', error)
      return null
    }

    if (!fidele?.paroisse) {
      console.log('Aucune paroisse trouvée pour ce fidèle')
      return null
    }

    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    
    if (!paroisse?.district) {
      console.log('Aucun district trouvé pour cette paroisse')
      return null
    }

    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    
    if (!district?.conference) {
      console.log('Aucune conférence trouvée pour ce district')
      return null
    }

    const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference

    console.log('Conférence trouvée:', conference)

    return {
      id: conference.id,
      nom: conference.nom
    }
  } catch (error) {
    console.error('Erreur inattendue getConferenceByFideleId:', error)
    return null
  }
}


























// Récupérer les années disponibles pour une paroisse spécifique
export async function getAnneesDisponiblesForParoisse(paroisseId: number) {
  try {
    // 1. Récupérer la conférence de la paroisse
    const conferenceId = await getConferenceIdByParoisse(paroisseId)
    
    if (!conferenceId) {
      // Fallback: retourner toutes les années
      const { data, error } = await supabase
        .from('annee')
        .select('id, label')
        .order('label', { ascending: false })

      if (error) throw error

      return (data || []).map(annee => ({
        id: annee.id,
        annee_id: annee.id,
        label: annee.label,
        is_current: false
      }))
    }

    // 2. Récupérer les années de cette conférence
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) throw error

    return (data || []).map((ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      return {
        id: ac.id,
        annee_id: ac.annee_id,
        label: annee?.label || `Année ${ac.annee_id}`,
        is_current: ac.is_current
      }
    })
  } catch (error) {
    console.error('Erreur getAnneesDisponiblesForParoisse:', error)
    return []
  }
}



// actions/structures.ts - Ajouter cette fonction
export async function getDistricts(conferenceId?: number) {
  try {
    let query = supabase
      .from('district')
      .select('id, nom, conference_id')
      .order('nom', { ascending: true })

    if (conferenceId) {
      query = query.eq('conference_id', conferenceId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getDistricts:', error)
    return []
  }
}

// Helper pour récupérer la conférence d'une paroisse
export async function getConferenceIdByParoisse(paroisseId: number): Promise<number | null> {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select('district:district_id(conference:conference_id(id))')
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
    console.error('Erreur getConferenceIdByParoisse:', error)
    return null
  }
}


// actions/annee-conference.ts
// Ajouter cette fonction après getAnneesByConference

/**
 * Récupérer les années de conférence (avec option de filtre par conférence)
 * @param conferenceId - Optionnel : ID de la conférence pour filtrer
 * @returns Liste des années de conférence
 */
export async function getAnneesConference(conferenceId?: number): Promise<AnneeConference[]> {
  try {
    let query = supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        conference_id,
        is_current,
        created_at,
        updated_at,
        annee:annee_id (id, label),
        conference:conference_id (id, nom)
      `)
      .order('annee_id', { ascending: false })

    // Filtrer par conférence si spécifié
    if (conferenceId) {
      query = query.eq('conference_id', conferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur getAnneesConference:', error)
      return []
    }

    // Récupérer l'année en cours pour chaque conférence (pour le statut)
    const anneesAvecStatut = await Promise.all((data || []).map(async (ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      const conference = Array.isArray(ac.conference) ? ac.conference[0] : ac.conference
      
      let status: 'current' | 'past' | 'future' = 'past'
      
      if (ac.is_current) {
        status = 'current'
      } else if (ac.conference_id) {
        // Récupérer l'année en cours pour cette conférence
        const current = await getCurrentAnneeConference(ac.conference_id)
        if (current && ac.annee_id > current.annee_id) {
          status = 'future'
        }
      }

      return {
        id: ac.id,
        annee_id: ac.annee_id,
        conference_id: ac.conference_id,
        is_current: ac.is_current,
        created_at: ac.created_at,
        updated_at: ac.updated_at,
        annee: annee,
        conference: conference,
        label: annee?.label || `Année ${ac.annee_id}`,
        status
      }
    }))

    return anneesAvecStatut
  } catch (error) {
    console.error('Erreur getAnneesConference:', error)
    return []
  }
}

// actions/annee-conference.ts - AJOUTER CETTE FONCTION

/**
 * Récupérer l'année de conférence en cours pour une paroisse spécifique
 * @param paroisseId - ID de la paroisse
 * @returns L'année de conférence en cours ou null
 */
export async function getCurrentAnneeConferenceForParoisse(paroisseId: number) {
  try {
    console.log('🔍 Récupération année en cours pour la paroisse:', paroisseId)
    
    // 1. Récupérer la conférence de la paroisse
    const conferenceId = await getConferenceIdByParoisse(paroisseId)
    
    if (!conferenceId) {
      console.log('❌ Aucune conférence trouvée pour la paroisse:', paroisseId)
      return null
    }
    
    console.log('✅ Conférence ID:', conferenceId)
    
    // 2. Récupérer l'année en cours pour cette conférence
    const currentAnnee = await getCurrentAnneeConference(conferenceId)
    
    if (currentAnnee) {
      console.log('✅ Année en cours:', currentAnnee.annee?.label || currentAnnee.annee_id)
    } else {
      console.log('⚠️ Aucune année en cours pour cette conférence')
    }
    
    return currentAnnee
    
  } catch (error) {
    console.error('❌ Erreur getCurrentAnneeConferenceForParoisse:', error)
    return null
  }
}