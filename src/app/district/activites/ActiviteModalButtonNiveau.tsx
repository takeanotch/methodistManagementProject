// app/district/activites/ActiviteModalButtonNiveau.tsx
'use client'

import { useState } from 'react'
import { ActiviteModalWrapperNiveau } from './ActiviteModalWrapperNiveau'

interface ActiviteModalButtonNiveauProps {
  uniteId: number
  niveau: 'district' | 'conference'
  niveauId: number
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
}

export function ActiviteModalButtonNiveau({ 
  uniteId, 
  niveau,
  niveauId,
  children, 
  activite 
}: ActiviteModalButtonNiveauProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      <ActiviteModalWrapperNiveau
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        uniteId={uniteId}
        niveau={niveau}
        niveauId={niveauId}
        activite={activite}
      />
    </>
  )
}