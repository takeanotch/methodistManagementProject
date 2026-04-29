//actions/annee-district.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

// Types
export interface Annee {
  id: number
  label: string
}

export interface District {
  id: number
  nom: string
}

export interface Departement {
  id: number
  nom: string
}

export interface AnneeDistrict {
  id: number
  district_id: number
  departement_id: number
  annee_id: number
  is_current: boolean
  created_at: string
  updated_at: string
  annee?: Annee
  district?: District
  departement?: Departement
  status?: 'current' | 'past' | 'future'
}

// Récupérer tous les districts
export async function getDistricts() {
  const { data, error } = await supabase
    .from('district')
    .select('id, nom')
    .order('nom')

  if (error) {
    console.error('Erreur districts:', error)
    return []
  }
  return data || []
}

// Récupérer tous les départements
export async function getDepartements() {
  const { data, error } = await supabase
    .from('departement')
    .select('id, nom')
    .order('nom')

  if (error) {
    console.error('Erreur départements:', error)
    return []
  }
  return data || []
}

// Récupérer toutes les années
export async function getAnnees() {
  const { data, error } = await supabase
    .from('annee')
    .select('id, label')
    .order('label', { ascending: false })

  if (error) {
    console.error('Erreur années:', error)
    return []
  }
  return data || []
}

// Récupérer l'historique des années pour un district et département avec leur statut
export async function getAnneesDistrict(districtId: number, departementId: number) {
  const { data, error } = await supabase
    .from('annee_district')
    .select(`
      *,
      annee:annee_id (id, label),
      district:district_id (id, nom),
      departement:departement_id (id, nom)
    `)
    .eq('district_id', districtId)
    .eq('departement_id', departementId)
    .order('annee_id', { ascending: false })

  if (error) {
    console.error('Erreur historique:', error)
    return []
  }

  // Récupérer l'année en cours pour calculer les statuts
  const current = await getCurrentAnneeDistrict(districtId, departementId)

  // Transformer les données avec le statut calculé
  const anneesAvecStatut = (data || []).map((ad: any) => {
    const annee = Array.isArray(ad.annee) ? ad.annee[0] : ad.annee
    const district = Array.isArray(ad.district) ? ad.district[0] : ad.district
    const departement = Array.isArray(ad.departement) ? ad.departement[0] : ad.departement
    
    let status: 'current' | 'past' | 'future' = 'past'
    if (ad.is_current) {
      status = 'current'
    } else if (current && ad.annee_id > current.annee_id) {
      status = 'future'
    }

    return {
      ...ad,
      annee,
      district,
      departement,
      status
    }
  })

  return anneesAvecStatut
}

// Récupérer l'année en cours pour un district et département
export async function getCurrentAnneeDistrict(districtId: number, departementId: number) {
  const { data, error } = await supabase
    .from('annee_district')
    .select(`
      *,
      annee:annee_id (id, label)
    `)
    .eq('district_id', districtId)
    .eq('departement_id', departementId)
    .eq('is_current', true)
    .maybeSingle()

  if (error) {
    console.error('Erreur année en cours:', error)
    return null
  }

  if (data) {
    return {
      ...data,
      annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
    }
  }
  return null
}

// Ajouter une nouvelle année (sans la définir comme courante)
export async function ajouterAnneeDistrict(formData: FormData) {
  try {
    const district_id = parseInt(formData.get('district_id') as string)
    const departement_id = parseInt(formData.get('departement_id') as string)
    const annee_id = parseInt(formData.get('annee_id') as string)

    // Validations
    if (!district_id || isNaN(district_id)) {
      return { error: 'Veuillez sélectionner un district' }
    }
    if (!departement_id || isNaN(departement_id)) {
      return { error: 'Veuillez sélectionner un département' }
    }
    if (!annee_id || isNaN(annee_id)) {
      return { error: 'Veuillez sélectionner une année' }
    }

    // Vérifier si l'association existe déjà
    const { data: existing } = await supabase
      .from('annee_district')
      .select('id')
      .eq('district_id', district_id)
      .eq('departement_id', departement_id)
      .eq('annee_id', annee_id)
      .maybeSingle()

    if (existing) {
      return { error: 'Cette année est déjà ouverte pour ce district/département' }
    }

    // Ajouter l'année (par défaut non courante)
    const { error: insertError } = await supabase
      .from('annee_district')
      .insert([{
        district_id,
        departement_id,
        annee_id,
        is_current: false
      }])

    if (insertError) throw insertError

    revalidatePath('/admin/annees/ouverture')
    return { success: true, message: 'Année ajoutée avec succès' }
  } catch (error) {
    console.error('Erreur:', error)
    return { error: 'Une erreur est survenue lors de l\'ajout' }
  }
}

// Définir une année comme courante
export async function setCurrentAnneeDistrict(formData: FormData) {
  try {
    const district_id = parseInt(formData.get('district_id') as string)
    const departement_id = parseInt(formData.get('departement_id') as string)
    const annee_id = parseInt(formData.get('annee_id') as string)

    if (!district_id || isNaN(district_id) || !departement_id || isNaN(departement_id) || !annee_id || isNaN(annee_id)) {
      return { error: 'Paramètres invalides' }
    }

    // Commencer une transaction
    // 1. Enlever le statut current de toutes les années de ce district/département
    const { error: resetError } = await supabase
      .from('annee_district')
      .update({ is_current: false })
      .eq('district_id', district_id)
      .eq('departement_id', departement_id)

    if (resetError) throw resetError

    // 2. Définir la nouvelle année en cours
    const { error: setError } = await supabase
      .from('annee_district')
      .update({ is_current: true })
      .eq('district_id', district_id)
      .eq('departement_id', departement_id)
      .eq('annee_id', annee_id)

    if (setError) throw setError

    revalidatePath('/admin/annees/ouverture')
    return { success: true, message: 'Année en cours définie avec succès' }
  } catch (error) {
    console.error('Erreur:', error)
    return { error: 'Erreur lors du changement d\'année' }
  }
}

// Supprimer une année (si ce n'est pas l'année en cours)
export async function supprimerAnneeDistrict(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string)

    // Vérifier si c'est l'année en cours
    const { data: annee, error: fetchError } = await supabase
      .from('annee_district')
      .select('is_current')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    if (annee.is_current) {
      return { error: 'Impossible de supprimer l\'année en cours' }
    }

    const { error } = await supabase
      .from('annee_district')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/annees/ouverture')
    return { success: true, message: 'Année supprimée avec succès' }
  } catch (error) {
    console.error('Erreur:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}

// Récupérer toutes les années pour tous les districts/départements (vue d'ensemble)
export async function getAllAnneesDistrict() {
  const { data, error } = await supabase
    .from('annee_district')
    .select(`
      *,
      annee:annee_id (id, label),
      district:district_id (id, nom),
      departement:departement_id (id, nom)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur:', error)
    return []
  }

  // Transformer les données
  const transformedData = (data || []).map((item: any) => ({
    ...item,
    annee: Array.isArray(item.annee) ? item.annee[0] : item.annee,
    district: Array.isArray(item.district) ? item.district[0] : item.district,
    departement: Array.isArray(item.departement) ? item.departement[0] : item.departement
  }))

  return transformedData
}







// actions/annee-district.ts
// Ajouter ces fonctions à la fin du fichier

/**
 * Ouvrir une nouvelle année pour un département (définir comme année en cours)
 * Cette fonction :
 * 1. Vérifie qu'aucune année n'est déjà en cours
 * 2. Ajoute la nouvelle année si elle n'existe pas
 * 3. La définit comme année courante
 */
// export async function openNewYearForDepartement(
//   districtId: number,
//   departementId: number,
//   anneeId: number
// ): Promise<{ success: boolean; error?: string; message?: string }> {
//   try {
//     // Validations
//     if (!districtId || isNaN(districtId)) {
//       return { success: false, error: 'District invalide' }
//     }
//     if (!departementId || isNaN(departementId)) {
//       return { success: false, error: 'Département invalide' }
//     }
//     if (!anneeId || isNaN(anneeId)) {
//       return { success: false, error: 'Année invalide' }
//     }

//     // Vérifier s'il existe déjà une année en cours pour ce district/département
//     const { data: currentYear, error: currentError } = await supabase
//       .from('annee_district')
//       .select('id, annee_id, annee:annee_id(label)')
//       .eq('district_id', districtId)
//       .eq('departement_id', departementId)
//       .eq('is_current', true)
//       .maybeSingle()

//     if (currentError) {
//       console.error('Erreur vérification année en cours:', currentError)
//       return { success: false, error: 'Erreur lors de la vérification de l\'année en cours' }
//     }

//     // Si une année est déjà en cours, on ne peut pas en ouvrir une nouvelle
//     if (currentYear) {
//       const anneeLabel = currentYear.annee && !Array.isArray(currentYear.annee) 
//         ? currentYear.annee.label 
//         : `ID ${currentYear.annee_id}`
//       return { 
//         success: false, 
//         error: `Une année est déjà en cours (${anneeLabel}). Veuillez d'abord fermer l'année en cours avant d'en ouvrir une nouvelle.` 
//       }
//     }

//     // Vérifier si l'association existe déjà
//     const { data: existing, error: existingError } = await supabase
//       .from('annee_district')
//       .select('id, is_current')
//       .eq('district_id', districtId)
//       .eq('departement_id', departementId)
//       .eq('annee_id', anneeId)
//       .maybeSingle()

//     if (existingError) {
//       console.error('Erreur vérification existence:', existingError)
//       return { success: false, error: 'Erreur lors de la vérification de l\'existence' }
//     }

//     if (existing) {
//       // L'année existe déjà, on la définit comme courante
//       const { error: updateError } = await supabase
//         .from('annee_district')
//         .update({ is_current: true, updated_at: new Date().toISOString() })
//         .eq('id', existing.id)

//       if (updateError) {
//         console.error('Erreur mise à jour année existante:', updateError)
//         return { success: false, error: 'Erreur lors de l\'activation de l\'année' }
//       }

//       revalidatePath('/district/annees')
//       return { success: true, message: 'Année ouverte avec succès (année existante activée)' }
//     } else {
//       // L'année n'existe pas, on la crée et on la définit comme courante
//       const { error: insertError } = await supabase
//         .from('annee_district')
//         .insert([{
//           district_id: districtId,
//           departement_id: departementId,
//           annee_id: anneeId,
//           is_current: true
//         }])

//       if (insertError) {
//         console.error('Erreur création nouvelle année:', insertError)
//         return { success: false, error: 'Erreur lors de la création de l\'année' }
//       }

//       revalidatePath('/district/annees')
//       return { success: true, message: 'Nouvelle année ouverte avec succès' }
//     }
//   } catch (error) {
//     console.error('Erreur openNewYearForDepartement:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

/**
 * Fermer l'année en cours pour un département
 * Cette fonction désactive le flag is_current pour l'année en cours
 */
// export async function closeYearForDepartement(
//   districtId: number,
//   departementId: number
// ): Promise<{ success: boolean; error?: string; message?: string }> {
//   try {
//     // Validations
//     if (!districtId || isNaN(districtId)) {
//       return { success: false, error: 'District invalide' }
//     }
//     if (!departementId || isNaN(departementId)) {
//       return { success: false, error: 'Département invalide' }
//     }

//     // Récupérer l'année en cours
//     const { data: currentYear, error: fetchError } = await supabase
//       .from('annee_district')
//       .select('id, annee_id, annee:annee_id(label)')
//       .eq('district_id', districtId)
//       .eq('departement_id', departementId)
//       .eq('is_current', true)
//       .maybeSingle()

//     if (fetchError) {
//       console.error('Erreur récupération année en cours:', fetchError)
//       return { success: false, error: 'Erreur lors de la récupération de l\'année en cours' }
//     }

//     if (!currentYear) {
//       return { success: false, error: 'Aucune année en cours à fermer' }
//     }

//     // Désactiver le flag is_current
//     const { error: updateError } = await supabase
//       .from('annee_district')
//       .update({ is_current: false, updated_at: new Date().toISOString() })
//       .eq('id', currentYear.id)

//     if (updateError) {
//       console.error('Erreur fermeture année:', updateError)
//       return { success: false, error: 'Erreur lors de la fermeture de l\'année' }
//     }

//     const anneeLabel = currentYear.annee && !Array.isArray(currentYear.annee) 
//       ? currentYear.annee.label 
//       : `ID ${currentYear.annee_id}`

//     revalidatePath('/district/annees')
//     return { success: true, message: `Année ${anneeLabel} fermée avec succès` }
//   } catch (error) {
//     console.error('Erreur closeYearForDepartement:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }


/**
 * Récupérer le statut des années pour un district (utilisé dans la page district/annees)
 */
// export async function getAnneesStatusForDistrict(districtId: number): Promise<AnneeDistrict[]> {
//   try {
//     if (!districtId || isNaN(districtId)) {
//       return []
//     }

//     const { data, error } = await supabase
//       .from('annee_district')
//       .select(`
//         id,
//         district_id,
//         departement_id,
//         annee_id,
//         is_current,
//         created_at,
//         updated_at,
//         annee:annee_id (id, label),
//         departement:departement_id (id, nom)
//       `)
//       .eq('district_id', districtId)
//       .order('annee_id', { ascending: false })

//     if (error) {
//       console.error('Erreur getAnneesStatusForDistrict:', error)
//       return []
//     }

//     // Transformer les données avec le bon typage
//     const transformedData: AnneeDistrict[] = (data || []).map((item: any) => {
//       // Extraire correctement les relations
//       const annee = item.annee && typeof item.annee === 'object' 
//         ? (Array.isArray(item.annee) ? item.annee[0] : item.annee)
//         : null
      
//       const departement = item.departement && typeof item.departement === 'object'
//         ? (Array.isArray(item.departement) ? item.departement[0] : item.departement)
//         : null

//       // Déterminer le statut
//       let status: 'current' | 'past' | 'future' = 'past'
//       if (item.is_current) {
//         status = 'current'
//       }

//       return {
//         id: item.id,
//         district_id: item.district_id,
//         departement_id: item.departement_id,
//         annee_id: item.annee_id,
//         is_current: item.is_current,
//         created_at: item.created_at,
//         updated_at: item.updated_at,
//         annee: annee ? {
//           id: annee.id,
//           label: annee.label
//         } : undefined,
//         departement: departement ? {
//           id: departement.id,
//           nom: departement.nom
//         } : undefined,
//         status
//       }
//     })

//     return transformedData
//   } catch (error) {
//     console.error('Erreur getAnneesStatusForDistrict:', error)
//     return []
//   }
// }


































































/**
 * Récupérer le district courant pour un chef de district connecté
 * À utiliser dans les pages du chef de district
 */
// export async function getCurrentDistrict(): Promise<{ id: number; nom: string } | null> {
//   try {
//     // Importer getUser de auth
//     const { getUser } = await import('./auth')
//     const user = await getUser()
    
//     if (!user || !user.fidele_id) {
//       return null
//     }

//     // Récupérer le chef de département avec niveau 'district'
//     const { data: chef, error } = await supabase
//       .from('chef_departement')
//       .select(`
//         district_id,
//         district:district_id (
//           id,
//           nom
//         )
//       `)
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (error || !chef) {
//       console.error('Erreur getCurrentDistrict:', error)
//       return null
//     }

//     const district = Array.isArray(chef.district) ? chef.district[0] : chef.district

//     if (!district) {
//       return null
//     }

//     return {
//       id: district.id,
//       nom: district.nom
//     }
//   } catch (error) {
//     console.error('Erreur getCurrentDistrict:', error)
//     return null
//   }
// }









// actions/annee-district.ts
// Ajouter ces fonctions à la fin du fichier

/**
 * Ouvrir une nouvelle année pour un département (définir comme année en cours)
 */
export async function openNewYearForDepartement(
  districtId: number,
  departementId: number,
  anneeId: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Validations
    if (!districtId || isNaN(districtId)) {
      return { success: false, error: 'District invalide' }
    }
    if (!departementId || isNaN(departementId)) {
      return { success: false, error: 'Département invalide' }
    }
    if (!anneeId || isNaN(anneeId)) {
      return { success: false, error: 'Année invalide' }
    }

    // Vérifier s'il existe déjà une année en cours pour ce district/département
    const { data: currentYear, error: currentError } = await supabase
      .from('annee_district')
      .select('id, annee_id, annee:annee_id(label)')
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .eq('is_current', true)
      .maybeSingle()

    if (currentError) {
      console.error('Erreur vérification année en cours:', currentError)
      return { success: false, error: 'Erreur lors de la vérification de l\'année en cours' }
    }

    // Si une année est déjà en cours, on ne peut pas en ouvrir une nouvelle
    if (currentYear) {
      const anneeData = currentYear.annee as any
      const anneeLabel = anneeData && !Array.isArray(anneeData) 
        ? anneeData.label 
        : `ID ${currentYear.annee_id}`
      return { 
        success: false, 
        error: `Une année est déjà en cours (${anneeLabel}). Veuillez d'abord fermer l'année en cours avant d'en ouvrir une nouvelle.` 
      }
    }

    // Vérifier si l'association existe déjà
    const { data: existing, error: existingError } = await supabase
      .from('annee_district')
      .select('id, is_current')
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .eq('annee_id', anneeId)
      .maybeSingle()

    if (existingError) {
      console.error('Erreur vérification existence:', existingError)
      return { success: false, error: 'Erreur lors de la vérification de l\'existence' }
    }

    if (existing) {
      // L'année existe déjà, on la définit comme courante
      const { error: updateError } = await supabase
        .from('annee_district')
        .update({ is_current: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (updateError) {
        console.error('Erreur mise à jour année existante:', updateError)
        return { success: false, error: 'Erreur lors de l\'activation de l\'année' }
      }

      revalidatePath('/district/annees')
      return { success: true, message: 'Année ouverte avec succès (année existante activée)' }
    } else {
      // L'année n'existe pas, on la crée et on la définit comme courante
      const { error: insertError } = await supabase
        .from('annee_district')
        .insert([{
          district_id: districtId,
          departement_id: departementId,
          annee_id: anneeId,
          is_current: true
        }])

      if (insertError) {
        console.error('Erreur création nouvelle année:', insertError)
        return { success: false, error: 'Erreur lors de la création de l\'année' }
      }

      revalidatePath('/district/annees')
      return { success: true, message: 'Nouvelle année ouverte avec succès' }
    }
  } catch (error) {
    console.error('Erreur openNewYearForDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Fermer l'année en cours pour un département
 * Cette fonction désactive le flag is_current pour l'année en cours
 */
export async function closeYearForDepartement(
  districtId: number,
  departementId: number
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Validations
    if (!districtId || isNaN(districtId)) {
      return { success: false, error: 'District invalide' }
    }
    if (!departementId || isNaN(departementId)) {
      return { success: false, error: 'Département invalide' }
    }

    // Récupérer l'année en cours
    const { data: currentYear, error: fetchError } = await supabase
      .from('annee_district')
      .select('id, annee_id, annee:annee_id(label)')
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .eq('is_current', true)
      .maybeSingle()

    if (fetchError) {
      console.error('Erreur récupération année en cours:', fetchError)
      return { success: false, error: 'Erreur lors de la récupération de l\'année en cours' }
    }

    if (!currentYear) {
      return { success: false, error: 'Aucune année en cours à fermer' }
    }

    // Désactiver le flag is_current
    const { error: updateError } = await supabase
      .from('annee_district')
      .update({ is_current: false, updated_at: new Date().toISOString() })
      .eq('id', currentYear.id)

    if (updateError) {
      console.error('Erreur fermeture année:', updateError)
      return { success: false, error: 'Erreur lors de la fermeture de l\'année' }
    }

    const anneeData = currentYear.annee as any
    const anneeLabel = anneeData && !Array.isArray(anneeData) 
      ? anneeData.label 
      : `ID ${currentYear.annee_id}`

    revalidatePath('/district/annees')
    return { success: true, message: `Année ${anneeLabel} fermée avec succès` }
  } catch (error) {
    console.error('Erreur closeYearForDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupérer le statut des années pour un district (utilisé dans la page district/annees)
 */
export async function getAnneesStatusForDistrict(districtId: number): Promise<AnneeDistrict[]> {
  try {
    if (!districtId || isNaN(districtId)) {
      return []
    }

    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        id,
        district_id,
        departement_id,
        annee_id,
        is_current,
        created_at,
        updated_at,
        annee:annee_id (id, label),
        departement:departement_id (id, nom)
      `)
      .eq('district_id', districtId)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('Erreur getAnneesStatusForDistrict:', error)
      return []
    }

    // Transformer les données avec le bon typage
    const transformedData: AnneeDistrict[] = (data || []).map((item: any) => {
      // Extraire correctement les relations
      let annee: Annee | undefined = undefined
      if (item.annee) {
        const anneeData = Array.isArray(item.annee) ? item.annee[0] : item.annee
        if (anneeData) {
          annee = {
            id: anneeData.id,
            label: anneeData.label
          }
        }
      }
      
      let departement: Departement | undefined = undefined
      if (item.departement) {
        const deptData = Array.isArray(item.departement) ? item.departement[0] : item.departement
        if (deptData) {
          departement = {
            id: deptData.id,
            nom: deptData.nom
          }
        }
      }

      // Déterminer le statut
      let status: 'current' | 'past' | 'future' = 'past'
      if (item.is_current) {
        status = 'current'
      }

      return {
        id: item.id,
        district_id: item.district_id,
        departement_id: item.departement_id,
        annee_id: item.annee_id,
        is_current: item.is_current,
        created_at: item.created_at,
        updated_at: item.updated_at,
        annee,
        departement,
        status
      }
    })

    return transformedData
  } catch (error) {
    console.error('Erreur getAnneesStatusForDistrict:', error)
    return []
  }
}

/**
 * Récupérer le district courant pour un chef de district connecté
 */
export async function getCurrentDistrict(): Promise<{ id: number; nom: string } | null> {
  try {
    const { getUser } = await import('./auth')
    const user = await getUser()
    
    if (!user || !user.fidele_id) {
      return null
    }

    const { data: chef, error } = await supabase
      .from('chef_departement')
      .select(`
        district_id,
        district:district_id (
          id,
          nom
        )
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .maybeSingle()

    if (error || !chef) {
      console.error('Erreur getCurrentDistrict:', error)
      return null
    }

    const districtData = chef.district
    const district = Array.isArray(districtData) ? districtData[0] : districtData

    if (!district) {
      return null
    }

    return {
      id: district.id,
      nom: district.nom
    }
  } catch (error) {
    console.error('Erreur getCurrentDistrict:', error)
    return null
  }
}


// actions/annee-district.ts - Ajouter cette fonction

/**
 * Récupérer l'historique des années pour un département spécifique
 */
export async function getMyDepartementAnneesHistory(
  districtId: number,
  departementId: number
): Promise<AnneeDistrict[]> {
  try {
    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        id,
        district_id,
        departement_id,
        annee_id,
        is_current,
        created_at,
        updated_at,
        annee:annee_id (id, label)
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('Erreur getMyDepartementAnneesHistory:', error)
      return []
    }

    // Récupérer l'année en cours pour calculer les statuts
    const current = data?.find((item: any) => item.is_current) || null

    const transformedData: AnneeDistrict[] = (data || []).map((item: any) => {
      let annee: Annee | undefined = undefined
      if (item.annee) {
        const anneeData = Array.isArray(item.annee) ? item.annee[0] : item.annee
        if (anneeData) {
          annee = {
            id: anneeData.id,
            label: anneeData.label
          }
        }
      }

      let status: 'current' | 'past' | 'future' = 'past'
      if (item.is_current) {
        status = 'current'
      } else if (current && item.annee_id > current.annee_id) {
        status = 'future'
      }

      return {
        id: item.id,
        district_id: item.district_id,
        departement_id: item.departement_id,
        annee_id: item.annee_id,
        is_current: item.is_current,
        created_at: item.created_at,
        updated_at: item.updated_at,
        annee,
        status
      }
    })

    return transformedData
  } catch (error) {
    console.error('Erreur getMyDepartementAnneesHistory:', error)
    return []
  }
}


// actions/annee-district.ts - Ajouter cette fonction

// Ouvrir une année pour tous les districts et départements
export async function ouvrirAnneePourTous(formData: FormData) {
  try {
  

    const annee_id = parseInt(formData.get('annee_id') as string)

    if (!annee_id || isNaN(annee_id)) {
      return { error: 'Année invalide' }
    }

    // Récupérer tous les districts
    const { data: districts, error: districtsError } = await supabase
      .from('district')
      .select('id, nom')

    if (districtsError) throw districtsError

    // Récupérer tous les départements
    const { data: departements, error: deptsError } = await supabase
      .from('departement')
      .select('id, nom')

    if (deptsError) throw deptsError

    let added = 0
    let skipped = 0
    let errors = 0

    // Pour chaque combinaison district × département
    for (const district of districts || []) {
      for (const departement of departements || []) {
        // Vérifier si l'année existe déjà
        const { data: existing, error: checkError } = await supabase
          .from('annee_district')
          .select('id')
          .eq('district_id', district.id)
          .eq('departement_id', departement.id)
          .eq('annee_id', annee_id)
          .maybeSingle()

        if (checkError) {
          errors++
          continue
        }

        if (existing) {
          skipped++
          continue
        }

        // Vérifier si c'est la première année pour ce couple
        const { count, error: countError } = await supabase
          .from('annee_district')
          .select('*', { count: 'exact', head: true })
          .eq('district_id', district.id)
          .eq('departement_id', departement.id)

        if (countError) {
          errors++
          continue
        }

        // Ajouter l'année
        const { error: insertError } = await supabase
          .from('annee_district')
          .insert([{
            district_id: district.id,
            departement_id: departement.id,
            annee_id: annee_id,
            is_current: count === 0 // Si c'est la première, elle devient en cours
          }])

        if (insertError) {
          errors++
        } else {
          added++
        }
      }
    }

    revalidatePath('/admin/annees/ouverture')
    
    return { 
      success: true, 
      message: `${added} année(s) ajoutée(s), ${skipped} déjà existante(s), ${errors} erreur(s)`,
      added,
      skipped,
      errors
    }
  } catch (error) {
    console.error('Erreur ouvrirAnneePourTous:', error)
    return { error: 'Erreur lors de l\'ouverture des années' }
  }
}



// actions/annee-district.ts - Ajouter ces deux fonctions

/**
 * Ajouter une année à TOUS les districts et départements
 * Sans la définir comme année en cours (is_current = false)
 */
export async function ajouterAnneePourTous(formData: FormData) {
  try {
    const annee_id = parseInt(formData.get('annee_id') as string)

    if (!annee_id || isNaN(annee_id)) {
      return { error: 'Année invalide' }
    }

    // Vérifier que l'année existe
    const { data: annee, error: anneeError } = await supabase
      .from('annee')
      .select('id, label')
      .eq('id', annee_id)
      .single()

    if (anneeError || !annee) {
      return { error: 'Année non trouvée' }
    }

    // Récupérer tous les districts
    const { data: districts, error: districtsError } = await supabase
      .from('district')
      .select('id, nom')

    if (districtsError) throw districtsError

    // Récupérer tous les départements
    const { data: departements, error: deptsError } = await supabase
      .from('departement')
      .select('id, nom')

    if (deptsError) throw deptsError

    let ajoutes = 0
    let ignores = 0
    let erreurs = 0

    // Pour chaque combinaison district × département
    for (const district of districts || []) {
      for (const departement of departements || []) {
        try {
          // Vérifier si l'association existe déjà
          const { data: existing, error: checkError } = await supabase
            .from('annee_district')
            .select('id')
            .eq('district_id', district.id)
            .eq('departement_id', departement.id)
            .eq('annee_id', annee_id)
            .maybeSingle()

          if (checkError) {
            erreurs++
            continue
          }

          if (existing) {
            ignores++
            continue
          }

          // Ajouter l'année avec is_current = false
          const { error: insertError } = await supabase
            .from('annee_district')
            .insert([{
              district_id: district.id,
              departement_id: departement.id,
              annee_id: annee_id,
              is_current: false
            }])

          if (insertError) {
            erreurs++
          } else {
            ajoutes++
          }
        } catch (err) {
          erreurs++
        }
      }
    }

    revalidatePath('/admin/annees')
    
    const total = (districts?.length || 0) * (departements?.length || 0)
    
    return { 
      success: true, 
      message: `Année ${annee.label} : ${ajoutes} ajoutée(s), ${ignores} déjà existante(s) sur ${total} combinaisons`,
      ajoutes,
      ignores,
      erreurs
    }
  } catch (error) {
    console.error('Erreur ajouterAnneePourTous:', error)
    return { error: 'Erreur lors de l\'ajout des années' }
  }
}

/**
 * Définir une année comme année en cours pour TOUS les districts et départements
 * (is_current = true, et désactive automatiquement les autres années)
 */
// export async function definirAnneeEnCoursPourTous(formData: FormData) {
//   try {
//     const annee_id = parseInt(formData.get('annee_id') as string)

//     if (!annee_id || isNaN(annee_id)) {
//       return { error: 'Année invalide' }
//     }

//     // Vérifier que l'année existe
//     const { data: annee, error: anneeError } = await supabase
//       .from('annee')
//       .select('id, label')
//       .eq('id', annee_id)
//       .single()

//     if (anneeError || !annee) {
//       return { error: 'Année non trouvée' }
//     }

//     // Récupérer tous les districts
//     const { data: districts, error: districtsError } = await supabase
//       .from('district')
//       .select('id, nom')

//     if (districtsError) throw districtsError

//     // Récupérer tous les départements
//     const { data: departements, error: deptsError } = await supabase
//       .from('departement')
//       .select('id, nom')

//     if (deptsError) throw deptsError

//     let actives = 0   // Années existantes mises à jour
//     let creees = 0    // Nouvelles années créées
//     let erreurs = 0

//     // Pour chaque combinaison district × département
//     for (const district of districts || []) {
//       for (const departement of departements || []) {
//         try {
//           // 1. Désactiver toutes les années en cours pour ce district/département
//           const { error: resetError } = await supabase
//             .from('annee_district')
//             .update({ is_current: false })
//             .eq('district_id', district.id)
//             .eq('departement_id', departement.id)
//             .eq('is_current', true)

//           if (resetError) {
//             console.error('Erreur reset:', resetError)
//             erreurs++
//             continue
//           }

//           // 2. Vérifier si l'association existe déjà
//           const { data: existing, error: checkError } = await supabase
//             .from('annee_district')
//             .select('id')
//             .eq('district_id', district.id)
//             .eq('departement_id', departement.id)
//             .eq('annee_id', annee_id)
//             .maybeSingle()

//           if (checkError) {
//             erreurs++
//             continue
//           }

//           if (existing) {
//             // Mettre à jour pour définir comme année en cours
//             const { error: updateError } = await supabase
//               .from('annee_district')
//               .update({ is_current: true })
//               .eq('id', existing.id)

//             if (updateError) {
//               erreurs++
//             } else {
//               actives++
//             }
//           } else {
//             // Créer et définir comme année en cours
//             const { error: insertError } = await supabase
//               .from('annee_district')
//               .insert([{
//                 district_id: district.id,
//                 departement_id: departement.id,
//                 annee_id: annee_id,
//                 is_current: true
//               }])

//             if (insertError) {
//               erreurs++
//             } else {
//               creees++
//             }
//           }
//         } catch (err) {
//           erreurs++
//         }
//       }
//     }

//     revalidatePath('/admin/annees')
    
//     const totalTraitees = actives + creees
//     const total = (districts?.length || 0) * (departements?.length || 0)
    
//     return { 
//       success: true, 
//       message: `Année ${annee.label} définie comme année en cours pour ${totalTraitees} combinaisons (${actives} existantes mises à jour, ${creees} créées) sur ${total} total`,
//       actives,
//       creees,
//       total: totalTraitees,
//       erreurs
//     }
//   } catch (error) {
//     console.error('Erreur definirAnneeEnCoursPourTous:', error)
//     return { error: 'Erreur lors de la définition des années en cours' }
//   }
// }


















/**
 * Ajoute une année pour plusieurs districts et départements en masse
 */
// export async function ajouterAnneePourTous(formData: FormData) {
//   try {
//     const anneeId = parseInt(formData.get('annee_id') as string)
//     const districtIds = JSON.parse(formData.get('district_ids') as string) as number[]
//     const departementIds = JSON.parse(formData.get('departement_ids') as string) as number[]

//     if (!anneeId) {
//       return { error: 'Année requise' }
//     }

//     if (!districtIds || districtIds.length === 0) {
//       return { error: 'Aucun district sélectionné' }
//     }

//     if (!departementIds || departementIds.length === 0) {
//       return { error: 'Aucun département sélectionné' }
//     }

//     let ajoutes = 0
//     let ignores = 0

//     for (const districtId of districtIds) {
//       for (const departementId of departementIds) {
        
//         // Vérifier si l'année existe déjà
//         const { data: existant, error: checkError } = await supabase
//           .from('annee_district')
//           .select('id')
//           .eq('district_id', districtId)
//           .eq('departement_id', departementId)
//           .eq('annee_id', anneeId)
//           .maybeSingle()

//         if (checkError) {
//           console.error('Erreur vérification:', checkError)
//           continue
//         }

//         if (existant) {
//           ignores++
//           continue
//         }

//         // Créer l'année
//         const { error: insertError } = await supabase
//           .from('annee_district')
//           .insert([{
//             district_id: districtId,
//             departement_id: departementId,
//             annee_id: anneeId,
//             is_current: false,
//             created_at: new Date().toISOString()
//           }])

//         if (insertError) {
//           console.error('Erreur insertion:', insertError)
//         } else {
//           ajoutes++
//         }
//       }
//     }

//     revalidatePath('/chef-conference/annees')
//     revalidatePath('/district/annees')

//     return { 
//       success: true, 
//       ajoutes, 
//       ignores,
//       message: `${ajoutes} année(s) ajoutée(s), ${ignores} déjà existante(s)`
//     }
//   } catch (error) {
//     console.error('Erreur ajouterAnneePourTous:', error)
//     return { error: 'Erreur lors de l\'ajout des années' }
//   }
// }

/**
 * Définit une année comme année en cours pour plusieurs districts et départements
 * Crée l'année si elle n'existe pas encore
 */
export async function definirAnneeEnCoursPourTous(formData: FormData) {
  try {
    const anneeId = parseInt(formData.get('annee_id') as string)
    const districtIds = JSON.parse(formData.get('district_ids') as string) as number[]
    const departementIds = JSON.parse(formData.get('departement_ids') as string) as number[]

    if (!anneeId) {
      return { error: 'Année requise' }
    }

    if (!districtIds || districtIds.length === 0) {
      return { error: 'Aucun district sélectionné' }
    }

    if (!departementIds || departementIds.length === 0) {
      return { error: 'Aucun département sélectionné' }
    }

    let creees = 0
    let actives = 0

    for (const districtId of districtIds) {
      for (const departementId of departementIds) {
        
        // D'abord, désactiver l'année en cours actuelle
        await supabase
          .from('annee_district')
          .update({ is_current: false })
          .eq('district_id', districtId)
          .eq('departement_id', departementId)
          .eq('is_current', true)

        // Vérifier si l'année existe déjà
        const { data: existant, error: checkError } = await supabase
          .from('annee_district')
          .select('id')
          .eq('district_id', districtId)
          .eq('departement_id', departementId)
          .eq('annee_id', anneeId)
          .maybeSingle()

        if (checkError) {
          console.error('Erreur vérification:', checkError)
          continue
        }

        if (existant) {
          // Mettre à jour comme année en cours
          const { error: updateError } = await supabase
            .from('annee_district')
            .update({ is_current: true })
            .eq('id', existant.id)

          if (!updateError) {
            actives++
          }
        } else {
          // Créer et définir comme année en cours
          const { error: insertError } = await supabase
            .from('annee_district')
            .insert([{
              district_id: districtId,
              departement_id: departementId,
              annee_id: anneeId,
              is_current: true,
              created_at: new Date().toISOString()
            }])

          if (!insertError) {
            creees++
          }
        }
      }
    }

    revalidatePath('/chef-conference/annees')
    revalidatePath('/district/annees')

    return { 
      success: true, 
      creees, 
      actives,
      message: `${creees} année(s) créée(s), ${actives} année(s) définie(s) en cours`
    }
  } catch (error) {
    console.error('Erreur definirAnneeEnCoursPourTous:', error)
    return { error: 'Erreur lors de la définition des années en cours' }
  }
}

/**
 * Ferme (passe is_current = false) toutes les années pour les combinaisons district/département sélectionnées
 * Ne supprime pas les enregistrements, change juste le statut is_current à false
 */
export async function fermerAnneesPourTous(formData: FormData) {
  try {
    const districtIds = JSON.parse(formData.get('district_ids') as string) as number[]
    const departementIds = JSON.parse(formData.get('departement_ids') as string) as number[]

    if (!districtIds || districtIds.length === 0) {
      return { error: 'Aucun district sélectionné' }
    }

    if (!departementIds || departementIds.length === 0) {
      return { error: 'Aucun département sélectionné' }
    }

    let fermees = 0
    let dejaFermees = 0

    for (const districtId of districtIds) {
      for (const departementId of departementIds) {
        
        // Récupérer les années qui sont actuellement en cours (is_current = true)
        const { data: anneesEnCours, error: fetchError } = await supabase
          .from('annee_district')
          .select('id, annee_id, annee(label)')
          .eq('district_id', districtId)
          .eq('departement_id', departementId)
          .eq('is_current', true)

        if (fetchError) {
          console.error('Erreur récupération:', fetchError)
          continue
        }

        // Compter les années déjà fermées (is_current = false)
        const { count: countDejaFermees, error: countError } = await supabase
          .from('annee_district')
          .select('id', { count: 'exact', head: true })
          .eq('district_id', districtId)
          .eq('departement_id', departementId)
          .eq('is_current', false)

        if (!countError && countDejaFermees) {
          dejaFermees += countDejaFermees
        }

        // Passer les années en cours à is_current = false
        if (anneesEnCours && anneesEnCours.length > 0) {
          const idsAFermer = anneesEnCours.map(a => a.id)
          
          const { error: updateError } = await supabase
            .from('annee_district')
            .update({ is_current: false })
            .in('id', idsAFermer)

          if (updateError) {
            console.error('Erreur mise à jour:', updateError)
          } else {
            fermees += idsAFermer.length
          }
        }
      }
    }

    revalidatePath('/chef-conference/annees')
    revalidatePath('/district/annees')

    return { 
      success: true, 
      fermees, 
      dejaFermees,
      message: `${fermees} année(s) fermée(s), ${dejaFermees} année(s) déjà fermée(s)`
    }
  } catch (error) {
    console.error('Erreur fermerAnneesPourTous:', error)
    return { error: 'Erreur lors de la fermeture des années' }
  }
}

// ... (garde toutes tes autres fonctions existantes)