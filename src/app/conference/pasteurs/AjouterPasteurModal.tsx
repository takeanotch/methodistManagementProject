

'use client'

import { useState, useEffect } from 'react'
import { createPasteurWithAffectation, getFidelesEligiblesPasteur } from '@/actions/pasteurs'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  paroisses: any[]
}

export default function AjouterPasteurModal({ paroisses }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fideles, setFideles] = useState<any[]>([])
  const [loadingFideles, setLoadingFideles] = useState(false)
  
  const [fideleId, setFideleId] = useState('')
  const [etude, setEtude] = useState('master')
  const [paroisseId, setParoisseId] = useState('')
  const [dateEntree, setDateEntree] = useState('')
  const [mandatAnnees, setMandatAnnees] = useState(1)
  
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      setDateEntree(today)
      setMandatAnnees(1)
      setParoisseId('')
      setEtude('master')
      
      const loadFideles = async () => {
        setLoadingFideles(true)
        const result = await getFidelesEligiblesPasteur()
        setFideles(result)
        setLoadingFideles(false)
      }
      loadFideles()
    }
  }, [isOpen])

  const getDateSortie = () => {
    if (dateEntree && mandatAnnees) {
      const date = new Date(dateEntree)
      date.setFullYear(date.getFullYear() + mandatAnnees)
      date.setDate(date.getDate() - 1)
      return date.toISOString().split('T')[0]
    }
    return ''
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    
    if (!fideleId) {
      toast.error('Veuillez sélectionner un fidèle')
      setLoading(false)
      return
    }
    
    if (!paroisseId) {
      toast.error('Veuillez sélectionner une paroisse')
      setLoading(false)
      return
    }
    
    const result = await createPasteurWithAffectation(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success('Pasteur créé et affecté avec succès')
      router.refresh()
      setLoading(false)
      setIsOpen(false)
      
      setFideleId('')
      setParoisseId('')
      setEtude('master')
    }
  }

  const isValid = () => {
    return fideleId && paroisseId && dateEntree
  }

  const dateSortie = getDateSortie()

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors border border-gray-900 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Nouveau pasteur
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-300 shadow-xl">
            <div className="p-6">
              {/* En-tête */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <div>
                  <h3 className="text-lg font-light text-gray-900">Ajouter un pasteur</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Créer un pasteur et l'affecter directement à une paroisse
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Sélection du fidèle */}
                <div className="mb-6">
                  <label htmlFor="fidele_id" className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Fidèle à promouvoir pasteur <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="fidele_id"
                    name="fidele_id"
                    value={fideleId}
                    onChange={(e) => setFideleId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                    disabled={loadingFideles}
                  >
                    <option value="">Sélectionner un fidèle</option>
                    {fideles.map((fidele) => (
                      <option key={fidele.id} value={fidele.id}>
                        {fidele.nom} {fidele.post_nom} {fidele.prenom} - {fidele.contact}
                      </option>
                    ))}
                  </select>
                  {loadingFideles && (
                    <p className="text-xs text-gray-400 mt-1">Chargement des fidèles...</p>
                  )}
                  {fideles.length === 0 && !loadingFideles && (
                    <p className="text-xs text-amber-600 mt-1">
                      Aucun fidèle éligible. Tous les fidèles sont déjà pasteurs.
                    </p>
                  )}
                </div>

                {/* Niveau d'étude */}
                <div className="mb-6">
                  <label htmlFor="etude" className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Niveau d'étude <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="etude"
                    name="etude"
                    value={etude}
                    onChange={(e) => setEtude(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                  >
                    <option value="licence">Licence</option>
                    <option value="master">Master</option>
                    <option value="phd">PhD / Doctorat</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                {/* Section affectation */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm border border-emerald-200">
                      1
                    </span>
                    Affectation initiale
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="paroisse_id" className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                        Paroisse <span className="text-red-400">*</span>
                      </label>
                      <select
                        id="paroisse_id"
                        name="paroisse_id"
                        value={paroisseId}
                        onChange={(e) => setParoisseId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                      >
                        <option value="">Sélectionner une paroisse</option>
                        {paroisses.map((paroisse) => (
                          <option key={paroisse.id} value={paroisse.id}>
                            {paroisse.nom} ({paroisse.district?.nom})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date_entree" className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Date d'entrée <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          id="date_entree"
                          name="date_entree"
                          value={dateEntree}
                          onChange={(e) => setDateEntree(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="mandat_annees" className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                          Durée du mandat (ans) <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="number"
                          id="mandat_annees"
                          name="mandat_annees"
                          value={mandatAnnees}
                          onChange={(e) => setMandatAnnees(parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                          required
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Aperçu */}
                    {dateSortie && (
                      <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
                        <p className="text-xs text-blue-600 mb-1">Aperçu de l'affectation</p>
                        <p className="text-sm text-blue-800">
                          Du {new Date(dateEntree).toLocaleDateString('fr-FR')} au {new Date(dateSortie).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-blue-400 mt-1">
                          Durée : {mandatAnnees} an{mandatAnnees > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors border border-gray-300 hover:border-gray-400"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isValid() || fideles.length === 0}
                    className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 border border-gray-900"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Création...
                      </>
                    ) : (
                      'Créer et affecter'
                    )}
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