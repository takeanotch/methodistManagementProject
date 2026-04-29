// app/paroisse/departements/[id]/layout.tsx
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementById } from '@/actions/departements'
import { getAnneesConferenceDisponiblesForDepartement, getCurrentAnneeConferenceForDepartement } from '@/actions/fidele-departement'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function DepartementLayout({ children, params }: LayoutProps) {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }
  
  const { id } = await params
  const departementId = parseInt(id)
  
  if (isNaN(departementId)) {
    redirect('/paroisse/departements?error=invalid-id')
  }
  
  const departement = await getDepartementById(departementId)
  
  if (!departement) {
    redirect('/paroisse/departements')
  }
  
  const anneesDisponibles = await getAnneesConferenceDisponiblesForDepartement(departementId)
  const anneeEnCours = await getCurrentAnneeConferenceForDepartement(departementId)

  const typeLabels: Record<string, string> = {
    commite: 'Comité',
    agence_programme: 'Agence/Programme',
    normal: 'Normal',
    departement: 'Departement'
  }

  return (
    <div className=" bg">
    
      {/* Contenu de la page */}
      {children}
    </div>
  )
}