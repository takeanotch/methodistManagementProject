

// app/admin/annees/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/actions/auth'
import { getAnnees, createNextYear, deleteAnnee } from '@/actions/annee'
import { 
  getAnneesByConference, 
  getCurrentAnneeConference, 
  getConferencesForSelector,
  ajouterAnneeConference, 
  setCurrentAnnee, 
  supprimerAnneeConference,
  getCurrentAnneeConferenceGlobal,
  type AnneeConference,
  type Annee as AnneeType
} from '@/actions/annee-conference'
import {
  getDistricts,
  getDepartements,
  getAnneesDistrict,
  getCurrentAnneeDistrict,
  ajouterAnneeDistrict,
  setCurrentAnneeDistrict,
  supprimerAnneeDistrict,
  ouvrirAnneePourTous,ajouterAnneePourTous,definirAnneeEnCoursPourTous
} from '@/actions/annee-district'
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
  History,
  Layers,
  Building2,
  ChevronDown,
  MoreHorizontal,
  Search,
  TrendingUp,
  Globe,
  Users
} from 'lucide-react'

// Types
interface Annee {
  id: number
  label: string
}

interface Conference {
  id: number
  nom: string
}

interface District {
  id: number
  nom: string
}

interface Departement {
  id: number
  nom: string
}

interface AnneeDistrict {
  id: number
  district_id: number
  departement_id: number
  annee_id: number
  is_current: boolean
  created_at: string
  annee?: Annee
  district?: District
  departement?: Departement
  status?: 'current' | 'past' | 'future'
}

interface ConferenceWithAnnees {
  id: number
  nom: string
  annees: AnneeConference[]
  currentAnnee: AnneeConference | null
}

type TabType = 'annees' | 'conferences' | 'districts'

export default function AnneesPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('annees')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getUser()
        if (!userData || userData.role?.nom !== 'admin') {
          router.push('/profile')
          return
        }
        setUser(userData)
      } catch (error) {
        console.error('Erreur auth:', error)
        router.push('/profile')
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  const tabs = [
    { id: 'annees' as TabType, label: 'Années', icon: Calendar, description: 'Gérer les années d\'exercice' },
    { id: 'conferences' as TabType, label: 'Conférences', icon: Layers, description: 'Années par conférence' },
    { id: 'districts' as TabType, label: 'Districts & Départements', icon: Building2, description: 'Ouverture des années par district' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white border border-gray-200">
                  <Calendar size={20} className="text-gray-700" />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-gray-900">
                  Gestion des années
                </h1>
              </div>
              <p className="text-gray-500 ml-14">
                Gérez les années d&apos;exercice pour l&apos;ensemble de l&apos;application
              </p>
            </div>
            
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Retour à l&apos;administration
            </Link>
          </div>
        </div>

        {/* Navigation par onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      group inline-flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium transition-all
                      ${isActive 
                        ? 'border-gray-900 text-gray-900' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon size={16} className={isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-500'} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            {tabs.find(t => t.id === activeTab)?.description}
          </p>
        </div>

        {/* Contenu des onglets */}
        <div className="mt-6">
          {activeTab === 'annees' && <AnneesTabContent />}
          {activeTab === 'conferences' && <AnneesConferenceTabContent />}
          {activeTab === 'districts' && <AnneesDistrictTabContent />}
        </div>

      </div>
    </div>
  )
}

// ==================== ONGLET 1 : ANNÉES ====================
function AnneesTabContent() {
  const [annees, setAnnees] = useState<Annee[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadAnnees()
  }, [])

  const loadAnnees = async () => {
    try {
      setLoading(true)
      const anneesData = await getAnnees()
      setAnnees(anneesData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNextYear = async () => {
    setCreating(true)
    setMessage(null)
    
    const result = await createNextYear()
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: `Année ${result.annee?.label} créée avec succès` })
      if (result.annee) {
        setAnnees([result.annee, ...annees])
      }
    }
    
    setCreating(false)
  }

  const handleDelete = async (id: number, label: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'année ${label} ?`)) return
    
    setDeletingId(id)
    setMessage(null)
    
    const result = await deleteAnnee(id)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Année supprimée avec succès' })
      setAnnees(annees.filter(a => a.id !== id))
    }
    
    setDeletingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Total années</p>
          <p className="text-2xl font-light text-gray-900">{annees.length}</p>
        </div>
        <div className="bg-white border border-gray-200 px-5 py-4">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Plus récente</p>
          <p className="text-2xl font-light text-gray-900">{annees[0]?.label || '-'}</p>
        </div>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Liste des années */}
      {annees.length === 0 ? (
        <div className="bg-white border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <Calendar size={64} className="w-full h-full" />
          </div>
          <h3 className="text-xl font-light text-gray-900 mb-2">Aucune année</h3>
          <p className="text-sm text-gray-500 mb-8">Commencez par créer l&apos;année 2025-2026</p>
          <button
            onClick={handleCreateNextYear}
            disabled={creating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? <><Loader2 size={16} className="animate-spin" />Création...</> : <><Plus size={16} />Créer l&apos;année par défaut</>}
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">{annees.length} année{annees.length > 1 ? 's' : ''} au total</p>
            <button
              onClick={handleCreateNextYear}
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? <><Loader2 size={16} className="animate-spin" />Création...</> : <><Plus size={16} />Créer année suivante</>}
            </button>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {annees.map((annee) => (
                <tr key={annee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">#{annee.id}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{annee.label}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDelete(annee.id, annee.label)}
                      disabled={deletingId === annee.id}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer"
                    >
                      {deletingId === annee.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Les années ne peuvent être supprimées que si elles ne sont pas utilisées par des fidèles.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== ONGLET 2 : ANNÉES PAR CONFÉRENCE ====================
function AnneesConferenceTabContent() {
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
      const [conferencesData, anneesData] = await Promise.all([
        getConferencesForSelector(),
        getAnnees()
      ])

      const conferencesAvecAnnees = await Promise.all(
        conferencesData.map(async (conference) => {
          const annees = await getAnneesByConference(conference.id)
          const currentAnnee = await getCurrentAnneeConference(conference.id)
          return { ...conference, annees, currentAnnee }
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
            <Check size={12} />En cours
          </span>
        )
      case 'future':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs border border-blue-200">
            <Clock size={12} />À venir
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-500 text-xs border border-gray-200">
            <History size={12} />Passée
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
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {conferences.map((conference) => {
          const prochaineAnnee = getProchaineAnneeLabel(conference)
          
          return (
            <div key={conference.id} className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-light text-gray-900">{conference.nom}</h2>
                {prochaineAnnee && (
                  <button
                    onClick={() => handleAjouterAnneeSuivante(conference.id)}
                    disabled={addingForConference === conference.id || actionLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingForConference === conference.id ? (
                      <><Loader2 size={16} className="animate-spin" />Ajout...</>
                    ) : (
                      <><Plus size={16} />Ajouter {prochaineAnnee}</>
                    )}
                  </button>
                )}
              </div>

              {conference.currentAnnee && (
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
                  <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Année en cours</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-light text-gray-900">{conference.currentAnnee.annee?.label}</span>
                    {getStatusBadge('current')}
                  </div>
                </div>
              )}

              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Année</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ajoutée le</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {conference.annees.map((ac) => (
                    <tr key={ac.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{ac.annee?.label}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(ac.status || 'past')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">{new Date(ac.created_at).toLocaleDateString('fr-FR')}</span>
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
                              {deletingId === ac.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
                        <p className="text-sm text-gray-500 mb-4">Aucune année pour cette conférence</p>
                        {prochaineAnnee && (
                          <button
                            onClick={() => handleAjouterAnneeSuivante(conference.id)}
                            disabled={addingForConference === conference.id}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {addingForConference === conference.id ? (
                              <><Loader2 size={16} className="animate-spin" />Création...</>
                            ) : (
                              <><Plus size={16} />Ajouter {prochaineAnnee}</>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

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
            <h3 className="text-xl font-light text-gray-900 mb-2">Aucune conférence</h3>
            <p className="text-sm text-gray-500">Aucune conférence n&apos;a été trouvée.</p>
          </div>
        )}
      </div>
    </div>
  )
}









// ==================== ONGLET 3 : DISTRICTS & DÉPARTEMENTS (CORRIGÉ) ====================
function AnneesDistrictTabContent() {
  const [districts, setDistricts] = useState<District[]>([])
  const [departements, setDepartements] = useState<Departement[]>([])
  const [annees, setAnnees] = useState<Annee[]>([])
  const [historique, setHistorique] = useState<AnneeDistrict[]>([])
  const [anneeEnCours, setAnneeEnCours] = useState<AnneeDistrict | null>(null)
  
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null)
  const [selectedDepartement, setSelectedDepartement] = useState<Departement | null>(null)
  
  const [districtSearch, setDistrictSearch] = useState('')
  const [departementSearch, setDepartementSearch] = useState('')
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false)
  const [showDepartementDropdown, setShowDepartementDropdown] = useState(false)
  
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedAnnee, setSelectedAnnee] = useState<Annee | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // États pour les modales globales
  const [showAjouterGlobalModal, setShowAjouterGlobalModal] = useState(false)
  const [showDefinirEnCoursGlobalModal, setShowDefinirEnCoursGlobalModal] = useState(false)
  const [allAnnees, setAllAnnees] = useState<AnneeType[]>([])
  const [selectedGlobalAnnee, setSelectedGlobalAnnee] = useState<AnneeType | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedDistrict && selectedDepartement) {
      loadHistorique(selectedDistrict.id, selectedDepartement.id)
    } else {
      setHistorique([])
      setAnneeEnCours(null)
    }
  }, [selectedDistrict, selectedDepartement])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [districtsData, departementsData, anneesData] = await Promise.all([
        getDistricts(),
        getDepartements(),
        getAnnees()
      ])
      setDistricts(districtsData)
      setDepartements(departementsData)
      setAnnees(anneesData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement des données' })
    } finally {
      setLoading(false)
    }
  }

  const loadHistorique = async (districtId: number, departementId: number) => {
    try {
      const [historiqueData, anneeEnCoursData] = await Promise.all([
        getAnneesDistrict(districtId, departementId),
        getCurrentAnneeDistrict(districtId, departementId)
      ])
      setHistorique(historiqueData)
      setAnneeEnCours(anneeEnCoursData)
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur chargement historique' })
    }
  }

  const handleAjouterAnnee = async (formData: FormData) => {
    setActionLoading(true)
    setMessage(null)
    
    if (!selectedDistrict || !selectedDepartement || !selectedAnnee) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner tous les champs' })
      setActionLoading(false)
      return
    }
    
    formData.append('district_id', selectedDistrict.id.toString())
    formData.append('departement_id', selectedDepartement.id.toString())
    formData.append('annee_id', selectedAnnee.id.toString())
    
    const result = await ajouterAnneeDistrict(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Année ajoutée avec succès' })
      setShowAddModal(false)
      setSelectedAnnee(null)
      loadHistorique(selectedDistrict.id, selectedDepartement.id)
    }
    
    setActionLoading(false)
  }

  const handleDefinirEnCours = async (item: AnneeDistrict) => {
    setActionLoading(true)
    setMenuOpen(null)
    
    const formData = new FormData()
    formData.append('district_id', item.district_id.toString())
    formData.append('departement_id', item.departement_id.toString())
    formData.append('annee_id', item.annee_id.toString())
    
    const result = await setCurrentAnneeDistrict(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année définie comme année en cours' })
      loadHistorique(item.district_id, item.departement_id)
    }
    
    setActionLoading(false)
  }

  const handleSupprimer = async (item: AnneeDistrict) => {
    if (item.is_current) {
      setMessage({ type: 'error', text: 'Impossible de supprimer l\'année en cours' })
      setMenuOpen(null)
      return
    }
    
    setActionLoading(true)
    setMenuOpen(null)
    
    const formData = new FormData()
    formData.append('id', item.id.toString())
    
    const result = await supprimerAnneeDistrict(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: result.message || 'Année supprimée' })
      loadHistorique(item.district_id, item.departement_id)
    }
    
    setActionLoading(false)
  }

  // Charger toutes les années pour les modales globales
  const loadAllAnnees = async () => {
    try {
      const allAnneesData = await getAnnees()
      // Trier par ID décroissant (plus récent en premier)
      allAnneesData.sort((a, b) => b.id - a.id)
      setAllAnnees(allAnneesData)
    } catch (error) {
      console.error('Erreur chargement des années:', error)
    }
  }

  // Ouvrir la modale "Ajouter pour tous" (ajouter l'année à tous les districts/départements)
  const handleAjouterPourTousClick = async () => {
    await loadAllAnnees()
    setShowAjouterGlobalModal(true)
  }

  // Ouvrir la modale "Définir comme année en cours pour tous"
  const handleDefinirEnCoursPourTousClick = async () => {
    await loadAllAnnees()
    setShowDefinirEnCoursGlobalModal(true)
  }

  // Confirmer l'ajout pour tous (ajouter l'année sans la définir comme en cours)
  const handleConfirmAjouterPourTous = async () => {
    if (!selectedGlobalAnnee) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une année' })
      return
    }
    
    setProcessing(true)
    setMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('annee_id', selectedGlobalAnnee.id.toString())
      
      const result = await ajouterAnneePourTous(formData) // Action à créer : ajoute l'année mais ne la définit pas comme en cours
      
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ 
          type: 'success', 
          text: `Année ${selectedGlobalAnnee.label} ajoutée à tous les districts/départements` 
        })
        setShowAjouterGlobalModal(false)
        setSelectedGlobalAnnee(null)
        
        // Recharger l'historique si un district/département est sélectionné
        if (selectedDistrict && selectedDepartement) {
          loadHistorique(selectedDistrict.id, selectedDepartement.id)
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout global:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'ajout des années' })
    } finally {
      setProcessing(false)
    }
  }

  // Confirmer la définition comme année en cours pour tous
  const handleConfirmDefinirEnCoursPourTous = async () => {
    if (!selectedGlobalAnnee) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une année' })
      return
    }
    
    setProcessing(true)
    setMessage(null)
    
    try {
      const formData = new FormData()
      formData.append('annee_id', selectedGlobalAnnee.id.toString())
      
      const result = await definirAnneeEnCoursPourTous(formData) // Action à créer : définit l'année comme is_current = true pour tous
      
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ 
          type: 'success', 
          text: `Année ${selectedGlobalAnnee.label} définie comme année en cours pour tous` 
        })
        setShowDefinirEnCoursGlobalModal(false)
        setSelectedGlobalAnnee(null)
        
        // Recharger l'historique si un district/département est sélectionné
        if (selectedDistrict && selectedDepartement) {
          loadHistorique(selectedDistrict.id, selectedDepartement.id)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la définition globale:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la définition des années en cours' })
    } finally {
      setProcessing(false)
    }
  }

  const filteredDistricts = districts.filter(d => d.nom.toLowerCase().includes(districtSearch.toLowerCase()))
  const filteredDepartements = departements.filter(d => d.nom.toLowerCase().includes(departementSearch.toLowerCase()))
  const anneesIdsDansDistrict = historique.map(h => h.annee_id)
  const anneesDisponibles = annees.filter(a => !anneesIdsDansDistrict.includes(a.id))

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'current':
        return { label: 'En cours', icon: TrendingUp, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
      case 'future':
        return { label: 'À venir', icon: Clock, className: 'bg-sky-50 text-sky-700 border-sky-200' }
      default:
        return { label: 'Passée', icon: History, className: 'bg-gray-50 text-gray-500 border-gray-200' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Boutons d'actions globales */}
      <div className="flex justify-end gap-3">
        {/* Bouton "Ajouter pour tous" = Ouvrir l'année pour tous les districts/départements */}
        <button
          onClick={handleAjouterPourTousClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
        >
          <Plus size={16} />
          Ajouter une année pour tous
        </button>
        
        {/* Bouton "Définir comme année en cours pour tous" = is_current = true pour tous */}
        <button
          onClick={handleDefinirEnCoursPourTousClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors"
        >
          <TrendingUp size={16} />
          Définir comme année en cours pour tous
        </button>
      </div>

      {/* Message toast */}
      {message && (
        <div className={`p-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-sm">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Sélecteurs District/Département */}
      <div className="bg-white border border-gray-200 p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* District Selector */}
          <div className="relative">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
              <Building2 size={14} />District
            </label>
            <button
              onClick={() => { setShowDistrictDropdown(!showDistrictDropdown); setShowDepartementDropdown(false) }}
              className="w-full px-4 py-3 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white"
            >
              <span className={selectedDistrict ? 'text-gray-900' : 'text-gray-400'}>
                {selectedDistrict ? selectedDistrict.nom : 'Sélectionner un district'}
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDistrictDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDistrictDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDistrictDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 max-h-64 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" placeholder="Rechercher..." value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-gray-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDistricts.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">Aucun résultat</div>
                    ) : (
                      filteredDistricts.map(district => (
                        <button
                          key={district.id}
                          onClick={() => { setSelectedDistrict(district); setShowDistrictDropdown(false); setDistrictSearch(''); setSelectedDepartement(null) }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>{district.nom}</span>
                          {selectedDistrict?.id === district.id && <CheckCircle2 size={16} className="text-emerald-600" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Département Selector */}
          <div className="relative">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-gray-400 mb-3">
              <Layers size={14} />Département
            </label>
            <button
              onClick={() => { setShowDepartementDropdown(!showDepartementDropdown); setShowDistrictDropdown(false) }}
              className="w-full px-4 py-3 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedDistrict}
            >
              <span className={selectedDepartement ? 'text-gray-900' : 'text-gray-400'}>
                {selectedDepartement ? selectedDepartement.nom : selectedDistrict ? 'Sélectionner un département' : 'Sélectionnez d\'abord un district'}
              </span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform ${showDepartementDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDepartementDropdown && selectedDistrict && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDepartementDropdown(false)} />
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 max-h-64 overflow-hidden">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text" placeholder="Rechercher..." value={departementSearch}
                        onChange={(e) => setDepartementSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:outline-none focus:border-gray-400"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredDepartements.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400">Aucun résultat</div>
                    ) : (
                      filteredDepartements.map(departement => (
                        <button
                          key={departement.id}
                          onClick={() => { setSelectedDepartement(departement); setShowDepartementDropdown(false); setDepartementSearch('') }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                        >
                          <span>{departement.nom}</span>
                          {selectedDepartement?.id === departement.id && <CheckCircle2 size={16} className="text-emerald-600" />}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {selectedDistrict && selectedDepartement && (
        <>
          {/* Année en cours */}
          {anneeEnCours && (
            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-3">Année en cours</p>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <TrendingUp size={24} className="text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl font-semibold text-emerald-800">{anneeEnCours.annee?.label}</span>
                        <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 text-xs font-medium">En cours</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-emerald-600">
                        <div className="flex items-center gap-1.5"><Building2 size={14} />{anneeEnCours.district?.nom}</div>
                        <div className="w-px h-3 bg-emerald-300" />
                        <div className="flex items-center gap-1.5"><Layers size={14} />{anneeEnCours.departement?.nom}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-emerald-500">
                    Ajoutée le {new Date(anneeEnCours.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bouton Ajouter une année */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={anneesDisponibles.length === 0}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus size={16} />Ajouter une année
              {anneesDisponibles.length === 0 && (
                <span className="absolute -bottom-6 right-0 text-xs text-amber-600 whitespace-nowrap">
                  Toutes les années sont déjà ajoutées
                </span>
              )}
            </button>
          </div>

          {/* Historique des années */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <History size={16} className="text-gray-400" />
              <h3 className="text-sm uppercase tracking-wider text-gray-400">Historique des années</h3>
            </div>
            
            {historique.length > 0 ? (
              <div className="grid gap-3">
                {historique.map((item) => {
                  const statusInfo = getStatusInfo(item.status || 'past')
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={item.id} className={`bg-white border p-5 transition-all ${item.is_current ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-16">
                            <span className="text-2xl font-light text-gray-900">{item.annee?.label}</span>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 border text-xs ${statusInfo.className}`}>
                            <StatusIcon size={12} />
                            {item.is_current ? 'En cours' : statusInfo.label}
                          </div>
                          <div className="text-xs text-gray-400">
                            Ajoutée le {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        
                        <div className="relative">
                          <button onClick={() => setMenuOpen(menuOpen === item.id ? null : item.id)} className="p-2 text-gray-400 hover:text-gray-600">
                            <MoreHorizontal size={18} />
                          </button>
                          
                          {menuOpen === item.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[220px]">
                                {!item.is_current && (
                                  <>
                                    <button 
                                      onClick={() => handleDefinirEnCours(item)} 
                                      disabled={actionLoading} 
                                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 disabled:opacity-50"
                                    >
                                      <TrendingUp size={14} className="text-emerald-600" />
                                      Définir comme année en cours
                                    </button>
                                    <div className="border-t border-gray-100"></div>
                                    <button 
                                      onClick={() => handleSupprimer(item)} 
                                      disabled={actionLoading} 
                                      className="w-full px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3"
                                    >
                                      <Trash2 size={14} />Supprimer
                                    </button>
                                  </>
                                )}
                                {item.is_current && (
                                  <div className="px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    Année en cours (active)
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-16 text-center">
                <Calendar size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 text-sm">Aucune année ajoutée pour ce district/département</p>
                <button onClick={() => setShowAddModal(true)} className="mt-4 text-sm text-gray-600 hover:text-black underline underline-offset-4">
                  Ajouter une première année
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Note d'information */}
      {selectedDistrict && selectedDepartement && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-500 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium mb-1">Information</p>
              <p className="text-xs text-blue-600">
                <strong>Ajouter une année</strong> la rend disponible pour ce département sans changer l'année en cours.
                <br />
                <strong>Définir comme année en cours</strong> active cette année (is_current = true) et désactive automatiquement l'année précédente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout d'année (pour un district/département spécifique) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full border border-gray-200 rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-gray-900">Ajouter une année</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">Année à ajouter</label>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {anneesDisponibles.map((annee) => (
                      <button
                        key={annee.id} 
                        type="button" 
                        onClick={() => setSelectedAnnee(annee)}
                        className={`p-4 border text-center transition-all ${
                          selectedAnnee?.id === annee.id 
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl font-light">{annee.label}</span>
                      </button>
                    ))}
                  </div>
                  {anneesDisponibles.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2">Toutes les années disponibles ont déjà été ajoutées</p>
                  )}
                </div>

                <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">Récapitulatif</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400" />
                      <span className="text-gray-600">District :</span>
                      <span className="font-medium">{selectedDistrict?.nom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers size={14} className="text-gray-400" />
                      <span className="text-gray-600">Département :</span>
                      <span className="font-medium">{selectedDepartement?.nom}</span>
                    </div>
                    {selectedAnnee && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-600">Année :</span>
                        <span className="font-medium">{selectedAnnee.label}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="flex-1 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { const formData = new FormData(); handleAjouterAnnee(formData) }}
                disabled={!selectedAnnee || actionLoading}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <><Loader2 size={16} className="animate-spin" />Ajout...</>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Ajouter pour tous" */}
      {showAjouterGlobalModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full border border-gray-200 rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Plus size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-gray-900">Ajouter une année pour tous</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Cette action ajoutera l'année sélectionnée à tous les districts et départements
                  </p>
                </div>
                <button onClick={() => setShowAjouterGlobalModal(false)} className="ml-auto p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Information */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 mb-1">Information</p>
                      <p className="text-xs text-blue-700">
                        L'année sélectionnée sera <strong>ajoutée</strong> à tous les districts et départements.
                        Elle ne sera <strong>pas définie comme année en cours</strong> automatiquement.
                        Les années déjà existantes seront ignorées.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélection de l'année */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                    Sélectionner l'année à ajouter
                  </label>
                  
                  {allAnnees.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                      <AlertCircle size={20} className="text-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-amber-800">Aucune année disponible.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                      {allAnnees.map((annee) => (
                        <button
                          key={annee.id}
                          type="button"
                          onClick={() => setSelectedGlobalAnnee(annee)}
                          className={`p-4 border rounded-lg text-center transition-all ${
                            selectedGlobalAnnee?.id === annee.id 
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Calendar size={16} className={selectedGlobalAnnee?.id === annee.id ? 'text-blue-600' : 'text-gray-400'} />
                            <span className={`text-xl font-light ${selectedGlobalAnnee?.id === annee.id ? 'text-blue-700' : 'text-gray-900'}`}>
                              {annee.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Résumé */}
                {selectedGlobalAnnee && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Résumé</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-600">Année à ajouter :</span>
                        <span className="font-medium text-gray-900">{selectedGlobalAnnee.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="text-gray-600">Districts concernés :</span>
                        <span className="font-medium text-gray-900">{districts.length}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Layers size={14} className="text-gray-400" />
                        <span className="text-gray-600">Départements concernés :</span>
                        <span className="font-medium text-gray-900">{departements.length}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe size={14} className="text-gray-400" />
                        <span className="text-gray-600">Total combinaisons :</span>
                        <span className="font-medium text-gray-900">{districts.length * departements.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button 
                onClick={() => setShowAjouterGlobalModal(false)} 
                className="flex-1 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAjouterPourTous}
                disabled={!selectedGlobalAnnee || processing || allAnnees.length === 0}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Ajouter pour tous
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal "Définir comme année en cours pour tous" */}
      {showDefinirEnCoursGlobalModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full border border-gray-200 rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 rounded-full">
                  <TrendingUp size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-light text-gray-900">Définir comme année en cours pour tous</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Cette action définira l'année sélectionnée comme année en cours pour tous les districts et départements
                  </p>
                </div>
                <button onClick={() => setShowDefinirEnCoursGlobalModal(false)} className="ml-auto p-1 text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Information */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp size={18} className="text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800 mb-1">Information importante</p>
                      <p className="text-xs text-emerald-700">
                        L'année sélectionnée sera <strong>définie comme année en cours</strong> (is_current = true) pour tous les districts et départements.
                        Si l'année n'est pas encore ajoutée pour certains, elle le sera automatiquement.
                        Les années précédemment en cours seront automatiquement désactivées.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélection de l'année */}
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-3">
                    Sélectionner l'année à définir comme en cours
                  </label>
                  
                  {allAnnees.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                      <AlertCircle size={20} className="text-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-amber-800">Aucune année disponible.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                      {allAnnees.map((annee) => (
                        <button
                          key={annee.id}
                          type="button"
                          onClick={() => setSelectedGlobalAnnee(annee)}
                          className={`p-4 border rounded-lg text-center transition-all ${
                            selectedGlobalAnnee?.id === annee.id 
                              ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500' 
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Calendar size={16} className={selectedGlobalAnnee?.id === annee.id ? 'text-emerald-600' : 'text-gray-400'} />
                            <span className={`text-xl font-light ${selectedGlobalAnnee?.id === annee.id ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {annee.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Résumé */}
                {selectedGlobalAnnee && (
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-2">Résumé</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-600">Année à activer :</span>
                        <span className="font-medium text-gray-900">{selectedGlobalAnnee.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 size={14} className="text-gray-400" />
                        <span className="text-gray-600">Districts concernés :</span>
                        <span className="font-medium text-gray-900">{districts.length}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Layers size={14} className="text-gray-400" />
                        <span className="text-gray-600">Départements concernés :</span>
                        <span className="font-medium text-gray-900">{departements.length}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe size={14} className="text-gray-400" />
                        <span className="text-gray-600">Total combinaisons :</span>
                        <span className="font-medium text-gray-900">{districts.length * departements.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 p-6 flex gap-3">
              <button 
                onClick={() => setShowDefinirEnCoursGlobalModal(false)} 
                className="flex-1 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDefinirEnCoursPourTous}
                disabled={!selectedGlobalAnnee || processing || allAnnees.length === 0}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Définition en cours...
                  </>
                ) : (
                  <>
                    <TrendingUp size={16} />
                    Définir comme en cours pour tous
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}