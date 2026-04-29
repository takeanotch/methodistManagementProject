// app/admin/departements/SearchAndFilter.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

interface SearchAndFilterProps {
  initialSearch?: string
  initialType?: string
}

export default function SearchAndFilter({ initialSearch = '', initialType = 'all' }: SearchAndFilterProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  const [type, setType] = useState(initialType)

  const types = [
    { value: 'all', label: 'Tous les types' },
    { value: 'commite', label: 'Comité' },
    { value: 'agence_programme', label: 'Agence/Programme' },
    { value: 'departement', label: 'Département' },
    { value: 'normal', label: 'Normal' },
  ]

  const updateFilters = useCallback(() => {
    const params = new URLSearchParams()
    
    if (search && search.trim() !== '') {
      params.set('search', search.trim())
    }
    
    if (type && type !== 'all') {
      params.set('type', type)
    }
    
    const queryString = params.toString()
    router.push(`/admin/departements${queryString ? `?${queryString}` : ''}`, { scroll: false })
  }, [search, type, router])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [search, type, updateFilters])

  const clearFilters = () => {
    setSearch('')
    setType('all')
    router.push('/admin/departements', { scroll: false })
  }

  const hasActiveFilters = search || type !== 'all'

  return (
    <div className="flex-1 space-y-3">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un département..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
          />
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-4 py-2 border border-gray-200 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white min-w-[180px]"
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2 border border-gray-200 hover:border-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Effacer
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-xs text-gray-400">
          Filtres actifs : 
          {search && <span className="ml-2">Recherche: "{search}"</span>}
          {type !== 'all' && (
            <span className="ml-2">
              Type: {types.find(t => t.value === type)?.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}