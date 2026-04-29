'use client'

import { useState } from 'react'

interface Props {
  historique: any[]
}

export default function HistoriqueAffectations({ historique }: Props) {
  const [showAll, setShowAll] = useState(false)
  
  // Trier par created_at (du plus récent au plus ancien)
  const historiqueTrie = [...historique].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const affectationsAffichees = showAll ? historiqueTrie : historiqueTrie.slice(0, 5)

  // Fonction pour calculer le nombre de jours prestés
  const calculerJoursPrestes = (dateEntree: string, dateSortie: string | null) => {
    const debut = new Date(dateEntree)
    const fin = dateSortie ? new Date(dateSortie) : new Date()
    const diffTime = Math.abs(fin.getTime() - debut.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="bg-white -lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-light text-gray-900">
          Historique des affectations
          <span className="ml-2 text-sm text-gray-400">({historiqueTrie.length})</span>
        </h3>
        {historiqueTrie.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showAll ? 'Voir moins' : 'Voir tout'}
          </button>
        )}
      </div>
      
      {historiqueTrie.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Aucune affectation dans l'historique
        </p>
      ) : (
        <div className="space-y-3 -">
          {affectationsAffichees.map((affectation) => {
            const joursPrestes = calculerJoursPrestes(
              affectation.date_entree, 
              affectation.date_sortie
            )
            
            return (
              <div
                key={affectation.id}
                className={`p-4 -lg border ${
                  affectation.active 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Paroisse et district */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-gray-900">
                        {affectation.paroisse?.nom}
                      </span>
                      <span className="text-sm text-gray-500">
                        {affectation.paroisse?.district?.nom}
                      </span>
                      {affectation.active && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 -full">
                          En cours
                        </span>
                      )}
                    </div>

                    {/* Année de conférence */}
                    {affectation.annee_conference?.annee && (
                      <p className="text-xs text-gray-400 mb-2">
                        Année conférence: {affectation.annee_conference.annee.label}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Date d'entrée</p>
                        <p className="text-gray-700">
                          {new Date(affectation.date_entree).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Date de sortie</p>
                        <p className="text-gray-700">
                          {new Date(affectation.date_sortie).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>

                    {/* Informations complémentaires */}
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className="text-gray-500">
                        Mandat: {affectation.mandat_annees} an{affectation.mandat_annees > 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">
                        Jours prestés: {joursPrestes} jour{joursPrestes > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Bouton pour voir plus */}
          {!showAll && historiqueTrie.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100 mt-2"
            >
              Afficher les {historiqueTrie.length - 5} affectations plus anciennes
            </button>
          )}
        </div>
      )}
    </div>
  )
}