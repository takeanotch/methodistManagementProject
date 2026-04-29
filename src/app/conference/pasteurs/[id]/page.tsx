
// app/admin/pasteurs/[id]/page.tsx
import { getPasteurById, getHistoriqueCompletPasteur } from '@/actions/pasteurs'
import { getParoisses } from '@/actions/structures'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AffecterPasteurForm from './AffecterPasteurForm'
import HistoriqueAffectations from './HistoriqueAffectations'
import ReaffecterModal from './ReaffecterModal'
import EditPasteurModal from './EditPasteurModal'

interface PageProps {
  params: Promise<{ id: string }>
}

// Fonction pour obtenir le libellé de l'étude
const getEtudeLabel = (etude: string) => {
  const labels: Record<string, string> = {
    master: 'Master',
    licence: 'Licence',
    phd: 'PhD / Doctorat',
    autre: 'Autre'
  }
  return labels[etude] || etude
}

export default async function PasteurDetailPage({ params }: PageProps) {
  const { id } = await params
  const pasteurId = parseInt(id)
  
  const pasteur = await getPasteurById(pasteurId)
  const historique = await getHistoriqueCompletPasteur(pasteurId)
  const paroisses = await getParoisses()

  if (!pasteur) {
    notFound()
  }

  // Trier par created_at (du plus récent au plus ancien)
  const historiqueTrie = [...historique].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Identifier l'affectation en cours (celle avec active = true)
  const trouverAffectationEnCours = () => {
    if (historiqueTrie.length === 0) return null
    
    // Chercher d'abord avec le champ active
    const active = historiqueTrie.find(a => a.active === true)
    if (active) return active
    
    // Fallback: la plus récente avec date_sortie >= aujourd'hui
    const aujourdhui = new Date()
    aujourdhui.setHours(0, 0, 0, 0)
    
    for (const affectation of historiqueTrie) {
      const dateSortie = new Date(affectation.date_sortie)
      dateSortie.setHours(0, 0, 0, 0)
      
      if (dateSortie >= aujourdhui) {
        return affectation
      }
    }
    
    return null
  }

  const affectationEnCours = trouverAffectationEnCours()

  // Formater le pasteur pour le modal (avec l'affectation actuelle)
  const pasteurWithAffectation = {
    ...pasteur,
    affectation_actuelle: affectationEnCours || null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light text-gray-900">Détail du pasteur</h1>
          <div className="flex items-center gap-3">
            <EditPasteurModal pasteur={pasteur} />
            <Link
              href="/conference/pasteurs"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6 ">
        {/* Informations du pasteur */}
        <div className="bg-white -lg border border-gray-100 p-6">
          <div className="flex items-start gap-6">
            {/* Photo */}
            <div className="relative flex-shrink-0">
              {pasteur.fidele?.profile_img ? (
                <div className="w-24 h-24 -full overflow-hidden border-2 border-gray-100">
                  <Image
                    src={pasteur.fidele.profile_img}
                    alt={`${pasteur.fidele.nom} ${pasteur.fidele.prenom}`}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 -full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border-2 border-gray-100">
                  <span className="text-3xl font-light text-gray-400">
                    {pasteur.fidele?.nom?.charAt(0)}
                    {pasteur.fidele?.prenom?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1">
              <h2 className="text-xl font-medium text-gray-900">
                {pasteur.fidele?.nom} {pasteur.fidele?.post_nom} {pasteur.fidele?.prenom}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Contact</p>
                  <p className="text-sm text-gray-700 mt-1">{pasteur.fidele?.contact}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Adresse</p>
                  <p className="text-sm text-gray-700 mt-1">{pasteur.fidele?.adresse || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Niveau d'étude</p>
                  <p className="text-sm text-gray-700 mt-1">{getEtudeLabel(pasteur.etude)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Statut</p>
                  <p className="text-sm text-gray-700 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 -full text-xs font-medium ${
                      pasteur.est_actif 
                        ? 'text-green-700 bg-green-50' 
                        : 'text-gray-500 bg-gray-100'
                    }`}>
                      {pasteur.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Enregistré le</p>
                  <p className="text-sm text-gray-700 mt-1">
                    {new Date(pasteur.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section d'affectation */}
        {affectationEnCours ? (
          <div className="bg-emerald-50 -lg border border-emerald-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-light text-emerald-900">Affectation en cours</h3>
              <ReaffecterModal 
                pasteur={pasteurWithAffectation}
                paroisses={paroisses}
                buttonVariant="default"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-emerald-900">{affectationEnCours.paroisse?.nom}</p>
                <p className="text-sm text-emerald-700">{affectationEnCours.paroisse?.district?.nom}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-emerald-600">
                  <span>Du {new Date(affectationEnCours.date_entree).toLocaleDateString('fr-FR')}</span>
                  <span>au {new Date(affectationEnCours.date_sortie).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1.5 -full">
                  Mandat de {affectationEnCours.mandat_annees} an(s)
                </span>
                
                {/* Indicateur de fin de mandat */}
                {(() => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  const dateSortie = new Date(affectationEnCours.date_sortie)
                  dateSortie.setHours(0, 0, 0, 0)
                  
                  if (dateSortie > today) {
                    const daysUntilEnd = Math.ceil((dateSortie.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    if (daysUntilEnd <= 30) {
                      return (
                        <p className="text-xs text-amber-600 mt-2">
                          ⏳ {daysUntilEnd} jour{daysUntilEnd > 1 ? 's' : ''} restant{daysUntilEnd > 1 ? 's' : ''}
                        </p>
                      )
                    }
                  } else if (dateSortie.getTime() === today.getTime()) {
                    return (
                      <p className="text-xs text-amber-600 mt-2">
                        ⏳ Dernier jour du mandat
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white -lg border border-gray-100 p-6">
            <h3 className="text-lg font-light text-gray-900 mb-4">Nouvelle affectation</h3>
            <AffecterPasteurForm pasteurId={pasteur.id} paroisses={paroisses} />
          </div>
        )}

        {/* Historique complet des affectations */}
        <HistoriqueAffectations historique={historique} />
      </div>
    </div>
  )
}