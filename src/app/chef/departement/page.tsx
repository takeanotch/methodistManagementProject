// app/chef/departement/page.tsx
'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MapPin, Building2 } from 'lucide-react'
import { getChefInfo } from '@/actions/chef-district'
import { getChefConferenceInfo } from '@/actions/chef-conference'
import { Spinner } from '@/components/Spinner'

export default function ChefDepartementPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'district' | 'conference' | null>(null)

  useEffect(() => {
    async function checkChefType() {
       // Vérifier si c'est un chef de conférence
      const conferenceChef = await getChefConferenceInfo()
      if (conferenceChef) {
        setType('conference')
        router.push('/chef/departement/conference')
        return
      }

      // Vérifier si c'est un chef de district
      const districtChef = await getChefInfo()
      if (districtChef) {
        setType('district')
        // Rediriger directement vers la vue district
        router.push('/chef/departement/district')
        return
      }

     
      setLoading(false)
    }

    checkChefType()
  }, [router])

  if (loading) {
    return (
     <Spinner/>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-xl font-light mb-2">Accès non autorisé</h1>
        <p className="text-gray-500">Vous n'êtes pas chef de département</p>
      </div>
    </div>
  )
}