
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Activite {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  plan_action_id: number | null
}

interface ActiviteCalendarProps {
  activites: Activite[]
  basePath: string
  canEdit?: boolean
}

export default function ActiviteCalendar({ activites, basePath, canEdit = true }: ActiviteCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    let startingDayOfWeek = firstDay.getDay()
    startingDayOfWeek = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const getActivitesForDate = (dateStr: string) => {
    return activites.filter(a => a.date === dateStr)
  }

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-500'
      case 'en_cours': return 'bg-yellow-500'
      case 'termine': return 'bg-green-500'
      case 'annule': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getActivityCounts = (dateStr: string) => {
    const dayActivites = getActivitesForDate(dateStr)
    return {
      total: dayActivites.length,
      byStatus: {
        planifie: dayActivites.filter(a => a.statut === 'planifie').length,
        en_cours: dayActivites.filter(a => a.statut === 'en_cours').length,
        termine: dayActivites.filter(a => a.statut === 'termine').length,
        annule: dayActivites.filter(a => a.statut === 'annule').length
      }
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate < today
  }

  const changeMonth = (increment: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1))
    setHoveredDate(null)
    setSelectedDate(null)
  }

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr === selectedDate ? null : dateStr)
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  // Construire le tableau des jours
  const days = []
  const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7
  
  for (let i = 0; i < totalCells; i++) {
    const dayNumber = i - startingDayOfWeek + 1
    const isValid = dayNumber >= 1 && dayNumber <= daysInMonth
    const date = isValid ? new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber) : null
    const dateStr = date ? formatDate(date) : ''
    const activityCounts = date ? getActivityCounts(dateStr) : null
    const dayActivites = date ? getActivitesForDate(dateStr) : []
    const isHovered = hoveredDate === dateStr
    const isSelected = selectedDate === dateStr

    days.push({
      isValid,
      dayNumber,
      date,
      dateStr,
      activityCounts,
      dayActivites,
      isHovered,
      isSelected
    })
  }

  return (
    <div className="bg-white rounded-lg max-w-2xl border border-gray-200">
      {/* Header minimaliste */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <button
          onClick={() => changeMonth(-1)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>
        <span className="text-sm font-medium text-gray-700">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </span>
        <button
          onClick={() => changeMonth(1)}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Grille du calendrier minimaliste */}
      <div className="p-2">
        <div className="grid grid-cols-7 gap-0.5">
          {/* Jours de la semaine */}
          {weekDays.map((day, index) => (
            <div key={index} className="text-center py-1 text-xs font-medium text-gray-400">
              {day}
            </div>
          ))}

          {/* Jours du mois */}
          {days.map((day, index) => (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => day.isValid && setHoveredDate(day.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {day.isValid && day.date ? (
                <div 
                  onClick={() => handleDateClick(day.dateStr)}
                  className={`
                    aspect-square p-1 border rounded transition-all cursor-pointer
                    ${isToday(day.date) ? 'bg-indigo-50 ring-1 ring-indigo-300' : 'hover:bg-gray-50'}
                    ${isPast(day.date) ? 'text-gray-400' : 'text-gray-700'}
                    ${day.isSelected ? 'bg-indigo-100 ring-1 ring-indigo-400' : ''}
                  `}
                >
                  {/* Numéro du jour */}
                  <div className={`
                    text-xs font-medium text-center
                    ${isToday(day.date) ? 'text-indigo-600' : ''}
                  `}>
                    {day.dayNumber}
                  </div>

                  {/* Indicateurs d'activités minimalistes */}
                  {day.activityCounts && day.activityCounts.total > 0 && (
                    <div className="flex justify-center gap-0.5 mt-1">
                      {day.activityCounts.byStatus.planifie > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                      {day.activityCounts.byStatus.en_cours > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      )}
                      {day.activityCounts.byStatus.termine > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                      {day.activityCounts.byStatus.annule > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-square bg-gray-50 rounded"></div>
              )}

              {/* Tooltip au hover avec les activités de la journée */}
              {day.isHovered && day.isValid && day.dayActivites.length > 0 && (
                <div className="absolute z-20 bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-64 bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden">
                  <div className="font-medium p-2 text-center border-b border-gray-700">
                    {day.dayNumber} {monthNames[currentDate.getMonth()]} - {day.dayActivites.length} activité{day.dayActivites.length > 1 ? 's' : ''}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {day.dayActivites.map((activite) => (
                      <Link
                        key={activite.id}
                        href={`${basePath}/${activite.id}`}
                        className="block hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2">
                          <div className="flex items-start gap-2">
                            <span className="text-base flex-shrink-0 mt-0.5">
                              {activite.statut === 'planifie' && '📅'}
                              {activite.statut === 'en_cours' && '⚡'}
                              {activite.statut === 'termine' && '✅'}
                              {activite.statut === 'annule' && '❌'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">
                                {activite.titre}
                              </div>
                              <div className="flex items-center gap-2 text-gray-300 text-xs mt-1">
                                <span>⏰ {activite.heure}</span>
                                <span>•</span>
                                <span className="capitalize">
                                  {activite.statut === 'planifie' && 'Planifiée'}
                                  {activite.statut === 'en_cours' && 'En cours'}
                                  {activite.statut === 'termine' && 'Terminée'}
                                  {activite.statut === 'annule' && 'Annulée'}
                                </span>
                              </div>
                              {activite.description && (
                                <div className="text-gray-400 text-xs mt-1 line-clamp-2">
                                  {activite.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats minimalistes */}
      {activites.length > 0 && (
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-gray-500 font-medium">{activites.length}</p>
              <p className="text-gray-400 text-xs">Total</p>
            </div>
            <div>
              <p className="text-orange-600 font-medium">
                {activites.filter(a => {
                  const today = new Date()
                  const date = new Date(a.date)
                  return date < today && a.statut !== 'termine' && a.statut !== 'annule'
                }).length}
              </p>
              <p className="text-gray-400 text-xs">Retard</p>
            </div>
            <div>
              <p className="text-green-600 font-medium">
                {Math.round((activites.filter(a => a.statut === 'termine').length / activites.length) * 100)}%
              </p>
              <p className="text-gray-400 text-xs">Réalisé</p>
            </div>
            <div>
              <p className="text-indigo-600 font-medium">
                {activites.filter(a => {
                  const today = new Date()
                  const date = new Date(a.date)
                  const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 3600 * 24))
                  return diffDays >= 0 && diffDays <= 7 && a.statut !== 'termine' && a.statut !== 'annule'
                }).length}
              </p>
              <p className="text-gray-400 text-xs">7 jours</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}