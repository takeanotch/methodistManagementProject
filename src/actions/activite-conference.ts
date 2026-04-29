


// actions/activite-conference.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getDepartementUniteForConference } from './unite-organisation'
import { getCurrentAnneeForConference } from './chef-conference-annees'

export interface ActiviteConference {
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
}

/**
 * Récupère toutes les activités de la conférence
 */
export async function getActivitesByConference(): Promise<ActiviteConference[]> {
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
      .from('activite')
      .select('*')
      .eq('unite_id', unite.id)
      .order('date', { ascending: false })

    if (error) {
      console.error('Erreur getActivitesByConference:', error)
      return []
    }
    
    console.log(`Activités trouvées pour unité ${unite.id}:`, data?.length)
    return data || []
  } catch (error) {
    console.error('Erreur getActivitesByConference:', error)
    return []
  }
}

/**
 * Récupère les activités par unité
 */
export async function getActivitesByUniteConference(uniteId: number): Promise<ActiviteConference[]> {
  try {
    const { data, error } = await supabase
      .from('activite')
      .select('*')
      .eq('unite_id', uniteId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Erreur getActivitesByUniteConference:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActivitesByUniteConference:', error)
    return []
  }
}

/**
 * Récupère les activités d'un plan d'action spécifique
 */
export async function getActivitesByPlanActionConference(planActionId: number): Promise<ActiviteConference[]> {
  try {
    const { data, error } = await supabase
      .from('activite')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Erreur getActivitesByPlanActionConference:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActivitesByPlanActionConference:', error)
    return []
  }
}

/**
 * Récupère les statistiques des activités pour une unité et une année spécifique
 */
export async function getActivitesStatsByUniteAndAnnee(uniteId: number, anneeConferenceId: number) {
  try {
    const { data: activites, error } = await supabase
      .from('activite')
      .select('*')
      .eq('unite_id', uniteId)
      .eq('annee_conference_id', anneeConferenceId)

    if (error) {
      console.error('Erreur getActivitesStatsByUniteAndAnnee:', error)
      return null
    }
    
    const total = activites?.length || 0
    const planifiees = activites?.filter(a => a.statut === 'planifie').length || 0
    const enCours = activites?.filter(a => a.statut === 'en_cours').length || 0
    const terminees = activites?.filter(a => a.statut === 'termine').length || 0
    const annulees = activites?.filter(a => a.statut === 'annule').length || 0

    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)
    
    const aVenir = activites?.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= aujourdhui && a.statut !== 'termine' && a.statut !== 'annule'
    }).length || 0

    const enRetard = activites?.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite < aujourdhui && a.statut !== 'termine' && a.statut !== 'annule'
    }).length || 0

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
    console.error('Erreur getActivitesStatsByUniteAndAnnee:', error)
    return null
  }
}

/**
 * Crée une activité
 */
export async function createActiviteConference(
  uniteId: number,
  titre: string,
  date: string,
  heure: string,
  planActionId?: number | null,
  description?: string | null,
  statut: string = 'planifie'
): Promise<{ success: boolean; activite?: ActiviteConference; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    if (!titre?.trim()) return { success: false, error: 'Le titre est requis' }
    if (!date) return { success: false, error: 'La date est requise' }
    if (!heure) return { success: false, error: 'L\'heure est requise' }

    // Vérifier que l'unité appartient à la conférence du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    // Vérifier l'unité
    const { data: uniteCheck, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id_niveau')
      .eq('id', uniteId)
      .eq('reference_table', 'departement')
      .eq('reference_id', chef.departement_id)
      .eq('niveau', 'conference')
      .single()

    if (uniteError || !uniteCheck || uniteCheck.id_niveau !== chef.conference_id) {
      return { success: false, error: 'Unité non trouvée' }
    }

    // Si un plan d'action est fourni, vérifier qu'il appartient à la même unité
    if (planActionId) {
      const { data: plan, error: planError } = await supabase
        .from('plan_action')
        .select('id')
        .eq('id', planActionId)
        .eq('unite_id', uniteId)
        .single()

      if (planError || !plan) {
        return { success: false, error: 'Plan d\'action non trouvé' }
      }
    }

    // Récupérer l'année en cours
    const currentAnnee = await getCurrentAnneeForConference(chef.conference_id)
    if (!currentAnnee) {
      return { success: false, error: 'Aucune année en cours' }
    }

    // Créer l'activité
    const { data: activite, error } = await supabase
      .from('activite')
      .insert([{
        unite_id: uniteId,
        plan_action_id: planActionId || null,
        annee_conference_id: currentAnnee.id,
        titre: titre.trim(),
        description: description?.trim() || null,
        date,
        heure,
        statut: statut as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur création activité:', error)
      return { success: false, error: 'Erreur lors de la création de l\'activité' }
    }

    revalidatePath('/conference/activites')
    if (planActionId) {
      revalidatePath(`/conference/plans-action/${planActionId}`)
    }

    return { success: true, activite }
  } catch (error) {
    console.error('Erreur inattendue createActiviteConference:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Met à jour une activité
 */
export async function updateActiviteConference(
  activiteId: number,
  titre: string,
  description?: string | null,
  date?: string,
  heure?: string,
  statut?: string,
  planActionId?: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    if (!titre?.trim()) return { success: false, error: 'Le titre est requis' }

    // Récupérer l'activité
    const { data: activite, error: fetchError } = await supabase
      .from('activite')
      .select('unite_id, plan_action_id')
      .eq('id', activiteId)
      .single()

    if (fetchError || !activite) {
      return { success: false, error: 'Activité non trouvée' }
    }

    // Vérifier les droits
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id_niveau')
      .eq('id', activite.unite_id)
      .eq('reference_table', 'departement')
      .eq('reference_id', chef.departement_id)
      .eq('niveau', 'conference')
      .single()

    if (uniteError || !unite || unite.id_niveau !== chef.conference_id) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    // Si planActionId est fourni, vérifier qu'il appartient à la même unité
    if (planActionId !== undefined && planActionId !== null) {
      const { data: plan, error: planError } = await supabase
        .from('plan_action')
        .select('id')
        .eq('id', planActionId)
        .eq('unite_id', activite.unite_id)
        .single()

      if (planError || !plan) {
        return { success: false, error: 'Plan d\'action non trouvé' }
      }
    }

    // Mise à jour
    const updateData: any = {
      titre: titre.trim(),
      updated_at: new Date().toISOString()
    }
    if (description !== undefined) updateData.description = description?.trim() || null
    if (date) updateData.date = date
    if (heure) updateData.heure = heure
    if (statut) updateData.statut = statut
    if (planActionId !== undefined) updateData.plan_action_id = planActionId

    const { error } = await supabase
      .from('activite')
      .update(updateData)
      .eq('id', activiteId)

    if (error) {
      console.error('Erreur mise à jour:', error)
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath('/conference/activites')
    if (activite.plan_action_id) {
      revalidatePath(`/conference/plans-action/${activite.plan_action_id}`)
    }
    if (planActionId) {
      revalidatePath(`/conference/plans-action/${planActionId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteConference:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime une activité
 */
export async function deleteActiviteConference(activiteId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    const { data: activite, error: fetchError } = await supabase
      .from('activite')
      .select('unite_id, plan_action_id')
      .eq('id', activiteId)
      .single()

    if (fetchError || !activite) {
      return { success: false, error: 'Activité non trouvée' }
    }

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id_niveau')
      .eq('id', activite.unite_id)
      .eq('reference_table', 'departement')
      .eq('reference_id', chef.departement_id)
      .eq('niveau', 'conference')
      .single()

    if (uniteError || !unite || unite.id_niveau !== chef.conference_id) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const { error } = await supabase
      .from('activite')
      .delete()
      .eq('id', activiteId)

    if (error) {
      console.error('Erreur suppression:', error)
      return { success: false, error: 'Erreur lors de la suppression' }
    }

    revalidatePath('/conference/activites')
    if (activite.plan_action_id) {
      revalidatePath(`/conference/plans-action/${activite.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteConference:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupère une activité par son ID
 */
// export async function getActiviteByIdConference(activiteId: number): Promise<any | null> {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) return null

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
//       .from('activite')
//       .select(`
//         *,
//         plan_action:plan_action_id (
//           id,
//           titre,
//           description
//         )
//       `)
//       .eq('id', activiteId)
//       .eq('unite_id', unite.id)
//       .single()

//     if (error) {
//       console.error('Erreur getActiviteByIdConference:', error)
//       return null
//     }

//     return data
//   } catch (error) {
//     console.error('Erreur inattendue getActiviteByIdConference:', error)
//     return null
//   }
// }

/**
 * Récupère les plans d'action pour une unité et une année spécifique
 */
export async function getPlansActionForConference(uniteId: number, anneeConferenceId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', uniteId)
      .eq('annee_conference_id', anneeConferenceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getPlansActionForConference:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Erreur inattendue getPlansActionForConference:', error)
    return []
  }
}

/**
 * Récupère les années de conférence disponibles
 */

/**
 * Récupère les fichiers d'une activité
 */
export async function getActiviteFiles(activiteId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('activite_fichier')
      .select('*')
      .eq('activite_id', activiteId)
      .order('id', { ascending: false })

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

/**
 * Ajoute un fichier à une activité
 */
export async function addFileToActivite(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const activiteId = formData.get('activite_id')
    const file = formData.get('file') as File

    if (!activiteId || !file) {
      return { success: false, error: 'Données manquantes' }
    }

    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    // Vérifier les droits
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite) {
      return { success: false, error: 'Unité non trouvée' }
    }

    // Vérifier que l'activité appartient à l'unité
    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('unite_id')
      .eq('id', parseInt(activiteId.toString()))
      .single()

    if (activiteError || !activite || activite.unite_id !== unite.id) {
      return { success: false, error: 'Activité non trouvée' }
    }

    // Vérifier la taille du fichier (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'Le fichier ne doit pas dépasser 50 Mo' }
    }

    // Vérifier le type de fichier
    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip']
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { success: false, error: 'Type de fichier non autorisé' }
    }

    // Upload du fichier
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `${timestamp}_${randomId}_${safeFileName}`
    const filePath = `conference/${activiteId}/${uniqueFileName}`

    const { error: uploadError } = await supabase.storage
      .from('activites')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Erreur upload:', uploadError)
      return { success: false, error: `Erreur d'upload: ${uploadError.message}` }
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from('activites')
      .getPublicUrl(filePath)

    // Enregistrer dans la base de données
    const { error: dbError } = await supabase
      .from('activite_fichier')
      .insert([{
        activite_id: parseInt(activiteId.toString()),
        nom_fichier: file.name,
        chemin_fichier: urlData.publicUrl,
        type_fichier: fileExt
      }])

    if (dbError) {
      console.error('Erreur DB:', dbError)
      await supabase.storage.from('activites').remove([filePath])
      return { success: false, error: `Erreur d'enregistrement: ${dbError.message}` }
    }

    revalidatePath(`/conference/activites/${activiteId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue addFileToActivite:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprime un fichier d'une activité
 */
export async function deleteActiviteFile(
  fichierId: number,
  activiteId: number,
  fileUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    // Vérifier les droits
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite) {
      return { success: false, error: 'Unité non trouvée' }
    }

    // Vérifier que l'activité appartient à l'unité
    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('unite_id')
      .eq('id', activiteId)
      .single()

    if (activiteError || !activite || activite.unite_id !== unite.id) {
      return { success: false, error: 'Activité non trouvée' }
    }

    // Supprimer du storage
    const pathMatch = fileUrl.match(/\/activites\/(.+)$/)
    const storagePath = pathMatch ? pathMatch[1] : null

    if (storagePath) {
      await supabase.storage.from('activites').remove([storagePath])
    }

    // Supprimer de la base de données
    const { error: deleteDbError } = await supabase
      .from('activite_fichier')
      .delete()
      .eq('id', fichierId)

    if (deleteDbError) {
      console.error('Erreur suppression DB:', deleteDbError)
      return { success: false, error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/conference/activites/${activiteId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteFile:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


// actions/activite-conference.ts - Version corrigée de getActiviteByIdConference

/**
 * Récupère une activité par son ID
 */
// export async function getActiviteByIdConference(activiteId: number): Promise<any | null> {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) return null

//     // Récupérer les infos du chef
//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select('departement_id, conference_id')
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .single()

//     if (chefError || !chef) {
//       console.error('Chef non trouvé:', chefError)
//       return null
//     }

//     // Récupérer l'unité
//     const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
//     if (!unite) {
//       console.error('Unité non trouvée pour:', chef.departement_id, chef.conference_id)
//       return null
//     }

//     console.log('Recherche activité:', { activiteId, uniteId: unite.id })

//     // Récupérer l'activité avec ses relations
//     const { data, error } = await supabase
//       .from('activite')
//       .select(`
//         *,
//         plan_action:plan_action_id (
//           id,
//           titre,
//           description
//         )
//       `)
//       .eq('id', activiteId)
//       .eq('unite_id', unite.id)
//       .single()

//     if (error) {
//       console.error('Erreur getActiviteByIdConference:', error)
//       return null
//     }

//     console.log('Activité trouvée:', data)
//     return data
//   } catch (error) {
//     console.error('Erreur inattendue getActiviteByIdConference:', error)
//     return null
//   }
// }


// actions/activite-conference.ts - Version corrigée de getAnneesConferenceForConference

/**
 * Récupère les années de conférence disponibles
 */


export async function getAnneesConferenceForConference(conferenceId: number): Promise<any[]> {
  try {
    // Méthode 1: Avec jointure (recommandée)
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        conference_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('Erreur getAnneesConferenceForConference:', error)
      return []
    }

    console.log('Données brutes de la jointure:', JSON.stringify(data, null, 2))

    // Formater les données
    return (data || []).map((item: any) => {
      // Vérifier la structure de la relation
      let label = `Année ${item.annee_id}`
      
      if (item.annee) {
        // Si c'est un tableau (cas typique avec .select())
        if (Array.isArray(item.annee) && item.annee.length > 0 && item.annee[0].label) {
          label = item.annee[0].label
        }
        // Si c'est un objet direct
        else if (item.annee.label) {
          label = item.annee.label
        }
      }
      
      return {
        id: item.id,
        annee_id: item.annee_id,
        conference_id: item.conference_id,
        is_current: item.is_current,
        label: label,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Erreur inattendue getAnneesConferenceForConference:', error)
    return []
  }
}















export interface ActiviteConference {
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
}

// ... (toutes tes autres fonctions existantes: getActivitesByConference, etc.)

/**
 * Récupère une activité par son ID - VERSION CORRIGÉE
 */
export async function getActiviteByIdConference(activiteId: number): Promise<any | null> {
  try {
    console.log('=== getActiviteByIdConference START ===')
    console.log('activiteId:', activiteId)
    
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.log('Utilisateur non connecté')
      return null
    }

    // Récupérer les infos du chef de conférence
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id, conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()  // Utiliser maybeSingle() pour éviter l'erreur si pas trouvé

    if (chefError) {
      console.error('Erreur chef_departement:', chefError)
      return null
    }
    
    if (!chef) {
      console.log('Aucun chef trouvé pour ce fidèle')
      return null
    }

    console.log('Chef trouvé:', { departement_id: chef.departement_id, conference_id: chef.conference_id })

    // Récupérer l'unité pour cette conférence
    const unite = await getDepartementUniteForConference(chef.departement_id, chef.conference_id)
    if (!unite) {
      console.log('Unité non trouvée pour:', chef.departement_id, chef.conference_id)
      return null
    }

    console.log('Unité trouvée:', unite)

    // Récupérer l'activité avec ses relations
    const { data, error } = await supabase
      .from('activite')
      .select(`
        *,
        plan_action:plan_action_id (
          id,
          titre,
          description
        )
      `)
      .eq('id', activiteId)
      .eq('unite_id', unite.id)
      .maybeSingle()  // Utiliser maybeSingle() pour éviter l'erreur si pas trouvé

    if (error) {
      console.error('Erreur Supabase getActiviteByIdConference:', error)
      return null
    }

    if (!data) {
      console.log('Aucune activité trouvée avec ces critères')
      return null
    }

    console.log('Activité trouvée:', data)
    console.log('=== getActiviteByIdConference END ===')
    
    return data
  } catch (error) {
    console.error('Erreur inattendue getActiviteByIdConference:', error)
    return null
  }
}