
// actions/chef-district.ts

'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'
import { getDepartementUniteForParoisse } from './unite-organisation'
import { getActivitesByUnite, getActivitesStats } from './activite'
import { getUniteBudgetSummary } from './budget'
import { getPlansActionByUnite } from './plan-action'
import { getProjetsByUnite, getProjetsStats } from './projet'

export interface ChefInfo {
  id: number
  fidele_id: number
  departement_id: number
  district_id: number
  departement_nom: string
  departement_type: string
  district_nom: string
  fidele_nom: string
  fidele_prenom: string
  roles_config?: any[]
}

export interface Paroisse {
  id: number
  nom: string
  district_id: number
}

export interface DepartementDataForParoisse {
  paroisse_id: number
  paroisse_nom: string
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
    projets: any[]
    projetsStats: {
      total: number
      enCours: number
      termines: number
      parType: Record<string, number>
    }
  }
}

/**
 * Récupérer les infos du chef de district connecté
 */
export async function getChefInfo(): Promise<ChefInfo | null> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) return null

    const { data: chef, error } = await supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        departement:departement_id (id, nom, type, roles_config),
        district:district_id (id, nom),
        fidele:fidele_id (id, nom, prenom)
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('niveau', 'district')
      .eq('est_actif', true)
      .maybeSingle()

    if (error || !chef) return null

    const departement = Array.isArray(chef.departement) ? chef.departement[0] : chef.departement
    const district = Array.isArray(chef.district) ? chef.district[0] : chef.district
    const fidele = Array.isArray(chef.fidele) ? chef.fidele[0] : chef.fidele

    return {
      id: chef.id,
      fidele_id: chef.fidele_id,
      departement_id: chef.departement_id,
      district_id: chef.district_id,
      departement_nom: departement?.nom || '',
      departement_type: departement?.type || 'normal',
      district_nom: district?.nom || '',
      fidele_nom: fidele?.nom || '',
      fidele_prenom: fidele?.prenom || '',
      roles_config: departement?.roles_config || []
    }
  } catch (error) {
    console.error('Erreur getChefInfo:', error)
    return null
  }
}

/**
 * Récupérer toutes les paroisses du district
 */
export async function getParoissesByDistrict(districtId: number): Promise<Paroisse[]> {
  try {
    const { data, error } = await supabase
      .from('paroisse')
      .select('id, nom, district_id')
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
      .select('id, nom, district_id')
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
 * Récupérer les fidèles d'une paroisse pour un département
 */
async function getFidelesByParoisseAndDepartement(
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

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur getFidelesByParoisseAndDepartement:', error)
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
    console.error('Erreur getFidelesByParoisseAndDepartement:', error)
    return []
  }
}

/**
 * Récupérer les années disponibles pour une paroisse (via la conférence)
 * Retourne les IDs de annee_conference
 */
export async function getAnneesDisponiblesForParoisse(
  paroisseId: number, 
  departementId: number
): Promise<any[]> {
  try {
    console.log('📅 getAnneesDisponiblesForParoisse:', { paroisseId, departementId })
    
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

    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null
    
    if (!conference?.id) {
      console.log('⚠️ Aucune conférence trouvée')
      return []
    }

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

    return (anneesConference || []).map((ac: any) => {
      const annee = Array.isArray(ac.annee) ? ac.annee[0] : ac.annee
      return {
        id: ac.id,
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

/**
 * Récupérer les données d'un département pour une paroisse spécifique
 */
export async function getDepartementDataForParoisse(
  departementId: number,
  paroisseId: number,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse['data']> {
  console.log(`\n📋 getDepartementDataForParoisse`, { departementId, paroisseId, anneeConferenceId })
  
  try {
    if (!departementId || !paroisseId) {
      return emptyData()
    }

    const unite = await getDepartementUniteForParoisse(departementId, paroisseId)
    console.log(`  Unité: ${unite ? unite.id : 'NON TROUVÉE'}`)
    
    if (!unite || !unite.id) {
      return emptyData()
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
      getFidelesByParoisseAndDepartement(paroisseId, departementId, anneeConferenceId),
      anneeConferenceId ? getActivitesByUnite(unite.id, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getPlansActionByUnite(unite.id, anneeConferenceId) : getPlansActionByUnite(unite.id),
      anneeConferenceId ? getUniteBudgetSummary(unite.id, anneeConferenceId) : Promise.resolve(null),
      anneeConferenceId ? getActivitesStats(undefined, unite.id, anneeConferenceId) : Promise.resolve(null),
      anneeConferenceId ? getProjetsByUnite(unite.id, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getProjetsStats(unite.id, anneeConferenceId) : Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })
    ])

    console.log(`  Résultats: ${fidelesResult.length} fidèles, ${activitesResult.length} activités, ${plansResult.length} plans, ${projetsResult.length} projets`)

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
      activitesProchaines,
      projets: projetsResult,
      projetsStats: projetsStatsResult
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
    activitesProchaines: [],
    projets: [],
    projetsStats: { total: 0, enCours: 0, termines: 0, parType: {} }
  }
}

/**
 * Récupérer les données pour toutes les paroisses d'un district
 */
export async function getAllParoissesDepartementData(
  departementId: number,
  districtId: number,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse[]> {
  console.log('🚀 getAllParoissesDepartementData', { departementId, districtId, anneeConferenceId })
  
  try {
    if (!departementId || !districtId) {
      return []
    }
    
    const paroisses = await getParoissesByDistrict(districtId)
    
    if (paroisses.length === 0) {
      return []
    }
    
    const results = await Promise.all(
      paroisses.map(async (paroisse) => {
        const unite = await getDepartementUniteForParoisse(departementId, paroisse.id)
        const data = await getDepartementDataForParoisse(
          departementId,
          paroisse.id,
          anneeConferenceId
        )
        
        return {
          paroisse_id: paroisse.id,
          paroisse_nom: paroisse.nom,
          unite_id: unite?.id || null,
          data
        }
      })
    )
    
    return results
  } catch (error) {
    console.error('❌ Erreur getAllParoissesDepartementData:', error)
    return []
  }
}

/**
 * Récupérer les données d'un département pour une paroisse avec l'unité déjà fournie
 */
export async function getDepartementDataForParoisseWithUnite(
  departementId: number,
  paroisseId: number,
  uniteId: number | null,
  anneeConferenceId: number | null | undefined
): Promise<DepartementDataForParoisse['data']> {
  try {
    if (!departementId || !paroisseId || !uniteId) {
      return emptyData()
    }

    const [
      fidelesResult,
      activitesResult,
      budgetResult,
      plansResult,
      activitesStatsResult,
      projetsResult,
      projetsStatsResult
    ] = await Promise.all([
      getFidelesByParoisseAndDepartement(paroisseId, departementId, anneeConferenceId),
      anneeConferenceId ? getActivitesByUnite(uniteId, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getUniteBudgetSummary(uniteId, anneeConferenceId) : Promise.resolve(null),
      anneeConferenceId ? getPlansActionByUnite(uniteId, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getActivitesStats(undefined, uniteId, anneeConferenceId) : Promise.resolve(null),
      anneeConferenceId ? getProjetsByUnite(uniteId, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getProjetsStats(uniteId, anneeConferenceId) : Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })
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
      activitesProchaines,
      projets: projetsResult,
      projetsStats: projetsStatsResult
    }
  } catch (error) {
    console.error(`Erreur getDepartementDataForParoisseWithUnite:`, error)
    return emptyData()
  }
}

// ============================================================
// FONCTIONS POUR LA VUE LECTURE SEULE CHEF DISTRICT
// ============================================================

/**
 * Récupérer toutes les paroisses d'un district avec les données du département
 */
export async function getAllParoissesWithData(
  departementId: number,
  districtId: number,
  anneeConferenceId: number | null | undefined
): Promise<{
  paroisse_id: number
  paroisse_nom: string
  unite_id: number | null
  unite_nom: string | null
  data: DepartementDataForParoisse['data']
}[]> {
  try {
    const { data: paroisses, error: paroissesError } = await supabase
      .from('paroisse')
      .select('id, nom')
      .eq('district_id', districtId)
      .order('nom')

    if (paroissesError || !paroisses || paroisses.length === 0) {
      return []
    }

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

    const result = await Promise.all(
      paroisses.map(async (paroisse) => {
        const unite = unitesMap.get(paroisse.id)
        const data = await getDepartementDataForParoisse(
          departementId,
          paroisse.id,
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
    console.error('❌ Erreur getAllParoissesWithData:', error)
    return []
  }
}

/**
 * Récupérer les années disponibles pour le district du chef
 */
export async function getAnneesForChefDistrict(districtId: number, departementId: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('annee_district')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('district_id', districtId)
      .eq('departement_id', departementId)
      .order('annee_id', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => {
      const annee = Array.isArray(item.annee) ? item.annee[0] : item.annee
      return {
        id: item.annee_id,
        label: annee?.label || '',
        is_current: item.is_current,
        annee_district_id: item.id
      }
    })
  } catch (error) {
    console.error('❌ Erreur getAnneesForChefDistrict:', error)
    return []
  }
}

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


// actions/chef-district.ts
// Ajouter après les imports existants

/**
 * Helper: Récupérer l'ID de l'année en cours pour un district
 */
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



// actions/chef-district.ts
// Ajouter à la fin du fichier

// ============================================================
// FONCTIONS DE GESTION DES CHEFS DE DISTRICT
// ============================================================

/**
 * Ajouter un chef de département au niveau district
 * AVEC annee_conference_id automatique
 */
export async function addChefDistrict(data: {
  fidele_id: number
  departement_id: number
  district_id: number
}): Promise<{ success: boolean; error?: string; chef?: any }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // Récupérer l'année en cours pour ce district
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(data.district_id)
    console.log('📅 annee_conference_id pour chef district:', anneeConferenceId)

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

    // Vérifier si le département existe
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('id')
      .eq('id', data.departement_id)
      .single()

    if (deptError || !departement) {
      return { success: false, error: 'Département introuvable' }
    }

    // Vérifier si le chef existe déjà pour cette année
    let query = supabase
      .from('chef_departement')
      .select('id, est_actif')
      .eq('fidele_id', data.fidele_id)
      .eq('departement_id', data.departement_id)
      .eq('district_id', data.district_id)
      .eq('niveau', 'district')

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: existing, error: existingError } = await query.maybeSingle()

    if (existingError) {
      console.error('❌ Erreur vérification existant:', existingError)
      return { success: false, error: 'Erreur lors de la vérification' }
    }

    if (existing) {
      if (!existing.est_actif) {
        // Réactiver le chef
        console.log('🔄 Réactivation du chef existant')
        const { data: updated, error: updateError } = await supabase
          .from('chef_departement')
          .update({ 
            est_actif: true, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Erreur réactivation:', updateError)
          return { success: false, error: updateError.message }
        }

        console.log('✅ Chef réactivé avec succès')
        return { success: true, chef: updated }
      }
      
      console.log('❌ Fidèle déjà chef actif pour cette année')
      return { success: false, error: 'Ce fidèle est déjà chef de ce département pour ce district' }
    }

    // Créer le nouveau chef avec annee_conference_id
    console.log('➕ Création nouveau chef district...')
    
    const insertData: any = {
      fidele_id: data.fidele_id,
      departement_id: data.departement_id,
      district_id: data.district_id,
      niveau: 'district',
      est_actif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (anneeConferenceId) {
      insertData.annee_conference_id = anneeConferenceId
    }

    const { data: newChef, error } = await supabase
      .from('chef_departement')
      .insert([insertData])
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        niveau,
        est_actif,
        annee_conference_id,
        created_at,
        fidele:fidele_id (id, nom, prenom),
        departement:departement_id (id, nom, type)
      `)
      .single()

    if (error) {
      console.error('❌ Erreur création chef:', error)
      return { success: false, error: error.message }
    }

    // Formater la réponse
    const departementData = Array.isArray(newChef.departement) 
      ? newChef.departement[0] 
      : newChef.departement
    const fideleData = Array.isArray(newChef.fidele) 
      ? newChef.fidele[0] 
      : newChef.fidele

    const formattedChef = {
      ...newChef,
      departement: departementData,
      fidele: fideleData
    }

    console.log('✅ Chef créé avec succès:', formattedChef)
    return { success: true, chef: formattedChef }
  } catch (error) {
    console.error('❌ Erreur addChefDistrict:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Mettre à jour le statut d'un chef de district (actif/inactif)
 */
export async function toggleChefDistrictActif(
  chefId: number,
  estActif: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    const { error } = await supabase
      .from('chef_departement')
      .update({ 
        est_actif: estActif,
        updated_at: new Date().toISOString()
      })
      .eq('id', chefId)
      .eq('niveau', 'district')

    if (error) {
      console.error('❌ Erreur mise à jour chef:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('❌ Erreur toggleChefDistrictActif:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Récupérer tous les chefs d'un district (pour un département spécifique ou tous)
 */
export async function getChefsByDistrict(
  districtId: number,
  departementId?: number
): Promise<any[]> {
  try {
    let query = supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        niveau,
        est_actif,
        annee_conference_id,
        created_at,
        fidele:fidele_id (id, nom, prenom, contact),
        departement:departement_id (id, nom, type, roles_config),
        annee_conference:annee_conference_id (id, annee_id, is_current)
      `)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .order('created_at', { ascending: false })

    if (departementId) {
      query = query.eq('departement_id', departementId)
    }

    const { data, error } = await query

    if (error) {
      console.error('❌ Erreur récupération chefs:', error)
      return []
    }

    return (data || []).map((chef: any) => {
      const departement = Array.isArray(chef.departement) 
        ? chef.departement[0] 
        : chef.departement
      const fidele = Array.isArray(chef.fidele) 
        ? chef.fidele[0] 
        : chef.fidele
      const anneeConference = Array.isArray(chef.annee_conference) 
        ? chef.annee_conference[0] 
        : chef.annee_conference

      return {
        ...chef,
        departement,
        fidele,
        annee_conference: anneeConference
      }
    })
  } catch (error) {
    console.error('❌ Erreur getChefsByDistrict:', error)
    return []
  }
}

/**
 * Récupérer les chefs d'un district pour l'année en cours
 */
export async function getCurrentChefsByDistrict(
  districtId: number,
  departementId?: number
): Promise<any[]> {
  try {
    // Récupérer l'année en cours
    const anneeConferenceId = await getCurrentAnneeConferenceIdForDistrict(districtId)

    let query = supabase
      .from('chef_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        district_id,
        niveau,
        est_actif,
        annee_conference_id,
        created_at,
        fidele:fidele_id (id, nom, prenom, contact),
        departement:departement_id (id, nom, type, roles_config)
      `)
      .eq('district_id', districtId)
      .eq('niveau', 'district')
      .eq('est_actif', true)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    if (departementId) {
      query = query.eq('departement_id', departementId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur récupération chefs actuels:', error)
      return []
    }

    return (data || []).map((chef: any) => {
      const departement = Array.isArray(chef.departement) 
        ? chef.departement[0] 
        : chef.departement
      const fidele = Array.isArray(chef.fidele) 
        ? chef.fidele[0] 
        : chef.fidele

      return {
        ...chef,
        departement,
        fidele
      }
    })
  } catch (error) {
    console.error('❌ Erreur getCurrentChefsByDistrict:', error)
    return []
  }
}