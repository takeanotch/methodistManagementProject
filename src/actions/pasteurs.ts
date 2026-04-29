
// actions/pasteurs.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getCurrentAnneeConferenceGlobal } from './annee-conference'

export type EtudePasteur = 'master' | 'licence' | 'phd' | 'autre'

export interface Pasteur {
  id: number
  fidele_id: number
  etude: EtudePasteur
  est_actif: boolean
  created_at: string
  updated_at: string
  fidele?: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img: string | null
    adresse: string | null
  }
}

export interface AffectationPasteur {
  id: number
  paroisse_id: number
  pasteur_id: number
  annee_conference_id: number | null
  date_entree: string
  mandat_annees: number
  date_sortie: string
  active: boolean
  created_at: string
  updated_at: string
  paroisse?: {
    id: number
    nom: string
    district?: {
      id: number
      nom: string
    }
  }
  annee_conference?: {
    id: number
    annee_id: number
    annee?: {
      id: number
      label: string
    }
  }
  pasteur?: Pasteur & { fidele?: any }
}

// Récupérer tous les pasteurs
export async function getPasteurs(actifsSeulement: boolean = true) {
  let query = supabase
    .from('pasteur')
    .select(`
      *,
      fidele:fidele_id (
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img,
        adresse
      )
    `)
    .order('created_at', { ascending: false })

  if (actifsSeulement) {
    query = query.eq('est_actif', true)
  }

  const { data: pasteurs, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des pasteurs:', error)
    return []
  }

  return pasteurs
}

// Récupérer un pasteur par son ID
export async function getPasteurById(id: number) {
  const { data: pasteur, error } = await supabase
    .from('pasteur')
    .select(`
      *,
      fidele:fidele_id (
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img,
        adresse
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération du pasteur:', error)
    return null
  }

  return pasteur
}

// Récupérer les affectations d'un pasteur
export async function getAffectationsPasteur(pasteurId: number) {
  const { data, error } = await supabase
    .from('paroisse_pasteur')
    .select(`
      *,
      paroisse:paroisse_id (
        id,
        nom,
        district:district_id (
          id,
          nom
        )
      ),
      annee_conference:annee_conference_id (
        id,
        annee_id,
        annee:annee_id (
          id,
          label
        )
      )
    `)
    .eq('pasteur_id', pasteurId)
    .order('date_entree', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des affectations:', error)
    return []
  }

  return data
}

// Récupérer tous les pasteurs d'une paroisse
export async function getPasteursByParoisse(paroisseId: number) {
  const { data: affectations, error } = await supabase
    .from('paroisse_pasteur')
    .select(`
      *,
      pasteur:pasteur_id (
        id,
        etude,
        est_actif,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img
        )
      )
    `)
    .eq('paroisse_id', paroisseId)
    .order('date_entree', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des pasteurs de la paroisse:', error)
    return []
  }

  return affectations
}

// Créer un pasteur à partir d'un fidèle (sans affectation)
export async function createPasteur(formData: FormData) {
  const fidele_id = parseInt(formData.get('fidele_id') as string)
  const etude = formData.get('etude') as EtudePasteur

  if (!fidele_id) {
    return { error: 'Le fidèle est requis' }
  }

  if (!etude) {
    return { error: "Le niveau d'étude est requis" }
  }

  // Vérifier si le fidèle est déjà pasteur
  const { data: existing } = await supabase
    .from('pasteur')
    .select('id')
    .eq('fidele_id', fidele_id)
    .single()

  if (existing) {
    return { error: 'Ce fidèle est déjà enregistré comme pasteur' }
  }

  const { data: newPasteur, error } = await supabase
    .from('pasteur')
    .insert([{
      fidele_id,
      etude
    }])
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la création du pasteur:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/admin/pasteurs')
  revalidatePath('/conference/pasteurs')
  revalidatePath(`/admin/fideles/${fidele_id}`)
  return { success: true, pasteur: newPasteur }
}

// Créer un pasteur avec affectation directe
export async function createPasteurWithAffectation(formData: FormData) {
  try {
    const fidele_id = parseInt(formData.get('fidele_id') as string)
    const etude = formData.get('etude') as EtudePasteur
    const paroisse_id = parseInt(formData.get('paroisse_id') as string)
    const date_entree = formData.get('date_entree') as string || new Date().toISOString().split('T')[0]
    const mandat_annees = parseInt(formData.get('mandat_annees') as string) || 3

    if (!fidele_id) {
      return { error: 'Le fidèle est requis' }
    }
    if (!etude) {
      return { error: "Le niveau d'étude est requis" }
    }
    if (!paroisse_id) {
      return { error: 'La paroisse est requise pour l\'affectation' }
    }

    // Vérifier si le fidèle est déjà pasteur
    const { data: existing } = await supabase
      .from('pasteur')
      .select('id')
      .eq('fidele_id', fidele_id)
      .single()

    if (existing) {
      return { error: 'Ce fidèle est déjà enregistré comme pasteur' }
    }

    // Récupérer l'année de conférence en cours
    const currentAnnee = await getCurrentAnneeConferenceGlobal()
    const annee_conference_id = currentAnnee?.id || null

    // Créer le pasteur
    const { data: newPasteur, error: pasteurError } = await supabase
      .from('pasteur')
      .insert([{ fidele_id, etude }])
      .select()
      .single()

    if (pasteurError) throw pasteurError

    // Calculer la date de sortie
    const dateSortieObj = new Date(date_entree)
    dateSortieObj.setFullYear(dateSortieObj.getFullYear() + mandat_annees)
    dateSortieObj.setDate(dateSortieObj.getDate() - 1)
    const date_sortie = dateSortieObj.toISOString().split('T')[0]

    // Créer l'affectation
    const { error: affectationError } = await supabase
      .from('paroisse_pasteur')
      .insert([{
        pasteur_id: newPasteur.id,
        paroisse_id,
        annee_conference_id,
        date_entree,
        date_sortie,
        mandat_annees,
        active: true
      }])

    if (affectationError) throw affectationError

    revalidatePath('/admin/pasteurs')
    revalidatePath('/conference/pasteurs')
    return { success: true, pasteur: newPasteur }
    
  } catch (error) {
    console.error('Erreur createPasteurWithAffectation:', error)
    return { error: 'Erreur lors de la création du pasteur' }
  }
}

// Mettre à jour un pasteur
export async function updatePasteur(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string)
    const etude = formData.get('etude') as EtudePasteur
    const est_actif = formData.get('est_actif') === 'on'

    if (!id || isNaN(id)) {
      return { error: 'ID du pasteur invalide' }
    }

    if (!etude) {
      return { error: "Le niveau d'étude est requis" }
    }

    // Vérifier que l'étude est valide
    const etudesValides = ['master', 'licence', 'phd', 'autre']
    if (!etudesValides.includes(etude)) {
      return { error: "Niveau d'étude invalide" }
    }

    const { error } = await supabase
      .from('pasteur')
      .update({
        etude,
        est_actif,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erreur Supabase:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath('/admin/pasteurs')
    revalidatePath('/conference/pasteurs')
    revalidatePath(`/admin/pasteurs/${id}`)
    return { success: true }
    
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}

// Affecter un pasteur à une paroisse
export async function affecterPasteur(formData: FormData) {
  try {
    const pasteur_id = parseInt(formData.get('pasteur_id') as string)
    const paroisse_id = parseInt(formData.get('paroisse_id') as string)
    const date_entree = formData.get('date_entree') as string
    const mandat_annees = parseInt(formData.get('mandat_annees') as string) || 3

    if (!pasteur_id || !paroisse_id) {
      return { error: 'Pasteur et paroisse requis' }
    }

    // Récupérer l'année de conférence en cours
    const currentAnnee = await getCurrentAnneeConferenceGlobal()
    const annee_conference_id = currentAnnee?.id || null

    const dateEntree = date_entree || new Date().toISOString().split('T')[0]

    // Calculer la date de sortie
    const dateSortieObj = new Date(dateEntree)
    dateSortieObj.setFullYear(dateSortieObj.getFullYear() + mandat_annees)
    dateSortieObj.setDate(dateSortieObj.getDate() - 1)
    const date_sortie = dateSortieObj.toISOString().split('T')[0]

    // Désactiver toute affectation active existante
    await supabase
      .from('paroisse_pasteur')
      .update({ active: false })
      .eq('pasteur_id', pasteur_id)
      .eq('active', true)

    // Créer la nouvelle affectation
    const { data: newAffectation, error } = await supabase
      .from('paroisse_pasteur')
      .insert([{
        pasteur_id,
        paroisse_id,
        annee_conference_id,
        date_entree: dateEntree,
        date_sortie,
        mandat_annees,
        active: true
      }])
      .select(`
        *,
        paroisse:paroisse_id (
          id,
          nom,
          district:district_id (
            id,
            nom
          )
        )
      `)
      .single()

    if (error) throw error

    revalidatePath('/admin/pasteurs')
    revalidatePath('/conference/pasteurs')
    revalidatePath(`/admin/pasteurs/${pasteur_id}`)
    
    return { success: true, affectation: newAffectation }
    
  } catch (error) {
    console.error('Erreur affecterPasteur:', error)
    return { error: 'Erreur lors de l\'affectation' }
  }
}

// Réaffecter un pasteur
export async function reaffecterPasteur(formData: FormData) {
  try {
    const pasteur_id = parseInt(formData.get('pasteur_id') as string)
    const paroisse_id = parseInt(formData.get('paroisse_id') as string)
    const date_fin_actuelle = formData.get('date_fin_actuelle') as string
    const date_entree = formData.get('date_entree') as string
    const mandat_annees = parseInt(formData.get('mandat_annees') as string) || 3
    const motif = formData.get('motif') as string || 'Réaffectation'

    if (!pasteur_id || !paroisse_id || !date_entree) {
      return { error: 'Tous les champs requis ne sont pas remplis' }
    }

    // Récupérer l'année de conférence en cours
    const currentAnnee = await getCurrentAnneeConferenceGlobal()
    const annee_conference_id = currentAnnee?.id || null

    // Récupérer l'affectation active
    const { data: affectationActive, error: fetchError } = await supabase
      .from('paroisse_pasteur')
      .select(`
        *,
        paroisse:paroisse_id (
          id,
          nom,
          district:district_id (
            id,
            nom
          )
        )
      `)
      .eq('pasteur_id', pasteur_id)
      .eq('active', true)
      .maybeSingle()

    if (fetchError) throw fetchError

    // Si une affectation active existe, la désactiver
    if (affectationActive) {
      if (!date_fin_actuelle) {
        return { error: 'La date de fin de l\'affectation actuelle est requise' }
      }

      if (new Date(date_fin_actuelle) > new Date(date_entree)) {
        return { error: 'La date de fin doit être antérieure ou égale à la date d\'entrée' }
      }

      await supabase
        .from('paroisse_pasteur')
        .update({
          date_sortie: date_fin_actuelle,
          active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', affectationActive.id)
    }

    // Calculer la date de sortie de la nouvelle affectation
    const dateSortieObj = new Date(date_entree)
    dateSortieObj.setFullYear(dateSortieObj.getFullYear() + mandat_annees)
    dateSortieObj.setDate(dateSortieObj.getDate() - 1)
    const date_sortie = dateSortieObj.toISOString().split('T')[0]

    // Créer la nouvelle affectation
    const { data: newAffectation, error: insertError } = await supabase
      .from('paroisse_pasteur')
      .insert([{
        pasteur_id,
        paroisse_id,
        annee_conference_id,
        date_entree,
        date_sortie,
        mandat_annees,
        active: true
      }])
      .select(`
        *,
        paroisse:paroisse_id (
          id,
          nom,
          district:district_id (
            id,
            nom
          )
        )
      `)
      .single()

    if (insertError) throw insertError

    revalidatePath('/admin/pasteurs')
    revalidatePath('/conference/pasteurs')
    revalidatePath(`/admin/pasteurs/${pasteur_id}`)
    
    return { 
      success: true, 
      affectation: newAffectation,
      ancienne_affectation_terminee: !!affectationActive
    }
    
  } catch (error) {
    console.error('Erreur reaffecterPasteur:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Récupérer les fidèles éligibles (non pasteurs)
export async function getFidelesEligiblesPasteur() {
  // Récupérer les IDs des fidèles qui sont déjà pasteurs
  const { data: pasteurs } = await supabase
    .from('pasteur')
    .select('fidele_id')

  const idsPasteurs = pasteurs?.map(p => p.fidele_id) || []

  let query = supabase
    .from('fidele')
    .select('id, nom, post_nom, prenom, contact, profile_img, adresse')
    .order('nom', { ascending: true })

  // Exclure les fidèles qui sont déjà pasteurs
  if (idsPasteurs.length > 0) {
    query = query.not('id', 'in', `(${idsPasteurs.join(',')})`)
  }

  const { data: fideles, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des fidèles:', error)
    return []
  }

  return fideles
}

// Supprimer un pasteur
export async function deletePasteur(id: number) {
  // Vérifier si le pasteur a des affectations
  const { data: affectations, error: checkError } = await supabase
    .from('paroisse_pasteur')
    .select('id')
    .eq('pasteur_id', id)

  if (checkError) {
    console.error('Erreur lors de la vérification des affectations:', checkError)
    return { error: 'Erreur lors de la vérification des affectations' }
  }

  if (affectations && affectations.length > 0) {
    return { error: 'Impossible de supprimer : ce pasteur a des affectations' }
  }

  const { error } = await supabase
    .from('pasteur')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression du pasteur:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/admin/pasteurs')
  revalidatePath('/conference/pasteurs')
  return { success: true }
}

// Récupérer tous les pasteurs avec leur affectation actuelle
export async function getPasteursWithCurrentAffectation(actifsSeulement: boolean = true) {
  try {
    // Récupérer tous les pasteurs
    let query = supabase
      .from('pasteur')
      .select(`
        *,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          adresse
        )
      `)
      .order('created_at', { ascending: false })

    if (actifsSeulement) {
      query = query.eq('est_actif', true)
    }

    const { data: pasteurs, error: pasteursError } = await query

    if (pasteursError) {
      console.error('Erreur lors de la récupération des pasteurs:', pasteursError)
      return []
    }

    // Pour chaque pasteur, récupérer son affectation active
    const pasteursWithAffectation = await Promise.all(
      pasteurs.map(async (pasteur) => {
        const { data: affectation } = await supabase
          .from('paroisse_pasteur')
          .select(`
            *,
            paroisse:paroisse_id (
              id,
              nom,
              district:district_id (
                id,
                nom
              )
            )
          `)
          .eq('pasteur_id', pasteur.id)
          .eq('active', true)
          .maybeSingle()

        return {
          ...pasteur,
          affectation_actuelle: affectation || null
        }
      })
    )

    return pasteursWithAffectation
  } catch (error) {
    console.error('Erreur:', error)
    return []
  }
}

// Récupérer l'historique complet d'un pasteur
export async function getHistoriqueCompletPasteur(pasteurId: number) {
  const { data: historique, error } = await supabase
    .from('paroisse_pasteur')
    .select(`
      *,
      paroisse:paroisse_id (
        id,
        nom,
        district:district_id (
          id,
          nom
        )
      ),
      annee_conference:annee_conference_id (
        id,
        annee_id,
        annee:annee_id (
          id,
          label
        )
      )
    `)
    .eq('pasteur_id', pasteurId)
    .order('date_entree', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return []
  }

  return historique
}

// Vérifier si un pasteur est actuellement affecté
export async function checkPasteurAffecte(pasteurId: number) {
  const { data: affectation, error } = await supabase
    .from('paroisse_pasteur')
    .select('id, paroisse_id, date_sortie, active')
    .eq('pasteur_id', pasteurId)
    .eq('active', true)
    .maybeSingle()

  if (error) {
    console.error('Erreur lors de la vérification:', error)
    return null
  }

  return affectation
}

// Récupérer les affectations par année de conférence
export async function getAffectationsByAnnee(anneeId: number, conferenceId: number | null = null) {
  try {
    let query = supabase
      .from('paroisse_pasteur')
      .select(`
        *,
        pasteur:pasteur_id (
          id,
          etude,
          est_actif,
          fidele:fidele_id (
            id,
            nom,
            post_nom,
            prenom,
            contact,
            profile_img,
            adresse
          )
        ),
        paroisse:paroisse_id (
          id,
          nom,
          district:district_id (
            id,
            nom,
            conference:conference_id (
              id,
              nom
            )
          )
        )
      `)
      .eq('annee_conference.annee_id', anneeId)

    if (conferenceId) {
      query = query.eq('paroisse.district.conference_id', conferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des affectations par année:', error)
      return []
    }

    // Transformer les données
    const transformedData = (data || []).map((item: any) => ({
      ...item,
      pasteur: item.pasteur ? (Array.isArray(item.pasteur) ? item.pasteur[0] : item.pasteur) : null,
      paroisse: item.paroisse ? (Array.isArray(item.paroisse) ? item.paroisse[0] : item.paroisse) : null
    }))

    return transformedData
  } catch (error) {
    console.error('Erreur inattendue getAffectationsByAnnee:', error)
    return []
  }
}

// actions/pasteurs.ts - Remplacer la fonction getPasteursByAnneeConference

// Récupérer les pasteurs par année de conférence
// actions/pasteurs.ts - Version corrigée de getPasteursByAnneeConference

// Récupérer les pasteurs par année de conférence
// export async function getPasteursByAnneeConference(anneeId: number, conferenceId: number | null = null) {
//   try {
//     console.log('getPasteursByAnneeConference - anneeId:', anneeId, 'conferenceId:', conferenceId)
    
//     // Étape 1: Récupérer les annee_conference_id pour l'année donnée
//     let queryAC = supabase
//       .from('annee_conference')
//       .select('id')
//       .eq('annee_id', anneeId)
    
//     if (conferenceId) {
//       queryAC = queryAC.eq('conference_id', conferenceId)
//     }
    
//     const { data: anneeConferences, error: acError } = await queryAC
    
//     if (acError) {
//       console.error('Erreur récupération annee_conference:', acError)
//       return []
//     }
    
//     if (!anneeConferences || anneeConferences.length === 0) {
//       console.log('Aucune annee_conference trouvée pour anneeId:', anneeId)
//       return []
//     }
    
//     const anneeConferenceIds = anneeConferences.map(ac => ac.id)
//     console.log('anneeConferenceIds trouvés:', anneeConferenceIds)
    
//     // Étape 2: Récupérer les affectations pour ces années de conférence
//     const { data: affectations, error } = await supabase
//       .from('paroisse_pasteur')
//       .select(`
//         pasteur_id,
//         annee_conference_id
//       `)
//       .in('annee_conference_id', anneeConferenceIds)
//       .eq('active', true)

//     if (error) {
//       console.error('Erreur lors de la récupération des affectations:', error)
//       return []
//     }

//     console.log('Affectations trouvées:', affectations?.length || 0)

//     if (!affectations || affectations.length === 0) {
//       return []
//     }

//     // Extraire les pasteur_ids uniques
//     const pasteurIds = [...new Set(affectations.map(a => a.pasteur_id))]
//     console.log('Pasteur IDs uniques:', pasteurIds)

//     // Étape 3: Récupérer les pasteurs avec leurs informations
//     const { data: pasteurs, error: pasteursError } = await supabase
//       .from('pasteur')
//       .select(`
//         id,
//         etude,
//         est_actif,
//         fidele:fidele_id (
//           id,
//           nom,
//           post_nom,
//           prenom,
//           contact,
//           profile_img,
//           adresse
//         )
//       `)
//       .in('id', pasteurIds)
//       .eq('est_actif', true)

//     if (pasteursError) {
//       console.error('Erreur lors de la récupération des pasteurs:', pasteursError)
//       return []
//     }

//     if (!pasteurs || pasteurs.length === 0) {
//       return []
//     }

//     // Transformer les données pour avoir le bon format
//     const result = pasteurs.map((pasteur: any) => {
//       // Extraire le fidèle du tableau si nécessaire
//       let fideleData = pasteur.fidele
//       if (Array.isArray(fideleData)) {
//         fideleData = fideleData[0]
//       }
      
//       return {
//         id: pasteur.id,
//         etude: pasteur.etude,
//         est_actif: pasteur.est_actif,
//         created_at: pasteur.created_at,
//         updated_at: pasteur.updated_at,
//         fidele: fideleData
//       }
//     })

//     console.log('Pasteurs trouvés:', result.length)
//     return result
    
//   } catch (error) {
//     console.error('Erreur inattendue getPasteursByAnneeConference:', error)
//     return []
//   }
// }



// actions/pasteurs.ts - Ajouter cette fonction

// Récupérer les pasteurs par ID d'année de conférence (direct)
export async function getPasteursByAnneeConferenceId(anneeConferenceId: number, conferenceId: number | null = null) {
  try {
    console.log('getPasteursByAnneeConferenceId - anneeConferenceId:', anneeConferenceId, 'conferenceId:', conferenceId)
    
    // Étape 1: Récupérer les affectations actives pour cette année de conférence
    let query = supabase
      .from('paroisse_pasteur')
      .select(`
        id,
        pasteur_id,
        paroisse_id,
        annee_conference_id,
        date_entree,
        date_sortie,
        mandat_annees,
        active,
        paroisse:paroisse_id (
          id,
          nom,
          district:district_id (
            id,
            nom,
            conference_id
          )
        )
      `)
      .eq('annee_conference_id', anneeConferenceId)
      .eq('active', true)

    // Filtrer par conférence si spécifiée
    if (conferenceId) {
      query = query.eq('paroisse.district.conference_id', conferenceId)
    }

    const { data: affectations, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des affectations:', error)
      return []
    }

    console.log('Affectations trouvées:', affectations?.length || 0)

    if (!affectations || affectations.length === 0) {
      return []
    }

    // Extraire les pasteur_ids uniques
    const pasteurIds = [...new Set(affectations.map(a => a.pasteur_id))]
    console.log('Pasteur IDs uniques:', pasteurIds)

    // Étape 2: Récupérer les pasteurs avec leurs informations
    const { data: pasteurs, error: pasteursError } = await supabase
      .from('pasteur')
      .select(`
        id,
        fidele_id,
        etude,
        est_actif,
        created_at,
        updated_at,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          adresse
        )
      `)
      .in('id', pasteurIds)
      .eq('est_actif', true)

    if (pasteursError) {
      console.error('Erreur lors de la récupération des pasteurs:', pasteursError)
      return []
    }

    if (!pasteurs || pasteurs.length === 0) {
      return []
    }

    // Transformer les données et ajouter l'affectation correspondante pour cette année
    const result = pasteurs.map((pasteur: any) => {
      // Extraire le fidèle du tableau si nécessaire
      let fideleData = pasteur.fidele
      if (Array.isArray(fideleData)) {
        fideleData = fideleData[0]
      }
      
      // Trouver l'affectation correspondante pour ce pasteur dans cette année
      const affectation = affectations.find(a => a.pasteur_id === pasteur.id)
      
      return {
        id: pasteur.id,
        fidele_id: pasteur.fidele_id,
        etude: pasteur.etude,
        est_actif: pasteur.est_actif,
        created_at: pasteur.created_at,
        updated_at: pasteur.updated_at,
        fidele: fideleData,
        // Ajouter l'affectation pour cette année spécifique
        affectation_pour_annee: affectation ? {
          id: affectation.id,
          paroisse_id: affectation.paroisse_id,
          annee_conference_id: affectation.annee_conference_id,
          date_entree: affectation.date_entree,
          date_sortie: affectation.date_sortie,
          mandat_annees: affectation.mandat_annees,
          active: affectation.active,
          paroisse: Array.isArray(affectation.paroisse) ? affectation.paroisse[0] : affectation.paroisse
        } : null
      }
    })

    console.log('Pasteurs trouvés avec affectations:', result.length)
    return result
    
  } catch (error) {
    console.error('Erreur inattendue getPasteursByAnneeConferenceId:', error)
    return []
  }
}



// actions/pasteurs.ts - Ajouter ces fonctions

// Récupérer les districts d'une conférence
export async function getDistrictsByConference(conferenceId: number) {
  try {
    const { data, error } = await supabase
      .from('district')
      .select('id, nom')
      .eq('conference_id', conferenceId)
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getDistrictsByConference:', error)
    return []
  }
}

// Récupérer les pasteurs avec filtres
export async function getPasteursWithFilters(
  anneeConferenceId: number | null,
  conferenceId: number | null,
  filters: { districtId?: string; paroisseId?: string }
) {
  try {
    if (!anneeConferenceId) {
      return []
    }

    let query = supabase
      .from('paroisse_pasteur')
      .select(`
        id,
        pasteur_id,
        paroisse_id,
        annee_conference_id,
        date_entree,
        date_sortie,
        mandat_annees,
        active,
        paroisse:paroisse_id (
          id,
          nom,
          district:district_id (
            id,
            nom,
            conference_id
          )
        )
      `)
      .eq('annee_conference_id', anneeConferenceId)
      .eq('active', true)

    // Filtrer par conférence
    if (conferenceId) {
      query = query.eq('paroisse.district.conference_id', conferenceId)
    }

    // Filtrer par district
    if (filters.districtId) {
      query = query.eq('paroisse.district.id', parseInt(filters.districtId))
    }

    // Filtrer par paroisse
    if (filters.paroisseId) {
      query = query.eq('paroisse_id', parseInt(filters.paroisseId))
    }

    const { data: affectations, error } = await query

    if (error) {
      console.error('Erreur récupération affectations avec filtres:', error)
      return []
    }

    if (!affectations || affectations.length === 0) {
      return []
    }

    // Extraire les pasteur_ids uniques
    const pasteurIds = [...new Set(affectations.map(a => a.pasteur_id))]

    // Récupérer les pasteurs
    const { data: pasteurs, error: pasteursError } = await supabase
      .from('pasteur')
      .select(`
        id,
        fidele_id,
        etude,
        est_actif,
        created_at,
        updated_at,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          adresse
        )
      `)
      .in('id', pasteurIds)
      .eq('est_actif', true)
      .order('created_at', { ascending: false })

    if (pasteursError) {
      console.error('Erreur récupération pasteurs:', pasteursError)
      return []
    }

    // Assembler les données
    const result = pasteurs.map((pasteur: any) => {
      let fideleData = pasteur.fidele
      if (Array.isArray(fideleData)) {
        fideleData = fideleData[0]
      }
      
      const affectation = affectations.find(a => a.pasteur_id === pasteur.id)
      
      return {
        id: pasteur.id,
        fidele_id: pasteur.fidele_id,
        etude: pasteur.etude,
        est_actif: pasteur.est_actif,
        created_at: pasteur.created_at,
        updated_at: pasteur.updated_at,
        fidele: fideleData,
        affectation_pour_annee: affectation ? {
          id: affectation.id,
          paroisse_id: affectation.paroisse_id,
          annee_conference_id: affectation.annee_conference_id,
          date_entree: affectation.date_entree,
          date_sortie: affectation.date_sortie,
          mandat_annees: affectation.mandat_annees,
          active: affectation.active,
          paroisse: Array.isArray(affectation.paroisse) ? affectation.paroisse[0] : affectation.paroisse
        } : null
      }
    })

    return result
  } catch (error) {
    console.error('Erreur getPasteursWithFilters:', error)
    return []
  }
}






// actions/pasteurs.ts

// ... (tout le code existant reste inchangé)

// ✅ AJOUTER CETTE FONCTION
// Récupérer un pasteur par l'ID du fidèle
export async function getPasteurByFideleId(fideleId: number) {
  try {
    const { data: pasteur, error } = await supabase
      .from('pasteur')
      .select(`
        *,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          adresse
        )
      `)
      .eq('fidele_id', fideleId)
      .maybeSingle()  // ✅ Utiliser maybeSingle() au lieu de single() pour éviter l'erreur

    if (error) {
      // Si l'erreur est "No rows found", ce n'est pas vraiment une erreur
      if (error.code === 'PGRST116') {
        return null
      }
      console.error('Erreur lors de la récupération du pasteur par fidele_id:', error)
      return null
    }

    return pasteur
  } catch (error) {
    console.error('Erreur inattendue dans getPasteurByFideleId:', error)
    return null
  }
}