// app/conference/pasteurs/FiltresPasteurs.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Paroisse {
  id: number
  nom: string
  district?: {
    id: number
    nom: string
  }
}

interface District {
  id: number
  nom: string
}

interface FiltresPasteursProps {
  paroisses: Paroisse[]
  districts: District[]
  filtreActuel: {
    paroisse: string
    district: string
  }
}

export default function FiltresPasteurs({ paroisses, districts, filtreActuel }: FiltresPasteursProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [selectedDistrict, setSelectedDistrict] = useState(filtreActuel.district)
  const [selectedParoisse, setSelectedParoisse] = useState(filtreActuel.paroisse)
  
  // Filtrer les paroisses en fonction du district sélectionné
  const paroissesFiltrees = selectedDistrict
    ? paroisses.filter(p => p.district?.id.toString() === selectedDistrict)
    : paroisses

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId)
    setSelectedParoisse('') // Réinitialiser la paroisse
    
    const params = new URLSearchParams(searchParams.toString())
    if (districtId) {
      params.set('district', districtId)
    } else {
      params.delete('district')
    }
    params.delete('paroisse') // Supprimer le filtre paroisse
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleParoisseChange = (paroisseId: string) => {
    setSelectedParoisse(paroisseId)
    
    const params = new URLSearchParams(searchParams.toString())
    if (paroisseId) {
      params.set('paroisse', paroisseId)
    } else {
      params.delete('paroisse')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
    setSelectedDistrict('')
    setSelectedParoisse('')
    
    const params = new URLSearchParams(searchParams.toString())
    params.delete('district')
    params.delete('paroisse')
    router.push(`${pathname}?${params.toString()}`)
  }

  const hasActiveFilters = selectedDistrict || selectedParoisse

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Filtre District */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">
          District :
        </label>
        <select
          value={selectedDistrict}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 bg-white focus:outline-none focus:border-gray-500 min-w-[180px]"
        >
          <option value="">Tous les districts</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id.toString()}>
              {district.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Filtre Paroisse */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 uppercase tracking-wider whitespace-nowrap">
          Paroisse :
        </label>
        <select
          value={selectedParoisse}
          onChange={(e) => handleParoisseChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 bg-white focus:outline-none focus:border-gray-500 min-w-[200px]"
          disabled={paroissesFiltrees.length === 0}
        >
          <option value="">Toutes les paroisses</option>
          {paroissesFiltrees.map((paroisse) => (
            <option key={paroisse.id} value={paroisse.id.toString()}>
              {paroisse.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Bouton Reset */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Réinitialiser
        </button>
      )}
    </div>
  )
}