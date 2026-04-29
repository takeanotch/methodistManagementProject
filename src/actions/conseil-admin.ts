// actions/conseil-admin.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// ============================================
// TYPES
// ============================================

export interface ConseilMembre {
  id: number
  paroisse_id: number
  fidele_id: number
  annee_conference_id: number
  role: 'president' | 'vice_president' | 'secretaire'
  created_at: string
  fidele?: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
  }
}

export interface Conseil {
  id: number
  paroisse_id: number
  annee_conference_id: number
  libelle: string
  date_reunion: string
  commentaire: string | null
  created_at: string
  updated_at: string
  documents?: ConseilDocument[]
}

export interface ConseilDocument {
  id: number
  conseil_id: number
  nom_fichier: string
  type_fichier: string | null
  taille_fichier: number | null
  url_fichier: string
  created_at: string
}

// ============================================
// MEMBRES DU CONSEIL
// ============================================

// Récupérer les membres du conseil pour une paroisse et une année
export async function getConseilMembres(paroisseId: number, anneeConferenceId: number) {
  const { data, error } = await supabase
    .from('conseil_admin_membre')
    .select(`
      *,
      fidele:fidele_id(id, nom, post_nom, prenom, contact, profile_img)
    `)
    .eq('paroisse_id', paroisseId)
    .eq('annee_conference_id', anneeConferenceId)
    .order('role')
  
  if (error) {
    console.error('Erreur récupération membres:', error)
    return []
  }
  
  return data
}

// Sauvegarder un membre (ajout ou mise à jour)
export async function saveConseilMembre(formData: FormData) {
  const paroisse_id = parseInt(formData.get('paroisse_id') as string)
  const fidele_id = parseInt(formData.get('fidele_id') as string)
  const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
  const role = formData.get('role') as string
  
  // Vérifier si un membre existe déjà pour ce rôle
  const { data: existing } = await supabase
    .from('conseil_admin_membre')
    .select('id')
    .eq('paroisse_id', paroisse_id)
    .eq('annee_conference_id', annee_conference_id)
    .eq('role', role)
    .maybeSingle()
  
  if (existing) {
    // Mise à jour
    const { data, error } = await supabase
      .from('conseil_admin_membre')
      .update({ fidele_id })
      .eq('id', existing.id)
      .select()
      .single()
    
    if (error) {
      return { error: 'Erreur lors de la mise à jour' }
    }
    
    revalidatePath(`/paroisse/${paroisse_id}/conseil`)
    return { success: true, membre: data }
  }
  
  // Création
  const { data, error } = await supabase
    .from('conseil_admin_membre')
    .insert([{ paroisse_id, fidele_id, annee_conference_id, role }])
    .select()
    .single()
  
  if (error) {
    return { error: 'Erreur lors de l\'ajout' }
  }
  
  revalidatePath(`/paroisse/${paroisse_id}/conseil`)
  return { success: true, membre: data }
}

// ============================================
// CONSEILS (RAPPORTS)
// ============================================

// Récupérer les conseils d'une paroisse pour une année
export async function getConseils(paroisseId: number, anneeConferenceId: number) {
  const { data, error } = await supabase
    .from('conseil_admin')
    .select(`
      *,
      documents:conseil_admin_document(*)
    `)
    .eq('paroisse_id', paroisseId)
    .eq('annee_conference_id', anneeConferenceId)
    .order('date_reunion', { ascending: false })
  
  if (error) {
    console.error('Erreur récupération conseils:', error)
    return []
  }
  
  return data
}

// Créer un conseil
export async function createConseil(formData: FormData) {
  const paroisse_id = parseInt(formData.get('paroisse_id') as string)
  const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
  const libelle = formData.get('libelle') as string
  const date_reunion = formData.get('date_reunion') as string
  const commentaire = formData.get('commentaire') as string || null
  
  const { data, error } = await supabase
    .from('conseil_admin')
    .insert([{ paroisse_id, annee_conference_id, libelle, date_reunion, commentaire }])
    .select()
    .single()
  
  if (error) {
    return { error: 'Erreur lors de la création' }
  }
  
  revalidatePath(`/paroisse/${paroisse_id}/conseil`)
  return { success: true, conseil: data }
}

// Mettre à jour un conseil
export async function updateConseil(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const libelle = formData.get('libelle') as string
  const date_reunion = formData.get('date_reunion') as string
  const commentaire = formData.get('commentaire') as string || null
  
  const { data, error } = await supabase
    .from('conseil_admin')
    .update({ libelle, date_reunion, commentaire, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('paroisse_id')
    .single()
  
  if (error) {
    return { error: 'Erreur lors de la mise à jour' }
  }
  
  revalidatePath(`/paroisse/${data.paroisse_id}/conseil`)
  return { success: true }
}

// Supprimer un conseil
export async function deleteConseil(id: number) {
  const { data: conseil } = await supabase
    .from('conseil_admin')
    .select('paroisse_id')
    .eq('id', id)
    .single()
  
  const { error } = await supabase
    .from('conseil_admin')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { error: 'Erreur lors de la suppression' }
  }
  
  if (conseil) {
    revalidatePath(`/paroisse/${conseil.paroisse_id}/conseil`)
  }
  
  return { success: true }
}

// ============================================
// DOCUMENTS
// ============================================

// Upload de document
export async function uploadConseilDocument(formData: FormData) {
  const conseil_id = parseInt(formData.get('conseil_id') as string)
  const file = formData.get('file') as File
  
  if (!file) {
    return { error: 'Aucun fichier fourni' }
  }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `conseil-${conseil_id}-${Date.now()}.${fileExt}`
  const filePath = `${conseil_id}/${fileName}`
  
  const { error: uploadError } = await supabase.storage
    .from('conseil-documents')
    .upload(filePath, file)
  
  if (uploadError) {
    return { error: 'Erreur lors de l\'upload' }
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('conseil-documents')
    .getPublicUrl(filePath)
  
  const { data, error } = await supabase
    .from('conseil_admin_document')
    .insert([{
      conseil_id,
      nom_fichier: file.name,
      type_fichier: file.type,
      taille_fichier: file.size,
      url_fichier: publicUrl
    }])
    .select()
    .single()
  
  if (error) {
    return { error: 'Erreur lors de la sauvegarde' }
  }
  
  return { success: true, document: data }
}

// Supprimer un document
export async function deleteConseilDocument(id: number) {
  const { data: doc } = await supabase
    .from('conseil_admin_document')
    .select('url_fichier')
    .eq('id', id)
    .single()
  
  if (doc) {
    const urlParts = doc.url_fichier.split('/')
    const filePath = urlParts.slice(-2).join('/')
    await supabase.storage.from('conseil-documents').remove([filePath])
  }
  
  const { error } = await supabase
    .from('conseil_admin_document')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { error: 'Erreur lors de la suppression' }
  }
  
  return { success: true }
}