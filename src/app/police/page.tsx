
// app/police/page.tsx - Version avec filtre par paroisse de l'utilisateur
import { supabase } from '@/lib/supabase'
import { getUser } from '@/actions/auth'
import Link from 'next/link'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ChevronRight,
  Building2,
  Calendar,
  FileText,
  Target,
  Search,
  Filter,
  Home,
  User,
  MapPin,
  Bug,
  LogIn,
  Eye
} from 'lucide-react'
// Ajoutez cet import en haut du fichier
import { getFullHierarchyFromParoisse } from '@/actions/structures'

// Activer le mode debug
const DEBUG = true

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('🐛 [POLICE-DEBUG]:', ...args)
  }
}

interface PageProps {
  searchParams?: Promise<{ 
    conference?: string
    district?: string
    search?: string
    debug?: string
    paroisse?: string
    showAll?: string
  }>
}

// app/police/page.tsx - Version simplifiée et corrigée

async function getUserInfo(): Promise<UserInfoResult> {
  try {
    const user = await getUser()
    
    debugLog('=== getUserInfo - DÉBUT ===')
    debugLog('User complet:', user)
    
    if (!user) {
      debugLog('Aucun utilisateur connecté')
      return { connected: false, message: 'Non connecté' }
    }
    
    // Si l'utilisateur n'a pas de fidele_id, on ne peut pas récupérer sa paroisse
    if (!user.fidele_id) {
      debugLog('Utilisateur sans fidele_id')
      return { 
        connected: true, 
        hasFidele: false,
        nom_complet: user.nom_complet || user.email || 'Utilisateur',
        role: user.role?.nom || 'Utilisateur'
      }
    }
    
    debugLog('Récupération du fidèle ID:', user.fidele_id)
    
    // Récupérer le fidèle avec sa paroisse
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select(`
        id,
        nom,
        postnom,
        prenom,
        paroisse_id,
        paroisse:paroisse_id (
          id,
          nom,
          district_id
        )
      `)
      .eq('id', user.fidele_id)
      .single()
    
    if (fideleError) {
      debugLog('❌ Erreur récupération fidèle:', fideleError)
      return { 
        connected: true, 
        hasFidele: true,
        fideleError: true,
        nom_complet: user.nom_complet || 'Utilisateur',
        role: user.role?.nom || 'Utilisateur'
      }
    }
    
    if (!fidele) {
      debugLog('❌ Fidèle non trouvé')
      return { 
        connected: true, 
        hasFidele: false,
        nom_complet: user.nom_complet || 'Utilisateur',
        role: user.role?.nom || 'Utilisateur'
      }
    }
    
    debugLog('✅ Fidèle trouvé:', fidele)
    
    // Extraire la paroisse (peut être un objet ou un tableau selon comment Supabase le retourne)
    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    
    debugLog('Paroisse extraite:', paroisse)
    
    let district = null
    let conference = null
    
    // Si on a une paroisse avec un district_id, récupérer le district
    if (paroisse?.district_id) {
      debugLog('Récupération du district ID:', paroisse.district_id)
      
      const { data: districtData, error: districtError } = await supabase
        .from('district')
        .select(`
          id,
          nom,
          conference_id,
          conference:conference_id (
            id,
            nom
          )
        `)
        .eq('id', paroisse.district_id)
        .single()
      
      if (districtError) {
        debugLog('❌ Erreur récupération district:', districtError)
      } else {
        district = districtData
        debugLog('✅ District trouvé:', district)
        
        // Extraire la conférence
        conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
        debugLog('Conférence extraite:', conference)
      }
    }
    
    const result: UserInfoResult = {
      connected: true,
      hasFidele: true,
      fidele_id: fidele.id,
      nom_complet: `${fidele.nom || ''} ${fidele.postnom || ''} ${fidele.prenom || ''}`.trim() || user.nom_complet || 'Utilisateur',
      paroisse_id: paroisse?.id || fidele.paroisse_id || null,
      paroisse_nom: paroisse?.nom || null,
      district_id: district?.id || null,
      district_nom: district?.nom || null,
      conference_id: conference?.id || null,
      conference_nom: conference?.nom || null,
      role: user.role?.nom || 'Utilisateur'
    }
    
    debugLog('=== getUserInfo - RÉSULTAT FINAL ===', result)
    
    return result
    
  } catch (error) {
    debugLog('❌ Exception getUserInfo:', error)
    return { 
      connected: false, 
      message: 'Erreur', 
      error: String(error) 
    }
  }
}
// Types pour les statistiques
interface DepartementStats {
  id: number
  unite_id: number
  nom: string
  paroisse_id: number
  paroisse_nom: string
  district_id: number
  district_nom: string
  conference_id: number
  conference_nom: string
  
  // Stats plans d'action
  hasPlanAction: boolean
  planActionCount: number
  planActionLastUpdate: string | null
  
  // Stats activités
  activitesCount: number
  activitesTerminees: number
  activitesEnCours: number
  activitesPlanifiees: number
  activitesLastUpdate: string | null
  
  // Stats projets
  projetsCount: number
  projetsEnCours: number
  projetsTermines: number
  projetsLastUpdate: string | null
  
  // Score global
  completionScore: number
  status: 'complet' | 'partiel' | 'incomplet' | 'vide'
}


// Définir une interface pour le type de retour de getUserInfo
interface UserInfoResult {
  connected: boolean
  hasFidele?: boolean
  fidele_id?: number | null
  nom_complet?: string
  paroisse_id?: number | null
  paroisse_nom?: string | null
  district_id?: number | null
  district_nom?: string | null
  conference_id?: number | null
  conference_nom?: string | null
  role?: string
  message?: string
  fideleError?: boolean
  error?: string
}


// Récupérer les statistiques des départements
async function getPoliceStats(
  paroisseFilter?: number, // Nouveau : filtre par paroisse
  conferenceFilter?: string,
  districtFilter?: string,
  searchFilter?: string
): Promise<{ stats: DepartementStats[]; debug: any }> {
  const debugInfo: any = {
    steps: [],
    errors: [],
    counts: {},
    filters: { paroisseFilter, conferenceFilter, districtFilter, searchFilter }
  }
  
  try {
    debugLog('=== DÉBUT getPoliceStats ===')
    debugLog('Filtres:', { paroisseFilter, conferenceFilter, districtFilter, searchFilter })
    
    // ÉTAPE 1: Récupérer toutes les unités de type département (niveau = 'paroisse')
    debugLog('ÉTAPE 1: Récupération des unités département...')
    
    let query = supabase
      .from('unite_organisation')
      .select('*')
      .eq('reference_table', 'departement')
      .eq('niveau', 'paroisse')
    
    // FILTRER PAR PAROISSE SI FOURNIE
    if (paroisseFilter) {
      debugLog(`🔍 Filtrage par paroisse: ${paroisseFilter}`)
      query = query.eq('id_niveau', paroisseFilter)
    }
    
    const { data: unites, error: unitesError } = await query.order('nom', { ascending: true })
    
    debugInfo.steps.push({ step: 1, action: 'fetch_unites', count: unites?.length || 0, paroisseFilter })
    
    if (unitesError) {
      debugLog('❌ Erreur récupération unités:', unitesError)
      debugInfo.errors.push({ step: 1, error: unitesError })
      return { stats: [], debug: debugInfo }
    }
    
    debugLog(`✅ ${unites?.length || 0} unités département trouvées`)
    debugInfo.counts.unitesDepartement = unites?.length || 0
    
    if (!unites || unites.length === 0) {
      debugLog('⚠️ Aucune unité département trouvée')
      return { stats: [], debug: debugInfo }
    }
    
    // Afficher les premières unités pour debug
    if (unites.length > 0) {
      debugLog('Premières unités:', unites.slice(0, 3).map(u => ({
        id: u.id,
        nom: u.nom,
        reference_id: u.reference_id,
        id_niveau: u.id_niveau
      })))
    }
    
    // ÉTAPE 2: Récupérer les informations des paroisses, districts et conférences
    debugLog('ÉTAPE 2: Récupération des informations de localisation...')
    
    // Récupérer toutes les paroisses concernées
    const paroisseIds = [...new Set(unites.map(u => u.id_niveau).filter(Boolean))]
    debugLog(`Paroisse IDs à récupérer: ${paroisseIds.join(', ')}`)
    
    let paroisses: any[] = []
    if (paroisseIds.length > 0) {
      const { data, error: paroissesError } = await supabase
        .from('paroisse')
        .select(`
          id,
          nom,
          district_id,
          district:district_id (
            id,
            nom,
            conference_id,
            conference:conference_id (
              id,
              nom
            )
          )
        `)
        .in('id', paroisseIds)
      
      paroisses = data || []
      
      debugInfo.steps.push({ step: 2, action: 'fetch_paroisses', count: paroisses.length })
      
      if (paroissesError) {
        debugLog('❌ Erreur récupération paroisses:', paroissesError)
        debugInfo.errors.push({ step: 2, error: paroissesError })
      }
    }
    
    debugLog(`✅ ${paroisses.length} paroisses trouvées`)
    debugInfo.counts.paroisses = paroisses.length
    
    // Créer un map des paroisses pour un accès rapide
    const paroisseMap = new Map()
    paroisses.forEach(p => {
      const district = Array.isArray(p.district) ? p.district[0] : p.district
      const conference = district?.conference ? (Array.isArray(district.conference) ? district.conference[0] : district.conference) : null
      paroisseMap.set(p.id, {
        id: p.id,
        nom: p.nom,
        district_id: district?.id || null,
        district_nom: district?.nom || null,
        conference_id: conference?.id || null,
        conference_nom: conference?.nom || null
      })
    })
    
    // ÉTAPE 3: Construire les statistiques pour chaque unité
    debugLog('ÉTAPE 3: Construction des statistiques...')
    
    const stats: DepartementStats[] = []
    let processedCount = 0
    let skippedCount = 0
    
    for (const unite of unites) {
      const departementId = unite.reference_id
      const paroisseId = unite.id_niveau
      
      const paroisseInfo = paroisseMap.get(paroisseId)
      
      if (!paroisseInfo) {
        debugLog(`⚠️ Paroisse ${paroisseId} non trouvée pour l'unité ${unite.id}`)
        skippedCount++
        continue
      }
      
      // Appliquer les filtres supplémentaires
      if (conferenceFilter && paroisseInfo.conference_id !== parseInt(conferenceFilter)) {
        continue
      }
      
      if (districtFilter && paroisseInfo.district_id !== parseInt(districtFilter)) {
        continue
      }
      
      if (searchFilter) {
        const search = searchFilter.toLowerCase()
        const matchSearch = 
          unite.nom.toLowerCase().includes(search) ||
          paroisseInfo.nom?.toLowerCase().includes(search) ||
          paroisseInfo.district_nom?.toLowerCase().includes(search) ||
          paroisseInfo.conference_nom?.toLowerCase().includes(search)
        
        if (!matchSearch) {
          continue
        }
      }
      
      // Récupérer l'année en cours pour cette conférence
      let anneeConferenceId: number | null = null
      if (paroisseInfo.conference_id) {
        const { data: currentAnnee } = await supabase
          .from('annee_conference')
          .select('id')
          .eq('conference_id', paroisseInfo.conference_id)
          .eq('is_current', true)
          .maybeSingle()
        
        anneeConferenceId = currentAnnee?.id || null
      }
      
      debugLog(`  Traitement: ${unite.nom} (unité ${unite.id}, paroisse ${paroisseId})`)
      
      // Récupérer les plans d'action
      let planQuery = supabase
        .from('plan_action')
        .select('id, created_at, updated_at')
        .eq('unite_id', unite.id)
      
      if (anneeConferenceId) {
        planQuery = planQuery.eq('annee_conference_id', anneeConferenceId)
      }
      
      const { data: plans, error: plansError } = await planQuery.order('updated_at', { ascending: false })
      
      if (plansError) {
        debugLog(`    ❌ Erreur plans:`, plansError)
      }
      
      // Récupérer les activités
      let activitesQuery = supabase
        .from('activite')
        .select('id, statut, updated_at')
        .eq('unite_id', unite.id)
      
      if (anneeConferenceId) {
        activitesQuery = activitesQuery.eq('annee_conference_id', anneeConferenceId)
      }
      
      const { data: activites, error: activitesError } = await activitesQuery.order('updated_at', { ascending: false })
      
      if (activitesError) {
        debugLog(`    ❌ Erreur activités:`, activitesError)
      }
      
      // Récupérer les projets
      let projetsQuery = supabase
        .from('projet')
        .select('id, statut, updated_at')
        .eq('unite_id', unite.id)
      
      if (anneeConferenceId) {
        projetsQuery = projetsQuery.eq('annee_conference_id', anneeConferenceId)
      }
      
      const { data: projets, error: projetsError } = await projetsQuery.order('updated_at', { ascending: false })
      
      if (projetsError) {
        debugLog(`    ❌ Erreur projets:`, projetsError)
      }
      
      debugLog(`    Plans: ${plans?.length || 0}, Activités: ${activites?.length || 0}, Projets: ${projets?.length || 0}`)
      
      // Calculer le score de complétion
      let score = 0
      if (plans && plans.length > 0) score += 1
      if (activites && activites.length > 0) score += 1
      if (projets && projets.length > 0) score += 1
      
      const completionScore = (score / 3) * 100
      
      // Déterminer le statut
      let status: DepartementStats['status'] = 'vide'
      if (score === 3) status = 'complet'
      else if (score === 2) status = 'partiel'
      else if (score === 1) status = 'incomplet'
      
      stats.push({
        id: departementId,
        unite_id: unite.id,
        nom: unite.nom,
        paroisse_id: paroisseId,
        paroisse_nom: paroisseInfo.nom || 'N/A',
        district_id: paroisseInfo.district_id || 0,
        district_nom: paroisseInfo.district_nom || 'N/A',
        conference_id: paroisseInfo.conference_id || 0,
        conference_nom: paroisseInfo.conference_nom || 'N/A',
        
        hasPlanAction: (plans?.length || 0) > 0,
        planActionCount: plans?.length || 0,
        planActionLastUpdate: plans?.[0]?.updated_at || null,
        
        activitesCount: activites?.length || 0,
        activitesTerminees: activites?.filter(a => a.statut === 'termine').length || 0,
        activitesEnCours: activites?.filter(a => a.statut === 'en_cours').length || 0,
        activitesPlanifiees: activites?.filter(a => a.statut === 'planifie').length || 0,
        activitesLastUpdate: activites?.[0]?.updated_at || null,
        
        projetsCount: projets?.length || 0,
        projetsEnCours: projets?.filter(p => p.statut === 'en_cours').length || 0,
        projetsTermines: projets?.filter(p => p.statut === 'termine').length || 0,
        projetsLastUpdate: projets?.[0]?.updated_at || null,
        
        completionScore,
        status
      })
      
      processedCount++
    }
    
    debugLog(`=== FIN getPoliceStats ===`)
    debugLog(`Total unités: ${unites.length}, Traitées: ${processedCount}, Ignorées: ${skippedCount}`)
    debugInfo.steps.push({ step: 3, action: 'build_stats', processed: processedCount, skipped: skippedCount })
    debugInfo.counts.finalStats = stats.length
    
    return { stats, debug: debugInfo }
    
  } catch (error) {
    debugLog('❌ Exception getPoliceStats:', error)
    debugInfo.errors.push({ step: 'exception', error: String(error) })
    return { stats: [], debug: debugInfo }
  }
}

// Récupérer les conférences pour le filtre
async function getConferences() {
  const { data } = await supabase
    .from('conference')
    .select('id, nom')
    .order('nom')
  return data || []
}

// Récupérer les districts pour le filtre
async function getDistricts(conferenceId?: string) {
  let query = supabase
    .from('district')
    .select('id, nom, conference_id')
    .order('nom')
  
  if (conferenceId) {
    query = query.eq('conference_id', parseInt(conferenceId))
  }
  
  const { data } = await query
  return data || []
}

// Récupérer toutes les paroisses (pour le sélecteur)
async function getParoisses() {
  const { data } = await supabase
    .from('paroisse')
    .select('id, nom')
    .order('nom')
  return data || []
}

// Composant pour afficher une barre de progression
function ProgressBar({ value, color = 'blue' }: { value: number; color?: string }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400'
  }
  
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={`h-full ${colors[color as keyof typeof colors] || colors.blue} rounded-full transition-all`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
}

// Composant pour le badge de statut
function StatusBadge({ status }: { status: DepartementStats['status'] }) {
  const config = {
    complet: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Complet' },
    partiel: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Partiel' },
    incomplet: { icon: AlertCircle, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Incomplet' },
    vide: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Vide' }
  }
  
  const { icon: Icon, color, label } = config[status]
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs border rounded ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  )
}

export default async function PolicePage({ searchParams }: PageProps) {
  const search = (await searchParams) ?? {}
  const conferenceFilter = search.conference
  const districtFilter = search.district
  const searchFilter = search.search
  const showDebug = search.debug === 'true' || DEBUG
  const showAll = search.showAll === 'true'
  const urlParoisseFilter = search.paroisse ? parseInt(search.paroisse) : undefined
  
  // Récupérer les informations de l'utilisateur
  const userInfo = await getUserInfo()
  
  // Déterminer la paroisse à filtrer
  // Priorité: 1. URL (showAll=false) 2. Paroisse de l'utilisateur 3. URL explicite
  let effectiveParoisseFilter: number | undefined = undefined
  
  if (!showAll) {
    if (userInfo?.connected && userInfo.hasFidele && userInfo.paroisse_id) {
      // Utilisateur connecté avec paroisse -> filtrer par sa paroisse
      effectiveParoisseFilter = userInfo.paroisse_id
      debugLog('🎯 Filtrage automatique par paroisse utilisateur:', effectiveParoisseFilter)
    } else if (urlParoisseFilter) {
      // Paroisse spécifiée dans l'URL
      effectiveParoisseFilter = urlParoisseFilter
      debugLog('🎯 Filtrage par paroisse URL:', effectiveParoisseFilter)
    }
    // Si aucun filtre, on affiche tout (fallback)
  } else {
    debugLog('🌍 Mode "Voir tout" activé - affichage de toutes les paroisses')
  }
  
  // Récupérer les données
  const [
    { stats, debug: statsDebug },
    conferences,
    districts,
    paroisses
  ] = await Promise.all([
    getPoliceStats(
      effectiveParoisseFilter,
      conferenceFilter, 
      districtFilter, 
      searchFilter
    ),
    getConferences(),
    getDistricts(conferenceFilter),
    getParoisses()
  ])
  
  // Calculer les totaux globaux
  const totalStats = {
    departements: stats.length,
    complet: stats.filter(s => s.status === 'complet').length,
    partiel: stats.filter(s => s.status === 'partiel').length,
    incomplet: stats.filter(s => s.status === 'incomplet').length,
    vide: stats.filter(s => s.status === 'vide').length,
    avecPlanAction: stats.filter(s => s.hasPlanAction).length,
    avecActivites: stats.filter(s => s.activitesCount > 0).length,
    avecProjets: stats.filter(s => s.projetsCount > 0).length,
    scoreMoyen: stats.length > 0 
      ? Math.round(stats.reduce((sum, s) => sum + s.completionScore, 0) / stats.length)
      : 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec info utilisateur */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded">
                <Building2 size={20} className="text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-medium text-gray-900">
                  Tableau de bord de suivi
                </h1>
                <p className="text-sm text-gray-500">
                  Suivi des plans d&apos;action, activités et projets par département
                  {effectiveParoisseFilter && userInfo?.paroisse_nom && (
                    <span className="ml-2 text-black font-medium">
                      • {userInfo.paroisse_nom}
                    </span>
                  )}
                </p>
              </div>
            </div>
            
            {/* Info utilisateur */}
            <div className="flex items-center gap-4">
              {userInfo && userInfo.connected ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200">
                  <User size={16} className="text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {userInfo.nom_complet || 'Utilisateur'}
                    </div>
                    {userInfo.hasFidele && userInfo.paroisse_nom ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{userInfo.paroisse_nom}</span>
                        {userInfo.district_nom && (
                          <>
                            <span>•</span>
                            <span>{userInfo.district_nom}</span>
                          </>
                        )}
                      </div>
                    ) : userInfo.hasFidele ? (
                      <div className="text-xs text-gray-500">
                        {userInfo.role || 'Membre'}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        {userInfo.role || 'Utilisateur'} (sans paroisse)
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-yellow-50 border border-yellow-200">
                  <User size={16} className="text-yellow-600" />
                  <div>
                    <div className="text-sm font-medium text-yellow-800">
                      Visiteur
                    </div>
                    <div className="text-xs text-yellow-600">
                      Non connecté - Sélectionnez une paroisse
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="ml-2 px-3 py-1 bg-yellow-600 text-white text-xs hover:bg-yellow-700 transition-colors flex items-center gap-1"
                  >
                    <LogIn size={12} />
                    Se connecter
                  </Link>
                </div>
              )}
              
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <Home size={16} />
                Accueil
              </Link>
            </div>
          </div>
          
          {/* Barre de debug */}
          {showDebug && (
            <div className="mt-3 p-3 bg-gray-100 border border-gray-300 text-xs font-mono">
              <div className="flex items-center gap-2 mb-2">
                <Bug size={14} className="text-gray-600" />
                <span className="font-medium">Mode Debug Actif</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-500">Filtre paroisse:</span>{' '}
                  <span className="font-medium">{effectiveParoisseFilter || 'Aucun'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Unités trouvées:</span>{' '}
                  <span className="font-medium">{statsDebug.counts?.unitesDepartement || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Stats générées:</span>{' '}
                  <span className="font-medium">{statsDebug.counts?.finalStats || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Erreurs:</span>{' '}
                  <span className="font-medium text-red-600">{statsDebug.errors?.length || 0}</span>
                </div>
              </div>
              <div className="mt-2 text-gray-500">
                <span>User info: </span>
                <span>{userInfo && userInfo.connected ? '✅ Connecté' : '❌ Non connecté'}</span>
                {userInfo && userInfo.connected && (
                  <>
                    <span className="ml-4">Fidele: {userInfo.hasFidele ? '✅ Oui' : '❌ Non'}</span>
                    <span className="ml-4">Paroisse ID: {userInfo.paroisse_id || 'N/A'}</span>
                  </>
                )}
                <span className="ml-4">ShowAll: {showAll ? '✅ Oui' : '❌ Non'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Filtres */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <form className="flex flex-wrap items-end gap-4">
            {/* Sélecteur de paroisse - visible uniquement si showAll=true ou non connecté */}
            {(showAll || !userInfo?.connected || !userInfo?.hasFidele) && (
              <div className="w-56">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Paroisse
                </label>
                <select
                  name="paroisse"
                  defaultValue={effectiveParoisseFilter}
                  className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
                >
                  <option value="">Toutes les paroisses</option>
                  {paroisses.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Rechercher
              </label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  defaultValue={searchFilter}
                  placeholder="Département..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
                />
              </div>
            </div>
            
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Conférence
              </label>
              <select
                name="conference"
                defaultValue={conferenceFilter}
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
              >
                <option value="">Toutes</option>
                {conferences.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
            
            <div className="w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                District
              </label>
              <select
                name="district"
                defaultValue={districtFilter}
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:border-black focus:outline-none"
              >
                <option value="">Tous</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.nom}</option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Filter size={14} />
              Filtrer
            </button>
            
            {(conferenceFilter || districtFilter || searchFilter || urlParoisseFilter) && (
              <a
                href={showAll ? "/police?showAll=true" : "/police"}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Réinitialiser
              </a>
            )}
            
            {/* Bouton pour voir toutes les paroisses */}
            {userInfo?.connected && userInfo.hasFidele && (
              <a
                href={showAll ? "/police" : "/police?showAll=true"}
                className={`px-4 py-2 text-sm border transition-colors flex items-center gap-2 ${
                  showAll 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'bg-white text-gray-600 border-gray-300 hover:border-black'
                }`}
              >
                <Eye size={14} />
                {showAll ? 'Ma paroisse' : 'Voir toutes les paroisses'}
              </a>
            )}
            
            <a
              href={`/police?debug=${!showDebug}${showAll ? '&showAll=true' : ''}${conferenceFilter ? `&conference=${conferenceFilter}` : ''}${districtFilter ? `&district=${districtFilter}` : ''}${searchFilter ? `&search=${searchFilter}` : ''}`}
              className={`px-4 py-2 text-sm border transition-colors flex items-center gap-2 ${
                showDebug 
                  ? 'bg-gray-800 text-white border-gray-800' 
                  : 'bg-white text-gray-600 border-gray-300 hover:border-black'
              }`}
            >
              <Bug size={14} />
              {showDebug ? 'Masquer Debug' : 'Debug'}
            </a>
          </form>
        </div>
        
        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-3">
            <div className="text-2xl font-light">{totalStats.departements}</div>
            <div className="text-xs text-gray-500">Départements</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-2xl font-light text-green-700">{totalStats.complet}</div>
            <div className="text-xs text-green-600">Complets</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3">
            <div className="text-2xl font-light text-yellow-700">{totalStats.partiel}</div>
            <div className="text-xs text-yellow-600">Partiels</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3">
            <div className="text-2xl font-light text-orange-700">{totalStats.incomplet}</div>
            <div className="text-xs text-orange-600">Incomplets</div>
          </div>
          <div className="bg-red-50 border border-red-200 p-3">
            <div className="text-2xl font-light text-red-700">{totalStats.vide}</div>
            <div className="text-xs text-red-600">Vides</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3">
            <div className="text-2xl font-light text-blue-700">{totalStats.avecPlanAction}</div>
            <div className="text-xs text-blue-600">Avec plan</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 p-3">
            <div className="text-2xl font-light text-purple-700">{totalStats.avecActivites}</div>
            <div className="text-xs text-purple-600">Avec activités</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 p-3">
            <div className="text-2xl font-light text-indigo-700">{totalStats.avecProjets}</div>
            <div className="text-xs text-indigo-600">Avec projets</div>
          </div>
        </div>
        
        {/* Score global */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Score de complétion global</span>
            <span className="text-sm font-medium text-gray-900">{totalStats.scoreMoyen}%</span>
          </div>
          <ProgressBar value={totalStats.scoreMoyen} color="blue" />
        </div>
        
        {/* Tableau des départements */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Département
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Paroisse
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Score
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    <FileText size={14} className="inline mr-1" />
                    Plans
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    <Calendar size={14} className="inline mr-1" />
                    Activités
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    <Target size={14} className="inline mr-1" />
                    Projets
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Dernière MAJ
                  </th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-400">
                        {effectiveParoisseFilter 
                          ? "Aucun département trouvé pour cette paroisse" 
                          : "Aucun département trouvé"}
                      </p>
                      {showDebug && (
                        <details className="mt-4 text-left max-w-lg mx-auto">
                          <summary className="cursor-pointer text-xs text-gray-500">Debug Info</summary>
                          <pre className="mt-2 p-3 bg-gray-100 text-xs overflow-auto max-h-60 text-left">
                            {JSON.stringify(statsDebug, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                  </tr>
                ) : (
                  stats.map((dept) => (
                    <tr key={dept.unite_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{dept.nom}</div>
                        {showDebug && (
                          <div className="text-xs text-gray-400 mt-1">
                            Unité: {dept.unite_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-600">{dept.paroisse_nom}</div>
                        <div className="text-xs text-gray-400">
                          {dept.district_nom}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={dept.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-24 mx-auto">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">{Math.round(dept.completionScore)}%</span>
                          </div>
                          <ProgressBar 
                            value={dept.completionScore} 
                            color={
                              dept.status === 'complet' ? 'green' :
                              dept.status === 'partiel' ? 'yellow' :
                              dept.status === 'incomplet' ? 'orange' : 'red'
                            }
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center">
                          {dept.hasPlanAction ? (
                            <>
                              <span className="text-green-600 font-medium">{dept.planActionCount}</span>
                              <span className="text-xs text-gray-400">plan(s)</span>
                            </>
                          ) : (
                            <span className="text-red-500 text-xs">Aucun</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center">
                          {dept.activitesCount > 0 ? (
                            <>
                              <span className="font-medium">{dept.activitesCount}</span>
                              <div className="flex gap-1 text-xs">
                                <span className="text-green-600">{dept.activitesTerminees}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-yellow-600">{dept.activitesEnCours}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-blue-600">{dept.activitesPlanifiees}</span>
                              </div>
                              <span className="text-xs text-gray-400">T / EC / P</span>
                            </>
                          ) : (
                            <span className="text-red-500 text-xs">Aucune</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col items-center">
                          {dept.projetsCount > 0 ? (
                            <>
                              <span className="font-medium">{dept.projetsCount}</span>
                              <div className="flex gap-1 text-xs">
                                <span className="text-yellow-600">{dept.projetsEnCours}</span>
                                <span className="text-gray-300">|</span>
                                <span className="text-green-600">{dept.projetsTermines}</span>
                              </div>
                              <span className="text-xs text-gray-400">EC / T</span>
                            </>
                          ) : (
                            <span className="text-red-500 text-xs">Aucun</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs text-gray-500 text-center">
                          {dept.planActionLastUpdate || dept.activitesLastUpdate || dept.projetsLastUpdate ? (
                            (() => {
                              const dates = [
                                dept.planActionLastUpdate,
                                dept.activitesLastUpdate,
                                dept.projetsLastUpdate
                              ].filter(Boolean) as string[]
                              const latest = dates.sort().reverse()[0]
                              return new Date(latest).toLocaleDateString('fr-FR')
                            })()
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/paroisse/departements/${dept.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          Voir
                          <ChevronRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Légende */}
        <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Complet (3/3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Partiel (2/3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Incomplet (1/3)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Vide (0/3)</span>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-green-600">T</span>
            <span>= Terminé</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">EC</span>
            <span>= En cours</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600">P</span>
            <span>= Planifié</span>
          </div>
        </div>
      </div>
    </div>
  )
}