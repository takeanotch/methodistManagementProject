// // components/MouvementModal.tsx
// 'use client'

// import { useState } from 'react'
// import { createMouvementFinance } from '@/actions/finance'

// interface MouvementModalProps {
//     isOpen: boolean
//     onClose: () => void
//     budgetId: number
//     budgetType: 'recette' | 'depense'
//     budgetLibelle: string
//     onSuccess?: () => void
// }

// export function MouvementModal({ isOpen, onClose, budgetId, budgetType, budgetLibelle, onSuccess }: MouvementModalProps) {
//     const [loading, setLoading] = useState(false)
//     const [formData, setFormData] = useState({
//         montant: '',
//         currency: 'USD' as 'USD' | 'CDF' | 'EUR',
//         date_mouvement: new Date().toISOString().split('T')[0],
//         description: ''
//     })

//     if (!isOpen) return null

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault()
//         setLoading(true)

//         const form = new FormData()
//         form.append('budget_id', budgetId.toString())
//         form.append('type', budgetType)
//         form.append('montant', formData.montant)
//         form.append('currency', formData.currency)
//         form.append('date_mouvement', formData.date_mouvement)
//         form.append('description', formData.description)

//         const result = await createMouvementFinance(form)
        
//         if (result.success) {
//             setFormData({
//                 montant: '',
//                 currency: 'USD',
//                 date_mouvement: new Date().toISOString().split('T')[0],
//                 description: ''
//             })
//             onSuccess?.()
//             onClose()
//         } else {
//             alert(result.error)
//         }
        
//         setLoading(false)
//     }

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
//             <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
//                 <div className="flex justify-between items-center p-4 border-b">
//                     <h2 className="text-lg font-semibold">
//                         {budgetType === 'recette' ? '💰 Ajouter une recette' : '💸 Ajouter une dépense'} - {budgetLibelle}
//                     </h2>
//                     <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
//                         ✕
//                     </button>
//                 </div>
                
//                 <form onSubmit={handleSubmit} className="p-4 space-y-4">
//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Montant *
//                         </label>
//                         <input
//                             type="number"
//                             step="0.01"
//                             value={formData.montant}
//                             onChange={e => setFormData({ ...formData, montant: e.target.value })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             placeholder="0.00"
//                             required
//                             disabled={loading}
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Devise *
//                         </label>
//                         <select
//                             value={formData.currency}
//                             onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             disabled={loading}
//                         >
//                             <option value="USD">USD ($) - Dollar US</option>
//                             <option value="CDF">CDF (FC) - Franc Congolais</option>
//                             <option value="EUR">EUR (€) - Euro</option>
//                         </select>
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Date du mouvement *
//                         </label>
//                         <input
//                             type="date"
//                             value={formData.date_mouvement}
//                             onChange={e => setFormData({ ...formData, date_mouvement: e.target.value })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             required
//                             disabled={loading}
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-1">
//                             Description
//                         </label>
//                         <textarea
//                             value={formData.description}
//                             onChange={e => setFormData({ ...formData, description: e.target.value })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
//                             rows={3}
//                             placeholder="Optionnel : détail du mouvement..."
//                             disabled={loading}
//                         />
//                     </div>

//                     <div className="flex gap-3 pt-2">
//                         <button
//                             type="submit"
//                             disabled={loading}
//                             className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
//                         >
//                             {loading ? 'Enregistrement...' : 'Enregistrer le mouvement'}
//                         </button>
//                         <button
//                             type="button"
//                             onClick={onClose}
//                             disabled={loading}
//                             className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
//                         >
//                             Annuler
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     )
// }

// components/MouvementModal.tsx
'use client'

import { useState } from 'react'
import { createMouvementFinance } from '@/actions/finance'

interface MouvementModalProps {
    isOpen: boolean
    onClose: () => void
    budgetId: number
    budgetType: 'recette' | 'depense'
    budgetLibelle: string
    onSuccess?: () => void
}

export function MouvementModal({ isOpen, onClose, budgetId, budgetType, budgetLibelle, onSuccess }: MouvementModalProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        montant: '',
        currency: 'USD' as 'USD' | 'CDF' | 'EUR',
        date_mouvement: new Date().toISOString().split('T')[0],
        description: ''
    })

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const form = new FormData()
        form.append('budget_id', budgetId.toString())
        form.append('type', budgetType)
        form.append('montant', formData.montant)
        form.append('currency', formData.currency)
        form.append('date_mouvement', formData.date_mouvement)
        form.append('description', formData.description)

        const result = await createMouvementFinance(form)
        
        if (result.success) {
            setFormData({
                montant: '',
                currency: 'USD',
                date_mouvement: new Date().toISOString().split('T')[0],
                description: ''
            })
            onSuccess?.()
            onClose()
        } else {
            alert(result.error)
        }
        
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">
                        {budgetType === 'recette' ? '💰 Ajouter une recette' : '💸 Ajouter une dépense'} - {budgetLibelle}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        ✕
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.montant}
                            onChange={e => setFormData({ ...formData, montant: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="0.00"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Devise *
                        </label>
                        <select
                            value={formData.currency}
                            onChange={e => setFormData({ ...formData, currency: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={loading}
                        >
                            <option value="USD">USD ($) - Dollar US</option>
                            <option value="CDF">CDF (FC) - Franc Congolais</option>
                            <option value="EUR">EUR (€) - Euro</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date du mouvement *
                        </label>
                        <input
                            type="date"
                            value={formData.date_mouvement}
                            onChange={e => setFormData({ ...formData, date_mouvement: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            rows={3}
                            placeholder="Optionnel : détail du mouvement..."
                            disabled={loading}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer le mouvement'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}