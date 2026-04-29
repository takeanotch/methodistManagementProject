
// actions/activite-district.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getDepartementUniteForDistrict } from './unite-organisation'
import { AnneeConference, getCurrentAnneeConference } from './annee-conference'
import { PlanAction } from './plan-action'
import { ActiviteFichier } from './activite'

export interface ActiviteDistrict {
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


export async function getActivitesByDistrict(): Promise<ActiviteDistrict[]> {
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

    console.log('Chef trouvé - departement_id:', chef.departement_id, 'district_id:', chef.district_id)

    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
    console.log('Unité récupérée:', unite)

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
      console.error('Erreur getActivitesByUniteDistrict:', error)
      return []
    }
    
    console.log(`Activités trouvées pour unité ${unite.id}:`, data?.length)
    return data || []
  } catch (error) {
    console.error('Erreur getActivitesByDistrict:', error)
    return []
  }
}

/**
 * Récupère les activités d'un plan d'action spécifique (optionnel)
 */
export async function getActivitesByPlanActionDistrict(planActionId: number): Promise<ActiviteDistrict[]> {
  try {
    const { data, error } = await supabase
      .from('activite')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Erreur getActivitesByPlanActionDistrict:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActivitesByPlanActionDistrict:', error)
    return []
  }
}

/**
 * Récupère les statistiques des activités
 */
export async function getActivitesStatsDistrict(uniteId: number) {
  try {
    const activites = await getActivitesByUniteDistrict(uniteId)
    
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
    console.error('Erreur getActivitesStatsDistrict:', error)
    return null
  }
}

/**
 * Crée une activité (avec plan_action_id optionnel)
 */
export async function createActiviteDistrict(
  uniteId: number,
  titre: string,
  date: string,
  heure: string,
  planActionId?: number | null,
  description?: string | null,
  statut: string = 'planifie'
): Promise<{ success: boolean; activite?: ActiviteDistrict; error?: string }> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { success: false, error: 'Vous devez être connecté' }
    }

    if (!titre?.trim()) return { success: false, error: 'Le titre est requis' }
    if (!date) return { success: false, error: 'La date est requise' }
    if (!heure) return { success: false, error: 'L\'heure est requise' }

    // Vérifier que l'unité appartient au district du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    // Vérifier l'unité
    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id_niveau')
      .eq('id', uniteId)
      .eq('reference_table', 'departement')
      .eq('reference_id', chef.departement_id)
      .eq('niveau', 'district')
      .single()

    if (uniteError || !unite || unite.id_niveau !== chef.district_id) {
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
    const { data: district } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', chef.district_id)
      .single()

    if (!district?.conference_id) {
      return { success: false, error: 'Impossible de déterminer la conférence' }
    }

    const currentAnnee = await getCurrentAnneeConference(district.conference_id)
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

    revalidatePath('/district/activites')
    if (planActionId) {
      revalidatePath(`/district/plans-action/${planActionId}`)
    }

    return { success: true, activite }
  } catch (error) {
    console.error('Erreur inattendue createActiviteDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


 
export async function updateActiviteDistrict(
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

    // Récupérer l'activité avec plan_action_id
    const { data: activite, error: fetchError } = await supabase
      .from('activite')
      .select('unite_id, plan_action_id')  // Ajout de plan_action_id ici
      .eq('id', activiteId)
      .single()

    if (fetchError || !activite) {
      return { success: false, error: 'Activité non trouvée' }
    }

    // Vérifier les droits
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
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
      .eq('niveau', 'district')
      .single()

    if (uniteError || !unite || unite.id_niveau !== chef.district_id) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    // Si planActionId est fourni, vérifier qu'il appartient à la même unité
    if (planActionId !== undefined) {
      if (planActionId !== null) {
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

    revalidatePath('/district/activites')
    // Maintenant activite.plan_action_id existe bien
    if (activite.plan_action_id) {
      revalidatePath(`/district/plans-action/${activite.plan_action_id}`)
    }
    if (planActionId) {
      revalidatePath(`/district/plans-action/${planActionId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
/**
 * Supprime une activité
 */
export async function deleteActiviteDistrict(activiteId: number): Promise<{ success: boolean; error?: string }> {
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
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
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
      .eq('niveau', 'district')
      .single()

    if (uniteError || !unite || unite.id_niveau !== chef.district_id) {
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

    revalidatePath('/district/activites')
    if (activite.plan_action_id) {
      revalidatePath(`/district/plans-action/${activite.plan_action_id}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


export async function getActivitesByUniteDistrict(uniteId: number): Promise<ActiviteDistrict[]> {
  try {
    console.log('getActivitesByUniteDistrict - uniteId:', uniteId)
    
    const { data, error } = await supabase
      .from('activite')
      .select('*')
      .eq('unite_id', uniteId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Erreur getActivitesByUniteDistrict:', error)
      return []
    }
    
    console.log('Activités trouvées:', data?.length)
    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActivitesByUniteDistrict:', error)
    return []
  }
}

// actions/activite-district.ts (ajouter cette nouvelle fonction)
/**
 * Récupère les statistiques des activités pour une unité et une année spécifique
 */
export async function getActivitesStatsByUniteAndAnnee(uniteId: number, anneeConferenceId: number) {
  try {
    console.log('getActivitesStatsByUniteAndAnnee - uniteId:', uniteId, 'anneeConferenceId:', anneeConferenceId)
    
    const { data: activites, error } = await supabase
      .from('activite')
      .select('*')
      .eq('unite_id', uniteId)
      .eq('annee_conference_id', anneeConferenceId)

    if (error) {
      console.error('Erreur getActivitesStatsByUniteAndAnnee:', error)
      return null
    }
    
    console.log('Activités trouvées pour stats:', activites?.length)
    
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

    const stats = {
      total,
      planifiees,
      enCours,
      terminees,
      annulees,
      aVenir,
      enRetard,
      tauxRealisation: total > 0 ? (terminees / total) * 100 : 0
    }
    
    console.log('Stats calculées:', stats)
    
    return stats
  } catch (error) {
    console.error('Erreur getActivitesStatsByUniteAndAnnee:', error)
    return null
  }
}

// actions/activite-district.ts - Ajouter ces fonctions

/**
 * Récupère les plans d'action pour une unité et une année spécifique
 */
export async function getPlansActionForDistrict(uniteId: number, anneeConferenceId: number): Promise<PlanAction[]> {
  try {
    const { data, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', uniteId)
      .eq('annee_conference_id', anneeConferenceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur getPlansActionForDistrict:', error)
      return []
    }
    return data || []
  } catch (error) {
    console.error('Erreur inattendue getPlansActionForDistrict:', error)
    return []
  }
}

/**
 * Récupère les années de conférence disponibles pour un district
 */

/**
 * Récupère une activité par son ID
 */
export async function getActiviteById(activiteId: number): Promise<any | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    // Vérifier que l'activité appartient au district du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) return null

    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
    if (!unite) return null

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
      .single()

    if (error) {
      console.error('Erreur getActiviteById:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur inattendue getActiviteById:', error)
    return null
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
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
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

    // Upload du fichier vers le bucket 'activites'
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `${timestamp}_${randomId}_${safeFileName}`
    const filePath = `${activiteId}/${uniqueFileName}`

    const { error: uploadError } = await supabase.storage
      .from('activites')  // Bucket 'activites' comme dans la référence
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

    revalidatePath(`/district/activites/${activiteId}`)

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
      .select('district_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .single()

    if (chefError || !chef) {
      return { success: false, error: 'Vous n\'êtes pas autorisé' }
    }

    const unite = await getDepartementUniteForDistrict(chef.departement_id, chef.district_id)
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

    // Supprimer du storage (bucket 'activites')
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

    revalidatePath(`/district/activites/${activiteId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteFile:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


// actions/activite-district.ts - Version avec logs détaillés

/**
 * Récupère les fichiers d'une activité
 */
export async function getActiviteFiles(activiteId: number): Promise<ActiviteFichier[]> {
  try {
    console.log('=== getActiviteFiles START ===')
    console.log('activiteId:', activiteId)
    
    // Vérifier d'abord si la table existe
    const { data: tableInfo, error: tableError } = await supabase
      .from('activite_fichier')
      .select('*')
      .limit(1)
    
    console.log('Table check - error:', tableError)
    console.log('Table check - data:', tableInfo)
    
    if (tableError) {
      console.error('Table error details:', {
        code: tableError.code,
        message: tableError.message,
        details: tableError.details,
        hint: tableError.hint
      })
    }
    
    // Récupérer les fichiers
    const { data, error } = await supabase
      .from('activite_fichier')
      .select('*')
      .eq('activite_id', activiteId)
      .order('id', { ascending: false })

    if (error) {
      console.error('Error getting files:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    console.log('Files found:', data?.length)
    console.log('=== getActiviteFiles END ===')
    
    return data || []
  } catch (error) {
    console.error('Unexpected error in getActiviteFiles:', error)
    return []
  }
}



// actions/activite-district.ts - Version corrigée de getAnneesConferenceForDistrict

/**
 * Récupère les années de conférence disponibles pour un district
 */
export async function getAnneesConferenceForDistrict(districtId: number): Promise<AnneeConference[]> {
  try {
    // Récupérer la conférence du district
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()

    if (districtError || !district?.conference_id) {
      console.error('Erreur récupération conférence:', districtError)
      return []
    }

    // Récupérer les années de cette conférence avec jointure
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
      .eq('conference_id', district.conference_id)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('Erreur getAnneesConferenceForDistrict:', error)
      return []
    }

    console.log('Données brutes des années:', JSON.stringify(data, null, 2))

    // Formater les données avec gestion robuste du label
    return (data || []).map((item: any) => {
      let label = `Année ${item.annee_id}`
      
      // Gérer les deux structures possibles de la relation
      if (item.annee) {
        // Cas 1: La relation retourne un tableau (structure typique de Supabase)
        if (Array.isArray(item.annee) && item.annee.length > 0 && item.annee[0].label) {
          label = item.annee[0].label
        }
        // Cas 2: La relation retourne un objet direct
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
    console.error('Erreur inattendue getAnneesConferenceForDistrict:', error)
    return []
  }
}


