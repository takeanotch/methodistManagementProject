// app/cabinet/page.tsx
import { redirect } from 'next/navigation'
import { getUser, getCurrentFidele } from '@/actions/auth'
import { getMembresCabinet, getRolesCabinet } from '@/actions/cabinet-pastoral'
import { getFidelesByParoisse } from '@/actions/fidele'
import { getCurrentAnneeConference, getAnneesByConference } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import CabinetMembresClient from './CabinetMembresClient'

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

  const anneeConferenceSelectionnee = anneesConference.find(a => a.id === anneeConferenceSelectionneeId)

  const anneesSimplifiees = anneesConference.map(ac => ({
    id: ac.id,
    label: ac.annee?.label || '',
    is_current: ac.is_current
  }))

  // Calculer les statistiques simples
  const stats = {
    total: membres.length,
    actifs: membres.filter(m => m.est_actif).length,
    inactifs: membres.filter(m => !m.est_actif).length,
  }

  const paroisse = currentFidele.paroisse
  const dashboardPath = user.role?.nom === 'admin' ? '/admin' : '/gestion'

  // Vérifier si l'utilisateur peut gérer (admin ou président/secrétaire du cabinet)
  const estMembreCabinet = membres.some(m => m.fidele_id === currentFidele.id && m.est_actif)
  const aRoleGestion = membres.some(m => 
    m.fidele_id === currentFidele.id && 
    m.est_actif && 
    (m.role_nom === 'cabinet_pastoral' || m.role_nom === 'secretaire_cabinet')
  )
  const peutGerer = user.role?.nom === 'cabinet_pastoral' || aRoleGestion

  return (
    <div className=" max-w-7xl mx-auto">
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
              Membres du cabinet pastoral de la paroisse
            </p>
          </div>
        </div>
      </div>

      {/* Stats simples */}
      <div className="grid grid-cols-3 gap-3 mb-6">
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
      </div>

      {/* Info si l'utilisateur n'est pas membre du cabinet */}
      {!estMembreCabinet && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 text-sm">
          Vous n'êtes pas membre du cabinet pastoral. Vous pouvez consulter la liste des membres.
        </div>
      )}

      {/* Client Component */}
      <CabinetMembresClient 
        membres={membres}
        fideles={fideles}
        roles={roles}
        currentParoisseId={currentFidele.paroisse_id}
        currentParoisseNom={paroisse?.nom}
        anneeSelectionneeId={anneeConferenceSelectionneeId}
        anneesDisponibles={anneesSimplifiees}
        peutGerer={peutGerer}
      />
    </div>
  )
}