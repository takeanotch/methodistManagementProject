
import { supabase } from '@/lib/supabase'
import { getUser } from '@/actions/auth'
import { getComptes, getRoles, getComptesStats } from '@/actions/compte'
import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import ComptesList from './ComptesList'

export default async function AdminComptesPage() {
  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  // Récupérer les comptes, les rôles et les statistiques en parallèle
  const [comptes, roles, stats] = await Promise.all([
    getComptes(),
    getRoles(),
    getComptesStats()
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Gestion des comptes</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {comptes?.length || 0} compte{comptes?.length > 1 ? 's' : ''} enregistré{comptes?.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="border border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Administrateurs :</span>
                <span className="font-medium">{stats.admins}</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <span className="text-gray-500">Gestionnaires :</span>
                <span className="font-medium">{stats.gestionnaires || 0}</span>
              </div> */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Utilisateurs :</span>
                <span className="font-medium">{stats.users}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Actifs :</span>
                <span className="font-medium text-green-600">{stats.actifs}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Inactifs :</span>
                <span className="font-medium text-gray-400">{stats.inactifs || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Liste des comptes */}
      <ComptesList comptes={comptes || []} roles={roles || []} />

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-300 text-right">
        Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
      </div>
    </div>
  )
}