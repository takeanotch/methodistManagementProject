

'use client'

import { useState } from 'react'
import DeleteDepartementButton from './DeleteDepartementButton'
import SearchAndFilter from './SearchAndFilter'
import NouveauDepartementModal from './NouveauDepartementModal'

interface DepartementsClientProps {
  departements: any[]
  totalCount: number
  searchParams: { search?: string; type?: string }
}

export default function DepartementsClient({ 
  departements, 
  totalCount,
  searchParams 
}: DepartementsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDepartement, setEditingDepartement] = useState<any>(null)

  const typeColors: Record<string, string> = {
    jeune: 'text-blue-600 bg-blue-50',
    maman: 'text-pink-600 bg-pink-50',
    enfant: 'text-green-600 bg-green-50',
    papa: 'text-purple-600 bg-purple-50',
    commite: 'text-orange-600 bg-orange-50',
    agence_programme: 'text-indigo-600 bg-indigo-50',
    normal: 'text-gray-600 bg-gray-50',
    departement: 'text-cyan-600 bg-cyan-50'
  }

  const handleEdit = (departement: any) => {
    setEditingDepartement(departement)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingDepartement(null)
  }

  const handleSuccess = () => {
    // Rafraîchir la page ou recharger les données
    window.location.reload()
  }

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <SearchAndFilter initialSearch={searchParams.search} initialType={searchParams.type} />
          <button
            onClick={() => {
              setEditingDepartement(null)
              setIsModalOpen(true)
            }}
            className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors inline-flex items-center gap-2 ml-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau département
          </button>
        </div>
      </div>

      {/* Liste des départements */}
      {departements.length === 0 ? (
        <div className="bg-white border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-200">
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-light text-gray-900 mb-2">
            {totalCount === 0 ? 'Aucun département' : 'Aucun résultat trouvé'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {totalCount === 0 
              ? 'Commencez par créer votre premier département'
              : 'Aucun département ne correspond à votre recherche'}
          </p>
          {totalCount === 0 && (
            <button
              onClick={() => {
                setEditingDepartement(null)
                setIsModalOpen(true)
              }}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Créer un département
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-50">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Département
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rôles disponibles
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {departements.map((departement) => {
                const typeColor = typeColors[departement.type] || 'text-gray-600 bg-gray-50'

                return (
                  <tr key={departement.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {departement.nom}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium capitalize ${typeColor}`}>
                        {departement.type?.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {departement.roles_config?.slice(0, 3).map((role: any) => (
                          <span
                            key={role.nom}
                            className="inline-flex items-center px-2 py-0.5 text-xs"
                            style={{ 
                              backgroundColor: role.couleur + '20',
                              color: role.couleur 
                            }}
                          >
                            {role.label}
                          </span>
                        ))}
                        {departement.roles_config?.length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{departement.roles_config.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {departement.description || '-'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(departement)}
                          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <DeleteDepartementButton id={departement.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal pour créer/modifier un département */}
      <NouveauDepartementModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        departement={editingDepartement}
        onSuccess={handleSuccess}
      />
    </>
  )
}