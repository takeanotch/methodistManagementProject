

// ./ActiviteCard.tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { updateActiviteStatut, deleteActivite } from '@/actions/activite'

interface ActiviteCardProps {
  activite: {
    id: number
    titre: string
    description: string | null
    date: string
    heure: string
    statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
    plan_action?: {
      id: number
      titre: string
    } | null
    fichiers_count?: number
  }
  basePath: string
  canEdit?: boolean
  showPlanAction?: boolean
  onStatusChange?: () => void
  onDelete?: () => void
}

const STATUT_CONFIG = {
  planifie: { label: 'Planifiée', color: 'blue', icon: '📅' },
  en_cours: { label: 'En cours', color: 'yellow', icon: '⚡' },
  termine: { label: 'Terminée', color: 'green', icon: '✅' },
  annule: { label: 'Annulée', color: 'red', icon: '❌' }
}

export default function ActiviteCard({ 
  activite, 
  basePath, 
  canEdit = false, 
  showPlanAction = false,
  onStatusChange,
  onDelete
}: ActiviteCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentStatut, setCurrentStatut] = useState(activite.statut)
  const [showMenu, setShowMenu] = useState(false)

  const isPast = new Date(activite.date) < new Date()
  const isToday = new Date(activite.date).toDateString() === new Date().toDateString()
  const statutConfig = STATUT_CONFIG[currentStatut]

  const getDateLabel = () => {
    if (isToday) return "Aujourd'hui"
    if (isPast) return "Passé"
    return new Date(activite.date).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const handleStatutChange = async (newStatut: string) => {
    if (!canEdit) return
    setIsUpdating(true)
    try {
      const result = await updateActiviteStatut(activite.id, newStatut as any)
      if (result.success) {
        setCurrentStatut(newStatut as any)
        onStatusChange?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsUpdating(false)
      setShowMenu(false)
    }
  }

  const handleDelete = async () => {
    if (!canEdit) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return
    
    setIsDeleting(true)
    try {
      const result = await deleteActivite(activite.id)
      if (result.success) {
        onDelete?.()
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Une erreur est survenue')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatutOptions = () => {
    const options = []
    if (currentStatut !== 'planifie') options.push({ value: 'planifie', label: 'Planifiée' })
    if (currentStatut !== 'en_cours') options.push({ value: 'en_cours', label: 'En cours' })
    if (currentStatut !== 'termine') options.push({ value: 'termine', label: 'Terminée' })
    if (currentStatut !== 'annule') options.push({ value: 'annule', label: 'Annulée' })
    return options
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all">
      <Link href={`${basePath}/${activite.id}`}>
        <div className="p-5">
          {/* En-tête avec titre et statut */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 line-clamp-2 pr-2">
                {activite.titre}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-${statutConfig.color}-100 text-${statutConfig.color}-700`}>
                <span>{statutConfig.icon}</span>
                <span>{statutConfig.label}</span>
              </span>
            </div>
          </div>

          {/* Date et heure */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {getDateLabel()}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {activite.heure}
            </span>
            {isPast && currentStatut !== 'termine' && currentStatut !== 'annule' && (
              <span className="text-orange-600 text-xs font-medium">En retard</span>
            )}
          </div>

          {/* Description */}
          {activite.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {activite.description}
            </p>
          )}

          {/* Informations supplémentaires */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-3">
              {showPlanAction && activite.plan_action && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {activite.plan_action.titre}
                </span>
              )}
              {activite.fichiers_count && activite.fichiers_count > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  {activite.fichiers_count} fichier{activite.fichiers_count > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <span className="flex items-center gap-1">
              Voir détails
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>

      {/* Actions (affichées en bas de la carte) */}
      {canEdit && (
        <div className="border-t border-gray-100 px-5 py-3 flex justify-end gap-2">
          {/* Menu de changement de statut */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              disabled={isUpdating}
              className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Changer statut
            </button>
            {showMenu && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                {getStatutOptions().map(opt => (
                  <button
                    key={opt.value}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleStatutChange(opt.value)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton modifier */}
          <Link
            href={`${basePath}/${activite.id}/modifier`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </Link>

          {/* Bouton supprimer */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDelete()
            }}
            disabled={isDeleting}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>
      )}
    </div>
  )
}