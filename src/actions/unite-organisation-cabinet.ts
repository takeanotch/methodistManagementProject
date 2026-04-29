// actions/unite-organisation-cabinet.ts
'use server'

import { supabase } from '@/lib/supabase'

export interface UniteOrganisation {
  id: number
  nom: string
  niveau: 'region' | 'conference' | 'district' | 'paroisse' | 'departement' | 'cabinet'
  parent_id: number | null
  reference_id: number
  reference_table: string
  id_niveau: number
  created_at: string
  updated_at: string
}

/**
 * Récupère l'unité du cabinet pastoral pour une paroisse
 */
export async function getCabinetUniteForParoisse(
  paroisseId: number
): Promise<{ id: number; nom?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('id, nom')
      .eq('reference_table', 'cabinet_pastoral')
      .eq('reference_id', paroisseId)
      .eq('niveau', 'cabinet')
      .maybeSingle()

    if (error) {
      console.error('Erreur getCabinetUniteForParoisse:', error)
      return null
    }

    return data ? { id: data.id, nom: data.nom } : null
  } catch (error) {
    console.error('Erreur getCabinetUniteForParoisse:', error)
    return null
  }
}

/**
 * S'assure que l'unité du cabinet pastoral existe pour une paroisse
 */
export async function ensureCabinetUniteExists(
  paroisseId: number
): Promise<{ success: boolean; unite: { id: number } | null; error?: string }> {
  try {
    // Vérifier si l'unité existe déjà
    const existing = await getCabinetUniteForParoisse(paroisseId)
    if (existing) {
      return { success: true, unite: existing }
    }

    // Récupérer le nom de la paroisse
    const { data: paroisse, error: paroisseError } = await supabase
      .from('paroisse')
      .select('nom')
      .eq('id', paroisseId)
      .single()

    if (paroisseError || !paroisse) {
      return { success: false, error: 'Paroisse introuvable', unite: null }
    }

    // Créer l'unité
    const unite = await syncCabinetUniteOrganisation(
      paroisseId,
      `Cabinet Pastoral - ${paroisse.nom}`
    )

    if (!unite) {
      return { success: false, error: 'Impossible de créer l\'unité', unite: null }
    }

    return { success: true, unite: { id: unite.id } }
  } catch (error) {
    console.error('Erreur ensureCabinetUniteExists:', error)
    return { success: false, error: 'Une erreur est survenue', unite: null }
  }
}

/**
 * Crée ou met à jour l'unité d'organisation du cabinet pastoral
 */
export async function syncCabinetUniteOrganisation(
  paroisseId: number,
  nom: string,
  parentId: number | null = null
): Promise<UniteOrganisation | null> {
  try {
    const uniteData = {
      nom,
      niveau: 'cabinet' as const,
      parent_id: parentId,
      reference_id: paroisseId,
      reference_table: 'cabinet_pastoral',
      id_niveau: paroisseId,
      updated_at: new Date().toISOString()
    }

    // Vérifier l'existence
    const { data: existing } = await supabase
      .from('unite_organisation')
      .select('*')
      .eq('reference_table', 'cabinet_pastoral')
      .eq('reference_id', paroisseId)
      .eq('niveau', 'cabinet')
      .maybeSingle()

    let result

    if (existing) {
      // Mise à jour
      const { data, error } = await supabase
        .from('unite_organisation')
        .update(uniteData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      result = data
    } else {
      // Création
      const { data, error } = await supabase
        .from('unite_organisation')
        .insert([{
          ...uniteData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      result = data
    }

    return result
  } catch (error) {
    console.error('Erreur syncCabinetUniteOrganisation:', error)
    return null
  }
}

/**
 * Initialise l'unité du cabinet pastoral pour l'utilisateur connecté
 * À appeler lors du premier accès
 */
export async function initCabinetUniteForUser(): Promise<{ success: boolean; uniteId?: number; error?: string }> {
  try {
    const { getUser } = await import('./auth')
    const user = await getUser()
    
    if (!user?.fidele_id) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // Récupérer la paroisse du fidèle
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele?.paroisse_id) {
      return { success: false, error: 'Paroisse non trouvée' }
    }

    // Vérifier si l'utilisateur est membre du cabinet
    const { data: membre } = await supabase
      .from('cabinet_pastoral')
      .select('id')
      .eq('fidele_id', user.fidele_id)
      .eq('est_actif', true)
      .maybeSingle()

    if (!membre) {
      return { success: false, error: 'Vous n\'êtes pas membre du cabinet pastoral' }
    }

    // Créer ou récupérer l'unité
    const result = await ensureCabinetUniteExists(fidele.paroisse_id)
    
    if (result.success && result.unite) {
      return { success: true, uniteId: result.unite.id }
    }

    return result
  } catch (error) {
    console.error('Erreur initCabinetUniteForUser:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}