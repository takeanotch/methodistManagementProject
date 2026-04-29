// app/admin/pasteurs/[id]/ReaffecterModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { reaffecterPasteur } from '@/actions/pasteurs'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  pasteur: any
  paroisses: any[]
  buttonVariant?: 'default' | 'small' | 'icon'
}

export default function ReaffecterModal({ pasteur, paroisses, buttonVariant = 'default' }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dateFinActuelle, setDateFinActuelle] = useState('')
  const [dateEntreeNouvelle, setDateEntreeNouvelle] = useState('')
  const [dureeMandat, setDureeMandat] = useState(3)
  const [paroisseId, setParoisseId] = useState('')
  const [motif, setMotif] = useState('')
  const router = useRouter()

  const affectationActive = pasteur.affectation_actuelle

  // Initialiser les dates par défaut quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0]
      
      if (affectationActive) {
        setDateFinActuelle(today)
        setDateEntreeNouvelle(today)
        setDureeMandat(affectationActive.mandat_annees || 3)
      } else {
        setDateEntreeNouvelle(today)
        setDureeMandat(3)
      }
      
      setParoisseId('')
      setMotif('')
    }
  }, [isOpen, affectationActive])

  // Calculer la date de sortie de la nouvelle affectation
  const getDateSortieNouvelle = () => {
    if (dateEntreeNouvelle && dureeMandat) {
      const date = new Date(dateEntreeNouvelle)
      date.setFullYear(date.getFullYear() + dureeMandat)
      date.setDate(date.getDate() - 1)
      return date.toISOString().split('T')[0]
    }
    return ''
  }

  const getButtonContent = () => {
    switch (buttonVariant) {
      case 'small':
        return (
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs text-emerald-600 hover:text-emerald-700 transition-colors px-2 py-1 rounded hover:bg-emerald-50"
          >
            {affectationActive ? 'Réaffecter' : 'Affecter'}
          </button>
        )
      case 'icon':
        return (
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={affectationActive ? 'Réaffecter' : 'Affecter'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        )
      default:
        return (
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 text-sm hover:bg-emerald-100 transition-colors rounded-lg"
          >
            {affectationActive ? 'Réaffecter ce pasteur' : 'Affecter ce pasteur'}
          </button>
        )
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    
    const formData = new FormData(event.currentTarget)
    
    formData.append('pasteur_id', pasteur.id.toString())
    
    if (!paroisseId) {
      toast.error('Veuillez sélectionner une paroisse')
      setLoading(false)
      return
    }
    
    if (affectationActive && !dateFinActuelle) {
      toast.error('Veuillez indiquer la date de fin de l\'affectation actuelle')
      setLoading(false)
      return
    }
    
    const result = await reaffecterPasteur(formData)
    
    if (result.error) {
      toast.error(result.error)
      setLoading(false)
    } else {
      toast.success(
        affectationActive 
          ? 'Pasteur réaffecté avec succès' 
          : 'Pasteur affecté avec succès'
      )
      router.refresh()
      setLoading(false)
      setIsOpen(false)
    }
  }

  // Vérifier que les dates sont cohérentes
  const isValid = () => {
    if (!paroisseId) return false
    
    if (affectationActive) {
      if (!dateFinActuelle || !dateEntreeNouvelle) return false
      const finActuelle = new Date(dateFinActuelle)
      const debutNouvelle = new Date(dateEntreeNouvelle)
      return finActuelle <= debutNouvelle
    } else {
      return !!dateEntreeNouvelle
    }
  }

  const dateSortieNouvelle = getDateSortieNouvelle()

  return (
    <>
      {getButtonContent()}

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* En-tête */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-light text-gray-900">
                    {affectationActive ? 'Réaffecter le pasteur' : 'Affecter le pasteur'}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {pasteur.fidele?.nom} {pasteur.fidele?.prenom}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Section pour la réaffectation uniquement */}
                {affectationActive && (
                  <div className="mb-8">
                    <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm">1</span>
                      Clôturer l'affectation en cours
                    </h4>
                    
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 mb-4">
                      <p className="text-sm text-amber-800 mb-2">
                        <span className="font-medium">Affectation actuelle :</span>
                      </p>
                      <p className="text-sm text-amber-700">
                        {affectationActive.paroisse?.nom} · {affectationActive.paroisse?.district?.nom}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-amber-600">
                        <span>Début : {new Date(affectationActive.date_entree).toLocaleDateString('fr-FR')}</span>
                        <span>Fin prévue : {new Date(affectationActive.date_sortie).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="date_fin_actuelle" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Nouvelle date de fin <span className="text-red-300">*</span>
                      </label>
                      <input
                        type="date"
                        id="date_fin_actuelle"
                        name="date_fin_actuelle"
                        value={dateFinActuelle}
                        onChange={(e) => setDateFinActuelle(e.target.value)}
                        min={affectationActive.date_entree}
                        max={dateEntreeNouvelle}
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Cette date remplacera la date de fin prévue
                      </p>
                    </div>
                  </div>
                )}

                {/* Section pour la nouvelle affectation */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                    <span className={`w-6 h-6 ${affectationActive ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'} rounded-full flex items-center justify-center text-sm`}>
                      {affectationActive ? '2' : '1'}
                    </span>
                    Nouvelle affectation (sera active)
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="paroisse_id" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Nouvelle paroisse <span className="text-red-300">*</span>
                      </label>
                      <select
                        id="paroisse_id"
                        name="paroisse_id"
                        value={paroisseId}
                        onChange={(e) => setParoisseId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                      >
                        <option value="">Sélectionner une paroisse</option>
                        {paroisses
                          .filter(p => !affectationActive || p.id !== affectationActive.paroisse_id)
                          .map((paroisse) => (
                            <option key={paroisse.id} value={paroisse.id}>
                              {paroisse.nom} ({paroisse.district?.nom})
                            </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="date_entree" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Date d'entrée <span className="text-red-300">*</span>
                        </label>
                        <input
                          type="date"
                          id="date_entree"
                          name="date_entree"
                          value={dateEntreeNouvelle}
                          onChange={(e) => setDateEntreeNouvelle(e.target.value)}
                          min={affectationActive ? dateFinActuelle : undefined}
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="mandat_annees" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                          Durée du mandat (ans) <span className="text-red-300">*</span>
                        </label>
                        <input
                          type="number"
                          id="mandat_annees"
                          name="mandat_annees"
                          value={dureeMandat}
                          onChange={(e) => setDureeMandat(parseInt(e.target.value) || 1)}
                          min="1"
                          max="10"
                          required
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                    </div>

                    {/* Aperçu de la nouvelle affectation */}
                    {dateSortieNouvelle && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Aperçu de la nouvelle affectation</p>
                        <p className="text-sm text-blue-800">
                          Du {new Date(dateEntreeNouvelle).toLocaleDateString('fr-FR')} au {new Date(dateSortieNouvelle).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="text-xs text-blue-400 mt-1">
                          Durée : {dureeMandat} an{dureeMandat > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    <div>
                      <label htmlFor="motif" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                        Motif {affectationActive ? 'de la réaffectation' : 'de l\'affectation'}
                      </label>
                      <textarea
                        id="motif"
                        name="motif"
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        rows={3}
                        placeholder={`Indiquez le motif de cette ${affectationActive ? 'réaffectation' : 'affectation'}...`}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Message d'erreur si les dates sont incohérentes */}
                {affectationActive && dateFinActuelle && dateEntreeNouvelle && new Date(dateFinActuelle) > new Date(dateEntreeNouvelle) && (
                  <div className="mb-6 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">
                      ⚠️ La date de fin de l'ancienne affectation doit être antérieure ou égale à la date d'entrée de la nouvelle
                    </p>
                  </div>
                )}

                {/* Boutons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isValid()}
                    className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">◌</span>
                        Traitement...
                      </>
                    ) : affectationActive ? (
                      'Confirmer la réaffectation'
                    ) : (
                      'Affecter le pasteur'
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