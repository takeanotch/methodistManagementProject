
// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { createHebdo, getUserParoisse, getHierarchyForHeader, generateNextHebdoNumber } from '@/actions/hebdo'
// import { format } from 'date-fns'
// import { ChevronLeft, Plus, X, Circle, Calendar, Church, User, Users, FileText } from 'lucide-react'
// import Link from 'next/link'
// import TipTapEditor from '@/components/TipTapEditor'

// interface Section {
//   id: string
//   titre: string
//   description: string
// }

// export default function NouvelHebdoPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [paroisse, setParoisse] = useState<any>(null)
//   const [hierarchy, setHierarchy] = useState<any>({ region: '', conference: '', district: '' })
//   const [nextNumber, setNextNumber] = useState('')
  
//   const [formData, setFormData] = useState({
//     numero: '',
//     date_emission: format(new Date(), 'yyyy-MM-dd'),
//     theme: '',
//     predicateur: '',
//     officiants: '',
//     activites_speciales: ''
//   })
  
//   const [sections, setSections] = useState<Section[]>([])

//   useEffect(() => {
//     loadData()
//   }, [])

//   async function loadData() {
//     const p = await getUserParoisse()
//     setParoisse(p)
    
//     if (p) {
//       const [h, num] = await Promise.all([
//         getHierarchyForHeader(p.id),
//         generateNextHebdoNumber(p.id)
//       ])
//       setHierarchy(h)
//       setNextNumber(num)
//       setFormData(prev => ({ ...prev, numero: num }))
//     }
//   }

//   function addSection() {
//     const newSection: Section = {
//       id: `section-${Date.now()}`,
//       titre: '',
//       description: ''
//     }
//     setSections([...sections, newSection])
//   }

//   function removeSection(index: number) {
//     setSections(sections.filter((_, i) => i !== index))
//   }

//   function updateSection(index: number, field: keyof Section, value: string) {
//     const updated = [...sections]
//     updated[index] = { ...updated[index], [field]: value }
//     setSections(updated)
//   }

//   function formatOfficiantsList(officiantsText: string): string[] {
//     if (!officiantsText.trim()) return []
    
//     return officiantsText
//       .split(',')
//       .map(item => item.trim())
//       .filter(item => item.length > 0)
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     const form = new FormData()
//     form.append('numero', formData.numero)
//     form.append('date_emission', formData.date_emission)
//     form.append('theme', formData.theme)
//     form.append('predicateur', formData.predicateur)
//     form.append('officiants', formData.officiants)
//     form.append('activites_speciales', formData.activites_speciales)
    
//     const sectionsToSave = sections.map(({ titre, description }) => ({ titre, description }))
//     form.append('sections', JSON.stringify(sectionsToSave.filter(s => s.titre.trim())))

//     const result = await createHebdo(form)

//     if (result.error) {
//       setError(result.error)
//     } else {
//       router.push(`/hebdo/${result.id}`)
//     }
    
//     setLoading(false)
//   }

//   const officiantsList = formatOfficiantsList(formData.officiants)

//   if (!paroisse) {
//     return (
//       <div className="max-w-7xl mx-auto animate-pulse">
//         <div className="mb-6">
//           <div className="flex items-center gap-4 mb-2">
//             <div className="w-5 h-5 bg-gray-200 rounded"></div>
//             <div className="flex-1">
//               <div className="h-8 bg-gray-200 rounded w-80 mb-2"></div>
//               <div className="h-4 bg-gray-100 rounded w-64"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-5xl mx-auto">
//       <form onSubmit={handleSubmit}>
//         {/* En-tête avec navigation */}
//         <div className="mb-8">
//           <div className="flex items-center gap-4 mb-2">
//             <Link
//               href="/hebdo"
//               className="text-gray-400 hover:text-black transition-colors"
//             >
//               <ChevronLeft size={20} />
//             </Link>
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mt-1">
//                 <h1 className="text-2xl font-light tracking-wide">
//                   Nouvel Hebdomadaire
//                 </h1>
//               </div>
//               <p className="text-sm text-gray-500 mt-0.5">
//                 {paroisse.nom}
//               </p>
//             </div>
//           </div>
          
//           {/* Fil d'Ariane */}
//           <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
//             <span>{hierarchy.region}</span>
//             <span>•</span>
//             <span>{hierarchy.conference}</span>
//             <span>•</span>
//             <span>{hierarchy.district}</span>
//           </div>
//         </div>

//         {/* Informations de base */}
//         <div className="border border-gray-200 bg-white mb-6">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//               Informations générales
//             </h2>
//           </div>
          
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                   Numéro <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.numero}
//                   onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                   placeholder={nextNumber}
//                 />
//                 {nextNumber && formData.numero === nextNumber && (
//                   <p className="text-xs text-gray-400 mt-1">Numéro généré automatiquement</p>
//                 )}
//               </div>
              
//               <div>
//                 <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                   <span className="flex items-center gap-2">
//                     <Calendar size={14} />
//                     Date d'émission <span className="text-red-400">*</span>
//                   </span>
//                 </label>
//                 <input
//                   type="date"
//                   value={formData.date_emission}
//                   onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Informations du culte */}
//         <div className="border border-gray-200 bg-white mb-6">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
//               <Church size={16} />
//               Informations du culte
//             </h2>
//           </div>
          
//           <div className="p-6 space-y-6">
//             {/* Thème */}
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                 Thème
//               </label>
//               <input
//                 type="text"
//                 value={formData.theme}
//                 onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
//                 placeholder="Thème du culte"
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//               />
//             </div>
            
//             {/* Prédicateur */}
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
//                 <User size={14} />
//                 Prédicateur
//               </label>
//               <input
//                 type="text"
//                 value={formData.predicateur}
//                 onChange={(e) => setFormData({ ...formData, predicateur: e.target.value })}
//                 placeholder="Nom du prédicateur"
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//               />
//             </div>
            
//             {/* Officiants */}
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
//                 <Users size={14} />
//                 Officiants
//               </label>
//               <textarea
//                 value={formData.officiants}
//                 onChange={(e) => setFormData({ ...formData, officiants: e.target.value })}
//                 placeholder="Pasteur Jean, Diacre Marie, Frère Paul"
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-y"
//               />
//               <p className="text-xs text-gray-400 mt-1">
//                 Séparez les noms par des virgules
//               </p>
              
//               {officiantsList.length > 0 && (
//                 <div className="mt-3 p-4 bg-gray-50 border border-gray-200">
//                   <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
//                     Aperçu des officiants
//                   </p>
//                   <ul className="space-y-1">
//                     {officiantsList.map((officiant, index) => (
//                       <li key={index} className="flex items-start text-sm text-gray-700">
//                         <Circle size={6} className="text-gray-300 mt-2 mr-3 flex-shrink-0 fill-current" />
//                         {officiant}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
            
//             {/* Activités spéciales */}
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                 Activités spéciales
//               </label>
//               <textarea
//                 value={formData.activites_speciales}
//                 onChange={(e) => setFormData({ ...formData, activites_speciales: e.target.value })}
//                 placeholder="Activités spéciales de la semaine"
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-y"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Sections additionnelles */}
//         <div className="border border-gray-200 bg-white mb-6">
//           <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
//               <FileText size={16} />
//               Sections additionnelles
//             </h2>
//             <button
//               type="button"
//               onClick={addSection}
//               className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
//             >
//               <Plus size={14} />
//               Ajouter une section
//             </button>
//           </div>
          
//           <div className="p-6">
//             {sections.length === 0 ? (
//               <div className="py-12 text-center">
//                 <FileText size={32} className="mx-auto text-gray-300 mb-2" />
//                 <p className="text-sm text-gray-400">
//                   Aucune section additionnelle
//                 </p>
//                 <p className="text-xs text-gray-300 mt-1">
//                   Cliquez sur "Ajouter une section" pour commencer
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {sections.map((section, index) => (
//                   <div key={section.id} className="border border-gray-200 p-5 relative">
//                     <button
//                       type="button"
//                       onClick={() => removeSection(index)}
//                       className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1"
//                       title="Supprimer la section"
//                     >
//                       <X size={16} />
//                     </button>
                    
//                     <div className="space-y-4">
//                       <div>
//                         <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                           Titre de la section
//                         </label>
//                         <input
//                           type="text"
//                           value={section.titre}
//                           onChange={(e) => updateSection(index, 'titre', e.target.value)}
//                           placeholder="Ex: Annonces, Programme de la semaine, etc."
//                           className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                         />
//                       </div>
                      
//                       <div>
//                         <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                           Contenu
//                         </label>
//                         <div className="border border-gray-300 focus-within:border-gray-400 transition-colors">
//                           <TipTapEditor
//                             value={section.description}
//                             onChange={(html) => updateSection(index, 'description', html)}
//                             placeholder="Rédigez votre contenu ici..."
//                             minHeight="200px"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Message d'erreur */}
//         {error && (
//           <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 text-sm">
//             {error}
//           </div>
//         )}
        
//         {/* Actions */}
//         <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
//           <Link
//             href="/hebdo"
//             className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
//           >
//             Annuler
//           </Link>
//           <button
//             type="submit"
//             disabled={loading}
//             className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
//           >
//             {loading ? (
//               <>
//                 <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
//                 Création...
//               </>
//             ) : (
//               'Créer l\'hebdo'
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }


// 'use client'

// import { useState, useEffect } from 'react'
// import { useRouter } from 'next/navigation'
// import { createHebdo, getUserParoisse, getHierarchyForHeader, generateNextHebdoNumber } from '@/actions/hebdo'
// import { getActivitesByUnite } from '@/actions/activite'
// import { supabase } from '@/lib/supabase'
// import { format } from 'date-fns'
// import { ChevronLeft, Plus, X, Circle, Calendar, Church, User, Users, FileText, CalendarCheck } from 'lucide-react'
// import Link from 'next/link'
// import TipTapEditor from '@/components/TipTapEditor'

// interface Section {
//   id: string
//   titre: string
//   description: string
// }

// interface Activite {
//   id: number
//   titre: string
//   description: string | null
//   date: string
//   heure: string
//   statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
//   unite_id: number
// }

// export default function NouvelHebdoPage() {
//   const router = useRouter()
//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [paroisse, setParoisse] = useState<any>(null)
//   const [hierarchy, setHierarchy] = useState<any>({ region: '', conference: '', district: '' })
//   const [nextNumber, setNextNumber] = useState('')
//   const [activites, setActivites] = useState<Activite[]>([])
//   const [selectedActivites, setSelectedActivites] = useState<number[]>([])
//   const [showActivitesSelector, setShowActivitesSelector] = useState(false)
  
//   const [formData, setFormData] = useState({
//     numero: '',
//     date_emission: format(new Date(), 'yyyy-MM-dd'),
//     theme: '',
//     predicateur: '',
//     officiants: '',
//     activites_speciales: ''
//   })
  
//   const [sections, setSections] = useState<Section[]>([])

//   useEffect(() => {
//     loadData()
//   }, [])

//   async function loadData() {
//     const p = await getUserParoisse()
//     setParoisse(p)
    
//     if (p) {
//       const [h, num] = await Promise.all([
//         getHierarchyForHeader(p.id),
//         generateNextHebdoNumber(p.id)
//       ])
//       setHierarchy(h)
//       setNextNumber(num)
//       setFormData(prev => ({ ...prev, numero: num }))
      
//       // Charger les activités de la paroisse
//       await loadActivites(p.id)
//     }
//   }

//   async function loadActivites(paroisseId: number) {
//     try {
//       const { data: unites } = await supabase
//         .from('unite_organisation')
//         .select('id')
//         .eq('id_niveau', paroisseId)
      
//       if (unites && unites.length > 0) {
//         const allActivites: Activite[] = []
//         for (const unite of unites) {
//           const activitesUnite = await getActivitesByUnite(unite.id)
//           allActivites.push(...activitesUnite)
//         }
//         setActivites(allActivites)
//       }
//     } catch (error) {
//       console.error('Erreur chargement activités:', error)
//     }
//   }

//   function addSection() {
//     const newSection: Section = {
//       id: `section-${Date.now()}`,
//       titre: '',
//       description: ''
//     }
//     setSections([...sections, newSection])
//   }

//   function removeSection(index: number) {
//     setSections(sections.filter((_, i) => i !== index))
//   }

//   function updateSection(index: number, field: keyof Section, value: string) {
//     const updated = [...sections]
//     updated[index] = { ...updated[index], [field]: value }
//     setSections(updated)
//   }

//   function toggleActiviteSelection(activiteId: number) {
//     setSelectedActivites(prev => 
//       prev.includes(activiteId)
//         ? prev.filter(id => id !== activiteId)
//         : [...prev, activiteId]
//     )
//   }

//  function addActivitesSection() {
//     if (selectedActivites.length === 0) return

//     const activitesSelectionnees = activites.filter(a => selectedActivites.includes(a.id))
    
//     const activitesHTML = activitesSelectionnees.map(activite => {
//       const dateFormatee = format(new Date(activite.date), 'dd/MM/yyyy')
//       const statut = activite.statut ? ' • ' + activite.statut : ''
//       const description = activite.description ? '<p style="margin-top: 5px; font-size: 14px;">' + activite.description + '</p>' : ''
      
//       return '<div class="activite-item" style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #000;">' +
//         '<h4 style="font-weight: 600; margin-bottom: 5px;">' + activite.titre + '</h4>' +
//         '<p style="color: #666; font-size: 14px;">' +
//         '📅 ' + dateFormatee + ' à ' + activite.heure + statut +
//         '</p>' +
//         description +
//         '</div>'
//     }).join('')

//     const newSection: Section = {
//       id: 'section-' + Date.now(),
//       titre: 'Activités de la semaine',
//       description: '<div class="activites-section"><h3>Programme des activités</h3>' + activitesHTML + '</div>'
//     }
    
//     setSections([...sections, newSection])
//     setShowActivitesSelector(false)
//     setSelectedActivites([])
//   }
//   function formatOfficiantsList(officiantsText: string): string[] {
//     if (!officiantsText.trim()) return []
    
//     return officiantsText
//       .split(',')
//       .map(item => item.trim())
//       .filter(item => item.length > 0)
//   }

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     const form = new FormData()
//     form.append('numero', formData.numero)
//     form.append('date_emission', formData.date_emission)
//     form.append('theme', formData.theme)
//     form.append('predicateur', formData.predicateur)
//     form.append('officiants', formData.officiants)
//     form.append('activites_speciales', formData.activites_speciales)
    
//     const sectionsToSave = sections.map(({ titre, description }) => ({ titre, description }))
//     form.append('sections', JSON.stringify(sectionsToSave.filter(s => s.titre.trim())))

//     const result = await createHebdo(form)

//     if (result.error) {
//       setError(result.error)
//     } else {
//       router.push(`/hebdo/${result.id}`)
//     }
    
//     setLoading(false)
//   }

//   const officiantsList = formatOfficiantsList(formData.officiants)
//   const activitesDisponibles = activites.filter(
//     a => a.statut !== 'termine' && a.statut !== 'annule'
//   )

//   if (!paroisse) {
//     return (
//       <div className="max-w-7xl mx-auto animate-pulse">
//         <div className="mb-6">
//           <div className="flex items-center gap-4 mb-2">
//             <div className="w-5 h-5 bg-gray-200 rounded"></div>
//             <div className="flex-1">
//               <div className="h-8 bg-gray-200 rounded w-80 mb-2"></div>
//               <div className="h-4 bg-gray-100 rounded w-64"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-5xl mx-auto">
//       <form onSubmit={handleSubmit}>
//         {/* En-tête avec navigation */}
//         <div className="mb-8">
//           <div className="flex items-center gap-4 mb-2">
//             <Link
//               href="/hebdo"
//               className="text-gray-400 hover:text-black transition-colors"
//             >
//               <ChevronLeft size={20} />
//             </Link>
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mt-1">
//                 <h1 className="text-2xl font-light tracking-wide">
//                   Nouvel Hebdomadaire
//                 </h1>
//               </div>
//               <p className="text-sm text-gray-500 mt-0.5">
//                 {paroisse.nom}
//               </p>
//             </div>
//           </div>
          
//           {/* Fil d'Ariane */}
//           <div className="flex items-center gap-2 text-xs text-gray-400 ml-10">
//             <span>{hierarchy.region}</span>
//             <span>•</span>
//             <span>{hierarchy.conference}</span>
//             <span>•</span>
//             <span>{hierarchy.district}</span>
//           </div>
//         </div>

//         {/* Informations de base */}
//         <div className="border border-gray-200 bg-white mb-6">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
//               Informations générales
//             </h2>
//           </div>
          
//           <div className="p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div>
//                 <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                   Numéro <span className="text-red-400">*</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={formData.numero}
//                   onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                   placeholder={nextNumber}
//                 />
//                 {nextNumber && formData.numero === nextNumber && (
//                   <p className="text-xs text-gray-400 mt-1">Numéro généré automatiquement</p>
//                 )}
//               </div>
              
//               <div>
//                 <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                   <span className="flex items-center gap-2">
//                     <Calendar size={14} />
//                     Date d'émission <span className="text-red-400">*</span>
//                   </span>
//                 </label>
//                 <input
//                   type="date"
//                   value={formData.date_emission}
//                   onChange={(e) => setFormData({ ...formData, date_emission: e.target.value })}
//                   required
//                   className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Informations du culte */}
//         <div className="border border-gray-200 bg-white mb-6">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
//               <Church size={16} />
//               Informations du culte
//             </h2>
//           </div>
          
//           <div className="p-6 space-y-6">
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                 Thème
//               </label>
//               <input
//                 type="text"
//                 value={formData.theme}
//                 onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
//                 placeholder="Thème du culte"
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//               />
//             </div>
            
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
//                 <User size={14} />
//                 Prédicateur
//               </label>
//               <input
//                 type="text"
//                 value={formData.predicateur}
//                 onChange={(e) => setFormData({ ...formData, predicateur: e.target.value })}
//                 placeholder="Nom du prédicateur"
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//               />
//             </div>
            
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 flex items-center gap-2">
//                 <Users size={14} />
//                 Officiants
//               </label>
//               <textarea
//                 value={formData.officiants}
//                 onChange={(e) => setFormData({ ...formData, officiants: e.target.value })}
//                 placeholder="Pasteur Jean, Diacre Marie, Frère Paul"
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-y"
//               />
//               <p className="text-xs text-gray-400 mt-1">
//                 Séparez les noms par des virgules
//               </p>
              
//               {officiantsList.length > 0 && (
//                 <div className="mt-3 p-4 bg-gray-50 border border-gray-200">
//                   <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
//                     Aperçu des officiants
//                   </p>
//                   <ul className="space-y-1">
//                     {officiantsList.map((officiant, index) => (
//                       <li key={index} className="flex items-start text-sm text-gray-700">
//                         <Circle size={6} className="text-gray-300 mt-2 mr-3 flex-shrink-0 fill-current" />
//                         {officiant}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )}
//             </div>
            
//             <div>
//               <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                 Activités spéciales
//               </label>
//               <textarea
//                 value={formData.activites_speciales}
//                 onChange={(e) => setFormData({ ...formData, activites_speciales: e.target.value })}
//                 placeholder="Activités spéciales de la semaine"
//                 rows={3}
//                 className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-y"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Sections additionnelles */}
//         <div className="border border-gray-200 bg-white mb-6">
//           <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
//             <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
//               <FileText size={16} />
//               Sections additionnelles
//             </h2>
//             <div className="flex items-center gap-2">
//               <button
//                 type="button"
//                 onClick={() => setShowActivitesSelector(!showActivitesSelector)}
//                 className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
//               >
//                 <CalendarCheck size={14} />
//                 Ajouter des activités
//               </button>
//               <button
//                 type="button"
//                 onClick={addSection}
//                 className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
//               >
//                 <Plus size={14} />
//                 Ajouter une section
//               </button>
//             </div>
//           </div>
          
//           <div className="p-6">
//             {/* Sélecteur d'activités */}
//             {showActivitesSelector && (
//               <div className="mb-6 border border-gray-200 bg-gray-50 p-4">
//                 <div className="flex items-center justify-between mb-4">
//                   <h3 className="text-sm font-medium text-gray-700">
//                     Sélectionner des activités ({selectedActivites.length} sélectionnée{selectedActivites.length > 1 ? 's' : ''})
//                   </h3>
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setShowActivitesSelector(false)
//                       setSelectedActivites([])
//                     }}
//                     className="text-gray-400 hover:text-gray-600"
//                   >
//                     <X size={16} />
//                   </button>
//                 </div>
                
//                 {activitesDisponibles.length === 0 ? (
//                   <div className="text-center py-8">
//                     <CalendarCheck size={32} className="mx-auto text-gray-300 mb-2" />
//                     <p className="text-sm text-gray-400">Aucune activité disponible</p>
//                     <p className="text-xs text-gray-300 mt-1">
//                       Les activités apparaîtront ici une fois créées dans les départements
//                     </p>
//                   </div>
//                 ) : (
//                   <>
//                     <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
//                       {activitesDisponibles.map((activite) => (
//                         <div
//                           key={activite.id}
//                           onClick={() => toggleActiviteSelection(activite.id)}
//                           className={`
//                             flex items-start gap-3 p-3 cursor-pointer border transition-colors
//                             ${selectedActivites.includes(activite.id)
//                               ? 'border-black bg-white'
//                               : 'border-gray-200 bg-white hover:border-gray-300'
//                             }
//                           `}
//                         >
//                           <div className={`
//                             w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5
//                             ${selectedActivites.includes(activite.id)
//                               ? 'border-black bg-black text-white'
//                               : 'border-gray-300'
//                             }
//                           `}>
//                             {selectedActivites.includes(activite.id) && (
//                               <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
//                                 <polyline points="20 6 9 17 4 12" />
//                               </svg>
//                             )}
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <div className="flex items-start justify-between gap-2">
//                               <p className="text-sm font-medium text-gray-900 truncate">
//                                 {activite.titre}
//                               </p>
//                               <span className={`
//                                 text-xs px-2 py-0.5 rounded-full flex-shrink-0
//                                 ${activite.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
//                               `}>
//                                 {activite.statut}
//                               </span>
//                             </div>
//                             <p className="text-xs text-gray-500 mt-1">
//                               📅 {format(new Date(activite.date), 'dd/MM/yyyy')} à {activite.heure}
//                             </p>
//                             {activite.description && (
//                               <p className="text-xs text-gray-400 mt-1 truncate">
//                                 {activite.description}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
                    
//                     <div className="flex justify-end">
//                       <button
//                         type="button"
//                         onClick={addActivitesSection}
//                         disabled={selectedActivites.length === 0}
//                         className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
//                       >
//                         <Plus size={14} />
//                         Ajouter la section ({selectedActivites.length})
//                       </button>
//                     </div>
//                   </>
//                 )}
//               </div>
//             )}

//             {/* Sections existantes */}
//             {sections.length === 0 && !showActivitesSelector ? (
//               <div className="py-12 text-center">
//                 <FileText size={32} className="mx-auto text-gray-300 mb-2" />
//                 <p className="text-sm text-gray-400">
//                   Aucune section additionnelle
//                 </p>
//                 <p className="text-xs text-gray-300 mt-1">
//                   Cliquez sur "Ajouter une section" ou "Ajouter des activités" pour commencer
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-6">
//                 {sections.map((section, index) => (
//                   <div key={section.id} className="border border-gray-200 p-5 relative">
//                     <button
//                       type="button"
//                       onClick={() => removeSection(index)}
//                       className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors p-1"
//                       title="Supprimer la section"
//                     >
//                       <X size={16} />
//                     </button>
                    
//                     <div className="space-y-4">
//                       <div>
//                         <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                           Titre de la section
//                         </label>
//                         <input
//                           type="text"
//                           value={section.titre}
//                           onChange={(e) => updateSection(index, 'titre', e.target.value)}
//                           placeholder="Ex: Annonces, Programme de la semaine, etc."
//                           className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-400 transition-colors"
//                         />
//                       </div>
                      
//                       <div>
//                         <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
//                           Contenu
//                         </label>
//                         <div className="border border-gray-300 focus-within:border-gray-400 transition-colors">
//                           <TipTapEditor
//                             value={section.description}
//                             onChange={(html) => updateSection(index, 'description', html)}
//                             placeholder="Rédigez votre contenu ici..."
//                             minHeight="200px"
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Message d'erreur */}
//         {error && (
//           <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-600 text-sm">
//             {error}
//           </div>
//         )}
        
//         {/* Actions */}
//         <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
//           <Link
//             href="/hebdo"
//             className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
//           >
//             Annuler
//           </Link>
//           <button
//             type="submit"
//             disabled={loading}
//             className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
//           >
//             {loading ? (
//               <>
//                 <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
//                 Création...
//               </>
//             ) : (
//               'Créer l\'hebdo'
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }


// app/hebdo/nouveau/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createHebdo, getUserParoisse, getHierarchyForHeader, generateNextHebdoNumber } from '@/actions/hebdo'
import { getActivitesByUnite } from '@/actions/activite'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ChevronLeft, Plus, X, Circle, Calendar, Church, User, Users, FileText, CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import SimpleFormattedEditor from '@/components/SImpleFormattedEditor'

interface Section {
  id: string
  titre: string
  description: string
}

interface Activite {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  unite_id: number
}

export default function NouvelHebdoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paroisse, setParoisse] = useState<any>(null)
  const [hierarchy, setHierarchy] = useState<any>({ region: '', conference: '', district: '' })
  const [nextNumber, setNextNumber] = useState('')
  const [activites, setActivites] = useState<Activite[]>([])
  const [selectedActivites, setSelectedActivites] = useState<number[]>([])
  const [showActivitesSelector, setShowActivitesSelector] = useState(false)
  
  const [formData, setFormData] = useState({
    numero: '',
    date_emission: format(new Date(), 'yyyy-MM-dd'),
    theme: '',
    predicateur: '',
    officiants: '',
    activites_speciales: ''
  })
  
  const [sections, setSections] = useState<Section[]>([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const p = await getUserParoisse()
    setParoisse(p)
    
    if (p) {
      const [h, num] = await Promise.all([
        getHierarchyForHeader(p.id),
        generateNextHebdoNumber(p.id)
      ])
      setHierarchy(h)
      setNextNumber(num)
      setFormData(prev => ({ ...prev, numero: num }))
      
      await loadActivites(p.id)
    }
  }

  async function loadActivites(paroisseId: number) {
    try {
      const { data: unites } = await supabase
        .from('unite_organisation')
        .select('id')
        .eq('id_niveau', paroisseId)
      
      if (unites && unites.length > 0) {
        const allActivites: Activite[] = []
        for (const unite of unites) {
          const activitesUnite = await getActivitesByUnite(unite.id)
          allActivites.push(...activitesUnite)
        }
        setActivites(allActivites)
      }
    } catch (error) {
      console.error('Erreur chargement activités:', error)
    }
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

  function toggleActiviteSelection(activiteId: number) {
    setSelectedActivites(prev => 
      prev.includes(activiteId)
        ? prev.filter(id => id !== activiteId)
        : [...prev, activiteId]
    )
  }

  function addActivitesSection() {
    if (selectedActivites.length === 0) return

    const activitesSelectionnees = activites.filter(a => selectedActivites.includes(a.id))
    
    const activitesHTML = activitesSelectionnees.map(activite => {
      const dateFormatee = format(new Date(activite.date), 'dd/MM/yyyy')
      const statut = activite.statut ? ' • ' + activite.statut : ''
      const description = activite.description ? '<p style="margin-top: 5px; font-size: 14px;">' + activite.description + '</p>' : ''
      
      return '<div class="activite-item" style="margin-bottom: 15px; padding: 10px; border-left: 3px solid #000;">' +
        '<h4 style="font-weight: 600; margin-bottom: 5px;">' + activite.titre + '</h4>' +
        '<p style="color: #666; font-size: 14px;">' +
        '📅 ' + dateFormatee + ' à ' + activite.heure + statut +
        '</p>' +
        description +
        '</div>'
    }).join('')

    const newSection: Section = {
      id: 'section-' + Date.now(),
      titre: 'Activités de la semaine',
      description: '<div class="activites-section"><h3>Programme des activités</h3>' + activitesHTML + '</div>'
    }
    
    setSections([...sections, newSection])
    setShowActivitesSelector(false)
    setSelectedActivites([])
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
    form.append('numero', formData.numero)
    form.append('date_emission', formData.date_emission)
    form.append('theme', formData.theme)
    form.append('predicateur', formData.predicateur)
    form.append('officiants', formData.officiants)
    form.append('activites_speciales', formData.activites_speciales)
    
    const sectionsToSave = sections.map(({ titre, description }) => ({ titre, description }))
    form.append('sections', JSON.stringify(sectionsToSave.filter(s => s.titre.trim())))

    const result = await createHebdo(form)

    if (result.error) {
      setError(result.error)
    } else {
      router.push(`/hebdo/${result.id}`)
    }
    
    setLoading(false)
  }

  const officiantsList = formatOfficiantsList(formData.officiants)
  const activitesDisponibles = activites.filter(
    a => a.statut !== 'termine' && a.statut !== 'annule'
  )

  if (!paroisse) {
    return (
      <div className="max-w-7xl mx-auto animate-pulse" dir="ltr">
        <div className="mb-6">
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
    <div className="max-w-5xl mx-auto" dir="ltr" style={{ direction: 'ltr', textAlign: 'left' }}>
      <form onSubmit={handleSubmit}>
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
                  Nouvel Hebdomadaire
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
                  placeholder={nextNumber}
                />
                {nextNumber && formData.numero === nextNumber && (
                  <p className="text-xs text-gray-400 mt-1">Numéro généré automatiquement</p>
                )}
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
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
            
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
                style={{ direction: 'ltr', textAlign: 'left' }}
              />
            </div>
            
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
                style={{ direction: 'ltr', textAlign: 'left' }}
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
            
            <div>
              <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                Activités spéciales
              </label>
              <div style={{ direction: 'ltr', textAlign: 'left' }}>
                <SimpleFormattedEditor
                  value={formData.activites_speciales}
                  onChange={(text) => setFormData({ ...formData, activites_speciales: text })}
                  placeholder="Activités spéciales de la semaine"
                  minHeight="150px"
                />
              </div>
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowActivitesSelector(!showActivitesSelector)}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <CalendarCheck size={14} />
                Ajouter des activités
              </button>
              <button
                type="button"
                onClick={addSection}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Plus size={14} />
                Ajouter une section
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {/* Sélecteur d'activités */}
            {showActivitesSelector && (
              <div className="mb-6 border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">
                    Sélectionner des activités ({selectedActivites.length} sélectionnée{selectedActivites.length > 1 ? 's' : ''})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActivitesSelector(false)
                      setSelectedActivites([])
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {activitesDisponibles.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarCheck size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">Aucune activité disponible</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Les activités apparaîtront ici une fois créées dans les départements
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                      {activitesDisponibles.map((activite) => (
                        <div
                          key={activite.id}
                          onClick={() => toggleActiviteSelection(activite.id)}
                          className={`
                            flex items-start gap-3 p-3 cursor-pointer border transition-colors
                            ${selectedActivites.includes(activite.id)
                              ? 'border-black bg-white'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                            }
                          `}
                        >
                          <div className={`
                            w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 mt-0.5
                            ${selectedActivites.includes(activite.id)
                              ? 'border-black bg-black text-white'
                              : 'border-gray-300'
                            }
                          `}>
                            {selectedActivites.includes(activite.id) && (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {activite.titre}
                              </p>
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full flex-shrink-0
                                ${activite.statut === 'en_cours' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                              `}>
                                {activite.statut}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              📅 {format(new Date(activite.date), 'dd/MM/yyyy')} à {activite.heure}
                            </p>
                            {activite.description && (
                              <p className="text-xs text-gray-400 mt-1 truncate">
                                {activite.description}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addActivitesSection}
                        disabled={selectedActivites.length === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                      >
                        <Plus size={14} />
                        Ajouter la section ({selectedActivites.length})
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sections existantes */}
            {sections.length === 0 && !showActivitesSelector ? (
              <div className="py-12 text-center">
                <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">
                  Aucune section additionnelle
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Cliquez sur "Ajouter une section" ou "Ajouter des activités" pour commencer
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((section, index) => (
                  <div key={section.id} className="border border-gray-200 p-5 relative">
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
                          style={{ direction: 'ltr', textAlign: 'left' }}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                          Contenu
                        </label>
                        <div style={{ direction: 'ltr', textAlign: 'left' }}>
                          <SimpleFormattedEditor
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
            href="/hebdo"
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
                Création...
              </>
            ) : (
              'Créer l\'hebdo'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}