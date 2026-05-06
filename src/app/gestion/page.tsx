import { getUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/dashboards/AdminDashboard'
import ParoisseDashboard from '@/components/dashboards/ParoisseDashboard'
import Role6Dashboard from '@/components/dashboards/Role6Dashboard'
import Role8Dashboard from '@/components/dashboards/Role8Dashboard'
import ChefConferenceDashboard from '@/components/dashboards/Role7Dashboard'
import ChefDepartementConferenceDashboard from '@/components/dashboards/ChefDepartementConference'
// Dashboard par défaut pour les autres rôles
function DefaultDashboard({ roleNom }: { roleNom: string }) {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="bg-white rounded-lg border border-gray-100 p-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-light text-gray-900 mb-2">
          Espace {roleNom}
        </h2>
        <p className="text-gray-400 mb-6">
          Votre tableau de bord est en cours de configuration
        </p>
        <div className="text-sm text-gray-500">
          Rôle ID: {roleNom}
        </div>
      </div>
    </div>
  )
}

export default async function GestionPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  // Récupérer le rôle de l'utilisateur
  const roleId = user.role_id
  const roleNom = user.role?.nom || `Rôle ${roleId}`

  // Sélectionner le dashboard approprié selon le rôle
  const renderDashboard = () => {
    switch(roleId) {
      case 1:
        return <AdminDashboard />
      case 4:
        return <ChefConferenceDashboard />
      case 9:
        return <ParoisseDashboard />
      case 6:
        return <ParoisseDashboard/>
      case 5:
        return <ChefDepartementConferenceDashboard/>
      case 7:
        return <ChefConferenceDashboard />
      case 8:
        return <ParoisseDashboard />
      default:
        return <DefaultDashboard roleNom={roleNom} />
    }
  }

  return (
    <div className="min-h-screen ">
      {/* Barre de navigation contextuelle */}
      {/* <div className="bg-white border-b border-gray-100  z-10">
        <div className="max-w-7xl mx-auto  py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Espace de gestion</span>
              <span className="text-gray-200">|</span>
              <span className="text-sm font-medium text-gray-700">
                {roleNom}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400">
                Connecté en tant que {user.nom_complet}
              </span>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {user.nom_complet?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto  py-4">
        {renderDashboard()}
      </div>
    </div>
  )
}