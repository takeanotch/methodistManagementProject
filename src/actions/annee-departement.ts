

// // actions/annee-departement.ts
// 'use server'

// import { supabase } from '@/lib/supabase'
// import { revalidatePath } from 'next/cache'

// export type AnneeDepartement = {
//   id: number
//   departement_id: number
//   district_id: number
//   code: string
//   date_debut: string
//   date_fin: string
//   description: string | null
//   est_active: boolean
//   created_at: string
//   updated_at: string
//   departement?: {
//     id: number
//     nom: string
//     type: string
//   }
// }
// export type Representant = {
//   id: number
//   fidele_id: number
//   role_id: number
//   date_debut: string
//   date_fin: string | null
//   est_actif: boolean
//   annee_departement_district_id: number
//   fidele: {
//     id: number
//     nom: string
//     post_nom: string
//     prenom: string
//     contact: string
//     profile_img: string | null
//     sexe: string
//     paroisse?: {
//       id: number
//       nom: string
//     }
//   }
//   role_details: {
//     id: number
//     nom: string
//     label: string
//   } | null

//     statut_annee?: string
//   statut_color?: string
//   est_actif_pendant_annee?: boolean
// }
// // export type Representant = {
// //   [x: string]: ReactNode
// //   id: number
// //   fidele_id: number
// //   role_id: number
// //   date_debut: string
// //   date_fin: string | null
// //   est_actif: boolean
// //   annee_departement_district_id: number
// //   fidele: {
// //     id: number
// //     nom: string
// //     post_nom: string
// //     prenom: string
// //     contact: string
// //     profile_img: string | null
// //     sexe: string
// //     paroisse?: {
// //       id: number
// //       nom: string
// //     }
// //   }
// //   role_details: {
// //     id: number
// //     nom: string
// //     label: string
// //   } | null
// // }
// // export type Representant = {
// //   [x: string]: any
// //   [x: string]: ReactNode
// //   id: number
// //   fidele_id: number
// //   role_id: number
// //   date_debut: string
// //   date_fin: string | null
// //   est_actif: boolean
// //   annee_departement_district_id: number
// //   fidele: {
// //     id: number
// //     nom: string
// //     post_nom: string
// //     prenom: string
// //     contact: string
// //     profile_img: string | null
// //     sexe: string
// //     paroisse?: {
// //       id: number
// //       nom: string
// //     }
// //   }
// //   role_details: {
// //     id: number
// //     nom: string
// //     label: string
// //   } | null
// // }
// export type DepartementAvecAnnees = {
//   id: number
//   nom: string
//   type: string
//   description: string | null
//   roles_config: any[]
//   annees: AnneeDepartement[]
//   annee_active: AnneeDepartement | null
//   stats?: {
//     membres_actifs: number
//     total_membres: number
//     paroisses_representees: number
//   }
// }

// // ============================================
// // ANNÉES D'UN DÉPARTEMENT
// // ============================================

// // Récupérer toutes les années d'un département dans un district
// export async function getAnneesDepartement(departementId: number, districtId: number) {
//   const { data, error } = await supabase
//     .from('annee_departement_district')
//     .select(`
//       *,
//       departement:departement_id (
//         id,
//         nom,
//         type
//       )
//     `)
//     .eq('departement_id', departementId)
//     .eq('district_id', districtId)
//     .order('date_debut', { ascending: false })

//   if (error) {
//     console.error('Erreur:', error)
//     return []
//   }
//   return data as AnneeDepartement[]
// }

// // Récupérer l'année active d'un département
// export async function getAnneeActiveDepartement(departementId: number, districtId: number) {
//   const { data, error } = await supabase
//     .from('annee_departement_district')
//     .select('*')
//     .eq('departement_id', departementId)
//     .eq('district_id', districtId)
//     .eq('est_active', true)
//     .maybeSingle()

//   if (error) {
//     console.error('Erreur:', error)
//     return null
//   }
//   return data as AnneeDepartement | null
// }

// // Créer une nouvelle année pour un département
// export async function creerAnneeDepartement(formData: FormData) {
//   const departement_id = parseInt(formData.get('departement_id') as string)
//   const district_id = parseInt(formData.get('district_id') as string)
//   const code = formData.get('code') as string
//   const date_debut = formData.get('date_debut') as string
//   const date_fin = formData.get('date_fin') as string
//   const description = formData.get('description') as string || null

//   if (!departement_id || !district_id || !code || !date_debut || !date_fin) {
//     return { error: 'Champs requis manquants' }
//   }

//   if (new Date(date_debut) >= new Date(date_fin)) {
//     return { error: 'La date de début doit être antérieure à la date de fin' }
//   }

//   // Vérifier si le code existe déjà pour ce département
//   const { data: existing } = await supabase
//     .from('annee_departement_district')
//     .select('id')
//     .eq('departement_id', departement_id)
//     .eq('district_id', district_id)
//     .eq('code', code)
//     .maybeSingle()

//   if (existing) {
//     return { error: 'Cette année existe déjà pour ce département' }
//   }

//   // Si c'est la première année, l'activer automatiquement
//   const { count } = await supabase
//     .from('annee_departement_district')
//     .select('*', { count: 'exact', head: true })
//     .eq('departement_id', departement_id)
//     .eq('district_id', district_id)

//   const est_active = count === 0

//   const { data, error } = await supabase
//     .from('annee_departement_district')
//     .insert([{
//       departement_id,
//       district_id,
//       code,
//       date_debut,
//       date_fin,
//       description,
//       est_active
//     }])
//     .select()
//     .single()

//   if (error) {
//     console.error('Erreur:', error)
//     return { error: 'Erreur lors de la création' }
//   }

//   revalidatePath(`/admin/districts/${district_id}/departements`)
//   return { success: true, annee: data }
// }

// // Activer une année pour un département
// export async function activerAnneeDepartement(anneeId: number, departementId: number, districtId: number) {
//   // Désactiver l'ancienne année active
//   await supabase
//     .from('annee_departement_district')
//     .update({ est_active: false })
//     .eq('departement_id', departementId)
//     .eq('district_id', districtId)
//     .eq('est_active', true)

//   // Activer la nouvelle
//   const { error } = await supabase
//     .from('annee_departement_district')
//     .update({ est_active: true })
//     .eq('id', anneeId)

//   if (error) {
//     console.error('Erreur:', error)
//     return { error: 'Erreur lors de l\'activation' }
//   }

//   revalidatePath(`/admin/districts/${districtId}/departements`)
//   return { success: true }
// }

// // ============================================
// // DÉPARTEMENTS AVEC LEURS ANNÉES
// // ============================================

// // Récupérer tous les départements d'un district avec leurs années
// export async function getDepartementsAvecAnnees(districtId: number) {
//   try {
//     // Récupérer tous les départements (globaux)
//     const { data: departements, error: deptError } = await supabase
//       .from('departement')
//       .select('*')
//       .order('nom')

//     if (deptError || !departements) {
//       console.error('Erreur lors de la récupération des départements:', deptError)
//       return []
//     }

//     // Récupérer toutes les paroisses du district
//     const { data: paroisses, error: paroisseError } = await supabase
//       .from('paroisse')
//       .select('id')
//       .eq('district_id', districtId)

//     if (paroisseError) {
//       console.error('Erreur lors de la récupération des paroisses:', paroisseError)
//     }

//     const paroisseIds = paroisses?.map(p => p.id) || []

//     // Récupérer tous les fidèles de ces paroisses
//     let fideleIds: number[] = []
//     if (paroisseIds.length > 0) {
//       const { data: fideles } = await supabase
//         .from('fidele')
//         .select('id')
//         .in('paroisse_id', paroisseIds)
      
//       fideleIds = fideles?.map(f => f.id) || []
//     }

//     // Récupérer toutes les années pour ce district
//     const { data: annees, error: anneesError } = await supabase
//       .from('annee_departement_district')
//       .select('*')
//       .eq('district_id', districtId)

//     if (anneesError) {
//       console.error('Erreur lors de la récupération des années:', anneesError)
//     }

//     // Grouper les années par département
//     const anneesParDepartement: { [key: number]: AnneeDepartement[] } = {}
//     annees?.forEach(annee => {
//       if (!anneesParDepartement[annee.departement_id]) {
//         anneesParDepartement[annee.departement_id] = []
//       }
//       anneesParDepartement[annee.departement_id].push(annee as AnneeDepartement)
//     })

//     // Ajouter les stats pour chaque département
//     const result = await Promise.all(
//       departements.map(async (dept) => {
//         const anneesDept = anneesParDepartement[dept.id] || []
//         const anneeActive = anneesDept.find(a => a.est_active) || null

//         let actifs = 0
//         let total = 0
//         let paroissesSet = new Set<number>()

//         if (fideleIds.length > 0) {
//           // Compter les membres actifs
//           const { count: actifsCount } = await supabase
//             .from('fidele_departement')
//             .select('*', { count: 'exact', head: true })
//             .eq('departement_id', dept.id)
//             .eq('est_actif', true)
//             .in('fidele_id', fideleIds)

//           actifs = actifsCount || 0

//           // Total membres
//           const { count: totalCount } = await supabase
//             .from('fidele_departement')
//             .select('*', { count: 'exact', head: true })
//             .eq('departement_id', dept.id)
//             .in('fidele_id', fideleIds)

//           total = totalCount || 0

//           // Paroisses représentées
//           const { data: reps } = await supabase
//             .from('fidele_departement')
//             .select(`
//               fidele_id,
//               fidele:fidele_id (
//                 paroisse_id
//               )
//             `)
//             .eq('departement_id', dept.id)
//             .eq('est_actif', true)
//             .in('fidele_id', fideleIds)

//           if (reps) {
//             reps.forEach(rep => {
//               const paroisseId = (rep.fidele as any)?.paroisse_id
//               if (paroisseId) paroissesSet.add(paroisseId)
//             })
//           }
//         }

//         return {
//           ...dept,
//           annees: anneesDept,
//           annee_active: anneeActive,
//           stats: {
//             membres_actifs: actifs,
//             total_membres: total,
//             paroisses_representees: paroissesSet.size
//           }
//         }
//       })
//     )

//     return result as DepartementAvecAnnees[]
//   } catch (error) {
//     console.error('Erreur inattendue dans getDepartementsAvecAnnees:', error)
//     return []
//   }
// }

// // ============================================
// // REPRÉSENTANTS POUR UNE ANNÉE SPÉCIFIQUE
// // ============================================

// // Récupérer les représentants d'un département pour une année spécifique
// // export async function getRepresentantsPourAnnee(
// //   departementId: number,
// //   anneeDepartementId: number,
// //   districtId: number
// // ) {
// //   try {
// //     // Récupérer l'année pour avoir ses dates
// //     const { data: annee, error: anneeError } = await supabase
// //       .from('annee_departement_district')
// //       .select('*')
// //       .eq('id', anneeDepartementId)
// //       .single()

// //     if (anneeError || !annee) {
// //       console.error('Année non trouvée:', anneeError)
// //       return []
// //     }

// //     // Récupérer toutes les paroisses du district
// //     const { data: paroisses, error: paroisseError } = await supabase
// //       .from('paroisse')
// //       .select('id')
// //       .eq('district_id', districtId)

// //     if (paroisseError) {
// //       console.error('Erreur lors de la récupération des paroisses:', paroisseError)
// //       return []
// //     }

// //     if (!paroisses?.length) return []

// //     const paroisseIds = paroisses.map(p => p.id)

// //     // Récupérer les IDs des fidèles de ces paroisses
// //     const { data: fideleIds, error: fideleError } = await supabase
// //       .from('fidele')
// //       .select('id')
// //       .in('paroisse_id', paroisseIds)

// //     if (fideleError) {
// //       console.error('Erreur lors de la récupération des fidèles:', fideleError)
// //       return []
// //     }

// //     if (!fideleIds?.length) return []

// //     // Récupérer les représentants qui étaient actifs pendant cette année
// //     const { data, error } = await supabase
// //       .from('fidele_departement')
// //       .select(`
// //         *,
// //         fidele:fidele_id (
// //           id,
// //           nom,
// //           post_nom,
// //           prenom,
// //           contact,
// //           profile_img,
// //           sexe,
// //           paroisse:paroisse_id (id, nom)
// //         ),
// //         departement:departement_id (
// //           id,
// //           nom,
// //           roles_config
// //         )
// //       `)
// //       .eq('departement_id', departementId)
// //       .in('fidele_id', fideleIds.map(f => f.id))
// //       .lte('date_debut', annee.date_fin)
// //       .or(`date_fin.is.null,date_fin.gte.${annee.date_debut}`)
// //       .order('date_debut')

// //     if (error) {
// //       console.error('Erreur lors de la récupération des représentants:', error)
// //       return []
// //     }

// //     // Enrichir avec les détails
// //     return (data || []).map((m: any) => {
// //       let statut = 'En poste'
// //       let statutColor = 'text-green-600 bg-green-50'

// //       if (m.date_debut >= annee.date_debut && m.date_debut <= annee.date_fin) {
// //         statut = `Arrivé le ${new Date(m.date_debut).toLocaleDateString('fr-FR')}`
// //         statutColor = 'text-blue-600 bg-blue-50'
// //       } else if (m.date_fin && m.date_fin <= annee.date_fin) {
// //         statut = `Parti le ${new Date(m.date_fin).toLocaleDateString('fr-FR')}`
// //         statutColor = 'text-orange-600 bg-orange-50'
// //       }

// //       // Trouver le rôle correspondant dans la configuration
// //       const roleDetails = m.departement?.roles_config?.find(
// //         (r: any) => r.id === m.role_id
// //       ) || null

// //       return {
// //         ...m,
// //         statut_annee: statut,
// //         statut_color: statutColor,
// //         role_details: roleDetails
// //       }
// //     }) as Representant[]
// //   } catch (error) {
// //     console.error('Erreur inattendue dans getRepresentantsPourAnnee:', error)
// //     return []
// //   }
// // }

// // ============================================
// // CLÔTURE D'UNE ANNÉE (QUAND UN DÉPARTEMENT FERME SON ANNÉE)
// // ============================================

// export async function cloturerAnneeDepartement(
//   anneeId: number,
//   departementId: number,
//   districtId: number,
//   action: 'conserver' | 'changer' = 'changer'
// ) {
//   try {
//     // Récupérer l'année à clôturer
//     const { data: annee, error: anneeError } = await supabase
//       .from('annee_departement_district')
//       .select('*')
//       .eq('id', anneeId)
//       .single()

//     if (anneeError || !annee) {
//       return { error: 'Année non trouvée' }
//     }

//     if (action === 'changer') {
//       // Terminer tous les mandats pour cette année
//       const { error: updateError } = await supabase
//         .from('fidele_departement')
//         .update({
//           date_fin: annee.date_fin,
//           est_actif: false,
//           updated_at: new Date().toISOString()
//         })
//         .eq('departement_id', departementId)
//         .eq('annee_departement_district_id', anneeId)
//         .eq('est_actif', true)

//       if (updateError) {
//         console.error('Erreur lors de la mise à jour des mandats:', updateError)
//         return { error: 'Erreur lors de la clôture des mandats' }
//       }
//     }

//     // Désactiver l'année
//     const { error: desactiveError } = await supabase
//       .from('annee_departement_district')
//       .update({ est_active: false })
//       .eq('id', anneeId)

//     if (desactiveError) {
//       console.error('Erreur lors de la désactivation de l\'année:', desactiveError)
//       return { error: 'Erreur lors de la désactivation de l\'année' }
//     }

//     revalidatePath(`/admin/districts/${districtId}/departements`)
//     return { success: true }
//   } catch (error) {
//     console.error('Erreur inattendue dans cloturerAnneeDepartement:', error)
//     return { error: 'Une erreur inattendue est survenue' }
//   }
// }


// // actions/annee-departement.ts

// // ============================================
// // REPRÉSENTANTS POUR UNE ANNÉE SPÉCIFIQUE (AVEC HISTORIQUE)
// // ============================================

// export async function getRepresentantsPourAnnee(
//   departementId: number,
//   anneeDepartementId: number,
//   districtId: number
// ) {
//   try {
//     // Récupérer l'année pour avoir ses dates
//     const { data: annee, error: anneeError } = await supabase
//       .from('annee_departement_district')
//       .select('*')
//       .eq('id', anneeDepartementId)
//       .single()

//     if (anneeError || !annee) {
//       console.error('Année non trouvée:', anneeError)
//       return []
//     }

//     // Récupérer toutes les paroisses du district
//     const { data: paroisses, error: paroisseError } = await supabase
//       .from('paroisse')
//       .select('id')
//       .eq('district_id', districtId)

//     if (paroisseError) {
//       console.error('Erreur lors de la récupération des paroisses:', paroisseError)
//       return []
//     }

//     if (!paroisses?.length) return []

//     const paroisseIds = paroisses.map(p => p.id)

//     // Récupérer les IDs des fidèles de ces paroisses
//     const { data: fideleIds, error: fideleError } = await supabase
//       .from('fidele')
//       .select('id')
//       .in('paroisse_id', paroisseIds)

//     if (fideleError) {
//       console.error('Erreur lors de la récupération des fidèles:', fideleError)
//       return []
//     }

//     if (!fideleIds?.length) return []

//     // Récupérer le département pour avoir sa configuration des rôles
//     const { data: departement, error: deptError } = await supabase
//       .from('departement')
//       .select('roles_config')
//       .eq('id', departementId)
//       .single()

//     if (deptError || !departement) {
//       console.error('Erreur lors de la récupération du département:', deptError)
//       return []
//     }

//     // Récupérer TOUS les représentants (actifs ET inactifs) qui ont été dans ce département
//     // et dont la période chevauche l'année sélectionnée
//     const { data, error } = await supabase
//       .from('fidele_departement')
//       .select(`
//         *,
//         fidele:fidele_id (
//           id,
//           nom,
//           post_nom,
//           prenom,
//           contact,
//           profile_img,
//           sexe,
//           paroisse:paroisse_id (id, nom)
//         )
//       `)
//       .eq('departement_id', departementId)
//       .in('fidele_id', fideleIds.map(f => f.id))
//       .lte('date_debut', annee.date_fin) // A commencé avant la fin de l'année
//       .or(`date_fin.is.null,date_fin.gte.${annee.date_debut}`) // Pas de fin ou fin après début
//       .order('date_debut', { ascending: false })

//     if (error) {
//       console.error('Erreur lors de la récupération des représentants:', error)
//       return []
//     }

//     if (!data?.length) return []

//     console.log(`📊 Représentants trouvés pour ${annee.code}:`, data.length)
//     console.log('  - Actifs (est_actif=true):', data.filter(r => r.est_actif).length)
//     console.log('  - Inactifs (est_actif=false):', data.filter(r => !r.est_actif).length)

//     // Enrichir avec les détails et calculer le statut pour cette année spécifique
//     const rolesConfig = departement.roles_config || []
    
//     const result = data.map((item: any) => {
//       // Trouver les détails du rôle
//       const roleDetails = rolesConfig.find((r: any) => r.id === item.role_id) || null

//       // Déterminer le statut spécifique à cette année
//       let statut = ''
//       let statutColor = ''
//       let estActifPendantAnnee = false

//       const debut = new Date(item.date_debut)
//       const fin = item.date_fin ? new Date(item.date_fin) : null
//       const anneeDebut = new Date(annee.date_debut)
//       const anneeFin = new Date(annee.date_fin)

//       // Vérifier si le mandat était actif pendant cette année
//       if (debut <= anneeFin && (!fin || fin >= anneeDebut)) {
//         estActifPendantAnnee = true

//         if (item.est_actif) {
//           // Toujours actif aujourd'hui
//           statut = 'En poste'
//           statutColor = 'text-green-600 bg-green-50'
//         } else if (fin && fin <= anneeFin && fin >= anneeDebut) {
//           // Mandat terminé pendant l'année
//           statut = `Terminé le ${fin.toLocaleDateString('fr-FR')}`
//           statutColor = 'text-orange-600 bg-orange-50'
//         } else if (fin && fin > anneeFin) {
//           // Mandat a continué après l'année
//           statut = `En poste (jusqu'au ${fin.toLocaleDateString('fr-FR')})`
//           statutColor = 'text-blue-600 bg-blue-50'
//         } else if (debut >= anneeDebut && debut <= anneeFin) {
//           // A commencé pendant l'année
//           statut = `Début le ${debut.toLocaleDateString('fr-FR')}`
//           statutColor = 'text-purple-600 bg-purple-50'
//         }
//       }

//       return {
//         ...item,
//         role_details: roleDetails,
//         statut_annee: statut || 'Hors période',
//         statut_color: statutColor || 'text-gray-600 bg-gray-50',
//         est_actif_pendant_annee: estActifPendantAnnee
//       }
//     })

//     return result as Representant[]
//   } catch (error) {
//     console.error('Erreur inattendue dans getRepresentantsPourAnnee:', error)
//     return []
//   }
// }