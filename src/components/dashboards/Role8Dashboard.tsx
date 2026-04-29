
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
//           <h1 className="text-2xl font-bold">reer Tableau de bord du District</h1>
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


// app/admin/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import * as XLSX from 'xlsx'
import { 
  ChevronLeft, 
  Download,
  RefreshCw,
  LogOut,
  Monitor,
  Cpu,
  HardDrive
} from 'lucide-react'
import Link from 'next/link'

interface SurveyResponse {
  id: string
  created_at: string
  cpu_cores: string
  ram: string
  storage_space: string
  storage_type: string
  architecture: string
  virtualization: boolean
  fingerprint: string
  ip_address: string
}

interface Stats {
  total: number
  uniqueVisitors: number
  cpuDistribution: { name: string; value: number }[]
  ramDistribution: { name: string; value: number }[]
  storageTypeDistribution: { name: string; value: number }[]
  architectureDistribution: { name: string; value: number }[]
  virtualizationSupport: { name: string; value: number }[]
  recentResponses: SurveyResponse[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin2024'

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      loadStats()
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true')
      setIsAuthenticated(true)
      loadStats()
    } else {
      setError('Mot de passe incorrect')
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth')
    setIsAuthenticated(false)
    setStats(null)
    setPassword('')
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedStats = processStats(responses || [])
      setStats(processedStats)
    } catch (error) {
      console.error('Erreur de chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const processStats = (responses: SurveyResponse[]): Stats => {
    const total = responses.length
    const uniqueVisitors = new Set(responses.map(r => r.fingerprint)).size

    // Distribution CPU
    const cpuMap: Record<string, number> = {}
    responses.forEach(r => {
      const cpu = formatCpu(r.cpu_cores)
      cpuMap[cpu] = (cpuMap[cpu] || 0) + 1
    })
    const cpuDistribution = Object.entries(cpuMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Distribution RAM
    const ramMap: Record<string, number> = {}
    responses.forEach(r => {
      const ram = formatRam(r.ram)
      ramMap[ram] = (ramMap[ram] || 0) + 1
    })
    const ramDistribution = Object.entries(ramMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Distribution Stockage
    const storageTypeMap: Record<string, number> = {}
    responses.forEach(r => {
      const storage = formatStorageType(r.storage_type)
      storageTypeMap[storage] = (storageTypeMap[storage] || 0) + 1
    })
    const storageTypeDistribution = Object.entries(storageTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Distribution Architecture
    const archMap: Record<string, number> = {}
    responses.forEach(r => {
      const arch = formatArchitecture(r.architecture)
      archMap[arch] = (archMap[arch] || 0) + 1
    })
    const architectureDistribution = Object.entries(archMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Support virtualisation
    const virtSupport = responses.filter(r => r.virtualization).length
    const noVirtSupport = total - virtSupport
    const virtualizationSupport = [
      { name: 'Supportée', value: virtSupport },
      { name: 'Non supportée', value: noVirtSupport }
    ]

    return {
      total,
      uniqueVisitors,
      cpuDistribution,
      ramDistribution,
      storageTypeDistribution,
      architectureDistribution,
      virtualizationSupport,
      recentResponses: responses.slice(0, 120)
    }
  }

  const formatCpu = (cpu: string): string => {
    const cpus: Record<string, string> = {
      '2_cores': '2 cœurs',
      '4_cores': '4 cœurs',
      '6_cores': '6 cœurs',
      '8_cores': '8 cœurs',
      '8plus_cores': '8+ cœurs',
      'unknown': 'Inconnu'
    }
    return cpus[cpu] || cpu
  }

  const formatRam = (ram: string): string => {
    const rams: Record<string, string> = {
      '4GB': '4 Go',
      '8GB': '8 Go',
      '16GB': '16 Go',
      '32GB': '32 Go',
      '32GB_plus': '32 Go+',
      'unknown': 'Inconnu'
    }
    return rams[ram] || ram
  }

  const formatStorageType = (type: string): string => {
    const types: Record<string, string> = {
      'SSD': 'SSD',
      'HDD': 'HDD',
      'NVMe': 'NVMe',
      'unknown': 'Inconnu'
    }
    return types[type] || type
  }

  const formatArchitecture = (arch: string): string => {
    const archs: Record<string, string> = {
      '64-bit': '64 bits',
      '32-bit': '32 bits',
      'ARM': 'ARM',
      'unknown': 'Inconnu'
    }
    return archs[arch] || arch
  }

  const exportToExcel = async () => {
    if (!stats) return
    
    setExportLoading(true)
    try {
      const { data: responses } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })

      if (!responses) return

      const excelData = responses.map(r => ({
        'Date': new Date(r.created_at).toLocaleString('fr-FR'),
        'CPU': formatCpu(r.cpu_cores),
        'RAM': formatRam(r.ram),
        'Stockage Espace': r.storage_space,
        'Stockage Type': formatStorageType(r.storage_type),
        'Architecture': formatArchitecture(r.architecture),
        'Virtualisation': r.virtualization ? 'Oui' : 'Non',
        'IP': r.ip_address || '-'
      }))

      const ws = XLSX.utils.json_to_sheet(excelData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Réponses')
      XLSX.writeFile(wb, `sondage_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error('Erreur export:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">{payload[0].name}</p>
          <p className="text-sm font-light">
            {payload[0].value} réponse{payload[0].value > 1 ? 's' : ''}
          </p>
        </div>
      )
    }
    return null
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light tracking-wide text-gray-900">Administration (MOT DE PASSE : admin2024)</h2>
              <p className="text-sm text-gray-500 mt-1">Dashboard sondage configuration</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:border-black transition-colors text-sm"
                autoFocus
              />
              
              {error && (
                <p className="text-xs text-red-600 text-center">{error}</p>
              )}
              
              <button
                type="submit"
                className="w-full bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors"
              >
                Se connecter
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw size={24} className="mx-auto text-gray-400 animate-spin mb-3" />
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-400 hover:text-black transition-colors"
              >
                <ChevronLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-light tracking-wide text-gray-900">
                  Dashboard Sondage
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {stats?.total || 0} participations
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadStats}
                className="p-2 text-gray-400 hover:text-black transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-gray-200 p-4">
                <div className="text-2xl font-light">{stats.total}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Monitor size={12} />
                  Participations totales
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-200 p-4">
                <div className="text-2xl font-light text-purple-700">{stats.uniqueVisitors}</div>
                <div className="text-xs text-purple-600 mt-1">Visiteurs uniques</div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* CPU Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <Cpu size={16} />
                  Distribution CPU
                </h3>
                {stats.cpuDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.cpuDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.cpuDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée
                  </div>
                )}
              </div>

              {/* RAM Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                  <HardDrive size={16} />
                  Distribution RAM
                </h3>
                {stats.ramDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.ramDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.ramDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée
                  </div>
                )}
              </div>

              {/* Storage Type Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Type de stockage
                </h3>
                {stats.storageTypeDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.storageTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.storageTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée
                  </div>
                )}
              </div>

              {/* Architecture Distribution */}
              <div className="bg-white border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  Architecture
                </h3>
                {stats.architectureDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats.architectureDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {stats.architectureDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                    Aucune donnée
                  </div>
                )}
              </div>
            </div>

            {/* Virtualisation Chart */}
            <div className="bg-white border border-gray-200 p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Support de la virtualisation
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.virtualizationSupport}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tableau des réponses */}
            <div className="bg-white border border-gray-200 mb-6">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">
                  Dernières participations ({stats?.total || 0})
                </h3>
              </div>
              
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        CPU
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        RAM
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Stockage
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Architecture
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Virtualisation
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats?.recentResponses.map((response) => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          {new Date(response.created_at).toLocaleString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatCpu(response.cpu_cores)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatRam(response.ram)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {response.storage_space} - {formatStorageType(response.storage_type)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatArchitecture(response.architecture)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 text-xs border ${
                            response.virtualization
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {response.virtualization ? 'Oui' : 'Non'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={exportToExcel}
                disabled={exportLoading}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Download size={14} />
                {exportLoading ? 'Export...' : 'Exporter Excel'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}