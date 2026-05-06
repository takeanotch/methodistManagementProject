

// app/admin/commissions/[id]/membres/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { updateCommission } from '@/actions/commissions'
import { getFidelesByParoisse } from '@/actions/fidele'
import { 
  getAnneesConferenceDisponiblesForDepartement, 
  getCurrentAnneeConferenceForDepartement,
  addFideleToDepartement,
  desactiverFideleFromDepartement,
  deleteFideleFromDepartement,
  getCurrentAnneeForDepartement,
  getRolesByDepartement
} from '@/actions/fidele-departement'
import { Plus, Trash2, Users, X, Loader2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  contact: string
  telephone?: string
  profile_img?: string
  paroisse_id: number
  actif?: boolean
}

interface Role {
  id: number
  nom: string
  label: string
  niveau: number
  couleur: string
}

interface AnneeConference {
  id: number
  annee_id: number
  label: string
  is_current: boolean
}

interface MembreCommission {
  id: number
  fidele_id: number
  commission_id: number
  departement_id: number
  role_id: number
  annee_id: number
  annee_conference_id: number
  est_actif: boolean
  fidele: Fidele
  role_details?: Role
  annee?: { id: number; label: string }
  annee_conference?: AnneeConference
}

interface Commission {
  id: number
  nom: string
  description: string | null
  paroisse_id: number
  departement_id: number
  paroisse?: { id: number; nom: string }
  departement?: { id: number; nom: string; roles_config: Role[] }
  membres: MembreCommission[]
}

export default function CommissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [commission, setCommission] = useState<Commission | null>(null)
  const [fideles, setFideles] = useState<Fidele[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [anneesConference, setAnneesConference] = useState<AnneeConference[]>([])
  const [anneeEnCours, setAnneeEnCours] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFideleSelector, setShowFideleSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [fideleSearchTerm, setFideleSearchTerm] = useState('')
  const [selectedFidele, setSelectedFidele] = useState<Fidele | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedAnneeConference, setSelectedAnneeConference] = useState<AnneeConference | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editNom, setEditNom] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    loadCommission()
  }, [])

async function loadCommission(): Promise<void> {
  setLoading(true)
  
  const commissionId: number = parseInt(params.id as string)
  console.log('🔍 [DEBUG] Chargement commission ID:', commissionId)
  
  try {
    // 1. Récupérer la commission
    const { data: commissionData, error: commissionError } = await supabase
      .from('commission')
      .select(`
        id,
        nom,
        description,
        paroisse_id,
        departement_id,
        paroisse:paroisse_id (id, nom),
        departement:departement_id (id, nom, roles_config)
      `)
      .eq('id', params.id)
      .single()

    if (commissionError) {
      console.error('❌ [DEBUG] Erreur chargement commission:', commissionError)
      toast.error('Erreur lors du chargement de la commission')
      setLoading(false)
      return
    }

    console.log('✅ [DEBUG] Commission chargée:', {
      id: commissionData.id,
      nom: commissionData.nom,
      departement_id: commissionData.departement_id,
      paroisse_id: commissionData.paroisse_id
    })

    const paroisse = Array.isArray(commissionData.paroisse) 
      ? commissionData.paroisse[0] 
      : commissionData.paroisse
    
    const departement = Array.isArray(commissionData.departement) 
      ? commissionData.departement[0] 
      : commissionData.departement

    // 2. Récupérer les membres spécifiques à cette commission
    let membres: MembreCommission[] = []
    
    console.log('🔍 [DEBUG] Récupération des membres pour la commission ID:', commissionId)
    
    const { data: membresData, error: membresError } = await supabase
      .from('fidele_departement')
      .select(`
        id,
        fidele_id,
        departement_id,
        commission_id,
        role_id,
        annee_id,
        annee_conference_id,
        est_actif,
        paroisse_id
      `)
      .eq('commission_id', commissionId)
      .order('est_actif', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (membresError) {
      console.error('❌ Erreur récupération membres:', membresError)
      toast.error('Erreur lors du chargement des membres')
    } else if (membresData && membresData.length > 0) {
      console.log(`✅ ${membresData.length} membres trouvés pour la commission`)
      
      // Récupérer les IDs des fidèles (dédoublonnés et filtrés)
      const fideleIds = [...new Set(
        membresData
          .map((item: any) => item.fidele_id)
          .filter((id: any) => id !== null && id !== undefined)
      )]
      console.log('📊 IDs des fidèles:', fideleIds)
      
      // Récupérer les fidèles en une seule requête (seulement si des IDs existent)
      let fidelesData: any[] = []
      if (fideleIds.length > 0) {
        const { data, error: fidelesError } = await supabase
          .from('fidele')
          .select('id, nom, post_nom, prenom, contact, profile_img, paroisse_id')
          .in('id', fideleIds)
        
        if (fidelesError) {
          console.error('❌ Erreur récupération fidèles:', JSON.stringify(fidelesError, null, 2))
          console.error('❌ Détails de l\'erreur:', {
            message: fidelesError.message,
            code: fidelesError.code,
            details: fidelesError.details,
            hint: fidelesError.hint
          })
        } else {
          fidelesData = data || []
          console.log(`✅ ${fidelesData.length} fidèles récupérés`)
        }
      } else {
        console.log('⚠️ Aucun ID de fidèle à récupérer')
      }
      
      // Récupérer les années (dédoublonnées)
      const anneeIds = [...new Set(
        membresData
          .map((item: any) => item.annee_id)
          .filter((id: any) => id !== null && id !== undefined)
      )]
      
      let anneesData: any[] = []
      if (anneeIds.length > 0) {
        const { data, error: anneesError } = await supabase
          .from('annee')
          .select('id, label')
          .in('id', anneeIds)
        
        if (anneesError) {
          console.error('❌ Erreur récupération années:', anneesError)
        } else {
          anneesData = data || []
        }
      }
      
      // Récupérer les années de conférence (dédoublonnées)
      const acIds = [...new Set(
        membresData
          .map((item: any) => item.annee_conference_id)
          .filter((id: any) => id !== null && id !== undefined)
      )]
      
      let anneesConferenceData: any[] = []
      if (acIds.length > 0) {
        const { data, error: acError } = await supabase
          .from('annee_conference')
          .select('id, annee_id, is_current')
          .in('id', acIds)
        
        if (acError) {
          console.error('❌ Erreur récupération années conférence:', acError)
        } else {
          anneesConferenceData = data || []
        }
      }
      
      // Créer des maps pour un accès rapide
      const fidelesMap = new Map()
      fidelesData.forEach((f: any) => fidelesMap.set(f.id, f))
      
      const anneesMap = new Map()
      anneesData.forEach((a: any) => anneesMap.set(a.id, a))
      
      const acMap = new Map()
      anneesConferenceData.forEach((ac: any) => acMap.set(ac.id, ac))
      
      // Construire les membres
      membres = membresData.map((item: any) => {
        const fidele = fidelesMap.get(item.fidele_id)
        const annee = anneesMap.get(item.annee_id)
        const ac = acMap.get(item.annee_conference_id)
        
        const roleDetails = departement?.roles_config?.find(
          (r: Role) => r.id === item.role_id
        )
        
        // Construire l'objet annee_conference
        let anneeConferenceObj: AnneeConference | undefined = undefined
        if (ac) {
          anneeConferenceObj = {
            id: ac.id,
            annee_id: ac.annee_id,
            label: annee?.label || '',
            is_current: ac.is_current || false
          }
        } else if (annee) {
          anneeConferenceObj = {
            id: item.annee_conference_id || 0,
            annee_id: annee.id,
            label: annee.label,
            is_current: false
          }
        }
        
        return {
          id: item.id,
          fidele_id: item.fidele_id,
          commission_id: item.commission_id || commissionId,
          departement_id: item.departement_id,
          role_id: item.role_id,
          annee_id: item.annee_id,
          annee_conference_id: item.annee_conference_id,
          est_actif: item.est_actif,
          fidele: {
            id: fidele?.id || item.fidele_id,
            nom: fidele?.nom || 'Inconnu',
            post_nom: fidele?.post_nom || '',
            prenom: fidele?.prenom || '',
            contact: fidele?.contact || fidele?.telephone || '',
            telephone: fidele?.telephone || '',
            profile_img: fidele?.profile_img || null,
            paroisse_id: commissionData.paroisse_id
          },
          role_details: roleDetails,
          annee: annee || undefined,
          annee_conference: anneeConferenceObj
        } as MembreCommission
      })
      
      console.log('📋 Détails des membres chargés:')
      membres.forEach((m, i) => {
        console.log(`  ${i+1}. ID:${m.id} | ${m.fidele.nom} ${m.fidele.prenom} | Rôle: ${m.role_details?.label || '?'} | Année: ${m.annee?.label || '?'} | Actif: ${m.est_actif}`)
      })
    } else {
      console.log('⚠️ Aucun membre trouvé pour cette commission (commission_id:', commissionId, ')')
    }

    const fullCommission: Commission = {
      ...commissionData,
      paroisse,
      departement,
      membres
    }

    setCommission(fullCommission)
    console.log('🎯 Commission finale chargée:', {
      nom: fullCommission.nom,
      membresCount: fullCommission.membres.length,
      actifs: fullCommission.membres.filter(m => m.est_actif).length,
      inactifs: fullCommission.membres.filter(m => !m.est_actif).length
    })
    
    // 3. Charger les données auxiliaires
    await loadAuxiliaryData(commissionData)
    
  } catch (error) {
    console.error('❌ [DEBUG] Exception dans loadCommission:', error)
    toast.error('Une erreur est survenue')
  }
  
  setLoading(false)
}
  async function loadAuxiliaryData(commissionData: any) {
    try {
      // Charger les fidèles de la paroisse
      console.log('📦 Chargement des fidèles pour la paroisse:', commissionData.paroisse_id)
      const fidelesData = await getFidelesByParoisse(commissionData.paroisse_id)
      const fidelesActifs = fidelesData.filter((f: Fidele) => f.actif !== false)
      setFideles(fidelesActifs)
      console.log(`✅ ${fidelesActifs.length} fidèles chargés`)

      // Charger les rôles du département
      if (commissionData.departement_id) {
        console.log('📦 Chargement des rôles pour le département:', commissionData.departement_id)
        const rolesData = await getRolesByDepartement(commissionData.departement_id)
        setRoles(rolesData || [])
        console.log(`✅ ${rolesData?.length || 0} rôles chargés`)

        // Charger les années de conférence
        console.log('📦 Chargement des années de conférence...')
        const annees = await getAnneesConferenceDisponiblesForDepartement(
          commissionData.departement_id
        )
        setAnneesConference(annees)
        console.log(`✅ ${annees.length} années de conférence chargées`)

        // Définir l'année en cours par défaut
        const currentAnnee = await getCurrentAnneeConferenceForDepartement(
          commissionData.departement_id
        )
        if (currentAnnee) {
          setSelectedAnneeConference(currentAnnee)
          console.log(`✅ Année en cours sélectionnée: ${currentAnnee.label}`)
        } else if (annees.length > 0) {
          setSelectedAnneeConference(annees[0])
          console.log(`⚠️ Première année sélectionnée: ${annees[0].label}`)
        }

        // Récupérer l'année de base en cours
        const anneeEnCoursData = await getCurrentAnneeForDepartement(
          commissionData.departement_id
        )
        setAnneeEnCours(anneeEnCoursData)
      }
    } catch (error) {
      console.error('❌ Erreur chargement données auxiliaires:', error)
    }
  }

  // Filtrer les fidèles par recherche
  const filteredFideles = fideles.filter(fidele => {
    const fullName = `${fidele.nom || ''} ${fidele.post_nom || ''} ${fidele.prenom || ''}`.toLowerCase()
    const searchLower = fideleSearchTerm.toLowerCase()
    return fullName.includes(searchLower) ||
           (fidele.contact || '').toLowerCase().includes(searchLower) ||
           (fidele.telephone || '').toLowerCase().includes(searchLower)
  })

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedFidele) {
      toast.error('Veuillez sélectionner un fidèle')
      return
    }
    
    if (!selectedRole) {
      toast.error('Veuillez sélectionner un rôle')
      return
    }

    if (!anneeEnCours) {
      toast.error('Aucune année en cours disponible')
      return
    }

    if (!selectedAnneeConference) {
      toast.error('Veuillez sélectionner une année de conférence')
      return
    }

    setIsSubmitting(true)
    
    const formData = new FormData()
    formData.append('fidele_id', selectedFidele.id.toString())
    formData.append('departement_id', commission!.departement_id.toString())
    formData.append('role_id', selectedRole.id.toString())
    formData.append('annee_id', anneeEnCours.id.toString())
    formData.append('annee_conference_id', selectedAnneeConference.id.toString())
    formData.append('paroisse_id', commission!.paroisse_id.toString())
    formData.append('commission_id', params.id as string)

    console.log('📤 [DEBUG] Ajout membre avec données:', {
      fidele_id: selectedFidele.id,
      departement_id: commission!.departement_id,
      role_id: selectedRole.id,
      annee_id: anneeEnCours.id,
      annee_conference_id: selectedAnneeConference.id,
      commission_id: params.id
    })

    const result = await addFideleToDepartement(formData)

    if (result.success) {
      toast.success(`${selectedFidele.nom} ${selectedFidele.prenom} a été ajouté`)
      setShowModal(false)
      resetAddForm()
      await loadCommission()
    } else {
      toast.error(result.error || 'Erreur lors de l\'ajout')
    }
    setIsSubmitting(false)
  }

  function resetAddForm() {
    setSelectedFidele(null)
    setSelectedRole(null)
    setFideleSearchTerm('')
    setShowFideleSelector(false)
  }

  async function handleDesactiver(memberId: number, fideleNom: string) {
    if (!confirm(`Désactiver ${fideleNom} de cette commission ?`)) return
    
    setActionLoading(memberId)
    const result = await desactiverFideleFromDepartement(memberId)
    
    if (result.success) {
      toast.success(`${fideleNom} a été désactivé`)
      await loadCommission()
    } else {
      toast.error(result.error || 'Erreur')
    }
    setActionLoading(null)
  }

  async function handleDelete(memberId: number, fideleNom: string) {
    if (!confirm(`Supprimer définitivement ${fideleNom} de cette commission ?`)) return
    
    setActionLoading(memberId)
    const result = await deleteFideleFromDepartement(memberId)
    
    if (result.success) {
      toast.success(`${fideleNom} a été supprimé`)
      await loadCommission()
    } else {
      toast.error(result.error || 'Erreur')
    }
    setActionLoading(null)
  }

  async function handleUpdateCommission(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.append('id', params.id as string)
    formData.append('nom', editNom)
    formData.append('description', editDescription)

    const result = await updateCommission(formData)
    if (result.success) {
      toast.success('Commission modifiée')
      setIsEditing(false)
      await loadCommission()
    } else {
      toast.error(result.error || 'Erreur')
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="text-gray-400">Chargement...</div>
    </div>
  )

  if (!commission) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Commission non trouvée</p>
      <button onClick={() => router.back()} className="mt-4 text-black underline">
        Retour
      </button>
    </div>
  )

  const membresActifs = commission.membres?.filter((m) => m.est_actif) || []
  const membresInactifs = commission.membres?.filter((m) => !m.est_actif) || []

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-black mb-4">
          ← Retour
        </button>
        
        {isEditing ? (
          <form onSubmit={handleUpdateCommission} className="border border-gray-200 p-4">
            <input
              type="text"
              value={editNom}
              onChange={(e) => setEditNom(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:border-black"
              required
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 mb-3 focus:outline-none focus:border-black"
              rows={2}
              placeholder="Description..."
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-black text-white hover:bg-gray-800">
                Enregistrer
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 hover:border-black">
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-light tracking-wide">{commission.nom}</h1>
              {commission.description && (
                <p className="text-gray-500 text-sm mt-2">{commission.description}</p>
              )}
              <div className="flex gap-4 mt-3 text-sm text-gray-400">
                <span>{commission.departement?.nom}</span>
                <span>•</span>
                <span>{commission.paroisse?.nom}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setEditNom(commission.nom)
                setEditDescription(commission.description || '')
                setIsEditing(true)
              }}
              className="px-3 py-1 border border-gray-300 hover:border-black text-sm"
            >
              Modifier
            </button>
          </div>
        )}
      </div>
  <div className="flex gap-6 mb-6 border-b border-gray-200">
        <Link
          href={`/paroisse/commissions/${params.id}/activites`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
         Aperçu
        </Link>
        <span className="px-1 py-3 text-sm font-medium text-black border-b-2 border-black">
          Membres 
        </span>
        <Link
          href={`/paroisse/commissions/${params.id}/activites`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Activités
        </Link>
       
        <Link
          href={`/paroisse/commissions/${params.id}/plans-action`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Plans d&apos;action
        </Link>
        <Link
          href={`/paroisse/commissions/${params.id}/budget`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Budget
        </Link>
        <Link
          href={`/paroisse/commissions/${params.id}/projets`}
          className="px-1 py-3 text-sm text-gray-500 hover:text-black border-b-2 border-transparent hover:border-gray-300"
        >
          Projets
        </Link>
      </div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="border border-gray-200 p-4">
          <div className="text-2xl font-light">{membresActifs.length}</div>
          <div className="text-xs text-gray-500 mt-1">Actifs</div>
        </div>
        <div className="border border-gray-200 p-4">
          <div className="text-2xl font-light">{membresInactifs.length}</div>
          <div className="text-xs text-gray-500 mt-1">Inactifs</div>
        </div>
        <div className="border border-gray-200 p-4">
          <div className="text-2xl font-light">{roles.length}</div>
          <div className="text-xs text-gray-500 mt-1">Rôles</div>
        </div>
      </div>

      {/* Année conférence courante */}
      {anneesConference.length > 0 && (
        <div className="mb-6 text-sm text-gray-500 border-b border-gray-100 pb-4">
          Année conférence :{' '}
          <span className="text-black font-medium">
            {anneesConference.find(a => a.is_current)?.label || anneesConference[0]?.label}
          </span>
        </div>
      )}

      {/* Membres Actifs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-light tracking-wide">Membres actifs</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1 bg-black text-white text-sm hover:bg-gray-800"
          >
            <Plus size={16} />
            Ajouter
          </button>
        </div>

        {membresActifs.length === 0 ? (
          <div className="border border-gray-200 py-12 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Aucun membre actif</p>
          </div>
        ) : (
          <div className="border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Membre</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Rôle</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-500">Année</th>
                  <th className="text-center p-3 text-sm font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody>
                {membresActifs.map((member: MembreCommission) => {
                  const role = member.role_details
                  const fideleNom = `${member.fidele?.nom || ''} ${member.fidele?.post_nom || ''} ${member.fidele?.prenom || ''}`.trim()
                  const anneeLabel = member.annee?.label || '-'
                  
                  return (
                    <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {member.fidele?.profile_img ? (
                            <img
                              src={member.fidele.profile_img}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                              {member.fidele?.nom?.[0] || '?'}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">{fideleNom || 'Sans nom'}</div>
                            <div className="text-xs text-gray-400">{member.fidele?.contact || member.fidele?.telephone || '-'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span 
                          className="text-xs px-2 py-0.5 border"
                          style={{ 
                            borderColor: role?.couleur || '#ccc',
                            color: role?.couleur || '#666'
                          }}
                        >
                          {role?.label || 'Membre'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-gray-500">{anneeLabel}</span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleDesactiver(member.id, fideleNom)}
                            disabled={actionLoading === member.id}
                            className="text-gray-400 hover:text-orange-500"
                            title="Désactiver"
                          >
                            {actionLoading === member.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <X size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, fideleNom)}
                            disabled={actionLoading === member.id}
                            className="text-gray-400 hover:text-red-500"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Membres Inactifs (Historique) */}
      {membresInactifs.length > 0 && (
        <div className="mt-8 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-light text-gray-400 mb-3">Historique</h3>
          <div className="space-y-2">
            {membresInactifs.map((member: MembreCommission) => {
              const role = member.role_details
              const fideleNom = `${member.fidele?.nom || ''} ${member.fidele?.post_nom || ''} ${member.fidele?.prenom || ''}`.trim()
              const anneeLabel = member.annee?.label || '-'
              
              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3 flex-1">
                    {member.fidele?.profile_img ? (
                      <img
                        src={member.fidele.profile_img}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                        {member.fidele?.nom?.[0] || '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm text-gray-600">{fideleNom}</span>
                        <span className="text-xs px-2 py-0.5 border border-gray-200 text-gray-500">
                          {role?.label || 'Membre'}
                        </span>
                        <span className="text-xs text-gray-400">{anneeLabel}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(member.id, fideleNom)}
                    disabled={actionLoading === member.id}
                    className="text-gray-300 hover:text-red-500 text-sm"
                  >
                    {actionLoading === member.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      'Supprimer'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal d'ajout de membre */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-light">Ajouter un membre</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetAddForm()
                }}
                className="text-gray-400 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Sélection du fidèle */}
              <div>
                <label className="block text-sm font-medium mb-1">Fidèle *</label>
                
                {!showFideleSelector && !selectedFidele ? (
                  <button
                    type="button"
                    onClick={() => setShowFideleSelector(true)}
                    className="w-full px-4 py-3 border border-gray-300 text-left text-sm text-gray-400 hover:text-gray-600 hover:border-black transition-colors"
                  >
                    + Sélectionner un fidèle
                  </button>
                ) : showFideleSelector ? (
                  <div className="border border-gray-200">
                    <div className="p-2 border-b border-gray-100">
                      <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Rechercher par nom ou contact..."
                          value={fideleSearchTerm}
                          onChange={(e) => setFideleSearchTerm(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredFideles.length === 0 ? (
                        <p className="text-center text-gray-400 py-6 text-sm">Aucun fidèle trouvé</p>
                      ) : (
                        filteredFideles.map((fidele) => (
                          <button
                            key={fidele.id}
                            type="button"
                            onClick={() => {
                              setSelectedFidele(fidele)
                              setShowFideleSelector(false)
                              setFideleSearchTerm('')
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
                          >
                            {fidele.profile_img ? (
                              <img
                                src={fidele.profile_img}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm font-medium">
                                {fidele.nom?.[0]}{fidele.prenom?.[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {fidele.nom} {fidele.post_nom} {fidele.prenom}
                              </p>
                              <p className="text-xs text-gray-500">{fidele.contact || fidele.telephone}</p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setShowFideleSelector(false)
                          setFideleSearchTerm('')
                        }}
                        className="w-full px-4 py-2 border border-gray-300 text-gray-600 text-sm hover:border-black"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : selectedFidele && (
                  <div className="flex items-center justify-between p-3 border border-gray-200">
                    <div className="flex items-center gap-3">
                      {selectedFidele.profile_img ? (
                        <img
                          src={selectedFidele.profile_img}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                          {selectedFidele.nom?.[0]}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {selectedFidele.nom} {selectedFidele.post_nom} {selectedFidele.prenom}
                        </p>
                        <p className="text-xs text-gray-400">{selectedFidele.contact || selectedFidele.telephone}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFidele(null)
                        setShowFideleSelector(true)
                      }}
                      className="text-xs text-gray-400 hover:text-black"
                    >
                      Changer
                    </button>
                  </div>
                )}
              </div>

              {/* Sélection du rôle */}
              <div>
                <label className="block text-sm font-medium mb-1">Rôle *</label>
                <select
                  value={selectedRole?.id || ''}
                  onChange={(e) => {
                    const roleId = parseInt(e.target.value)
                    const role = roles.find(r => r.id === roleId)
                    setSelectedRole(role || null)
                  }}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                >
                  <option value="">Sélectionner un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sélection année conférence */}
              <div>
                <label className="block text-sm font-medium mb-1">Année conférence *</label>
                <select
                  value={selectedAnneeConference?.id || ''}
                  onChange={(e) => {
                    const acId = parseInt(e.target.value)
                    const ac = anneesConference.find(a => a.id === acId)
                    setSelectedAnneeConference(ac || null)
                  }}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                  required
                >
                  <option value="">Sélectionner une année</option>
                  {anneesConference.map((annee) => (
                    <option key={annee.id} value={annee.id}>
                      {annee.label} {annee.is_current ? '(en cours)' : ''}
                    </option>
                  ))}
                </select>
                {anneesConference.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Aucune année de conférence configurée pour ce département
                  </p>
                )}
              </div>
            </div>

            {/* Footer avec boutons */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetAddForm()
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleAddMember}
                  disabled={isSubmitting || !selectedFidele || !selectedRole || !selectedAnneeConference}
                  className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}