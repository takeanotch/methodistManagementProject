// components/MapComponent.tsx
'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapComponentProps {
  paroisses: Array<{
    totalFideles: number
    id: number
    nom: string
    longitude: number
    latitude: number
    district?: {
      nom: string
    }
  }>
  center: [number, number]
}

export default function MapComponent({ paroisses, center }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialiser la carte uniquement côté client
    if (!mapContainerRef.current) return

    // Créer l'icône d'église
    const churchIcon = L.icon({
      iconUrl: '/church.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      shadowSize: [41, 41],
      shadowAnchor: [13, 41]
    })

    // Initialiser la carte
    mapRef.current = L.map(mapContainerRef.current).setView(center, 12)

    // Ajouter les tuiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapRef.current)

    // Ajouter les marqueurs
    paroisses.forEach((paroisse) => {
      const marker = L.marker(
        [paroisse.latitude, paroisse.longitude],
        { icon: churchIcon }
      ).addTo(mapRef.current!)

     marker.bindPopup(`
  <div style="text-align: center; min-width: 150px;">
    <strong style="font-size: 14px; display: block; margin-bottom: 4px;">${paroisse.nom}</strong>
    <div style="font-size: 12px; color: #666; margin: 4px 0;">
      ${paroisse.district?.nom || 'District inconnu'}
    </div>
    <div style="font-size: 12px; color: #4f46e5; font-weight: 600; margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
      👥 ${paroisse.totalFideles || 0} fidèles
    </div>
  </div>
`)
    })

    // Nettoyage
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
      }
    }
  }, [paroisses, center])

  return <div ref={mapContainerRef} className='w-full h-full z-10' style={{ height: '100%', width: '100%' }} />
}