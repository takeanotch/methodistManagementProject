
// actions/activite-commission.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'
import { getCommissionUnite, ensureCommissionUniteExists } from './unite-organisation'

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

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

async function getConferenceFromParoisse(paroisseId: number): Promise<number | null> {
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

async function userHasAccessToCommission(
  userId: string, 
  commissionId: number
): Promise<{ hasAccess: boolean; paroisseId: number | null; error?: string }> {
  try {
    const userParoisseId = await getUserParoisseId(userId)
    if (!userParoisseId) {
      return { hasAccess: false, paroisseId: null, error: 'Utilisateur sans paroisse' }
    }

    const { data: commission, error } = await supabase
      .from('commission')
      .select('paroisse_id, departement_id')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      return { hasAccess: false, paroisseId: null, error: 'Commission non trouvée' }
    }

    if (commission.paroisse_id !== userParoisseId) {
      return { hasAccess: false, paroisseId: null, error: 'Accès non autorisé à cette commission' }
    }

    return { hasAccess: true, paroisseId: userParoisseId }
  } catch (error) {
    console.error('Erreur userHasAccessToCommission:', error)
    return { hasAccess: false, paroisseId: null, error: 'Erreur de vérification des droits' }
  }
}

async function getOrCreateCommissionUnite(
  commissionId: number, 
  paroisseId: number
): Promise<{ id: number } | null> {
  try {
    let unite = await getCommissionUnite(commissionId, paroisseId)
    
    if (unite) {
      return unite
    }

    const { data: commission, error } = await supabase
      .from('commission')
      .select('departement_id, nom')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      console.error('Commission non trouvée:', error)
      return null
    }

    const result = await ensureCommissionUniteExists(
      commissionId,
      commission.departement_id,
      paroisseId
    )

    if (!result.success || !result.unite) {
      console.error('Impossible de créer l\'unité de la commission:', result.error)
      return null
    }

    return result.unite
  } catch (error) {
    console.error('Erreur getOrCreateCommissionUnite:', error)
    return null
  }
}

// ============================================
// RÉCUPÉRATION DES DONNÉES
// ============================================

export async function getAnneesConferenceForCommission(commissionId: number) {
  try {
    const { data: commission, error } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      console.error('Commission non trouvée:', error)
      return []
    }

    const conferenceId = await getConferenceFromParoisse(commission.paroisse_id)
    if (!conferenceId) {
      return []
    }

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error('Erreur getAnneesConferenceForCommission:', error)
    return []
  }
}

export async function getPlansActionForCommissionActivite(commissionId: number, anneeConferenceId?: number) {
  try {
    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (!commission) return []

    const unite = await getCommissionUnite(commissionId, commission.paroisse_id)
    if (!unite) return []

    let query = supabase
      .from('plan_action')
      .select('id, titre, annee_conference_id')
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getPlansActionForCommissionActivite:', error)
    return []
  }
}

export async function getActivitesByCommission(
  commissionId: number, 
  anneeConferenceId?: number,
  filters?: { statut?: string; dateDebut?: string; dateFin?: string }
) {
  try {
    console.log('🔍 getActivitesByCommission - Début', { commissionId, anneeConferenceId })

    const { data: commission, error: commError } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (commError || !commission) {
      console.error('❌ Commission non trouvée:', commError)
      return []
    }

    const unite = await getOrCreateCommissionUnite(commissionId, commission.paroisse_id)
    
    if (!unite) {
      console.error('❌ Impossible de récupérer l\'unité de la commission')
      return []
    }

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
      .eq('unite_id', unite.id)

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
      console.error('❌ Erreur getActivitesByCommission:', error)
      return []
    }

    console.log(`✅ getActivitesByCommission - ${data?.length || 0} activités trouvées`)

    return (data || []).map(activite => ({
      ...activite,
      unite: Array.isArray(activite.unite) ? activite.unite[0] : activite.unite,
      plan_action: activite.plan_action ? (Array.isArray(activite.plan_action) ? activite.plan_action[0] : activite.plan_action) : null,
      annee_conference: activite.annee_conference ? (Array.isArray(activite.annee_conference) ? activite.annee_conference[0] : activite.annee_conference) : null
    }))
  } catch (error) {
    console.error('❌ Erreur inattendue getActivitesByCommission:', error)
    return []
  }
}

export async function getActiviteByIdForCommission(id: number, commissionId: number): Promise<Activite | null> {
  try {
    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (!commission) return null

    const unite = await getCommissionUnite(commissionId, commission.paroisse_id)
    if (!unite) return null

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
      .eq('unite_id', unite.id)
      .single()

    if (error || !data) {
      console.error('Erreur getActiviteByIdForCommission:', error)
      return null
    }

    return {
      ...data,
      unite: Array.isArray(data.unite) ? data.unite[0] : data.unite,
      plan_action: data.plan_action ? (Array.isArray(data.plan_action) ? data.plan_action[0] : data.plan_action) : null,
      annee_conference: data.annee_conference ? (Array.isArray(data.annee_conference) ? data.annee_conference[0] : data.annee_conference) : null
    }
  } catch (error) {
    console.error('Erreur inattendue getActiviteByIdForCommission:', error)
    return null
  }
}

// ============================================
// CRUD ACTIVITÉS
// ============================================

export async function createActiviteForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const commissionId = parseInt(formData.get('commission_id') as string)
    const annee_conference_id = formData.get('annee_conference_id') 
      ? parseInt(formData.get('annee_conference_id') as string) 
      : null
    const plan_action_id = formData.get('plan_action_id') 
      ? parseInt(formData.get('plan_action_id') as string) 
      : null
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const date = formData.get('date') as string
    const heure = formData.get('heure') as string
    const statut = formData.get('statut') as string || 'planifie'

    if (!commissionId || isNaN(commissionId)) {
      return { error: 'Commission invalide' }
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

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getOrCreateCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Impossible de créer l\'unité d\'organisation pour cette commission' }
    }

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
      const conferenceId = await getConferenceFromParoisse(access.paroisseId)
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
        unite_id: unite.id,
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
      console.error('Erreur createActiviteForCommission:', error)
      return { error: 'Erreur lors de la création de l\'activité' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}`)
    revalidatePath(`/paroisse/commissions/${commissionId}/activites`)
    revalidatePath(`/admin/commissions/${commissionId}`)
    revalidatePath(`/admin/commissions/${commissionId}/activites`)

    return { success: true, activite: newActivite, id: newActivite.id }
  } catch (error) {
    console.error('Erreur inattendue createActiviteForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function updateActiviteForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const commissionId = parseInt(formData.get('commission_id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const date = formData.get('date') as string
    const heure = formData.get('heure') as string
    const statut = formData.get('statut') as string
    const annee_conference_id = formData.get('annee_conference_id') 
      ? parseInt(formData.get('annee_conference_id') as string) 
      : undefined
    const plan_action_id = formData.get('plan_action_id') 
      ? parseInt(formData.get('plan_action_id') as string) 
      : null

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    if (!commissionId || isNaN(commissionId)) {
      return { error: 'Commission invalide' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('id')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée ou accès non autorisé' }
    }

    const updateData: any = {
      titre: titre.trim(),
      description,
      date,
      heure,
      statut,
      updated_at: new Date().toISOString()
    }

    if (annee_conference_id !== undefined) {
      updateData.annee_conference_id = annee_conference_id
    }
    if (plan_action_id !== undefined) {
      updateData.plan_action_id = plan_action_id
    }

    const { error } = await supabase
      .from('activite')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erreur updateActiviteForCommission:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}`)
    revalidatePath(`/paroisse/commissions/${commissionId}/activites`)
    revalidatePath(`/admin/commissions/${commissionId}`)
    revalidatePath(`/admin/commissions/${commissionId}/activites`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function deleteActiviteForCommission(id: number, commissionId: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('id')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée ou accès non autorisé' }
    }

    const { error } = await supabase
      .from('activite')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deleteActiviteForCommission:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}`)
    revalidatePath(`/paroisse/commissions/${commissionId}/activites`)
    revalidatePath(`/admin/commissions/${commissionId}`)
    revalidatePath(`/admin/commissions/${commissionId}/activites`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function updateActiviteStatutForCommission(
  id: number, 
  commissionId: number, 
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { error } = await supabase
      .from('activite')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('unite_id', unite.id)

    if (error) {
      console.error('Erreur updateActiviteStatutForCommission:', error)
      return { error: 'Erreur lors du changement de statut' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}`)
    revalidatePath(`/paroisse/commissions/${commissionId}/activites`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateActiviteStatutForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// ============================================
// STATISTIQUES
// ============================================

export async function getActivitesStatsForCommission(
  commissionId: number, 
  anneeConferenceId?: number
) {
  try {
    const activites = await getActivitesByCommission(commissionId, anneeConferenceId)

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
    console.error('Erreur getActivitesStatsForCommission:', error)
    return null
  }
}

// ============================================
// GESTION DES FICHIERS
// ============================================

export async function getActiviteFilesForCommission(
  activiteId: number, 
  commissionId: number
): Promise<ActiviteFichier[]> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return []

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) return []

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) return []

    const { data: activite } = await supabase
      .from('activite')
      .select('id')
      .eq('id', activiteId)
      .eq('unite_id', unite.id)
      .single()

    if (!activite) return []

    const { data, error } = await supabase
      .from('activite_fichier')
      .select('*')
      .eq('activite_id', activiteId)
      .order('id', { ascending: true })

    if (error) {
      console.error('Erreur getActiviteFilesForCommission:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Erreur inattendue getActiviteFilesForCommission:', error)
    return []
  }
}

export async function addFileToActiviteForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const activiteId = parseInt(formData.get('activite_id') as string)
    const commissionId = parseInt(formData.get('commission_id') as string)
    const file = formData.get('file') as File

    if (!activiteId || isNaN(activiteId)) return { error: 'Activité invalide' }
    if (!commissionId || isNaN(commissionId)) return { error: 'Commission invalide' }
    if (!file) return { error: 'Aucun fichier sélectionné' }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) return { error: 'Unité d\'organisation non trouvée' }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('id')
      .eq('id', activiteId)
      .eq('unite_id', unite.id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée ou accès non autorisé' }
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

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `${timestamp}_${randomId}_${safeFileName}`
    const filePath = `${activiteId}/${uniqueFileName}`

    const { error: uploadError } = await supabase.storage
      .from('activites')
      .upload(filePath, file, { cacheControl: '3600', upsert: false })

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

    revalidatePath(`/paroisse/commissions/${commissionId}/activites/${activiteId}`)

    return { success: true, fichier: fileRecord }
  } catch (error) {
    console.error('Erreur inattendue addFileToActiviteForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function deleteActiviteFileForCommission(
  fichierId: number, 
  activiteId: number, 
  commissionId: number,
  fileUrl: string
) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) return { error: 'Unité d\'organisation non trouvée' }

    const { data: activite, error: activiteError } = await supabase
      .from('activite')
      .select('id')
      .eq('id', activiteId)
      .eq('unite_id', unite.id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée ou accès non autorisé' }
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

    revalidatePath(`/paroisse/commissions/${commissionId}/activites/${activiteId}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteActiviteFileForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}