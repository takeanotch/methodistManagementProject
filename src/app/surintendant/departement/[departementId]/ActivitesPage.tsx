// components/ActivitesPage.tsx
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  BarChart3,
  Building2,
  MapPin
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface ActiviteAffichee {
  id: number
  uniqueKey?: string
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  plan_action_id: number | null
  plan_action?: {
    id: number
    titre: string
  } | null
  unite_id: number
  created_at: string
  updated_at: string
  departement?: string
  departement_id?: number
  paroisse?: string
  paroisse_id?: number
  fichiers_count?: number
}

export interface UniteOrganisationSimple {
  id: number
  nom: string
  reference_id?: number
  paroisse_id?: number
  paroisse_nom?: string
  district_id?: number
  district_nom?: string
}

export interface AnneeConference {
  id: number
  label: string
  is_current: boolean
  annee_id?: number
}

export interface EnhancedStats {
  total: number
  planifiees: number
  enCours: number
  terminees: number
  annulees: number
  enRetard: number
  tauxRealisation: number
  cetteSemaine: number
  ceMois: number
  restantes: number
  termineesCeMois: number
  prochaineActivite: ActiviteAffichee | null
  activitesParDepartement: Record<string, number>
  activitesParParoisse?: Record<string, number>
}

export interface ActivitesPageConfig {
  title: string
  subtitle?: string
  backUrl: string
  backLabel: string
  showParoisseColumn?: boolean
  showDepartementColumn?: boolean
  showDistrictColumn?: boolean
  unites: UniteOrganisationSimple[]
  anneesDisponibles: AnneeConference[]
  currentAnneeId: number | undefined
  onLoadActivites: (uniteId: number, anneeId: number) => Promise<ActiviteAffichee[]>
  onAnneeChange?: (anneeId: number) => void
  additionalFilters?: React.ReactNode
  emptyStateMessage?: string
}

// ============================================
// CONSTANTES
// ============================================

const STATUTS = [
  { value: 'planifie', label: 'Planifié', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: '📅' },
  { value: 'en_cours', label: 'En cours', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: '⚡' },
  { value: 'termine', label: 'Terminé', color: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
  { value: 'annule', label: 'Annulé', color: 'bg-red-50 text-red-700 border-red-200', icon: '❌' }
]

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const JOURS_SEMAINE_COURTS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ============================================
// COMPOSANTS INTERNES
// ============================================

// Sélecteur d'année
function AnneeSelector({ 
  annees, 
  currentAnneeId, 
  onChange 
}: { 
  annees: AnneeConference[]
  currentAnneeId: number | undefined
  onChange: (id: number) => void 
}) {
  if (annees.length === 0) return null

  return (
    <select
      value={currentAnneeId || ''}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
    >
      {annees.map((annee) => (
        <option key={annee.id} value={annee.id}>
          {annee.label}
          {annee.is_current ? ' (en cours)' : ''}
        </option>
      ))}
    </select>
  )
}

// Cartes de statistiques
function StatsCards({ stats }: { stats: EnhancedStats | null }) {
  if (!stats) return null

  return (
    <div className="space-y-3 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-light">{stats.total}</div>
            <Calendar size={18} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-500 mt-1">Total activités</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-light text-blue-700">{stats.cetteSemaine}</div>
            <CalendarDays size={18} className="text-blue-400" />
          </div>
          <div className="text-xs text-blue-600 mt-1">Cette semaine</div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-light text-indigo-700">{stats.ceMois}</div>
            <CalendarRange size={18} className="text-indigo-400" />
          </div>
          <div className="text-xs text-indigo-600 mt-1">Ce mois</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-light text-purple-700">{stats.restantes}</div>
            <CalendarClock size={18} className="text-purple-400" />
          </div>
          <div className="text-xs text-purple-600 mt-1">À venir</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xl font-light text-green-700">{stats.termineesCeMois}</div>
            <CheckCircle2 size={18} className="text-green-400" />
          </div>
          <div className="text-xs text-green-600 mt-1">Terminées ce mois</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-50/50 border border-blue-100 p-2">
          <div className="text-lg font-light text-blue-700">{stats.planifiees}</div>
          <div className="text-xs text-blue-600">📅 Planifiées</div>
        </div>
        <div className="bg-yellow-50/50 border border-yellow-100 p-2">
          <div className="text-lg font-light text-yellow-700">{stats.enCours}</div>
          <div className="text-xs text-yellow-600">⚡ En cours</div>
        </div>
        <div className="bg-green-50/50 border border-green-100 p-2">
          <div className="text-lg font-light text-green-700">{stats.terminees}</div>
          <div className="text-xs text-green-600">✅ Terminées</div>
        </div>
        <div className="bg-red-50/50 border border-red-100 p-2">
          <div className="text-lg font-light text-red-700">{stats.annulees}</div>
          <div className="text-xs text-red-600">❌ Annulées</div>
        </div>
        <div className="bg-orange-50/50 border border-orange-100 p-2">
          <div className="text-lg font-light text-orange-700">{stats.enRetard}</div>
          <div className="text-xs text-orange-600">⚠️ En retard</div>
        </div>
      </div>
    </div>
  )
}

// Vue liste des activités
function ActivitesListView({ 
  activites, 
  onViewDetails,
  showParoisse = false 
}: { 
  activites: ActiviteAffichee[]
  onViewDetails: (activite: ActiviteAffichee) => void
  showParoisse?: boolean
}) {
  if (activites.length === 0) {
    return (
      <div className="border border-gray-200 py-16 text-center bg-white">
        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400">Aucune activité trouvée</p>
      </div>
    )
  }

  const groupedByDate = activites.reduce((acc, activite) => {
    if (!acc[activite.date]) acc[activite.date] = []
    acc[activite.date].push(activite)
    return acc
  }, {} as Record<string, ActiviteAffichee[]>)

  const sortedDates = Object.keys(groupedByDate).sort()

  return (
    <div className="space-y-4">
      {sortedDates.map(date => {
        const activitesDuJour = groupedByDate[date]
        const dateObj = new Date(date)
        
        return (
          <div key={date} className="bg-white border border-gray-200">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <span className="font-medium text-gray-700">
                {dateObj.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="ml-2 text-sm text-gray-500">
                {activitesDuJour.length} activité{activitesDuJour.length > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="divide-y divide-gray-100">
              {activitesDuJour.map(activite => {
                const statutInfo = STATUTS.find(s => s.value === activite.statut) || STATUTS[0]
                
                return (
                  <div key={`${activite.id}-${activite.unite_id}`} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[60px]">
                        <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                        <span className="text-sm font-medium">{activite.heure.substring(0, 5)}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{activite.titre}</h3>
                            
                            {showParoisse && activite.paroisse && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-indigo-600">
                                <MapPin size={12} />
                                <span>{activite.paroisse}</span>
                              </div>
                            )}
                            
                            {activite.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {activite.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 border ${statutInfo.color}`}>
                              {statutInfo.label}
                            </span>
                            
                            <button
                              onClick={() => onViewDetails(activite)}
                              className="p-1 text-gray-400 hover:text-black transition-colors"
                              title="Voir détails"
                            >
                              <Eye size={16} />
                            </button>
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
  )
}

// Modal de détails
function DetailsModal({ 
  activite, 
  onClose,
  showParoisse = false 
}: { 
  activite: ActiviteAffichee | null
  onClose: () => void
  showParoisse?: boolean
}) {
  if (!activite) return null

  const statutInfo = STATUTS.find(s => s.value === activite.statut) || STATUTS[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Détails de l'activité</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xl font-medium mb-2">{activite.titre}</h2>
          
          {showParoisse && activite.paroisse && (
            <div className="flex items-center gap-1 text-indigo-600 text-sm mb-3">
              <MapPin size={14} />
              <span>{activite.paroisse}</span>
            </div>
          )}
          
          {activite.description && (
            <p className="text-gray-600 mb-4">{activite.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500">Date</div>
              <div className="text-sm">
                {new Date(activite.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Heure</div>
              <div className="text-sm">{activite.heure}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Statut</div>
            <span className={`inline-block text-sm px-3 py-1 border ${statutInfo.color}`}>
              {statutInfo.label}
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-gray-300 hover:border-black transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function ActivitesPage({
  config,
  loading: externalLoading = false
}: {
  config: ActivitesPageConfig
  loading?: boolean
}) {
  const {
    title,
    subtitle,
    backUrl,
    backLabel,
    showParoisseColumn = false,
    showDepartementColumn = true,
    unites,
    anneesDisponibles,
    currentAnneeId,
    onLoadActivites,
    onAnneeChange,
    emptyStateMessage = "Aucune activité"
  } = config

  // États
  const [loading, setLoading] = useState(true)
  const [activites, setActivites] = useState<ActiviteAffichee[]>([])
  const [stats, setStats] = useState<EnhancedStats | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [selectedActivite, setSelectedActivite] = useState<ActiviteAffichee | null>(null)
  
  // Refs pour éviter les boucles infinies
  const isLoadingRef = useRef(false)
  const lastLoadedRef = useRef<string>('')

  // Calculer les statistiques
  const calculateStats = useCallback((activitesList: ActiviteAffichee[]): EnhancedStats => {
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)
    
    const debutSemaine = new Date(aujourdhui)
    const jourSemaine = aujourdhui.getDay() || 7
    debutSemaine.setDate(aujourdhui.getDate() - jourSemaine + 1)
    
    const finSemaine = new Date(debutSemaine)
    finSemaine.setDate(debutSemaine.getDate() + 6)
    
    const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1)
    const finMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0)

    const total = activitesList.length
    const planifiees = activitesList.filter(a => a.statut === 'planifie').length
    const enCours = activitesList.filter(a => a.statut === 'en_cours').length
    const terminees = activitesList.filter(a => a.statut === 'termine').length
    const annulees = activitesList.filter(a => a.statut === 'annule').length

    const enRetard = activitesList.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite < aujourdhui && a.statut !== 'termine' && a.statut !== 'annule'
    }).length

    const cetteSemaine = activitesList.filter(a => {
      const dateActivite = new Date(a.date)
      return dateActivite >= debutSemaine && dateActivite <= finSemaine
    }).length

    const ceMois = activitesList.filter(a => {
      const dateActivite = new Date(a.date)
      return dateActivite >= debutMois && dateActivite <= finMois
    }).length

    const termineesCeMois = activitesList.filter(a => {
      const dateActivite = new Date(a.date)
      return dateActivite >= debutMois && dateActivite <= finMois && a.statut === 'termine'
    }).length

    const restantes = activitesList.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= aujourdhui && a.statut !== 'annule' && a.statut !== 'termine'
    }).length

    const prochaines = activitesList
      .filter(a => {
        const dateActivite = new Date(a.date)
        dateActivite.setHours(0, 0, 0, 0)
        return dateActivite >= aujourdhui && a.statut !== 'annule' && a.statut !== 'termine'
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const tauxRealisation = total > 0 && (total - annulees) > 0 
      ? (terminees / (total - annulees)) * 100 
      : 0

    const activitesParDepartement: Record<string, number> = {}
    const activitesParParoisse: Record<string, number> = {}
    
    activitesList.forEach(a => {
      if (a.departement) {
        activitesParDepartement[a.departement] = (activitesParDepartement[a.departement] || 0) + 1
      }
      if (a.paroisse) {
        activitesParParoisse[a.paroisse] = (activitesParParoisse[a.paroisse] || 0) + 1
      }
    })

    return {
      total,
      planifiees,
      enCours,
      terminees,
      annulees,
      enRetard,
      tauxRealisation,
      cetteSemaine,
      ceMois,
      restantes,
      termineesCeMois,
      prochaineActivite: prochaines[0] || null,
      activitesParDepartement,
      activitesParParoisse
    }
  }, [])

  // Charger toutes les activités
  const loadAllActivites = useCallback(async () => {
    if (!currentAnneeId || unites.length === 0) return
    
    // Éviter les chargements multiples
    const loadKey = `${currentAnneeId}-${unites.map(u => u.id).join(',')}`
    if (isLoadingRef.current || lastLoadedRef.current === loadKey) {
      console.log('⏭️ Chargement déjà effectué ou en cours')
      return
    }
    
    console.log('🔄 Chargement activités pour', unites.length, 'unités, année:', currentAnneeId)
    isLoadingRef.current = true
    setLoading(true)
    
    try {
      const allActivites: ActiviteAffichee[] = []
      
      for (const unite of unites) {
        try {
          const activitesUnite = await onLoadActivites(unite.id, currentAnneeId)
          
          const activitesWithMeta = activitesUnite.map(activite => ({
            ...activite,
            uniqueKey: `${activite.id}-${unite.id}`,
            departement: unite.nom,
            departement_id: unite.reference_id,
            paroisse: unite.paroisse_nom,
            paroisse_id: unite.paroisse_id
          }))
          
          allActivites.push(...activitesWithMeta)
        } catch (error) {
          console.error(`Erreur unité ${unite.id}:`, error)
        }
      }
      
      // Dédupliquer
      const uniqueMap = new Map<string, ActiviteAffichee>()
      allActivites.forEach(a => {
        if (!uniqueMap.has(a.uniqueKey!)) {
          uniqueMap.set(a.uniqueKey!, a)
        }
      })
      
      const uniqueActivites = Array.from(uniqueMap.values())
      uniqueActivites.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      console.log('✅', uniqueActivites.length, 'activités chargées')
      setActivites(uniqueActivites)
      setStats(calculateStats(uniqueActivites))
      lastLoadedRef.current = loadKey
      
    } catch (error) {
      console.error('❌ Erreur chargement:', error)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [currentAnneeId, unites, onLoadActivites, calculateStats])

  // Effet pour charger les données
  useEffect(() => {
    loadAllActivites()
  }, [loadAllActivites])

  // Filtrer les activités
  const filteredActivites = activites.filter(activite => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      activite.titre.toLowerCase().includes(searchLower) ||
      (activite.description || '').toLowerCase().includes(searchLower) ||
      (activite.paroisse || '').toLowerCase().includes(searchLower)
    const matchesStatut = !filterStatut || activite.statut === filterStatut
    return matchesSearch && matchesStatut
  })

  // Gérer le changement d'année
  const handleAnneeChange = (anneeId: number) => {
    if (onAnneeChange) {
      onAnneeChange(anneeId)
    }
  }

  // État de chargement
  if (loading || externalLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
        <p className="text-gray-500 mt-2 text-sm">Chargement des activités...</p>
      </div>
    )
  }

  // Pas d'unités
  if (unites.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href={backUrl} className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4">
            <ChevronLeft size={18} />
            {backLabel}
          </Link>
          <h1 className="text-2xl font-light">{title}</h1>
        </div>
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">Aucune unité d'organisation configurée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={backUrl} className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4">
          <ChevronLeft size={18} />
          {backLabel}
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-wide">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="text-xs text-gray-400">
            {unites.length} unité{unites.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Sélecteur d'année et stats */}
      {currentAnneeId && (
        <>
          <div className="mb-4">
            <AnneeSelector 
              annees={anneesDisponibles}
              currentAnneeId={currentAnneeId}
              onChange={handleAnneeChange}
            />
          </div>
          <StatsCards stats={stats} />
        </>
      )}

      {/* Barre de recherche */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une activité..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
          />
        </div>
        
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
        >
          <option value="">Tous les statuts</option>
          {STATUTS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Liste des activités */}
      {filteredActivites.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">{emptyStateMessage}</p>
        </div>
      ) : (
        <ActivitesListView 
          activites={filteredActivites}
          onViewDetails={setSelectedActivite}
          showParoisse={showParoisseColumn}
        />
      )}

      {/* Modal détails */}
      <DetailsModal 
        activite={selectedActivite}
        onClose={() => setSelectedActivite(null)}
        showParoisse={showParoisseColumn}
      />
    </div>
  )
}