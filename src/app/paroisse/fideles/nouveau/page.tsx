
// app/(app)/fideles/nouveau/page.tsx
import { redirect } from 'next/navigation'
import { getUser, getCurrentFidele } from '@/actions/auth'
import { createFidele } from '@/actions/fidele'
import { getCurrentAnneeConference, AnneeConference } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// Fonction utilitaire pour récupérer la conférence d'une paroisse
async function getConferenceFromParoisse(paroisseId: number) {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id, nom)
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (paroisse?.district) {
      const district = Array.isArray(paroisse.district) 
        ? paroisse.district[0] 
        : paroisse.district
      
      if (district?.conference) {
        const conference = Array.isArray(district.conference) 
          ? district.conference[0] 
          : district.conference
        return conference
      }
    }
    
    return null
  } catch (error) {
    console.error('Erreur getConferenceFromParoisse:', error)
    return null
  }
}

export default async function NouveauFidelePage() {
  const user = await getUser()
  const currentFidele = await getCurrentFidele()

  if (!user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur a une paroisse
  if (!currentFidele?.paroisse_id) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center">
          <h2 className="text-lg font-light text-yellow-800 mb-2">Paroisse non définie</h2>
          <p className="text-sm text-yellow-600">
            Vous devez être rattaché à une paroisse pour ajouter des fidèles.
          </p>
        </div>
      </div>
    )
  }

  // Récupérer la conférence de la paroisse
  const conference = await getConferenceFromParoisse(currentFidele.paroisse_id)
  
  // Récupérer l'année en cours pour cette conférence
  let currentAnnee: AnneeConference | null = null
  if (conference?.id) {
    currentAnnee = await getCurrentAnneeConference(conference.id)
  }
  
  if (!currentAnnee) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6 text-center">
          <h2 className="text-lg font-light text-yellow-800 mb-2">Année non définie</h2>
          <p className="text-sm text-yellow-600">
            Aucune année de conférence en cours n'est définie pour votre conférence. Veuillez contacter un administrateur.
          </p>
          <Link
            href="/fideles"
            className="mt-4 inline-block px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
          >
            Retour à la liste
          </Link>
        </div>
      </div>
    )
  }

  // On stocke les valeurs nécessaires dans des constantes pour les passer à handleSubmit
  const paroisseId = currentFidele.paroisse_id
  const anneeId = currentAnnee.annee_id

  async function handleSubmit(formData: FormData) {
    'use server'
    
    // Utiliser les constantes qui sont garanties non-null
    formData.append('paroisse_id', paroisseId.toString())
    formData.append('annee_id', anneeId.toString())
    
    const result = await createFidele(formData, anneeId)
    
    if (result.error) {
      throw new Error(result.error)
    }
    
    redirect('/paroisse/fideles')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/fideles" className="text-gray-400 hover:text-gray-600 transition-colors">
            Fidèles
          </Link>
          <span className="text-gray-300">›</span>
          <span className="text-gray-900">Nouveau</span>
        </div>
      </div>

      {/* En-tête avec infos utilisateur */}
      <div className="mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <span className="bg-gray-100 px-2 py-1 rounded-full capitalize">
              {user.role?.nom || 'utilisateur'}
            </span>
            <span>•</span>
            <span>{user.nom_complet}</span>
          </div>
          <h1 className="text-2xl font-light text-gray-900">Nouveau fidèle</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ajouter un fidèle à la paroisse <span className="font-medium text-gray-700">{currentFidele.paroisse?.nom}</span>
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white rounded-lg border border-gray-100 p-6">
        <form action={handleSubmit}>
          <div className="space-y-4">
            {/* Ligne 1: Nom et Post-nom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nom" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Nom <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Ex: KABONGO"
                />
              </div>

              <div>
                <label htmlFor="post_nom" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Post-nom <span className="text-red-300">*</span>
                </label>
                <input
                  type="text"
                  id="post_nom"
                  name="post_nom"
                  required
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Ex: MBUYAMBA"
                />
              </div>
            </div>

            {/* Prénom */}
            <div>
              <label htmlFor="prenom" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Prénom <span className="text-red-300">*</span>
              </label>
              <input
                type="text"
                id="prenom"
                name="prenom"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Ex: Jean"
              />
            </div>

            {/* Contact */}
            <div>
              <label htmlFor="contact" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Contact <span className="text-red-300">*</span>
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                required
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Ex: +243 812 345 678"
              />
            </div>

            {/* Année de naissance et Sexe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="annee_naissance" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Année de naissance
                </label>
                <input
                  type="number"
                  id="annee_naissance"
                  name="annee_naissance"
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  placeholder="Ex: 1990"
                />
              </div>

              <div>
                <label htmlFor="sexe" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                  Sexe
                </label>
                <select
                  id="sexe"
                  name="sexe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors"
                >
                  <option value="">Non spécifié</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
            </div>

            {/* Statut actif */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="actif"
                name="actif"
                defaultChecked={true}
                className="w-4 h-4 border-gray-200 rounded text-gray-900 focus:ring-gray-200"
              />
              <label htmlFor="actif" className="text-sm text-gray-600">
                Fidèle actif
              </label>
            </div>

            {/* Adresse */}
            <div>
              <label htmlFor="adresse" className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                Adresse
              </label>
              <textarea
                id="adresse"
                name="adresse"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                placeholder="Adresse complète..."
              />
            </div>

            {/* Messages informatifs sur la paroisse et l'année */}
            <div className="space-y-2">
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>
                    Ce fidèle sera rattaché à la paroisse <strong>{currentFidele.paroisse?.nom}</strong>
                  </span>
                </p>
              </div>
              
              <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
                <p className="text-xs text-green-700 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    Inscription pour l'année de conférence : <strong>{currentAnnee.annee?.label}</strong> (Année en cours)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-50">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800 transition-colors rounded-lg"
            >
              Créer le fidèle
            </button>
            <Link
              href="/fideles"
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-400 text-sm hover:text-gray-600 hover:border-gray-300 transition-colors rounded-lg text-center"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}