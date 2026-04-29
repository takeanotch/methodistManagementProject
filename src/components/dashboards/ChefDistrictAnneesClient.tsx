

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getAnnees,
  getAllAnneesDistrict,
  getCurrentAnneeDistrict,
  getPreviousAnneeDistrict,
  getNextAnneeDistrict,
  ouvrirNouvelleAnnee,
  setCurrentAnnee,
  deleteAnnee
} from '@/actions/chef-district-annees'
import { getChefsByDistrict } from '@/actions/chef-departement'

interface ChefInfo {
  id: number
  fidele_id: number
  departement_id: number
  district_id: number
  departement_nom: string
  district_nom: string
  fidele_nom: string
  fidele_prenom: string
  role?: {
    id: number
    nom_role: string
    label_role: string
  }
}

interface Annee {
  id: number
  label: string
}

interface AnneeDistrict {
  id: number
  district_id: number
  departement_id: number
  annee_id: number
  is_current: boolean
  created_at: string
  annee?: Annee
}

interface AutreMembre {
  id: number
  fidele_id: number
  fidele_nom: string
  fidele_prenom: string
  fidele_post_nom?: string
  role?: {
    id: number
    nom_role: string
    label_role: string
  }
  profile_img?: string
}

interface ChefDistrictAnneesClientProps {
  initialChefInfo: ChefInfo
}

export default function ChefDistrictAnneesClient({ initialChefInfo }: ChefDistrictAnneesClientProps) {
  const router = useRouter()
  
  const [chefInfo] = useState<ChefInfo>(initialChefInfo)
  const [annees, setAnnees] = useState<Annee[]>([])
  const [historique, setHistorique] = useState<AnneeDistrict[]>([])
  const [anneeEnCours, setAnneeEnCours] = useState<AnneeDistrict | null>(null)
  const [anneePrecedente, setAnneePrecedente] = useState<AnneeDistrict | null>(null)
  const [anneeSuivante, setAnneeSuivante] = useState<AnneeDistrict | null>(null)
  const [autresMembres, setAutresMembres] = useState<AutreMembre[]>([])
  
  const [selectedAnnee, setSelectedAnnee] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      const anneesData = await getAnnees()
      setAnnees(anneesData)
      
      await loadHistorique()
      await loadAutresMembres()
      
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const loadHistorique = async () => {
    if (!chefInfo) return
    
    try {
      const [historiqueData, enCoursData, precedenteData, suivanteData] = await Promise.all([
        getAllAnneesDistrict(chefInfo.district_id, chefInfo.departement_id),
        getCurrentAnneeDistrict(chefInfo.district_id, chefInfo.departement_id),
        getPreviousAnneeDistrict(chefInfo.district_id, chefInfo.departement_id),
        getNextAnneeDistrict(chefInfo.district_id, chefInfo.departement_id)
      ])
      
      setHistorique(historiqueData)
      setAnneeEnCours(enCoursData)
      setAnneePrecedente(precedenteData)
      setAnneeSuivante(suivanteData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement historique' })
    }
  }

  const loadAutresMembres = async () => {
    if (!chefInfo) return
    
    try {
      const chefs = await getChefsByDistrict(chefInfo.district_id)
      
      // Filtrer pour n'avoir que les membres du même département
      const membresDepartement = chefs
        .filter(c => 
          c.departement_id === chefInfo.departement_id && 
          c.fidele_id !== chefInfo.fidele_id
        )
        .map(c => ({
          id: c.id,
          fidele_id: c.fidele_id,
          fidele_nom: c.fidele?.nom || '',
          fidele_prenom: c.fidele?.prenom || '',
          fidele_post_nom: c.fidele?.post_nom,
          role: c.role || undefined,
          profile_img: c.fidele?.profile_img || undefined
        }))
      
      setAutresMembres(membresDepartement)
    } catch (error) {
      console.error('Erreur chargement autres membres:', error)
    }
  }

  const handleOuvrirAnnee = async (formData: FormData) => {
    if (!chefInfo) return
    
    setMessage(null)
    const result = await ouvrirNouvelleAnnee(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Année ouverte avec succès' })
      await loadHistorique()
      setSelectedAnnee('')
      setShowForm(false)
    }
  }

  const handleSetCurrent = async (id: number) => {
    if (!confirm('Voulez-vous vraiment définir cette année comme année en cours ?')) return
    
    const formData = new FormData()
    formData.append('id', id.toString())
    
    const result = await setCurrentAnnee(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année définie comme courante' })
      await loadHistorique()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette année ? Cette action est irréversible.')) return
    
    const formData = new FormData()
    formData.append('id', id.toString())
    
    const result = await deleteAnnee(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année supprimée' })
      await loadHistorique()
    }
  }

  const getRoleBadge = (role?: { nom_role: string; label_role: string }) => {
    if (!role) return null
    
    const colors = {
      president: 'bg-purple-100 text-purple-700',
      vice_president: 'bg-blue-100 text-blue-700',
      secretaire: 'bg-green-100 text-green-700'
    }
    
    const colorClass = colors[role.nom_role as keyof typeof colors] || 'bg-gray-100 text-gray-700'
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>
        {role.label_role}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-gray-400 text-sm">Chargement...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto ">
 
      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Carte du chef connecté */}
      <div className="mb-8 bg-white rounded-lg border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <h3 className="font-medium text-gray-900">Votre profil</h3>
        </div>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-medium">
                {chefInfo.fidele_prenom?.[0]}{chefInfo.fidele_nom?.[0]}
              </div>
            </div>

            {/* Infos */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-base font-medium text-gray-900">
                  {chefInfo.fidele_prenom} {chefInfo.fidele_nom}
                </span>
                {chefInfo.role && getRoleBadge(chefInfo.role)}
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-gray-500">
                  <span className="font-medium">District :</span> {chefInfo.district_nom}
                </p>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">Département :</span> {chefInfo.departement_nom}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Équipe */}
      {autresMembres.length > 0 && (
        <div className="mb-8 bg-white rounded-lg border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Équipe du département</h3>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">
                {autresMembres.length} membre{autresMembres.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {autresMembres.map((membre) => (
                <div key={membre.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                    {membre.profile_img ? (
                      <img src={membre.profile_img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xs font-medium">
                        {membre.fidele_prenom?.[0] || membre.fidele_nom?.[0] || '?'}
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {membre.fidele_prenom} {membre.fidele_nom} {membre.fidele_post_nom}
                    </p>
                    <div className="mt-1">
                      {membre.role && getRoleBadge(membre.role)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Carte principale - Gestion des années */}
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {/* En-tête */}
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Années d'exercice</h3>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 rounded-lg"
            >
              {showForm ? 'Annuler' : '+ Nouvelle année'}
            </button>
          </div>
        </div>

        {/* Aperçu des années */}
        <div className="p-5 border-b border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Aperçu des années</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Année précédente */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">Année précédente</p>
              {anneePrecedente ? (
                <p className="text-lg font-light text-gray-900">{anneePrecedente.annee?.label}</p>
              ) : (
                <p className="text-sm text-gray-300">Aucune</p>
              )}
            </div>

            {/* Année en cours */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs text-green-600 mb-1">Année en cours</p>
              {anneeEnCours ? (
                <p className="text-lg font-light text-green-700">{anneeEnCours.annee?.label}</p>
              ) : (
                <p className="text-sm text-gray-300">Non définie</p>
              )}
            </div>

            {/* Année suivante */}
            <div className="bg-white rounded-lg border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">Année suivante</p>
              {anneeSuivante ? (
                <p className="text-lg font-light text-gray-900">{anneeSuivante.annee?.label}</p>
              ) : (
                <p className="text-sm text-gray-300">Aucune</p>
              )}
            </div>
          </div>
        </div>

        {/* Formulaire d'ouverture */}
        {showForm && (
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Ouvrir une nouvelle année</p>
            <form action={handleOuvrirAnnee} className="space-y-4">
              <input type="hidden" name="district_id" value={chefInfo.district_id} />
              <input type="hidden" name="departement_id" value={chefInfo.departement_id} />
              
              <div>
                <select
                  name="annee_id"
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
                  required
                >
                  <option value="">Sélectionner une année</option>
                  {annees.map((annee) => {
                    const isDisabled = historique.some(h => h.annee_id === annee.id)
                    return (
                      <option 
                        key={annee.id} 
                        value={annee.id}
                        disabled={isDisabled}
                        className={isDisabled ? 'text-gray-400' : ''}
                      >
                        {annee.label} {isDisabled ? '(déjà ouverte)' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800 rounded-lg"
                >
                  Confirmer l'ouverture
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Historique */}
        <div className="p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Historique des années</p>
          
          {historique.length > 0 ? (
            <div className="space-y-3">
              {historique.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg ${
                    item.is_current ? 'bg-green-50 border border-green-100' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${
                        item.is_current ? 'text-green-700' : 'text-gray-900'
                      }`}>
                        {item.annee?.label}
                      </span>
                      {item.is_current ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          En cours
                        </span>
                      ) : anneeEnCours && item.annee_id < anneeEnCours.annee_id ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                          Passée
                        </span>
                      ) : anneeEnCours && item.annee_id > anneeEnCours.annee_id ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          Future
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      {!item.is_current && (
                        <>
                          <button
                            onClick={() => handleSetCurrent(item.id)}
                            className="text-xs text-green-600 hover:text-green-800 px-2 py-1"
                          >
                            Définir courante
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm">
                Aucune année n'a encore été ouverte pour ce département
              </p>
            </div>
          )}
        </div>

        {/* Note */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">
            <span className="font-medium">Note :</span> Une seule année peut être définie comme "en cours" à la fois. 
            Les années sont automatiquement classées comme passées ou futures par rapport à l'année en cours.
          </p>
        </div>
      </div>
    </div>
  )
}