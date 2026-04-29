
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

// Types
export interface ChefInfo {
  id: number
  fidele_id: number
  departement_id: number
  district_id: number
  departement_nom: string
  district_nom: string
  fidele_nom: string
  fidele_prenom: string
  date_nomination: string
  conference_id?: number
  conference_nom?: string
}

export interface Annee {
  id: number
  label: string
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
}

// Récupérer les infos du chef de département connecté
// export async function getChefDistrictInfo(): Promise<ChefInfo | null> {
//   try {
//     const user = await getUser()
//     if (!user || !user.fidele_id) return null

//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         district_id,
//         date_nomination,
//         departement:departement_id (
//           nom
//         ),
//         district:district_id (
//           nom
//         ),
//         fidele:fidele_id (
//           nom,
//           prenom
//         )
//       `)
//       .eq('fidele_id', user.fidele_id)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (chefError || !chef) {
//       console.log('Aucun chef trouvé:', chefError)
//       return null
//     }

//     const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
//     const district = Array.isArray(chef.district) ? chef.district[0] : chef.district
//     const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele

//     return {
//       id: chef.id,
//       fidele_id: chef.fidele_id,
//       departement_id: chef.departement_id,
//       district_id: chef.district_id,
//       departement_nom: departement?.nom || '',
//       district_nom: district?.nom || '',
//       fidele_nom: fidele?.nom || '',
//       fidele_prenom: fidele?.prenom || '',
//       date_nomination: chef.date_nomination
//     }
//   } catch (error) {
//     console.error('Erreur getChefDistrictInfo:', error)
//     return null
//   }
// }













// actions/chef-district-annees.ts
export async function getChefDistrictInfo(): Promise<ChefInfo & { conference_id?: number } | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        date_nomination,
        departement:departement_id (
          nom
        ),
        district:district_id (
          id,
          nom,
          conference:conference_id (
            id,
            nom
          )
        ),
        fidele:fidele_id (
          nom,
          prenom
        )
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .maybeSingle()

    if (chefError || !chef) {
      console.log('Aucun chef trouvé:', chefError)
      return null
    }

    const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
    const district = Array.isArray(chef.district) ? chef.district[0] : chef.district
    const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele
    const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null

    return {
      id: chef.id,
      fidele_id: chef.fidele_id,
      departement_id: chef.departement_id,
      district_id: chef.district_id,
      departement_nom: departement?.nom || '',
      district_nom: district?.nom || '',
      fidele_nom: fidele?.nom || '',
      fidele_prenom: fidele?.prenom || '',
      date_nomination: chef.date_nomination,
      conference_id: conference?.id || null,
      conference_nom: conference?.nom || null
    }
  } catch (error) {
    console.error('Erreur getChefDistrictInfo:', error)
    return null
  }
}















// Vérifier si l'utilisateur est bien chef du département pour ce district
export async function verifyChefAccess(districtId: number, departementId: number): Promise<boolean> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return false

    const { data, error } = await supabase
      .from('chef_departement')
      .select('id')
      .eq('fidele_id', user.fidele_id)
      .eq('departement_id', departementId)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .maybeSingle()

    return !error && !!data
  } catch (error) {
    console.error('Erreur verifyChefAccess:', error)
    return false
  }
}

// Récupérer toutes les années
export async function getAnnees() {
  try {
    const { data, error } = await supabase
      .from('annee')
      .select('id, label')
      .order('label', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getAnnees:', error)
    return []
  }
}

// Récupérer l'année en cours pour un district et département
export async function getCurrentAnneeDistrict(districtId: number, departementId: number) {
  try {
    const hasAccess = await verifyChefAccess(districtId, departementId)
    if (!hasAccess) {
      console.error('Accès non autorisé')
      return null
    }

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

    if (error) throw error
    
    if (data) {
      return {
        ...data,
        annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getCurrentAnneeDistrict:', error)
    return null
  }
}

// Récupérer l'année précédente pour un district et département
export async function getPreviousAnneeDistrict(districtId: number, departementId: number) {
  try {
    const hasAccess = await verifyChefAccess(districtId, departementId)
    if (!hasAccess) {
      console.error('Accès non autorisé')
      return null
    }

    // Récupérer l'ID de l'année en cours
    const current = await getCurrentAnneeDistrict(districtId, departementId)
    if (!current) return null

    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        *,
        annee:annee_id (id, label)
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .lt('annee_id', current.annee_id)
      .order('annee_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    
    if (data) {
      return {
        ...data,
        annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getPreviousAnneeDistrict:', error)
    return null
  }
}

// Récupérer l'année suivante pour un district et département
export async function getNextAnneeDistrict(districtId: number, departementId: number) {
  try {
    const hasAccess = await verifyChefAccess(districtId, departementId)
    if (!hasAccess) {
      console.error('Accès non autorisé')
      return null
    }

    // Récupérer l'ID de l'année en cours
    const current = await getCurrentAnneeDistrict(districtId, departementId)
    if (!current) return null

    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        *,
        annee:annee_id (id, label)
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .gt('annee_id', current.annee_id)
      .order('annee_id', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    
    if (data) {
      return {
        ...data,
        annee: Array.isArray(data.annee) ? data.annee[0] : data.annee
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getNextAnneeDistrict:', error)
    return null
  }
}

// Récupérer l'historique complet avec statut calculé
export async function getAllAnneesDistrict(districtId: number, departementId: number) {
  try {
    const hasAccess = await verifyChefAccess(districtId, departementId)
    if (!hasAccess) {
      console.error('Accès non autorisé')
      return []
    }

    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        *,
        annee:annee_id (id, label)
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .order('annee_id', { ascending: false })

    if (error) throw error
    
    // Transformer les données et ajouter le statut calculé
    const transformedData = data?.map(item => ({
      ...item,
      annee: Array.isArray(item.annee) ? item.annee[0] : item.annee,
      status: item.is_current ? 'current' : 
              item.annee_id < (data.find(a => a.is_current)?.annee_id || 0) ? 'past' : 'future'
    })) || []
    
    return transformedData
  } catch (error) {
    console.error('Erreur getAllAnneesDistrict:', error)
    return []
  }
}

// Obtenir le statut d'une année (current, past, future)
export async function getAnneeStatus(districtId: number, departementId: number, anneeId: number) {
  try {
    const hasAccess = await verifyChefAccess(districtId, departementId)
    if (!hasAccess) return null

    const current = await getCurrentAnneeDistrict(districtId, departementId)
    if (!current) return null

    if (anneeId === current.annee_id) return 'current'
    if (anneeId < current.annee_id) return 'past'
    return 'future'
  } catch (error) {
    console.error('Erreur getAnneeStatus:', error)
    return null
  }
}

// Ouvrir une nouvelle année
export async function ouvrirNouvelleAnnee(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const district_id = parseInt(formData.get('district_id') as string)
    const departement_id = parseInt(formData.get('departement_id') as string)
    const annee_id = parseInt(formData.get('annee_id') as string)

    if (!district_id || isNaN(district_id)) {
      return { error: 'District invalide' }
    }
    if (!departement_id || isNaN(departement_id)) {
      return { error: 'Département invalide' }
    }
    if (!annee_id || isNaN(annee_id)) {
      return { error: 'Année invalide' }
    }

    const hasAccess = await verifyChefAccess(district_id, departement_id)
    if (!hasAccess) {
      return { error: 'Vous n\'êtes pas autorisé à gérer ce département' }
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
      return { error: 'Cette année est déjà ouverte pour ce département' }
    }

    // Désactiver l'année en cours actuelle si elle existe
    await supabase
      .from('annee_district')
      .update({ is_current: false })
      .eq('district_id', district_id)
      .eq('departement_id', departement_id)
      .eq('is_current', true)

    // Insérer la nouvelle année comme année courante
    const { data: newAnnee, error: insertError } = await supabase
      .from('annee_district')
      .insert([{
        district_id,
        departement_id,
        annee_id,
        is_current: true
      }])
      .select()
      .single()

    if (insertError) throw insertError

    revalidatePath('/chef-district/annees')
    return { success: true, message: 'Année ouverte avec succès' }
  } catch (error) {
    console.error('Erreur ouvrirNouvelleAnnee:', error)
    return { error: 'Une erreur est survenue lors de l\'ouverture' }
  }
}

// Définir une année comme courante
export async function setCurrentAnnee(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)

    // Récupérer l'année à définir comme courante
    const { data: annee, error: fetchError } = await supabase
      .from('annee_district')
      .select('district_id, departement_id, annee_id')
      .eq('id', id)
      .single()

    if (fetchError || !annee) {
      return { error: 'Année non trouvée' }
    }

    const hasAccess = await verifyChefAccess(annee.district_id, annee.departement_id)
    if (!hasAccess) {
      return { error: 'Vous n\'êtes pas autorisé à modifier cette année' }
    }

    // Désactiver l'année courante actuelle
    await supabase
      .from('annee_district')
      .update({ is_current: false })
      .eq('district_id', annee.district_id)
      .eq('departement_id', annee.departement_id)
      .eq('is_current', true)

    // Activer la nouvelle année courante
    const { error } = await supabase
      .from('annee_district')
      .update({ is_current: true })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/chef-district/annees')
    return { success: true, message: 'Année définie comme courante avec succès' }
  } catch (error) {
    console.error('Erreur setCurrentAnnee:', error)
    return { error: 'Erreur lors de la définition de l\'année courante' }
  }
}

// Supprimer une année (si nécessaire)
export async function deleteAnnee(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)

    const { data: annee, error: fetchError } = await supabase
      .from('annee_district')
      .select('district_id, departement_id, is_current')
      .eq('id', id)
      .single()

    if (fetchError || !annee) {
      return { error: 'Année non trouvée' }
    }

    if (annee.is_current) {
      return { error: 'Impossible de supprimer l\'année en cours' }
    }

    const hasAccess = await verifyChefAccess(annee.district_id, annee.departement_id)
    if (!hasAccess) {
      return { error: 'Vous n\'êtes pas autorisé à supprimer cette année' }
    }

    const { error } = await supabase
      .from('annee_district')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/chef-district/annees')
    return { success: true, message: 'Année supprimée avec succès' }
  } catch (error) {
    console.error('Erreur deleteAnnee:', error)
    return { error: 'Erreur lors de la suppression' }
  }
}