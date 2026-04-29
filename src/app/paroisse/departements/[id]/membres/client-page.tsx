
// app/paroisse/departements/[id]/membres/client-page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Calendar } from 'lucide-react'
import FidelesDepartementList from './FidelesDepartementList'
import AjouterFideleModal from './AjouterFideleModal'

interface ClientMembresPageProps {
  departementId: number
  departementNom: string
  paroisseId: number
  anneesDisponibles: any[]
  anneeConferenceId: number | null
  anneeEnCours: any | null
  transformedFideles: any[]
  totalFideles: number
  actifs: number
  inactifs: number
  isCurrentYear: boolean
  anneeSelectionnee: any | null
}

export default function ClientMembresPage({
  departementId,
  departementNom,
  paroisseId,
  anneesDisponibles,
  anneeConferenceId,
  anneeEnCours,
  transformedFideles,
  totalFideles,
  actifs,
  inactifs,
  isCurrentYear,
  anneeSelectionnee
}: ClientMembresPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/paroisse/departements"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-wide">Membres</h1>
            <p className="text-sm text-gray-500 mt-0.5">{departementNom}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 ml-9">
          <Link href={`/paroisse/departements/${departementId}`} className="hover:text-black">
            Vue d'ensemble
          </Link>
          <span>•</span>
          <Link href={`/paroisse/departements/${departementId}/activites`} className="hover:text-black">
            Activités
          </Link>
          <span>•</span>
          <span className="font-medium text-black">Membres</span>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 p-3">
          <div className="text-xl font-light">{totalFideles}</div>
          <div className="text-xs text-gray-500">Total membres</div>
        </div>
        <div className="bg-green-50 border border-green-200 p-3">
          <div className="text-xl font-light text-green-700">{actifs}</div>
          <div className="text-xs text-green-600">Actifs</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 p-3">
          <div className="text-xl font-light text-gray-500">{inactifs}</div>
          <div className="text-xs text-gray-500">Inactifs</div>
        </div>
      </div>

      {/* Sélecteur d'année */}
      {anneesDisponibles && anneesDisponibles.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Année de conférence</div>
          <div className="flex gap-2 flex-wrap">
            {anneesDisponibles.map((annee) => (
              <a
                key={annee.id}
                href={`/paroisse/departements/${departementId}/membres?annee_conference=${annee.id}`}
                className={`px-4 py-2 text-sm border transition-colors ${
                  anneeConferenceId === annee.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-black'
                }`}
              >
                {annee.label}
                {annee.is_current && ' (en cours)'}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Indicateur d'historique */}
      {anneeSelectionnee && anneeConferenceId !== anneeEnCours?.id && (
        <div className="mb-4 p-3 border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          <Calendar size={14} className="inline mr-2" />
          Affichage de l'historique pour l'année {anneeSelectionnee.label}
        </div>
      )}

      {/* Barre d'outils */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
        >
          <Plus size={16} />
          Ajouter un membre
        </button>
      </div>

      {/* Liste des membres */}
      {transformedFideles.length === 0 ? (
        <div className="border border-gray-200 py-16 text-center bg-white">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-400 mb-4">Aucun membre dans ce département</p>
          {isCurrentYear && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
            >
              <Plus size={16} />
              Ajouter un membre
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 p-6">
          <FidelesDepartementList
            key={refreshKey}
            fideles={transformedFideles}
            departementId={departementId}
            departementNom={departementNom}
            totalFideles={totalFideles}
            actifs={actifs}
            inactifs={inactifs}
            paroisseId={paroisseId}
            anneeId={anneeConferenceId}
            isCurrentYear={isCurrentYear}
            isParoisse={true}
          />
        </div>
      )}

      {/* Modal d'ajout */}
      <AjouterFideleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        departementId={departementId}
        departementNom={departementNom}
        paroisseId={paroisseId}
        onSuccess={handleSuccess}
        preselectedAnneeConferenceId={anneeConferenceId}
      />
    </div>
  )
}