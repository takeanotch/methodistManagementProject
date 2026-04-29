// app/admin/pasteurs/[id]/EditPasteurModal.tsx
'use client'

import { useState } from 'react'
import { updatePasteur } from '@/actions/pasteurs'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Props {
  pasteur: any
}

export default function EditPasteurModal({ pasteur }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [etude, setEtude] = useState(pasteur.etude)
  const [estActif, setEstActif] = useState(pasteur.est_actif)
  const router = useRouter()

  const etudes = [
    { value: 'master', label: 'Master' },
    { value: 'licence', label: 'Licence' },
    { value: 'phd', label: 'PhD / Doctorat' },
    { value: 'autre', label: 'Autre' }
  ]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData()
    formData.append('id', pasteur.id.toString())
    formData.append('etude', etude)
    formData.append('est_actif', estActif ? 'on' : 'off')
    
    const result = await updatePasteur(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success('Pasteur modifié avec succès')
      router.refresh()
      setLoading(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4  py-2 border border-gray-200 text-gray-600 text-sm hover:border-gray-300 hover:text-gray-900 transition-colors -lg"
      >
        Modifier
      </button>

      {isOpen && (
        <div 
          className="fixed  inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div className="bg-white -lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-gray-900">
                  Modifier le pasteur
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Informations du pasteur (lecture seule) */}
                <div className="flex items-center gap-4 p-4 bg-gray-50/50 -lg mb-4">
                  {pasteur.fidele?.profile_img ? (
                    <div className="w-16 h-16 -full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                      <Image
                        src={pasteur.fidele.profile_img}
                        alt={`${pasteur.fidele.nom} ${pasteur.fidele.prenom}`}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 -full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-2 border-gray-200 flex-shrink-0">
                      <span className="text-xl font-light text-gray-400">
                        {pasteur.fidele?.nom?.charAt(0)}
                        {pasteur.fidele?.prenom?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {pasteur.fidele?.nom} {pasteur.fidele?.post_nom} {pasteur.fidele?.prenom}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{pasteur.fidele?.contact}</p>
                  </div>
                </div>

                {/* Niveau d'étude */}
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-3">
                    Niveau d'étude <span className="text-red-300">*</span>
                  </label>
                  <div className="space-y-2">
                    {etudes.map((option) => (
                      <label key={option.value} className="flex items-center gap-3 p-3 border border-gray-200 -lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                          type="radio"
                          name="etude"
                          value={option.value}
                          checked={etude === option.value}
                          onChange={(e) => setEtude(e.target.value)}
                          className="w-4 h-4 text-gray-900"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Statut actif */}
                <div>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 -lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={estActif}
                      onChange={(e) => setEstActif(e.target.checked)}
                      className="w-4 h-4 text-gray-900 "
                    />
                    <span className="text-sm text-gray-700">Pasteur actif</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors -lg disabled:opacity-50"
                  >
                    {loading ? 'Modification...' : 'Modifier'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 text-sm hover:text-gray-600 hover:border-gray-300 transition-colors -lg"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}