

// actions/roles.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'

export async function ajouterRole(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const type_role = formData.get('type_role') as string
    const nom_role = formData.get('nom_role') as string
    const label_role = formData.get('label_role') as string

    if (!type_role || !nom_role || !label_role) {
      return { error: 'Tous les champs sont requis' }
    }

    if (!['district', 'conference'].includes(type_role)) {
      return { error: 'Type de rôle invalide' }
    }

    // Vérifier si le rôle existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('role_config')
      .select('id')
      .eq('type_role', type_role)
      .eq('nom_role', nom_role)
      .maybeSingle()

    if (checkError) {
      console.error('Erreur vérification rôle existant:', checkError)
      return { error: 'Erreur lors de la vérification' }
    }

    if (existing) {
      return { error: 'Ce rôle existe déjà pour ce type' }
    }

    const { data, error } = await supabase
      .from('role_config')
      .insert([{ type_role, nom_role, label_role }])
      .select()
      .single()

    if (error) {
      console.error('Erreur création rôle:', error)
      return { error: error.message }
    }

    // Revalider les chemins appropriés
    if (type_role === 'district') {
      revalidatePath('/admin/districts')
    } else {
      revalidatePath('/admin/conferences')
    }

    return { success: true, role: data }
  } catch (error: any) {
    console.error('Erreur ajouterRole:', error?.message || error)
    return { error: 'Erreur lors de l\'ajout du rôle' }
  }
}

export async function getRolesByType(type: 'district' | 'conference') {
  try {
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .eq('type_role', type)
      .order('nom_role')

    if (error) {
      console.error('Erreur récupération rôles:', error)
      return []
    }

    return data || []
  } catch (error: any) {
    console.error('Erreur getRolesByType:', error?.message || error)
    return []
  }
}

// Récupérer le nombre de postes disponibles par type
export async function getNombrePostesByType(type: 'district' | 'conference') {
  try {
    const { count, error } = await supabase
      .from('role_config')
      .select('*', { count: 'exact', head: true })
      .eq('type_role', type)

    if (error) {
      console.error('Erreur comptage rôles:', error)
      return 0
    }

    return count || 0
  } catch (error: any) {
    console.error('Erreur getNombrePostesByType:', error?.message || error)
    return 0
  }
}

// Récupérer tous les rôles avec leur configuration
export async function getAllRolesConfig() {
  try {
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .order('type_role')
      .order('nom_role')

    if (error) {
      console.error('Erreur récupération configuration rôles:', error)
      return { district: [], conference: [] }
    }

    const district = data?.filter(r => r.type_role === 'district') || []
    const conference = data?.filter(r => r.type_role === 'conference') || []

    return { district, conference }
  } catch (error: any) {
    console.error('Erreur getAllRolesConfig:', error?.message || error)
    return { district: [], conference: [] }
  }
}

// Supprimer un rôle
export async function deleteRole(id: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const { error } = await supabase
      .from('role_config')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur suppression rôle:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/roles')
    return { success: true }
  } catch (error: any) {
    console.error('Erreur deleteRole:', error?.message || error)
    return { error: 'Erreur lors de la suppression du rôle' }
  }
}

// Mettre à jour un rôle
export async function updateRole(id: number, data: { label_role: string }) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const { error } = await supabase
      .from('role_config')
      .update({ label_role: data.label_role })
      .eq('id', id)

    if (error) {
      console.error('Erreur mise à jour rôle:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/roles')
    return { success: true }
  } catch (error: any) {
    console.error('Erreur updateRole:', error?.message || error)
    return { error: 'Erreur lors de la mise à jour du rôle' }
  }
}


// actions/roles.ts - Ajouter la fonction pour les rôles paroisse
// export async function getRolesByType(type: 'district' | 'conference' | 'paroisse') {
//   try {
//     const { data, error } = await supabase
//       .from('role_config')
//       .select('*')
//       .eq('type_role', type)
//       .order('nom_role')

//     if (error) {
//       console.error('Erreur récupération rôles:', error)
//       return []
//     }

//     return data || []
//   } catch (error: any) {
//     console.error('Erreur getRolesByType:', error?.message || error)
//     return []
//   }
// }

// Ajouter un rôle pour le cabinet pastoral
export async function ajouterRoleCabinet(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const nom_role = formData.get('nom_role') as string
    const label_role = formData.get('label_role') as string

    if (!nom_role || !label_role) {
      return { error: 'Tous les champs sont requis' }
    }

    // Vérifier si le rôle existe déjà
    const { data: existing, error: checkError } = await supabase
      .from('role_config')
      .select('id')
      .eq('type_role', 'paroisse')
      .eq('nom_role', nom_role)
      .maybeSingle()

    if (checkError) {
      console.error('Erreur vérification rôle existant:', checkError)
      return { error: 'Erreur lors de la vérification' }
    }

    if (existing) {
      return { error: 'Ce rôle existe déjà' }
    }

    const { data, error } = await supabase
      .from('role_config')
      .insert([{ 
        type_role: 'paroisse', 
        nom_role, 
        label_role 
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur création rôle:', error)
      return { error: error.message }
    }

    return { success: true, role: data }
  } catch (error: any) {
    console.error('Erreur ajouterRoleCabinet:', error?.message || error)
    return { error: 'Erreur lors de l\'ajout du rôle' }
  }
}