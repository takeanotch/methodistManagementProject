// app/cabinet/CabinetMembresClient.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  UserPlus, 
  Search,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronDown,
  Mail,
  Phone
} from 'lucide-react'
import { addMembreCabinet, type CabinetMembre } from '@/actions/cabinet-pastoral'

interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  sexe: string
  actif: boolean
}

interface Role {
  id: number
  nom_role: string
  label_role: string
}

interface AnneeDisponible {
  id: number
  label: string
  is_current: boolean
}

interface CabinetMembresClientProps {
  membres: CabinetMembre[]
  fideles: Fidele[]
  roles: Role[]
  currentParoisseId: number
  currentParoisseNom: string | undefined
  anneeSelectionneeId: number | undefined
  anneesDisponibles: AnneeDisponible[]
  peutGerer: boolean
}

export default function CabinetMembresClient({
  membres: initialMembres,
  fideles,
  roles,
  currentParoisseId,
  currentParoisseNom,
  anneeSelectionneeId,
  anneesDisponibles,
  peutGerer
}: CabinetMembresClientProps) {
  const router = useRouter()
  
  const [membres, setMembres] = useState<CabinetMembre[]>(initialMembres)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [selectedRole, setSelectedRole] = useState<number | null>(null)
  const [fideleSearchTerm, setFideleSearchTerm] = useState('')
  const [filterActifs, setFilterActifs] = useState<boolean | null>(null)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddMembre = async () => {
    if (!selectedFidele) {
      setError('Veuillez sélectionner un fidèle')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const result = await addMembreCabinet(
        currentParoisseId,
        selectedFidele.id,
        selectedRole
      )
      
      if (result.success) {
        setSuccess(`${selectedFidele.prenom} ${selectedFidele.nom} a été ajouté au cabinet`)
        setShowAddModal(false)
        setSelectedFidele(null)
        setSelectedRole(null)
        setFideleSearchTerm('')
        
        // Ajouter le nouveau membre à la liste localement
        if (result.membre) {
          const nouveauMembre: CabinetMembre = {
            id: result.membre.id,
            fidele_id: selectedFidele.id,
            paroisse_id: currentParoisseId,
            role_id: selectedRole,
            role_nom: roles.find(r => r.id === selectedRole)?.nom_role || null,
            role_label: roles.find(r => r.id === selectedRole)?.label_role || null,
            est_actif: true,
            fidele_nom: selectedFidele.nom,
            fidele_prenom: selectedFidele.prenom,
            fidele_contact: selectedFidele.contact
          }
          setMembres([...membres, nouveauMembre])
        }
        
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(result.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      console.error('Erreur addMembreCabinet:', error)
      setError('Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAnneeChange = (anneeId: number) => {
    router.push(`/cabinet?annee_conference=${anneeId}`)
  }

  const filteredMembres = membres.filter(m => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      m.fidele_nom.toLowerCase().includes(searchLower) ||
      m.fidele_prenom.toLowerCase().includes(searchLower) ||
      m.role_label?.toLowerCase().includes(searchLower) ||
      m.fidele_contact?.toLowerCase().includes(searchLower)
    )
    
    if (filterActifs !== null) {
      return matchesSearch && m.est_actif === filterActifs
    }
    
    return matchesSearch
  })

  const filteredFideles = fideles.filter(f => {
    if (!f.actif) return false
    
    // Exclure les fidèles déjà membres actifs
    const estDejaMembreActif = membres.some(m => m.fidele_id === f.id && m.est_actif)
    if (estDejaMembreActif) return false
    
    const searchLower = fideleSearchTerm.toLowerCase()
    const fullName = `${f.prenom} ${f.nom} ${f.post_nom || ''}`.toLowerCase()
    return fullName.includes(searchLower) || f.contact?.toLowerCase().includes(searchLower)
  })

  return (
    <div className="space-y-6">
      {/* Barre d'outils */}
      <div className="bg-white border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Sélection de l'année */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={anneeSelectionneeId || ''}
                onChange={(e) => handleAnneeChange(parseInt(e.target.value))}
                className="appearance-none pl-3 pr-8 py-2 border border-gray-300 text-sm focus:ring-2 focus:ring-black focus:border-transparent"
              >
                {anneesDisponibles.map(annee => (
                  <option key={annee.id} value={annee.id}>
                    {annee.label} {annee.is_current ? '(En cours)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            {/* Filtres */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterActifs(null)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  filterActifs === null 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilterActifs(true)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  filterActifs === true 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actifs
              </button>
              <button
                onClick={() => setFilterActifs(false)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  filterActifs === false 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactifs
              </button>
            </div>
          </div>
          
          {peutGerer && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter un membre
            </button>
          )}
        </div>
        
        {/* Barre de recherche */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un membre par nom, prénom, rôle ou contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm flex-1">{error}</span>
          <button onClick={() => setError(null)} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 flex items-center gap-3 text-green-700">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm flex-1">{success}</span>
          <button onClick={() => setSuccess(null)} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Liste des membres */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">
            {filteredMembres.length} membre{filteredMembres.length > 1 ? 's' : ''} trouvé{filteredMembres.length > 1 ? 's' : ''}
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredMembres.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {searchTerm || filterActifs !== null 
                ? 'Aucun membre trouvé avec ces critères' 
                : 'Aucun membre dans le cabinet'
              }
            </div>
          ) : (
            filteredMembres.map(membre => (
              <div
                key={membre.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  membre.est_actif ? '' : 'bg-gray-50 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0
                    ${membre.est_actif ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}
                  `}>
                    {membre.fidele_prenom?.[0] || ''}{membre.fidele_nom?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900">
                      {membre.fidele_prenom} {membre.fidele_nom}
                    </div>
                    {membre.fidele_contact && (
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {membre.fidele_contact}
                      </div>
                    )}
                    {!membre.est_actif && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs">
                        Inactif
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {membre.role_label || 'Membre'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {membre.role_nom || 'Sans rôle défini'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal d'ajout de membre */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-light">Ajouter un membre au cabinet</h3>
              <p className="text-sm text-gray-500 mt-1">
                {currentParoisseNom}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Recherche de fidèle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fidèle <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Rechercher un fidèle par nom ou contact..."
                    value={fideleSearchTerm}
                    onChange={(e) => setFideleSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                
                {fideleSearchTerm && !selectedFidele && (
                  <div className="mt-2 border border-gray-200 max-h-60 overflow-y-auto">
                    {filteredFideles.length === 0 ? (
                      <div className="p-3 text-gray-500 text-sm text-center">
                        Aucun fidèle disponible
                      </div>
                    ) : (
                      filteredFideles.slice(0, 10).map(fidele => (
                        <button
                          key={fidele.id}
                          onClick={() => {
                            setSelectedFidele(fidele)
                            setFideleSearchTerm('')
                          }}
                          className="w-full p-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900">
                            {fidele.prenom} {fidele.nom} {fidele.post_nom || ''}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {fidele.contact || 'Aucun contact'} • {fidele.sexe}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
                
                {selectedFidele && (
                  <div className="mt-2 p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedFidele.prenom} {selectedFidele.nom} {selectedFidele.post_nom || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedFidele.contact || 'Aucun contact'}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFidele(null)}
                        className="text-gray-600 hover:text-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sélection du rôle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rôle (optionnel)
                </label>
                <select
                  value={selectedRole || ''}
                  onChange={(e) => setSelectedRole(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Aucun rôle</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.label_role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSelectedFidele(null)
                  setSelectedRole(null)
                  setFideleSearchTerm('')
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddMembre}
                disabled={!selectedFidele || isSubmitting}
                className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ajout...
                  </>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}