

// app/admin/fideles/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getUser } from '@/actions/auth'
import { getFideleById, getHistoriqueParoissesFidele } from '@/actions/fidele'
import { getPasteurByFideleId } from '@/actions/pasteurs'
import { getTransfertsByFidele } from '@/actions/transfert-paroisse'
import { getParoisses } from '@/actions/structures' // Ajout de l'import
import Link from 'next/link'
import AdminFideleDetailClient from './AdminFideleDetailClient'








interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminFideleDetailPage({ params }: PageProps) {
  const { id } = await params
  const fideleId = parseInt(id)

  if (isNaN(fideleId)) {
    notFound()
  }

 
  // Récupérer toutes les données du fidèle
  const fidele = await getFideleById(fideleId)

  if (!fidele) {
    notFound()
  }

  // Récupérer l'historique des paroisses
  const historiqueParoisses = await getHistoriqueParoissesFidele(fideleId)

  // Récupérer les informations de pasteur par fidele_id
  const pasteur = await getPasteurByFideleId(fideleId)

  // Récupérer l'historique des transferts
  const transferts = await getTransfertsByFidele(fideleId)

  // Récupérer la liste des paroisses pour le modal d'édition
  const paroisses = await getParoisses()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    
      <AdminFideleDetailClient
        fidele={fidele}
        historiqueParoisses={historiqueParoisses}
        pasteur={pasteur}
        transferts={transferts}
        paroisses={paroisses} // Passage des paroisses
      />
    </div>
  )
}