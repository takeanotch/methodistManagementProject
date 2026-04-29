//actions/compte.ts
'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'
import { redirect } from 'next/navigation'

// Récupérer tous les comptes avec leurs relations
export async function getComptes() {
  const user = await getUser()
  
  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  const { data: comptes, error } = await supabase
    .from('compte')
    .select(`
      *,
      role:role_id(id, nom, niveau),
      fidele:fidele_id(
        id, 
        nom, 
        post_nom, 
        prenom, 
        actif,
        annee_naissance,
        sexe,
        paroisse:paroisse_id(id, nom)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    return []
  }

  return comptes
}

// Récupérer un compte par son ID
export async function getCompteById(id: number) {
  const user = await getUser()
  
  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  const { data: compte, error } = await supabase
    .from('compte')
    .select(`
      *,
      role:role_id(id, nom, niveau),
      fidele:fidele_id(
        id, 
        nom, 
        post_nom, 
        prenom, 
        actif,
        annee_naissance,
        sexe,
        paroisse:paroisse_id(id, nom)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération du compte:', error)
    return null
  }

  return compte
}

// Mettre à jour le rôle d'un compte
export async function updateCompteRole(formData: FormData) {
  const user = await getUser()
  
  if (!user || user.role?.nom !== 'admin') {
    return { error: 'Non autorisé' }
  }

  const compteId = parseInt(formData.get('compte_id') as string)
  const roleId = parseInt(formData.get('role_id') as string)

  const { error } = await supabase
    .from('compte')
    .update({
      role_id: roleId,
      updated_at: new Date().toISOString()
    })
    .eq('id', compteId)

  if (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error)
    return { error: 'Erreur lors de la mise à jour du rôle' }
  }

  return { success: true }
}

// Désactiver/Réactiver un compte (en réalité, on désactive le fidèle lié)
export async function toggleCompteActif(formData: FormData) {
  const user = await getUser()
  
  if (!user || user.role?.nom !== 'admin') {
    return { error: 'Non autorisé' }
  }

  const compteId = parseInt(formData.get('compte_id') as string)
  const actif = formData.get('actif') === 'true'

  // Récupérer d'abord le fidele_id associé au compte
  const { data: compte, error: fetchError } = await supabase
    .from('compte')
    .select('fidele_id')
    .eq('id', compteId)
    .single()

  if (fetchError || !compte?.fidele_id) {
    return { error: 'Compte non trouvé ou sans fidèle associé' }
  }

  // Mettre à jour le statut du fidèle
  const { error } = await supabase
    .from('fidele')
    .update({
      actif: actif,
      updated_at: new Date().toISOString()
    })
    .eq('id', compte.fidele_id)

  if (error) {
    console.error('Erreur lors de la mise à jour du statut:', error)
    return { error: 'Erreur lors de la mise à jour du statut' }
  }

  return { success: true }
}

// Supprimer un compte (soft delete ?)
export async function deleteCompte(id: number) {
  const user = await getUser()
  
  if (!user || user.role?.nom !== 'admin') {
    return { error: 'Non autorisé' }
  }

  // Vérifier si c'est le dernier admin
  const { data: comptesAdmin } = await supabase
    .from('compte')
    .select('id')
    .eq('role_id', 1) // rôle admin

  const { data: compteToDelete } = await supabase
    .from('compte')
    .select('role_id')
    .eq('id', id)
    .single()

  // Empêcher la suppression du dernier admin
  if (compteToDelete?.role_id === 1 && comptesAdmin?.length === 1) {
    return { error: 'Impossible de supprimer le dernier administrateur' }
  }

  const { error } = await supabase
    .from('compte')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return { error: 'Erreur lors de la suppression du compte' }
  }

  return { success: true }
}

// Récupérer tous les rôles disponibles
export async function getRoles() {
  const { data: roles, error } = await supabase
    .from('role')
    .select('*')
    .order('id')

  if (error) {
    console.error('Erreur lors de la récupération des rôles:', error)
    return []
  }

  return roles
}

// Statistiques des comptes
export async function getComptesStats() {
  const { data: comptes, error } = await supabase
    .from('compte')
    .select(`
      id,
      role_id,
      created_at,
      fidele:fidele_id(actif)
    `)

  if (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return null
  }

  const total = comptes?.length ?? 0
  const admins = comptes?.filter(c => c.role_id === 1).length ?? 0
  const users = comptes?.filter(c => c.role_id === 2).length ?? 0
  const comptesAvecFideleActif = comptes?.filter((c: any) => c.fidele?.actif).length ?? 0
  const comptesAvecFideleInactif = total - comptesAvecFideleActif

  return {
    total,
    admins,
    users,
    actifs: comptesAvecFideleActif,
    inactifs: comptesAvecFideleInactif
  }
}