
'use client'

import { useState, useEffect } from 'react'
import { 
  getRoles, createRole, updateRole, deleteRole, 
  Role, RoleNiveau 
} from '@/actions/structures'
import toast from 'react-hot-toast'
import Link from 'next/link'

type ActiveTab = 'region' | 'conference' | 'district' | 'paroisse'

const niveauLabels = {
  region: 'Région',
  conference: 'Conférence',
  district: 'District',
  paroisse: 'Paroisse'
}

const niveauColors = {
  region: 'text-purple-600',
  conference: 'text-blue-600',
  district: 'text-green-600',
  paroisse: 'text-gray-600'
}

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('paroisse')
  const [roles, setRoles] = useState<Role[]>([])
  const [stats, setStats] = useState({
    region: 0,
    conference: 0,
    district: 0,
    paroisse: 0
  })
  
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({ nom: '' })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Charger les rôles
  useEffect(() => {
    loadRoles()
  }, [])

  async function loadRoles() {
    const data = await getRoles()
    setRoles(data)
    
    // Calculer les stats par niveau
    const newStats = {
      region: data.filter(r => r.niveau === 'region').length,
      conference: data.filter(r => r.niveau === 'conference').length,
      district: data.filter(r => r.niveau === 'district').length,
      paroisse: data.filter(r => r.niveau === 'paroisse').length
    }
    setStats(newStats)
  }

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role)
      setFormData({ nom: role.nom })
    } else {
      setEditingRole(null)
      setFormData({ nom: '' })
    }
    setShowModal(true)
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nom.trim()) {
      setMessage({ type: 'error', text: 'Le nom du rôle est requis' })
      return
    }

    const roleData = {
      nom: formData.nom.toLowerCase().trim().replace(/\s+/g, '_'),
      niveau: activeTab
    }

    let result
    if (editingRole) {
      result = await updateRole(editingRole.id, roleData)
    } else {
      result = await createRole(roleData)
    }

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `${
        editingRole ? 'Modification' : 'Création'
      } effectuée avec succès` })
      
      // Rafraîchir les données
      setTimeout(async () => {
        await loadRoles()
        setShowModal(false)
        setMessage(null)
      }, 1000)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) return

    const result = await deleteRole(id)

    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Suppression effectuée avec succès' })
      
      // Rafraîchir les données
      setTimeout(async () => {
        await loadRoles()
        setMessage(null)
      }, 1000)
    }
  }

  const getRolesByActiveTab = () => {
    return roles.filter(role => role.niveau === activeTab)
  }

  const tabs = [
    { id: 'region', label: 'Régions', count: stats.region },
    { id: 'conference', label: 'Conférences', count: stats.conference },
    { id: 'district', label: 'Districts', count: stats.district },
    { id: 'paroisse', label: 'Paroisses', count: stats.paroisse }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-900">Gestion des rôles</h1>
          <Link
            href="/admin/management"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Retour aux structures
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Gérer les rôles disponibles pour chaque niveau hiérarchique
        </p>
      </div>

      {/* Message de notification */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-100 mb-6">
        <nav className="flex gap-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`pb-4 px-1 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              <span className="ml-2 text-xs text-gray-300">
                ({tab.count})
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Barre d'action */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
        >
          + Nouveau rôle
        </button>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-50">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nom du rôle
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nom technique
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Niveau
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Date création
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {getRolesByActiveTab().map((role) => (
              <tr key={role.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {role.nom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 font-mono">
                    {role.nom}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`text-sm ${niveauColors[role.niveau]}`}>
                    {niveauLabels[role.niveau]}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-400">
                    {new Date(role.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleOpenModal(role)}
                    className="text-gray-400 hover:text-gray-600 text-sm mr-4 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="text-gray-300 hover:text-red-400 text-sm transition-colors"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}

            {getRolesByActiveTab().length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <div className="text-gray-300 text-sm">
                    Aucun rôle pour ce niveau
                  </div>
                  <button
                    onClick={() => handleOpenModal()}
                    className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Créer le premier rôle
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-light text-gray-900 mb-4">
              {editingRole ? 'Modifier' : 'Nouveau'} rôle ({niveauLabels[activeTab]})
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Nom du rôle
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="Président, Secrétaire, Trésorier..."
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Sera converti en : {formData.nom.toLowerCase().replace(/\s+/g, '_')}
                  </p>
                </div>

                <div className="bg-gray-50/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <span>Niveau :</span>
                    <span className={`text-sm ${niveauColors[activeTab]}`}>
                      {niveauLabels[activeTab]}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
                >
                  {editingRole ? 'Modifier' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-xs text-gray-300 text-right">
        Total : {roles.length} rôle{roles.length > 1 ? 's' : ''}
      </div>
    </div>
  )
}