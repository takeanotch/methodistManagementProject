// // app/admin/chef/ExportResponsablesPDF.tsx
// 'use client'

// import { useState } from 'react'
// import jsPDF from 'jspdf'
// import autoTable from 'jspdf-autotable'
// import { FileText, Loader2 } from 'lucide-react'

// // Types pour les conférences avec chefs
// interface ConferenceWithChefs {
//   id: number
//   nom: string
//   region?: {
//     id: number
//     nom: string
//   }
//   chefs?: ChefConference[]
// }

// interface ChefConference {
//   id: number
//   fidele_id: number
//   conference_id: number
//   departement_id?: number | null
//   role_id?: number | null
//   date_nomination: string
//   annee_conference_id?: number | null
//   fidele?: {
//     id: number
//     nom: string
//     post_nom: string | null
//     prenom: string
//     contact: string | null
//   }
//   departement?: {
//     id: number
//     nom: string
//   }
//   role?: {
//     id: number
//     nom_role?: string
//     label_role?: string
//   }
// }

// // Types pour les districts avec chefs
// interface DistrictWithChefs {
//   id: number
//   nom: string
//   conference?: {
//     id: number
//     nom: string
//     region?: {
//       id: number
//       nom: string
//     }
//   }
//   chefs?: ChefDistrict[]
// }

// interface ChefDistrict {
//   id: number
//   fidele_id: number
//   district_id: number
//   departement_id?: number | null
//   role_id?: number | null
//   date_nomination: string | null
//   annee_conference_id?: number | null
//   fidele?: {
//     id: number
//     nom: string
//     post_nom: string | null
//     prenom: string
//     contact: string | null
//   }
//   departement?: {
//     id: number
//     nom: string
//   }
//   role?: {
//     id: number
//     nom_role?: string
//     label_role?: string
//   }
// }

// // Types pour les surintendants
// interface Surintendant {
//   id: number
//   fidele_id: number
//   district_id: number
//   est_actif: boolean
//   created_at: string
//   annee_conference_id?: number | null
//   district: {
//     id: number
//     nom: string
//     conference?: {
//       id: number
//       nom: string
//       region?: {
//         id: number
//         nom: string
//       }
//     }
//   }
//   fidele: {
//     id: number
//     nom: string
//     post_nom: string | null
//     prenom: string
//     contact: string | null
//   }
// }

// interface ExportResponsablesPDFProps {
//   // Type d'export
//   type: 'conferences' | 'districts' | 'surintendants'
  
//   // Données selon le type
//   conferences?: ConferenceWithChefs[]
//   districts?: DistrictWithChefs[]
//   surintendants?: Surintendant[]
  
//   // Informations de filtre
//   filterInfo: {
//     anneeLabel: string | null
//   }
  
//   // Statistiques globales
//   stats: {
//     totalChefs: number
//     totalChefsConferences: number
//     totalChefsDistricts: number
//     totalSurintendantsActifs: number
//   }
  
//   // Fonctions utilitaires
//   getRoleLabel: (chef: ChefConference | ChefDistrict) => string
//   getConferenceName?: (surintendant: Surintendant) => string
//   getRegionName?: (surintendant: Surintendant) => string | null
//   formatDate: (dateString: string | null) => string
// }

// export default function ExportResponsablesPDF({ 
//   type, 
//   conferences = [], 
//   districts = [], 
//   surintendants = [],
//   filterInfo,
//   stats,
//   getRoleLabel,
//   getConferenceName = () => '—',
//   getRegionName = () => null,
//   formatDate
// }: ExportResponsablesPDFProps) {
//   const [isGenerating, setIsGenerating] = useState(false)

//   const generatePDF = async () => {
//     setIsGenerating(true)
    
//     try {
//       // Orientation paysage pour avoir plus de place
//       const doc = new jsPDF({
//         orientation: 'landscape',
//         unit: 'mm',
//         format: 'a4'
//       })

//       const pageWidth = doc.internal.pageSize.getWidth()
//       const pageHeight = doc.internal.pageSize.getHeight()
//       const marginLeft = 15
//       const marginRight = 15

//       // Essayer de charger la police Lora
//       try {
//         const fontResponse = await fetch('/lora.ttf')
//         if (fontResponse.ok) {
//           const fontBuffer = await fontResponse.arrayBuffer()
//           const fontBase64 = btoa(
//             new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
//           )
          
//           doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
//           doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
//           doc.addFileToVFS('Lora-Bold.ttf', fontBase64)
//           doc.addFont('Lora-Bold.ttf', 'Lora', 'bold')
//         }
//       } catch (fontError) {
//         // Utiliser la police par défaut
//         console.warn('Police par défaut utilisée')
//       }
      
//       // Charger et ajouter le logo
//       let logoAdded = false
//       try {
//         const logoUrl = '/logo.png'
//         const logoImg = new Image()
//         logoImg.crossOrigin = 'Anonymous'
        
//         await new Promise((resolve, reject) => {
//           logoImg.onload = resolve
//           logoImg.onerror = reject
//           logoImg.src = logoUrl
//         })

//         const logoSize = 14
//         const logoX = marginLeft
//         const logoY = 8

//         doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)
//         logoAdded = true
//       } catch (logoError) {
//         console.warn('Logo non chargé')
//       }

//       // En-tête du document
//       const startY = logoAdded ? 8 : 10
      
//       // Utiliser la police par défaut si Lora n'est pas chargée
//       const font = (doc as any).getFontList().Lora ? 'Lora' : 'helvetica'
      
//       doc.setFont(font, 'bold')
//       doc.setFontSize(12)
//       doc.setTextColor(0, 0, 0)
      
//       doc.text('ÉGLISE MÉTHODISTE UNIE', pageWidth / 2, startY + 6, { align: 'center' })
//       doc.setFontSize(10)
//       doc.text('ADMINISTRATION', pageWidth / 2, startY + 13, { align: 'center' })
      
//       // Titre selon le type
//       const titles = {
//         conferences: 'RESPONSABLES DES CONFÉRENCES',
//         districts: 'RESPONSABLES DES DISTRICTS',
//         surintendants: 'SURINTENDANTS'
//       }
//       doc.setFontSize(11)
//       doc.text(titles[type], pageWidth / 2, startY + 21, { align: 'center' })

//       // Informations de filtre
//       doc.setFont(font, 'normal')
//       doc.setFontSize(8)
//       doc.setTextColor(80, 80, 80)
      
//       let filterText = `Année : ${filterInfo.anneeLabel || 'Toutes les années'}`
      
//       doc.text(filterText, marginLeft, startY + 29)

//       // Date d'export
//       const today = new Date()
//       const dateStr = today.toLocaleDateString('fr-FR', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       })
//       doc.setFontSize(8)
//       doc.setTextColor(0, 0, 0)
//       doc.text(`Exporté le ${dateStr}`, pageWidth - marginRight, startY + 29, { align: 'right' })

//       // Ligne de séparation
//       doc.setDrawColor(0, 0, 0)
//       doc.setLineWidth(0.3)
//       doc.line(marginLeft, startY + 33, pageWidth - marginRight, startY + 33)

//       let tableData: any[] = []
//       let headers: string[] = []
//       let tableStartY = startY + 39

//       // Préparer les données selon le type
//       if (type === 'conferences') {
//         headers = ['Conférence', 'Région', 'Responsable', 'Rôle', 'Département', 'Contact', 'Nommé le']
        
//         conferences.forEach((conf) => {
//           const chefs = conf.chefs || []
//           if (chefs.length === 0) {
//             tableData.push([
//               conf.nom,
//               conf.region?.nom || '—',
//               '—',
//               '—',
//               '—',
//               '—',
//               '—'
//             ])
//           } else {
//             chefs.forEach((chef) => {
//               tableData.push([
//                 conf.nom,
//                 conf.region?.nom || '—',
//                 `${chef.fidele?.prenom || ''} ${chef.fidele?.nom || ''} ${chef.fidele?.post_nom || ''}`.trim() || '—',
//                 getRoleLabel(chef),
//                 chef.departement?.nom || '—',
//                 chef.fidele?.contact || '—',
//                 chef.date_nomination ? new Date(chef.date_nomination).toLocaleDateString('fr-FR') : '—'
//               ])
//             })
//           }
//         })
//       } else if (type === 'districts') {
//         headers = ['District', 'Conférence', 'Région', 'Responsable', 'Rôle', 'Département', 'Contact', 'Nommé le']
        
//         districts.forEach((dist) => {
//           const chefs = dist.chefs || []
//           if (chefs.length === 0) {
//             tableData.push([
//               dist.nom,
//               dist.conference?.nom || '—',
//               dist.conference?.region?.nom || '—',
//               '—',
//               '—',
//               '—',
//               '—',
//               '—'
//             ])
//           } else {
//             chefs.forEach((chef) => {
//               tableData.push([
//                 dist.nom,
//                 dist.conference?.nom || '—',
//                 dist.conference?.region?.nom || '—',
//                 `${chef.fidele?.prenom || ''} ${chef.fidele?.nom || ''} ${chef.fidele?.post_nom || ''}`.trim() || '—',
//                 getRoleLabel(chef),
//                 chef.departement?.nom || '—',
//                 chef.fidele?.contact || '—',
//                 chef.date_nomination ? new Date(chef.date_nomination).toLocaleDateString('fr-FR') : '—'
//               ])
//             })
//           }
//         })
//       } else if (type === 'surintendants') {
//         headers = ['Surintendant', 'Contact', 'District', 'Conférence', 'Région', 'Statut', 'Nommé le']
        
//         surintendants.forEach((sur) => {
//           tableData.push([
//             `${sur.fidele?.prenom || ''} ${sur.fidele?.nom || ''} ${sur.fidele?.post_nom || ''}`.trim() || '—',
//             sur.fidele?.contact || '—',
//             sur.district?.nom || `District #${sur.district_id}`,
//             getConferenceName(sur),
//             getRegionName(sur) || '—',
//             sur.est_actif ? 'Actif' : 'Inactif',
//             formatDate(sur.created_at)
//           ])
//         })
//       }

//       // Statistiques avant le tableau
//       doc.setFont(font, 'normal')
//       doc.setFontSize(8)
//       doc.setTextColor(80, 80, 80)
      
//       const statsText = type === 'conferences' 
//         ? `Total conférences : ${conferences.length} | Responsables : ${stats.totalChefsConferences}`
//         : type === 'districts'
//         ? `Total districts : ${districts.length} | Responsables : ${stats.totalChefsDistricts}`
//         : `Total surintendants : ${surintendants.length} | Actifs : ${stats.totalSurintendantsActifs}`
      
//       doc.text(statsText, marginLeft, tableStartY - 3)

//       let pageCount = 0

//       // Générer le tableau
//       autoTable(doc, {
//         head: [headers],
//         body: tableData,
//         startY: tableStartY,
//         styles: {
//           font: font,
//           fontSize: 7,
//           cellPadding: 3,
//           textColor: [0, 0, 0],
//           lineColor: [150, 150, 150],
//           lineWidth: 0.1,
//         },
//         headStyles: {
//           fillColor: [240, 240, 240],
//           textColor: [0, 0, 0],
//           fontStyle: 'bold',
//           halign: 'left',
//           lineWidth: { bottom: 1, top: 0.5, left: 0, right: 0 },
//           lineColor: [0, 0, 0],
//         },
//         bodyStyles: {
//           textColor: [0, 0, 0],
//         },
//         alternateRowStyles: {
//           fillColor: [250, 250, 250],
//         },
//         margin: { left: marginLeft, right: marginRight },
//         didDrawPage: () => {
//           pageCount++
          
//           doc.setFont(font, 'normal')
//           doc.setFontSize(7)
//           doc.setTextColor(100, 100, 100)
          
//           doc.setDrawColor(150, 150, 150)
//           doc.setLineWidth(0.2)
//           doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
          
//           doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
//         },
//       })

//       // Mise à jour de la pagination avec le total
//       const totalPages = (doc as any).internal.pages.length - 1
      
//       for (let i = 1; i <= totalPages; i++) {
//         doc.setPage(i)
//         doc.setFont(font, 'normal')
//         doc.setFontSize(7)
//         doc.setTextColor(100, 100, 100)
        
//         doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
//       }

//       // Résumé global sur la dernière page
//       doc.setPage(totalPages)
//       const finalY = (doc as any).lastAutoTable.finalY + 8
      
//       if (finalY < pageHeight - 20) {
//         doc.setFont(font, 'bold')
//         doc.setFontSize(8)
//         doc.setTextColor(0, 0, 0)
//         doc.text('RÉSUMÉ GLOBAL', marginLeft, finalY)
        
//         doc.setFont(font, 'normal')
//         doc.setFontSize(7)
        
//         const summaryText = `Total responsables : ${stats.totalChefs} | Conférences : ${stats.totalChefsConferences} | Districts : ${stats.totalChefsDistricts} | Surintendants actifs : ${stats.totalSurintendantsActifs}`
//         doc.text(summaryText, marginLeft, finalY + 5)
        
//         // Deuxième ligne : totaux par type si pertinent
//         if (type !== 'surintendants') {
//           const withChefs = type === 'conferences' 
//             ? conferences.filter(c => (c.chefs?.length || 0) > 0).length
//             : districts.filter(d => (d.chefs?.length || 0) > 0).length
            
//           const withoutChefs = type === 'conferences'
//             ? conferences.length - withChefs
//             : districts.length - withChefs
            
//           const typeLabel = type === 'conferences' ? 'conférences' : 'districts'
//           doc.text(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} avec équipe : ${withChefs} | Sans responsable : ${withoutChefs}`, marginLeft, finalY + 10)
//         }
//       }

//       // Nom du fichier
//       const typeNames = {
//         conferences: 'conferences',
//         districts: 'districts',
//         surintendants: 'surintendants'
//       }
      
//       const fileName = `responsables_${typeNames[type]}_${filterInfo.anneeLabel?.replace(/\s+/g, '_') || 'toutes_annees'}_${dateStr.replace(/[:\s]/g, '-')}.pdf`
      
//       doc.save(fileName)
      
//     } catch (error) {
//       console.error('Erreur génération PDF:', error)
//       alert('Erreur lors de la génération du PDF')
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   // Déterminer si le bouton doit être désactivé (aucune donnée)
//   const hasData = type === 'conferences' 
//     ? conferences.length > 0 
//     : type === 'districts' 
//     ? districts.length > 0 
//     : surintendants.length > 0

//   return (
//     <button
//       onClick={generatePDF}
//       disabled={isGenerating || !hasData}
//       className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 text-sm hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
//       title={!hasData ? 'Aucune donnée à exporter' : 'Exporter en PDF'}
//     >
//       {isGenerating ? (
//         <>
//           <Loader2 size={16} className="animate-spin" />
//           Génération...
//         </>
//       ) : (
//         <>
//           <FileText size={16} className="text-red-500" />
//           Exporter PDF
//         </>
//       )}
//     </button>
//   )
// }

// app/admin/chef/ExportResponsablesPDF.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { FileText, Loader2 } from 'lucide-react'

// Importer les types depuis page.tsx pour éviter les incompatibilités

// app/admin/chef/page.tsx

// Ajouter "export" devant chaque interface
export interface DistrictWithChefs {
  id: number
  nom: string
  conference?: {
    id: number
    nom: string
    region?: {
      id: number
      nom: string
    }
  }
  chefs?: any[]
}

export interface Surintendant {
  id: number
  fidele_id: number
  district_id: number
  est_actif: boolean
  created_at: string
  annee_conference_id?: number | null
  district: {
    id: number
    nom: string
    conference?: {
      id: number
      nom: string
      region?: {
        id: number
        nom: string
      }
    }
  }
  fidele: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
}

export interface Fidele {
  id: number
  nom: string
  post_nom: string | null
  prenom: string
  contact: string | null
  profile_img: string | null
  compte: {
    id: number
    role_id: number
    role: {
      nom: string
      niveau: string
    }
  } | null
}

export interface ChefConference {
  id: number
  fidele_id: number
  conference_id: number
  departement_id?: number | null
  role_id?: number | null
  date_nomination: string
  annee_conference_id?: number | null
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
  departement?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role?: string
    label_role?: string
  }
}

export interface ChefDistrict {
  id: number
  fidele_id: number
  district_id: number
  departement_id?: number | null
  role_id?: number | null
  date_nomination: string | null
  annee_conference_id?: number | null
  fidele?: {
    id: number
    nom: string
    post_nom: string | null
    prenom: string
    contact: string | null
    profile_img: string | null
  }
  departement?: {
    id: number
    nom: string
  }
  role?: {
    id: number
    nom_role?: string
    label_role?: string
  }
}

export interface ConferenceWithChefs {
  id: number
  nom: string
  region?: {
    id: number
    nom: string
  }
  chefs?: ChefConference[]
}
interface ExportResponsablesPDFProps {
  // Type d'export
  type: 'conferences' | 'districts' | 'surintendants'
  
  // Données selon le type
  conferences?: ConferenceWithChefs[]
  districts?: DistrictWithChefs[]
  surintendants?: Surintendant[]
  
  // Informations de filtre
  filterInfo: {
    anneeLabel: string | null
  }
  
  // Statistiques globales
  stats: {
    totalChefs: number
    totalChefsConferences: number
    totalChefsDistricts: number
    totalSurintendantsActifs: number
  }
  
  // Fonctions utilitaires
  getRoleLabel: (chef: ChefConference | ChefDistrict) => string
  getConferenceName?: (surintendant: Surintendant) => string
  getRegionName?: (surintendant: Surintendant) => string | null
  formatDate: (dateString: string | null) => string
}

export default function ExportResponsablesPDF({ 
  type, 
  conferences = [], 
  districts = [], 
  surintendants = [],
  filterInfo,
  stats,
  getRoleLabel,
  getConferenceName = () => '—',
  getRegionName = () => null,
  formatDate
}: ExportResponsablesPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Orientation paysage pour avoir plus de place
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const marginLeft = 15
      const marginRight = 15

      // Essayer de charger la police Lora
      try {
        const fontResponse = await fetch('/lora.ttf')
        if (fontResponse.ok) {
          const fontBuffer = await fontResponse.arrayBuffer()
          const fontBase64 = btoa(
            new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          )
          
          doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
          doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
          doc.addFileToVFS('Lora-Bold.ttf', fontBase64)
          doc.addFont('Lora-Bold.ttf', 'Lora', 'bold')
        }
      } catch (fontError) {
        // Utiliser la police par défaut
        console.warn('Police par défaut utilisée')
      }
      
      // Charger et ajouter le logo
      let logoAdded = false
      try {
        const logoUrl = '/logo.png'
        const logoImg = new Image()
        logoImg.crossOrigin = 'Anonymous'
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
          logoImg.src = logoUrl
        })

        const logoSize = 14
        const logoX = marginLeft
        const logoY = 8

        doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)
        logoAdded = true
      } catch (logoError) {
        console.warn('Logo non chargé')
      }

      // En-tête du document
      const startY = logoAdded ? 8 : 10
      
      // Utiliser la police par défaut si Lora n'est pas chargée
      const font = (doc as any).getFontList().Lora ? 'Lora' : 'helvetica'
      
      doc.setFont(font, 'bold')
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      
      doc.text('ÉGLISE MÉTHODISTE UNIE', pageWidth / 2, startY + 6, { align: 'center' })
      doc.setFontSize(10)
      doc.text('ADMINISTRATION', pageWidth / 2, startY + 13, { align: 'center' })
      
      // Titre selon le type
      const titles = {
        conferences: 'RESPONSABLES DES CONFÉRENCES',
        districts: 'RESPONSABLES DES DISTRICTS',
        surintendants: 'SURINTENDANTS'
      }
      doc.setFontSize(11)
      doc.text(titles[type], pageWidth / 2, startY + 21, { align: 'center' })

      // Informations de filtre
      doc.setFont(font, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      
      let filterText = `Année : ${filterInfo.anneeLabel || 'Toutes les années'}`
      
      doc.text(filterText, marginLeft, startY + 29)

      // Date d'export
      const today = new Date()
      const dateStr = today.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.setFontSize(8)
      doc.setTextColor(0, 0, 0)
      doc.text(`Exporté le ${dateStr}`, pageWidth - marginRight, startY + 29, { align: 'right' })

      // Ligne de séparation
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.line(marginLeft, startY + 33, pageWidth - marginRight, startY + 33)

      let tableData: any[] = []
      let headers: string[] = []
      let tableStartY = startY + 39

      // Préparer les données selon le type
      if (type === 'conferences') {
        headers = ['Conférence', 'Région', 'Responsable', 'Rôle', 'Département', 'Contact', 'Nommé le']
        
        conferences.forEach((conf) => {
          const chefs = conf.chefs || []
          if (chefs.length === 0) {
            tableData.push([
              conf.nom,
              conf.region?.nom || '—',
              '—',
              '—',
              '—',
              '—',
              '—'
            ])
          } else {
            chefs.forEach((chef) => {
              tableData.push([
                conf.nom,
                conf.region?.nom || '—',
                `${chef.fidele?.prenom || ''} ${chef.fidele?.nom || ''} ${chef.fidele?.post_nom || ''}`.trim() || '—',
                getRoleLabel(chef),
                chef.departement?.nom || '—',
                chef.fidele?.contact || '—',
                chef.date_nomination ? new Date(chef.date_nomination).toLocaleDateString('fr-FR') : '—'
              ])
            })
          }
        })
      } else if (type === 'districts') {
        headers = ['District', 'Conférence', 'Région', 'Responsable', 'Rôle', 'Département', 'Contact', 'Nommé le']
        
        districts.forEach((dist) => {
          const chefs = dist.chefs || []
          if (chefs.length === 0) {
            tableData.push([
              dist.nom,
              dist.conference?.nom || '—',
              dist.conference?.region?.nom || '—',
              '—',
              '—',
              '—',
              '—',
              '—'
            ])
          } else {
            chefs.forEach((chef) => {
              tableData.push([
                dist.nom,
                dist.conference?.nom || '—',
                dist.conference?.region?.nom || '—',
                `${chef.fidele?.prenom || ''} ${chef.fidele?.nom || ''} ${chef.fidele?.post_nom || ''}`.trim() || '—',
                getRoleLabel(chef),
                chef.departement?.nom || '—',
                chef.fidele?.contact || '—',
                chef.date_nomination ? new Date(chef.date_nomination).toLocaleDateString('fr-FR') : '—'
              ])
            })
          }
        })
      } else if (type === 'surintendants') {
        headers = ['Surintendant', 'Contact', 'District', 'Conférence', 'Région', 'Statut', 'Nommé le']
        
        surintendants.forEach((sur) => {
          tableData.push([
            `${sur.fidele?.prenom || ''} ${sur.fidele?.nom || ''} ${sur.fidele?.post_nom || ''}`.trim() || '—',
            sur.fidele?.contact || '—',
            sur.district?.nom || `District #${sur.district_id}`,
            getConferenceName(sur),
            getRegionName(sur) || '—',
            sur.est_actif ? 'Actif' : 'Inactif',
            formatDate(sur.created_at)
          ])
        })
      }

      // Statistiques avant le tableau
      doc.setFont(font, 'normal')
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      
      const statsText = type === 'conferences' 
        ? `Total conférences : ${conferences.length} | Responsables : ${stats.totalChefsConferences}`
        : type === 'districts'
        ? `Total districts : ${districts.length} | Responsables : ${stats.totalChefsDistricts}`
        : `Total surintendants : ${surintendants.length} | Actifs : ${stats.totalSurintendantsActifs}`
      
      doc.text(statsText, marginLeft, tableStartY - 3)

      let pageCount = 0

      // Générer le tableau
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: tableStartY,
        styles: {
          font: font,
          fontSize: 7,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [150, 150, 150],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'left',
          lineWidth: { bottom: 1, top: 0.5, left: 0, right: 0 },
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          textColor: [0, 0, 0],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: marginLeft, right: marginRight },
        didDrawPage: () => {
          pageCount++
          
          doc.setFont(font, 'normal')
          doc.setFontSize(7)
          doc.setTextColor(100, 100, 100)
          
          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.2)
          doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
          
          doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
        },
      })

      // Mise à jour de la pagination avec le total
      const totalPages = (doc as any).internal.pages.length - 1
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFont(font, 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        
        doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
      }

      // Résumé global sur la dernière page
      doc.setPage(totalPages)
      const finalY = (doc as any).lastAutoTable.finalY + 8
      
      if (finalY < pageHeight - 20) {
        doc.setFont(font, 'bold')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text('RÉSUMÉ GLOBAL', marginLeft, finalY)
        
        doc.setFont(font, 'normal')
        doc.setFontSize(7)
        
        const summaryText = `Total responsables : ${stats.totalChefs} | Conférences : ${stats.totalChefsConferences} | Districts : ${stats.totalChefsDistricts} | Surintendants actifs : ${stats.totalSurintendantsActifs}`
        doc.text(summaryText, marginLeft, finalY + 5)
        
        // Deuxième ligne : totaux par type si pertinent
        if (type !== 'surintendants') {
          const withChefs = type === 'conferences' 
            ? conferences.filter(c => (c.chefs?.length || 0) > 0).length
            : districts.filter(d => (d.chefs?.length || 0) > 0).length
            
          const withoutChefs = type === 'conferences'
            ? conferences.length - withChefs
            : districts.length - withChefs
            
          const typeLabel = type === 'conferences' ? 'conférences' : 'districts'
          doc.text(`${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} avec équipe : ${withChefs} | Sans responsable : ${withoutChefs}`, marginLeft, finalY + 10)
        }
      }

      // Nom du fichier
      const typeNames = {
        conferences: 'conferences',
        districts: 'districts',
        surintendants: 'surintendants'
      }
      
      const fileName = `responsables_${typeNames[type]}_${filterInfo.anneeLabel?.replace(/\s+/g, '_') || 'toutes_annees'}_${dateStr.replace(/[:\s]/g, '-')}.pdf`
      
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  // Déterminer si le bouton doit être désactivé (aucune donnée)
  const hasData = type === 'conferences' 
    ? conferences.length > 0 
    : type === 'districts' 
    ? districts.length > 0 
    : surintendants.length > 0

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating || !hasData}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 text-sm hover:bg-red-50 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
      title={!hasData ? 'Aucune donnée à exporter' : 'Exporter en PDF'}
    >
      {isGenerating ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <FileText size={16} className="text-red-500" />
          Exporter PDF
        </>
      )}
    </button>
  )
}