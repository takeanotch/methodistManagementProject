// actions/chef-conference.ts

'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'
import { getDepartementUniteForParoisse } from './unite-organisation'
import { getActivitesByUnite, getActivitesStats } from './activite'
import { getUniteBudgetSummary } from './budget'
import { getPlansActionByUnite } from './plan-action'

export interface ChefConferenceInfo {
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
}

export interface Paroisse {
  id: number
  nom: string
  district_id: number
}

export interface DepartementDataForParoisse {
  paroisse_id: number
  paroisse_nom: string
  district_id: number
  district_nom: string
  unite_id: number | null
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
  }
}

/**
 * Récupérer les infos du chef de département niveau conférence
 */
export async function getChefConferenceInfo(): Promise<ChefConferenceInfo | null> {
  try {
    console.log('🔍 getChefConferenceInfo - Début')
    
    const user = await getUser()
    if (!user || !user.fidele_id) {
      console.log('❌ Utilisateur non connecté')
      return null
    }

    console.log('✅ Utilisateur connecté - Fidele ID:', user.fidele_id)

    const { data: chef, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        conference_id,
        departement:departement_id (id, nom, type, roles_config),
        conference:conference_id (id, nom),
        fidele:fidele_id (id, nom, prenom)
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'conference')
      .eq('est_actif', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur getChefConferenceInfo:', error)
      return null
    }

    if (!chef) {
      console.log('⚠️ Chef de conférence non trouvé')
      return null
    }

    console.log('✅ Chef trouvé:', { id: chef.id, departement_id: chef.departement_id, conference_id: chef.conference_id })

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
    console.error('❌ Erreur inattendue getChefConferenceInfo:', error)
    return null
  }
}

/**
 * Récupérer tous les districts d'une conférence
 */
export async function getDistrictsByConference(conferenceId: number): Promise<District[]> {
  try {
    console.log('🔍 getDistrictsByConference - Conference ID:', conferenceId)
    
    const { data, error } = await supabase
      .from('district')
      .select('id, nom, conference_id')
      .eq('conference_id', conferenceId)
      .order('nom', { ascending: true })

    if (error) {
      console.error('❌ Erreur getDistrictsByConference:', error)
      return []
    }

    console.log(`✅ ${data?.length || 0} districts trouvés`)
    return data || []
  } catch (error) {
    console.error('❌ Erreur inattendue getDistrictsByConference:', error)
    return []
  }
}

/**
 * Récupérer toutes les paroisses d'un district
 */
export async function getParoissesByDistrict(districtId: number): Promise<Paroisse[]> {
  try {
    console.log('🔍 getParoissesByDistrict - District ID:', districtId)
    
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom, district_id')
      .eq('district_id', districtId)
      .order('nom', { ascending: true })

    if (error) {
      console.error('❌ Erreur getParoissesByDistrict:', error)
      return []
    }

    console.log(`✅ ${data?.length || 0} paroisses trouvées`)
    return data || []
  } catch (error) {
    console.error('❌ Erreur inattendue getParoissesByDistrict:', error)
    return []
  }
}

/**
 * Récupérer toutes les paroisses d'une conférence (à travers tous les districts)
 */
export async function getAllParoissesByConference(conferenceId: number): Promise<Paroisse[]> {
  try {
    console.log('🔍 getAllParoissesByConference - Conference ID:', conferenceId)
    
    // 1. Récupérer tous les districts de la conférence
    const districts = await getDistrictsByConference(conferenceId)
    
    if (districts.length === 0) {
      console.log('⚠️ Aucun district trouvé pour cette conférence')
      return []
    }
    
    console.log(`📊 ${districts.length} districts trouvés, récupération des paroisses...`)
    
    // 2. Récupérer toutes les paroisses de chaque district
    const allParoisses: Paroisse[] = []
    
    for (const district of districts) {
      const paroisses = await getParoissesByDistrict(district.id)
      allParoisses.push(...paroisses)
    }
    
    console.log(`✅ Total: ${allParoisses.length} paroisses trouvées dans la conférence`)
    return allParoisses
  } catch (error) {
    console.error('❌ Erreur inattendue getAllParoissesByConference:', error)
    return []
  }
}

/**
 * Récupérer les paroisses groupées par district
 */
export async function getParoissesGroupedByDistrict(conferenceId: number): Promise<Map<number, { district_nom: string, paroisses: Paroisse[] }>> {
  try {
    console.log('🔍 getParoissesGroupedByDistrict - Conference ID:', conferenceId)
    
    const districts = await getDistrictsByConference(conferenceId)
    const grouped = new Map()
    
    for (const district of districts) {
      const paroisses = await getParoissesByDistrict(district.id)
      grouped.set(district.id, {
        district_nom: district.nom,
        paroisses
      })
      console.log(`   District ${district.nom}: ${paroisses.length} paroisses`)
    }
    
    return grouped
  } catch (error) {
    console.error('❌ Erreur inattendue getParoissesGroupedByDistrict:', error)
    return new Map()
  }
}

/**
 * Récupérer les fidèles d'une paroisse pour un département
 */

// actions/chef-conference.ts - Remplacer getFidelesByParoisseAndDepartement

async function getFidelesByParoisseAndDepartement(
  paroisseId: number,
  departementId: number,
  anneeConferenceId?: number | null  // ← ID de annee_conference
): Promise<any[]> {
  if (!paroisseId || !departementId) {
    return []
  }

  try {
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
        )
      `)
      .eq('paroisse_id', paroisseId)
      .eq('departement_id', departementId)

    // Filtrer par annee_conference_id (pas annee_id)
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur getFidelesByParoisseAndDepartement:', error)
      return []
    }

    return (data || []).map((affectation: any) => {
      const departement = Array.isArray(affectation.departement) 
        ? affectation.departement[0] 
        : affectation.departement
        
      const roleDetails = departement?.roles_config?.find(
        (r: any) => r.id === affectation.role_id
      ) || null
      
      const fidele = Array.isArray(affectation.fidele) 
        ? affectation.fidele[0] 
        : affectation.fidele
        
      return { 
        ...affectation, 
        role_details: roleDetails,
        fidele,
        departement
      }
    })
  } catch (error) {
    console.error('❌ Erreur inattendue:', error)
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
      .select('id, nom, district_id')
      .eq('id', paroisseId)
      .single()

    if (error) {
      console.error('❌ Erreur getParoisseById:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('❌ Erreur inattendue getParoisseById:', error)
    return null
  }
}

/**
 * Récupérer un district par son ID
 */
export async function getDistrictById(districtId: number): Promise<District | null> {
  try {
    const { data, error } = await supabase
      .from('district')
      .select('id, nom, conference_id')
      .eq('id', districtId)
      .single()

    if (error) {
      console.error('❌ Erreur getDistrictById:', error)
      return null
    }
    return data
  } catch (error) {
    console.error('❌ Erreur inattendue getDistrictById:', error)
    return null
  }
}

/**
 * Récupérer les années disponibles pour une paroisse
 */




// ============================================================
// NOUVELLES FONCTIONS POUR LA VUE LECTURE SEULE CHEF CONFÉRENCE
// ============================================================

/**
 * Récupérer tous les districts avec leurs paroisses pour une conférence
 * Avec les données du département pour chaque paroisse
 */
export async function getAllDistrictsWithParoissesData(
  departementId: number,
  conferenceId: number,
  anneeConferenceId: number | null | undefined
): Promise<{
  district_id: number
  district_nom: string
  paroisses: {
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
    }
  }[]
}[]> {
  try {
    console.log(`🔍 getAllDistrictsWithParoissesData - Dept: ${departementId}, Conf: ${conferenceId}`)
    
    // 1. Récupérer tous les districts de la conférence
    const { data: districts, error: districtsError } = await supabase
      .from('district')
      .select('id, nom')
      .eq('conference_id', conferenceId)
      .order('nom')

    if (districtsError) {
      console.error('❌ Erreur districts:', districtsError)
      return []
    }

    if (!districts || districts.length === 0) {
      return []
    }

    // 2. Pour chaque district, récupérer les paroisses avec leurs données
    const result = await Promise.all(
      districts.map(async (district) => {
        const paroissesData = await getParoissesDataForDistrict(
          departementId,
          district.id,
          anneeConferenceId
        )
        
        return {
          district_id: district.id,
          district_nom: district.nom,
          paroisses: paroissesData
        }
      })
    )

    return result
  } catch (error) {
    console.error('❌ Erreur getAllDistrictsWithParoissesData:', error)
    return []
  }
}

/**
 * Récupérer les données de toutes les paroisses d'un district pour un département
 */
export async function getParoissesDataForDistrict(
  departementId: number,
  districtId: number,
  anneeConferenceId: number | null | undefined
): Promise<{
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
  }
}[]> {
  try {
    // Récupérer toutes les paroisses du district
    const { data: paroisses, error: paroissesError } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('district_id', districtId)
      .order('nom')

    if (paroissesError) {
      console.error('❌ Erreur paroisses:', paroissesError)
      return []
    }

    if (!paroisses || paroisses.length === 0) {
      return []
    }

    // Récupérer les unités pour toutes les paroisses
    const { data: unites, error: unitesError } = await supabase
      .from('unite_organisation')
      .select('id, nom, paroisse_id')
      .eq('departement_id', departementId)
      .in('paroisse_id', paroisses.map(p => p.id))

    if (unitesError) {
      console.error('❌ Erreur unités:', unitesError)
    }

    const unitesMap = new Map<number, { id: number; nom: string }>()
    if (unites) {
      unites.forEach(u => unitesMap.set(u.paroisse_id, { id: u.id, nom: u.nom }))
    }

    // Récupérer les données pour chaque paroisse
    const result = await Promise.all(
      paroisses.map(async (paroisse) => {
        const unite = unitesMap.get(paroisse.id)
        const data = await getParoisseDepartementDataReadOnly(
          departementId,
          paroisse.id,
          unite?.id || null,
          anneeConferenceId
        )

        return {
          paroisse_id: paroisse.id,
          paroisse_nom: paroisse.nom,
          unite_id: unite?.id || null,
          unite_nom: unite?.nom || null,
          data
        }
      })
    )

    return result
  } catch (error) {
    console.error('❌ Erreur getParoissesDataForDistrict:', error)
    return []
  }
}

/**
 * Récupérer les données d'une paroisse pour un département (lecture seule)
 */
export async function getParoisseDepartementDataReadOnly(
  departementId: number,
  paroisseId: number,
  uniteId: number | null,
  anneeConferenceId: number | null | undefined
): Promise<{
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
}> {
  try {
    if (!departementId || !paroisseId) {
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
        activitesProchaines: []
      }
    }

    // Récupérer les fidèles
    const fidelesResult = await getFidelesByParoisseAndDepartementReadOnly(
      paroisseId,
      departementId,
      anneeConferenceId
    )

    // Si pas d'unité, retourner seulement les fidèles
    if (!uniteId) {
      const totalFideles = fidelesResult.length
      const actifs = fidelesResult.filter((f: any) => f.est_actif).length
      
      return {
        fideles: fidelesResult,
        totalFideles,
        actifs,
        inactifs: totalFideles - actifs,
        activites: [],
        budgetSummary: null,
        plansAction: [],
        activitesStats: null,
        activitesRecentes: [],
        activitesProchaines: []
      }
    }

    // Récupérer les autres données
    const [
      activitesResult,
      budgetResult,
      plansResult,
      activitesStatsResult
    ] = await Promise.all([
      anneeConferenceId 
        ? getActivitesByUnite(uniteId, anneeConferenceId)
        : Promise.resolve([]),
      
      anneeConferenceId 
        ? getUniteBudgetSummary(uniteId, anneeConferenceId)
        : Promise.resolve(null),
      
      anneeConferenceId 
        ? getPlansActionByUnite(uniteId, anneeConferenceId)
        : Promise.resolve([]),
        
      anneeConferenceId 
        ? getActivitesStats(undefined, uniteId, anneeConferenceId)
        : Promise.resolve(null)
    ])

    const activitesRecentes = (activitesResult || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    const activitesProchaines = (activitesResult || [])
      .filter(a => new Date(a.date) >= new Date() && a.statut !== 'termine' && a.statut !== 'annule')
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
      activitesProchaines
    }
  } catch (error) {
    console.error('❌ Erreur getParoisseDepartementDataReadOnly:', error)
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
      activitesProchaines: []
    }
  }
}

/**
 * Récupérer les fidèles d'une paroisse pour un département (lecture seule)
 */
async function getFidelesByParoisseAndDepartementReadOnly(
  paroisseId: number,
  departementId: number,
  anneeConferenceId?: number | null
): Promise<any[]> {
  if (!paroisseId || !departementId) {
    return []
  }

  try {
    let query = supabase
      .from('fidele_departement')
      .select(`
        id,
        fidele_id,
        role_id,
        est_actif,
        date_affectation,
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
        )
      `)
      .eq('paroisse_id', paroisseId)
      .eq('departement_id', departementId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur getFidelesByParoisseAndDepartementReadOnly:', error)
      return []
    }

    return (data || []).map((affectation: any) => {
      const departement = Array.isArray(affectation.departement) 
        ? affectation.departement[0] 
        : affectation.departement
        
      const roleDetails = departement?.roles_config?.find(
        (r: any) => r.id === affectation.role_id
      ) || null
      
      const fidele = Array.isArray(affectation.fidele) 
        ? affectation.fidele[0] 
        : affectation.fidele
        
      return { 
        ...affectation, 
        role_details: roleDetails,
        fidele: fidele,
        departement: departement
      }
    })
  } catch (error) {
    console.error('❌ Erreur inattendue getFidelesByParoisseAndDepartementReadOnly:', error)
    return []
  }
}

/**
 * Récupérer les années disponibles pour la conférence du chef
 */
export async function getAnneesForChefConference(conferenceId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => {
      const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
      return {
        id: item.id,
        annee_id: annee?.id,
        label: annee?.label || '',
        is_current: item.is_current
      }
    })
  } catch (error) {
    console.error('❌ Erreur getAnneesForChefConference:', error)
    return []
  }
}

// actions/chef-conference.ts - Remplacer getAnneesDisponiblesForParoisse

/**
 * Récupérer les années disponibles pour une paroisse (via la conférence)
 * Retourne les IDs de annee_conference
 */
export async function getAnneesDisponiblesForParoisse(
  paroisseId: number, 
  departementId: number
): Promise<any[]> {
  try {
    console.log('📅 getAnneesDisponiblesForParoisse (conference):', { paroisseId, departementId })
    
    // 1. Récupérer la conférence via la paroisse
    const { data: paroisse, error: paroisseError } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (paroisseError || !paroisse) {
      console.error('❌ Erreur récupération paroisse:', paroisseError)
      return []
    }

    // Extraire la conférence
    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null
    
    if (!conference?.id) {
      console.log('⚠️ Aucune conférence trouvée')
      return []
    }

    console.log('🏛️ Conférence ID:', conference.id)

    // 2. Récupérer les années de conférence (table annee_conference)
    const { data: anneesConference, error: anneesError } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conference.id)
      .order('annee_id', { ascending: false })

    if (anneesError) {
      console.error('❌ Erreur récupération années:', anneesError)
      return []
    }

    console.log(`📅 ${anneesConference?.length || 0} années trouvées`)

    // Retourner l'ID de annee_conference (pas annee_id)
    return (anneesConference || []).map((ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      return {
        id: ac.id,  // ← ID de annee_conference
        annee_id: ac.annee_id,
        label: annee?.label || `Année ${ac.annee_id}`,
        is_current: ac.is_current
      }
    })
  } catch (error) {
    console.error('❌ Erreur getAnneesDisponiblesForParoisse:', error)
    return []
  }
}


// actions/chef-conference.ts - Ajouter cette fonction

/**
 * Récupérer les années disponibles pour la conférence du chef
 * Retourne les IDs de annee_conference
 */
export async function getAnneesForConference(conferenceId: number): Promise<any[]> {
  try {
    console.log('📅 getAnneesForConference:', conferenceId)
    
    const { data, error } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conferenceId)
      .order('annee_id', { ascending: false })

    if (error) {
      console.error('❌ Erreur:', error)
      return []
    }

    console.log(`📅 ${data?.length || 0} années trouvées`)

    return (data || []).map((ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      return {
        id: ac.id,  // ← ID de annee_conference
        annee_id: ac.annee_id,
        label: annee?.label || `Année ${ac.annee_id}`,
        is_current: ac.is_current
      }
    })
  } catch (error) {
    console.error('❌ Erreur getAnneesForConference:', error)
    return []
  }
}


// actions/chef-conference.ts - Remplacer getAllParoissesConferenceData

/**
 * Récupérer les données pour toutes les paroisses d'une conférence
 * anneeConferenceId est l'ID de annee_conference
 */
export async function getAllParoissesConferenceData(
  departementId: number,
  conferenceId: number,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse[]> {
  try {
    console.log(`🔍 getAllParoissesConferenceData`, { departementId, conferenceId, anneeConferenceId })
    
    if (!departementId || !conferenceId) {
      console.log('⚠️ Paramètres manquants')
      return []
    }
    
    // 1. Récupérer toutes les paroisses de la conférence
    const paroisses = await getAllParoissesByConference(conferenceId)
    
    if (paroisses.length === 0) {
      console.log('⚠️ Aucune paroisse trouvée')
      return []
    }
    
    // 2. Récupérer les infos des districts
    const districtsMap = new Map<number, string>()
    for (const paroisse of paroisses) {
      if (!districtsMap.has(paroisse.district_id)) {
        const { data: district } = await supabase
          .from('district')
          .select('nom')
          .eq('id', paroisse.district_id)
          .single()
        districtsMap.set(paroisse.district_id, district?.nom || 'District inconnu')
      }
    }
    
    // 3. Récupérer les données pour chaque paroisse
    const results = await Promise.all(
      paroisses.map(async (paroisse) => {
        const data = await getDepartementDataForParoisse(
          departementId,
          paroisse.id,
          anneeConferenceId  // ← ID de annee_conference
        )
        
        const unite = await getDepartementUniteForParoisse(departementId, paroisse.id)
        
        return {
          paroisse_id: paroisse.id,
          paroisse_nom: paroisse.nom,
          district_id: paroisse.district_id,
          district_nom: districtsMap.get(paroisse.district_id) || 'District inconnu',
          unite_id: unite?.id || null,
          data
        }
      })
    )
    
    console.log(`✅ ${results.length} paroisses traitées`)
    return results
  } catch (error) {
    console.error('❌ Erreur getAllParoissesConferenceData:', error)
    return []
  }
}






// actions/chef-conference.ts - Remplacer getDepartementDataForParoisse

/**
 * Récupérer les données d'un département pour une paroisse spécifique
 * anneeConferenceId est l'ID de annee_conference
 */
export async function getDepartementDataForParoisse(
  departementId: number,
  paroisseId: number,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse['data']> {
  try {
    console.log(`📋 getDepartementDataForParoisse`, { departementId, paroisseId, anneeConferenceId })
    
    if (!departementId || !paroisseId) {
      return emptyData()
    }

    // Récupérer l'unité
    const unite = await getDepartementUniteForParoisse(departementId, paroisseId)
    
    if (!unite || !unite.id) {
      console.log(`⚠️ Aucune unité trouvée`)
      return emptyData()
    }

    // Récupérer les fidèles
    const fidelesResult = await getFidelesByParoisseAndDepartement(
      paroisseId, 
      departementId, 
      anneeConferenceId
    )
    
    // Récupérer les activités - on passe l'ID de annee_conference
    let activitesResult: any[] = []
    if (anneeConferenceId) {
      activitesResult = await getActivitesByUnite(unite.id, anneeConferenceId)
      console.log(`  Activités: ${activitesResult.length}`)
    }
    
    // Récupérer les plans d'action
    let plansResult: any[] = []
    if (anneeConferenceId) {
      plansResult = await getPlansActionByUnite(unite.id, anneeConferenceId)
    } else {
      plansResult = await getPlansActionByUnite(unite.id)
    }
    
    // Récupérer le budget
    let budgetResult = null
    if (anneeConferenceId) {
      budgetResult = await getUniteBudgetSummary(unite.id, anneeConferenceId)
    }
    
    // Récupérer les stats
    let activitesStatsResult = null
    if (anneeConferenceId) {
      activitesStatsResult = await getActivitesStats(undefined, unite.id, anneeConferenceId)
    }
    
    // Traiter les activités
    const activitesRecentes = (activitesResult || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    const activitesProchaines = (activitesResult || [])
      .filter(a => new Date(a.date) >= new Date() && a.statut !== 'termine' && a.statut !== 'annule')
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
      activitesProchaines
    }
  } catch (error) {
    console.error(`❌ Erreur getDepartementDataForParoisse:`, error)
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
    activitesProchaines: []
  }
}





// actions/chef-conference.ts - Ajouter après les imports existants

import { getProjetsByUnite, getProjetsStats } from './projet'

/**
 * Récupérer les projets pour une paroisse (via l'unité)
 */
export async function getProjetsForParoisse(
  departementId: number,
  paroisseId: number,
  anneeConferenceId: number | null | undefined
): Promise<any[]> {
  try {
    const unite = await getDepartementUniteForParoisse(departementId, paroisseId)
    if (!unite || !unite.id) return []
    
    const projets = await getProjetsByUnite(unite.id, anneeConferenceId || undefined)
    return projets
  } catch (error) {
    console.error('❌ Erreur getProjetsForParoisse:', error)
    return []
  }
}

/**
 * Récupérer les statistiques des projets pour une paroisse
 */
export async function getProjetsStatsForParoisse(
  departementId: number,
  paroisseId: number,
  anneeConferenceId: number | null | undefined
): Promise<{
  total: number
  enCours: number
  termines: number
  parType: Record<string, number>
}> {
  try {
    const unite = await getDepartementUniteForParoisse(departementId, paroisseId)
    if (!unite || !unite.id) {
      return { total: 0, enCours: 0, termines: 0, parType: {} }
    }
    
    const stats = await getProjetsStats(unite.id, anneeConferenceId || undefined)
    return stats
  } catch (error) {
    console.error('❌ Erreur getProjetsStatsForParoisse:', error)
    return { total: 0, enCours: 0, termines: 0, parType: {} }
  }
}



// actions/chef-conference.ts

// Helper pour récupérer l'année en cours d'une conférence
async function getCurrentAnneeConferenceIdForConference(conferenceId: number): Promise<number | null> {
  try {
    const { data } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('conference_id', conferenceId)
      .eq('is_current', true)
      .maybeSingle()
    return data?.id || null
  } catch (error) {
    console.error('Erreur getCurrentAnneeConferenceIdForConference:', error)
    return null
  }
}

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

// Helper pour récupérer l'année en cours d'une paroisse
async function getCurrentAnneeConferenceIdForParoisse(paroisseId: number): Promise<number | null> {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`district:district_id (conference:conference_id (id))`)
      .eq('id', paroisseId)
      .single()

    const district = Array.isArray(paroisse?.district) ? paroisse.district[0] : paroisse?.district
    const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null
    
    if (!conference?.id) return null

    const { data } = await supabase
      .from('annee_conference')
      .select('id')
      .eq('conference_id', conference.id)
      .eq('is_current', true)
      .maybeSingle()
    return data?.id || null
  } catch (error) {
    console.error('Erreur getCurrentAnneeConferenceIdForParoisse:', error)
    return null
  }
}


// actions/chef-conference.ts - ajouter cette fonction

export async function addChefDepartement(data: {
  fidele_id: number
  departement_id: number
  niveau: 'conference' | 'district' | 'paroisse'
  conference_id?: number | null
  district_id?: number | null
  paroisse_id?: number | null
}): Promise<{ success: boolean; error?: string; chef?: any }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // Déterminer l'annee_conference_id selon le niveau
    let anneeConferenceId: number | null = null
    
    if (data.niveau === 'conference' && data.conference_id) {
      anneeConferenceId = await getCurrentAnneeConferenceIdForConference(data.conference_id)
    } else if (data.niveau === 'district' && data.district_id) {
      anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(data.district_id)
    } else if (data.niveau === 'paroisse' && data.paroisse_id) {
      anneeConferenceId = await getCurrentAnneeConferenceIdForParoisse(data.paroisse_id)
    }

    console.log(`📅 annee_conference_id pour chef (${data.niveau}):`, anneeConferenceId)

    // Vérifier si le chef existe déjà pour cette année
    let query = supabase
      .from('chef_departement')
      .select('id, est_actif')
      .eq('fidele_id', data.fidele_id)
      .eq('departement_id', data.departement_id)
      .eq('niveau', data.niveau)

    if (data.niveau === 'conference') {
      query = query.eq('conference_id', data.conference_id)
    } else if (data.niveau === 'district') {
      query = query.eq('district_id', data.district_id)
    } else if (data.niveau === 'paroisse') {
      query = query.eq('paroisse_id', data.paroisse_id)
    }

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      if (!existing.est_actif) {
        const { error: updateError } = await supabase
          .from('chef_departement')
          .update({ est_actif: true, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (updateError) {
          return { success: false, error: updateError.message }
        }
        return { success: true, chef: { id: existing.id } }
      }
      return { success: false, error: 'Ce fidèle est déjà chef de ce département' }
    }

    // Créer le nouveau chef
    const insertData: any = {
      fidele_id: data.fidele_id,
      departement_id: data.departement_id,
      niveau: data.niveau,
      est_actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (data.niveau === 'conference') {
      insertData.conference_id = data.conference_id
    } else if (data.niveau === 'district') {
      insertData.district_id = data.district_id
    } else if (data.niveau === 'paroisse') {
      insertData.paroisse_id = data.paroisse_id
    }

    if (anneeConferenceId) {
      insertData.annee_conference_id = anneeConferenceId
    }

    const { data: newChef, error } = await supabase
      .from('chef_departement')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur création chef:', error)
      return { success: false, error: error.message }
    }

    return { success: true, chef: newChef }
  } catch (error) {
    console.error('❌ Erreur addChefDepartement:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}