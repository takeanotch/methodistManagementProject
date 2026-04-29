'use server'

import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
// actions/auth.ts - Ajouter la fonction de synchronisation dans le login
import { ensureUserUniteOrganisation } from './unite-organisation'
// actions/auth.ts

export async function getUser() {
  const userId = (await cookies()).get('userId')?.value

  if (!userId) {
    return null
  }

  // AJOUTER fidele_id DANS LE SELECT
  const { data: user, error } = await supabase
    .from('compte')
    .select('*, role:role_id(nom), fidele_id')  // <-- Ajouter fidele_id ici
    .eq('id', userId)
    .single()

  if (error) {
    return null
  }

  return user
}
export async function login(formData: FormData) {
  const numero = formData.get('numero') as string
  const mot_de_passe = formData.get('mot_de_passe') as string

  try {
    // Récupérer l'utilisateur
    const { data: user, error } = await supabase
      .from('compte')
      .select('*, role:role_id(nom), fidele_id')
      .eq('numero', numero)
      .single()

    if (error || !user) {
      return { error: 'Numéro ou mot de passe incorrect' }
    }

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe)

    if (!isValid) {
      return { error: 'Numéro ou mot de passe incorrect' }
    }

    // Synchroniser les unités d'organisation pour ce fidèle
    if (user.fidele_id) {
      await ensureUserUniteOrganisation(user.fidele_id)
    }

    // Connecter l'utilisateur
    const cookieStore = await cookies()
    cookieStore.set('userId', user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 semaine
    })
    cookieStore.set('userRole', user.role_id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 1 semaine
    })

    // Retourner le succès avec l'URL de redirection
    return { 
      success: true, 
      redirectTo: user.role?.nom === 'admin' ? '/admin' : '/gestion'
    }

  } catch (error) {
    console.error('Erreur de connexion:', error)
    return { error: 'Une erreur est survenue lors de la connexion' }
  }
}

export async function register(formData: FormData) {
  const nom_complet = formData.get('nom_complet') as string
  const numero = formData.get('numero') as string
  const adresse = formData.get('adresse') as string
  const mot_de_passe = formData.get('mot_de_passe') as string

  // Vérifier si l'utilisateur existe déjà
  const { data: existingUser } = await supabase
    .from('compte')
    .select('id')
    .eq('numero', numero)
    .single()

  if (existingUser) {
    return { error: 'Ce numéro est déjà utilisé' }
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(mot_de_passe, 10)

  // Récupérer l'ID du rôle user
  const { data: userRole } = await supabase
    .from('role')
    .select('id')
    .eq('nom', 'user')
    .single()

  // Créer l'utilisateur
  const { data: newUser, error } = await supabase
    .from('compte')
    .insert([
      {
        nom_complet,
        numero,
        adresse,
        mot_de_passe: hashedPassword,
        role_id: userRole?.id || 2
      }
    ])
    .select()
    .single()

  if (error) {
    return { error: 'Erreur lors de l\'inscription' }
  }

  // Connecter l'utilisateur automatiquement
  (await
        // Connecter l'utilisateur automatiquement
        cookies()).set('userId', newUser.id.toString())
  ;(await cookies()).set('userRole', newUser.role_id.toString())

  redirect('/profile')
}






export async function logout() {
  (await cookies()).delete('userId')
  ;(await cookies()).delete('userRole')
  redirect('/login')
}

export async function uploadProfileImage(formData: FormData) {
  const file = formData.get('image') as File
  const userId = (await cookies()).get('userId')?.value

  if (!userId || !file) {
    return { error: 'Utilisateur non connecté ou fichier manquant' }
  }

  // Upload de l'image vers Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file)

  if (uploadError) {
    return { error: 'Erreur lors de l\'upload' }
  }

  // Récupérer l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath)

  // Mettre à jour le profil de l'utilisateur
  const { error: updateError } = await supabase
    .from('compte')
    .update({ profile_img: publicUrl })
    .eq('id', userId)

  if (updateError) {
    return { error: 'Erreur lors de la mise à jour du profil' }
  }

  return { success: true, imageUrl: publicUrl }
}

// export async function getUser() {
//   const userId = (await cookies()).get('userId')?.value

//   if (!userId) {
//     return null
//   }

//   const { data: user, error } = await supabase
//     .from('compte')
//     .select('*, role:role_id(nom)')
//     .eq('id', userId)
//     .single()

//   if (error) {
//     return null
//   }

//   return user
// }






// Nouvelle fonction pour récupérer les infos du fidèle lié au compte
export async function getCurrentFidele() {
  const user = await getUser()
  
  if (!user || !user.fidele_id) {
    return null
  }

  const { data: fidele, error } = await supabase
    .from('fidele')
    .select(`
      *,
      paroisse:paroisse_id (
        id,
        nom
      )
    `)
    .eq('id', user.fidele_id)
    .single()

  if (error) {
    console.error('Erreur getCurrentFidele:', error)
    return null
  }

  return fidele
}








/**
 * Récupère le niveau de l'utilisateur connecté à partir de son rôle
 * @returns 'region' | 'conference' | 'district' | 'paroisse' | null
 */
export async function getUserNiveau(): Promise<'region' | 'conference' | 'district' | 'paroisse' | null> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      console.log('❌ getUserNiveau - Pas de userId dans les cookies')
      return null
    }

    // Récupérer l'utilisateur avec son role_id
    const { data: user, error: userError } = await supabase
      .from('compte')
      .select('role_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      console.log('❌ getUserNiveau - Utilisateur non trouvé:', userError)
      return null
    }

    if (!user.role_id) {
      console.log('❌ getUserNiveau - Pas de role_id pour l\'utilisateur')
      return null
    }

    // Récupérer le niveau depuis la table role
    const { data: role, error: roleError } = await supabase
      .from('role')
      .select('niveau')
      .eq('id', user.role_id)
      .single()

    if (roleError || !role) {
      console.log('❌ getUserNiveau - Rôle non trouvé:', roleError)
      return null
    }

    if (!role.niveau) {
      console.log('❌ getUserNiveau - Le rôle n\'a pas de niveau défini')
      return 'paroisse' // Valeur par défaut
    }

    console.log('✅ getUserNiveau - Niveau trouvé:', role.niveau)
    return role.niveau as 'region' | 'conference' | 'district' | 'paroisse'

  } catch (error) {
    console.error('❌ getUserNiveau - Exception:', error)
    return null
  }
}

/**
 * Récupère le rôle complet de l'utilisateur connecté
 */
export async function getUserRole() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value

    if (!userId) {
      return null
    }

    const { data: user, error: userError } = await supabase
      .from('compte')
      .select('role_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return null
    }

    const { data: role, error: roleError } = await supabase
      .from('role')
      .select('*')
      .eq('id', user.role_id)
      .single()

    if (roleError || !role) {
      return null
    }

    return role
  } catch (error) {
    console.error('Erreur getUserRole:', error)
    return null
  }
}

/**
 * Vérifie si l'utilisateur a un niveau spécifique ou supérieur
 * Hiérarchie: region > conference > district > paroisse
 */
export async function hasMinNiveau(niveauRequis: 'region' | 'conference' | 'district' | 'paroisse'): Promise<boolean> {
  const niveauUtilisateur = await getUserNiveau()
  
  if (!niveauUtilisateur) return false
  
  const niveaux = ['paroisse', 'district', 'conference', 'region']
  const indexUtilisateur = niveaux.indexOf(niveauUtilisateur)
  const indexRequis = niveaux.indexOf(niveauRequis)
  
  return indexUtilisateur >= indexRequis
}