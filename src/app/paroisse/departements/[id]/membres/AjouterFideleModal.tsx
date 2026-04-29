
// components/AjouterFideleModal.tsx (version corrigée)
'use client'

import { useEffect, useState } from 'react'
import { getFidelesByParoisse } from '@/actions/fidele'
import { 
  getRolesByDepartement, 
  addFideleToDepartement,
} from '@/actions/fidele-departement'
import { getDepartementById } from '@/actions/departements'
import { getAnneesConferenceByConference, getCurrentAnneeConference } from '@/actions/annee-conference'
import { getConferenceByFideleId } from '@/actions/annee-conference'
import { X, Search, Loader2, User, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

interface AjouterFideleModalProps {
  isOpen: boolean
  onClose: () => void
  departementId: number
  departementNom: string
  paroisseId: number
  onSuccess?: () => void
  preselectedAnneeConferenceId?: number | null
}

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  contact: string
  profile_img?: string
  paroisse_id: number
}

interface Role {
  id: number
  nom: string
  label: string
  niveau: number
  couleur: string
}

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

export default function AjouterFideleModal({ 
  isOpen, 
  onClose, 
  departementId, 
  departementNom, 
  paroisseId,
  onSuccess,
  preselectedAnneeConferenceId
}: AjouterFideleModalProps) {
  const [fideles, setFideles] = useState<Fidele[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departement, setDepartement] = useState<any>(null)
  const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showFideleSelector, setShowFideleSelector] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [conferenceId, setConferenceId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && departementId) {
      loadData()
    }
  }, [isOpen, departementId])

  async function loadData() {
    try {
      setLoading(true)
      
      // 1. Récupérer le département
      const dept = await getDepartementById(departementId)
      if (!dept) {
        toast.error('Département non trouvé')
        onClose()
        return
      }
      setDepartement(dept)

      // 2. Récupérer la conférence de la paroisse
      const conference = await getConferenceByFideleId(paroisseId)
      if (!conference) {
        toast.error('Impossible de déterminer la conférence de cette paroisse')
        onClose()
        return
      }
      setConferenceId(conference.id)

      // 3. Récupérer les années de conférence disponibles pour cette conférence
      const annees = await getAnneesConferenceByConference(conference.id)
      if (!annees || annees.length === 0) {
        toast.error('Aucune année de conférence trouvée')
        onClose()
        return
      }
      setAnneesConference(annees)

      // 4. Définir l'année sélectionnée (priorité: preselected -> année en cours -> première année)
      let anneeSelectionnee: AnneeConference | null = null
      
      if (preselectedAnneeConferenceId) {
        anneeSelectionnee = annees.find(a => a.id === preselectedAnneeConferenceId) || null
      }
      
      if (!anneeSelectionnee) {
        const currentAnnee = annees.find(a => a.is_current)
        anneeSelectionnee = currentAnnee || annees[0] || null
      }
      
      setSelectedAnneeConference(anneeSelectionnee)

      // 5. Récupérer les rôles du département
      const rolesData = await getRolesByDepartement(departementId)
      setRoles(rolesData)

      // 6. Récupérer les fidèles de la paroisse
      const fidelesData = await getFidelesByParoisse(paroisseId)
      setFideles(fidelesData)
      
    } catch (error) {
      console.error('Erreur chargement:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const filteredFideles = fideles.filter(fidele => {
    const fullName = `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) || fidele.contact?.toLowerCase().includes(searchLower)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    
    if (!selectedFidele || !selectedRole || !selectedAnneeConference) {
      toast.error('Veuillez remplir tous les champs')
      setSubmitting(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('fidele_id', selectedFidele.id.toString())
      formData.append('departement_id', departementId.toString())
      formData.append('role_id', selectedRole.id.toString())
      formData.append('annee_conference_id', selectedAnneeConference.id.toString())
      formData.append('paroisse_id', paroisseId.toString())

      const result = await addFideleToDepartement(formData)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Membre ajouté avec succès')
        onSuccess?.()
        onClose()
        resetForm()
      }
    } catch (error) {
      toast.error('Une erreur est survenue')
    } finally {
      setSubmitting(false)
    }
  }

  function resetForm() {
    setSelectedFidele(null)
    setSelectedRole(null)
    setSearchTerm('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">Ajouter un membre</h3>
            <p className="text-sm text-gray-500 mt-0.5">{departementNom}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection du fidèle */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Fidèle <span className="text-red-400">*</span>
                </label>
                
                {selectedFidele ? (
                  <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-3">
                      {selectedFidele.profile_img ? (
                        <img src={selectedFidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 flex items-center justify-center text-gray-400 rounded-full">
                          <User size={20} />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {selectedFidele.nom} {selectedFidele.post_nom} {selectedFidele.prenom}
                        </p>
                        <p className="text-xs text-gray-500">{selectedFidele.contact}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFidele(null)}
                      className="text-xs text-gray-400 hover:text-black"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowFideleSelector(true)}
                    className="w-full px-4 py-3 border border-gray-300 text-left text-sm text-gray-500 hover:border-black transition-colors"
                  >
                    + Sélectionner un fidèle
                  </button>
                )}
              </div>

              {/* Sélection du rôle */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Rôle <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedRole?.id || ''}
                  onChange={(e) => {
                    const role = roles.find(r => r.id === parseInt(e.target.value))
                    setSelectedRole(role || null)
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Année de conférence */}
              <div>
                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Année de conférence <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedAnneeConference?.id || ''}
                  onChange={(e) => {
                    const ac = anneesConference.find(a => a.id === parseInt(e.target.value))
                    setSelectedAnneeConference(ac || null)
                  }}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                >
                  <option value="">Sélectionner une année</option>
                  {anneesConference.map((ac) => (
                    <option key={ac.id} value={ac.id}>
                      {ac.label} {ac.is_current && '(en cours)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Récapitulatif */}
              {selectedRole && selectedFidele && selectedAnneeConference && (
                <div 
                  className="p-4 border"
                  style={{ 
                    backgroundColor: `${selectedRole.couleur}10`, 
                    borderColor: `${selectedRole.couleur}30` 
                  }}
                >
                  <p className="text-sm font-medium mb-2" style={{ color: selectedRole.couleur }}>
                    Récapitulatif
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fidèle :</span>
                      <span>{selectedFidele.nom} {selectedFidele.prenom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rôle :</span>
                      <span style={{ color: selectedRole.couleur }}>{selectedRole.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Année :</span>
                      <span>{selectedAnneeConference.label}</span>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedFidele || !selectedRole || !selectedAnneeConference || submitting}
            className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Ajout...</span>
              </>
            ) : (
              'Ajouter'
            )}
          </button>
        </div>
      </div>

      {/* Modal de sélection des fidèles */}
      {showFideleSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setShowFideleSelector(false)}
                  className="text-gray-400 hover:text-black"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-lg font-light">Sélectionner un fidèle</h3>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou contact..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {filteredFideles.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun fidèle trouvé</p>
              ) : (
                filteredFideles.map((fidele) => (
                  <button
                    key={fidele.id}
                    type="button"
                    onClick={() => {
                      setSelectedFidele(fidele)
                      setShowFideleSelector(false)
                      setSearchTerm('')
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left transition-colors"
                  >
                    {fidele.profile_img ? (
                      <img src={fidele.profile_img} alt="" className="w-10 h-10 object-cover rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-gray-400 rounded-full">
                        <User size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {fidele.nom} {fidele.post_nom} {fidele.prenom}
                      </p>
                      <p className="text-xs text-gray-500">{fidele.contact}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}