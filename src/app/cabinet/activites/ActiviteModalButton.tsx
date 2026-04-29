// app/cabinet/activites/ActiviteModalButton.tsx
'use client'

import { useState } from 'react'
import { ActiviteModalWrapper } from './ActiviteModalWrapper'

interface ActiviteModalButtonProps {
  uniteId: number
  children: React.ReactNode
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
  onSuccess?: () => void
}

export function ActiviteModalButton({ 
  uniteId, 
  children, 
  activite,
  onSuccess
}: ActiviteModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
    onSuccess?.()
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      <ActiviteModalWrapper
        isOpen={isOpen}
        onClose={handleClose}
        uniteId={uniteId}
        activite={activite}
      />
    </>
  )
}