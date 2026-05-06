
// // 'use client'

// // import { useState, useEffect } from 'react'
// // import Link from 'next/link'
// // import { getFideles } from '@/actions/fidele'
// // import { getDepartements } from '@/actions/departements'
// // import { getUser, getUserNiveau } from '@/actions/auth'
// // import { 
// //   getRegions, 
// //   getConferences, 
// //   getDistricts, 
// //   getParoisses,
// //   getStructuresStats 
// // } from '@/actions/structures'

// // // Types
// // interface DashboardStats {
// //   totalFideles: number
// //   totalParoisses: number
// //   totalDistricts: number
// //   totalConferences: number
// //   totalRegions: number
// //   totalDepartements: number
// //   utilisateursActifs: number
// //   totalComptes: number
// // }

// // interface ActiviteRecente {
// //   id: string
// //   action: string
// //   utilisateur: string
// //   role: string
// //   time: string
// //   region: string
// // }

// // interface RegionStat {
// //   nom: string
// //   count: number
// //   pourcentage: number
// // }

// // // Skeleton Loader Component
// // function DashboardSkeleton() {
// //   return (
// //     <div className="space-y-8 animate-pulse">
// //       {/* Banner Skeleton */}
// //       <div className="bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm p-8">
// //         <div className="h-7 w-64 bg-gray-300/50 mb-2"></div>
// //         <div className="h-4 w-96 bg-gray-300/50 mb-4"></div>
// //         <div className="flex gap-4">
// //           <div className="h-16 w-32 bg-gray-300/50"></div>
// //           <div className="h-16 w-32 bg-gray-300/50"></div>
// //         </div>
// //       </div>

// //       {/* Stats Cards Skeleton */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
// //         {[...Array(4)].map((_, i) => (
// //           <div key={i} className="bg-white border border-gray-100 p-6">
// //             <div className="flex items-center gap-3 mb-3">
// //               <div className="w-10 h-10 bg-gray-200"></div>
// //               <div className="h-4 w-24 bg-gray-200"></div>
// //             </div>
// //             <div className="h-8 w-20 bg-gray-200 mb-2"></div>
// //             <div className="h-3 w-28 bg-gray-200"></div>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Content Skeleton */}
// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
// //         <div className="bg-white border border-gray-100 p-6">
// //           <div className="h-4 w-24 bg-gray-200 mb-5"></div>
// //           <div className="space-y-4">
// //             {[...Array(5)].map((_, i) => (
// //               <div key={i}>
// //                 <div className="flex justify-between mb-1">
// //                   <div className="h-4 w-20 bg-gray-200"></div>
// //                   <div className="h-4 w-12 bg-gray-200"></div>
// //                 </div>
// //                 <div className="h-1.5 w-full bg-gray-200"></div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //         <div className="bg-white border border-gray-100 p-6 lg:col-span-2">
// //           <div className="flex justify-between mb-5">
// //             <div className="h-4 w-32 bg-gray-200"></div>
// //             <div className="h-8 w-24 bg-gray-200"></div>
// //           </div>
// //           <div className="space-y-4">
// //             {[...Array(5)].map((_, i) => (
// //               <div key={i} className="flex items-center gap-4">
// //                 <div className="w-9 h-9 bg-gray-200"></div>
// //                 <div className="flex-1">
// //                   <div className="h-4 w-32 bg-gray-200 mb-1"></div>
// //                   <div className="h-3 w-48 bg-gray-200"></div>
// //                 </div>
// //                 <div className="h-3 w-16 bg-gray-200"></div>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Actions Skeleton */}
// //       <div className="bg-white border border-gray-100 p-6">
// //         <div className="h-4 w-28 bg-gray-200 mb-5"></div>
// //         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
// //           {[...Array(4)].map((_, i) => (
// //             <div key={i} className="p-5 border border-gray-100">
// //               <div className="w-9 h-9 mx-auto mb-3 bg-gray-200"></div>
// //               <div className="h-3 w-20 mx-auto bg-gray-200"></div>
// //             </div>
// //           ))}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }

// // export default function AdminDashboard() {
// //   const [loading, setLoading] = useState(true)
// //   const [user, setUser] = useState<any>(null)
// //   const [userNiveau, setUserNiveau] = useState<string | null>(null)
// //   const [periode, setPeriode] = useState('semaine')
  
// //   const [stats, setStats] = useState<DashboardStats>({
// //     totalFideles: 0,
// //     totalParoisses: 0,
// //     totalDistricts: 0,
// //     totalConferences: 0,
// //     totalRegions: 0,
// //     totalDepartements: 0,
// //     utilisateursActifs: 0,
// //     totalComptes: 0
// //   })

// //   const [activitesRecentes, setActivitesRecentes] = useState<ActiviteRecente[]>([])
// //   const [regionsStats, setRegionsStats] = useState<RegionStat[]>([])
// //   const [croissance, setCroissance] = useState('+0%')
// //   const [nouveauxAujourdhui, setNouveauxAujourdhui] = useState(0)

// //   useEffect(() => {
// //     const loadDashboardData = async () => {
// //       try {
// //         // Récupérer l'utilisateur connecté
// //         const currentUser = await getUser()
// //         setUser(currentUser)
        
// //         const niveau = await getUserNiveau()
// //         setUserNiveau(niveau)

// //         // Charger toutes les données en parallèle
// //         const [
// //           fidelesData,
// //           regionsData,
// //           conferencesData,
// //           districtsData,
// //           paroissesData,
// //           departementsData,
// //           structuresStats
// //         ] = await Promise.all([
// //           getFideles(),
// //           getRegions(),
// //           getConferences(),
// //           getDistricts(),
// //           getParoisses(),
// //           getDepartements(),
// //           getStructuresStats()
// //         ])

// //         // Statistiques des fidèles
// //         const totalFideles = fidelesData.length
// //         const fidelesActifs = fidelesData.filter(f => f.actif).length
// //         const totalComptes = fidelesData.filter(f => f.compte).length

// //         // Statistiques de répartition par région (basé sur les conférences)
// //         const regionsStatsMap = new Map<string, number>()
        
// //         // Créer un map des régions
// //         const regionsMap = new Map<number, string>()
// //         regionsData.forEach(region => {
// //           regionsMap.set(region.id, region.nom)
// //         })

// //         // Compter les conférences par région
// //         conferencesData.forEach(conference => {
// //           const regionNom = regionsMap.get(conference.region_id) || 'Non assigné'
// //           regionsStatsMap.set(regionNom, (regionsStatsMap.get(regionNom) || 0) + 1)
// //         })

// //         // Calculer les pourcentages pour les top régions
// //         const regionsArray: RegionStat[] = Array.from(regionsStatsMap.entries())
// //           .map(([nom, count]) => ({ nom, count, pourcentage: 0 }))
// //           .sort((a, b) => b.count - a.count)
// //           .slice(0, 5)

// //         const totalRegional = regionsArray.reduce((sum, r) => sum + r.count, 0)
// //         if (totalRegional > 0) {
// //           regionsArray.forEach(r => {
// //             r.pourcentage = Math.round((r.count / totalRegional) * 100)
// //           })
// //         }

// //         setRegionsStats(regionsArray)

// //         // Calculer la croissance (comparaison avec le mois précédent)
// //         const maintenant = new Date()
// //         const moisDernier = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)
        
// //         const fidelesCeMois = fidelesData.filter(f => {
// //           const dateCreation = new Date(f.created_at)
// //           return dateCreation >= new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
// //         }).length

// //         const fidelesMoisDernier = fidelesData.filter(f => {
// //           const dateCreation = new Date(f.created_at)
// //           return dateCreation >= moisDernier && dateCreation < new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
// //         }).length

// //         let croissanceValue = '+0%'
// //         if (fidelesMoisDernier > 0) {
// //           const taux = ((fidelesCeMois - fidelesMoisDernier) / fidelesMoisDernier) * 100
// //           croissanceValue = `${taux > 0 ? '+' : ''}${taux.toFixed(1)}%`
// //         }
// //         setCroissance(croissanceValue)

// //         // Nouveaux aujourd'hui
// //         const debutJournee = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate())
// //         const nouveauxAujourdhuiCount = fidelesData.filter(f => {
// //           const dateCreation = new Date(f.created_at)
// //           return dateCreation >= debutJournee
// //         }).length
// //         setNouveauxAujourdhui(nouveauxAujourdhuiCount)

// //         // Mettre à jour les stats
// //         setStats({
// //           totalFideles,
// //           totalParoisses: structuresStats?.paroisses || paroissesData.length,
// //           totalDistricts: structuresStats?.districts || districtsData.length,
// //           totalConferences: structuresStats?.conferences || conferencesData.length,
// //           totalRegions: structuresStats?.regions || regionsData.length,
// //           totalDepartements: departementsData.length,
// //           utilisateursActifs: fidelesActifs,
// //           totalComptes
// //         })

// //         // Générer des activités récentes
// //         const activites: ActiviteRecente[] = []
        
// //         // Derniers fidèles créés
// //         const derniersFideles = fidelesData
// //           .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
// //           .slice(0, 3)
        
// //         derniersFideles.forEach(fidele => {
// //           const paroisse = fidele.paroisse
// //           const paroisseNom = Array.isArray(paroisse) ? paroisse[0]?.nom : paroisse?.nom || 'Non assigné'
          
// //           activites.push({
// //             id: `fidele-${fidele.id}`,
// //             action: 'Nouveau fidèle ajouté',
// //             utilisateur: `${fidele.nom} ${fidele.prenom}`,
// //             role: fidele.compte?.role?.nom || 'Sans compte',
// //             time: getRelativeTime(new Date(fidele.created_at)),
// //             region: paroisseNom
// //           })
// //         })

// //         // Derniers départements créés
// //         const derniersDepartements = departementsData
// //           .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
// //           .slice(0, 2)
        
// //         derniersDepartements.forEach(dept => {
// //           activites.push({
// //             id: `dept-${dept.id}`,
// //             action: 'Département créé',
// //             utilisateur: 'Administrateur',
// //             role: 'Admin',
// //             time: getRelativeTime(new Date(dept.created_at)),
// //             region: 'Système'
// //           })
// //         })

// //         // Dernières structures créées
// //         if (paroissesData.length > 0) {
// //           const dernieresParoisses = paroissesData
// //             .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
// //             .slice(0, 2)
          
// //           dernieresParoisses.forEach(paroisse => {
// //             activites.push({
// //               id: `paroisse-${paroisse.id}`,
// //               action: 'Paroisse créée',
// //               utilisateur: 'Administrateur',
// //               role: 'Admin',
// //               time: getRelativeTime(new Date(paroisse.created_at)),
// //               region: paroisse.nom
// //             })
// //           })
// //         }

// //         // Trier toutes les activités par date
// //         activites.sort((a, b) => {
// //           const timeA = a.time.includes('min') ? 0 : a.time.includes('h') ? 1 : 2
// //           const timeB = b.time.includes('min') ? 0 : b.time.includes('h') ? 1 : 2
// //           return timeA - timeB
// //         })

// //         setActivitesRecentes(activites.slice(0, 8))

// //       } catch (error) {
// //         console.error('Erreur lors du chargement du dashboard:', error)
// //       } finally {
// //         setLoading(false)
// //       }
// //     }

// //     loadDashboardData()
// //   }, [])

// //   // Fonction utilitaire pour afficher le temps relatif
// //   const getRelativeTime = (date: Date): string => {
// //     const now = new Date()
// //     const diffMs = now.getTime() - date.getTime()
// //     const diffMins = Math.floor(diffMs / 60000)
// //     const diffHours = Math.floor(diffMins / 60)
// //     const diffDays = Math.floor(diffHours / 24)

// //     if (diffMins < 1) return "À l'instant"
// //     if (diffMins < 60) return `Il y a ${diffMins} min`
// //     if (diffHours < 24) return `Il y a ${diffHours}h`
// //     if (diffDays < 7) return `Il y a ${diffDays}j`
// //     return date.toLocaleDateString('fr-FR')
// //   }

// //   if (loading) {
// //     return <DashboardSkeleton />
// //   }

// //   return (
// //     <div className="space-y-8">
// //       {/* Banner - Design sobre avec opacité */}
// //       <div className="relative overflow-hidden bg-gradient-to-r from-gray-50/95 via-gray-100/95 to-gray-50/95 backdrop-blur-sm p-8 border-b border-gray-200/50">
// //         {/* Éléments décoratifs subtils */}
// //         <div className="absolute top-0 right-0 w-64 h-64 bg-gray-900/3 -translate-y-1/2 translate-x-1/3"></div>
// //         <div className="absolute bottom-0 left-0 w-48 h-48 bg-gray-900/3 translate-y-1/2 -translate-x-1/3"></div>
        
// //         <div className="relative">
// //           <div className="flex items-center gap-3 mb-1">
// //             <h2 className="text-2xl font-light text-gray-800 tracking-wide">
// //               Tableau de bord Administrateur
// //             </h2>
// //             {user && (
// //               <span className="text-xs font-light text-gray-500 bg-white/50 backdrop-blur-sm px-3 py-1 border border-gray-200/50">
// //                 {user.nom_complet}
// //               </span>
// //             )}
// //           </div>
// //           <p className="text-gray-500 text-sm font-light">
// //             Vue globale du système • {stats.utilisateursActifs.toLocaleString()} fidèles actifs • {stats.totalParoisses} paroisses
// //             {userNiveau && <span className="ml-2">• Niveau: {userNiveau}</span>}
// //           </p>
          
// //           <div className="flex gap-3 mt-5">
// //             <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
// //               <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Croissance</div>
// //               <div className="text-xl font-light text-gray-800">{croissance}</div>
// //             </div>
// //             <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
// //               <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Nouveaux aujourd'hui</div>
// //               <div className="text-xl font-light text-gray-800">{nouveauxAujourdhui}</div>
// //             </div>
// //             <div className="bg-white/60 backdrop-blur-sm px-5 py-2.5 border border-gray-200/50">
// //               <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Régions</div>
// //               <div className="text-xl font-light text-gray-800">{stats.totalRegions}</div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Cartes de statistiques */}
// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
// //         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
// //           <div className="flex items-center gap-3 mb-3">
// //             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
// //               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Fidèles Actifs</div>
// //           </div>
// //           <div className="text-3xl font-light text-gray-800">{stats.utilisateursActifs.toLocaleString()}</div>
// //           <div className="text-xs text-gray-400 mt-2 font-light">sur {stats.totalFideles.toLocaleString()} total</div>
// //         </div>

// //         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
// //           <div className="flex items-center gap-3 mb-3">
// //             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
// //               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Structures</div>
// //           </div>
// //           <div className="text-3xl font-light text-gray-800">{stats.totalParoisses}</div>
// //           <div className="text-xs text-gray-400 mt-2 font-light">
// //             {stats.totalRegions} régions • {stats.totalConferences} conférences • {stats.totalDistricts} districts
// //           </div>
// //         </div>

// //         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
// //           <div className="flex items-center gap-3 mb-3">
// //             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
// //               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Départements</div>
// //           </div>
// //           <div className="text-3xl font-light text-gray-800">{stats.totalDepartements}</div>
// //           <div className="text-xs text-gray-400 mt-2 font-light">Commissions et ministères</div>
// //         </div>

// //         <div className="bg-white border border-gray-100 p-6 hover:border-gray-200 transition-colors duration-200">
// //           <div className="flex items-center gap-3 mb-3">
// //             <div className="w-10 h-10 bg-gray-50 flex items-center justify-center border border-gray-100">
// //               <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-400 uppercase tracking-wider font-light">Comptes</div>
// //           </div>
// //           <div className="text-3xl font-light text-gray-800">{stats.totalComptes}</div>
// //           <div className="text-xs text-gray-400 mt-2 font-light">
// //             {stats.totalFideles > 0 ? Math.round((stats.totalComptes / stats.totalFideles) * 100) : 0}% des fidèles
// //           </div>
// //         </div>
// //       </div>

// //       {/* Graphiques et activités */}
// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
// //         {/* Top régions */}
// //         <div className="bg-white border border-gray-100 p-6 lg:col-span-1">
// //           <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-5">
// //             Répartition par région
// //           </h3>
// //           <div className="space-y-4">
// //             {regionsStats.length > 0 ? (
// //               regionsStats.map((region) => (
// //                 <div key={region.nom}>
// //                   <div className="flex justify-between text-sm mb-1.5">
// //                     <span className="text-gray-600 font-light truncate max-w-[120px]">{region.nom}</span>
// //                     <span className="text-gray-800 font-light">{region.count} conférence{region.count > 1 ? 's' : ''}</span>
// //                   </div>
// //                   <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
// //                     <div 
// //                       className="h-full bg-gray-400 transition-all duration-500"
// //                       style={{ width: `${region.pourcentage}%` }}
// //                     />
// //                   </div>
// //                 </div>
// //               ))
// //             ) : (
// //               <div className="text-center text-gray-400 py-8 text-sm font-light">
// //                 Aucune donnée disponible
// //               </div>
// //             )}
// //           </div>
// //         </div>

// //         {/* Activités récentes */}
// //         <div className="bg-white border border-gray-100 p-6 lg:col-span-2">
// //           <div className="flex items-center justify-between mb-5">
// //             <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider">
// //               Activités récentes
// //             </h3>
// //             <select 
// //               value={periode}
// //               onChange={(e) => setPeriode(e.target.value)}
// //               className="text-xs border border-gray-200 px-3 py-1.5 bg-white font-light text-gray-600 focus:outline-none focus:border-gray-300"
// //             >
// //               <option value="jour">Aujourd'hui</option>
// //               <option value="semaine">Cette semaine</option>
// //               <option value="mois">Ce mois</option>
// //             </select>
// //           </div>
          
// //           <div className="space-y-4">
// //             {activitesRecentes.length > 0 ? (
// //               activitesRecentes.map((activite) => (
// //                 <div key={activite.id} className="flex items-center gap-4 text-sm group">
// //                   <div className="w-9 h-9 bg-gray-50 flex items-center justify-center flex-shrink-0 border border-gray-100">
// //                     <span className="text-xs font-light text-gray-500">
// //                       {activite.utilisateur.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
// //                     </span>
// //                   </div>
// //                   <div className="flex-1 min-w-0">
// //                     <div className="flex items-center gap-2">
// //                       <span className="font-light text-gray-800 truncate">{activite.utilisateur}</span>
// //                       <span className="text-xs text-gray-400 font-light">({activite.role})</span>
// //                     </div>
// //                     <div className="text-xs text-gray-400 font-light truncate">
// //                       {activite.action} • {activite.region}
// //                     </div>
// //                   </div>
// //                   <div className="text-xs text-gray-400 font-light flex-shrink-0">{activite.time}</div>
// //                 </div>
// //               ))
// //             ) : (
// //               <div className="text-center text-gray-400 py-8 text-sm font-light">
// //                 Aucune activité récente
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       </div>

// //       {/* Actions rapides */}
// //       <div className="bg-white border border-gray-100 p-6">
// //         <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-5">
// //           Actions rapides
// //         </h3>
// //         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
// //           <Link href="/admin/fideles/nouveau" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
// //             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
// //               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Nouveau fidèle</div>
// //           </Link>
          
// //           <Link href="/admin/departements" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
// //             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
// //               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Départements</div>
// //           </Link>
          
// //           <Link href="/admin/structures" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
// //             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
// //               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Structures</div>
// //           </Link>
          
// //           <Link href="/admin/annees-conference" className="p-5 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all duration-200 text-center group">
// //             <div className="w-9 h-9 mx-auto mb-3 bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:border-gray-200 transition-colors">
// //               <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
// //                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
// //               </svg>
// //             </div>
// //             <div className="text-xs text-gray-500 font-light uppercase tracking-wider">Années</div>
// //           </Link>
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }
// 'use client'

// import { useState, useEffect } from 'react'
// import Link from 'next/link'
// import { getFideles } from '@/actions/fidele'
// import { getUser } from '@/actions/auth'
// import { getDistricts, getParoisses, getConferences, getRegions } from '@/actions/structures'

// // Types
// interface DashboardStats {
//   totalFideles: number
//   hommes: number
//   femmes: number
//   nouveauxCeMois: number
//   nouveauxCetteSemaine: number
// }

// interface StructureStat {
//   nom: string
//   total: number
//   hommes: number
//   femmes: number
//   pourcentage: number
//   parentName?: string
// }

// interface TopFidele {
//   id: string
//   nom: string
//   prenom: string
//   sexe: string
//   paroisse: string
//   district: string
//   conference: string
//   dateAjout: string
// }

// // Skeleton Loader
// function DashboardSkeleton() {
//   return (
//     <div className="space-y-6 animate-pulse">
//       <div className="bg-gradient-to-r from-gray-100/80 to-gray-200/80 backdrop-blur-sm p-6">
//         <div className="h-6 w-48 bg-gray-300/50 mb-2"></div>
//         <div className="h-4 w-72 bg-gray-300/50"></div>
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="bg-white border border-gray-100 p-4">
//             <div className="h-3 w-16 bg-gray-200 mb-2"></div>
//             <div className="h-6 w-12 bg-gray-200"></div>
//           </div>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//         {[...Array(2)].map((_, i) => (
//           <div key={i} className="bg-white border border-gray-100 p-5">
//             <div className="h-4 w-32 bg-gray-200 mb-4"></div>
//             <div className="space-y-3">
//               {[...Array(5)].map((_, j) => (
//                 <div key={j}>
//                   <div className="flex justify-between mb-1">
//                     <div className="h-3 w-24 bg-gray-200"></div>
//                     <div className="h-3 w-32 bg-gray-200"></div>
//                   </div>
//                   <div className="h-1.5 w-full bg-gray-200"></div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }

// export default function AdminDashboard() {
//   const [loading, setLoading] = useState(true)
//   const [user, setUser] = useState<any>(null)
//   const [activeTab, setActiveTab] = useState<'conferences' | 'districts' | 'paroisses'>('conferences')
  
//   const [stats, setStats] = useState<DashboardStats>({
//     totalFideles: 0,
//     hommes: 0,
//     femmes: 0,
//     nouveauxCeMois: 0,
//     nouveauxCetteSemaine: 0
//   })

//   const [conferencesStats, setConferencesStats] = useState<StructureStat[]>([])
//   const [districtsStats, setDistrictsStats] = useState<StructureStat[]>([])
//   const [paroissesStats, setParoissesStats] = useState<StructureStat[]>([])
//   const [topFideles, setTopFideles] = useState<TopFidele[]>([])

//   useEffect(() => {
//     const loadDashboardData = async () => {
//       try {
//         const currentUser = await getUser()
//         setUser(currentUser)

//         const [fidelesData, regionsData, conferencesData, districtsData, paroissesData] = await Promise.all([
//           getFideles(),
//           getRegions(),
//           getConferences(),
//           getDistricts(),
//           getParoisses()
//         ])

//         // Stats de base
//         const totalFideles = fidelesData.length
//         const hommes = fidelesData.filter(f => f.sexe === 'M').length
//         const femmes = fidelesData.filter(f => f.sexe === 'F').length

//         const maintenant = new Date()
//         const debutSemaine = new Date(maintenant)
//         debutSemaine.setDate(maintenant.getDate() - maintenant.getDay())
//         debutSemaine.setHours(0, 0, 0, 0)
        
//         const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)

//         const nouveauxCetteSemaine = fidelesData.filter(f => {
//           return new Date(f.created_at) >= debutSemaine
//         }).length

//         const nouveauxCeMois = fidelesData.filter(f => {
//           return new Date(f.created_at) >= debutMois
//         }).length

//         setStats({
//           totalFideles,
//           hommes,
//           femmes,
//           nouveauxCeMois,
//           nouveauxCetteSemaine
//         })

//         // Créer les maps pour les relations
//         const regionsMap = new Map<number, string>()
//         regionsData.forEach(r => regionsMap.set(r.id, r.nom))

//         const conferencesMap = new Map<number, { nom: string; region_id: number }>()
//         conferencesData.forEach(c => conferencesMap.set(c.id, { nom: c.nom, region_id: c.region_id }))

//         const districtsMap = new Map<number, { nom: string; conference_id: number }>()
//         districtsData.forEach(d => districtsMap.set(d.id, { nom: d.nom, conference_id: d.conference_id }))

//         const paroissesMap = new Map<number, { nom: string; district_id: number }>()
//         paroissesData.forEach(p => paroissesMap.set(p.id, { nom: p.nom, district_id: p.district_id }))

//         // Stats par conférence
//         const conferencesStatsMap = new Map<string, { total: number; hommes: number; femmes: number }>()
        
//         fidelesData.forEach(fidele => {
//           if (fidele.paroisse_id) {
//             const paroisse = paroissesMap.get(fidele.paroisse_id)
//             if (paroisse) {
//               const district = districtsMap.get(paroisse.district_id)
//               if (district) {
//                 const conference = conferencesMap.get(district.conference_id)
//                 if (conference) {
//                   const regionNom = regionsMap.get(conference.region_id) || ''
//                   const conferenceFullName = regionNom ? `${conference.nom} (${regionNom})` : conference.nom
                  
//                   if (!conferencesStatsMap.has(conferenceFullName)) {
//                     conferencesStatsMap.set(conferenceFullName, { total: 0, hommes: 0, femmes: 0 })
//                   }
                  
//                   const stats = conferencesStatsMap.get(conferenceFullName)!
//                   stats.total++
//                   if (fidele.sexe === 'M') stats.hommes++
//                   if (fidele.sexe === 'F') stats.femmes++
//                 }
//               }
//             }
//           }
//         })

//         // Stats par district
//         const districtsStatsMap = new Map<string, { total: number; hommes: number; femmes: number; conferenceName: string }>()
        
//         fidelesData.forEach(fidele => {
//           if (fidele.paroisse_id) {
//             const paroisse = paroissesMap.get(fidele.paroisse_id)
//             if (paroisse) {
//               const district = districtsMap.get(paroisse.district_id)
//               if (district) {
//                 const conference = conferencesMap.get(district.conference_id)
                
//                 if (!districtsStatsMap.has(district.nom)) {
//                   districtsStatsMap.set(district.nom, { 
//                     total: 0, 
//                     hommes: 0, 
//                     femmes: 0,
//                     conferenceName: conference?.nom || ''
//                   })
//                 }
                
//                 const stats = districtsStatsMap.get(district.nom)!
//                 stats.total++
//                 if (fidele.sexe === 'M') stats.hommes++
//                 if (fidele.sexe === 'F') stats.femmes++
//               }
//             }
//           }
//         })

//         // Stats par paroisse
//         const paroissesStatsMap = new Map<string, { total: number; hommes: number; femmes: number; districtName: string }>()
        
//         fidelesData.forEach(fidele => {
//           if (fidele.paroisse_id) {
//             const paroisse = paroissesMap.get(fidele.paroisse_id)
//             if (paroisse) {
//               const district = districtsMap.get(paroisse.district_id)
              
//               if (!paroissesStatsMap.has(paroisse.nom)) {
//                 paroissesStatsMap.set(paroisse.nom, { 
//                   total: 0, 
//                   hommes: 0, 
//                   femmes: 0,
//                   districtName: district?.nom || ''
//                 })
//               }
              
//               const stats = paroissesStatsMap.get(paroisse.nom)!
//               stats.total++
//               if (fidele.sexe === 'M') stats.hommes++
//               if (fidele.sexe === 'F') stats.femmes++
//             }
//           }
//         })

//         // Formater les stats et calculer les pourcentages
//         const formatStats = (statsMap: Map<string, any>, maxItems: number = 10): StructureStat[] => {
//           const array = Array.from(statsMap.entries())
//             .map(([nom, data]) => ({
//               nom,
//               total: data.total,
//               hommes: data.hommes,
//               femmes: data.femmes,
//               pourcentage: 0,
//               parentName: data.conferenceName || data.districtName || ''
//             }))
//             .sort((a, b) => b.total - a.total)
//             .slice(0, maxItems)

//           const maxTotal = array.length > 0 ? array[0].total : 1
//           array.forEach(item => {
//             item.pourcentage = Math.round((item.total / maxTotal) * 100)
//           })

//           return array
//         }

//         setConferencesStats(formatStats(conferencesStatsMap, 8))
//         setDistrictsStats(formatStats(districtsStatsMap, 8))
//         setParoissesStats(formatStats(paroissesStatsMap, 10))

//         // Top fidèles (les plus récents)
//         const topFidelesData: TopFidele[] = fidelesData
//           .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
//           .slice(0, 10)
//           .map(fidele => {
//             let paroisseName = 'Non assignée'
//             let districtName = 'Non assigné'
//             let conferenceName = 'Non assignée'

//             if (fidele.paroisse_id) {
//               const paroisse = paroissesMap.get(fidele.paroisse_id)
//               if (paroisse) {
//                 paroisseName = paroisse.nom
//                 const district = districtsMap.get(paroisse.district_id)
//                 if (district) {
//                   districtName = district.nom
//                   const conference = conferencesMap.get(district.conference_id)
//                   if (conference) {
//                     conferenceName = conference.nom
//                   }
//                 }
//               }
//             }

//             return {
//               id: fidele.id,
//               nom: fidele.nom,
//               prenom: fidele.prenom,
//               sexe: fidele.sexe || 'N/A',
//               paroisse: paroisseName,
//               district: districtName,
//               conference: conferenceName,
//               dateAjout: new Date(fidele.created_at).toLocaleDateString('fr-FR')
//             }
//           })

//         setTopFideles(topFidelesData)

//       } catch (error) {
//         console.error('Erreur lors du chargement du dashboard:', error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadDashboardData()
//   }, [])

//   if (loading) {
//     return <DashboardSkeleton />
//   }

//   return (
//     <div className="space-y-6">
//       {/* Banner minimal */}
//       <div className="bg-gradient-to-r from-gray-50/95 to-gray-100/95 backdrop-blur-sm p-6 border-b border-gray-200/50">
//         <div className="flex items-center gap-3">
//           <h2 className="text-xl font-light text-gray-800 tracking-wide">
//             Tableau de bord
//           </h2>
//           {user && (
//             <span className="text-xs font-light text-gray-500 bg-white/60 backdrop-blur-sm px-3 py-1 border border-gray-200/50">
//               {user.nom_complet}
//             </span>
//           )}
//         </div>
//         <p className="text-gray-500 text-sm font-light mt-1">
//           {stats.totalFideles.toLocaleString()} fidèles au total
//         </p>
//       </div>

//       {/* Stats essentielles */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//         <div className="bg-white border border-gray-100 p-4">
//           <div className="text-xs text-gray-400 uppercase tracking-wider font-light mb-1">Total Fidèles</div>
//           <div className="text-2xl font-light text-gray-800">{stats.totalFideles.toLocaleString()}</div>
//           <div className="flex gap-3 mt-1 text-xs text-gray-400">
//             <span>♂ {stats.hommes.toLocaleString()}</span>
//             <span>♀ {stats.femmes.toLocaleString()}</span>
//           </div>
//         </div>

//         <div className="bg-white border border-gray-100 p-4">
//           <div className="text-xs text-gray-400 uppercase tracking-wider font-light mb-1">Répartition H/F</div>
//           <div className="text-2xl font-light text-gray-800">
//             {stats.totalFideles > 0 ? Math.round((stats.hommes / stats.totalFideles) * 100) : 0}%
//             <span className="text-base text-gray-400"> / </span>
//             {stats.totalFideles > 0 ? Math.round((stats.femmes / stats.totalFideles) * 100) : 0}%
//           </div>
//           <div className="w-full h-1.5 bg-gray-100 mt-2 overflow-hidden flex">
//             <div 
//               className="h-full bg-gray-600 transition-all"
//               style={{ width: `${stats.totalFideles > 0 ? (stats.hommes / stats.totalFideles) * 100 : 0}%` }}
//             />
//             <div 
//               className="h-full bg-gray-300 transition-all"
//               style={{ width: `${stats.totalFideles > 0 ? (stats.femmes / stats.totalFideles) * 100 : 0}%` }}
//             />
//           </div>
//         </div>

//         <div className="bg-white border border-gray-100 p-4">
//           <div className="text-xs text-gray-400 uppercase tracking-wider font-light mb-1">Ce mois</div>
//           <div className="text-2xl font-light text-gray-800">+{stats.nouveauxCeMois}</div>
//           <div className="text-xs text-gray-400 mt-1">Nouveaux fidèles</div>
//         </div>

//         <div className="bg-white border border-gray-100 p-4">
//           <div className="text-xs text-gray-400 uppercase tracking-wider font-light mb-1">Cette semaine</div>
//           <div className="text-2xl font-light text-gray-800">+{stats.nouveauxCetteSemaine}</div>
//           <div className="text-xs text-gray-400 mt-1">Nouveaux fidèles</div>
//         </div>
//       </div>

//       {/* Tabs de navigation pour les stats par structure */}
//       <div className="bg-white border border-gray-100">
//         <div className="border-b border-gray-100">
//           <div className="flex">
//             <button
//               onClick={() => setActiveTab('conferences')}
//               className={`px-5 py-3 text-xs font-light uppercase tracking-wider transition-colors ${
//                 activeTab === 'conferences'
//                   ? 'text-gray-800 border-b-2 border-gray-800'
//                   : 'text-gray-400 hover:text-gray-600'
//               }`}
//             >
//               Conférences
//             </button>
//             <button
//               onClick={() => setActiveTab('districts')}
//               className={`px-5 py-3 text-xs font-light uppercase tracking-wider transition-colors ${
//                 activeTab === 'districts'
//                   ? 'text-gray-800 border-b-2 border-gray-800'
//                   : 'text-gray-400 hover:text-gray-600'
//               }`}
//             >
//               Districts
//             </button>
//             <button
//               onClick={() => setActiveTab('paroisses')}
//               className={`px-5 py-3 text-xs font-light uppercase tracking-wider transition-colors ${
//                 activeTab === 'paroisses'
//                   ? 'text-gray-800 border-b-2 border-gray-800'
//                   : 'text-gray-400 hover:text-gray-600'
//               }`}
//             >
//               Paroisses
//             </button>
//           </div>
//         </div>

//         <div className="p-5">
//           {activeTab === 'conferences' && (
//             <div>
//               <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-4">
//                 Fidèles par conférence
//               </h3>
//               {conferencesStats.length > 0 ? (
//                 <div className="space-y-3">
//                   {conferencesStats.map((conf) => (
//                     <div key={conf.nom}>
//                       <div className="flex justify-between text-sm mb-1">
//                         <span className="text-gray-700 font-light truncate max-w-[200px]">{conf.nom}</span>
//                         <span className="text-gray-500 font-light text-xs">
//                           {conf.total} fidèles 
//                           <span className="ml-1">(♂{conf.hommes} ♀{conf.femmes})</span>
//                         </span>
//                       </div>
//                       <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
//                         <div className="h-full flex">
//                           <div 
//                             className="h-full bg-gray-600 transition-all"
//                             style={{ width: `${conf.total > 0 ? (conf.hommes / (conf.hommes + conf.femmes || 1)) * conf.pourcentage : 0}%` }}
//                           />
//                           <div 
//                             className="h-full bg-gray-300 transition-all"
//                             style={{ width: `${conf.total > 0 ? (conf.femmes / (conf.hommes + conf.femmes || 1)) * conf.pourcentage : 0}%` }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center text-gray-400 py-6 text-sm font-light">
//                   Aucune donnée disponible
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'districts' && (
//             <div>
//               <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-4">
//                 Fidèles par district
//               </h3>
//               {districtsStats.length > 0 ? (
//                 <div className="space-y-3">
//                   {districtsStats.map((district) => (
//                     <div key={district.nom}>
//                       <div className="flex justify-between text-sm mb-1">
//                         <div className="min-w-0">
//                           <span className="text-gray-700 font-light truncate block">{district.nom}</span>
//                           {district.parentName && (
//                             <span className="text-xs text-gray-400">{district.parentName}</span>
//                           )}
//                         </div>
//                         <span className="text-gray-500 font-light text-xs flex-shrink-0 ml-3">
//                           {district.total} fidèles 
//                           <span className="ml-1">(♂{district.hommes} ♀{district.femmes})</span>
//                         </span>
//                       </div>
//                       <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
//                         <div className="h-full flex">
//                           <div 
//                             className="h-full bg-gray-600 transition-all"
//                             style={{ width: `${district.total > 0 ? (district.hommes / (district.hommes + district.femmes || 1)) * district.pourcentage : 0}%` }}
//                           />
//                           <div 
//                             className="h-full bg-gray-300 transition-all"
//                             style={{ width: `${district.total > 0 ? (district.femmes / (district.hommes + district.femmes || 1)) * district.pourcentage : 0}%` }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center text-gray-400 py-6 text-sm font-light">
//                   Aucune donnée disponible
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'paroisses' && (
//             <div>
//               <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-4">
//                 Top 10 paroisses
//               </h3>
//               {paroissesStats.length > 0 ? (
//                 <div className="space-y-3">
//                   {paroissesStats.map((paroisse) => (
//                     <div key={paroisse.nom}>
//                       <div className="flex justify-between text-sm mb-1">
//                         <div className="min-w-0">
//                           <span className="text-gray-700 font-light truncate block">{paroisse.nom}</span>
//                           {paroisse.parentName && (
//                             <span className="text-xs text-gray-400">{paroisse.parentName}</span>
//                           )}
//                         </div>
//                         <span className="text-gray-500 font-light text-xs flex-shrink-0 ml-3">
//                           {paroisse.total} fidèles 
//                           <span className="ml-1">(♂{paroisse.hommes} ♀{paroisse.femmes})</span>
//                         </span>
//                       </div>
//                       <div className="w-full h-1.5 bg-gray-100 overflow-hidden">
//                         <div className="h-full flex">
//                           <div 
//                             className="h-full bg-gray-600 transition-all"
//                             style={{ width: `${paroisse.total > 0 ? (paroisse.hommes / (paroisse.hommes + paroisse.femmes || 1)) * paroisse.pourcentage : 0}%` }}
//                           />
//                           <div 
//                             className="h-full bg-gray-300 transition-all"
//                             style={{ width: `${paroisse.total > 0 ? (paroisse.femmes / (paroisse.hommes + paroisse.femmes || 1)) * paroisse.pourcentage : 0}%` }}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center text-gray-400 py-6 text-sm font-light">
//                   Aucune donnée disponible
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Top fidèles */}
//       <div className="bg-white border border-gray-100 p-5">
//         <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-4">
//           Derniers fidèles enregistrés
//         </h3>
        
//         {topFideles.length > 0 ? (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-gray-100">
//                   <th className="text-left py-2 px-3 text-xs font-light text-gray-400 uppercase tracking-wider">Fidèle</th>
//                   <th className="text-left py-2 px-3 text-xs font-light text-gray-400 uppercase tracking-wider">Paroisse</th>
//                   <th className="text-left py-2 px-3 text-xs font-light text-gray-400 uppercase tracking-wider hidden md:table-cell">District</th>
//                   <th className="text-left py-2 px-3 text-xs font-light text-gray-400 uppercase tracking-wider hidden md:table-cell">Conférence</th>
//                   <th className="text-right py-2 px-3 text-xs font-light text-gray-400 uppercase tracking-wider">Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {topFideles.map((fidele) => (
//                   <tr key={fidele.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
//                     <td className="py-2.5 px-3">
//                       <div className="flex items-center gap-2">
//                         <div className="w-7 h-7 bg-gray-50 flex items-center justify-center border border-gray-100 text-xs font-light text-gray-500 flex-shrink-0">
//                           {fidele.prenom[0]}{fidele.nom[0]}
//                         </div>
//                         <div>
//                           <div className="font-light text-gray-800 text-sm">
//                             {fidele.prenom} {fidele.nom}
//                           </div>
//                           <div className="text-xs text-gray-400">
//                             {fidele.sexe === 'M' ? '♂ Homme' : fidele.sexe === 'F' ? '♀ Femme' : fidele.sexe}
//                           </div>
//                         </div>
//                       </div>
//                     </td>
//                     <td className="py-2.5 px-3 text-gray-600 font-light">{fidele.paroisse}</td>
//                     <td className="py-2.5 px-3 text-gray-600 font-light hidden md:table-cell">{fidele.district}</td>
//                     <td className="py-2.5 px-3 text-gray-600 font-light hidden md:table-cell">{fidele.conference}</td>
//                     <td className="py-2.5 px-3 text-right text-gray-400 font-light text-xs">{fidele.dateAjout}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         ) : (
//           <div className="text-center text-gray-400 py-6 text-sm font-light">
//             Aucun fidèle enregistré
//           </div>
//         )}
//       </div>

//       {/* Actions rapides */}
//       <div className="bg-white border border-gray-100 p-5">
//         <h3 className="text-xs font-light text-gray-400 uppercase tracking-wider mb-4">
//           Actions rapides
//         </h3>
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//           <Link href="/admin/fideles/nouveau" className="p-4 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all text-center group">
//             <svg className="w-4 h-4 text-gray-400 mx-auto mb-2 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
//             </svg>
//             <div className="text-xs text-gray-500 font-light">Ajouter un fidèle</div>
//           </Link>
          
//           <Link href="/admin/fideles" className="p-4 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all text-center group">
//             <svg className="w-4 h-4 text-gray-400 mx-auto mb-2 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
//             </svg>
//             <div className="text-xs text-gray-500 font-light">Liste des fidèles</div>
//           </Link>
          
//           <Link href="/admin/structures" className="p-4 border border-gray-100 hover:border-gray-200 hover:bg-gray-50/50 transition-all text-center group">
//             <svg className="w-4 h-4 text-gray-400 mx-auto mb-2 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
//             </svg>
//             <div className="text-xs text-gray-500 font-light">Structures</div>
//           </Link>
//         </div>
//       </div>
//     </div>
//   )
// }
// app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/actions/auth'
import { getFideles } from '@/actions/fidele'
import { getConferences, getDistricts, getParoisses } from '@/actions/structures'
import { 
  Users, 
  ChevronRight,
  Loader2,
  TrendingUp,
  UserPlus,
  Clock,
  MapPin,
  LayoutDashboard,
  Building2,
  Globe,
} from 'lucide-react'

// Types
interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  sexe: string
  contact: string | null
  profile_img: string | null
  paroisse_id: number | null
  created_at: string
  compte: {
    id: number
    role_id: number
    role: {
      nom: string
      niveau: string
    }
  } | null
}

interface Conference {
  id: number
  nom: string
  region_id: number
  region?: { id: number; nom: string }
}

interface District {
  id: number
  nom: string
  conference_id: number
  conference?: { id: number; nom: string; region?: { id: number; nom: string } }
}

interface Paroisse {
  id: number
  nom: string
  district_id: number
  district?: { id: number; nom: string; conference?: { id: number; nom: string } }
}

interface StructureStat {
  nom: string
  total: number
  hommes: number
  femmes: number
  pourcentage: number
  parentName?: string
}

interface TopFidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  sexe: string
  profile_img: string | null
  paroisse: string
  district: string
  conference: string
  dateAjout: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'conferences' | 'districts' | 'paroisses'>('conferences')
  
  const [allFideles, setAllFideles] = useState<Fidele[]>([])
  const [conferences, setConferences] = useState<Conference[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [paroisses, setParoisses] = useState<Paroisse[]>([])

  const [conferencesStats, setConferencesStats] = useState<StructureStat[]>([])
  const [districtsStats, setDistrictsStats] = useState<StructureStat[]>([])
  const [paroissesStats, setParoissesStats] = useState<StructureStat[]>([])
  const [topFideles, setTopFideles] = useState<TopFidele[]>([])

  // Stats globales
  const [totalFideles, setTotalFideles] = useState(0)
  const [hommes, setHommes] = useState(0)
  const [femmes, setFemmes] = useState(0)
  const [nouveauxCeMois, setNouveauxCeMois] = useState(0)
  const [nouveauxCetteSemaine, setNouveauxCetteSemaine] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const user = await getUser()
      if (!user || user.role?.nom !== 'admin') {
        router.push('/profile')
        return
      }

      const [fidelesData, conferencesData, districtsData, paroissesData] = await Promise.all([
        getFideles(),
        getConferences(),
        getDistricts(),
        getParoisses()
      ])

      setAllFideles(fidelesData)
      setConferences(conferencesData)
      setDistricts(districtsData)
      setParoisses(paroissesData)

      // Calculer les stats globales
      calculateGlobalStats(fidelesData)
      
      // Calculer les stats par structure
      calculateStructureStats(fidelesData, conferencesData, districtsData, paroissesData)
      
      // Calculer les top fidèles
      calculateTopFideles(fidelesData, paroissesData, districtsData, conferencesData)

    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateGlobalStats = (fidelesData: Fidele[]) => {
    const total = fidelesData.length
    const h = fidelesData.filter(f => f.sexe === 'M').length
    const f = fidelesData.filter(f => f.sexe === 'F').length

    const maintenant = new Date()
    const debutSemaine = new Date(maintenant)
    debutSemaine.setDate(maintenant.getDate() - maintenant.getDay())
    debutSemaine.setHours(0, 0, 0, 0)
    
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)

    const nouveauxSemaine = fidelesData.filter(f => new Date(f.created_at) >= debutSemaine).length
    const nouveauxMois = fidelesData.filter(f => new Date(f.created_at) >= debutMois).length

    setTotalFideles(total)
    setHommes(h)
    setFemmes(f)
    setNouveauxCeMois(nouveauxMois)
    setNouveauxCetteSemaine(nouveauxSemaine)
  }

  const calculateStructureStats = (
    fidelesData: Fidele[], 
    conferencesData: Conference[], 
    districtsData: District[], 
    paroissesData: Paroisse[]
  ) => {
    // Créer les maps pour les relations
    const conferencesMap = new Map<number, string>()
    conferencesData.forEach(c => conferencesMap.set(c.id, c.nom))

    const districtsMap = new Map<number, { nom: string; conference_id: number }>()
    districtsData.forEach(d => districtsMap.set(d.id, { nom: d.nom, conference_id: d.conference_id }))

    const paroissesMap = new Map<number, { nom: string; district_id: number; conference_id?: number }>()
    paroissesData.forEach(p => {
      const district = districtsMap.get(p.district_id)
      paroissesMap.set(p.id, { 
        nom: p.nom, 
        district_id: p.district_id,
        conference_id: district?.conference_id 
      })
    })

    // Stats par conférence
    const conferencesStatsMap = new Map<string, { total: number; hommes: number; femmes: number }>()
    
    fidelesData.forEach(fidele => {
      if (fidele.paroisse_id) {
        const paroisse = paroissesMap.get(fidele.paroisse_id)
        if (paroisse && paroisse.conference_id) {
          const conferenceNom = conferencesMap.get(paroisse.conference_id)
          if (conferenceNom) {
            if (!conferencesStatsMap.has(conferenceNom)) {
              conferencesStatsMap.set(conferenceNom, { total: 0, hommes: 0, femmes: 0 })
            }
            const stats = conferencesStatsMap.get(conferenceNom)!
            stats.total++
            if (fidele.sexe === 'M') stats.hommes++
            if (fidele.sexe === 'F') stats.femmes++
          }
        }
      }
    })

    // Stats par district
    const districtsStatsMap = new Map<string, { total: number; hommes: number; femmes: number; conferenceName: string }>()
    
    fidelesData.forEach(fidele => {
      if (fidele.paroisse_id) {
        const paroisse = paroissesMap.get(fidele.paroisse_id)
        if (paroisse) {
          const district = districtsMap.get(paroisse.district_id)
          if (district) {
            const conferenceNom = conferencesMap.get(district.conference_id) || ''
            
            if (!districtsStatsMap.has(district.nom)) {
              districtsStatsMap.set(district.nom, { total: 0, hommes: 0, femmes: 0, conferenceName: conferenceNom })
            }
            const stats = districtsStatsMap.get(district.nom)!
            stats.total++
            if (fidele.sexe === 'M') stats.hommes++
            if (fidele.sexe === 'F') stats.femmes++
          }
        }
      }
    })

    // Stats par paroisse
    const paroissesStatsMap = new Map<string, { total: number; hommes: number; femmes: number; districtName: string }>()
    
    fidelesData.forEach(fidele => {
      if (fidele.paroisse_id) {
        const paroisse = paroissesMap.get(fidele.paroisse_id)
        if (paroisse) {
          const district = districtsMap.get(paroisse.district_id)
          
          if (!paroissesStatsMap.has(paroisse.nom)) {
            paroissesStatsMap.set(paroisse.nom, { total: 0, hommes: 0, femmes: 0, districtName: district?.nom || '' })
          }
          const stats = paroissesStatsMap.get(paroisse.nom)!
          stats.total++
          if (fidele.sexe === 'M') stats.hommes++
          if (fidele.sexe === 'F') stats.femmes++
        }
      }
    })

    // Formater et trier les stats
    const formatStats = (statsMap: Map<string, any>, maxItems: number = 10): StructureStat[] => {
      const array = Array.from(statsMap.entries())
        .map(([nom, data]) => ({
          nom,
          total: data.total,
          hommes: data.hommes,
          femmes: data.femmes,
          pourcentage: 0,
          parentName: data.conferenceName || data.districtName || ''
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, maxItems)

      const maxTotal = array.length > 0 ? array[0].total : 1
      array.forEach(item => {
        item.pourcentage = Math.round((item.total / (maxTotal || 1)) * 100)
      })

      return array
    }

    setConferencesStats(formatStats(conferencesStatsMap, 8))
    setDistrictsStats(formatStats(districtsStatsMap, 8))
    setParoissesStats(formatStats(paroissesStatsMap, 10))
  }

  const calculateTopFideles = (
    fidelesData: Fidele[], 
    paroissesData: Paroisse[], 
    districtsData: District[], 
    conferencesData: Conference[]
  ) => {
    const paroissesMap = new Map<number, Paroisse>()
    paroissesData.forEach(p => paroissesMap.set(p.id, p))

    const districtsMap = new Map<number, District>()
    districtsData.forEach(d => districtsMap.set(d.id, d))

    const conferencesMap = new Map<number, Conference>()
    conferencesData.forEach(c => conferencesMap.set(c.id, c))

    const topData: TopFidele[] = fidelesData
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(fidele => {
        let paroisseName = 'Non assignée'
        let districtName = 'Non assigné'
        let conferenceName = 'Non assignée'

        if (fidele.paroisse_id) {
          const paroisse = paroissesMap.get(fidele.paroisse_id)
          if (paroisse) {
            paroisseName = paroisse.nom
            const district = districtsMap.get(paroisse.district_id)
            if (district) {
              districtName = district.nom
              const conference = conferencesMap.get(district.conference_id)
              if (conference) {
                conferenceName = conference.nom
              }
            }
          }
        }

        return {
          id: fidele.id,
          nom: fidele.nom,
          post_nom: fidele.post_nom,
          prenom: fidele.prenom,
          sexe: fidele.sexe || 'N/A',
          profile_img: fidele.profile_img || null,
          paroisse: paroisseName,
          district: districtName,
          conference: conferenceName,
          dateAjout: new Date(fidele.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        }
      })

    setTopFideles(topData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white border border-gray-200">
              <LayoutDashboard size={20} className="text-gray-700" />
            </div>
            <h1 className="text-2xl font-light tracking-tight text-gray-900">
              Tableau de bord
            </h1>
          </div>
          <p className="text-gray-500 text-sm ml-14">
            Statistiques des fidèles et répartition par structures
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 border border-blue-100">
                <Users size={18} className="text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{totalFideles.toLocaleString()}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Fidèles</div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-xs text-gray-400">
              <span>♂ {hommes.toLocaleString()}</span>
              <span>♀ {femmes.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 border border-emerald-100">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">
              {totalFideles > 0 ? Math.round((hommes / totalFideles) * 100) : 0}% / {totalFideles > 0 ? Math.round((femmes / totalFideles) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Répartition H/F</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="w-full h-1.5 bg-gray-100 overflow-hidden flex rounded-full">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${totalFideles > 0 ? (hommes / totalFideles) * 100 : 0}%` }}
                />
                <div 
                  className="h-full bg-pink-400 transition-all"
                  style={{ width: `${totalFideles > 0 ? (femmes / totalFideles) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 border border-amber-100">
                <UserPlus size={18} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">+{nouveauxCeMois}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Nouveaux ce mois</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">{nouveauxCetteSemaine} cette semaine</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 border border-purple-100">
                <Globe size={18} className="text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{conferences.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Structures</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {conferences.length} conf. • {districts.length} dist. • {paroisses.length} par.
              </span>
            </div>
          </div>
        </div>

        {/* Tabs pour les stats par structure */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('conferences')}
                className={`px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'conferences'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Par Conférence
              </button>
              <button
                onClick={() => setActiveTab('districts')}
                className={`px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'districts'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Par District
              </button>
              <button
                onClick={() => setActiveTab('paroisses')}
                className={`px-5 py-3 text-xs font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'paroisses'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Par Paroisse
              </button>
            </div>
          </div>

          <div className="p-5">
            {activeTab === 'conferences' && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Fidèles par conférence</h3>
                {conferencesStats.length > 0 ? (
                  <div className="space-y-3">
                    {conferencesStats.map((conf) => (
                      <div key={conf.nom}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-700 truncate max-w-[200px]">{conf.nom}</span>
                          <span className="text-gray-500 text-xs flex-shrink-0 ml-3">
                            {conf.total} fidèles (♂{conf.hommes} ♀{conf.femmes})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 overflow-hidden rounded-full">
                          <div className="h-full flex">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${conf.total > 0 ? (conf.hommes / conf.total) * conf.pourcentage : 0}%` }}
                            />
                            <div 
                              className="h-full bg-pink-400 transition-all duration-500"
                              style={{ width: `${conf.total > 0 ? (conf.femmes / conf.total) * conf.pourcentage : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            )}

            {activeTab === 'districts' && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Fidèles par district</h3>
                {districtsStats.length > 0 ? (
                  <div className="space-y-3">
                    {districtsStats.map((district) => (
                      <div key={district.nom}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <div className="min-w-0">
                            <span className="text-gray-700 block truncate">{district.nom}</span>
                            {district.parentName && (
                              <span className="text-xs text-gray-400">{district.parentName}</span>
                            )}
                          </div>
                          <span className="text-gray-500 text-xs flex-shrink-0 ml-3">
                            {district.total} fidèles (♂{district.hommes} ♀{district.femmes})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 overflow-hidden rounded-full">
                          <div className="h-full flex">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${district.total > 0 ? (district.hommes / district.total) * district.pourcentage : 0}%` }}
                            />
                            <div 
                              className="h-full bg-pink-400 transition-all duration-500"
                              style={{ width: `${district.total > 0 ? (district.femmes / district.total) * district.pourcentage : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            )}

            {activeTab === 'paroisses' && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-4">Top 10 paroisses</h3>
                {paroissesStats.length > 0 ? (
                  <div className="space-y-3">
                    {paroissesStats.map((paroisse, index) => (
                      <div key={paroisse.nom}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <div className="min-w-0 flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
                            <div>
                              <span className="text-gray-700 block truncate">{paroisse.nom}</span>
                              {paroisse.parentName && (
                                <span className="text-xs text-gray-400">{paroisse.parentName}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs flex-shrink-0 ml-3">
                            {paroisse.total} fidèles (♂{paroisse.hommes} ♀{paroisse.femmes})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 overflow-hidden rounded-full ml-7">
                          <div className="h-full flex">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-500"
                              style={{ width: `${paroisse.total > 0 ? (paroisse.hommes / paroisse.total) * paroisse.pourcentage : 0}%` }}
                            />
                            <div 
                              className="h-full bg-pink-400 transition-all duration-500"
                              style={{ width: `${paroisse.total > 0 ? (paroisse.femmes / paroisse.total) * paroisse.pourcentage : 0}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8 text-sm">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Top fidèles récents */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Derniers fidèles enregistrés</h3>
            <Link 
              href="/admin/fideles"
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Fidèle</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Sexe</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Paroisse</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">District</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden lg:table-cell">Conférence</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {topFideles.map((fidele) => (
                  <tr key={fidele.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {fidele.profile_img ? (
                            <img src={fidele.profile_img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {fidele.prenom[0]}{fidele.nom[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">
                            {fidele.prenom} {fidele.nom}
                          </p>
                          {fidele.post_nom && (
                            <p className="text-xs text-gray-400">{fidele.post_nom}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 border ${
                        fidele.sexe === 'M' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-pink-50 text-pink-700 border-pink-200'
                      }`}>
                        {fidele.sexe === 'M' ? '♂ H' : '♀ F'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-300" />
                        {fidele.paroisse}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{fidele.district}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell">{fidele.conference}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-sm text-gray-400">
                        <Clock size={12} className="text-gray-300" />
                        {fidele.dateAjout}
                      </div>
                    </td>
                  </tr>
                ))}
                {topFideles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                      Aucun fidèle enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Accès rapides</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Link
              href="/admin/fideles/nouveau"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 border border-blue-100">
                  <UserPlus size={14} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Ajouter un fidèle</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
            <Link
              href="/admin/fideles"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-50 border border-emerald-100">
                  <Users size={14} className="text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">Liste des fidèles</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
            <Link
              href="/admin/structures"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-purple-50 border border-purple-100">
                  <Building2 size={14} className="text-purple-600" />
                </div>
                <span className="text-sm text-gray-700">Structures</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}