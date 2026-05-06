
// app/admin/fideles/page.tsx
import { getFideles } from '@/actions/fidele'
import { getUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { getParoisses, getRoles } from '@/actions/structures'
import AdminFidelesClient from './AdminFidelesClient'

export default async function AdminFidelesPage() {
  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  const fideles = await getFideles()
  const paroisses = await getParoisses()
  const allRoles = await getRoles()

  // Statistiques globales
  const stats = {
    total: fideles.length,
    actifs: fideles.filter(f => f.actif).length,
    inactifs: fideles.filter(f => !f.actif).length,
    hommes: fideles.filter(f => f.sexe === 'M').length,
    femmes: fideles.filter(f => f.sexe === 'F').length,
  }

  return (
    <div className="max-w-7xl ">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Fidèles</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestion des membres de l'église
            </p>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="bg-white -lg border border-gray-100 px-4 py-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Total fidèles</div>
            <div className="text-xl font-light text-gray-900 mt-1">{stats.total}</div>
          </div>
          <div className="bg-white -lg border border-gray-100 px-4 py-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Actifs</div>
            <div className="text-xl font-light text-green-600 mt-1">{stats.actifs}</div>
          </div>
          <div className="bg-white -lg border border-gray-100 px-4 py-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Inactifs</div>
            <div className="text-xl font-light text-gray-500 mt-1">{stats.inactifs}</div>
          </div>
          <div className="bg-white -lg border border-gray-100 px-4 py-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Hommes</div>
            <div className="text-xl font-light text-blue-600 mt-1">{stats.hommes}</div>
          </div>
          <div className="bg-white -lg border border-gray-100 px-4 py-3">
            <div className="text-xs text-gray-400 uppercase tracking-wider">Femmes</div>
            <div className="text-xl font-light text-pink-600 mt-1">{stats.femmes}</div>
          </div>
        </div>
      </div>

      {/* Client Component avec toute l'interactivité */}
      <AdminFidelesClient 
        fideles={fideles}
        paroisses={paroisses}
        allRoles={allRoles}
      />
    </div>
  )
}