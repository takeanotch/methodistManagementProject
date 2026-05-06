// app/chef-conference/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Calendar, 
  Loader2, 
  ChevronRight,
  Users,
  Building2,
  Layers,
  Globe,
  TrendingUp,
  Clock,
  History,
  Lock,
  Unlock,
  Plus,
  Zap,
  MapPin,
  UserCheck,
  UserPlus,
  LayoutDashboard,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react'

// Types
interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  sexe: string
  contact: string | null
  profile_img: string | null
  paroisse_id: number | null
  created_at: string
}

interface District {
  id: number
  nom: string
  conference_id: number
}

interface ChefConferenceInfo {
  id: number
  fidele_id: number
  departement_id: number
  conference_id: number
  departement_nom: string
  departement_type: string
  conference_nom: string
  fidele_nom: string
  fidele_prenom: string
  region_nom?: string
}

interface AnneeConference {
  id: number
  annee_id: number
  conference_id: number
  is_current: boolean
  created_at: string
  annee?: {
    id: number
    label: string
  }
}

interface DistrictStat {
  nom: string
  total: number
  hommes: number
  femmes: number
  pourcentage: number
}

interface TopFidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  sexe: string
  profile_img: string | null
  paroisse: string
  district: string
  dateAjout: string
}

export default function ChefConferenceDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [chefInfo, setChefInfo] = useState<ChefConferenceInfo | null>(null)
  const [anneeEnCours, setAnneeEnCours] = useState<AnneeConference | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Stats
  const [totalFideles, setTotalFideles] = useState(0)
  const [hommes, setHommes] = useState(0)
  const [femmes, setFemmes] = useState(0)
  const [totalDistricts, setTotalDistricts] = useState(0)
  const [districtsStats, setDistrictsStats] = useState<DistrictStat[]>([])
  const [topFideles, setTopFideles] = useState<TopFidele[]>([])
  const [nouveauxCeMois, setNouveauxCeMois] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const { getChefConferenceInfo } = await import('@/actions/chef-conference')
      const info = await getChefConferenceInfo()
      
      if (!info) {
        router.push('/profile')
        return
      }
      
      setChefInfo(info)

      // Charger les données en parallèle
      const [
        fidelesModule,
        districtsModule,
        anneesModule
      ] = await Promise.all([
        import('@/actions/fidele'),
        import('@/actions/structures'),
        import('@/actions/annee-conference')
      ])

      const [fidelesData, districtsData, paroissesData, anneeEnCoursData] = await Promise.all([
        fidelesModule.getFideles(),
        districtsModule.getDistricts(),
        districtsModule.getParoisses(),
        anneesModule.getCurrentAnneeConference(info.conference_id)
      ])

      setAnneeEnCours(anneeEnCoursData)

      // Filtrer les districts de cette conférence
      const districtsConference = districtsData.filter((d: District) => d.conference_id === info.conference_id)
      setTotalDistricts(districtsConference.length)

      // Créer un map des paroisses -> districts
      const paroissesMap = new Map<number, { nom: string; district_id: number }>()
      paroissesData.forEach((p: any) => {
        paroissesMap.set(p.id, { nom: p.nom, district_id: p.district_id })
      })

      const districtsMap = new Map<number, string>()
      districtsConference.forEach((d: District) => {
        districtsMap.set(d.id, d.nom)
      })

      // Filtrer les fidèles de cette conférence
      const fidelesConference: Fidele[] = []
      const paroissesIdsConference = new Set(
        paroissesData
          .filter((p: any) => districtsMap.has(p.district_id))
          .map((p: any) => p.id)
      )

      fidelesData.forEach((f: Fidele) => {
        if (f.paroisse_id && paroissesIdsConference.has(f.paroisse_id)) {
          fidelesConference.push(f)
        }
      })

      // Stats globales
      const total = fidelesConference.length
      const h = fidelesConference.filter(f => f.sexe === 'M').length
      const f = fidelesConference.filter(f => f.sexe === 'F').length

      const maintenant = new Date()
      const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)
      const nouveauxMois = fidelesConference.filter(f => new Date(f.created_at) >= debutMois).length

      setTotalFideles(total)
      setHommes(h)
      setFemmes(f)
      setNouveauxCeMois(nouveauxMois)

      // Stats par district
      const districtsStatsMap = new Map<string, { total: number; hommes: number; femmes: number }>()
      
      fidelesConference.forEach(fidele => {
        if (fidele.paroisse_id) {
          const paroisse = paroissesMap.get(fidele.paroisse_id)
          if (paroisse) {
            const districtNom = districtsMap.get(paroisse.district_id)
            if (districtNom) {
              if (!districtsStatsMap.has(districtNom)) {
                districtsStatsMap.set(districtNom, { total: 0, hommes: 0, femmes: 0 })
              }
              const stats = districtsStatsMap.get(districtNom)!
              stats.total++
              if (fidele.sexe === 'M') stats.hommes++
              if (fidele.sexe === 'F') stats.femmes++
            }
          }
        }
      })

      const districtsArray: DistrictStat[] = Array.from(districtsStatsMap.entries())
        .map(([nom, data]) => ({
          nom,
          total: data.total,
          hommes: data.hommes,
          femmes: data.femmes,
          pourcentage: 0
        }))
        .sort((a, b) => b.total - a.total)

      const maxTotal = districtsArray.length > 0 ? districtsArray[0].total : 1
      districtsArray.forEach(d => {
        d.pourcentage = Math.round((d.total / maxTotal) * 100)
      })

      setDistrictsStats(districtsArray)

      // Top fidèles récents
      const topData: TopFidele[] = fidelesConference
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8)
        .map(fidele => {
          let paroisseName = 'Non assignée'
          let districtName = 'Non assigné'

          if (fidele.paroisse_id) {
            const paroisse = paroissesMap.get(fidele.paroisse_id)
            if (paroisse) {
              paroisseName = paroisse.nom
              const districtNom = districtsMap.get(paroisse.district_id)
              if (districtNom) districtName = districtNom
            }
          }

          return {
            id: fidele.id,
            nom: fidele.nom,
            post_nom: fidele.post_nom,
            prenom: fidele.prenom,
            sexe: fidele.sexe || 'N/A',
            profile_img: fidele.profile_img,
            paroisse: paroisseName,
            district: districtName,
            dateAjout: new Date(fidele.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          }
        })

      setTopFideles(topData)

    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOuvrirAnneePourTous = async () => {
    if (!confirm('Ouvrir l\'année en cours pour TOUS les districts et TOUS les départements ?')) return
    
    setActionLoading(true)
    setMessage(null)

    try {
      const { getDistrictsByConference } = await import('@/actions/chef-conference')
      const { getDepartements } = await import('@/actions/annee-district')
      const { ajouterAnneePourTous } = await import('@/actions/annee-district')

      const districtsData = await getDistrictsByConference(chefInfo!.conference_id)
      const departementsData = await getDepartements()

      if (!anneeEnCours) {
        setMessage({ type: 'error', text: 'Aucune année en cours définie pour la conférence' })
        return
      }

      const formData = new FormData()
      formData.append('annee_id', anneeEnCours.annee_id.toString())
      formData.append('district_ids', JSON.stringify(districtsData.map((d: any) => d.id)))
      formData.append('departement_ids', JSON.stringify(departementsData.map((d: any) => d.id)))

      const result = await ajouterAnneePourTous(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${result.ajoutes || 0} année(s) créée(s), ${result.ignores || 0} déjà existante(s)` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'opération' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFermerAnneePourTous = async () => {
    if (!confirm('⚠️ Fermer l\'année en cours pour TOUS les districts et TOUS les départements ?')) return
    
    setActionLoading(true)
    setMessage(null)

    try {
      const { getDistrictsByConference } = await import('@/actions/chef-conference')
      const { getDepartements } = await import('@/actions/annee-district')
      const { fermerAnneesPourTous } = await import('@/actions/annee-district')

      const districtsData = await getDistrictsByConference(chefInfo!.conference_id)
      const departementsData = await getDepartements()

      const formData = new FormData()
      formData.append('district_ids', JSON.stringify(districtsData.map((d: any) => d.id)))
      formData.append('departement_ids', JSON.stringify(departementsData.map((d: any) => d.id)))

      const result = await fermerAnneesPourTous(formData)

      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${result.fermees || 0} année(s) fermée(s)` })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'opération' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  if (!chefInfo) return null

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white border border-gray-200">
              <LayoutDashboard size={20} className="text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-light tracking-tight text-gray-900">
                Tableau de bord
              </h1>
              <p className="text-sm text-gray-500">
                Conférence {chefInfo.conference_nom} • {chefInfo.departement_nom}
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 border-l-4 ${message.type === 'success' ? 'border-l-green-500 bg-gray-50' : 'border-l-red-500 bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle2 size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
              <span className="text-sm text-gray-700">{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Bannière Année en cours */}
        {anneeEnCours ? (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 flex items-center justify-center">
                  <TrendingUp size={28} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-600 mb-1">Année en cours</p>
                  <p className="text-3xl font-light text-emerald-900">{anneeEnCours.annee?.label}</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    Ouverte le {new Date(anneeEnCours.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleOuvrirAnneePourTous}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Unlock size={16} />}
                  Ouvrir pour tous
                </button>
                <button
                  onClick={handleFermerAnneePourTous}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                  Fermer pour tous
                </button>
              </div>
            </div>
            <p className="text-xs text-emerald-500 mt-3">
              Ces actions s'appliquent à tous les districts et départements de la conférence
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 flex items-center justify-center">
                <AlertCircle size={28} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Aucune année en cours</p>
                <p className="text-sm text-amber-600">
                  Veuillez définir une année en cours depuis la{' '}
                  <Link href="/chef-conference/annees" className="underline font-medium">
                    gestion des années
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 border border-blue-100">
                <Users size={18} className="text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{totalFideles.toLocaleString()}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total Fidèles</div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex gap-3 text-xs text-gray-400">
              <span>♂ {hommes.toLocaleString()}</span>
              <span>♀ {femmes.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 border border-purple-100">
                <Building2 size={18} className="text-purple-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{totalDistricts}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Districts</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">Dans la conférence</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 border border-emerald-100">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">
              {totalFideles > 0 ? Math.round((hommes / totalFideles) * 100) : 0}% / {totalFideles > 0 ? Math.round((femmes / totalFideles) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Répartition H/F</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="w-full h-1.5 bg-gray-100 overflow-hidden flex">
                <div 
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${totalFideles > 0 ? (hommes / totalFideles) * 100 : 0}%` }}
                />
                <div 
                  className="h-full bg-pink-400 transition-all"
                  style={{ width: `${totalFideles > 0 ? (femmes / totalFideles) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 border border-amber-100">
                <UserPlus size={18} className="text-amber-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">+{nouveauxCeMois}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Nouveaux ce mois</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">Fidèles ajoutés</span>
            </div>
          </div>
        </div>

        {/* Stats par district */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Fidèles par district</h3>
          </div>
          <div className="p-5">
            {districtsStats.length > 0 ? (
              <div className="space-y-3">
                {districtsStats.map((district) => (
                  <div key={district.nom}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-gray-700 truncate max-w-[200px]">{district.nom}</span>
                      <span className="text-gray-500 text-xs flex-shrink-0 ml-3">
                        {district.total} fidèles (♂{district.hommes} ♀{district.femmes})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 overflow-hidden">
                      <div className="h-full flex">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${district.total > 0 ? (district.hommes / district.total) * district.pourcentage : 0}%` }}
                        />
                        <div 
                          className="h-full bg-pink-400 transition-all duration-500"
                          style={{ width: `${district.total > 0 ? (district.femmes / district.total) * district.pourcentage : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Top fidèles récents */}
        <div className="bg-white border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Derniers fidèles enregistrés</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Fidèle</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Sexe</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Paroisse</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider hidden md:table-cell">District</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {topFideles.map((fidele) => (
                  <tr key={fidele.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {fidele.profile_img ? (
                            <img src={fidele.profile_img} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-gray-500">
                              {fidele.prenom[0]}{fidele.nom[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">
                            {fidele.prenom} {fidele.nom}
                          </p>
                          {fidele.post_nom && (
                            <p className="text-xs text-gray-400">{fidele.post_nom}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 border ${
                        fidele.sexe === 'M' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-pink-50 text-pink-700 border-pink-200'
                      }`}>
                        {fidele.sexe === 'M' ? '♂ H' : '♀ F'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-gray-300" />
                        {fidele.paroisse}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{fidele.district}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 text-sm text-gray-400">
                        <Clock size={12} className="text-gray-300" />
                        {fidele.dateAjout}
                      </div>
                    </td>
                  </tr>
                ))}
                {topFideles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                      Aucun fidèle enregistré
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-900">Accès rapides</h3>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Link
              href="/chef-conference/annees"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 border border-blue-100">
                  <Calendar size={14} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-700">Gestion des années</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
            <Link
              href="/admin/fideles/nouveau"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-50 border border-emerald-100">
                  <UserPlus size={14} className="text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">Ajouter un fidèle</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
            <Link
              href="/admin/fideles"
              className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-purple-50 border border-purple-100">
                  <Users size={14} className="text-purple-600" />
                </div>
                <span className="text-sm text-gray-700">Liste des fidèles</span>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}