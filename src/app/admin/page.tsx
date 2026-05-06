// app/admin/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/actions/auth'
import { getConferencesWithChefs, getDistrictsWithChefs } from '@/actions/structures'
import { getAllSurintendants } from '@/actions/surintendant'
import { getFideles } from '@/actions/fidele'
import { getAnneesConference, getCurrentAnneeConferenceGlobal, type AnneeConference } from '@/actions/annee-conference'
import { getAllAnneesConferenceGrouped } from '@/actions/annee-conference'
import { 
  Users, 
  ChevronRight,
  User,
  Calendar,
  Building2,
  Shield,
  Layers,
  Globe,
  Loader2,
  CheckCircle,
  XCircle,
  Filter,
  FilterX,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart,
  UserCheck,
  UserPlus,
  Clock,
  MapPin,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

// Types
interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  profile_img: string | null
  compte: {
    id: number
    role_id: number
    role: {
      nom: string
      niveau: string
    }
  } | null
}

interface ConferenceWithChefs {
  id: number
  nom: string
  region?: { id: number; nom: string }
  chefs?: any[]
}

interface DistrictWithChefs {
  id: number
  nom: string
  conference?: { id: number; nom: string; region?: { id: number; nom: string } }
  chefs?: any[]
}

interface Surintendant {
  id: number
  fidele_id: number
  district_id: number
  est_actif: boolean
  created_at: string
  annee_conference_id?: number | null
  district: {
    id: number
    nom: string
    conference?: { id: number; nom: string; region?: { id: number; nom: string } }
  }
  fidele: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [conferences, setConferences] = useState<ConferenceWithChefs[]>([])
  const [districts, setDistricts] = useState<DistrictWithChefs[]>([])
  const [surintendants, setSurintendants] = useState<Surintendant[]>([])
  const [allFideles, setAllFideles] = useState<Fidele[]>([])

  // Filtres
  const [selectedFilterAnneeId, setSelectedFilterAnneeId] = useState<number | null>(null)
  const [availableAnnees, setAvailableAnnees] = useState<AnneeConference[]>([])
  const [showAnneeFilterDropdown, setShowAnneeFilterDropdown] = useState(false)
  const [loadingAnnees, setLoadingAnnees] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadData()
    }
  }, [selectedFilterAnneeId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const user = await getUser()
      if (!user || user.role?.nom !== 'admin') {
        router.push('/profile')
        return
      }

      const [conferencesData, districtsData, surintendantsData, fidelesData] = await Promise.all([
        getConferencesWithChefs(),
        getDistrictsWithChefs(selectedFilterAnneeId),
        getAllSurintendants(selectedFilterAnneeId),
        getFideles()
      ])

      setConferences(conferencesData)
      setDistricts(districtsData as DistrictWithChefs[])
      setSurintendants(surintendantsData)
      setAllFideles(fidelesData)

      await loadAllAnneesForFilter(conferencesData)
    } catch (error) {
      console.error('Erreur chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAllAnneesForFilter = async (conferencesData: any[]) => {
    try {
      setLoadingAnnees(true)
      const allAnnees: AnneeConference[] = []
      const seenIds = new Set<number>()

      for (const conference of conferencesData) {
        if (conference.id) {
          const annees = await getAnneesConference(conference.id)
          for (const annee of annees) {
            if (!seenIds.has(annee.id)) {
              seenIds.add(annee.id)
              allAnnees.push(annee)
            }
          }
        }
      }

      allAnnees.sort((a, b) => (b.annee_id || 0) - (a.annee_id || 0))
      setAvailableAnnees(allAnnees)
    } catch (error) {
      console.error('Erreur chargement des années:', error)
    } finally {
      setLoadingAnnees(false)
    }
  }

  const handleResetFilter = () => {
    setSelectedFilterAnneeId(null)
  }

  const getSelectedAnneeLabel = () => {
    if (!selectedFilterAnneeId) return null
    const annee = availableAnnees.find(a => a.id === selectedFilterAnneeId)
    return annee?.annee?.label || `Année #${selectedFilterAnneeId}`
  }

  // Statistiques
  const totalConferences = conferences.length
  const totalDistricts = districts.length
  const totalFideles = allFideles.length
  const totalSurintendants = surintendants.length
  const totalSurintendantsActifs = surintendants.filter(s => s.est_actif).length

  // Chefs par conférence
  const totalChefsConferences = conferences.reduce((acc, c) => acc + (c.chefs?.length || 0), 0)
  const conferencesAvecChefs = conferences.filter(c => (c.chefs?.length || 0) > 0).length

  // Chefs par district
  const totalChefsDistricts = districts.reduce((acc, d) => acc + (d.chefs?.length || 0), 0)
  const districtsAvecChefs = districts.filter(d => (d.chefs?.length || 0) > 0).length

  const totalChefs = totalChefsConferences + totalChefsDistricts + totalSurintendantsActifs

  // Statistiques de couverture
  const conferencesSansChef = totalConferences - conferencesAvecChefs
  const districtsSansChef = totalDistricts - districtsAvecChefs
  const tauxCouvertureConf = totalConferences > 0 ? Math.round((conferencesAvecChefs / totalConferences) * 100) : 0
  const tauxCouvertureDist = totalDistricts > 0 ? Math.round((districtsAvecChefs / totalDistricts) * 100) : 0

  // Rôles des fidèles
  const fidelesAvecCompte = allFideles.filter(f => f.compte).length
  const fidelesSansCompte = totalFideles - fidelesAvecCompte

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto ">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white border border-gray-200">
                  <LayoutDashboard size={20} className="text-gray-700" />
                </div>
                <h1 className="text-3xl font-light tracking-tight text-gray-900">
                  Tableau de bord
                </h1>
              </div>
              <p className="text-gray-500 ml-14">
                Vue d'ensemble de la gestion des structures et des responsables
              </p>
            </div>
          </div>

          {/* Barre de filtre par année */}
          <div className="mt-6 bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Filtrer par année :</span>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowAnneeFilterDropdown(!showAnneeFilterDropdown)}
                    disabled={loadingAnnees}
                    className="min-w-[220px] px-4 py-2 border border-gray-200 text-left flex items-center justify-between hover:border-gray-300 transition-colors bg-white disabled:opacity-50"
                  >
                    <span className={selectedFilterAnneeId ? 'text-gray-900' : 'text-gray-400'}>
                      {loadingAnnees ? (
                        <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Chargement...</span>
                      ) : selectedFilterAnneeId ? (
                        getSelectedAnneeLabel()
                      ) : (
                        'Toutes les années'
                      )}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAnneeFilterDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showAnneeFilterDropdown && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowAnneeFilterDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg z-20 min-w-[220px] max-h-64 overflow-y-auto">
                        <button
                          onClick={() => { setSelectedFilterAnneeId(null); setShowAnneeFilterDropdown(false) }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${!selectedFilterAnneeId ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                        >
                          <span>Toutes les années</span>
                          {!selectedFilterAnneeId && <CheckCircle size={14} className="text-emerald-600" />}
                        </button>
                        <div className="border-t border-gray-100"></div>
                        {availableAnnees.map((ac) => (
                          <button
                            key={ac.id}
                            onClick={() => { setSelectedFilterAnneeId(ac.id); setShowAnneeFilterDropdown(false) }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${selectedFilterAnneeId === ac.id ? 'bg-gray-50 text-gray-900' : 'text-gray-700'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{ac.annee?.label || `Année ${ac.annee_id}`}</span>
                              {ac.is_current && (
                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-medium">En cours</span>
                              )}
                            </div>
                            {selectedFilterAnneeId === ac.id && <CheckCircle size={14} className="text-emerald-600" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {selectedFilterAnneeId && (
                <button
                  onClick={handleResetFilter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FilterX size={14} />
                  Réinitialiser le filtre
                </button>
              )}
            </div>
            
            {selectedFilterAnneeId && (
              <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                <span>Données filtrées pour l'année {getSelectedAnneeLabel()}</span>
              </div>
            )}
          </div>
        </div>

        {/* KPI Cards - Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 p-5 group hover:border-gray-400 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 border border-blue-100">
                <Globe size={18} className="text-blue-600" />
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="text-3xl font-light text-gray-900 mb-1">{totalConferences}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Conférences</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">{conferencesAvecChefs} avec responsables</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 group hover:border-gray-400 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 border border-purple-100">
                <Layers size={18} className="text-purple-600" />
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="text-3xl font-light text-gray-900 mb-1">{totalDistricts}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Districts</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">{districtsAvecChefs} avec responsables</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 group hover:border-gray-400 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 border border-emerald-100">
                <Shield size={18} className="text-emerald-600" />
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="text-3xl font-light text-gray-900 mb-1">{totalSurintendantsActifs}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Surintendants actifs</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">sur {totalSurintendants} total</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5 group hover:border-gray-400 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 border border-amber-100">
                <Users size={18} className="text-amber-600" />
              </div>
              <ArrowUpRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
            </div>
            <div className="text-3xl font-light text-gray-900 mb-1">{totalChefs}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total responsables</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">Tous niveaux confondus</span>
            </div>
          </div>
        </div>

        {/* KPI Cards - Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-rose-50 border border-rose-100">
                <UserCheck size={18} className="text-rose-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{fidelesAvecCompte}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Fidèles avec compte</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100">
                  <div 
                    className="h-1 bg-rose-400 transition-all" 
                    style={{ width: `${totalFideles > 0 ? Math.round((fidelesAvecCompte / totalFideles) * 100) : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">
                  {totalFideles > 0 ? Math.round((fidelesAvecCompte / totalFideles) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-sky-50 border border-sky-100">
                <BarChart3 size={18} className="text-sky-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{tauxCouvertureConf}%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Couverture conférences</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100">
                  <div 
                    className="h-1 bg-sky-400 transition-all" 
                    style={{ width: `${tauxCouvertureConf}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{conferencesSansChef} sans chef</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-indigo-50 border border-indigo-100">
                <PieChart size={18} className="text-indigo-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{tauxCouvertureDist}%</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Couverture districts</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-100">
                  <div 
                    className="h-1 bg-indigo-400 transition-all" 
                    style={{ width: `${tauxCouvertureDist}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{districtsSansChef} sans chef</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-teal-50 border border-teal-100">
                <Activity size={18} className="text-teal-600" />
              </div>
            </div>
            <div className="text-2xl font-light text-gray-900 mb-1">{totalFideles}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">Total fidèles</div>
            <div className="mt-2 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                {fidelesSansCompte} sans compte
              </span>
            </div>
          </div>
        </div>

        {/* Section Détails */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conférences récentes */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Conférences</h3>
              <Link 
                href="/admin/chef?tab=conferences"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              {conferences.slice(0, 5).map((conf) => {
                const nbChefs = conf.chefs?.length || 0
                return (
                  <div key={conf.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm text-gray-900">{conf.nom}</p>
                      {conf.region && (
                        <p className="text-xs text-gray-400 mt-0.5">{conf.region.nom}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 border ${
                        nbChefs > 0 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {nbChefs} responsable{nbChefs !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Districts récents */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Districts</h3>
              <Link 
                href="/admin/chef?tab=districts"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              {districts.slice(0, 5).map((dist) => {
                const nbChefs = dist.chefs?.length || 0
                return (
                  <div key={dist.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm text-gray-900">{dist.nom}</p>
                      {dist.conference && (
                        <p className="text-xs text-gray-400 mt-0.5">{dist.conference.nom}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 border ${
                        nbChefs > 0 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {nbChefs} responsable{nbChefs !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Surintendants récents */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Surintendants récents</h3>
              <Link 
                href="/admin/chef?tab=surintendants"
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
              >
                Voir tout <ChevronRight size={12} />
              </Link>
            </div>
            <div className="p-4">
              {surintendants.slice(0, 5).map((sur) => (
                <div key={sur.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      {sur.fidele?.profile_img ? (
                        <img src={sur.fidele.profile_img} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User size={12} />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        {sur.fidele?.prenom} {sur.fidele?.nom}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{sur.district?.nom}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 border ${
                    sur.est_actif 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {sur.est_actif ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              ))}
              {surintendants.length === 0 && (
                <div className="py-8 text-center text-sm text-gray-400">
                  Aucun surintendant enregistré
                </div>
              )}
            </div>
          </div>

          {/* Liens rapides */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-medium text-gray-900">Accès rapides</h3>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/admin/chef"
                className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 border border-gray-200">
                    <Users size={14} className="text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">Gestion des responsables</span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
              <Link
                href="/admin/structures"
                className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 border border-gray-200">
                    <Building2 size={14} className="text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">Structures</span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
              <Link
                href="/admin/fideles"
                className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 border border-gray-200">
                    <UserCheck size={14} className="text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">Fidèles</span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
              <Link
                href="/admin/annees-conference"
                className="flex items-center justify-between p-3 border border-gray-100 hover:border-gray-300 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gray-100 border border-gray-200">
                    <Calendar size={14} className="text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">Années de conférence</span>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}