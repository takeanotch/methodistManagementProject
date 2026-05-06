

// app/hebdo/[id]/page.tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getHebdoById, getUserParoisse, getHierarchyForHeader } from '@/actions/hebdo'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { 
  ChevronLeft,
  Calendar, 
  Church, 
  User, 
  Users,
  Pencil,
  Circle
} from 'lucide-react'
import ExportPDFButton from './ExportPDFButton'

export const dynamic = 'force-dynamic'

function parseOfficiants(officiantsText: string | null): string[] {
  if (!officiantsText) return []
  
  return officiantsText
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

// Fonction améliorée pour convertir le markdown en HTML
function markdownToHtml(markdown: string): string {
  if (!markdown) return ''
  
  // Échapper d'abord les entités HTML pour éviter les conflits
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  
  // Fonction récursive pour appliquer les formats inline
  const applyInlineFormats = (text: string): string => {
    let result = text
    
    // Appliquer les formats dans l'ordre : highlight > bold > italic > underline
    // Chaque format peut contenir d'autres formats
    
    // Highlight
    result = result.replace(/==(.+?)==/g, (_, content) => {
      return `<mark style="background-color: #FEF08A; padding: 0 3px; border-radius: 2px; color: #111;">${applyInlineFormats(content)}</mark>`
    })
    
    // Bold
    result = result.replace(/\*\*(.+?)\*\*/g, (_, content) => {
      return `<strong style="font-weight: 600; color: #111;">${applyInlineFormats(content)}</strong>`
    })
    
    // Italic
    result = result.replace(/\*(.+?)\*/g, (_, content) => {
      return `<em style="font-style: italic; color: #374151;">${applyInlineFormats(content)}</em>`
    })
    
    // Underline
    result = result.replace(/__(.+?)__/g, (_, content) => {
      return `<u style="text-decoration: underline; color: #374151;">${applyInlineFormats(content)}</u>`
    })
    
    return result
  }
  
  // Traiter ligne par ligne
  const lines = html.split('\n')
  let result = ''
  let inList = false
  
  lines.forEach((line, index) => {
    // Titre
    if (/^## (.+)/.test(line)) {
      if (inList) {
        result += '</ul>'
        inList = false
      }
      const content = line.replace(/^## /, '')
      result += `<h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 12px 0 6px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">${applyInlineFormats(content)}</h2>`
      return
    }
    
    // Liste
    if (/^- (.+)/.test(line)) {
      if (!inList) {
        result += '<ul style="list-style-type: none; padding-left: 0; margin: 4px 0;">'
        inList = true
      }
      const content = line.replace(/^- /, '')
      result += `<li style="padding-left: 20px; margin: 2px 0; color: #374151; position: relative;"><span style="position: absolute; left: 4px;">•</span><span>${applyInlineFormats(content)}</span></li>`
      return
    }
    
    // Si on sort d'une liste
    if (inList) {
      result += '</ul>'
      inList = false
    }
    
    // Ligne vide
    if (line.trim() === '') {
      result += '<div style="height: 8px;"></div>'
      return
    }
    
    // Paragraphe normal avec formatage inline
    result += `<p style="margin: 2px 0; color: #374151; line-height: 1.6;">${applyInlineFormats(line)}</p>`
  })
  
  // Fermer la liste si elle était encore ouverte
  if (inList) {
    result += '</ul>'
  }
  
  return result
}

function SafeHTML({ html, className = '' }: { html: string; className?: string }) {
  // Si le HTML contient déjà des balises (vient du SimpleFormattedEditor)
  // on le rend tel quel, sinon on convertit le markdown
  const containsHtml = /<[a-z][\s\S]*>/i.test(html)
  const renderedHtml = containsHtml ? html : markdownToHtml(html)
  
  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word'
      }}
    />
  )
}

async function HebdoDetail({ id }: { id: number }) {
  const [hebdo, paroisse] = await Promise.all([
    getHebdoById(id),
    getUserParoisse()
  ])

  if (!hebdo) {
    notFound()
  }

  const hierarchy = await getHierarchyForHeader(hebdo.paroisse_id)
  const isOwner = paroisse?.id === hebdo.paroisse_id
  const officiantsList = parseOfficiants(hebdo.officiants)

  // Préparer les sections avec leur HTML
  const sectionsWithHtml = hebdo.sections?.map(section => ({
    ...section,
    description_html: section.description ? markdownToHtml(section.description) : null
  }))

  // const pdfData = {
  //   title: hebdo.numero,
  //   date: hebdo.date_emission,
  //   theme: hebdo.theme,
  //   predicateur: hebdo.predicateur,
  //   officiants: officiantsList,
  //   activites: hebdo.activites_speciales ? markdownToHtml(hebdo.activites_speciales) : null,
  //   sections: sectionsWithHtml?.map(s => ({
  //     ...s,
  //     description: s.description_html || s.description
  //   })),
  //   hierarchy,
  //   paroisse: hebdo.paroisse
  // }
const pdfData = {
  title: hebdo.numero,
  date: hebdo.date_emission,
  theme: hebdo.theme,
  predicateur: hebdo.predicateur,
  officiants: officiantsList,
  // Pour le PDF, on passe directement le markdown, pas du HTML
  activites: hebdo.activites_speciales,  // Markdown brut
  sections: hebdo.sections?.map(s => ({
    ...s,
    description: s.description  // Markdown brut pour le PDF
  })),
  hierarchy,
  paroisse: hebdo.paroisse
}
  return (
    <div className="max-w-5xl mx-auto">
      {/* En-tête avec navigation */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/hebdo"
            className="text-gray-400 hover:text-black transition-colors"
          >
            <ChevronLeft size={20} />
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-light tracking-wide">
                {hebdo.numero}
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {hebdo.paroisse?.nom}
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

      {/* Date et actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-gray-400" />
          <span className="text-base font-light text-gray-700 capitalize">
            {format(new Date(hebdo.date_emission), 'EEEE d MMMM yyyy', { locale: fr })}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <ExportPDFButton hebdo={pdfData} />
          
          {isOwner && (
            <Link 
              href={`/hebdo/${id}/modifier`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm transition-colors"
            >
              <Pencil size={16} />
              Modifier
            </Link>
          )}
        </div>
      </div>

      {/* Carte Culte */}
      <div className="border border-gray-200 bg-white mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
          <Church size={18} className="text-gray-400" />
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Culte</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {hebdo.theme && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Thème</h3>
              <p className="text-lg text-gray-900 font-light">{hebdo.theme}</p>
            </div>
          )}
          
          {hebdo.predicateur && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
                <User size={14} />
                Prédicateur
              </h3>
              <p className="text-gray-700">{hebdo.predicateur}</p>
            </div>
          )}
          
          {officiantsList.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <Users size={14} />
                Officiants
              </h3>
              <ul className="space-y-1">
                {officiantsList.map((officiant, index) => (
                  <li key={index} className="flex items-start text-gray-700">
                    <Circle size={6} className="text-gray-300 mt-2 mr-3 flex-shrink-0 fill-current" />
                    <span>{officiant}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {hebdo.activites_speciales && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Activités spéciales</h3>
              <SafeHTML html={hebdo.activites_speciales} />
            </div>
          )}
          
          {!hebdo.theme && !hebdo.predicateur && officiantsList.length === 0 && !hebdo.activites_speciales && (
            <p className="text-gray-400 text-center py-12">Aucune information de culte renseignée</p>
          )}
        </div>
      </div>

      {/* Sections additionnelles */}
      {sectionsWithHtml && sectionsWithHtml.length > 0 && (
        <div className="border border-gray-200 bg-white p-8 mb-8">
          <div className="space-y-10">
            {sectionsWithHtml.map((section) => (
              <div key={section.id}>
                <h3 className="text-base font-light text-gray-900 mb-5 pb-2 border-b border-gray-200">
                  {section.titre}
                </h3>
                {section.description ? (
                  <SafeHTML html={section.description} />
                ) : (
                  <p className="text-gray-400 italic">Aucun contenu</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Métadonnées */}
      <div className="text-xs text-gray-400 pt-4 border-t border-gray-200">
        <p>
          Créé le {format(new Date(hebdo.created_at), 'dd/MM/yyyy à HH:mm')}
          {hebdo.updated_at !== hebdo.created_at && (
            <> · Modifié le {format(new Date(hebdo.updated_at), 'dd/MM/yyyy à HH:mm')}</>
          )}
        </p>
      </div>
    </div>
  )
}

// Skeleton pour le chargement
function HebdoDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-48"></div>
          </div>
        </div>
        <div className="flex gap-2 ml-10">
          <div className="h-3 bg-gray-100 rounded w-20"></div>
          <div className="h-3 bg-gray-100 rounded w-24"></div>
          <div className="h-3 bg-gray-100 rounded w-20"></div>
        </div>
      </div>

      <div className="flex justify-between mb-8">
        <div className="h-6 bg-gray-200 rounded w-64"></div>
        <div className="flex gap-3">
          <div className="h-9 w-24 bg-gray-200 rounded"></div>
          <div className="h-9 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="border border-gray-200 bg-white mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="p-6 space-y-6">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export default async function HebdoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <Suspense fallback={<HebdoDetailSkeleton />}>
      <HebdoDetail id={parseInt(id)} />
    </Suspense>
  )
}