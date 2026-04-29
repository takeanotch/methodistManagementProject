// app/cabinet/activites/page.tsx
'use client'

import { Suspense, useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  X, 
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  PlayCircle,
  XCircle,
  FileText,
  Download,
  Upload,
  MessageSquare
} from 'lucide-react'
import { getCabinetInfo, getAnneesForCabinet } from '@/actions/cabinet-pastoral'
import { getActivitesByUnite, getActivitesStats, updateActiviteStatut, deleteActivite, getActiviteFiles, addFileToActivite, deleteActiviteFile, updateActiviteCommentaire } from '@/actions/activite'
import { ensureCabinetUniteExists } from '@/actions/cabinet-pastoral'
import { ActiviteModalButton } from './ActiviteModalButton'
import React from 'react'
import { Spinner } from '@/components/Spinner'

interface PageProps {
  params?: Promise<{}>
  searchParams?: Promise<{ annee?: string }>
}

interface ActiviteWithDetails {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  plan_action_id: number | null
  plan_action?: { id: number; titre: string } | null
  unite_id: number
  created_at: string
  updated_at: string
  fichiers_count?: number
  annee_conference_id: number
  commentaire: string | null
}

interface ActiviteFichier {
  id: number
  activite_id: number
  nom_fichier: string
  chemin_fichier: string
  type_fichier: string
}

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📅', iconComponent: Calendar },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '⚡', iconComponent: PlayCircle },
  { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200', icon: '✅', iconComponent: CheckCircle },
  { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200', icon: '❌', iconComponent: XCircle }
]

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function ActivitesPage({ params, searchParams }: PageProps) {
  const router = useRouter()
  
  const [currentView, setCurrentView] = useState<'liste' | 'calendrier'>('liste')
  const [currentAnneeId, setCurrentAnneeId] = useState<number | undefined>(undefined)
  
  // États pour les données
  const [loading, setLoading] = useState(true)
  const [cabinetInfo, setCabinetInfo] = useState<any>(null)
  const [unite, setUnite] = useState<any>(null)
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [activites, setActivites] = useState<ActiviteWithDetails[]>([])
  const [stats, setStats] = useState<any>(null)
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal détails
  const [selectedActivite, setSelectedActivite] = useState<ActiviteWithDetails | null>(null)
  const [activiteFiles, setActiviteFiles] = useState<ActiviteFichier[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  
  // Modal commentaire pour terminer
  const [showTerminerModal, setShowTerminerModal] = useState(false)
  const [activiteToTerminate, setActiviteToTerminate] = useState<ActiviteWithDetails | null>(null)
  const [commentaireTerminer, setCommentaireTerminer] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  
  // Menu contextuel
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  
  // État pour le rafraîchissement
  const [refreshKey, setRefreshKey] = useState(0)

  const canEdit = true

  useEffect(() => {
    loadData()
  }, [refreshKey])

  useEffect(() => {
    if (unite && currentAnneeId) {
      loadActivitesForAnnee()
    }
  }, [currentAnneeId, unite])

  async function loadData() {
    try {
      setLoading(true)
      
      const info = await getCabinetInfo()
      if (!info) {
        router.push('/')
        return
      }
      setCabinetInfo(info)

      const uniteResult = await ensureCabinetUniteExists(info.paroisse_id)
      if (!uniteResult.success || !uniteResult.unite) {
        setLoading(false)
        return
      }
      setUnite(uniteResult.unite)

      const annees = await getAnneesForCabinet(info.paroisse_id)
      setAnneesDisponibles(annees)

      let defaultAnneeId: number | undefined
      const currentAnnee = annees.find((a: any) => a.is_current)
      if (currentAnnee) {
        defaultAnneeId = currentAnnee.id
      } else if (annees.length > 0) {
        defaultAnneeId = annees[0].id
      }
      setCurrentAnneeId(defaultAnneeId)

      if (defaultAnneeId && uniteResult.unite) {
        const activitesData = await getActivitesByUnite(uniteResult.unite.id, defaultAnneeId)
        const statsData = await getActivitesStats(undefined, uniteResult.unite.id, defaultAnneeId)
        setActivites(activitesData)
        setStats(statsData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function loadActivitesForAnnee() {
    if (unite && currentAnneeId) {
      const activitesData = await getActivitesByUnite(unite.id, currentAnneeId)
      const statsData = await getActivitesStats(undefined, unite.id, currentAnneeId)
      setActivites(activitesData)
      setStats(statsData)
    }
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const filteredActivites = activites.filter(activite => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = activite.titre.toLowerCase().includes(searchLower) ||
                          (activite.description || '').toLowerCase().includes(searchLower)
    const matchesStatut = !filterStatut || activite.statut === filterStatut
    return matchesSearch && matchesStatut
  })

  async function openDetailsModal(activite: ActiviteWithDetails) {
    setSelectedActivite(activite)
    setMenuOpen(null)
    
    try {
      const files = await getActiviteFiles(activite.id)
      setActiviteFiles(files)
    } catch (error) {
      console.error('Erreur chargement fichiers:', error)
    }
  }

  async function handleChangeStatut(activite: ActiviteWithDetails, statut: string) {
    if (statut === 'termine') {
      setActiviteToTerminate(activite)
      setCommentaireTerminer(activite.commentaire || '')
      setShowTerminerModal(true)
      setMenuOpen(null)
      return
    }
    
    setActionLoading(activite.id)
    const result = await updateActiviteStatut(activite.id, statut as any)
    
    if (result.success) {
      handleRefresh()
      if (selectedActivite?.id === activite.id) {
        setSelectedActivite({ ...activite, statut: statut as any })
      }
    } else {
      alert(result.error || 'Erreur')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  async function handleTerminateWithComment() {
    if (!activiteToTerminate) return
    
    setSubmittingComment(true)
    
    try {
      const commentResult = await updateActiviteCommentaire(activiteToTerminate.id, commentaireTerminer)
      
      if (!commentResult.success) {
        console.error('Erreur mise à jour commentaire:', commentResult.error)
      }
      
      const result = await updateActiviteStatut(activiteToTerminate.id, 'termine')
      
      if (!result.success) {
        alert(result.error || 'Erreur lors du changement de statut')
        return
      }
      
      handleRefresh()
      
      if (selectedActivite?.id === activiteToTerminate.id) {
        setSelectedActivite({ ...activiteToTerminate, statut: 'termine', commentaire: commentaireTerminer || null })
      }
      
      setShowTerminerModal(false)
      setActiviteToTerminate(null)
      setCommentaireTerminer('')
      
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleDelete(activite: ActiviteWithDetails) {
    if (!confirm(`Supprimer l'activité "${activite.titre}" ?`)) return
    
    setActionLoading(activite.id)
    const result = await deleteActivite(activite.id)
    
    if (result.success) {
      handleRefresh()
      if (selectedActivite) setSelectedActivite(null)
    } else {
      alert(result.error || 'Erreur lors de la suppression')
    }
    
    setActionLoading(null)
    setMenuOpen(null)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedActivite) return
    
    setUploadingFile(true)
    
    const formDataObj = new FormData()
    formDataObj.append('activite_id', selectedActivite.id.toString())
    formDataObj.append('file', file)
    
    const result = await addFileToActivite(formDataObj)
    
    if (result.success) {
      const files = await getActiviteFiles(selectedActivite.id)
      setActiviteFiles(files)
      handleRefresh()
    } else {
      alert(result.error || 'Erreur lors de l\'upload')
    }
    
    setUploadingFile(false)
    e.target.value = ''
  }

  async function handleDeleteFile(fileId: number, fileUrl: string) {
    if (!selectedActivite) return
    if (!confirm('Supprimer ce fichier ?')) return
    
    const result = await deleteActiviteFile(fileId, selectedActivite.id, fileUrl)
    
    if (result.success) {
      setActiviteFiles(prev => prev.filter(f => f.id !== fileId))
      handleRefresh()
    } else {
      alert(result.error || 'Erreur')
    }
  }

  function getStatutInfo(statut: string) {
    return STATUTS.find(s => s.value === statut) || STATUTS[0]
  }

  const groupedActivites = filteredActivites.reduce((acc, activite) => {
    const date = activite.date
    if (!acc[date]) acc[date] = []
    acc[date].push(activite)
    return acc
  }, {} as Record<string, ActiviteWithDetails[]>)

  const sortedDates = Object.keys(groupedActivites).sort((a, b) => a.localeCompare(b))

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
     <Spinner/>
    )
  }

  if (!cabinetInfo) {
    return null
  }

  if (!unite) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="border border-gray-200 py-16 text-center bg-white">
          <h1 className="text-xl font-light mb-2">Configuration requise</h1>
          <p className="text-gray-500">
            L'unité d'organisation pour ce cabinet n'a pas encore été créée.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/cabinet"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Activités</h1>
            <p className="text-sm text-gray-500 mt-0.5">Cabinet Pastoral - {cabinetInfo.paroisse_nom}</p>
          </div>
        </div>
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <Link
            href="/cabinet"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Aperçu
          </Link>
          <Link
            href="/cabinet/membres"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Membres
          </Link>
          <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
            Activités
          </span>
          <Link
            href="/cabinet/plan-action"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Plan d'action
          </Link>
          <Link
            href="/cabinet/budget"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Budget
          </Link>
          <Link
            href="/cabinet/projets"
            className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
          >
            Projets
          </Link>
        </div>
      </div>

      {/* Stats */}
      {stats && currentAnneeId && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          <div className="bg-white border border-gray-200 p-3">
            <div className="text-xl font-light">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-3">
            <div className="text-xl font-light text-blue-700">{stats.planifiees}</div>
            <div className="text-xs text-blue-600">Planifiées</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 p-3">
            <div className="text-xl font-light text-yellow-700">{stats.enCours}</div>
            <div className="text-xs text-yellow-600">En cours</div>
          </div>
          <div className="bg-green-50 border border-green-200 p-3">
            <div className="text-xl font-light text-green-700">{stats.terminees}</div>
            <div className="text-xs text-green-600">Terminées</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 p-3">
            <div className="text-xl font-light text-orange-700">{stats.enRetard}</div>
            <div className="text-xs text-orange-600">En retard</div>
          </div>
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {anneesDisponibles.length > 0 && (
            <select
              value={currentAnneeId || ''}
              onChange={(e) => setCurrentAnneeId(parseInt(e.target.value))}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            >
              {anneesDisponibles.map((annee: any) => (
                <option key={annee.id} value={annee.id}>
                  {annee.label}
                  {annee.is_current ? ' (en cours)' : ''}
                </option>
              ))}
            </select>
          )}

          <div className="flex border border-gray-300">
            <button
              onClick={() => setCurrentView('liste')}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'liste' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              <List size={14} />
              Liste
            </button>
            <button
              onClick={() => setCurrentView('calendrier')}
              className={`flex items-center gap-1 px-3 py-2 text-sm ${currentView === 'calendrier' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              <LayoutGrid size={14} />
              Calendrier
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border ${showFilters || filterStatut ? 'border-black bg-gray-50' : 'border-gray-300'} hover:border-black`}
          >
            <Filter size={18} />
          </button>

          {canEdit && unite && (
            <ActiviteModalButton
              uniteId={unite.id}
              onSuccess={handleRefresh}
            >
              <button className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800">
                <Plus size={16} />
                Nouvelle activité
              </button>
            </ActiviteModalButton>
          )}
        </div>
      </div>

      {/* Filtres étendus */}
      {showFilters && (
        <div className="mb-6 p-4 border border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600">Statut :</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-3 py-1 text-sm border ${!filterStatut ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
              >
                Tous
              </button>
              {STATUTS.map(statut => (
                <button
                  key={statut.value}
                  onClick={() => setFilterStatut(statut.value)}
                  className={`px-3 py-1 text-sm border ${filterStatut === statut.value ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
                >
                  {statut.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="ml-auto text-sm text-gray-500 hover:text-black"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {!currentAnneeId ? (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune année disponible</p>
        </div>
      ) : currentView === 'calendrier' ? (
        <CalendrierView
          activites={filteredActivites}
          currentMonth={new Date()}
          onViewDetails={openDetailsModal}
        />
      ) : filteredActivites.length === 0 ? (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 mb-4">Aucune activité pour cette période</p>
          {canEdit && unite && (
            <ActiviteModalButton
              uniteId={unite.id}
              onSuccess={handleRefresh}
            >
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800">
                <Plus size={16} />
                Créer une activité
              </button>
            </ActiviteModalButton>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const activitesDuJour = groupedActivites[date]
            return (
              <div key={date}>
                <div className="text-sm font-medium text-gray-500 mb-2">
                  {formatDate(date)}
                </div>
                <div className="space-y-2">
                  {activitesDuJour.map(activite => {
                    const statutInfo = getStatutInfo(activite.statut)
                    const isPast = new Date(activite.date) < new Date()
                    const isEnRetard = isPast && activite.statut !== 'termine' && activite.statut !== 'annule'
                    
                    return (
                      <div
                        key={activite.id}
                        className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-center min-w-[60px]">
                            <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                            <span className="text-sm font-medium">{activite.heure}</span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{activite.titre}</h3>
                                {activite.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                    {activite.description}
                                  </p>
                                )}
                                {activite.plan_action && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Plan: {activite.plan_action.titre}
                                  </p>
                                )}
                                {activite.commentaire && activite.statut === 'termine' && (
                                  <div className="flex items-start gap-1 mt-2 text-xs text-gray-500 bg-gray-50 p-2 border border-gray-100">
                                    <MessageSquare size={12} className="mt-0.5 flex-shrink-0" />
                                    <span className="italic">{activite.commentaire}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 border ${statutInfo.color}`}>
                                  <span className="mr-1">{statutInfo.icon}</span>
                                  {statutInfo.label}
                                </span>
                                
                                {isEnRetard && (
                                  <span className="text-xs text-orange-600 font-medium">
                                    En retard
                                  </span>
                                )}
                                
                                <div className="relative">
                                  <button
                                    onClick={() => setMenuOpen(menuOpen === activite.id ? null : activite.id)}
                                    className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <MoreVertical size={16} />
                                  </button>
                                  
                                  {menuOpen === activite.id && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[180px]">
                                      <button
                                        onClick={() => openDetailsModal(activite)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        <Eye size={14} /> Voir détails
                                      </button>
                                      
                                      <Link
                                        href={`/cabinet/activites/${activite.id}`}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 block"
                                      >
                                        <FileText size={14} /> Page complète
                                      </Link>
                                      
                                      {canEdit && (
                                        <>
                                          <ActiviteModalButton
                                            uniteId={unite.id}
                                            onSuccess={handleRefresh}
                                            activite={activite}
                                          >
                                            <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                              <Edit size={14} /> Modifier
                                            </button>
                                          </ActiviteModalButton>
                                          
                                          <div className="border-t border-gray-100 my-1"></div>
                                          
                                          {STATUTS.filter(s => s.value !== activite.statut).map(statut => (
                                            <button
                                              key={statut.value}
                                              onClick={() => handleChangeStatut(activite, statut.value)}
                                              disabled={actionLoading === activite.id}
                                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                            >
                                              {React.createElement(statut.iconComponent, { size: 14 })}
                                              Marquer {statut.label.toLowerCase()}
                                            </button>
                                          ))}
                                          
                                          <div className="border-t border-gray-100 my-1"></div>
                                          
                                          <button
                                            onClick={() => handleDelete(activite)}
                                            disabled={actionLoading === activite.id}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                          >
                                            {actionLoading === activite.id ? (
                                              <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                              <Trash2 size={14} />
                                            )}
                                            Supprimer
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal détails */}
      {selectedActivite && (
        <DetailsModal
          activite={selectedActivite}
          fichiers={activiteFiles}
          onClose={() => setSelectedActivite(null)}
          onFileUpload={handleFileUpload}
          onFileDelete={handleDeleteFile}
          uploadingFile={uploadingFile}
          canEdit={canEdit}
          uniteId={unite?.id}
          onStatusChange={handleChangeStatut}
          onDelete={handleDelete}
          onEdit={() => {}}
          actionLoading={actionLoading}
        />
      )}

      {/* Modal pour terminer avec commentaire */}
      {showTerminerModal && activiteToTerminate && (
        <TerminerAvecCommentaireModal
          activite={activiteToTerminate}
          commentaire={commentaireTerminer}
          onCommentaireChange={setCommentaireTerminer}
          onConfirm={handleTerminateWithComment}
          onCancel={() => {
            setShowTerminerModal(false)
            setActiviteToTerminate(null)
            setCommentaireTerminer('')
          }}
          loading={submittingComment}
        />
      )}

      {menuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  )
}

// Composant pour la modale de commentaire lors de la terminaison
function TerminerAvecCommentaireModal({
  activite,
  commentaire,
  onCommentaireChange,
  onConfirm,
  onCancel,
  loading
}: {
  activite: ActiviteWithDetails
  commentaire: string
  onCommentaireChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Marquer comme terminé</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">
            Vous allez marquer l'activité <strong>{activite.titre}</strong> comme terminée.
          </p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => onCommentaireChange(e.target.value)}
              placeholder="Ajoutez un commentaire sur le déroulement de l'activité..."
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black min-h-[100px] resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Ce commentaire sera enregistré avec l'activité.
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle size={14} />
                Confirmer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Composant CalendrierView
function CalendrierView({ 
  activites, 
  currentMonth: initialMonth,
  onViewDetails 
}: { 
  activites: ActiviteWithDetails[]
  currentMonth: Date
  onViewDetails: (activite: ActiviteWithDetails) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    const startDay = firstDay.getDay() || 7
    for (let i = 1; i < startDay; i++) {
      const d = new Date(year, month, 1 - i)
      days.unshift({ date: d, isCurrentMonth: false })
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    
    const remainingDays = 42 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }
    
    return days
  }

  const getActivitesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return activites.filter(a => a.date === dateStr)
  }

  const getStatutInfo = (statut: string) => {
    return STATUTS.find(s => s.value === statut) || STATUTS[0]
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  return (
    <div className="border border-gray-200 bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          className="p-1 hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-light">
          {MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          className="p-1 hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
          <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7">
        {getDaysInMonth(currentMonth).map((day, idx) => {
          const activitesDuJour = getActivitesForDate(day.date)
          
          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 border-b border-r border-gray-100 ${
                !day.isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday(day.date) ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`text-xs mb-1 ${!day.isCurrentMonth ? 'text-gray-400' : ''}`}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1">
                {activitesDuJour.slice(0, 3).map(activite => {
                  const statutInfo = getStatutInfo(activite.statut)
                  return (
                    <button
                      key={activite.id}
                      onClick={() => onViewDetails(activite)}
                      className={`w-full text-left text-xs p-1 truncate border ${statutInfo.color} cursor-pointer hover:opacity-80`}
                      title={`${activite.heure} - ${activite.titre}`}
                    >
                      {activite.heure} {activite.titre}
                    </button>
                  )
                })}
                {activitesDuJour.length > 3 && (
                  <div className="text-xs text-gray-400 pl-1">
                    +{activitesDuJour.length - 3} autre(s)
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant DetailsModal
function DetailsModal({ 
  activite, 
  fichiers,
  onClose,
  onFileUpload,
  onFileDelete,
  uploadingFile,
  canEdit,
  uniteId,
  onStatusChange,
  onDelete,
  onEdit,
  actionLoading
}: { 
  activite: ActiviteWithDetails
  fichiers: ActiviteFichier[]
  onClose: () => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileDelete: (fileId: number, fileUrl: string) => void
  uploadingFile: boolean
  canEdit: boolean
  uniteId: number
  onStatusChange: (activite: ActiviteWithDetails, statut: string) => void
  onDelete: (activite: ActiviteWithDetails) => void
  onEdit: () => void
  actionLoading: number | null
}) {
  const statutInfo = STATUTS.find(s => s.value === activite.statut) || STATUTS[0]

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getFileIcon = (type: string) => {
    const icons: Record<string, string> = {
      'pdf': '📄',
      'doc': '📝',
      'docx': '📝',
      'xls': '📊',
      'xlsx': '📊',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️',
      'mp4': '🎥',
      'mp3': '🎵'
    }
    return icons[type] || '📎'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Détails de l'activité</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2">{activite.titre}</h2>
            {activite.description && (
              <p className="text-gray-600">{activite.description}</p>
            )}
            {activite.plan_action && (
              <p className="text-sm text-gray-500 mt-2">
                Plan d'action: {activite.plan_action.titre}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Date</div>
                <div className="text-sm">{formatDate(activite.date)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Heure</div>
                <div className="text-sm">{activite.heure}</div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xs text-gray-500 mb-1">Statut</div>
            <span className={`inline-flex items-center gap-1 text-sm px-3 py-1 border ${statutInfo.color}`}>
              <span>{statutInfo.icon}</span>
              {statutInfo.label}
            </span>
          </div>

          {activite.commentaire && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-1">Commentaire</div>
              <div className="bg-gray-50 p-3 border border-gray-200 text-sm text-gray-700">
                {activite.commentaire}
              </div>
            </div>
          )}

          {canEdit && (
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-2">Changer le statut</div>
              <div className="flex flex-wrap gap-2">
                {STATUTS.filter(s => s.value !== activite.statut).map(statut => (
                  <button
                    key={statut.value}
                    onClick={() => onStatusChange(activite, statut.value)}
                    className={`px-3 py-1 text-sm border ${statut.color} hover:opacity-80`}
                  >
                    {statut.icon} {statut.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Fichiers joints</h4>
              {canEdit && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    onChange={onFileUpload}
                    disabled={uploadingFile}
                    className="hidden"
                  />
                  <span className="flex items-center gap-1 text-sm text-gray-500 hover:text-black">
                    {uploadingFile ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    Ajouter
                  </span>
                </label>
              )}
            </div>

            {fichiers.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Aucun fichier joint
              </p>
            ) : (
              <div className="space-y-2">
                {fichiers.map(file => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getFileIcon(file.type_fichier)}</span>
                      <span className="text-sm">{file.nom_fichier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={file.chemin_fichier}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-400 hover:text-black"
                        title="Télécharger"
                      >
                        <Download size={16} />
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => onFileDelete(file.id, file.chemin_fichier)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          <Link
            href={`/cabinet/activites/${activite.id}`}
            className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-center text-sm"
          >
            Voir page complète
          </Link>
          {canEdit && (
            <>
              <ActiviteModalButton
                uniteId={uniteId}
                activite={activite}
              >
                <button className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm flex items-center justify-center gap-2">
                  <Edit size={14} />
                  Modifier
                </button>
              </ActiviteModalButton>
              <button
                onClick={() => onDelete(activite)}
                disabled={actionLoading === activite.id}
                className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 text-sm flex items-center justify-center gap-2"
              >
                {actionLoading === activite.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}