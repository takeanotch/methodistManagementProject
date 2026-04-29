// actions/activite-niveaux.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'

// ============================================================
// TYPES PARTAGÉS
// ============================================================

export interface ActiviteNiveau {
  id: number
  unite_id: number
  plan_action_id: number | null
  annee_conference_id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  commentaire: string | null
  created_at: string
  updated_at: string
  unite?: {
    id: number
    nom: string
    niveau: string
    reference_id: number
    id_niveau: number
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

// ============================================================
// FONCTIONS UTILITAIRES PARTAGÉES
// ============================================================

/**
 * Récupère l'unité complète par son ID
 */
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

/**
 * Récupère la conférence à partir d'un ID de district
 */
async function getConferenceFromDistrict(districtId: number): Promise<number | null> {
  try {
    const { data: district } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()
    return district?.conference_id || null
  } catch (error) {
    console.error('Erreur getConferenceFromDistrict:', error)
    return null
  }
}

// ============================================================
// ACTIONS COMMUNES (ANNÉES, PLANS D'ACTION)
// ============================================================

/**
 * Récupère toutes les années de conférence disponibles pour une unité
 */
export async function getAnneesConferenceForUniteNiveau(
  uniteId: number,
  niveau: 'district' | 'conference'
): Promise<any[]> {
  try {
    const unite = await getUniteComplete(uniteId)
    if (!unite) return []

    let conferenceId: number | null = null
    
    if (niveau === 'district') {
      conferenceId = await getConferenceFromDistrict(unite.id_niveau)
    } else {
      // Pour conférence, id_niveau contient directement l'ID de la conférence
      conferenceId = unite.id_niveau
    }
    
    if (!conferenceId) return []

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error(`Erreur getAnneesConferenceForUniteNiveau (${niveau}):`, error)
    return []
  }
}

/**
 * Récupère tous les plans d'action disponibles pour une unité
 */
export async function getPlansActionForUniteNiveau(
  uniteId: number,
  anneeConferenceId?: number
): Promise<any[]> {
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
    console.error('Erreur getPlansActionForUniteNiveau:', error)
    return []
  }
}

// ============================================================
// ACTIONS SPÉCIFIQUES DISTRICT
// ============================================================

/**
 * Récupérer les activités d'un district (toutes les unités de type district)
 */
export async function getActivitesByDistrict(anneeConferenceId?: number): Promise<ActiviteNiveau[]> {
  try {
    // Récupérer d'abord toutes les unités de niveau district
    const { data: unites, error: unitesError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('niveau', 'district')

    if (unitesError || !unites?.length) return []

    const uniteIds = unites.map(u => u.id)

    let query = supabase
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
      .in('unite_id', uniteIds)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur getActivitesByDistrict:', error)
      return []
    }

    return (data || []).map(activite => ({
      ...activite,
      unite: Array.isArray(activite.unite) ? activite.unite[0] : activite.unite,
      plan_action: activite.plan_action ? (Array.isArray(activite.plan_action) ? activite.plan_action[0] : activite.plan_action) : null,
      annee_conference: activite.annee_conference ? (Array.isArray(activite.annee_conference) ? activite.annee_conference[0] : activite.annee_conference) : null
    }))
  } catch (error) {
    console.error('Erreur getActivitesByDistrict:', error)
    return []
  }
}

/**
 * Récupérer les activités d'une unité spécifique (district ou conférence)
 */
export async function getActivitesByUniteNiveau(
  uniteId: number,
  anneeConferenceId?: number,
  filters?: { statut?: string; dateDebut?: string; dateFin?: string }
): Promise<ActiviteNiveau[]> {
  try {
    let query = supabase
      .from('activite')
      .select('*')
      .eq('unite_id', uniteId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
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
      console.error('Erreur getActivitesByUniteNiveau:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur getActivitesByUniteNiveau:', error)
    return []
  }
}

/**
 * Récupérer les activités d'un plan d'action
 */
export async function getActivitesByPlanActionNiveau(planActionId: number): Promise<ActiviteNiveau[]> {
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
    console.error('Erreur getActivitesByPlanActionNiveau:', error)
    return []
  }
}

// ============================================================
// ACTIONS SPÉCIFIQUES CONFÉRENCE
// ============================================================

/**
 * Récupérer les activités d'une conférence (toutes les unités de type conference)
 */
export async function getActivitesByConference(anneeConferenceId?: number): Promise<ActiviteNiveau[]> {
  try {
    const { data: unites, error: unitesError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('niveau', 'conference')

    if (unitesError || !unites?.length) return []

    const uniteIds = unites.map(u => u.id)

    let query = supabase
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
      .in('unite_id', uniteIds)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur getActivitesByConference:', error)
      return []
    }

    return (data || []).map(activite => ({
      ...activite,
      unite: Array.isArray(activite.unite) ? activite.unite[0] : activite.unite,
      plan_action: activite.plan_action ? (Array.isArray(activite.plan_action) ? activite.plan_action[0] : activite.plan_action) : null,
      annee_conference: activite.annee_conference ? (Array.isArray(activite.annee_conference) ? activite.annee_conference[0] : activite.annee_conference) : null
    }))
  } catch (error) {
    console.error('Erreur getActivitesByConference:', error)
    return []
  }
}

// ============================================================
// CRUD ACTIVITÉS (COMMUN)
// ============================================================

/**
 * Créer une activité
 */
export async function createActiviteNiveau(
  formData: FormData,
  niveau: 'district' | 'conference',
  niveauId: number
): Promise<{ success?: boolean; id?: number; error?: string }> {
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

    // Vérifier l'unité
    const unite = await getUniteComplete(unite_id)
    if (!unite) {
      return { error: 'Unité non trouvée' }
    }

    // Vérifier que l'unité correspond au bon niveau
    if (unite.niveau !== niveau) {
      return { error: `Cette unité n'est pas de niveau ${niveau}` }
    }

    // Vérifier que l'id_niveau correspond
    if (unite.id_niveau !== niveauId) {
      return { error: `Cette unité n'appartient pas à ce ${niveau}` }
    }

    // Déterminer l'année de conférence
    let finalAnneeConferenceId: number

    if (annee_conference_id) {
      finalAnneeConferenceId = annee_conference_id
    } else if (plan_action_id) {
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
      let conferenceId: number | null = null
      
      if (niveau === 'district') {
        conferenceId = await getConferenceFromDistrict(niveauId)
      } else {
        conferenceId = niveauId
      }
      
      if (!conferenceId) {
        return { error: 'Impossible de déterminer la conférence' }
      }

      const currentAnnee = await getCurrentAnneeConference(conferenceId)
      if (!currentAnnee) {
        return { error: 'Aucune année en cours pour cette conférence' }
      }
      finalAnneeConferenceId = currentAnnee.id
    }

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
      console.error('Erreur createActiviteNiveau:', error)
      return { error: 'Erreur lors de la création de l\'activité' }
    }

    // Revalidation
    if (niveau === 'district') {
      revalidatePath(`/district/activites`)
      revalidatePath(`/district`)
    } else {
      revalidatePath(`/conference/activites`)
      revalidatePath(`/conference`)
    }
    
    if (plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${plan_action_id}`)
      }
    }

    return { success: true, id: newActivite.id }
  } catch (error) {
    console.error('Erreur inattendue createActiviteNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Mettre à jour une activité
 */
export async function updateActiviteNiveau(
  formData: FormData,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; error?: string }> {
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

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('*, unite:unite_id(*)')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite

    if (unite?.niveau !== niveau) {
      return { error: 'Vous ne pouvez modifier cette activité' }
    }

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
      console.error('Erreur updateActiviteNiveau:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    if (niveau === 'district') {
      revalidatePath(`/district/activites`)
      revalidatePath(`/district`)
    } else {
      revalidatePath(`/conference/activites`)
      revalidatePath(`/conference`)
    }
    
    if (activite.plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${activite.plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${activite.plan_action_id}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Supprimer une activité
 */
export async function deleteActiviteNiveau(
  id: number,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; error?: string }> {
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

    if (unite?.niveau !== niveau) {
      return { error: 'Vous ne pouvez supprimer cette activité' }
    }

    const { error } = await supabase
      .from('activite')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deleteActiviteNiveau:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    if (niveau === 'district') {
      revalidatePath(`/district/activites`)
      revalidatePath(`/district`)
    } else {
      revalidatePath(`/conference/activites`)
      revalidatePath(`/conference`)
    }
    
    if (activite.plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${activite.plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${activite.plan_action_id}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Changer le statut d'une activité
 */
export async function updateActiviteStatutNiveau(
  id: number,
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule',
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; error?: string }> {
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

    if (unite?.niveau !== niveau) {
      return { error: 'Vous ne pouvez modifier cette activité' }
    }

    const { error } = await supabase
      .from('activite')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Erreur updateActiviteStatutNiveau:', error)
      return { error: 'Erreur lors du changement de statut' }
    }

    if (niveau === 'district') {
      revalidatePath(`/district/activites`)
      revalidatePath(`/district`)
    } else {
      revalidatePath(`/conference/activites`)
      revalidatePath(`/conference`)
    }
    
    if (activite.plan_action_id) {
      if (niveau === 'district') {
        revalidatePath(`/district/plans-action/${activite.plan_action_id}`)
      } else {
        revalidatePath(`/conference/plans-action/${activite.plan_action_id}`)
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteStatutNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Récupérer une activité par son ID
 */
export async function getActiviteByIdNiveau(id: number): Promise<ActiviteNiveau | null> {
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
      console.error('Erreur getActiviteByIdNiveau:', error)
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
    console.error('Erreur inattendue getActiviteByIdNiveau:', error)
    return null
  }
}

/**
 * Récupérer les statistiques des activités
 */
export async function getActivitesStatsNiveau(
  uniteId: number,
  anneeConferenceId?: number,
  planActionId?: number
): Promise<any> {
  try {
    let activites: any[] = []

    if (planActionId) {
      activites = await getActivitesByPlanActionNiveau(planActionId)
    } else if (uniteId) {
      activites = await getActivitesByUniteNiveau(uniteId, anneeConferenceId)
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
    console.error('Erreur getActivitesStatsNiveau:', error)
    return null
  }
}

/**
 * Mettre à jour le commentaire d'une activité
 */
export async function updateActiviteCommentaireNiveau(
  activiteId: number,
  commentaire: string,
  niveau: 'district' | 'conference'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: activite, error: selectError } = await supabase
      .from('activite')
      .select('id, unite_id, unite:unite_id(niveau)')
      .eq('id', activiteId)
      .single()

    if (selectError || !activite) {
      return { success: false, error: 'Activité non trouvée' }
    }

    const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
    
    if (unite?.niveau !== niveau) {
      return { success: false, error: 'Vous ne pouvez modifier cette activité' }
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
    console.error('Error in updateActiviteCommentaireNiveau:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================
// GESTION DES FICHIERS
// ============================================================

/**
 * Récupérer les fichiers d'une activité
 */
export async function getActiviteFilesNiveau(activiteId: number): Promise<ActiviteFichier[]> {
  try {
    const { data, error } = await supabase
      .from('activite_fichier')
      .select('*')
      .eq('activite_id', activiteId)
      .order('id', { ascending: true })

    if (error) {
      console.error('Erreur getActiviteFilesNiveau:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActiviteFilesNiveau:', error)
    return []
  }
}

/**
 * Ajouter un fichier à une activité
 */
export async function addFileToActiviteNiveau(
  formData: FormData,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; fichier?: any; error?: string }> {
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

    if (unite?.niveau !== niveau) {
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

    if (niveau === 'district') {
      revalidatePath(`/district/activites/${activiteId}`)
    } else {
      revalidatePath(`/conference/activites/${activiteId}`)
    }

    return { success: true, fichier: fileRecord }
  } catch (error) {
    console.error('Erreur inattendue addFileToActiviteNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

/**
 * Supprimer un fichier d'une activité
 */
export async function deleteActiviteFileNiveau(
  fichierId: number,
  activiteId: number,
  fileUrl: string,
  niveau: 'district' | 'conference'
): Promise<{ success?: boolean; error?: string }> {
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

    if (unite?.niveau !== niveau) {
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

    if (niveau === 'district') {
      revalidatePath(`/district/activites/${activiteId}`)
    } else {
      revalidatePath(`/conference/activites/${activiteId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteFileNiveau:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// ============================================================
// FONCTIONS D'EXPORT POUR COMPATIBILITÉ AVEC LES IMPORTS EXISTANTS
// ============================================================

// Pour le district
export async function getActivitesStatsByUniteAndAnnee(uniteId: number, anneeConferenceId: number) {
  return getActivitesStatsNiveau(uniteId, anneeConferenceId)
}

// Alias pour compatibilité
export const getActivitesStatsForDistrict = getActivitesStatsByUniteAndAnnee
export const getActivitesStatsForConference = getActivitesStatsByUniteAndAnnee