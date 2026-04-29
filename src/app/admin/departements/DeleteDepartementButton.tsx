'use client'

import { deleteDepartement } from '@/actions/departements'
import toast from 'react-hot-toast'

export default function DeleteDepartementButton({ id }: { id: number }) {
  const handleDelete = async () => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce département ?')) {
      const result = await deleteDepartement(id)
      if (result.success) {
        toast.success('Département supprimé avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de la suppression')
      }
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-gray-600 hover:text-red-400 transition-colors"
      title="Supprimer"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  )
}