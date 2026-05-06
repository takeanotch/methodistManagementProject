

// app/admin/districts/[id]/chefs/ChefsClient.tsx
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
import { Departement } from '@/actions/departements'
import { getAnneesConference } from '@/actions/annee-conference'
import type { AnneeConference } from '@/actions/annee-conference'
import { debounce } from 'lodash'
import AjouterRoleModal from '@/components/AjouterRoleModal'
import { 
  Filter, 
  FilterX, 
  ChevronDown, 
  CheckCircle, 
  Loader2,
  Plus,
  Search,
  X,
  Edit2,
  User,
  Users
} from 'lucide-react'

interface Props {
  districtId: number
  districtNom: string
  departements: any[]
  chefs: ChefDepartement[]
  maxPostesParDepartement: number
  user: any
  conferenceId: number | null // Ajouté pour charger les années
}

export default function ChefsClientDistrict({ 
  districtId, 
  districtNom, 
  departements, 
  chefs: initialChefs, 
  maxPostesParDepartement,
  user,
  conferenceId 
}: Props) {
  const [chefs, setChefs] = useState(initialChefs)
  const [showAddModal, setShowAddModal] = useState(false)
  const [preselectedDepartementId, setPreselectedDepartementId] = useState<number | null>(null)
  const [showEditRoleModal, setShowEditRoleModal] = useState<{show: boolean; chef: ChefDepartement | null}>({ show: false, chef: null })
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // États pour le filtre par année
  const [selectedFilterAnneeId, setSelectedFilterAnneeId] = useState<number | null>(null)
  const [availableAnnees, setAvailableAnnees] = useState<AnneeConference[]>([])
  const [showAnneeFilterDropdown, setShowAnneeFilterDropdown] = useState(false)
  const [loadingAnnees, setLoadingAnnees] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Charger les années disponibles
  useEffect(() => {
    loadAnnees()
  }, [conferenceId])

  const loadAnnees = async () => {
    try {
      setLoadingAnnees(true)
      
      if (conferenceId) {
        const annees = await getAnneesConference(conferenceId)
        // Trier par année (plus récent en premier)
        annees.sort((a, b) => (b.annee_id || 0) - (a.annee_id || 0))
        setAvailableAnnees(annees)

        // Sélectionner l'année en cours par défaut (une seule fois)
        if (!isInitialized) {
          const anneeEnCours = annees.find(a => a.is_current)
          if (anneeEnCours) {
            setSelectedFilterAnneeId(anneeEnCours.id)
          }
          setIsInitialized(true)
        }
      }
    } catch (error) {
      console.error('Erreur chargement des années:', error)
      setIsInitialized(true)
    } finally {
      setLoadingAnnees(false)
    }
  }

  // Filtrer les chefs selon l'année sélectionnée
  const filteredChefs = selectedFilterAnneeId 
    ? chefs.filter(chef => chef.annee_conference_id === selectedFilterAnneeId)
    : chefs

  const handleAjouterChef = async (formData: FormData) => {
    setLoading(true)
    setMessage(null)
    
    // Ajouter l'année de conférence sélectionnée au formulaire
    if (selectedFilterAnneeId) {
      formData.append('annee_conference_id', selectedFilterAnneeId.toString())
    }
    
    const result = await ajouterChefDepartement(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Chef ajouté avec succès' })
      setShowAddModal(false)
      setPreselectedDepartementId(null)
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleRetirerChef = async (chefId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce chef ?')) return
    
    setLoading(true)
    const result = await retirerChefDepartement(chefId, districtId)
    
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
    
    const result = await updateChefRole(chefId, nouveauRoleId, districtId)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Rôle mis à jour avec succès' })
      setShowEditRoleModal({ show: false, chef: null })
      window.location.reload()
    }
    
    setLoading(false)
  }

  const handleRoleAdded = () => {
    setMessage({ type: 'success', text: 'Nouveau rôle ajouté avec succès' })
    window.location.reload()
  }

  const handleResetFilter = () => {
    setSelectedFilterAnneeId(null)
  }

  const getSelectedAnneeLabel = () => {
    if (!selectedFilterAnneeId) return null
    const annee = availableAnnees.find(a => a.id === selectedFilterAnneeId)
    return annee?.annee?.label || `Année #${selectedFilterAnneeId}`
  }

  // Grouper les chefs filtrés par département
  const chefsParDepartement = filteredChefs.reduce((acc, chef) => {
    if (!acc[chef.departement_id]) {
      acc[chef.departement_id] = []
    }
    acc[chef.departement_id].push(chef)
    return acc
  }, {} as Record<number, ChefDepartement[]>)

  const departementsFiltres = departements.filter(d => 
    d.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Statistiques basées sur les chefs filtrés
  const totalChefs = filteredChefs.length
  const departementsAvecChefs = Object.keys(chefsParDepartement).length
  
  const postesVacants = departements.reduce((acc, dept) => {
    const chefsCount = chefsParDepartement[dept.id]?.length || 0
    return acc + Math.max(0, maxPostesParDepartement - chefsCount)
  }, 0)

  const totalPostesTheoriques = departements.length * maxPostesParDepartement

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link 
            href={`/admin/chefs`}
            className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
          >
            ← Retour aux responsables de département
          </Link>
          <h1 className="text-2xl font-light text-gray-900">
            Responsables de département - {districtNom}
          </h1>
        </div>
        <p className="text-sm text-gray-500 ml-8">
          Gérez les différents responsables des départements au niveau du district
          <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5">
            {maxPostesParDepartement} poste{maxPostesParDepartement > 1 ? 's' : ''} max par département
          </span>
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-500 text-green-700' 
            : 'bg-red-50 border-red-500 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Barre de filtre par année */}
      <div className="mb-6 bg-white border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-600">Filtrer par année :</span>
            </div>
            
            {/* Dropdown du filtre */}
            <div className="relative">
              <button
                onClick={() => setShowAnneeFilterDropdown(!showAnneeFilterDropdown)}
                disabled={loadingAnnees}
                className="min-w-[220px] px-4 py-2 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white disabled:opacity-50"
              >
                <span className={selectedFilterAnneeId ? 'text-gray-900' : 'text-gray-400'}>
                  {loadingAnnees ? (
                    <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Chargement...</span>
                  ) : selectedFilterAnneeId ? (
                    getSelectedAnneeLabel()
                  ) : (
                    'Toutes les années'
                  )}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAnneeFilterDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showAnneeFilterDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowAnneeFilterDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[220px] max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setSelectedFilterAnneeId(null); setShowAnneeFilterDropdown(false) }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${!selectedFilterAnneeId ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                    >
                      <span>Toutes les années</span>
                      {!selectedFilterAnneeId && <CheckCircle size={14} className="text-emerald-600" />}
                    </button>
                    <div className="border-t border-gray-100"></div>
                    {availableAnnees.map((ac) => (
                      <button
                        key={ac.id}
                        onClick={() => { setSelectedFilterAnneeId(ac.id); setShowAnneeFilterDropdown(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedFilterAnneeId === ac.id ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{ac.annee?.label || `Année ${ac.annee_id}`}</span>
                          {ac.is_current && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium rounded">En cours</span>
                          )}
                        </div>
                        {selectedFilterAnneeId === ac.id && <CheckCircle size={14} className="text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Bouton pour réinitialiser le filtre */}
          {selectedFilterAnneeId && (
            <button
              onClick={handleResetFilter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <FilterX size={14} />
              Réinitialiser le filtre
            </button>
          )}
        </div>
        
        {/* Information sur le filtre actif */}
        {selectedFilterAnneeId && (
          <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
            <span>Affichage des responsables pour l'année {getSelectedAnneeLabel()}</span>
            <span className="text-gray-300">•</span>
            <span>{filteredChefs.length} responsable{filteredChefs.length > 1 ? 's' : ''} affiché{filteredChefs.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Statistiques - CARRÉES */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{totalChefs}</div>
          <div className="text-xs text-gray-500">Responsables assignés</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{departementsAvecChefs}</div>
          <div className="text-xs text-gray-500">Départements avec équipe</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{postesVacants}</div>
          <div className="text-xs text-gray-500">Postes à pourvoir</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{departements.length}</div>
          <div className="text-xs text-gray-500">Total départements</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light text-gray-900 mb-1">{totalPostesTheoriques}</div>
          <div className="text-xs text-gray-500">Total postes théoriques</div>
        </div>
      </div>

      {/* Recherche et boutons d'action */}
      <div className="mb-6 flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 w-full"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddRoleModal(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
          >
            <Plus size={16} />
            Nouveau rôle
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 flex items-center gap-2"
          >
            <Plus size={16} />
            Ajouter un responsable
          </button>
        </div>
      </div>

      {/* Liste des départements avec leurs responsables */}
      <div className="grid grid-cols-1 gap-6">
        {departementsFiltres.map((departement) => {
          const responsables = chefsParDepartement[departement.id] || []
          const postesRestants = maxPostesParDepartement - responsables.length
          const estComplet = responsables.length >= maxPostesParDepartement

          return (
            <div key={departement.id} className="bg-white border border-gray-200">
              {/* En-tête du département */}
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{departement.nom}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {responsables.length} responsable{responsables.length > 1 ? 's' : ''} sur {maxPostesParDepartement} poste{maxPostesParDepartement > 1 ? 's' : ''}
                      {postesRestants > 0 && (
                        <span className="ml-2 text-amber-600">
                          ({postesRestants} poste{postesRestants > 1 ? 's' : ''} vacant{postesRestants > 1 ? 's' : ''})
                        </span>
                      )}
                      {estComplet && (
                        <span className="ml-2 text-green-600">(Complet)</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-200 text-gray-700">
                    {departement.type}
                  </span>
                </div>
              </div>

              {/* Liste des responsables */}
              <div className="p-5">
                {responsables.length > 0 ? (
                  <div className="space-y-4">
                    {responsables.map((chef) => (
                      <div key={chef.id} className="flex items-start gap-4 p-3 bg-gray-50">
                        {/* Avatar - CERCLE */}
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                          {chef.fidele?.profile_img ? (
                            <img src={chef.fidele.profile_img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-300 text-gray-600 text-sm font-medium">
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
                                text-xs px-2 py-0.5
                                ${chef.role.nom_role === 'president' ? 'bg-purple-100 text-purple-700' : 
                                  chef.role.nom_role === 'vice_president' ? 'bg-blue-100 text-blue-700' : 
                                  'bg-green-100 text-green-700'}
                              `}>
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
                          >
                            <Edit2 size={14} />
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
                    <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                      <Users size={48} className="w-full h-full" />
                    </div>
                    <p className="text-gray-500 text-sm mb-3">
                      {selectedFilterAnneeId 
                        ? `Aucun responsable pour l'année ${getSelectedAnneeLabel()}`
                        : 'Aucun responsable dans ce département'
                      }
                    </p>
                    <button
                      onClick={() => {
                        setPreselectedDepartementId(departement.id)
                        setShowAddModal(true)
                      }}
                      className="inline-flex items-center gap-1 text-xs bg-gray-900 text-white px-3 py-1.5 hover:bg-gray-800"
                    >
                      <Plus size={14} />
                      Ajouter un responsable
                    </button>
                  </div>
                )}

                {/* Bouton pour ajouter d'autres responsables si pas complet */}
                {responsables.length > 0 && !estComplet && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setPreselectedDepartementId(departement.id)
                        setShowAddModal(true)
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Ajouter un autre responsable ({postesRestants} disponible{postesRestants > 1 ? 's' : ''})
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {departementsFiltres.length === 0 && (
          <div className="py-12 text-center">
            <div className="text-gray-400 text-sm">Aucun département trouvé</div>
          </div>
        )}
      </div>

      {/* Modal d'ajout de responsable */}
      {showAddModal && (
        <AjouterChefModal
          districtId={districtId}
          departements={departements}
          chefsExistants={chefsParDepartement}
          preselectedDepartementId={preselectedDepartementId}
          maxPostesParDepartement={maxPostesParDepartement}
          selectedAnneeId={selectedFilterAnneeId}
          onClose={() => {
            setShowAddModal(false)
            setPreselectedDepartementId(null)
          }}
          onAjouter={handleAjouterChef}
          loading={loading}
        />
      )}

      {/* Modal de modification du rôle */}
      {showEditRoleModal.show && showEditRoleModal.chef && (
        <ModifierRoleModal
          chef={showEditRoleModal.chef}
          departementId={showEditRoleModal.chef.departement_id}
          chefsExistants={chefsParDepartement[showEditRoleModal.chef.departement_id] || []}
          onClose={() => setShowEditRoleModal({ show: false, chef: null })}
          onUpdate={handleUpdateRole}
          loading={loading}
        />
      )}

      {/* Modal d'ajout de nouveau rôle */}
      <AjouterRoleModal
        type="district"
        isOpen={showAddRoleModal}
        onClose={() => setShowAddRoleModal(false)}
        onSuccess={handleRoleAdded}
      />
    </div>
  )
}

// Modal d'ajout de chef
function AjouterChefModal({ 
  districtId, 
  departements, 
  chefsExistants, 
  preselectedDepartementId,
  maxPostesParDepartement,
  selectedAnneeId,
  onClose, 
  onAjouter, 
  loading 
}: any) {
  const [selectedDepartement, setSelectedDepartement] = useState(preselectedDepartementId?.toString() || '')
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

  useEffect(() => {
    if (preselectedDepartementId) {
      setSelectedDepartement(preselectedDepartementId.toString())
    }
  }, [preselectedDepartementId])

  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true)
      const roles = await getRolesDisponiblesPourDistrict()
      setRolesDisponibles(roles)
      setLoadingRoles(false)
    }
    loadRoles()
  }, [])

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

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!isSearchActive || query.length < 2) {
        setSearchResults([])
        return
      }

      setSearching(true)
      try {
        const results = await searchFidelesDisponibles(districtId, query)
        setSearchResults(results)
        setShowResults(true)
      } catch (error) {
        console.error('Erreur recherche:', error)
      } finally {
        setSearching(false)
      }
    }, 500),
    [districtId, isSearchActive]
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
    formData.append('district_id', districtId.toString())
    formData.append('role_id', selectedRole)
    formData.append('date_nomination', dateNomination)
    
    // Ajouter l'année de conférence si sélectionnée
    if (selectedAnneeId) {
      formData.append('annee_conference_id', selectedAnneeId.toString())
    }
    
    onAjouter(formData)
  }

  const rolesPrisDansDepartement = selectedDepartement 
    ? chefsExistants[selectedDepartement]?.map((c: any) => c.role_id) || []
    : []

  const nombreChefsActuels = selectedDepartement ? (chefsExistants[selectedDepartement]?.length || 0) : 0
  const estComplet = nombreChefsActuels >= maxPostesParDepartement

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-light text-gray-900 mb-4">
          Ajouter un responsable de département
        </h3>

        {estComplet && selectedDepartement && (
          <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 text-amber-700 text-sm">
            Attention : Ce département a déjà atteint le nombre maximum de {maxPostesParDepartement} responsable{maxPostesParDepartement > 1 ? 's' : ''}.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Département */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
              Département <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDepartement}
              onChange={(e) => setSelectedDepartement(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
              required
            >
              <option value="">Sélectionner un département</option>
              {departements.map((d: Departement) => {
                const nbChefs = chefsExistants[d.id]?.length || 0
                const complet = nbChefs >= maxPostesParDepartement
                return (
                  <option key={d.id} value={d.id} className={complet ? 'text-amber-600' : ''}>
                    {d.nom} ({nbChefs}/{maxPostesParDepartement} responsables)
                    {complet ? ' - COMPLET' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {/* Rôle */}
          {selectedDepartement && (
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                Rôle <span className="text-red-500">*</span>
              </label>
              {loadingRoles ? (
                <div className="text-center py-4">
                  <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
                </div>
              ) : rolesFiltres.length > 0 ? (
                <>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
                    required
                  >
                    <option value="">Sélectionner un rôle</option>
                    {rolesFiltres.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.label_role}
                      </option>
                    ))}
                  </select>
                  
                  {rolesPrisDansDepartement.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Rôles déjà pourvus :</span>{' '}
                      {rolesDisponibles
                        .filter(r => rolesPrisDansDepartement.includes(r.id))
                        .map(r => r.label_role)
                        .join(', ')}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-3 bg-gray-50 text-gray-600 text-sm text-center">
                  Tous les rôles sont déjà attribués dans ce département.
                </div>
              )}
            </div>
          )}

          {/* Recherche de fidèle */}
          <div className="relative">
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
              Responsable <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                placeholder="Nom du fidèle..."
                className="w-full pl-10 pr-8 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
                autoComplete="off"
                required
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                </div>
              )}
              {selectedFidele && !searching && (
                <div className="absolute right-3 top-2.5">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
              )}
            </div>

            {/* Résultats de recherche */}
            {isSearchActive && showResults && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map((fidele) => (
                  <button
                    key={fidele.id}
                    type="button"
                    onClick={() => handleSelectFidele(fidele)}
                    className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-200 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {fidele.profile_img ? (
                        <img src={fidele.profile_img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-medium">
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
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 whitespace-nowrap">
                        Déjà responsable
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {isSearchActive && showResults && searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 shadow-lg p-4 text-center">
                <p className="text-sm text-gray-500">Aucun fidèle trouvé</p>
              </div>
            )}
          </div>

          {/* Fidèle sélectionné */}
          {selectedFidele && (
            <div className="p-3 bg-blue-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-200 overflow-hidden flex-shrink-0">
                {selectedFidele.profile_img ? (
                  <img src={selectedFidele.profile_img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full flex items-center justify-center bg-blue-300 text-blue-600 text-xs font-medium">
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
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Date de nomination */}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
              Date de nomination
            </label>
            <input
              type="date"
              value={dateNomination}
              onChange={(e) => setDateNomination(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedDepartement || !selectedRole || !selectedFidele}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
function ModifierRoleModal({ chef, departementId, chefsExistants, onClose, onUpdate, loading }: any) {
  const [selectedRole, setSelectedRole] = useState(chef.role_id?.toString() || '')
  const [rolesDisponibles, setRolesDisponibles] = useState<any[]>([])
  const [rolesFiltres, setRolesFiltres] = useState<any[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)

  useEffect(() => {
    const loadRoles = async () => {
      setLoadingRoles(true)
      const roles = await getRolesDisponiblesPourDistrict()
      setRolesDisponibles(roles)
      setLoadingRoles(false)
    }
    loadRoles()
  }, [])

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

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-md w-full p-6">
        <h3 className="text-lg font-light text-gray-900 mb-4">
          Modifier le rôle
        </h3>

        <div className="mb-6 p-4 bg-gray-50">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Responsable :</span> {chef.fidele?.prenom} {chef.fidele?.nom} {chef.fidele?.post_nom}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Rôle actuel :</span>{' '}
            {roleActuel ? (
              <span className={`
                inline-block px-2 py-0.5 text-xs ml-1
                ${roleActuel.nom_role === 'president' ? 'bg-purple-100 text-purple-700' : 
                  roleActuel.nom_role === 'vice_president' ? 'bg-blue-100 text-blue-700' : 
                  'bg-green-100 text-green-700'}
              `}>
                {roleActuel.label_role}
              </span>
            ) : 'Non défini'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
              Nouveau rôle <span className="text-red-500">*</span>
            </label>
            {loadingRoles ? (
              <div className="text-center py-4">
                <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
              </div>
            ) : (
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !selectedRole || selectedRole === chef.role_id?.toString()}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}