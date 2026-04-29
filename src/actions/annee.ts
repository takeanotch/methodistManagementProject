
// actions/annee.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Récupérer une année par son label (ou créer si elle n'existe pas)
export async function getAnneeActive(label: string = '2025-2026') {
  try {
    // Chercher l'année
    let { data: annee } = await supabase
      .from('annee')
      .select('*')
      .eq('label', label)
      .single()

    // Si elle n'existe pas, la créer
    if (!annee) {
      const { data: newAnnee, error } = await supabase
        .from('annee')
        .insert([{ label }])
        .select()
        .single()

      if (error) {
        console.error('Erreur lors de la création de l\'année:', error)
        return null
      }

      annee = newAnnee
    }

    return annee
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return null
  }
}

// Récupérer toutes les années
export async function getAnnees() {
  const { data: annees, error } = await supabase
    .from('annee')
    .select('*')
    .order('label', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des années:', error)
    return []
  }

  return annees
}

// Créer l'année suivante
export async function createNextYear() {
  try {
    // Récupérer la dernière année
    const { data: annees, error: fetchError } = await supabase
      .from('annee')
      .select('label')
      .order('label', { ascending: false })
      .limit(1)

    if (fetchError) {
      return { error: 'Erreur lors de la récupération de la dernière année' }
    }

    let nextLabel = '2025-2026' // Par défaut si aucune année

    if (annees && annees.length > 0) {
      const dernierLabel = annees[0].label
      // Extraire les années du format "2025-2026"
      const matches = dernierLabel.match(/(\d{4})-(\d{4})/)
      
      if (matches) {
        const anneeDebut = parseInt(matches[1])
        const anneeFin = parseInt(matches[2])
        
        // Vérifier que c'est bien consécutif (anneeFin = anneeDebut + 1)
        if (anneeFin === anneeDebut + 1) {
          nextLabel = `${anneeDebut + 1}-${anneeFin + 1}`
        } else {
          // Si le format est incorrect, on prend l'année suivante basée sur l'année de fin
          nextLabel = `${anneeFin}-${anneeFin + 1}`
        }
      }
    }

    // Vérifier si l'année existe déjà
    const { data: existing } = await supabase
      .from('annee')
      .select('id')
      .eq('label', nextLabel)
      .single()

    if (existing) {
      return { error: `L'année ${nextLabel} existe déjà` }
    }

    // Créer la nouvelle année
    const { data: newYear, error: insertError } = await supabase
      .from('annee')
      .insert([{ label: nextLabel }])
      .select()
      .single()

    if (insertError) {
      return { error: 'Erreur lors de la création de l\'année' }
    }

    revalidatePath('/admin/annees')
    return { success: true, annee: newYear }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}

// actions/annee.ts - deleteAnnee corrigé

export async function deleteAnnee(id: number) {
  try {
    // 1. Vérifier si l'année est utilisée dans annee_conference
    const { data: confAnnees, error: confError } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('annee_id', id)
      .limit(1)

    if (confError && !confError.message?.includes('does not exist')) {
      return { error: 'Erreur lors de la vérification' }
    }

    if (confAnnees && confAnnees.length > 0) {
      return { error: 'Impossible de supprimer cette année car elle est associée à des conférences' }
    }

    // 2. Vérifier si l'année est utilisée dans annee_district
    const { data: districtAnnees, error: districtError } = await supabase
      .from('annee_district')
      .select('id')
      .eq('annee_id', id)
      .limit(1)

    if (districtError && !districtError.message?.includes('does not exist')) {
      return { error: 'Erreur lors de la vérification' }
    }

    if (districtAnnees && districtAnnees.length > 0) {
      return { error: 'Impossible de supprimer cette année car elle est associée à des districts' }
    }

    // 3. Supprimer l'année
    const { error } = await supabase
      .from('annee')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath('/admin/annees')
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}


export async function getAnneeByLabel(label: string) {
  const { data: annee, error } = await supabase
    .from('annee')
    .select('id, label')
    .eq('label', label)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération de l\'année:', error)
    return null
  }

  return annee
}