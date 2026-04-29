// components/ConfigurationModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Eye, EyeOff, Save } from 'lucide-react'
import { getConfiguration, saveConfiguration } from '@/actions/configurations'

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  uniteId: number
  uniteNom: string
  uniteNiveau: string
  onSuccess?: () => void
}

export function ConfigurationModal({
  isOpen,
  onClose,
  uniteId,
  uniteNom,
  uniteNiveau,
  onSuccess
}: ConfigurationModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [taux, setTaux] = useState('2800.00')
  const [visibilite, setVisibilite] = useState({
    conference: 'visible' as 'visible' | 'masque',
    district: 'visible' as 'visible' | 'masque',
    paroisse: 'visible' as 'visible' | 'masque'
  })

  useEffect(() => {
    if (isOpen && uniteId) {
      loadConfiguration()
    }
  }, [isOpen, uniteId])

  async function loadConfiguration() {
    setLoading(true)
    const config = await getConfiguration(uniteId)
    
    if (config) {
      setTaux(config.taux.toString())
      setVisibilite(config.visibilite_budget)
    } else {
      setTaux('2800.00')
      setVisibilite({
        conference: 'visible',
        district: 'visible',
        paroisse: 'visible'
      })
    }
    
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    
    const result = await saveConfiguration(uniteId, {
      taux: parseFloat(taux),
      visibilite_budget: visibilite
    })
    
    if (result.success) {
      onSuccess?.()
      onClose()
    } else {
      alert(result.error || 'Erreur lors de la sauvegarde')
    }
    
    setSaving(false)
  }

  const toggleVisibilite = (niveau: 'conference' | 'district' | 'paroisse') => {
    setVisibilite(prev => ({
      ...prev,
      [niveau]: prev[niveau] === 'visible' ? 'masque' : 'visible'
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-light">Configuration</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {uniteNom} • {uniteNiveau}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin mx-auto text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4">
            {/* Taux */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taux de conversion
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={taux}
                  onChange={(e) => setTaux(e.target.value)}
                  step="0.01"
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:border-black"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  FC
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Taux utilisé pour les calculs budgétaires
              </p>
            </div>

            {/* Visibilité */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Visibilité du budget
              </label>
              
              <div className="space-y-2">
                {/* Conférence */}
                <div className="flex items-center justify-between p-3 border border-gray-200">
                  <div>
                    <div className="font-medium text-sm">Conférence</div>
                    <div className="text-xs text-gray-500">
                      {visibilite.conference === 'visible' 
                        ? 'Visible par la conférence' 
                        : 'Masqué pour la conférence'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVisibilite('conference')}
                    className={`p-2 border ${
                      visibilite.conference === 'visible'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {visibilite.conference === 'visible' ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>

                {/* District */}
                <div className="flex items-center justify-between p-3 border border-gray-200">
                  <div>
                    <div className="font-medium text-sm">District</div>
                    <div className="text-xs text-gray-500">
                      {visibilite.district === 'visible' 
                        ? 'Visible par le district' 
                        : 'Masqué pour le district'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVisibilite('district')}
                    className={`p-2 border ${
                      visibilite.district === 'visible'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {visibilite.district === 'visible' ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>

                {/* Paroisse */}
                <div className="flex items-center justify-between p-3 border border-gray-200">
                  <div>
                    <div className="font-medium text-sm">Paroisse</div>
                    <div className="text-xs text-gray-500">
                      {visibilite.paroisse === 'visible' 
                        ? 'Visible par la paroisse' 
                        : 'Masqué pour la paroisse'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleVisibilite('paroisse')}
                    className={`p-2 border ${
                      visibilite.paroisse === 'visible'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {visibilite.paroisse === 'visible' ? (
                      <Eye size={18} />
                    ) : (
                      <EyeOff size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}