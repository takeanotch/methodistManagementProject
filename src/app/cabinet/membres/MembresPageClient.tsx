// app/cabinet/membres/MembresPageClient.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, Plus, Calendar, Users, UserCheck, UserX, MoreVertical, Loader2 } from 'lucide-react'
import { updateMembreRole, toggleMembreActif, getRolesCabinet } from '@/actions/cabinet-pastoral'
import AjouterMembreModal from './AjouterMembreModal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Membre {
  id: number
  fidele_id: number
  role_id: number | null
  role_label: string | null
  est_actif: boolean
  fidele_nom: string
  fidele_prenom: string
  fidele_contact: string | null
  fidele_profile_img?: string | null
  fidele_pasteur?: boolean
}

interface Props {
  paroisseId: number
  paroisseNom: string
  anneesDisponibles: any[]
  anneeConferenceId: number | null
  anneeEnCours: any
  membres: Membre[]
  fidelesParoisse: any[]
}

export default function MembresPageClient({ 
  paroisseId, paroisseNom, anneesDisponibles, anneeConferenceId, 
  anneeEnCours, membres: initialMembres, fidelesParoisse 
}: Props) {
  const router = useRouter()
  const [membres, setMembres] = useState(initialMembres)
  const [roles, setRoles] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const isCurrentYear = anneeConferenceId === anneeEnCours?.id
  const anneeSelectionnee = anneesDisponibles.find((a: any) => a.id === anneeConferenceId)

  useEffect(() => { setMembres(initialMembres) }, [initialMembres])
  useEffect(() => { getRolesCabinet().then(setRoles) }, [])

  const stats = {
    total: membres.length,
    actifs: membres.filter(m => m.est_actif).length,
    inactifs: membres.filter(m => !m.est_actif).length
  }

  const handleChangeRole = async (membreId: number, roleId: number | null) => {
    setActionLoading(membreId)
    try {
      const result = await updateMembreRole(membreId, roleId)
      if (result.success) {
        setMembres(prev => prev.map(m => 
          m.id === membreId ? { ...m, role_id: roleId, role_label: roles.find(r => r.id === roleId)?.label_role || null } : m
        ))
        setEditingRole(null)
        toast.success('Rôle mis à jour')
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleActif = async (membre: Membre) => {
    const nouveauStatut = !membre.est_actif
    if (!confirm(`${nouveauStatut ? 'Réactiver' : 'Désactiver'} ${membre.fidele_prenom} ${membre.fidele_nom} ?`)) return

    setActionLoading(membre.id)
    try {
      const result = await toggleMembreActif(membre.id, nouveauStatut)
      if (result.success) {
        setMembres(prev => prev.map(m => m.id === membre.id ? { ...m, est_actif: nouveauStatut } : m))
        setMenuOpen(null)
        router.refresh()
      } else {
        toast.error(result.error || 'Erreur')
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header compact */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link href="/cabinet" className="text-gray-400 hover:text-black"><ChevronLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-light">Membres du Cabinet</h1>
            <p className="text-sm text-gray-500">{paroisseNom}</p>
          </div>
        </div>
        <div className="flex gap-2 text-xs text-gray-400 ml-9">
          <Link href="/cabinet" className="hover:text-black">Vue d'ensemble</Link>
          <span>•</span>
          <Link href="/cabinet/activites" className="hover:text-black">Activités</Link>
          <span>•</span>
          <span className="font-medium text-black">Membres</span>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, style: 'bg-white border-gray-200', textStyle: 'text-gray-900' },
          { label: 'Actifs', value: stats.actifs, style: 'bg-green-50 border-green-200', textStyle: 'text-green-700' },
          { label: 'Inactifs', value: stats.inactifs, style: 'bg-gray-50 border-gray-200', textStyle: 'text-gray-500' }
        ].map((stat, i) => (
          <div key={i} className={`border p-3 ${stat.style}`}>
            <div className={`text-xl font-light ${stat.textStyle}`}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Barre d'outils + Sélecteur d'année */}
      <div className="space-y-3 mb-6">
        {anneesDisponibles?.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {anneesDisponibles.map((annee: any) => (
              <Link
                key={annee.id}
                href={`/cabinet/membres?annee_conference=${annee.id}`}
                className={`px-4 py-2 text-sm border transition-colors ${
                  anneeConferenceId === annee.id
                    ? 'bg-black text-white border-black'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-black'
                }`}
              >
                {annee.label} {annee.is_current && '(en cours)'}
              </Link>
            ))}
          </div>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={!isCurrentYear}
          className="flex items-center gap-2 px-4 h-10 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          <Plus size={16} /> Ajouter un membre
        </button>
      </div>

      {/* Alerte historique */}
      {anneeSelectionnee && !isCurrentYear && (
        <div className="mb-4 p-3 border border-amber-200 bg-amber-50 text-amber-700 text-sm">
          <Calendar size={14} className="inline mr-2" />
          Historique {anneeSelectionnee.label}
        </div>
      )}

      {/* Liste des membres */}
      {membres.length === 0 ? (
        <div className="border border-gray-200 py-12 text-center bg-white">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400 mb-4">Aucun membre</p>
          {isCurrentYear && (
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-black text-white text-sm hover:bg-gray-800">
              <Plus size={16} className="inline mr-2" /> Ajouter un membre
            </button>
          )}
        </div>
      ) : (
        <MembreList 
          membres={membres} 
          roles={roles} 
          isCurrentYear={isCurrentYear}
          editingRole={editingRole}
          setEditingRole={setEditingRole}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          actionLoading={actionLoading}
          onChangeRole={handleChangeRole}
          onToggleActif={handleToggleActif}
        />
      )}

      <AjouterMembreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        paroisseId={paroisseId}
        paroisseNom={paroisseNom}
        fidelesParoisse={fidelesParoisse}
        anneeConferenceId={anneeConferenceId}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}

// Sous-composant pour la liste des membres
function MembreList({ membres, roles, isCurrentYear, editingRole, setEditingRole, menuOpen, setMenuOpen, actionLoading, onChangeRole, onToggleActif }: any) {
  const actifs = membres.filter((m: Membre) => m.est_actif)
  const inactifs = membres.filter((m: Membre) => !m.est_actif)

  return (
    <div className="space-y-6 bg-white">
      {[actifs, inactifs].map((groupe, idx) => {
        if (groupe.length === 0) return null
        const isActif = idx === 0
        
        return (
          <div key={idx} className={idx === 1 ? 'pt-4 border-t border-gray-100' : ''}>
            <div className="flex items-center gap-2 px-1 mb-3">
              <h3 className={`text-xs font-medium uppercase tracking-wider ${isActif ? 'text-gray-500' : 'text-gray-400'}`}>
                {isActif ? 'Membres actifs' : 'Historique'}
              </h3>
              <span className={`px-2 py-0.5 text-xs ${isActif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {groupe.length}
              </span>
            </div>
            
            <div className="space-y-2">
              {groupe.map((membre: Membre) => (
                <MembreCard 
                  key={membre.id}
                  membre={membre}
                  roles={roles}
                  isCurrentYear={isCurrentYear}
                  isActif={isActif}
                  editingRole={editingRole}
                  setEditingRole={setEditingRole}
                  menuOpen={menuOpen}
                  setMenuOpen={setMenuOpen}
                  actionLoading={actionLoading}
                  onChangeRole={onChangeRole}
                  onToggleActif={onToggleActif}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Carte de membre individuelle
function MembreCard({ membre, roles, isCurrentYear, isActif, editingRole, setEditingRole, menuOpen, setMenuOpen, actionLoading, onChangeRole, onToggleActif }: any) {
  return (
    <div className={`flex items-center justify-between p-4 border-b transition-colors ${
      isActif ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-gray-50 border-gray-100 opacity-75'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        {/* Avatar */}
        {membre.fidele_profile_img ? (
          <img src={membre.fidele_profile_img} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${
            isActif ? 'bg-gray-100 text-gray-500' : 'bg-gray-200 text-gray-400'
          }`}>
            {membre.fidele_prenom?.[0]}{membre.fidele_nom?.[0]}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">
              {membre.fidele_prenom} {membre.fidele_nom}
            </span>
            {membre.fidele_pasteur && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 border border-purple-200">Pasteur</span>
            )}
            
            {/* Sélecteur de rôle */}
            {editingRole === membre.id && isCurrentYear ? (
              <select
                value={membre.role_id || ''}
                onChange={(e) => onChangeRole(membre.id, e.target.value ? parseInt(e.target.value) : null)}
                disabled={actionLoading === membre.id}
                className="text-xs px-2 py-1 border border-gray-300 bg-white"
                autoFocus
                onBlur={() => setEditingRole(null)}
              >
                <option value="">Sans rôle</option>
                {roles.map((role: any) => (
                  <option key={role.id} value={role.id}>{role.label_role}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => isCurrentYear && setEditingRole(membre.id)}
                disabled={!isCurrentYear}
                className={`text-xs px-2 py-0.5 border ${
                  membre.role_label ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                } ${isCurrentYear ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'}`}
              >
                {membre.role_label || 'Sans rôle'}
              </button>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-1.5">{membre.fidele_contact || 'Aucun contact'}</div>
        </div>
      </div>

      {/* Menu actions */}
      {isCurrentYear && (
        <div className="relative">
          <button onClick={() => setMenuOpen(menuOpen === membre.id ? null : membre.id)} className="p-2 text-gray-400 hover:text-black">
            <MoreVertical size={16} />
          </button>
          {menuOpen === membre.id && (
            <>
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[160px]">
                <button
                  onClick={() => onToggleActif(membre)}
                  disabled={actionLoading === membre.id}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {actionLoading === membre.id ? <Loader2 size={14} className="animate-spin" /> : isActif ? <UserX size={14} /> : <UserCheck size={14} />}
                  {isActif ? 'Désactiver' : 'Réactiver'}
                </button>
              </div>
              <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
            </>
          )}
        </div>
      )}
    </div>
  )
}