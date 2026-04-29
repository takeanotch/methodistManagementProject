
// app/paroisse/departements/[id]/activites/ActiviteModalWrapper.tsx
'use client'

import { useEffect } from 'react'
import { ActiviteForm } from '@/components/forms/ActiviteForm'

interface ActiviteModalWrapperProps {
  isOpen: boolean
  onClose: () => void
  uniteId: number
  departementId: number
  activite?: {
    id: number
    titre: string
    description: string | null
    date: string
    heure: string
    statut: string
    annee_conference_id: number
    plan_action_id: number | null
  } | null
}

export function ActiviteModalWrapper({ 
  isOpen, 
  onClose, 
  uniteId, 
  departementId, 
  activite 
}: ActiviteModalWrapperProps) {
  
  // Bloquer le scroll quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Fermer avec la touche Echap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          style={{ animation: 'slideIn 0.3s ease-out' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {activite ? 'Modifier l\'activité' : 'Nouvelle activité'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1 hover:bg-gray-100"
              aria-label="Fermer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Body */}
          <div className="px-6 py-6">
            <ActiviteForm
              uniteId={uniteId}
              departementId={departementId}
              activite={activite}
              onSuccess={onClose}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  )
}