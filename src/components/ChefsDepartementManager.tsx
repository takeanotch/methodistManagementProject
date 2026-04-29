// components/admin/chefs/ChefsDepartementManager.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { 
  ajouterChefDepartement, 
  retirerChefDepartement, 
  updateChefRole,
  searchFidelesDisponibles,
  getRolesDisponiblesPourDistrict,
  ChefDepartement 
} from '@/actions/chef-departement'
import { 
  ajouterChefDepartementConference, 
  retirerChefDepartementConference, 
  updateChefRoleConference,
  searchFidelesDisponiblesPourConference,
  getRolesDisponiblesPourConference,
  ChefDepartementConference 
} from '@/actions/chef-departement-conference'
import { Departement } from '@/actions/departements'
import { debounce } from 'lodash'

type NiveauType = 'district' | 'conference'

interface Props {
  type: NiveauType
  niveauId: number
  niveauNom: string
  departements: Departement[]
  chefs: (ChefDepartement | ChefDepartementConference)[]
  user: any
}

export default function ChefsDepartementManager({ 
  type, 
  niveauId, 
  niveauNom, 
  departements, 
  chefs: initialChefs, 
  user 
}: Props) {
  const [chefs, setChefs] = useState(initialChefs)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState<{show: boolean; chef: any | null}>({ show: false, chef: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sélectionner les bonnes fonctions selon le type
  const actions = {
    district: {
      ajouter: ajouterChefDepartement,
      retirer: retirerChefDepartement,
      updateRole: updateChefRole,
      searchFideles: searchFidelesDisponibles,
      getRoles: getRolesDisponiblesPourDistrict,
      path: `/admin/districts/${niveauId}/chefs`,
      parentPath: `/admin/districts/${niveauId}`,
      label: 'district'
    },
    conference: {
      ajouter: ajouterChefDepartementConference,
      retirer: retirerChefDepartementConference,
      updateRole: updateChefRoleConference,
      searchFideles: searchFidelesDisponiblesPourConference,
      getRoles: getRolesDisponiblesPourConference,
      path: `/admin/conferences/${niveauId}/chefs`,
      parentPath: `/admin/conferences/${niveauId}`,
      label: 'conférence'
    }
  }

  const currentActions = actions[type]

  const handleAjouterChef = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)
    
    const result = await currentActions.ajouter(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Chef ajouté avec succès' })
      setShowAddModal(false)
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleRetirerChef = async (chefId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce chef ?')) return
    
    setLoading(true)
    const result = await currentActions.retirer(chefId, niveauId)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Chef retiré avec succès' })
      setChefs(chefs.filter(c => c.id !== chefId))
    }
    
    setLoading(false)
  }

  const handleUpdateRole = async (chefId: number, nouveauRoleId: number) => {
    setLoading(true)
    setMessage(null)
    
    const result = await currentActions.updateRole(chefId, nouveauRoleId, niveauId)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Rôle mis à jour avec succès' })
      setShowEditRoleModal({ show: false, chef: null })
      window.location.reload()
    }
    
    setLoading(false)
  }

  // Grouper les chefs par département
  const chefsParDepartement = chefs.reduce((acc, chef) => {
    if (!acc[chef.departement_id]) {
      acc[chef.departement_id] = []
    }
    acc[chef.departement_id].push(chef)
    return acc
  }, {} as Record<number, any[]>)

  const departementsFiltres = departements.filter(d => 
    d.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Statistiques
  const totalChefs = chefs.length
  const departementsAvecChefs = Object.keys(chefsParDepartement).length
  const postesVacants = departements.reduce((acc, dept) => {
    const chefsCount = chefsParDepartement[dept.id]?.length || 0
    return acc + Math.max(0, 3 - chefsCount)
  }, 0)

  const getRoleBadgeColor = (nomRole: string) => {
    if (nomRole === 'president') return 'bg-purple-100 text-purple-700'
    if (nomRole === 'vice_president') return 'bg-blue-100 text-blue-700'
    return 'bg-green-100 text-green-700'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href={currentActions.parentPath}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Retour {type === 'district' ? 'au district' : 'à la conférence'}
          </Link>
          <h1 className="text-2xl font-light text-gray-900">
            Responsables de département - {niveauNom}
          </h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">
          Gérez les différents responsables des départements au niveau {type === 'district' ? 'du district' : 'de la conférence'}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{totalChefs}</div>
          <div className="text-xs text-gray-400">Responsables assignés</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{departementsAvecChefs}</div>
          <div className="text-xs text-gray-400">Départements avec équipe</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{postesVacants}</div>
          <div className="text-xs text-gray-400">Postes à pourvoir</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{departements.length}</div>
          <div className="text-xs text-gray-400">Total départements</div>
        </div>
      </div>

      {/* Recherche et bouton d'ajout */}
      <div className="mb-6 flex justify-between items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 w-80"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 rounded-lg"
        >
          + Ajouter un responsable
        </button>
      </div>

      {/* Liste des départements avec leurs responsables */}
      <div className="grid grid-cols-1 gap-6">
        {departementsFiltres.map((departement) => {
          const responsables = chefsParDepartement[departement.id] || []

          return (
            <div key={departement.id} className="bg-white rounded-lg border border-gray-100 overflow-hidden">
              {/* En-tête du département */}
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{departement.nom}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {responsables.length} responsable{responsables.length > 1 ? 's' : ''} sur 3 postes
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                    {departement.type}
                  </span>
                </div>
              </div>

              {/* Liste des responsables */}
              <div className="p-5">
                {responsables.length > 0 ? (
                  <div className="space-y-4">
                    {responsables.map((chef) => (
                      <div key={chef.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {chef.fidele?.profile_img ? (
                            <img src={chef.fidele.profile_img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-medium">
                              {chef.fidele?.prenom?.[0] || chef.fidele?.nom?.[0] || '?'}
                            </div>
                          )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-medium text-gray-900">
                              {chef.fidele?.prenom} {chef.fidele?.nom} {chef.fidele?.post_nom}
                            </span>
                            {chef.role && (
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full cursor-help
                                ${getRoleBadgeColor(chef.role.nom_role)}
                              `}
                              title="Cliquez sur le crayon pour modifier le rôle"
                              >
                                {chef.role.label_role}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-gray-500 mb-1">{chef.fidele?.contact}</p>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>Depuis le {new Date(chef.date_nomination).toLocaleDateString('fr-FR')}</span>
                            <span>•</span>
                            <span>Paroisse: {chef.fidele?.paroisse?.nom || 'Non définie'}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowEditRoleModal({ show: true, chef })}
                            disabled={loading}
                            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 px-2 py-1 flex items-center gap-1"
                            title="Modifier le rôle"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Rôle
                          </button>
                          <button
                            onClick={() => handleRetirerChef(chef.id)}
                            disabled={loading}
                            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50 px-2 py-1"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm mb-3">
                      Aucun responsable dans ce département
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setShowAddModal(true)
                      }}
                      className="inline-flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg hover:bg-gray-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter un responsable
                    </button>
                  </div>
                )}

                {/* Bouton pour ajouter d'autres responsables si moins de 3 */}
                {responsables.length > 0 && responsables.length < 3 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setShowAddModal(true)
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter un autre responsable
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {departementsFiltres.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-gray-300 text-sm">Aucun département trouvé</div>
          </div>
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <AjouterChefModal
          type={type}
          niveauId={niveauId}
          departements={departements}
          chefsExistants={chefsParDepartement}
          getRoles={currentActions.getRoles}
          searchFideles={currentActions.searchFideles}
          onClose={() => setShowAddModal(false)}
          onAjouter={handleAjouterChef}
          loading={loading}
        />
      )}

      {/* Modal de modification du rôle */}
      {showEditRoleModal.show && showEditRoleModal.chef && (
        <ModifierRoleModal
          type={type}
          chef={showEditRoleModal.chef}
          departementId={showEditRoleModal.chef.departement_id}
          chefsExistants={chefsParDepartement[showEditRoleModal.chef.departement_id] || []}
          getRoles={currentActions.getRoles}
          onClose={() => setShowEditRoleModal({ show: false, chef: null })}
          onUpdate={handleUpdateRole}
          loading={loading}
        />
      )}
    </div>
  )
}

// Modal d'ajout de chef
function AjouterChefModal({ 
  type, 
  niveauId, 
  departements, 
  chefsExistants, 
  getRoles,
  searchFideles,
  onClose, 
  onAjouter, 
  loading 
}: any) {
  const [selectedDepartement, setSelectedDepartement] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedFidele, setSelectedFidele] = useState<any>(null)
  const [dateNomination, setDateNomination] = useState(new Date().toISOString().split('T')[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isSearchActive, setIsSearchActive] = useState(true)
  const [rolesDisponibles, setRolesDisponibles] = useState<any[]>([])
  const [rolesFiltres, setRolesFiltres] = useState<any[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Charger les rôles disponibles
  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true)
      const roles = await getRoles()
      setRolesDisponibles(roles)
      setLoadingRoles(false)
    }
    loadRoles()
  }, [getRoles])

  // Filtrer les rôles disponibles pour le département sélectionné
  useEffect(() => {
    if (selectedDepartement && chefsExistants) {
      const rolesPris = chefsExistants[selectedDepartement]?.map((c: any) => c.role_id) || []
      const disponibles = rolesDisponibles.filter(r => !rolesPris.includes(r.id))
      setRolesFiltres(disponibles)
      if (selectedRole && rolesPris.includes(parseInt(selectedRole))) {
        setSelectedRole('')
      }
    } else {
      setRolesFiltres(rolesDisponibles)
    }
  }, [selectedDepartement, chefsExistants, rolesDisponibles, selectedRole])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!isSearchActive || query.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const results = await searchFideles(niveauId, query)
        setSearchResults(results)
        setShowResults(true)
      } catch (error) {
        console.error('Erreur recherche:', error)
      } finally {
        setSearching(false)
      }
    }, 500),
    [niveauId, isSearchActive, searchFideles]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  const handleSelectFidele = (fidele: any) => {
    setSelectedFidele(fidele)
    setSearchQuery(`${fidele.prenom} ${fidele.nom} ${fidele.post_nom || ''}`)
    setShowResults(false)
    setIsSearchActive(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (selectedFidele) {
      setSelectedFidele(null)
      setIsSearchActive(true)
    }
    
    if (value === '') {
      setIsSearchActive(true)
      setShowResults(false)
    }
  }

  const handleSearchFocus = () => {
    if (isSearchActive && searchQuery.length >= 2) {
      setShowResults(true)
    }
  }

  const handleClearSelection = () => {
    setSelectedFidele(null)
    setSearchQuery('')
    setIsSearchActive(true)
    setShowResults(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFidele || !selectedDepartement || !selectedRole) return
    
    const formData = new FormData()
    formData.append('fidele_id', selectedFidele.id.toString())
    formData.append('departement_id', selectedDepartement)
    
    if (type === 'district') {
      formData.append('district_id', niveauId.toString())
    } else {
      formData.append('conference_id', niveauId.toString())
    }
    
    formData.append('role_id', selectedRole)
    formData.append('date_nomination', dateNomination)
    
    onAjouter(formData)
  }

  const rolesPrisDansDepartement = selectedDepartement 
    ? chefsExistants[selectedDepartement]?.map((c: any) => c.role_id) || []
    : []

  const niveauLabel = type === 'district' ? 'du district' : 'de la conférence'

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-lg font-light text-gray-900 mb-4">
          Ajouter un responsable de département ({niveauLabel})
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Département */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Département <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedDepartement}
              onChange={(e) => setSelectedDepartement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              required
            >
              <option value="">Sélectionner un département</option>
              {departements.map((d: Departement) => (
                <option key={d.id} value={d.id}>
                  {d.nom} ({chefsExistants[d.id]?.length || 0}/3 responsables)
                </option>
              ))}
            </select>
          </div>

          {/* Rôle */}
          {selectedDepartement && (
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Rôle <span className="text-red-400">*</span>
              </label>
              {loadingRoles ? (
                <div className="text-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                    required
                  >
                    <option value="">Sélectionner un rôle</option>
                    {rolesFiltres.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label_role}
                      </option>
                    ))}
                  </select>
                  
                  {/* Rôles déjà pris */}
                  {rolesPrisDansDepartement.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Rôles déjà pourvus :</span>{' '}
                      {rolesDisponibles
                        .filter(r => rolesPrisDansDepartement.includes(r.id))
                        .map(r => r.label_role)
                        .join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Recherche de fidèle */}
          <div className="relative">
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Responsable <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Nom du fidèle..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 pr-8"
                autoComplete="off"
                required
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              )}
              {selectedFidele && !searching && (
                <div className="absolute right-3 top-2.5">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            {/* Résultats de recherche */}
            {isSearchActive && showResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((fidele) => (
                  <button
                    key={fidele.id}
                    type="button"
                    onClick={() => handleSelectFidele(fidele)}
                    className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {fidele.profile_img ? (
                        <img src={fidele.profile_img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-medium">
                          {fidele.prenom?.[0] || fidele.nom?.[0] || '?'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fidele.prenom} {fidele.nom} {fidele.post_nom}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {fidele.paroisse_nom}
                      </p>
                    </div>
                    {fidele.dejaChef && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full whitespace-nowrap">
                        Déjà responsable
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {isSearchActive && showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
                <p className="text-sm text-gray-500">Aucun fidèle trouvé</p>
              </div>
            )}
          </div>

          {/* Fidèle sélectionné */}
          {selectedFidele && (
            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-200 overflow-hidden">
                {selectedFidele.profile_img ? (
                  <img src={selectedFidele.profile_img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-300 text-blue-600 text-xs font-medium">
                    {selectedFidele.prenom?.[0] || selectedFidele.nom?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom}
                </p>
                <p className="text-xs text-blue-600">
                  {selectedFidele.paroisse_nom}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Date de nomination */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Date de nomination
            </label>
            <input
              type="date"
              value={dateNomination}
              onChange={(e) => setDateNomination(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDepartement || !selectedRole || !selectedFidele}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Ajout en cours...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de modification du rôle
function ModifierRoleModal({ 
  type, 
  chef, 
  departementId, 
  chefsExistants, 
  getRoles,
  onClose, 
  onUpdate, 
  loading 
}: any) {
  const [selectedRole, setSelectedRole] = useState(chef.role_id?.toString() || '')
  const [rolesDisponibles, setRolesDisponibles] = useState<any[]>([])
  const [rolesFiltres, setRolesFiltres] = useState<any[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Charger les rôles disponibles
  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true)
      const roles = await getRoles()
      setRolesDisponibles(roles)
      setLoadingRoles(false)
    }
    loadRoles()
  }, [getRoles])

  // Filtrer les rôles disponibles (exclure le rôle actuel et les rôles déjà pris)
  useEffect(() => {
    if (rolesDisponibles.length > 0) {
      const autresChefs = chefsExistants.filter((c: any) => c.id !== chef.id)
      const rolesPris = autresChefs.map((c: any) => c.role_id) || []
      
      const disponibles = rolesDisponibles.map(role => ({
        ...role,
        estPris: rolesPris.includes(role.id)
      }))
      
      setRolesFiltres(disponibles)
    }
  }, [rolesDisponibles, chefsExistants, chef.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return
    
    const roleSelectionne = rolesFiltres.find((r: any) => r.id.toString() === selectedRole)
    if (roleSelectionne?.estPris) {
      alert('Ce rôle est déjà attribué à un autre responsable dans ce département')
      return
    }
    
    onUpdate(chef.id, parseInt(selectedRole))
  }

  const roleActuel = rolesDisponibles.find((r: any) => r.id === chef.role_id)

  const getRoleBadgeColor = (nomRole: string) => {
    if (nomRole === 'president') return 'bg-purple-100 text-purple-700'
    if (nomRole === 'vice_president') return 'bg-blue-100 text-blue-700'
    return 'bg-green-100 text-green-700'
  }

  const niveauLabel = type === 'district' ? 'du district' : 'de la conférence'

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-light text-gray-900 mb-4">
          Modifier le rôle ({niveauLabel})
        </h3>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Responsable :</span> {chef.fidele?.prenom} {chef.fidele?.nom} {chef.fidele?.post_nom}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Rôle actuel :</span>{' '}
            {roleActuel ? (
              <span className={`
                inline-block px-2 py-0.5 rounded-full text-xs ml-1
                ${getRoleBadgeColor(roleActuel.nom_role)}
              `}>
                {roleActuel.label_role}
              </span>
            ) : 'Non défini'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nouveau rôle */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Nouveau rôle <span className="text-red-400">*</span>
            </label>
            {loadingRoles ? (
              <div className="text-center py-4">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                required
              >
                <option value="">Sélectionner un rôle</option>
                {rolesFiltres.map((role) => (
                  <option 
                    key={role.id} 
                    value={role.id}
                    disabled={role.estPris}
                    className={role.estPris ? 'text-gray-400 bg-gray-50' : ''}
                  >
                    {role.label_role} {role.estPris ? '(Déjà attribué)' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRole || selectedRole === chef.role_id?.toString()}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}