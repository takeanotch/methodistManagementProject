// actions/configurations.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface Configuration {
  id: number
  unite_id: number
  taux: number
  visibilite_budget: {
    region?: 'visible' | 'masque'  
    conference: 'visible' | 'masque'
    district: 'visible' | 'masque'
    paroisse: 'visible' | 'masque'
  }
  created_at: string
  updated_at: string
}

/**
 * Récupère la configuration d'une unité
 */
export async function getConfiguration(uniteId: number): Promise<Configuration | null> {
  try {
    const { data, error } = await supabase
      .from('configuration')
      .select('*')
      .eq('unite_id', uniteId)
      .maybeSingle()
    
    if (error) {
      console.error('Erreur getConfiguration:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Erreur getConfiguration:', error)
    return null
  }
}

/**
 * Sauvegarde une configuration
 */
export async function saveConfiguration(
  uniteId: number,
  data: {
    taux?: number
    visibilite_budget?: {
      conference?: 'visible' | 'masque'
      district?: 'visible' | 'masque'
      paroisse?: 'visible' | 'masque'
    }
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await getConfiguration(uniteId)
    
    if (existing) {
      // Update
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      if (data.taux !== undefined) {
        updateData.taux = data.taux
      }
      
      if (data.visibilite_budget) {
        updateData.visibilite_budget = {
          ...existing.visibilite_budget,
          ...data.visibilite_budget
        }
      }
      
      const { error } = await supabase
        .from('configuration')
        .update(updateData)
        .eq('id', existing.id)
      
      if (error) throw error
    } else {
      // Create
      const insertData = {
        unite_id: uniteId,
        taux: data.taux || 2800.00,
        visibilite_budget: {
          region: 'visible',   
          conference: 'visible',
          district: 'visible',
          paroisse: 'visible',
          ...data.visibilite_budget
        }
      }
      
      const { error } = await supabase
        .from('configuration')
        .insert([insertData])
      
      if (error) throw error
    }
    
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Erreur saveConfiguration:', error)
    return { success: false, error: error.message }
  }
}