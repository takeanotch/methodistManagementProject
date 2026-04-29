
// actions/activite.ts - Version mise à jour avec la structure annee_conference

'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'

export interface Activite {
  id: number
  unite_id: number
  plan_action_id: number | null
  annee_conference_id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  created_at: string
  updated_at: string
  unite?: {
    id: number
    nom: string
    niveau: string
    reference_id: number
  }
  plan_action?: {
    id: number
    titre: string
  } | null
  annee_conference?: {
    id: number
    annee_id: number
    conference_id: number
    is_current: boolean
    annee?: {
      id: number
      label: string
    }
  }
}

export interface ActiviteFichier {
  id: number
  activite_id: number
  nom_fichier: string
  chemin_fichier: string
  type_fichier: string
}

// Récupérer la paroisse d'un utilisateur
async function getUserParoisseId(userId: string): Promise<number | null> {
  try {
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', userId)
      .single()
    return fidele?.paroisse_id || null
  } catch (error) {
    console.error('Erreur getUserParoisseId:', error)
    return null
  }
}

// Récupérer la conférence d'une paroisse
async  function getConferenceFromParoisse(paroisseId: number): Promise<number | null> {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
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
    console.error('Erreur getConferenceFromParoisse:', error)
    return null
  }
}

// Récupérer l'unité complète
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

// Récupérer toutes les années de conférence disponibles pour une unité
export async function getAnneesConferenceForUnite(uniteId: number) {
  try {
    const unite = await getUniteComplete(uniteId)
    if (!unite) return []

    // Récupérer la conférence à partir de l'unité (id_niveau contient la paroisse_id)
    const conferenceId = await getConferenceFromParoisse(unite.id_niveau)
    if (!conferenceId) return []

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error('Erreur getAnneesConferenceForUnite:', error)
    return []
  }
}

// Récupérer tous les plans d'action disponibles pour une unité
export async function getPlansActionForUnite(uniteId: number, anneeConferenceId?: number) {
  try {
    let query = supabase
      .from('plan_action')
      .select('id, titre, annee_conference_id')
      .eq('unite_id', uniteId)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionForUnite:', error)
    return []
  }
}



// Récupérer les activités d'un plan d'action
export async function getActivitesByPlanAction(planActionId: number) {
  try {
    const { data, error } = await supabase
      .from('activite')
      .select(`
        *,
        unite:unite_id (*),
        plan_action:plan_action_id (id, titre),
        annee_conference:annee_conference_id (
          id,
          annee_id,
          conference_id,
          is_current,
          annee:annee_id (id, label)
        )
      `)
      .eq('plan_action_id', planActionId)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })

    if (error) throw error

    return (data || []).map(activite => ({
      ...activite,
      unite: Array.isArray(activite.unite) ? activite.unite[0] : activite.unite,
      plan_action: activite.plan_action ? (Array.isArray(activite.plan_action) ? activite.plan_action[0] : activite.plan_action) : null,
      annee_conference: activite.annee_conference ? (Array.isArray(activite.annee_conference) ? activite.annee_conference[0] : activite.annee_conference) : null
    }))
  } catch (error) {
    console.error('Erreur getActivitesByPlanAction:', error)
    return []
  }
}

// Créer une activité (indépendante ou liée à un plan d'action)
export async function createActivite(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const unite_id = parseInt(formData.get('unite_id') as string)
    const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
    const annee_conference_id = formData.get('annee_conference_id') ? parseInt(formData.get('annee_conference_id') as string) : null
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const date = formData.get('date') as string
    const heure = formData.get('heure') as string
    const statut = formData.get('statut') as string || 'planifie'

    if (!unite_id || isNaN(unite_id)) {
      return { error: 'Unité invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    if (!date) {
      return { error: 'La date est requise' }
    }

    if (!heure) {
      return { error: 'L\'heure est requise' }
    }

    // Vérifier l'unité et les droits
    const unite = await getUniteComplete(unite_id)
    if (!unite) {
      return { error: 'Unité non trouvée' }
    }

    const userParoisseId = await getUserParoisseId(user.fidele_id)
    if (!userParoisseId || unite.id_niveau !== userParoisseId) {
      return { error: 'Vous ne pouvez créer une activité que pour votre paroisse' }
    }

    // Déterminer l'année de conférence
    let finalAnneeConferenceId: number

    if (annee_conference_id) {
      // Utiliser l'année sélectionnée
      finalAnneeConferenceId = annee_conference_id
    } else if (plan_action_id) {
      // Récupérer du plan d'action
      const { data: plan } = await supabase
        .from('plan_action')
        .select('annee_conference_id')
        .eq('id', plan_action_id)
        .single()

      if (!plan) {
        return { error: 'Plan d\'action non trouvé' }
      }
      finalAnneeConferenceId = plan.annee_conference_id
    } else {
      // Récupérer l'année en cours pour la conférence
      const conferenceId = await getConferenceFromParoisse(userParoisseId)
      if (!conferenceId) {
        return { error: 'Impossible de déterminer la conférence' }
      }

      const currentAnnee = await getCurrentAnneeConference(conferenceId)
      if (!currentAnnee) {
        return { error: 'Aucune année en cours pour cette conférence' }
      }
      finalAnneeConferenceId = currentAnnee.id
    }

    // Créer l'activité
    const { data: newActivite, error } = await supabase
      .from('activite')
      .insert([{
        unite_id,
        plan_action_id,
        annee_conference_id: finalAnneeConferenceId,
        titre: titre.trim(),
        description,
        date,
        heure,
        statut
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur createActivite:', error)
      return { error: 'Erreur lors de la création de l\'activité' }
    }

    // Revalidation
    revalidatePath(`/paroisse/departements/${unite.reference_id}/activites`)
    if (plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/plans-action/${plan_action_id}`)
    }

    return { success: true, activite: newActivite, id: newActivite.id }
  } catch (error) {
    console.error('Erreur inattendue createActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Mettre à jour une activité
export async function updateActivite(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const date = formData.get('date') as string
    const heure = formData.get('heure') as string
    const statut = formData.get('statut') as string
    const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
    const annee_conference_id = formData.get('annee_conference_id') ? parseInt(formData.get('annee_conference_id') as string) : null

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    // Vérifier l'existence et les droits
    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('*, unite:unite_id(*)')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
    const userParoisseId = await getUserParoisseId(user.fidele_id)

    if (!userParoisseId || unite?.id_niveau !== userParoisseId) {
      return { error: 'Vous ne pouvez modifier cette activité' }
    }

    // Mise à jour
    const updateData: any = {
      titre: titre.trim(),
      description,
      date,
      heure,
      statut,
      updated_at: new Date().toISOString()
    }

    if (plan_action_id !== undefined) {
      updateData.plan_action_id = plan_action_id
    }

    if (annee_conference_id !== undefined && annee_conference_id !== null) {
      updateData.annee_conference_id = annee_conference_id
    }

    const { error } = await supabase
      .from('activite')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erreur updateActivite:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/paroisse/departements/${unite?.reference_id}/activites`)
    if (activite.plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite?.reference_id}/plans-action/${activite.plan_action_id}`)
    }
    if (plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite?.reference_id}/plans-action/${plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Supprimer une activité
export async function deleteActivite(id: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('*, unite:unite_id(*)')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
    const userParoisseId = await getUserParoisseId(user.fidele_id)

    if (!userParoisseId || unite?.id_niveau !== userParoisseId) {
      return { error: 'Vous ne pouvez supprimer cette activité' }
    }

    const { error } = await supabase
      .from('activite')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deleteActivite:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/departements/${unite?.reference_id}/activites`)
    if (activite.plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite?.reference_id}/plans-action/${activite.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Changer le statut d'une activité
export async function updateActiviteStatut(id: number, statut: 'planifie' | 'en_cours' | 'termine' | 'annule') {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('*, unite:unite_id(*)')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
    const userParoisseId = await getUserParoisseId(user.fidele_id)

    if (!userParoisseId || unite?.id_niveau !== userParoisseId) {
      return { error: 'Vous ne pouvez modifier cette activité' }
    }

    const { error } = await supabase
      .from('activite')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erreur updateActiviteStatut:', error)
      return { error: 'Erreur lors du changement de statut' }
    }

    revalidatePath(`/paroisse/departements/${unite?.reference_id}/activites`)
    if (activite.plan_action_id) {
      revalidatePath(`/paroisse/departements/${unite?.reference_id}/plans-action/${activite.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteStatut:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Récupérer une activité par son ID
export async function getActiviteById(id: number): Promise<Activite | null> {
  try {
    const { data, error } = await supabase
      .from('activite')
      .select(`
        *,
        unite:unite_id (*),
        plan_action:plan_action_id (id, titre),
        annee_conference:annee_conference_id (
          id,
          annee_id,
          conference_id,
          is_current,
          annee:annee_id (id, label)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur getActiviteById:', error)
      return null
    }

    if (!data) return null

    return {
      ...data,
      unite: Array.isArray(data.unite) ? data.unite[0] : data.unite,
      plan_action: data.plan_action ? (Array.isArray(data.plan_action) ? data.plan_action[0] : data.plan_action) : null,
      annee_conference: data.annee_conference ? (Array.isArray(data.annee_conference) ? data.annee_conference[0] : data.annee_conference) : null
    }
  } catch (error) {
    console.error('Erreur inattendue getActiviteById:', error)
    return null
  }
}


// Gestion des fichiers joints
export async function getActiviteFiles(activiteId: number): Promise<ActiviteFichier[]> {
  try {
    const { data, error } = await supabase
      .from('activite_fichier')
      .select('*')
      .eq('activite_id', activiteId)
      .order('id', { ascending: true })

    if (error) {
      console.error('Erreur getActiviteFiles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActiviteFiles:', error)
    return []
  }
}

export async function addFileToActivite(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const activiteId = parseInt(formData.get('activite_id') as string)
    const file = formData.get('file') as File

    if (!activiteId || isNaN(activiteId)) {
      return { error: 'Activité invalide' }
    }

    if (!file) {
      return { error: 'Aucun fichier sélectionné' }
    }

    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return { error: `Le fichier ne doit pas dépasser 50 Mo` }
    }

    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip']
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { error: `Type de fichier non autorisé` }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('*, unite:unite_id(*)')
      .eq('id', activiteId)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
    const userParoisseId = await getUserParoisseId(user.fidele_id)

    if (!userParoisseId || unite?.id_niveau !== userParoisseId) {
      return { error: 'Vous ne pouvez pas ajouter de fichier à cette activité' }
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `${timestamp}_${randomId}_${safeFileName}`
    const filePath = `${activiteId}/${uniqueFileName}`

    const { error: uploadError } = await supabase.storage
      .from('activites')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload:', uploadError)
      return { error: `Erreur d'upload: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage
      .from('activites')
      .getPublicUrl(filePath)

    const { data: fileRecord, error: dbError } = await supabase
      .from('activite_fichier')
      .insert([{
        activite_id: activiteId,
        nom_fichier: file.name,
        chemin_fichier: publicUrlData.publicUrl,
        type_fichier: fileExt
      }])
      .select()
      .single()

    if (dbError) {
      await supabase.storage.from('activites').remove([filePath])
      return { error: `Erreur d'enregistrement: ${dbError.message}` }
    }

    if (unite?.reference_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/activites/${activiteId}`)
    }

    return { success: true, fichier: fileRecord }
  } catch (error) {
    console.error('Erreur inattendue addFileToActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function deleteActiviteFile(fichierId: number, activiteId: number, fileUrl: string) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('*, unite:unite_id(*)')
      .eq('id', activiteId)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
    const userParoisseId = await getUserParoisseId(user.fidele_id)

    if (!userParoisseId || unite?.id_niveau !== userParoisseId) {
      return { error: 'Vous ne pouvez pas supprimer ce fichier' }
    }

    const pathMatch = fileUrl.match(/\/activites\/(.+)$/)
    const storagePath = pathMatch ? pathMatch[1] : null

    if (storagePath) {
      await supabase.storage.from('activites').remove([storagePath])
    }

    const { error: dbError } = await supabase
      .from('activite_fichier')
      .delete()
      .eq('id', fichierId)

    if (dbError) {
      return { error: 'Erreur lors de la suppression' }
    }

    if (unite?.reference_id) {
      revalidatePath(`/paroisse/departements/${unite.reference_id}/activites/${activiteId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteFile:', error)
    return { error: 'Une erreur est survenue' }
  }
}



/**
 * Récupérer les activités d'une unité - Version corrigée sans relations problématiques
 */



// actions/activite.ts




// actions/activite.ts - Version corrigée de getActivitesStats

export async function getActivitesStats(planActionId?: number, uniteId?: number, anneeConferenceId?: number) {
  try {
    let activites: any[] = []

    if (planActionId) {
      // Pour un plan d'action spécifique, on n'a pas besoin du filtre année
      // car le plan d'action est déjà lié à une année
      activites = await getActivitesByPlanAction(planActionId)
    } else if (uniteId) {
      // CRUCIAL: Passer anneeConferenceId pour filtrer par année
      activites = await getActivitesByUnite(uniteId, anneeConferenceId)
    } else {
      return null
    }

    const total = activites.length
    const planifiees = activites.filter(a => a.statut === 'planifie').length
    const enCours = activites.filter(a => a.statut === 'en_cours').length
    const terminees = activites.filter(a => a.statut === 'termine').length
    const annulees = activites.filter(a => a.statut === 'annule').length

    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)

    const aVenir = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= aujourdhui && a.statut !== 'termine' && a.statut !== 'annule'
    }).length

    const enRetard = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite < aujourdhui && a.statut !== 'termine' && a.statut !== 'annule'
    }).length

    return {
      total,
      planifiees,
      enCours,
      terminees,
      annulees,
      aVenir,
      enRetard,
      tauxRealisation: total > 0 ? (terminees / total) * 100 : 0
    }
  } catch (error) {
    console.error('Erreur getActivitesStats:', error)
    return null
  }
}



// actions/activite.ts

// Ajouter ou mettre à jour le commentaire d'une activité
export async function updateActiviteCommentaire(activiteId: number, commentaire: string) {
  try {
  

    const { data: activite, error: selectError } = await supabase
      .from('activite')
      .select('id, unite_id')
      .eq('id', activiteId)
      .single()

    if (selectError || !activite) {
      return { success: false, error: 'Activité non trouvée' }
    }


    const { error: updateError } = await supabase
      .from('activite')
      .update({ commentaire: commentaire || null })
      .eq('id', activiteId)

    if (updateError) {
      console.error('Erreur mise à jour commentaire:', updateError)
      return { success: false, error: 'Erreur lors de la mise à jour du commentaire' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in updateActiviteCommentaire:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
// actions/activite.ts - Version finale vérifiée

export async function getActivitesByUnite(
  uniteId: number, 
  anneeConferenceId?: number,
  filters?: { statut?: string; dateDebut?: string; dateFin?: string }
) {
  try {
    console.log('🔍 getActivitesByUnite', { uniteId, anneeConferenceId })
    
    let query = supabase
      .from('activite')
      .select('*')
      .eq('unite_id', uniteId)

    // CRUCIAL: Filtrer par année si fournie
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
      console.log(`  Filtre année: ${anneeConferenceId}`)
    } else {
      console.log(`  ⚠️ PAS de filtre année!`)
    }
    
    if (filters?.statut) {
      query = query.eq('statut', filters.statut)
    }
    if (filters?.dateDebut) {
      query = query.gte('date', filters.dateDebut)
    }
    if (filters?.dateFin) {
      query = query.lte('date', filters.dateFin)
    }

    const { data, error } = await query
      .order('date', { ascending: true })
      .order('heure', { ascending: true })

    if (error) {
      console.error('❌ Erreur:', error)
      return []
    }

    console.log(`✅ ${data?.length || 0} activités trouvées`)
    return data || []
  } catch (error) {
    console.error('❌ Exception:', error)
    return []
  }
}


// export async function getActivitesByUnite(
//   uniteId: number, 
//   anneeConferenceId?: number,
//   filters?: { statut?: string; dateDebut?: string; dateFin?: string }
// ) {
//   try {
//     console.log('🔍 getActivitesByUnite - Début', { uniteId, anneeConferenceId })
    
//     // Construction de la requête - version simple sans relations
//     let query = supabase
//       .from('activite')
//       .select('*')
//       .eq('unite_id', uniteId)

//     // Filtre par année de conférence
//     if (anneeConferenceId) {
//       query = query.eq('annee_conference_id', anneeConferenceId)
//     }
    
//     // Filtres supplémentaires
//     if (filters?.statut) {
//       query = query.eq('statut', filters.statut)
//     }
//     if (filters?.dateDebut) {
//       query = query.gte('date', filters.dateDebut)
//     }
//     if (filters?.dateFin) {
//       query = query.lte('date', filters.dateFin)
//     }

//     // Exécution de la requête
//     const { data, error } = await query
//       .order('date', { ascending: true })
//       .order('heure', { ascending: true })

//     if (error) {
//       console.error('❌ Erreur getActivitesByUnite:', error)
//       return []
//     }

//     console.log(`✅ getActivitesByUnite - ${data?.length || 0} activités trouvées`)
//     return data || []
    
//   } catch (error) {
//     console.error('❌ Erreur inattendue getActivitesByUnite:', error)
//     return []
//   }
// }