// actions/cabinet-pastoral.ts
'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from './auth'
import { getFidelesByParoisseAndAnnee } from './fidele'
import { getActivitesByUnite, getActivitesStats } from './activite'
import { getPlansActionByUnite } from './plan-action'
import { getUniteBudgetSummary } from './budget'
import { getProjetsByUnite, getProjetsStats } from './projet'


// actions/cabinet-pastoral.ts - en haut du fichier

export interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  sexe: string
  actif: boolean
  paroisse_id: number
  email?: string | null
  date_naissance?: string | null
  adresse?: string | null
}

export interface CabinetInfo {
  id: number
  fidele_id: number
  paroisse_id: number
  role_id: number | null
  role_nom: string | null
  role_label: string | null
  est_actif: boolean
  created_at: string
  fidele_nom: string
  fidele_prenom: string
  paroisse_nom: string
}

export interface CabinetMembre {
  id: number
  fidele_id: number
  paroisse_id: number
  role_id: number | null
  role_nom: string | null
  role_label: string | null
  est_actif: boolean
  fidele_nom: string
  fidele_prenom: string
  fidele_contact: string | null
  fidele_profile_img?: string | null
}

export interface CabinetData {
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

// ============================================
// FONCTIONS DE RÉCUPÉRATION
// ============================================

/**
 * Récupérer les infos du membre du cabinet pastoral connecté
 */
export async function getCabinetInfo(): Promise<CabinetInfo | null> {
  try {
    const user = await getUser()
    if (!user) {
      console.log('❌ getCabinetInfo - Utilisateur non connecté')
      return null
    }

    if (!user.fidele_id) {
      console.log('❌ getCabinetInfo - Utilisateur sans fidele_id')
      return null
    }

    const { data: membre, error } = await supabase
      .from('cabinet_pastoral')
      .select(`
        id,
        fidele_id,
        paroisse_id,
        role_id,
        est_actif,
        created_at,
        paroisse:paroisse_id (id, nom),
        fidele:fidele_id (id, nom, prenom),
        role:role_id (id, nom_role, label_role)
      `)
      .eq('fidele_id', user.fidele_id)
      .eq('est_actif', true)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur getCabinetInfo:', error)
      return null
    }

    if (!membre) {
      console.log('❌ getCabinetInfo - Non membre du cabinet')
      return null
    }

    const paroisse = Array.isArray(membre.paroisse) ? membre.paroisse[0] : membre.paroisse
    const fidele = Array.isArray(membre.fidele) ? membre.fidele[0] : membre.fidele
    const role = Array.isArray(membre.role) ? membre.role[0] : membre.role

    return {
      id: membre.id,
      fidele_id: membre.fidele_id,
      paroisse_id: membre.paroisse_id,
      role_id: membre.role_id,
      role_nom: role?.nom_role || null,
      role_label: role?.label_role || null,
      est_actif: membre.est_actif,
      created_at: membre.created_at,
      fidele_nom: fidele?.nom || '',
      fidele_prenom: fidele?.prenom || '',
      paroisse_nom: paroisse?.nom || ''
    }
  } catch (error) {
    console.error('❌ Erreur getCabinetInfo:', error)
    return null
  }
}

/**
 * Récupérer tous les membres du cabinet pastoral d'une paroisse
 */
// export async function getMembresCabinet(paroisseId: number): Promise<CabinetMembre[]> {
//   try {
//     const { data, error } = await supabase
//       .from('cabinet_pastoral')
//       .select(`
//         id,
//         fidele_id,
//         paroisse_id,
//         role_id,
//         est_actif,
//         fidele:fidele_id (id, nom, prenom, contact),
//         role:role_id (id, nom_role, label_role)
//       `)
//       .eq('paroisse_id', paroisseId)
//       .order('est_actif', { ascending: false })

//     if (error) {
//       console.error('Erreur getMembresCabinet:', error)
//       return []
//     }

//     return (data || []).map((membre: any) => {
//       const fidele = Array.isArray(membre.fidele) ? membre.fidele[0] : membre.fidele
//       const role = Array.isArray(membre.role) ? membre.role[0] : membre.role

//       return {
//         id: membre.id,
//         fidele_id: membre.fidele_id,
//         paroisse_id: membre.paroisse_id,
//         role_id: membre.role_id,
//         role_nom: role?.nom_role || null,
//         role_label: role?.label_role || null,
//         est_actif: membre.est_actif,
//         fidele_nom: fidele?.nom || '',
//         fidele_prenom: fidele?.prenom || '',
//         fidele_contact: fidele?.contact || null
//       }
//     })
//   } catch (error) {
//     console.error('Erreur getMembresCabinet:', error)
//     return []
//   }
// }


/**
 * Récupérer l'unité du cabinet pastoral pour une paroisse
 */
async function getCabinetUniteForParoisse(paroisseId: number): Promise<{ id: number } | null> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'cabinet_pastoral')
      .eq('reference_id', paroisseId)
      .eq('niveau', 'cabinet')
      .maybeSingle()

    if (error) {
      console.error('Erreur getCabinetUniteForParoisse:', error)
      return null
    }

    return data ? { id: data.id } : null
  } catch (error) {
    console.error('Erreur getCabinetUniteForParoisse:', error)
    return null
  }
}

function emptyCabinetData() {
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
 * Récupérer les données complètes du cabinet pastoral d'une paroisse
 */
export async function getCabinetDataForParoisse(
  paroisseId: number,
  anneeConferenceId: number | null | undefined
): Promise<CabinetData['data']> {
  try {
    if (!paroisseId) {
      return emptyCabinetData()
    }

    const unite = await getCabinetUniteForParoisse(paroisseId)
    
    if (!unite || !unite.id) {
      return emptyCabinetData()
    }

    const [
      membres,
      activitesResult,
      plansResult,
      budgetResult,
      activitesStatsResult,
      projetsResult,
      projetsStatsResult
    ] = await Promise.all([
      getMembresCabinet(paroisseId, anneeConferenceId),
      anneeConferenceId ? getActivitesByUnite(unite.id, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getPlansActionByUnite(unite.id, anneeConferenceId) : getPlansActionByUnite(unite.id),
      anneeConferenceId ? getUniteBudgetSummary(unite.id, anneeConferenceId) : Promise.resolve(null),
      anneeConferenceId ? getActivitesStats(undefined, unite.id, anneeConferenceId) : Promise.resolve(null),
      anneeConferenceId ? getProjetsByUnite(unite.id, anneeConferenceId) : Promise.resolve([]),
      anneeConferenceId ? getProjetsStats(unite.id, anneeConferenceId) : Promise.resolve({ total: 0, enCours: 0, termines: 0, parType: {} })
    ])

    const activitesRecentes = (activitesResult || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
    
    const activitesProchaines = (activitesResult || [])
      .filter(a => new Date(a.date) >= new Date() && a.statut !== 'termine' && a.statut !== 'annule')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5)

    const totalFideles = membres.length
    const actifs = membres.filter(m => m.est_actif).length

    return {
      fideles: membres,
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
    console.error('Erreur getCabinetDataForParoisse:', error)
    return emptyCabinetData()
  }
}

/**
 * Récupérer les rôles disponibles pour le cabinet pastoral
 */
export async function getRolesCabinet(): Promise<any[]> {
  try {
    console.log('🔍 getRolesCabinet - Récupération des rôles paroisse')
    
    const { data, error } = await supabase
      .from('role_config')
      .select('*')
      .eq('type_role', 'paroisse')
      .order('nom_role')

    if (error) {
      console.error('❌ Erreur getRolesCabinet:', error)
      return []
    }

    // Si aucun rôle n'existe, en créer par défaut
    if (!data || data.length === 0) {
      console.log('📝 Création des rôles par défaut pour le cabinet...')
      
      const rolesDefaut = [
        { type_role: 'paroisse', nom_role: 'president_cabinet', label_role: 'Président du Cabinet' },
        { type_role: 'paroisse', nom_role: 'vice_president_cabinet', label_role: 'Vice-Président du Cabinet' },
        { type_role: 'paroisse', nom_role: 'secretaire_cabinet', label_role: 'Secrétaire du Cabinet' },
        { type_role: 'paroisse', nom_role: 'secretaire_adjoint_cabinet', label_role: 'Secrétaire Adjoint du Cabinet' },
        { type_role: 'paroisse', nom_role: 'tresorier_cabinet', label_role: 'Trésorier du Cabinet' },
        { type_role: 'paroisse', nom_role: 'tresorier_adjoint_cabinet', label_role: 'Trésorier Adjoint du Cabinet' },
        { type_role: 'paroisse', nom_role: 'conseiller_cabinet', label_role: 'Conseiller du Cabinet' },
        { type_role: 'paroisse', nom_role: 'charge_communication_cabinet', label_role: 'Chargé de Communication' },
        { type_role: 'paroisse', nom_role: 'charge_protocole_cabinet', label_role: 'Chargé du Protocole' }
      ]
      
      for (const role of rolesDefaut) {
        await supabase.from('role_config').insert(role)
      }
      
      const { data: newData } = await supabase
        .from('role_config')
        .select('*')
        .eq('type_role', 'paroisse')
        .order('nom_role')
      
      console.log(`✅ ${newData?.length || 0} rôles disponibles après création`)
      return newData || []
    }

    console.log(`✅ ${data.length} rôles disponibles`)
    return data
  } catch (error) {
    console.error('❌ Erreur getRolesCabinet:', error)
    return []
  }
}

/**
 * Récupérer les années disponibles pour le cabinet
 */
export async function getAnneesForCabinet(paroisseId: number): Promise<any[]> {
  try {
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
      return []
    }

    const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
    const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null
    
    if (!conference?.id) {
      return []
    }

    const { data: anneesConference } = await supabase
      .from('annee_conference')
      .select(`
        id,
        annee_id,
        is_current,
        annee:annee_id (id, label)
      `)
      .eq('conference_id', conference.id)
      .order('annee_id', { ascending: false })

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
    console.error('Erreur getAnneesForCabinet:', error)
    return []
  }
}

// ============================================
// FONCTIONS DE GESTION DES MEMBRES
// ============================================

/**
 * Ajouter un membre au cabinet pastoral
 */


/**
 * Mettre à jour le rôle d'un membre
 */
export async function updateMembreRole(
  membreId: number,
  roleId: number | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    const { error } = await supabase
      .from('cabinet_pastoral')
      .update({ 
        role_id: roleId,
        updated_at: new Date().toISOString()
      })
      .eq('id', membreId)

    if (error) {
      console.error('Erreur mise à jour rôle:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur updateMembreRole:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Désactiver/Activer un membre
 */
export async function toggleMembreActif(
  membreId: number,
  estActif: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    const { error } = await supabase
      .from('cabinet_pastoral')
      .update({ 
        est_actif: estActif,
        updated_at: new Date().toISOString()
      })
      .eq('id', membreId)

    if (error) {
      console.error('Erreur toggle membre:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Erreur toggleMembreActif:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}

/**
 * Ajouter un rôle pour le cabinet pastoral
 */
export async function ajouterRoleCabinet(formData: FormData): Promise<{ success?: boolean; role?: any; error?: string }> {
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

// ============================================
// FONCTIONS D'UNITÉ D'ORGANISATION
// ============================================

/**
 * S'assure que l'unité du cabinet pastoral existe pour une paroisse
 */
export async function ensureCabinetUniteExists(paroisseId: number): Promise<{ success: boolean; unite: { id: number } | null; error?: string }> {
  try {
    const existing = await getCabinetUniteForParoisse(paroisseId)
    if (existing) {
      return { success: true, unite: existing }
    }

    const { data: paroisse, error: paroisseError } = await supabase
      .from('paroisse')
      .select('nom')
      .eq('id', paroisseId)
      .single()

    if (paroisseError || !paroisse) {
      return { success: false, error: 'Paroisse introuvable', unite: null }
    }

    const { data: unite, error: createError } = await supabase
      .from('unite_organisation')
      .insert([{
        nom: `Cabinet Pastoral - ${paroisse.nom}`,
        niveau: 'cabinet',
        parent_id: null,
        reference_id: paroisseId,
        reference_table: 'cabinet_pastoral',
        id_niveau: paroisseId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('id')
      .single()

    if (createError) {
      console.error('Erreur création unité:', createError)
      return { success: false, error: 'Impossible de créer l\'unité', unite: null }
    }

    return { success: true, unite: { id: unite.id } }
  } catch (error) {
    console.error('Erreur ensureCabinetUniteExists:', error)
    return { success: false, error: 'Une erreur est survenue', unite: null }
  }
}

/**
 * Initialise l'unité du cabinet pastoral pour l'utilisateur connecté
 */
export async function initCabinetUniteForUser(): Promise<{ success: boolean; uniteId?: number; error?: string }> {
  try {
    const user = await getUser()
    
    if (!user?.fidele_id) {
      return { success: false, error: 'Utilisateur non connecté ou sans fidèle associé' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele?.paroisse_id) {
      return { success: false, error: 'Paroisse non trouvée' }
    }

    const { data: membre } = await supabase
      .from('cabinet_pastoral')
      .select('id')
      .eq('fidele_id', user.fidele_id)
      .eq('est_actif', true)
      .maybeSingle()

    if (!membre) {
      return { success: false, error: 'Vous n\'êtes pas membre du cabinet pastoral' }
    }

    const result = await ensureCabinetUniteExists(fidele.paroisse_id)
    
    if (result.success && result.unite) {
      return { success: true, uniteId: result.unite.id }
    }

    return result
  } catch (error) {
    console.error('Erreur initCabinetUniteForUser:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}
/**
 * Récupérer les fidèles d'une paroisse pour l'année de conférence spécifiée
 * Utilise fidele_paroisse comme dans la page /fideles
 */
// export async function getFidelesByParoisse(paroisseId: number, anneeConferenceId?: number): Promise<any[]> {
//   try {
//     console.log('🔍 getFidelesByParoisse - paroisseId:', paroisseId, 'anneeConferenceId:', anneeConferenceId)
    
//     // Si aucune année n'est fournie, on ne peut pas utiliser fidele_paroisse
//     // Dans ce cas, on récupère directement les fidèles de la paroisse
//     if (!anneeConferenceId) {
//       console.log('⚠️ Aucune année fournie, récupération directe par paroisse_id')
//       const { data, error } = await supabase
//         .from('fidele')
//         .select(`
//           id,
//           nom,
//           post_nom,
//           prenom,
//           contact,
//           adresse,
//           sexe,
//           annee_naissance,
//           actif,
//           paroisse_id,
//           profile_img,
//           created_at,
//           paroisse:paroisse_id (id, nom)
//         `)
//         .eq('paroisse_id', paroisseId)
//         .eq('actif', true)
//         .order('nom', { ascending: true })

//       if (error) {
//         console.error('❌ Erreur:', error)
//         return []
//       }

//       return (data || []).map((f: any) => ({
//         ...f,
//         paroisse: f.paroisse ? (Array.isArray(f.paroisse) ? f.paroisse[0] : f.paroisse) : null,
//         inscription_annee_conference: null,
//         date_inscription_paroisse: null
//       }))
//     }

//     // Récupérer les fidèles via fidele_paroisse pour l'année de conférence spécifiée
//     const { data: fideleParoisse, error } = await supabase
//       .from('fidele_paroisse')
//       .select(`
//         fidele_id,
//         annee_conference_id,
//         created_at,
//         fidele:fidele_id (
//           id,
//           nom,
//           post_nom,
//           prenom,
//           contact,
//           adresse,
//           sexe,
//           annee_naissance,
//           actif,
//           paroisse_id,
//           profile_img,
//           created_at,
//           paroisse:paroisse_id (id, nom),
//           compte:compte!left (
//             id,
//             role_id,
//             role:role_id (
//               id,
//               nom,
//               niveau
//             )
//           )
//         )
//       `)
//       .eq('paroisse_id', paroisseId)
//       .eq('annee_conference_id', anneeConferenceId)
//       .order('created_at', { ascending: false })

//     if (error) {
//       console.error('❌ Erreur getFidelesByParoisse:', error)
//       return []
//     }

//     // Transformer les données
//     const fideles = (fideleParoisse || [])
//       .map(item => {
//         const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
//         if (!fidele) return null
        
//         let compte = null
//         if (fidele.compte) {
//           compte = Array.isArray(fidele.compte) ? fidele.compte[0] : fidele.compte
//         }
        
//         let paroisse = null
//         if (fidele.paroisse) {
//           paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
//         }
        
//         return {
//           ...fidele,
//           compte,
//           paroisse,
//           inscription_annee_conference: item.annee_conference_id,
//           date_inscription_paroisse: item.created_at
//         }
//       })
//       .filter(Boolean)

//     console.log(`✅ ${fideles.length} fidèles trouvés via fidele_paroisse`)
//     return fideles
//   } catch (error) {
//     console.error('❌ Erreur getFidelesByParoisse:', error)
//     return []
//   }
// }



// actions/cabinet-pastoral.ts

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








// actions/cabinet-pastoral.ts

// 1. CORRECTION de getMembresCabinet - Ajouter le filtre par année
export async function getMembresCabinet(
  paroisseId: number, 
  anneeConferenceId?: number | null
): Promise<CabinetMembre[]> {
  try {
    let query = supabase
      .from('cabinet_pastoral')
      .select(`
        id,
        fidele_id,
        paroisse_id,
        role_id,
        est_actif,
        annee_conference_id,
        fidele:fidele_id (id, nom, prenom, contact,profile_img),
        role:role_id (id, nom_role, label_role)
      `)
      .eq('paroisse_id', paroisseId)
    
    // 🔥 AJOUT DU FILTRE PAR ANNÉE
    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query.order('est_actif', { ascending: false })

    if (error) {
      console.error('Erreur getMembresCabinet:', error)
      return []
    }

    return (data || []).map((membre: any) => {
      const fidele = Array.isArray(membre.fidele) ? membre.fidele[0] : membre.fidele
      const role = Array.isArray(membre.role) ? membre.role[0] : membre.role

      return {
        id: membre.id,
        fidele_id: membre.fidele_id,
        paroisse_id: membre.paroisse_id,
        role_id: membre.role_id,
        role_nom: role?.nom_role || null,
        role_label: role?.label_role || null,
        est_actif: membre.est_actif,
        fidele_nom: fidele?.nom || '',
        fidele_prenom: fidele?.prenom || '',
        fidele_contact: fidele?.contact || null,
         fidele_profile_img: fidele?.profile_img || null,
        annee_conference_id: membre.annee_conference_id
      }
    })
  } catch (error) {
    console.error('Erreur getMembresCabinet:', error)
    return []
  }
}

// 2. CORRECTION de getFidelesByParoisse - Simplifier et fiabiliser
// export async function getFidelesByParoisse(
//   paroisseId: number, 
//   anneeConferenceId?: number | null
// ): Promise<any[]> {
//   try {
//     console.log('🔍 getFidelesByParoisse - paroisseId:', paroisseId, 'anneeConferenceId:', anneeConferenceId)
    
//     // 🔥 Si pas d'année, on retourne un tableau vide car on veut les fidèles pour une année spécifique
//     if (!anneeConferenceId) {
//       console.log('⚠️ Aucune année fournie - retour vide')
//       return []
//     }

//     // Récupérer les fidèles via fidele_paroisse pour l'année spécifiée
//     const { data: fideleParoisse, error } = await supabase
//       .from('fidele_paroisse')
//       .select(`
//         fidele_id,
//         annee_conference_id,
//         created_at,
//         fidele:fidele_id (
//           id,
//           nom,
//           post_nom,
//           prenom,
//           contact,
//           adresse,
//           sexe,
//           annee_naissance,
//           actif,
//           paroisse_id,
//           profile_img,
//           created_at,
//           paroisse:paroisse_id (id, nom)
//         )
//       `)
//       .eq('paroisse_id', paroisseId)
//       .eq('annee_conference_id', anneeConferenceId)
//       .order('created_at', { ascending: false })

//     if (error) {
//       console.error('❌ Erreur getFidelesByParoisse:', error)
//       return []
//     }

//     // Transformer les données
//     const fideles = (fideleParoisse || [])
//       .map(item => {
//         const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
//         if (!fidele) return null
        
//         let paroisse = null
//         if (fidele.paroisse) {
//           paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
//         }
        
//         return {
//           ...fidele,
//           paroisse,
//           inscription_annee_conference: item.annee_conference_id,
//           date_inscription_paroisse: item.created_at
//         }
//       })
//       .filter(Boolean)

//     console.log(`✅ ${fideles.length} fidèles trouvés pour l'année ${anneeConferenceId}`)
//     return fideles
//   } catch (error) {
//     console.error('❌ Erreur getFidelesByParoisse:', error)
//     return []
//   }
// }

// 3. CORRECTION de addMembreCabinet - S'assurer que l'année est toujours définie
export async function addMembreCabinet(
  paroisseId: number,
  fideleId: number,
  roleId: number | null
): Promise<{ success: boolean; error?: string; membre?: any }> {
  try {
    console.log('🔐 addMembreCabinet - Début', { paroisseId, fideleId, roleId })
    
    const user = await getUser()
    console.log('👤 Utilisateur:', user?.id, user?.nom_complet)
    
    if (!user) {
      console.log('❌ Utilisateur non connecté')
      return { success: false, error: 'Utilisateur non connecté' }
    }

    // 🔥 Récupérer OBLIGATOIREMENT l'année en cours
    const anneeConferenceId = await getCurrentAnneeConferenceIdForParoisse(paroisseId)
    console.log('📅 annee_conference_id:', anneeConferenceId)
    
    if (!anneeConferenceId) {
      console.log('❌ Impossible de déterminer l\'année en cours')
      return { success: false, error: 'Année de conférence non trouvée' }
    }

    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select('id, paroisse_id, nom, prenom')
      .eq('id', fideleId)
      .single()

    console.log('👤 Fidèle trouvé:', fidele)

    if (fideleError || !fidele) {
      console.log('❌ Fidèle non trouvé:', fideleError)
      return { success: false, error: 'Fidèle non trouvé' }
    }

    if (fidele.paroisse_id !== paroisseId) {
      console.log('❌ Fidèle d\'une autre paroisse:', fidele.paroisse_id, '!==', paroisseId)
      return { success: false, error: 'Ce fidèle n\'appartient pas à cette paroisse' }
    }

    // 🔥 Vérifier si le membre existe pour CETTE ANNÉE
    const { data: existing, error: existingError } = await supabase
      .from('cabinet_pastoral')
      .select('id, est_actif')
      .eq('fidele_id', fideleId)
      .eq('paroisse_id', paroisseId)
      .eq('annee_conference_id', anneeConferenceId)
      .maybeSingle()

    console.log('📋 Membre existant pour cette année:', existing)

    if (existingError) {
      console.log('❌ Erreur vérification existant:', existingError)
      return { success: false, error: 'Erreur lors de la vérification' }
    }

    if (existing) {
      if (!existing.est_actif) {
        console.log('🔄 Réactivation du membre existant')
        const { error: updateError } = await supabase
          .from('cabinet_pastoral')
          .update({ 
            est_actif: true,
            role_id: roleId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.log('❌ Erreur réactivation:', updateError)
          return { success: false, error: updateError.message }
        }

        console.log('✅ Membre réactivé avec succès')
        return { success: true, membre: { id: existing.id } }
      }
      
      console.log('❌ Fidèle déjà membre actif cette année')
      return { success: false, error: 'Ce fidèle est déjà membre actif du cabinet pour cette année' }
    }

    console.log('➕ Création nouveau membre...')
    
    // 🔥 Insérer avec l'année OBLIGATOIREMENT
    const { data: newMembre, error } = await supabase
      .from('cabinet_pastoral')
      .insert([{
        fidele_id: fideleId,
        paroisse_id: paroisseId,
        role_id: roleId,
        est_actif: true,
        annee_conference_id: anneeConferenceId, // 🔥 TOUJOURS DÉFINI
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.log('❌ Erreur création:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Membre créé avec succès:', newMembre)
    return { success: true, membre: newMembre }
  } catch (error) {
    console.error('❌ Erreur addMembreCabinet:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}




// actions/cabinet-pastoral.ts

// Importez ces fonctions en haut du fichier (si elles n'y sont pas déjà)
import { getCurrentAnneeConference, getConferenceIdByParoisse } from './annee-conference'








//s imports ...

// La fonction getFidelesByParoisse dans cabinet-pastoral.ts
export async function getFidelesByParoisse(paroisseId: number): Promise<Fidele[]> {
  try {
    // 1. Récupérer l'ID de la conférence
    const conferenceId = await getConferenceIdByParoisse(paroisseId)
    
    if (!conferenceId) {
      console.error('Aucune conférence trouvée pour la paroisse', paroisseId)
      return []
    }
    
    // 2. Récupérer l'année de conférence en cours
    const currentAnneeConf = await getCurrentAnneeConference(conferenceId)
    
    if (!currentAnneeConf) {
      console.error('Aucune année de conférence en cours trouvée')
      return []
    }
    
    // 3. Utiliser la fonction qui filtre par paroisse ET année
    const fideles = await getFidelesByParoisseAndAnnee(paroisseId, currentAnneeConf.id)
    
    // 4. Retourner les données formatées
    return fideles.map((f: any) => ({
      id: f.id,
      nom: f.nom,
      post_nom: f.post_nom,
      prenom: f.prenom,
      contact: f.contact,
      sexe: f.sexe,
      actif: f.actif,
      paroisse_id: f.paroisse_id,
      email: f.email,
      date_naissance: f.date_naissance,
      adresse: f.adresse
    }))
  } catch (error) {
    console.error('Erreur dans getFidelesByParoisse:', error)
    return []
  }
}