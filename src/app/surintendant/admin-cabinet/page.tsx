// app/cabinet/page.tsx
import { redirect } from 'next/navigation'
import { getUser, getCurrentFidele } from '@/actions/auth'
import { getMembresCabinet, getRolesCabinet, getCabinetDataForParoisse } from '@/actions/cabinet-pastoral'
import { getFidelesByParoisse } from '@/actions/fidele'
import { getCurrentAnneeConference, getAnneesByConference } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import CabinetClient from './CabinetClient'

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

export default async function CabinetPage(props: {
  searchParams?: Promise<{ annee_conference?: string }>
}) {
  const searchParams = await props.searchParams || {}
  
  const user = await getUser()
  const currentFidele = await getCurrentFidele()

  if (!user) {
    redirect('/login')
  }

  if (!currentFidele?.paroisse_id) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-yellow-400">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-light text-yellow-800 mb-2">Paroisse non définie</h2>
          <p className="text-sm text-yellow-600 mb-6">
            Vous n'êtes pas rattaché à une paroisse. Contactez un administrateur.
          </p>
          <Link
            href="/profile"
            className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
          >
            Voir mon profil
          </Link>
        </div>
      </div>
    )
  }

  // Récupérer la conférence de la paroisse
  const conference = await getConferenceFromParoisse(currentFidele.paroisse_id)
  
  let anneesConference: any[] = []
  let currentAnneeConference: any = null
  
  if (conference?.id) {
    anneesConference = await getAnneesByConference(conference.id)
    currentAnneeConference = await getCurrentAnneeConference(conference.id)
  }
  
  // Déterminer l'année de conférence sélectionnée
  let anneeConferenceSelectionneeId: number | undefined
  if (searchParams.annee_conference) {
    anneeConferenceSelectionneeId = parseInt(searchParams.annee_conference)
  } else if (currentAnneeConference?.id) {
    anneeConferenceSelectionneeId = currentAnneeConference.id
  }

  // Récupérer les membres du cabinet
  const membres = await getMembresCabinet(currentFidele.paroisse_id)
  
  // Récupérer les rôles disponibles
  const roles = await getRolesCabinet()
  
  // Récupérer les fidèles de la paroisse (pour l'ajout de membres)
  const fideles = await getFidelesByParoisse(
    currentFidele.paroisse_id, 
    anneeConferenceSelectionneeId
  )
  
  // Récupérer les données complètes du cabinet (activités, budget, etc.)
  const cabinetData = await getCabinetDataForParoisse(
    currentFidele.paroisse_id,
    anneeConferenceSelectionneeId
  )

  const anneeConferenceSelectionnee = anneesConference.find(a => a.id === anneeConferenceSelectionneeId)

  const anneesSimplifiees = anneesConference.map(ac => ({
    id: ac.id,
    label: ac.annee?.label || '',
    is_current: ac.is_current
  }))

  // Calculer les statistiques
  const stats = {
    total: membres.length,
    actifs: membres.filter(m => m.est_actif).length,
    inactifs: membres.filter(m => !m.est_actif).length,
    avecRole: membres.filter(m => m.role_id).length,
    sansRole: membres.filter(m => !m.role_id).length,
  }

  const paroisse = currentFidele.paroisse
  const dashboardPath = user.role?.nom === 'admin' ? '/admin' : '/gestion'

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
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
              <span>Paroisse {paroisse?.nom}</span>
            </div>
            <h1 className="text-2xl font-light tracking-wide">Cabinet Pastoral</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestion du cabinet pastoral de la paroisse
            </p>
          </div>
        </div>
      </div>

      {/* Navigation secondaire */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Membres du cabinet
        </span>
        <Link
          href="/cabinet/activites"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black transition-colors"
        >
          Activités
        </Link>
        <Link
          href="/cabinet/budget"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black transition-colors"
        >
          Budget
        </Link>
        <Link
          href="/cabinet/projets"
          className="px-1 py-3 text-sm text-gray-500 hover:text-black transition-colors"
        >
          Projets
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="text-xl font-light">{stats.total}</div>
          <div className="text-xs text-gray-500">Total membres</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-3">
          <div className="text-xl font-light text-green-700">{stats.actifs}</div>
          <div className="text-xs text-green-600">Membres actifs</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-3">
          <div className="text-xl font-light text-gray-700">{stats.inactifs}</div>
          <div className="text-xs text-gray-500">Membres inactifs</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3">
          <div className="text-xl font-light text-blue-700">{stats.avecRole}</div>
          <div className="text-xs text-blue-600">Avec rôle défini</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-3">
          <div className="text-xl font-light text-orange-700">{stats.sansRole}</div>
          <div className="text-xs text-orange-600">Sans rôle défini</div>
        </div>
      </div>

      {/* Résumé des activités */}
      {cabinetData && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Activités</div>
            <div className="text-2xl font-light">{cabinetData.activites?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {cabinetData.activitesRecentes?.length || 0} récentes • {cabinetData.activitesProchaines?.length || 0} à venir
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Plans d'action</div>
            <div className="text-2xl font-light">{cabinetData.plansAction?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              Pour l'année {anneeConferenceSelectionnee?.annee?.label || 'en cours'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Projets</div>
            <div className="text-2xl font-light">{cabinetData.projets?.length || 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              {cabinetData.projetsStats?.enCours || 0} en cours • {cabinetData.projetsStats?.termines || 0} terminés
            </div>
          </div>
        </div>
      )}

      {/* Client Component */}
      <CabinetClient 
        membres={membres}
        fideles={fideles}
        roles={roles}
        userRole={user.role?.nom}
        currentParoisseId={currentFidele.paroisse_id}
        currentParoisseNom={paroisse?.nom}
        anneeActuelleId={currentAnneeConference?.id}
        anneeActuelleLabel={currentAnneeConference?.annee?.label}
        anneesDisponibles={anneesSimplifiees}
        anneeSelectionneeId={anneeConferenceSelectionneeId}
        cabinetData={cabinetData}
      />
    </div>
  )
}