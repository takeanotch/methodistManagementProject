

'use client'

import { createDepartement } from '@/actions/departements'
import { updateDepartement } from '@/actions/departements'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Role {
  nom: string
  label: string
  niveau: number
  couleur: string
}

interface NouveauDepartementModalProps {
  isOpen: boolean
  onClose: () => void
  departement?: {
    id: number
    nom: string
    type: string
    description: string | null
    roles_config: Role[]
  }
  onSuccess?: () => void
}

export default function NouveauDepartementModal({ isOpen, onClose, departement, onSuccess }: NouveauDepartementModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([
    { nom: 'president', label: 'Président', niveau: 1, couleur: '#ef4444' },
    { nom: 'vice_president', label: 'Vice-président', niveau: 2, couleur: '#f97316' },
    { nom: 'secretaire', label: 'Secrétaire', niveau: 3, couleur: '#3b82f6' },
    { nom: 'tresorier', label: 'Trésorier', niveau: 3, couleur: '#10b981' },
    { nom: 'membre', label: 'Membre', niveau: 4, couleur: '#6b7280' }
  ])

  const [showRoleForm, setShowRoleForm] = useState(false)
  const [editingRole, setEditingRole] = useState<number | null>(null)
  const [selectedType, setSelectedType] = useState<string>('')
  const [newRole, setNewRole] = useState<Partial<Role>>({
    nom: '',
    label: '',
    niveau: 4,
    couleur: '#6b7280'
  })

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (departement) {
      setSelectedType(departement.type)
      if (departement.roles_config && departement.roles_config.length > 0) {
        setRoles(departement.roles_config)
      }
    } else {
      setSelectedType('')
      setRoles([
        { nom: 'president', label: 'Président', niveau: 1, couleur: '#ef4444' },
        { nom: 'vice_president', label: 'Vice-président', niveau: 2, couleur: '#f97316' },
        { nom: 'secretaire', label: 'Secrétaire', niveau: 3, couleur: '#3b82f6' },
        { nom: 'tresorier', label: 'Trésorier', niveau: 3, couleur: '#10b981' },
        { nom: 'membre', label: 'Membre', niveau: 4, couleur: '#6b7280' }
      ])
    }
  }, [departement])

  // Empêcher le scroll quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault()
//     setIsLoading(true)

//     const formData = new FormData(e.currentTarget)
    
//     // Ajouter les rôles au formData
//     roles.forEach((role) => {
//       formData.append(`roles_nom[]`, role.nom)
//       formData.append(`roles_label[]`, role.label)
//       formData.append(`roles_niveau[]`, role.niveau.toString())
//       formData.append(`roles_couleur[]`, role.couleur)
//     })

//     try {
//       let result
      
//       if (departement) {
//         // Mode édition
//         result = await updateDepartement(departement.id, formData)
//       } else {
//         // Mode création
//         result = await createDepartement(formData)
//       }
      
//       if (result.error) {
//         toast.error(result.error)
//       } else {
//         toast.success(departement ? 'Département modifié avec succès' : 'Département créé avec succès')
//         onSuccess?.()
//         onClose()
//         router.refresh()
//       }
//     } catch (error) {
//       toast.error('Une erreur est survenue')
//     } finally {
//       setIsLoading(false)
//     }
//   }

async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setIsLoading(true)

  const formData = new FormData(e.currentTarget)
  
  // Ajouter l'ID du département en mode édition
  if (departement) {
    formData.append('id', departement.id.toString())
  }
  
  // Ajouter les rôles au formData
  roles.forEach((role) => {
    formData.append(`roles_nom[]`, role.nom)
    formData.append(`roles_label[]`, role.label)
    formData.append(`roles_niveau[]`, role.niveau.toString())
    formData.append(`roles_couleur[]`, role.couleur)
  })

  try {
    let result
    
    if (departement) {
      // Mode édition - utiliser updateDepartement avec un seul paramètre
      result = await updateDepartement(formData)
    } else {
      // Mode création
      result = await createDepartement(formData)
    }
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(departement ? 'Département modifié avec succès' : 'Département créé avec succès')
      onSuccess?.()
      onClose()
      router.refresh()
    }
  } catch (error) {
    console.error('Erreur:', error)
    toast.error('Une erreur est survenue')
  } finally {
    setIsLoading(false)
  }
}

  const handleAddRole = () => {
    if (!newRole.nom || !newRole.label) {
      toast.error('Le nom et le label sont requis')
      return
    }

    const roleToAdd: Role = {
      nom: newRole.nom.toLowerCase().replace(/\s+/g, '_'),
      label: newRole.label,
      niveau: newRole.niveau || 4,
      couleur: newRole.couleur || '#6b7280'
    }

    if (editingRole !== null) {
      const updatedRoles = [...roles]
      updatedRoles[editingRole] = roleToAdd
      setRoles(updatedRoles)
      setEditingRole(null)
    } else {
      setRoles([...roles, roleToAdd])
    }
    
    setShowRoleForm(false)
    setNewRole({ nom: '', label: '', niveau: 4, couleur: '#6b7280' })
  }

  const handleEditRole = (index: number) => {
    setEditingRole(index)
    setNewRole(roles[index])
    setShowRoleForm(true)
  }

  const handleDeleteRole = (index: number) => {
    if (roles[index].nom === 'membre') {
      toast.error('Le rôle "membre" ne peut pas être supprimé')
      return
    }
    setRoles(roles.filter((_, i) => i !== index))
  }

  const types = [
    { value: 'commite', label: 'Comité', description: 'Département de type comité avec rôles de direction' },
    { value: 'agence_programme', label: 'Agence/Programme', description: 'Département de type agence ou programme' },
    { value: 'departement', label: 'Département', description: 'Département standard de l\'organisation' },
    { value: 'normal', label: 'Normal', description: 'Département standard' }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-light text-gray-900">
              {departement ? 'Modifier le département' : 'Nouveau département'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {departement ? 'Modifier les informations du département' : 'Créer un nouveau département et définir ses rôles'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corps */}
        <div className="overflow-y-auto flex-1 p-6">
          <form id="departement-form" onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Informations générales</h3>
                
                <div>
                  <label htmlFor="nom" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Nom du département <span className="text-red-300">*</span>
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    defaultValue={departement?.nom || ''}
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="Ex: Jeunes Ambassadeurs"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Type <span className="text-red-300">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50"
                  >
                    <option value="">Sélectionner un type</option>
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {selectedType && (
                    <p className="text-xs text-gray-400 mt-1">
                      {types.find(t => t.value === selectedType)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={departement?.description || ''}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none disabled:bg-gray-50"
                    placeholder="Description du département (optionnel)"
                  />
                </div>
              </div>

              {/* Configuration des rôles */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Rôles du département</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRole(null)
                      setNewRole({ nom: '', label: '', niveau: 4, couleur: '#6b7280' })
                      setShowRoleForm(true)
                    }}
                    disabled={isLoading}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un rôle
                  </button>
                </div>

                {/* Liste des rôles */}
                <div className="space-y-2">
                  {roles.map((role, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3"
                          style={{ backgroundColor: role.couleur }}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-700">{role.label}</span>
                          <span className="text-xs text-gray-400 ml-2">({role.nom})</span>
                        </div>
                        <span className="text-xs text-gray-400">Niveau {role.niveau}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditRole(index)}
                          disabled={isLoading}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {role.nom !== 'membre' && (
                          <button
                            type="button"
                            onClick={() => handleDeleteRole(index)}
                            disabled={isLoading}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Pied */}
        <div className="border-t border-gray-100 px-6 py-4 flex gap-3 flex-shrink-0">
          <button
            type="submit"
            form="departement-form"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (departement ? 'Modification...' : 'Création...') : (departement ? 'Modifier le département' : 'Créer le département')}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 text-sm hover:text-gray-600 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>

      {/* Modal pour ajouter/éditer un rôle */}
      {showRoleForm && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowRoleForm(false)}
        >
          <div 
            className="bg-white w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-light text-gray-900 mb-4">
              {editingRole !== null ? 'Modifier le rôle' : 'Ajouter un rôle'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Nom technique <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  value={newRole.nom}
                  onChange={(e) => setNewRole({ ...newRole, nom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="responsable_adjoint"
                />
                <p className="text-xs text-gray-400 mt-1">Sans espaces, en minuscules</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Label <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  value={newRole.label}
                  onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Responsable adjoint"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Niveau (1 = plus élevé)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={newRole.niveau}
                  onChange={(e) => setNewRole({ ...newRole, niveau: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Couleur
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newRole.couleur}
                    onChange={(e) => setNewRole({ ...newRole, couleur: e.target.value })}
                    className="w-12 h-10 border border-gray-200"
                  />
                  <input
                    type="text"
                    value={newRole.couleur}
                    onChange={(e) => setNewRole({ ...newRole, couleur: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400"
                    placeholder="#6b7280"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleAddRole}
                  className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors"
                >
                  {editingRole !== null ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleForm(false)
                    setEditingRole(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 text-sm hover:text-gray-600 hover:border-gray-300 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}