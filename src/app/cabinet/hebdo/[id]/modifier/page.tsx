'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getHebdoById, updateHebdo, getUserParoisse, getHierarchyForHeader } from '@/actions/hebdo'
import { use } from 'react'
import { ChevronLeft,Plus, X, Circle, Calendar, Church, User, Users, FileText } from 'lucide-react'
import Link from 'next/link'
import TipTapEditor from '@/components/TipTapEditor'

interface Section {
  id?: number | string
  titre: string
  description: string
}

interface HebdoData {
  id: number
  paroisse_id: number
  numero: string
  date_emission: string
  theme: string | null
  predicateur: string | null
  officiants: string | null
  activites_speciales: string | null
  created_at: string
  updated_at: string
  sections?: {
    id: number
    hebdo_id: number
    titre: string
    description: string | null
    ordre: number
    created_at: string
  }[]
  paroisse?: {
    id: number
    nom: string
  }
}

export default function ModifierHebdoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const hebdoId = parseInt(id)
  
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')
  const [paroisse, setParoisse] = useState<any>(null)
  const [hierarchy, setHierarchy] = useState<any>({ region: '', conference: '', district: '' })
  
  const [formData, setFormData] = useState({
    numero: '',
    date_emission: '',
    theme: '',
    predicateur: '',
    officiants: '',
    activites_speciales: ''
  })
  
  const [sections, setSections] = useState<Section[]>([])

  useEffect(() => {
    loadData()
  }, [hebdoId])

  async function loadData() {
    const [hebdo, p] = await Promise.all([
      getHebdoById(hebdoId) as Promise<HebdoData | null>,
      getUserParoisse()
    ])
    
    if (!hebdo || !p) {
      router.push('/hebdo')
      return
    }
    
    // Vérifier que l'utilisateur a le droit de modifier
    if (hebdo.paroisse_id !== p.id) {
      router.push('/hebdo')
      return
    }
    
    setParoisse(p)
    setFormData({
      numero: hebdo.numero,
      date_emission: hebdo.date_emission,
      theme: hebdo.theme || '',
      predicateur: hebdo.predicateur || '',
      officiants: hebdo.officiants || '',
      activites_speciales: hebdo.activites_speciales || ''
    })
    
    // Convertir les sections existantes
    const convertedSections: Section[] = (hebdo.sections || []).map(section => ({
      id: section.id,
      titre: section.titre,
      description: section.description || ''
    }))
    
    setSections(convertedSections)
    
    const h = await getHierarchyForHeader(hebdo.paroisse_id)
    setHierarchy(h)
    
    setLoadingData(false)
  }

  function addSection() {
    const newSection: Section = {
      id: `section-${Date.now()}`,
      titre: '',
      description: ''
    }
    setSections([...sections, newSection])
  }

  function removeSection(index: number) {
    setSections(sections.filter((_, i) => i !== index))
  }

  function updateSection(index: number, field: keyof Section, value: string) {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    setSections(updated)
  }

  function formatOfficiantsList(officiantsText: string): string[] {
    if (!officiantsText.trim()) return []
    
    return officiantsText
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData()
    form.append('id', hebdoId.toString())
    form.append('numero', formData.numero)
    form.append('date_emission', formData.date_emission)
    form.append('theme', formData.theme)
    form.append('predicateur', formData.predicateur)
    form.append('officiants', formData.officiants)
    form.append('activites_speciales', formData.activites_speciales)
    
    const sectionsToSave = sections.map(({ titre, description }) => ({ titre, description }))
    form.append('sections', JSON.stringify(sectionsToSave.filter(s => s.titre.trim())))

    const result = await updateHebdo(form)

    if (result.error) {
      setError(result.error)
    } else {
      router.push(`/hebdo/${hebdoId}`)
    }
    
    setLoading(false)
  }

  const officiantsList = formatOfficiantsList(formData.officiants)

  if (loadingData) {
    return (
      <div className="max-w-5xl mx-auto animate-pulse">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-80 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-64"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* En-tête avec navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={`/hebdo/${hebdoId}`}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <ChevronLeft size={20} />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mt-1">
                <h1 className="text-2xl font-light tracking-wide">
                  Modifier l'hebdomadaire
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {paroisse.nom}
              </p>
            </div>
          </div>
          
          {/* Fil d'Ariane */}
          <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
            <span>{hierarchy.region}</span>
            <span>•</span>
            <span>{hierarchy.conference}</span>
            <span>•</span>
            <span>{hierarchy.district}</span>
          </div>
        </div>

        {/* Informations de base */}
        <div className="border border-gray-200 bg-white mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Informations générales
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Numéro <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} />
                    Date d'émission <span className="text-red-400">*</span>
                  </span>
                </label>
                <input
                  type="date"
                  value={formData.date_emission}
                  onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Informations du culte */}
        <div className="border border-gray-200 bg-white mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Church size={16} />
              Informations du culte
            </h2>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Thème */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                Thème
              </label>
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="Thème du culte"
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            
            {/* Prédicateur */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <User size={14} />
                Prédicateur
              </label>
              <input
                type="text"
                value={formData.predicateur}
                onChange={(e) => setFormData({ ...formData, predicateur: e.target.value })}
                placeholder="Nom du prédicateur"
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
            
            {/* Officiants */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <Users size={14} />
                Officiants
              </label>
              <textarea
                value={formData.officiants}
                onChange={(e) => setFormData({ ...formData, officiants: e.target.value })}
                placeholder="Pasteur Jean, Diacre Marie, Frère Paul"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">
                Séparez les noms par des virgules
              </p>
              
              {officiantsList.length > 0 && (
                <div className="mt-3 p-4 bg-gray-50 border border-gray-200">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Aperçu des officiants
                  </p>
                  <ul className="space-y-1">
                    {officiantsList.map((officiant, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-700">
                        <Circle size={6} className="text-gray-300 mt-2 mr-3 flex-shrink-0 fill-current" />
                        {officiant}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Activités spéciales */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                Activités spéciales
              </label>
              <textarea
                value={formData.activites_speciales}
                onChange={(e) => setFormData({ ...formData, activites_speciales: e.target.value })}
                placeholder="Activités spéciales de la semaine"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-y"
              />
            </div>
          </div>
        </div>

        {/* Sections additionnelles */}
        <div className="border border-gray-200 bg-white mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} />
              Sections additionnelles
            </h2>
            <button
              type="button"
              onClick={addSection}
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
              Ajouter une section
            </button>
          </div>
          
          <div className="p-6">
            {sections.length === 0 ? (
              <div className="py-12 text-center">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">
                  Aucune section additionnelle
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Cliquez sur "Ajouter une section" pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id || index} className="border border-gray-200 p-5 relative">
                    <button
                      type="button"
                      onClick={() => removeSection(index)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Supprimer la section"
                    >
                      <X size={16} />
                    </button>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                          Titre de la section
                        </label>
                        <input
                          type="text"
                          value={section.titre}
                          onChange={(e) => updateSection(index, 'titre', e.target.value)}
                          placeholder="Ex: Annonces, Programme de la semaine, etc."
                          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                          Contenu
                        </label>
                        <div className="border border-gray-300 focus-within:border-gray-400 transition-colors">
                          <TipTapEditor
                            value={section.description}
                            onChange={(html) => updateSection(index, 'description', html)}
                            placeholder="Rédigez votre contenu ici..."
                            minHeight="200px"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 text-sm">
            {error}
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Link
            href={`/hebdo/${hebdoId}`}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Mise à jour...
              </>
            ) : (
              'Mettre à jour'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}