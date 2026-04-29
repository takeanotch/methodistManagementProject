// // app/paroisse/departements/[id]/activites/ActiviteModalButton.tsx
// 'use client'

// import { useState } from 'react'
// import { ActiviteModalWrapper } from './ActiviteModalWrapper'

// interface ActiviteModalButtonProps {
//   uniteId: number
//   departementId: number
//   children: React.ReactNode
//   activite?: {
//     id: number
//     titre: string
//     description: string | null
//     date: string
//     heure: string
//     statut: string
//     annee_conference_id: number
//     plan_action_id: number | null
//   } | null
// }

// export function ActiviteModalButton({ 
//   uniteId, 
//   departementId, 
//   children, 
//   activite 
// }: ActiviteModalButtonProps) {
//   const [isOpen, setIsOpen] = useState(false)

//   return (
//     <>
//       <div onClick={() => setIsOpen(true)}>
//         {children}
//       </div>
      
//       <ActiviteModalWrapper
//         isOpen={isOpen}
//         onClose={() => setIsOpen(false)}
//         uniteId={uniteId}
//         departementId={departementId}
//         activite={activite}
//       />
//     </>
//   )
// }
// app/paroisse/departements/[id]/activites/ActiviteModalButton.tsx
'use client'

import { useState } from 'react'
import { ActiviteModalWrapper } from './ActiviteModalWrapper'

interface ActiviteModalButtonProps {
  uniteId: number
  departementId: number
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
  onSuccess?: () => void  // 👈 Ajouter cette prop
}

export function ActiviteModalButton({ 
  uniteId, 
  departementId, 
  children, 
  activite,
  onSuccess  // 👈 Ajouter ici
}: ActiviteModalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClose = () => {
    setIsOpen(false)
    onSuccess?.()  // 👈 Appeler le callback après fermeture
  }

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children}
      </div>
      
      <ActiviteModalWrapper
        isOpen={isOpen}
        onClose={handleClose}  // 👈 Utiliser handleClose
        uniteId={uniteId}
        departementId={departementId}
        activite={activite}
      />
    </>
  )
}