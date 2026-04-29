

// app/visibilite/VisibiliteClient.tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Eye, 
  EyeOff, 
  Building2, 
  Home, 
  Users, 
  Lock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  X,
  Settings
} from 'lucide-react'
import { ConfigurationModal } from './ConfigurationModal'
import { getConfiguration } from '@/actions/configurations'

// Types
type UserLevel = 'conference' | 'district' | 'paroisse' | 'none'
type NiveauType = 'region' | 'conference' | 'district' | 'paroisse' | 'departement'

interface UniteOrganisation {
  id: number
  id_niveau: number
  nom: string
  niveau: NiveauType
  parent_id: number | null
  reference_id: number
  reference_table: string
  created_at: string
  updated_at: string
}

interface VisibilityStatus {
  isVisible: boolean
  isBlocked: boolean
  reason: string
}

interface StructureNames {
  conference?: string
  district?: string
  paroisse?: string
  departement?: string
  region?: string
}

interface UniteWithVisibility extends UniteOrganisation {
  configuration: any | null
  visibilite_status: {
    conference: VisibilityStatus
    district: VisibilityStatus
    paroisse: VisibilityStatus
  }
  userAccess: {
    canViewConference: boolean
    canViewDistrict: boolean
    canViewParoisse: boolean
    userLevel: UserLevel
  }
  hierarchie_complete?: {
    conference?: { id: number; nom: string } | null
    district?: { id: number; nom: string } | null
    paroisse?: { id: number; nom: string } | null
    region?: { id: number; nom: string } | null
  }
  structureNames?: StructureNames
}

interface BlockageStats {
  conference: { total: number; blockedCount: number; blocked: boolean }
  district: { total: number; blockedCount: number; blocked: boolean }
  paroisse: { total: number; blockedCount: number; blocked: boolean }
  totalUnites: number
}

interface VisibiliteClientProps {
  currentFidele: any
  initialUnites: UniteWithVisibility[]
  userLevel: UserLevel
  userStats: BlockageStats
}

// Fonction utilitaire
function calculateVisibilityStatus(
  unite: UniteOrganisation,
  config: any | null,
  userLevel: UserLevel
): UniteWithVisibility['visibilite_status'] {
  const defaultVisibilite = {
    conference: 'visible' as const,
    district: 'visible' as const,
    paroisse: 'visible' as const
  }

  const visibilite = config?.visibilite_budget || defaultVisibilite

  return {
    conference: {
      isVisible: visibilite.conference === 'visible',
      isBlocked: visibilite.conference === 'masque',
      reason: visibilite.conference === 'masque' ? 'Masqué par configuration' : ''
    },
    district: {
      isVisible: visibilite.district === 'visible',
      isBlocked: visibilite.district === 'masque',
      reason: visibilite.district === 'masque' ? 'Masqué par configuration' : ''
    },
    paroisse: {
      isVisible: visibilite.paroisse === 'visible',
      isBlocked: visibilite.paroisse === 'masque',
      reason: visibilite.paroisse === 'masque' ? 'Masqué par configuration' : ''
    }
  }
}

function calculateUserBlockageStats(unites: UniteWithVisibility[], fidele: any): BlockageStats {
  const stats: BlockageStats = {
    conference: { total: 0, blockedCount: 0, blocked: false },
    district: { total: 0, blockedCount: 0, blocked: false },
    paroisse: { total: 0, blockedCount: 0, blocked: false },
    totalUnites: unites.length
  }

  unites.forEach(unite => {
    if (unite.niveau === 'conference') {
      stats.conference.total++
      if (unite.visibilite_status.conference.isBlocked) {
        stats.conference.blockedCount++
      }
    }
    if (unite.niveau === 'district') {
      stats.district.total++
      if (unite.visibilite_status.district.isBlocked) {
        stats.district.blockedCount++
      }
    }
    if (unite.niveau === 'paroisse') {
      stats.paroisse.total++
      if (unite.visibilite_status.paroisse.isBlocked) {
        stats.paroisse.blockedCount++
      }
    }
  })

  const userUnite = unites.find(u => 
    u.niveau === 'paroisse' && u.reference_id === fidele.paroisse_id
  )

  if (userUnite) {
    stats.conference.blocked = userUnite.visibilite_status.conference.isBlocked
    stats.district.blocked = userUnite.visibilite_status.district.isBlocked
    stats.paroisse.blocked = userUnite.visibilite_status.paroisse.isBlocked
  }

  return stats
}

// Composants UI
function UserStatusBanner({ fidele, userLevel, stats }: { 
  fidele: any
  userLevel: UserLevel
  stats: BlockageStats
}) {
  const levelLabels: Record<UserLevel, string> = {
    conference: 'Conférence',
    district: 'District',
    paroisse: 'Paroisse',
    none: 'Non défini'
  }

  const levelColors: Record<UserLevel, string> = {
    conference: 'bg-purple-50 border-purple-200',
    district: 'bg-blue-50 border-blue-200',
    paroisse: 'bg-green-50 border-green-200',
    none: 'bg-gray-50 border-gray-200'
  }

  return (
    <div className={`border p-4 mb-6 ${levelColors[userLevel]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white flex items-center justify-center border">
            <Users size={20} className="text-gray-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {fidele.nom} {fidele.prenom}
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Niveau d'accès : <span className="font-medium">{levelLabels[userLevel]}</span>
            </p>
            {fidele.paroisse && (
              <p className="text-xs text-gray-500 mt-0.5">
                Paroisse : {fidele.paroisse.nom}
              </p>
            )}
          </div>
        </div>
        <div className="text-right bg-white p-2 border">
          <div className="text-xs font-medium text-gray-500 mb-1">VOTRE VISIBILITÉ</div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs">
              {stats.conference.blocked ? (
                <EyeOff size={12} className="text-red-500" />
              ) : (
                <Eye size={12} className="text-green-500" />
              )}
              <span className={stats.conference.blocked ? 'text-red-700' : 'text-green-700'}>
                Conf : {stats.conference.blocked ? 'Masqué' : 'Visible'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {stats.district.blocked ? (
                <EyeOff size={12} className="text-red-500" />
              ) : (
                <Eye size={12} className="text-green-500" />
              )}
              <span className={stats.district.blocked ? 'text-red-700' : 'text-green-700'}>
                Dist : {stats.district.blocked ? 'Masqué' : 'Visible'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {stats.paroisse.blocked ? (
                <EyeOff size={12} className="text-red-500" />
              ) : (
                <Eye size={12} className="text-green-500" />
              )}
              <span className={stats.paroisse.blocked ? 'text-red-700' : 'text-green-700'}>
                Par : {stats.paroisse.blocked ? 'Masqué' : 'Visible'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlockageSummary({ stats }: { stats: BlockageStats }) {
  const totalBlocked = stats.conference.blockedCount + stats.district.blockedCount + stats.paroisse.blockedCount

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      <div className="bg-white border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Conférences</span>
          <Lock size={12} className="text-red-500" />
        </div>
        <div className="text-xl font-medium text-gray-900">{stats.conference.blockedCount}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          / {stats.conference.total}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Districts</span>
          <Lock size={12} className="text-orange-500" />
        </div>
        <div className="text-xl font-medium text-gray-900">{stats.district.blockedCount}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          / {stats.district.total}
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Paroisses</span>
          <Lock size={12} className="text-yellow-500" />
        </div>
        <div className="text-xl font-medium text-gray-900">{stats.paroisse.blockedCount}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          / {stats.paroisse.total}
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700">Total bloqué</span>
          <AlertCircle size={12} className="text-gray-400" />
        </div>
        <div className="text-xl font-medium text-gray-900">{totalBlocked}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          / {stats.totalUnites}
        </div>
      </div>
    </div>
  )
}

function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="relative mb-4">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Rechercher une unité, une conférence, un district..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

function SectionUnites({ 
  id, 
  title, 
  icon, 
  unites, 
  onConfigClick,
  searchTerm = ''
}: {
  id: string
  title: string
  icon: React.ReactNode
  unites: UniteWithVisibility[]
  onConfigClick: (unite: UniteWithVisibility) => void
  searchTerm?: string
}) {
  const filteredUnites = useMemo(() => {
    if (!searchTerm) return unites
    
    const term = searchTerm.toLowerCase()
    return unites.filter(unite => {
      if (unite.nom.toLowerCase().includes(term)) return true
      
      const hierarchy = [
        unite.hierarchie_complete?.region?.nom,
        unite.hierarchie_complete?.conference?.nom,
        unite.hierarchie_complete?.district?.nom,
        unite.hierarchie_complete?.paroisse?.nom
      ].filter(Boolean).join(' ')
      
      if (hierarchy.toLowerCase().includes(term)) return true
      
      const structures = [
        unite.structureNames?.region,
        unite.structureNames?.conference,
        unite.structureNames?.district,
        unite.structureNames?.paroisse
      ].filter(Boolean).join(' ')
      
      if (structures.toLowerCase().includes(term)) return true
      
      return false
    })
  }, [unites, searchTerm])

  if (filteredUnites.length === 0 && !searchTerm) return null

  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs text-gray-400 ml-1 bg-gray-100 px-1.5 py-0.5">
          {filteredUnites.length}
        </span>
        {searchTerm && filteredUnites.length !== unites.length && (
          <span className="text-xs text-gray-400">
            (filtré de {unites.length})
          </span>
        )}
      </div>
      
      {filteredUnites.length === 0 ? (
        <div className="border border-gray-200 bg-gray-50 p-8 text-center mb-6">
          <Search size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Aucune unité ne correspond à "{searchTerm}"</p>
        </div>
      ) : (
        <div className="border border-gray-200 bg-white overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Unité</th>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Rattachement</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2 w-20">Conf</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2 w-20">Dist</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2 w-20">Par</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2 w-24">Votre accès</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUnites.map((unite) => (
                <UniteRow key={unite.id} unite={unite} onConfigClick={onConfigClick} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function UniteRow({ 
  unite, 
  onConfigClick 
}: { 
  unite: UniteWithVisibility
  onConfigClick: (unite: UniteWithVisibility) => void
}) {
  const getFullPath = () => {
    const parts: string[] = []
    
    switch (unite.niveau) {
      case 'region':
        break
      case 'conference':
        if (unite.hierarchie_complete?.region?.nom) {
          parts.push(unite.hierarchie_complete.region.nom)
        }
        break
      case 'district':
        if (unite.hierarchie_complete?.region?.nom) {
          parts.push(unite.hierarchie_complete.region.nom)
        }
        if (unite.hierarchie_complete?.conference?.nom) {
          parts.push(unite.hierarchie_complete.conference.nom)
        }
        break
      case 'paroisse':
        if (unite.hierarchie_complete?.region?.nom) {
          parts.push(unite.hierarchie_complete.region.nom)
        }
        if (unite.hierarchie_complete?.conference?.nom) {
          parts.push(unite.hierarchie_complete.conference.nom)
        }
        if (unite.hierarchie_complete?.district?.nom) {
          parts.push(unite.hierarchie_complete.district.nom)
        }
        break
      case 'departement':
        if (unite.hierarchie_complete?.paroisse?.nom) {
          parts.push(unite.hierarchie_complete.paroisse.nom)
        }
        break
    }
    
    return parts.length > 0 ? parts.join(' > ') : '—'
  }

  // CORRECTION : Utiliser les vrais noms des entités depuis structureNames ou hierarchie_complete
  const getRattachement = () => {
    switch (unite.niveau) {
      case 'conference':
        // Pour une conférence, on veut afficher le nom de la conférence
        if (unite.structureNames?.conference) {
          return `Conférence : ${unite.structureNames.conference}`
        }
        if (unite.hierarchie_complete?.conference?.nom) {
          return `Conférence : ${unite.hierarchie_complete.conference.nom}`
        }
        return '—'
      
      case 'district':
        // Pour un district, on veut afficher le nom du district
        if (unite.structureNames?.district) {
          return `District : ${unite.structureNames.district}`
        }
        if (unite.hierarchie_complete?.district?.nom) {
          return `District : ${unite.hierarchie_complete.district.nom}`
        }
        return '—'
      
      case 'paroisse':
        // Pour une paroisse, on veut afficher le nom de la paroisse
        if (unite.structureNames?.paroisse) {
          return `Paroisse : ${unite.structureNames.paroisse}`
        }
        if (unite.hierarchie_complete?.paroisse?.nom) {
          return `Paroisse : ${unite.hierarchie_complete.paroisse.nom}`
        }
        return '—'
      
      case 'departement':
        // Pour un département, on veut afficher le nom du département
        if (unite.structureNames?.departement) {
          return `Département : ${unite.structureNames.departement}`
        }
        // Si pas dans structureNames, on utilise unite.nom qui contient le nom du département
        return `Département : ${unite.nom}`
      
      case 'region':
        if (unite.structureNames?.region) {
          return `Région : ${unite.structureNames.region}`
        }
        if (unite.hierarchie_complete?.region?.nom) {
          return `Région : ${unite.hierarchie_complete.region.nom}`
        }
        return '—'
      
      default:
        return '—'
    }
  }

  const VisibilityBadge = ({ status }: { status: VisibilityStatus }) => {
    if (status.isBlocked) {
      return (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 text-xs border border-red-200">
            <EyeOff size={10} />
            Masqué
          </span>
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 text-xs border border-green-200">
          <Eye size={10} />
          Visible
        </span>
      </div>
    )
  }

  const AccessBadge = ({ access }: { access: UniteWithVisibility['userAccess'] }) => {
    if (access.canViewConference && access.canViewDistrict && access.canViewParoisse) {
      return (
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-50 text-green-700 text-xs border border-green-200">
            <CheckCircle2 size={10} />
            Complet
          </span>
        </div>
      )
    }
    
    const blockedLevels = []
    if (!access.canViewConference) blockedLevels.push('C')
    if (!access.canViewDistrict) blockedLevels.push('D')
    if (!access.canViewParoisse) blockedLevels.push('P')
    
    return (
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-700 text-xs border border-red-200">
          <XCircle size={10} />
          Bloqué ({blockedLevels.join(',')})
        </span>
      </div>
    )
  }

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-3 py-2">
        <div className="font-medium text-xs text-gray-900">{unite.nom}</div>
        <div className="text-xs text-gray-400 mt-0.5 capitalize">{unite.niveau}</div>
      </td>
      <td className="px-3 py-2">
        <div className="text-xs text-gray-600">{getFullPath()}</div>
        <div className="text-xs text-gray-500 mt-0.5 font-medium">{getRattachement()}</div>
      </td>
      <td className="px-3 py-2">
        <VisibilityBadge status={unite.visibilite_status.conference} />
      </td>
      <td className="px-3 py-2">
        <VisibilityBadge status={unite.visibilite_status.district} />
      </td>
      <td className="px-3 py-2">
        <VisibilityBadge status={unite.visibilite_status.paroisse} />
      </td>
      <td className="px-3 py-2">
        <AccessBadge access={unite.userAccess} />
      </td>
      <td className="px-3 py-2">
        <div className="flex justify-center">
          <button
            onClick={() => onConfigClick(unite)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <Settings size={10} />
            Config
          </button>
        </div>
      </td>
    </tr>
  )
}

// Composant principal
export function VisibiliteClient({ 
  currentFidele, 
  initialUnites,
  userLevel,
  userStats: initialStats
}: VisibiliteClientProps) {
  const router = useRouter()
  const [unites, setUnites] = useState(initialUnites)
  const [userStats, setUserStats] = useState(initialStats)
  const [selectedUnite, setSelectedUnite] = useState<UniteWithVisibility | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const groupedUnites = {
    conferences: unites.filter(u => u.niveau === 'conference'),
    districts: unites.filter(u => u.niveau === 'district'),
    paroisses: unites.filter(u => u.niveau === 'paroisse'),
    departements: unites.filter(u => u.niveau === 'departement')
  }

  const totalFiltered = 
    groupedUnites.conferences.filter(u => 
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.hierarchie_complete?.region?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.hierarchie_complete?.conference?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    ).length +
    groupedUnites.districts.filter(u => 
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.hierarchie_complete?.region?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.hierarchie_complete?.conference?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    ).length +
    groupedUnites.paroisses.filter(u => 
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.hierarchie_complete?.district?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    ).length +
    groupedUnites.departements.filter(u => 
      u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.structureNames?.paroisse?.toLowerCase().includes(searchTerm.toLowerCase())
    ).length

  const handleConfigClick = (unite: UniteWithVisibility) => {
    setSelectedUnite(unite)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUnite(null)
  }

  const handleConfigSaved = async () => {
    router.refresh()
    
    if (selectedUnite) {
      const updatedConfig = await getConfiguration(selectedUnite.id)
      setUnites(prev => prev.map(u => 
        u.id === selectedUnite.id 
          ? { 
              ...u, 
              configuration: updatedConfig,
              visibilite_status: calculateVisibilityStatus(u, updatedConfig, userLevel)
            }
          : u
      ))
      
      const newStats = calculateUserBlockageStats(unites, currentFidele)
      setUserStats(newStats)
    }
  }

  if (unites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-wide mb-1">
            Configuration des visibilités
          </h1>
          <p className="text-xs text-gray-500">
            Gérez les permissions de visibilité budgétaire pour les unités d&apos;organisation
          </p>
        </div>
        
        <div className="border border-yellow-200 bg-yellow-50 p-10 text-center">
          <AlertTriangle size={40} className="mx-auto text-yellow-400 mb-3" />
          <h3 className="text-base font-medium text-yellow-800 mb-1">
            Aucune unité d&apos;organisation trouvée
          </h3>
          <p className="text-xs text-yellow-700 max-w-md mx-auto">
            Les unités d&apos;organisation seront créées automatiquement lors de la première visite des départements.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-xl font-medium tracking-wide mb-1">
            Configuration des visibilités
          </h1>
          <p className="text-xs text-gray-500">
            Gérez les permissions de visibilité budgétaire pour les unités d&apos;organisation
          </p>
        </div>

        <UserStatusBanner 
          fidele={currentFidele} 
          userLevel={userLevel}
          stats={userStats}
        />

        <BlockageSummary stats={userStats} />

        <SearchBar value={searchTerm} onChange={setSearchTerm} />

        {searchTerm && (
          <div className="mb-3 text-xs text-gray-500">
            {totalFiltered} résultat{totalFiltered !== 1 ? 's' : ''} trouvé{totalFiltered !== 1 ? 's' : ''} pour "{searchTerm}"
          </div>
        )}

        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-4">
            <a href="#conferences" className="px-1 py-2 text-xs font-medium text-black border-b-2 border-black">
              Conférences ({groupedUnites.conferences.length})
            </a>
            <a href="#districts" className="px-1 py-2 text-xs text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300">
              Districts ({groupedUnites.districts.length})
            </a>
            <a href="#paroisses" className="px-1 py-2 text-xs text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300">
              Paroisses ({groupedUnites.paroisses.length})
            </a>
            <a href="#departements" className="px-1 py-2 text-xs text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300">
              Départements ({groupedUnites.departements.length})
            </a>
          </nav>
        </div>

        <div className="space-y-6">
          <SectionUnites
            id="conferences"
            title="Conférences"
            icon={<Building2 size={16} />}
            unites={groupedUnites.conferences}
            onConfigClick={handleConfigClick}
            searchTerm={searchTerm}
          />

          <SectionUnites
            id="districts"
            title="Districts"
            icon={<Building2 size={16} />}
            unites={groupedUnites.districts}
            onConfigClick={handleConfigClick}
            searchTerm={searchTerm}
          />

          <SectionUnites
            id="paroisses"
            title="Paroisses"
            icon={<Home size={16} />}
            unites={groupedUnites.paroisses}
            onConfigClick={handleConfigClick}
            searchTerm={searchTerm}
          />

          <SectionUnites
            id="departements"
            title="Départements"
            icon={<Users size={16} />}
            unites={groupedUnites.departements}
            onConfigClick={handleConfigClick}
            searchTerm={searchTerm}
          />
        </div>
      </div>

      {selectedUnite && (
        <ConfigurationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          unite={selectedUnite}
          onSave={handleConfigSaved}
        />
      )}
    </>
  )
}