// components/admin/chefs/AjouterRoleModal.tsx
'use client'

import { useState } from 'react'
import { ajouterRole } from '@/actions/roles'

interface AjouterRoleModalProps {
  type: 'district' | 'conference'
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AjouterRoleModal({ type, isOpen, onClose, onSuccess }: AjouterRoleModalProps) {
  const [nomRole, setNomRole] = useState('')
  const [labelRole, setLabelRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('type_role', type)
    formData.append('nom_role', nomRole.toLowerCase().replace(/\s+/g, '_'))
    formData.append('label_role', labelRole)

    const result = await ajouterRole(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setNomRole('')
      setLabelRole('')
      onSuccess()
      onClose()
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-light text-gray-900 mb-4">
          Ajouter un nouveau rôle ({type === 'district' ? 'District' : 'Conférence'})
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Nom technique <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nomRole}
              onChange={(e) => setNomRole(e.target.value)}
              placeholder="ex: responsable_jeunesse"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Utilisé en interne, sans espaces
            </p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
              Nom affiché <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={labelRole}
              onChange={(e) => setLabelRole(e.target.value)}
              placeholder="ex: Responsable Jeunesse"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter le rôle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}