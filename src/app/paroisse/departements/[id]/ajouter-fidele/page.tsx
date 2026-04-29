
'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import { getFidelesByParoisse } from '@/actions/fidele'
import { 
  getRolesByDepartement, 
  addFideleToDepartement,
  getCurrentAnneeForDepartement,
  getCurrentAnneeConferenceForDepartement,
  getAnneesConferenceForDepartement
} from '@/actions/fidele-departement'
import { getDepartementById } from '@/actions/departements'
import { getCurrentFidele } from '@/actions/auth'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface PageProps {
  params: Promise<{
    id: string
  }>
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

interface Annee {
  id: number
  label: string
}

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

export default function AjouterFideleDepartementPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  
  const departementId = parseInt(id)
  
  const [fideles, setFideles] = useState<Fidele[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [departement, setDepartement] = useState<any>(null)
  const [anneeEnCours, setAnneeEnCours] = useState<Annee | null>(null)
  const [anneeConferenceEnCours, setAnneeConferenceEnCours] = useState<AnneeConference | null>(null)
  const [anneesConferenceDisponibles, setAnneesConferenceDisponibles] = useState<AnneeConference[]>([])
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showFideleSelector, setShowFideleSelector] = useState(false)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [currentParoisseId, setCurrentParoisseId] = useState<number | null>(null)

  // Vérifier si l'ID est valide
  if (isNaN(departementId)) {
    router.push('/paroisse/departements')
    return null
  }

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // 1. Récupérer le fidèle connecté pour avoir sa paroisse
        const currentFidele = await getCurrentFidele()
        
        if (!currentFidele) {
          toast.error('Vous devez être connecté')
          router.push('/login')
          return
        }
        
        const paroisseId = currentFidele.paroisse_id
        setCurrentParoisseId(paroisseId)
        
        // 2. Charger le département
        const dept = await getDepartementById(departementId)
        if (!dept) {
          toast.error('Département non trouvé')
          router.push('/paroisse/departements')
          return
        }
        setDepartement(dept)

        // 3. Charger les rôles du département
        const rolesData = await getRolesByDepartement(departementId)
        console.log('📦 Rôles chargés:', rolesData)
        setRoles(rolesData)

        // 4. Récupérer l'année en cours (année district)
        const annee = await getCurrentAnneeForDepartement(departementId)
        console.log('📦 Année en cours (district):', annee)
        
        if (!annee) {
          toast.error('Aucune année en cours définie pour ce département')
          router.push(`/paroisse/departements/${departementId}`)
          return
        }
        setAnneeEnCours(annee)

        // 5. Récupérer l'année de conférence en cours
        const anneeConference = await getCurrentAnneeConferenceForDepartement(departementId)
        console.log('📦 Année de conférence en cours:', anneeConference)
        
        if (anneeConference) {
          setAnneeConferenceEnCours(anneeConference)
          setSelectedAnneeConference(anneeConference)
        } else {
          console.warn('⚠️ Aucune année de conférence en cours trouvée')
        }

        // 6. Récupérer toutes les années de conférence disponibles
        const anneesConf = await getAnneesConferenceForDepartement(departementId)
        console.log('📦 Années de conférence disponibles:', anneesConf)
        
        // S'assurer que l'année en cours est dans la liste si elle existe
        let finalAnneesConf = [...anneesConf]
        if (anneeConference && !anneesConf.some(ac => ac.id === anneeConference.id)) {
          finalAnneesConf = [anneeConference, ...anneesConf]
        }
        
        setAnneesConferenceDisponibles(finalAnneesConf)
        
        // Si aucune année de conférence n'est disponible, afficher une erreur
        if (finalAnneesConf.length === 0) {
          toast.error('Aucune année de conférence disponible pour votre structure')
        }

        // 7. Charger les fidèles de la paroisse de l'utilisateur
        console.log('📦 Chargement des fidèles pour la paroisse:', paroisseId)
        const fidelesData = await getFidelesByParoisse(paroisseId)
        console.log('📦 Fidèles chargés:', fidelesData.length)
        setFideles(fidelesData)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        toast.error('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [departementId, router])

  // Filtrer les fidèles par recherche
  const filteredFideles = fideles.filter(fidele => {
    const fullName = `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`.toLowerCase()
    const searchLower = searchTerm.toLowerCase()
    return fullName.includes(searchLower) ||
           fidele.contact?.toLowerCase().includes(searchLower)
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorDetails(null)
    
    if (!selectedFidele) {
      toast.error('Veuillez sélectionner un fidèle')
      return
    }
    
    if (!selectedRole) {
      toast.error('Veuillez sélectionner un rôle')
      return
    }

    if (!anneeEnCours) {
      toast.error('Aucune année en cours disponible')
      return
    }

    if (!selectedAnneeConference) {
      toast.error('Veuillez sélectionner une année de conférence')
      return
    }

    // Vérifier que le fidèle sélectionné est bien de la bonne paroisse
    if (selectedFidele.paroisse_id !== currentParoisseId) {
      toast.error('Ce fidèle n\'appartient pas à votre paroisse')
      return
    }

    console.log('🔍 État avant envoi:', {
      selectedFidele: {
        id: selectedFidele.id,
        nom: `${selectedFidele.nom} ${selectedFidele.prenom}`,
        paroisse_id: selectedFidele.paroisse_id
      },
      selectedRole: {
        id: selectedRole.id,
        label: selectedRole.label,
      },
      anneeEnCours: {
        id: anneeEnCours.id,
        label: anneeEnCours.label
      },
      selectedAnneeConference: {
        id: selectedAnneeConference.id,
        label: selectedAnneeConference.label,
        is_current: selectedAnneeConference.is_current
      },
      departementId,
    })

    // Vérifier que les IDs sont valides
    if (isNaN(selectedFidele.id) || selectedFidele.id <= 0) {
      toast.error('ID du fidèle invalide')
      return
    }

    if (isNaN(selectedRole.id) || selectedRole.id <= 0) {
      toast.error('ID du rôle invalide')
      return
    }

    if (isNaN(departementId) || departementId <= 0) {
      toast.error('ID du département invalide')
      return
    }

    try {
      // Créer le FormData
      const formData = new FormData()
      
      formData.append('fidele_id', selectedFidele.id.toString())
      formData.append('departement_id', departementId.toString())
      formData.append('role_id', selectedRole.id.toString())
      formData.append('annee_id', anneeEnCours.id.toString())
      formData.append('annee_conference_id', selectedAnneeConference.id.toString())
      
      // Ajouter l'ID de la paroisse pour la vérification côté serveur
      if (currentParoisseId) {
        formData.append('paroisse_id', currentParoisseId.toString())
      }

      console.log('📤 Envoi des données:', {
        fidele_id: selectedFidele.id.toString(),
        departement_id: departementId.toString(),
        role_id: selectedRole.id.toString(),
        role_label: selectedRole.label,
        annee_id: anneeEnCours.id.toString(),
        annee_label: anneeEnCours.label,
        annee_conference_id: selectedAnneeConference.id.toString(),
        annee_conference_label: selectedAnneeConference.label,
        paroisse_id: currentParoisseId
      })

      const result = await addFideleToDepartement(formData)
      
      console.log('📥 Résultat reçu:', result)

      if (result.error) {
        console.error('❌ Erreur retournée:', result.error)
        setErrorDetails(result.error)
        toast.error(result.error)
      } else {
        // console.log('✅ Succès!', result.affectation)
        toast.success('Fidèle ajouté au département avec succès')
        router.push(`/paroisse/departements/${departementId}`)
        router.refresh()
      }
    } catch (error) {
      console.error('❌ Exception dans handleSubmit:', error)
      
      let errorMessage = 'Une erreur inattendue est survenue'
      if (error instanceof Error) {
        errorMessage = error.message
        console.error('Stack trace:', error.stack)
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object') {
        try {
          errorMessage = JSON.stringify(error)
        } catch {
          errorMessage = 'Erreur inconnue (objet non sérialisable)'
        }
      }
      
      setErrorDetails(errorMessage)
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900">
              Ajouter un fidèle
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {departement?.nom} - Sélectionnez un fidèle et son rôle
            </p>
          </div>
          <Link
            href={`/paroisse/departements/${departementId}`}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </Link>
        </div>
      </div>

      {/* Affichage de l'erreur détaillée */}
      {errorDetails && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Erreur lors de l'ajout</h3>
              <p className="text-sm text-red-600 mt-1">{errorDetails}</p>
            </div>
          </div>
        </div>
      )}

      {/* Années - Informations */}
      <div className="mb-6 space-y-3">
        {/* Année District */}
        {anneeEnCours && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium text-blue-800">
                    Année District
                  </p>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    En cours
                  </span>
                </div>
                <p className="text-base font-semibold text-blue-900 mt-1">
                  {anneeEnCours.label}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Année administrative en cours pour ce département
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Année Conférence */}
        {anneeConferenceEnCours ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-sm font-medium text-green-800">
                    Année de Conférence
                  </p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    En cours
                  </span>
                </div>
                <p className="text-base font-semibold text-green-900 mt-1">
                  {anneeConferenceEnCours.label}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Année de conférence en cours pour votre structure
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  Aucune année de conférence en cours
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  Veuillez configurer une année de conférence pour pouvoir ajouter des fidèles
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Sélection du fidèle */}
            <div>
              <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Fidèle <span className="text-red-300">*</span>
              </label>
              
              {selectedFidele ? (
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    {selectedFidele.profile_img ? (
                      <img
                        src={selectedFidele.profile_img}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        {selectedFidele.nom[0]}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {selectedFidele.nom} {selectedFidele.post_nom} {selectedFidele.prenom}
                      </p>
                      <p className="text-xs text-gray-400">{selectedFidele.contact}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFidele(null)
                      setShowFideleSelector(true)
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFideleSelector(true)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-left text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                >
                  + Sélectionner un fidèle
                </button>
              )}
            </div>

            {/* Sélection du rôle */}
            <div>
              <label htmlFor="role_id" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Rôle <span className="text-red-300">*</span>
              </label>
              
              <div className="text-xs text-gray-400 mb-2">
                {roles.length} rôle(s) disponible(s)
              </div>

              <select
                id="role_id"
                value={selectedRole?.id || ''}
                onChange={(e) => {
                  const roleId = parseInt(e.target.value)
                  if (isNaN(roleId)) {
                    setSelectedRole(null)
                    return
                  }
                  const role = roles.find(r => r.id === roleId)
                  setSelectedRole(role || null)
                }}
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label} (Niveau {role.niveau})
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection de l'année de conférence */}
            <div>
              <label htmlFor="annee_conference_id" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Année de Conférence <span className="text-red-300">*</span>
              </label>
              
              <div className="text-xs text-gray-400 mb-2">
                {anneesConferenceDisponibles.length} année(s) de conférence disponible(s)
              </div>

              <select
                id="annee_conference_id"
                value={selectedAnneeConference?.id || ''}
                onChange={(e) => {
                  const acId = parseInt(e.target.value)
                  if (isNaN(acId)) {
                    setSelectedAnneeConference(null)
                    return
                  }
                  const ac = anneesConferenceDisponibles.find(a => a.id === acId)
                  setSelectedAnneeConference(ac || null)
                }}
                required
                disabled={anneesConferenceDisponibles.length === 0}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
              >
                <option value="">Sélectionner une année de conférence</option>
                {anneesConferenceDisponibles.map((ac) => (
                  <option key={ac.id} value={ac.id}>
                    {ac.label} {ac.is_current && '✓ (En cours)'}
                  </option>
                ))}
              </select>
              {anneesConferenceDisponibles.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  Aucune année de conférence disponible. Veuillez contacter l'administrateur.
                </p>
              )}
            </div>

            {/* Informations supplémentaires */}
            {selectedRole && selectedFidele && anneeEnCours && selectedAnneeConference && (
              <div 
                className="p-4 rounded-lg"
                style={{ backgroundColor: `${selectedRole.couleur}10`, borderColor: `${selectedRole.couleur}20`, borderWidth: '1px' }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: selectedRole.couleur }}>
                  Récapitulatif de l'affectation
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Fidèle :</span>
                    <span className="font-medium text-gray-700">{selectedFidele.nom} {selectedFidele.prenom}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Rôle :</span>
                    <span className="font-medium" style={{ color: selectedRole.couleur }}>{selectedRole.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Année District :</span>
                    <span className="font-medium text-blue-600">{anneeEnCours.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Année Conférence :</span>
                    <span className="font-medium text-green-600">
                      {selectedAnneeConference.label}
                      {selectedAnneeConference.is_current && ' (En cours)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Département :</span>
                    <span className="font-medium text-gray-700">{departement?.nom}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-50">
            <button
              type="submit"
              disabled={!selectedFidele || !selectedRole || !anneeEnCours || !selectedAnneeConference || anneesConferenceDisponibles.length === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter au département
            </button>
            <Link
              href={`/paroisse/departements/${departementId}`}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 text-sm hover:text-gray-600 hover:border-gray-300 transition-colors rounded-lg text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>

      {/* Modal de sélection des fidèles */}
      {showFideleSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-lg font-medium text-gray-900">Sélectionner un fidèle</h3>
              <input
                type="text"
                placeholder="Rechercher par nom ou contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-3 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-120px)] p-2">
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
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    {fidele.profile_img ? (
                      <img
                        src={fidele.profile_img}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-medium">
                        {fidele.nom[0]}{fidele.prenom[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fidele.nom} {fidele.post_nom} {fidele.prenom}
                      </p>
                      <p className="text-xs text-gray-500">{fidele.contact}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setShowFideleSelector(false)
                  setSearchTerm('')
                }}
                className="w-full px-4 py-2 border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}