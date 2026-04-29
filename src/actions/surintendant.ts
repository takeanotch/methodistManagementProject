

// actions/surintendant.ts

'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'
import {  getDepartementUniteForDistrict } from './unite-organisation'
import { getActivitesByUnite, getActivitesStats } from './activite'
import { getUniteBudgetSummary } from './budget'
import { getPlansActionByUnite } from './plan-action'
import { getProjetsByUnite, getProjetsStats } from './projet'
import { revalidatePath } from 'next/cache'

// ============================================================
// TYPES
// ============================================================

export interface SurintendantInfo {
  id: number
  fidele_id: number
  district_id: number
  district_nom: string
  conference_id: number | null
  conference_nom: string | null
  region_id: number | null
  region_nom: string | null
  fidele_nom: string
  fidele_post_nom?: string | null  // Ajouté
  fidele_prenom: string
  fidele_email: string | null
  fidele_contact: string | null
}
export interface DepartementInfo {
  id: number
  nom: string
  type: string
  description: string | null
  roles_config: any[]
  created_at: string
}

export interface ParoisseInfo {
  id: number
  nom: string
  district_id: number
}

export interface DepartementDataForParoisse {
  paroisse_id: number
  paroisse_nom: string
  unite_id: number | null
  unite_nom: string | null
  data: {
    fideles: any[]
    totalFideles: number
    actifs: number
    inactifs: number
    activites: any[]
    budgetSummary: any | null
    plansAction: any[]
    activitesStats: any | null
    activitesRecentes: any[]
    activitesProchaines: any[]
    projets: any[]
    projetsStats: {
      total: number
      enCours: number
      termines: number
      parType: Record<string, number>
    }
  }
}

export interface DepartementSummary {
  departement: DepartementInfo
  paroissesData: DepartementDataForParoisse[]
  stats: {
    totalFideles: number
    totalActifs: number
    totalInactifs: number
    totalActivites: number
    totalPlans: number
    totalProjets: number
    budgetTotal: {
      recettes: number
      depenses: number
      solde: number
    }
  }
}

export interface DistrictStats {
  district_id: number
  district_nom: string
  totalParoisses: number
  totalDepartements: number
  totalFideles: number
  totalActifs: number
  totalInactifs: number
  totalActivites: number
  totalPlansAction: number
  totalProjets: number
  totalBudget: {
    recettes: number
    depenses: number
    solde: number
  }
  parDepartement: {
    departementId: number
    departementNom: string
    totalFideles: number
    totalActivites: number
    totalPlansAction: number
    totalProjets: number
    budgetRecettes: number
    budgetDepenses: number
    budgetSolde: number
  }[]
  activitesParStatut: Record<string, number>
  projetsParStatut: Record<string, number>
  activitesParMois: { mois: string; count: number }[]
}


// actions/surintendant.ts - Correction de getSurintendantInfo()

export async function getSurintendantInfo(): Promise<SurintendantInfo | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.log('❌ Aucun utilisateur connecté ou pas de fidele_id')
      return null
    }

    const { data: surintendant, error } = await supabase
      .from('surintendant')
      .select(`
        id,
        fidele_id,
        district_id,
        est_actif,
        district:district_id (
          id, 
          nom,
          conference:conference_id (
            id,
            nom,
            region:region_id (
              id,
              nom
            )
          )
        ),
        fidele:fidele_id (
          id, 
          nom, 
          post_nom,
          prenom, 
          contact
        )
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('est_actif', true)
      .maybeSingle()

    if (error || !surintendant) {
      console.log('❌ Surintendant non trouvé:', error?.message)
      return null
    }

    // Gérer les relations qui peuvent être des tableaux
    const district = Array.isArray(surintendant.district) 
      ? surintendant.district[0] 
      : surintendant.district
    
    const conference = district?.conference 
      ? (Array.isArray(district.conference) ? district.conference[0] : district.conference)
      : null
    
    const region = conference?.region
      ? (Array.isArray(conference.region) ? conference.region[0] : conference.region)
      : null
    
    const fidele = Array.isArray(surintendant.fidele) 
      ? surintendant.fidele[0] 
      : surintendant.fidele

    return {
      id: surintendant.id,
      fidele_id: surintendant.fidele_id,
      district_id: surintendant.district_id,
      district_nom: district?.nom || '',
      conference_id: conference?.id || null,
      conference_nom: conference?.nom || null,
      region_id: region?.id || null,
      region_nom: region?.nom || null,
      fidele_nom: fidele?.nom || '',
      fidele_prenom: fidele?.prenom || '',
      fidele_email: null, // La table fidele n'a pas de colonne email
      fidele_contact: fidele?.contact || null
    }
  } catch (error) {
    console.error('❌ Erreur getSurintendantInfo:', error)
    return null
  }
}


/**
 * Vérifier si un utilisateur est surintendant d'un district spécifique
 */
export async function isSurintendantOfDistrict(districtId: number): Promise<boolean> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return false

    const { data, error } = await supabase
      .from('surintendant')
      .select('id')
      .eq('fidele_id', user.fidele_id)
      .eq('district_id', districtId)
      .eq('est_actif', true)
      .maybeSingle()

    return !error && !!data
  } catch (error) {
    console.error('❌ Erreur isSurintendantOfDistrict:', error)
    return false
  }
}

// ============================================================
// FONCTIONS DE GESTION DES SURINTENDANTS (ADMIN)
// ============================================================

/**
 * Récupérer tous les surintendants
 */


/**
 * Récupérer les surintendants d'un district
 */
export async function getSurintendantsByDistrict(districtId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('surintendant')
      .select(`
        id,
        fidele_id,
        est_actif,
        created_at,
        fidele:fidele_id (id, nom, prenom, email, contact, profile_img)
      `)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map(item => {
      const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
      return {
        ...item,
        fidele
      }
    })
  } catch (error) {
    console.error('❌ Erreur getSurintendantsByDistrict:', error)
    return []
  }
}

/**
 * Créer un nouveau surintendant
 */
// export async function createSurintendant(data: {
//   fidele_id: number
//   district_id: number
// }): Promise<{ success: boolean; error?: string; data?: any }> {
//   try {
//     // Vérifier si le fidèle existe
//     const { data: fidele, error: fideleError } = await supabase
//       .from('fidele')
//       .select('id')
//       .eq('id', data.fidele_id)
//       .single()

//     if (fideleError || !fidele) {
//       return { success: false, error: 'Fidèle introuvable' }
//     }

//     // Vérifier si le district existe
//     const { data: district, error: districtError } = await supabase
//       .from('district')
//       .select('id')
//       .eq('id', data.district_id)
//       .single()

//     if (districtError || !district) {
//       return { success: false, error: 'District introuvable' }
//     }

//     // Vérifier si le surintendant existe déjà
//     const { data: existing, error: existingError } = await supabase
//       .from('surintendant')
//       .select('id, est_actif')
//       .eq('fidele_id', data.fidele_id)
//       .eq('district_id', data.district_id)
//       .eq('niveau', 'district')
//       .maybeSingle()

//     if (existing) {
//       if (existing.est_actif) {
//         return { success: false, error: 'Ce fidèle est déjà surintendant de ce district' }
//       } else {
//         // Réactiver le surintendant
//         const { data: updated, error: updateError } = await supabase
//           .from('surintendant')
//           .update({ est_actif: true, updated_at: new Date().toISOString() })
//           .eq('id', existing.id)
//           .select()
//           .single()

//         if (updateError) {
//           return { success: false, error: 'Erreur lors de la réactivation' }
//         }

//         revalidatePath('/admin/surintendants')
//         revalidatePath('/surintendant')
//         return { success: true, data: updated }
//       }
//     }

//     // Créer le surintendant
//     const { data: newSurintendant, error: createError } = await supabase
//       .from('surintendant')
//       .insert([{
//         fidele_id: data.fidele_id,
//         district_id: data.district_id,
//         niveau: 'district',
//         est_actif: true
//       }])
//       .select()
//       .single()

//     if (createError) {
//       return { success: false, error: 'Erreur lors de la création' }
//     }

//     revalidatePath('/admin/surintendants')
//     revalidatePath('/surintendant')
//     return { success: true, data: newSurintendant }
//   } catch (error) {
//     console.error('❌ Erreur createSurintendant:', error)
//     return { success: false, error: 'Une erreur est survenue' }
//   }
// }

/**
 * Mettre à jour un surintendant
 */
export async function updateSurintendant(
  id: number,
  data: {
    district_id?: number
    est_actif?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (data.district_id !== undefined) {
      updateData.district_id = data.district_id
    }
    if (data.est_actif !== undefined) {
      updateData.est_actif = data.est_actif
    }

    const { error } = await supabase
      .from('surintendant')
      .update(updateData)
      .eq('id', id)

    if (error) {
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath('/admin/surintendants')
    revalidatePath('/surintendant')
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur updateSurintendant:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Supprimer (désactiver) un surintendant
 */
export async function deleteSurintendant(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('surintendant')
      .update({ est_actif: false, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return { success: false, error: 'Erreur lors de la suppression' }
    }

    revalidatePath('/admin/surintendants')
    revalidatePath('/surintendant')
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur deleteSurintendant:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

// ============================================================
// FONCTIONS DE DONNÉES POUR LE SURINTENDANT
// ============================================================

/**
 * Récupérer tous les départements
 */
export async function getAllDepartements(): Promise<DepartementInfo[]> {
  try {
    const { data, error } = await supabase
      .from('departement')
      .select('id, nom, type, description, roles_config, created_at')
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Erreur getAllDepartements:', error)
    return []
  }
}

/**
 * Récupérer toutes les paroisses d'un district
 */
export async function getParoissesByDistrict(districtId: number): Promise<ParoisseInfo[]> {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom, district_id')
      .eq('district_id', districtId)
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('❌ Erreur getParoissesByDistrict:', error)
    return []
  }
}

/**
 * Récupérer les années disponibles pour un département dans un district
 */
export async function getAnneesDisponiblesForDepartementInDistrict(
  departementId: number,
  districtId: number
): Promise<any[]> {
  try {
    // Récupérer la conférence via le district
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()

    if (districtError || !district) {
      console.error('❌ District non trouvé:', districtError)
      return []
    }

    // Récupérer les années de conférence
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', district.conference_id)
      .order('annee_id', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => {
      const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
      return {
        id: item.id,
        annee_id: item.annee_id,
        label: annee?.label || `Année ${item.annee_id}`,
        is_current: item.is_current
      }
    })
  } catch (error) {
    console.error('❌ Erreur getAnneesDisponiblesForDepartementInDistrict:', error)
    return []
  }
}

/**
 * Récupérer l'année en cours pour un département dans un district
 */
export async function getCurrentAnneeForDepartementInDistrict(
  departementId: number,
  districtId: number
): Promise<any | null> {
  try {
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()

    if (districtError || !district) return null

    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', district.conference_id)
      .eq('is_current', true)
      .maybeSingle()

    if (error || !data) return null

    const annee = Array.isArray(data.annee) ? data.annee[0] : data.annee
    return {
      id: data.id,
      annee_id: data.annee_id,
      label: annee?.label || `Année ${data.annee_id}`,
      is_current: data.is_current
    }
  } catch (error) {
    console.error('❌ Erreur getCurrentAnneeForDepartementInDistrict:', error)
    return null
  }
}

/**
 * Récupérer les fidèles d'une paroisse pour un département
 */
async function getFidelesByParoisseAndDepartement(
  paroisseId: number,
  departementId: number,
  anneeConferenceId?: number | null
): Promise<any[]> {
  if (!paroisseId || !departementId) return []

  try {
    let query = supabase
      .from('fidele_departement')
      .select(`
        id,
        fidele_id,
        role_id,
        est_actif,
        paroisse_id,
        annee_conference_id,
        fidele:fidele_id (
          id, nom, post_nom, prenom, contact, profile_img, sexe, actif
        )
      `)
      .eq('paroisse_id', paroisseId)
      .eq('departement_id', departementId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur getFidelesByParoisseAndDepartement:', error)
      return []
    }

    return (data || []).map((affectation: any) => {
      const fidele = Array.isArray(affectation.fidele) 
        ? affectation.fidele[0] 
        : affectation.fidele
      return { ...affectation, fidele }
    })
  } catch (error) {
    console.error('❌ Erreur getFidelesByParoisseAndDepartement:', error)
    return []
  }
}

/**
 * Trouver le bon annee_conference_id
 */
async function findCorrectAnneeConferenceId(
  paroisseId: number,
  anneeConferenceId?: number | null
): Promise<number | undefined> {
  try {
    if (anneeConferenceId) {
      const { data: exists } = await supabase
        .from('annee_conference')
        .select('id')
        .eq('id', anneeConferenceId)
        .maybeSingle()
      
      if (exists) return anneeConferenceId
    }
    
    // Récupérer la conférence via la paroisse
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
      .eq('id', paroisseId)
      .single()

    const district = paroisse?.district 
      ? (Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district)
      : null
    const conference = district?.conference
      ? (Array.isArray(district.conference) ? district.conference[0] : district.conference)
      : null
    
    if (!conference?.id) return undefined

    const { data: currentAnnee } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('conference_id', conference.id)
      .eq('is_current', true)
      .maybeSingle()

    if (currentAnnee) return currentAnnee.id

    const { data: latestAnnee } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('conference_id', conference.id)
      .order('annee_id', { ascending: false })
      .limit(1)
      .maybeSingle()

    return latestAnnee?.id
  } catch (error) {
    console.error('❌ Erreur findCorrectAnneeConferenceId:', error)
    return undefined
  }
}

/**
 * Récupérer les données d'un département pour une paroisse spécifique
 */
export async function getDepartementDataForParoisse(
  departementId: number,
  paroisseId: number,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse['data']> {
  try {
    if (!departementId || !paroisseId) {
      return emptyData()
    }

    const correctAnneeId = await findCorrectAnneeConferenceId(paroisseId, anneeConferenceId)
    
    // Récupérer l'unité du département pour cette paroisse
    const unite = await getDepartementUniteForParoisse(departementId, paroisseId)
    
    if (!unite || !unite.id) {
      // Si pas d'unité, on essaie de récupérer quand même les fidèles
      const fidelesResult = await getFidelesByParoisseAndDepartement(
        paroisseId, 
        departementId, 
        correctAnneeId
      )
      
      const totalFideles = fidelesResult.length
      const actifs = fidelesResult.filter((f: any) => f.est_actif).length
      
      return {
        ...emptyData(),
        fideles: fidelesResult,
        totalFideles,
        actifs,
        inactifs: totalFideles - actifs
      }
    }

    const [
      fidelesResult,
      activitesResult,
      plansResult,
      budgetResult,
      activitesStatsResult,
      projetsResult,
      projetsStatsResult
    ] = await Promise.all([
      getFidelesByParoisseAndDepartement(paroisseId, departementId, correctAnneeId),
      correctAnneeId ? getActivitesByUnite(unite.id, correctAnneeId) : Promise.resolve([]),
      correctAnneeId ? getPlansActionByUnite(unite.id, correctAnneeId) : Promise.resolve([]),
      correctAnneeId ? getUniteBudgetSummary(unite.id, correctAnneeId) : Promise.resolve(null),
      correctAnneeId ? getActivitesStats(undefined, unite.id, correctAnneeId) : Promise.resolve(null),
      correctAnneeId ? getProjetsByUnite(unite.id, correctAnneeId) : Promise.resolve([]),
      correctAnneeId ? getProjetsStats(unite.id, correctAnneeId) : Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })
    ])

    const maintenant = new Date()
    maintenant.setHours(0, 0, 0, 0)
    
    const activitesRecentes = (activitesResult || [])
      .filter(a => new Date(a.date) < maintenant || a.statut === 'termine')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    const activitesProchaines = (activitesResult || [])
      .filter(a => new Date(a.date) >= maintenant && a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const totalFideles = fidelesResult.length
    const actifs = fidelesResult.filter((f: any) => f.est_actif).length

    return {
      fideles: fidelesResult,
      totalFideles,
      actifs,
      inactifs: totalFideles - actifs,
      activites: activitesResult,
      budgetSummary: budgetResult,
      plansAction: plansResult,
      activitesStats: activitesStatsResult,
      activitesRecentes,
      activitesProchaines,
      projets: projetsResult,
      projetsStats: projetsStatsResult
    }
  } catch (error) {
    console.error('❌ Erreur getDepartementDataForParoisse:', error)
    return emptyData()
  }
}

function emptyData() {
  return {
    fideles: [],
    totalFideles: 0,
    actifs: 0,
    inactifs: 0,
    activites: [],
    budgetSummary: null,
    plansAction: [],
    activitesStats: null,
    activitesRecentes: [],
    activitesProchaines: [],
    projets: [],
    projetsStats: { total: 0, enCours: 0, termines: 0, parType: {} }
  }
}

/**
 * Récupérer les données détaillées d'un département pour le surintendant
 */
export async function getDepartementDetailForSurintendant(
  departementId: number,
  districtId: number,
  anneeConferenceId?: number | null
): Promise<DepartementSummary | null> {
  try {
    // Récupérer les infos du département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('id, nom, type, description, roles_config, created_at')
      .eq('id', departementId)
      .single()

    if (deptError || !departement) return null

    // Récupérer les paroisses du district
    const paroisses = await getParoissesByDistrict(districtId)

    // Récupérer les données pour chaque paroisse
    const paroissesData: DepartementDataForParoisse[] = []
    let totalFideles = 0
    let totalActifs = 0
    let totalActivites = 0
    let totalPlans = 0
    let totalProjets = 0
    let budgetRecettes = 0
    let budgetDepenses = 0

    for (const paroisse of paroisses) {
      const data = await getDepartementDataForParoisse(departementId, paroisse.id, anneeConferenceId)
      const unite = await getDepartementUniteForParoisse(departementId, paroisse.id)
      
      paroissesData.push({
        paroisse_id: paroisse.id,
        paroisse_nom: paroisse.nom,
        unite_id: unite?.id || null,
        unite_nom: unite?.nom || null,
        data
      })

      totalFideles += data.totalFideles
      totalActifs += data.actifs
      totalActivites += data.activites.length
      totalPlans += data.plansAction.length
      totalProjets += data.projets.length

      if (data.budgetSummary) {
        budgetRecettes += data.budgetSummary.recettes || 0
        budgetDepenses += data.budgetSummary.depenses || 0
      }
    }

    return {
      departement: {
        id: departement.id,
        nom: departement.nom,
        type: departement.type,
        description: departement.description,
        roles_config: departement.roles_config || [],
        created_at: departement.created_at
      },
      paroissesData,
      stats: {
        totalFideles,
        totalActifs,
        totalInactifs: totalFideles - totalActifs,
        totalActivites,
        totalPlans,
        totalProjets,
        budgetTotal: {
          recettes: budgetRecettes,
          depenses: budgetDepenses,
          solde: budgetRecettes - budgetDepenses
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur getDepartementDetailForSurintendant:', error)
    return null
  }
}

/**
 * Récupérer les données de tous les départements pour un district
 */

/**
 * Récupérer les statistiques globales du district
 */
export async function getDistrictStatsForSurintendant(
  districtId: number,
  anneeConferenceId?: number | null
): Promise<DistrictStats | null> {
  try {
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('id, nom')
      .eq('id', districtId)
      .single()

    if (districtError || !district) return null

    const departements = await getAllDepartements()
    const paroisses = await getParoissesByDistrict(districtId)
    
    let totalFideles = 0
    let totalActifs = 0
    let totalActivites = 0
    let totalPlansAction = 0
    let totalProjets = 0
    let totalRecettes = 0
    let totalDepenses = 0
    
    const activitesParStatut: Record<string, number> = {
      planifie: 0,
      en_cours: 0,
      termine: 0,
      annule: 0
    }
    
    const projetsParStatut: Record<string, number> = {
      en_cours: 0,
      termine: 0
    }
    
    const activitesParMoisMap: Record<string, number> = {}
    
    const parDepartement: DistrictStats['parDepartement'] = []
    
    for (const departement of departements) {
      let deptFideles = 0
      let deptActifs = 0
      let deptActivites = 0
      let deptPlansAction = 0
      let deptProjets = 0
      let deptRecettes = 0
      let deptDepenses = 0
      
      for (const paroisse of paroisses) {
        const data = await getDepartementDataForParoisse(
          departement.id,
          paroisse.id,
          anneeConferenceId
        )
        
        deptFideles += data.totalFideles
        deptActifs += data.actifs
        deptActivites += data.activites.length
        deptPlansAction += data.plansAction.length
        deptProjets += data.projets.length
        
        // Compter par statut
        data.activites.forEach((a: any) => {
          if (activitesParStatut[a.statut] !== undefined) {
            activitesParStatut[a.statut]++
          }
          
          // Par mois
          if (a.date) {
            const date = new Date(a.date)
            const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            activitesParMoisMap[moisKey] = (activitesParMoisMap[moisKey] || 0) + 1
          }
        })
        
        data.projets.forEach((p: any) => {
          if (projetsParStatut[p.statut] !== undefined) {
            projetsParStatut[p.statut]++
          }
        })
        
        if (data.budgetSummary) {
          deptRecettes += data.budgetSummary.recettes || 0
          deptDepenses += data.budgetSummary.depenses || 0
        }
      }
      
      totalFideles += deptFideles
      totalActifs += deptActifs
      totalActivites += deptActivites
      totalPlansAction += deptPlansAction
      totalProjets += deptProjets
      totalRecettes += deptRecettes
      totalDepenses += deptDepenses
      
      parDepartement.push({
        departementId: departement.id,
        departementNom: departement.nom,
        totalFideles: deptFideles,
        totalActivites: deptActivites,
        totalPlansAction: deptPlansAction,
        totalProjets: deptProjets,
        budgetRecettes: deptRecettes,
        budgetDepenses: deptDepenses,
        budgetSolde: deptRecettes - deptDepenses
      })
    }
    
    // Convertir activitesParMoisMap en tableau trié
    const activitesParMois = Object.entries(activitesParMoisMap)
      .map(([mois, count]) => ({ mois, count }))
      .sort((a, b) => a.mois.localeCompare(b.mois))
      .slice(-12) // 12 derniers mois
    
    return {
      district_id: district.id,
      district_nom: district.nom,
      totalParoisses: paroisses.length,
      totalDepartements: departements.length,
      totalFideles,
      totalActifs,
      totalInactifs: totalFideles - totalActifs,
      totalActivites,
      totalPlansAction,
      totalProjets,
      totalBudget: {
        recettes: totalRecettes,
        depenses: totalDepenses,
        solde: totalRecettes - totalDepenses
      },
      parDepartement,
      activitesParStatut,
      projetsParStatut,
      activitesParMois
    }
  } catch (error) {
    console.error('❌ Erreur getDistrictStatsForSurintendant:', error)
    return null
  }
}

/**
 * Récupérer toutes les activités d'un district (tous départements confondus)
 */
export async function getAllActivitesForDistrict(
  districtId: number,
  anneeConferenceId?: number | null
): Promise<any[]> {
  try {
    const departements = await getAllDepartements()
    const paroisses = await getParoissesByDistrict(districtId)
    
    const allActivites: any[] = []
    
    for (const departement of departements) {
      for (const paroisse of paroisses) {
        const data = await getDepartementDataForParoisse(
          departement.id,
          paroisse.id,
          anneeConferenceId
        )
        
        data.activites.forEach((activite: any) => {
          allActivites.push({
            ...activite,
            paroisse_id: paroisse.id,
            paroisse_nom: paroisse.nom,
            departement_id: departement.id,
            departement_nom: departement.nom
          })
        })
      }
    }
    
    return allActivites
  } catch (error) {
    console.error('❌ Erreur getAllActivitesForDistrict:', error)
    return []
  }
}





// export async function getAllSurintendants(): Promise<any[]> {
//   try {
//     const { data, error } = await supabase
//       .from('surintendant')
//       .select(`
//         id,
//         fidele_id,
//         district_id,
//         niveau,
//         est_actif,
//         created_at,
//         district:district_id (id, nom),
//         fidele:fidele_id (id, nom, prenom, contact)
//       `)
//       .order('created_at', { ascending: false })

//     if (error) throw error

//     return (data || []).map(item => {
//       const district = Array.isArray(item.district) ? item.district[0] : item.district
//       const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
//       return {
//         ...item,
//         district,
//         fidele
//       }
//     })
//   } catch (error) {
//     console.error('❌ Erreur getAllSurintendants:', error)
//     return []
//   }
// }











// actions/surintendant.ts - Version optimisée

/**
 * Récupérer les données de tous les départements pour un district (OPTIMISÉ)
 */
export async function getAllDepartementsDataForSurintendant(
  districtId: number,
  anneeConferenceId?: number | null
): Promise<DepartementSummary[]> {
  try {
    console.log('📡 getAllDepartementsDataForSurintendant - Début optimisé')
    
    // 1. Récupérer tous les départements
    const { data: departements, error: deptError } = await supabase
      .from('departement')
      .select('id, nom, type, description, roles_config, created_at')
      .order('nom')

    if (deptError) {
      console.error('❌ Erreur récupération départements:', deptError)
      return []
    }

    // 2. Récupérer toutes les paroisses du district
    const { data: paroisses, error: paroissesError } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('district_id', districtId)
      .order('nom')

    if (paroissesError || !paroisses) {
      console.error('❌ Erreur récupération paroisses:', paroissesError)
      return []
    }

    // 3. Récupérer toutes les unités d'un coup
    const paroisseIds = paroisses.map(p => p.id)
    const { data: allUnites, error: unitesError } = await supabase
      .from('unite_organisation')
      .select('id, nom, reference_id, id_niveau, niveau')
      .eq('reference_table', 'departement')
      .in('id_niveau', paroisseIds)

    if (unitesError) {
      console.error('❌ Erreur récupération unités:', unitesError)
    }

    // Organiser les unités par département et paroisse
    const unitesMap = new Map<string, { id: number; nom: string }>()
    if (allUnites) {
      allUnites.forEach(u => {
        const key = `${u.reference_id}-${u.id_niveau}`
        // Prendre l'unité de niveau 'paroisse' en priorité
        const existing = unitesMap.get(key)
        if (!existing || u.niveau === 'paroisse') {
          unitesMap.set(key, { id: u.id, nom: u.nom })
        }
      })
    }

    // 4. Trouver la bonne année
    let finalAnneeId = anneeConferenceId
    if (!finalAnneeId && paroisses.length > 0) {
      finalAnneeId = await findCorrectAnneeConferenceId(paroisses[0].id, null)
    }

    // 5. Pour chaque département, construire les données
    const results: DepartementSummary[] = []

    for (const departement of departements) {
      const paroissesData: DepartementDataForParoisse[] = []
      let totalFideles = 0
      let totalActifs = 0
      let totalActivites = 0
      let totalPlans = 0
      let totalProjets = 0
      let budgetRecettes = 0
      let budgetDepenses = 0

      for (const paroisse of paroisses) {
        const uniteKey = `${departement.id}-${paroisse.id}`
        const unite = unitesMap.get(uniteKey)
        
        // Récupérer les données pour cette paroisse (une seule requête par paroisse/département)
        const data = await getDepartementDataForParoisseOptimized(
          departement.id,
          paroisse.id,
          unite?.id || null,
          finalAnneeId
        )
        
        paroissesData.push({
          paroisse_id: paroisse.id,
          paroisse_nom: paroisse.nom,
          unite_id: unite?.id || null,
          unite_nom: unite?.nom || null,
          data
        })

        totalFideles += data.totalFideles
        totalActifs += data.actifs
        totalActivites += data.activites.length
        totalPlans += data.plansAction.length
        totalProjets += data.projets.length

        if (data.budgetSummary) {
          budgetRecettes += data.budgetSummary.recettes || 0
          budgetDepenses += data.budgetSummary.depenses || 0
        }
      }

      results.push({
        departement: {
          id: departement.id,
          nom: departement.nom,
          type: departement.type,
          description: departement.description,
          roles_config: departement.roles_config || [],
          created_at: departement.created_at
        },
        paroissesData,
        stats: {
          totalFideles,
          totalActifs,
          totalInactifs: totalFideles - totalActifs,
          totalActivites,
          totalPlans,
          totalProjets,
          budgetTotal: {
            recettes: budgetRecettes,
            depenses: budgetDepenses,
            solde: budgetRecettes - budgetDepenses
          }
        }
      })
    }

    console.log(`✅ getAllDepartementsDataForSurintendant terminé - ${results.length} départements`)
    return results
  } catch (error) {
    console.error('❌ Erreur getAllDepartementsDataForSurintendant:', error)
    return []
  }
}

/**
 * Version optimisée de getDepartementDataForParoisse
 */
async function getDepartementDataForParoisseOptimized(
  departementId: number,
  paroisseId: number,
  uniteId: number | null,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse['data']> {
  try {
    if (!departementId || !paroisseId) {
      return emptyData()
    }

    // Récupérer les fidèles
    const fidelesResult = await getFidelesByParoisseAndDepartement(
      paroisseId, 
      departementId, 
      anneeConferenceId
    )

    let activitesResult: any[] = []
    let plansResult: any[] = []
    let budgetResult: any = null
    let activitesStatsResult: any = null
    let projetsResult: any[] = []
    let projetsStatsResult = { total: 0, enCours: 0, termines: 0, parType: {} }

    if (uniteId) {
      // Exécuter les requêtes en parallèle
      [
        activitesResult,
        plansResult,
        budgetResult,
        projetsResult,
        projetsStatsResult
      ] = await Promise.all([
        anneeConferenceId ? getActivitesByUnite(uniteId, anneeConferenceId) : Promise.resolve([]),
        anneeConferenceId ? getPlansActionByUnite(uniteId, anneeConferenceId) : Promise.resolve([]),
        anneeConferenceId ? getUniteBudgetSummary(uniteId, anneeConferenceId) : Promise.resolve(null),
        anneeConferenceId ? getProjetsByUnite(uniteId, anneeConferenceId) : Promise.resolve([]),
        anneeConferenceId ? getProjetsStats(uniteId, anneeConferenceId) : Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })
      ])
    }

    const maintenant = new Date()
    maintenant.setHours(0, 0, 0, 0)
    
    const activitesRecentes = (activitesResult || [])
      .filter(a => new Date(a.date) < maintenant || a.statut === 'termine')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    const activitesProchaines = (activitesResult || [])
      .filter(a => new Date(a.date) >= maintenant && a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const totalFideles = fidelesResult.length
    const actifs = fidelesResult.filter((f: any) => f.est_actif).length

    return {
      fideles: fidelesResult,
      totalFideles,
      actifs,
      inactifs: totalFideles - actifs,
      activites: activitesResult,
      budgetSummary: budgetResult,
      plansAction: plansResult,
      activitesStats: activitesStatsResult,
      activitesRecentes,
      activitesProchaines,
      projets: projetsResult,
      projetsStats: projetsStatsResult
    }
  } catch (error) {
    console.error('❌ Erreur getDepartementDataForParoisseOptimized:', error)
    return emptyData()
  }
}


// actions/unite-organisation.ts - Correction de getDepartementUniteForParoisse

/**
 * Récupère l'unité d'un département pour une paroisse spécifique
 * Version corrigée qui gère les résultats multiples
 */
export async function getDepartementUniteForParoisse(
  departementId: number,
  paroisseId: number
): Promise<{ id: number; nom?: string } | null> {
  try {
    console.log('🔍 getDepartementUniteForParoisse:', { departementId, paroisseId })
    
    // Recherche avec tous les critères - utiliser .limit(1) au lieu de .maybeSingle()
    const { data: exactMatches, error: exactError } = await supabase
      .from('unite_organisation')
      .select('id, nom, niveau')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', paroisseId)
      .limit(2)  // Récupérer jusqu'à 2 pour voir s'il y a des doublons
    
    if (exactError) {
      console.error('❌ Erreur exactMatch:', exactError)
    }
    
    if (exactMatches && exactMatches.length > 0) {
      // Priorité à l'unité de niveau 'paroisse'
      const paroisseLevel = exactMatches.find(u => u.niveau === 'paroisse')
      if (paroisseLevel) {
        console.log('✅ Unité trouvée (exact match - niveau paroisse):', paroisseLevel)
        return { id: paroisseLevel.id, nom: paroisseLevel.nom }
      }
      
      // Sinon prendre la première
      console.log('✅ Unité trouvée (exact match):', exactMatches[0])
      return { id: exactMatches[0].id, nom: exactMatches[0].nom }
    }
    
    // Si aucun résultat exact, chercher sans le filtre niveau
    const { data: withoutNiveau, error: niveauError } = await supabase
      .from('unite_organisation')
      .select('id, nom, id_niveau, niveau')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .order('niveau', { ascending: true }) // 'paroisse' sera probablement en premier ou dernier
    
    if (niveauError) {
      console.error('❌ Erreur withoutNiveau:', niveauError)
    }
    
    if (withoutNiveau && withoutNiveau.length > 0) {
      console.log('⚠️ Unités trouvées sans filtre niveau:', withoutNiveau)
      
      // Chercher d'abord une unité avec id_niveau = paroisseId
      const matchingParoisse = withoutNiveau.find(u => u.id_niveau === paroisseId)
      if (matchingParoisse) {
        console.log('📌 Utilisation de l\'unité avec id_niveau correspondant:', matchingParoisse)
        return { id: matchingParoisse.id, nom: matchingParoisse.nom }
      }
      
      // Chercher une unité de niveau 'paroisse'
      const paroisseLevel = withoutNiveau.find(u => u.niveau === 'paroisse')
      if (paroisseLevel) {
        console.log('📌 Utilisation de l\'unité de niveau paroisse:', paroisseLevel)
        return { id: paroisseLevel.id, nom: paroisseLevel.nom }
      }
      
      // Sinon prendre la première
      console.log('📌 Utilisation de la première unité trouvée:', withoutNiveau[0])
      return { id: withoutNiveau[0].id, nom: withoutNiveau[0].nom }
    }
    
    console.log('❌ Aucune unité trouvée pour département', departementId, 'paroisse', paroisseId)
    return null
    
  } catch (error) {
    console.error('❌ Exception dans getDepartementUniteForParoisse:', error)
    return null
  }
}










// actions/surintendant.ts - Version ultra optimisée

/**
 * Récupérer TOUTES les données du district en UNE SEULE PASSE
 * (départements + statistiques)
 */
export async function getAllDistrictData(
  districtId: number,
  anneeConferenceId?: number | null
): Promise<{
  departementsData: DepartementSummary[]
  districtStats: DistrictStats | null
}> {
  try {
    console.log('📡 getAllDistrictData - Début ULTRA optimisé')
    
    // 1. Récupérer tous les départements
    const { data: departements, error: deptError } = await supabase
      .from('departement')
      .select('id, nom, type, description, roles_config, created_at')
      .order('nom')

    if (deptError) {
      console.error('❌ Erreur récupération départements:', deptError)
      return { departementsData: [], districtStats: null }
    }

    // 2. Récupérer le district
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('id, nom')
      .eq('id', districtId)
      .single()

    if (districtError || !district) {
      return { departementsData: [], districtStats: null }
    }

    // 3. Récupérer toutes les paroisses du district
    const { data: paroisses, error: paroissesError } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('district_id', districtId)
      .order('nom')

    if (paroissesError || !paroisses) {
      return { departementsData: [], districtStats: null }
    }

    // 4. Récupérer toutes les unités d'un coup
    const paroisseIds = paroisses.map(p => p.id)
    const { data: allUnites } = await supabase
      .from('unite_organisation')
      .select('id, nom, reference_id, id_niveau, niveau')
      .eq('reference_table', 'departement')
      .in('id_niveau', paroisseIds)

    // Organiser les unités
    const unitesMap = new Map<string, { id: number; nom: string }>()
    if (allUnites) {
      allUnites.forEach(u => {
        const key = `${u.reference_id}-${u.id_niveau}`
        const existing = unitesMap.get(key)
        if (!existing || u.niveau === 'paroisse') {
          unitesMap.set(key, { id: u.id, nom: u.nom })
        }
      })
    }

    // 5. Trouver la bonne année
    let finalAnneeId = anneeConferenceId
    if (!finalAnneeId && paroisses.length > 0) {
      finalAnneeId = await findCorrectAnneeConferenceId(paroisses[0].id, null)
    }

    // 6. Préparer les statistiques globales
    let totalFideles = 0
    let totalActifs = 0
    let totalActivites = 0
    let totalPlansAction = 0
    let totalProjets = 0
    let totalRecettes = 0
    let totalDepenses = 0
    
    const activitesParStatut: Record<string, number> = {
      planifie: 0,
      en_cours: 0,
      termine: 0,
      annule: 0
    }
    
    const projetsParStatut: Record<string, number> = {
      en_cours: 0,
      termine: 0
    }
    
    const parDepartement: DistrictStats['parDepartement'] = []
    const departementsData: DepartementSummary[] = []

    // 7. Pour chaque département, charger TOUTES les données en parallèle
    for (const departement of departements) {
      let deptFideles = 0
      let deptActifs = 0
      let deptActivites = 0
      let deptPlans = 0
      let deptProjets = 0
      let deptRecettes = 0
      let deptDepenses = 0
      
      const paroissesData: DepartementDataForParoisse[] = []
      
      // Préparer toutes les promesses pour ce département
      const paroissePromises = paroisses.map(async (paroisse) => {
        const uniteKey = `${departement.id}-${paroisse.id}`
        const unite = unitesMap.get(uniteKey)
        
        return await getDepartementDataForParoisseUltraOptimized(
          departement.id,
          paroisse.id,
          paroisse.nom,
          unite?.id || null,
          unite?.nom || null,
          finalAnneeId
        )
      })
      
      // Exécuter toutes les promesses en parallèle
      const paroisseResults = await Promise.all(paroissePromises)
      
      // Agréger les résultats
      for (const result of paroisseResults) {
        paroissesData.push({
          paroisse_id: result.paroisseId,
          paroisse_nom: result.paroisseNom,
          unite_id: result.uniteId,
          unite_nom: result.uniteNom,
          data: result.data
        })
        
        deptFideles += result.data.totalFideles
        deptActifs += result.data.actifs
        deptActivites += result.data.activites.length
        deptPlans += result.data.plansAction.length
        deptProjets += result.data.projets.length
        
        // Stats par statut
        result.data.activites.forEach((a: any) => {
          if (activitesParStatut[a.statut] !== undefined) {
            activitesParStatut[a.statut]++
          }
        })
        
        result.data.projets.forEach((p: any) => {
          if (projetsParStatut[p.statut] !== undefined) {
            projetsParStatut[p.statut]++
          }
        })
        
        if (result.data.budgetSummary) {
          deptRecettes += result.data.budgetSummary.recettes || 0
          deptDepenses += result.data.budgetSummary.depenses || 0
        }
      }
      
      // Ajouter aux totaux globaux
      totalFideles += deptFideles
      totalActifs += deptActifs
      totalActivites += deptActivites
      totalPlansAction += deptPlans
      totalProjets += deptProjets
      totalRecettes += deptRecettes
      totalDepenses += deptDepenses
      
      parDepartement.push({
        departementId: departement.id,
        departementNom: departement.nom,
        totalFideles: deptFideles,
        totalActivites: deptActivites,
        totalPlansAction: deptPlans,
        totalProjets: deptProjets,
        budgetRecettes: deptRecettes,
        budgetDepenses: deptDepenses,
        budgetSolde: deptRecettes - deptDepenses
      })
      
      departementsData.push({
        departement: {
          id: departement.id,
          nom: departement.nom,
          type: departement.type,
          description: departement.description,
          roles_config: departement.roles_config || [],
          created_at: departement.created_at
        },
        paroissesData,
        stats: {
          totalFideles: deptFideles,
          totalActifs: deptActifs,
          totalInactifs: deptFideles - deptActifs,
          totalActivites: deptActivites,
          totalPlans: deptPlans,
          totalProjets: deptProjets,
          budgetTotal: {
            recettes: deptRecettes,
            depenses: deptDepenses,
            solde: deptRecettes - deptDepenses
          }
        }
      })
    }

    const districtStats: DistrictStats = {
      district_id: district.id,
      district_nom: district.nom,
      totalParoisses: paroisses.length,
      totalDepartements: departements.length,
      totalFideles,
      totalActifs,
      totalInactifs: totalFideles - totalActifs,
      totalActivites,
      totalPlansAction,
      totalProjets,
      totalBudget: {
        recettes: totalRecettes,
        depenses: totalDepenses,
        solde: totalRecettes - totalDepenses
      },
      parDepartement,
      activitesParStatut,
      projetsParStatut,
      activitesParMois: [] // Peut être calculé plus tard si nécessaire
    }

    console.log(`✅ getAllDistrictData terminé - ${departementsData.length} départements`)
    return { departementsData, districtStats }
    
  } catch (error) {
    console.error('❌ Erreur getAllDistrictData:', error)
    return { departementsData: [], districtStats: null }
  }
}

/**
 * Version ultra optimisée qui retourne tout d'un coup
 */
async function getDepartementDataForParoisseUltraOptimized(
  departementId: number,
  paroisseId: number,
  paroisseNom: string,
  uniteId: number | null,
  uniteNom: string | null,
  anneeConferenceId: number | null | undefined
): Promise<{
  paroisseId: number
  paroisseNom: string
  uniteId: number | null
  uniteNom: string | null
  data: DepartementDataForParoisse['data']
}> {
  try {
    if (!departementId || !paroisseId) {
      return {
        paroisseId,
        paroisseNom,
        uniteId,
        uniteNom,
        data: emptyData()
      }
    }

    // Récupérer les fidèles
    const fidelesPromise = getFidelesByParoisseAndDepartement(
      paroisseId, 
      departementId, 
      anneeConferenceId
    )

    let activitesPromise: Promise<any[]> = Promise.resolve([])
    let plansPromise: Promise<any[]> = Promise.resolve([])
    let budgetPromise: Promise<any> = Promise.resolve(null)
    let projetsPromise: Promise<any[]> = Promise.resolve([])
    let projetsStatsPromise: Promise<any> = Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })

    if (uniteId) {
      activitesPromise = anneeConferenceId ? getActivitesByUnite(uniteId, anneeConferenceId) : Promise.resolve([])
      plansPromise = anneeConferenceId ? getPlansActionByUnite(uniteId, anneeConferenceId) : Promise.resolve([])
      budgetPromise = anneeConferenceId ? getUniteBudgetSummary(uniteId, anneeConferenceId) : Promise.resolve(null)
      projetsPromise = anneeConferenceId ? getProjetsByUnite(uniteId, anneeConferenceId) : Promise.resolve([])
      projetsStatsPromise = anneeConferenceId ? getProjetsStats(uniteId, anneeConferenceId) : Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })
    }

    // TOUT en parallèle
    const [
      fidelesResult,
      activitesResult,
      plansResult,
      budgetResult,
      projetsResult,
      projetsStatsResult
    ] = await Promise.all([
      fidelesPromise,
      activitesPromise,
      plansPromise,
      budgetPromise,
      projetsPromise,
      projetsStatsPromise
    ])

    const maintenant = new Date()
    maintenant.setHours(0, 0, 0, 0)
    
    const activitesRecentes = (activitesResult || [])
      .filter(a => new Date(a.date) < maintenant || a.statut === 'termine')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    const activitesProchaines = (activitesResult || [])
      .filter(a => new Date(a.date) >= maintenant && a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const totalFideles = fidelesResult.length
    const actifs = fidelesResult.filter((f: any) => f.est_actif).length

    return {
      paroisseId,
      paroisseNom,
      uniteId,
      uniteNom,
      data: {
        fideles: fidelesResult,
        totalFideles,
        actifs,
        inactifs: totalFideles - actifs,
        activites: activitesResult,
        budgetSummary: budgetResult,
        plansAction: plansResult,
        activitesStats: null,
        activitesRecentes,
        activitesProchaines,
        projets: projetsResult,
        projetsStats: projetsStatsResult
      }
    }
  } catch (error) {
    console.error('❌ Erreur getDepartementDataForParoisseUltraOptimized:', error)
    return {
      paroisseId,
      paroisseNom,
      uniteId,
      uniteNom,
      data: emptyData()
    }
  }
}


// actions/surintendant.ts

// Ajouter ces fonctions à la fin du fichier existant

/**
 * Récupère toutes les paroisses d'un district
 */
export async function getDistrictParoisses(districtId: number) {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('district_id', districtId)
      .order('nom', { ascending: true })
    
    if (error) {
      console.error('Erreur getDistrictParoisses:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Erreur getDistrictParoisses:', error)
    return []
  }
}

/**
 * Récupère les années disponibles pour un district
 */
export async function getAnneesDisponiblesForDistrict(districtId: number) {
  try {
    // D'abord, trouver la conférence du district
    const { data: districtData, error: districtError } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()
    
    if (districtError || !districtData?.conference_id) {
      console.error('Erreur récupération conférence du district:', districtError)
      return []
    }
    
    // Récupérer les années de cette conférence
    const { data: annees, error: anneesError } = await supabase
      .from('annee_conference')
      .select(`
        id,
        is_current,
        annee:annee_id (
          id,
          label
        )
      `)
      .eq('conference_id', districtData.conference_id)
      .order('created_at', { ascending: false })
    
    if (anneesError) {
      console.error('Erreur getAnneesDisponiblesForDistrict:', anneesError)
      return []
    }
    
    // Transformer les données pour avoir le format attendu
    return (annees || []).map((ac: any) => ({
      id: ac.id,
      label: ac.annee?.label || `Année ${ac.annee_id}`,
      is_current: ac.is_current,
      annee_id: ac.annee_id
    }))
  } catch (error) {
    console.error('Erreur getAnneesDisponiblesForDistrict:', error)
    return []
  }
}

/**
 * Récupère toutes les activités d'une paroisse pour une année donnée
 * (pour le dashboard du surintendant)
 */
export async function getActivitesForDistrict(paroisseId: number, anneeConferenceId: number) {
  try {
    // Récupérer tous les départements de la paroisse
    const { data: unites, error: unitesError } = await supabase
      .from('unite_organisation')
      .select(`
        id,
        nom,
        reference_id
      `)
      .eq('reference_table', 'departement')
      .eq('id_niveau', paroisseId)
      .eq('niveau', 'paroisse')
    
    if (unitesError) {
      console.error('Erreur récupération unités:', unitesError)
      return []
    }
    
    if (!unites || unites.length === 0) {
      return []
    }
    
    const uniteIds = unites.map(u => u.id)
    
    // Récupérer les activités pour toutes ces unités
    const { data: activites, error: activitesError } = await supabase
      .from('activite')
      .select(`
        id,
        titre,
        description,
        date,
        heure,
        statut,
        plan_action_id,
        unite_id,
        created_at,
        updated_at,
        plan_action:plan_action_id (
          id,
          titre
        )
      `)
      .in('unite_id', uniteIds)
      .eq('annee_conference_id', anneeConferenceId)
      .order('date', { ascending: true })
    
    if (activitesError) {
      console.error('Erreur récupération activités:', activitesError)
      return []
    }
    
    // Ajouter le nom du département à chaque activité
    const activitesWithDepartement = (activites || []).map(activite => {
      const unite = unites.find(u => u.id === activite.unite_id)
      return {
        ...activite,
        departement: unite?.nom || 'Département inconnu',
        departement_id: unite?.reference_id || null
      }
    })
    
    return activitesWithDepartement
  } catch (error) {
    console.error('Erreur getActivitesForDistrict:', error)
    return []
  }
}








// actions/surintendant.ts

export async function getDepartementDataForSurintendant(
  departementId: number,
  anneeId: number
) {
  try {
    // Récupérer toutes les paroisses du département
    const { data: paroisses } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('departement_id', departementId)
      .order('nom', { ascending: true })

    if (!paroisses || paroisses.length === 0) {
      return { paroissesData: [], stats: null }
    }

    const paroissesData = []
    let totalFideles = 0
    let totalActifs = 0
    let totalActivites = 0
    let totalPlansAction = 0
    let totalProjets = 0

    for (const paroisse of paroisses) {
      // Récupérer les données de la paroisse
      const { data: fideles } = await supabase
        .from('fidele')
        .select('*')
        .eq('paroisse_id', paroisse.id)

      const { data: activites } = await supabase
        .from('activite')
        .select(`
          id,
          titre,
          description,
          date,
          heure_debut,
          heure_fin,
          statut,
          commentaire
        `)
        .eq('paroisse_id', paroisse.id)
        .eq('annee_id', anneeId)

      const { data: plansAction } = await supabase
        .from('plan_action')
        .select('*')
        .eq('paroisse_id', paroisse.id)
        .eq('annee_id', anneeId)

      const { data: projets } = await supabase
        .from('projet')
        .select('*')
        .eq('paroisse_id', paroisse.id)

      const totalParoisseFideles = fideles?.length || 0
      const actifsParoisse = fideles?.filter(f => f.statut === 'actif').length || 0

      paroissesData.push({
        paroisse_id: paroisse.id,
        paroisse_nom: paroisse.nom,
        data: {
          fideles: fideles || [],
          totalFideles: totalParoisseFideles,
          actifs: actifsParoisse,
          inactifs: totalParoisseFideles - actifsParoisse,
          activites: activites || [],
          budgetSummary: null,
          plansAction: plansAction || [],
          projets: projets || []
        }
      })

      totalFideles += totalParoisseFideles
      totalActifs += actifsParoisse
      totalActivites += activites?.length || 0
      totalPlansAction += plansAction?.length || 0
      totalProjets += projets?.length || 0
    }

    const stats = {
      totalFideles,
      totalActifs,
      totalInactifs: totalFideles - totalActifs,
      totalActivites,
      totalPlansAction,
      totalProjets,
      totalParoisses: paroisses.length
    }

    return { paroissesData, stats }
  } catch (error) {
    console.error('Erreur getDepartementDataForSurintendant:', error)
    return { paroissesData: [], stats: null }
  }
}

/**
 * Récupère les données d'un département pour le surintendant - VERSION OPTIMISÉE
 * Charge tout en parallèle pour une performance maximale
 */
export async function getDepartementDataOptimized(
  departementId: number,
  districtId: number,
  anneeId: number
): Promise<{
  departement: any
  paroissesData: Array<{
    paroisse_id: number
    paroisse_nom: string
    unite_id: number | null
    data: {
      totalFideles: number
      actifs: number
      inactifs: number
      activites: any[]
      plansAction: any[]
      projets: any[]
    }
  }>
  stats: {
    totalFideles: number
    totalActifs: number
    totalInactifs: number
    totalActivites: number
    totalPlansAction: number
    totalProjets: number
    totalParoisses: number
  }
}> {
  try {
    console.log('📡 getDepartementDataOptimized - Début')
    
    // 1. Récupérer les infos du département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('id, nom, type, description')
      .eq('id', departementId)
      .single()

    if (deptError || !departement) {
      console.error('❌ Département non trouvé:', deptError)
      return {
        departement: null,
        paroissesData: [],
        stats: {
          totalFideles: 0, totalActifs: 0, totalInactifs: 0,
          totalActivites: 0, totalPlansAction: 0, totalProjets: 0, totalParoisses: 0
        }
      }
    }

    // 2. Récupérer toutes les paroisses du district en une seule requête
    const { data: paroisses, error: paroissesError } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('district_id', districtId)
      .order('nom', { ascending: true })

    if (paroissesError || !paroisses) {
      console.error('❌ Erreur récupération paroisses:', paroissesError)
      return {
        departement,
        paroissesData: [],
        stats: {
          totalFideles: 0, totalActifs: 0, totalInactifs: 0,
          totalActivites: 0, totalPlansAction: 0, totalProjets: 0, totalParoisses: 0
        }
      }
    }

    // 3. Récupérer toutes les unités pour ce département en une seule requête
    const paroisseIds = paroisses.map(p => p.id)
    const { data: unites } = await supabase
      .from('unite_organisation')
      .select('id, nom, id_niveau')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .in('id_niveau', paroisseIds)
      .eq('niveau', 'paroisse')

    // Créer un map des unités par paroisse
    const unitesMap = new Map<number, { id: number; nom: string }>()
    if (unites) {
      unites.forEach(u => {
        unitesMap.set(u.id_niveau, { id: u.id, nom: u.nom })
      })
    }

    // 4. Préparer toutes les promesses pour chaque paroisse
    const paroissePromises = paroisses.map(async (paroisse) => {
      const unite = unitesMap.get(paroisse.id)

      // Lancer toutes les requêtes en parallèle pour cette paroisse
      const [
        fidelesResult,
        activitesResult,
        plansResult,
        projetsResult
      ] = await Promise.all([
        // Fidèles
        supabase
          .from('fidele_departement')
          .select(`
            id,
            fidele_id,
            est_actif,
            fidele:fidele_id (id, nom, post_nom, prenom, statut)
          `)
          .eq('paroisse_id', paroisse.id)
          .eq('departement_id', departementId)
          .eq('annee_conference_id', anneeId),
        
        // Activités
        unite?.id 
          ? supabase
              .from('activite')
              .select('id, titre, description, date, heure_debut, heure_fin, statut, commentaire')
              .eq('unite_id', unite.id)
              .eq('annee_conference_id', anneeId)
              .order('date', { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        
        // Plans d'action
        unite?.id
          ? supabase
              .from('plan_action')
              .select('*')
              .eq('unite_id', unite.id)
              .eq('annee_conference_id', anneeId)
          : Promise.resolve({ data: [], error: null }),
        
        // Projets
        unite?.id
          ? supabase
              .from('projet')
              .select('*')
              .eq('unite_id', unite.id)
          : Promise.resolve({ data: [], error: null })
      ])

      // Calculer les stats pour cette paroisse
      const fideles = (fidelesResult.data || []) as any[]
      const totalFideles = fideles.length
      const actifs = fideles.filter((f: any) => f.est_actif).length
      const activites = (activitesResult.data || []) as any[]
      const plansAction = (plansResult.data || []) as any[]
      const projets = (projetsResult.data || []) as any[]

      return {
        paroisse_id: paroisse.id,
        paroisse_nom: paroisse.nom,
        unite_id: unite?.id || null,
        data: {
          totalFideles,
          actifs,
          inactifs: totalFideles - actifs,
          activites,
          plansAction,
          projets
        },
        // Stats pour agrégation
        _stats: {
          totalFideles,
          actifs,
          totalActivites: activites.length,
          totalPlans: plansAction.length,
          totalProjets: projets.length
        }
      }
    })

    // 5. Exécuter toutes les promesses en parallèle
    const paroissesResults = await Promise.all(paroissePromises)

    // 6. Agréger les statistiques
    let totalFideles = 0
    let totalActifs = 0
    let totalActivites = 0
    let totalPlansAction = 0
    let totalProjets = 0

    const paroissesData = paroissesResults.map(result => {
      totalFideles += result._stats.totalFideles
      totalActifs += result._stats.actifs
      totalActivites += result._stats.totalActivites
      totalPlansAction += result._stats.totalPlans
      totalProjets += result._stats.totalProjets

      const { _stats, ...rest } = result
      return rest
    })

    console.log(`✅ getDepartementDataOptimized terminé - ${paroissesData.length} paroisses`)

    return {
      departement,
      paroissesData,
      stats: {
        totalFideles,
        totalActifs,
        totalInactifs: totalFideles - totalActifs,
        totalActivites,
        totalPlansAction,
        totalProjets,
        totalParoisses: paroisses.length
      }
    }
  } catch (error) {
    console.error('❌ Erreur getDepartementDataOptimized:', error)
    return {
      departement: null,
      paroissesData: [],
      stats: {
        totalFideles: 0, totalActifs: 0, totalInactifs: 0,
        totalActivites: 0, totalPlansAction: 0, totalProjets: 0, totalParoisses: 0
      }
    }
  }
}

// actions/surintendant.ts

// Helper pour récupérer l'année en cours d'un district
async function getCurrentAnneeConferenceIdForDistrict(districtId: number): Promise<number | null> {
  try {
    const { data: district } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', districtId)
      .single()

    if (!district?.conference_id) return null

    const { data } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('conference_id', district.conference_id)
      .eq('is_current', true)
      .maybeSingle()

    return data?.id || null
  } catch (error) {
    console.error('Erreur getCurrentAnneeConferenceIdForDistrict:', error)
    return null
  }
}



// actions/surintendant.ts - remplacer createSurintendant par cette version

export async function createSurintendant(data: {
  fidele_id: number
  district_id: number
}): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Récupérer l'année en cours pour ce district
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(data.district_id)
    console.log('📅 annee_conference_id pour surintendant:', anneeConferenceId)

    // Vérifier si le fidèle existe
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select('id')
      .eq('id', data.fidele_id)
      .single()

    if (fideleError || !fidele) {
      return { success: false, error: 'Fidèle introuvable' }
    }

    // Vérifier si le district existe
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('id')
      .eq('id', data.district_id)
      .single()

    if (districtError || !district) {
      return { success: false, error: 'District introuvable' }
    }

    // Vérifier si le surintendant existe déjà pour cette année
    let query = supabase
      .from('surintendant')
      .select('id, est_actif')
      .eq('fidele_id', data.fidele_id)
      .eq('district_id', data.district_id)
      .eq('niveau', 'district')
    
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: existing, error: existingError } = await query.maybeSingle()

    if (existing) {
      if (existing.est_actif) {
        return { success: false, error: 'Ce fidèle est déjà surintendant de ce district' }
      } else {
        // Réactiver le surintendant
        const { data: updated, error: updateError } = await supabase
          .from('surintendant')
          .update({ est_actif: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          return { success: false, error: 'Erreur lors de la réactivation' }
        }

        revalidatePath('/admin/surintendants')
        revalidatePath('/surintendant')
        return { success: true, data: updated }
      }
    }

    // Créer le surintendant avec annee_conference_id
    const insertData: any = {
      fidele_id: data.fidele_id,
      district_id: data.district_id,
      niveau: 'district',
      est_actif: true
    }

    if (anneeConferenceId) {
      insertData.annee_conference_id = anneeConferenceId
    }

    const { data: newSurintendant, error: createError } = await supabase
      .from('surintendant')
      .insert([insertData])
      .select()
      .single()

    if (createError) {
      return { success: false, error: 'Erreur lors de la création' }
    }

    revalidatePath('/admin/surintendants')
    revalidatePath('/surintendant')
    return { success: true, data: newSurintendant }
  } catch (error) {
    console.error('❌ Erreur createSurintendant:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


// actions/surintendant.ts

/**
 * Récupérer tous les surintendants
 * @param anneeConferenceId - Optionnel : ID de l'année de conférence pour filtrer
 */
export async function getAllSurintendants(anneeConferenceId?: number | null): Promise<any[]> {
  try {
    let query = supabase
      .from('surintendant')
      .select(`
        id,
        fidele_id,
        district_id,
        niveau,
        est_actif,
        annee_conference_id,
        created_at,
        district:district_id (
          id, 
          nom,
          conference:conference_id (
            id,
            nom,
            region:region_id (
              id,
              nom
            )
          )
        ),
        fidele:fidele_id (
          id, 
          nom, 
          post_nom,
          prenom, 
          contact,
          profile_img
        )
      `)
      .order('created_at', { ascending: false })

    // Ajouter le filtre par année si spécifié
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) throw error

    return (data || []).map(item => {
      const district = Array.isArray(item.district) ? item.district[0] : item.district
      const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
      
      // Gérer les relations imbriquées
      let conference = null
      let region = null
      
      if (district) {
        if (district.conference) {
          conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
          if (conference?.region) {
            region = Array.isArray(conference.region) ? conference.region[0] : conference.region
          }
        }
      }
      
      return {
        ...item,
        district: {
          ...district,
          conference: conference ? { ...conference, region } : null
        },
        fidele
      }
    })
  } catch (error) {
    console.error('❌ Erreur getAllSurintendants:', error)
    return []
  }
}