// app/paroisse/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { getUser, getCurrentFidele } from '@/actions/auth'
import { getDepartements } from '@/actions/departements'
import { getCurrentAnneeConference } from '@/actions/annee-conference'
import { getMembresCabinet } from '@/actions/cabinet-pastoral'
import { getConseilMembres, getConseils } from '@/actions/conseil-admin'
import { getMyPlansAction } from '@/actions/plan-action'
import { getMyProjets } from '@/actions/projet'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  Users, UserPlus, UserMinus, Building2, 
  Activity, FolderOpen, Target, Calendar,
  Clock, CheckCircle, AlertCircle, TrendingUp,
  TrendingDown, Church, Briefcase, Heart,
  ArrowRight, ChevronRight, UserCheck,
  FileText, BarChart3, PieChart
} from 'lucide-react'

// Helper pour récupérer la conférence d'une paroisse
async function getConferenceFromParoisse(paroisseId: number) {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id, nom)
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

export default async function ParoisseDashboardPage() {
  // 1. Vérifier l'utilisateur
  const user = await getUser()
  const currentFidele = await getCurrentFidele()

  if (!user) {
    redirect('/login')
  }

  if (!currentFidele?.paroisse_id) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-yellow-400 mb-3" />
          <h2 className="text-lg font-light text-yellow-800 mb-2">Paroisse non définie</h2>
          <p className="text-sm text-yellow-600">
            Vous n'êtes pas rattaché à une paroisse.
          </p>
        </div>
      </div>
    )
  }

  const paroisseId = currentFidele.paroisse_id
  const paroisse = currentFidele.paroisse as any
  const paroisseNom = paroisse?.nom || 'Votre Paroisse'

  // 2. Récupérer la conférence et l'année en cours
  const conference = await getConferenceFromParoisse(paroisseId)
  const currentAnneeConference = conference?.id 
    ? await getCurrentAnneeConference(conference.id) 
    : null
  const anneeConferenceId = currentAnneeConference?.id || null

  // 3. Récupérer TOUTES les données en parallèle
  const [
    departements,
    cabinetMembres,
    conseilMembres,
    conseils,
    plansAction,
    projets,
    
    // Stats fidèles
    totalFideles,
    hommesCount,
    femmesCount,
    nouveaux30Jours,
    nouveaux7Jours,
    nouveauxAujourdhui,
    
    // Stats âge
    jeunesCount,
    adultesCount,
    seniorsCount,
    
    // Stats mariage
    mariesCount,
    celibatairesCount,
    
    // Stats baptême
    baptisesCount,
    
    // Activités
    totalActivites,
    activitesTerminees,
    activitesEnCours,
    activitesAVenir,
    
    // Projets
    totalProjets,
    projetsEnCours,
    projetsTermines,
    projetsEnAttente,
    
    // Plans d'action
    totalPlans,
    plansActifs,
    
    // Transferts
    transfertsEntrantsEnAttente,
    transfertsSortantsEnAttente,
    transfertsAcceptesEntrants,
    transfertsAcceptesSortants,
    transfertsRefuses,
    transfertsAnnules,
    
    // Réunions conseil
    totalReunions,
    reunionsMois,
    
    // Dons/Offrandes (si table existe)
    totalDons,
    
    // Membres départements
    totalMembresDepartements,
    
    // Cabinet complet
    totalCabinet,
    
  ] = await Promise.all([
    // Départements
    getDepartements(),
    
    // Cabinet et Conseil
    getMembresCabinet(paroisseId, anneeConferenceId),
    anneeConferenceId ? getConseilMembres(paroisseId, anneeConferenceId) : Promise.resolve([]),
    anneeConferenceId ? getConseils(paroisseId, anneeConferenceId) : Promise.resolve([]),
    
    // Plans et Projets
    getMyPlansAction(),
    getMyProjets(),
    
    // STATISTIQUES FIDÈLES
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true).eq('sexe', 'M'),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true).eq('sexe', 'F'),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    
    // Stats âge (jeunes: < 25 ans, adultes: 25-60, seniors: > 60)
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .gte('annee_naissance', new Date().getFullYear() - 25),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .gte('annee_naissance', new Date().getFullYear() - 60)
      .lt('annee_naissance', new Date().getFullYear() - 25),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .lt('annee_naissance', new Date().getFullYear() - 60),
    
    // Stats mariage (si colonne existe)
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .not('conjoint', 'is', null),
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .is('conjoint', null),
    
    // Baptisés (si colonne existe)
    supabase.from('fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('actif', true)
      .eq('est_baptise', true),
    
    // ACTIVITÉS
    supabase.from('activite').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId),
    supabase.from('activite').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'termine'),
    supabase.from('activite').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'en_cours'),
    supabase.from('activite').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'a_venir'),
    
    // PROJETS
    supabase.from('projet').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId),
    supabase.from('projet').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'en_cours'),
    supabase.from('projet').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'termine'),
    supabase.from('projet').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'en_attente'),
    
    // PLANS D'ACTION
    supabase.from('plan_action').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId),
    supabase.from('plan_action').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('statut', 'actif'),
    
    // TRANSFERTS
    supabase.from('transfert_fidele').select('id', { count: 'exact', head: true })
      .eq('statut', 'en_attente')
      .neq('paroisse_source_id', paroisseId)
      .is('paroisse_destination_id', null),
    supabase.from('transfert_fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_source_id', paroisseId)
      .eq('statut', 'en_attente'),
    supabase.from('transfert_fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_destination_id', paroisseId)
      .eq('statut', 'accepte'),
    supabase.from('transfert_fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_source_id', paroisseId)
      .eq('statut', 'accepte'),
    supabase.from('transfert_fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_source_id', paroisseId)
      .eq('statut', 'refuse'),
    supabase.from('transfert_fidele').select('id', { count: 'exact', head: true })
      .eq('paroisse_source_id', paroisseId)
      .eq('statut', 'annule'),
    
    // RÉUNIONS CONSEIL
    supabase.from('conseil').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId),
    supabase.from('conseil').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId)
      .gte('date_reunion', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    
    // DONS (si table existe)
    supabase.from('don').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId),
    
    // MEMBRES DÉPARTEMENTS
    supabase.from('fidele_departement').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId).eq('est_actif', true),
    
    // CABINET
    supabase.from('cabinet_membre').select('id', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId),
  ])

  // 4. Calculer les stats des départements
  const departementsStats = await Promise.all(
    departements.map(async (dept) => {
      const { count: membres } = await supabase
        .from('fidele_departement')
        .select('id', { count: 'exact', head: true })
        .eq('departement_id', dept.id)
        .eq('paroisse_id', paroisseId)
        .eq('est_actif', true)

      return {
        id: dept.id,
        nom: dept.nom,
        type: dept.type,
        membres_count: membres || 0
      }
    })
  )

  departementsStats.sort((a, b) => b.membres_count - a.membres_count)

  // 5. Calculs finaux
  const totalF = totalFideles.count || 0
  const hommesF = hommesCount.count || 0
  const femmesF = femmesCount.count || 0
  
  const soldeTransferts = (transfertsAcceptesEntrants.count || 0) - (transfertsAcceptesSortants.count || 0)
  
  const pourcentageHommes = totalF > 0 ? Math.round((hommesF / totalF) * 100) : 0
  const pourcentageFemmes = totalF > 0 ? Math.round((femmesF / totalF) * 100) : 0
 
  const dashboardPath = user.role?.nom === 'admin' ? '/admin' : '/gestion'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={dashboardPath}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
              <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {user.role?.nom || 'Membre'}
              </span>
              <span>•</span>
              <span>{user.nom_complet}</span>
              <span>•</span>
              <span>{paroisseNom}</span>
            </div>
            <h1 className="text-2xl font-light tracking-wide">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentAnneeConference?.annee?.label || 'Année en cours'}
            </p>
          </div>
        </div>
      </div>

    

      {/* SECTION 1: FIDÈLES */}
      <div className="mb-8">
        <h2 className="text-lg font-light tracking-wide mb-4 flex items-center gap-2">
          <Users size={20} className="text-gray-400" />
          Fidèles
        </h2>
        
        {/* Stats principales fidèles */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-3xl font-light">{totalF}</div>
            <div className="text-xs text-gray-500 mt-1">Total fidèles</div>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-blue-600">{hommesF} H</span>
              <span className="text-pink-600">{femmesF} F</span>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserPlus size={20} className="text-green-500" />
              <span className="text-3xl font-light">{nouveaux30Jours.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Nouveaux (30 jours)</div>
            <div className="flex gap-2 mt-2 text-xs text-gray-400">
              <span>7j: {nouveaux7Jours.count || 0}</span>
              <span>•</span>
              <span>Auj: {nouveauxAujourdhui.count || 0}</span>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-2xl font-light mb-2">
              {pourcentageHommes}% / {pourcentageFemmes}%
            </div>
            <div className="text-xs text-gray-500 mb-2">Répartition H/F</div>
            <div className="h-2 bg-gray-100 rounded-full flex">
              <div 
                className="h-2 bg-blue-500 rounded-l-full" 
                style={{ width: `${pourcentageHommes}%` }}
              />
              <div 
                className="h-2 bg-pink-500 rounded-r-full" 
                style={{ width: `${pourcentageFemmes}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-2xl font-light">
              {soldeTransferts >= 0 ? '+' : ''}{soldeTransferts}
            </div>
            <div className="text-xs text-gray-500 mt-1">Solde transferts</div>
            <div className="flex gap-2 mt-2 text-xs">
              <span className="text-green-600">↗{transfertsAcceptesEntrants.count || 0}</span>
              <span className="text-red-600">↘{transfertsAcceptesSortants.count || 0}</span>
            </div>
          </div>
        </div>

        {/* Stats détaillées fidèles */}
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-red-400" />
              <span className="text-lg font-medium">{jeunesCount.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Jeunes (&lt;25 ans)</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="text-blue-400" />
              <span className="text-lg font-medium">{adultesCount.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Adultes (25-60 ans)</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              <span className="text-lg font-medium">{seniorsCount.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Seniors (&gt;60 ans)</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-pink-400" />
              <span className="text-lg font-medium">{mariesCount.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Mariés</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <Church size={16} className="text-indigo-400" />
              <span className="text-lg font-medium">{baptisesCount.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Baptisés</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: ACTIVITÉS & PROJETS */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        {/* Activités */}
        <div>
          <h2 className="text-lg font-light tracking-wide mb-4 flex items-center gap-2">
            <Activity size={20} className="text-gray-400" />
            Activités
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light">{totalActivites.count || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light text-green-600">{activitesTerminees.count || 0}</div>
              <div className="text-xs text-gray-500">Terminées</div>
            </div>
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light text-blue-600">{activitesEnCours.count || 0}</div>
              <div className="text-xs text-gray-500">En cours</div>
            </div>
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light text-orange-600">{activitesAVenir.count || 0}</div>
              <div className="text-xs text-gray-500">À venir</div>
            </div>
          </div>
          
         
        </div>

        {/* Projets */}
        <div>
          <h2 className="text-lg font-light tracking-wide mb-4 flex items-center gap-2">
            <FolderOpen size={20} className="text-gray-400" />
            Projets
          </h2>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light">{totalProjets.count || 0}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light text-green-600">{projetsTermines.count || 0}</div>
              <div className="text-xs text-gray-500">Terminés</div>
            </div>
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light text-blue-600">{projetsEnCours.count || 0}</div>
              <div className="text-xs text-gray-500">En cours</div>
            </div>
            <div className="bg-white border border-gray-200 p-3">
              <div className="text-2xl font-light text-yellow-600">{projetsEnAttente.count || 0}</div>
              <div className="text-xs text-gray-500">En attente</div>
            </div>
          </div>
          
    
        </div>
      </div>

      {/* SECTION 3: ORGANISATION */}
      <div className="mb-8">
        <h2 className="text-lg font-light tracking-wide mb-4 flex items-center gap-2">
          <Building2 size={20} className="text-gray-400" />
          Organisation
        </h2>
        
        <div className="grid grid-cols-4 gap-4">
          {/* Cabinet Pastoral */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Church size={18} className="text-gray-400" />
              <h3 className="font-medium text-sm">Cabinet Pastoral</h3>
            </div>
            <div className="text-2xl font-light mb-2">{cabinetMembres.length}</div>
            <div className="text-xs text-gray-500">Membres</div>
            {cabinetMembres.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">Président:</div>
                <div className="text-sm font-medium">
                  {cabinetMembres.find(m => m.role_nom?.toLowerCase().includes('president'))?.fidele_prenom || 'Non défini'}
                  {' '}
                  {cabinetMembres.find(m => m.role_nom?.toLowerCase().includes('president'))?.fidele_nom || ''}
                </div>
              </div>
            )}
          </div>

          {/* Conseil d'Administration */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={18} className="text-gray-400" />
              <h3 className="font-medium text-sm">Conseil Admin</h3>
            </div>
            <div className="text-2xl font-light mb-2">{conseilMembres.length}</div>
            <div className="text-xs text-gray-500">Membres</div>
            <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
              <div className="text-xs text-gray-500">
                {totalReunions.count || 0} réunions ({reunionsMois.count || 0} ce mois)
              </div>
            </div>
          </div>

          {/* Départements */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={18} className="text-gray-400" />
              <h3 className="font-medium text-sm">Départements</h3>
            </div>
            <div className="text-2xl font-light mb-2">{departements.length}</div>
            <div className="text-xs text-gray-500">
              {totalMembresDepartements.count || 0} membres actifs
            </div>
          </div>

          {/* Plans d'Action */}
          <div className="bg-white border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-gray-400" />
              <h3 className="font-medium text-sm">Plans d'Action</h3>
            </div>
            <div className="text-2xl font-light mb-2">{totalPlans.count || 0}</div>
            <div className="text-xs text-gray-500">
              {plansActifs.count || 0} actifs
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: TOP DÉPARTEMENTS */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-light tracking-wide flex items-center gap-2">
            <BarChart3 size={20} className="text-gray-400" />
            Top Départements
          </h2>
          <Link 
            href={`/paroisse/departements`}
            className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
          >
            Voir tous <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="bg-white border border-gray-200">
          {departementsStats.slice(0, 5).map((dept, index) => (
            <Link
              key={dept.id}
              href={`/paroisse/departements/${dept.id}`}
              className="flex items-center p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{dept.nom}</div>
                <div className="text-xs text-gray-400 capitalize">{dept.type || 'Département'}</div>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-gray-400" />
                <span className="text-sm font-medium">{dept.membres_count}</span>
              </div>
              <ChevronRight size={16} className="text-gray-400 ml-3" />
            </Link>
          ))}
          
          {departementsStats.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">
              Aucun département configuré
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: TRANSFERTS - RÉSUMÉ */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-light tracking-wide flex items-center gap-2">
            <TrendingUp size={20} className="text-gray-400" />
            Résumé des Transferts
          </h2>
          <Link 
            href={`/paroisse/transferts`}
            className="text-xs text-gray-500 hover:text-black flex items-center gap-1"
          >
            Gérer les transferts <ChevronRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-lg font-medium">{transfertsAcceptesEntrants.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Entrants acceptés</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-lg font-medium">{transfertsAcceptesSortants.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Sortants acceptés</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-blue-500" />
              <span className="text-lg font-medium">{transfertsEntrantsEnAttente.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">En attente</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-yellow-500" />
              <span className="text-lg font-medium">{transfertsRefuses.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Refusés</div>
          </div>
          
          <div className="bg-white border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={16} className="text-gray-500" />
              <span className="text-lg font-medium">{transfertsAnnules.count || 0}</span>
            </div>
            <div className="text-xs text-gray-500">Annulés</div>
          </div>
        </div>
      </div>

      {/* SECTION 6: DONS (si la table existe) */}
      {totalDons.count !== null && (
        <div className="mb-8">
          <h2 className="text-lg font-light tracking-wide mb-4 flex items-center gap-2">
            <Heart size={20} className="text-gray-400" />
            Dons & Offrandes
          </h2>
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-3xl font-light">{totalDons.count || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Dons enregistrés</div>
          </div>
        </div>
      )}

      {/* Liens rapides */}
      <div className="bg-white border border-gray-200 p-4">
        <h3 className="font-medium text-sm mb-3">Accès rapides</h3>
        <div className="grid grid-cols-4 gap-2">
          <Link 
            href={`/paroisse/${paroisseId}/fideles`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            👥 Fidèles
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/departements`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            📁 Départements
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/cabinet`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            ⛪ Cabinet
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/conseil`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            📋 Conseil
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/projets`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            🎯 Projets
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/activites`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            📅 Activités
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/plans-action`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            📊 Plans d'action
          </Link>
          <Link 
            href={`/paroisse/${paroisseId}/transferts`}
            className="p-2 bg-gray-50 text-sm text-center hover:bg-gray-100"
          >
            🔄 Transferts
          </Link>
        </div>
      </div>
    </div>
  )
}