

// app/admin/departements/page.tsx
import { getDepartements } from '@/actions/departements'
import DepartementsClient from './DepartementsClient'

export default async function DepartementsPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; type?: string }>
}) {
  const params = await searchParams
  const departements = await getDepartements()
  
  // Filtrer les départements de manière sécurisée
  const filteredDepartements = departements.filter((dep) => {
    const searchTerm = params?.search || ''
    const typeFilter = params?.type || 'all'
    
    const matchesSearch = !searchTerm || 
      dep.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dep.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    
    const matchesType = !typeFilter || 
      typeFilter === 'all' || 
      dep.type === typeFilter
    
    return matchesSearch && matchesType
  })

  return (
    <div className="">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-gray-900">Départements</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérer les départements et leurs rôles personnalisés
            </p>
          </div>
        </div>
      </div>

      {/* Client component pour la recherche et le modal */}
      <DepartementsClient 
        departements={filteredDepartements} 
        totalCount={departements.length}
        searchParams={params}
      />
    </div>
  )
}