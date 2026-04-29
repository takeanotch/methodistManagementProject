

import { getFideleById } from '@/actions/fidele'
import { getDepartementsByFidele, getAnnees } from '@/actions/fidele-departement'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import FideleDepartementsActions from './FideleDepartementsActions'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function FideleDetailPage({ params }: PageProps) {
  const { id } = await params
  
  if (!id) {
    console.error('❌ ID non fourni')
    redirect('/paroisse/fideles')
  }

  const fideleId = parseInt(id)
  
  if (isNaN(fideleId)) {
    console.error('❌ ID invalide:', id)
    redirect('/paroisse/fideles?error=invalid-id')
  }

  console.log('🔍 Recherche du fidèle avec ID:', fideleId)
  
  const fidele = await getFideleById(fideleId)

  if (!fidele) {
    redirect('/paroisse/fideles?error=not-found')
  }

  // Récupérer les départements du fidèle
  const affectations = await getDepartementsByFidele(fideleId)
  
  // Récupérer les années pour le filtre (optionnel)
  const annees = await getAnnees()

  // Statistiques
  const totalAffectations = affectations.length
  const actives = affectations.filter(a => a.est_actif).length
  const inactives = totalAffectations - actives

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Photo */}
            {fidele.profile_img ? (
              <img
                src={fidele.profile_img}
                alt=""
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl">
                {fidele.nom[0]}
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-light text-gray-900">
                {fidele.nom} {fidele.post_nom} {fidele.prenom}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  fidele.actif 
                    ? 'bg-green-50 text-green-600' 
                    : 'bg-gray-50 text-gray-500'
                }`}>
                  {fidele.actif ? 'Actif' : 'Inactif'}
                </span>
                {fidele.sexe && (
                  <span className="text-xs text-gray-400">
                    {fidele.sexe === 'M' ? 'Homme' : 'Femme'}
                  </span>
                )}
                <span className="text-xs text-gray-400">
                  Inscrit le {new Date(fidele.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href={`/paroisse/fideles/${fideleId}/modifier`}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Modifier
            </Link>
            <Link
              href="/paroisse/fideles"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Tous les fidèles
            </Link>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Informations personnelles</h2>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-gray-400">Contact</dt>
              <dd className="text-gray-700">{fidele.contact || 'Non renseigné'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-400">Adresse</dt>
              <dd className="text-gray-700">{fidele.adresse || 'Non renseignée'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-gray-400">Année naissance</dt>
              <dd className="text-gray-700">{fidele.annee_naissance || 'Non renseignée'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 p-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Paroisse</h2>
          {fidele.paroisse ? (
            <div>
              <p className="text-sm text-gray-700">{fidele.paroisse.nom}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {fidele.paroisse.id}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Non assigné</p>
          )}
        </div>
      </div>

      {/* Départements du fidèle */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-700">
              Parcours dans les départements
            </h2>
            {totalAffectations > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {actives} actuel{actives > 1 ? 's' : ''} • {inactives} ancien{inactives > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <Link
            href={`/paroisse/departements/ajouter-fidele?fideleId=${fideleId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs hover:bg-green-700 transition-colors rounded-lg"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle affectation
          </Link>
        </div>

        {affectations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-gray-100">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21v-4H7v4" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6" />
            </svg>
            <p className="text-sm text-gray-400 mb-2">
              Ce fidèle n'est dans aucun département pour le moment
            </p>
            <Link
              href={`/paroisse/departements/ajouter-fidele?fideleId=${fideleId}`}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter maintenant
            </Link>
          </div>
        ) : (
          <FideleDepartementsActions 
            affectations={affectations} 
            fideleId={fideleId}
            fideleNom={`${fidele.nom} ${fidele.prenom}`}
          />
        )}
      </div>
    </div>
  )
}