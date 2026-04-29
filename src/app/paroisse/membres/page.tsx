import { getDepartements } from '@/actions/departements'
import { getAnnees } from '@/actions/fidele-departement'
import { getCurrentFidele } from '@/actions/auth'
import { redirect } from 'next/navigation'
import MembresParDepartementClient from './MembresParDepartementClient'

export default async function MembresParDepartementPage() {
  // ✅ Récupérer le fidèle connecté avec sa paroisse
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }

  // Récupérer tous les départements
  const departements = await getDepartements()
  
  // Récupérer toutes les années disponibles
  const annees = await getAnnees()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900">
          Membres par département
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {currentFidele.paroisse?.nom || 'Ma paroisse'} - Sélectionnez un département et une année
        </p>
      </div>

      {/* Composant client avec les sélecteurs */}
      <MembresParDepartementClient
        departements={departements}
        annees={annees}
        paroisseId={currentFidele.paroisse_id}
      />
    </div>
  )
}