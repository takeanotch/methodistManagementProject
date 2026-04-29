
// app/conference/pasteurs/page.tsx
import { getPasteursWithCurrentAffectation, getHistoriqueCompletPasteur, getPasteursWithFilters } from '@/actions/pasteurs'
import { getParoisses } from '@/actions/structures'
import { getAnneesConferenceByConference,getDistricts, getConferenceByFideleId } from '@/actions/annee-conference'
import { getCurrentFidele } from '@/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import ReaffecterModal from './ReaffecterModal'
import AjouterPasteurModal from './AjouterPasteurModal'
import StatsPasteurs from './StatsPasteurs'
import { getPasteursByAnneeConferenceId } from '@/actions/pasteurs'
import AnneeSelector from './AnneeSelector'
import FiltresPasteurs from './FiltrePasteur'
import ExportPDFButton from './ExportPDFButton'
interface Props {
  searchParams?: Promise<{ annee?: string; district?: string; paroisse?: string }> | { annee?: string; district?: string; paroisse?: string }
}

export default async function PasteursPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams
  const anneeParam = resolvedSearchParams?.annee
  const districtParam = resolvedSearchParams?.district
  const paroisseParam = resolvedSearchParams?.paroisse
  
  const fidele = await getCurrentFidele()
  

  
  let conferenceId = null
  let conferenceNom = null
  let anneesDisponibles: any[] = []
  let districts: any[] = []
  let paroisses: any[] = []
  
  if (fidele) {
    const conference = await getConferenceByFideleId(fidele.id)
    conferenceId = conference?.id || null
    conferenceNom = conference?.nom || null
    
    if (conferenceId) {
      anneesDisponibles = await getAnneesConferenceByConference(conferenceId)
      districts = await getDistricts(conferenceId)
      paroisses = await getParoisses()
    }
  }
  
  // Déterminer l'année de conférence sélectionnée
  let anneeConferenceSelectionnee: number | null = null
  
  if (anneeParam) {
    const id = parseInt(anneeParam)
    const anneeExiste = anneesDisponibles.some(a => a.id === id)
    if (anneeExiste) {
      anneeConferenceSelectionnee = id
    }
  }
  
  if (!anneeConferenceSelectionnee && anneesDisponibles.length > 0) {
    const anneeCourante = anneesDisponibles.find(a => a.is_current) || anneesDisponibles[0]
    anneeConferenceSelectionnee = anneeCourante.id
  }
  
  // Récupérer les pasteurs avec filtres
  let pasteurs = []
  if (anneeConferenceSelectionnee) {
    pasteurs = await getPasteursWithFilters(
      anneeConferenceSelectionnee,
      conferenceId,
      {
        districtId: districtParam,
        paroisseId: paroisseParam
      }
    )
  } else {
    pasteurs = await getPasteursWithCurrentAffectation(true)
  }

  const getEtudeLabel = (etude: string) => {
    const labels: Record<string, string> = {
      master: 'Master',
      licence: 'Licence',
      phd: 'PhD/Doctorat',
      autre: 'Autre'
    }
    return labels[etude] || etude
  }

  const pasteursAvecAffectations = await Promise.all(
    pasteurs.map(async (pasteur) => {
      if (pasteur.affectation_pour_annee) {
        return {
          ...pasteur,
          affectation_actuelle: pasteur.affectation_pour_annee
        }
      }
      
      const historique = await getHistoriqueCompletPasteur(pasteur.id)
      const aujourdhui = new Date()
      aujourdhui.setHours(0, 0, 0, 0)
      
      const affectationActive = historique.find((aff: any) => {
        const dateSortie = new Date(aff.date_sortie)
        dateSortie.setHours(0, 0, 0, 0)
        return aff.active && dateSortie >= aujourdhui
      })
      
      return {
        ...pasteur,
        affectation_actuelle: affectationActive || null
      }
    })
  )

  const getStatusBadge = (affectation: any) => {
    if (!affectation) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Non affecté
        </span>
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dateSortie = new Date(affectation.date_sortie)
    dateSortie.setHours(0, 0, 0, 0)
    
    const daysUntilEnd = Math.ceil((dateSortie.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilEnd === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Dernier jour
        </span>
      )
    }

    if (daysUntilEnd < 30) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          {daysUntilEnd} jour{daysUntilEnd > 1 ? 's' : ''}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        {affectation.paroisse?.nom}
      </span>
    )
  }

  const anneeSelectionneeInfo = anneesDisponibles.find(a => a.id === anneeConferenceSelectionnee)
  const anneeLabel = anneeSelectionneeInfo?.annee?.label || ''
  
  // Trouver les noms du district et de la paroisse filtrés
  const districtFiltre = districtParam ? districts.find(d => d.id.toString() === districtParam) : null
  const paroisseFiltre = paroisseParam ? paroisses.find(p => p.id.toString() === paroisseParam) : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-light text-gray-900">Gestion des pasteurs</h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {pasteursAvecAffectations.length} pasteur{pasteursAvecAffectations.length > 1 ? 's' : ''} 
              {anneeLabel && ` · ${anneeLabel}`}
              {districtFiltre && ` · ${districtFiltre.nom}`}
              {paroisseFiltre && ` · ${paroisseFiltre.nom}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportPDFButton 
              pasteurs={pasteursAvecAffectations}
              filters={{
                anneeLabel: anneeLabel || 'En cours',
                districtNom: districtFiltre?.nom || null,
                paroisseNom: paroisseFiltre?.nom || null,
                conferenceNom: conferenceNom || undefined
              }}
            />
            <AjouterPasteurModal paroisses={paroisses} />
          </div>
        </div>
      </div>

      {/* Filtres et sélecteur d'année */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
        {anneesDisponibles.length > 0 && (
          <AnneeSelector 
            anneesDisponibles={anneesDisponibles} 
            anneeActuelle={anneeConferenceSelectionnee} 
          />
        )}
        
        <FiltresPasteurs 
          paroisses={paroisses}
          districts={districts}
          filtreActuel={{
            district: districtParam || '',
            paroisse: paroisseParam || ''
          }}
        />
      </div>

      {/* Message si aucune année n'est disponible */}
      {anneesDisponibles.length === 0 && conferenceId === null && (
        <div className="mb-5 p-3.5 bg-amber-50 border-l-4 border-amber-500">
          <p className="text-sm text-amber-700">
            ⚠️ Aucune année de conférence n'a été trouvée. Veuillez contacter l'administrateur.
          </p>
        </div>
      )}

      {/* Statistiques */}
      <StatsPasteurs pasteurs={pasteursAvecAffectations} />

      {/* Liste des pasteurs */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasteur
                </th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Contact
                </th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Niveau
                </th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affectation
                </th>
                <th className="text-left py-3 px-4 sm:px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pasteursAvecAffectations.map((pasteur) => (
                <tr key={pasteur.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        {pasteur.fidele?.profile_img ? (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-gray-200">
                            <Image
                              src={pasteur.fidele.profile_img}
                              alt={`${pasteur.fidele.nom} ${pasteur.fidele.prenom}`}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border border-gray-300">
                            <span className="text-xs sm:text-sm font-light text-gray-500">
                              {pasteur.fidele?.nom?.charAt(0)}
                              {pasteur.fidele?.prenom?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[150px] sm:max-w-none">
                          {pasteur.fidele?.nom} {pasteur.fidele?.prenom}
                        </p>
                        <p className="text-xs text-gray-400 md:hidden mt-0.5 truncate">
                          {pasteur.fidele?.contact}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 sm:px-6 hidden md:table-cell">
                    <p className="text-sm text-gray-700">{pasteur.fidele?.contact}</p>
                    {pasteur.fidele?.adresse && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                        {pasteur.fidele.adresse}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 sm:px-6 hidden lg:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {getEtudeLabel(pasteur.etude)}
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border ${
                      pasteur.est_actif 
                        ? 'text-green-700 bg-green-50 border-green-200' 
                        : 'text-gray-500 bg-gray-100 border-gray-300'
                    }`}>
                      {pasteur.est_actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    {getStatusBadge(pasteur.affectation_actuelle)}
                    {pasteur.affectation_actuelle && (
                      <>
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px] sm:max-w-none">
                          {pasteur.affectation_actuelle.paroisse?.district?.nom}
                        </p>
                      </>
                    )}
                  </td>
                  <td className="py-3 px-4 sm:px-6">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/conference/pasteurs/${pasteur.id}`}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors px-2.5 py-1 border border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      >
                        Voir
                      </Link>
                      <ReaffecterModal 
                        pasteur={pasteur}
                        paroisses={paroisses}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {pasteursAvecAffectations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-400 text-sm">
                        {anneeConferenceSelectionnee 
                          ? `Aucun pasteur trouvé pour ces critères` 
                          : 'Aucun pasteur trouvé'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}