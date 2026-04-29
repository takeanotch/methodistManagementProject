// /DepartementsFideleList.tsx
'use client'

import { useEffect, useState } from 'react'
import { getDepartementsByFidele } from '@/actions/fidele-departement'
import Link from 'next/link'

interface DepartementFidele {
  id: number
  role_id: number
  role_details?: {
    id: number
    nom: string
    label: string
    couleur: string
    niveau: number
  }
  date_debut: string
  est_actif: boolean
  departement: {
    id: number
    nom: string
    type: string
    roles_config: any[]
  }
}

interface DepartementsFideleListProps {
  fideleId: number
}

export default function DepartementsFideleList({ fideleId }: DepartementsFideleListProps) {
  const [departements, setDepartements] = useState<DepartementFidele[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getDepartementsByFidele(fideleId)
        setDepartements(data)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [fideleId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  if (departements.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50/50 rounded-lg">
        <p className="text-gray-400">Ce fidèle n'est dans aucun département</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {departements.map((affectation) => {
        const role = affectation.role_details
        
        return (
          <Link
            key={affectation.id}
            href={`/admin/departements/${affectation.departement.id}`}
            className="block p-4 bg-gray-50/50 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                {affectation.departement.nom}
              </h4>
              <span className="text-xs text-gray-400">
                {affectation.departement.type === 'commite' ? 'Comité' : 
                 affectation.departement.type === 'agence_programme' ? 'Agence/Programme' : 'Normal'}
              </span>
            </div>
            
            {role && (
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: role.couleur }}
                />
                <span className="text-xs text-gray-600">
                  {role.label}
                </span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                  Depuis le {formatDate(affectation.date_debut)}
                </span>
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}