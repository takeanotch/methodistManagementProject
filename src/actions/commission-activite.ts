// actions/commission-activite.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

export interface CommissionActivite {
  id: number
  commission_id: number
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

export interface CommissionActiviteFichier {
  id: number
  activite_id: number
  nom_fichier: string
  chemin_fichier: string
  type_fichier: string
}

// Récupérer les activités d'une commission
export async function getActivitesByCommission(
  commissionId: number,
  anneeConferenceId?: number,
  filters?: { statut?: string; dateDebut?: string; dateFin?: string }
): Promise<CommissionActivite[]> {
  try {
    console.log('🔍 getActivitesByCommission:', { commissionId, anneeConferenceId })
    
    let query = supabase
      .from('commission_activite')
      .select('*')
      .eq('commission_id', commissionId)

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

    console.log(`✅ ${data?.length || 0} activités trouvées`)
    return data || []
  } catch (error) {
    console.error('❌ Erreur getActivitesByCommission:', error)
    return []
  }
}

// Récupérer les activités d'un plan d'action
export async function getActivitesByCommissionPlanAction(planActionId: number): Promise<CommissionActivite[]> {
  try {
    const { data, error } = await supabase
      .from('commission_activite')
      .select('*')
      .eq('plan_action_id', planActionId)
      .order('date', { ascending: true })
      .order('heure', { ascending: true })

    if (error) {
      console.error('❌ Erreur getActivitesByCommissionPlanAction:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Erreur getActivitesByCommissionPlanAction:', error)
    return []
  }
}

// Récupérer une activité par son ID
export async function getCommissionActiviteById(id: number): Promise<CommissionActivite | null> {
  try {
    const { data, error } = await supabase
      .from('commission_activite')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Erreur getCommissionActiviteById:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('❌ Erreur getCommissionActiviteById:', error)
    return null
  }
}

// Créer une activité
export async function createCommissionActivite(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const commission_id = parseInt(formData.get('commission_id') as string)
    const plan_action_id = formData.get('plan_action_id') ? parseInt(formData.get('plan_action_id') as string) : null
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const date = formData.get('date') as string
    const heure = formData.get('heure') as string
    const statut = formData.get('statut') as string || 'planifie'

    if (!commission_id || isNaN(commission_id)) {
      return { error: 'Commission invalide' }
    }

    if (!annee_conference_id || isNaN(annee_conference_id)) {
      return { error: 'Année de conférence invalide' }
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

    // Vérifier les droits
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele) {
      return { error: 'Fidèle non trouvé' }
    }

    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commission_id)
      .single()

    if (!commission || commission.paroisse_id !== fidele.paroisse_id) {
      return { error: 'Vous ne pouvez créer une activité que pour votre commission' }
    }

    // Créer l'activité
    const { data: newActivite, error } = await supabase
      .from('commission_activite')
      .insert([{
        commission_id,
        plan_action_id,
        annee_conference_id,
        titre: titre.trim(),
        description,
        date,
        heure,
        statut
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur createCommissionActivite:', error)
      return { error: 'Erreur lors de la création de l\'activité' }
    }

    revalidatePath(`/paroisse/commissions/${commission_id}`)
    revalidatePath(`/paroisse/commissions/${commission_id}/activites`)
    if (plan_action_id) {
      revalidatePath(`/paroisse/commissions/${commission_id}/plans-action/${plan_action_id}`)
    }

    return { success: true, activite: newActivite, id: newActivite.id }
  } catch (error) {
    console.error('❌ Erreur createCommissionActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Mettre à jour une activité
export async function updateCommissionActivite(formData: FormData) {
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

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    // Vérifier les droits
    const { data: activite, error: activiteError } = await supabase
      .from('commission_activite')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', activite.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez modifier cette activité' }
      }
    }

    const { error } = await supabase
      .from('commission_activite')
      .update({
        titre: titre.trim(),
        description,
        date,
        heure,
        statut,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur updateCommissionActivite:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/paroisse/commissions/${activite.commission_id}`)
    revalidatePath(`/paroisse/commissions/${activite.commission_id}/activites`)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur updateCommissionActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Supprimer une activité
export async function deleteCommissionActivite(id: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('commission_activite')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', activite.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez supprimer cette activité' }
      }
    }

    // Supprimer les fichiers associés
    const { data: fichiers } = await supabase
      .from('commission_activite_fichier')
      .select('chemin_fichier')
      .eq('activite_id', id)

    if (fichiers && fichiers.length > 0) {
      for (const fichier of fichiers) {
        const pathMatch = fichier.chemin_fichier.match(/\/commission-activites\/(.+)$/)
        if (pathMatch) {
          await supabase.storage.from('commission-activites').remove([pathMatch[1]])
        }
      }

      await supabase
        .from('commission_activite_fichier')
        .delete()
        .eq('activite_id', id)
    }

    const { error } = await supabase
      .from('commission_activite')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur deleteCommissionActivite:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${activite.commission_id}`)
    revalidatePath(`/paroisse/commissions/${activite.commission_id}/activites`)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur deleteCommissionActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Changer le statut d'une activité
export async function updateCommissionActiviteStatut(id: number, statut: 'planifie' | 'en_cours' | 'termine' | 'annule') {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('commission_activite')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', activite.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez modifier cette activité' }
      }
    }

    const { error } = await supabase
      .from('commission_activite')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur updateCommissionActiviteStatut:', error)
      return { error: 'Erreur lors du changement de statut' }
    }

    revalidatePath(`/paroisse/commissions/${activite.commission_id}`)
    revalidatePath(`/paroisse/commissions/${activite.commission_id}/activites`)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur updateCommissionActiviteStatut:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Gestion des fichiers joints
export async function getCommissionActiviteFiles(activiteId: number): Promise<CommissionActiviteFichier[]> {
  try {
    const { data, error } = await supabase
      .from('commission_activite_fichier')
      .select('*')
      .eq('activite_id', activiteId)
      .order('id', { ascending: true })

    if (error) {
      console.error('❌ Erreur getCommissionActiviteFiles:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Erreur getCommissionActiviteFiles:', error)
    return []
  }
}

export async function addFileToCommissionActivite(formData: FormData) {
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
      return { error: 'Le fichier ne doit pas dépasser 50 Mo' }
    }

    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'avi', 'mov', 'mp3', 'wav', 'zip']
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return { error: 'Type de fichier non autorisé' }
    }

    // Vérifier les droits
    const { data: activite, error: activiteError } = await supabase
      .from('commission_activite')
      .select('commission_id')
      .eq('id', activiteId)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const uniqueFileName = `${timestamp}_${randomId}_${safeFileName}`
    const filePath = `${activiteId}/${uniqueFileName}`

    const { error: uploadError } = await supabase.storage
      .from('commission-activites')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Erreur upload:', uploadError)
      return { error: `Erreur d'upload: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage
      .from('commission-activites')
      .getPublicUrl(filePath)

    const { data: fileRecord, error: dbError } = await supabase
      .from('commission_activite_fichier')
      .insert([{
        activite_id: activiteId,
        nom_fichier: file.name,
        chemin_fichier: publicUrlData.publicUrl,
        type_fichier: fileExt
      }])
      .select()
      .single()

    if (dbError) {
      await supabase.storage.from('commission-activites').remove([filePath])
      return { error: `Erreur d'enregistrement: ${dbError.message}` }
    }

    revalidatePath(`/paroisse/commissions/${activite.commission_id}/activites/${activiteId}`)

    return { success: true, fichier: fileRecord }
  } catch (error) {
    console.error('❌ Erreur addFileToCommissionActivite:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function deleteCommissionActiviteFile(fichierId: number, activiteId: number, fileUrl: string) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const { data: activite, error: activiteError } = await supabase
      .from('commission_activite')
      .select('commission_id')
      .eq('id', activiteId)
      .single()

    if (activiteError || !activite) {
      return { error: 'Activité non trouvée' }
    }

    const pathMatch = fileUrl.match(/\/commission-activites\/(.+)$/)
    const storagePath = pathMatch ? pathMatch[1] : null

    if (storagePath) {
      await supabase.storage.from('commission-activites').remove([storagePath])
    }

    const { error: dbError } = await supabase
      .from('commission_activite_fichier')
      .delete()
      .eq('id', fichierId)

    if (dbError) {
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${activite.commission_id}/activites/${activiteId}`)

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur deleteCommissionActiviteFile:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Statistiques des activités
export async function getCommissionActivitesStats(commissionId: number, anneeConferenceId?: number) {
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
    console.error('❌ Erreur getCommissionActivitesStats:', error)
    return null
  }
}