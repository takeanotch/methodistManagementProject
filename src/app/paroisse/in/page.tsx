

// app/paroisse/test/departements/page.tsx

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Loader2, 
  Building2, 
  Users, 
  Activity, 
  Target,
  ChevronRight,
  Search,
  X,
  AlertCircle,
  Calendar,
  UserCheck,
  FolderOpen
} from 'lucide-react'
import { getCurrentFidele } from '@/actions/auth'
import { getDepartementUnite } from '@/actions/unite-organisation'
import { getActivitesByUnite } from '@/actions/activite'
import { getProjetsByUnite } from '@/actions/projet'
import { getPlansActionByUnite } from '@/actions/plan-action'
import { supabase } from '@/lib/supabase'

interface DepartementAvecStats {
  id: number
  nom: string
  description: string | null
  type: string | null
  unite_id: number | null
  membres_count: number
  activites_count: number
  projets_count: number
  plans_count: number
  est_membre: boolean
  mon_role?: {
    role_id: number
    role_label: string
  }
}

export default function DepartementsParoissePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fidele, setFidele] = useState<any>(null)
  const [paroisseId, setParoisseId] = useState<number | null>(null)
  const [paroisseNom, setParoisseNom] = useState<string>('')
  const [departements, setDepartements] = useState<DepartementAvecStats[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Récupérer le fidèle connecté
      const fideleData = await getCurrentFidele()
      
      if (!fideleData) {
        setError('Veuillez vous connecter')
        setLoading(false)
        return
      }
      
      setFidele(fideleData)
      
      // 2. Récupérer la paroisse du fidèle
      const currentParoisseId = fideleData.paroisse_id
      
      if (!currentParoisseId) {
        setError('Votre compte n\'est pas associé à une paroisse')
        setLoading(false)
        return
      }
      
      setParoisseId(currentParoisseId)
      
      // Récupérer le nom de la paroisse
      const { data: paroisse, error: paroisseError } = await supabase
        .from('paroisse')
        .select('nom')
        .eq('id', currentParoisseId)
        .single()
      
      if (!paroisseError && paroisse) {
        setParoisseNom(paroisse.nom)
      }
      
      // 3. Récupérer TOUS les départements de cette paroisse
      // via la table fidele_departement (les départements qui ont des membres dans cette paroisse)
      const { data: affectations, error: affError } = await supabase
        .from('fidele_departement')
        .select(`
          departement_id,
          departement:departement_id (
            id,
            nom,
            description,
            type,
            roles_config
          )
        `)
        .eq('paroisse_id', currentParoisseId)
        .eq('est_actif', true)
      
      if (affError) {
        console.error('Erreur chargement affectations:', affError)
        setError(`Erreur: ${affError.message}`)
        setDepartements([])
        setLoading(false)
        return
      }
      
      // Extraire les départements uniques
      const deptsMap = new Map()
      affectations?.forEach((aff: any) => {
        const dept = Array.isArray(aff.departement) ? aff.departement[0] : aff.departement
        if (dept && !deptsMap.has(dept.id)) {
          deptsMap.set(dept.id, dept)
        }
      })
      
      const departementsList = Array.from(deptsMap.values())
      
      if (departementsList.length === 0) {
        setDepartements([])
        setLoading(false)
        return
      }
      
      // 4. Récupérer les affectations du fidèle pour savoir dans quels départements il est membre
      const { data: mesAffectations, error: mesAffError } = await supabase
        .from('fidele_departement')
        .select('departement_id, role_id, est_actif')
        .eq('fidele_id', fideleData.id)
        .eq('paroisse_id', currentParoisseId)
        .eq('est_actif', true)
      
      const mesDeptsMap = new Map()
      if (!mesAffError && mesAffectations) {
        mesAffectations.forEach(aff => {
          mesDeptsMap.set(aff.departement_id, aff.role_id)
        })
      }
      
      // 5. Pour chaque département, calculer les statistiques via les unités
      const deptsWithStats = await Promise.all(
        departementsList.map(async (dept: any) => {
          // Récupérer l'unité du département pour cette paroisse
          const unite = await getDepartementUnite(dept.id, currentParoisseId)
          const uniteId = unite?.id || null
          
          let activitesCount = 0
          let projetsCount = 0
          let plansCount = 0
          
          // Si l'unité existe, récupérer les statistiques filtrées par année ?
          // Pour la page d'accueil, on peut prendre l'année en cours ou toutes les activités
          if (uniteId) {
            // Compter les activités (toutes années confondues ou avec année en cours?)
            const activites = await getActivitesByUnite(uniteId)
            activitesCount = activites.length
            
            // Compter les projets
            const projets = await getProjetsByUnite(uniteId)
            projetsCount = projets.length
            
            // Compter les plans d'action
            const plans = await getPlansActionByUnite(uniteId)
            plansCount = plans.length
          } else {
            // Fallback: compter directement dans les tables
            const { count: actCount } = await supabase
              .from('activite')
              .select('id', { count: 'exact', head: true })
              .eq('departement_id', dept.id)
              .eq('paroisse_id', currentParoisseId)
            
            const { count: projCount } = await supabase
              .from('projet')
              .select('id', { count: 'exact', head: true })
              .eq('departement_id', dept.id)
              .eq('paroisse_id', currentParoisseId)
            
            const { count: planCount } = await supabase
              .from('plan_action')
              .select('id', { count: 'exact', head: true })
              .eq('departement_id', dept.id)
              .eq('paroisse_id', currentParoisseId)
            
            activitesCount = actCount || 0
            projetsCount = projCount || 0
            plansCount = planCount || 0
          }
          
          // Compter les membres actifs dans ce département
          const { count: membresCount } = await supabase
            .from('fidele_departement')
            .select('id', { count: 'exact', head: true })
            .eq('departement_id', dept.id)
            .eq('paroisse_id', currentParoisseId)
            .eq('est_actif', true)
          
          // Vérifier si l'utilisateur est membre de ce département
          const estMembre = mesDeptsMap.has(dept.id)
          let monRole = undefined
          
          if (estMembre) {
            const roleId = mesDeptsMap.get(dept.id)
            const roleLabel = dept.roles_config?.find((r: any) => r.id === roleId)?.label || `Rôle ${roleId}`
            monRole = {
              role_id: roleId,
              role_label: roleLabel
            }
          }
          
          return {
            id: dept.id,
            nom: dept.nom,
            description: dept.description,
            type: dept.type,
            unite_id: uniteId,
            membres_count: membresCount || 0,
            activites_count: activitesCount,
            projets_count: projetsCount,
            plans_count: plansCount,
            est_membre: estMembre,
            mon_role: monRole
          }
        })
      )
      
      // Trier par ordre alphabétique
      deptsWithStats.sort((a, b) => a.nom.localeCompare(b.nom))
      
      setDepartements(deptsWithStats)
      setLoading(false)
      
    } catch (error) {
      console.error('Erreur loadData:', error)
      setError('Une erreur inattendue est survenue')
      setLoading(false)
    }
  }

  // Filtrer les départements
  const filteredDepartements = departements.filter(dept => {
    const matchesSearch = dept.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (dept.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  // Statistiques globales
  const totalMembres = departements.reduce((sum, d) => sum + d.membres_count, 0)
  const totalActivites = departements.reduce((sum, d) => sum + d.activites_count, 0)
  const totalProjets = departements.reduce((sum, d) => sum + d.projets_count, 0)
  const mesDepartements = departements.filter(d => d.est_membre).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
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
              Départements de {paroisseNom || 'ma paroisse'}
            </h1>
            <p className="text-sm text-gray-500">
              {departements.length} département(s) • {totalMembres} membre(s) au total
              {mesDepartements > 0 && ` • ${mesDepartements} où je suis membre`}
            </p>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Building2 size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{departements.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Départements</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Users size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalMembres}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Membres totaux</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <Activity size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalActivites}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Activités</p>
        </div>
        
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <FolderOpen size={20} className="text-gray-400" />
            <span className="text-2xl font-light">{totalProjets}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">Projets</p>
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
      {filteredDepartements.length === 0 ? (
        <div className="bg-white border border-gray-200 py-16 text-center">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">
            {searchTerm 
              ? 'Aucun département ne correspond à votre recherche'
              : 'Aucun département trouvé dans votre paroisse'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartements.map((departement) => (
            <Link
              key={departement.id}
              href={`/paroisse/in/departements/${departement.id}`}
              className={`block border transition-all hover:shadow-sm ${
                departement.est_membre 
                  ? 'bg-blue-50/20 border-blue-200 hover:border-blue-300' 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-lg">{departement.nom}</h3>
                      {departement.est_membre && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          <UserCheck size={12} />
                          Membre
                        </span>
                      )}
                    </div>
                    {departement.mon_role && (
                      <p className="text-xs text-blue-600 mt-1">
                        Mon rôle: {departement.mon_role.role_label}
                      </p>
                    )}
                    {departement.type && (
                      <span className="text-xs text-gray-400">
                        {departement.type === 'commite' ? 'Comité' : 
                         departement.type === 'agence_programme' ? 'Agence programme' : 'Département'}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
                </div>
                
                {departement.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {departement.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{departement.membres_count}</div>
                      <div className="text-xs text-gray-400">Membres</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{departement.activites_count}</div>
                      <div className="text-xs text-gray-400">Activités</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <FolderOpen size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{departement.projets_count}</div>
                      <div className="text-xs text-gray-400">Projets</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-gray-400" />
                    <div>
                      <div className="text-sm font-medium">{departement.plans_count}</div>
                      <div className="text-xs text-gray-400">Plans d'action</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}