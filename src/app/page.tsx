// 'use client'

// import { useEffect, useState } from 'react'
// import { supabase } from '@/lib/supabase'
// import {
//   AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
// } from 'recharts'

// export default function StatsPage() {
//   const [loading, setLoading] = useState(true)
//   const [stats, setStats] = useState({
//     total: {
//       fideles: 0,
//       pasteurs: 0,
//       departements: 0,
//       paroisses: 0,
//       regions: 0
//     },
//     inscriptions: [] as { month: string; count: number }[],
//     departements: [] as { type: string; count: number }[],
//     pasteursEtude: [] as { etude: string; count: number }[],
//     topParoisses: [] as { paroisse: string; count: number }[],
//     prochainsDeparts: [] as any[]
//   })

//   useEffect(() => {
//     fetchStats()
//   }, [])

//   async function fetchStats() {
//     try {
//       // 1. Compter les fidèles
//       const { count: fideles } = await supabase
//         .from('fidele')
//         .select('*', { count: 'exact', head: true })

//       // 2. Compter les pasteurs actifs
//       const { count: pasteurs } = await supabase
//         .from('pasteur')
//         .select('*', { count: 'exact', head: true })
//         .eq('est_actif', true)

//       // 3. Compter les départements
//       const { count: departements } = await supabase
//         .from('departement')
//         .select('*', { count: 'exact', head: true })

//       // 4. Compter les paroisses
//       const { count: paroisses } = await supabase
//         .from('paroisse')
//         .select('*', { count: 'exact', head: true })

//       // 5. Compter les régions
//       const { count: regions } = await supabase
//         .from('region')
//         .select('*', { count: 'exact', head: true })

//       // 6. Répartition par type de département
//       const { data: deptTypes } = await supabase
//         .rpc('get_departement_counts_by_type')

//       // 7. Répartition par niveau d'étude des pasteurs
//       const { data: etudeTypes } = await supabase
//         .rpc('get_pasteur_counts_by_etude')

//       // 8. Inscriptions des 6 derniers mois
//       const sixMonthsAgo = new Date()
//       sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

//       const { data: inscriptions } = await supabase
//         .from('fidele')
//         .select('created_at')
//         .gte('created_at', sixMonthsAgo.toISOString())
//         .order('created_at')

//       // 9. Top 5 paroisses avec le plus de pasteurs
//       const { data: topParoisses } = await supabase
//         .from('paroisse_pasteur')
//         .select(`
//           paroisse:paroisse_id (nom),
//           count:pasteur_id
//         `)
//         .eq('est_actif', true)
//         .order('count', { ascending: false })
//         .limit(5)

//       // 10. Prochains départs (30 jours)
//       const today = new Date().toISOString().split('T')[0]
//       const nextMonth = new Date()
//       nextMonth.setMonth(nextMonth.getMonth() + 1)
      
//       const { data: departs } = await supabase
//         .from('paroisse_pasteur')
//         .select(`
//           date_sortie,
//           pasteur:pasteur_id (
//             fidele:fidele_id (nom, post_nom, prenom)
//           ),
//           paroisse:paroisse_id (nom)
//         `)
//         .gte('date_sortie', today)
//         .lte('date_sortie', nextMonth.toISOString().split('T')[0])
//         .order('date_sortie')
//         .limit(5)

//       // Traitement des inscriptions par mois
//       const inscriptionsByMonth = processInscriptions(inscriptions || [])

//       setStats({
//         total: {
//           fideles: fideles || 0,
//           pasteurs: pasteurs || 0,
//           departements: departements || 0,
//           paroisses: paroisses || 0,
//           regions: regions || 0
//         },
//         inscriptions: inscriptionsByMonth,
//         departements: deptTypes || [],
//         pasteursEtude: etudeTypes || [],
//         topParoisses: (topParoisses || []).map((item: any) => ({
//           paroisse: item.paroisse?.nom || 'N/A',
//           count: item.count
//         })),
//         prochainsDeparts: departs || []
//       })
//     } catch (error) {
//       console.error('Erreur lors du chargement des stats:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   function processInscriptions(data: any[]) {
//     const months: Record<string, number> = {}
    
//     data.forEach(item => {
//       const date = new Date(item.created_at)
//       const monthName = date.toLocaleDateString('fr-FR', { month: 'short' })
//       months[monthName] = (months[monthName] || 0) + 1
//     })

//     return Object.entries(months).map(([month, count]) => ({ month, count }))
//   }

//   // Couleurs pour les graphiques
//   const DEPT_COLORS = {
//     jeune: '#3b82f6',
//     maman: '#ec4899',
//     enfant: '#10b981',
//     papa: '#8b5cf6'
//   }

//   const ETUDE_COLORS = {
//     master: '#3b82f6',
//     licence: '#10b981',
//     phd: '#8b5cf6',
//     autre: '#6b7280'
//   }

//   const ETUDE_LABELS = {
//     master: 'Master',
//     licence: 'Licence',
//     phd: 'PhD',
//     autre: 'Autre'
//   }

//   if (loading) {
//     return (
//       <div className="max-w-7xl mx-auto px-4 py-8">
//         <div className="text-sm text-gray-400">Chargement des statistiques...</div>
//       </div>
//     )
//   }

//   // Cartes de statistiques
//   const cards = [
//     {
//       title: 'Fidèles',
//       value: stats.total.fideles,
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//         </svg>
//       ),
//       color: 'text-blue-600',
//       bg: 'bg-blue-50'
//     },
//     {
//       title: 'Pasteurs',
//       value: stats.total.pasteurs,
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
//         </svg>
//       ),
//       color: 'text-emerald-600',
//       bg: 'bg-emerald-50'
//     },
//     {
//       title: 'Départements',
//       value: stats.total.departements,
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
//         </svg>
//       ),
//       color: 'text-purple-600',
//       bg: 'bg-purple-50'
//     },
//     {
//       title: 'Paroisses',
//       value: stats.total.paroisses,
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
//         </svg>
//       ),
//       color: 'text-amber-600',
//       bg: 'bg-amber-50'
//     },
//     {
//       title: 'Régions',
//       value: stats.total.regions,
//       icon: (
//         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//         </svg>
//       ),
//       color: 'text-rose-600',
//       bg: 'bg-rose-50'
//     }
//   ]

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       {/* En-tête */}
//       <div className="mb-8">
//         <h1 className="text-2xl font-light text-gray-900">Statistiques</h1>
//         <p className="text-sm text-gray-500 mt-1">
//           Aperçu global de l'activité de l'église
//         </p>
//       </div>

//       {/* Cartes statistiques */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
//         {cards.map((card) => (
//           <div
//             key={card.title}
//             className="bg-white rounded-lg border border-gray-100 p-6 hover:shadow-sm transition-shadow"
//           >
//             <div className={`inline-flex p-3 rounded-lg ${card.bg} ${card.color} mb-4`}>
//               {card.icon}
//             </div>
//             <p className="text-sm text-gray-500">{card.title}</p>
//             <p className="text-2xl font-light text-gray-900 mt-1">{card.value}</p>
//           </div>
//         ))}
//       </div>

//       {/* Première ligne de graphiques */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//         {/* Graphique des inscriptions */}
//         <div className="bg-white rounded-lg border border-gray-100 p-6">
//           <h3 className="text-sm font-medium text-gray-700 mb-4">Inscriptions (6 derniers mois)</h3>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={stats.inscriptions} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
//                 <defs>
//                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
//                     <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
//                 <XAxis 
//                   dataKey="month" 
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fontSize: 12, fill: '#9ca3af' }}
//                 />
//                 <YAxis 
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fontSize: 12, fill: '#9ca3af' }}
//                 />
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: 'white',
//                     border: '1px solid #f0f0f0',
//                     borderRadius: '8px',
//                     fontSize: '12px'
//                   }}
//                 />
//                 <Area 
//                   type="monotone" 
//                   dataKey="count" 
//                   stroke="#3b82f6" 
//                   strokeWidth={2}
//                   fill="url(#colorCount)" 
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Graphique des départements */}
//         <div className="bg-white rounded-lg border border-gray-100 p-6">
//           <h3 className="text-sm font-medium text-gray-700 mb-4">Répartition par département</h3>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={stats.departements.map(d => ({
//                     name: d.type.charAt(0).toUpperCase() + d.type.slice(1),
//                     value: d.count,
//                     color: DEPT_COLORS[d.type as keyof typeof DEPT_COLORS] || '#6b7280'
//                   }))}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={80}
//                   paddingAngle={2}
//                   dataKey="value"
//                 >
//                   {stats.departements.map((entry, index) => (
//                     <Cell 
//                       key={`cell-${index}`} 
//                       fill={DEPT_COLORS[entry.type as keyof typeof DEPT_COLORS] || '#6b7280'} 
//                     />
//                   ))}
//                 </Pie>
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: 'white',
//                     border: '1px solid #f0f0f0',
//                     borderRadius: '8px',
//                     fontSize: '12px'
//                   }}
//                 />
//                 <Legend 
//                   verticalAlign="bottom" 
//                   height={36}
//                   formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//           </div>
//         </div>
//       </div>

//       {/* Deuxième ligne de graphiques */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//         {/* Graphique des pasteurs par étude */}
//         <div className="bg-white rounded-lg border border-gray-100 p-6">
//           <h3 className="text-sm font-medium text-gray-700 mb-4">Pasteurs par niveau d'étude</h3>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <BarChart 
//                 data={stats.pasteursEtude.map(d => ({
//                   name: ETUDE_LABELS[d.etude as keyof typeof ETUDE_LABELS] || d.etude,
//                   value: d.count,
//                   color: ETUDE_COLORS[d.etude as keyof typeof ETUDE_COLORS] || '#6b7280'
//                 }))} 
//                 margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
//               >
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
//                 <XAxis 
//                   dataKey="name" 
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fontSize: 12, fill: '#9ca3af' }}
//                 />
//                 <YAxis 
//                   axisLine={false}
//                   tickLine={false}
//                   tick={{ fontSize: 12, fill: '#9ca3af' }}
//                 />
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: 'white',
//                     border: '1px solid #f0f0f0',
//                     borderRadius: '8px',
//                     fontSize: '12px'
//                   }}
//                 />
//                 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
//                   {stats.pasteursEtude.map((entry, index) => (
//                     <Cell 
//                       key={`cell-${index}`} 
//                       fill={ETUDE_COLORS[entry.etude as keyof typeof ETUDE_COLORS] || '#6b7280'} 
//                     />
//                   ))}
//                 </Bar>
//               </BarChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Top paroisses */}
//         <div className="bg-white rounded-lg border border-gray-100 p-6">
//           <h3 className="text-sm font-medium text-gray-700 mb-4">Top 5 paroisses (nombre de pasteurs)</h3>
//           <div className="space-y-3">
//             {stats.topParoisses.map((item, index) => (
//               <div key={index} className="flex items-center gap-3">
//                 <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
//                 <div className="flex-1">
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm text-gray-700">{item.paroisse}</span>
//                     <span className="text-xs text-gray-400">{item.count} pasteur{item.count > 1 ? 's' : ''}</span>
//                   </div>
//                   <div className="w-full bg-gray-100 rounded-full h-1.5">
//                     <div 
//                       className="bg-gray-900 h-1.5 rounded-full" 
//                       style={{ width: `${Math.min((item.count / (stats.topParoisses[0]?.count || 1)) * 100, 100)}%` }}
//                     />
//                   </div>
//                 </div>
//               </div>
//             ))}
//             {stats.topParoisses.length === 0 && (
//               <p className="text-sm text-gray-400 text-center py-4">Aucune donnée disponible</p>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Prochains départs */}
//       <div className="bg-white rounded-lg border border-gray-100 p-6">
//         <h3 className="text-sm font-medium text-gray-700 mb-4">Prochains départs de pasteurs (30 jours)</h3>
//         <div className="space-y-3">
//           {stats.prochainsDeparts.map((item, index) => {
//             const daysLeft = Math.ceil(
//               (new Date(item.date_sortie).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
//             )
            
//             return (
//               <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg">
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">
//                     {item.pasteur?.fidele?.nom} {item.pasteur?.fidele?.post_nom} {item.pasteur?.fidele?.prenom}
//                   </p>
//                   <p className="text-xs text-gray-500 mt-1">{item.paroisse?.nom}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm text-gray-700">
//                     {new Date(item.date_sortie).toLocaleDateString('fr-FR')}
//                   </p>
//                   <p className="text-xs text-gray-400 mt-1">
//                     {daysLeft > 0 ? `Dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}` : "Aujourd'hui"}
//                   </p>
//                 </div>
//               </div>
//             )
//           })}
//           {stats.prochainsDeparts.length === 0 && (
//             <p className="text-sm text-gray-400 text-center py-4">
//               Aucun départ prévu dans les 30 prochains jours
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// app/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/gestion')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirection vers la page de gestion...</p>
    </div>
  )
}