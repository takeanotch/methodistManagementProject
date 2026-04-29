// app/admin/surintendants/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Loader2, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle,
  UserCheck,
  Building2,
  Mail,
  Phone,
  AlertCircle,
  ChevronLeft,
  X
} from 'lucide-react'
import { 
  getAllSurintendants, 
  createSurintendant, 
  updateSurintendant, 
  deleteSurintendant 
} from '@/actions/surintendant'
import { supabase } from '@/lib/supabase'
import { getFideles } from '@/actions/fidele'

interface Surintendant {
  id: number
  fidele_id: number
  district_id: number
  est_actif: boolean
  created_at: string
  district: {
    id: number
    nom: string
  }
  fidele: {
    id: number
    nom: string
    prenom: string
    contact: string | null
    profile_img: string | null
  }
}

interface District {
  id: number
  nom: string
  conference: {
    id: number
    nom: string
  }
}

interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  profile_img: string | null
  compte: {
    id: number
    role_id: number
    role: {
      nom: string
      niveau: string
    }
  } | null
}

export default function AdminSurintendantsPage() {
  const [loading, setLoading] = useState(true)
  const [surintendants, setSurintendants] = useState<Surintendant[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [allFideles, setAllFideles] = useState<Fidele[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDistrict, setFilterDistrict] = useState<string>('')
  const [filterActif, setFilterActif] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingSurintendant, setEditingSurintendant] = useState<Surintendant | null>(null)
  
  // États pour la recherche de fidèles
  const [fideleSearchTerm, setFideleSearchTerm] = useState('')
  const [filteredFideles, setFilteredFideles] = useState<Fidele[]>([])
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [showFideleDropdown, setShowFideleDropdown] = useState(false)
  
  const [formData, setFormData] = useState({
    district_id: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Surintendant | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      // Charger les surintendants
      const surintendantsData = await getAllSurintendants()
      setSurintendants(surintendantsData)
      
      // Charger les districts
      const { data: districtsData } = await supabase
        .from('district')
        .select(`
          id,
          nom,
          conference:conference_id (id, nom)
        `)
        .order('nom')
      
      if (districtsData) {
        setDistricts(districtsData.map(d => ({
          ...d,
          conference: Array.isArray(d.conference) ? d.conference[0] : d.conference
        })))
      }
      
      // Charger tous les fidèles
      const fidelesData = await getFideles()
      setAllFideles(fidelesData)
      
      setLoading(false)
    } catch (error) {
      console.error('Erreur chargement:', error)
      setLoading(false)
    }
  }

  // Filtrer les fidèles pour la recherche
  useEffect(() => {
    if (fideleSearchTerm.trim() === '') {
      setFilteredFideles(allFideles.slice(0, 10))
    } else {
      const searchLower = fideleSearchTerm.toLowerCase()
      const filtered = allFideles.filter(f => 
        f.nom.toLowerCase().includes(searchLower) ||
        f.prenom.toLowerCase().includes(searchLower) ||
        (f.post_nom && f.post_nom.toLowerCase().includes(searchLower)) ||
        (f.contact && f.contact.includes(fideleSearchTerm))
      ).slice(0, 20)
      setFilteredFideles(filtered)
    }
  }, [fideleSearchTerm, allFideles])

  const filteredSurintendants = surintendants.filter(s => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      s.fidele.nom.toLowerCase().includes(searchLower) ||
      s.fidele.prenom.toLowerCase().includes(searchLower) ||
      s.district.nom.toLowerCase().includes(searchLower) ||
      (s.fidele.contact || '').includes(searchTerm)
    
    const matchesDistrict = !filterDistrict || s.district_id.toString() === filterDistrict
    const matchesActif = !filterActif || s.est_actif.toString() === filterActif
    
    return matchesSearch && matchesDistrict && matchesActif
  })

  function openCreateModal() {
    setEditingSurintendant(null)
    setFormData({ district_id: '' })
    setSelectedFidele(null)
    setFideleSearchTerm('')
    setError(null)
    setShowModal(true)
  }

  function openEditModal(surintendant: Surintendant) {
    setEditingSurintendant(surintendant)
    setFormData({
      district_id: surintendant.district_id.toString()
    })
    // Pour l'édition, on ne peut pas changer le fidèle
    setSelectedFidele({
      id: surintendant.fidele.id,
      nom: surintendant.fidele.nom,
      post_nom: null,
      prenom: surintendant.fidele.prenom,
      contact: surintendant.fidele.contact,
      profile_img: null,
      compte: null
    })
    setError(null)
    setShowModal(true)
  }

  function handleSelectFidele(fidele: Fidele) {
    setSelectedFidele(fidele)
    setFideleSearchTerm(`${fidele.prenom} ${fidele.nom}`)
    setShowFideleDropdown(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (editingSurintendant) {
        const result = await updateSurintendant(editingSurintendant.id, {
          district_id: parseInt(formData.district_id)
        })
        
        if (result.success) {
          setShowModal(false)
          loadData()
        } else {
          setError(result.error || 'Erreur lors de la mise à jour')
        }
      } else {
        if (!selectedFidele) {
          setError('Veuillez sélectionner un fidèle')
          setSubmitting(false)
          return
        }

        if (!formData.district_id) {
          setError('Veuillez sélectionner un district')
          setSubmitting(false)
          return
        }

        const result = await createSurintendant({
          fidele_id: selectedFidele.id,
          district_id: parseInt(formData.district_id)
        })
        
        if (result.success) {
          setShowModal(false)
          loadData()
        } else {
          setError(result.error || 'Erreur lors de la création')
        }
      }
    } catch (error) {
      setError('Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(surintendant: Surintendant) {
    const result = await deleteSurintendant(surintendant.id)
    if (result.success) {
      setShowDeleteConfirm(null)
      loadData()
    } else {
      alert(result.error || 'Erreur lors de la suppression')
    }
  }

  async function handleToggleActif(surintendant: Surintendant) {
    const result = await updateSurintendant(surintendant.id, {
      est_actif: !surintendant.est_actif
    })
    if (result.success) {
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Link
            href="/admin"
            className="text-gray-400 hover:text-black"
          >
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-light tracking-wide">Gestion des Surintendants</h1>
        </div>
        <p className="text-sm text-gray-500">
          Gérez les surintendants de district. Un surintendant supervise tous les départements de son district.
        </p>
      </div>

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-80 focus:outline-none focus:border-black"
            />
          </div>

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Tous les districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>

          <select
            value={filterActif}
            onChange={(e) => setFilterActif(e.target.value)}
            className="border border-gray-300 px-3 py-2 text-sm bg-white"
          >
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select>

          {(searchTerm || filterDistrict || filterActif) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterDistrict('')
                setFilterActif('')
              }}
              className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
            >
              <X size={14} />
              Effacer les filtres
            </button>
          )}
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Nouveau surintendant
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light">{surintendants.length}</div>
          <div className="text-xs text-gray-500">Total surintendants</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-4">
          <div className="text-2xl font-light text-green-700">
            {surintendants.filter(s => s.est_actif).length}
          </div>
          <div className="text-xs text-green-600">Actifs</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-4">
          <div className="text-2xl font-light text-gray-500">
            {surintendants.filter(s => !s.est_actif).length}
          </div>
          <div className="text-xs text-gray-500">Inactifs</div>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <div className="text-2xl font-light">
            {new Set(surintendants.map(s => s.district_id)).size}
          </div>
          <div className="text-xs text-gray-500">Districts couverts</div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Fidèle</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Contact</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">District</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Statut</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500">Créé le</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSurintendants.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  {searchTerm || filterDistrict || filterActif 
                    ? 'Aucun surintendant ne correspond aux filtres' 
                    : 'Aucun surintendant trouvé'}
                </td>
              </tr>
            ) : (
              filteredSurintendants.map(surintendant => (
                <tr key={surintendant.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {surintendant.fidele.profile_img ? (
                        <img 
                          src={surintendant.fidele.profile_img} 
                          alt="" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <UserCheck size={14} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">
                          {surintendant.fidele.prenom} {surintendant.fidele.nom}
                        </div>
                        <div className="text-xs text-gray-400">ID: {surintendant.fidele_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                     
                      {surintendant.fidele.contact && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone size={12} />
                          {surintendant.fidele.contact}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Building2 size={14} className="text-gray-400" />
                      <span className="text-sm">{surintendant.district.nom}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActif(surintendant)}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs border ${
                        surintendant.est_actif 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      {surintendant.est_actif ? (
                        <><CheckCircle size={12} /> Actif</>
                      ) : (
                        <><XCircle size={12} /> Inactif</>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(surintendant.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(surintendant)}
                        className="p-2 text-gray-400 hover:text-black hover:bg-gray-100"
                        title="Modifier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(surintendant)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        title="Désactiver"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Compteur de résultats */}
      <div className="mt-4 text-xs text-gray-400">
        {filteredSurintendants.length} surintendant{filteredSurintendants.length > 1 ? 's' : ''} affiché{filteredSurintendants.length > 1 ? 's' : ''}
        {filteredSurintendants.length !== surintendants.length && (
          <> sur {surintendants.length} au total</>
        )}
      </div>

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">
                {editingSurintendant ? 'Modifier le surintendant' : 'Nouveau surintendant'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* Recherche de fidèle (seulement en création) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fidèle {editingSurintendant && <span className="text-gray-400 text-xs">(non modifiable)</span>}
                </label>
                
                {editingSurintendant ? (
                  // En édition, afficher le fidèle sélectionné (non modifiable)
                  <div className="p-3 bg-gray-50 border border-gray-200 text-sm">
                    <div className="font-medium">
                      {selectedFidele?.prenom} {selectedFidele?.nom}
                    </div>
                    {selectedFidele?.contact && (
                      <div className="text-xs text-gray-500 mt-1">{selectedFidele.contact}</div>
                    )}
                  </div>
                ) : (
                  // En création, champ de recherche
                  <div className="relative">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un fidèle par nom, prénom ou contact..."
                        value={fideleSearchTerm}
                        onChange={(e) => {
                          setFideleSearchTerm(e.target.value)
                          setShowFideleDropdown(true)
                        }}
                        onFocus={() => setShowFideleDropdown(true)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                        autoComplete="off"
                      />
                    </div>
                    
                    {/* Dropdown des résultats */}
                    {showFideleDropdown && filteredFideles.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg max-h-64 overflow-y-auto">
                        {filteredFideles.map(fidele => (
                          <button
                            key={fidele.id}
                            type="button"
                            onClick={() => handleSelectFidele(fidele)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {fidele.profile_img ? (
                                <img 
                                  src={fidele.profile_img} 
                                  alt="" 
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <UserCheck size={14} className="text-gray-400" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="font-medium">
                                  {fidele.prenom} {fidele.nom}
                                </div>
                                {fidele.post_nom && (
                                  <div className="text-xs text-gray-400">{fidele.post_nom}</div>
                                )}
                                {fidele.contact && (
                                  <div className="text-xs text-gray-500 mt-0.5">{fidele.contact}</div>
                                )}
                              </div>
                              {fidele.compte && (
                                <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200">
                                  {fidele.compte.role?.nom || 'Compte'}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {showFideleDropdown && fideleSearchTerm && filteredFideles.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 shadow-lg p-4 text-center text-gray-400 text-sm">
                        Aucun fidèle trouvé
                      </div>
                    )}
                  </div>
                )}
                
                {/* Fidèle sélectionné (en création) */}
                {!editingSurintendant && selectedFidele && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 text-sm flex items-center justify-between">
                    <div>
                      <span className="font-medium text-green-700">
                        {selectedFidele.prenom} {selectedFidele.nom}
                      </span>
                      {selectedFidele.contact && (
                        <span className="text-xs text-green-600 ml-2">({selectedFidele.contact})</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFidele(null)
                        setFideleSearchTerm('')
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Sélection du district */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <select
                  value={formData.district_id}
                  onChange={(e) => setFormData({ ...formData, district_id: e.target.value })}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
                  required
                >
                  <option value="">Sélectionner un district</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nom} {d.conference ? `(${d.conference.nom})` : '(Sans conférence)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || (!editingSurintendant && !selectedFidele)}
                  className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingSurintendant ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-6">
            <div className="text-center mb-4">
              <AlertCircle size={48} className="mx-auto text-orange-500 mb-3" />
              <h3 className="text-lg font-medium mb-2">Désactiver le surintendant ?</h3>
              <p className="text-sm text-gray-500">
                Êtes-vous sûr de vouloir désactiver <strong>{showDeleteConfirm.fidele.prenom} {showDeleteConfirm.fidele.nom}</strong> en tant que surintendant du district de <strong>{showDeleteConfirm.district.nom}</strong> ?
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Il pourra être réactivé ultérieurement.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700"
              >
                Désactiver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay pour fermer le dropdown de recherche */}
      {showFideleDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowFideleDropdown(false)}
        />
      )}
    </div>
  )
}