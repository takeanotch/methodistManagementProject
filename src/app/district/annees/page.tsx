// // app/district/annees/page.tsx
import { getAnnees } from '@/actions/fidele-departement'
import { getDepartements } from '@/actions/departements'
import { getAnneesStatusForDistrict } from '@/actions/annee-district'
import { getCurrentDistrict } from '@/actions/annee-district'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import AnneeManagementClient from './AnneeManagementClient'

// ✅ Interface correspondant à ce qu'attend le composant client
interface AnneeStatusItem {
  id: number
  annee: { id: number; label: string }
  state: string
  is_active: boolean
}

interface AnneeStatus {
  departement: { id: number; nom: string; type: string }
  annees: AnneeStatusItem[]
}

export default async function AnneesPage() {
  // Récupérer le district connecté
  const currentDistrict = await getCurrentDistrict()
  
  if (!currentDistrict) {
    redirect('/login')
  }

  const districtId = currentDistrict.id
  
  // Récupérer toutes les années disponibles
  const annees = await getAnnees()
  
  // Récupérer tous les départements
  const departements = await getDepartements()
  
  // Récupérer le statut des années pour ce district
  const anneesStatusRaw = await getAnneesStatusForDistrict(districtId)

  // ✅ Transformer les données pour correspondre à l'interface attendue
  const anneesStatus: AnneeStatus[] = []
  const departementsMap = new Map<number, AnneeStatusItem[]>()

  // Grouper par département
  anneesStatusRaw.forEach((item: any) => {
    const deptId = item.departement_id
    if (!departementsMap.has(deptId)) {
      departementsMap.set(deptId, [])
    }
    
    const deptAnnees = departementsMap.get(deptId)!
    deptAnnees.push({
      id: item.id,
      annee: item.annee || { id: item.annee_id, label: `Année ${item.annee_id}` },
      state: item.status || (item.is_current ? 'current' : 'past'),
      is_active: item.is_current || false
    })
  })

  // Construire le tableau final avec les infos des départements
  departements.forEach((dept) => {
    const deptAnnees = departementsMap.get(dept.id) || []
    anneesStatus.push({
      departement: dept,
      annees: deptAnnees
    })
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-gray-900">
            Gestion des années - {currentDistrict.nom}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ouvrez et fermez les années pour chaque département
          </p>
        </div>
        <Link
          href="/district/tableau-de-bord"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour au tableau de bord
        </Link>
      </div>

      <AnneeManagementClient
        districtId={districtId}
        departements={departements}
        annees={annees}
        anneesStatus={anneesStatus}
      />
    </div>
  )
}



// // // // app/chef-district/annees/page.tsx
// // // import { redirect } from 'next/navigation'
// // // import { getUser } from '@/actions/auth'
// // // import { getChefDistrictInfo } from '@/actions/chef-district-annees'
// // // import ChefDistrictAnneesClient from './ChefDistrictAnneesClient'

// // // export default async function ChefDistrictAnneesPage() {
// // //   const user = await getUser()

// // //   if (!user) {
// // //     redirect('/login')
// // //   }

// // //   // Vérifier si l'utilisateur est un chef de département
// // //   const chefInfo = await getChefDistrictInfo()

// // //   if (!chefInfo) {
// // //     // Si ce n'est pas un chef, rediriger
// // //     redirect('/profile')
// // //   }

// // //   return <ChefDistrictAnneesClient initialChefInfo={chefInfo} />
// // // }

// // // app/district/dashboard/page.tsx
// // 'use client'

// // import { useEffect, useState } from 'react'
// // import { supabase } from '@/lib/supabase'
// // import { getCurrentFidele } from '@/actions/auth'
// // import { getCurrentAnneeConference } from '@/actions/annee-conference'
// // import { getFidelesByParoisseAndAnnee } from '@/actions/fidele'
// // import { getFidelesByDepartement } from '@/actions/fidele-departement'
// // import { getActivitesByUnite } from '@/actions/activite'
// // import {
// //   Users,
// //   Church,
// //   Calendar,
// //   Activity,
// //   UserCheck,
// //   UserX,
// //   Mars,
// //   Venus,
// //   TrendingUp,
// //   Building2,
// //   MapPin,
// //   Award,
// //   ChevronDown,
// //   ChevronUp
// // } from 'lucide-react'

// // interface ParoisseStat {
// //   id: number
// //   nom: string
// //   totalMembres: number
// //   membresActifs: number
// //   hommes: number
// //   femmes: number
// //   totalDepartements: number
// //   totalRoles: number
// //   activitesPlanifiees: number
// //   activitesTerminees: number
// // }

// // interface DistrictData {
// //   id: number
// //   nom: string
// //   conference: {
// //     id: number
// //     nom: string
// //   } | null
// // }

// // export default function DistrictDashboard() {
// //   const [loading, setLoading] = useState(true)
// //   const [district, setDistrict] = useState<DistrictData | null>(null)
// //   const [paroisses, setParoisses] = useState<ParoisseStat[]>([])
// //   const [expandedParoisse, setExpandedParoisse] = useState<number | null>(null)
// //   const [globalStats, setGlobalStats] = useState({
// //     totalParoisses: 0,
// //     totalMembres: 0,
// //     totalActifs: 0,
// //     totalHommes: 0,
// //     totalFemmes: 0,
// //     totalDepartements: 0,
// //     totalRoles: 0,
// //     totalActivites: 0,
// //     totalActivitesTerminees: 0
// //   })

// //   useEffect(() => {
// //     async function loadDashboard() {
// //       try {
// //         setLoading(true)
        
// //         // Récupérer le fidèle connecté
// //         const fidele = await getCurrentFidele()
// //         if (!fidele || !fidele.paroisse_id) {
// //           setLoading(false)
// //           return
// //         }

// //         // Récupérer le district via la paroisse du fidèle
// //         const { data: paroisseUser, error: paroisseError } = await supabase
// //           .from('paroisse')
// //           .select('district_id')
// //           .eq('id', fidele.paroisse_id)
// //           .single()

// //         if (paroisseError || !paroisseUser?.district_id) {
// //           setLoading(false)
// //           return
// //         }

// //         // Récupérer les infos du district
// //         const { data: districtData, error: districtError } = await supabase
// //           .from('district')
// //           .select(`
// //             id,
// //             nom,
// //             conference:conference_id (
// //               id,
// //               nom
// //             )
// //           `)
// //           .eq('id', paroisseUser.district_id)
// //           .single()

// //         if (districtError || !districtData) {
// //           setLoading(false)
// //           return
// //         }

// //         // Extraire la conférence (peut être un tableau ou un objet)
// //         let conferenceInfo = null
// //         if (districtData.conference) {
// //           if (Array.isArray(districtData.conference) && districtData.conference.length > 0) {
// //             conferenceInfo = districtData.conference[0]
// //           } else if (!Array.isArray(districtData.conference)) {
// //             conferenceInfo = districtData.conference
// //           }
// //         }

// //         setDistrict({
// //           id: districtData.id,
// //           nom: districtData.nom,
// //           conference: conferenceInfo
// //         })

// //         // Récupérer toutes les paroisses du district
// //         const { data: paroissesList, error: paroissesError } = await supabase
// //           .from('paroisse')
// //           .select('id, nom')
// //           .eq('district_id', districtData.id)
// //           .order('nom')

// //         if (paroissesError || !paroissesList || paroissesList.length === 0) {
// //           setLoading(false)
// //           return
// //         }

// //         // Récupérer l'année en cours pour la conférence
// //         let anneeId: number | null = null
// //         if (conferenceInfo?.id) {
// //           const currentAnnee = await getCurrentAnneeConference(conferenceInfo.id)
// //           if (currentAnnee) {
// //             anneeId = currentAnnee.annee_id
// //           }
// //         }

// //         // Calculer les stats pour chaque paroisse
// //         const paroissesStats: ParoisseStat[] = []

// //         for (const paroisse of paroissesList) {
// //           // Membres
// //           const membres = await getFidelesByParoisseAndAnnee(paroisse.id, anneeId || undefined)
          
// //           const totalMembres = membres.length
// //           const membresActifs = membres.filter((m: any) => m.actif === true).length
// //           const hommes = membres.filter((m: any) => m.sexe === 'M').length
// //           const femmes = membres.filter((m: any) => m.sexe === 'F').length

// //           // Départements
// //           const { data: departements } = await supabase
// //             .from('departement')
// //             .select('id, nom')
// //             .eq('paroisse_id', paroisse.id)

// //           const totalDepartements = departements?.length || 0

// //           // Rôles
// //           let totalRoles = 0
// //           for (const dept of departements || []) {
// //             const fidelesDept = await getFidelesByDepartement(dept.id, paroisse.id, anneeId || undefined)
// //             totalRoles += fidelesDept.filter((f: any) => f.est_actif === true).length
// //           }

// //           // Activités - récupérer les unités liées à la paroisse
// //           const { data: unites } = await supabase
// //             .from('unite_organisation')
// //             .select('id')
// //             .eq('id_niveau', paroisse.id)
// //             .eq('niveau', 'paroisse')

// //           let activitesPlanifiees = 0
// //           let activitesTerminees = 0

// //           for (const unite of unites || []) {
// //             const activites = await getActivitesByUnite(unite.id)
// //             activitesPlanifiees += activites.length
// //             activitesTerminees += activites.filter((a: any) => a.statut === 'termine').length
// //           }

// //           paroissesStats.push({
// //             id: paroisse.id,
// //             nom: paroisse.nom,
// //             totalMembres,
// //             membresActifs,
// //             hommes,
// //             femmes,
// //             totalDepartements,
// //             totalRoles,
// //             activitesPlanifiees,
// //             activitesTerminees
// //           })
// //         }

// //         setParoisses(paroissesStats)

// //         // Calculer les stats globales
// //         setGlobalStats({
// //           totalParoisses: paroissesStats.length,
// //           totalMembres: paroissesStats.reduce((acc, p) => acc + p.totalMembres, 0),
// //           totalActifs: paroissesStats.reduce((acc, p) => acc + p.membresActifs, 0),
// //           totalHommes: paroissesStats.reduce((acc, p) => acc + p.hommes, 0),
// //           totalFemmes: paroissesStats.reduce((acc, p) => acc + p.femmes, 0),
// //           totalDepartements: paroissesStats.reduce((acc, p) => acc + p.totalDepartements, 0),
// //           totalRoles: paroissesStats.reduce((acc, p) => acc + p.totalRoles, 0),
// //           totalActivites: paroissesStats.reduce((acc, p) => acc + p.activitesPlanifiees, 0),
// //           totalActivitesTerminees: paroissesStats.reduce((acc, p) => acc + p.activitesTerminees, 0)
// //         })

// //       } catch (error) {
// //         console.error('Erreur lors du chargement:', error)
// //       } finally {
// //         setLoading(false)
// //       }
// //     }

// //     loadDashboard()
// //   }, [])

// //   if (loading) {
// //     return (
// //       <div className="flex items-center justify-center min-h-[400px]">
// //         <div className="text-center">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
// //           <p className="text-gray-500">Chargement des statistiques du district...</p>
// //         </div>
// //       </div>
// //     )
// //   }

// //   if (!district) {
// //     return (
// //       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
// //         <p className="text-yellow-800">Vous n'êtes pas rattaché à un district.</p>
// //       </div>
// //     )
// //   }

// //   const tauxGlobalActif = globalStats.totalMembres > 0 
// //     ? Math.round((globalStats.totalActifs / globalStats.totalMembres) * 100) 
// //     : 0

// //   const tauxRealisationGlobal = globalStats.totalActivites > 0
// //     ? Math.round((globalStats.totalActivitesTerminees / globalStats.totalActivites) * 100)
// //     : 0

// //   const tauxOccupationGlobal = globalStats.totalDepartements > 0
// //     ? Math.round((globalStats.totalRoles / globalStats.totalDepartements) * 100)
// //     : 0

// //   return (
// //     <div className="p-6 space-y-6">
// //       {/* En-tête */}
// //       <div className="flex items-center gap-3 border-b pb-4">
// //         <div className="bg-indigo-100 p-3 rounded-full">
// //           <Building2 className="h-6 w-6 text-indigo-600" />
// //         </div>
// //         <div>
// //           <h1 className="text-2xl font-bold">Tableau de bord du District</h1>
// //           <p className="text-gray-500">
// //             {district.nom}
// //             {district.conference && (
// //               <span className="text-sm"> · {district.conference.nom}</span>
// //             )}
// //           </p>
// //         </div>
// //       </div>

// //       {/* Cartes stats globales */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
// //         <div className="bg-white rounded-lg border p-4 shadow-sm">
// //           <div className="flex items-center justify-between mb-2">
// //             <Church className="h-5 w-5 text-indigo-500" />
// //             <span className="text-xs text-gray-400">District</span>
// //           </div>
// //           <p className="text-2xl font-bold">{globalStats.totalParoisses}</p>
// //           <p className="text-sm text-gray-500">Paroisses</p>
// //         </div>

// //         <div className="bg-white rounded-lg border p-4 shadow-sm">
// //           <div className="flex items-center justify-between mb-2">
// //             <Users className="h-5 w-5 text-blue-500" />
// //             <span className="text-xs text-gray-400">Total</span>
// //           </div>
// //           <p className="text-2xl font-bold">{globalStats.totalMembres}</p>
// //           <p className="text-sm text-gray-500">Membres</p>
// //           <div className="mt-2 flex gap-3 text-xs">
// //             <span className="flex items-center gap-1 text-green-600">
// //               <UserCheck className="h-3 w-3" /> {globalStats.totalActifs} actifs
// //             </span>
// //             <span className="flex items-center gap-1 text-red-600">
// //               <UserX className="h-3 w-3" /> {globalStats.totalMembres - globalStats.totalActifs} inactifs
// //             </span>
// //           </div>
// //           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
// //             <div className="h-full bg-green-500 rounded-full" style={{ width: `${tauxGlobalActif}%` }} />
// //           </div>
// //         </div>

// //         <div className="bg-white rounded-lg border p-4 shadow-sm">
// //           <div className="flex items-center justify-between mb-2">
// //             <div className="flex gap-1">
// //               <Mars className="h-5 w-5 text-blue-500" />
// //               <Venus className="h-5 w-5 text-pink-500" />
// //             </div>
// //             <span className="text-xs text-gray-400">Sexe</span>
// //           </div>
// //           <div className="flex justify-between items-baseline">
// //             <div>
// //               <p className="text-2xl font-bold">{globalStats.totalHommes}</p>
// //               <p className="text-xs text-gray-500">Hommes</p>
// //             </div>
// //             <div className="text-gray-300">|</div>
// //             <div>
// //               <p className="text-2xl font-bold">{globalStats.totalFemmes}</p>
// //               <p className="text-xs text-gray-500">Femmes</p>
// //             </div>
// //           </div>
// //           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
// //             <div className="h-full bg-blue-500 rounded-l-full" style={{ width: `${globalStats.totalMembres ? (globalStats.totalHommes / globalStats.totalMembres) * 100 : 0}%` }} />
// //             <div className="h-full bg-pink-500 rounded-r-full" style={{ width: `${globalStats.totalMembres ? (globalStats.totalFemmes / globalStats.totalMembres) * 100 : 0}%` }} />
// //           </div>
// //         </div>

// //         <div className="bg-white rounded-lg border p-4 shadow-sm">
// //           <div className="flex items-center justify-between mb-2">
// //             <Activity className="h-5 w-5 text-purple-500" />
// //             <span className="text-xs text-gray-400">Organisation</span>
// //           </div>
// //           <div className="flex justify-between items-baseline">
// //             <div>
// //               <p className="text-2xl font-bold">{globalStats.totalDepartements}</p>
// //               <p className="text-xs text-gray-500">Départements</p>
// //             </div>
// //             <div className="text-gray-300">|</div>
// //             <div>
// //               <p className="text-2xl font-bold">{globalStats.totalRoles}</p>
// //               <p className="text-xs text-gray-500">Rôles</p>
// //             </div>
// //           </div>
// //           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
// //             <div className="h-full bg-purple-500 rounded-full" style={{ width: `${tauxOccupationGlobal}%` }} />
// //           </div>
// //           <p className="text-xs text-gray-400 mt-1">Taux d'occupation: {tauxOccupationGlobal}%</p>
// //         </div>
// //       </div>

// //       {/* Cartes supplémentaires */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //         <div className="bg-white rounded-lg border p-4 shadow-sm">
// //           <div className="flex items-center gap-2 mb-3">
// //             <Calendar className="h-5 w-5 text-orange-500" />
// //             <h3 className="font-semibold">Activités du district</h3>
// //           </div>
// //           <div className="flex justify-between items-center">
// //             <div>
// //               <p className="text-3xl font-bold">{globalStats.totalActivites}</p>
// //               <p className="text-sm text-gray-500">Activités planifiées</p>
// //             </div>
// //             <div className="text-center">
// //               <p className="text-3xl font-bold text-green-600">{globalStats.totalActivitesTerminees}</p>
// //               <p className="text-sm text-gray-500">Terminées</p>
// //             </div>
// //             <div className="text-center">
// //               <p className="text-3xl font-bold">{tauxRealisationGlobal}%</p>
// //               <p className="text-sm text-gray-500">Taux</p>
// //             </div>
// //           </div>
// //           <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
// //             <div className="h-full bg-green-500 rounded-full" style={{ width: `${tauxRealisationGlobal}%` }} />
// //           </div>
// //         </div>

// //         <div className="bg-white rounded-lg border p-4 shadow-sm">
// //           <div className="flex items-center gap-2 mb-3">
// //             <TrendingUp className="h-5 w-5 text-green-500" />
// //             <h3 className="font-semibold">Indicateurs clés</h3>
// //           </div>
// //           <div className="grid grid-cols-2 gap-3">
// //             <div>
// //               <p className="text-xs text-gray-500">Moyenne membres/paroisse</p>
// //               <p className="text-xl font-bold">{Math.round(globalStats.totalMembres / globalStats.totalParoisses)}</p>
// //             </div>
// //             <div>
// //               <p className="text-xs text-gray-500">Moyenne dépts/paroisse</p>
// //               <p className="text-xl font-bold">{(globalStats.totalDepartements / globalStats.totalParoisses).toFixed(1)}</p>
// //             </div>
// //             <div>
// //               <p className="text-xs text-gray-500">Moyenne rôles/paroisse</p>
// //               <p className="text-xl font-bold">{(globalStats.totalRoles / globalStats.totalParoisses).toFixed(1)}</p>
// //             </div>
// //             <div>
// //               <p className="text-xs text-gray-500">Ratio H/F</p>
// //               <p className="text-xl font-bold">{globalStats.totalHommes}:{globalStats.totalFemmes}</p>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Liste des paroisses */}
// //       <div className="bg-white rounded-lg border shadow-sm">
// //         <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
// //           <div className="flex items-center gap-2">
// //             <MapPin className="h-5 w-5 text-gray-500" />
// //             <h3 className="font-semibold">Détail par paroisse</h3>
// //             <span className="text-sm text-gray-500 ml-2">{globalStats.totalParoisses} paroisses</span>
// //           </div>
// //         </div>

// //         <div className="divide-y">
// //           {paroisses.map((paroisse) => (
// //             <div key={paroisse.id} className="p-4">
// //               <button
// //                 onClick={() => setExpandedParoisse(expandedParoisse === paroisse.id ? null : paroisse.id)}
// //                 className="w-full flex items-center justify-between"
// //               >
// //                 <div className="flex items-center gap-3">
// //                   <Church className="h-5 w-5 text-indigo-500" />
// //                   <span className="font-medium">{paroisse.nom}</span>
// //                 </div>
// //                 <div className="flex items-center gap-4 text-sm">
// //                   <span className="text-gray-500">{paroisse.totalMembres} membres</span>
// //                   <span className="text-gray-500">{paroisse.totalDepartements} dépts</span>
// //                   <span className="text-gray-500">{paroisse.activitesPlanifiees} activités</span>
// //                   {expandedParoisse === paroisse.id ? (
// //                     <ChevronUp className="h-4 w-4 text-gray-400" />
// //                   ) : (
// //                     <ChevronDown className="h-4 w-4 text-gray-400" />
// //                   )}
// //                 </div>
// //               </button>

// //               {expandedParoisse === paroisse.id && (
// //                 <div className="mt-4 pl-8 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
// //                   <div>
// //                     <p className="text-xs text-gray-500">Membres actifs</p>
// //                     <p className="font-semibold">{paroisse.membresActifs} / {paroisse.totalMembres}</p>
// //                     <div className="h-1 bg-gray-100 rounded-full mt-1 w-20">
// //                       <div className="h-full bg-green-500 rounded-full" style={{ width: `${paroisse.totalMembres ? (paroisse.membresActifs / paroisse.totalMembres) * 100 : 0}%` }} />
// //                     </div>
// //                   </div>
// //                   <div>
// //                     <p className="text-xs text-gray-500">Hommes / Femmes</p>
// //                     <p className="font-semibold">{paroisse.hommes} / {paroisse.femmes}</p>
// //                   </div>
// //                   <div>
// //                     <p className="text-xs text-gray-500">Rôles occupés</p>
// //                     <p className="font-semibold">{paroisse.totalRoles} / {paroisse.totalDepartements}</p>
// //                     <p className="text-xs text-gray-400">{paroisse.totalDepartements ? (paroisse.totalRoles / paroisse.totalDepartements).toFixed(1) : '0'} par dépt</p>
// //                   </div>
// //                   <div>
// //                     <p className="text-xs text-gray-500">Activités terminées</p>
// //                     <p className="font-semibold">{paroisse.activitesTerminees} / {paroisse.activitesPlanifiees}</p>
// //                     <p className="text-xs text-gray-400">{paroisse.activitesPlanifiees ? Math.round((paroisse.activitesTerminees / paroisse.activitesPlanifiees) * 100) : 0}% réalisé</p>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           ))}
// //         </div>
// //       </div>

// //       {/* Résumé du district */}
// //       <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
// //         <div className="flex items-center gap-2 mb-2">
// //           <Award className="h-5 w-5 text-indigo-600" />
// //           <h3 className="font-semibold text-indigo-800">Synthèse du District {district.nom}</h3>
// //         </div>
// //         <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
// //           <div>
// //             <p className="text-gray-600">Paroisses</p>
// //             <p className="font-bold text-lg">{globalStats.totalParoisses}</p>
// //           </div>
// //           <div>
// //             <p className="text-gray-600">Membres</p>
// //             <p className="font-bold text-lg">{globalStats.totalMembres}</p>
// //           </div>
// //           <div>
// //             <p className="text-gray-600">Taux activité</p>
// //             <p className="font-bold text-lg">{tauxGlobalActif}%</p>
// //           </div>
// //           <div>
// //             <p className="text-gray-600">Départements</p>
// //             <p className="font-bold text-lg">{globalStats.totalDepartements}</p>
// //           </div>
// //           <div>
// //             <p className="text-gray-600">Taux réalisation</p>
// //             <p className="font-bold text-lg">{tauxRealisationGlobal}%</p>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }
// // app/district/dashboard/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import { getCurrentFidele } from '@/actions/auth'
// import { getCurrentAnneeConference } from '@/actions/annee-conference'
// import { getFidelesByParoisseAndAnnee } from '@/actions/fidele'
// import { getFidelesByDepartement } from '@/actions/fidele-departement'
// import { getActivitesByUnite } from '@/actions/activite'
// import {
//   Users,
//   Church,
//   Calendar,
//   Activity,
//   UserCheck,
//   UserX,
//  Mars,
//   Venus,
//   TrendingUp,
//   Building2,
//   MapPin,
//   Award,
//   ChevronDown,
//   ChevronUp
// } from 'lucide-react'

// interface ParoisseStat {
//   id: number
//   nom: string
//   totalMembres: number
//   membresActifs: number
//   hommes: number
//   femmes: number
//   totalDepartements: number
//   totalRolesOccupes: number
//   activitesPlanifiees: number
//   activitesTerminees: number
// }

// interface DistrictData {
//   id: number
//   nom: string
//   conference: {
//     id: number
//     nom: string
//   } | null
// }

// export default function DistrictDashboard() {
//   const [loading, setLoading] = useState(true)
//   const [district, setDistrict] = useState<DistrictData | null>(null)
//   const [paroisses, setParoisses] = useState<ParoisseStat[]>([])
//   const [expandedParoisse, setExpandedParoisse] = useState<number | null>(null)
//   const [globalStats, setGlobalStats] = useState({
//     totalParoisses: 0,
//     totalMembres: 0,
//     totalActifs: 0,
//     totalHommes: 0,
//     totalFemmes: 0,
//     totalDepartements: 0,
//     totalRolesOccupes: 0,
//     totalActivites: 0,
//     totalActivitesTerminees: 0
//   })

//   useEffect(() => {
//     async function loadDashboard() {
//       try {
//         setLoading(true)
        
//         // Récupérer le fidèle connecté
//         const fidele = await getCurrentFidele()
//         if (!fidele || !fidele.paroisse_id) {
//           setLoading(false)
//           return
//         }

//         // Récupérer le district via la paroisse du fidèle
//         const { data: paroisseUser, error: paroisseError } = await supabase
//           .from('paroisse')
//           .select('district_id')
//           .eq('id', fidele.paroisse_id)
//           .single()

//         if (paroisseError || !paroisseUser?.district_id) {
//           setLoading(false)
//           return
//         }

//         // Récupérer les infos du district
//         const { data: districtData, error: districtError } = await supabase
//           .from('district')
//           .select(`
//             id,
//             nom,
//             conference:conference_id (
//               id,
//               nom
//             )
//           `)
//           .eq('id', paroisseUser.district_id)
//           .single()

//         if (districtError || !districtData) {
//           setLoading(false)
//           return
//         }

//         // Extraire la conférence
//         let conferenceInfo = null
//         if (districtData.conference) {
//           if (Array.isArray(districtData.conference) && districtData.conference.length > 0) {
//             conferenceInfo = districtData.conference[0]
//           } else if (!Array.isArray(districtData.conference)) {
//             conferenceInfo = districtData.conference
//           }
//         }

//         setDistrict({
//           id: districtData.id,
//           nom: districtData.nom,
//           conference: conferenceInfo
//         })

//         // Récupérer toutes les paroisses du district
//         const { data: paroissesList, error: paroissesError } = await supabase
//           .from('paroisse')
//           .select('id, nom')
//           .eq('district_id', districtData.id)
//           .order('nom')

//         if (paroissesError || !paroissesList || paroissesList.length === 0) {
//           setLoading(false)
//           return
//         }

//         // Récupérer l'année en cours pour la conférence
//         let anneeId: number | null = null
//         if (conferenceInfo?.id) {
//           const currentAnnee = await getCurrentAnneeConference(conferenceInfo.id)
//           if (currentAnnee) {
//             anneeId = currentAnnee.annee_id
//           }
//         }

//         // Calculer les stats pour chaque paroisse
//         const paroissesStats: ParoisseStat[] = []

//         for (const paroisse of paroissesList) {
//           // 1. Membres via fidele_paroisse
//           const membres = await getFidelesByParoisseAndAnnee(paroisse.id, anneeId || undefined)
          
//           const totalMembres = membres.length
//           const membresActifs = membres.filter((m: any) => m.actif === true).length
//           const hommes = membres.filter((m: any) => m.sexe === 'M').length
//           const femmes = membres.filter((m: any) => m.sexe === 'F').length

//           // 2. Départements de la paroisse
//           const { data: departements } = await supabase
//             .from('departement')
//             .select('id, nom')
//             .eq('paroisse_id', paroisse.id)

//           const totalDepartements = departements?.length || 0

//           // 3. Rôles occupés (actifs) - utilisation correcte de getFidelesByDepartement
//           let totalRolesOccupes = 0
//           for (const dept of departements || []) {
//             // getFidelesByDepartement retourne déjà uniquement les actifs (est_actif = true)
//             const fidelesDept = await getFidelesByDepartement(dept.id, paroisse.id, anneeId || undefined)
//             // Chaque entrée dans fidelesDept représente un rôle occupé par un fidèle
//             totalRolesOccupes += fidelesDept.length
//           }

//           // 4. Activités
//           const { data: unites } = await supabase
//             .from('unite_organisation')
//             .select('id')
//             .eq('id_niveau', paroisse.id)
//             .eq('niveau', 'paroisse')

//           let activitesPlanifiees = 0
//           let activitesTerminees = 0

//           for (const unite of unites || []) {
//             const activites = await getActivitesByUnite(unite.id)
//             activitesPlanifiees += activites.length
//             activitesTerminees += activites.filter((a: any) => a.statut === 'termine').length
//           }

//           paroissesStats.push({
//             id: paroisse.id,
//             nom: paroisse.nom,
//             totalMembres,
//             membresActifs,
//             hommes,
//             femmes,
//             totalDepartements,
//             totalRolesOccupes,
//             activitesPlanifiees,
//             activitesTerminees
//           })
//         }

//         setParoisses(paroissesStats)

//         // Calculer les stats globales
//         setGlobalStats({
//           totalParoisses: paroissesStats.length,
//           totalMembres: paroissesStats.reduce((acc, p) => acc + p.totalMembres, 0),
//           totalActifs: paroissesStats.reduce((acc, p) => acc + p.membresActifs, 0),
//           totalHommes: paroissesStats.reduce((acc, p) => acc + p.hommes, 0),
//           totalFemmes: paroissesStats.reduce((acc, p) => acc + p.femmes, 0),
//           totalDepartements: paroissesStats.reduce((acc, p) => acc + p.totalDepartements, 0),
//           totalRolesOccupes: paroissesStats.reduce((acc, p) => acc + p.totalRolesOccupes, 0),
//           totalActivites: paroissesStats.reduce((acc, p) => acc + p.activitesPlanifiees, 0),
//           totalActivitesTerminees: paroissesStats.reduce((acc, p) => acc + p.activitesTerminees, 0)
//         })

//       } catch (error) {
//         console.error('Erreur lors du chargement:', error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadDashboard()
//   }, [])

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
//           <p className="text-gray-500">Chargement des statistiques du district...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!district) {
//     return (
//       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
//         <p className="text-yellow-800">Vous n'êtes pas rattaché à un district.</p>
//       </div>
//     )
//   }

//   const tauxGlobalActif = globalStats.totalMembres > 0 
//     ? Math.round((globalStats.totalActifs / globalStats.totalMembres) * 100) 
//     : 0

//   const tauxRealisationGlobal = globalStats.totalActivites > 0
//     ? Math.round((globalStats.totalActivitesTerminees / globalStats.totalActivites) * 100)
//     : 0

//   const tauxOccupationGlobal = globalStats.totalDepartements > 0
//     ? Math.round((globalStats.totalRolesOccupes / globalStats.totalDepartements) * 100)
//     : 0

//   const rolesParDepartement = globalStats.totalDepartements > 0
//     ? (globalStats.totalRolesOccupes / globalStats.totalDepartements).toFixed(1)
//     : '0'

//   return (
//     <div className="p-6 space-y-6">
//       {/* En-tête */}
//       <div className="flex items-center gap-3 border-b pb-4">
//         <div className="bg-indigo-100 p-3 rounded-full">
//           <Building2 className="h-6 w-6 text-indigo-600" />
//         </div>
//         <div>
//           <h1 className="text-2xl font-bold">Tableau de bord du District</h1>
//           <p className="text-gray-500">
//             {district.nom}
//             {district.conference && (
//               <span className="text-sm"> · {district.conference.nom}</span>
//             )}
//           </p>
//         </div>
//       </div>

//       {/* Cartes stats globales */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <Church className="h-5 w-5 text-indigo-500" />
//             <span className="text-xs text-gray-400">District</span>
//           </div>
//           <p className="text-2xl font-bold">{globalStats.totalParoisses}</p>
//           <p className="text-sm text-gray-500">Paroisses</p>
//         </div>

//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <Users className="h-5 w-5 text-blue-500" />
//             <span className="text-xs text-gray-400">Total</span>
//           </div>
//           <p className="text-2xl font-bold">{globalStats.totalMembres}</p>
//           <p className="text-sm text-gray-500">Membres</p>
//           <div className="mt-2 flex gap-3 text-xs">
//             <span className="flex items-center gap-1 text-green-600">
//               <UserCheck className="h-3 w-3" /> {globalStats.totalActifs} actifs
//             </span>
//             <span className="flex items-center gap-1 text-red-600">
//               <UserX className="h-3 w-3" /> {globalStats.totalMembres - globalStats.totalActifs} inactifs
//             </span>
//           </div>
//           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//             <div className="h-full bg-green-500 rounded-full" style={{ width: `${tauxGlobalActif}%` }} />
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <div className="flex gap-1">
//               <Mars className="h-5 w-5 text-blue-500" />
//               <Venus className="h-5 w-5 text-pink-500" />
//             </div>
//             <span className="text-xs text-gray-400">Sexe</span>
//           </div>
//           <div className="flex justify-between items-baseline">
//             <div>
//               <p className="text-2xl font-bold">{globalStats.totalHommes}</p>
//               <p className="text-xs text-gray-500">Hommes</p>
//             </div>
//             <div className="text-gray-300">|</div>
//             <div>
//               <p className="text-2xl font-bold">{globalStats.totalFemmes}</p>
//               <p className="text-xs text-gray-500">Femmes</p>
//             </div>
//           </div>
//           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
//             <div className="h-full bg-blue-500 rounded-l-full" style={{ width: `${globalStats.totalMembres ? (globalStats.totalHommes / globalStats.totalMembres) * 100 : 0}%` }} />
//             <div className="h-full bg-pink-500 rounded-r-full" style={{ width: `${globalStats.totalMembres ? (globalStats.totalFemmes / globalStats.totalMembres) * 100 : 0}%` }} />
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <Activity className="h-5 w-5 text-purple-500" />
//             <span className="text-xs text-gray-400">Organisation</span>
//           </div>
//           <div className="flex justify-between items-baseline">
//             <div>
//               <p className="text-2xl font-bold">{globalStats.totalDepartements}</p>
//               <p className="text-xs text-gray-500">Départements</p>
//             </div>
//             <div className="text-gray-300">|</div>
//             <div>
//               <p className="text-2xl font-bold">{globalStats.totalRolesOccupes}</p>
//               <p className="text-xs text-gray-500">Rôles occupés</p>
//             </div>
//           </div>
//           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//             <div className="h-full bg-purple-500 rounded-full" style={{ width: `${tauxOccupationGlobal}%` }} />
//           </div>
//           <p className="text-xs text-gray-400 mt-1">Taux d'occupation: {tauxOccupationGlobal}%</p>
//         </div>
//       </div>

//       {/* Cartes supplémentaires */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center gap-2 mb-3">
//             <Calendar className="h-5 w-5 text-orange-500" />
//             <h3 className="font-semibold">Activités du district</h3>
//           </div>
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="text-3xl font-bold">{globalStats.totalActivites}</p>
//               <p className="text-sm text-gray-500">Activités planifiées</p>
//             </div>
//             <div className="text-center">
//               <p className="text-3xl font-bold text-green-600">{globalStats.totalActivitesTerminees}</p>
//               <p className="text-sm text-gray-500">Terminées</p>
//             </div>
//             <div className="text-center">
//               <p className="text-3xl font-bold">{tauxRealisationGlobal}%</p>
//               <p className="text-sm text-gray-500">Taux</p>
//             </div>
//           </div>
//           <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
//             <div className="h-full bg-green-500 rounded-full" style={{ width: `${tauxRealisationGlobal}%` }} />
//           </div>
//         </div>

//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center gap-2 mb-3">
//             <TrendingUp className="h-5 w-5 text-green-500" />
//             <h3 className="font-semibold">Indicateurs clés</h3>
//           </div>
//           <div className="grid grid-cols-2 gap-3">
//             <div>
//               <p className="text-xs text-gray-500">Moyenne membres/paroisse</p>
//               <p className="text-xl font-bold">{Math.round(globalStats.totalMembres / globalStats.totalParoisses)}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500">Moyenne dépts/paroisse</p>
//               <p className="text-xl font-bold">{(globalStats.totalDepartements / globalStats.totalParoisses).toFixed(1)}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500">Rôles par département</p>
//               <p className="text-xl font-bold">{rolesParDepartement}</p>
//             </div>
//             <div>
//               <p className="text-xs text-gray-500">Ratio H/F</p>
//               <p className="text-xl font-bold">{globalStats.totalHommes}:{globalStats.totalFemmes}</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Liste des paroisses */}
//       <div className="bg-white rounded-lg border shadow-sm">
//         <div className="px-4 py-3 border-b bg-gray-50 rounded-t-lg">
//           <div className="flex items-center gap-2">
//             <MapPin className="h-5 w-5 text-gray-500" />
//             <h3 className="font-semibold">Détail par paroisse</h3>
//             <span className="text-sm text-gray-500 ml-2">{globalStats.totalParoisses} paroisses</span>
//           </div>
//         </div>

//         <div className="divide-y">
//           {paroisses.map((paroisse) => (
//             <div key={paroisse.id} className="p-4">
//               <button
//                 onClick={() => setExpandedParoisse(expandedParoisse === paroisse.id ? null : paroisse.id)}
//                 className="w-full flex items-center justify-between"
//               >
//                 <div className="flex items-center gap-3">
//                   <Church className="h-5 w-5 text-indigo-500" />
//                   <span className="font-medium">{paroisse.nom}</span>
//                 </div>
//                 <div className="flex items-center gap-4 text-sm">
//                   <span className="text-gray-500">{paroisse.totalMembres} membres</span>
//                   <span className="text-gray-500">{paroisse.totalDepartements} dépts</span>
//                   <span className="text-gray-500">{paroisse.totalRolesOccupes} rôles</span>
//                   <span className="text-gray-500">{paroisse.activitesPlanifiees} activités</span>
//                   {expandedParoisse === paroisse.id ? (
//                     <ChevronUp className="h-4 w-4 text-gray-400" />
//                   ) : (
//                     <ChevronDown className="h-4 w-4 text-gray-400" />
//                   )}
//                 </div>
//               </button>

//               {expandedParoisse === paroisse.id && (
//                 <div className="mt-4 pl-8 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
//                   <div>
//                     <p className="text-xs text-gray-500">Membres actifs</p>
//                     <p className="font-semibold">{paroisse.membresActifs} / {paroisse.totalMembres}</p>
//                     <div className="h-1 bg-gray-100 rounded-full mt-1 w-20">
//                       <div className="h-full bg-green-500 rounded-full" style={{ width: `${paroisse.totalMembres ? (paroisse.membresActifs / paroisse.totalMembres) * 100 : 0}%` }} />
//                     </div>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Hommes / Femmes</p>
//                     <p className="font-semibold">{paroisse.hommes} / {paroisse.femmes}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Rôles occupés</p>
//                     <p className="font-semibold">{paroisse.totalRolesOccupes} / {paroisse.totalDepartements}</p>
//                     <p className="text-xs text-gray-400">{paroisse.totalDepartements ? (paroisse.totalRolesOccupes / paroisse.totalDepartements).toFixed(1) : '0'} par dépt</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-gray-500">Activités terminées</p>
//                     <p className="font-semibold">{paroisse.activitesTerminees} / {paroisse.activitesPlanifiees}</p>
//                     <p className="text-xs text-gray-400">{paroisse.activitesPlanifiees ? Math.round((paroisse.activitesTerminees / paroisse.activitesPlanifiees) * 100) : 0}% réalisé</p>
//                   </div>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Résumé du district */}
//       <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
//         <div className="flex items-center gap-2 mb-2">
//           <Award className="h-5 w-5 text-indigo-600" />
//           <h3 className="font-semibold text-indigo-800">Synthèse du District {district.nom}</h3>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
//           <div>
//             <p className="text-gray-600">Paroisses</p>
//             <p className="font-bold text-lg">{globalStats.totalParoisses}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Membres</p>
//             <p className="font-bold text-lg">{globalStats.totalMembres}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Taux activité</p>
//             <p className="font-bold text-lg">{tauxGlobalActif}%</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Départements</p>
//             <p className="font-bold text-lg">{globalStats.totalDepartements}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Rôles occupés</p>
//             <p className="font-bold text-lg">{globalStats.totalRolesOccupes}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Taux réalisation</p>
//             <p className="font-bold text-lg">{tauxRealisationGlobal}%</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }