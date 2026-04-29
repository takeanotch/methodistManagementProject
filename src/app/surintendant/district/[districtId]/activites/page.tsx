// app/surintendant/district/[districtId]/activites/page.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { 
  Loader2, 
  ChevronLeft, 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  X, 
  ChevronRight,
  Eye,
  LayoutGrid,
  List,
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
import { getSurintendantInfo, getDistrictParoisses, getActivitesForDistrict } from '@/actions/surintendant'
import { getAnneesDisponiblesForDistrict } from '@/actions/surintendant'
import { supabase } from '@/lib/supabase'

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

interface ActiviteWithDetails {
  id: number
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
  paroisse?: string
  paroisse_id?: number
  departement_id?: number
}

interface Paroisse {
  id: number
  nom: string
}

interface EnhancedStats {
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
  prochaineActivite: ActiviteWithDetails | null
  activitesParParoisse: Record<string, number>
  activitesParDepartement: Record<string, number>
}

// Composant pour le sélecteur d'année
function AnneeSelector({ 
  annees, 
  currentAnneeId, 
  onChange 
}: { 
  annees: any[]
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
      {annees.map((annee: any) => (
        <option key={annee.id} value={annee.id}>
          {annee.label}
          {annee.is_current ? ' (en cours)' : ''}
        </option>
      ))}
    </select>
  )
}

// Composant pour les statistiques avancées
function EnhancedStatsCards({ stats }: { stats: EnhancedStats | null }) {
  if (!stats) return null

  const tauxRealisationFormatted = stats.tauxRealisation.toFixed(1)
  const tendance = stats.tauxRealisation >= 50 ? 'positive' : 'negative'

  return (
    <div className="space-y-4 mb-6">
      {/* Première ligne - Cartes principales */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 p-3 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-light">{stats.total}</div>
            <Calendar size={20} className="text-gray-400" />
          </div>
          <div className="text-xs text-gray-500 mt-1">Total activités</div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-light text-blue-700">{stats.cetteSemaine}</div>
            <CalendarDays size={20} className="text-blue-400" />
          </div>
          <div className="text-xs text-blue-600 mt-1">Cette semaine</div>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-light text-indigo-700">{stats.ceMois}</div>
            <CalendarRange size={20} className="text-indigo-400" />
          </div>
          <div className="text-xs text-indigo-600 mt-1">Ce mois-ci</div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-light text-purple-700">{stats.restantes}</div>
            <CalendarClock size={20} className="text-purple-400" />
          </div>
          <div className="text-xs text-purple-600 mt-1">À venir</div>
        </div>
        
        <div className="bg-green-50 border border-green-200 p-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-light text-green-700">{stats.termineesCeMois}</div>
            <CheckCircle2 size={20} className="text-green-400" />
          </div>
          <div className="text-xs text-green-600 mt-1">Terminées ce mois</div>
        </div>
        
        <div className={`border p-3 ${tendance === 'positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-2xl font-light ${tendance === 'positive' ? 'text-emerald-700' : 'text-orange-700'}`}>
              {tauxRealisationFormatted}%
            </div>
            {tendance === 'positive' ? (
              <TrendingUp size={20} className="text-emerald-400" />
            ) : (
              <TrendingDown size={20} className="text-orange-400" />
            )}
          </div>
          <div className={`text-xs mt-1 ${tendance === 'positive' ? 'text-emerald-600' : 'text-orange-600'}`}>
            Taux de réalisation
          </div>
        </div>
      </div>

      {/* Deuxième ligne - Cartes par statut */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-50/50 border border-blue-100 p-3">
          <div className="text-xl font-light text-blue-700">{stats.planifiees}</div>
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <span>📅</span> Planifiées
          </div>
        </div>
        <div className="bg-yellow-50/50 border border-yellow-100 p-3">
          <div className="text-xl font-light text-yellow-700">{stats.enCours}</div>
          <div className="text-xs text-yellow-600 flex items-center gap-1">
            <span>⚡</span> En cours
          </div>
        </div>
        <div className="bg-green-50/50 border border-green-100 p-3">
          <div className="text-xl font-light text-green-700">{stats.terminees}</div>
          <div className="text-xs text-green-600 flex items-center gap-1">
            <span>✅</span> Terminées
          </div>
        </div>
        <div className="bg-red-50/50 border border-red-100 p-3">
          <div className="text-xl font-light text-red-700">{stats.annulees}</div>
          <div className="text-xs text-red-600 flex items-center gap-1">
            <span>❌</span> Annulées
          </div>
        </div>
        <div className="bg-orange-50/50 border border-orange-100 p-3">
          <div className="text-xl font-light text-orange-700">{stats.enRetard}</div>
          <div className="text-xs text-orange-600 flex items-center gap-1">
            <AlertCircle size={12} /> En retard
          </div>
        </div>
      </div>

      {/* Troisième ligne - Prochaine activité et répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Prochaine activité */}
        {stats.prochaineActivite ? (
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 p-4 lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock size={18} className="text-gray-500" />
              <h4 className="text-sm font-medium text-gray-700">Prochaine activité</h4>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-center min-w-[60px]">
                <div className="text-2xl font-light">
                  {new Date(stats.prochaineActivite.date).getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {MOIS[new Date(stats.prochaineActivite.date).getMonth()].substring(0, 3)}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium">{stats.prochaineActivite.titre}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {stats.prochaineActivite.heure}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <Building2 size={10} />
                    {stats.prochaineActivite.paroisse}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-500">{stats.prochaineActivite.departement}</span>
                </div>
              </div>
              {(() => {
                const statutInfo = STATUTS.find(s => s.value === stats.prochaineActivite?.statut)
                return (
                  <div className={`px-2 py-1 text-xs border ${statutInfo?.color || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {statutInfo?.label || stats.prochaineActivite?.statut}
                  </div>
                )
              })()}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 p-4 lg:col-span-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Aucune activité à venir</p>
          </div>
        )}

        {/* Répartition par paroisse */}
        <div className="bg-white border border-gray-200 p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={18} className="text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Par paroisse</h4>
          </div>
          {Object.keys(stats.activitesParParoisse).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.activitesParParoisse)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([paroisse, count]) => (
                  <div key={paroisse} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 min-w-[100px] truncate">{paroisse}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[30px]">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucune paroisse</p>
          )}
        </div>

        {/* Répartition par département */}
        <div className="bg-white border border-gray-200 p-4 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={18} className="text-gray-500" />
            <h4 className="text-sm font-medium text-gray-700">Par département</h4>
          </div>
          {Object.keys(stats.activitesParDepartement).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(stats.activitesParDepartement)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([dept, count]) => (
                  <div key={dept} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 min-w-[100px] truncate">{dept}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 min-w-[30px]">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Aucun département</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant pour afficher les activités de la semaine
function SemainePreview({ activites, onViewDetails }: { 
  activites: ActiviteWithDetails[]
  onViewDetails: (activite: ActiviteWithDetails) => void 
}) {
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0)
  
  const debutSemaine = new Date(aujourdhui)
  const jourSemaine = aujourdhui.getDay()
  const offset = jourSemaine === 0 ? 6 : jourSemaine - 1
  debutSemaine.setDate(aujourdhui.getDate() - offset)

  const finSemaine = new Date(debutSemaine)
  finSemaine.setDate(debutSemaine.getDate() + 6)
  finSemaine.setHours(23, 59, 59, 999)

  const activitesSemaine = activites.filter(a => {
    const dateActivite = new Date(a.date)
    dateActivite.setHours(0, 0, 0, 0)
    return dateActivite >= debutSemaine && dateActivite <= finSemaine
  })

  const activitesParJour = JOURS_SEMAINE.map((jour, index) => {
    const dateJour = new Date(debutSemaine)
    dateJour.setDate(debutSemaine.getDate() + index)
    
    const year = dateJour.getFullYear()
    const month = String(dateJour.getMonth() + 1).padStart(2, '0')
    const day = String(dateJour.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    return {
      jour,
      date: dateJour,
      dateStr,
      activites: activitesSemaine.filter(a => a.date === dateStr)
    }
  })

  const estAujourdhui = (date: Date) => {
    return date.getTime() === aujourdhui.getTime()
  }

  if (activitesSemaine.length === 0) {
    return (
      <div className="bg-white border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays size={20} className="text-gray-500" />
          <h3 className="text-lg font-light">Cette semaine</h3>
          <span className="text-sm text-gray-400 ml-auto">
            {debutSemaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - 
            {finSemaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="text-center py-8 text-gray-400">
          <Calendar size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune activité prévue cette semaine</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 mb-6 overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 bg-gray-50/50">
        <CalendarDays size={20} className="text-gray-500" />
        <h3 className="text-lg font-light">Cette semaine</h3>
        <span className="text-sm text-gray-400 ml-auto">
          {debutSemaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - 
          {finSemaine.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      
      <div className="grid grid-cols-7 divide-x divide-gray-100">
        {activitesParJour.map(({ jour, date, activites }) => {
          const isToday = estAujourdhui(date)
          const jourIndex = date.getDay() || 7
          const jourCourt = JOURS_SEMAINE_COURTS[jourIndex - 1]
          
          return (
            <div 
              key={jour} 
              className={`min-h-[120px] ${isToday ? 'bg-blue-50/30' : ''}`}
            >
              <div className={`p-3 border-b ${isToday ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100'}`}>
                <div className="text-xs font-medium text-gray-500">{jourCourt}</div>
                <div className={`text-lg font-light ${isToday ? 'text-blue-600' : ''}`}>
                  {date.getDate()}
                </div>
                <div className="text-xs text-gray-400">{MOIS[date.getMonth()].substring(0, 3)}</div>
              </div>
              
              <div className="p-2 space-y-1">
                {activites.length === 0 ? (
                  <div className="text-xs text-gray-300 text-center py-2">—</div>
                ) : (
                  <>
                    {activites.slice(0, 2).map(activite => {
                      const statutInfo = STATUTS.find(s => s.value === activite.statut) || STATUTS[0]
                      return (
                        <button
                          key={activite.id}
                          onClick={() => onViewDetails(activite)}
                          className={`w-full text-left p-1.5 text-xs border ${statutInfo.color} hover:opacity-80 transition-opacity`}
                        >
                          <div className="font-medium truncate">{activite.titre}</div>
                          <div className="text-gray-500 truncate text-[10px] mt-0.5">
                            {activite.heure} • {activite.paroisse}
                          </div>
                        </button>
                      )
                    })}
                    {activites.length > 2 && (
                      <div className="text-xs text-gray-400 text-center py-1">
                        +{activites.length - 2} autre{activites.length - 2 > 1 ? 's' : ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Composant pour la vue en liste
function ActivitesListView({ 
  activites, 
  onViewDetails
}: { 
  activites: ActiviteWithDetails[]
  onViewDetails: (activite: ActiviteWithDetails) => void 
}) {
  const groupedActivites = activites.reduce((acc, activite) => {
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

  const getStatutInfo = (statut: string) => {
    return STATUTS.find(s => s.value === statut) || STATUTS[0]
  }

  if (sortedDates.length === 0) {
    return (
      <div className="border border-gray-200 py-16 text-center bg-white">
        <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400">Aucune activité pour cette période</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(date => {
        const activitesDuJour = groupedActivites[date]
        const dateObj = new Date(date)
        const jourSemaine = JOURS_SEMAINE[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
        
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-gray-700">
                {jourSemaine}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(date)}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                {activitesDuJour.length} activité{activitesDuJour.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {activitesDuJour.map(activite => {
                const statutInfo = getStatutInfo(activite.statut)
                const dateActivite = new Date(activite.date)
                dateActivite.setHours(0, 0, 0, 0)
                const aujourdhui = new Date()
                aujourdhui.setHours(0, 0, 0, 0)
                const isEnRetard = dateActivite < aujourdhui && activite.statut !== 'termine' && activite.statut !== 'annule'
                
                return (
                  <div
                    key={activite.id}
                    className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-center min-w-[70px]">
                        <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                        <span className="text-sm font-medium">{activite.heure}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{activite.titre}</h3>
                            
                            <div className="flex items-center gap-3 mt-1">
                              {activite.paroisse && (
                                <div className="flex items-center gap-1 text-xs text-indigo-600">
                                  <MapPin size={12} />
                                  <span className="font-medium">{activite.paroisse}</span>
                                </div>
                              )}
                              {activite.departement && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Building2 size={12} />
                                  <span>{activite.departement}</span>
                                </div>
                              )}
                            </div>
                            
                            {activite.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {activite.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 border ${statutInfo.color}`}>
                              <span className="mr-1">{statutInfo.icon}</span>
                              {statutInfo.label}
                            </span>
                            
                            {isEnRetard && (
                              <span className="text-xs text-orange-600 font-medium flex items-center gap-1">
                                <AlertCircle size={12} />
                                En retard
                              </span>
                            )}
                            
                            <button
                              onClick={() => onViewDetails(activite)}
                              className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
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

// Composant pour la vue calendrier
function ActivitesCalendarView({ 
  activites, 
  onViewDetails
}: { 
  activites: ActiviteWithDetails[]
  onViewDetails: (activite: ActiviteWithDetails) => void 
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    let startingDayOfWeek = firstDay.getDay()
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7
    
    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startingDayOfWeek + 1
      const isValid = dayNumber >= 1 && dayNumber <= daysInMonth
      const date = isValid ? new Date(year, month, dayNumber) : new Date(year, month, 1 - (startingDayOfWeek - i))
      const isCurrentMonth = isValid
      
      days.push({ date, isCurrentMonth })
    }
    
    return days
  }

  const getActivitesForDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
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
          onClick={() => {
            const newDate = new Date(currentMonth)
            newDate.setMonth(newDate.getMonth() - 1)
            setCurrentMonth(newDate)
          }}
          className="p-1 hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-light">
          {MOIS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => {
            const newDate = new Date(currentMonth)
            newDate.setMonth(newDate.getMonth() + 1)
            setCurrentMonth(newDate)
          }}
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
          const dateStr = day.date.toISOString().split('T')[0]
          const isHovered = hoveredDate === dateStr
          
          return (
            <div
              key={idx}
              className="relative"
              onMouseEnter={() => day.isCurrentMonth && setHoveredDate(dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              <div
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
                        title={`${activite.heure} - ${activite.titre} (${activite.paroisse})`}
                      >
                        {activite.heure.substring(0, 5)} {activite.titre}
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

              {isHovered && day.isCurrentMonth && activitesDuJour.length > 0 && (
                <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-96 bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden">
                  <div className="font-medium p-2 text-center border-b border-gray-700 text-sm">
                    {day.date.getDate()} {MOIS[currentMonth.getMonth()]} - {activitesDuJour.length} activité{activitesDuJour.length > 1 ? 's' : ''}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {activitesDuJour.map((activite) => (
                      <button
                        key={activite.id}
                        onClick={() => onViewDetails(activite)}
                        className="block w-full text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="p-3">
                          <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0 mt-0.5">
                              {getStatutInfo(activite.statut).icon}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">
                                {activite.titre}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-indigo-300 text-xs flex items-center gap-1">
                                  <MapPin size={10} />
                                  {activite.paroisse}
                                </span>
                                <span className="text-gray-400 text-xs">•</span>
                                <span className="text-gray-300 text-xs truncate">{activite.departement}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-gray-300 text-xs mt-1">
                                <span>⏰ {activite.heure}</span>
                                <span>•</span>
                                <span>{getStatutInfo(activite.statut).label}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Modal de détails
function DetailsModal({ 
  activite, 
  onClose 
}: { 
  activite: ActiviteWithDetails | null
  onClose: () => void 
}) {
  if (!activite) return null

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-light">Détails de l'activité</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2">{activite.titre}</h2>
            
            <div className="flex items-center gap-3 mb-3">
              {activite.paroisse && (
                <div className="flex items-center gap-1 text-indigo-600 text-sm">
                  <MapPin size={14} />
                  <span className="font-medium">{activite.paroisse}</span>
                </div>
              )}
              {activite.departement && (
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Building2 size={14} />
                  <span>{activite.departement}</span>
                </div>
              )}
            </div>
            
            {activite.description && (
              <p className="text-gray-600">{activite.description}</p>
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

          {activite.plan_action && (
            <div className="border-t border-gray-200 pt-4">
              <div className="text-xs text-gray-500 mb-2">Plan d'action associé</div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium">{activite.plan_action.titre}</div>
                </div>
              </div>
            </div>
          )}
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

export default function SurintendantDistrictActivitesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const districtId = parseInt(params.districtId as string)
  const anneeParam = searchParams.get('annee')
  
  const [currentView, setCurrentView] = useState<'liste' | 'calendrier'>('liste')
  const [currentAnneeId, setCurrentAnneeId] = useState<number | undefined>(undefined)
  
  const [loading, setLoading] = useState(true)
  const [surintendantInfo, setSurintendantInfo] = useState<any>(null)
  const [district, setDistrict] = useState<any>(null)
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [anneesDisponibles, setAnneesDisponibles] = useState<any[]>([])
  const [activites, setActivites] = useState<ActiviteWithDetails[]>([])
  const [stats, setStats] = useState<EnhancedStats | null>(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [filterParoisse, setFilterParoisse] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)
  
  const [selectedActivite, setSelectedActivite] = useState<ActiviteWithDetails | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [districtId])

  useEffect(() => {
    if (currentAnneeId && paroisses.length > 0) {
      loadAllActivites(currentAnneeId)
    }
  }, [currentAnneeId, paroisses])

  async function loadInitialData() {
    try {
      setLoading(true)
      
      const info = await getSurintendantInfo()
      if (!info || info.district_id !== districtId) {
        router.push('/surintendant')
        return
      }
      setSurintendantInfo(info)

      const { data: districtData } = await supabase
        .from('district')
        .select('id, nom')
        .eq('id', districtId)
        .single()
      setDistrict(districtData)

      const paroissesData = await getDistrictParoisses(districtId)
      setParoisses(paroissesData)

      const annees = await getAnneesDisponiblesForDistrict(districtId)
      setAnneesDisponibles(annees)

      let defaultAnneeId: number | undefined
      if (anneeParam && !isNaN(parseInt(anneeParam))) {
        defaultAnneeId = parseInt(anneeParam)
      } else {
        const currentAnnee = annees.find((a: any) => a.is_current)
        if (currentAnnee) {
          defaultAnneeId = currentAnnee.id
        } else if (annees.length > 0) {
          defaultAnneeId = annees[0].id
        }
      }
      setCurrentAnneeId(defaultAnneeId)

      if (defaultAnneeId && paroissesData.length > 0) {
        await loadAllActivites(defaultAnneeId)
      }

      setLoading(false)
    } catch (error) {
      console.error('Erreur loadInitialData:', error)
      setLoading(false)
    }
  }

  async function loadAllActivites(anneeId: number) {
    try {
      const allActivites: ActiviteWithDetails[] = []
      
      for (const paroisse of paroisses) {
        const activitesParoisse = await getActivitesForDistrict(paroisse.id, anneeId)
        const activitesWithDetails = activitesParoisse.map((activite: any) => ({
          ...activite,
          paroisse: paroisse.nom,
          paroisse_id: paroisse.id
        }))
        allActivites.push(...activitesWithDetails)
      }
      
      allActivites.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setActivites(allActivites)
      
      const stats = calculateEnhancedStats(allActivites)
      setStats(stats)
    } catch (error) {
      console.error('Erreur chargement activités:', error)
    }
  }

  function calculateEnhancedStats(activites: ActiviteWithDetails[]): EnhancedStats {
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)
    
    const debutSemaine = new Date(aujourdhui)
    const jourSemaine = aujourdhui.getDay() || 7
    debutSemaine.setDate(aujourdhui.getDate() - jourSemaine + 1)
    
    const finSemaine = new Date(debutSemaine)
    finSemaine.setDate(debutSemaine.getDate() + 6)
    finSemaine.setHours(23, 59, 59, 999)
    
    const debutMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), 1)
    const finMois = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 0)
    finMois.setHours(23, 59, 59, 999)

    const total = activites.length
    const planifiees = activites.filter(a => a.statut === 'planifie').length
    const enCours = activites.filter(a => a.statut === 'en_cours').length
    const terminees = activites.filter(a => a.statut === 'termine').length
    const annulees = activites.filter(a => a.statut === 'annule').length

    const enRetard = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite < aujourdhui && a.statut !== 'termine' && a.statut !== 'annule'
    }).length

    const cetteSemaine = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= debutSemaine && dateActivite <= finSemaine
    }).length

    const ceMois = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= debutMois && dateActivite <= finMois
    }).length

    const termineesCeMois = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= debutMois && dateActivite <= finMois && a.statut === 'termine'
    }).length

    const restantes = activites.filter(a => {
      const dateActivite = new Date(a.date)
      dateActivite.setHours(0, 0, 0, 0)
      return dateActivite >= aujourdhui && a.statut !== 'annule' && a.statut !== 'termine'
    }).length

    const prochainesActivites = activites
      .filter(a => {
        const dateActivite = new Date(a.date)
        dateActivite.setHours(0, 0, 0, 0)
        return dateActivite >= aujourdhui && a.statut !== 'annule' && a.statut !== 'termine'
      })
      .sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.heure)
        const dateB = new Date(b.date + 'T' + b.heure)
        return dateA.getTime() - dateB.getTime()
      })
    
    const prochaineActivite = prochainesActivites.length > 0 ? prochainesActivites[0] : null

    const activitesParParoisse: Record<string, number> = {}
    const activitesParDepartement: Record<string, number> = {}
    
    activites.forEach(a => {
      if (a.paroisse) {
        activitesParParoisse[a.paroisse] = (activitesParParoisse[a.paroisse] || 0) + 1
      }
      if (a.departement) {
        activitesParDepartement[a.departement] = (activitesParDepartement[a.departement] || 0) + 1
      }
    })

    const tauxRealisation = total > 0 && (total - annulees) > 0 
      ? (terminees / (total - annulees)) * 100 
      : 0

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
      prochaineActivite,
      activitesParParoisse,
      activitesParDepartement
    }
  }

  function handleAnneeChange(anneeId: number) {
    setCurrentAnneeId(anneeId)
    const url = new URL(window.location.href)
    url.searchParams.set('annee', anneeId.toString())
    router.replace(url.pathname + url.search)
  }

  const filteredActivites = activites.filter(activite => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      activite.titre.toLowerCase().includes(searchLower) ||
      (activite.description || '').toLowerCase().includes(searchLower) ||
      (activite.departement || '').toLowerCase().includes(searchLower) ||
      (activite.paroisse || '').toLowerCase().includes(searchLower)
    const matchesStatut = !filterStatut || activite.statut === filterStatut
    const matchesParoisse = !filterParoisse || activite.paroisse === filterParoisse
    return matchesSearch && matchesStatut && matchesParoisse
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  if (!surintendantInfo || !district) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h2 className="text-lg font-medium mb-2">Accès non autorisé</h2>
          <p className="text-gray-500">Vous n'avez pas accès à cette page</p>
          <Link href="/surintendant" className="mt-4 inline-block text-sm text-gray-500 hover:text-black">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/surintendant/district/${districtId}`}
          className="inline-flex items-center gap-2 text-gray-500 hover:text-black mb-4"
        >
          <ChevronLeft size={18} />
          Retour au district
        </Link>
        <div>
          <h1 className="text-2xl font-light tracking-wide">Activités du district</h1>
          <p className="text-sm text-gray-500 mt-0.5">{district.nom}</p>
        </div>
        {paroisses.length > 0 && (
          <div className="text-xs text-gray-400 mt-1">
            {paroisses.length} paroisse{paroisses.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Stats avancées */}
      {stats && currentAnneeId && <EnhancedStatsCards stats={stats} />}

      {/* Aperçu de la semaine */}
      {filteredActivites.length > 0 && currentAnneeId && (
        <SemainePreview 
          activites={filteredActivites} 
          onViewDetails={setSelectedActivite}
        />
      )}

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <AnneeSelector 
            annees={anneesDisponibles}
            currentAnneeId={currentAnneeId}
            onChange={handleAnneeChange}
          />

          <div className="flex border border-gray-300 overflow-hidden">
            <button
              onClick={() => setCurrentView('liste')}
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${currentView === 'liste' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
            >
              <List size={14} />
              Liste
            </button>
            <button
              onClick={() => setCurrentView('calendrier')}
              className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors ${currentView === 'calendrier' ? 'bg-black text-white' : 'bg-white hover:bg-gray-50'}`}
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
              placeholder="Rechercher une activité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border transition-colors ${showFilters || filterStatut || filterParoisse ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black'}`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Filtres étendus */}
      {showFilters && (
        <div className="mb-6 p-4 border border-gray-200 bg-gray-50 space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 min-w-[80px]">Statut :</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterStatut('')}
                className={`px-3 py-1 text-sm border transition-colors ${!filterStatut ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
              >
                Tous
              </button>
              {STATUTS.map(statut => (
                <button
                  key={statut.value}
                  onClick={() => setFilterStatut(statut.value)}
                  className={`px-3 py-1 text-sm border transition-colors ${filterStatut === statut.value ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
                >
                  {statut.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-sm text-gray-600 min-w-[80px]">Paroisse :</label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterParoisse('')}
                className={`px-3 py-1 text-sm border transition-colors ${!filterParoisse ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
              >
                Toutes
              </button>
              {paroisses.map(paroisse => (
                <button
                  key={paroisse.id}
                  onClick={() => setFilterParoisse(paroisse.nom)}
                  className={`px-3 py-1 text-sm border transition-colors ${filterParoisse === paroisse.nom ? 'bg-black text-white border-black' : 'bg-white border-gray-300 hover:border-black'}`}
                >
                  {paroisse.nom}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => setShowFilters(false)}
              className="text-sm text-gray-500 hover:text-black transition-colors"
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
          <p className="text-gray-400">Aucune année disponible pour ce district</p>
        </div>
      ) : currentView === 'calendrier' ? (
        <ActivitesCalendarView 
          activites={filteredActivites}
          onViewDetails={setSelectedActivite}
        />
      ) : (
        <ActivitesListView 
          activites={filteredActivites}
          onViewDetails={setSelectedActivite}
        />
      )}

      {/* Modal détails */}
      <DetailsModal 
        activite={selectedActivite}
        onClose={() => setSelectedActivite(null)}
      />
    </div>
  )
}