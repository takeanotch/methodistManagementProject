
// actions/unite-organisation.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface UniteOrganisation {
  id: number
  nom: string
  niveau: 'region' | 'conference' | 'district' | 'paroisse' | 'departement'
  parent_id: number | null
  reference_id: number
  reference_table: string
  id_niveau: number  // Nouveau champ: ID de l'entité parente (paroisse_id, district_id, etc.)
  created_at: string
  updated_at: string
}

/**
 * Vérifie si une unité existe déjà
 */
async function uniteExistsForReference(
  referenceTable: string,
  referenceId: number,
  idNiveau?: number
): Promise<boolean> {
  let query = supabase
    .from('unite_organisation')
    .select('*', { count: 'exact', head: true })
    .eq('reference_table', referenceTable)
    .eq('reference_id', referenceId)
  
  if (idNiveau) {
    query = query.eq('id_niveau', idNiveau)
  }
  
  const { count, error } = await query
  
  if (error) {
    console.error('Erreur vérification existence:', error)
    return false
  }
  
  return count !== null && count > 0
}
/**
 * Vérifie si les unités d'organisation existent et les crée si nécessaire
 * Fonction à appeler lors de la connexion de l'utilisateur
 */
export async function ensureUserUniteOrganisation(userId: string): Promise<boolean> {
  try {
    // Récupérer le fidèle et sa paroisse avec toutes les relations
    const { data: fidele } = await supabase
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
            nom,
            conference_id,
            conference:conference_id (
              id,
              nom,
              region_id,
              region:region_id (
                id,
                nom
              )
            )
          )
        )
      `)
      .eq('id', userId)
      .single()

    if (!fidele?.paroisse_id) {
      console.error('Fidèle sans paroisse')
      return false
    }

    // Traiter les relations qui peuvent être des tableaux
    const paroisseData = fidele.paroisse
    const paroisse = Array.isArray(paroisseData) ? paroisseData[0] : paroisseData
    
    if (!paroisse) return false

    const districtData = paroisse.district
    const district = Array.isArray(districtData) ? districtData[0] : districtData
    
    const conferenceData = district?.conference
    const conference = Array.isArray(conferenceData) ? conferenceData[0] : conferenceData
    
    const regionData = conference?.region
    const region = Array.isArray(regionData) ? regionData[0] : regionData

    // 1. Créer la région si elle existe
    let regionUnite: UniteOrganisation | null = null
    if (region) {
      regionUnite = await syncUniteOrganisation(
        'region',
        region.id,
        'region',
        region.nom,
        null,
        0  // id_niveau = 0 pour les régions (pas de parent)
      )
    }

    // 2. Créer la conférence
    let conferenceUnite: UniteOrganisation | null = null
    if (conference) {
      conferenceUnite = await syncUniteOrganisation(
        'conference',
        conference.id,
        'conference',
        conference.nom,
        regionUnite?.id || null,
        0  // id_niveau = 0 pour les conférences
      )
    }

    // 3. Créer le district
    let districtUnite: UniteOrganisation | null = null
    if (district) {
      districtUnite = await syncUniteOrganisation(
        'district',
        district.id,
        'district',
        district.nom,
        conferenceUnite?.id || null,
        0  // id_niveau = 0 pour les districts
      )
    }

    // 4. Créer la paroisse
    let paroisseUnite: UniteOrganisation | null = null
    if (paroisse) {
      paroisseUnite = await syncUniteOrganisation(
        'paroisse',
        paroisse.id,
        'paroisse',
        paroisse.nom,
        districtUnite?.id || null,
        paroisse.id  // id_niveau = id de la paroisse pour la paroisse elle-même
      )
    }

    console.log('Unités d\'organisation synchronisées pour l\'utilisateur:', userId)
    return true
  } catch (error) {
    console.error('Erreur ensureUserUniteOrganisation:', error)
    return false
  }
}

/**
 * Récupère l'unité d'organisation d'un utilisateur connecté
 */
export async function getUserUniteOrganisation(userId: string): Promise<{
  paroisse: UniteOrganisation | null
  district: UniteOrganisation | null
  conference: UniteOrganisation | null
  region: UniteOrganisation | null
}> {
  try {
    // Récupérer le fidèle et sa paroisse
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', userId)
      .single()

    if (!fidele?.paroisse_id) {
      return { paroisse: null, district: null, conference: null, region: null }
    }

    // Récupérer l'unité de la paroisse
    const { data: paroisseUnite } = await supabase
      .from('unite_organisation')
      .select('*')
      .eq('reference_table', 'paroisse')
      .eq('reference_id', fidele.paroisse_id)
      .eq('id_niveau', fidele.paroisse_id)  // Filtrer par id_niveau
      .maybeSingle()

    if (!paroisseUnite) {
      return { paroisse: null, district: null, conference: null, region: null }
    }

    // Récupérer l'unité du district (parent de la paroisse)
    let districtUnite: UniteOrganisation | null = null
    let conferenceUnite: UniteOrganisation | null = null
    let regionUnite: UniteOrganisation | null = null

    if (paroisseUnite.parent_id) {
      const { data: district } = await supabase
        .from('unite_organisation')
        .select('*')
        .eq('id', paroisseUnite.parent_id)
        .maybeSingle()
      
      districtUnite = district || null

      // Récupérer la conférence (parent du district)
      if (districtUnite?.parent_id) {
        const { data: conference } = await supabase
          .from('unite_organisation')
          .select('*')
          .eq('id', districtUnite.parent_id)
          .maybeSingle()
        
        conferenceUnite = conference || null

        // Récupérer la région (parent de la conférence)
        if (conferenceUnite?.parent_id) {
          const { data: region } = await supabase
            .from('unite_organisation')
            .select('*')
            .eq('id', conferenceUnite.parent_id)
            .maybeSingle()
          
          regionUnite = region || null
        }
      }
    }

    return {
      paroisse: paroisseUnite,
      district: districtUnite,
      conference: conferenceUnite,
      region: regionUnite
    }
  } catch (error) {
    console.error('Erreur getUserUniteOrganisation:', error)
    return { paroisse: null, district: null, conference: null, region: null }
  }
}










// actions/unite-organisation.ts

/**
 * S'assure que l'unité du département existe pour une paroisse spécifique
 */
export async function ensureDepartementUniteExists(
  departementId: number,
  paroisseId: number
): Promise<{ success: boolean; unite: { id: number } | null; error?: string }> {
  try {
    console.log('ensureDepartementUniteExists:', { departementId, paroisseId })
    
    // 1. Vérifier si l'unité existe déjà pour cette paroisse
    const existing = await getDepartementUnite(departementId, paroisseId)
    if (existing) {
      console.log('Unité département déjà existante:', existing.id)
      return { success: true, unite: existing }
    }
    
    // 2. Récupérer le nom du département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('nom')
      .eq('id', departementId)
      .single()
    
    if (deptError || !departement) {
      console.error('Département introuvable:', deptError)
      return { success: false, error: 'Département introuvable', unite: null }
    }
    
    console.log('Création unité pour département:', departement.nom)
    
    // 3. Créer l'unité avec niveau = 'paroisse' et id_niveau = paroisseId
    const unite = await syncUniteOrganisation(
      'paroisse',        // niveau = paroisse (car rattaché à la paroisse)
      departementId,     // reference_id = id du département
      'departement',     // reference_table = departement
      departement.nom,   // nom = nom du département
      null,              // parent_id = null (pas de parent dans unite_organisation)
      paroisseId         // id_niveau = id de la paroisse (pour filtrer par paroisse)
    )
    
    if (!unite) {
      console.error('Impossible de créer l\'unité du département')
      return { success: false, error: 'Impossible de créer l\'unité du département', unite: null }
    }
    
    console.log('Unité département créée:', unite.id)
    return { success: true, unite: { id: unite.id } }
    
  } catch (error) {
    console.error('Erreur ensureDepartementUniteExists:', error)
    return { success: false, error: 'Une erreur est survenue', unite: null }
  }
}

/**
 * Récupère l'unité d'un département pour une paroisse spécifique
 */
export async function getDepartementUnite(
  departementId: number,
  paroisseId: number
): Promise<{ id: number } | null> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', paroisseId)  // Filtrer par paroisse
      .limit(1)
    
    if (error) {
      console.error('Erreur getDepartementUnite:', error)
      return null
    }
    
    return data && data.length > 0 ? { id: data[0].id } : null
  } catch (error) {
    console.error('Erreur getDepartementUnite:', error)
    return null
  }
}

/**
 * Crée ou met à jour une unité d'organisation
 */


export async function ensureDepartementUniteExistsForDistrict(
  departementId: number,
  districtId: number
): Promise<{ success: boolean; unite: { id: number } | null; error?: string }> {
  try {
    console.log('ensureDepartementUniteExistsForDistrict:', { departementId, districtId })
    
    // 1. Vérifier si l'unité existe déjà
    const existing = await getDepartementUniteForDistrict(departementId, districtId)
    if (existing) {
      console.log('Unité déjà existante:', existing.id)
      return { success: true, unite: existing }
    }
    
    // 2. Récupérer le nom du département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('nom')
      .eq('id', departementId)
      .single()
    
    if (deptError || !departement) {
      console.error('Département introuvable:', deptError)
      return { success: false, error: 'Département introuvable', unite: null }
    }
    
    // 3. Créer l'unité
    const unite = await syncUniteOrganisation(
      'district',           // niveau = district
      departementId,        // reference_id = id du département
      'departement',        // reference_table = departement
      departement.nom,      // nom = nom du département
      null,                 // parent_id = null
      districtId            // id_niveau = id du district
    )
    
    if (!unite) {
      return { success: false, error: 'Impossible de créer l\'unité', unite: null }
    }
    
    return { success: true, unite: { id: unite.id } }
    
  } catch (error) {
    console.error('Erreur ensureDepartementUniteExistsForDistrict:', error)
    return { success: false, error: 'Une erreur est survenue', unite: null }
  }
}

/**
 * Récupère l'unité d'un département pour un district spécifique
 */
export async function getDepartementUniteForDistrict(
  departementId: number,
  districtId: number
): Promise<{ id: number } | null> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', districtId)
      .eq('niveau', 'district')
      .maybeSingle()
    
    if (error) {
      console.error('Erreur getDepartementUniteForDistrict:', error)
      return null
    }
    
    return data ? { id: data.id } : null
  } catch (error) {
    console.error('Erreur getDepartementUniteForDistrict:', error)
    return null
  }
}
export async function ensureDepartementUniteExistsForConference(
  departementId: number,
  conferenceId: number
): Promise<{ success: boolean; unite: { id: number } | null; error?: string }> {
  try {
    console.log('ensureDepartementUniteExistsForConference:', { departementId, conferenceId })
    
    // 1. Vérifier si l'unité existe déjà
    const existing = await getDepartementUniteForConference(departementId, conferenceId)
    if (existing) {
      console.log('Unité déjà existante:', existing.id)
      return { success: true, unite: existing }
    }
    
    // 2. Récupérer le nom du département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('nom')
      .eq('id', departementId)
      .single()
    
    if (deptError || !departement) {
      console.error('Département introuvable:', deptError)
      return { success: false, error: 'Département introuvable', unite: null }
    }
    
    // 3. Récupérer le nom de la conférence
    const { data: conference, error: confError } = await supabase
      .from('conference')
      .select('nom')
      .eq('id', conferenceId)
      .single()
    
    if (confError || !conference) {
      console.error('Conférence introuvable:', confError)
      return { success: false, error: 'Conférence introuvable', unite: null }
    }
    
    // 4. Créer l'unité
    const unite = await syncUniteOrganisation(
      'conference',         // niveau = conference
      departementId,        // reference_id = id du département
      'departement',        // reference_table = departement
      `${departement.nom} - ${conference.nom}`, // nom composé
      null,                 // parent_id = null
      conferenceId          // id_niveau = id de la conférence
    )
    
    if (!unite) {
      return { success: false, error: 'Impossible de créer l\'unité', unite: null }
    }
    
    console.log('Unité conférence créée:', unite.id)
    return { success: true, unite: { id: unite.id } }
    
  } catch (error) {
    console.error('Erreur ensureDepartementUniteExistsForConference:', error)
    return { success: false, error: 'Une erreur est survenue', unite: null }
  }
}

/**
 * Récupère l'unité d'un département pour une conférence spécifique
 */
export async function getDepartementUniteForConference(
  departementId: number,
  conferenceId: number
): Promise<{ id: number } | null> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', conferenceId)
      .eq('niveau', 'conference')
      .maybeSingle()
    
    if (error) {
      console.error('Erreur getDepartementUniteForConference:', error)
      return null
    }
    
    return data ? { id: data.id } : null
  } catch (error) {
    console.error('Erreur getDepartementUniteForConference:', error)
    return null
  }
}

/**
 * Récupère l'unité d'un département pour une paroisse spécifique
 * (niveau paroisse)
 */


// export async function getDepartementUniteForParoisse(
//   departementId: number,
//   paroisseId: number
// ): Promise<{ id: number } | null> {
//   try {
//     console.log('getDepartementUniteForParoisse appelé avec:', { departementId, paroisseId })
    
//     const { data, error } = await supabase
//       .from('unite_organisation')
//       .select('id')
//       .eq('reference_table', 'departement')
//       .eq('reference_id', departementId)
//       .eq('id_niveau', paroisseId)
//       .eq('niveau', 'paroisse')
//       .limit(1)  // Limiter à 1 résultat
//       // Ne pas utiliser maybeSingle()
    
//     if (error) {
//       console.error('Erreur Supabase dans getDepartementUniteForParoisse:', error)
//       return null
//     }
    
//     // data est un tableau, prendre le premier élément s'il existe
//     return data && data.length > 0 ? { id: data[0].id } : null
//   } catch (error) {
//     console.error('Exception dans getDepartementUniteForParoisse:', error)
//     return null
//   }
// }

/**
 * S'assure que l'unité d'organisation existe pour une commission
 * Le niveau sera 'departement' car une commission est rattachée à un département
 */
export async function ensureCommissionUniteExists(
  commissionId: number,
  departementId: number,
  paroisseId: number
): Promise<{ success: boolean; unite: { id: number } | null; error?: string }> {
  try {
    console.log('ensureCommissionUniteExists:', { commissionId, departementId, paroisseId })
    
    // 1. Vérifier si l'unité existe déjà pour cette commission
    const existing = await getCommissionUnite(commissionId, paroisseId)
    if (existing) {
      console.log('Unité commission déjà existante:', existing.id)
      return { success: true, unite: existing }
    }
    
    // 2. Récupérer le nom de la commission
    const { data: commission, error: commError } = await supabase
      .from('commission')
      .select('nom')
      .eq('id', commissionId)
      .single()
    
    if (commError || !commission) {
      console.error('Commission introuvable:', commError)
      return { success: false, error: 'Commission introuvable', unite: null }
    }
    
    // 3. Récupérer le nom du département
    const { data: departement, error: deptError } = await supabase
      .from('departement')
      .select('nom')
      .eq('id', departementId)
      .single()
    
    if (deptError || !departement) {
      console.error('Département introuvable:', deptError)
      return { success: false, error: 'Département introuvable', unite: null }
    }
    
    // 4. Récupérer l'unité parente (l'unité du département pour cette paroisse)
    // Cette unité doit déjà exister (créée lors de la création du département)
    const parentUnite = await getDepartementUniteForParoisse(departementId, paroisseId)
    
    if (!parentUnite) {
      console.warn('Unité parente du département non trouvée, tentative de création...')
      // Optionnel: créer l'unité parente si elle n'existe pas
      // return { success: false, error: 'Unité parente du département introuvable', unite: null }
    }
    
    // 5. Créer l'unité pour la commission
    // Niveau = 'departement' car une commission est un sous-niveau du département
    // reference_table = 'commission'
    // id_niveau = paroisseId (pour filtrer par paroisse)
    const unite = await syncUniteOrganisation(
      'departement',        // niveau = departement (commission = sous-département)
      commissionId,         // reference_id = id de la commission
      'commission',         // reference_table = commission
      `${commission.nom} (${departement.nom})`, // nom composé pour plus de clarté
      parentUnite?.id || null, // parent_id = id de l'unité du département
      paroisseId            // id_niveau = id de la paroisse
    )
    
    if (!unite) {
      console.error('Impossible de créer l\'unité de la commission')
      return { success: false, error: 'Impossible de créer l\'unité de la commission', unite: null }
    }
    
    console.log('Unité commission créée:', unite.id)
    return { success: true, unite: { id: unite.id } }
    
  } catch (error) {
    console.error('Erreur ensureCommissionUniteExists:', error)
    return { success: false, error: 'Une erreur est survenue', unite: null }
  }
}

/**
 * Récupère l'unité d'organisation d'une commission pour une paroisse spécifique
 */
export async function getCommissionUnite(
  commissionId: number,
  paroisseId: number
): Promise<{ id: number } | null> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select('id')
      .eq('reference_table', 'commission')
      .eq('reference_id', commissionId)
      .eq('id_niveau', paroisseId)
      .eq('niveau', 'departement')
      .maybeSingle()
    
    if (error) {
      console.error('Erreur getCommissionUnite:', error)
      return null
    }
    
    return data ? { id: data.id } : null
  } catch (error) {
    console.error('Erreur getCommissionUnite:', error)
    return null
  }
}

/**
 * Récupère toutes les unités des commissions pour une paroisse donnée
 */
export async function getCommissionsUnitesForParoisse(
  paroisseId: number
): Promise<Array<{ id: number; commission_id: number; nom: string }>> {
  try {
    const { data, error } = await supabase
      .from('unite_organisation')
      .select(`
        id,
        reference_id,
        nom
      `)
      .eq('reference_table', 'commission')
      .eq('id_niveau', paroisseId)
      .eq('niveau', 'departement')
      .order('nom', { ascending: true })
    
    if (error) {
      console.error('Erreur getCommissionsUnitesForParoisse:', error)
      return []
    }
    
    return (data || []).map(item => ({
      id: item.id,
      commission_id: item.reference_id,
      nom: item.nom
    }))
  } catch (error) {
    console.error('Erreur getCommissionsUnitesForParoisse:', error)
    return []
  }
}

/**
 * Supprime l'unité d'organisation d'une commission
 * À appeler lors de la suppression d'une commission
 */
export async function deleteCommissionUnite(
  commissionId: number,
  paroisseId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('unite_organisation')
      .delete()
      .eq('reference_table', 'commission')
      .eq('reference_id', commissionId)
      .eq('id_niveau', paroisseId)
      .eq('niveau', 'departement')
    
    if (error) {
      console.error('Erreur deleteCommissionUnite:', error)
      return { success: false, error: error.message }
    }
    
    console.log('Unité commission supprimée:', commissionId)
    return { success: true }
  } catch (error) {
    console.error('Erreur deleteCommissionUnite:', error)
    return { success: false, error: 'Une erreur est survenue' }
  }
}


// actions/unite-organisation.ts
export async function getUniteOrganisationById(id: number) {
  const { supabase } = await import('@/lib/supabase')
  
  const { data, error } = await supabase
    .from('unite_organisation')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Erreur getUniteOrganisationById:', error)
    return null
  }
  
  return data
}





// actions/unite-organisation.ts - CORRECTION

/**
 * Récupère l'unité d'un département pour une paroisse spécifique
 */
export async function getDepartementUniteForParoisse(
  departementId: number,
  paroisseId: number
): Promise<{ id: number; nom?: string } | null> {
  try {
    console.log('🔍 getDepartementUniteForParoisse:', { departementId, paroisseId })
    
    // Essayer plusieurs stratégies de recherche
    let unite = null
    
    // Stratégie 1: Recherche avec tous les critères
    const { data: exactMatch, error: exactError } = await supabase
      .from('unite_organisation')
      .select('id, nom')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
      .eq('id_niveau', paroisseId)
      .maybeSingle()
    
    if (exactError) {
      console.error('❌ Erreur exactMatch:', exactError)
    }
    
    if (exactMatch) {
      console.log('✅ Unité trouvée (exact match):', exactMatch)
      return { id: exactMatch.id, nom: exactMatch.nom }
    }
    
    // Stratégie 2: Recherche sans niveau (pour debug)
    const { data: withoutNiveau, error: niveauError } = await supabase
      .from('unite_organisation')
      .select('id, nom, id_niveau, niveau')
      .eq('reference_table', 'departement')
      .eq('reference_id', departementId)
    
    if (niveauError) {
      console.error('❌ Erreur withoutNiveau:', niveauError)
    }
    
    if (withoutNiveau && withoutNiveau.length > 0) {
      console.log('⚠️ Unités trouvées sans filtre niveau:', withoutNiveau)
      // Si on trouve des unités mais avec id_niveau différent, on prend la première
      unite = withoutNiveau[0]
      console.log('📌 Utilisation de la première unité trouvée:', unite)
      return { id: unite.id, nom: unite.nom }
    }
    
    console.log('❌ Aucune unité trouvée pour département', departementId, 'paroisse', paroisseId)
    return null
    
  } catch (error) {
    console.error('❌ Exception dans getDepartementUniteForParoisse:', error)
    return null
  }
}

/**
 * Crée ou met à jour une unité d'organisation
 * 
 * RÈGLES D'UNICITÉ :
 * - Pour niveau = 'region', 'conference', 'district' : 
 *   Unicité sur (reference_table, reference_id, niveau)
 *   car id_niveau = 0 pour tous
 * 
 * - Pour niveau = 'paroisse' (départements rattachés à une paroisse) :
 *   Unicité sur (reference_table, reference_id, niveau, id_niveau)
 *   car un même département peut exister dans plusieurs paroisses différentes
 * 
 * - Pour niveau = 'departement' (commissions) :
 *   Unicité sur (reference_table, reference_id, niveau, id_niveau)
 */
// export async function syncUniteOrganisation(
//   niveau: UniteOrganisation['niveau'],
//   referenceId: number,
//   referenceTable: string,
//   nom: string,
//   parentId: number | null = null,
//   idNiveau: number = 0
// ): Promise<UniteOrganisation | null> {
//   try {
//     console.log(`🔄 syncUniteOrganisation: niveau=${niveau}, ref=${referenceTable}/${referenceId}, id_niveau=${idNiveau}`)
    
//     // Construire le nom composé selon le niveau
//     let nomCompose = nom
    
//     try {
//       if (niveau === 'paroisse' && idNiveau > 0) {
//         // Niveau paroisse : ajouter le nom de la paroisse
//         const { data: paroisse } = await supabase
//           .from('paroisse')
//           .select('nom')
//           .eq('id', idNiveau)
//           .single()
        
//         if (paroisse) {
//           nomCompose = `${nom} - ${paroisse.nom}`
//         }
//       } else if (niveau === 'departement' && idNiveau > 0) {
//         // Niveau département : ajouter le nom de la paroisse
//         // (car id_niveau = paroisse_id pour les départements)
//         const { data: paroisse } = await supabase
//           .from('paroisse')
//           .select('nom')
//           .eq('id', idNiveau)
//           .single()
        
//         if (paroisse) {
//           nomCompose = `${nom} - ${paroisse.nom}`
//         }
//       } else if (niveau === 'district' && idNiveau > 0) {
//         // Niveau district : ajouter le nom du district
//         const { data: district } = await supabase
//           .from('district')
//           .select('nom')
//           .eq('id', idNiveau)
//           .single()
        
//         if (district) {
//           nomCompose = `${nom} - ${district.nom}`
//         }
//       } else if (niveau === 'conference' && idNiveau > 0) {
//         // Niveau conférence : NE PAS ajouter le nom de la conférence
//         // car le département/contenu a déjà le nom de la conférence dans son nom
//         // ou c'est la conférence elle-même
//         nomCompose = nom
//       } else if (niveau === 'region' && idNiveau > 0) {
//         // Niveau région : ajouter le nom de la région
//         const { data: region } = await supabase
//           .from('region')
//           .select('nom')
//           .eq('id', idNiveau)
//           .single()
        
//         if (region) {
//           nomCompose = `${nom} - ${region.nom}`
//         }
//       }
//     } catch (error) {
//       console.warn(`⚠️ Impossible de récupérer le nom pour le niveau ${niveau}:`, error)
//       // On garde le nom original
//     }
    
//     // Construire la requête de vérification d'existence
//     let query = supabase
//       .from('unite_organisation')
//       .select('*')
//       .eq('reference_table', referenceTable)
//       .eq('reference_id', referenceId)
//       .eq('niveau', niveau)
//       .eq('id_niveau', idNiveau)
    
//     const { data: existing, error: checkError } = await query.maybeSingle()
    
//     if (checkError) {
//       console.error('❌ Erreur vérification existence:', checkError)
//     }

//     // Si plusieurs unités existent déjà (doublons), on nettoie
//     if (!existing) {
//       const { data: multiples } = await supabase
//         .from('unite_organisation')
//         .select('id, created_at')
//         .eq('reference_table', referenceTable)
//         .eq('reference_id', referenceId)
//         .eq('niveau', niveau)
//         .eq('id_niveau', idNiveau)
//         .order('created_at', { ascending: true })
      
//       if (multiples && multiples.length > 1) {
//         console.warn(`⚠️ ${multiples.length} doublons trouvés pour ${referenceTable}/${referenceId} (niveau=${niveau}, id_niveau=${idNiveau})`)
        
//         // Garder le plus ancien, supprimer les autres
//         const [toKeep, ...toDelete] = multiples
//         console.log(`🧹 Nettoyage: garde ${toKeep.id}, supprime ${toDelete.map(d => d.id).join(', ')}`)
        
//         for (const dup of toDelete) {
//           await supabase.from('unite_organisation').delete().eq('id', dup.id)
//         }
        
//         // Récupérer l'unité conservée avec toutes ses colonnes
//         const { data: kept } = await supabase
//           .from('unite_organisation')
//           .select('*')
//           .eq('id', toKeep.id)
//           .single()
        
//         // Mettre à jour le nom si nécessaire
//         if (kept && kept.nom !== nomCompose) {
//           const { data: updated } = await supabase
//             .from('unite_organisation')
//             .update({ nom: nomCompose, updated_at: new Date().toISOString() })
//             .eq('id', kept.id)
//             .select()
//             .single()
          
//           return updated
//         }
        
//         return kept
//       }
      
//       if (multiples && multiples.length === 1) {
//         // Une seule trouvée mais pas via maybeSingle ? Récupérer complètement
//         const { data: single } = await supabase
//           .from('unite_organisation')
//           .select('*')
//           .eq('id', multiples[0].id)
//           .single()
        
//         // Mettre à jour le nom si nécessaire
//         if (single && single.nom !== nomCompose) {
//           const { data: updated } = await supabase
//             .from('unite_organisation')
//             .update({ nom: nomCompose, updated_at: new Date().toISOString() })
//             .eq('id', single.id)
//             .select()
//             .single()
          
//           return updated
//         }
        
//         return single
//       }
//     }

//     const uniteData = {
//       nom: nomCompose,
//       niveau,
//       parent_id: parentId,
//       reference_id: referenceId,
//       reference_table: referenceTable,
//       id_niveau: idNiveau,
//       updated_at: new Date().toISOString()
//     }

//     let result
//     if (existing) {
//       // Mise à jour (mettre à jour le nom composé)
//       const { data, error } = await supabase
//         .from('unite_organisation')
//         .update(uniteData)
//         .eq('id', existing.id)
//         .select()
//         .single()

//       if (error) throw error
//       result = data
//       console.log(`✅ Unité mise à jour: id=${result.id}, nom="${result.nom}"`)
//     } else {
//       // Création
//       const { data, error } = await supabase
//         .from('unite_organisation')
//         .insert([{
//           ...uniteData,
//           created_at: new Date().toISOString()
//         }])
//         .select()
//         .single()

//       if (error) {
//         // Si conflit (race condition), on refait une recherche
//         if (error.code === '23505') {
//           console.log('⚠️ Conflit de création, recherche de l\'existant...')
//           const { data: conflictData } = await supabase
//             .from('unite_organisation')
//             .select('*')
//             .eq('reference_table', referenceTable)
//             .eq('reference_id', referenceId)
//             .eq('niveau', niveau)
//             .eq('id_niveau', idNiveau)
//             .maybeSingle()
          
//           if (conflictData) {
//             // Mettre à jour le nom si nécessaire
//             if (conflictData.nom !== nomCompose) {
//               const { data: updated } = await supabase
//                 .from('unite_organisation')
//                 .update({ nom: nomCompose, updated_at: new Date().toISOString() })
//                 .eq('id', conflictData.id)
//                 .select()
//                 .single()
              
//               return updated
//             }
//             return conflictData
//           }
//         }
//         throw error
//       }
//       result = data
//       console.log(`✅ Unité créée: id=${result.id}, nom="${result.nom}"`)
//     }

//     return result
//   } catch (error) {
//     console.error(`❌ Erreur syncUniteOrganisation:`, error)
//     return null
//   }
// }


// actions/unite-organisation.ts

/**
 * Crée ou met à jour une unité d'organisation avec protection contre les doublons
 */
export async function syncUniteOrganisation(
  niveau: UniteOrganisation['niveau'],
  referenceId: number,
  referenceTable: string,
  nom: string,
  parentId: number | null = null,
  idNiveau: number = 0
): Promise<UniteOrganisation | null> {
  try {
    console.log(`🔄 syncUniteOrganisation: niveau=${niveau}, ref=${referenceTable}/${referenceId}, id_niveau=${idNiveau}`)
    
    // ÉTAPE 1: VÉRIFICATION ROBUSTE DE L'EXISTENCE
    // Utiliser une transaction ou un verrou pour éviter les race conditions
    const { data: existingUnits, error: searchError } = await supabase
      .from('unite_organisation')
      .select('*')
      .eq('reference_table', referenceTable)
      .eq('reference_id', referenceId)
      .eq('niveau', niveau)
      .eq('id_niveau', idNiveau)
      .order('created_at', { ascending: true })
    
    if (searchError) {
      console.error('❌ Erreur recherche:', searchError)
      throw searchError
    }

    // ÉTAPE 2: NETTOYAGE DES DOUBLONS AVANT TOUTE OPÉRATION
    if (existingUnits && existingUnits.length > 1) {
      console.warn(`⚠️ ${existingUnits.length} doublons trouvés, nettoyage en cours...`)
      
      // Garder le plus ancien
      const [toKeep, ...toDelete] = existingUnits
      
      // Supprimer les doublons
      for (const dup of toDelete) {
        const { error: deleteError } = await supabase
          .from('unite_organisation')
          .delete()
          .eq('id', dup.id)
        
        if (deleteError) {
          console.error(`❌ Erreur suppression doublon ${dup.id}:`, deleteError)
        } else {
          console.log(`🗑️ Doublon supprimé: ${dup.id}`)
        }
      }
      
      // Mettre à jour l'unité conservée avec le bon nom si nécessaire
      const nomCompose = await buildComposedName(nom, niveau, idNiveau)
      if (toKeep.nom !== nomCompose) {
        const { data: updated, error: updateError } = await supabase
          .from('unite_organisation')
          .update({ 
            nom: nomCompose, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', toKeep.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('❌ Erreur mise à jour nom:', updateError)
          return toKeep
        }
        
        console.log(`✅ Unité nettoyée et mise à jour: id=${updated.id}`)
        return updated
      }
      
      console.log(`✅ Unité existante conservée: id=${toKeep.id}`)
      return toKeep
    }
    
    // ÉTAPE 3: TRAITEMENT DE L'UNITÉ UNIQUE EXISTANTE
    const existingUnit = existingUnits && existingUnits.length === 1 ? existingUnits[0] : null
    
    // Construire le nom composé
    const nomCompose = await buildComposedName(nom, niveau, idNiveau)
    
    const uniteData = {
      nom: nomCompose,
      niveau,
      parent_id: parentId,
      reference_id: referenceId,
      reference_table: referenceTable,
      id_niveau: idNiveau,
      updated_at: new Date().toISOString()
    }

    // ÉTAPE 4: UPSERT AVEC PROTECTION CONTRE LES CONFLITS
    if (existingUnit) {
      // Mise à jour si le nom a changé
      if (existingUnit.nom !== nomCompose) {
        const { data: updated, error: updateError } = await supabase
          .from('unite_organisation')
          .update(uniteData)
          .eq('id', existingUnit.id)
          .select()
          .single()
        
        if (updateError) {
          console.error('❌ Erreur mise à jour:', updateError)
          return existingUnit
        }
        
        console.log(`✅ Unité mise à jour: id=${updated.id}`)
        return updated
      }
      
      console.log(`✅ Unité existante inchangée: id=${existingUnit.id}`)
      return existingUnit
    } else {
      // Création avec gestion des conflits de concurrence
      try {
        const { data: created, error: insertError } = await supabase
          .from('unite_organisation')
          .insert([{
            ...uniteData,
            created_at: new Date().toISOString()
          }])
          .select()
          .single()
        
        if (insertError) {
          // Si conflit de clé unique (race condition), refaire une recherche
          if (insertError.code === '23505') {
            console.log('⚠️ Conflit détecté, recherche de l\'unité créée concurrentiellement...')
            
            // Attendre un court instant pour laisser le temps à l'autre transaction
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // Rechercher l'unité créée par l'autre processus
            const { data: concurrentUnit } = await supabase
              .from('unite_organisation')
              .select('*')
              .eq('reference_table', referenceTable)
              .eq('reference_id', referenceId)
              .eq('niveau', niveau)
              .eq('id_niveau', idNiveau)
              .maybeSingle()
            
            if (concurrentUnit) {
              console.log(`✅ Unité créée concurrentiellement récupérée: id=${concurrentUnit.id}`)
              return concurrentUnit
            }
          }
          
          throw insertError
        }
        
        console.log(`✅ Nouvelle unité créée: id=${created.id}`)
        return created
      } catch (error) {
        console.error('❌ Erreur création:', error)
        
        // Dernière tentative de récupération
        const { data: fallbackUnit } = await supabase
          .from('unite_organisation')
          .select('*')
          .eq('reference_table', referenceTable)
          .eq('reference_id', referenceId)
          .eq('niveau', niveau)
          .eq('id_niveau', idNiveau)
          .maybeSingle()
        
        return fallbackUnit
      }
    }
  } catch (error) {
    console.error(`❌ Erreur critique syncUniteOrganisation:`, error)
    return null
  }
}

/**
 * Construit un nom composé selon le niveau
 */
async function buildComposedName(
  baseName: string, 
  niveau: UniteOrganisation['niveau'], 
  idNiveau: number
): Promise<string> {
  try {
    if (niveau === 'paroisse' && idNiveau > 0) {
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('nom')
        .eq('id', idNiveau)
        .single()
      
      return paroisse ? `${baseName} - ${paroisse.nom}` : baseName
    }
    
    if (niveau === 'departement' && idNiveau > 0) {
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('nom')
        .eq('id', idNiveau)
        .single()
      
      return paroisse ? `${baseName} - ${paroisse.nom}` : baseName
    }
    
    if (niveau === 'district' && idNiveau > 0) {
      const { data: district } = await supabase
        .from('district')
        .select('nom')
        .eq('id', idNiveau)
        .single()
      
      return district ? `${baseName} - ${district.nom}` : baseName
    }
    
    if (niveau === 'region' && idNiveau > 0) {
      const { data: region } = await supabase
        .from('region')
        .select('nom')
        .eq('id', idNiveau)
        .single()
      
      return region ? `${baseName} - ${region.nom}` : baseName
    }
    
    return baseName
  } catch (error) {
    console.warn(`⚠️ Impossible de construire le nom composé:`, error)
    return baseName
  }
}

/**
 * Utilitaire pour exécuter une fonction avec un mutex simple
 * Pour éviter les appels parallèles à syncUniteOrganisation
 */
const pendingPromises = new Map<string, Promise<any>>()

export async function syncUniteOrganisationWithMutex(
  niveau: UniteOrganisation['niveau'],
  referenceId: number,
  referenceTable: string,
  nom: string,
  parentId: number | null = null,
  idNiveau: number = 0
): Promise<UniteOrganisation | null> {
  const key = `${niveau}:${referenceTable}:${referenceId}:${idNiveau}`
  
  // Si une promesse est déjà en cours pour cette clé, la retourner
  if (pendingPromises.has(key)) {
    console.log(`⏳ Attente de la promesse existante pour ${key}`)
    return pendingPromises.get(key)
  }
  
  // Créer une nouvelle promesse
  const promise = syncUniteOrganisation(
    niveau, referenceId, referenceTable, nom, parentId, idNiveau
  ).finally(() => {
    // Nettoyer après résolution
    pendingPromises.delete(key)
  })
  
  pendingPromises.set(key, promise)
  return promise
}

