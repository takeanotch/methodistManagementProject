// // actions/chef-district-data.ts
// 'use server'

// import { supabase } from '@/lib/supabase'
// import { getUser } from './auth'

// // ============================================
// // TYPES
// // ============================================

// export interface ChefInfo {
//   id: number
//   fidele_id: number
//   departement_id: number
//   district_id: number
//   departement_nom: string
//   district_nom: string
//   fidele_nom: string
//   fidele_prenom: string
//   fidele_post_nom?: string
//   role?: {
//     id: number
//     nom_role: string
//     label_role: string
//     type_role: string
//   }
// }

// // Mise à jour du type Paroisse dans le même fichier

// export interface Paroisse {
//   id: number
//   nom: string
//   district_id: number
//   created_at: string
//   fideles_count?: number  // Optionnel, calculé à la volée
// }

// export interface Departement {
//   id: number
//   nom: string
//   type: 'commite' | 'agence_programme' | 'normal'
//   description?: string
//   created_at: string
//   stats?: {
//     total: number
//     actifs: number
//     inactifs: number
//   }
// }

// export interface StatsParoisse {
//   total_departements: number
//   total_membres: number
//   total_actifs: number
// }

// export interface StatsParoisses {
//   [key: number]: StatsParoisse
// }

// export interface Membre {
//   id: number
//   role_id: number
//   role_details?: {
//     id: number
//     nom: string
//     label: string
//     couleur: string
//     niveau: number
//   }
//   annee_id: number
//   annee?: {
//     id: number
//     label: string
//   }
//   est_actif: boolean
//   fidele: {
//     id: number
//     nom: string
//     post_nom: string
//     prenom: string
//     contact: string
//     profile_img?: string
//     sexe?: string
//   }
// }

// // ============================================
// // FONCTIONS POUR LE CHEF DE DISTRICT
// // ============================================

// /**
//  * Récupère les informations du chef de district connecté
//  */
// // export async function getCurrentChefDistrict(): Promise<ChefInfo | null> {
// //   try {
// //     const user = await getUser()
// //     if (!user) {
// //       console.log('❌ Aucun utilisateur connecté')
// //       return null
// //     }

// //     console.log('👤 Utilisateur connecté:', user.id)

// //     // Récupérer le fidèle correspondant à l'utilisateur
// //     const { data: fideleData, error: fideleError } = await supabase
// //       .from('fidele')
// //       .select(`
// //         id,
// //         nom,
// //         post_nom,
// //         prenom,
// //         paroisse_id,
// //         paroisse:paroisse_id (
// //           id,
// //           nom,
// //           district_id,
// //           district:district_id (
// //             id,
// //             nom
// //           )
// //         )
// //       `)
// //       .eq('user_id', user.id)
// //       .single()

// //     if (fideleError) {
// //       console.error('❌ Erreur récupération fidèle:', fideleError)
// //       return null
// //     }

// //     if (!fideleData) {
// //       console.log('❌ Fidèle non trouvé')
// //       return null
// //     }

// //     console.log('✅ Fidèle trouvé:', fideleData.id)

// //     // Traiter les données de la paroisse (qui peut être un tableau)
// //     const paroisse = Array.isArray(fideleData.paroisse) 
// //       ? fideleData.paroisse[0] 
// //       : fideleData.paroisse

// //     // Traiter les données du district (qui peut être un tableau)
// //     const district = paroisse && Array.isArray(paroisse.district) 
// //       ? paroisse.district[0] 
// //       : paroisse?.district

// //     // Récupérer le département du chef (il est chef d'un département)
// //     const { data: chefData, error: chefError } = await supabase
// //       .from('chef_departement')
// //       .select(`
// //         id,
// //         fidele_id,
// //         departement_id,
// //         district_id,
// //         role_id,
// //         niveau,
// //         departement:departement_id (
// //           id,
// //           nom
// //         ),
// //         role:role_id (
// //           id,
// //           nom_role,
// //           label_role,
// //           type_role
// //         )
// //       `)
// //       .eq('fidele_id', fideleData.id)
// //       .eq('niveau', 'district')
// //       .eq('est_actif', true)
// //       .single()

// //     if (chefError) {
// //       console.error('❌ Erreur récupération chef:', chefError)
// //       return null
// //     }

// //     if (!chefData) {
// //       console.log('❌ Chef non trouvé')
// //       return null
// //     }

// //     console.log('✅ Chef trouvé:', chefData.id)

// //     // Traiter les données du département (qui peut être un tableau)
// //     const departement = Array.isArray(chefData.departement) 
// //       ? chefData.departement[0] 
// //       : chefData.departement

// //     // Traiter les données du rôle (qui peut être un tableau)
// //     const role = Array.isArray(chefData.role) 
// //       ? chefData.role[0] 
// //       : chefData.role

// //     return {
// //       id: chefData.id,
// //       fidele_id: chefData.fidele_id,
// //       departement_id: chefData.departement_id,
// //       district_id: chefData.district_id,
// //       departement_nom: departement?.nom || 'Département inconnu',
// //       district_nom: district?.nom || 'District inconnu',
// //       fidele_nom: fideleData.nom,
// //       fidele_prenom: fideleData.prenom,
// //       fidele_post_nom: fideleData.post_nom,
// //       role: role || undefined
// //     }
// //   } catch (error) {
// //     console.error('❌ Erreur getCurrentChefDistrict:', error)
// //     return null
// //   }
// // }



// // actions/chef-district-data.ts - Version corrigée

// /**
//  * Récupère les informations du chef de district connecté
//  */
// export async function getCurrentChefDistrict(): Promise<ChefInfo | null> {
//   try {
//     console.log('🔍 getCurrentChefDistrict - Début')
    
//     const user = await getUser()
//     console.log('👤 Utilisateur récupéré:', user ? `ID: ${user.id}` : 'null')
    
//     if (!user) {
//       console.log('❌ Aucun utilisateur connecté')
//       return null
//     }

//     // Vérifier si l'utilisateur a un fidele_id
//     if (!user.fidele_id) {
//       console.log('❌ Utilisateur sans fidele_id')
//       return null
//     }

//     // Récupérer le fidèle avec sa paroisse et le district de la paroisse
//     console.log('📋 Recherche du fidèle pour id:', user.fidele_id)
    
//     const { data: fideleData, error: fideleError } = await supabase
//       .from('fidele')
//       .select(`
//         id,
//         nom,
//         post_nom,
//         prenom,
//         paroisse_id,
//         paroisse:paroisse_id (
//           id,
//           nom,
//           district_id,
//           district:district_id (
//             id,
//             nom
//           )
//         )
//       `)
//       .eq('id', user.fidele_id)
//       .maybeSingle()

//     if (fideleError) {
//       console.error('❌ Erreur récupération fidèle:', fideleError)
//       return null
//     }

//     if (!fideleData) {
//       console.log('❌ Aucun fidèle trouvé')
//       return null
//     }

//     console.log('✅ Fidèle trouvé:', { id: fideleData.id, nom: fideleData.nom })

//     // Traiter les données de la paroisse
//     const paroisse = Array.isArray(fideleData.paroisse) 
//       ? fideleData.paroisse[0] 
//       : fideleData.paroisse

//     // Récupérer le district depuis la paroisse
//     let districtNom = 'District inconnu'
//     if (paroisse) {
//       const district = Array.isArray(paroisse.district) 
//         ? paroisse.district[0] 
//         : paroisse.district
//       districtNom = district?.nom || 'District inconnu'
//     }

//     // Récupérer le département du chef
//     console.log('📋 Recherche du chef pour fidele_id:', fideleData.id)
    
//     const { data: chefData, error: chefError } = await supabase
//       .from('chef_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         district_id,
//         role_id,
//         niveau,
//         departement:departement_id (
//           id,
//           nom
//         ),
//         role:role_id (
//           id,
//           nom_role,
//           label_role,
//           type_role
//         )
//       `)
//       .eq('fidele_id', fideleData.id)
//       .eq('niveau', 'district')
//       .eq('est_actif', true)
//       .maybeSingle()

//     if (chefError) {
//       console.error('❌ Erreur récupération chef:', chefError)
//       return null
//     }

//     if (!chefData) {
//       console.log('❌ Aucun chef trouvé pour ce fidèle')
//       return null
//     }

//     console.log('✅ Chef trouvé:', chefData.id)

//     // Traiter les données du département
//     const departement = Array.isArray(chefData.departement) 
//       ? chefData.departement[0] 
//       : chefData.departement

//     // Traiter les données du rôle
//     const role = Array.isArray(chefData.role) 
//       ? chefData.role[0] 
//       : chefData.role

//     return {
//       id: chefData.id,
//       fidele_id: chefData.fidele_id,
//       departement_id: chefData.departement_id,
//       district_id: chefData.district_id,
//       departement_nom: departement?.nom || 'Département inconnu',
//       district_nom: districtNom,
//       fidele_nom: fideleData.nom,
//       fidele_prenom: fideleData.prenom,
//       fidele_post_nom: fideleData.post_nom,
//       role: role || undefined
//     }
//   } catch (error) {
//     console.error('❌ Erreur getCurrentChefDistrict:', error)
//     return null
//   }
// }
// // actions/chef-district-data.ts - Version corrigée pour getParoissesByDistrict

// /**
//  * Récupère toutes les paroisses d'un district
//  */
// export async function getParoissesByDistrict(districtId: number): Promise<Paroisse[]> {
//   try {
//     console.log('📋 Récupération des paroisses du district:', districtId)

//     // Requête adaptée à votre structure de base de données
//     const { data, error } = await supabase
//       .from('paroisse')
//       .select(`
//         id,
//         nom,
//         district_id,
//         created_at
//       `)
//       .eq('district_id', districtId)
//       .order('nom')

//     if (error) {
//       console.error('❌ Erreur getParoissesByDistrict:', error)
//       return []
//     }

//     if (!data || data.length === 0) {
//       console.log('📭 Aucune paroisse trouvée pour ce district')
//       return []
//     }

//     // Compter les fidèles pour chaque paroisse
//     const paroissesWithCounts = await Promise.all(
//       data.map(async (paroisse) => {
//         // Compter les fidèles de cette paroisse
//         const { count: fidelesCount, error: countError } = await supabase
//           .from('fidele')
//           .select('*', { count: 'exact', head: true })
//           .eq('paroisse_id', paroisse.id)

//         if (countError) {
//           console.error(`❌ Erreur comptage fidèles pour paroisse ${paroisse.id}:`, countError)
//         }

//         return {
//           id: paroisse.id,
//           nom: paroisse.nom,
//           district_id: paroisse.district_id,
//           created_at: paroisse.created_at,
//           fideles_count: fidelesCount || 0
//         }
//       })
//     )

//     console.log(`✅ ${paroissesWithCounts.length} paroisses trouvées`)
//     return paroissesWithCounts
//   } catch (error) {
//     console.error('❌ Erreur getParoissesByDistrict:', error)
//     return []
//   }
// }

// /**
//  * Récupère une paroisse par son ID
//  */
// export async function getParoisseById(paroisseId: number): Promise<Paroisse | null> {
//   try {
//     console.log('📋 Récupération de la paroisse:', paroisseId)

//     // ✅ CORRECTION: Sélectionner seulement les colonnes qui existent
//     const { data, error } = await supabase
//       .from('paroisse')
//       .select(`
//         id,
//         nom,
//         district_id,
//         created_at
//       `)
//       .eq('id', paroisseId)
//       .single()

//     if (error) {
//       console.error('❌ Erreur getParoisseById:', error)
//       return null
//     }

//     if (!data) {
//       console.log('❌ Paroisse non trouvée')
//       return null
//     }

//     // Compter les fidèles de cette paroisse (optionnel)
//     const { count: fidelesCount } = await supabase
//       .from('fidele')
//       .select('*', { count: 'exact', head: true })
//       .eq('paroisse_id', paroisseId)

//     console.log('✅ Paroisse trouvée:', data.nom)

//     return {
//       id: data.id,
//       nom: data.nom,
//       district_id: data.district_id,
//       created_at: data.created_at,
//       fideles_count: fidelesCount || 0
//     }
//   } catch (error) {
//     console.error('❌ Erreur getParoisseById:', error)
//     return null
//   }
// }

// /**
//  * Récupère les statistiques pour toutes les paroisses d'un district
//  */
// export async function getStatsParoisses(districtId: number): Promise<StatsParoisses> {
//   try {
//     console.log('📊 Récupération des stats des paroisses du district:', districtId)

//     // Récupérer toutes les paroisses du district
//     const { data: paroisses, error: paroissesError } = await supabase
//       .from('paroisse')
//       .select('id')
//       .eq('district_id', districtId)

//     if (paroissesError) {
//       console.error('❌ Erreur récupération paroisses:', paroissesError)
//       return {}
//     }

//     const stats: StatsParoisses = {}

//     // Pour chaque paroisse, récupérer les stats
//     for (const paroisse of paroisses || []) {
//       // Récupérer tous les départements (il n'y a pas de lien direct paroisse-département)
//       // On considère que tous les départements sont disponibles pour toutes les paroisses
//       const { data: departements, error: deptError } = await supabase
//         .from('departement')
//         .select('id')

//       if (deptError) {
//         console.error('❌ Erreur récupération départements:', deptError)
//         continue
//       }

//       let totalMembres = 0
//       let totalActifs = 0

//       // Pour chaque département, compter les membres de cette paroisse
//       for (const dept of departements || []) {
//         const { count, error: countError } = await supabase
//           .from('fidele_departement')
//           .select('*', { count: 'exact', head: true })
//           .eq('departement_id', dept.id)
//           .eq('paroisse_id', paroisse.id)

//         if (!countError && count) {
//           totalMembres += count
//         }

//         // Compter les actifs
//         const { count: actifsCount, error: actifsError } = await supabase
//           .from('fidele_departement')
//           .select('*', { count: 'exact', head: true })
//           .eq('departement_id', dept.id)
//           .eq('paroisse_id', paroisse.id)
//           .eq('est_actif', true)

//         if (!actifsError && actifsCount) {
//           totalActifs += actifsCount
//         }
//       }

//       stats[paroisse.id] = {
//         total_departements: departements?.length || 0,
//         total_membres: totalMembres,
//         total_actifs: totalActifs
//       }
//     }

//     console.log('✅ Stats calculées pour', Object.keys(stats).length, 'paroisses')
//     return stats
//   } catch (error) {
//     console.error('❌ Erreur getStatsParoisses:', error)
//     return {}
//   }
// }

// /**
//  * Récupère tous les départements avec leurs statistiques pour une paroisse
//  */
// export async function getDepartementsWithStats(paroisseId: number): Promise<Departement[]> {
//   try {
//     console.log('📋 Récupération des départements avec stats pour paroisse:', paroisseId)

//     const { data, error } = await supabase
//       .from('departement')
//       .select(`
//         id,
//         nom,
//         type,
//         description,
//         created_at
//       `)
//       .order('nom')

//     if (error) {
//       console.error('❌ Erreur getDepartements:', error)
//       return []
//     }

//     // Ajouter les stats pour chaque département
//     const departementsWithStats = await Promise.all(
//       (data || []).map(async (dept) => {
//         // Compter tous les membres de cette paroisse dans ce département
//         const { count: total, error: totalError } = await supabase
//           .from('fidele_departement')
//           .select('*', { count: 'exact', head: true })
//           .eq('departement_id', dept.id)
//           .eq('paroisse_id', paroisseId)

//         // Compter les membres actifs
//         const { count: actifs, error: actifsError } = await supabase
//           .from('fidele_departement')
//           .select('*', { count: 'exact', head: true })
//           .eq('departement_id', dept.id)
//           .eq('paroisse_id', paroisseId)
//           .eq('est_actif', true)

//         // Compter les inactifs
//         const { count: inactifs, error: inactifsError } = await supabase
//           .from('fidele_departement')
//           .select('*', { count: 'exact', head: true })
//           .eq('departement_id', dept.id)
//           .eq('paroisse_id', paroisseId)
//           .eq('est_actif', false)

//         return {
//           ...dept,
//           stats: {
//             total: total || 0,
//             actifs: actifs || 0,
//             inactifs: inactifs || 0
//           }
//         }
//       })
//     )

//     console.log(`✅ ${departementsWithStats.length} départements avec stats`)
//     return departementsWithStats
//   } catch (error) {
//     console.error('❌ Erreur getDepartementsWithStats:', error)
//     return []
//   }
// }

// /**
//  * Récupère un département par son ID
//  */
// export async function getDepartementById(departementId: number): Promise<Departement | null> {
//   try {
//     console.log('📋 Récupération du département:', departementId)

//     const { data, error } = await supabase
//       .from('departement')
//       .select(`
//         id,
//         nom,
//         type,
//         description,
//         created_at
//       `)
//       .eq('id', departementId)
//       .single()

//     if (error) {
//       console.error('❌ Erreur getDepartementById:', error)
//       return null
//     }

//     console.log('✅ Département trouvé:', data.nom)
//     return data
//   } catch (error) {
//     console.error('❌ Erreur getDepartementById:', error)
//     return null
//   }
// }

// /**
//  * Récupère tous les membres d'un département pour une paroisse spécifique
//  */
// export async function getFidelesWithHistoryByDepartement(
//   departementId: number, 
//   paroisseId: number
// ): Promise<Membre[]> {
//   try {
//     console.log('📋 Récupération des membres du département:', departementId, 'pour paroisse:', paroisseId)

//     // Requête simplifiée sans les relations complexes
//     const { data, error } = await supabase
//       .from('fidele_departement')
//       .select(`
//         id,
//         fidele_id,
//         departement_id,
//         role_id,
//         annee_id,
//         est_actif,
//         created_at
//       `)
//       .eq('departement_id', departementId)
//       .eq('paroisse_id', paroisseId)
//       .order('est_actif', { ascending: false })
//       .order('created_at', { ascending: false })

//     if (error) {
//       console.error('❌ Erreur getFidelesWithHistoryByDepartement:', error)
//       return []
//     }

//     if (!data || data.length === 0) {
//       console.log('📭 Aucun membre trouvé')
//       return []
//     }

//     // Récupérer les informations des fidèles séparément
//     const membresFormatted = await Promise.all(
//       data.map(async (item) => {
//         // Récupérer les infos du fidèle
//         const { data: fideleData } = await supabase
//           .from('fidele')
//           .select(`
//             id,
//             nom,
//             post_nom,
//             prenom,
//             contact,
//             profile_img,
//             sexe
//           `)
//           .eq('id', item.fidele_id)
//           .single()

//         // Récupérer les infos du rôle
//         const { data: roleData } = await supabase
//           .from('role_config')
//           .select(`
//             id,
//             nom,
//             label,
//             couleur,
//             niveau
//           `)
//           .eq('id', item.role_id)
//           .single()

//         // Récupérer les infos de l'année
//         const { data: anneeData } = await supabase
//           .from('annee')
//           .select(`
//             id,
//             label
//           `)
//           .eq('id', item.annee_id)
//           .single()

//         return {
//           id: item.id,
//           role_id: item.role_id,
//           annee_id: item.annee_id,
//           est_actif: item.est_actif,
//           fidele: fideleData || {
//             id: 0,
//             nom: '',
//             post_nom: '',
//             prenom: '',
//             contact: '',
//             profile_img: null,
//             sexe: ''
//           },
//           role_details: roleData || undefined,
//           annee: anneeData || undefined
//         }
//       })
//     )

//     console.log(`✅ ${membresFormatted.length} membres trouvés`)
//     return membresFormatted
//   } catch (error) {
//     console.error('❌ Erreur getFidelesWithHistoryByDepartement:', error)
//     return []
//   }
// }

// /**
//  * Récupère tous les départements (sans stats)
//  */
// export async function getDepartements(): Promise<Departement[]> {
//   try {
//     console.log('📋 Récupération de tous les départements')

//     const { data, error } = await supabase
//       .from('departement')
//       .select(`
//         id,
//         nom,
//         type,
//         description,
//         created_at
//       `)
//       .order('nom')

//     if (error) {
//       console.error('❌ Erreur getDepartements:', error)
//       return []
//     }

//     console.log(`✅ ${data?.length || 0} départements trouvés`)
//     return data || []
//   } catch (error) {
//     console.error('❌ Erreur getDepartements:', error)
//     return []
//   }
// }