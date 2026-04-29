
// // app/paroisse/dashboard/page.tsx
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
  
//  Home,
//   TrendingUp,
//   Clock,
//   CheckCircle,
//   Mars,
//   Venus
// } from 'lucide-react'

// export default function ParoisseDashboard() {
//   const [loading, setLoading] = useState(true)
//   const [paroisse, setParoisse] = useState<any>(null)
//   const [stats, setStats] = useState({
//     totalMembres: 0,
//     membresActifs: 0,
//     hommes: 0,
//     femmes: 0,
//     totalDepartements: 0,
//     totalRoles: 0,
//     activitesPlanifiees: 0,
//     activitesTerminees: 0
//   })

//   useEffect(() => {
//     async function loadDashboard() {
//       try {
//         setLoading(true)
        
//         // Récupérer le fidèle connecté et sa paroisse
//         const fidele = await getCurrentFidele()
//         if (!fidele || !fidele.paroisse_id) {
//           setLoading(false)
//           return
//         }

//         // Récupérer les infos de la paroisse
//         const { data: paroisseData } = await supabase
//           .from('paroisse')
//           .select('id, nom')
//           .eq('id', fidele.paroisse_id)
//           .single()
        
//         setParoisse(paroisseData)

//         // Récupérer l'année en cours pour cette paroisse
//         const { data: paroisseWithDistrict } = await supabase
//           .from('paroisse')
//           .select('district:district_id(conference:conference_id(id))')
//           .eq('id', fidele.paroisse_id)
//           .single()

//         let conferenceId = null
//         if (paroisseWithDistrict?.district) {
//           const district = Array.isArray(paroisseWithDistrict.district) 
//             ? paroisseWithDistrict.district[0] 
//             : paroisseWithDistrict.district
//           if (district?.conference) {
//             const conference = Array.isArray(district.conference) 
//               ? district.conference[0] 
//               : district.conference
//             conferenceId = conference?.id
//           }
//         }

//         let anneeId = null
//         if (conferenceId) {
//           const currentAnnee = await getCurrentAnneeConference(conferenceId)
//           anneeId = currentAnnee?.annee_id
//         }

//         // 1. Récupérer les membres de la paroisse
//         const membres = await getFidelesByParoisseAndAnnee(fidele.paroisse_id, anneeId || undefined)
        
//         const totalMembres = membres.length
//         const membresActifs = membres.filter((m: any) => m.actif === true).length
//         const hommes = membres.filter((m: any) => m.sexe === 'M').length
//         const femmes = membres.filter((m: any) => m.sexe === 'F').length

//         // 2. Récupérer les départements de la paroisse
//         const { data: departements } = await supabase
//           .from('departement')
//           .select('id, nom')
//           .eq('paroisse_id', fidele.paroisse_id)

//         const totalDepartements = departements?.length || 0

//         // 3. Récupérer les rôles occupés
//         let totalRoles = 0
//         for (const dept of departements || []) {
//           const fidelesDept = await getFidelesByDepartement(dept.id, fidele.paroisse_id, anneeId || undefined)
//           totalRoles += fidelesDept.filter((f: any) => f.est_actif === true).length
//         }

//         // 4. Récupérer les activités - chercher les unités liées à la paroisse
//         const { data: unites } = await supabase
//           .from('unite_organisation')
//           .select('id')
//           .eq('id_niveau', fidele.paroisse_id)
//           .eq('niveau', 'paroisse')

//         let activitesPlanifiees = 0
//         let activitesTerminees = 0

//         for (const unite of unites || []) {
//           const activites = await getActivitesByUnite(unite.id)
//           activitesPlanifiees += activites.length
//           activitesTerminees += activites.filter((a: any) => a.statut === 'termine').length
//         }

//         setStats({
//           totalMembres,
//           membresActifs,
//           hommes,
//           femmes,
//           totalDepartements,
//           totalRoles,
//           activitesPlanifiees,
//           activitesTerminees
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
//           <p className="text-gray-500">Chargement...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!paroisse) {
//     return (
//       <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
//         <p className="text-yellow-800">Vous n'êtes pas encore rattaché à une paroisse.</p>
//       </div>
//     )
//   }

//   const tauxActivite = stats.totalMembres > 0 
//     ? Math.round((stats.membresActifs / stats.totalMembres) * 100) 
//     : 0

//   const tauxRealisation = stats.activitesPlanifiees > 0
//     ? Math.round((stats.activitesTerminees / stats.activitesPlanifiees) * 100)
//     : 0

//   return (
//     <div className="p-6 space-y-6">
//       {/* En-tête */}
//       <div className="flex items-center gap-3 border-b pb-4">
//         <div className="bg-blue-100 p-3 rounded-full">
//           <Church className="h-6 w-6 text-blue-600" />
//         </div>
//         <div>
//           <h1 className="text-2xl font-bold">Tableau de bord</h1>
//           <p className="text-gray-500">Paroisse {paroisse.nom}</p>
//         </div>
//       </div>

//       {/* Cartes stats principales */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* Carte Membres */}
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <Users className="h-5 w-5 text-blue-500" />
//             <span className="text-xs text-gray-400">Total</span>
//           </div>
//           <p className="text-2xl font-bold">{stats.totalMembres}</p>
//           <p className="text-sm text-gray-500">Membres</p>
//           <div className="mt-2 flex gap-3 text-xs">
//             <span className="flex items-center gap-1 text-green-600">
//               <UserCheck className="h-3 w-3" /> {stats.membresActifs} actifs
//             </span>
//             <span className="flex items-center gap-1 text-red-600">
//               <UserX className="h-3 w-3" /> {stats.totalMembres - stats.membresActifs} inactifs
//             </span>
//           </div>
//           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//             <div 
//               className="h-full bg-green-500 rounded-full"
//               style={{ width: `${tauxActivite}%` }}
//             />
//           </div>
//         </div>

//         {/* Carte Répartition sexe */}
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
//               <p className="text-2xl font-bold">{stats.hommes}</p>
//               <p className="text-xs text-gray-500">Hommes</p>
//             </div>
//             <div className="text-gray-300">|</div>
//             <div>
//               <p className="text-2xl font-bold">{stats.femmes}</p>
//               <p className="text-xs text-gray-500">Femmes</p>
//             </div>
//           </div>
//           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
//             <div 
//               className="h-full bg-blue-500 rounded-l-full"
//               style={{ width: `${stats.totalMembres ? (stats.hommes / stats.totalMembres) * 100 : 0}%` }}
//             />
//             <div 
//               className="h-full bg-pink-500 rounded-r-full"
//               style={{ width: `${stats.totalMembres ? (stats.femmes / stats.totalMembres) * 100 : 0}%` }}
//             />
//           </div>
//         </div>

//         {/* Carte Départements */}
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <Activity className="h-5 w-5 text-purple-500" />
//             <span className="text-xs text-gray-400">Organisation</span>
//           </div>
//           <p className="text-2xl font-bold">{stats.totalDepartements}</p>
//           <p className="text-sm text-gray-500">Départements</p>
//           <p className="text-xs text-gray-400 mt-1">{stats.totalRoles} rôles occupés</p>
//         </div>

//         {/* Carte Activités */}
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center justify-between mb-2">
//             <Calendar className="h-5 w-5 text-orange-500" />
//             <span className="text-xs text-gray-400">Activités</span>
//           </div>
//           <div className="flex justify-between items-baseline">
//             <div>
//               <p className="text-2xl font-bold">{stats.activitesPlanifiees}</p>
//               <p className="text-xs text-gray-500">Planifiées</p>
//             </div>
//             <div className="text-gray-300">|</div>
//             <div>
//               <p className="text-2xl font-bold text-green-600">{stats.activitesTerminees}</p>
//               <p className="text-xs text-gray-500">Terminées</p>
//             </div>
//           </div>
//           <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//             <div 
//               className="h-full bg-green-500 rounded-full"
//               style={{ width: `${tauxRealisation}%` }}
//             />
//           </div>
//           <p className="text-xs text-gray-400 mt-1">Taux de réalisation: {tauxRealisation}%</p>
//         </div>
//       </div>

//       {/* Indicateurs supplémentaires */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         {/* Taux d'occupation des rôles */}
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center gap-2 mb-3">
//             <TrendingUp className="h-5 w-5 text-green-500" />
//             <h3 className="font-semibold">Occupation des rôles</h3>
//           </div>
//           <div className="text-center">
//             <p className="text-3xl font-bold">
//               {stats.totalDepartements > 0 
//                 ? Math.round((stats.totalRoles / stats.totalDepartements) * 100)
//                 : 0}%
//             </p>
//             <p className="text-sm text-gray-500">
//               {stats.totalRoles} rôles pour {stats.totalDepartements} départements
//             </p>
//           </div>
//         </div>

//         {/* Ratio Hommes/Femmes */}
//         <div className="bg-white rounded-lg border p-4 shadow-sm">
//           <div className="flex items-center gap-2 mb-3">
//             <div className="flex gap-1">
//               <Mars className="h-5 w-5 text-blue-500" />
//               <Venus className="h-5 w-5 text-pink-500" />
//             </div>
//             <h3 className="font-semibold">Ratio Hommes / Femmes</h3>
//           </div>
//           <div className="text-center">
//             <p className="text-3xl font-bold">
//               {stats.totalMembres > 0 
//                 ? `${Math.round((stats.hommes / stats.totalMembres) * 100)} / ${Math.round((stats.femmes / stats.totalMembres) * 100)}`
//                 : '0 / 0'}
//             </p>
//             <p className="text-sm text-gray-500">
//               {stats.hommes} hommes · {stats.femmes} femmes
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Résumé rapide */}
//       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
//         <div className="flex items-center gap-2 mb-2">
//           <CheckCircle className="h-5 w-5 text-blue-600" />
//           <h3 className="font-semibold text-blue-800">Résumé</h3>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
//           <div>
//             <p className="text-gray-600">Membres actifs</p>
//             <p className="font-bold text-lg">{stats.membresActifs} / {stats.totalMembres}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Taux d'activité</p>
//             <p className="font-bold text-lg">{tauxActivite}%</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Activités réalisées</p>
//             <p className="font-bold text-lg">{stats.activitesTerminees} / {stats.activitesPlanifiees}</p>
//           </div>
//           <div>
//             <p className="text-gray-600">Rôles par département</p>
//             <p className="font-bold text-lg">{(stats.totalRoles / stats.totalDepartements || 0).toFixed(1)}</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// app/paroisse/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentFidele } from '@/actions/auth'
import { getCurrentAnneeConference } from '@/actions/annee-conference'
import { getFidelesByParoisseAndAnnee } from '@/actions/fidele'
import { getFidelesByDepartement } from '@/actions/fidele-departement'
import { getActivitesByUnite } from '@/actions/activite'
import {
  Users,
  Church,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  TrendingUp,
  CheckCircle,
  Mars,
  Venus,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'

export default function ParoisseDashboard() {
  const [loading, setLoading] = useState(true)
  const [paroisse, setParoisse] = useState<any>(null)
  const [stats, setStats] = useState({
    totalMembres: 0,
    membresActifs: 0,
    hommes: 0,
    femmes: 0,
    totalDepartements: 0,
    totalRoles: 0,
    activitesPlanifiees: 0,
    activitesTerminees: 0
  })

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        
        const fidele = await getCurrentFidele()
        if (!fidele || !fidele.paroisse_id) {
          setLoading(false)
          return
        }

        const { data: paroisseData } = await supabase
          .from('paroisse')
          .select('id, nom')
          .eq('id', fidele.paroisse_id)
          .single()
        
        setParoisse(paroisseData)

        const { data: paroisseWithDistrict } = await supabase
          .from('paroisse')
          .select('district:district_id(conference:conference_id(id))')
          .eq('id', fidele.paroisse_id)
          .single()

        let conferenceId = null
        if (paroisseWithDistrict?.district) {
          const district = Array.isArray(paroisseWithDistrict.district) 
            ? paroisseWithDistrict.district[0] 
            : paroisseWithDistrict.district
          if (district?.conference) {
            const conference = Array.isArray(district.conference) 
              ? district.conference[0] 
              : district.conference
            conferenceId = conference?.id
          }
        }

        let anneeId = null
        if (conferenceId) {
          const currentAnnee = await getCurrentAnneeConference(conferenceId)
          anneeId = currentAnnee?.annee_id
        }

        const membres = await getFidelesByParoisseAndAnnee(fidele.paroisse_id, anneeId || undefined)
        
        const totalMembres = membres.length
        const membresActifs = membres.filter((m: any) => m.actif === true).length
        const hommes = membres.filter((m: any) => m.sexe === 'M').length
        const femmes = membres.filter((m: any) => m.sexe === 'F').length

        const { data: departements } = await supabase
          .from('departement')
          .select('id, nom')
          .eq('paroisse_id', fidele.paroisse_id)

        const totalDepartements = departements?.length || 0

        let totalRoles = 0
        for (const dept of departements || []) {
          const fidelesDept = await getFidelesByDepartement(dept.id, fidele.paroisse_id, anneeId || undefined)
          totalRoles += fidelesDept.filter((f: any) => f.est_actif === true).length
        }

        const { data: unites } = await supabase
          .from('unite_organisation')
          .select('id')
          .eq('id_niveau', fidele.paroisse_id)
          .eq('niveau', 'paroisse')

        let activitesPlanifiees = 0
        let activitesTerminees = 0

        for (const unite of unites || []) {
          const activites = await getActivitesByUnite(unite.id)
          activitesPlanifiees += activites.length
          activitesTerminees += activites.filter((a: any) => a.statut === 'termine').length
        }

        setStats({
          totalMembres,
          membresActifs,
          hommes,
          femmes,
          totalDepartements,
          totalRoles,
          activitesPlanifiees,
          activitesTerminees
        })

      } catch (error) {
        console.error('Erreur lors du chargement:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border  rounded-full border-gray-300 border-t-black animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-light">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!paroisse) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-8 text-center">
        <p className="text-sm text-yellow-800 font-light">Vous n'êtes pas encore rattaché à une paroisse.</p>
      </div>
    )
  }

  const tauxActivite = stats.totalMembres > 0 
    ? Math.round((stats.membresActifs / stats.totalMembres) * 100) 
    : 0

  const tauxRealisation = stats.activitesPlanifiees > 0
    ? Math.round((stats.activitesTerminees / stats.activitesPlanifiees) * 100)
    : 0

  const tauxOccupation = stats.totalDepartements > 0 
    ? Math.round((stats.totalRoles / stats.totalDepartements) * 100)
    : 0

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header - Design carré minimaliste */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 border border-gray-200 flex items-center justify-center">
            <Church size={16} className="text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-0.5">{paroisse.nom}</p>
          </div>
        </div>
      </div>

      {/* Stats principales - Design carré minimaliste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Membres totaux */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Membres</span>
            <Users size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl font-light mb-2">{stats.totalMembres}</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <UserCheck size={12} className="text-green-600" />
                <span className="text-gray-600">Actifs</span>
              </span>
              <span className="font-medium">{stats.membresActifs}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1">
                <UserX size={12} className="text-red-500" />
                <span className="text-gray-600">Inactifs</span>
              </span>
              <span className="font-medium">{stats.totalMembres - stats.membresActifs}</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100">
            <div 
              className="h-full bg-black transition-all"
              style={{ width: `${tauxActivite}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Taux d'activité: {tauxActivite}%
          </div>
        </div>

        {/* Répartition par sexe */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Répartition</span>
            <div className="flex gap-1">
              <Mars size={14} className="text-blue-500" />
              <Venus size={14} className="text-pink-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-4 mb-2">
            <div>
              <div className="text-2xl font-light text-blue-600">{stats.hommes}</div>
              <div className="text-xs text-gray-500">Hommes</div>
            </div>
            <div className="text-gray-300 text-sm">/</div>
            <div>
              <div className="text-2xl font-light text-pink-600">{stats.femmes}</div>
              <div className="text-xs text-gray-500">Femmes</div>
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100 flex">
            <div 
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${stats.totalMembres ? (stats.hommes / stats.totalMembres) * 100 : 0}%` }}
            />
            <div 
              className="h-full bg-pink-500 transition-all"
              style={{ width: `${stats.totalMembres ? (stats.femmes / stats.totalMembres) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Départements */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Départements</span>
            <Activity size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl font-light mb-2">{stats.totalDepartements}</div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Rôles occupés</span>
              <span className="font-medium">{stats.totalRoles}</span>
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100">
            <div 
              className="h-full bg-black transition-all"
              style={{ width: `${tauxOccupation}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Occupation: {tauxOccupation}%
          </div>
        </div>

        {/* Activités */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-wider">Activités</span>
            <Calendar size={16} className="text-gray-400" />
          </div>
          <div className="flex items-baseline gap-4 mb-2">
            <div>
              <div className="text-2xl font-light">{stats.activitesPlanifiees}</div>
              <div className="text-xs text-gray-500">Planifiées</div>
            </div>
            <div className="text-gray-300 text-sm">/</div>
            <div>
              <div className="text-2xl font-light text-green-600">{stats.activitesTerminees}</div>
              <div className="text-xs text-gray-500">Terminées</div>
            </div>
          </div>
          <div className="mt-3 h-1 bg-gray-100">
            <div 
              className="h-full bg-green-600 transition-all"
              style={{ width: `${tauxRealisation}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Réalisation: {tauxRealisation}%
          </div>
        </div>
      </div>

      {/* Indicateurs secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        <div className="bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Ratio H/F</span>
          </div>
          <div className="text-xl font-light">
            {stats.totalMembres > 0 
              ? `${Math.round((stats.hommes / stats.totalMembres) * 100)} / ${Math.round((stats.femmes / stats.totalMembres) * 100)}`
              : '0 / 0'}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {stats.hommes} hommes · {stats.femmes} femmes
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Rôles/Département</span>
          </div>
          <div className="text-xl font-light">
            {(stats.totalRoles / stats.totalDepartements || 0).toFixed(1)}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Moyenne par département
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Taux de succès</span>
          </div>
          <div className="text-xl font-light">
            {tauxRealisation}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Activités réalisées
          </div>
        </div>
      </div>

      {/* Résumé et accès rapide */}
      <div className="border border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Résumé</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Membres actifs</p>
              <p className="font-light text-lg">{stats.membresActifs} / {stats.totalMembres}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Taux d'activité</p>
              <p className="font-light text-lg">{tauxActivite}%</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Activités réalisées</p>
              <p className="font-light text-lg">{stats.activitesTerminees} / {stats.activitesPlanifiees}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Départements</p>
              <p className="font-light text-lg">{stats.totalDepartements}</p>
            </div>
          </div>
        </div>
        
        {/* Liens rapides */}
        <div className="p-4 bg-gray-50">
          <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Accès rapide</h3>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/paroisse/membres"
              className="px-3 py-1.5 text-sm border border-gray-300 bg-white hover:border-black hover:text-black text-gray-600 transition-colors flex items-center gap-1"
            >
              Membres <ChevronRight size={12} />
            </Link>
            <Link
              href="/paroisse/departements"
              className="px-3 py-1.5 text-sm border border-gray-300 bg-white hover:border-black hover:text-black text-gray-600 transition-colors flex items-center gap-1"
            >
              Départements <ChevronRight size={12} />
            </Link>
            <Link
              href="/paroisse/activites"
              className="px-3 py-1.5 text-sm border border-gray-300 bg-white hover:border-black hover:text-black text-gray-600 transition-colors flex items-center gap-1"
            >
              Activités <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}