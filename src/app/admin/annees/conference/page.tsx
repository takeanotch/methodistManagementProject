

// app/admin/annees-conference/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/actions/auth'
import { 
  getAnneesByConference, 
  getCurrentAnneeConference, 
  getAnnees,
  getConferencesForSelector,
  ajouterAnneeConference, 
  setCurrentAnnee, 
  supprimerAnneeConference,
  type AnneeConference,
  type Annee
} from '@/actions/annee-conference'
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  X,
  Check,
  Clock,
  History
} from 'lucide-react'

interface ConferenceWithAnnees {
  id: number
  nom: string
  annees: AnneeConference[]
  currentAnnee: AnneeConference | null
}

export default function AnneesConferencePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conferences, setConferences] = useState<ConferenceWithAnnees[]>([])
  const [anneesDisponibles, setAnneesDisponibles] = useState<Annee[]>([])
  const [actionLoading, setActionLoading] = useState(false)
  const [addingForConference, setAddingForConference] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const user = await getUser()
      if (!user || user.role?.nom !== 'admin') {
        router.push('/profile')
        return
      }

      const [conferencesData, anneesData] = await Promise.all([
        getConferencesForSelector(),
        getAnnees()
      ])

      const conferencesAvecAnnees = await Promise.all(
        conferencesData.map(async (conference) => {
          const annees = await getAnneesByConference(conference.id)
          const currentAnnee = await getCurrentAnneeConference(conference.id)
          
          return {
            ...conference,
            annees,
            currentAnnee
          }
        })
      )

      setConferences(conferencesAvecAnnees)
      setAnneesDisponibles(anneesData)
    } catch (error) {
      console.error('Erreur chargement:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const handleAjouterAnneeSuivante = async (conferenceId: number) => {
    setAddingForConference(conferenceId)
    setMessage(null)
    
    const conference = conferences.find(c => c.id === conferenceId)
    if (!conference) return
    
    const anneesIdsDansConference = conference.annees.map(ac => ac.annee_id)
    const anneesDisponiblesPourConf = anneesDisponibles.filter(a => !anneesIdsDansConference.includes(a.id))
    const anneesTriees = [...anneesDisponiblesPourConf].sort((a, b) => b.id - a.id)
    const anneeSuivante = anneesTriees[0]
    
    if (!anneeSuivante) {
      setMessage({ type: 'error', text: 'Aucune année disponible à ajouter' })
      setAddingForConference(null)
      return
    }
    
    const formData = new FormData()
    formData.append('conference_id', conferenceId.toString())
    formData.append('annee_id', anneeSuivante.id.toString())
    
    const result = await ajouterAnneeConference(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `Année ${anneeSuivante.label} ajoutée avec succès` })
      await loadData()
    }
    
    setAddingForConference(null)
  }

  const handleSetCurrent = async (anneeId: number, conferenceId: number) => {
    if (!confirm('Voulez-vous définir cette année comme année en cours pour cette conférence ?')) return
    
    setActionLoading(true)
    setMessage(null)
    
    const formData = new FormData()
    formData.append('annee_id', anneeId.toString())
    formData.append('conference_id', conferenceId.toString())
    
    const result = await setCurrentAnnee(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année en cours modifiée' })
      await loadData()
    }
    
    setActionLoading(false)
  }

  const handleSupprimer = async (id: number, label: string, isCurrent: boolean, conferenceId: number) => {
    if (isCurrent) {
      setMessage({ type: 'error', text: 'Impossible de supprimer l\'année en cours' })
      return
    }
    
    if (!confirm(`Supprimer l'année ${label} de la conférence ?`)) return
    
    setDeletingId(id)
    setMessage(null)
    
    const formData = new FormData()
    formData.append('id', id.toString())
    formData.append('conference_id', conferenceId.toString())
    
    const result = await supprimerAnneeConference(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année supprimée' })
      await loadData()
    }
    
    setDeletingId(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
            <Check size={12} />
            En cours
          </span>
        )
      case 'future':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs border border-blue-200">
            <Clock size={12} />
            À venir
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 text-xs border border-gray-200">
            <History size={12} />
            Passée
          </span>
        )
    }
  }

  const getProchaineAnneeLabel = (conference: ConferenceWithAnnees) => {
    const anneesIdsDansConference = conference.annees.map(ac => ac.annee_id)
    const anneesDisponiblesPourConf = anneesDisponibles.filter(a => !anneesIdsDansConference.includes(a.id))
    const anneesTriees = [...anneesDisponiblesPourConf].sort((a, b) => b.id - a.id)
    return anneesTriees[0]?.label || null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white border border-gray-200">
                  <Calendar size={20} className="text-gray-700" />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-gray-900">
                  Années par conférence
                </h1>
              </div>
              <p className="text-gray-500 ml-14">
                Gérez les années pour chaque conférence et définissez l&apos;année en cours
              </p>
            </div>
            
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Retour
            </Link>
          </div>
        </div>

        {/* Message toast */}
        {message && (
          <div className={`mb-8 p-4 border ${
            message.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertCircle size={18} />
              )}
              <span className="text-sm">{message.text}</span>
              <button 
                onClick={() => setMessage(null)}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        <div className="space-y-6">
          {conferences.map((conference) => {
            const prochaineAnnee = getProchaineAnneeLabel(conference)
            
            return (
              <div key={conference.id} className="bg-white border border-gray-200 overflow-hidden">
                {/* En-tête de la conférence */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-light text-gray-900">{conference.nom}</h2>
                  {prochaineAnnee && (
                    <button
                      onClick={() => handleAjouterAnneeSuivante(conference.id)}
                      disabled={addingForConference === conference.id || actionLoading}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingForConference === conference.id ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Ajout...
                        </>
                      ) : (
                        <>
                          <Plus size={16} />
                          Ajouter {prochaineAnnee}
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Année en cours */}
                {conference.currentAnnee && (
                  <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                      Année en cours
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-light text-gray-900">
                        {conference.currentAnnee.annee?.label}
                      </span>
                      {getStatusBadge('current')}
                    </div>
                  </div>
                )}

                {/* Liste des années */}
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Année
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ajoutée le
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {conference.annees.map((ac) => (
                      <tr key={ac.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {ac.annee?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(ac.status || 'past')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(ac.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {ac.status !== 'current' && (
                              <button
                                onClick={() => handleSetCurrent(ac.annee_id, conference.id)}
                                disabled={actionLoading}
                                className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                              >
                                Définir en cours
                              </button>
                            )}
                            {ac.status !== 'current' && (
                              <button
                                onClick={() => handleSupprimer(ac.id, ac.annee?.label || '', ac.is_current, conference.id)}
                                disabled={deletingId === ac.id}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Supprimer"
                              >
                                {deletingId === ac.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {conference.annees.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center">
                          <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                            <Calendar size={48} className="w-full h-full" />
                          </div>
                          <p className="text-sm text-gray-500 mb-4">
                            Aucune année pour cette conférence
                          </p>
                          {prochaineAnnee && (
                            <button
                              onClick={() => handleAjouterAnneeSuivante(conference.id)}
                              disabled={addingForConference === conference.id}
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {addingForConference === conference.id ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Création...
                                </>
                              ) : (
                                <>
                                  <Plus size={16} />
                                  Ajouter {prochaineAnnee}
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Footer de la conférence */}
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-xs text-gray-500">
                    {conference.annees.length} année{conference.annees.length > 1 ? 's' : ''} associée{conference.annees.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )
          })}

          {conferences.length === 0 && (
            <div className="bg-white border border-gray-200 p-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                <Calendar size={64} className="w-full h-full" />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-2">
                Aucune conférence
              </h3>
              <p className="text-sm text-gray-500">
                Aucune conférence n&apos;a été trouvée.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}