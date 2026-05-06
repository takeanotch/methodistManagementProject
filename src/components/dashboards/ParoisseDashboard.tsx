
// // app/paroisse/dashboard/page.tsx
// 'use client'

// import { useEffect, useState } from 'react'
// import { 
//   Users, 
//   UserCheck, 
//   UserX, 
//   Baby, 
//   User as UserIcon, 
//   Briefcase, 
//   Heart,
//   TrendingUp,
//   Calendar,
//   Phone,
//   MapPin,
//   Shield,
//   Mail,
//   ChevronRight,
//   Download,
//   Filter,
//   BarChart3,
//   PieChart,
//   Activity
// } from 'lucide-react'
// import { 
//   LineChart, 
//   Line, 
//   BarChart, 
//   Bar, 
//   PieChart as RePieChart, 
//   Pie, 
//   Cell, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   Legend, 
//   ResponsiveContainer,
//   AreaChart,
//   Area
// } from 'recharts'
// import { supabase } from '@/lib/supabase'
// import { getUser, getCurrentFidele } from '@/actions/auth'
// import { getCurrentAnneeConference, getAnneesByConference } from '@/actions/annee-conference'

// interface DashboardStats {
//   total: number
//   actifs: number
//   inactifs: number
//   hommes: number
//   femmes: number
//   nonRenseigne: number
//   ageMoyen: number | null
//   categories: {
//     enfants: number
//     jeunes: number
//     adultes: number
//     vieillards: number
//   }
//   avecCompte: number
//   sansCompte: number
//   parRole: {
//     [key: string]: number
//   }
//   parType: {
//     [key: string]: number
//   }
//   inscriptionsMensuelles: {
//     mois: string
//     total: number
//     actifs: number
//   }[]
//   repartitionAge: {
//     tranche: string
//     count: number
//   }[]
//   evolutionAnnuelle: {
//     annee: string
//     total: number
//     actifs: number
//   }[]
// }

// const COLORS = {
//   actif: '#10b981',
//   inactif: '#ef4444',
//   homme: '#3b82f6',
//   femme: '#ec4899',
//   enfant: '#f97316',
//   jeune: '#22c55e',
//   adulte: '#3b82f6',
//   vieillard: '#8b5cf6',
//   avecCompte: '#06b6d4',
//   sansCompte: '#6b7280'
// }

// const TRANCHES_AGE = [
//   { min: 0, max: 12, label: '0-12 ans', color: '#f97316' },
//   { min: 13, max: 18, label: '13-18 ans', color: '#eab308' },
//   { min: 19, max: 25, label: '19-25 ans', color: '#22c55e' },
//   { min: 26, max: 35, label: '26-35 ans', color: '#3b82f6' },
//   { min: 36, max: 50, label: '36-50 ans', color: '#8b5cf6' },
//   { min: 51, max: 65, label: '51-65 ans', color: '#ec4899' },
//   { min: 66, max: 120, label: '65+ ans', color: '#ef4444' }
// ]

// export default function DashboardPage() {
//   const [stats, setStats] = useState<DashboardStats | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
//   const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
//   const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

//   useEffect(() => {
//     loadDashboardData()
//   }, [selectedAnnee])

//   async function loadDashboardData() {
//     try {
//       setLoading(true)
//       const user = await getUser()
//       const currentFidele = await getCurrentFidele()

//       if (!currentFidele?.paroisse_id) {
//         console.error('Aucune paroisse trouvée')
//         return
//       }

//       // Récupérer la conférence de la paroisse
//       const { data: paroisse } = await supabase
//         .from('paroisse')
//         .select(`
//           district:district_id (
//             conference:conference_id (id)
//           )
//         `)
//         .eq('id', currentFidele.paroisse_id)
//         .single()

//       let conferenceId = null
//       if (paroisse?.district) {
//         const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
//         if (district?.conference) {
//           const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
//           conferenceId = conference?.id
//         }
//       }

//       // Récupérer les années disponibles
//       if (conferenceId) {
//         const annees = await getAnneesByConference(conferenceId)
//         setAnneesDisponibles(annees)
        
//         if (selectedAnnee === null && annees.length > 0) {
//           const currentAnnee = annees.find(a => a.is_current)
//           setSelectedAnnee(currentAnnee?.id || annees[0]?.id)
//         }
//       }

//       // Construire la requête de base
//       let query = supabase
//         .from('fidele')
//         .select(`
//           *,
//           compte:compte (
//             id,
//             role_id,
//             role:role_id (nom)
//           ),
//           fidele_paroisse!inner (
//             annee_conference_id
//           )
//         `)
//         .eq('fidele_paroisse.paroisse_id', currentFidele.paroisse_id)

//       if (selectedAnnee) {
//         query = query.eq('fidele_paroisse.annee_conference_id', selectedAnnee)
//       } else if (anneesDisponibles.length > 0) {
//         const currentAnnee = anneesDisponibles.find(a => a.is_current)
//         if (currentAnnee) {
//           query = query.eq('fidele_paroisse.annee_conference_id', currentAnnee.id)
//         }
//       }

//       const { data: fideles, error } = await query

//       if (error) {
//         console.error('Erreur chargement données:', error)
//         return
//       }

//       // Statistiques de base
//       const total = fideles.length
//       const actifs = fideles.filter((f: any) => f.actif).length
//       const inactifs = total - actifs
//       const hommes = fideles.filter((f: any) => f.sexe === 'M').length
//       const femmes = fideles.filter((f: any) => f.sexe === 'F').length
//       const nonRenseigne = fideles.filter((f: any) => !f.sexe).length

//       // Statistiques par catégorie
//       const categories = {
//         enfants: fideles.filter((f: any) => f.fidele_type === 'enfant').length,
//         jeunes: fideles.filter((f: any) => f.fidele_type === 'jeune').length,
//         adultes: fideles.filter((f: any) => f.fidele_type === 'adulte').length,
//         vieillards: fideles.filter((f: any) => f.fidele_type === 'vieillard').length
//       }

//       // Comptes
//       const avecCompte = fideles.filter((f: any) => f.compte && f.compte.length > 0).length
//       const sansCompte = total - avecCompte

//       // Statistiques par rôle
//       const parRole: { [key: string]: number } = {}
//       fideles.forEach((f: any) => {
//         if (f.compte && f.compte.length > 0) {
//           const role = f.compte[0]?.role
//           if (role) {
//             const roleNom = Array.isArray(role) ? role[0]?.nom : role?.nom
//             if (roleNom) {
//               parRole[roleNom] = (parRole[roleNom] || 0) + 1
//             }
//           }
//         }
//       })

//       // Âge moyen
//       const currentYear = new Date().getFullYear()
//       const ages = fideles
//         .filter((f: any) => f.annee_naissance)
//         .map((f: any) => currentYear - f.annee_naissance)
//       const ageMoyen = ages.length > 0 
//         ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
//         : null

//       // Répartition par tranche d'âge
//       const repartitionAge = TRANCHES_AGE.map(tranche => ({
//         tranche: tranche.label,
//         count: fideles.filter((f: any) => {
//           if (!f.annee_naissance) return false
//           const age = currentYear - f.annee_naissance
//           return age >= tranche.min && age <= tranche.max
//         }).length
//       }))

//       // Évolution annuelle (simulée avec données réelles)
//       const annees = [...new Set(fideles.map((f: any) => 
//         new Date(f.created_at).getFullYear()
//       ))].sort()

//       const evolutionAnnuelle = annees.map(annee => ({
//         annee: annee.toString(),
//         total: fideles.filter((f: any) => 
//           new Date(f.created_at).getFullYear() === annee
//         ).length,
//         actifs: fideles.filter((f: any) => 
//           new Date(f.created_at).getFullYear() === annee && f.actif
//         ).length
//       }))

//       // Inscriptions mensuelles (derniers 12 mois)
//       const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
//       const inscriptionsMensuelles = moisLabels.map((mois, index) => {
//         const inscrits = fideles.filter((f: any) => {
//           const date = new Date(f.created_at)
//           return date.getMonth() === index && date.getFullYear() === new Date().getFullYear()
//         })
//         return {
//           mois,
//           total: inscrits.length,
//           actifs: inscrits.filter((f: any) => f.actif).length
//         }
//       })

//       setStats({
//         total,
//         actifs,
//         inactifs,
//         hommes,
//         femmes,
//         nonRenseigne,
//         ageMoyen,
//         categories,
//         avecCompte,
//         sansCompte,
//         parRole,
//         parType: categories,
//         inscriptionsMensuelles,
//         repartitionAge,
//         evolutionAnnuelle
//       })

//     } catch (error) {
//       console.error('Erreur chargement dashboard:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen ">
//         <div className="text-center">
//           <p className="text-gray-500">Chargement des statistiques...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!stats) {
//     return (
//       <div className="p-8 text-center">
//         <p className="text-gray-500">Aucune donnée disponible</p>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b  border-gray-200 sticky top-0 z-10">
//         <div className="px-6 py-4">
//           <div className="flex items-center justify-between">
//             <div>
//               <h1 className="text-2xl font-light tracking-wide">Tableau de bord</h1>
//               <p className="text-sm text-gray-500 mt-0.5">Statistiques et analyses des fidèles</p>
//             </div>
            
//             {/* Sélecteur d'année */}
//             {anneesDisponibles.length > 0 && (
//               <select
//                 value={selectedAnnee || ''}
//                 onChange={(e) => setSelectedAnnee(parseInt(e.target.value))}
//                 className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white -lg"
//               >
//                 {anneesDisponibles.map((annee) => (
//                   <option key={annee.id} value={annee.id}>
//                     {annee.annee?.label} {annee.is_current ? '(en cours)' : ''}
//                   </option>
//                 ))}
//               </select>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className=" max-w-7xl mx-auto space-y-6">
//         {/* Cartes KPI */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           <div className="bg-white -lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Total fidèles</p>
//                 <p className="text-3xl font-light">{stats.total}</p>
//                 <p className="text-xs text-green-600 mt-2">
//                   +{stats.inscriptionsMensuelles.slice(-3).reduce((sum, m) => sum + m.total, 0)} derniers mois
//                 </p>
//               </div>
//               <div className="w-12 h-12 bg-blue-50 -full flex items-center justify-center">
//                 <Users className="w-6 h-6 text-blue-500" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white -lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Fidèles actifs</p>
//                 <p className="text-3xl font-light text-green-600">{stats.actifs}</p>
//                 <p className="text-xs text-gray-500 mt-2">
//                   {Math.round((stats.actifs / stats.total) * 100)}% du total
//                 </p>
//               </div>
//               <div className="w-12 h-12 bg-green-50 -full flex items-center justify-center">
//                 <UserCheck className="w-6 h-6 text-green-500" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white -lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Avec compte</p>
//                 <p className="text-3xl font-light text-cyan-600">{stats.avecCompte}</p>
//                 <p className="text-xs text-gray-500 mt-2">
//                   {Math.round((stats.avecCompte / stats.total) * 100)}% ont un compte
//                 </p>
//               </div>
//               <div className="w-12 h-12 bg-cyan-50 -full flex items-center justify-center">
//                 <Shield className="w-6 h-6 text-cyan-500" />
//               </div>
//             </div>
//           </div>

//           <div className="bg-white -lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm text-gray-500 mb-1">Âge moyen</p>
//                 <p className="text-3xl font-light">{stats.ageMoyen || 'N/A'}</p>
//                 <p className="text-xs text-gray-500 mt-2">ans</p>
//               </div>
//               <div className="w-12 h-12 bg-purple-50 -full flex items-center justify-center">
//                 <Calendar className="w-6 h-6 text-purple-500" />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Graphiques principaux */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Répartition par catégorie d'âge */}
//           <div className="bg-white -lg border border-gray-200 p-4">
//             <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
//               <PieChart className="w-4 h-4" />
//               Répartition par tranche d'âge
//             </h3>
//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <RePieChart>
//                   <Pie
//                     data={stats.repartitionAge.filter(t => t.count > 0)}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={100}
//                     paddingAngle={2}
//                     dataKey="count"
//                     label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
//                   >
//                     {stats.repartitionAge.filter(t => t.count > 0).map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={TRANCHES_AGE.find(t => t.label === entry.tranche)?.color || '#ccc'} />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                   <Legend />
//                 </RePieChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* Évolution des inscriptions */}
//           <div className="bg-white -lg border border-gray-200 p-4">
//             <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
//               <TrendingUp className="w-4 h-4" />
//               Évolution des inscriptions
//             </h3>
//             <div className="h-80">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={stats.inscriptionsMensuelles}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="mois" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Area type="monotone" dataKey="total" stroke={COLORS.actif} fill={COLORS.actif} fillOpacity={0.3} name="Inscriptions" />
//                   <Area type="monotone" dataKey="actifs" stroke={COLORS.avecCompte} fill={COLORS.avecCompte} fillOpacity={0.3} name="Actifs" />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {/* Répartition Hommes/Femmes */}
//           <div className="bg-white -lg border border-gray-200 p-4">
//             <h3 className="text-sm font-medium text-gray-700 mb-4">Répartition par sexe</h3>
//             <div className="space-y-4">
//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span>Hommes</span>
//                   <span>{stats.hommes} ({Math.round((stats.hommes / stats.total) * 100)}%)</span>
//                 </div>
//                 <div className="w-full bg-gray-200 -full h-2">
//                   <div 
//                     className="bg-blue-500 h-2 -full transition-all"
//                     style={{ width: `${(stats.hommes / stats.total) * 100}%` }}
//                   />
//                 </div>
//               </div>
//               <div>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span>Femmes</span>
//                   <span>{stats.femmes} ({Math.round((stats.femmes / stats.total) * 100)}%)</span>
//                 </div>
//                 <div className="w-full bg-gray-200 -full h-2">
//                   <div 
//                     className="bg-pink-500 h-2 -full transition-all"
//                     style={{ width: `${(stats.femmes / stats.total) * 100}%` }}
//                   />
//                 </div>
//               </div>
//               {stats.nonRenseigne > 0 && (
//                 <div>
//                   <div className="flex justify-between text-sm mb-1">
//                     <span>Non renseigné</span>
//                     <span>{stats.nonRenseigne} ({Math.round((stats.nonRenseigne / stats.total) * 100)}%)</span>
//                   </div>
//                   <div className="w-full bg-gray-200 -full h-2">
//                     <div 
//                       className="bg-gray-400 h-2 -full transition-all"
//                       style={{ width: `${(stats.nonRenseigne / stats.total) * 100}%` }}
//                     />
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Répartition par catégorie */}
//           <div className="bg-white -lg border border-gray-200 p-4">
//             <h3 className="text-sm font-medium text-gray-700 mb-4">Répartition par catégorie</h3>
//             <div className="grid grid-cols-2 gap-4">
//               <div className="text-center p-3 bg-orange-50 -lg">
//                 <Baby className="w-6 h-6 text-orange-500 mx-auto mb-2" />
//                 <p className="text-2xl font-light">{stats.categories.enfants}</p>
//                 <p className="text-xs text-gray-500">Enfants</p>
//               </div>
//               <div className="text-center p-3 bg-green-50 -lg">
//                 <UserIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
//                 <p className="text-2xl font-light">{stats.categories.jeunes}</p>
//                 <p className="text-xs text-gray-500">Jeunes</p>
//               </div>
//               <div className="text-center p-3 bg-blue-50 -lg">
//                 <Briefcase className="w-6 h-6 text-blue-500 mx-auto mb-2" />
//                 <p className="text-2xl font-light">{stats.categories.adultes}</p>
//                 <p className="text-xs text-gray-500">Adultes</p>
//               </div>
//               <div className="text-center p-3 bg-purple-50 -lg">
//                 <Heart className="w-6 h-6 text-purple-500 mx-auto mb-2" />
//                 <p className="text-2xl font-light">{stats.categories.vieillards}</p>
//                 <p className="text-xs text-gray-500">Vieillards</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Statistiques complémentaires */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Répartition par rôle */}
//           <div className="bg-white -lg border border-gray-200 p-4">
//             <h3 className="text-sm font-medium text-gray-700 mb-3">Rôles des comptes</h3>
//             <div className="space-y-2">
//               {Object.entries(stats.parRole).map(([role, count]) => (
//                 <div key={role} className="flex justify-between text-sm">
//                   <span className="capitalize">{role}</span>
//                   <span className="font-medium">{count}</span>
//                 </div>
//               ))}
//               {Object.keys(stats.parRole).length === 0 && (
//                 <p className="text-sm text-gray-400 text-center py-4">Aucun compte créé</p>
//               )}
//             </div>
//           </div>

//           {/* Évolution annuelle */}
//           <div className="bg-white -lg border border-gray-200 p-4 lg:col-span-2">
//             <h3 className="text-sm font-medium text-gray-700 mb-4">Évolution annuelle</h3>
//             <div className="h-64">
//               <ResponsiveContainer width="100%" height="100%">
//                 <BarChart data={stats.evolutionAnnuelle}>
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="annee" />
//                   <YAxis />
//                   <Tooltip />
//                   <Legend />
//                   <Bar dataKey="total" fill={COLORS.actif} name="Total inscriptions" />
//                   <Bar dataKey="actifs" fill={COLORS.avecCompte} name="Fidèles actifs" />
//                 </BarChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//         </div>

//         {/* Indicateurs de performance */}
//         <div className="bg-gradient-to-r from-blue-600 to-indigo-600 -lg p-6 text-white">
//           <h3 className="text-lg font-light mb-4">Synthèse</h3>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div>
//               <p className="text-3xl font-light">{Math.round((stats.actifs / stats.total) * 100)}%</p>
//               <p className="text-sm opacity-80">Taux d'activité</p>
//             </div>
//             <div>
//               <p className="text-3xl font-light">{Math.round((stats.avecCompte / stats.total) * 100)}%</p>
//               <p className="text-sm opacity-80">Taux de digitalisation</p>
//             </div>
//             <div>
//               <p className="text-3xl font-light">{stats.ageMoyen || 'N/A'}</p>
//               <p className="text-sm opacity-80">Âge moyen</p>
//             </div>
//             <div>
//               <p className="text-3xl font-light">{stats.femmes}</p>
//               <p className="text-sm opacity-80">Femmes</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// app/paroisse/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Baby, 
  User as UserIcon, 
  Briefcase, 
  Heart,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
  Shield,
  Mail,
  ChevronRight,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  ArrowRightLeft,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { getUser, getCurrentFidele } from '@/actions/auth'
import { getCurrentAnneeConference, getAnneesByConference } from '@/actions/annee-conference'

interface DashboardStats {
  total: number
  actifs: number
  inactifs: number
  hommes: number
  femmes: number
  nonRenseigne: number
  ageMoyen: number | null
  categories: {
    enfants: number
    jeunes: number
    adultes: number
    vieillards: number
  }
  avecCompte: number
  sansCompte: number
  parRole: {
    [key: string]: number
  }
  parType: {
    [key: string]: number
  }
  inscriptionsMensuelles: {
    mois: string
    total: number
    actifs: number
  }[]
  repartitionAge: {
    tranche: string
    count: number
  }[]
  evolutionAnnuelle: {
    annee: string
    total: number
    actifs: number
  }[]
  // Stats de transferts
  transferts: {
    sortants: {
      total: number
      en_attente: number
      acceptes: number
      refuses: number
      annules: number
    }
    entrants: {
      total: number
      acceptes: number
      en_attente: number
    }
  }
}

const COLORS = {
  actif: '#10b981',
  inactif: '#ef4444',
  homme: '#3b82f6',
  femme: '#ec4899',
  enfant: '#f97316',
  jeune: '#22c55e',
  adulte: '#3b82f6',
  vieillard: '#8b5cf6',
  avecCompte: '#06b6d4',
  sansCompte: '#6b7280'
}

const TRANCHES_AGE = [
  { min: 0, max: 12, label: '0-12 ans', color: '#f97316' },
  { min: 13, max: 18, label: '13-18 ans', color: '#eab308' },
  { min: 19, max: 25, label: '19-25 ans', color: '#22c55e' },
  { min: 26, max: 35, label: '26-35 ans', color: '#3b82f6' },
  { min: 36, max: 50, label: '36-50 ans', color: '#8b5cf6' },
  { min: 51, max: 65, label: '51-65 ans', color: '#ec4899' },
  { min: 66, max: 120, label: '65+ ans', color: '#ef4444' }
]

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnnee, setSelectedAnnee] = useState<number | null>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    loadDashboardData()
  }, [selectedAnnee])

  async function loadDashboardData() {
    try {
      setLoading(true)
      const user = await getUser()
      const currentFidele = await getCurrentFidele()

      if (!currentFidele?.paroisse_id) {
        console.error('Aucune paroisse trouvée')
        return
      }

      const paroisseId = currentFidele.paroisse_id

      // Récupérer la conférence de la paroisse
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select(`
          district:district_id (
            conference:conference_id (id)
          )
        `)
        .eq('id', paroisseId)
        .single()

      let conferenceId = null
      if (paroisse?.district) {
        const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
        if (district?.conference) {
          const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
          conferenceId = conference?.id
        }
      }

      // Récupérer les années disponibles
      let currentAnneeConferenceId = undefined
      if (conferenceId) {
        const annees = await getAnneesByConference(conferenceId)
        setAnneesDisponibles(annees)
        
        if (selectedAnnee === null && annees.length > 0) {
          const currentAnnee = annees.find(a => a.is_current)
          setSelectedAnnee(currentAnnee?.id || annees[0]?.id)
          currentAnneeConferenceId = currentAnnee?.id
        } else {
          currentAnneeConferenceId = selectedAnnee || undefined
        }
      }

      // Construire la requête de base pour les fidèles
      let query = supabase
        .from('fidele')
        .select(`
          *,
          compte:compte (
            id,
            role_id,
            role:role_id (nom)
          ),
          fidele_paroisse!inner (
            annee_conference_id
          )
        `)
        .eq('fidele_paroisse.paroisse_id', paroisseId)

      if (selectedAnnee) {
        query = query.eq('fidele_paroisse.annee_conference_id', selectedAnnee)
      } else if (currentAnneeConferenceId) {
        query = query.eq('fidele_paroisse.annee_conference_id', currentAnneeConferenceId)
      }

      const { data: fideles, error } = await query

      if (error) {
        console.error('Erreur chargement données:', error)
        return
      }

      // ==========================================
      // STATS TRANSFERTS
      // ==========================================
      
      // Transferts sortants (créés par ma paroisse)
      let querySortants = supabase
        .from('transfert_fidele')
        .select('id, statut, annee_conference_id')
        .eq('paroisse_source_id', paroisseId)

      // Transferts entrants acceptés (destination = ma paroisse)
      let queryEntrantsAcceptes = supabase
        .from('transfert_fidele')
        .select('id, statut, annee_conference_id')
        .eq('paroisse_destination_id', paroisseId)
        .eq('statut', 'accepte')

      // Transferts entrants en attente (sans destination, pas créés par ma paroisse)
      let queryEntrantsEnAttente = supabase
        .from('transfert_fidele')
        .select('id, statut, annee_conference_id')
        .eq('statut', 'en_attente')
        .is('paroisse_destination_id', null)
        .neq('paroisse_source_id', paroisseId)

      // Filtrer par année si sélectionnée
      if (selectedAnnee) {
        querySortants = querySortants.eq('annee_conference_id', selectedAnnee)
        queryEntrantsAcceptes = queryEntrantsAcceptes.eq('annee_conference_id', selectedAnnee)
        queryEntrantsEnAttente = queryEntrantsEnAttente.eq('annee_conference_id', selectedAnnee)
      }

      const [
        { data: sortantsData },
        { data: entrantsAcceptesData },
        { data: entrantsEnAttenteData }
      ] = await Promise.all([
        querySortants,
        queryEntrantsAcceptes,
        queryEntrantsEnAttente
      ])

      // Calculer les stats de transferts
      const sortants = sortantsData || []
      const entrantsAcceptes = entrantsAcceptesData || []
      const entrantsEnAttente = entrantsEnAttenteData || []

      const transfertsStats = {
        sortants: {
          total: sortants.length,
          en_attente: sortants.filter(t => t.statut === 'en_attente').length,
          acceptes: sortants.filter(t => t.statut === 'accepte').length,
          refuses: sortants.filter(t => t.statut === 'refuse').length,
          annules: sortants.filter(t => t.statut === 'annule').length
        },
        entrants: {
          total: entrantsAcceptes.length + entrantsEnAttente.length,
          acceptes: entrantsAcceptes.length,
          en_attente: entrantsEnAttente.length
        }
      }

      // Statistiques de base
      const total = fideles.length
      const actifs = fideles.filter((f: any) => f.actif).length
      const inactifs = total - actifs
      const hommes = fideles.filter((f: any) => f.sexe === 'M').length
      const femmes = fideles.filter((f: any) => f.sexe === 'F').length
      const nonRenseigne = fideles.filter((f: any) => !f.sexe).length

      // Statistiques par catégorie
      const categories = {
        enfants: fideles.filter((f: any) => f.fidele_type === 'enfant').length,
        jeunes: fideles.filter((f: any) => f.fidele_type === 'jeune').length,
        adultes: fideles.filter((f: any) => f.fidele_type === 'adulte').length,
        vieillards: fideles.filter((f: any) => f.fidele_type === 'vieillard').length
      }

      // Comptes
      const avecCompte = fideles.filter((f: any) => f.compte && f.compte.length > 0).length
      const sansCompte = total - avecCompte

      // Statistiques par rôle
      const parRole: { [key: string]: number } = {}
      fideles.forEach((f: any) => {
        if (f.compte && f.compte.length > 0) {
          const role = f.compte[0]?.role
          if (role) {
            const roleNom = Array.isArray(role) ? role[0]?.nom : role?.nom
            if (roleNom) {
              parRole[roleNom] = (parRole[roleNom] || 0) + 1
            }
          }
        }
      })

      // Âge moyen
      const currentYear = new Date().getFullYear()
      const ages = fideles
        .filter((f: any) => f.annee_naissance)
        .map((f: any) => currentYear - f.annee_naissance)
      const ageMoyen = ages.length > 0 
        ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
        : null

      // Répartition par tranche d'âge
      const repartitionAge = TRANCHES_AGE.map(tranche => ({
        tranche: tranche.label,
        count: fideles.filter((f: any) => {
          if (!f.annee_naissance) return false
          const age = currentYear - f.annee_naissance
          return age >= tranche.min && age <= tranche.max
        }).length
      }))

      // Évolution annuelle (simulée avec données réelles)
      const annees = [...new Set(fideles.map((f: any) => 
        new Date(f.created_at).getFullYear()
      ))].sort()

      const evolutionAnnuelle = annees.map(annee => ({
        annee: annee.toString(),
        total: fideles.filter((f: any) => 
          new Date(f.created_at).getFullYear() === annee
        ).length,
        actifs: fideles.filter((f: any) => 
          new Date(f.created_at).getFullYear() === annee && f.actif
        ).length
      }))

      // Inscriptions mensuelles (derniers 12 mois)
      const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
      const inscriptionsMensuelles = moisLabels.map((mois, index) => {
        const inscrits = fideles.filter((f: any) => {
          const date = new Date(f.created_at)
          return date.getMonth() === index && date.getFullYear() === new Date().getFullYear()
        })
        return {
          mois,
          total: inscrits.length,
          actifs: inscrits.filter((f: any) => f.actif).length
        }
      })

      setStats({
        total,
        actifs,
        inactifs,
        hommes,
        femmes,
        nonRenseigne,
        ageMoyen,
        categories,
        avecCompte,
        sansCompte,
        parRole,
        parType: categories,
        inscriptionsMensuelles,
        repartitionAge,
        evolutionAnnuelle,
        transferts: transfertsStats
      })

    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-5">
      {/* Header */}
      <div className="bg-white border-b mb-2 border-gray-200 sticky top-0 z-10">
        <div className=" py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wide">Tableau de bord</h1>
              <p className="text-sm text-gray-500 mt-0.5">Statistiques et analyses des fidèles</p>
            </div>
            
            {/* Sélecteur d'année */}
            {anneesDisponibles.length > 0 && (
              <select
                value={selectedAnnee || ''}
                onChange={(e) => setSelectedAnnee(parseInt(e.target.value))}
                className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
              >
                {anneesDisponibles.map((annee) => (
                  <option key={annee.id} value={annee.id}>
                    {annee.annee?.label} {annee.is_current ? '(en cours)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className=" max-w-7xl mx-auto space-y-6">
        {/* Cartes KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total fidèles</p>
                <p className="text-3xl font-light">{stats.total}</p>
                <p className="text-xs text-green-600 mt-2">
                  +{stats.inscriptionsMensuelles.slice(-3).reduce((sum, m) => sum + m.total, 0)} derniers mois
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Fidèles actifs</p>
                <p className="text-3xl font-light text-green-600">{stats.actifs}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((stats.actifs / stats.total) * 100)}% du total
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Avec compte</p>
                <p className="text-3xl font-light text-cyan-600">{stats.avecCompte}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((stats.avecCompte / stats.total) * 100)}% ont un compte
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Âge moyen</p>
                <p className="text-3xl font-light">{stats.ageMoyen || 'N/A'}</p>
                <p className="text-xs text-gray-500 mt-2">ans</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* SECTION TRANSFERTS */}
        {/* ========================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transferts Sortants */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-50 flex items-center justify-center">
                <UserMinus className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Transferts sortants</h3>
                <p className="text-xs text-gray-500">Fidèles ayant quitté la paroisse</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-orange-50 border border-orange-200 p-3">
                <p className="text-2xl font-light text-orange-700">{stats.transferts.sortants.total}</p>
                <p className="text-xs text-orange-600">Total sortants</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-2xl font-light text-yellow-700">{stats.transferts.sortants.en_attente}</p>
                <p className="text-xs text-yellow-600">En attente</p>
              </div>
              <div className="bg-green-50 border border-green-200 p-3">
                <p className="text-2xl font-light text-green-700">{stats.transferts.sortants.acceptes}</p>
                <p className="text-xs text-green-600">Acceptés</p>
              </div>
              <div className="bg-red-50 border border-red-200 p-3">
                <p className="text-2xl font-light text-red-700">{stats.transferts.sortants.annules}</p>
                <p className="text-xs text-red-600">Annulés</p>
              </div>
            </div>

            {/* Détail des statuts en barres */}
            {stats.transferts.sortants.total > 0 && (
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-600">Acceptés</span>
                    <span>{Math.round((stats.transferts.sortants.acceptes / stats.transferts.sortants.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className="bg-green-500 h-1.5 transition-all"
                      style={{ width: `${(stats.transferts.sortants.acceptes / stats.transferts.sortants.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-yellow-600">En attente</span>
                    <span>{Math.round((stats.transferts.sortants.en_attente / stats.transferts.sortants.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className="bg-yellow-500 h-1.5 transition-all"
                      style={{ width: `${(stats.transferts.sortants.en_attente / stats.transferts.sortants.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-red-600">Annulés</span>
                    <span>{Math.round((stats.transferts.sortants.annules / stats.transferts.sortants.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className="bg-red-500 h-1.5 transition-all"
                      style={{ width: `${(stats.transferts.sortants.annules / stats.transferts.sortants.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transferts Entrants */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-50 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Transferts entrants</h3>
                <p className="text-xs text-gray-500">Fidèles ayant rejoint la paroisse</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-200 p-3">
                <p className="text-2xl font-light text-green-700">{stats.transferts.entrants.total}</p>
                <p className="text-xs text-green-600">Total entrants</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-3">
                <p className="text-2xl font-light text-emerald-700">{stats.transferts.entrants.acceptes}</p>
                <p className="text-xs text-emerald-600">Acceptés</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-3">
                <p className="text-2xl font-light text-yellow-700">{stats.transferts.entrants.en_attente}</p>
                <p className="text-xs text-yellow-600">En attente</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-3">
                <p className="text-2xl font-light text-blue-700">
                  {stats.transferts.entrants.total > 0 
                    ? Math.round((stats.transferts.entrants.acceptes / stats.transferts.entrants.total) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-blue-600">Taux d'acceptation</p>
              </div>
            </div>

            {/* Barre de progression entrants */}
            {stats.transferts.entrants.total > 0 && (
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-600">Acceptés</span>
                    <span>{Math.round((stats.transferts.entrants.acceptes / stats.transferts.entrants.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className="bg-emerald-500 h-1.5 transition-all"
                      style={{ width: `${(stats.transferts.entrants.acceptes / stats.transferts.entrants.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-yellow-600">En attente</span>
                    <span>{Math.round((stats.transferts.entrants.en_attente / stats.transferts.entrants.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5">
                    <div 
                      className="bg-yellow-500 h-1.5 transition-all"
                      style={{ width: `${(stats.transferts.entrants.en_attente / stats.transferts.entrants.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Solde migratoire */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-indigo-50 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Solde migratoire</h3>
              <p className="text-xs text-gray-500">Différence entre entrants et sortants</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Entrants acceptés</p>
              <p className="text-2xl font-light text-green-600">+{stats.transferts.entrants.acceptes}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Sortants acceptés</p>
              <p className="text-2xl font-light text-orange-600">-{stats.transferts.sortants.acceptes}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Solde net</p>
              <p className={`text-2xl font-light ${
                stats.transferts.entrants.acceptes - stats.transferts.sortants.acceptes > 0 
                  ? 'text-green-600' 
                  : stats.transferts.entrants.acceptes - stats.transferts.sortants.acceptes < 0 
                    ? 'text-red-600' 
                    : 'text-gray-600'
              }`}>
                {stats.transferts.entrants.acceptes - stats.transferts.sortants.acceptes > 0 ? '+' : ''}
                {stats.transferts.entrants.acceptes - stats.transferts.sortants.acceptes}
              </p>
            </div>
          </div>
        </div>

        {/* Graphiques principaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition par catégorie d'âge */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Répartition par tranche d'âge
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={stats.repartitionAge.filter(t => t.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="count"
                    label={({ name, percent = 0 }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {stats.repartitionAge.filter(t => t.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TRANCHES_AGE.find(t => t.label === entry.tranche)?.color || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Évolution des inscriptions */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Évolution des inscriptions
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.inscriptionsMensuelles}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="total" stroke={COLORS.actif} fill={COLORS.actif} fillOpacity={0.3} name="Inscriptions" />
                  <Area type="monotone" dataKey="actifs" stroke={COLORS.avecCompte} fill={COLORS.avecCompte} fillOpacity={0.3} name="Actifs" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Répartition Hommes/Femmes */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Répartition par sexe</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Hommes</span>
                  <span>{stats.hommes} ({Math.round((stats.hommes / stats.total) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div 
                    className="bg-blue-500 h-2 transition-all"
                    style={{ width: `${(stats.hommes / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Femmes</span>
                  <span>{stats.femmes} ({Math.round((stats.femmes / stats.total) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 h-2">
                  <div 
                    className="bg-pink-500 h-2 transition-all"
                    style={{ width: `${(stats.femmes / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              {stats.nonRenseigne > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Non renseigné</span>
                    <span>{stats.nonRenseigne} ({Math.round((stats.nonRenseigne / stats.total) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2">
                    <div 
                      className="bg-gray-400 h-2 transition-all"
                      style={{ width: `${(stats.nonRenseigne / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Répartition par catégorie */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Répartition par catégorie</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-orange-50">
                <Baby className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-2xl font-light">{stats.categories.enfants}</p>
                <p className="text-xs text-gray-500">Enfants</p>
              </div>
              <div className="text-center p-3 bg-green-50">
                <UserIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-light">{stats.categories.jeunes}</p>
                <p className="text-xs text-gray-500">Jeunes</p>
              </div>
              <div className="text-center p-3 bg-blue-50">
                <Briefcase className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-light">{stats.categories.adultes}</p>
                <p className="text-xs text-gray-500">Adultes</p>
              </div>
              <div className="text-center p-3 bg-purple-50">
                <Heart className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-light">{stats.categories.vieillards}</p>
                <p className="text-xs text-gray-500">Vieillards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques complémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Répartition par rôle */}
          <div className="bg-white border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Rôles des comptes</h3>
            <div className="space-y-2">
              {Object.entries(stats.parRole).map(([role, count]) => (
                <div key={role} className="flex justify-between text-sm">
                  <span className="capitalize">{role}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {Object.keys(stats.parRole).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucun compte créé</p>
              )}
            </div>
          </div>

          {/* Évolution annuelle */}
          <div className="bg-white border border-gray-200 p-4 lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Évolution annuelle</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.evolutionAnnuelle}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="annee" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill={COLORS.actif} name="Total inscriptions" />
                  <Bar dataKey="actifs" fill={COLORS.avecCompte} name="Fidèles actifs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}