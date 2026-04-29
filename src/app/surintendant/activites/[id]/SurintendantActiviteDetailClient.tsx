// app/surintendant/activites/[id]/SurintendantActiviteDetailClient.tsx
'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, FileText, Image, Paperclip, CheckCircle, XCircle, PlayCircle } from 'lucide-react'

interface SurintendantActiviteDetailClientProps {
  surintendantInfo: {
    id: number
    fidele_id: number
    district_id: number
    district_nom: string
    fidele_nom: string
    fidele_prenom: string
  }
  activite: {
    id: number
    titre: string
    description: string | null
    date: string
    heure: string
    statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
    created_at: string
    unite?: {
      id: number
      nom: string
      niveau: string
      reference_id: number
    }
    plan_action?: {
      id: number
      titre: string
    } | null
    annee_conference?: {
      id: number
      annee?: {
        label: string
      }
    }
  }
  fichiers: any[]
}

export default function SurintendantActiviteDetailClient({
  surintendantInfo,
  activite,
  fichiers
}: SurintendantActiviteDetailClientProps) {
  
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'planifie':
        return { label: 'Planifiée', color: 'bg-gray-100 text-gray-700', icon: Calendar }
      case 'en_cours':
        return { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: PlayCircle }
      case 'termine':
        return { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'annule':
        return { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle }
      default:
        return { label: statut, color: 'bg-gray-100 text-gray-700', icon: Calendar }
    }
  }

  const statutInfo = getStatutBadge(activite.statut)
  const StatutIcon = statutInfo.icon

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getFileIcon = (type: string) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    if (imageTypes.includes(type)) return Image
    return Paperclip
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Fil d'Ariane */}
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/surintendant" className="text-gray-500 hover:text-gray-700">
          Surintendance
        </Link>
        <span className="text-gray-400">/</span>
        <Link href={`/surintendant/departements/${activite.unite?.reference_id}`} className="text-gray-500 hover:text-gray-700">
          Département
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">{activite.titre}</span>
      </div>

      {/* Bouton retour */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Retour</span>
        </button>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-emerald-100">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-light text-gray-900 mb-2">{activite.titre}</h1>
              {activite.plan_action && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Plan d'action:</span>
                  <span className="text-emerald-600">
                    {activite.plan_action.titre}
                  </span>
                </div>
              )}
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statutInfo.color} self-start`}>
              <StatutIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{statutInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(activite.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Heure</p>
                <p className="text-sm font-medium text-gray-900">{activite.heure}</p>
              </div>
            </div>
          </div>

          {activite.description && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{activite.description}</p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-6 mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Paroisse:</span>
                <span className="ml-2 text-gray-900">{activite.unite?.nom || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Année:</span>
                <span className="ml-2 text-gray-900">{activite.annee_conference?.annee?.label || '-'}</span>
              </div>
            </div>
          </div>

          {fichiers.length > 0 && (
            <div className="border-t border-gray-100 pt-6 mt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Fichiers joints ({fichiers.length})</h3>
              <div className="space-y-2">
                {fichiers.map((fichier) => {
                  const FileIcon = getFileIcon(fichier.type_fichier)
                  return (
                    <a
                      key={fichier.id}
                      href={fichier.chemin_fichier}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileIcon className="w-5 h-5 text-emerald-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{fichier.nom_fichier}</p>
                        <p className="text-xs text-gray-400">{fichier.type_fichier?.toUpperCase()}</p>
                      </div>
                      <span className="text-xs text-emerald-600">Ouvrir</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}