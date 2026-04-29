
//fidele-departemnt.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
// Dans actions/fidele-departement.ts

// Ajouter cet import en haut du fichier
import { getCurrentAnneeConference } from './annee-conference'


export interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

export interface FideleDepartement {
  id: number
  fidele_id: number
  departement_id: number
  role_id: number
  annee_id: number
  annee_conference_id?: number
  est_actif: boolean
  paroisse_id: number
  created_at: string
  updated_at: string
  annee?: {
    id: number
    label: string
  }
  fidele?: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img?: string
    sexe?: string
    actif?: boolean
    paroisse?: {
      id: number
      nom: string
    }
  }
  departement?: {
    id: number
    nom: string
    type: string
    roles_config: any[]
  }
  role_details?: {
    id: number
    nom: string
    label: string
    niveau: number
    couleur: string
  }
}

export interface Annee {
  id: number
  label: string
}

/**
 * Récupérer toutes les années disponibles
 */
export async function getAnnees(): Promise<Annee[]> {
  const { data: annees, error } = await supabase
    .from('annee')
    .select('*')
    .order('label', { ascending: false })

  if (error) {
    console.error('❌ Erreur lors de la récupération des années:', error)
    return []
  }

  return annees || []
}

/**
 * Récupérer l'année en cours pour un département spécifique
 * Cette année est définie au niveau du district dans la table annee_district
 */
export async function getAnneeEnCoursForDepartement(departementId: number): Promise<Annee | null> {
  try {
    // D'abord, récupérer le district du département
    const { data: dept, error: deptError } = await supabase
      .from('departement')
      .select('district_id')
      .eq('id', departementId)
      .single()

    if (deptError || !dept) {
      console.error('❌ Département non trouvé:', deptError)
      return null
    }

    // Ensuite, récupérer l'année en cours pour ce district/département
    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        annee_id,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('district_id', dept.district_id)
      .eq('departement_id', departementId)
      .eq('is_current', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur lors de la récupération de l\'année en cours:', error)
      return null
    }

    if (data && data.annee) {
      // Gérer le cas où annee est un tableau
      const annee = Array.isArray(data.annee) ? data.annee[0] : data.annee
      return annee
    }

    // Fallback: si aucune année en cours n'est définie, prendre la plus récente
    console.log('⚠️ Aucune année en cours définie pour ce département, fallback sur la plus récente')
    const annees = await getAnnees()
    return annees[0] || null
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return null
  }
}

/**
 * Récupérer toutes les années disponibles pour un département
 * avec leur statut (current, past, future)
 */
export async function getAnneesForDepartement(departementId: number) {
  try {
    // Récupérer le district du département
    const { data: dept, error: deptError } = await supabase
      .from('departement')
      .select('district_id')
      .eq('id', departementId)
      .single()

    if (deptError || !dept) {
      console.error('❌ Département non trouvé:', deptError)
      return []
    }

    // Récupérer toutes les années configurées pour ce district/département
    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('district_id', dept.district_id)
      .eq('departement_id', departementId)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('❌ Erreur lors de la récupération des années:', error)
      return []
    }

    // Récupérer l'ID de l'année en cours pour calculer les statuts
    const currentAnneeId = data?.find(a => a.is_current)?.annee_id

    // Transformer les données
    const anneesAvecStatut = (data || []).map((item: any) => {
      const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
      
      let status: 'current' | 'past' | 'future' = 'past'
      if (item.is_current) {
        status = 'current'
      } else if (currentAnneeId && item.annee_id > currentAnneeId) {
        status = 'future'
      }

      return {
        id: item.annee_id,
        label: annee?.label || '',
        annee_district_id: item.id,
        is_current: item.is_current,
        status
      }
    })

    return anneesAvecStatut
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return []
  }
}

/**
 * Récupérer tous les fidèles d'un département avec détails des rôles
 * @param departementId - ID du département
 * @param paroisseId - ID de la paroisse (optionnel, si null = toutes les paroisses)
 * @param anneeId - ID de l'année (optionnel, si null = toutes les années)
 */
export async function getFidelesByDepartement(
  departementId: number, 
  paroisseId?: number | null,
  anneeId?: number | null
) {
  let query = supabase
    .from('fidele_departement')
    .select(`
      *,
      fidele:fidele_id (
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img,
        sexe,
        actif
      ),
      departement:departement_id (
        id,
        nom,
        type,
        roles_config
      ),
      annee:annee_id (
        id,
        label
      )
    `)
    .eq('departement_id', departementId)
    .eq('est_actif', true)

  // Filtrer par paroisse si spécifié
  if (paroisseId) {
    query = query.eq('paroisse_id', paroisseId)
  }

  // Filtrer par année si spécifié
  if (anneeId) {
    query = query.eq('annee_id', anneeId)
  }

  const { data: affectations, error } = await query
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des fidèles du département:', error)
    return []
  }

  // Enrichir avec les détails du rôle depuis roles_config
  const affectationsWithRoleDetails = affectations.map((affectation: any) => {
    const roleDetails = affectation.departement?.roles_config?.find(
      (r: any) => r.id === affectation.role_id
    ) || null
    
    return {
      ...affectation,
      role_details: roleDetails
    }
  })

  return affectationsWithRoleDetails
}

/**
 * Récupérer les rôles disponibles pour un département
 * @param departementId - ID du département
 */
export async function getRolesByDepartement(departementId: number) {
  const { data: departement, error } = await supabase
    .from('departement')
    .select('roles_config')
    .eq('id', departementId)
    .single()

  if (error || !departement) {
    console.error('Erreur lors de la récupération des rôles:', error)
    return []
  }

  return departement.roles_config || []
}

/**
 * Vérifier si un fidèle a déjà un rôle actif dans un département pour une année donnée
 */
export async function checkFideleRoleExists(
  fideleId: number, 
  departementId: number, 
  roleId: number,
  anneeId: number,
  paroisseId?: number | null
) {
  let query = supabase
    .from('fidele_departement')
    .select('id')
    .eq('fidele_id', fideleId)
    .eq('departement_id', departementId)
    .eq('role_id', roleId)
    .eq('annee_id', anneeId)
    .eq('est_actif', true)

  if (paroisseId) {
    query = query.eq('paroisse_id', paroisseId)
  }

  const { data: existing, error } = await query.maybeSingle()

  if (error) {
    console.error('Erreur lors de la vérification:', error)
    return false
  }

  return !!existing
}


export async function updateFideleRole(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const role_id = parseInt(formData.get('role_id') as string)
  const annee_id = formData.get('annee_id') ? parseInt(formData.get('annee_id') as string) : null
  const est_actif = formData.get('est_actif') === 'true'
  const paroisse_id = formData.get('paroisse_id') ? parseInt(formData.get('paroisse_id') as string) : null

  if (!id || !role_id) {
    return { error: 'Informations manquantes' }
  }

  try {
    // Récupérer l'affectation actuelle
    const { data: current, error: fetchError } = await supabase
      .from('fidele_departement')
      .select('fidele_id, departement_id, role_id, annee_id, paroisse_id')
      .eq('id', id)
      .single()

    if (fetchError || !current) {
      return { error: 'Affectation non trouvée' }
    }

    // Vérifier les permissions si paroisse_id est fourni
    if (paroisse_id && current.paroisse_id !== paroisse_id) {
      return { error: 'Accès non autorisé à cette affectation' }
    }

    // Si changement d'année, vérifier que la nouvelle année est configurée
    if (annee_id && current.annee_id !== annee_id) {
      const { data: anneeDistrict } = await supabase
        .from('annee_district')
        .select('id')
        .eq('annee_id', annee_id)
        .eq('departement_id', current.departement_id)
        .maybeSingle()

      if (!anneeDistrict) {
        return { error: 'Cette année n\'est pas configurée pour ce département' }
      }
    }

    // Vérifier les doublons si changement de rôle ou d'année
    if (current.role_id !== role_id || (annee_id && current.annee_id !== annee_id)) {
      const finalAnneeId = annee_id || current.annee_id
      
      const { data: existing } = await supabase
        .from('fidele_departement')
        .select('id')
        .eq('fidele_id', current.fidele_id)
        .eq('departement_id', current.departement_id)
        .eq('role_id', role_id)
        .eq('annee_id', finalAnneeId)
        .eq('est_actif', true)
        .neq('id', id)
        .maybeSingle()

      if (existing) {
        return { error: 'Ce rôle est déjà attribué à ce fidèle dans ce département pour cette année' }
      }
    }

    // Mettre à jour
    const updateData: any = {
      role_id,
      est_actif,
      updated_at: new Date().toISOString()
    }

    if (annee_id) {
      updateData.annee_id = annee_id
    }

    const { error } = await supabase
      .from('fidele_departement')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la mise à jour:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/admin/departements/${current.departement_id}`)
    revalidatePath(`/admin/fideles/${current.fidele_id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}

/**
 * Désactiver l'affectation d'un fidèle dans un département (soft delete)
 */
export async function removeFideleFromDepartement(id: number, paroisseId?: number | null) {
  try {
    // Récupérer les infos pour la revalidation et vérification
    const { data: affectation, error: fetchError } = await supabase
      .from('fidele_departement')
      .select('fidele_id, departement_id, paroisse_id')
      .eq('id', id)
      .single()

    if (fetchError || !affectation) {
      return { error: 'Affectation non trouvée' }
    }

    // Vérifier les permissions si paroisseId est fourni
    if (paroisseId && affectation.paroisse_id !== paroisseId) {
      return { error: 'Accès non autorisé à cette affectation' }
    }

    // Soft delete : on marque comme inactif
    const { error } = await supabase
      .from('fidele_departement')
      .update({
        est_actif: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la désactivation:', error)
      return { error: 'Erreur lors de la désactivation' }
    }

    revalidatePath(`/admin/departements/${affectation.departement_id}`)
    revalidatePath(`/admin/fideles/${affectation.fidele_id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}

/**
 * Récupérer les statistiques des affectations
 * @param paroisseId - ID de la paroisse (optionnel)
 * @param anneeId - ID de l'année (optionnel)
 */
export async function getAffectationsStats(paroisseId?: number | null, anneeId?: number | null) {
  let query = supabase
    .from('fidele_departement')
    .select(`
      departement_id,
      role_id,
      est_actif,
      paroisse_id,
      annee_id,
      departement:departement_id (
        id,
        nom,
        roles_config
      ),
      annee:annee_id (
        id,
        label
      )
    `)

  if (paroisseId) {
    query = query.eq('paroisse_id', paroisseId)
  }

  if (anneeId) {
    query = query.eq('annee_id', anneeId)
  }

  const { data: stats, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return null
  }

  const total = stats.length
  const actifs = stats.filter(a => a.est_actif).length
  const inactifs = total - actifs

  // Regrouper par département
  const parDepartement = stats.reduce((acc: any, curr: any) => {
    const deptId = curr.departement_id.toString()
    const deptNom = curr.departement?.nom || 'Inconnu'
    const role = curr.departement?.roles_config?.find((r: any) => r.id === curr.role_id)
    
    if (!acc[deptId]) {
      acc[deptId] = {
        id: curr.departement_id,
        nom: deptNom,
        total: 0,
        actifs: 0,
        roles: {}
      }
    }
    
    acc[deptId].total++
    if (curr.est_actif) acc[deptId].actifs++
    
    const roleLabel = role?.label || curr.role_id.toString()
    acc[deptId].roles[roleLabel] = (acc[deptId].roles[roleLabel] || 0) + 1
    
    return acc
  }, {})

  return {
    total,
    actifs,
    inactifs,
    parDepartement
  }
}

/**
 * Supprimer définitivement une affectation
 */
export async function deleteFideleFromDepartement(id: number, paroisseId?: number | null) {
  try {
    // Récupérer les infos pour la revalidation et vérification
    const { data: affectation, error: fetchError } = await supabase
      .from('fidele_departement')
      .select('fidele_id, departement_id, paroisse_id')
      .eq('id', id)
      .single()

    if (fetchError || !affectation) {
      return { error: 'Affectation non trouvée' }
    }

    // Vérifier les permissions si paroisseId est fourni
    if (paroisseId && affectation.paroisse_id !== paroisseId) {
      return { error: 'Accès non autorisé à cette affectation' }
    }

    // VRAIE suppression (DELETE)
    const { error } = await supabase
      .from('fidele_departement')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur lors de la suppression:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/admin/departements/${affectation.departement_id}`)
    revalidatePath(`/admin/fideles/${affectation.fidele_id}`)
    revalidatePath(`/paroisse/departements/${affectation.departement_id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}

/**
 * Désactiver (soft delete) - alias pour removeFideleFromDepartement
 */
export async function desactiverFideleFromDepartement(id: number, paroisseId?: number | null) {
  return removeFideleFromDepartement(id, paroisseId)
}

/**
 * Récupérer tous les départements d'un fidèle (actifs et inactifs)
 * @param fideleId - ID du fidèle
 * @param paroisseId - ID de la paroisse (optionnel)
 * @param anneeId - ID de l'année (optionnel)
 */
export async function getDepartementsByFidele(
  fideleId: number, 
  paroisseId?: number | null,
  anneeId?: number | null
) {
  let query = supabase
    .from('fidele_departement')
    .select(`
      *,
      departement:departement_id (
        id,
        nom,
        type,
        roles_config
      ),
      annee:annee_id (
        id,
        label
      )
    `)
    .eq('fidele_id', fideleId)
    .order('created_at', { ascending: false })

  if (paroisseId) {
    query = query.eq('paroisse_id', paroisseId)
  }

  if (anneeId) {
    query = query.eq('annee_id', anneeId)
  }

  const { data: affectations, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des départements du fidèle:', error)
    return []
  }

  // Enrichir avec les détails du rôle
  const affectationsWithRoleDetails = affectations.map((affectation: any) => {
    const roleDetails = affectation.departement?.roles_config?.find(
      (r: any) => r.id === affectation.role_id
    ) || null
    
    return {
      ...affectation,
      role_details: roleDetails
    }
  })

  return affectationsWithRoleDetails
}

/**
 * Récupérer tous les fidèles d'un département (actifs ET inactifs)
 * @param departementId - ID du département
 * @param paroisseId - ID de la paroisse (optionnel)
 * @param anneeId - ID de l'année (optionnel)
 */
export async function getFidelesWithHistoryByDepartement(
  departementId: number, 
  paroisseId?: number | null,
  anneeId?: number | null
) {
  console.log('🔍 Récupération des fidèles (avec historique) pour le département:', departementId)
  
  let query = supabase
    .from('fidele_departement')
    .select(`
      *,
      fidele:fidele_id (
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img,
        sexe,
        actif
      ),
      departement:departement_id (
        id,
        nom,
        type,
        roles_config
      ),
      annee:annee_id (
        id,
        label
      )
    `)
    .eq('departement_id', departementId)
    .order('created_at', { ascending: false })

  if (paroisseId) {
    query = query.eq('paroisse_id', paroisseId)
  }

  if (anneeId) {
    query = query.eq('annee_id', anneeId)
  }

  const { data: affectations, error } = await query

  if (error) {
    console.error('❌ Erreur lors de la récupération des fidèles:', error)
    return []
  }

  console.log('📊 Fidèles trouvés:', affectations.length)
  console.log('  - Actifs:', affectations.filter(a => a.est_actif).length)
  console.log('  - Inactifs:', affectations.filter(a => !a.est_actif).length)

  // Enrichir avec les détails du rôle depuis roles_config
  const affectationsWithRoleDetails = affectations.map((affectation: any) => {
    const roleDetails = affectation.departement?.roles_config?.find(
      (r: any) => r.id === affectation.role_id
    ) || null
    
    return {
      ...affectation,
      role_details: roleDetails
    }
  })

  return affectationsWithRoleDetails
}



/**
 * Récupérer l'année en cours pour un département spécifique
 * Le district_id vient de la paroisse du fidèle connecté
 */
export async function getCurrentAnneeForDepartement(departementId: number): Promise<Annee | null> {
  try {
    console.log('🔍 Récupération de l\'année en cours pour le département:', departementId)
    
    // 1. Récupérer l'utilisateur connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.error('❌ Utilisateur non connecté')
      return null
    }

    console.log('✅ Utilisateur connecté - Fidele ID:', user.fidele_id)

    // 2. Récupérer le fidèle connecté avec sa paroisse et son district
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse_id,
        paroisse:paroisse_id (
          id,
          nom,
          district_id,
          district:district_id (
            id,
            nom
          )
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (fideleError || !fidele) {
      console.error('❌ Fidèle non trouvé:', fideleError)
      return null
    }

    console.log('✅ Fidèle trouvé:', fidele.id)
    console.log('📦 Données du fidèle:', fidele)

    // IMPORTANT: Supabase retourne parfois les relations comme des tableaux
    // Il faut prendre le premier élément
    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    
    if (!paroisse) {
      console.error('❌ Paroisse non trouvée pour ce fidèle')
      return null
    }

    console.log('✅ Paroisse trouvée:', paroisse.id, paroisse.nom)
    console.log('📦 Données de la paroisse:', paroisse)

    // Récupérer le district_id depuis la paroisse
    const districtId = paroisse.district_id
    
    if (!districtId) {
      console.error('❌ District non trouvé pour cette paroisse')
      return null
    }

    console.log('✅ District ID trouvé:', districtId)

    // 3. Chercher dans annee_district l'année avec is_current = true
    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        annee_id,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .eq('is_current', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur lors de la récupération de l\'année en cours:', error)
      return null
    }

    if (data) {
      // Gérer le cas où annee est un tableau
      const annee = Array.isArray(data.annee) ? data.annee[0] : data.annee
      
      if (annee) {
        console.log('✅ Année en cours trouvée:', annee.label)
        return {
          id: annee.id,
          label: annee.label
        }
      }
    }

    // 4. Si aucune année en cours n'est définie
    console.error('❌ Aucune année en cours définie pour ce district/département')
    return null

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return null
  }
}
// ============================================
// FONCTIONS POUR LA GESTION DES ANNÉES
// ============================================

/**
 * Récupérer toutes les années disponibles pour un département (avec leurs détails)
 * @param departementId - ID du département
 */
export async function getAnneesDisponiblesForDepartement(departementId: number) {
  try {
    console.log('🔍 Récupération des années disponibles pour le département:', departementId)
    
    // Récupérer l'utilisateur connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.error('❌ Utilisateur non connecté')
      return []
    }

    // Récupérer le fidèle connecté avec sa paroisse et son district
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse_id,
        paroisse:paroisse_id (
          id,
          nom,
          district_id
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (fideleError || !fidele) {
      console.error('❌ Fidèle non trouvé:', fideleError)
      return []
    }

    // Récupérer la paroisse et le district
    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    
    if (!paroisse || !paroisse.district_id) {
      console.error('❌ District non trouvé pour cette paroisse')
      return []
    }

    const districtId = paroisse.district_id

    // Récupérer toutes les années configurées pour ce district et ce département
    const { data: anneesDistrict, error: anneesError } = await supabase
      .from('annee_district')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .order('annee_id', { ascending: false })

    if (anneesError) {
      console.error('❌ Erreur lors de la récupération des années:', anneesError)
      return []
    }

    // Transformer les données pour un format plus simple
    const anneesDisponibles = (anneesDistrict || []).map((item: any) => {
      const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
      return {
        id: item.annee_id,
        label: annee?.label || '',
        annee_district_id: item.id,
        is_current: item.is_current || false
      }
    })

    console.log(`✅ ${anneesDisponibles.length} années disponibles trouvées`)
    return anneesDisponibles

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return []
  }
}

/**
 * Récupérer les fidèles d'un département pour une année spécifique
 * @param departementId - ID du département
 * @param anneeId - ID de l'année
 * @param paroisseId - ID de la paroisse (optionnel)
 */
export async function getFidelesByDepartementAndAnnee(
  departementId: number, 
  anneeId: number, 
  paroisseId?: number | null
) {
  try {
    console.log('🔍 Récupération des fidèles pour le département:', departementId, 'année:', anneeId)
    
    // Construire la requête
    let query = supabase
      .from('fidele_departement')
      .select(`
        *,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          sexe,
          actif
        ),
        departement:departement_id (
          id,
          nom,
          type,
          roles_config
        ),
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('departement_id', departementId)
      .eq('annee_id', anneeId)

    // Filtrer par paroisse si spécifié
    if (paroisseId) {
      query = query.eq('paroisse_id', paroisseId)
    }

    const { data: affectations, error } = await query
      .order('est_actif', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur lors de la récupération des fidèles:', error)
      return []
    }

    console.log(`📊 ${affectations?.length || 0} fidèles trouvés pour l'année ${anneeId}`)
    console.log('  - Actifs:', affectations?.filter(a => a.est_actif).length || 0)
    console.log('  - Inactifs:', affectations?.filter(a => !a.est_actif).length || 0)

    // Enrichir avec les détails du rôle depuis roles_config
    const affectationsWithRoleDetails = (affectations || []).map((affectation: any) => {
      const roleDetails = affectation.departement?.roles_config?.find(
        (r: any) => r.id === affectation.role_id
      ) || null
      
      return {
        ...affectation,
        role_details: roleDetails
      }
    })

    return affectationsWithRoleDetails

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return []
  }
}

/**
 * Récupérer l'année en cours pour un département (version simplifiée)
 * @param departementId - ID du département
 */
export async function getCurrentAnneeSimple(departementId: number): Promise<Annee | null> {
  try {
    console.log('🔍 Récupération de l\'année en cours pour le département:', departementId)
    
    // Récupérer l'utilisateur connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.error('❌ Utilisateur non connecté')
      return null
    }

    // Récupérer le fidèle avec sa paroisse
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse_id,
        paroisse:paroisse_id (
          district_id
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (fideleError || !fidele) {
      console.error('❌ Fidèle non trouvé:', fideleError)
      return null
    }

    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    
    if (!paroisse || !paroisse.district_id) {
      console.error('❌ District non trouvé')
      return null
    }

    // Récupérer l'année en cours
    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        annee_id,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('district_id', paroisse.district_id)
      .eq('departement_id', departementId)
      .eq('is_current', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur lors de la récupération de l\'année en cours:', error)
      return null
    }

    if (data) {
      const annee = Array.isArray(data.annee) ? data.annee[0] : data.annee
      if (annee) {
        console.log('✅ Année en cours:', annee.label)
        return {
          id: annee.id,
          label: annee.label
        }
      }
    }

    console.log('⚠️ Aucune année en cours définie')
    return null

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return null
  }
}







// CORRECTION: getAnneesConferenceForDepartement
export async function getAnneesConferenceForDepartement(departementId: number): Promise<AnneeConference[]> {
  try {
    console.log('🔍 Récupération des années de conférence pour le département:', departementId)
    
    // Récupérer l'utilisateur connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.error('❌ Utilisateur non connecté')
      return []
    }

    // Récupérer le fidèle avec sa paroisse
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse_id,
        paroisse:paroisse_id (
          id,
          district:district_id (
            id,
            conference:conference_id (
              id
            )
          )
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (fideleError || !fidele) {
      console.error('❌ Fidèle non trouvé:', fideleError)
      return []
    }

    // Extraire la conférence
    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    if (!paroisse) return []

    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    if (!district) return []

    const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
    if (!conference) return []

    console.log('✅ Conférence ID:', conference.id)

    // Récupérer directement depuis la table annee_conference
    const { data: anneesConference, error: anneesError } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('conference_id', conference.id)
      .order('annee_id', { ascending: false })

    if (anneesError) {
      console.error('❌ Erreur lors de la récupération des années de conférence:', anneesError)
      return []
    }

    console.log('📦 Années de conférence trouvées:', anneesConference?.length || 0)

    // Transformer les données
    const result: AnneeConference[] = (anneesConference || []).map((item: any) => {
      // Extraire l'année correctement
      let anneeLabel = ''
      if (item.annee) {
        const anneeData = Array.isArray(item.annee) ? item.annee[0] : item.annee
        anneeLabel = anneeData?.label || ''
      }
      
      return {
        id: item.id,
        annee_id: item.annee_id,
        label: anneeLabel,
        is_current: item.is_current || false
      }
    })

    console.log('✅ Résultat final:', result)
    return result

  } catch (error) {
    console.error('❌ Erreur inattendue dans getAnneesConferenceForDepartement:', error)
    return []
  }
}




/**
 * Récupérer tous les fidèles d'un département (avec historique) pour une année de conférence
 * @param departementId - ID du département
 * @param paroisseId - ID de la paroisse (optionnel)
 * @param anneeConferenceId - ID de l'année de conférence (optionnel)
 */
export async function getFidelesWithHistoryByDepartementAndAnneeConference(
  departementId: number, 
  paroisseId?: number | null,
  anneeConferenceId?: number | null
) {
  console.log('🔍 Récupération des fidèles (avec historique) pour le département:', departementId, 'année conférence:', anneeConferenceId)
  
  let query = supabase
    .from('fidele_departement')
    .select(`
      *,
      fidele:fidele_id (
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img,
        sexe,
        actif
      ),
      departement:departement_id (
        id,
        nom,
        type,
        roles_config
      ),
      annee:annee_id (
        id,
        label
      ),
      annee_conference:annee_conference_id (
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      )
    `)
    .eq('departement_id', departementId)
    .order('created_at', { ascending: false })

  if (paroisseId) {
    query = query.eq('paroisse_id', paroisseId)
  }

  if (anneeConferenceId) {
    query = query.eq('annee_conference_id', anneeConferenceId)
  }

  const { data: affectations, error } = await query

  if (error) {
    console.error('❌ Erreur lors de la récupération des fidèles:', error)
    return []
  }

  console.log('📊 Fidèles trouvés:', affectations.length)
  console.log('  - Actifs:', affectations.filter(a => a.est_actif).length)
  console.log('  - Inactifs:', affectations.filter(a => !a.est_actif).length)

  // Enrichir avec les détails du rôle depuis roles_config
  const affectationsWithRoleDetails = affectations.map((affectation: any) => {
    const roleDetails = affectation.departement?.roles_config?.find(
      (r: any) => r.id === affectation.role_id
    ) || null
    
    return {
      ...affectation,
      role_details: roleDetails
    }
  })

  return affectationsWithRoleDetails
}



















// ============================================
// FONCTIONS CORRIGÉES
// ============================================

/**
 * Récupérer toutes les années de conférence disponibles pour un département
 * @param departementId - ID du département
 */
export async function getAnneesConferenceDisponiblesForDepartement(departementId: number): Promise<AnneeConference[]> {
  try {
    console.log('🔍 Récupération des années de conférence disponibles pour le département:', departementId)
    
    // Récupérer l'utilisateur connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.error('❌ Utilisateur non connecté')
      return []
    }

    // Récupérer le fidèle avec sa paroisse, district et conférence
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse_id,
        paroisse:paroisse_id (
          id,
          district:district_id (
            id,
            conference:conference_id (
              id
            )
          )
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (fideleError || !fidele) {
      console.error('❌ Fidèle non trouvé:', fideleError)
      return []
    }

    // Extraire la conférence
    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    if (!paroisse) return []

    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    if (!district) return []

    const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
    if (!conference) return []

    console.log('✅ Conférence ID:', conference.id)

    // Récupérer toutes les années de conférence de cette conférence
    const { data: anneesConference, error: anneesError } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('conference_id', conference.id)
      .order('annee_id', { ascending: false })

    if (anneesError) {
      console.error('❌ Erreur lors de la récupération des années de conférence:', anneesError)
      return []
    }

    // Transformer les données
    const result: AnneeConference[] = (anneesConference || []).map((item: any) => {
      let anneeLabel = ''
      if (item.annee) {
        const anneeData = Array.isArray(item.annee) ? item.annee[0] : item.annee
        anneeLabel = anneeData?.label || ''
      }
      
      return {
        id: item.id,
        annee_id: item.annee_id,
        label: anneeLabel,
        is_current: item.is_current || false
      }
    })

    console.log('✅ Résultat:', result.length, 'années trouvées')
    return result

  } catch (error) {
    console.error('❌ Erreur inattendue dans getAnneesConferenceDisponiblesForDepartement:', error)
    return []
  }
}

/**
 * Récupérer l'année de conférence en cours pour un département
 * @param departementId - ID du département
 */
export async function getCurrentAnneeConferenceForDepartement(departementId: number): Promise<AnneeConference | null> {
  try {
    console.log('🔍 Récupération de l\'année de conférence en cours pour le département:', departementId)
    
    // Récupérer l'utilisateur connecté
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.error('❌ Utilisateur non connecté')
      return null
    }

    // Récupérer le fidèle avec sa paroisse, district et conférence
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse_id,
        paroisse:paroisse_id (
          id,
          district:district_id (
            id,
            conference:conference_id (
              id,
              nom
            )
          )
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (fideleError || !fidele) {
      console.error('❌ Fidèle non trouvé:', fideleError)
      return null
    }

    // Extraire la conférence
    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    if (!paroisse) return null

    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    if (!district) return null

    const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
    if (!conference) return null

    console.log('✅ Conférence trouvée - ID:', conference.id)

    // Récupérer l'année de conférence en cours
    const { data: anneeConference, error: anneeError } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('conference_id', conference.id)
      .eq('is_current', true)
      .maybeSingle()

    if (anneeError) {
      console.error('❌ Erreur lors de la récupération de l\'année de conférence:', anneeError)
      return null
    }

    if (!anneeConference) {
      console.log('⚠️ Aucune année de conférence en cours pour la conférence:', conference.id)
      return null
    }

    // Extraire le label de l'année
    let anneeLabel = ''
    if (anneeConference.annee) {
      const anneeData = Array.isArray(anneeConference.annee) ? anneeConference.annee[0] : anneeConference.annee
      anneeLabel = anneeData?.label || ''
    }

    return {
      id: anneeConference.id,
      annee_id: anneeConference.annee_id,
      label: anneeLabel,
      is_current: anneeConference.is_current || false
    }

  } catch (error) {
    console.error('❌ Erreur inattendue dans getCurrentAnneeConferenceForDepartement:', error)
    return null
  }
}





/**
 * Ajouter un fidèle à un département (VERSION CORRIGÉE)
 */
export async function addFideleToDepartement(formData: FormData) {
  console.log('='.repeat(50))
  console.log('🔵 addFideleToDepartement - DÉBUT')
  console.log('='.repeat(50))
  
  try {
    // Extraire les valeurs
    const fidele_id = parseInt(formData.get('fidele_id')?.toString() || '0')
    const departement_id = parseInt(formData.get('departement_id')?.toString() || '0')
    const role_id = parseInt(formData.get('role_id')?.toString() || '0')
    const annee_conference_id = parseInt(formData.get('annee_conference_id')?.toString() || '0')
    const paroisse_id = formData.get('paroisse_id') ? parseInt(formData.get('paroisse_id')?.toString() || '0') : null

    console.log('📥 Données reçues:', {
      fidele_id,
      departement_id,
      role_id,
      annee_conference_id,
      paroisse_id
    })

    // Validations
    if (!fidele_id || isNaN(fidele_id)) {
      return { error: 'ID du fidèle invalide' }
    }
    if (!departement_id || isNaN(departement_id)) {
      return { error: 'ID du département invalide' }
    }
    if (!role_id || isNaN(role_id)) {
      return { error: 'ID du rôle invalide' }
    }
    if (!annee_conference_id || isNaN(annee_conference_id)) {
      return { error: 'ID de l\'année de conférence invalide' }
    }

    // Vérifier le fidèle
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select('id, nom, prenom, paroisse_id')
      .eq('id', fidele_id)
      .single()

    if (fideleError || !fidele) {
      return { error: 'Fidèle non trouvé' }
    }

    const finalParoisseId = paroisse_id || fidele.paroisse_id

    // Vérifier le département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('id, nom, roles_config')
      .eq('id', departement_id)
      .single()

    if (deptError || !departement) {
      return { error: 'Département non trouvé' }
    }

    // Vérifier le rôle
    const roleExists = departement.roles_config?.some((role: any) => role.id === role_id)
    if (!roleExists) {
      return { error: 'Rôle invalide pour ce département' }
    }

    // Vérifier l'année de conférence et récupérer annee_id
    const { data: anneeConference, error: acError } = await supabase
      .from('annee_conference')
      .select('id, is_current, annee_id')
      .eq('id', annee_conference_id)
      .maybeSingle()

    if (acError || !anneeConference) {
      return { error: 'Année de conférence invalide' }
    }

    // Vérifier les doublons
    const { data: existing } = await supabase
      .from('fidele_departement')
      .select('id')
      .eq('fidele_id', fidele_id)
      .eq('departement_id', departement_id)
      .eq('role_id', role_id)
      .eq('annee_conference_id', annee_conference_id)
      .eq('est_actif', true)
      .maybeSingle()

    if (existing) {
      return { error: 'Ce fidèle a déjà ce rôle pour cette année' }
    }

    // Insérer l'affectation
    const insertData = {
      fidele_id,
      departement_id,
      role_id,
      annee_conference_id,
      annee_id: anneeConference.annee_id, // ← Rempli automatiquement depuis annee_conference
      est_actif: true,
      paroisse_id: finalParoisseId
    }

    console.log('📝 Insertion:', insertData)

    const { error: insertError } = await supabase
      .from('fidele_departement')
      .insert([insertData])

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError)
      if (insertError.code === '23505') {
        return { error: 'Cette affectation existe déjà' }
      }
      return { error: `Erreur: ${insertError.message}` }
    }

    // Revalider les chemins
    revalidatePath(`/paroisse/departements/${departement_id}/membres`)
    revalidatePath(`/admin/departements/${departement_id}`)
    revalidatePath(`/admin/fideles/${fidele_id}`)
    
    console.log('✅ Succès!')
    return { success: true }

  } catch (error) {
    console.error('❌ Exception:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}







export async function getFidelesByDepartementAndAnneeConference(
  departementId: number, 
  anneeConferenceId: number, 
  paroisseId?: number | null
) {
  try {
    console.log('🔍 Récupération des fidèles pour le département:', departementId, 'année conférence:', anneeConferenceId)
    
    // Version simplifiée sans la jointure problématique
    let query = supabase
      .from('fidele_departement')
      .select(`
        *,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          profile_img,
          sexe,
          actif
        ),
        departement:departement_id (
          id,
          nom,
          type,
          roles_config
        ),
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('departement_id', departementId)
      .eq('annee_conference_id', anneeConferenceId)

    if (paroisseId) {
      query = query.eq('paroisse_id', paroisseId)
    }

    const { data: affectations, error } = await query
      .order('est_actif', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur lors de la récupération des fidèles:', error)
      return []
    }

    // Si vous avez besoin des infos de annee_conference, faites une requête séparée
    const { data: anneeConference } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('id', anneeConferenceId)
      .single()

    // Ajouter manuellement les infos de annee_conference à chaque affectation
    const affectationsWithDetails = (affectations || []).map((affectation: any) => {
      const roleDetails = affectation.departement?.roles_config?.find(
        (r: any) => r.id === affectation.role_id
      ) || null
      
      return {
        ...affectation,
        role_details: roleDetails,
        annee_conference: anneeConference || null
      }
    })

    return affectationsWithDetails

  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
    return []
  }
}