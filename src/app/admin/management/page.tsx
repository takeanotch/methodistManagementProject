'use server'

import { supabase } from '@/lib/supabase'
import { getUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { 
  getRegions, 
  getConferences, 
  getDistricts, 
  getParoisses,
  getStructuresStats 
} from '@/actions/structures'
import StructuresClient from './StructuresClient'

export default async function StructuresPage() {
  const user = await getUser()

  if (!user || user.role?.nom !== 'admin') {
    redirect('/profile')
  }

  // Récupérer toutes les données
  const [regions, conferences, districts, paroisses, stats] = await Promise.all([
    getRegions(),
    getConferences(),
    getDistricts(),
    getParoisses(),
    getStructuresStats()
  ])

  return (
    <StructuresClient 
      initialRegions={regions}
      initialConferences={conferences}
      initialDistricts={districts}
      initialParoisses={paroisses}
      initialStats={stats}
    />
  )
}