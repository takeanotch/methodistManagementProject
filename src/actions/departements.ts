//actions/departements.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
 
// Types pour TypeScript
export type DepartementType = 'commite' | 'agence_programme' | 'normal' | 'departement'

export interface RoleDepartement {
  id?: number
  nom: string
  label: string
  niveau: number
  couleur: string
}

export interface Departement {
  id: number
  nom: string
  type: DepartementType
  description: string | null
  roles_config: RoleDepartement[]
  created_at: string
  updated_at: string
  stats?: {  // Ajout optionnel pour les statistiques
    total_membres: number
    membres_actifs: number
    annee_en_cours: string | null
  }
}

// Récupérer tous les départements (version améliorée avec statistiques)
export async function getDepartements() {
  // Récupérer tous les départements
  const { data: departements, error } = await supabase
    .from('departement')
    .select('*')
    .order('nom', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des départements:', error)
    return []
  }

  // Pour chaque département, récupérer les statistiques
  const departementsWithStats = await Promise.all(
    departements.map(async (dept) => {
      // Compter les membres actifs
      const { count: membresActifs } = await supabase
        .from('fidele_departement')
        .select('*', { count: 'exact', head: true })
        .eq('departement_id', dept.id)
        .eq('est_actif', true)

      // Compter le total des membres (actifs + inactifs)
      const { count: totalMembres } = await supabase
        .from('fidele_departement')
        .select('*', { count: 'exact', head: true })
        .eq('departement_id', dept.id)

      // Récupérer l'année en cours si elle existe
      const { data: anneeEnCours } = await supabase
        .from('annee_departement')
        .select('code')
        .eq('departement_id', dept.id)
        .eq('est_ouverte', true)
        .maybeSingle()

      return {
        ...dept,
        stats: {
          total_membres: totalMembres || 0,
          membres_actifs: membresActifs || 0,
          annee_en_cours: anneeEnCours?.code || null
        }
      }
    })
  )

  return departementsWithStats
}

// Récupérer un département par son ID
export async function getDepartementById(id: number) {
  const { data: departement, error } = await supabase
    .from('departement')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération du département:', error)
    return null
  }

  return departement
}

// Récupérer les statistiques globales
export async function getDepartementsStats() {
  const { data: stats, error } = await supabase
    .from('departement')
    .select('type')

  if (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return {
      total: 0,
      commite: 0,
      agence_programme: 0,
      normal: 0
    }
  }

  return {
    total: stats.length,
    commite: stats.filter(d => d.type === 'commite').length,
    agence_programme: stats.filter(d => d.type === 'agence_programme').length,
    normal: stats.filter(d => d.type === 'normal').length
  }
}

// Créer un département
export async function createDepartement(formData: FormData) {
  const nom = formData.get('nom') as string
  const type = formData.get('type') as DepartementType
  const description = formData.get('description') as string
  
  // Récupérer les rôles depuis le formulaire
  const rolesNom = formData.getAll('roles_nom[]') as string[]
  const rolesLabel = formData.getAll('roles_label[]') as string[]
  const rolesNiveau = formData.getAll('roles_niveau[]') as string[]
  const rolesCouleur = formData.getAll('roles_couleur[]') as string[]

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  if (!type) {
    return { error: 'Le type est requis' }
  }

  // Valider le type
  if (!['commite', 'agence_programme', 'normal'].includes(type)) {
    return { error: 'Type de département invalide' }
  }

  // Construire la configuration des rôles avec des IDs
  let roles_config: RoleDepartement[] = []
  
  if (rolesNom.length > 0) {
    // Utiliser les rôles du formulaire
    roles_config = rolesNom.map((nom, index) => ({
      id: index + 1, // Ajouter un ID unique pour chaque rôle
      nom: nom.toLowerCase().replace(/\s+/g, '_'),
      label: rolesLabel[index] || nom,
      niveau: parseInt(rolesNiveau[index]) || 4,
      couleur: rolesCouleur[index] || '#6b7280'
    }))
  } else {
    // Utiliser les rôles par défaut (ceux définis dans la base de données)
    roles_config = [
      { id: 1, nom: 'president', label: 'Président', niveau: 1, couleur: '#ef4444' },
      { id: 2, nom: 'vice_president', label: 'Vice-président', niveau: 2, couleur: '#f97316' },
      { id: 3, nom: 'secretaire', label: 'Secrétaire', niveau: 3, couleur: '#3b82f6' },
      { id: 4, nom: 'vice_secretaire', label: 'Vice-secrétaire', niveau: 3, couleur: '#8b5cf6' },
      { id: 5, nom: 'tresorier', label: 'Trésorier', niveau: 3, couleur: '#10b981' },
      { id: 6, nom: 'conseiller', label: 'Conseiller', niveau: 3, couleur: '#8b5cf6' },
      { id: 7, nom: 'membre', label: 'Membre', niveau: 4, couleur: '#6b7280' }
    ]
  }

  const { data: newDepartement, error } = await supabase
    .from('departement')
    .insert([{
      nom: nom.trim(),
      type,
      description: description || null,
      roles_config
    }])
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la création du département:', error)
    return { error: 'Erreur lors de la création' }
  }

  revalidatePath('/admin/departements')
  return { success: true, departement: newDepartement }
}

// Mettre à jour un département
export async function updateDepartement(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string
  const type = formData.get('type') as DepartementType
  const description = formData.get('description') as string
  
  const rolesNom = formData.getAll('roles_nom[]') as string[]
  const rolesLabel = formData.getAll('roles_label[]') as string[]
  const rolesNiveau = formData.getAll('roles_niveau[]') as string[]
  const rolesCouleur = formData.getAll('roles_couleur[]') as string[]

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  if (!type) {
    return { error: 'Le type est requis' }
  }

  // Valider le type
  if (!['commite', 'agence_programme', 'normal'].includes(type)) {
    return { error: 'Type de département invalide' }
  }

  // Construire la configuration des rôles
  let roles_config: RoleDepartement[] | undefined
  
  if (rolesNom.length > 0) {
    roles_config = rolesNom.map((nom, index) => ({
      id: index + 1,
      nom: nom.toLowerCase().replace(/\s+/g, '_'),
      label: rolesLabel[index] || nom,
      niveau: parseInt(rolesNiveau[index]) || 4,
      couleur: rolesCouleur[index] || '#6b7280'
    }))
  }

  const updateData: any = {
    nom: nom.trim(),
    type,
    description: description || null,
    updated_at: new Date().toISOString()
  }

  // N'ajouter roles_config que si des rôles ont été fournis
  if (roles_config) {
    updateData.roles_config = roles_config
  }

  const { error } = await supabase
    .from('departement')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  revalidatePath('/admin/departements')
  revalidatePath(`/admin/departements/${id}`)
  return { success: true }
}

// Supprimer un département
export async function deleteDepartement(id: number) {
  const { error } = await supabase
    .from('departement')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  revalidatePath('/admin/departements')
  return { success: true }
}


// Dans actions/departements.ts, ajoute:

// Récupérer un département avec ses commissions
export async function getDepartementWithCommissions(id: number) {
  // Récupérer le département
  const { data: departement, error: deptError } = await supabase
    .from('departement')
    .select('*')
    .eq('id', id)
    .single()

  if (deptError) {
    console.error('Erreur lors de la récupération du département:', deptError)
    return null
  }

  // Récupérer ses commissions
  const { data: commissions, error: commError } = await supabase
    .from('commission')
    .select('*')
    .eq('departement_id', id)
    .order('nom', { ascending: true })

  if (commError) {
    console.error('Erreur lors de la récupération des commissions:', commError)
    return { ...departement, commissions: [] }
  }

  // Ajouter les stats pour chaque commission
  const commissionsWithStats = await Promise.all(
    commissions.map(async (commission) => {
      const { count: totalMembres } = await supabase
        .from('fidele_departement')
        .select('*', { count: 'exact', head: true })
        .eq('commission_id', commission.id)

      const { count: membresActifs } = await supabase
        .from('fidele_departement')
        .select('*', { count: 'exact', head: true })
        .eq('commission_id', commission.id)
        .eq('est_actif', true)

      return {
        ...commission,
        stats: {
          total_membres: totalMembres || 0,
          membres_actifs: membresActifs || 0
        }
      }
    })
  )

  return {
    ...departement,
    commissions: commissionsWithStats
  }
}

// actions/departement.ts
export async function getDepartementByReferenceId(referenceId: number) {
  const { supabase } = await import('@/lib/supabase')
  
  const { data, error } = await supabase
    .from('departement')
    .select('*')
    .eq('id', referenceId)
    .single()
  
  if (error) {
    console.error('Erreur getDepartementByReferenceId:', error)
    return null
  }
  
  return data
}