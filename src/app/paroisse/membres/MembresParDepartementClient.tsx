'use client'

import { useState, useEffect } from 'react'
import { getFidelesWithHistoryByDepartement } from '@/actions/fidele-departement'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Departement {
  id: number
  nom: string
  type: string
  description?: string
  roles_config?: any[]
}

interface Annee {
  id: number
  label: string
}

interface FideleDepartement {
  id: number
  fidele_id: number
  role_id: number
  role_details?: {
    id: number
    nom: string
    label: string
    couleur: string
    niveau: number
  }
  annee_id: number
  annee?: {
    id: number
    label: string
  }
  est_actif: boolean
  fidele: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    profile_img?: string
    sexe?: string
  }
}

interface MembresParDepartementClientProps {
  departements: Departement[]
  annees: Annee[]
  paroisseId: number
}

export default function MembresParDepartementClient({
  departements,
  annees,
  paroisseId
}: MembresParDepartementClientProps) {
  const [selectedDepartementId, setSelectedDepartementId] = useState<number | ''>('')
  const [selectedAnneeId, setSelectedAnneeId] = useState<number | ''>('')
  const [membres, setMembres] = useState<FideleDepartement[]>([])
  const [loading, setLoading] = useState(false)
  const [departementInfo, setDepartementInfo] = useState<Departement | null>(null)

  // Charger les membres quand le département et l'année sont sélectionnés
  useEffect(() => {
    async function loadMembres() {
      if (!selectedDepartementId || !selectedAnneeId) {
        setMembres([])
        setDepartementInfo(null)
        return
      }

      setLoading(true)
      try {
        const data = await getFidelesWithHistoryByDepartement(
          selectedDepartementId as number,
          paroisseId,
          selectedAnneeId as number
        )
        
        // Ne garder que les actifs pour l'affichage principal
        const actifs = data.filter((m: FideleDepartement) => m.est_actif)
        setMembres(actifs)
        
        // Récupérer les infos du département
        const dept = departements.find(d => d.id === selectedDepartementId)
        setDepartementInfo(dept || null)
      } catch (error) {
        console.error('Erreur lors du chargement:', error)
        toast.error('Erreur lors du chargement des membres')
      } finally {
        setLoading(false)
      }
    }

    loadMembres()
  }, [selectedDepartementId, selectedAnneeId, paroisseId, departements])

  const handleRechercher = () => {
    // La recherche se fait automatiquement via l'useEffect
    if (!selectedDepartementId || !selectedAnneeId) {
      toast.error('Veuillez sélectionner un département et une année')
    }
  }

  return (
    <div className="space-y-6">
      {/* Sélecteurs */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sélecteur de département */}
          <div>
            <label htmlFor="departement" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Département
            </label>
            <select
              id="departement"
              value={selectedDepartementId}
              onChange={(e) => setSelectedDepartementId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Sélectionner un département</option>
              {departements.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nom} ({dept.type === 'commite' ? 'Comité' : dept.type === 'agence_programme' ? 'Agence' : 'Normal'})
                </option>
              ))}
            </select>
          </div>

          {/* Sélecteur d'année */}
          <div>
            <label htmlFor="annee" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Année
            </label>
            <select
              id="annee"
              value={selectedAnneeId}
              onChange={(e) => setSelectedAnneeId(e.target.value ? parseInt(e.target.value) : '')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
            >
              <option value="">Sélectionner une année</option>
              {annees.map((annee) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bouton de recherche (optionnel, car la recherche est automatique) */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleRechercher}
            disabled={!selectedDepartementId || !selectedAnneeId}
            className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Rechercher
          </button>
        </div>
      </div>

      {/* Résultats */}
      {selectedDepartementId && selectedAnneeId && (
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          {/* En-tête des résultats */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {departementInfo?.nom || 'Département'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Année {annees.find(a => a.id === selectedAnneeId)?.label} • {membres.length} membre{membres.length > 1 ? 's' : ''}
              </p>
            </div>
            
            {departementInfo && (
              <Link
                href={`/paroisse/departements/${selectedDepartementId}/ajouter-fidele?anneeId=${selectedAnneeId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 transition-colors rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Ajouter un membre
              </Link>
            )}
          </div>

          {/* État de chargement */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Chargement des membres...</div>
            </div>
          )}

          {/* Liste des membres */}
          {!loading && (
            <>
              {membres.length === 0 ? (
                <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-gray-100">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-400 mb-2">Aucun membre pour cette année</p>
                  <Link
                    href={`/paroisse/departements/${selectedDepartementId}/ajouter-fidele?anneeId=${selectedAnneeId}`}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter un membre maintenant
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {membres.map((membre) => (
                    <div
                      key={membre.id}
                      className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      {/* Photo */}
                      <Link href={`/paroisse/departements/fideles/${membre.fidele.id}`} className="shrink-0">
                        {membre.fidele.profile_img ? (
                          <img
                            src={membre.fidele.profile_img}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-white"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 text-lg font-medium">
                            {membre.fidele.nom[0]}
                          </div>
                        )}
                      </Link>

                      {/* Infos */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/paroisse/departements/fideles/${membre.fidele.id}`}
                            className="text-base font-medium text-gray-900 hover:text-gray-700 hover:underline"
                          >
                            {membre.fidele.nom} {membre.fidele.post_nom} {membre.fidele.prenom}
                          </Link>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${membre.role_details?.couleur}15`,
                              color: membre.role_details?.couleur || '#6B7280',
                              border: `1px solid ${membre.role_details?.couleur}30`
                            }}
                          >
                            {membre.role_details?.label || 'Rôle inconnu'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {membre.fidele.contact || 'Non renseigné'}
                          </span>
                          {membre.fidele.sexe && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span>{membre.fidele.sexe === 'M' ? 'Homme' : 'Femme'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Lien vers le détail */}
                      <Link
                        href={`/paroisse/departements/fideles/${membre.fidele.id}`}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Voir le détail"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Message si aucun département/année sélectionné */}
      {(!selectedDepartementId || !selectedAnneeId) && (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 mb-2">
            Sélectionnez un département et une année pour voir les membres
          </p>
          <p className="text-sm text-gray-300">
            Vous pourrez ensuite voir tous les membres actifs pour cette période
          </p>
        </div>
      )}
    </div>
  )
}