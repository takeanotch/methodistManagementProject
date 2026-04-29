// //action/chef-departement.ts

// 'use server'

// import { supabase } from '@/lib/supabase'
// import { revalidatePath } from 'next/cache'
// import { getUser } from './auth'

// export interface ChefDepartement {
//   id: number
//   fidele_id: number
//   departement_id: number
//   district_id: number
//   conference_id?: number | null
//   niveau: 'district' | 'conference'
//   role_id?: number | null
//   date_nomination: string
//   date_fin: string | null
//   est_actif: boolean
//   role?: {
//     id: number
//     nom_role: string
//     label_role: string
//     type_role: string
//   } | null
//   fidele?: {
//     id: number
//     nom: string
//     post_nom: string
//     prenom: string
//     contact: string
//     profile_img: string | null
//     paroisse?: {
//       nom: string
//     }
//   }
//   departement?: {
//     id: number
//     nom: string
//     type: string
//   }
// }

// // ==================== FONCTIONS EXISTANTES ====================

// // Récupérer les chefs d'un district avec leurs rôles
// export async function getChefsByDistrict(districtId: number): Promise<ChefDepartement[]> {
//   try {
//     console.log('Récupération des chefs pour le district:', districtId)
    
//     const { data, error } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         district_id,
//         conference_id,
//         niveau,
//         role_id,
//         date_nomination,
//         date_fin,
//         est_actif,
//         created_at,
//         updated_at,
//         fidele:fidele_id (
//           id,
//           nom,
//           post_nom,
//           prenom,
//           contact,
//           profile_img,
//           paroisse:paroisse_id (
//             nom
//           )
//         ),
//         departement:departement_id (
//           id,
//           nom,
//           type
//         ),
//         role:role_id (
//           id,
//           nom_role,
//           label_role,
//           type_role
//         )
//       `)
//       .eq('district_id', districtId)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)
//       .order('date_nomination', { ascending: false })

//     if (error) {
//       console.error('Erreur Supabase dans getChefsByDistrict:', error)
//       return []
//     }

//     if (!data || data.length === 0) {
//       console.log('Aucun chef trouvé pour ce district')
//       return []
//     }

//     // Transformer les données pour s'assurer que les relations sont bien formatées
//     const chefsFormatted = data.map((chef: any) => {
//       // Gérer le cas où fidele pourrait être un tableau
//       const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele
      
//       // Gérer le cas où departement pourrait être un tableau
//       const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
      
//       // Gérer le cas où role pourrait être un tableau
//       const role = Array.isArray(chef.role) ? chef.role[0] : chef.role

//       // Gérer le cas où paroisse pourrait être un tableau
//       if (fidele && Array.isArray(fidele.paroisse)) {
//         fidele.paroisse = fidele.paroisse[0]
//       }

//       return {
//         ...chef,
//         fidele: fidele || null,
//         departement: departement || null,
//         role: role || null
//       }
//     })

//     return chefsFormatted
//   } catch (error: any) {
//     console.error('Erreur getChefsByDistrict:', {
//       message: error?.message || 'Message non disponible',
//       details: error?.details || 'Détails non disponibles',
//       code: error?.code || 'Code non disponible'
//     })
//     return []
//   }
// }

// // Récupérer les rôles disponibles pour un district
// export async function getRolesDisponiblesPourDistrict() {
//   try {
//     console.log('Récupération des rôles pour district')
    
//     const { data, error } = await supabase
//       .from('role_config')
//       .select('*')
//       .eq('type_role', 'district')
//       .order('nom_role')

//     if (error) {
//       console.error('Erreur Supabase dans getRolesDisponiblesPourDistrict:', error)
//       return []
//     }

//     return data || []
//   } catch (error: any) {
//     console.error('Erreur getRolesDisponiblesPourDistrict:', error?.message || error)
//     return []
//   }
// }

// // Vérifier si un rôle est déjà pris dans un département
// export async function isRoleDejaPris(departement_id: number, district_id: number, role_id: number): Promise<boolean> {
//   try {
//     console.log('Vérification rôle déjà pris:', { departement_id, district_id, role_id })
    
//     const { data, error } = await supabase
//       .from('chef_departement')
//       .select('id')
//       .eq('departement_id', departement_id)
//       .eq('district_id', district_id)
//       .eq('niveau', 'district')
//       .eq('role_id', role_id)
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (error) {
//       console.error('Erreur Supabase dans isRoleDejaPris:', error)
//       throw error
//     }

//     return !!data
//   } catch (error: any) {
//     console.error('Erreur isRoleDejaPris:', error?.message || error)
//     return false
//   }
// }

// // Rechercher des fidèles disponibles pour un district
// export async function searchFidelesDisponibles(districtId: number, query: string): Promise<any[]> {
//   try {
//     console.log('Recherche de fidèles:', { districtId, query })
    
//     if (!query || query.length < 2) return []

//     // Récupérer les IDs des fidèles déjà chefs dans ce district
//     const { data: chefsExistants, error: chefsError } = await supabase
//       .from('chef_departement')
//       .select('fidele_id')
//       .eq('district_id', districtId)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)

//     if (chefsError) {
//       console.error('Erreur récupération chefs existants:', chefsError)
//       throw chefsError
//     }

//     const chefIds = chefsExistants?.map(c => c.fidele_id) || []

//     // Rechercher les fidèles
//     const { data, error } = await supabase
//       .from('fidele')
//       .select(`
//         id,
//         nom,
//         post_nom,
//         prenom,
//         contact,
//         profile_img,
//         paroisse:paroisse_id (nom)
//       `)
//       .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,post_nom.ilike.%${query}%`)
//       .order('nom')
//       .limit(10)

//     if (error) {
//       console.error('Erreur recherche fidèles:', error)
//       throw error
//     }

//     // Transformer les données
//     const fidelesAvecDisponibilite = (data || []).map((fidele: any) => {
//       const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
      
//       return {
//         id: fidele.id,
//         nom: fidele.nom,
//         post_nom: fidele.post_nom,
//         prenom: fidele.prenom,
//         contact: fidele.contact,
//         profile_img: fidele.profile_img,
//         paroisse_nom: paroisse?.nom || 'Paroisse non définie',
//         dejaChef: chefIds.includes(fidele.id)
//       }
//     })

//     return fidelesAvecDisponibilite
//   } catch (error: any) {
//     console.error('Erreur searchFidelesDisponibles:', error?.message || error)
//     return []
//   }
// }

// // Ajouter un chef de département avec rôle
// export async function ajouterChefDepartement(formData: FormData) {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return { error: 'Vous devez être connecté' }
//     }

//     const fidele_id = parseInt(formData.get('fidele_id') as string)
//     const departement_id = parseInt(formData.get('departement_id') as string)
//     const district_id = parseInt(formData.get('district_id') as string)
//     const role_id = parseInt(formData.get('role_id') as string)
//     const date_nomination = formData.get('date_nomination') as string || new Date().toISOString().split('T')[0]

//     console.log('Ajout chef:', { fidele_id, departement_id, district_id, role_id, date_nomination })

//     // Validations
//     if (!fidele_id || isNaN(fidele_id)) {
//       return { error: 'Fidèle invalide' }
//     }
//     if (!departement_id || isNaN(departement_id)) {
//       return { error: 'Département invalide' }
//     }
//     if (!district_id || isNaN(district_id)) {
//       return { error: 'District invalide' }
//     }
//     if (!role_id || isNaN(role_id)) {
//       return { error: 'Rôle invalide' }
//     }

//     // Vérifier si le fidèle est déjà chef dans ce district
//     const { data: chefExistant, error: checkError } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         departement:departement_id (nom),
//         role:role_id (label_role)
//       `)
//       .eq('fidele_id', fidele_id)
//       .eq('district_id', district_id)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (checkError) {
//       console.error('Erreur vérification chef existant:', checkError)
//       throw checkError
//     }

//     if (chefExistant) {
//       const departement = Array.isArray(chefExistant.departement) 
//         ? chefExistant.departement[0] 
//         : chefExistant.departement
//       const role = Array.isArray(chefExistant.role) 
//         ? chefExistant.role[0] 
//         : chefExistant.role
//       return { 
//         error: `Ce fidèle est déjà ${role?.label_role || 'chef'} du département "${departement?.nom}" dans ce district` 
//       }
//     }

//     // Vérifier si ce rôle est déjà pris dans ce département
//     const roleDejaPris = await isRoleDejaPris(departement_id, district_id, role_id)
//     if (roleDejaPris) {
//       const { data: roleInfo } = await supabase
//         .from('role_config')
//         .select('label_role')
//         .eq('id', role_id)
//         .single()

//       return { 
//         error: `Le poste de ${roleInfo?.label_role || 'ce responsable'} est déjà pourvu dans ce département` 
//       }
//     }

//     // Vérifier le nombre de chefs dans ce département (max 3)
//     const { count, error: countError } = await supabase
//       .from('chef_departement')
//       .select('*', { count: 'exact', head: true })
//       .eq('departement_id', departement_id)
//       .eq('district_id', district_id)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)

//     if (countError) {
//       console.error('Erreur comptage chefs:', countError)
//       throw countError
//     }

//     if (count && count >= 3) {
//       return { error: 'Ce département a déjà atteint le nombre maximum de responsables (3)' }
//     }

//     // Ajouter le chef
//     const { data: newChef, error: insertError } = await supabase
//       .from('chef_departement')
//       .insert([{
//         fidele_id,
//         departement_id,
//         district_id,
//         role_id,
//         niveau: 'district',
//         date_nomination,
//         est_actif: true
//       }])
//       .select()
//       .single()

//     if (insertError) {
//       console.error('Erreur insertion chef:', insertError)
//       throw insertError
//     }

//     console.log('Chef ajouté avec succès:', newChef)

//     revalidatePath(`/admin/districts/${district_id}/chefs`)
//     revalidatePath(`/admin/districts`)
//     return { success: true, chef: newChef }
//   } catch (error: any) {
//     console.error('Erreur ajouterChefDepartement:', {
//       message: error?.message || 'Message non disponible',
//       details: error?.details || 'Détails non disponibles',
//       code: error?.code || 'Code non disponible'
//     })
//     return { error: 'Erreur lors de l\'ajout du chef' }
//   }
// }

// // Retirer un chef
// export async function retirerChefDepartement(chefId: number, districtId: number) {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return { error: 'Vous devez être connecté' }
//     }

//     console.log('Retrait chef:', { chefId, districtId })

//     const { error } = await supabase
//       .from('chef_departement')
//       .update({ 
//         est_actif: false,
//         date_fin: new Date().toISOString().split('T')[0],
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', chefId)

//     if (error) {
//       console.error('Erreur retrait chef:', error)
//       throw error
//     }

//     revalidatePath(`/admin/districts/${districtId}/chefs`)
//     revalidatePath(`/admin/districts`)
//     return { success: true }
//   } catch (error: any) {
//     console.error('Erreur retirerChefDepartement:', error?.message || error)
//     return { error: 'Erreur lors du retrait du chef' }
//   }
// }

// // Mettre à jour le rôle d'un chef
// export async function updateChefRole(chefId: number, nouveauRoleId: number, districtId: number) {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return { error: 'Vous devez être connecté' }
//     }

//     console.log('Mise à jour rôle chef:', { chefId, nouveauRoleId, districtId })

//     // Récupérer le département du chef
//     const { data: chef, error: chefError } = await supabase
//       .from('chef_departement')
//       .select('departement_id')
//       .eq('id', chefId)
//       .single()

//     if (chefError) {
//       console.error('Erreur récupération chef:', chefError)
//       throw chefError
//     }

//     if (!chef) {
//       return { error: 'Chef non trouvé' }
//     }

//     // Vérifier si le nouveau rôle est déjà pris
//     const roleDejaPris = await isRoleDejaPris(chef.departement_id, districtId, nouveauRoleId)
//     if (roleDejaPris) {
//       return { error: 'Ce rôle est déjà attribué dans ce département' }
//     }

//     const { error } = await supabase
//       .from('chef_departement')
//       .update({ 
//         role_id: nouveauRoleId,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', chefId)

//     if (error) {
//       console.error('Erreur mise à jour rôle:', error)
//       throw error
//     }

//     revalidatePath(`/admin/districts/${districtId}/chefs`)
//     return { success: true }
//   } catch (error: any) {
//     console.error('Erreur updateChefRole:', error?.message || error)
//     return { error: 'Erreur lors de la mise à jour du rôle' }
//   }
// }

// // Récupérer un rôle par son ID
// export async function getRoleById(roleId: number) {
//   try {
//     const { data, error } = await supabase
//       .from('role_config')
//       .select('*')
//       .eq('id', roleId)
//       .single()

//     if (error) {
//       console.error('Erreur getRoleById:', error)
//       return null
//     }

//     return data
//   } catch (error: any) {
//     console.error('Erreur getRoleById:', error?.message || error)
//     return null
//   }
// }

// actions/chef-departement.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

export interface ChefDepartement {
  id: number
  fidele_id: number
  departement_id: number
  district_id: number
  conference_id?: number | null
  niveau: 'district' | 'conference'
  role_id?: number | null
  date_nomination: string
  date_fin: string | null
  est_actif: boolean
  annee_conference_id?: number | null
  role?: {
    id: number
    nom_role: string
    label_role: string
    type_role: string
  } | null
  fidele?: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img: string | null
    paroisse?: {
      nom: string
    }
  }
  departement?: {
    id: number
    nom: string
    type: string
  }
}

// ============================================================
// HELPER
// ============================================================

/**
 * Helper: Récupérer l'ID de l'année en cours pour un district
 */
async function getCurrentAnneeConferenceIdForDistrict(districtId: number): Promise<number | null> {
  try {
    // Récupérer la conférence du district
    const { data: district } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()

    if (!district?.conference_id) return null

    // Récupérer l'année en cours pour cette conférence
    const { data: anneeConference } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('conference_id', district.conference_id)
      .eq('is_current', true)
      .maybeSingle()

    return anneeConference?.id || null
  } catch (error) {
    console.error('Erreur getCurrentAnneeConferenceIdForDistrict:', error)
    return null
  }
}

// ============================================================
// FONCTIONS DE RÉCUPÉRATION
// ============================================================

// Récupérer les chefs d'un district avec leurs rôles
export async function getChefsByDistrict(districtId: number): Promise<ChefDepartement[]> {
  try {
    console.log('Récupération des chefs pour le district:', districtId)
    
    const { data, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        conference_id,
        niveau,
        role_id,
        date_nomination,
        date_fin,
        est_actif,
        annee_conference_id,
        created_at,
        updated_at,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          paroisse:paroisse_id (
            nom
          )
        ),
        departement:departement_id (
          id,
          nom,
          type
        ),
        role:role_id (
          id,
          nom_role,
          label_role,
          type_role
        )
      `)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .order('date_nomination', { ascending: false })

    if (error) {
      console.error('Erreur Supabase dans getChefsByDistrict:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('Aucun chef trouvé pour ce district')
      return []
    }

    // Transformer les données pour s'assurer que les relations sont bien formatées
    const chefsFormatted = data.map((chef: any) => {
      const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele
      const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
      const role = Array.isArray(chef.role) ? chef.role[0] : chef.role

      if (fidele && Array.isArray(fidele.paroisse)) {
        fidele.paroisse = fidele.paroisse[0]
      }

      return {
        ...chef,
        fidele: fidele || null,
        departement: departement || null,
        role: role || null
      }
    })

    return chefsFormatted
  } catch (error: any) {
    console.error('Erreur getChefsByDistrict:', {
      message: error?.message || 'Message non disponible',
      details: error?.details || 'Détails non disponibles',
      code: error?.code || 'Code non disponible'
    })
    return []
  }
}

// Récupérer les chefs actuels d'un district (année en cours)
export async function getCurrentChefsByDistrict(districtId: number): Promise<ChefDepartement[]> {
  try {
    console.log('Récupération des chefs actuels pour le district:', districtId)
    
    // Récupérer l'année en cours
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(districtId)
    
    let query = supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        conference_id,
        niveau,
        role_id,
        date_nomination,
        date_fin,
        est_actif,
        annee_conference_id,
        created_at,
        updated_at,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          paroisse:paroisse_id (
            nom
          )
        ),
        departement:departement_id (
          id,
          nom,
          type
        ),
        role:role_id (
          id,
          nom_role,
          label_role,
          type_role
        )
      `)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .eq('est_actif', true)
    
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query.order('date_nomination', { ascending: false })

    if (error) {
      console.error('Erreur Supabase dans getCurrentChefsByDistrict:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const chefsFormatted = data.map((chef: any) => {
      const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele
      const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
      const role = Array.isArray(chef.role) ? chef.role[0] : chef.role

      if (fidele && Array.isArray(fidele.paroisse)) {
        fidele.paroisse = fidele.paroisse[0]
      }

      return {
        ...chef,
        fidele: fidele || null,
        departement: departement || null,
        role: role || null
      }
    })

    return chefsFormatted
  } catch (error: any) {
    console.error('Erreur getCurrentChefsByDistrict:', error)
    return []
  }
}

// Récupérer l'historique des chefs d'un district (toutes années)
export async function getHistoriqueChefsByDistrict(districtId: number): Promise<ChefDepartement[]> {
  try {
    console.log('Récupération historique des chefs pour le district:', districtId)
    
    const { data, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        conference_id,
        niveau,
        role_id,
        date_nomination,
        date_fin,
        est_actif,
        annee_conference_id,
        created_at,
        updated_at,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          paroisse:paroisse_id (
            nom
          )
        ),
        departement:departement_id (
          id,
          nom,
          type
        ),
        role:role_id (
          id,
          nom_role,
          label_role,
          type_role
        ),
        annee_conference:annee_conference_id (
          id,
          annee_id,
          is_current,
          annee:annee_id (id, label)
        )
      `)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .order('date_nomination', { ascending: false })

    if (error) {
      console.error('Erreur Supabase dans getHistoriqueChefsByDistrict:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    const chefsFormatted = data.map((chef: any) => {
      const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele
      const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
      const role = Array.isArray(chef.role) ? chef.role[0] : chef.role
      const anneeConference = Array.isArray(chef.annee_conference) ? chef.annee_conference[0] : chef.annee_conference

      if (fidele && Array.isArray(fidele.paroisse)) {
        fidele.paroisse = fidele.paroisse[0]
      }

      return {
        ...chef,
        fidele: fidele || null,
        departement: departement || null,
        role: role || null,
        annee_conference: anneeConference || null
      }
    })

    return chefsFormatted
  } catch (error: any) {
    console.error('Erreur getHistoriqueChefsByDistrict:', error)
    return []
  }
}

// Récupérer les rôles disponibles pour un district
export async function getRolesDisponiblesPourDistrict() {
  try {
    console.log('Récupération des rôles pour district')
    
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .eq('type_role', 'district')
      .order('nom_role')

    if (error) {
      console.error('Erreur Supabase dans getRolesDisponiblesPourDistrict:', error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error('Erreur getRolesDisponiblesPourDistrict:', error?.message || error)
    return []
  }
}

// Vérifier si un rôle est déjà pris dans un département pour l'année en cours
export async function isRoleDejaPris(
  departement_id: number, 
  district_id: number, 
  role_id: number,
  anneeConferenceId?: number | null
): Promise<boolean> {
  try {
    console.log('Vérification rôle déjà pris:', { departement_id, district_id, role_id, anneeConferenceId })
    
    let query = supabase
      .from('chef_departement')
      .select('id')
      .eq('departement_id', departement_id)
      .eq('district_id', district_id)
      .eq('niveau', 'district')
      .eq('role_id', role_id)
      .eq('est_actif', true)
    
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Erreur Supabase dans isRoleDejaPris:', error)
      throw error
    }

    return !!data
  } catch (error: any) {
    console.error('Erreur isRoleDejaPris:', error?.message || error)
    return false
  }
}

// Rechercher des fidèles disponibles pour un district
export async function searchFidelesDisponibles(districtId: number, query: string): Promise<any[]> {
  try {
    console.log('Recherche de fidèles:', { districtId, query })
    
    if (!query || query.length < 2) return []

    // Récupérer l'année en cours pour ce district
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(districtId)

    // Récupérer les IDs des fidèles déjà chefs dans ce district pour l'année en cours
    let chefsQuery = supabase
      .from('chef_departement')
      .select('fidele_id')
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .eq('est_actif', true)

    if (anneeConferenceId) {
      chefsQuery = chefsQuery.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: chefsExistants, error: chefsError } = await chefsQuery

    if (chefsError) {
      console.error('Erreur récupération chefs existants:', chefsError)
      throw chefsError
    }

    const chefIds = chefsExistants?.map(c => c.fidele_id) || []

    // Rechercher les fidèles
    const { data, error } = await supabase
      .from('fidele')
      .select(`
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img,
        paroisse:paroisse_id (nom)
      `)
      .or(`nom.ilike.%${query}%,prenom.ilike.%${query}%,post_nom.ilike.%${query}%`)
      .order('nom')
      .limit(10)

    if (error) {
      console.error('Erreur recherche fidèles:', error)
      throw error
    }

    // Transformer les données
    const fidelesAvecDisponibilite = (data || []).map((fidele: any) => {
      const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
      
      return {
        id: fidele.id,
        nom: fidele.nom,
        post_nom: fidele.post_nom,
        prenom: fidele.prenom,
        contact: fidele.contact,
        profile_img: fidele.profile_img,
        paroisse_nom: paroisse?.nom || 'Paroisse non définie',
        dejaChef: chefIds.includes(fidele.id)
      }
    })

    return fidelesAvecDisponibilite
  } catch (error: any) {
    console.error('Erreur searchFidelesDisponibles:', error?.message || error)
    return []
  }
}

// ============================================================
// FONCTIONS D'AJOUT/MODIFICATION
// ============================================================

// Ajouter un chef de département avec rôle
export async function ajouterChefDepartement(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const fidele_id = parseInt(formData.get('fidele_id') as string)
    const departement_id = parseInt(formData.get('departement_id') as string)
    const district_id = parseInt(formData.get('district_id') as string)
    const role_id = parseInt(formData.get('role_id') as string)
    const date_nomination = formData.get('date_nomination') as string || new Date().toISOString().split('T')[0]

    console.log('Ajout chef:', { fidele_id, departement_id, district_id, role_id, date_nomination })

    // Validations
    if (!fidele_id || isNaN(fidele_id)) {
      return { error: 'Fidèle invalide' }
    }
    if (!departement_id || isNaN(departement_id)) {
      return { error: 'Département invalide' }
    }
    if (!district_id || isNaN(district_id)) {
      return { error: 'District invalide' }
    }
    if (!role_id || isNaN(role_id)) {
      return { error: 'Rôle invalide' }
    }

    // Récupérer l'année en cours pour ce district
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(district_id)
    console.log('📅 annee_conference_id pour nouveau chef district:', anneeConferenceId)

    // Vérifier si le fidèle est déjà chef dans ce district pour l'année en cours
    let chefExistantQuery = supabase
      .from('chef_departement')
      .select(`
        id,
        departement:departement_id (nom),
        role:role_id (label_role)
      `)
      .eq('fidele_id', fidele_id)
      .eq('district_id', district_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)

    if (anneeConferenceId) {
      chefExistantQuery = chefExistantQuery.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: chefExistant, error: checkError } = await chefExistantQuery.maybeSingle()

    if (checkError) {
      console.error('Erreur vérification chef existant:', checkError)
      throw checkError
    }

    if (chefExistant) {
      const departement = Array.isArray(chefExistant.departement) 
        ? chefExistant.departement[0] 
        : chefExistant.departement
      const role = Array.isArray(chefExistant.role) 
        ? chefExistant.role[0] 
        : chefExistant.role
      return { 
        error: `Ce fidèle est déjà ${role?.label_role || 'chef'} du département "${departement?.nom}" dans ce district pour l'année en cours` 
      }
    }

    // Vérifier si ce rôle est déjà pris dans ce département pour l'année en cours
    const roleDejaPris = await isRoleDejaPris(departement_id, district_id, role_id, anneeConferenceId)
    if (roleDejaPris) {
      const { data: roleInfo } = await supabase
        .from('role_config')
        .select('label_role')
        .eq('id', role_id)
        .single()

      return { 
        error: `Le poste de ${roleInfo?.label_role || 'ce responsable'} est déjà pourvu dans ce département pour l'année en cours` 
      }
    }

    // Vérifier le nombre de chefs dans ce département pour l'année en cours (max 3)
    let countQuery = supabase
      .from('chef_departement')
      .select('*', { count: 'exact', head: true })
      .eq('departement_id', departement_id)
      .eq('district_id', district_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)

    if (anneeConferenceId) {
      countQuery = countQuery.eq('annee_conference_id', anneeConferenceId)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Erreur comptage chefs:', countError)
      throw countError
    }

    if (count && count >= 3) {
      return { error: 'Ce département a déjà atteint le nombre maximum de responsables (3) pour cette année' }
    }

    // Ajouter le chef AVEC annee_conference_id
    const insertData: any = {
      fidele_id,
      departement_id,
      district_id,
      role_id,
      niveau: 'district',
      date_nomination,
      est_actif: true
    }

    if (anneeConferenceId) {
      insertData.annee_conference_id = anneeConferenceId
    }

    const { data: newChef, error: insertError } = await supabase
      .from('chef_departement')
      .insert([insertData])
      .select()
      .single()

    if (insertError) {
      console.error('Erreur insertion chef:', insertError)
      throw insertError
    }

    console.log('✅ Chef ajouté avec succès:', newChef)

    revalidatePath(`/admin/districts/${district_id}/chefs`)
    revalidatePath(`/admin/districts`)
    return { success: true, chef: newChef }
  } catch (error: any) {
    console.error('Erreur ajouterChefDepartement:', {
      message: error?.message || 'Message non disponible',
      details: error?.details || 'Détails non disponibles',
      code: error?.code || 'Code non disponible'
    })
    return { error: 'Erreur lors de l\'ajout du chef' }
  }
}

// Retirer un chef
export async function retirerChefDepartement(chefId: number, districtId: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    console.log('Retrait chef:', { chefId, districtId })

    const { error } = await supabase
      .from('chef_departement')
      .update({ 
        est_actif: false,
        date_fin: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', chefId)

    if (error) {
      console.error('Erreur retrait chef:', error)
      throw error
    }

    revalidatePath(`/admin/districts/${districtId}/chefs`)
    revalidatePath(`/admin/districts`)
    return { success: true }
  } catch (error: any) {
    console.error('Erreur retirerChefDepartement:', error?.message || error)
    return { error: 'Erreur lors du retrait du chef' }
  }
}

// Mettre à jour le rôle d'un chef
export async function updateChefRole(chefId: number, nouveauRoleId: number, districtId: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    console.log('Mise à jour rôle chef:', { chefId, nouveauRoleId, districtId })

    // Récupérer l'année en cours
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(districtId)

    // Récupérer le département du chef
    const { data: chef, error: chefError } = await supabase
      .from('chef_departement')
      .select('departement_id')
      .eq('id', chefId)
      .single()

    if (chefError) {
      console.error('Erreur récupération chef:', chefError)
      throw chefError
    }

    if (!chef) {
      return { error: 'Chef non trouvé' }
    }

    // Vérifier si le nouveau rôle est déjà pris pour l'année en cours
    const roleDejaPris = await isRoleDejaPris(chef.departement_id, districtId, nouveauRoleId, anneeConferenceId)
    if (roleDejaPris) {
      return { error: 'Ce rôle est déjà attribué dans ce département pour l\'année en cours' }
    }

    const { error } = await supabase
      .from('chef_departement')
      .update({ 
        role_id: nouveauRoleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', chefId)

    if (error) {
      console.error('Erreur mise à jour rôle:', error)
      throw error
    }

    revalidatePath(`/admin/districts/${districtId}/chefs`)
    return { success: true }
  } catch (error: any) {
    console.error('Erreur updateChefRole:', error?.message || error)
    return { error: 'Erreur lors de la mise à jour du rôle' }
  }
}

// Récupérer un rôle par son ID
export async function getRoleById(roleId: number) {
  try {
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error) {
      console.error('Erreur getRoleById:', error)
      return null
    }

    return data
  } catch (error: any) {
    console.error('Erreur getRoleById:', error?.message || error)
    return null
  }
}