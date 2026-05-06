

// import Link from 'next/link'
// import Image from 'next/image'
// import { getUser, getCurrentFidele, logout } from '@/actions/auth'
// import { getCurrentAnneeConference } from '@/actions/annee-conference'
// import { supabase } from '@/lib/supabase'
// import { Church, Shield, Users2, UserCog2, CogIcon, ChartPie, RefreshCcw, MapIcon, RefreshCcwDot, User, Building2, MoreHorizontal, ChevronDown, Menu, X, LogOut, Settings, ChevronRight, Calendar, CalendarClock, Badge, BadgeCheck, Blocks } from 'lucide-react'
// import { Suspense } from 'react'
// import LanguageSelector from './LanguageSelector'
// import MobileMenuClient from './MobileMenuClient'
// import { PiChurch } from 'react-icons/pi'

// // Skeleton pour UserDirectUnite
// function UserDirectUniteSkeleton() {
//   return (
//     <div className="flex items-center gap-1.5">
//       <div className="w-px h-6 bg-gray-200"></div>
//       <div className="flex items-center gap-1.5">
//         <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
//         <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </div>
//   )
// }

// // Skeleton pour les informations de la paroisse
// function ParoisseInfoSkeleton() {
//   return (
//     <>
//       <div className="w-px h-6 bg-gray-200"></div>
//       <div className="flex items-center gap-1.5">
//         <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </>
//   )
// }

// // Skeleton pour l'année de conférence
// function AnneeConferenceSkeleton() {
//   return (
//     <>
//       <div className="w-px h-6 bg-gray-200"></div>
//       <div className="flex items-center gap-1.5">
//         <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </>
//   )
// }

// // Skeleton pour le sélecteur de langue
// function LanguageSelectorSkeleton() {
//   return (
//     <div className="w-[70px] h-8 bg-gray-200 rounded-md animate-pulse"></div>
//   )
// }

// // Composant pour afficher les infos utilisateur (paroisse et rôle) - Server Component
// async function UserInfo() {
//   try {
//     const currentFidele = await getCurrentFidele()
//     const user = await getUser()
    
//     if (!user) return null

//     // Récupérer le nom de la paroisse si le fidèle existe et a une paroisse
//     let paroisseNom = null
//     if (currentFidele?.paroisse_id) {
//       const { data: paroisse } = await supabase
//         .from('paroisse')
//         .select('nom')
//         .eq('id', currentFidele.paroisse_id)
//         .single()
      
//       paroisseNom = paroisse?.nom
//     }

//     return (
//       <>
//         <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
//         <div className="hidden sm:flex items-center gap-3">
//           {/* Rôle - Toujours affiché si l'utilisateur existe */}
//           {user.role && (
//             <div 
//               className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md"
//               title={`Rôle : ${user.role.nom}${user.role.niveau ? ` (Niveau ${user.role.niveau})` : ''}`}
//             >
//               <User className="w-3.5 sm:block hidden h-3.5 text-gray-500" />
//               <span className="text-xs font-medium text-gray-600 capitalize">
//                 {user.role.nom}
//               </span>
//             </div>
//           )}
          
//           {/* Paroisse - Affichée uniquement si disponible */}
//           {paroisseNom && (
//             <div 
//               className="flex items-center gap-1.5"
//               title={`Paroisse : ${paroisseNom}`}
//             >
//               <PiChurch className="w-3.5 h-3.5 text-gray-400" />
//               <span className="text-sm font-medium text-gray-700">
//                 {paroisseNom}
//               </span>
//             </div>
//           )}
//         </div>
//       </>
//     )
//   } catch (error) {
//     console.error('Erreur dans UserInfo:', error)
//     return null
//   }
// }

// // Composant pour wrapper les liens dans le dropdown
// function DropdownLinkWrapper({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="block w-full">
//       {children}
//     </div>
//   )
// }

// // Composant qui organise les liens de navigation avec dropdown automatique - Server Component
// function NavigationLinks({ links }: { links: React.ReactNode[] }) {
//   const MAX_VISIBLE_ITEMS = 3
  
//   if (links.length <= MAX_VISIBLE_ITEMS) {
//     return <>{links}</>
//   }

//   const visibleLinks = links.slice(0, MAX_VISIBLE_ITEMS)
//   const moreLinks = links.slice(MAX_VISIBLE_ITEMS)

//   const wrappedMoreLinks = moreLinks.map((link, index) => (
//     <DropdownLinkWrapper key={index}>
//       {link}
//     </DropdownLinkWrapper>
//   ))

//   return (
//     <>
//       {visibleLinks}
//       <div className="relative group hidden sm:block">
//         <button 
//           className="flex items-center gap-1 px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
//           title="Plus d'options de navigation"
//         >
//           <MoreHorizontal className="size-4" />
//           <span>Plus</span>
//           <ChevronDown className="size-3" />
//         </button>
        
//         <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
//           <div className="py-1">
//             {wrappedMoreLinks}
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }

// // Composant qui contient les données asynchrones - Server Component
// async function NavbarContent() {
//   const user = await getUser()
//   const currentFidele = await getCurrentFidele()
  
//   // Récupérer la conférence via la paroisse du fidèle
//   let currentConferenceYear = null
//   let paroisseNom = null
  
//   if (currentFidele?.paroisse_id) {
//     const { data: paroisse } = await supabase
//       .from('paroisse')
//       .select('nom')
//       .eq('id', currentFidele.paroisse_id)
//       .single()
    
//     paroisseNom = paroisse?.nom
    
//     const conference = await getConferenceFromParoisse(currentFidele.paroisse_id)
//     if (conference?.id) {
//       currentConferenceYear = await getCurrentAnneeConference(conference.id)
//     }
//   }

//   // Préparer les liens de navigation selon le rôle
//   const getNavLinks = () => {
//     if (!user) return []

//     const links: React.ReactNode[] = []

//     // Liens communs à tous les utilisateurs connectés
//     links.push(
//       <Link 
//         key="departement"
//         href="/departement" 
//         className="text-white decoration-transparent px-3 py-1 bg-red-600 text-sm hover:text-white hover:bg-red-700 transition-colors whitespace-nowrap"
//         title="Voir tous les départements"
//       >
//         Departements
//       </Link>
//     )

//     // Liens spécifiques selon le rôle
//     switch (user.role?.nom) {
//       case 'admin':
//         links.push(
//           <Link key="map" href="/map" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir la carte des paroisses">
//             <span className="flex items-center gap-2"><MapIcon className='size-4'/> Carte</span>
//           </Link>,
//           <Link key="transferts" href="/admin/transferts" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les transferts">
//             <span className="flex items-center gap-2"><RefreshCcw className='size-4'/> Transferts</span>
//           </Link>,
//           <Link key="conference" href="/admin/conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les conférences">
//             Conference
//           </Link>,
//           <Link key="chefDepartements" href="/admin/chefs" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les chefs de départements">
//             Chef departements
//           </Link>,
//           <Link key="management" href="/admin/management" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion administrative">
//             <span className="flex items-center gap-2"><Shield className='size-4'/> Gestion</span>
//           </Link>,
//           <Link key="users" href="/admin/users" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les utilisateurs">
//             <span className="flex items-center gap-2"><Users2 className='size-4'/> Utilisateurs</span>
//           </Link>,
//           <Link key="fideles" href="/admin/fideles" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les fidèles">
//             <span className="flex items-center gap-2"><UserCog2 className='size-4'/> Fidèles</span>
//           </Link>,
//           <Link key="admin-dep" href="/admin/departements" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Administration des départements">
//             Départements
//           </Link>,
//           <Link key="managemwent" href="/admin/management" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Management du système">
//             Management 
//           </Link>,
//           <Link key="pasteurs" href="/admin/pasteurs" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les pasteurs">
//             <span className="flex items-center gap-2"><Church className='size-4'/> Pasteurs</span>
//           </Link>,
//           <Link key="roles" href="/admin/role" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les rôles et permissions">
//             <span className="flex items-center gap-2"><CogIcon className='size-4'/> Rôles</span>
//           </Link>,
//           <Link key="annee" href="/admin/annees" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les années de conférence">
//             <span className="flex items-center gap-2"><CalendarClock className='size-4'/> Année</span>
//           </Link>,
//           <Link key="chef" href="/admin/chef" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les chefs">
//             <span className="flex items-center gap-2"><BadgeCheck className='size-4'/>Chefs</span>
//           </Link>,
//           <Link key="cabinet" href="/admin/cabinet" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les cabinets">
//             <span className="flex items-center gap-2"><Blocks className='size-4'/>Cabinets</span>
//           </Link>,
//         )
//         break

//       case 'cabinet_pastoral':
//         links.push(
//           <Link key="paroisse-fideles" href="/paroisse/fideles" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les fidèles de la paroisse">
//             Fideles
//           </Link>,
//           <Link key="cabinet" href="/cabinet" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion du cabinet pastoral">
//             Gestion Cabinet
//           </Link>,
//           <Link key="paroisse-activites" href="/paroisse/activites" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les activités de la paroisse">
//             Activités
//           </Link>,
//           <Link key="paroisse-transferts" href="/paroisse/transferts" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les transferts paroissiaux">
//             <span className="flex items-center gap-2"><RefreshCcwDot className='size-4'/> Transferts</span>
//           </Link>,
//           <Link key="paroisse-departements" href="/paroisse/admin/departements" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Administration des départements">
//             Admin Departements
//           </Link>,
//           <Link key="admin-cabinet" href="/cabinet/admin" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Administration du cabinet">
//             Admin Cabinet
//           </Link>,
//           <Link key="hebdo" href="/hebdo" className="px-2 flex items-center gap-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap w-full" title="Programme hebdomadaire">
//             <CalendarClock className='size-4 inline'/>
//             <span>Hebdo</span>
//           </Link>,
//         )
//         break
        
//       case 'conductance':
//         links.push(
//           <Link key="paroisse-fideles" href="/paroisse/fideles" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les fidèles">
//             Fideles
//           </Link>,
//           <Link key="paroisse-departements" href="/paroisse/departements" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les départements">
//             Departements
//           </Link>,
//           <Link key="paroisse-activites" href="/paroisse/activites" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les activités">
//             Activités
//           </Link>,
//           <Link key="paroisse-transferts" href="/paroisse/transferts" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les transferts">
//             <span className="flex items-center gap-2"><RefreshCcwDot className='size-4'/> Transferts</span>
//           </Link>,
//           <Link key="paroisse-dep" href="/departement" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion générale">
//             Gestion
//           </Link>
//         )
//         break

//       case 'chef_departement_district':
//         links.push(
//           <Link key="district-departements" href="/chef/departement/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Départements du district">
//             Departements district
//           </Link>,
//           <Link key="district-annee" href="/district/annee-departement" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Année de département">
//             Annee
//           </Link>,
//           <Link key="district-gestion" href="/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion du district">
//             Gestion
//           </Link>
//         )
//         break
        
//       case 'surintendant':
//         links.push(
//           <Link key="district-departements" href="/chef/departement/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Départements du district">
//             Departements district
//           </Link>,
//           <Link key="district-annee" href="/district/annee-departement" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Année de département">
//             Annee
//           </Link>,
//           <Link key="district-gestion" href="/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion du district">
//             Gestion
//           </Link>
//         )
//         break

//       case 'admin_conference':
//         links.push(
//           <Link key="conference-pasteurs" href="/conference/pasteurs" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les pasteurs de la conférence">
//             Pasteurs
//           </Link>,
//           <Link key="conference-gestion" href="/conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion de la conférence (activités, plan, budget)">
//             Gestion (activites-plan-budget)
//           </Link>,
//           <Link key="conference-departements" href="/chef/departement/conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Départements de tous les districts">
//             Departements (Tous district)
//           </Link>,
//           <Link key="conference-districts" href="/chef-conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion des districts">
//             Gestion Districts 
//           </Link>,
//           <Link key="conference-annee" href="/chef-conference/annees" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion des années">
//             Gestion Annee
//           </Link>
//         )
//         break
//     }

//     return links
//   }

//   const navLinks = getNavLinks()
  
//   // Préparer les liens pour le menu mobile
//   const getMobileNavLinks = () => {
//     if (!user) return []

//     const links: React.ReactNode[] = []

//     links.push(
//       <Link 
//         key="departement-mobile"
//         href="/departement" 
//         className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors w-full"
//         title="Voir tous les départements"
//       >
//         <ChevronRight className="size-5" />
//         <span>Départements</span>
//       </Link>
//     )

//     switch (user.role?.nom) {
//       case 'admin':
//         links.push(
//           <Link key="map-mobile" href="/map" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir la carte des paroisses">
//             <MapIcon className='size-5'/><span>Carte</span>
//           </Link>,
//           <Link key="transferts-mobile" href="/admin/transferts" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les transferts">
//             <RefreshCcw className='size-5'/><span>Transferts</span>
//           </Link>,
//           <Link key="conference-mobile" href="/admin/conference" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les conférences">
//             <ChevronRight className='size-5'/><span>Conference</span>
//           </Link>,
//           <Link key="chef-dist-mobile" href="/admin/districts/chefs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les chefs de district">
//             <ChevronRight className='size-5'/><span>Chef-district</span>
//           </Link>,
//           <Link key="chef-conf-mobile" href="/admin/conferences/chefs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les chefs de conférence">
//             <ChevronRight className='size-5'/><span>Chef-conférence</span>
//           </Link>,
//           <Link key="annees-mobile" href="/admin/annees" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les années">
//             <ChevronRight className='size-5'/><span>Années</span>
//           </Link>,
//           <Link key="management-mobile" href="/admin/management" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion administrative">
//             <Shield className='size-5'/><span>Gestion</span>
//           </Link>,
//           <Link key="users-mobile" href="/admin/users" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les utilisateurs">
//             <Users2 className='size-5'/><span>Utilisateurs</span>
//           </Link>,
//           <Link key="fideles-mobile" href="/admin/fideles" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les fidèles">
//             <UserCog2 className='size-5'/><span>Fidèles</span>
//           </Link>,
//           <Link key="admin-dep-mobile" href="/admin/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Administration des départements">
//             <ChevronRight className='size-5'/><span>Départements</span>
//           </Link>,
//           <Link key="pasteurs-mobile" href="/admin/pasteurs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les pasteurs">
//             <Church className='size-5'/><span>Pasteurs</span>
//           </Link>,
//           <Link key="roles-mobile" href="/admin/role" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les rôles">
//             <CogIcon className='size-5'/><span>Rôles</span>
//           </Link>,
//           <Link key="stats-mobile" href="/admin/stats" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les statistiques">
//             <ChartPie className='size-5'/><span>Statistiques</span>
//           </Link>
//         )
//         break

//       case 'admin_gestion_paroisse':
//         links.push(
//           <Link key="paroisse-fideles-mobile" href="/paroisse/fideles" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer la paroisse">
//             <ChevronRight className='size-5'/><span>Paroisse</span>
//           </Link>,
//           <Link key="paroisse-departements-mobile" href="/paroisse/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les départements">
//             <ChevronRight className='size-5'/><span>Départements</span>
//           </Link>,
//           <Link key="paroisse-activites-mobile" href="/paroisse/activites" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les activités">
//             <ChevronRight className='size-5'/><span>Activités</span>
//           </Link>,
//           <Link key="paroisse-transferts-mobile" href="/paroisse/transferts" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les transferts">
//             <RefreshCcwDot className='size-5'/><span>Transferts</span>
//           </Link>,
//           <Link key="paroisse-dep-mobile" href="/paroisse/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les départements">
//             <ChevronRight className='size-5'/><span>Dep</span>
//           </Link>
//         )
//         break

//       case 'chef_departement_district':
//         links.push(
//           <Link key="district-departements-mobile" href="/district/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Départements du district">
//             <ChevronRight className='size-5'/><span>Département-district</span>
//           </Link>,
//           <Link key="district-annee-mobile" href="/district/annee-departement" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Année de département">
//             <ChevronRight className='size-5'/><span>Année</span>
//           </Link>,
//           <Link key="district-gestion-mobile" href="/district" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion du district">
//             <ChevronRight className='size-5'/><span>Gestion</span>
//           </Link>
//         )
//         break

//       case 'admin_conference':
//         links.push(
//           <Link key="conference-pasteurs-mobile" href="/conference/pasteurs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les pasteurs">
//             <Church className='size-5'/><span>Pasteurs</span>
//           </Link>,
//           <Link key="conference-gestion-mobile" href="/conference" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion de la conférence">
//             <ChevronRight className='size-5'/><span>Gestion</span>
//           </Link>,
//           <Link key="conference-departements-mobile" href="/conference/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Départements de la conférence">
//             <ChevronRight className='size-5'/><span>Départements (ok-district)</span>
//           </Link>,
//           <Link key="conference-districts-mobile" href="/conference/districts" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les districts">
//             <ChevronRight className='size-5'/><span>Districts</span>
//           </Link>
//         )
//         break
//     }

//     return links
//   }

//   const mobileNavLinks = getMobileNavLinks()

//   return (
//     <>
//       <div className="flex justify-between items-center h-16">
//         {/* Logo / Marque avec Paroisse et Année de Conférence */}
//         <div className="flex items-center">
//           <Link 
//             href="/gestion" 
//             className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity"
//             title="Retour à l'accueil"
//           >
//             <img src='/logoup.png' className='w-8 h-8' alt="Logo" />
//           </Link>
        
//           {/* Informations utilisateur (paroisse et rôle) */}
//           <Suspense fallback={<UserDirectUniteSkeleton />}>
//             <UserInfo />
//           </Suspense>
          
//           {/* Année de conférence en cours */}
//           {currentConferenceYear && (
//             <>
//               <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
//               <div 
//                 className="hidden sm:flex items-center gap-1.5"
//                 title={`Année de conférence en cours : ${currentConferenceYear.annee?.label}`}
//               >
//                 <span className="text-sm sm:block hidden font-medium text-gray-700">
//                   {currentConferenceYear.annee?.label}
//                 </span>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Navigation Desktop */}
//         <div className="hidden sm:flex items-center gap-1 sm:gap-2">
//           {/* Sélecteur de langue - Composant client */}
//           <Suspense fallback={<LanguageSelectorSkeleton />}>
//             <LanguageSelector />
//           </Suspense>

//           {user ? (
//             <>
//               {/* Lien Profil avec avatar */}
//               <Link 
//                 href="/profile" 
//                 className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
//                 title={`Profil de ${user.nom_complet}`}
//               >
//                 {user.profile_img ? (
//                   <div className="relative w-6 h-6 rounded-full overflow-hidden">
//                     <Image
//                       src={user.profile_img}
//                       alt={user.nom_complet}
//                       fill
//                       className="object-cover"
//                     />
//                   </div>
//                 ) : (
//                   <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
//                     <span className="text-xs font-medium text-gray-500">
//                       {user.nom_complet?.charAt(0).toUpperCase()}
//                     </span>
//                   </div>
//                 )}
//               </Link>
            
//               {/* Navigation links avec dropdown automatique */}
//               <NavigationLinks links={navLinks} />
              
//               {/* Déconnexion */}
//               <form action={logout}>
//                 <button 
//                   type="submit" 
//                   className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
//                   title="Se déconnecter"
//                 >
//                   Déconnexion
//                 </button>
//               </form>
//             </>
//           ) : (
//             <>
//               <Link 
//                 href="/login" 
//                 className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
//                 title="Se connecter à son compte"
//               >
//                 Connexion
//               </Link>
//               <Link 
//                 href="/register" 
//                 className="px-2 py-2 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
//                 title="Créer un nouveau compte"
//               >
//                 Inscription
//               </Link>
//             </>
//           )}
//         </div>

//         {/* Menu Mobile - Composant Client */}
//         <MobileMenuClient 
//           user={user}
//           mobileNavLinks={mobileNavLinks}
//           currentConferenceYear={currentConferenceYear}
//           paroisseNom={paroisseNom}
//         />
//       </div>
//     </>
//   )
// }

// // Fonction helper pour récupérer la conférence
// async function getConferenceFromParoisse(paroisseId: number) {
//   try {
//     const { data: paroisse } = await supabase
//       .from('paroisse')
//       .select(`
//         district:district_id (
//           conference:conference_id (
//             id,
//             nom
//           )
//         )
//       `)
//       .eq('id', paroisseId)
//       .single()

//     if (paroisse?.district) {
//       const district = Array.isArray(paroisse.district) 
//         ? paroisse.district[0] 
//         : paroisse.district
      
//       if (district?.conference) {
//         const conference = Array.isArray(district.conference) 
//           ? district.conference[0] 
//           : district.conference
//         return conference
//       }
//     }
    
//     return null
//   } catch (error) {
//     console.error('Erreur getConferenceFromParoisse:', error)
//     return null
//   }
// }

// // Skeleton principal de la navbar
// function NavbarSkeleton() {
//   return (
//     <div className="flex justify-between items-center h-16">
//       <div className="flex items-center gap-3">
//         <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
//         <ParoisseInfoSkeleton />
//         <UserDirectUniteSkeleton />
//         <AnneeConferenceSkeleton />
//       </div>
//       <div className="flex items-center gap-2">
//         <LanguageSelectorSkeleton />
//         <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
//         <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
//         <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
//       </div>
//     </div>
//   )
// }

// // Composant principal - Server Component
// export default async function Navbar() {
//   return (
//     <nav className="bg-white border-b sticky top-0 border-gray-100 z-30">
//       <div className="max-w-8xl mx-auto px-4">
//         <Suspense fallback={<NavbarSkeleton />}>
//           <NavbarContent />
//         </Suspense>
//       </div>
//     </nav>
//   )
// }

import Link from 'next/link'
import Image from 'next/image'
import { getUser, getCurrentFidele, logout } from '@/actions/auth'
import { getCurrentAnneeConference } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'
import { Church, Shield, Users2, UserCog2, CogIcon, ChartPie, RefreshCcw, MapIcon, RefreshCcwDot, User, Building2, MoreHorizontal, ChevronDown, Menu, X, LogOut, Settings, ChevronRight, Calendar, CalendarClock, Badge, BadgeCheck, Blocks } from 'lucide-react'
import { Suspense } from 'react'
import LanguageSelector from './LanguageSelector'
import MobileMenuClient from './MobileMenuClient'
import { PiChurch } from 'react-icons/pi'

// Skeleton pour UserDirectUnite
function UserDirectUniteSkeleton() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-px h-6 bg-gray-200"></div>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

// Skeleton pour les informations de la paroisse
function ParoisseInfoSkeleton() {
  return (
    <>
      <div className="w-px h-6 bg-gray-200"></div>
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </>
  )
}

// Skeleton pour l'année de conférence
function AnneeConferenceSkeleton() {
  return (
    <>
      <div className="w-px h-6 bg-gray-200"></div>
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </>
  )
}

// Skeleton pour le sélecteur de langue
function LanguageSelectorSkeleton() {
  return (
    <div className="w-[70px] h-8 bg-gray-200 rounded-md animate-pulse"></div>
  )
}

// Composant pour afficher les infos utilisateur (paroisse et rôle) - Server Component
async function UserInfo() {
  try {
    const currentFidele = await getCurrentFidele()
    const user = await getUser()
    
    if (!user) return null

    // Récupérer le nom de la paroisse si le fidèle existe et a une paroisse
    let paroisseNom = null
    if (currentFidele?.paroisse_id) {
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('nom')
        .eq('id', currentFidele.paroisse_id)
        .single()
      
      paroisseNom = paroisse?.nom
    }

    return (
      <>
        <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
        <div className="hidden sm:flex items-center gap-3">
          {/* Rôle - Toujours affiché si l'utilisateur existe */}
          {user.role && (
            <div 
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md"
              title={`Rôle : ${user.role.nom}${user.role.niveau ? ` (Niveau ${user.role.niveau})` : ''}`}
            >
              <User className="w-3.5 sm:block hidden h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-600 capitalize">
                {user.role.nom}
              </span>
            </div>
          )}
          
          {/* Paroisse - Affichée uniquement si disponible */}
          {paroisseNom && (
            <div 
              className="flex items-center gap-1.5"
              title={`Paroisse : ${paroisseNom}`}
            >
              <PiChurch className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {paroisseNom}
              </span>
            </div>
          )}
        </div>
      </>
    )
  } catch (error) {
    console.error('Erreur dans UserInfo:', error)
    return null
  }
}

// Composant pour wrapper les liens dans le dropdown
function DropdownLinkWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="block w-full">
      {children}
    </div>
  )
}

// Composant qui organise les liens de navigation avec dropdown automatique - Server Component
function NavigationLinks({ links }: { links: React.ReactNode[] }) {
  const MAX_VISIBLE_ITEMS = 3
  
  if (links.length <= MAX_VISIBLE_ITEMS) {
    return <>{links}</>
  }

  const visibleLinks = links.slice(0, MAX_VISIBLE_ITEMS)
  const moreLinks = links.slice(MAX_VISIBLE_ITEMS)

  const wrappedMoreLinks = moreLinks.map((link, index) => (
    <DropdownLinkWrapper key={index}>
      {link}
    </DropdownLinkWrapper>
  ))

  return (
    <>
      {visibleLinks}
      <div className="relative group hidden sm:block">
        <button 
          className="flex items-center gap-1 px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title="Plus d'options de navigation"
        >
          <MoreHorizontal className="size-4" />
          <span>Plus</span>
          <ChevronDown className="size-3" />
        </button>
        
        <div className="absolute right-0 top-full mt-1 min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="py-1">
            {wrappedMoreLinks}
          </div>
        </div>
      </div>
    </>
  )
}

// Composant qui contient les données asynchrones - Server Component
async function NavbarContent() {
  const user = await getUser()
  const currentFidele = await getCurrentFidele()
  
  // Récupérer la conférence via la paroisse du fidèle
  let currentConferenceYear = null
  let paroisseNom = null
  
  if (currentFidele?.paroisse_id) {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select('nom')
      .eq('id', currentFidele.paroisse_id)
      .single()
    
    paroisseNom = paroisse?.nom
    
    const conference = await getConferenceFromParoisse(currentFidele.paroisse_id)
    if (conference?.id) {
      currentConferenceYear = await getCurrentAnneeConference(conference.id)
    }
  }

  // Préparer les liens de navigation selon le rôle
  const getNavLinks = () => {
    if (!user) return { desktop: [], mobile: [] }

    const desktopLinks: React.ReactNode[] = []
    const mobileLinks: React.ReactNode[] = []

    // Liens communs à tous les utilisateurs connectés
    desktopLinks.push(
      <Link 
        key="departement"
        href="/departement" 
        className="text-white decoration-transparent px-3 py-1 bg-red-600 text-sm hover:text-white hover:bg-red-700 transition-colors whitespace-nowrap"
        title="Voir tous les départements"
      >
        Departements
      </Link>
    )

    mobileLinks.push(
      <Link 
        key="departement-mobile"
        href="/departement" 
        className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full"
        title="Voir tous les départements"
      >
        <ChevronRight className="size-5" />
        <span>Départements</span>
      </Link>
    )

    // Liens spécifiques selon le rôle
    switch (user.role?.nom) {
      case 'admin':
        // Desktop
        desktopLinks.push(
          <Link key="map" href="/map" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir la carte des paroisses">
            <span className="flex items-center gap-2"><MapIcon className='size-4'/> Carte</span>
          </Link>,
        
        
          <Link key="chefDepartements" href="/admin/chefs" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les chefs de départements">
            Chef departements
          </Link>,
          <Link key="management" href="/admin/management" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion administrative">
            <span className="flex items-center gap-2"><Shield className='size-4'/> Gestion</span>
          </Link>,
          <Link key="users" href="/admin/users" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les utilisateurs">
            <span className="flex items-center gap-2"><Users2 className='size-4'/> Utilisateurs</span>
          </Link>,
          <Link key="fideles" href="/admin/fideles" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les fidèles">
            <span className="flex items-center gap-2"><UserCog2 className='size-4'/> Fidèles</span>
          </Link>,
          <Link key="admin-dep" href="/admin/departements" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Administration des départements">
            Départements
          </Link>,
        
      
        
          <Link key="annee" href="/admin/annees" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les années de conférence">
            <span className="flex items-center gap-2"><CalendarClock className='size-4'/> Année</span>
          </Link>,
          <Link key="chef" href="/admin/chefs" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les chefs">
            <span className="flex items-center gap-2"><BadgeCheck className='size-4'/>Chefs</span>
          </Link>,
          <Link key="cabinet" href="/admin/cabinet" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les cabinets">
            <span className="flex items-center gap-2"><Blocks className='size-4'/>Cabinets</span>
          </Link>,
        
        )
        
        // Mobile - Admin
        mobileLinks.push(
          <Link key="map-mobile" href="/map" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir la carte des paroisses">
            <MapIcon className='size-5'/><span>Carte</span>
          </Link>,
         
         
          <Link key="chefDepartements-mobile" href="/admin/chefs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les chefs de départements">
            <ChevronRight className='size-5'/><span>Chef departements</span>
          </Link>,
          <Link key="management-mobile" href="/admin/management" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion administrative">
            <Shield className='size-5'/><span>Gestion</span>
          </Link>,
          <Link key="users-mobile" href="/admin/users" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les utilisateurs">
            <Users2 className='size-5'/><span>Utilisateurs</span>
          </Link>,
          <Link key="fideles-mobile" href="/admin/fideles" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les fidèles">
            <UserCog2 className='size-5'/><span>Fidèles</span>
          </Link>,
          <Link key="admin-dep-mobile" href="/admin/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Administration des départements">
            <ChevronRight className='size-5'/><span>Départements</span>
          </Link>,
         
       
          
          <Link key="annee-mobile" href="/admin/annees" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les années">
            <CalendarClock className='size-5'/><span>Année</span>
          </Link>,
          <Link key="chef-mobile" href="/admin/chefs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les chefs">
            <BadgeCheck className='size-5'/><span>Chefs</span>
          </Link>,
          <Link key="cabinet-mobile" href="/admin/cabinet" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les cabinets">
            <Blocks className='size-5'/><span>Cabinets</span>
          </Link>,
         
        )
        break

      case 'cabinet_pastoral':
        // Desktop
        desktopLinks.push(
          <Link key="paroisse-fideles" href="/paroisse/fideles" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les fidèles de la paroisse">
            Fideles
          </Link>,
          <Link key="cabinet" href="/cabinet" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion du cabinet pastoral">
            Gestion Cabinet
          </Link>,
          <Link key="paroisse-activites" href="/paroisse/activites" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les activités de la paroisse">
            Activités
          </Link>,
          <Link key="paroisse-transferts" href="/paroisse/transferts" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les transferts paroissiaux">
            <span className="flex items-center gap-2"><RefreshCcwDot className='size-4'/> Transferts</span>
          </Link>,
          <Link key="paroisse-departements" href="/paroisse/admin/departements" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Administration des départements">
            Admin Departements
          </Link>,
          <Link key="admin-cabinet" href="/cabinet/admin" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Administration du cabinet">
            Admin Cabinet
          </Link>,
          <Link key="sous-commission" href="/paroisse/commission" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion des sous-commission">
            Sous-commission
          </Link>,
          <Link key="hebdo" href="/cabinet/hebdo" className="px-2 flex items-center gap-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap w-full" title="Programme hebdomadaire">
            <CalendarClock className='size-4 inline'/>
            <span>Hebdo</span>
          </Link>
        )
        
        // Mobile - Cabinet Pastoral
        mobileLinks.push(
          <Link key="paroisse-fideles-mobile" href="/paroisse/fideles" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les fidèles de la paroisse">
            <ChevronRight className='size-5'/><span>Fideles</span>
          </Link>,
          <Link key="cabinet-mobile" href="/cabinet" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion du cabinet pastoral">
            <ChevronRight className='size-5'/><span>Gestion Cabinet</span>
          </Link>,
          <Link key="paroisse-activites-mobile" href="/paroisse/activites" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les activités de la paroisse">
            <ChevronRight className='size-5'/><span>Activités</span>
          </Link>,
          <Link key="paroisse-transferts-mobile" href="/paroisse/transferts" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les transferts paroissiaux">
            <RefreshCcwDot className='size-5'/><span>Transferts</span>
          </Link>,
          <Link key="paroisse-departements-mobile" href="/paroisse/admin/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Administration des départements">
            <ChevronRight className='size-5'/><span>Admin Departements</span>
          </Link>,
          <Link key="admin-cabinet-mobile" href="/cabinet/admin" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Administration du cabinet">
            <ChevronRight className='size-5'/><span>Admin Cabinet</span>
          </Link>,
          <Link key="hebdo-mobile" href="/cabinet/hebdo" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Programme hebdomadaire">
            <CalendarClock className='size-5'/><span>Hebdo</span>
          </Link>
        )
        break
        
      case 'conductance':
        // Desktop
        desktopLinks.push(
          <Link key="paroisse-fideles" href="/paroisse/fideles" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les fidèles">
            Fideles
          </Link>,
          <Link key="paroisse-departements" href="/paroisse/departements" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les départements">
            Departements
          </Link>,
          <Link key="paroisse-activites" href="/paroisse/activites" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Voir les activités">
            Activités
          </Link>,
          <Link key="paroisse-transferts" href="/paroisse/transferts" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les transferts">
            <span className="flex items-center gap-2"><RefreshCcwDot className='size-4'/> Transferts</span>
          </Link>,
          <Link key="paroisse-dep" href="/departement" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion générale">
            Gestion
          </Link>
        )
        
        // Mobile - Conductance
        mobileLinks.push(
          <Link key="paroisse-fideles-mobile" href="/paroisse/fideles" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les fidèles">
            <ChevronRight className='size-5'/><span>Fideles</span>
          </Link>,
          <Link key="paroisse-departements-mobile" href="/paroisse/departements" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les départements">
            <ChevronRight className='size-5'/><span>Departements</span>
          </Link>,
          <Link key="paroisse-activites-mobile" href="/paroisse/activites" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Voir les activités">
            <ChevronRight className='size-5'/><span>Activités</span>
          </Link>,
          <Link key="paroisse-transferts-mobile" href="/paroisse/transferts" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les transferts">
            <RefreshCcwDot className='size-5'/><span>Transferts</span>
          </Link>,
          <Link key="paroisse-dep-mobile" href="/departement" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion générale">
            <ChevronRight className='size-5'/><span>Gestion</span>
          </Link>
        )
        break

      case 'chef_departement_district':
        // Desktop
        desktopLinks.push(
          <Link key="district-departements" href="/chef/departement/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Départements du district">
            Departements district
          </Link>,
          <Link key="district-annee" href="/district/annee-departement" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Année de département">
            Annee
          </Link>,
          <Link key="district-gestion" href="/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion du district">
            Gestion
          </Link>
        )
        
        // Mobile - Chef de département district
        mobileLinks.push(
          <Link key="district-departements-mobile" href="/chef/departement/district" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Départements du district">
            <ChevronRight className='size-5'/><span>Departements district</span>
          </Link>,
          <Link key="district-annee-mobile" href="/district/annee-departement" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Année de département">
            <ChevronRight className='size-5'/><span>Annee</span>
          </Link>,
          <Link key="district-gestion-mobile" href="/district" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion du district">
            <ChevronRight className='size-5'/><span>Gestion</span>
          </Link>
        )
        break
        
      case 'surintendant':
        // Desktop
        desktopLinks.push(
          <Link key="district-departements" href="/chef/departement/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Départements du district">
            Departements district
          </Link>,
          <Link key="district-annee" href="/district/annee-departement" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Année de département">
            Annee
          </Link>,
          <Link key="district-gestion" href="/district" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion du district">
            Gestion
          </Link>
        )
        
        // Mobile - Surintendant
        mobileLinks.push(
          <Link key="district-departements-mobile" href="/chef/departement/district" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Départements du district">
            <ChevronRight className='size-5'/><span>Departements district</span>
          </Link>,
          <Link key="district-annee-mobile" href="/district/annee-departement" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Année de département">
            <ChevronRight className='size-5'/><span>Annee</span>
          </Link>,
          <Link key="district-gestion-mobile" href="/district" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion du district">
            <ChevronRight className='size-5'/><span>Gestion</span>
          </Link>
        )
        break

      case 'admin_conference':
        // Desktop
        desktopLinks.push(
          <Link key="conference-pasteurs" href="/conference/pasteurs" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gérer les pasteurs de la conférence">
            Pasteurs
          </Link>,
          <Link key="conference-gestion" href="/conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion de la conférence (activités, plan, budget)">
            Gestion (activites-plan-budget)
          </Link>,
          <Link key="conference-departements" href="/chef/departement/conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Départements de tous les districts">
            Departements (Tous district)
          </Link>,
          <Link key="conference-districts" href="/chef-conference" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion des districts">
            Gestion Districts 
          </Link>,
          <Link key="conference-annee" href="/chef-conference/annees" className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap block w-full" title="Gestion des années">
            Gestion Annee
          </Link>
        )
        
        // Mobile - Admin Conférence
        mobileLinks.push(
          <Link key="conference-pasteurs-mobile" href="/conference/pasteurs" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gérer les pasteurs de la conférence">
            <Church className='size-5'/><span>Pasteurs</span>
          </Link>,
          <Link key="conference-gestion-mobile" href="/conference" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion de la conférence (activités, plan, budget)">
            <ChevronRight className='size-5'/><span>Gestion (activites-plan-budget)</span>
          </Link>,
          <Link key="conference-departements-mobile" href="/chef/departement/conference" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Départements de tous les districts">
            <ChevronRight className='size-5'/><span>Departements (Tous district)</span>
          </Link>,
          <Link key="conference-districts-mobile" href="/chef-conference" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion des districts">
            <ChevronRight className='size-5'/><span>Gestion Districts</span>
          </Link>,
          <Link key="conference-annee-mobile" href="/chef-conference/annees" className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full" title="Gestion des années">
            <ChevronRight className='size-5'/><span>Gestion Annee</span>
          </Link>
        )
        break
    }

    return { desktop: desktopLinks, mobile: mobileLinks }
  }

  const { desktop: navLinks, mobile: mobileNavLinks } = getNavLinks()

  return (
    <>
      <div className="flex justify-between items-center h-16">
        {/* Logo / Marque avec Paroisse et Année de Conférence */}
        <div className="flex items-center">
          <Link 
            href="/gestion" 
            className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity"
            title="Retour à l'accueil"
          >
            <img src='/logoup.png' className='w-8 h-8' alt="Logo" />
          </Link>
        
          {/* Informations utilisateur (paroisse et rôle) */}
          <Suspense fallback={<UserDirectUniteSkeleton />}>
            <UserInfo />
          </Suspense>
          
          {/* Année de conférence en cours */}
          {currentConferenceYear && (
            <>
              <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
              <div 
                className="hidden sm:flex items-center gap-1.5"
                title={`Année de conférence en cours : ${currentConferenceYear.annee?.label}`}
              >
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {currentConferenceYear.annee?.label}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Navigation Desktop */}
        <div className="hidden sm:flex items-center gap-1 sm:gap-2">
          {/* Sélecteur de langue - Composant client */}
          <Suspense fallback={<LanguageSelectorSkeleton />}>
            <LanguageSelector />
          </Suspense>

          {user ? (
            <>
              {/* Lien Profil avec avatar */}
              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                title={`Profil de ${user.nom_complet}`}
              >
                {user.profile_img ? (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden">
                    <Image
                      src={user.profile_img}
                      alt={user.nom_complet}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-500">
                      {user.nom_complet?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            
              {/* Navigation links avec dropdown automatique */}
              <NavigationLinks links={navLinks} />
              
              {/* Déconnexion */}
              <form action={logout}>
                <button 
                  type="submit" 
                  className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  title="Se déconnecter"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-2 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                title="Se connecter à son compte"
              >
                Connexion
              </Link>
              <Link 
                href="/register" 
                className="px-2 py-2 rounded-md text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                title="Créer un nouveau compte"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Menu Mobile - Composant Client */}
        <MobileMenuClient 
          user={user}
          mobileNavLinks={mobileNavLinks}
          currentConferenceYear={currentConferenceYear}
          paroisseNom={paroisseNom}
        />
      </div>
    </>
  )
}

// Fonction helper pour récupérer la conférence
async function getConferenceFromParoisse(paroisseId: number) {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (
            id,
            nom
          )
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (paroisse?.district) {
      const district = Array.isArray(paroisse.district) 
        ? paroisse.district[0] 
        : paroisse.district
      
      if (district?.conference) {
        const conference = Array.isArray(district.conference) 
          ? district.conference[0] 
          : district.conference
        return conference
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getConferenceFromParoisse:', error)
    return null
  }
}

// Skeleton principal de la navbar
function NavbarSkeleton() {
  return (
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <ParoisseInfoSkeleton />
        <UserDirectUniteSkeleton />
        <AnneeConferenceSkeleton />
      </div>
      <div className="flex items-center gap-2">
        <LanguageSelectorSkeleton />
        <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  )
}

// Composant principal - Server Component
export default async function Navbar() {
  return (
    <nav className="bg-white border-b sticky top-0 border-gray-100 z-30">
      <div className="max-w-8xl mx-auto px-4">
        <Suspense fallback={<NavbarSkeleton />}>
          <NavbarContent />
        </Suspense>
      </div>
    </nav>
  )
}