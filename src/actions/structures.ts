//actions/structures.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'



// ==================== REGIONS ====================
export async function getRegions() {
  const { data: regions, error } = await supabase
    .from('region')
    .select('*')
    .order('nom', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des régions:', error)
    return []
  }

  return regions
}

export async function getRegionById(id: number) {
  const { data: region, error } = await supabase
    .from('region')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération de la région:', error)
    return null
  }

  return region
}

export async function createRegion(formData: FormData) {
  const nom = formData.get('nom') as string

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  const { data: newRegion, error } = await supabase
    .from('region')
    .insert([{ nom: nom.trim() }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette région existe déjà' }
    }
    console.error('Erreur lors de la création de la région:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/structures')
  return { success: true, region: newRegion }
}

export async function updateRegion(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  const { error } = await supabase
    .from('region')
    .update({ nom: nom.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette région existe déjà' }
    }
    console.error('Erreur lors de la mise à jour:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/structures')
  return { success: true }
}

export async function deleteRegion(id: number) {
  // Vérifier si des conférences sont liées
  const { data: conferences } = await supabase
    .from('conference')
    .select('id')
    .eq('region_id', id)
    .limit(1)

  if (conferences && conferences.length > 0) {
    return { error: 'Impossible de supprimer : des conférences sont liées à cette région' }
  }

  const { error } = await supabase
    .from('region')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/structures')
  return { success: true }
}

// ==================== CONFERENCES ====================
export async function getConferences(regionId?: number) {
  let query = supabase
    .from('conference')
    .select('*, region:region_id(id, nom)')
    .order('nom', { ascending: true })

  if (regionId) {
    query = query.eq('region_id', regionId)
  }

  const { data: conferences, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des conférences:', error)
    return []
  }

  return conferences
}

export async function getConferenceById(id: number) {
  const { data: conference, error } = await supabase
    .from('conference')
    .select('*, region:region_id(id, nom)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération de la conférence:', error)
    return null
  }

  return conference
}

export async function createConference(formData: FormData) {
  const nom = formData.get('nom') as string
  const region_id = parseInt(formData.get('region_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  if (!region_id) {
    return { error: 'La région est requise' }
  }

  const { data: newConference, error } = await supabase
    .from('conference')
    .insert([{ 
      nom: nom.trim(), 
      region_id 
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette conférence existe déjà' }
    }
    console.error('Erreur lors de la création:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/structures')
  return { success: true, conference: newConference }
}

export async function updateConference(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string
  const region_id = parseInt(formData.get('region_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  const { error } = await supabase
    .from('conference')
    .update({ 
      nom: nom.trim(), 
      region_id,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette conférence existe déjà' }
    }
    console.error('Erreur lors de la mise à jour:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/structures')
  return { success: true }
}

export async function deleteConference(id: number) {
  // Vérifier si des districts sont liés
  const { data: districts } = await supabase
    .from('district')
    .select('id')
    .eq('conference_id', id)
    .limit(1)

  if (districts && districts.length > 0) {
    return { error: 'Impossible de supprimer : des districts sont liés à cette conférence' }
  }

  const { error } = await supabase
    .from('conference')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/structures')
  return { success: true }
}


export async function getDistrictById(id: number) {
  const { data: district, error } = await supabase
    .from('district')
    .select('*, conference:conference_id(id, nom, region:region_id(id, nom))')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération du district:', error)
    return null
  }

  return district
}

export async function createDistrict(formData: FormData) {
  const nom = formData.get('nom') as string
  const conference_id = parseInt(formData.get('conference_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  if (!conference_id) {
    return { error: 'La conférence est requise' }
  }

  const { data: newDistrict, error } = await supabase
    .from('district')
    .insert([{ 
      nom: nom.trim(), 
      conference_id 
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ce district existe déjà' }
    }
    console.error('Erreur lors de la création:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/structures')
  return { success: true, district: newDistrict }
}

export async function updateDistrict(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string
  const conference_id = parseInt(formData.get('conference_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  const { error } = await supabase
    .from('district')
    .update({ 
      nom: nom.trim(), 
      conference_id,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ce district existe déjà' }
    }
    console.error('Erreur lors de la mise à jour:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/structures')
  return { success: true }
}

export async function deleteDistrict(id: number) {
  // Vérifier si des paroisses sont liées
  const { data: paroisses } = await supabase
    .from('paroisse')
    .select('id')
    .eq('district_id', id)
    .limit(1)

  if (paroisses && paroisses.length > 0) {
    return { error: 'Impossible de supprimer : des paroisses sont liées à ce district' }
  }

  const { error } = await supabase
    .from('district')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/structures')
  return { success: true }
}

// ==================== PAROISSES ====================
export async function getParoisses(districtId?: number) {
  let query = supabase
    .from('paroisse')
    .select(`
      *,
      district:district_id(
        id, 
        nom, 
        conference:conference_id(
          id, 
          nom, 
          region:region_id(id, nom)
        )
      )
    `)
    .order('nom', { ascending: true })

  if (districtId) {
    query = query.eq('district_id', districtId)
  }

  const { data: paroisses, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des paroisses:', error)
    return []
  }

  return paroisses
}

export async function getParoisseById(id: number) {
  const { data: paroisse, error } = await supabase
    .from('paroisse')
    .select(`
      *,
      district:district_id(
        id, 
        nom, 
        conference:conference_id(
          id, 
          nom, 
          region:region_id(id, nom)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération de la paroisse:', error)
    return null
  }

  return paroisse
}

export async function createParoisse(formData: FormData) {
  const nom = formData.get('nom') as string
  const district_id = parseInt(formData.get('district_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  if (!district_id) {
    return { error: 'Le district est requis' }
  }

  const { data: newParoisse, error } = await supabase
    .from('paroisse')
    .insert([{ 
      nom: nom.trim(), 
      district_id 
    }])
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette paroisse existe déjà' }
    }
    console.error('Erreur lors de la création:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/structures')
  return { success: true, paroisse: newParoisse }
}

export async function updateParoisse(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string
  const district_id = parseInt(formData.get('district_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  const { error } = await supabase
    .from('paroisse')
    .update({ 
      nom: nom.trim(), 
      district_id,
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Cette paroisse existe déjà' }
    }
    console.error('Erreur lors de la mise à jour:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/structures')
  return { success: true }
}

export async function deleteParoisse(id: number) {
  // Vérifier si des fidèles sont liés
  const { data: fideles } = await supabase
    .from('fidele')
    .select('id')
    .eq('paroisse_id', id)
    .limit(1)

  if (fideles && fideles.length > 0) {
    return { error: 'Impossible de supprimer : des fidèles sont liés à cette paroisse' }
  }

  const { error } = await supabase
    .from('paroisse')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/structures')
  return { success: true }
}

// ==================== STATISTIQUES ====================
export async function getStructuresStats() {
  const [regions, conferences, districts, paroisses] = await Promise.all([
    supabase.from('region').select('*', { count: 'exact', head: true }),
    supabase.from('conference').select('*', { count: 'exact', head: true }),
    supabase.from('district').select('*', { count: 'exact', head: true }),
    supabase.from('paroisse').select('*', { count: 'exact', head: true })
  ])

  return {
    regions: regions.count || 0,
    conferences: conferences.count || 0,
    districts: districts.count || 0,
    paroisses: paroisses.count || 0
  }
}






//_____________________________________________________________________________
//_____________________________________________________________________________

// Types pour les rôles
export type RoleNiveau = 'region' | 'conference' | 'district' | 'paroisse'

export interface Role {
  id: number
  nom: string
  niveau: RoleNiveau
  created_at: string
}

// Récupérer tous les rôles
export async function getRoles() {
  const { data: roles, error } = await supabase
    .from('role')
    .select('*')
    .order('niveau', { ascending: true })
    .order('nom', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des rôles:', error)
    return []
  }

  return roles || []
}

// Récupérer les rôles par niveau
export async function getRolesByNiveau(niveau: RoleNiveau) {
  const { data: roles, error } = await supabase
    .from('role')
    .select('*')
    .eq('niveau', niveau)
    .order('nom', { ascending: true })

  if (error) {
    console.error(`Erreur lors de la récupération des rôles du niveau ${niveau}:`, error)
    return []
  }

  return roles || []
}

// Créer un rôle
export async function createRole(data: { nom: string; niveau: RoleNiveau }) {
  // Vérifier si le rôle existe déjà
  const { data: existingRole } = await supabase
    .from('role')
    .select('id')
    .eq('nom', data.nom)
    .maybeSingle()

  if (existingRole) {
    return { error: 'Un rôle avec ce nom existe déjà' }
  }

  const { data: newRole, error } = await supabase
    .from('role')
    .insert([{
      nom: data.nom,
      niveau: data.niveau
    }])
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la création du rôle:', error)
    return { error: 'Erreur lors de la création du rôle' }
  }

  revalidatePath('/admin/roles')
  return { success: true, role: newRole }
}

// Mettre à jour un rôle
export async function updateRole(id: number, data: { nom: string; niveau: RoleNiveau }) {
  // Vérifier si un autre rôle avec le même nom existe
  const { data: existingRole } = await supabase
    .from('role')
    .select('id')
    .eq('nom', data.nom)
    .neq('id', id)
    .maybeSingle()

  if (existingRole) {
    return { error: 'Un rôle avec ce nom existe déjà' }
  }

  const { error } = await supabase
    .from('role')
    .update({
      nom: data.nom,
      niveau: data.niveau
    })
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    return { error: 'Erreur lors de la mise à jour du rôle' }
  }

  revalidatePath('/admin/roles')
  return { success: true }
}

// Supprimer un rôle
export async function deleteRole(id: number) {
  // Vérifier si le rôle est utilisé dans des départements
  const { data: departements, error: checkError } = await supabase
    .from('departement')
    .select('id, nom, roles_config')
    .contains('roles_config', [{ id }])

  if (checkError) {
    console.error('Erreur lors de la vérification:', checkError)
  }

  if (departements && departements.length > 0) {
    const nomsDepartements = departements.map(d => d.nom).join(', ')
    return { 
      error: `Ce rôle est utilisé dans les départements suivants : ${nomsDepartements}. Supprimez-le d'abord de ces départements.` 
    }
  }

  const { error } = await supabase
    .from('role')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression du rôle:', error)
    return { error: 'Erreur lors de la suppression du rôle' }
  }

  revalidatePath('/admin/roles')
  return { success: true }
}

// Récupérer les rôles disponibles pour un département selon son type
export async function getRolesDisponibles(typeDepartement?: string) {
  let query = supabase
    .from('role')
    .select('*')
    .order('niveau', { ascending: true })
    .order('nom', { ascending: true })

  // Si c'est un département de type 'normal', on ne prend que les rôles de niveau 'paroisse'
  if (typeDepartement === 'normal') {
    query = query.eq('niveau', 'paroisse')
  }
  
  // Pour 'commite' et 'agence_programme', on peut prendre tous les niveaux ou faire une logique spécifique

  const { data: roles, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des rôles disponibles:', error)
    return []
  }

  return roles || []
}




export interface District {
  id: number
  nom: string
  conference_id: number
  created_at: string
  updated_at: string
  conference?: {
    id: number
    nom: string
    region?: {
      id: number
      nom: string
    }
  }
  chefs?: any[]
  _count?: {
    departements: number
  }
}


// Récupérer tous les districts (version simple)
export async function getDistricts(): Promise<District[]> {
  try {
    const { data, error } = await supabase
      .from('district')
      .select(`
        *,
        conference:conference_id (
          id,
          nom,
          region:region_id (nom)
        )
      `)
      .order('nom')

    if (error) throw error

    // Transformer les données
    const transformedData = (data || []).map((district: any) => ({
      ...district,
      conference: district.conference ? {
        ...district.conference,
        region: Array.isArray(district.conference.region) 
          ? district.conference.region[0] 
          : district.conference.region
      } : null
    }))

    return transformedData
  } catch (error) {
    console.error('Erreur getDistricts:', error)
    return []
  }
}


// Dans actions/structures.ts, ajoutez cette fonction si elle n'existe pas déjà
export async function getConferencesForSelector() {
  try {
    const { data, error } = await supabase
      .from('conference')
      .select('id, nom')
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getConferencesForSelector:', error)
    return []
  }
}


// actions/structures.ts - Ajouter cette fonction

export interface Conference {
  id: number
  nom: string
  region_id: number
  created_at: string
  updated_at: string
  region?: {
    id: number
    nom: string
  }
  chefs?: any[]
  _count?: {
    districts: number
  }
}

// Récupérer toutes les conférences avec leurs chefs de département
// export async function getConferencesWithChefs(): Promise<Conference[]> {
//   try {
//     const { data: conferences, error } = await supabase
//       .from('conference')
//       .select(`
//         *,
//         region:region_id (id, nom),
//         chefs:chef_departement(
//           id,
//           fidele_id,
//           departement_id,
//           date_nomination,
//           fidele:fidele_id (
//             id,
//             nom,
//             post_nom,
//             prenom,
//             profile_img
//           ),
//           departement:departement_id (
//             id,
//             nom
//           ),
//           role:role_id (
//             id,
//             nom_role,
//             label_role
//           )
//         )
//       `)
//       .eq('chef_departement.est_actif', true)
//       .eq('chef_departement.niveau', 'conference')
//       .order('nom')

//     if (error) throw error

//     // Compter les districts pour chaque conférence
//     const conferencesWithCount = await Promise.all(
//       (conferences || []).map(async (conference: any) => {
//         const { count } = await supabase
//           .from('district')
//           .select('*', { count: 'exact', head: true })
//           .eq('conference_id', conference.id)

//         return {
//           ...conference,
//           _count: {
//             districts: count || 0
//           },
//           region: conference.region,
//           chefs: (conference.chefs || []).map((chef: any) => ({
//             ...chef,
//             fidele: Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele,
//             departement: Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
//           }))
//         }
//       })
//     )

//     return conferencesWithCount || []
//   } catch (error) {
//     console.error('Erreur getConferencesWithChefs:', error)
//     return []
//   }
// }




// Add this to actions/structures.ts, preferably near the other paroisse-related functions

// Récupérer la conférence d'une paroisse
export async function getConferenceFromParoisse(paroisseId: number): Promise<number | null> {
  try {
    const { data: paroisse, error } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (error) {
      console.error('Erreur getConferenceFromParoisse:', error)
      return null
    }

    if (paroisse?.district) {
      // Handle case where district might be an array or object
      const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
      if (district?.conference) {
        const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
        return conference?.id || null
      }
    }
    return null
  } catch (error) {
    console.error('Erreur inattendue getConferenceFromParoisse:', error)
    return null
  }
}






// actions/paroisse.ts (ou ajouter à un fichier existant)
export async function getConferenceIdFromParoisse(paroisseId: number) {
  const { data } = await supabase
    .from('paroisse')
    .select(`
      district:district_id (
        conference:conference_id (id)
      )
    `)
    .eq('id', paroisseId)
    .single()

  const district = Array.isArray(data?.district) ? data.district[0] : data?.district
  const conference = Array.isArray(district?.conference) ? district.conference[0] : district?.conference
  
  return conference?.id || null
}

// Récupérer la conférence d'un district
export async function getConferenceFromDistrict(districtId: number): Promise<number | null> {
  try {
    const { data: district, error } = await supabase
      .from('district')
      .select(`
        conference:conference_id (id)
      `)
      .eq('id', districtId)
      .single()

    if (error) {
      console.error('Erreur getConferenceFromDistrict:', error)
      return null
    }

    if (district?.conference) {
      const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
      return conference?.id || null
    }
    return null
  } catch (error) {
    console.error('Erreur inattendue getConferenceFromDistrict:', error)
    return null
  }
}




// Récupérer tous les districts avec leurs chefs
// export async function getDistrictsWithChefs(): Promise<District[]> {
//   try {
//     const { data: districts, error } = await supabase
//       .from('district')
//       .select(`
//         *,
//         conference:conference_id (
//           id,
//           nom,
//           region:region_id (nom)
//         ),
//         chefs:chef_departement(
//           id,
//           fidele_id,
//           departement_id,
//           date_nomination,
//           role_id,
//           fidele:fidele_id (
//             id,
//             nom,
//             post_nom,
//             prenom,
//             profile_img
//           ),
//           departement:departement_id (
//             id,
//             nom
//           ),
//           role:role_id (
//             id,
//             nom_role,
//             label_role
//           )
//         )
//       `)
//       .eq('chef_departement.est_actif', true)
//       .eq('chef_departement.niveau', 'district')
//       .order('nom')

//     if (error) throw error

//     // Compter les départements pour chaque district
//     const districtsWithCount = await Promise.all(
//       (districts || []).map(async (district: any) => {
//         const { count } = await supabase
//           .from('departement')
//           .select('*', { count: 'exact', head: true })
//           .eq('district_id', district.id)

//         return {
//           ...district,
//           _count: {
//             departements: count || 0
//           },
//           // Transformer les relations si nécessaire
//           conference: district.conference ? {
//             ...district.conference,
//             region: Array.isArray(district.conference.region) 
//               ? district.conference.region[0] 
//               : district.conference.region
//           } : null,
//           chefs: (district.chefs || []).map((chef: any) => ({
//             ...chef,
//             fidele: Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele,
//             departement: Array.isArray(chef.departement) ? chef.departement[0] : chef.departement,
//             role: Array.isArray(chef.role) ? chef.role[0] : chef.role  // ← AJOUTER CECI
//           }))
//         }
//       })
//     )

//     return districtsWithCount || []
//   } catch (error) {
//     console.error('Erreur getDistrictsWithChefs:', error)
//     return []
//   }
// }


// actions/structures.ts - VERSION CORRIGÉE

export async function getFullHierarchyFromParoisse(paroisseId: number) {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select(`
        district:district_id(
          id,
          nom,
          conference:conference_id(
            id,
            nom,
            region:region_id(id, nom)
          )
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (error) throw error

    // Gérer le cas où les relations sont retournées comme des tableaux
    const district = Array.isArray(data?.district) ? data.district[0] : data?.district
    const conference = Array.isArray(district?.conference) ? district.conference[0] : district?.conference
    const region = Array.isArray(conference?.region) ? conference.region[0] : conference?.region
    
    return {
      region: region?.nom || '',
      conference: conference?.nom || '',
      district: district?.nom || ''
    }
  } catch (error) {
    console.error('Erreur getFullHierarchyFromParoisse:', error)
    return {
      region: '',
      conference: '',
      district: ''
    }
  }
}



// actions/structures.ts

// ==================== CONFERENCES AVEC CHEFS (FILTRÉ PAR ANNÉE) ====================

export interface Conference {
  id: number
  nom: string
  region_id: number
  created_at: string
  updated_at: string
  region?: {
    id: number
    nom: string
  }
  chefs?: any[]
  _count?: {
    districts: number
  }
}

/**
 * Récupérer toutes les conférences avec leurs chefs de département
 * @param anneeConferenceId - Optionnel : ID de l'année de conférence pour filtrer les chefs
 */
// export async function getConferencesWithChefs(anneeConferenceId?: number | null): Promise<Conference[]> {
//   try {
//     // Construire la requête pour les chefs
//     let chefsQuery = supabase
//       .from('conference')
//       .select(`
//         *,
//         region:region_id (id, nom),
//         chefs:chef_departement(
//           id,
//           fidele_id,
//           departement_id,
//           date_nomination,
//           annee_conference_id,
//           fidele:fidele_id (
//             id,
//             nom,
//             post_nom,
//             prenom,
//             profile_img
//           ),
//           departement:departement_id (
//             id,
//             nom
//           ),
//           role:role_id (
//             id,
//             nom_role,
//             label_role
//           )
//         )
//       `)
//       .eq('chef_departement.est_actif', true)
//       .eq('chef_departement.niveau', 'conference')
//       .order('nom')

//     // Ajouter le filtre par année si spécifié
//     if (anneeConferenceId) {
//       chefsQuery = chefsQuery.eq('chef_departement.annee_conference_id', anneeConferenceId)
//     }

//     const { data: conferences, error } = await chefsQuery

//     if (error) throw error

//     // Compter les districts pour chaque conférence
//     const conferencesWithCount = await Promise.all(
//       (conferences || []).map(async (conference: any) => {
//         const { count } = await supabase
//           .from('district')
//           .select('*', { count: 'exact', head: true })
//           .eq('conference_id', conference.id)

//         return {
//           ...conference,
//           _count: {
//             districts: count || 0
//           },
//           region: conference.region,
//           chefs: (conference.chefs || []).map((chef: any) => ({
//             ...chef,
//             fidele: Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele,
//             departement: Array.isArray(chef.departement) ? chef.departement[0] : chef.departement,
//             role: Array.isArray(chef.role) ? chef.role[0] : chef.role
//           }))
//         }
//       })
//     )

//     return conferencesWithCount || []
//   } catch (error) {
//     console.error('Erreur getConferencesWithChefs:', error)
//     return []
//   }
// }

// ==================== DISTRICTS AVEC CHEFS (FILTRÉ PAR ANNÉE) ====================

export interface District {
  id: number
  nom: string
  conference_id: number
  created_at: string
  updated_at: string
  conference?: {
    id: number
    nom: string
    region?: {
      id: number
      nom: string
    }
  }
  chefs?: any[]
  _count?: {
    departements: number
  }
}

/**
 * Récupérer tous les districts avec leurs chefs
 * @param anneeConferenceId - Optionnel : ID de l'année de conférence pour filtrer les chefs
 */
export async function getDistrictsWithChefs(anneeConferenceId?: number | null): Promise<District[]> {
  try {
    // Construire la requête pour les chefs
    let chefsQuery = supabase
      .from('district')
      .select(`
        *,
        conference:conference_id (
          id,
          nom,
          region:region_id (nom)
        ),
        chefs:chef_departement(
          id,
          fidele_id,
          departement_id,
          date_nomination,
          annee_conference_id,
          role_id,
          fidele:fidele_id (
            id,
            nom,
            post_nom,
            prenom,
            profile_img
          ),
          departement:departement_id (
            id,
            nom
          ),
          role:role_id (
            id,
            nom_role,
            label_role
          )
        )
      `)
      .eq('chef_departement.est_actif', true)
      .eq('chef_departement.niveau', 'district')
      .order('nom')

    // Ajouter le filtre par année si spécifié
    if (anneeConferenceId) {
      chefsQuery = chefsQuery.eq('chef_departement.annee_conference_id', anneeConferenceId)
    }

    const { data: districts, error } = await chefsQuery

    if (error) throw error

    // Compter les départements pour chaque district
    const districtsWithCount = await Promise.all(
      (districts || []).map(async (district: any) => {
        const { count } = await supabase
          .from('departement')
          .select('*', { count: 'exact', head: true })
          .eq('district_id', district.id)

        return {
          ...district,
          _count: {
            departements: count || 0
          },
          conference: district.conference ? {
            ...district.conference,
            region: Array.isArray(district.conference.region) 
              ? district.conference.region[0] 
              : district.conference.region
          } : null,
          chefs: (district.chefs || []).map((chef: any) => ({
            ...chef,
            fidele: Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele,
            departement: Array.isArray(chef.departement) ? chef.departement[0] : chef.departement,
            role: Array.isArray(chef.role) ? chef.role[0] : chef.role
          }))
        }
      })
    )

    return districtsWithCount || []
  } catch (error) {
    console.error('Erreur getDistrictsWithChefs:', error)
    return []
  }
}










// actions/structures.ts

/**
 * Récupérer toutes les conférences avec leurs chefs de département
 * @param anneeConferenceId - Optionnel : ID de l'année de conférence pour filtrer les chefs
 */
export async function getConferencesWithChefs(anneeConferenceId?: number | null): Promise<Conference[]> {
  try {
    console.log('📡 getConferencesWithChefs - anneeConferenceId:', anneeConferenceId)
    
    // D'abord, récupérer toutes les conférences
    const { data: conferences, error: confError } = await supabase
      .from('conference')
      .select(`
        *,
        region:region_id (id, nom)
      `)
      .order('nom')

    if (confError) throw confError

    // Pour chaque conférence, récupérer ses chefs avec le filtre d'année
    const conferencesWithChefs = await Promise.all(
      (conferences || []).map(async (conference: any) => {
        // Construire la requête pour les chefs
        let chefsQuery = supabase
          .from('chef_departement')
          .select(`
            id,
            fidele_id,
            departement_id,
            conference_id,
            date_nomination,
            annee_conference_id,
            est_actif,
            niveau,
            fidele:fidele_id (
              id,
              nom,
              post_nom,
              prenom,
              profile_img
            ),
            departement:departement_id (
              id,
              nom
            ),
            role:role_id (
              id,
              nom_role,
              label_role
            )
          `)
          .eq('conference_id', conference.id)
          .eq('niveau', 'conference')
          .eq('est_actif', true)

        // Appliquer le filtre par année si spécifié
        if (anneeConferenceId) {
          chefsQuery = chefsQuery.eq('annee_conference_id', anneeConferenceId)
        }

        const { data: chefs, error: chefsError } = await chefsQuery

        if (chefsError) {
          console.error(`Erreur récupération chefs pour conférence ${conference.id}:`, chefsError)
        }

        // Compter les districts
        const { count: districtsCount } = await supabase
          .from('district')
          .select('*', { count: 'exact', head: true })
          .eq('conference_id', conference.id)

        // Formater les chefs
        const formattedChefs = (chefs || []).map((chef: any) => ({
          ...chef,
          fidele: Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele,
          departement: Array.isArray(chef.departement) ? chef.departement[0] : chef.departement,
          role: Array.isArray(chef.role) ? chef.role[0] : chef.role
        }))

        console.log(`  Conférence ${conference.nom}: ${formattedChefs.length} chefs (filtre année: ${anneeConferenceId || 'aucun'})`)

        return {
          ...conference,
          region: Array.isArray(conference.region) ? conference.region[0] : conference.region,
          chefs: formattedChefs,
          _count: {
            districts: districtsCount || 0
          }
        }
      })
    )

    return conferencesWithChefs
  } catch (error) {
    console.error('Erreur getConferencesWithChefs:', error)
    return []
  }
}