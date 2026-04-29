// app/actions/conference.ts
'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'
import { getDepartementUniteForDistrict } from './unite-organisation'

export interface ConferenceInfo {
  id: number
  fidele_id: number
  departement_id: number
  conference_id: number
  departement_nom: string
  departement_type: string
  conference_nom: string
  fidele_nom: string
  fidele_prenom: string
  roles_config?: any[]
}

export interface District {
  id: number
  nom: string
  conference_id: number
  description?: string
}

export interface Paroisse {
  id: number
  nom: string
  district_id: number
  description?: string
}

export interface MembreDepartement {
  id: number
  fidele_id: number
  fidele_nom: string
  fidele_prenom: string
  fidele_post_nom: string
  role_id: number
  role_nom: string
  role_label: string
  est_actif: boolean
  profile_img?: string
  role_details?: {
    id: number
    nom: string
    label: string
    couleur: string
    niveau: number
  }
  annee_id?: number
  annee?: {
    id: number
    label: string
  }
}

export interface AnneeDisponible {
  id: number
  label: string
  is_current: boolean
  annee_conference_id: number
}

/**
 * Récupérer les infos du responsable de département au niveau conférence
 */
export async function getConferenceInfo(): Promise<ConferenceInfo | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    const { data: chef, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        conference_id,
        departement:departement_id (nom, type, roles_config),
        conference:conference_id (nom),
        fidele:fidele_id (nom, prenom)
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()

    if (error || !chef) return null

    const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
    const conference = Array.isArray(chef.conference) ? chef.conference[0] : chef.conference
    const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele

    return {
      id: chef.id,
      fidele_id: chef.fidele_id,
      departement_id: chef.departement_id,
      conference_id: chef.conference_id,
      departement_nom: departement?.nom || '',
      departement_type: departement?.type || 'normal',
      conference_nom: conference?.nom || '',
      fidele_nom: fidele?.nom || '',
      fidele_prenom: fidele?.prenom || '',
      roles_config: departement?.roles_config || []
    }
  } catch (error) {
    console.error('Erreur getConferenceInfo:', error)
    return null
  }
}

/**
 * Récupérer tous les districts de la conférence
 */
export async function getDistrictsByConference(conferenceId: number): Promise<District[]> {
  try {
    const { data, error } = await supabase
      .from('district')
      .select('id, nom, conference_id, description')
      .eq('conference_id', conferenceId)
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getDistrictsByConference:', error)
    return []
  }
}

/**
 * Récupérer un district par son ID
 */
export async function getDistrictById(districtId: number): Promise<District | null> {
  try {
    const { data, error } = await supabase
      .from('district')
      .select('id, nom, conference_id, description')
      .eq('id', districtId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur getDistrictById:', error)
    return null
  }
}

/**
 * Récupérer toutes les paroisses d'un district
 */
export async function getParoissesByDistrict(districtId: number): Promise<Paroisse[]> {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom, district_id, description')
      .eq('district_id', districtId)
      .order('nom', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erreur getParoissesByDistrict:', error)
    return []
  }
}

/**
 * Récupérer une paroisse par son ID
 */
export async function getParoisseById(paroisseId: number): Promise<Paroisse | null> {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom, district_id, description')
      .eq('id', paroisseId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erreur getParoisseById:', error)
    return null
  }
}

/**
 * Récupérer les membres d'un département pour une paroisse
 */
export async function getMembresByParoisseAndDepartement(
  paroisseId: number,
  departementId: number
): Promise<MembreDepartement[]> {
  try {
    const { data, error } = await supabase
      .from('fidele_departement')
      .select(`
        id,
        fidele_id,
        role_id,
        est_actif,
        annee_id,
        annee:annee_id (id, label),
        fidele:fidele_id (id, nom, post_nom, prenom, profile_img),
        departement:departement_id (roles_config)
      `)
      .eq('paroisse_id', paroisseId)
      .eq('departement_id', departementId)

    if (error) throw error

    const membres = (data || []).map(item => {
      const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
      
      let rolesConfig: any[] = []
      if (item.departement) {
        const departement = Array.isArray(item.departement) ? item.departement[0] : item.departement
        rolesConfig = departement?.roles_config || []
      }
      
      const role = rolesConfig.find((r: any) => r.id === item.role_id)
      
      return {
        id: item.id,
        fidele_id: item.fidele_id,
        fidele_nom: fidele?.nom || '',
        fidele_prenom: fidele?.prenom || '',
        fidele_post_nom: fidele?.post_nom || '',
        role_id: item.role_id,
        role_nom: role?.nom || '',
        role_label: role?.label || '',
        est_actif: item.est_actif,
        profile_img: fidele?.profile_img,
        annee_id: item.annee_id,
        annee: item.annee ? (Array.isArray(item.annee) ? item.annee[0] : item.annee) : undefined,
        role_details: role ? {
          id: role.id,
          nom: role.nom,
          label: role.label,
          couleur: role.couleur || '#6b7280',
          niveau: role.niveau || 0
        } : undefined
      }
    })

    return membres
  } catch (error) {
    console.error('Erreur getMembresByParoisseAndDepartement:', error)
    return []
  }
}

/**
 * Récupérer les années disponibles pour une paroisse
 */
export async function getAnneesDisponiblesForParoisse(
  paroisseId: number,
  departementId: number
): Promise<AnneeDisponible[]> {
  try {
    // Récupérer le district de la paroisse
    const { data: paroisse, error: paroisseError } = await supabase
      .from('paroisse')
      .select('district_id')
      .eq('id', paroisseId)
      .single()

    if (paroisseError || !paroisse) return []

    // Récupérer la conférence du district
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('conference_id')
      .eq('id', paroisse.district_id)
      .single()

    if (districtError || !district) return []

    // Récupérer les années configurées pour cette conférence et département
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        label,
        is_current
      `)
      .eq('conference_id', district.conference_id)
      .order('id', { ascending: false })

    if (error) throw error

    return (data || []).map(item => ({
      id: item.id,
      label: item.label,
      is_current: item.is_current || false,
      annee_conference_id: item.id
    }))
  } catch (error) {
    console.error('Erreur getAnneesDisponiblesForParoisse:', error)
    return []
  }
}

/**
 * Récupérer les plans d'action d'un département pour une paroisse
 */
export async function getPlansActionByDepartementForParoisse(
  departementId: number,
  paroisseId: number
): Promise<any[]> {
  try {
    // Récupérer l'unité du département pour cette paroisse
    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', paroisseId)
      .maybeSingle()
    
    if (uniteError || !unite) {
      return []
    }
    
    // Récupérer les plans d'action
    const { data: plans, error: plansError } = await supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })
    
    if (plansError) {
      return []
    }
    
    return plans || []
  } catch (error) {
    console.error('Erreur getPlansActionByDepartementForParoisse:', error)
    return []
  }
}

/**
 * Récupérer un plan d'action par son ID
 */
export async function getPlanActionByIdForParoisse(
  planId: number,
  departementId: number,
  paroisseId: number
): Promise<any | null> {
  try {
    // Récupérer l'unité du département pour cette paroisse
    const { data: unite, error: uniteError } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', paroisseId)
      .maybeSingle()
    
    if (uniteError || !unite) {
      return null
    }
    
    // Récupérer le plan d'action
    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('*')
      .eq('id', planId)
      .eq('unite_id', unite.id)
      .maybeSingle()
    
    if (planError) {
      return null
    }
    
    return plan || null
  } catch (error) {
    console.error('Erreur getPlanActionByIdForParoisse:', error)
    return null
  }
}

export interface PlanActionDetail {
  id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
  unite_id: number
  annee_conference_id: number
  annee?: {
    id: number
    label: string
  }
  activites?: ActiviteDetail[]
  budget?: BudgetLineDetail[]
}

export interface ActiviteDetail {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  created_at: string
  updated_at: string
  plan_action_id: number | null
  fichiers?: {
    id: number
    nom_fichier: string
    chemin_fichier: string
    type_fichier: string
  }[]
}

export interface BudgetLineDetail {
  id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: string
  plan_action_id: number | null
}

/**
 * Récupère la conférence du chef connecté
 */
export async function getChefConferenceId(): Promise<number | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    const { data: chef } = await supabase
      .from('chef_departement')
      .select('conference_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()

    return chef?.conference_id || null
  } catch (error) {
    console.error('Erreur getChefConferenceId:', error)
    return null
  }
}

/**
 * Récupère tous les districts d'une conférence avec leurs statistiques
 */

/**
 * Récupère les détails d'un district pour un chef de conférence
 */
export async function getDistrictDetailsForConference(districtId: number): Promise<DistrictWithStats | null> {
  try {
    const conferenceId = await getChefConferenceId()
    if (!conferenceId) return null

    const { data: district, error } = await supabase
      .from('district')
      .select('*')
      .eq('id', districtId)
      .eq('conference_id', conferenceId)
      .single()

    if (error || !district) return null

    return district
  } catch (error) {
    console.error('Erreur getDistrictDetailsForConference:', error)
    return null
  }
}


export async function getDistrictStatsForConference(districtId: number): Promise<{
  totalPlansAction: number
  totalActivites: number
  activitesTerminees: number
  activitesEnCours: number
  activitesPlanifiees: number
  activitesAnnulees: number
  budgetRecettes: number
  budgetDepenses: number
  budgetSolde: number
}> {
  try {
    console.log('🔍 getDistrictStatsForConference - districtId:', districtId)
    
    const plans = await getPlansActionByDistrictForConference(districtId)
    const activites = await getActivitesByDistrictForConference(districtId)
    const budgets = await getBudgetsByDistrictForConference(districtId)
    
    const recettes = budgets.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0)
    const depenses = budgets.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0)
    
    const stats = {
      totalPlansAction: plans.length,
      totalActivites: activites.length,
      activitesTerminees: activites.filter(a => a.statut === 'termine').length,
      activitesEnCours: activites.filter(a => a.statut === 'en_cours').length,
      activitesPlanifiees: activites.filter(a => a.statut === 'planifie').length,
      activitesAnnulees: activites.filter(a => a.statut === 'annule').length,
      budgetRecettes: recettes,
      budgetDepenses: depenses,
      budgetSolde: recettes - depenses
    }
    
    console.log('📊 Statistiques calculées:', stats)
    return stats
    
  } catch (error) {
    console.error('❌ Erreur getDistrictStatsForConference:', error)
    return {
      totalPlansAction: 0,
      totalActivites: 0,
      activitesTerminees: 0,
      activitesEnCours: 0,
      activitesPlanifiees: 0,
      activitesAnnulees: 0,
      budgetRecettes: 0,
      budgetDepenses: 0,
      budgetSolde: 0
    }
  }
}

/**
 * Récupère tous les districts d'une conférence avec leurs statistiques
 */
export async function getDistrictsByConferenceWithStats(conferenceId: number): Promise<DistrictWithStats[]> {
  try {
    console.log('🔍 getDistrictsByConferenceWithStats - conferenceId:', conferenceId)
    
    // Récupérer les districts
    const { data: districts, error } = await supabase
      .from('district')
      .select('*')
      .eq('conference_id', conferenceId)
      .order('nom', { ascending: true })

    if (error) {
      console.error('❌ Erreur récupération districts:', error)
      return []
    }
    
    if (!districts || districts.length === 0) {
      console.log('⚠️ Aucun district trouvé')
      return []
    }

    console.log(`📊 ${districts.length} districts trouvés, récupération des stats...`)

    // Récupérer les stats pour chaque district en parallèle
    const districtsWithStats = await Promise.all(
      districts.map(async (district) => {
        const stats = await getDistrictStatsForConference(district.id)
        return {
          ...district,
          stats
        }
      })
    )

    console.log('✅ Stats récupérées pour tous les districts')
    return districtsWithStats
    
  } catch (error) {
    console.error('❌ Erreur getDistrictsByConferenceWithStats:', error)
    return []
  }
}





// actions/conference.ts - Version finale corrigée

export interface DistrictWithStats {
  id: number
  nom: string
  conference_id: number
  created_at: string
  updated_at: string
  stats?: {
    totalPlansAction: number
    totalActivites: number
    activitesTerminees: number
    activitesEnCours: number
    activitesPlanifiees: number
    activitesAnnulees: number
    budgetRecettes: number
    budgetDepenses: number
    budgetSolde: number
  }
}

export interface PlanActionDetail {
  id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
  unite_id: number
  annee_conference_id: number
  annee?: {
    id: number
    label: string
  }
  activites?: ActiviteDetail[]
  budget?: BudgetLineDetail[]
}

export interface ActiviteDetail {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  created_at: string
  updated_at: string
  plan_action_id: number | null
  fichiers?: {
    id: number
    nom_fichier: string
    chemin_fichier: string
    type_fichier: string
  }[]
}

export interface BudgetLineDetail {
  id: number
  type: 'recette' | 'depense'
  libelle: string
  montant: number
  currency: string
  plan_action_id: number | null
}

/**
 * Récupère la conférence et le département du chef connecté
 */
export async function getChefConferenceInfo(): Promise<{ conferenceId: number; departementId: number } | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    const { data: chef } = await supabase
      .from('chef_departement')
      .select('conference_id, departement_id')
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()

    if (!chef) return null
    
    return {
      conferenceId: chef.conference_id,
      departementId: chef.departement_id
    }
  } catch (error) {
    console.error('Erreur getChefConferenceInfo:', error)
    return null
  }
}

/**
 * Récupère tous les districts de la conférence avec leurs stats
 */
export async function getDistrictsForChefConference(): Promise<DistrictWithStats[]> {
  try {
    console.log('🔍 getDistrictsForChefConference - Début')
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      console.log('❌ Chef de conférence non trouvé')
      return []
    }
    
    const { conferenceId, departementId } = chefInfo
    console.log(`✅ Chef - Conference: ${conferenceId}, Département: ${departementId}`)
    
    // Récupérer tous les districts de la conférence
    const { data: districts, error } = await supabase
      .from('district')
      .select('*')
      .eq('conference_id', conferenceId)
      .order('nom', { ascending: true })

    if (error) {
      console.error('❌ Erreur récupération districts:', error)
      return []
    }
    
    if (!districts || districts.length === 0) {
      console.log('⚠️ Aucun district trouvé')
      return []
    }

    console.log(`📊 ${districts.length} districts trouvés`)

    // Pour chaque district, récupérer les stats via l'unité d'organisation
    const districtsWithStats = await Promise.all(
      districts.map(async (district) => {
        console.log(`📊 Traitement district ${district.id} - ${district.nom}`)
        
        // Récupérer l'unité d'organisation pour ce département ET ce district
        const unite = await getDepartementUniteForDistrict(departementId, district.id)
        
        if (!unite) {
          console.log(`⚠️ Aucune unité pour district ${district.id}`)
          return {
            ...district,
            stats: {
              totalPlansAction: 0,
              totalActivites: 0,
              activitesTerminees: 0,
              activitesEnCours: 0,
              activitesPlanifiees: 0,
              activitesAnnulees: 0,
              budgetRecettes: 0,
              budgetDepenses: 0,
              budgetSolde: 0
            }
          }
        }
        
        console.log(`✅ Unité trouvée: ${unite.id}`)
        
        // Récupérer les données en parallèle
        const [plansResult, activitesResult, budgetsResult] = await Promise.all([
          supabase.from('plan_action').select('id').eq('unite_id', unite.id),
          supabase.from('activite').select('id, statut').eq('unite_id', unite.id),
          supabase.from('budget').select('type, montant').eq('unite_id', unite.id)
        ])
        
        const totalPlansAction = plansResult.data?.length || 0
        const totalActivites = activitesResult.data?.length || 0
        const activitesTerminees = activitesResult.data?.filter(a => a.statut === 'termine').length || 0
        const activitesEnCours = activitesResult.data?.filter(a => a.statut === 'en_cours').length || 0
        const activitesPlanifiees = activitesResult.data?.filter(a => a.statut === 'planifie').length || 0
        const activitesAnnulees = activitesResult.data?.filter(a => a.statut === 'annule').length || 0
        
        const recettes = budgetsResult.data?.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
        const depenses = budgetsResult.data?.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
        
        return {
          ...district,
          stats: {
            totalPlansAction,
            totalActivites,
            activitesTerminees,
            activitesEnCours,
            activitesPlanifiees,
            activitesAnnulees,
            budgetRecettes: recettes,
            budgetDepenses: depenses,
            budgetSolde: recettes - depenses
          }
        }
      })
    )
    
    console.log('✅ Tous les districts traités')
    return districtsWithStats
    
  } catch (error) {
    console.error('❌ Erreur getDistrictsForChefConference:', error)
    return []
  }
}

/**
 * Récupère les plans d'action d'un district pour le département du chef
 */
export async function getPlansActionByDistrictForConference(districtId: number): Promise<PlanActionDetail[]> {
  try {
    console.log('🔍 getPlansActionByDistrictForConference - districtId:', districtId)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      console.log('❌ Chef non trouvé')
      return []
    }
    
    const { departementId } = chefInfo
    console.log(`✅ Département du chef: ${departementId}`)
    
    // Récupérer l'unité pour ce département et ce district
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) {
      console.log(`⚠️ Aucune unité trouvée pour département ${departementId} et district ${districtId}`)
      return []
    }
    
    console.log(`✅ Unité trouvée: ${unite.id}`)
    
    // Récupérer les plans d'action
    const { data: plans, error } = await supabase
      .from('plan_action')
      .select(`
        *,
        annee_conference:annee_conference_id (
          id,
          annee_id,
          annee:annee_id (id, label)
        )
      `)
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération plans:', error)
      return []
    }
    
    console.log(`✅ ${plans?.length || 0} plans trouvés`)
    
    return (plans || []).map((plan: any) => ({
      ...plan,
      annee: plan.annee_conference?.annee ? 
        (Array.isArray(plan.annee_conference.annee) ? plan.annee_conference.annee[0] : plan.annee_conference.annee) 
        : null
    }))
    
  } catch (error) {
    console.error('❌ Erreur getPlansActionByDistrictForConference:', error)
    return []
  }
}

/**
 * Récupère les activités d'un district pour le département du chef
 */
export async function getActivitesByDistrictForConference(districtId: number): Promise<ActiviteDetail[]> {
  try {
    console.log('🔍 getActivitesByDistrictForConference - districtId:', districtId)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      console.log('❌ Chef non trouvé')
      return []
    }
    
    const { departementId } = chefInfo
    console.log(`✅ Département du chef: ${departementId}`)
    
    // Récupérer l'unité
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) {
      console.log(`⚠️ Aucune unité trouvée`)
      return []
    }
    
    console.log(`✅ Unité trouvée: ${unite.id}`)
    
    // Récupérer les activités
    const { data: activites, error } = await supabase
      .from('activite')
      .select('*')
      .eq('unite_id', unite.id)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération activités:', error)
      return []
    }
    
    console.log(`✅ ${activites?.length || 0} activités trouvées`)
    
    // Récupérer les fichiers
    const activitesWithFiles = await Promise.all(
      (activites || []).map(async (activite) => {
        const { data: fichiers } = await supabase
          .from('activite_fichier')
          .select('id, nom_fichier, chemin_fichier, type_fichier')
          .eq('activite_id', activite.id)
        
        return {
          ...activite,
          fichiers: fichiers || []
        }
      })
    )
    
    return activitesWithFiles
    
  } catch (error) {
    console.error('❌ Erreur getActivitesByDistrictForConference:', error)
    return []
  }
}

/**
 * Récupère le budget d'un district pour le département du chef
 */
export async function getBudgetsByDistrictForConference(districtId: number): Promise<BudgetLineDetail[]> {
  try {
    console.log('🔍 getBudgetsByDistrictForConference - districtId:', districtId)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      console.log('❌ Chef non trouvé')
      return []
    }
    
    const { departementId } = chefInfo
    console.log(`✅ Département du chef: ${departementId}`)
    
    // Récupérer l'unité
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) {
      console.log(`⚠️ Aucune unité trouvée`)
      return []
    }
    
    console.log(`✅ Unité trouvée: ${unite.id}`)
    
    // Récupérer le budget
    const { data: budgets, error } = await supabase
      .from('budget')
      .select('*')
      .eq('unite_id', unite.id)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération budget:', error)
      return []
    }
    
    console.log(`✅ ${budgets?.length || 0} lignes budget trouvées`)
    
    return budgets || []
    
  } catch (error) {
    console.error('❌ Erreur getBudgetsByDistrictForConference:', error)
    return []
  }
}

/**
 * Récupère toutes les données d'un district en une seule fois
 */
export async function getDistrictCompleteData(districtId: number): Promise<{
  district: DistrictWithStats | null
  plans: PlanActionDetail[]
  activites: ActiviteDetail[]
  budgets: BudgetLineDetail[]
  stats: DistrictWithStats['stats']
}> {
  try {
    console.log('🔍 getDistrictCompleteData - districtId:', districtId)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      console.log('❌ Chef non trouvé')
      return { district: null, plans: [], activites: [], budgets: [], stats: undefined }
    }
    
    const { conferenceId, departementId } = chefInfo
    
    // Récupérer le district
    const { data: district, error: districtError } = await supabase
      .from('district')
      .select('*')
      .eq('id', districtId)
      .eq('conference_id', conferenceId)
      .single()
    
    if (districtError || !district) {
      console.log('❌ District non trouvé')
      return { district: null, plans: [], activites: [], budgets: [], stats: undefined }
    }
    
    // Récupérer l'unité
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) {
      console.log(`⚠️ Aucune unité trouvée`)
      return { 
        district, 
        plans: [], 
        activites: [], 
        budgets: [],
        stats: {
          totalPlansAction: 0,
          totalActivites: 0,
          activitesTerminees: 0,
          activitesEnCours: 0,
          activitesPlanifiees: 0,
          activitesAnnulees: 0,
          budgetRecettes: 0,
          budgetDepenses: 0,
          budgetSolde: 0
        }
      }
    }
    
    console.log(`✅ Unité trouvée: ${unite.id}`)
    
    // Récupérer toutes les données en parallèle
    const [plansResult, activitesResult, budgetsResult] = await Promise.all([
      supabase
        .from('plan_action')
        .select(`
          *,
          annee_conference:annee_conference_id (
            id,
            annee_id,
            annee:annee_id (id, label)
          )
        `)
        .eq('unite_id', unite.id)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('activite')
        .select('*')
        .eq('unite_id', unite.id)
        .order('date', { ascending: false }),
      
      supabase
        .from('budget')
        .select('*')
        .eq('unite_id', unite.id)
        .order('type', { ascending: true })
    ])
    
    // Formater les plans
    const plans = (plansResult.data || []).map((plan: any) => ({
      ...plan,
      annee: plan.annee_conference?.annee ? 
        (Array.isArray(plan.annee_conference.annee) ? plan.annee_conference.annee[0] : plan.annee_conference.annee) 
        : null
    }))
    
    // Récupérer les fichiers pour les activités
    const activitesWithFiles = await Promise.all(
      (activitesResult.data || []).map(async (activite) => {
        const { data: fichiers } = await supabase
          .from('activite_fichier')
          .select('id, nom_fichier, chemin_fichier, type_fichier')
          .eq('activite_id', activite.id)
        
        return {
          ...activite,
          fichiers: fichiers || []
        }
      })
    )
    
    // Calculer les stats
    const totalPlansAction = plans.length
    const totalActivites = activitesWithFiles.length
    const activitesTerminees = activitesWithFiles.filter(a => a.statut === 'termine').length
    const activitesEnCours = activitesWithFiles.filter(a => a.statut === 'en_cours').length
    const activitesPlanifiees = activitesWithFiles.filter(a => a.statut === 'planifie').length
    const activitesAnnulees = activitesWithFiles.filter(a => a.statut === 'annule').length
    
    const recettes = (budgetsResult.data || []).filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0)
    const depenses = (budgetsResult.data || []).filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0)
    
    const stats = {
      totalPlansAction,
      totalActivites,
      activitesTerminees,
      activitesEnCours,
      activitesPlanifiees,
      activitesAnnulees,
      budgetRecettes: recettes,
      budgetDepenses: depenses,
      budgetSolde: recettes - depenses
    }
    
    return {
      district: { ...district, stats },
      plans,
      activites: activitesWithFiles,
      budgets: budgetsResult.data || [],
      stats
    }
    
  } catch (error) {
    console.error('❌ Erreur getDistrictCompleteData:', error)
    return { district: null, plans: [], activites: [], budgets: [], stats: undefined }
  }
}

/**
 * Récupère un plan d'action spécifique avec ses activités et budget
 */
export async function getPlanActionDetailForConference(planId: number, districtId: number): Promise<PlanActionDetail | null> {
  try {
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return null
    
    const { departementId } = chefInfo
    
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    if (!unite) return null
    
    const { data: plan, error } = await supabase
      .from('plan_action')
      .select(`
        *,
        annee_conference:annee_conference_id (
          id,
          annee_id,
          annee:annee_id (id, label)
        )
      `)
      .eq('id', planId)
      .eq('unite_id', unite.id)
      .single()
    
    if (error || !plan) return null
    
    // Récupérer les activités liées
    const { data: activites } = await supabase
      .from('activite')
      .select('*')
      .eq('plan_action_id', planId)
      .order('date', { ascending: true })
    
    const activitesWithFiles = await Promise.all(
      (activites || []).map(async (activite) => {
        const { data: fichiers } = await supabase
          .from('activite_fichier')
          .select('id, nom_fichier, chemin_fichier, type_fichier')
          .eq('activite_id', activite.id)
        
        return { ...activite, fichiers: fichiers || [] }
      })
    )
    
    const { data: budget } = await supabase
      .from('budget')
      .select('*')
      .eq('plan_action_id', planId)
      .order('type', { ascending: true })
    
    return {
      ...plan,
      annee: plan.annee_conference?.annee ? 
        (Array.isArray(plan.annee_conference.annee) ? plan.annee_conference.annee[0] : plan.annee_conference.annee) 
        : null,
      activites: activitesWithFiles,
      budget: budget || []
    }
    
  } catch (error) {
    console.error('Erreur getPlanActionDetailForConference:', error)
    return null
  }
}

/**
 * Récupère une activité spécifique
 */
export async function getActiviteDetailForConference(activiteId: number, districtId: number): Promise<ActiviteDetail | null> {
  try {
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return null
    
    const { departementId } = chefInfo
    
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    if (!unite) return null
    
    const { data: activite, error } = await supabase
      .from('activite')
      .select('*')
      .eq('id', activiteId)
      .eq('unite_id', unite.id)
      .single()
    
    if (error || !activite) return null
    
    const { data: fichiers } = await supabase
      .from('activite_fichier')
      .select('id, nom_fichier, chemin_fichier, type_fichier')
      .eq('activite_id', activiteId)
    
    return {
      ...activite,
      fichiers: fichiers || []
    }
    
  } catch (error) {
    console.error('Erreur getActiviteDetailForConference:', error)
    return null
  }
}


// actions/conference.ts - Ajouter ces fonctions

import { getAnneesConferenceByConference, getCurrentAnneeConference } from './annee-conference'

/**
 * Récupère les années disponibles pour la conférence du chef
 */
export async function getAnneesDisponiblesForConference(): Promise<{
  id: number
  annee_id: number
  label: string
  is_current: boolean
  annee_conference_id: number
}[]> {
  try {
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return []
    
    const annees = await getAnneesConferenceByConference(chefInfo.conferenceId)
    
    return annees.map(annee => ({
      id: annee.id,
      annee_id: annee.annee_id,
      label: annee.label,
      is_current: annee.is_current,
      annee_conference_id: annee.id
    }))
  } catch (error) {
    console.error('Erreur getAnneesDisponiblesForConference:', error)
    return []
  }
}

/**
 * Récupère l'année en cours pour la conférence du chef
 */
export async function getCurrentAnneeForConference(): Promise<{
  id: number
  annee_id: number
  label: string
  is_current: boolean
  annee_conference_id: number
} | null> {
  try {
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return null
    
    const currentAnnee = await getCurrentAnneeConference(chefInfo.conferenceId)
    if (!currentAnnee) return null
    
    return {
      id: currentAnnee.id,
      annee_id: currentAnnee.annee_id,
      label: currentAnnee.label,
      is_current: currentAnnee.is_current,
      annee_conference_id: currentAnnee.id
    }
  } catch (error) {
    console.error('Erreur getCurrentAnneeForConference:', error)
    return null
  }
}

/**
 * Récupère les statistiques d'un district pour une année spécifique
 */
export async function getDistrictStatsForConferenceByAnnee(
  districtId: number, 
  anneeConferenceId: number
): Promise<{
  totalPlansAction: number
  totalActivites: number
  activitesTerminees: number
  activitesEnCours: number
  activitesPlanifiees: number
  activitesAnnulees: number
  budgetRecettes: number
  budgetDepenses: number
  budgetSolde: number
}> {
  try {
    console.log(`🔍 getDistrictStatsForConferenceByAnnee - districtId: ${districtId}, anneeConferenceId: ${anneeConferenceId}`)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      return getEmptyStats()
    }
    
    const { departementId } = chefInfo
    
    // Récupérer l'unité
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    if (!unite) {
      return getEmptyStats()
    }
    
    // Récupérer les données filtrées par année
    const [plansResult, activitesResult, budgetsResult] = await Promise.all([
      supabase
        .from('plan_action')
        .select('id')
        .eq('unite_id', unite.id)
        .eq('annee_conference_id', anneeConferenceId),
      
      supabase
        .from('activite')
        .select('id, statut')
        .eq('unite_id', unite.id)
        .eq('annee_conference_id', anneeConferenceId),
      
      supabase
        .from('budget')
        .select('type, montant')
        .eq('unite_id', unite.id)
        .eq('annee_conference_id', anneeConferenceId)
    ])
    
    const totalPlansAction = plansResult.data?.length || 0
    const totalActivites = activitesResult.data?.length || 0
    const activitesTerminees = activitesResult.data?.filter(a => a.statut === 'termine').length || 0
    const activitesEnCours = activitesResult.data?.filter(a => a.statut === 'en_cours').length || 0
    const activitesPlanifiees = activitesResult.data?.filter(a => a.statut === 'planifie').length || 0
    const activitesAnnulees = activitesResult.data?.filter(a => a.statut === 'annule').length || 0
    
    const recettes = budgetsResult.data?.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
    const depenses = budgetsResult.data?.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
    
    return {
      totalPlansAction,
      totalActivites,
      activitesTerminees,
      activitesEnCours,
      activitesPlanifiees,
      activitesAnnulees,
      budgetRecettes: recettes,
      budgetDepenses: depenses,
      budgetSolde: recettes - depenses
    }
    
  } catch (error) {
    console.error('❌ Erreur getDistrictStatsForConferenceByAnnee:', error)
    return getEmptyStats()
  }
}

/**
 * Récupère tous les districts d'une conférence avec leurs statistiques pour une année spécifique
 */
export async function getDistrictsByConferenceWithStatsByAnnee(
  conferenceId: number, 
  anneeConferenceId: number
): Promise<DistrictWithStats[]> {
  try {
    console.log(`🔍 getDistrictsByConferenceWithStatsByAnnee - conferenceId: ${conferenceId}, anneeConferenceId: ${anneeConferenceId}`)
    
    // Récupérer les districts
    const { data: districts, error } = await supabase
      .from('district')
      .select('*')
      .eq('conference_id', conferenceId)
      .order('nom', { ascending: true })

    if (error) {
      console.error('❌ Erreur récupération districts:', error)
      return []
    }
    
    if (!districts || districts.length === 0) {
      return []
    }

    // Récupérer les stats pour chaque district avec l'année spécifiée
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) {
      return districts.map(district => ({ ...district, stats: getEmptyStats() }))
    }
    
    const { departementId } = chefInfo
    
    const districtsWithStats = await Promise.all(
      districts.map(async (district) => {
        // Récupérer l'unité
        const unite = await getDepartementUniteForDistrict(departementId, district.id)
        
        if (!unite) {
          return { ...district, stats: getEmptyStats() }
        }
        
        // Récupérer les données filtrées par année
        const [plansResult, activitesResult, budgetsResult] = await Promise.all([
          supabase.from('plan_action').select('id').eq('unite_id', unite.id).eq('annee_conference_id', anneeConferenceId),
          supabase.from('activite').select('id, statut').eq('unite_id', unite.id).eq('annee_conference_id', anneeConferenceId),
          supabase.from('budget').select('type, montant').eq('unite_id', unite.id).eq('annee_conference_id', anneeConferenceId)
        ])
        
        const totalPlansAction = plansResult.data?.length || 0
        const totalActivites = activitesResult.data?.length || 0
        const activitesTerminees = activitesResult.data?.filter(a => a.statut === 'termine').length || 0
        const activitesEnCours = activitesResult.data?.filter(a => a.statut === 'en_cours').length || 0
        const activitesPlanifiees = activitesResult.data?.filter(a => a.statut === 'planifie').length || 0
        const activitesAnnulees = activitesResult.data?.filter(a => a.statut === 'annule').length || 0
        
        const recettes = budgetsResult.data?.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
        const depenses = budgetsResult.data?.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
        
        return {
          ...district,
          stats: {
            totalPlansAction,
            totalActivites,
            activitesTerminees,
            activitesEnCours,
            activitesPlanifiees,
            activitesAnnulees,
            budgetRecettes: recettes,
            budgetDepenses: depenses,
            budgetSolde: recettes - depenses
          }
        }
      })
    )
    
    return districtsWithStats
    
  } catch (error) {
    console.error('❌ Erreur getDistrictsByConferenceWithStatsByAnnee:', error)
    return []
  }
}

function getEmptyStats() {
  return {
    totalPlansAction: 0,
    totalActivites: 0,
    activitesTerminees: 0,
    activitesEnCours: 0,
    activitesPlanifiees: 0,
    activitesAnnulees: 0,
    budgetRecettes: 0,
    budgetDepenses: 0,
    budgetSolde: 0
  }
}

// Mettre à jour les fonctions existantes pour supporter le filtre année
export async function getPlansActionByDistrictForConferenceByAnnee(
  districtId: number, 
  anneeConferenceId: number
): Promise<PlanActionDetail[]> {
  try {
    console.log(`🔍 getPlansActionByDistrictForConferenceByAnnee - districtId: ${districtId}, anneeConferenceId: ${anneeConferenceId}`)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return []
    
    const { departementId } = chefInfo
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) return []
    
    const { data: plans, error } = await supabase
      .from('plan_action')
      .select(`
        *,
        annee_conference:annee_conference_id (
          id,
          annee_id,
          annee:annee_id (id, label)
        )
      `)
      .eq('unite_id', unite.id)
      .eq('annee_conference_id', anneeConferenceId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération plans:', error)
      return []
    }
    
    return (plans || []).map((plan: any) => ({
      ...plan,
      annee: plan.annee_conference?.annee ? 
        (Array.isArray(plan.annee_conference.annee) ? plan.annee_conference.annee[0] : plan.annee_conference.annee) 
        : null
    }))
    
  } catch (error) {
    console.error('❌ Erreur getPlansActionByDistrictForConferenceByAnnee:', error)
    return []
  }
}

export async function getActivitesByDistrictForConferenceByAnnee(
  districtId: number, 
  anneeConferenceId: number
): Promise<ActiviteDetail[]> {
  try {
    console.log(`🔍 getActivitesByDistrictForConferenceByAnnee - districtId: ${districtId}, anneeConferenceId: ${anneeConferenceId}`)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return []
    
    const { departementId } = chefInfo
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) return []
    
    const { data: activites, error } = await supabase
      .from('activite')
      .select('*')
      .eq('unite_id', unite.id)
      .eq('annee_conference_id', anneeConferenceId)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération activités:', error)
      return []
    }
    
    const activitesWithFiles = await Promise.all(
      (activites || []).map(async (activite) => {
        const { data: fichiers } = await supabase
          .from('activite_fichier')
          .select('id, nom_fichier, chemin_fichier, type_fichier')
          .eq('activite_id', activite.id)
        
        return {
          ...activite,
          fichiers: fichiers || []
        }
      })
    )
    
    return activitesWithFiles
    
  } catch (error) {
    console.error('❌ Erreur getActivitesByDistrictForConferenceByAnnee:', error)
    return []
  }
}

export async function getBudgetsByDistrictForConferenceByAnnee(
  districtId: number, 
  anneeConferenceId: number
): Promise<BudgetLineDetail[]> {
  try {
    console.log(`🔍 getBudgetsByDistrictForConferenceByAnnee - districtId: ${districtId}, anneeConferenceId: ${anneeConferenceId}`)
    
    const chefInfo = await getChefConferenceInfo()
    if (!chefInfo) return []
    
    const { departementId } = chefInfo
    const unite = await getDepartementUniteForDistrict(departementId, districtId)
    
    if (!unite) return []
    
    const { data: budgets, error } = await supabase
      .from('budget')
      .select('*')
      .eq('unite_id', unite.id)
      .eq('annee_conference_id', anneeConferenceId)
      .order('type', { ascending: true })
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ Erreur récupération budget:', error)
      return []
    }
    
    return budgets || []
    
  } catch (error) {
    console.error('❌ Erreur getBudgetsByDistrictForConferenceByAnnee:', error)
    return []
  }
}