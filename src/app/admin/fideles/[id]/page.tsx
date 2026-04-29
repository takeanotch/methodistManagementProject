// // // app/admin/fideles/[id]/page.tsx
// // import { notFound, redirect } from 'next/navigation'
// // import { getUser } from '@/actions/auth'
// // import { getFideleById, getHistoriqueParoissesFidele } from '@/actions/fidele'
// // import { getPasteurById } from '@/actions/pasteurs'
// // import Link from 'next/link'
// // import Image from 'next/image'
// // import AdminFideleDetailClient from './AdminFideleDetailClient'
// // import { supabase } from '@/lib/supabase'

// // // Fonction pour récupérer les transferts d'un fidèle
// // async function getTransfertsByFidele(fideleId: number) {
// //   try {
// //     const { data, error } = await supabase
// //       .from('transfert_fidele')
// //       .select(`
// //         *,
// //         source:paroisse_source_id (id, nom),
// //         destination:paroisse_destination_id (id, nom),
// //         annee_conference:annee_conference_id (
// //           id,
// //           annee:annee_id (id, label)
// //         )
// //       `)
// //       .eq('fidele_id', fideleId)
// //       .order('created_at', { ascending: false })

// //     if (error) {
// //       console.error('Erreur getTransfertsByFidele:', error)
// //       return []
// //     }

// //     return data || []
// //   } catch (error) {
// //     console.error('Erreur getTransfertsByFidele:', error)
// //     return []
// //   }
// // }

// // interface PageProps {
// //   params: Promise<{ id: string }>
// // }

// // export default async function AdminFideleDetailPage({ params }: PageProps) {
// //   const { id } = await params
// //   const fideleId = parseInt(id)

// //   if (isNaN(fideleId)) {
// //     notFound()
// //   }

// //   const user = await getUser()

// //   if (!user || user.role?.nom !== 'admin') {
// //     redirect('/profile')
// //   }

// //   // Récupérer toutes les données du fidèle
// //   const fidele = await getFideleById(fideleId)

// //   if (!fidele) {
// //     notFound()
// //   }

// //   // Récupérer l'historique des paroisses
// //   const historiqueParoisses = await getHistoriqueParoissesFidele(fideleId)

// //   // Récupérer les informations de pasteur si applicable
// //   const pasteur = await getPasteurById(fideleId)

// //   // Récupérer l'historique des transferts
// //   const transferts = await getTransfertsByFidele(fideleId)

// //   return (
// //     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
// //       {/* Fil d'Ariane */}
// //       <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
// //         <Link href="/admin" className="hover:text-gray-600">
// //           Dashboard
// //         </Link>
// //         <span>/</span>
// //         <Link href="/admin/fideles" className="hover:text-gray-600">
// //           Fidèles
// //         </Link>
// //         <span>/</span>
// //         <span className="text-gray-600">
// //           {fidele.nom} {fidele.prenom}
// //         </span>
// //       </div>

// //       <AdminFideleDetailClient
// //         fidele={fidele}
// //         historiqueParoisses={historiqueParoisses}
// //         pasteur={pasteur}
// //         transferts={transferts}
// //       />
// //     </div>
// //   )
// // }

// // app/admin/fideles/[id]/page.tsx
// import { notFound, redirect } from 'next/navigation'
// import { getUser } from '@/actions/auth'
// import { getFideleById, getHistoriqueParoissesFidele } from '@/actions/fidele'
// import { getPasteurByFideleId } from '@/actions/pasteurs'  // ✅ Utiliser la bonne fonction
// import { getTransfertsByFidele } from '@/actions/transfert-paroisse'
// import Link from 'next/link'
// import AdminFideleDetailClient from './AdminFideleDetailClient'

// interface PageProps {
//   params: Promise<{ id: string }>
// }

// export default async function AdminFideleDetailPage({ params }: PageProps) {
//   const { id } = await params
//   const fideleId = parseInt(id)

//   if (isNaN(fideleId)) {
//     notFound()
//   }

//   const user = await getUser()

//   if (!user || user.role?.nom !== 'admin') {
//     redirect('/profile')
//   }

//   // Récupérer toutes les données du fidèle
//   const fidele = await getFideleById(fideleId)

//   if (!fidele) {
//     notFound()
//   }

//   // Récupérer l'historique des paroisses
//   const historiqueParoisses = await getHistoriqueParoissesFidele(fideleId)

//   // ✅ Récupérer les informations de pasteur par fidele_id
//   const pasteur = await getPasteurByFideleId(fideleId)

//   // Récupérer l'historique des transferts
//   const transferts = await getTransfertsByFidele(fideleId)

//   return (
//     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//       {/* Fil d'Ariane */}
//       <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
//         <Link href="/admin" className="hover:text-gray-600">
//           Dashboard
//         </Link>
//         <span>/</span>
//         <Link href="/admin/fideles" className="hover:text-gray-600">
//           Fidèles
//         </Link>
//         <span>/</span>
//         <span className="text-gray-600">
//           {fidele.nom} {fidele.prenom}
//         </span>
//       </div>

//       <AdminFideleDetailClient
//         fidele={fidele}
//         historiqueParoisses={historiqueParoisses}
//         pasteur={pasteur}
//         transferts={transferts}
//       />
//     </div>
//   )
// }

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

  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
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
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin" className="hover:text-gray-600">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/admin/fideles" className="hover:text-gray-600">
          Fidèles
        </Link>
        <span>/</span>
        <span className="text-gray-600">
          {fidele.nom} {fidele.prenom}
        </span>
      </div>

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