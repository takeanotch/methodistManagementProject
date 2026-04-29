// app/admin/pasteurs/[id]/AffecterPasteurForm.tsx
'use client'

import { affecterPasteur } from '@/actions/pasteurs'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  pasteurId: number
  paroisses: any[]
}

export default function AffecterPasteurForm({ pasteurId, paroisses }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    paroisse_id: '',
    date_entree: new Date().toISOString().split('T')[0],
    mandat_annees: 3
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData()
    form.append('pasteur_id', pasteurId.toString())
    form.append('paroisse_id', formData.paroisse_id)
    form.append('date_entree', formData.date_entree)
    form.append('mandat_annees', formData.mandat_annees.toString())

    const result = await affecterPasteur(form)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success('Pasteur affecté avec succès')
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="paroisse_id" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Paroisse <span className="text-red-300">*</span>
          </label>
          <select
            id="paroisse_id"
            value={formData.paroisse_id}
            onChange={(e) => setFormData({...formData, paroisse_id: e.target.value})}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
          >
            <option value="">Sélectionner</option>
            {paroisses.map((paroisse) => (
              <option key={paroisse.id} value={paroisse.id}>
                {paroisse.nom} ({paroisse.district?.nom})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date_entree" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Date d'entrée
          </label>
          <input
            type="date"
            id="date_entree"
            value={formData.date_entree}
            onChange={(e) => setFormData({...formData, date_entree: e.target.value})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="mandat_annees" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
            Durée du mandat (ans)
          </label>
          <input
            type="number"
            id="mandat_annees"
            min="1"
            max="10"
            value={formData.mandat_annees}
            onChange={(e) => setFormData({...formData, mandat_annees: parseInt(e.target.value) || 1})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading || !formData.paroisse_id}
          className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50"
        >
          {loading ? 'Affectation...' : 'Affecter le pasteur'}
        </button>
      </div>
    </form>
  )
}