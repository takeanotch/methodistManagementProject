


// 'use client'

// import { useState, useEffect } from 'react'
// import Link from 'next/link'
// import { 
//   Loader2, 
//   Building2, 
//   Users, 
//   ChevronRight,
//   Calendar,
//   MapPin,
//   UserCheck,
//   Briefcase,
//   Target
// } from 'lucide-react'
// import { getCurrentFidele } from '@/actions/auth'
// import { supabase } from '@/lib/supabase'

// type RoleDepartement = {
//   role_id: number
//   role_nom: string
//   role_label: string
//   departement_id: number
//   departement_nom: string
//   departement_type: string
//   paroisse_id: number
//   paroisse_nom: string
//   created_at: string
// }

// export default function Role7Dashboard() {
//   const [loading, setLoading] = useState(true)
//   const [fidele, setFidele] = useState<any>(null)
//   const [roles, setRoles] = useState<RoleDepartement[]>([])

//   useEffect(() => {
//     loadData()
//   }, [])

//   const loadData = async () => {
//     try {
//       const fideleData = await getCurrentFidele()
//       setFidele(fideleData)

//       if (!fideleData) {
//         setLoading(false)
//         return
//       }

//       const { data: rolesData, error: rolesError } = await supabase
//         .from('fidele_departement')
//         .select(`
//           role_id,
//           created_at,
//           departement:departement_id (
//             id,
//             nom,
//             type,
//             roles_config
//           ),
//           paroisse:paroisse_id (
//             id,
//             nom
//           )
//         `)
//         .eq('fidele_id', fideleData.id)
//         .eq('est_actif', true)
//         .order('created_at', { ascending: false })

//       if (rolesError) throw rolesError

//       if (rolesData && rolesData.length > 0) {
//         const rolesFormatted: RoleDepartement[] = rolesData.map((r: any) => {
//           const departement = Array.isArray(r.departement) ? r.departement[0] : r.departement
//           const paroisse = Array.isArray(r.paroisse) ? r.paroisse[0] : r.paroisse
          
//           if (!departement) return null

//           const roleConfig = departement?.roles_config?.find((c: any) => c.id === r.role_id)
          
//           return {
//             role_id: r.role_id,
//             role_nom: roleConfig?.nom || 'membre',
//             role_label: roleConfig?.label || 'Membre',
//             departement_id: departement.id,
//             departement_nom: departement.nom,
//             departement_type: departement.type || 'normal',
//             paroisse_id: paroisse?.id || 0,
//             paroisse_nom: paroisse?.nom || 'Paroisse inconnue',
//             created_at: r.created_at
//           }
//         }).filter(Boolean) as RoleDepartement[]

//         setRoles(rolesFormatted)
//       }

//     } catch (error) {
//       console.error('Erreur chargement données:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const getRoleBadgeStyle = (role: string) => {
//     switch (role) {
//       case 'president': return 'bg-amber-50 text-amber-700 border-amber-200'
//       case 'vice_president': return 'bg-amber-50 text-amber-700 border-amber-200'
//       case 'secretaire': return 'bg-blue-50 text-blue-700 border-blue-200'
//       case 'vice_secretaire': return 'bg-blue-50 text-blue-700 border-blue-200'
//       case 'tresorier': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
//       case 'conseiller': return 'bg-purple-50 text-purple-700 border-purple-200'
//       default: return 'bg-gray-50 text-gray-600 border-gray-200'
//     }
//   }

//   const getDepartementIcon = (type: string) => {
//     switch (type) {
//       case 'commite':
//         return <Users size={20} />
//       case 'agence_programme':
//         return <Target size={20} />
//       case 'departement':
//         return <Building2 size={20} />
//       default:
//         return <Briefcase size={20} />
//     }
//   }

//   const getIconBgColor = (type: string) => {
//     switch (type) {
//       case 'commite': return 'bg-purple-50 text-purple-600'
//       case 'agence_programme': return 'bg-blue-50 text-blue-600'
//       case 'departement': return 'bg-green-50 text-green-600'
//       default: return 'bg-gray-50 text-gray-500'
//     }
//   }

//   const formatDate = (date: string) => {
//     return new Date(date).toLocaleDateString('fr-FR', {
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     })
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-[400px]">
//         <Loader2 className="animate-spin text-gray-400" size={32} />
//       </div>
//     )
//   }

//   if (roles.length === 0) {
//     return (
//       <div className="bg-white border border-gray-200 py-16 text-center">
//         <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
//         <h3 className="text-sm font-medium text-gray-900 mb-1">Aucun département</h3>
//         <p className="text-sm text-gray-400">Vous n'êtes membre d'aucun département pour le moment.</p>
//       </div>
//     )
//   }

//   // Grouper par paroisse
//   const rolesByParoisse = roles.reduce((acc, role) => {
//     if (!acc[role.paroisse_id]) {
//       acc[role.paroisse_id] = {
//         nom: role.paroisse_nom,
//         roles: []
//       }
//     }
//     acc[role.paroisse_id].roles.push(role)
//     return acc
//   }, {} as Record<number, { nom: string, roles: RoleDepartement[] }>)

//   return (
//     <div className="space-y-8">
//       {/* Header - Profil */}
//       <div className="bg-white border border-gray-200 p-6">
//         <div className="flex items-start gap-4">
//           {/* Avatar */}
//           <div className="flex-shrink-0">
//             {fidele?.profile_img ? (
//               <img 
//                 src={fidele.profile_img} 
//                 alt="" 
//                 className="w-16 h-16 rounded-full object-cover border border-gray-200"
//               />
//             ) : (
//               <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-200">
//                 <span className="text-xl font-light text-gray-500">
//                   {fidele?.nom?.charAt(0)}{fidele?.prenom?.charAt(0)}
//                 </span>
//               </div>
//             )}
//           </div>

//           <div className="flex-1">
//             <h2 className="text-xl font-light tracking-wide text-gray-900 mb-1">
//               {fidele?.nom} {fidele?.post_nom} {fidele?.prenom}
//             </h2>
//             <div className="flex flex-wrap items-center gap-4 text-sm">
//               <span className="flex items-center gap-1.5 text-gray-500">
//                 <MapPin size={14} />
//                 {fidele?.paroisse?.nom || 'Paroisse non définie'}
//               </span>
//               <span className="flex items-center gap-1.5 text-gray-500">
//                 <UserCheck size={14} />
//                 {roles.length} département{roles.length > 1 ? 's' : ''}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Départements par paroisse */}
//       {Object.entries(rolesByParoisse).map(([paroisseId, data]) => (
//         <div key={paroisseId}>
//           <div className="flex items-center gap-2 mb-4">
//             <Building2 size={16} className="text-gray-400" />
//             <h3 className="text-sm font-medium text-gray-700">{data.nom}</h3>
//             <span className="text-xs text-gray-400">({data.roles.length})</span>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//             {data.roles.map((role, index) => (
//               <Link
//                 key={`${role.departement_id}-${index}`}
//                 href={`/paroisse/departements/${role.departement_id}`}
//                 className="block border bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
//               >
//                 <div className="p-5">
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex items-start gap-3 flex-1">
//                       {/* Icône */}
//                       <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-100 ${getIconBgColor(role.departement_type)}`}>
//                         {getDepartementIcon(role.departement_type)}
//                       </div>

//                       <div className="flex-1 min-w-0">
//                         <div className="flex items-start justify-between gap-2">
//                           <h4 className="font-medium text-gray-900 truncate">
//                             {role.departement_nom}
//                           </h4>
//                           <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
//                         </div>
                        
//                         {/* Type et rôle */}
//                         <div className="flex items-center gap-2 mt-1 flex-wrap">
//                           <span className="text-xs text-gray-400">
//                             {role.departement_type === 'commite' ? 'Comité' : 
//                              role.departement_type === 'agence_programme' ? 'Agence/Programme' : 
//                              role.departement_type === 'departement' ? 'Département' : 'Département'}
//                           </span>
//                           <span className={`text-xs px-2 py-0.5 border ${getRoleBadgeStyle(role.role_nom)}`}>
//                             {role.role_label}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>

//                   {/* Date d'adhésion */}
//                   {role.created_at && (
//                     <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-3 pt-3 border-t border-gray-100">
//                       <Calendar size={12} />
//                       <span>Membre depuis {formatDate(role.created_at)}</span>
//                     </div>
//                   )}
//                 </div>
//               </Link>
//             ))}
//           </div>
//         </div>
//       ))}

//       {/* Footer */}
//       <div className="pt-6 border-t border-gray-100 text-center">
//         <span className="text-xs text-gray-400">
//           Connecté en tant que <span className="text-gray-500">{fidele?.nom} {fidele?.prenom}</span>
//         </span>
//       </div>
//     </div>
//   )
// }

// app/paroisse/dashboard/page.tsx
import { getUser, getCurrentFidele } from '@/actions/auth'
import { getMembresCabinet } from '@/actions/cabinet-pastoral'
import { getConseilMembres, getConseils } from '@/actions/conseil-admin'
import { getDepartements } from '@/actions/departements'
import { getFidelesWithHistoryByDepartement } from '@/actions/fidele-departement'
import { getMyPlansAction, getPlansActionByUnite } from '@/actions/plan-action'
import { getMyProjets, getProjetsByUnite, getProjetsStats } from '@/actions/projet'
import { getMouvements, getMouvementsStats } from '@/actions/mouvement-fidele'
import { getCurrentAnneeConferenceForParoisse } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Types pour les statistiques
interface DashboardData {
  paroisse: { id: number; nom: string }
  anneeCourante: { id: number; label: string; annee_conference_id: number } | null
  stats: {
    fideles: { total: number; hommes: number; femmes: number; nouveaux: number }
    cabinet: { total: number; president: any }
    conseil: { president: any; vicePresident: any; secretaire: any; totalReunions: number }
    departements: { total: number; totalMembres: number; membresActifs: number }
    plansAction: { total: number; totalActivites: number }
    projets: { total: number; enCours: number; termines: number; courtTerme: number; moyenTerme: number; longTerme: number }
    mouvements: { entrees: number; sorties: number; solde: number }
  }
  fidelesRecents: any[]
  projetsRecents: any[]
}

export default async function ParoisseDashboardPage() {
  // 1. Récupérer l'utilisateur connecté et son fidèle
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const fidele = await getCurrentFidele()
  if (!fidele || !fidele.paroisse_id) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Accès non autorisé</h1>
        <p className="text-gray-600">Vous n'êtes pas rattaché à une paroisse.</p>
      </div>
    )
  }

  const paroisseId = fidele.paroisse_id
  const paroisse = fidele.paroisse as any
  const paroisseNom = paroisse?.nom || 'Votre Paroisse'

  // 2. Récupérer l'année en cours
  const anneeCourante = await getCurrentAnneeConferenceForParoisse(paroisseId)
  const anneeConferenceId = anneeCourante?.id || null

  console.log('📊 Dashboard - Paroisse:', paroisseId, 'Année conférence:', anneeConferenceId)

  // 3. Récupérer toutes les données en parallèle
  const [
    cabinetMembres,
    conseilMembres,
    conseils,
    departements,
    plansAction,
    projets,
    mouvements,
    // Statistiques fidèles
    totalFideles,
    hommesFideles,
    femmesFideles,
    nouveauxFideles,
    fidelesRecents
  ] = await Promise.all([
    // Cabinet pastoral
    getMembresCabinet(paroisseId, anneeConferenceId),
    
    // Conseil d'administration
    anneeConferenceId ? getConseilMembres(paroisseId, anneeConferenceId) : Promise.resolve([]),
    anneeConferenceId ? getConseils(paroisseId, anneeConferenceId) : Promise.resolve([]),
    
    // Départements (tous)
    getDepartements(),
    
    // Plans d'action
    getMyPlansAction(),
    
    // Projets
    getMyProjets(),
    
    // Mouvements
    getMouvements({ paroisse_id: paroisseId }),
    
    // Statistiques fidèles
    supabase.from('fidele').select('*', { count: 'exact', head: true }).eq('paroisse_id', paroisseId).eq('actif', true),
    supabase.from('fidele').select('*', { count: 'exact', head: true }).eq('paroisse_id', paroisseId).eq('actif', true).eq('sexe', 'M'),
    supabase.from('fidele').select('*', { count: 'exact', head: true }).eq('paroisse_id', paroisseId).eq('actif', true).eq('sexe', 'F'),
    supabase.from('fidele').select('*', { count: 'exact', head: true }).eq('paroisse_id', paroisseId).eq('actif', true).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('fidele').select('id, nom, prenom, profile_img, created_at').eq('paroisse_id', paroisseId).eq('actif', true).order('created_at', { ascending: false }).limit(5)
  ])

  // Calculer les statistiques des départements
  let totalMembresDept = 0
  let membresActifsDept = 0
  
  for (const dept of departements) {
    const membres = await getFidelesWithHistoryByDepartement(dept.id, paroisseId, anneeConferenceId)
    totalMembresDept += membres.length
    membresActifsDept += membres.filter(m => m.est_actif).length
  }

  // Statistiques des projets
  const projetsStats = projets.reduce((acc, p) => {
    acc.total++
    if (p.statut === 'en_cours') acc.enCours++
    if (p.statut === 'termine') acc.termines++
    if (p.type === 'court_terme') acc.courtTerme++
    if (p.type === 'moyen_terme') acc.moyenTerme++
    if (p.type === 'long_terme') acc.longTerme++
    return acc
  }, { total: 0, enCours: 0, termines: 0, courtTerme: 0, moyenTerme: 0, longTerme: 0 })

  // Statistiques des mouvements
  const mouvementsStats = mouvements.reduce((acc, m) => {
    if (m.type_mouvement === 'transfert_arrivee' || m.type_mouvement === 'inscription') acc.entrees++
    if (m.type_mouvement === 'transfert_depart' || m.type_mouvement === 'deces' || m.type_mouvement === 'demission') acc.sorties++
    return acc
  }, { entrees: 0, sorties: 0, solde: 0 })
  mouvementsStats.solde = mouvementsStats.entrees - mouvementsStats.sorties

  // Trouver les membres du conseil
  const president = conseilMembres.find(m => m.role === 'president')?.fidele
  const vicePresident = conseilMembres.find(m => m.role === 'vice_president')?.fidele
  const secretaire = conseilMembres.find(m => m.role === 'secretaire')?.fidele

  // Président du cabinet
  const presidentCabinet = cabinetMembres.find(m => m.role_nom?.toLowerCase().includes('president'))

  // Construire l'objet de données
  const data: DashboardData = {
    paroisse: { id: paroisseId, nom: paroisseNom },
    anneeCourante: anneeCourante ? {
      id: anneeCourante.annee_id,
      label: anneeCourante.label,
      annee_conference_id: anneeCourante.id
    } : null,
    stats: {
      fideles: {
        total: totalFideles.count || 0,
        hommes: hommesFideles.count || 0,
        femmes: femmesFideles.count || 0,
        nouveaux: nouveauxFideles.count || 0
      },
      cabinet: {
        total: cabinetMembres.length,
        president: presidentCabinet ? {
          nom: presidentCabinet.fidele_nom,
          prenom: presidentCabinet.fidele_prenom
        } : null
      },
      conseil: {
        president: president ? { nom: president.nom, prenom: president.prenom } : null,
        vicePresident: vicePresident ? { nom: vicePresident.nom, prenom: vicePresident.prenom } : null,
        secretaire: secretaire ? { nom: secretaire.nom, prenom: secretaire.prenom } : null,
        totalReunions: conseils.length
      },
      departements: {
        total: departements.length,
        totalMembres: totalMembresDept,
        membresActifs: membresActifsDept
      },
      plansAction: {
        total: plansAction.length,
        totalActivites: plansAction.reduce((sum, p) => sum + (p.activites_count || 0), 0)
      },
      projets: projetsStats,
      mouvements: mouvementsStats
    },
    fidelesRecents: (fidelesRecents.data || []).map((f: any) => ({
      ...f,
      created_at: f.created_at ? new Date(f.created_at).toLocaleDateString('fr-FR') : 'N/A'
    })),
    projetsRecents: projets.filter(p => p.statut === 'en_cours').slice(0, 5)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white border-b">
        <div className="px-6 py-4 max-w-[1600px] mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Paroisse {data.paroisse.nom}
              </h1>
              <p className="text-gray-600 mt-1">
                Tableau de bord • {data.anneeCourante?.label || 'Année en cours'}
              </p>
            </div>
            <div className="flex gap-3">
              <Link 
                href={`/paroisse/${paroisseId}/fideles`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                + Nouveau fidèle
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="px-6 py-6 max-w-[1600px] mx-auto">
        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Fidèles */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Fidèles</h3>
              <span className="p-2 bg-blue-100 rounded-lg text-blue-600">👥</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.stats.fideles.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.stats.fideles.hommes} hommes • {data.stats.fideles.femmes} femmes
            </div>
            <div className="text-xs text-green-600 mt-2">
              +{data.stats.fideles.nouveaux} nouveaux (30j)
            </div>
          </div>

          {/* Départements */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Départements</h3>
              <span className="p-2 bg-purple-100 rounded-lg text-purple-600">📁</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.stats.departements.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.stats.departements.membresActifs} membres actifs
            </div>
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full">
                <div 
                  className="h-1.5 bg-purple-600 rounded-full" 
                  style={{ 
                    width: `${data.stats.departements.totalMembres > 0 
                      ? (data.stats.departements.membresActifs / data.stats.departements.totalMembres) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>

          {/* Projets */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Projets</h3>
              <span className="p-2 bg-green-100 rounded-lg text-green-600">🎯</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.stats.projets.total}</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.stats.projets.enCours} en cours • {data.stats.projets.termines} terminés
            </div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="px-2 py-0.5 bg-gray-100 rounded">CT: {data.stats.projets.courtTerme}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded">MT: {data.stats.projets.moyenTerme}</span>
              <span className="px-2 py-0.5 bg-gray-100 rounded">LT: {data.stats.projets.longTerme}</span>
            </div>
          </div>

          {/* Mouvements */}
          <div className="bg-white rounded-lg border p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Mouvements</h3>
              <span className="p-2 bg-orange-100 rounded-lg text-orange-600">🔄</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {data.stats.mouvements.solde >= 0 ? '+' : ''}{data.stats.mouvements.solde}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ↗ {data.stats.mouvements.entrees} entrées • ↘ {data.stats.mouvements.sorties} sorties
            </div>
            <div className={`text-sm font-medium mt-2 ${data.stats.mouvements.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Solde {data.stats.mouvements.solde >= 0 ? 'positif' : 'négatif'}
            </div>
          </div>
        </div>

        {/* Sections principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne 1 - Cabinet et Conseil */}
          <div className="space-y-6">
            {/* Cabinet Pastoral */}
            <div className="bg-white rounded-lg border">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Cabinet Pastoral</h2>
                  <Link 
                    href={`/paroisse/${paroisseId}/cabinet`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir tout →
                  </Link>
                </div>
              </div>
              <div className="p-5">
                {data.stats.cabinet.president ? (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 mb-1">Président</div>
                    <div className="font-medium">
                      {data.stats.cabinet.president.prenom} {data.stats.cabinet.president.nom}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg text-gray-500 text-sm">
                    Aucun président désigné
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{data.stats.cabinet.total}</span> membres au total
                </div>
              </div>
            </div>

            {/* Conseil d'Administration */}
            <div className="bg-white rounded-lg border">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Conseil d'Administration</h2>
                  <Link 
                    href={`/paroisse/${paroisseId}/conseil`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir tout →
                  </Link>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {data.stats.conseil.president && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-xs text-purple-600 mb-1">Président</div>
                    <div className="font-medium">
                      {data.stats.conseil.president.prenom} {data.stats.conseil.president.nom}
                    </div>
                  </div>
                )}
                {data.stats.conseil.vicePresident && (
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="text-xs text-orange-600 mb-1">Vice-président</div>
                    <div className="font-medium">
                      {data.stats.conseil.vicePresident.prenom} {data.stats.conseil.vicePresident.nom}
                    </div>
                  </div>
                )}
                {data.stats.conseil.secretaire && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 mb-1">Secrétaire</div>
                    <div className="font-medium">
                      {data.stats.conseil.secretaire.prenom} {data.stats.conseil.secretaire.nom}
                    </div>
                  </div>
                )}
                <div className="pt-2 border-t text-sm text-gray-600">
                  <span className="font-medium">{data.stats.conseil.totalReunions}</span> réunions tenues
                </div>
              </div>
            </div>
          </div>

          {/* Colonne 2 - Plans d'action */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Plans d'Action</h2>
                  <Link 
                    href={`/paroisse/${paroisseId}/plans-action`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir tout →
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{data.stats.plansAction.total}</div>
                    <div className="text-xs text-gray-600">Plans</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{data.stats.plansAction.totalActivites}</div>
                    <div className="text-xs text-gray-600">Activités</div>
                  </div>
                </div>
                
                {plansAction.length > 0 ? (
                  <div className="space-y-2">
                    {plansAction.slice(0, 3).map((plan: any) => (
                      <div key={plan.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{plan.titre}</div>
                          <div className="text-xs text-gray-500">{plan.activites_count || 0} activités</div>
                        </div>
                        <Link href={`/plans-action/${plan.id}`} className="text-blue-600 text-sm">
                          Détails
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Aucun plan d'action
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne 3 - Projets récents */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border">
              <div className="p-5 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">Projets en cours</h2>
                  <Link 
                    href={`/paroisse/${paroisseId}/projets`}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Voir tout →
                  </Link>
                </div>
              </div>
              <div className="p-5">
                {data.projetsRecents.length > 0 ? (
                  <div className="space-y-3">
                    {data.projetsRecents.map((projet: any) => (
                      <div key={projet.id} className="p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm">{projet.nom}</div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            projet.statut === 'en_cours' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {projet.statut}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Début: {new Date(projet.date_debut).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            projet.type === 'court_terme' ? 'bg-gray-100' :
                            projet.type === 'moyen_terme' ? 'bg-yellow-50' : 'bg-orange-50'
                          }`}>
                            {projet.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Aucun projet en cours
                  </div>
                )}
              </div>
            </div>

            {/* Nouveaux fidèles */}
            <div className="bg-white rounded-lg border">
              <div className="p-5 border-b">
                <h2 className="font-semibold text-gray-900">Nouveaux fidèles</h2>
              </div>
              <div className="p-5">
                {data.fidelesRecents.length > 0 ? (
                  <div className="space-y-3">
                    {data.fidelesRecents.map((fidele: any) => (
                      <div key={fidele.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                          {fidele.prenom?.[0]}{fidele.nom?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {fidele.prenom} {fidele.nom}
                          </div>
                          <div className="text-xs text-gray-500">
                            Inscrit le {fidele.created_at}
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Nouveau
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Aucun nouveau fidèle récemment
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Liens rapides */}
        <div className="mt-6 bg-white rounded-lg border p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Accès rapides</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link 
              href={`/paroisse/${paroisseId}/fideles`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              👥 Gérer les fidèles
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/departements`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              📁 Départements
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/cabinet`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              ⛪ Cabinet pastoral
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/conseil`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              📋 Conseil d'administration
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/projets`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              🎯 Projets
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/plans-action`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              📊 Plans d'action
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/transferts`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              🔄 Transferts
            </Link>
            <Link 
              href={`/paroisse/${paroisseId}/statistiques`}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-center text-sm"
            >
              📈 Statistiques
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}