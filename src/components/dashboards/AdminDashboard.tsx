// 'use client'

// import { useState, useEffect } from 'react'
// import Image from 'next/image'
// import Link from 'next/link'

// // Types pour les données
// interface DashboardStats {
//   totalFideles: number
//   totalParoisses: number
//   totalDistricts: number
//   totalConferences: number
//   utilisateursActifs: number
//   nouveauxAujourdhui: number
//   croissance: string
// }

// // Skeleton Loader Component
// function DashboardSkeleton() {
//   return (
//     <div className="space-y-8 animate-pulse">
//       {/* Banner Skeleton */}
//       <div className="bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm p-8">
//         <div className="h-7 w-64 bg-gray-300/50 rounded mb-2"></div>
//         <div className="h-4 w-96 bg-gray-300/50 rounded mb-4"></div>
//         <div className="flex gap-4">
//           <div className="h-16 w-32 bg-gray-300/50 rounded"></div>
//           <div className="h-16 w-32 bg-gray-300/50 rounded"></div>
//         </div>
//       </div>

//       {/* Stats Cards Skeleton */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="bg-white rounded border border-gray-100 p-6">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="w-10 h-10 bg-gray-200 rounded"></div>
//               <div className="h-4 w-24 bg-gray-200 rounded"></div>
//             </div>
//             <div className="h-8 w-20 bg-gray-200 rounded mb-2"></div>
//             <div className="h-3 w-28 bg-gray-200 rounded"></div>
//           </div>
//         ))}
//       </div>

//       {/* Content Skeleton */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="bg-white rounded border border-gray-100 p-6">
//           <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
//           <div className="space-y-4">
//             {[...Array(5)].map((_, i) => (
//               <div key={i}>
//                 <div className="flex justify-between mb-1">
//                   <div className="h-4 w-20 bg-gray-200 rounded"></div>
//                   <div className="h-4 w-12 bg-gray-200 rounded"></div>
//                 </div>
//                 <div className="h-1.5 w-full bg-gray-200 rounded-full"></div>
//               </div>
//             ))}
//           </div>
//         </div>
//         <div className="bg-white rounded border border-gray-100 p-6 lg:col-span-2">
//           <div className="flex justify-between mb-4">
//             <div className="h-4 w-32 bg-gray-200 rounded"></div>
//             <div className="h-8 w-24 bg-gray-200 rounded"></div>
//           </div>
//           <div className="space-y-4">
//             {[...Array(5)].map((_, i) => (
//               <div key={i} className="flex items-center gap-4">
//                 <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
//                 <div className="flex-1">
//                   <div className="h-4 w-32 bg-gray-200 rounded mb-1"></div>
//                   <div className="h-3 w-48 bg-gray-200 rounded"></div>
//                 </div>
//                 <div className="h-3 w-16 bg-gray-200 rounded"></div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Actions Skeleton */}
//       <div className="bg-white rounded border border-gray-100 p-6">
//         <div className="h-4 w-28 bg-gray-200 rounded mb-4"></div>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//           {[...Array(4)].map((_, i) => (
//             <div key={i} className="p-4 border border-gray-100 rounded">
//               <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded"></div>
//               <div className="h-3 w-20 mx-auto bg-gray-200 rounded"></div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   )
// }

// export default function AdminDashboard() {
//   const [loading, setLoading] = useState(true)
//   const [periode, setPeriode] = useState('semaine')
//   const [stats, setStats] = useState<DashboardStats>({
//     totalFideles: 0,
//     totalParoisses: 0,
//     totalDistricts: 0,
//     totalConferences: 0,
//     utilisateursActifs: 0,
//     nouveauxAujourdhui: 0,
//     croissance: '+0%'
//   })

//   const [activitesRecentes, setActivitesRecentes] = useState<any[]>([])
//   const [topRegions, setTopRegions] = useState<any[]>([])

//   useEffect(() => {
//     // Simuler un chargement de données
//     const loadData = async () => {
//       // Simuler un délai réseau
//       await new Promise(resolve => setTimeout(resolve, 1500))
      
//       // Données fictives - À remplacer par vos vrais appels API
//       setStats({
//         totalFideles: 32450,
//         totalParoisses: 245,
//         totalDistricts: 48,
//         totalConferences: 12,
//         utilisateursActifs: 8760,
//         nouveauxAujourdhui: 124,
//         croissance: '+15.3%'
//       })

//       setActivitesRecentes([
//         { action: 'Nouveau compte créé', utilisateur: 'Jean Mpoyi', role: 'Admin', time: 'Il y a 5 min', region: 'Kinshasa' },
//         { action: 'Fidèle ajouté', utilisateur: 'Marie Kabamba', role: 'Coordinateur', time: 'Il y a 12 min', region: 'Lubumbashi' },
//         { action: 'Paroisse modifiée', utilisateur: 'Pierre Luntadila', role: 'Admin', time: 'Il y a 25 min', region: 'Goma' },
//         { action: 'Rapport généré', utilisateur: 'Lucie Mwamba', role: 'Superviseur', time: 'Il y a 1h', region: 'Bukavu' },
//         { action: 'Nouvelle conférence', utilisateur: 'Joseph Kasongo', role: 'Admin', time: 'Il y a 2h', region: 'Matadi' },
//       ])

//       setTopRegions([
//         { nom: 'Kinshasa', count: 12450, pourcentage: 38 },
//         { nom: 'Lubumbashi', count: 8760, pourcentage: 27 },
//         { nom: 'Goma', count: 5430, pourcentage: 17 },
//         { nom: 'Bukavu', count: 4320, pourcentage: 13 },
//         { nom: 'Matadi', count: 1870, pourcentage: 5 },
//       ])

//       setLoading(false)
//     }

//     loadData()
//   }, [])

//   if (loading) {
//     return <DashboardSkeleton />
//   }

//   return (
//     <div className="space-y-8">
//       {/* Banner - Design sobre avec opacité */}
//       <div className="relative overflow-hidden bg-gradient-to-r from-gray-50/95 via-gray-100/95 to-gray-50/95 backdrop-blur-sm p-8 border-b border-gray-200/50">
//         {/* Éléments décoratifs subtils */}
//         <div className="absolute top-0 right-0 w-64 h-64 bg-gray-900/3 rounded-full -translate-y-1/2 translate-x-1/3"></div>
//         <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-900/3 rounded-full translate-y-1/2 -translate-x-1/3"></div>
        
//         <div className="relative">
//           <h2 className="text-2xl font-light text-gray-800 mb-1 tracking-wide">
//             Tableau de bord Administrateur
//           </h2>
//           <p className="text-gray-500 text-sm font-light">
//             Vue globale du système • {stats.utilisateursActifs.toLocaleString()} utilisateurs actifs • {stats.totalParoisses} paroisses
//           </p>
          
//           <div className="flex gap-3 mt-5">
//             <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
//               <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Croissance</div>
//               <div className="text-xl font-light text-gray-800">{stats.croissance}</div>
//             </div>
//             <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
//               <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Nouveaux aujourd'hui</div>
//               <div className="text-xl font-light text-gray-800">{stats.nouveauxAujourdhui}</div>
//             </div>
//             <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
//               <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Conférences</div>
//               <div className="text-xl font-light text-gray-800">{stats.totalConferences}</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Cartes de statistiques */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
//         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
//               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Utilisateurs</div>
//           </div>
//           <div className="text-3xl font-light text-gray-800">{stats.utilisateursActifs.toLocaleString()}</div>
//           <div className="text-xs text-emerald-600 mt-2 font-light">+12% cette semaine</div>
//         </div>

//         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
//               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Paroisses</div>
//           </div>
//           <div className="text-3xl font-light text-gray-800">{stats.totalParoisses}</div>
//           <div className="text-xs text-gray-400 mt-2 font-light">{stats.totalConferences} conférences • {stats.totalDistricts} districts</div>
//         </div>

//         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
//               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Fidèles</div>
//           </div>
//           <div className="text-3xl font-light text-gray-800">{stats.totalFideles.toLocaleString()}</div>
//           <div className="text-xs text-gray-400 mt-2 font-light">Dont 65% actifs</div>
//         </div>

//         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
//           <div className="flex items-center gap-3 mb-3">
//             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
//               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Connexions</div>
//           </div>
//           <div className="text-3xl font-light text-gray-800">1,245</div>
//           <div className="text-xs text-emerald-600 mt-2 font-light">+8% vs hier</div>
//         </div>
//       </div>

//       {/* Graphiques et activités */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
//         {/* Top régions */}
//         <div className="bg-white border border-gray-100 p-6 lg:col-span-1">
//           <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-5">
//             Top régions
//           </h3>
//           <div className="space-y-4">
//             {topRegions.map((region) => (
//               <div key={region.nom}>
//                 <div className="flex justify-between text-sm mb-1.5">
//                   <span className="text-gray-600 font-light">{region.nom}</span>
//                   <span className="text-gray-800 font-light">{region.count.toLocaleString()}</span>
//                 </div>
//                 <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
//                   <div 
//                     className="h-full bg-gray-400"
//                     style={{ width: `${region.pourcentage}%` }}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Activités récentes */}
//         <div className="bg-white border border-gray-100 p-6 lg:col-span-2">
//           <div className="flex items-center justify-between mb-5">
//             <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">
//               Activités récentes
//             </h3>
//             <select 
//               value={periode}
//               onChange={(e) => setPeriode(e.target.value)}
//               className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-light text-gray-600 focus:outline-none focus:border-gray-300"
//             >
//               <option value="jour">Aujourd'hui</option>
//               <option value="semaine">Cette semaine</option>
//               <option value="mois">Ce mois</option>
//             </select>
//           </div>
//           <div className="space-y-4">
//             {activitesRecentes.map((activite, index) => (
//               <div key={index} className="flex items-center gap-4 text-sm group">
//                 <div className="w-9 h-9 bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
//                   <span className="text-xs font-light text-gray-500">
//                     {activite.utilisateur.split(' ').map((n: string) => n[0]).join('')}
//                   </span>
//                 </div>
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <span className="font-light text-gray-800">{activite.utilisateur}</span>
//                     <span className="text-xs text-gray-400 font-light">({activite.role})</span>
//                   </div>
//                   <div className="text-xs text-gray-400 font-light">{activite.action} • {activite.region}</div>
//                 </div>
//                 <div className="text-xs text-gray-400 font-light">{activite.time}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Actions rapides */}
//       <div className="bg-white border border-gray-100 p-6">
//         <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-5">
//           Actions rapides
//         </h3>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           <Link href="/admin/fideles/nouveau" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
//             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
//               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Nouveau fidèle</div>
//           </Link>
//           <Link href="/admin/rapports" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
//             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
//               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Rapports</div>
//           </Link>
//           <Link href="/admin/parametres" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
//             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
//               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Paramètres</div>
//           </Link>
//           <Link href="/admin/notifications" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
//             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
//               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//               </svg>
//             </div>
//             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Notifications</div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getFideles } from '@/actions/fidele'
import { getDepartements } from '@/actions/departements'
import { getUser, getUserNiveau } from '@/actions/auth'
import { 
  getRegions, 
  getConferences, 
  getDistricts, 
  getParoisses,
  getStructuresStats 
} from '@/actions/structures'

// Types
interface DashboardStats {
  totalFideles: number
  totalParoisses: number
  totalDistricts: number
  totalConferences: number
  totalRegions: number
  totalDepartements: number
  utilisateursActifs: number
  totalComptes: number
}

interface ActiviteRecente {
  id: string
  action: string
  utilisateur: string
  role: string
  time: string
  region: string
}

interface RegionStat {
  nom: string
  count: number
  pourcentage: number
}

// Skeleton Loader Component
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm p-8">
        <div className="h-7 w-64 bg-gray-300/50 mb-2"></div>
        <div className="h-4 w-96 bg-gray-300/50 mb-4"></div>
        <div className="flex gap-4">
          <div className="h-16 w-32 bg-gray-300/50"></div>
          <div className="h-16 w-32 bg-gray-300/50"></div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-200"></div>
              <div className="h-4 w-24 bg-gray-200"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 mb-2"></div>
            <div className="h-3 w-28 bg-gray-200"></div>
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-100 p-6">
          <div className="h-4 w-24 bg-gray-200 mb-5"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <div className="h-4 w-20 bg-gray-200"></div>
                  <div className="h-4 w-12 bg-gray-200"></div>
                </div>
                <div className="h-1.5 w-full bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 p-6 lg:col-span-2">
          <div className="flex justify-between mb-5">
            <div className="h-4 w-32 bg-gray-200"></div>
            <div className="h-8 w-24 bg-gray-200"></div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200 mb-1"></div>
                  <div className="h-3 w-48 bg-gray-200"></div>
                </div>
                <div className="h-3 w-16 bg-gray-200"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="bg-white border border-gray-100 p-6">
        <div className="h-4 w-28 bg-gray-200 mb-5"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-5 border border-gray-100">
              <div className="w-9 h-9 mx-auto mb-3 bg-gray-200"></div>
              <div className="h-3 w-20 mx-auto bg-gray-200"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userNiveau, setUserNiveau] = useState<string | null>(null)
  const [periode, setPeriode] = useState('semaine')
  
  const [stats, setStats] = useState<DashboardStats>({
    totalFideles: 0,
    totalParoisses: 0,
    totalDistricts: 0,
    totalConferences: 0,
    totalRegions: 0,
    totalDepartements: 0,
    utilisateursActifs: 0,
    totalComptes: 0
  })

  const [activitesRecentes, setActivitesRecentes] = useState<ActiviteRecente[]>([])
  const [regionsStats, setRegionsStats] = useState<RegionStat[]>([])
  const [croissance, setCroissance] = useState('+0%')
  const [nouveauxAujourdhui, setNouveauxAujourdhui] = useState(0)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const currentUser = await getUser()
        setUser(currentUser)
        
        const niveau = await getUserNiveau()
        setUserNiveau(niveau)

        // Charger toutes les données en parallèle
        const [
          fidelesData,
          regionsData,
          conferencesData,
          districtsData,
          paroissesData,
          departementsData,
          structuresStats
        ] = await Promise.all([
          getFideles(),
          getRegions(),
          getConferences(),
          getDistricts(),
          getParoisses(),
          getDepartements(),
          getStructuresStats()
        ])

        // Statistiques des fidèles
        const totalFideles = fidelesData.length
        const fidelesActifs = fidelesData.filter(f => f.actif).length
        const totalComptes = fidelesData.filter(f => f.compte).length

        // Statistiques de répartition par région (basé sur les conférences)
        const regionsStatsMap = new Map<string, number>()
        
        // Créer un map des régions
        const regionsMap = new Map<number, string>()
        regionsData.forEach(region => {
          regionsMap.set(region.id, region.nom)
        })

        // Compter les conférences par région
        conferencesData.forEach(conference => {
          const regionNom = regionsMap.get(conference.region_id) || 'Non assigné'
          regionsStatsMap.set(regionNom, (regionsStatsMap.get(regionNom) || 0) + 1)
        })

        // Calculer les pourcentages pour les top régions
        const regionsArray: RegionStat[] = Array.from(regionsStatsMap.entries())
          .map(([nom, count]) => ({ nom, count, pourcentage: 0 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)

        const totalRegional = regionsArray.reduce((sum, r) => sum + r.count, 0)
        if (totalRegional > 0) {
          regionsArray.forEach(r => {
            r.pourcentage = Math.round((r.count / totalRegional) * 100)
          })
        }

        setRegionsStats(regionsArray)

        // Calculer la croissance (comparaison avec le mois précédent)
        const maintenant = new Date()
        const moisDernier = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)
        
        const fidelesCeMois = fidelesData.filter(f => {
          const dateCreation = new Date(f.created_at)
          return dateCreation >= new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
        }).length

        const fidelesMoisDernier = fidelesData.filter(f => {
          const dateCreation = new Date(f.created_at)
          return dateCreation >= moisDernier && dateCreation < new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
        }).length

        let croissanceValue = '+0%'
        if (fidelesMoisDernier > 0) {
          const taux = ((fidelesCeMois - fidelesMoisDernier) / fidelesMoisDernier) * 100
          croissanceValue = `${taux > 0 ? '+' : ''}${taux.toFixed(1)}%`
        }
        setCroissance(croissanceValue)

        // Nouveaux aujourd'hui
        const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
        const nouveauxAujourdhuiCount = fidelesData.filter(f => {
          const dateCreation = new Date(f.created_at)
          return dateCreation >= debutJournee
        }).length
        setNouveauxAujourdhui(nouveauxAujourdhuiCount)

        // Mettre à jour les stats
        setStats({
          totalFideles,
          totalParoisses: structuresStats?.paroisses || paroissesData.length,
          totalDistricts: structuresStats?.districts || districtsData.length,
          totalConferences: structuresStats?.conferences || conferencesData.length,
          totalRegions: structuresStats?.regions || regionsData.length,
          totalDepartements: departementsData.length,
          utilisateursActifs: fidelesActifs,
          totalComptes
        })

        // Générer des activités récentes
        const activites: ActiviteRecente[] = []
        
        // Derniers fidèles créés
        const derniersFideles = fidelesData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 3)
        
        derniersFideles.forEach(fidele => {
          const paroisse = fidele.paroisse
          const paroisseNom = Array.isArray(paroisse) ? paroisse[0]?.nom : paroisse?.nom || 'Non assigné'
          
          activites.push({
            id: `fidele-${fidele.id}`,
            action: 'Nouveau fidèle ajouté',
            utilisateur: `${fidele.nom} ${fidele.prenom}`,
            role: fidele.compte?.role?.nom || 'Sans compte',
            time: getRelativeTime(new Date(fidele.created_at)),
            region: paroisseNom
          })
        })

        // Derniers départements créés
        const derniersDepartements = departementsData
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 2)
        
        derniersDepartements.forEach(dept => {
          activites.push({
            id: `dept-${dept.id}`,
            action: 'Département créé',
            utilisateur: 'Administrateur',
            role: 'Admin',
            time: getRelativeTime(new Date(dept.created_at)),
            region: 'Système'
          })
        })

        // Dernières structures créées
        if (paroissesData.length > 0) {
          const dernieresParoisses = paroissesData
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 2)
          
          dernieresParoisses.forEach(paroisse => {
            activites.push({
              id: `paroisse-${paroisse.id}`,
              action: 'Paroisse créée',
              utilisateur: 'Administrateur',
              role: 'Admin',
              time: getRelativeTime(new Date(paroisse.created_at)),
              region: paroisse.nom
            })
          })
        }

        // Trier toutes les activités par date
        activites.sort((a, b) => {
          const timeA = a.time.includes('min') ? 0 : a.time.includes('h') ? 1 : 2
          const timeB = b.time.includes('min') ? 0 : b.time.includes('h') ? 1 : 2
          return timeA - timeB
        })

        setActivitesRecentes(activites.slice(0, 8))

      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Fonction utilitaire pour afficher le temps relatif
  const getRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR')
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Banner - Design sobre avec opacité */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-50/95 via-gray-100/95 to-gray-50/95 backdrop-blur-sm p-8 border-b border-gray-200/50">
        {/* Éléments décoratifs subtils */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gray-900/3 -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-900/3 translate-y-1/2 -translate-x-1/3"></div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-light text-gray-800 tracking-wide">
              Tableau de bord Administrateur
            </h2>
            {user && (
              <span className="text-xs font-light text-gray-500 bg-white/50 backdrop-blur-sm px-3 py-1 border border-gray-200/50">
                {user.nom_complet}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm font-light">
            Vue globale du système • {stats.utilisateursActifs.toLocaleString()} fidèles actifs • {stats.totalParoisses} paroisses
            {userNiveau && <span className="ml-2">• Niveau: {userNiveau}</span>}
          </p>
          
          <div className="flex gap-3 mt-5">
            <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
              <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Croissance</div>
              <div className="text-xl font-light text-gray-800">{croissance}</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
              <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Nouveaux aujourd'hui</div>
              <div className="text-xl font-light text-gray-800">{nouveauxAujourdhui}</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
              <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Régions</div>
              <div className="text-xl font-light text-gray-800">{stats.totalRegions}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Fidèles Actifs</div>
          </div>
          <div className="text-3xl font-light text-gray-800">{stats.utilisateursActifs.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-2 font-light">sur {stats.totalFideles.toLocaleString()} total</div>
        </div>

        <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Structures</div>
          </div>
          <div className="text-3xl font-light text-gray-800">{stats.totalParoisses}</div>
          <div className="text-xs text-gray-400 mt-2 font-light">
            {stats.totalRegions} régions • {stats.totalConferences} conférences • {stats.totalDistricts} districts
          </div>
        </div>

        <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Départements</div>
          </div>
          <div className="text-3xl font-light text-gray-800">{stats.totalDepartements}</div>
          <div className="text-xs text-gray-400 mt-2 font-light">Commissions et ministères</div>
        </div>

        <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Comptes</div>
          </div>
          <div className="text-3xl font-light text-gray-800">{stats.totalComptes}</div>
          <div className="text-xs text-gray-400 mt-2 font-light">
            {stats.totalFideles > 0 ? Math.round((stats.totalComptes / stats.totalFideles) * 100) : 0}% des fidèles
          </div>
        </div>
      </div>

      {/* Graphiques et activités */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Top régions */}
        <div className="bg-white border border-gray-100 p-6 lg:col-span-1">
          <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-5">
            Répartition par région
          </h3>
          <div className="space-y-4">
            {regionsStats.length > 0 ? (
              regionsStats.map((region) => (
                <div key={region.nom}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600 font-light truncate max-w-[120px]">{region.nom}</span>
                    <span className="text-gray-800 font-light">{region.count} conférence{region.count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-gray-400 transition-all duration-500"
                      style={{ width: `${region.pourcentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8 text-sm font-light">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Activités récentes */}
        <div className="bg-white border border-gray-100 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">
              Activités récentes
            </h3>
            <select 
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-light text-gray-600 focus:outline-none focus:border-gray-300"
            >
              <option value="jour">Aujourd'hui</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {activitesRecentes.length > 0 ? (
              activitesRecentes.map((activite) => (
                <div key={activite.id} className="flex items-center gap-4 text-sm group">
                  <div className="w-9 h-9 bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
                    <span className="text-xs font-light text-gray-500">
                      {activite.utilisateur.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-light text-gray-800 truncate">{activite.utilisateur}</span>
                      <span className="text-xs text-gray-400 font-light">({activite.role})</span>
                    </div>
                    <div className="text-xs text-gray-400 font-light truncate">
                      {activite.action} • {activite.region}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-light flex-shrink-0">{activite.time}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8 text-sm font-light">
                Aucune activité récente
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white border border-gray-100 p-6">
        <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-5">
          Actions rapides
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/fideles/nouveau" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
            <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Nouveau fidèle</div>
          </Link>
          
          <Link href="/admin/departements" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
            <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Départements</div>
          </Link>
          
          <Link href="/admin/structures" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
            <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Structures</div>
          </Link>
          
          <Link href="/admin/annees-conference" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
            <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Années</div>
          </Link>
        </div>
      </div>
    </div>
  )
}