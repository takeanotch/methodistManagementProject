
// components/dashboards/Role7Dashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Loader2, 
  Building2, 
  Users, 
  ChevronRight,
  Search,
  X,
  AlertCircle,
  Calendar,
  UserCheck,
  Target,
  Briefcase
} from 'lucide-react'
import { getCurrentFidele } from '@/actions/auth'
import { supabase } from '@/lib/supabase'
import { Spinner } from '@/components/Spinner'

type RoleDepartement = {
  role_id: number
  role_nom: string
  role_label: string
  departement_id: number
  departement_nom: string
  departement_description: string | null
  departement_type: string | null
  paroisse_id: number
  paroisse_nom: string
  created_at: string
}

export default function Role7Dashboard() {
  const [loading, setLoading] = useState(true)
  const [fidele, setFidele] = useState<any>(null)
  const [roles, setRoles] = useState<RoleDepartement[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const fideleData = await getCurrentFidele()
      setFidele(fideleData)

      if (!fideleData) {
        setError('Veuillez vous connecter')
        setLoading(false)
        return
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('fidele_departement')
        .select(`
          role_id,
          created_at,
          departement:departement_id (
            id,
            nom,
            description,
            type,
            roles_config
          ),
          paroisse:paroisse_id (
            id,
            nom
          )
        `)
        .eq('fidele_id', fideleData.id)
        .eq('est_actif', true)
        .order('created_at', { ascending: false })

      if (rolesError) throw rolesError

      if (rolesData && rolesData.length > 0) {
        const rolesFormatted: RoleDepartement[] = rolesData.map((r: any) => {
          const departement = Array.isArray(r.departement) ? r.departement[0] : r.departement
          const paroisse = Array.isArray(r.paroisse) ? r.paroisse[0] : r.paroisse
          
          if (!departement) return null

          const roleConfig = departement?.roles_config?.find((c: any) => c.id === r.role_id)
          
          return {
            role_id: r.role_id,
            role_nom: roleConfig?.nom || 'membre',
            role_label: roleConfig?.label || 'Membre',
            departement_id: departement.id,
            departement_nom: departement.nom,
            departement_description: departement.description,
            departement_type: departement.type,
            paroisse_id: paroisse?.id || 0,
            paroisse_nom: paroisse?.nom || 'Paroisse inconnue',
            created_at: r.created_at
          }
        }).filter(Boolean) as RoleDepartement[]

        setRoles(rolesFormatted)
      }

    } catch (error) {
      console.error('Erreur chargement données:', error)
      setError('Une erreur inattendue est survenue')
    } finally {
      setLoading(false)
    }
  }

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'president': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'vice_president': return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'secretaire': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'vice_secretaire': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'tresorier': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'conseiller': return 'bg-purple-50 text-purple-700 border-purple-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // Filtrer les rôles
  const filteredRoles = roles.filter(role => {
    const matchesSearch = role.departement_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (role.departement_description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          role.paroisse_nom.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Grouper par paroisse après filtrage
  const rolesByParoisse = filteredRoles.reduce((acc, role) => {
    if (!acc[role.paroisse_id]) {
      acc[role.paroisse_id] = {
        nom: role.paroisse_nom,
        roles: []
      }
    }
    acc[role.paroisse_id].roles.push(role)
    return acc
  }, {} as Record<number, { nom: string, roles: RoleDepartement[] }>)

  // Calculer le nombre total de départements
  const totalDepartements = roles.length

  if (loading) {
    return (
     <Spinner/>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Erreur</h1>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-4 px-4 py-2 border border-gray-300 hover:border-black text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!fidele) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-3" />
          <h1 className="text-xl font-light mb-2">Non connecté</h1>
          <p className="text-gray-500">Veuillez vous connecter pour accéder à cette page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={24} className="text-gray-400" />
          <div>
            <h1 className="text-2xl font-light tracking-wide">
              Mes Départements
            </h1>
            <p className="text-sm text-gray-500">
              {totalDepartements} département{totalDepartements > 1 ? 's' : ''} • Membre actif
            </p>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un département..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
          />
        </div>
        
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
          >
            <X size={14} />
            Effacer
          </button>
        )}
      </div>

      {/* Liste des départements */}
      {filteredRoles.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            {searchTerm 
              ? 'Aucun département ne correspond à votre recherche'
              : 'Vous n\'êtes membre d\'aucun département pour le moment'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(rolesByParoisse).map(([paroisseId, data]) => (
            <div key={paroisseId}>
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-gray-400" />
                <h3 className="text-sm font-light tracking-wide text-gray-700">
                  {data.nom}
                </h3>
                <span className="text-xs text-gray-400">({data.roles.length})</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.roles.map((role, index) => (
                  <Link
                    key={`${role.departement_id}-${index}`}
                    href={`/paroisse/departements/${role.departement_id}`}
                    className="block border bg-blue-50/20 border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          {role.departement_type && (
                            <span className="text-xs text-gray-500 uppercase">
                              {role.departement_type === 'commite' ? 'Comité' : 
                               role.departement_type === 'agence_programme' ? 'Agence programme' : 
                               role.departement_type === 'departement' ? 'Département' : 'Département'}
                            </span>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-lg">{role.departement_nom}</h3>
                            <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 ">
                             
                         
                            {role.role_label}
                            </span>
                          </div>
                          
                        </div>
                        <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                      </div>
                      
                      {role.departement_description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {role.departement_description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Calendar size={14} className="text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-400">Membre depuis</div>
                          <div className="text-sm font-medium">{formatDate(role.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}