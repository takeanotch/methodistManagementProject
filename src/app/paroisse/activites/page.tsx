
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ActivitesPage, type UniteOrganisationSimple, type AnneeConference, type ActiviteAffichee } from '@/components/ActivitesPage'
import { getCurrentFidele } from '@/actions/auth'
import { getParoisseById, getConferenceFromParoisse } from '@/actions/structures'
import { getActivitesByUnite } from '@/actions/activite'
import { getAnneesConferenceByConference } from '@/actions/annee-conference'
import { supabase } from '@/lib/supabase'

async function getAllDepartementUnitesForParoisse(paroisseId: number): Promise<UniteOrganisationSimple[]> {
  const { data } = await supabase
    .from('unite_organisation')
    .select('id, nom, reference_id')
    .eq('reference_table', 'departement')
    .eq('id_niveau', paroisseId)
    .eq('niveau', 'paroisse')
    .order('nom', { ascending: true })
  
  return data || []
}

export default function ParoisseActivitesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentFidele, setCurrentFidele] = useState<any>(null)
  const [paroisse, setParoisse] = useState<any>(null)
  const [unites, setUnites] = useState<UniteOrganisationSimple[]>([])
  const [annees, setAnnees] = useState<AnneeConference[]>([])
  const [currentAnneeId, setCurrentAnneeId] = useState<number | undefined>(undefined)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const fidele = await getCurrentFidele()
    if (!fidele) { router.push('/login'); return }
    setCurrentFidele(fidele)

    const paroisseData = await getParoisseById(fidele.paroisse_id)
    if (!paroisseData) { router.push('/paroisse'); return }
    setParoisse(paroisseData)

    const unitesData = await getAllDepartementUnitesForParoisse(fidele.paroisse_id)
    setUnites(unitesData)

    const conferenceId = await getConferenceFromParoisse(fidele.paroisse_id)
    const anneesData = conferenceId ? await getAnneesConferenceByConference(conferenceId) : []
    setAnnees(anneesData)

    const currentAnnee = anneesData.find((a: any) => a.is_current)
    setCurrentAnneeId(currentAnnee?.id || anneesData[0]?.id)

    setLoading(false)
  }

  async function loadActivitesForUnite(uniteId: number, anneeId: number): Promise<ActiviteAffichee[]> {
    return await getActivitesByUnite(uniteId, anneeId)
  }

  if (!currentFidele || !paroisse) return null

  return (
    <ActivitesPage
      config={{
        title: "Activités de la paroisse",
        subtitle: paroisse.nom,
        backUrl: "/paroisse",
        backLabel: "Retour à l'accueil",
        showParoisseColumn: false,
        showDepartementColumn: true,
        unites,
        anneesDisponibles: annees,
        currentAnneeId,
        onLoadActivites: loadActivitesForUnite,
        onAnneeChange: (anneeId) => setCurrentAnneeId(anneeId)
      }}
      loading={loading}
    />
  )
}