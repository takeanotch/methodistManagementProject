
// actions/transfert.ts - Version corrigée
'use server'

import { supabase } from '@/lib/supabase'
import { getCurrentAnneeConference } from './annee-conference'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth' // Importer getUser depuis auth

// Récupérer tous les transferts
export async function getTransferts() {
  try {
    // Récupérer d'abord les transferts sans les relations complexes
    const { data: transferts, error } = await supabase
      .from('transfert_fidele')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des transferts:', error)
      return []
    }

    if (!transferts || transferts.length === 0) {
      return []
    }

    // Ensuite, récupérer les données liées séparément
    const transfertsComplets = await Promise.all(
      transferts.map(async (transfert) => {
        // Récupérer le fidèle
        const { data: fidele } = await supabase
          .from('fidele')
          .select('id, nom, post_nom, prenom, profile_img')
          .eq('id', transfert.fidele_id)
          .single()

        // Récupérer la paroisse source
        const { data: source } = await supabase
          .from('paroisse')
          .select('id, nom')
          .eq('id', transfert.paroisse_source_id)
          .single()

        // Récupérer la paroisse destination
        const { data: destination } = await supabase
          .from('paroisse')
          .select('id, nom')
          .eq('id', transfert.paroisse_destination_id)
          .single()

        // Récupérer l'année de conférence (via annee_id)
        const { data: anneeConference } = await supabase
          .from('annee_conference')
          .select(`
            id,
            annee:annee_id (id, label)
          `)
          .eq('id', transfert.annee_id)
          .single()

        // Récupérer l'auteur
        const { data: auteur } = await supabase
          .from('compte')
          .select('nom_complet')
          .eq('id', transfert.created_by)
          .maybeSingle()

        return {
          ...transfert,
          fidele,
          source,
          destination,
          annee_conference: anneeConference,
          auteur
        }
      })
    )

    return transfertsComplets
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return []
  }
}

// Récupérer les fidèles pour le transfert
export async function getFidelesForTransfert() {
  try {
    const { data: fideles, error } = await supabase
      .from('fidele')
      .select(`
        *,
        paroisse:paroisse_id (
          id, 
          nom
        )
      `)
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des fidèles:', error)
      return []
    }

    return fideles
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return []
  }
}

// Récupérer les paroisses
export async function getParoisses() {
  try {
    const { data: paroisses, error } = await supabase
      .from('paroisse')
      .select(`
        *,
        district:district_id (
          nom
        )
      `)
      .order('nom', { ascending: true })

    if (error) {
      console.error('Erreur lors de la récupération des paroisses:', error)
      return []
    }

    return paroisses
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return []
  }
}


// actions/fidele.ts
// Ajoutez cette fonction utilitaire pour récupérer la conférence d'une paroisse
// async function getConferenceIdByParoisse(paroisseId: number) {
//   const { data: paroisse } = await supabase
//     .from('paroisse')
//     .select('district:district_id(conference:conference_id(id))')
//     .eq('id', paroisseId)
//     .single()
  
//   return paroisse?.district?.conference?.id || null
// }

async function getConferenceIdByParoisse(paroisseId: number) {
  const { data: paroisse } = await supabase
    .from('paroisse')
    .select('district:district_id(conference:conference_id(id))')
    .eq('id', paroisseId)
    .single()
  
  // Extraire la conférence correctement en gérant les tableaux
  if (paroisse?.district) {
    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    if (district?.conference) {
      const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
      return conference?.id || null
    }
  }
  
  return null
}

// Corrigez getFidelesByParoisseAndAnnee
export async function getFidelesByParoisseAndAnnee(paroisseId: number, anneeId?: number) {
  try {
    // Si aucune année n'est fournie, récupérer l'année en cours pour cette paroisse
    if (!anneeId) {
      const conferenceId = await getConferenceIdByParoisse(paroisseId)
      
      if (conferenceId) {
        const currentAnnee = await getCurrentAnneeConference(conferenceId)
        if (currentAnnee) {
          anneeId = currentAnnee.annee_id
        }
      }
      
      // Si toujours pas d'année, prendre la plus récente
      if (!anneeId) {
        const { data: latestAnnee } = await supabase
          .from('annee_conference')
          .select('annee_id')
          .order('annee_id', { ascending: false })
          .limit(1)
          .single()
        
        anneeId = latestAnnee?.annee_id
      }
    }

    if (!anneeId) {
      return []
    }

    // Récupérer les fidèles via fidele_paroisse pour l'année spécifiée
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

    // Transformer les données pour extraire les fidèles
    const fideles = fideleParoisse
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

// Corrigez enregistrerTransfert
export async function enregistrerTransfert(formData: FormData) {
  try {
    const fidele_id = parseInt(formData.get('fidele_id') as string)
    const paroisse_source_id = parseInt(formData.get('paroisse_source_id') as string)
    const paroisse_destination_id = parseInt(formData.get('paroisse_destination_id') as string)
    const type_transfert = formData.get('type_transfert') as string
    const date_debut = formData.get('date_debut') as string
    const date_fin = formData.get('date_fin') as string || null
    const motif = formData.get('motif') as string || null

    // Récupérer la conférence de la paroisse destination
    const conferenceId = await getConferenceIdByParoisse(paroisse_destination_id)
    
    if (!conferenceId) {
      return { error: "Impossible de déterminer la conférence de la paroisse" }
    }

    // Récupérer l'année de conférence en cours pour cette conférence
    const anneeConference = await getCurrentAnneeConference(conferenceId)
    if (!anneeConference) {
      return { error: "Aucune année de conférence en cours pour cette conférence" }
    }

    // Récupérer l'utilisateur connecté
    const user = await getUser()
    let created_by = null
    
    if (user) {
      created_by = user.id
    }

    // Créer le transfert
    const { data: transfert, error: transfertError } = await supabase
      .from('transfert_fidele')
      .insert([{
        fidele_id,
        paroisse_source_id,
        paroisse_destination_id,
        type_transfert,
        date_debut,
        date_fin,
        motif,
        annee_id: anneeConference.id,
        created_by
      }])
      .select()
      .single()

    if (transfertError) {
      console.error('Erreur lors de la création du transfert:', transfertError)
      return { error: "Erreur lors de l'enregistrement" }
    }

    // Si c'est un transfert de paroisse, mettre à jour la paroisse du fidèle
    if (type_transfert === 'paroisse') {
      await supabase
        .from('fidele')
        .update({ paroisse_id: paroisse_destination_id })
        .eq('id', fidele_id)

      // Ajouter dans fidele_paroisse
      await supabase
        .from('fidele_paroisse')
        .insert([{
          fidele_id,
          paroisse_id: paroisse_destination_id,
          annee_id: anneeConference.annee_id
        }])
    }

    revalidatePath('/admin/transferts')
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: "Une erreur est survenue" }
  }
}