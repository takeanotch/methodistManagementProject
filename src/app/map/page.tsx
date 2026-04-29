
// 'use client'

// import { useState, useEffect } from 'react'
// import { supabase } from '@/lib/supabase'
// import dynamic from 'next/dynamic'

// // Import dynamique du composant carte
// const MapWithNoSSR = dynamic(
//   () => import('./MapComponent'),
//   { 
//     ssr: false,
//     loading: () => (
//       <div className="h-screen w-full flex items-center justify-center">
//         <div className="text-gray-500">Chargement de la carte...</div>
//       </div>
//     )
//   }
// )

// // Types
// type District = {
//   id: number
//   nom: string
// }

// type Paroisse = {
//   id: number
//   nom: string
//   longitude: number
//   latitude: number
//   district?: District | null
// }

// // Type pour la réponse brute de Supabase
// type RawParoisseResponse = {
//   id: number
//   nom: string
//   longitude: number
//   latitude: number
//   district: District[] | null  // Supabase retourne un tableau
// }

// export default function CarteParoisses() {
//   const [paroisses, setParoisses] = useState<Paroisse[]>([])
//   const [filteredParoisses, setFilteredParoisses] = useState<Paroisse[]>([])
//   const [districts, setDistricts] = useState<District[]>([])
//   const [loading, setLoading] = useState(true)
//   const [selectedDistrict, setSelectedDistrict] = useState('')
//   const [showSidebar, setShowSidebar] = useState(true)

//   // Coordonnées de Lubumbashi
//   const lubumbashiCoords: [number, number] = [-11.6697, 27.4794]

//   useEffect(() => {
//     chargerDonnees()
//   }, [])

//   useEffect(() => {
//     if (selectedDistrict) {
//       const filtered = paroisses.filter(p => 
//         p.district?.id === parseInt(selectedDistrict)
//       )
//       setFilteredParoisses(filtered)
//     } else {
//       setFilteredParoisses(paroisses)
//     }
//   }, [selectedDistrict, paroisses])

//   // const chargerDonnees = async () => {
//   //   try {
//   //     // Charger les districts pour le filtre
//   //     const { data: districtsData, error: districtsError } = await supabase
//   //       .from('district')
//   //       .select('id, nom')
//   //       .order('nom')

//   //     if (districtsError) throw districtsError
//   //     setDistricts(districtsData || [])

//   //     // Charger les paroisses avec leurs districts
//   //     const { data, error } = await supabase
//   //       .from('paroisse')
//   //       .select(`
//   //         id,
//   //         nom,
//   //         longitude,
//   //         latitude,
//   //         district:district_id (
//   //           id,
//   //           nom
//   //         )
//   //       `)
//   //       .not('longitude', 'is', null)
//   //       .not('latitude', 'is', null)

//   //     if (error) throw error

//   //     // TRANSFORMATION CORRECTE des données
//   //     // Supabase retourne district comme tableau, on prend le premier élément
//   //     const paroissesTransformees: Paroisse[] = (data as RawParoisseResponse[] || []).map(item => {
//   //       // Vérifier si district existe et est un tableau non vide
//   //       const districtData = item.district && Array.isArray(item.district) && item.district.length > 0 
//   //         ? item.district[0]  // Prendre le premier élément du tableau
//   //         : null

//   //       return {
//   //         id: item.id,
//   //         nom: item.nom,
//   //         longitude: item.longitude,
//   //         latitude: item.latitude,
//   //         district: districtData ? {
//   //           id: districtData.id,
//   //           nom: districtData.nom
//   //         } : null
//   //       }
//   //     })

//   //     setParoisses(paroissesTransformees)
//   //     setFilteredParoisses(paroissesTransformees)
//   //   } catch (error) {
//   //     console.error('Erreur:', error)
//   //   } finally {
//   //     setLoading(false)
//   //   }
//   // }
//   const chargerDonnees = async () => {
//   try {
//     // Charger les districts
//     const { data: districtsData } = await supabase
//       .from('district')
//       .select('id, nom')
//       .order('nom')

//     setDistricts(districtsData || [])

//     // Charger les paroisses d'abord
//     const { data: paroissesData, error } = await supabase
//       .from('paroisse')
//       .select('id, nom, longitude, latitude, district_id')
//       .not('longitude', 'is', null)
//       .not('latitude', 'is', null)

//     if (error) throw error

//     // Ensuite, charger les districts pour chaque paroisse
//     const paroissesAvecDistrict: Paroisse[] = await Promise.all(
//       (paroissesData || []).map(async (p) => {
//         let district = null
        
//         if (p.district_id) {
//           const { data: districtData } = await supabase
//             .from('district')
//             .select('id, nom')
//             .eq('id', p.district_id)
//             .single()
          
//           district = districtData
//         }

//         return {
//           id: p.id,
//           nom: p.nom,
//           longitude: p.longitude,
//           latitude: p.latitude,
//           district
//         }
//       })
//     )

//     console.log('Paroisses avec districts:', paroissesAvecDistrict)
//     setParoisses(paroissesAvecDistrict)
//     setFilteredParoisses(paroissesAvecDistrict)
//   } catch (error) {
//     console.error('Erreur:', error)
//   } finally {
//     setLoading(false)
//   }
// }

//   if (loading) {
//     return (
//       <div className="h-screen w-full flex items-center justify-center">
//         <div className="text-gray-500">Chargement des données...</div>
//       </div>
//     )
//   }

//   return (
//     <div className="h-screen w-full flex relative">
//       {/* Sidebar des filtres */}
//       <div className={`${showSidebar ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col h-full`}>
//         <div className="p-4 border-b border-gray-100">
//           <div className="flex items-center justify-between">
//             <h2 className="font-semibold text-gray-900">Paroisses</h2>
//             <button 
//               onClick={() => setShowSidebar(false)}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//           </div>
//         </div>

//         <div className="p-4">
//           <label className="block text-xs text-gray-400 uppercase mb-2">
//             Filtrer par district
//           </label>
//           <select
//             value={selectedDistrict}
//             onChange={(e) => setSelectedDistrict(e.target.value)}
//             className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           >
//             <option value="">Tous les districts</option>
//             {districts.map(d => (
//               <option key={d.id} value={d.id}>{d.nom}</option>
//             ))}
//           </select>

//           {selectedDistrict && (
//             <button
//               onClick={() => setSelectedDistrict('')}
//               className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
//             >
//               Réinitialiser
//             </button>
//           )}
//         </div>

//         {/* Liste des paroisses */}
//         <div className="flex-1 overflow-y-auto p-4 pt-0">
//           <div className="text-xs text-gray-400 mb-2">
//             {filteredParoisses.length} paroisse(s)
//           </div>
//           <div className="space-y-2">
//             {filteredParoisses.map(p => (
//               <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
//                 <div className="font-medium text-sm text-gray-900">{p.nom}</div>
//                 <div className="text-xs text-gray-500 mt-1">
//                   {p.district?.nom || 'District inconnu'}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Bouton pour ouvrir la sidebar si fermée */}
//       {!showSidebar && (
//         <button
//           onClick={() => setShowSidebar(true)}
//           className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
//         >
//           <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//           </svg>
//         </button>
//       )}

//       {/* Carte */}
//       <div className={`flex-1 relative ${!showSidebar ? 'w-full' : ''}`}>
//         <MapWithNoSSR 
//           paroisses={filteredParoisses.map(p => ({
//             id: p.id,
//             nom: p.nom,
//             longitude: p.longitude,
//             latitude: p.latitude,
//             district: p.district ? { nom: p.district.nom } : undefined
//           }))} 
//           center={lubumbashiCoords}
//         />
//       </div>
//     </div>
//   )
// }
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import dynamic from 'next/dynamic'

// Import dynamique du composant carte
const MapWithNoSSR = dynamic(
  () => import('./MapComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-gray-500">Chargement de la carte...</div>
      </div>
    )
  }
)

// Types
type District = {
  id: number
  nom: string
}

type Paroisse = {
  id: number
  nom: string
  longitude: number
  latitude: number
  district?: District | null
  totalFideles: number  // Ajout du compteur de fidèles
}

export default function CarteParoisses() {
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [filteredParoisses, setFilteredParoisses] = useState<Paroisse[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [totalFidelesGlobal, setTotalFidelesGlobal] = useState(0)

  // Coordonnées de Lubumbashi
  const lubumbashiCoords: [number, number] = [-11.6697, 27.4794]

  useEffect(() => {
    chargerDonnees()
  }, [])

  useEffect(() => {
    if (selectedDistrict) {
      const filtered = paroisses.filter(p => 
        p.district?.id === parseInt(selectedDistrict)
      )
      setFilteredParoisses(filtered)
      
      // Calculer le total des fidèles pour le district sélectionné
      const totalDistrict = filtered.reduce((acc, p) => acc + p.totalFideles, 0)
      setTotalFidelesGlobal(totalDistrict)
    } else {
      setFilteredParoisses(paroisses)
      
      // Calculer le total global des fidèles
      const totalGlobal = paroisses.reduce((acc, p) => acc + p.totalFideles, 0)
      setTotalFidelesGlobal(totalGlobal)
    }
  }, [selectedDistrict, paroisses])

  const chargerDonnees = async () => {
    try {
      // Charger les districts
      const { data: districtsData } = await supabase
        .from('district')
        .select('id, nom')
        .order('nom')

      setDistricts(districtsData || [])

      // Charger les paroisses avec leurs district_id
      const { data: paroissesData, error } = await supabase
        .from('paroisse')
        .select('id, nom, longitude, latitude, district_id')
        .not('longitude', 'is', null)
        .not('latitude', 'is', null)

      if (error) throw error

      // Pour chaque paroisse, charger son district et compter ses fidèles
      const paroissesAvecDistrictEtFideles: Paroisse[] = await Promise.all(
        (paroissesData || []).map(async (p) => {
          // Charger le district
          let district = null
          if (p.district_id) {
            const { data: districtData } = await supabase
              .from('district')
              .select('id, nom')
              .eq('id', p.district_id)
              .single()
            
            district = districtData
          }

          // Compter les fidèles de cette paroisse
          const { count: totalFideles, error: countError } = await supabase
            .from('fidele_paroisse')
            .select('*', { count: 'exact', head: true })
            .eq('paroisse_id', p.id)

          if (countError) {
            console.error(`Erreur comptage fidèles pour ${p.nom}:`, countError)
          }

          return {
            id: p.id,
            nom: p.nom,
            longitude: p.longitude,
            latitude: p.latitude,
            district,
            totalFideles: totalFideles || 0
          }
        })
      )

      // Calculer le total global
      const totalGlobal = paroissesAvecDistrictEtFideles.reduce((acc, p) => acc + p.totalFideles, 0)
      setTotalFidelesGlobal(totalGlobal)
      
      console.log('Paroisses avec districts et fidèles:', paroissesAvecDistrictEtFideles)
      setParoisses(paroissesAvecDistrictEtFideles)
      setFilteredParoisses(paroissesAvecDistrictEtFideles)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-gray-500">Chargement des données...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex relative">
      {/* Sidebar des filtres */}
      <div className={`${showSidebar ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden flex flex-col h-full`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Paroisses</h2>
            <button 
              onClick={() => setShowSidebar(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          <label className="block text-xs text-gray-400 uppercase mb-2">
            Filtrer par district
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tous les districts</option>
            {districts.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>

          {selectedDistrict && (
            <button
              onClick={() => setSelectedDistrict('')}
              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
            >
              Réinitialiser
            </button>
          )}

          {/* Total des fidèles */}
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <div className="text-xs font-light">
              Total Fidèles
            <span className="text-xs ml-1 text-indigo-500 mt-">
             ({selectedDistrict ? 'dans ce district' : 'tous districts confondus'})
            </span>
            </div>
            <div className="text-xl font-light text-indigo-700">
              {totalFidelesGlobal.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Liste des paroisses */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          <div className="text-xs text-gray-400 mb-2">
            {filteredParoisses.length} paroisse(s)
          </div>
          <div className="space-y-2">
            {filteredParoisses.map(p => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm line-clamp-1 text-gray-900">{p.nom}</div>
                  <div className="text-xs flex-shrink-0 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                    {p.totalFideles} fidèles
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {p.district?.nom || 'District inconnu'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bouton pour ouvrir la sidebar si fermée */}
      {!showSidebar && (
        <button
          onClick={() => setShowSidebar(true)}
          className="absolute top-4 left-4 z-10 bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Carte */}
      <div className={`flex-1 relative ${!showSidebar ? 'w-full' : ''}`}>
        <MapWithNoSSR 
          paroisses={filteredParoisses.map(p => ({
            id: p.id,
            nom: p.nom,
            longitude: p.longitude,
            latitude: p.latitude,
             totalFideles: p.totalFideles, 
            district: p.district ? { nom: p.district.nom } : undefined
          }))} 
          center={lubumbashiCoords}
        />
      </div>
    </div>
  )
}