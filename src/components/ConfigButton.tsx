// components/ConfigButton.tsx
'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { ConfigurationModal } from './ConfigurationModal'

interface ConfigButtonProps {
  uniteId: number
  uniteNom: string
  uniteNiveau: string
  variant?: 'icon' | 'button'
  className?: string
}

export function ConfigButton({ 
  uniteId, 
  uniteNom, 
  uniteNiveau, 
  variant = 'icon',
  className = ''
}: ConfigButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className={`flex items-center gap-2 px-3 py-1 border border-gray-300 hover:border-black text-sm ${className}`}
        >
          <Settings size={14} />
          Configurer
        </button>
        
        <ConfigurationModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          uniteId={uniteId}
          uniteNom={uniteNom}
          uniteNiveau={uniteNiveau}
        />
      </>
    )
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className={`p-2 border border-gray-300 hover:border-black hover:bg-gray-50 ${className}`}
        title="Configurer"
      >
        <Settings size={16} />
      </button>
      
      <ConfigurationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        uniteId={uniteId}
        uniteNom={uniteNom}
        uniteNiveau={uniteNiveau}
      />
    </>
  )
}