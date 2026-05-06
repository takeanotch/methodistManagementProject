
'use client'

import { useState, useEffect } from 'react'
import { creerCompteFidele } from '@/actions/fidele'
import { getRoles } from '@/actions/compte'
import toast from 'react-hot-toast'

interface Role {
  id: number
  nom: string
  niveau: string
}

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  contact: string
  adresse: string | null
  profile_img: string | null
}

interface CreerCompteModalProps {
  fidele: Fidele
  onClose: () => void
}

export default function CreerCompteModal({ fidele, onClose }: CreerCompteModalProps) {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [formData, setFormData] = useState({
    mot_de_passe: '',
    role_id: '2'
  })

  // Charger les rôles disponibles
  useEffect(() => {
    async function loadRoles() {
      try {
        const rolesData = await getRoles()
        setRoles(rolesData)
        
        // Définir le rôle par défaut (le premier rôle non-admin ou 'user' si disponible)
        const defaultRole = rolesData.find(r => r.nom.toLowerCase() === 'user' || r.nom.toLowerCase() === 'utilisateur')
        if (defaultRole) {
          setFormData(prev => ({ ...prev, role_id: defaultRole.id.toString() }))
        } else if (rolesData.length > 0) {
          setFormData(prev => ({ ...prev, role_id: rolesData[0].id.toString() }))
        }
      } catch (error) {
        console.error('Erreur lors du chargement des rôles:', error)
        toast.error('Erreur lors du chargement des rôles')
      } finally {
        setLoadingRoles(false)
      }
    }
    
    loadRoles()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.mot_de_passe.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    setLoading(true)
    
    const form = new FormData()
    form.append('fidele_id', fidele.id.toString())
    form.append('mot_de_passe', formData.mot_de_passe)
    form.append('role_id', formData.role_id)
    
    const result = await creerCompteFidele(form)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Compte créé avec succès')
      onClose()
      // Rafraîchir la page pour mettre à jour la liste
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white -lg max-w-md w-full p-6">
        {/* En-tête */}
        <div className="mb-6">
          <h3 className="text-lg font-light text-gray-900">
            Créer un compte
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Pour {fidele.nom} {fidele.post_nom} {fidele.prenom}
          </p>
        </div>

        {/* Récapitulatif des informations */}
        <div className="mb-6 p-4  bg-gray-50/50 -lg border border-gray-100">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Informations du fidèle
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Nom complet</span>
              <span className="text-gray-900 font-medium">
                {fidele.nom} {fidele.post_nom} {fidele.prenom}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Contact</span>
              <span className="text-gray-900">{fidele.contact}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Adresse</span>
              <span className="text-gray-900">{fidele.adresse || 'Non renseignée'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mot de passe */}
          <div>
            <label htmlFor="mot_de_passe" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              id="mot_de_passe"
              value={formData.mot_de_passe}
              onChange={(e) => setFormData({ ...formData, mot_de_passe: e.target.value })}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
              placeholder="Minimum 6 caractères"
            />
          </div>

          {/* Rôle - Dynamique depuis la base */}
          <div>
            <label htmlFor="role_id" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Rôle
            </label>
            {loadingRoles ? (
              <div className="w-full px-3 py-2 border border-gray-200 -lg text-sm text-gray-400">
                Chargement des rôles...
              </div>
            ) : (
              <select
                id="role_id"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-200 -lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.nom} {role.niveau && `(${role.niveau})`}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 -lg"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || loadingRoles}
              className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors -lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}