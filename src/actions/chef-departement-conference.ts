// //action/chef-departement-conference.ts
// 'use server'

// import { supabase } from '@/lib/supabase'
// import { revalidatePath } from 'next/cache'
// import { getUser } from './auth'

// export interface ChefDepartementConference {
//   id: number
//   fidele_id: number
//   departement_id: number
//   conference_id: number
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

// // Récupérer les chefs d'une conférence avec leurs rôles
// export async function getChefsByConference(conferenceId: number): Promise<ChefDepartementConference[]> {
//   try {
//     console.log('Récupération des chefs pour la conférence:', conferenceId)
    
//     const { data, error } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
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
//       .eq('conference_id', conferenceId)
//       .eq('niveau', 'conference')
//       .eq('est_actif', true)
//       .order('date_nomination', { ascending: false })

//     if (error) {
//       console.error('Erreur Supabase dans getChefsByConference:', error)
//       return []
//     }

//     if (!data || data.length === 0) {
//       console.log('Aucun chef trouvé pour cette conférence')
//       return []
//     }

//     // Transformer les données pour s'assurer que les relations sont bien formatées
//     const chefsFormatted = data.map((chef: any) => {
//       const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele
//       const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
//       const role = Array.isArray(chef.role) ? chef.role[0] : chef.role

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
//     console.error('Erreur getChefsByConference:', error?.message || error)
//     return []
//   }
// }

// // Récupérer les rôles disponibles pour une conférence
// export async function getRolesDisponiblesPourConference() {
//   try {
//     console.log('Récupération des rôles pour conférence')
    
//     const { data, error } = await supabase
//       .from('role_config')
//       .select('*')
//       .eq('type_role', 'conference')
//       .order('nom_role')

//     if (error) {
//       console.error('Erreur Supabase dans getRolesDisponiblesPourConference:', error)
//       return []
//     }

//     return data || []
//   } catch (error: any) {
//     console.error('Erreur getRolesDisponiblesPourConference:', error?.message || error)
//     return []
//   }
// }

// // Vérifier si un rôle est déjà pris dans un département au niveau conférence
// export async function isRoleDejaPrisConference(departement_id: number, conference_id: number, role_id: number): Promise<boolean> {
//   try {
//     console.log('Vérification rôle déjà pris:', { departement_id, conference_id, role_id })
    
//     const { data, error } = await supabase
//       .from('chef_departement')
//       .select('id')
//       .eq('departement_id', departement_id)
//       .eq('conference_id', conference_id)
//       .eq('niveau', 'conference')
//       .eq('role_id', role_id)
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (error) {
//       console.error('Erreur Supabase dans isRoleDejaPrisConference:', error)
//       throw error
//     }

//     return !!data
//   } catch (error: any) {
//     console.error('Erreur isRoleDejaPrisConference:', error?.message || error)
//     return false
//   }
// }

// // Rechercher des fidèles disponibles pour une conférence
// export async function searchFidelesDisponiblesPourConference(conferenceId: number, query: string): Promise<any[]> {
//   try {
//     console.log('Recherche de fidèles pour conférence:', { conferenceId, query })
    
//     if (!query || query.length < 2) return []

//     // Récupérer les IDs des fidèles déjà chefs dans cette conférence
//     const { data: chefsExistants, error: chefsError } = await supabase
//       .from('chef_departement')
//       .select('fidele_id')
//       .eq('conference_id', conferenceId)
//       .eq('niveau', 'conference')
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
//     console.error('Erreur searchFidelesDisponiblesPourConference:', error?.message || error)
//     return []
//   }
// }

// // Ajouter un chef de département au niveau conférence
// export async function ajouterChefDepartementConference(formData: FormData) {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return { error: 'Vous devez être connecté' }
//     }

//     const fidele_id = parseInt(formData.get('fidele_id') as string)
//     const departement_id = parseInt(formData.get('departement_id') as string)
//     const conference_id = parseInt(formData.get('conference_id') as string)
//     const role_id = parseInt(formData.get('role_id') as string)
//     const date_nomination = formData.get('date_nomination') as string || new Date().toISOString().split('T')[0]

//     console.log('Ajout chef conférence:', { fidele_id, departement_id, conference_id, role_id, date_nomination })

//     // Validations
//     if (!fidele_id || isNaN(fidele_id)) {
//       return { error: 'Fidèle invalide' }
//     }
//     if (!departement_id || isNaN(departement_id)) {
//       return { error: 'Département invalide' }
//     }
//     if (!conference_id || isNaN(conference_id)) {
//       return { error: 'Conférence invalide' }
//     }
//     if (!role_id || isNaN(role_id)) {
//       return { error: 'Rôle invalide' }
//     }

//     // Vérifier si le fidèle est déjà chef dans cette conférence
//     const { data: chefExistant, error: checkError } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         departement:departement_id (nom),
//         role:role_id (label_role)
//       `)
//       .eq('fidele_id', fidele_id)
//       .eq('conference_id', conference_id)
//       .eq('niveau', 'conference')
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
//         error: `Ce fidèle est déjà ${role?.label_role || 'chef'} du département "${departement?.nom}" dans cette conférence` 
//       }
//     }

//     // Vérifier si ce rôle est déjà pris dans ce département
//     const roleDejaPris = await isRoleDejaPrisConference(departement_id, conference_id, role_id)
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
//       .eq('conference_id', conference_id)
//       .eq('niveau', 'conference')
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
//         conference_id,
//         role_id,
//         niveau: 'conference',
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

//     revalidatePath(`/admin/conferences/${conference_id}/chefs`)
//     revalidatePath(`/admin/conferences`)
//     return { success: true, chef: newChef }
//   } catch (error: any) {
//     console.error('Erreur ajouterChefDepartementConference:', error?.message || error)
//     return { error: 'Erreur lors de l\'ajout du chef' }
//   }
// }

// // Retirer un chef au niveau conférence
// export async function retirerChefDepartementConference(chefId: number, conferenceId: number) {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return { error: 'Vous devez être connecté' }
//     }

//     console.log('Retrait chef conférence:', { chefId, conferenceId })

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

//     revalidatePath(`/admin/conferences/${conferenceId}/chefs`)
//     revalidatePath(`/admin/conferences`)
//     return { success: true }
//   } catch (error: any) {
//     console.error('Erreur retirerChefDepartementConference:', error?.message || error)
//     return { error: 'Erreur lors du retrait du chef' }
//   }
// }

// // Mettre à jour le rôle d'un chef au niveau conférence
// export async function updateChefRoleConference(chefId: number, nouveauRoleId: number, conferenceId: number) {
//   try {
//     const user = await getUser()
//     if (!user) {
//       return { error: 'Vous devez être connecté' }
//     }

//     console.log('Mise à jour rôle chef conférence:', { chefId, nouveauRoleId, conferenceId })

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
//     const roleDejaPris = await isRoleDejaPrisConference(chef.departement_id, conferenceId, nouveauRoleId)
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

//     revalidatePath(`/admin/conferences/${conferenceId}/chefs`)
//     return { success: true }
//   } catch (error: any) {
//     console.error('Erreur updateChefRoleConference:', error?.message || error)
//     return { error: 'Erreur lors de la mise à jour du rôle' }
//   }
// }

// // Récupérer un rôle par son ID
// export async function getRoleByIdConference(roleId: number) {
//   try {
//     const { data, error } = await supabase
//       .from('role_config')
//       .select('*')
//       .eq('id', roleId)
//       .single()

//     if (error) {
//       console.error('Erreur getRoleByIdConference:', error)
//       return null
//     }

//     return data
//   } catch (error: any) {
//     console.error('Erreur getRoleByIdConference:', error?.message || error)
//     return null
//   }
// }


// actions/chef-departement-conference.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference } from './annee-conference'

export interface ChefDepartementConference {
  id: number
  fidele_id: number
  departement_id: number
  conference_id: number
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
 * Helper: Récupérer l'ID de l'année en cours pour une conférence
 */
async function getCurrentAnneeConferenceIdForConference(conferenceId: number): Promise<number | null> {
  try {
    const current = await getCurrentAnneeConference(conferenceId)
    return current?.id || null
  } catch (error) {
    console.error('Erreur getCurrentAnneeConferenceIdForConference:', error)
    return null
  }
}

// ============================================================
// FONCTIONS DE RÉCUPÉRATION
// ============================================================

// Récupérer les chefs d'une conférence avec leurs rôles
export async function getChefsByConference(conferenceId: number): Promise<ChefDepartementConference[]> {
  try {
    console.log('Récupération des chefs pour la conférence:', conferenceId)
    
    const { data, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
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
      .eq('conference_id', conferenceId)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .order('date_nomination', { ascending: false })

    if (error) {
      console.error('Erreur Supabase dans getChefsByConference:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('Aucun chef trouvé pour cette conférence')
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
    console.error('Erreur getChefsByConference:', error?.message || error)
    return []
  }
}

// Récupérer les chefs d'une conférence pour l'année en cours
export async function getCurrentChefsByConference(conferenceId: number): Promise<ChefDepartementConference[]> {
  try {
    console.log('Récupération des chefs actuels pour la conférence:', conferenceId)
    
    // Récupérer l'année en cours
    const anneeConferenceId = await getCurrentAnneeConferenceIdForConference(conferenceId)
    
    let query = supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
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
      .eq('conference_id', conferenceId)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
    
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query.order('date_nomination', { ascending: false })

    if (error) {
      console.error('Erreur Supabase dans getCurrentChefsByConference:', error)
      return []
    }

    if (!data || data.length === 0) {
      console.log('Aucun chef actuel trouvé pour cette conférence')
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
    console.error('Erreur getCurrentChefsByConference:', error?.message || error)
    return []
  }
}

// Récupérer les rôles disponibles pour une conférence
export async function getRolesDisponiblesPourConference() {
  try {
    console.log('Récupération des rôles pour conférence')
    
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .eq('type_role', 'conference')
      .order('nom_role')

    if (error) {
      console.error('Erreur Supabase dans getRolesDisponiblesPourConference:', error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error('Erreur getRolesDisponiblesPourConference:', error?.message || error)
    return []
  }
}

// Vérifier si un rôle est déjà pris dans un département au niveau conférence
export async function isRoleDejaPrisConference(
  departement_id: number, 
  conference_id: number, 
  role_id: number,
  anneeConferenceId?: number | null
): Promise<boolean> {
  try {
    console.log('Vérification rôle déjà pris:', { departement_id, conference_id, role_id, anneeConferenceId })
    
    let query = supabase
      .from('chef_departement')
      .select('id')
      .eq('departement_id', departement_id)
      .eq('conference_id', conference_id)
      .eq('niveau', 'conference')
      .eq('role_id', role_id)
      .eq('est_actif', true)
    
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
      console.error('Erreur Supabase dans isRoleDejaPrisConference:', error)
      throw error
    }

    return !!data
  } catch (error: any) {
    console.error('Erreur isRoleDejaPrisConference:', error?.message || error)
    return false
  }
}

// Rechercher des fidèles disponibles pour une conférence
export async function searchFidelesDisponiblesPourConference(conferenceId: number, query: string): Promise<any[]> {
  try {
    console.log('Recherche de fidèles pour conférence:', { conferenceId, query })
    
    if (!query || query.length < 2) return []

    // Récupérer l'année en cours pour cette conférence
    const anneeConferenceId = await getCurrentAnneeConferenceIdForConference(conferenceId)

    // Récupérer les IDs des fidèles déjà chefs dans cette conférence pour l'année en cours
    let chefsQuery = supabase
      .from('chef_departement')
      .select('fidele_id')
      .eq('conference_id', conferenceId)
      .eq('niveau', 'conference')
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
    console.error('Erreur searchFidelesDisponiblesPourConference:', error?.message || error)
    return []
  }
}

// ============================================================
// FONCTIONS D'AJOUT/MODIFICATION
// ============================================================

// Ajouter un chef de département au niveau conférence
export async function ajouterChefDepartementConference(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const fidele_id = parseInt(formData.get('fidele_id') as string)
    const departement_id = parseInt(formData.get('departement_id') as string)
    const conference_id = parseInt(formData.get('conference_id') as string)
    const role_id = parseInt(formData.get('role_id') as string)
    const date_nomination = formData.get('date_nomination') as string || new Date().toISOString().split('T')[0]

    console.log('Ajout chef conférence:', { fidele_id, departement_id, conference_id, role_id, date_nomination })

    // Validations
    if (!fidele_id || isNaN(fidele_id)) {
      return { error: 'Fidèle invalide' }
    }
    if (!departement_id || isNaN(departement_id)) {
      return { error: 'Département invalide' }
    }
    if (!conference_id || isNaN(conference_id)) {
      return { error: 'Conférence invalide' }
    }
    if (!role_id || isNaN(role_id)) {
      return { error: 'Rôle invalide' }
    }

    // Récupérer l'année en cours pour cette conférence
    const anneeConferenceId = await getCurrentAnneeConferenceIdForConference(conference_id)
    console.log('📅 annee_conference_id pour nouveau chef conférence:', anneeConferenceId)

    // Vérifier si le fidèle est déjà chef dans cette conférence pour l'année en cours
    let chefExistantQuery = supabase
      .from('chef_departement')
      .select(`
        id,
        departement:departement_id (nom),
        role:role_id (label_role)
      `)
      .eq('fidele_id', fidele_id)
      .eq('conference_id', conference_id)
      .eq('niveau', 'conference')
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
        error: `Ce fidèle est déjà ${role?.label_role || 'chef'} du département "${departement?.nom}" dans cette conférence pour l'année en cours` 
      }
    }

    // Vérifier si ce rôle est déjà pris dans ce département pour l'année en cours
    const roleDejaPris = await isRoleDejaPrisConference(departement_id, conference_id, role_id, anneeConferenceId)
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
      .eq('conference_id', conference_id)
      .eq('niveau', 'conference')
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
      conference_id,
      role_id,
      niveau: 'conference',
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

    revalidatePath(`/admin/conferences/${conference_id}/chefs`)
    revalidatePath(`/admin/conferences`)
    return { success: true, chef: newChef }
  } catch (error: any) {
    console.error('Erreur ajouterChefDepartementConference:', error?.message || error)
    return { error: 'Erreur lors de l\'ajout du chef' }
  }
}

// Retirer un chef au niveau conférence
export async function retirerChefDepartementConference(chefId: number, conferenceId: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    console.log('Retrait chef conférence:', { chefId, conferenceId })

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

    revalidatePath(`/admin/conferences/${conferenceId}/chefs`)
    revalidatePath(`/admin/conferences`)
    return { success: true }
  } catch (error: any) {
    console.error('Erreur retirerChefDepartementConference:', error?.message || error)
    return { error: 'Erreur lors du retrait du chef' }
  }
}

// Mettre à jour le rôle d'un chef au niveau conférence
export async function updateChefRoleConference(chefId: number, nouveauRoleId: number, conferenceId: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    console.log('Mise à jour rôle chef conférence:', { chefId, nouveauRoleId, conferenceId })

    // Récupérer l'année en cours
    const anneeConferenceId = await getCurrentAnneeConferenceIdForConference(conferenceId)

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
    const roleDejaPris = await isRoleDejaPrisConference(chef.departement_id, conferenceId, nouveauRoleId, anneeConferenceId)
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

    revalidatePath(`/admin/conferences/${conferenceId}/chefs`)
    return { success: true }
  } catch (error: any) {
    console.error('Erreur updateChefRoleConference:', error?.message || error)
    return { error: 'Erreur lors de la mise à jour du rôle' }
  }
}

// Récupérer un rôle par son ID
export async function getRoleByIdConference(roleId: number) {
  try {
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .eq('id', roleId)
      .single()

    if (error) {
      console.error('Erreur getRoleByIdConference:', error)
      return null
    }

    return data
  } catch (error: any) {
    console.error('Erreur getRoleByIdConference:', error?.message || error)
    return null
  }
}

// Récupérer l'historique des chefs d'une conférence (toutes années confondues)
export async function getHistoriqueChefsByConference(conferenceId: number): Promise<ChefDepartementConference[]> {
  try {
    console.log('Récupération historique des chefs pour la conférence:', conferenceId)
    
    const { data, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
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
      .eq('conference_id', conferenceId)
      .eq('niveau', 'conference')
      .order('date_nomination', { ascending: false })

    if (error) {
      console.error('Erreur Supabase dans getHistoriqueChefsByConference:', error)
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
    console.error('Erreur getHistoriqueChefsByConference:', error?.message || error)
    return []
  }
}