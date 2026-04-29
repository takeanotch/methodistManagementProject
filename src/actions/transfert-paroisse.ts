
// actions/transfert-paroisse.ts
'use server'

import { supabase } from '@/lib/supabase'
import { getCurrentAnneeConference } from './annee-conference'
import { getUser, getCurrentFidele } from './auth'
import { revalidatePath } from 'next/cache'

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

// Récupérer la conférence d'une paroisse
async function getConferenceIdByParoisse(paroisseId: number) {
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
}

// ============================================
// RÉCUPÉRATION DES FIDÈLES
// ============================================

// Récupérer les fidèles d'une paroisse pour l'année en cours
export async function getFidelesByParoisseForTransfert(paroisseId: number) {
  try {
    const conferenceId = await getConferenceIdByParoisse(paroisseId)
    if (!conferenceId) {
      return []
    }

    const currentAnnee = await getCurrentAnneeConference(conferenceId)
    if (!currentAnnee) {
      return []
    }

    const { data: fideleParoisse, error } = await supabase
      .from('fidele_paroisse')
      .select(`
        fidele_id,
        annee_conference_id,
        fidele:fidele_id (
          id, nom, post_nom, prenom, contact, profile_img, actif, sexe, annee_naissance,
          paroisse:paroisse_id (id, nom)
        )
      `)
      .eq('paroisse_id', paroisseId)
      .eq('annee_conference_id', currentAnnee.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getFidelesByParoisseForTransfert:', error)
      return []
    }

    return (fideleParoisse || [])
      .map(item => {
        const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
        return fidele
      })
      .filter(Boolean)
  } catch (error) {
    console.error('Erreur getFidelesByParoisseForTransfert:', error)
    return []
  }
}

// Récupérer tous les fidèles (pour recherche globale)
export async function searchAllFideles(searchTerm: string) {
  try {
    if (!searchTerm || searchTerm.length < 2) return []
    
    const { data, error } = await supabase
      .from('fidele')
      .select(`
        id, nom, post_nom, prenom, contact, profile_img, actif, sexe, annee_naissance,
        paroisse:paroisse_id (id, nom)
      `)
      .or(`nom.ilike.%${searchTerm}%,post_nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%`)
      .limit(20)

    if (error) {
      console.error('Erreur searchAllFideles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur searchAllFideles:', error)
    return []
  }
}

// Récupérer toutes les paroisses
export async function getAllParoisses() {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom, district:district_id(id, nom)')
      .order('nom', { ascending: true })

    if (error) throw error

    return (data || []).map(p => ({
      ...p,
      district: Array.isArray(p.district) ? p.district[0] : p.district
    }))
  } catch (error) {
    console.error('Erreur getAllParoisses:', error)
    return []
  }
}

// ============================================
// CRÉATION ET GESTION DES TRANSFERTS
// ============================================

// Créer un transfert en attente
export async function creerTransfertEnAttente(formData: FormData) {
  try {
    const fidele_id = parseInt(formData.get('fidele_id') as string)
    const paroisse_source_id = parseInt(formData.get('paroisse_source_id') as string)
    const type_transfert = formData.get('type_transfert') as string
    const date_debut = formData.get('date_debut') as string
    const date_fin = formData.get('date_fin') as string || null
    const motif = formData.get('motif') as string || null

    // Récupérer la conférence de la paroisse source
    const conferenceId = await getConferenceIdByParoisse(paroisse_source_id)
    
    if (!conferenceId) {
      return { error: "Impossible de déterminer la conférence de la paroisse" }
    }

    // Récupérer l'année de conférence en cours
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

    // Générer un code unique à 6 chiffres
    let code_transfert: string = ''
    let isUnique = false
    let attempts = 0
    
    while (!isUnique && attempts < 20) {
      const tempCode = Math.floor(100000 + Math.random() * 900000).toString()
      const { data: existing } = await supabase
        .from('transfert_fidele')
        .select('id')
        .eq('code_transfert', tempCode)
        .maybeSingle()
      
      if (!existing) {
        code_transfert = tempCode
        isUnique = true
      }
      attempts++
    }
    
    if (!isUnique) {
      return { error: "Erreur lors de la génération du code de transfert" }
    }

    // Créer le transfert avec statut 'en_attente' et le code
    const { error: transfertError } = await supabase
      .from('transfert_fidele')
      .insert([{
        fidele_id,
        paroisse_source_id,
        paroisse_destination_id: null,
        type_transfert,
        date_debut,
        date_fin,
        motif,
        annee_conference_id: anneeConference.id,
        created_by,
        statut: 'en_attente',
        code_transfert
      }])

    if (transfertError) {
      console.error('Erreur lors de la création du transfert:', transfertError)
      return { error: "Erreur lors de l'enregistrement" }
    }

    revalidatePath('/paroisse/transferts')
    revalidatePath('/paroisse/transferts/sortants')
    
    return { 
      success: true, 
      code: code_transfert,
      message: `Transfert créé avec succès. Code : ${code_transfert}`
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: "Une erreur est survenue" }
  }
}


// Accepter un transfert par code
export async function accepterTransfertParCode(code: string) {
  try {
    // Nettoyer et valider le code
    const cleanCode = code.trim()
    if (!cleanCode || cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      return { error: "Le code doit contenir exactement 6 chiffres" }
    }

    // Récupérer le transfert par son code
    const { data: transfert, error: getError } = await supabase
      .from('transfert_fidele')
      .select(`
        *,
        fidele:fidele_id (
          id, nom, post_nom, prenom, contact, sexe, annee_naissance
        ),
        source:paroisse_source_id (
          id, nom
        )
      `)
      .eq('code_transfert', cleanCode)
      .single()

    if (getError || !transfert) {
      return { error: "Code de transfert invalide ou introuvable" }
    }

    if (transfert.statut !== 'en_attente') {
      const statutMessages: Record<string, string> = {
        'accepte': 'Ce transfert a déjà été accepté',
        'refuse': 'Ce transfert a été refusé',
        'annule': 'Ce transfert a été annulé'
      }
      return { error: statutMessages[transfert.statut] || "Ce transfert n'est plus en attente" }
    }

    const user = await getUser()
    
    // Récupérer la paroisse de l'utilisateur connecté
    const currentFidele = await getCurrentFidele()
    if (!currentFidele?.paroisse_id) {
      return { error: "Vous n'êtes pas rattaché à une paroisse" }
    }

    const paroisseDestinationId = currentFidele.paroisse_id

    // Ne pas accepter un transfert de sa propre paroisse
    if (transfert.paroisse_source_id === paroisseDestinationId) {
      return { error: "Vous ne pouvez pas accepter un transfert de votre propre paroisse" }
    }

    // Récupérer l'année de conférence en cours pour la paroisse destination
    const conferenceId = await getConferenceIdByParoisse(paroisseDestinationId)
    let anneeConferenceId = null
    
    if (conferenceId) {
      const currentAnneeConference = await getCurrentAnneeConference(conferenceId)
      if (currentAnneeConference) {
        anneeConferenceId = currentAnneeConference.id
      }
    }

    if (!anneeConferenceId) {
      return { error: "Impossible de déterminer l'année de conférence en cours" }
    }

    // 1. Mettre à jour le transfert
    const { error: updateError } = await supabase
      .from('transfert_fidele')
      .update({
        paroisse_destination_id: paroisseDestinationId,
        statut: 'accepte',
        date_reponse: new Date().toISOString(),
        reponse_par: user?.id || null
      })
      .eq('id', transfert.id)

    if (updateError) {
      console.error('Erreur acceptation:', updateError)
      return { error: "Erreur lors de l'acceptation du transfert" }
    }

    // 2. Si c'est un transfert de paroisse
    if (transfert.type_transfert === 'paroisse') {
      // SUPPRIMER l'ancienne association dans fidele_paroisse pour l'année courante
      const { error: deleteOldError } = await supabase
        .from('fidele_paroisse')
        .delete()
        .eq('fidele_id', transfert.fidele_id)
        .eq('annee_conference_id', anneeConferenceId)

      if (deleteOldError) {
        console.error('Erreur suppression ancienne association:', deleteOldError)
      }

      // CRÉER la nouvelle association avec la paroisse destination
      const { error: insertNewError } = await supabase
        .from('fidele_paroisse')
        .insert([{
          fidele_id: transfert.fidele_id,
          paroisse_id: paroisseDestinationId,
          annee_conference_id: anneeConferenceId
        }])

      if (insertNewError) {
        console.error('Erreur insertion nouvelle association:', insertNewError)
        return { error: "Erreur lors de la mise à jour de l'appartenance du fidèle" }
      }

      // 3. Mettre à jour la paroisse du fidèle dans la table fidele
      const { error: updateFideleError } = await supabase
        .from('fidele')
        .update({ paroisse_id: paroisseDestinationId })
        .eq('id', transfert.fidele_id)

      if (updateFideleError) {
        console.error('Erreur mise à jour fidele.paroisse_id:', updateFideleError)
      }
    }

    revalidatePath('/paroisse/transferts')
    revalidatePath('/paroisse/transferts/entrants')
    revalidatePath('/paroisse/transferts/sortants')
    revalidatePath('/paroisse/transferts/acceptes')
    
    // Formater les informations du fidèle
    const fidele = Array.isArray(transfert.fidele) ? transfert.fidele[0] : transfert.fidele
    const source = Array.isArray(transfert.source) ? transfert.source[0] : transfert.source
    
    return { 
      success: true, 
      message: `Transfert de ${fidele?.nom} ${fidele?.prenom} accepté avec succès`,
      fidele: fidele,
      source: source?.nom
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: "Une erreur est survenue lors de l'acceptation" }
  }
}

// Refuser un transfert
export async function refuserTransfert(transfertId: number, motifRefus?: string) {
  try {
    const { data: transfert, error: getError } = await supabase
      .from('transfert_fidele')
      .select('*')
      .eq('id', transfertId)
      .single()

    if (getError || !transfert) {
      return { error: "Transfert non trouvé" }
    }

    if (transfert.statut !== 'en_attente') {
      return { error: "Ce transfert n'est plus en attente" }
    }

    const user = await getUser()

    const { error: updateError } = await supabase
      .from('transfert_fidele')
      .update({
        statut: 'refuse',
        date_reponse: new Date().toISOString(),
        reponse_par: user?.id || null,
        commentaire_reponse: motifRefus
      })
      .eq('id', transfertId)

    if (updateError) {
      console.error('Erreur refus:', updateError)
      return { error: "Erreur lors du refus" }
    }

    revalidatePath('/paroisse/transferts')
    revalidatePath('/paroisse/transferts/entrants')
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: "Une erreur est survenue" }
  }
}

// Annuler un transfert (par la paroisse source)
export async function annulerTransfert(transfertId: number) {
  try {
    const { data: transfert, error: getError } = await supabase
      .from('transfert_fidele')
      .select('*')
      .eq('id', transfertId)
      .single()

    if (getError || !transfert) {
      return { error: "Transfert non trouvé" }
    }

    if (transfert.statut !== 'en_attente') {
      return { error: "Ce transfert ne peut plus être annulé" }
    }

    const { error: updateError } = await supabase
      .from('transfert_fidele')
      .update({
        statut: 'annule',
        date_reponse: new Date().toISOString()
      })
      .eq('id', transfertId)

    if (updateError) {
      console.error('Erreur annulation:', updateError)
      return { error: "Erreur lors de l'annulation" }
    }

    revalidatePath('/paroisse/transferts')
    revalidatePath('/paroisse/transferts/sortants')
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: "Une erreur est survenue" }
  }
}

// ============================================
// RÉCUPÉRATION DES TRANSFERTS
// ============================================

// Récupérer les transferts sortants (créés par ma paroisse)
export async function getTransfertsSortants(paroisseId: number, anneeId?: number) {
  try {
    const { data, error } = await supabase
      .from('transfert_fidele')
      .select('*')
      .eq('paroisse_source_id', paroisseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getTransfertsSortants:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const transfertsAvecDetails = await Promise.all(
      data.map(async (transfert) => {
        const [fidele, destination] = await Promise.all([
          supabase.from('fidele').select('id, nom, post_nom, prenom, profile_img, contact, sexe, annee_naissance').eq('id', transfert.fidele_id).single(),
          transfert.paroisse_destination_id 
            ? supabase.from('paroisse').select('id, nom').eq('id', transfert.paroisse_destination_id).single()
            : Promise.resolve({ data: null })
        ])

        let anneeConference = null
        if (transfert.annee_conference_id) {
          const { data: ac } = await supabase
            .from('annee_conference')
            .select(`id, annee_id, annee:annee_id(id, label)`)
            .eq('id', transfert.annee_conference_id)
            .single()
          
          if (ac) {
            anneeConference = {
              ...ac,
              annee: Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
            }
          }
        }

        const repondeur = transfert.reponse_par
          ? (await supabase.from('compte').select('id, nom_complet').eq('id', transfert.reponse_par).single()).data
          : null

        return {
          ...transfert,
          fidele: fidele.data,
          destination: destination.data,
          annee_conference: anneeConference,
          repondeur
        }
      })
    )

    if (anneeId) {
      return transfertsAvecDetails.filter(t => t.annee_conference?.annee_id === anneeId)
    }

    return transfertsAvecDetails
  } catch (error) {
    console.error('Erreur getTransfertsSortants:', error)
    return []
  }
}

// Récupérer les transferts entrants (en attente pour ma paroisse)
export async function getTransfertsEntrants(paroisseId: number, anneeId?: number) {
  try {
    // Récupérer tous les transferts en attente, sans destination, et qui ne viennent PAS de ma paroisse
    let query = supabase
      .from('transfert_fidele')
      .select('*')
      .eq('statut', 'en_attente')
      .is('paroisse_destination_id', null)
      .neq('paroisse_source_id', paroisseId)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erreur getTransfertsEntrants:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const transfertsAvecDetails = await Promise.all(
      data.map(async (transfert) => {
        const [fidele, source] = await Promise.all([
          supabase.from('fidele').select('id, nom, post_nom, prenom, profile_img, contact, sexe, annee_naissance').eq('id', transfert.fidele_id).single(),
          supabase.from('paroisse').select('id, nom').eq('id', transfert.paroisse_source_id).single()
        ])

        let anneeConference = null
        if (transfert.annee_conference_id) {
          const { data: ac } = await supabase
            .from('annee_conference')
            .select(`id, annee_id, annee:annee_id(id, label)`)
            .eq('id', transfert.annee_conference_id)
            .single()
          
          if (ac) {
            anneeConference = {
              ...ac,
              annee: Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
            }
          }
        }

        const { data: auteur } = await supabase
          .from('compte')
          .select('id, nom_complet')
          .eq('id', transfert.created_by)
          .maybeSingle()

        return {
          ...transfert,
          fidele: fidele.data,
          source: source.data,
          annee_conference: anneeConference,
          auteur
        }
      })
    )

    if (anneeId) {
      return transfertsAvecDetails.filter(t => t.annee_conference?.annee_id === anneeId)
    }

    return transfertsAvecDetails
  } catch (error) {
    console.error('Erreur getTransfertsEntrants:', error)
    return []
  }
}

// Récupérer les transferts acceptés (entrants ou sortants) pour une paroisse
export async function getTransfertsAcceptes(paroisseId: number, anneeId?: number) {
  try {
    let query = supabase
      .from('transfert_fidele')
      .select('*')
      .eq('statut', 'accepte')
      .or(`paroisse_source_id.eq.${paroisseId},paroisse_destination_id.eq.${paroisseId}`)
      .order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Erreur getTransfertsAcceptes:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const transfertsAvecDetails = await Promise.all(
      data.map(async (transfert) => {
        const [fidele, source, destination] = await Promise.all([
          supabase.from('fidele').select('id, nom, post_nom, prenom, profile_img, contact, sexe, annee_naissance').eq('id', transfert.fidele_id).single(),
          supabase.from('paroisse').select('id, nom').eq('id', transfert.paroisse_source_id).single(),
          transfert.paroisse_destination_id 
            ? supabase.from('paroisse').select('id, nom').eq('id', transfert.paroisse_destination_id).single()
            : Promise.resolve({ data: null })
        ])

        let anneeConference = null
        if (transfert.annee_conference_id) {
          const { data: ac } = await supabase
            .from('annee_conference')
            .select(`id, annee_id, annee:annee_id(id, label)`)
            .eq('id', transfert.annee_conference_id)
            .single()
          
          if (ac) {
            anneeConference = {
              ...ac,
              annee: Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
            }
          }
        }

        const repondeur = transfert.reponse_par
          ? (await supabase.from('compte').select('id, nom_complet').eq('id', transfert.reponse_par).single()).data
          : null

        const auteur = transfert.created_by
          ? (await supabase.from('compte').select('id, nom_complet').eq('id', transfert.created_by).single()).data
          : null

        const sens = transfert.paroisse_source_id === paroisseId ? 'sortant' : 'entrant'

        return {
          ...transfert,
          fidele: fidele.data,
          source: source.data,
          destination: destination.data,
          annee_conference: anneeConference,
          repondeur,
          auteur,
          sens
        }
      })
    )

    if (anneeId) {
      return transfertsAvecDetails.filter(t => t.annee_conference?.annee_id === anneeId)
    }

    return transfertsAvecDetails
  } catch (error) {
    console.error('Erreur getTransfertsAcceptes:', error)
    return []
  }
}

// Récupérer les informations d'un transfert par son code
export async function getTransfertByCode(code: string) {
  try {
    const cleanCode = code.trim()
    if (!cleanCode || cleanCode.length !== 6 || !/^\d+$/.test(cleanCode)) {
      return { error: "Format de code invalide" }
    }

    const { data: transfert, error } = await supabase
      .from('transfert_fidele')
      .select(`
        id,
        code_transfert,
        type_transfert,
        date_debut,
        date_fin,
        motif,
        statut,
        created_at,
        fidele:fidele_id (
          id, nom, post_nom, prenom, contact, profile_img, sexe, annee_naissance
        ),
        source:paroisse_source_id (
          id, nom
        )
      `)
      .eq('code_transfert', cleanCode)
      .single()

    if (error || !transfert) {
      return { error: "Aucun transfert trouvé avec ce code" }
    }

    const fidele = Array.isArray(transfert.fidele) ? transfert.fidele[0] : transfert.fidele
    const source = Array.isArray(transfert.source) ? transfert.source[0] : transfert.source

    return {
      success: true,
      transfert: {
        ...transfert,
        fidele,
        source
      }
    }
  } catch (error) {
    console.error('Erreur getTransfertByCode:', error)
    return { error: "Erreur lors de la recherche du transfert" }
  }
}









// Accepter un transfert (par ID) - Version avec paramètre optionnel
export async function accepterTransfert(transfertId: number, paroisseDestinationId?: number) {
  try {
    console.log('📌 accepterTransfert - Début', { transfertId, paroisseDestinationId })
    
    // Récupérer le transfert avec toutes les informations nécessaires
    const { data: transfert, error: getError } = await supabase
      .from('transfert_fidele')
      .select(`
        *,
        fidele:fidele_id (
          id, nom, post_nom, prenom, contact, paroisse_id
        )
      `)
      .eq('id', transfertId)
      .single()

    if (getError || !transfert) {
      console.error('❌ Transfert non trouvé:', getError)
      return { error: "Transfert non trouvé" }
    }

    console.log('✅ Transfert trouvé:', { 
      id: transfert.id, 
      statut: transfert.statut,
      type: transfert.type_transfert 
    })

    // Vérifier le statut
    if (transfert.statut !== 'en_attente') {
      const statutMessages: Record<string, string> = {
        'accepte': 'Ce transfert a déjà été accepté',
        'refuse': 'Ce transfert a été refusé',
        'annule': 'Ce transfert a été annulé'
      }
      return { error: statutMessages[transfert.statut] || "Ce transfert n'est plus en attente" }
    }

    const user = await getUser()
    console.log('👤 Utilisateur connecté:', user?.id)
    
    // Déterminer la paroisse de destination
    let finalParoisseDestinationId: number
    
    if (paroisseDestinationId) {
      // Si fourni explicitement, utiliser ce paramètre
      finalParoisseDestinationId = paroisseDestinationId
      console.log('📍 Paroisse destination fournie explicitement:', finalParoisseDestinationId)
    } else {
      // Sinon, utiliser la paroisse de l'utilisateur connecté
      const currentFidele = await getCurrentFidele()
      if (!currentFidele?.paroisse_id) {
        console.error('❌ Utilisateur sans paroisse')
        return { error: "Vous n'êtes pas rattaché à une paroisse" }
      }
      finalParoisseDestinationId = currentFidele.paroisse_id
      console.log('📍 Paroisse destination récupérée automatiquement:', finalParoisseDestinationId)
    }

    // Vérifier que la paroisse destination existe
    const { data: paroisseDest, error: paroisseError } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('id', finalParoisseDestinationId)
      .single()

    if (paroisseError || !paroisseDest) {
      console.error('❌ Paroisse destination invalide:', paroisseError)
      return { error: "Paroisse de destination invalide" }
    }

    console.log('✅ Paroisse destination validée:', paroisseDest.nom)

    // Ne pas accepter un transfert de sa propre paroisse
    if (transfert.paroisse_source_id === finalParoisseDestinationId) {
      console.error('❌ Tentative d\'acceptation de son propre transfert')
      return { error: "Vous ne pouvez pas accepter un transfert de votre propre paroisse" }
    }

    // Récupérer l'année de conférence en cours pour la paroisse destination
    const conferenceId = await getConferenceIdByParoisse(finalParoisseDestinationId)
    let anneeConferenceId = null
    
    if (conferenceId) {
      const currentAnneeConference = await getCurrentAnneeConference(conferenceId)
      if (currentAnneeConference) {
        anneeConferenceId = currentAnneeConference.id
        console.log('📅 Année conférence trouvée:', anneeConferenceId)
      }
    }

    // Si toujours pas d'année, prendre la plus récente pour cette conférence
    if (!anneeConferenceId && conferenceId) {
      const { data: latestAnnee } = await supabase
        .from('annee_conference')
        .select('id')
        .eq('conference_id', conferenceId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      anneeConferenceId = latestAnnee?.id
      console.log('📅 Année conférence (fallback):', anneeConferenceId)
    }

    if (!anneeConferenceId) {
      console.error('❌ Impossible de déterminer l\'année de conférence')
      return { error: "Impossible de déterminer l'année de conférence en cours" }
    }

    // 1. Mettre à jour le transfert
    console.log('💾 Mise à jour du transfert...')
    const { error: updateError } = await supabase
      .from('transfert_fidele')
      .update({
        paroisse_destination_id: finalParoisseDestinationId,
        statut: 'accepte',
        date_reponse: new Date().toISOString(),
        reponse_par: user?.id || null
      })
      .eq('id', transfertId)

    if (updateError) {
      console.error('❌ Erreur mise à jour transfert:', updateError)
      return { error: "Erreur lors de l'acceptation du transfert" }
    }

    console.log('✅ Transfert mis à jour avec succès')

    // 2. Si c'est un transfert de paroisse
    if (transfert.type_transfert === 'paroisse') {
      const fidele = Array.isArray(transfert.fidele) ? transfert.fidele[0] : transfert.fidele
      
      console.log('🔄 Mise à jour des associations du fidèle:', fidele?.id)
      
      // SUPPRIMER l'ancienne association dans fidele_paroisse pour l'année courante
      const { error: deleteOldError } = await supabase
        .from('fidele_paroisse')
        .delete()
        .eq('fidele_id', transfert.fidele_id)
        .eq('annee_conference_id', anneeConferenceId)

      if (deleteOldError) {
        console.error('❌ Erreur suppression ancienne association:', deleteOldError)
        // On continue quand même
      } else {
        console.log('✅ Ancienne association supprimée')
      }

      // CRÉER la nouvelle association avec la paroisse destination
      const { error: insertNewError } = await supabase
        .from('fidele_paroisse')
        .insert([{
          fidele_id: transfert.fidele_id,
          paroisse_id: finalParoisseDestinationId,
          annee_conference_id: anneeConferenceId
        }])

      if (insertNewError) {
        console.error('❌ Erreur insertion nouvelle association:', insertNewError)
        
        // Tenter de rollback le transfert
        await supabase
          .from('transfert_fidele')
          .update({
            paroisse_destination_id: null,
            statut: 'en_attente',
            date_reponse: null,
            reponse_par: null
          })
          .eq('id', transfertId)
        
        return { error: "Erreur lors de la mise à jour de l'appartenance du fidèle" }
      }

      console.log('✅ Nouvelle association créée')

      // 3. Mettre à jour la paroisse du fidèle dans la table fidele
      const { error: updateFideleError } = await supabase
        .from('fidele')
        .update({ 
          paroisse_id: finalParoisseDestinationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', transfert.fidele_id)

      if (updateFideleError) {
        console.error('❌ Erreur mise à jour fidele.paroisse_id:', updateFideleError)
        // Non bloquant, on continue
      } else {
        console.log('✅ Paroisse du fidèle mise à jour')
      }

      // 4. Mettre à jour le compte lié si existant
      const { error: updateCompteError } = await supabase
        .from('compte')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('fidele_id', transfert.fidele_id)

      if (updateCompteError) {
        console.error('❌ Erreur mise à jour compte:', updateCompteError)
        // Non bloquant
      }
    }

    // Revalidation des chemins
    console.log('🔄 Revalidation des chemins...')
    revalidatePath('/paroisse/transferts')
    revalidatePath('/paroisse/transferts/entrants')
    revalidatePath('/paroisse/transferts/sortants')
    revalidatePath('/paroisse/transferts/acceptes')
    revalidatePath('/paroisse/fideles')
    revalidatePath('/admin/transferts')
    
    console.log('✅ Transfert accepté avec succès')
    
    return { 
      success: true,
      message: `Transfert accepté avec succès`,
      paroisseDestination: paroisseDest.nom
    }
    
  } catch (error) {
    console.error('❌ Erreur inattendue dans accepterTransfert:', error)
    return { error: "Une erreur inattendue est survenue lors de l'acceptation" }
  }
}








export async function getTransfertsByFidele(fideleId: number) {
  try {
    const { data, error } = await supabase
      .from('transfert_fidele')
      .select(`
        *,
        source:paroisse_source_id (id, nom),
        destination:paroisse_destination_id (id, nom),
        annee_conference:annee_conference_id (
          id,
          is_current,
          annee:annee_id (id, label)
        ),
        created_by_user:created_by (
          id,
          nom_complet
        ),
        reponse_par_user:reponse_par (
          id,
          nom_complet
        )
      `)
      .eq('fidele_id', fideleId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getTransfertsByFidele:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Transformer les données pour avoir le bon format
    const transfertsTransformes = data.map(transfert => {
      // Gérer les relations qui peuvent être des tableaux
      const source = Array.isArray(transfert.source) ? transfert.source[0] : transfert.source
      const destination = Array.isArray(transfert.destination) ? transfert.destination[0] : transfert.destination
      
      let anneeConference = transfert.annee_conference
      if (Array.isArray(anneeConference)) {
        anneeConference = anneeConference[0]
      }
      
      if (anneeConference?.annee) {
        anneeConference.annee = Array.isArray(anneeConference.annee) 
          ? anneeConference.annee[0] 
          : anneeConference.annee
      }

      const created_by_user = Array.isArray(transfert.created_by_user) 
        ? transfert.created_by_user[0] 
        : transfert.created_by_user

      const reponse_par_user = Array.isArray(transfert.reponse_par_user) 
        ? transfert.reponse_par_user[0] 
        : transfert.reponse_par_user

      return {
        ...transfert,
        source,
        destination,
        annee_conference: anneeConference,
        created_by_user,
        reponse_par_user
      }
    })

    return transfertsTransformes
  } catch (error) {
    console.error('Erreur inattendue dans getTransfertsByFidele:', error)
    return []
  }
}
