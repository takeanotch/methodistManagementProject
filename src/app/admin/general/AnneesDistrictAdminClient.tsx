'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { 
  openNewYearForDepartement, 
  closeYearForDepartement,
  setCurrentAnneeDistrict 
} from '@/actions/annee-district'

interface District {
  id: number
  nom: string
}

interface Departement {
  id: number
  nom: string
  type: string
}

interface Annee {
  id: number
  label: string
}

interface AnneeDistrictItem {
  id: number
  district_id: number
  departement_id: number
  annee_id: number
  is_current: boolean
  created_at: string
  updated_at: string
  annee?: {
    id: number
    label: string
  }
  district?: {
    id: number
    nom: string
  }
  departement?: {
    id: number
    nom: string
    type: string
  }
  status?: 'current' | 'past' | 'future'
}

interface Props {
  districts: District[]
  departements: Departement[]
  annees: Annee[]
  anneesDistrict: AnneeDistrictItem[]
}

// Types pour les filtres
interface Filters {
  districtId: string
  departementId: string
  anneeId: string
  statut: string
  ouvertes: string // 'all', 'ouvertes', 'non_ouvertes'
}

export default function AnneesDistrictAdminClient({
  districts,
  departements,
  annees,
  anneesDistrict
}: Props) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>({
    districtId: '',
    departementId: '',
    anneeId: '',
    statut: '',
    ouvertes: 'all'
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedDepartement, setSelectedDepartement] = useState('')
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const typeLabels: Record<string, { label: string; color: string }> = {
    commite: { label: 'Comité', color: 'bg-purple-100 text-purple-700' },
    agence_programme: { label: 'Agence/Programme', color: 'bg-blue-100 text-blue-700' },
    normal: { label: 'Normal', color: 'bg-gray-100 text-gray-700' }
  }

  // Filtrer les départements en fonction du district sélectionné
  const filteredDepartements = useMemo(() => {
    if (!filters.districtId) return departements
    // Note: Les départements n'ont pas de district_id directement
    // On utilise les données de anneesDistrict pour savoir quels départements sont dans ce district
    const deptIdsInDistrict = new Set(
      anneesDistrict
        .filter(ad => ad.district_id === parseInt(filters.districtId))
        .map(ad => ad.departement_id)
    )
    return departements.filter(d => deptIdsInDistrict.has(d.id))
  }, [filters.districtId, departements, anneesDistrict])

  // Appliquer les filtres
  const filteredData = useMemo(() => {
    return anneesDistrict.filter(item => {
      // Filtre par district
      if (filters.districtId && item.district_id !== parseInt(filters.districtId)) {
        return false
      }
      
      // Filtre par département
      if (filters.departementId && item.departement_id !== parseInt(filters.departementId)) {
        return false
      }
      
      // Filtre par année
      if (filters.anneeId && item.annee_id !== parseInt(filters.anneeId)) {
        return false
      }
      
      // Filtre par statut
      if (filters.statut) {
        if (filters.statut === 'current' && !item.is_current) return false
        if (filters.statut === 'past' && item.is_current) return false
      }
      
      return true
    })
  }, [anneesDistrict, filters])

  // Grouper les données par district > département > année
  const groupedData = useMemo(() => {
    const groups: Record<number, {
      district: District
      departements: Record<number, {
        departement: Departement
        annees: AnneeDistrictItem[]
      }>
    }> = {}

    filteredData.forEach(item => {
      const dept = item.departement
      const dist = item.district
      if (!dept || !dist) return

      // Initialiser le district si nécessaire
      if (!groups[dist.id]) {
        groups[dist.id] = {
          district: dist,
          departements: {}
        }
      }

      // Initialiser le département si nécessaire
      if (!groups[dist.id].departements[dept.id]) {
        groups[dist.id].departements[dept.id] = {
          departement: dept,
          annees: []
        }
      }

      groups[dist.id].departements[dept.id].annees.push(item)
    })

    return groups
  }, [filteredData])

  // Obtenir les départements qui n'ont PAS d'année ouverte (pour l'affichage)
  const getDepartementsSansAnnee = (districtId: number): Departement[] => {
    const deptIdsAvecAnnee = new Set(
      anneesDistrict
        .filter(ad => ad.district_id === districtId)
        .map(ad => ad.departement_id)
    )
    return departements.filter(d => !deptIdsAvecAnnee.has(d.id))
  }

  const getStatusBadge = (status: string, isCurrent: boolean) => {
    if (isCurrent) {
      return <span className="px-2 py-1 text-xs -full bg-green-100 text-green-700">En cours</span>
    }
    switch (status) {
      case 'future':
        return <span className="px-2 py-1 text-xs -full bg-blue-100 text-blue-700">À venir</span>
      default:
        return <span className="px-2 py-1 text-xs -full bg-gray-100 text-gray-600">Passée</span>
    }
  }

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const handleOpenYear = async () => {
    if (!selectedDistrict || !selectedDepartement || !selectedAnnee) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)
    
    try {
      const result = await openNewYearForDepartement(
        parseInt(selectedDistrict),
        parseInt(selectedDepartement),
        parseInt(selectedAnnee)
      )

      if (result.success) {
        toast.success(result.message || 'Année ouverte avec succès')
        setShowAddModal(false)
        setSelectedDistrict('')
        setSelectedDepartement('')
        setSelectedAnnee('')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de l\'ouverture')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseYear = async (districtId: number, departementId: number, anneeLabel: string) => {
    if (!confirm(`Fermer l'année ${anneeLabel} ?`)) return

    setActionLoading(departementId)
    
    try {
      const result = await closeYearForDepartement(districtId, departementId)

      if (result.success) {
        toast.success(result.message || 'Année fermée avec succès')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors de la fermeture')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  const handleSetCurrent = async (districtId: number, departementId: number, anneeId: number, anneeLabel: string) => {
    if (!confirm(`Définir ${anneeLabel} comme année en cours ?`)) return

    setActionLoading(anneeId)
    
    try {
      const formData = new FormData()
      formData.append('district_id', districtId.toString())
      formData.append('departement_id', departementId.toString())
      formData.append('annee_id', anneeId.toString())
      
      const result = await setCurrentAnneeDistrict(formData)

      if (result.success) {
        toast.success(result.message || 'Année en cours définie')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur lors du changement')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Une erreur est survenue')
    } finally {
      setActionLoading(null)
    }
  }

  const resetFilters = () => {
    setFilters({
      districtId: '',
      departementId: '',
      anneeId: '',
      statut: '',
      ouvertes: 'all'
    })
  }

  const hasActiveFilters = filters.districtId || filters.departementId || filters.anneeId || filters.statut

  return (
    <div className="max-w-7xl mx-auto  py-2">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/admin" className="hover:text-gray-700">
            Administration
          </Link>
          <span>/</span>
          <span className="text-gray-900">Années par District</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">
              Gestion des années par district
            </h1>
            <p className="text-sm text-gray-500">
              {filteredData.length} année{filteredData.length > 1 ? 's' : ''} trouvée{filteredData.length > 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm -lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ouvrir une année
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white -lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">Filtres</h2>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Filtre District */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              District
            </label>
            <select
              value={filters.districtId}
              onChange={(e) => setFilters({ ...filters, districtId: e.target.value, departementId: '' })}
              className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Tous les districts</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Département */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Département
            </label>
            <select
              value={filters.departementId}
              onChange={(e) => setFilters({ ...filters, departementId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400"
              disabled={!filters.districtId}
            >
              <option value="">Tous les départements</option>
              {filteredDepartements.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Année */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Année
            </label>
            <select
              value={filters.anneeId}
              onChange={(e) => setFilters({ ...filters, anneeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Toutes les années</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut */}
          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Statut
            </label>
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Tous les statuts</option>
              <option value="current">En cours</option>
              <option value="past">Passées</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des districts avec leurs départements et années */}
      <div className="space-y-4">
        {Object.values(groupedData).length === 0 ? (
          <div className="bg-white -lg border border-gray-200 py-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-400">Aucune année trouvée avec ces filtres</p>
          </div>
        ) : (
          Object.entries(groupedData).map(([districtId, districtData]) => {
            const districtKey = `district-${districtId}`
            const isExpanded = expandedGroups.has(districtKey)
            const departementsSansAnnee = getDepartementsSansAnnee(parseInt(districtId))
            const totalAnnees = Object.values(districtData.departements).reduce(
              (acc, dept) => acc + dept.annees.length, 0
            )

            return (
              <div key={districtId} className="bg-white -lg border border-gray-200 overflow-hidden">
                {/* En-tête du district */}
                <button
                  onClick={() => toggleGroup(districtKey)}
                  className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-gray-900">{districtData.district.nom}</span>
                    <span className="text-xs text-gray-500">
                      {Object.keys(districtData.departements).length} département{Object.keys(districtData.departements).length > 1 ? 's' : ''} · {totalAnnees} année{totalAnnees > 1 ? 's' : ''}
                    </span>
                  </div>
                  {departementsSansAnnee.length > 0 && !filters.anneeId && !filters.statut && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 -full">
                      {departementsSansAnnee.length} sans année
                    </span>
                  )}
                </button>

                {/* Contenu du district */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {/* Départements avec années */}
                    {Object.entries(districtData.departements).map(([deptId, deptData]) => {
                      const typeInfo = typeLabels[deptData.departement.type] || typeLabels.normal
                      const currentAnnee = deptData.annees.find(a => a.is_current)
                      
                      return (
                        <div key={deptId} className="p-4 pl-12">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-gray-800">{deptData.departement.nom}</span>
                              <span className={`text-xs px-2 py-0.5 -full ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              {currentAnnee && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-green-500 -full"></span>
                                  En cours: {currentAnnee.annee?.label}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Liste des années */}
                          <div className="space-y-2">
                            {deptData.annees.map((annee) => (
                              <div key={annee.id} className="flex items-center justify-between p-3 bg-gray-50 -lg">
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium text-gray-700">
                                    {annee.annee?.label}
                                  </span>
                                  {getStatusBadge(annee.status || 'past', annee.is_current)}
                                  <span className="text-xs text-gray-400">
                                    Ajoutée le {new Date(annee.created_at).toLocaleDateString('fr-FR')}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {!annee.is_current && (
                                    <button
                                      onClick={() => handleSetCurrent(
                                        annee.district_id,
                                        annee.departement_id,
                                        annee.annee_id,
                                        annee.annee?.label || ''
                                      )}
                                      disabled={actionLoading === annee.annee_id}
                                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1  hover:bg-blue-50 disabled:opacity-50"
                                    >
                                      Définir en cours
                                    </button>
                                  )}
                                  {annee.is_current && (
                                    <button
                                      onClick={() => handleCloseYear(
                                        annee.district_id,
                                        annee.departement_id,
                                        annee.annee?.label || ''
                                      )}
                                      disabled={actionLoading === annee.departement_id}
                                      className="text-xs text-orange-600 hover:text-orange-800 px-2 py-1  hover:bg-orange-50 disabled:opacity-50"
                                    >
                                      Fermer
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}

                    {/* Départements sans année (seulement si aucun filtre d'année/statut) */}
                    {!filters.anneeId && !filters.statut && departementsSansAnnee.length > 0 && (
                      <div className="p-4 pl-12 bg-gray-50/50">
                        <p className="text-xs text-gray-500 mb-3">Départements sans année ouverte :</p>
                        <div className="flex flex-wrap gap-2">
                          {departementsSansAnnee.map((dept) => {
                            const typeInfo = typeLabels[dept.type] || typeLabels.normal
                            return (
                              <div key={dept.id} className="flex items-center gap-2 px-3 py-1.5 bg-white -lg border border-gray-200">
                                <span className="text-sm text-gray-600">{dept.nom}</span>
                                <span className={`text-xs px-1.5 py-0.5 -full ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                <button
                                  onClick={() => {
                                    setSelectedDistrict(districtId)
                                    setSelectedDepartement(dept.id.toString())
                                    setShowAddModal(true)
                                  }}
                                  className="text-xs text-green-600 hover:text-green-700 ml-2"
                                >
                                  + Ouvrir
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white -lg max-w-md w-full p-6">
            <h3 className="text-lg font-light text-gray-900 mb-4">
              Ouvrir une nouvelle année
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value)
                    setSelectedDepartement('')
                  }}
                  className="w-full px-3 py-2 border border-gray-200 -lg text-sm"
                >
                  <option value="">Sélectionner un district</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Département
                </label>
                <select
                  value={selectedDepartement}
                  onChange={(e) => setSelectedDepartement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 -lg text-sm"
                  disabled={!selectedDistrict}
                >
                  <option value="">Sélectionner un département</option>
                  {departements.map((d) => (
                    <option key={d.id} value={d.id}>{d.nom}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Année
                </label>
                <select
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 -lg text-sm"
                >
                  <option value="">Sélectionner une année</option>
                  {annees.map((a) => (
                    <option key={a.id} value={a.id}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setSelectedDistrict('')
                    setSelectedDepartement('')
                    setSelectedAnnee('')
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleOpenYear}
                  disabled={loading || !selectedDistrict || !selectedDepartement || !selectedAnnee}
                  className="px-4 py-2 bg-green-600 text-white text-sm -lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Ouverture...' : 'Ouvrir l\'année'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}