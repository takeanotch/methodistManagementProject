
import { supabase } from '@/lib/supabase'
import { getUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function AdminPage() {
  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  // Récupérer tous les utilisateurs
  const { data: users } = await supabase
    .from('compte')
    .select('*, role:role_id(nom)')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête minimaliste */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900">Utilisateurs</h1>
        <p className="text-sm text-gray-500 mt-1">
          {users?.length} utilisateur(s) enregistré(s)
        </p>
      </div>

      {/* Tableau minimaliste */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-50">
          <thead>
            <tr className="bg-gray-50/50">
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Utilisateur
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Rôle
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Inscription
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users?.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {/* Photo de profil */}
                    <div className="relative flex-shrink-0">
                      {user.profile_img ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-100">
                          <Image
                            src={user.profile_img}
                            alt={user.nom_complet}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-100">
                          <span className="text-sm font-medium text-gray-400">
                            {user.nom_complet?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Nom */}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.nom_complet}
                      </div>
                      <div className="text-xs text-gray-400">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600">
                    {user.numero}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role?.nom === 'admin' 
                      ? 'bg-gray-100 text-gray-700' 
                      : 'bg-gray-50 text-gray-500'
                  }`}>
                    {user.role?.nom}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">
                    {new Date(user.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* État vide */}
        {(!users || users.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-300 text-sm">
              Aucun utilisateur pour le moment
            </div>
          </div>
        )}
      </div>

      {/* Footer minimaliste */}
      <div className="mt-4 text-xs text-gray-300 text-right">
        {new Date().toLocaleDateString()}
      </div>
    </div>
  )
}