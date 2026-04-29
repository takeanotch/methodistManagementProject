// 'use client'

// import { useState } from 'react'
// import { updateCompteRole } from '@/actions/compte'
// import toast from 'react-hot-toast'

// interface Role {
//   id: number
//   nom: string
//   niveau: string
// }

// interface EditRoleModalProps {
//   compteId: number
//   currentRoleId: number
//   roles: Role[]
//   onClose: () => void
//   onSuccess: () => void
// }

// export default function EditRoleModal({ 
//   compteId, 
//   currentRoleId, 
//   roles, 
//   onClose, 
//   onSuccess 
// }: EditRoleModalProps) {
//   const [loading, setLoading] = useState(false)
//   const [selectedRole, setSelectedRole] = useState(currentRoleId.toString())

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
    
//     setLoading(true)
    
//     const form = new FormData()
//     form.append('compte_id', compteId.toString())
//     form.append('role_id', selectedRole)
    
//     const result = await updateCompteRole(form)
    
//     if (result.error) {
//       toast.error(result.error)
//     } else {
//       toast.success('Rôle modifié avec succès')
//       onSuccess()
//       onClose()
//     }
//     setLoading(false)
//   }

//   return (
//     <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg max-w-md w-full p-6">
//         <h3 className="text-lg font-light text-gray-900 mb-6">
//           Modifier le rôle
//         </h3>

//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label htmlFor="role" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
//               Nouveau rôle
//             </label>
//             <select
//               id="role"
//               value={selectedRole}
//               onChange={(e) => setSelectedRole(e.target.value)}
//               required
//               className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
//             >
//               {roles.map((role) => (
//                 <option key={role.id} value={role.id}>
//                   {role.nom} ({role.niveau})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div className="flex gap-3 pt-4">
//             <button
//               type="button"
//               onClick={onClose}
//               className="flex-1 px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors border border-gray-200 rounded-lg"
//               disabled={loading}
//             >
//               Annuler
//             </button>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {loading ? 'Modification...' : 'Modifier le rôle'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   )
// }

'use client'

import { useState } from 'react'
import { updateCompteRole } from '@/actions/compte'
import toast from 'react-hot-toast'
import { X, Loader2, Shield } from 'lucide-react'

interface Role {
  id: number
  nom: string
  niveau: string
}

interface EditRoleModalProps {
  compteId: number
  currentRoleId: number
  roles: Role[]
  onClose: () => void
  onSuccess: () => void
}

export default function EditRoleModal({ 
  compteId, 
  currentRoleId, 
  roles, 
  onClose, 
  onSuccess 
}: EditRoleModalProps) {
  const [loading, setLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState(currentRoleId.toString())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    setLoading(true)
    
    const form = new FormData()
    form.append('compte_id', compteId.toString())
    form.append('role_id', selectedRole)
    
    const result = await updateCompteRole(form)
    
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Rôle modifié avec succès')
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-gray-400" />
            <h3 className="text-lg font-light">Modifier le rôle</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Nouveau rôle
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-black bg-white"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nom} ({role.niveau})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 hover:border-black text-sm"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Modification...
                </>
              ) : (
                'Modifier le rôle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}