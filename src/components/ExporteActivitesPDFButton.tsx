// // components/ExportActivitesPDFButton.tsx
// 'use client'

// import { useState } from 'react'
// import jsPDF from 'jspdf'
// import autoTable from 'jspdf-autotable'
// import { PiFilePdfFill } from 'react-icons/pi'

// export interface ActiviteForExport {
//   id: number
//   titre: string
//   description: string | null
//   date: string
//   heure: string
//   statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
//   departement?: string
//   paroisse?: string
//   plan_action?: {
//     id: number
//     titre: string
//   } | null
// }

// interface ExportActivitesPDFButtonProps {
//   activites: ActiviteForExport[]
//   filters: {
//     anneeLabel: string
//     uniteCount?: number
//     filterStatut?: string
//     searchTerm?: string
//     showParoisse?: boolean
//     showDepartement?: boolean
//   }
//   title?: string
// }

// const STATUTS: Record<string, string> = {
//   'planifie': 'Planifié',
//   'en_cours': 'En cours',
//   'termine': 'Terminé',
//   'annule': 'Annulé'
// }

// export default function ExportActivitesPDFButton({ 
//   activites, 
//   filters,
//   title = 'Liste des Activités'
// }: ExportActivitesPDFButtonProps) {
//   const [isGenerating, setIsGenerating] = useState(false)

//   const formatDate = (dateStr: string) => {
//     const date = new Date(dateStr)
//     return date.toLocaleDateString('fr-FR', {
//       day: '2-digit',
//       month: '2-digit',
//       year: 'numeric'
//     })
//   }

//   const truncateText = (text: string | null, maxLength: number = 40) => {
//     if (!text) return '-'
//     if (text.length <= maxLength) return text
//     return text.substring(0, maxLength - 3) + '...'
//   }

//   const generatePDF = async () => {
//     setIsGenerating(true)
    
//     try {
//       const doc = new jsPDF({
//         orientation: 'landscape',
//         unit: 'mm',
//         format: 'a4'
//       })

//       const pageWidth = doc.internal.pageSize.getWidth()
//       const pageHeight = doc.internal.pageSize.getHeight()
      
//       const marginLeft = 15
//       const marginRight = 15
//       const tableWidth = pageWidth - marginLeft - marginRight
      
//       // Charger et ajouter le logo
//       const logoUrl = '/logo.png'
//       const logoImg = new Image()
//       logoImg.crossOrigin = 'Anonymous'
      
//       await new Promise((resolve, reject) => {
//         logoImg.onload = resolve
//         logoImg.onerror = reject
//         logoImg.src = logoUrl
//       }).catch(() => {
//         console.warn('Logo non chargé, poursuite sans logo')
//       })

//       const logoSize = 18
//       const logoX = marginLeft
//       const logoY = 10

//       try {
//         doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)
//       } catch (e) {
//         // Ignorer l'erreur de logo
//       }

//       // Titre
//       doc.setFontSize(18)
//       doc.setTextColor(0, 0, 0)
//       doc.text(title, logoX + logoSize + 8, logoY + 8)

//       // Sous-titre avec filtres
//       doc.setFontSize(9)
//       doc.setTextColor(80, 80, 80)
      
//       let filterText = `Année : ${filters.anneeLabel || 'En cours'}`
//       if (filters.uniteCount) {
//         filterText += ` | ${filters.uniteCount} unité${filters.uniteCount > 1 ? 's' : ''}`
//       }
//       if (filters.filterStatut && filters.filterStatut !== '') {
//         filterText += ` | Statut : ${STATUTS[filters.filterStatut] || filters.filterStatut}`
//       }
//       if (filters.searchTerm) {
//         filterText += ` | Recherche : "${filters.searchTerm}"`
//       }
      
//       doc.text(filterText, logoX + logoSize + 8, logoY + 16)

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
//       doc.setTextColor(100, 100, 100)
//       doc.text(`Exporté le ${dateStr}`, pageWidth - marginRight, logoY + 8, { align: 'right' })

//       // Ligne de séparation
//       doc.setDrawColor(200, 200, 200)
//       doc.setLineWidth(0.3)
//       doc.line(marginLeft, logoY + logoSize + 6, pageWidth - marginRight, logoY + logoSize + 6)

//       // Construire les en-têtes dynamiquement
//       const headers: string[] = ['N°', 'Date', 'Heure', 'Titre', 'Description']
//       if (filters.showParoisse) headers.push('Paroisse')
//       if (filters.showDepartement) headers.push('Département')
//       headers.push('Statut', 'Plan d\'action')

//       // Données du tableau
//       const tableData = activites.map((activite, index) => {
//         const row: string[] = [
//           (index + 1).toString(),
//           formatDate(activite.date),
//           activite.heure.substring(0, 5),
//           activite.titre,
//           truncateText(activite.description, 35)
//         ]
//         if (filters.showParoisse) row.push(activite.paroisse || '-')
//         if (filters.showDepartement) row.push(activite.departement || '-')
//         row.push(
//           STATUTS[activite.statut] || activite.statut,
//           activite.plan_action?.titre || '-'
//         )
//         return row
//       })

//       // Calculer le nombre de colonnes
//       const columnCount = headers.length
      
//       // Largeurs des colonnes (en pourcentage)
//       let colWidths: number[] = []
      
//       if (columnCount === 7) { // Sans paroisse ni département
//         colWidths = [
//           tableWidth * 0.05,  // N°
//           tableWidth * 0.10,  // Date
//           tableWidth * 0.08,  // Heure
//           tableWidth * 0.22,  // Titre
//           tableWidth * 0.20,  // Description
//           tableWidth * 0.12,  // Statut
//           tableWidth * 0.15,  // Plan d'action
//         ]
//       } else if (columnCount === 8) { // Avec paroisse OU département
//         colWidths = [
//           tableWidth * 0.04,  // N°
//           tableWidth * 0.09,  // Date
//           tableWidth * 0.07,  // Heure
//           tableWidth * 0.18,  // Titre
//           tableWidth * 0.16,  // Description
//           tableWidth * 0.12,  // Paroisse/Département
//           tableWidth * 0.10,  // Statut
//           tableWidth * 0.14,  // Plan d'action
//         ]
//       } else if (columnCount === 9) { // Avec paroisse ET département
//         colWidths = [
//           tableWidth * 0.04,  // N°
//           tableWidth * 0.08,  // Date
//           tableWidth * 0.06,  // Heure
//           tableWidth * 0.16,  // Titre
//           tableWidth * 0.14,  // Description
//           tableWidth * 0.10,  // Paroisse
//           tableWidth * 0.10,  // Département
//           tableWidth * 0.09,  // Statut
//           tableWidth * 0.13,  // Plan d'action
//         ]
//       }

//       let pageCount = 0
      
//       autoTable(doc, {
//         head: [headers],
//         body: tableData,
//         startY: logoY + logoSize + 12,
//         styles: {
//           fontSize: 8,
//           cellPadding: 3,
//           textColor: [0, 0, 0],
//           lineColor: [200, 200, 200],
//           lineWidth: 0.3,
//         },
//         headStyles: {
//           fillColor: [255, 255, 255],
//           textColor: [0, 0, 0],
//           fontStyle: 'bold',
//           halign: 'left',
//           lineWidth: { bottom: 1.5, top: 0, left: 0, right: 0 },
//           lineColor: [150, 150, 150],
//         },
//         bodyStyles: {
//           textColor: [0, 0, 0],
//           lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
//           lineColor: [200, 200, 200],
//         },
//         columnStyles: colWidths.reduce((acc, width, i) => {
//           acc[i] = { 
//             cellWidth: width,
//             halign: i <= 2 ? 'center' : 'left'
//           }
//           return acc
//         }, {} as any),
//         alternateRowStyles: {
//           fillColor: [250, 250, 250],
//         },
//         margin: { left: marginLeft, right: marginRight },
//         tableLineColor: [200, 200, 200],
//         tableLineWidth: 0,
//         didDrawPage: () => {
//           pageCount++
          
//           doc.setFontSize(8)
//           doc.setTextColor(100, 100, 100)
          
//           doc.setDrawColor(200, 200, 200)
//           doc.setLineWidth(0.3)
//           doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
          
//           doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
//           doc.text(
//             `Total : ${activites.length} activité${activites.length > 1 ? 's' : ''}`,
//             pageWidth - marginRight,
//             pageHeight - 6,
//             { align: 'right' }
//           )
//         },
//       })

//       // Mise à jour des numéros de page
//       const totalPages = (doc as any).internal.pages.length - 1
      
//       for (let i = 1; i <= totalPages; i++) {
//         doc.setPage(i)
//         doc.setFontSize(8)
//         doc.setTextColor(100, 100, 100)
        
//         doc.setFillColor(255, 255, 255)
//         doc.rect(pageWidth / 2 - 25, pageHeight - 8, 50, 4, 'F')
//         doc.rect(pageWidth - marginRight - 50, pageHeight - 8, 50, 4, 'F')
        
//         doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
//         doc.text(
//           `Total : ${activites.length} activité${activites.length > 1 ? 's' : ''}`,
//           pageWidth - marginRight,
//           pageHeight - 6,
//           { align: 'right' }
//         )
//       }

//       // Résumé sur la dernière page
//       doc.setPage(totalPages)
//       const finalY = (doc as any).lastAutoTable.finalY + 6
      
//       const planifiees = activites.filter(a => a.statut === 'planifie').length
//       const enCours = activites.filter(a => a.statut === 'en_cours').length
//       const terminees = activites.filter(a => a.statut === 'termine').length
//       const annulees = activites.filter(a => a.statut === 'annule').length
      
//       if (finalY < pageHeight - 25) {
//         doc.setFontSize(9)
//         doc.setTextColor(0, 0, 0)
//         doc.text(
//           `Planifiées : ${planifiees} | En cours : ${enCours} | Terminées : ${terminees} | Annulées : ${annulees}`,
//           marginLeft,
//           finalY
//         )
//       }
      
//       const safeAnneeLabel = filters.anneeLabel?.replace(/\s+/g, '_') || 'export'
//       const fileName = `activites_${safeAnneeLabel}_${dateStr.replace(/[:\s]/g, '-')}.pdf`
      
//       doc.save(fileName)
      
//     } catch (error) {
//       console.error('Erreur génération PDF:', error)
//       alert('Erreur lors de la génération du PDF')
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   return (
//     <button
//       onClick={generatePDF}
//       disabled={isGenerating || activites.length === 0}
//       className="px-4 py-2 bg-white text-red-500 text-sm hover:bg-red-50 transition-colors border border-red-300 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
//     >
//       {isGenerating ? (
//         <>
//           <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></span>
//           Génération...
//         </>
//       ) : (
//         <>
//           <PiFilePdfFill className='text-red-500 text-base' />
//           Exporter PDF
//         </>
//       )}
//     </button>
//   )
// }
// components/ExportActivitesPDFButton.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PiFilePdfFill } from 'react-icons/pi'

export interface ActiviteForExport {
  id: number
  titre: string
  description: string | null
  date: string
  heure: string
  statut: 'planifie' | 'en_cours' | 'termine' | 'annule'
  departement?: string
  paroisse?: string
  plan_action?: {
    id: number
    titre: string
  } | null
}

interface ExportActivitesPDFButtonProps {
  activites: ActiviteForExport[]
  filters: {
    anneeLabel: string
    uniteCount?: number
    filterStatut?: string
    searchTerm?: string
    showParoisse?: boolean
    showDepartement?: boolean
  }
  title?: string
}

const STATUTS: Record<string, string> = {
  'planifie': 'Planifié',
  'en_cours': 'En cours',
  'termine': 'Terminé',
  'annule': 'Annulé'
}

export default function ExportActivitesPDFButton({ 
  activites, 
  filters,
  title = 'Liste des Activités'
}: ExportActivitesPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Format A4 Portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()  // 210mm
      const pageHeight = doc.internal.pageSize.getHeight() // 297mm
      
      // Marges standard A4
      const marginLeft = 20
      const marginRight = 20
      const marginTop = 15
      const marginBottom = 20
      const tableWidth = pageWidth - marginLeft - marginRight
      
      // Charger et ajouter le logo
      const logoUrl = '/logo.png'
      const logoImg = new Image()
      logoImg.crossOrigin = 'Anonymous'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
        logoImg.src = logoUrl
      }).catch(() => {
        console.warn('Logo non chargé, poursuite sans logo')
      })

      const logoSize = 18
      const logoX = marginLeft
      const logoY = marginTop

      try {
        doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)
      } catch (e) {
        // Ignorer l'erreur de logo
      }

      // Titre
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text(title, logoX + logoSize + 8, logoY + 8)

      // Sous-titre avec filtres
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      
      let filterText = `Année : ${filters.anneeLabel || 'En cours'}`
      if (filters.uniteCount) {
        filterText += ` | ${filters.uniteCount} unité${filters.uniteCount > 1 ? 's' : ''}`
      }
      if (filters.filterStatut && filters.filterStatut !== '') {
        filterText += ` | Statut : ${STATUTS[filters.filterStatut] || filters.filterStatut}`
      }
      if (filters.searchTerm) {
        filterText += ` | Recherche : "${filters.searchTerm}"`
      }
      
      doc.text(filterText, logoX + logoSize + 8, logoY + 16)

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
      doc.setTextColor(100, 100, 100)
      doc.text(`Exporté le ${dateStr}`, pageWidth - marginRight, logoY + 8, { align: 'right' })

      // Ligne de séparation (dans les marges)
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(marginLeft, logoY + logoSize + 6, pageWidth - marginRight, logoY + logoSize + 6)

      // Construire les en-têtes dynamiquement
      const headers: string[] = ['N°', 'Date', 'Heure', 'Titre']
      if (filters.showParoisse) headers.push('Paroisse')
      if (filters.showDepartement) headers.push('Département')
      headers.push('Statut')

      // Données du tableau
      const tableData = activites.map((activite, index) => {
        const row: string[] = [
          (index + 1).toString(),
          formatDate(activite.date),
          activite.heure.substring(0, 5),
          activite.titre
        ]
        if (filters.showParoisse) row.push(activite.paroisse || '-')
        if (filters.showDepartement) row.push(activite.departement || '-')
        row.push(STATUTS[activite.statut] || activite.statut)
        return row
      })

      // Calculer le nombre de colonnes
      const columnCount = headers.length
      
      // Largeurs des colonnes (en pourcentage) - Adaptées pour A4 portrait
      let colWidths: number[] = []
      
      if (columnCount === 5) { // Sans paroisse ni département
        colWidths = [
          tableWidth * 0.08,  // N°
          tableWidth * 0.16,  // Date
          tableWidth * 0.12,  // Heure
          tableWidth * 0.44,  // Titre
          tableWidth * 0.20,  // Statut
        ]
      } else if (columnCount === 6) { // Avec paroisse OU département
        colWidths = [
          tableWidth * 0.07,  // N°
          tableWidth * 0.14,  // Date
          tableWidth * 0.10,  // Heure
          tableWidth * 0.28,  // Titre
          tableWidth * 0.23,  // Paroisse/Département
          tableWidth * 0.18,  // Statut
        ]
      } else if (columnCount === 7) { // Avec paroisse ET département
        colWidths = [
          tableWidth * 0.06,  // N°
          tableWidth * 0.12,  // Date
          tableWidth * 0.09,  // Heure
          tableWidth * 0.24,  // Titre
          tableWidth * 0.16,  // Paroisse
          tableWidth * 0.16,  // Département
          tableWidth * 0.17,  // Statut
        ]
      }

      let pageCount = 0
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: logoY + logoSize + 12,
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: [0, 0, 0],
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
          lineWidth: { bottom: 1.5, top: 0, left: 0, right: 0 },
          lineColor: [150, 150, 150],
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          fontSize: 9,
          lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
          lineColor: [200, 200, 200],
        },
        columnStyles: colWidths.reduce((acc, width, i) => {
          acc[i] = { 
            cellWidth: width,
            halign: i <= 2 ? 'center' : 'left'
          }
          return acc
        }, {} as any),
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: marginLeft, right: marginRight },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0,
        didDrawPage: (data) => {
          pageCount++
          
          // Pied de page avec ligne dans les marges
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 100)
          
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(marginLeft, pageHeight - marginBottom + 5, pageWidth - marginRight, pageHeight - marginBottom + 5)
          
          doc.text(
            `Page ${pageCount}`,
            pageWidth / 2,
            pageHeight - marginBottom + 10,
            { align: 'center' }
          )
          
          doc.text(
            `Total : ${activites.length} activité${activites.length > 1 ? 's' : ''}`,
            pageWidth - marginRight,
            pageHeight - marginBottom + 10,
            { align: 'right' }
          )
        },
      })

      // Mise à jour des numéros de page
      const totalPages = (doc as any).internal.pages.length - 1
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        
        // Effacer l'ancien texte
        doc.setFillColor(255, 255, 255)
        doc.rect(pageWidth / 2 - 25, pageHeight - marginBottom + 7, 50, 4, 'F')
        doc.rect(pageWidth - marginRight - 50, pageHeight - marginBottom + 7, 50, 4, 'F')
        
        // Réécrire avec le total des pages
        doc.text(
          `Page ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - marginBottom + 10,
          { align: 'center' }
        )
        doc.text(
          `Total : ${activites.length} activité${activites.length > 1 ? 's' : ''}`,
          pageWidth - marginRight,
          pageHeight - marginBottom + 10,
          { align: 'right' }
        )
      }

      // Résumé sur la dernière page
      doc.setPage(totalPages)
      const finalY = (doc as any).lastAutoTable.finalY + 6
      
      const planifiees = activites.filter(a => a.statut === 'planifie').length
      const enCours = activites.filter(a => a.statut === 'en_cours').length
      const terminees = activites.filter(a => a.statut === 'termine').length
      const annulees = activites.filter(a => a.statut === 'annule').length
      
      // Vérifier si on a assez de place pour le résumé
      if (finalY < pageHeight - marginBottom - 10) {
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        doc.text(
          `Planifiées : ${planifiees} | En cours : ${enCours} | Terminées : ${terminees} | Annulées : ${annulees}`,
          marginLeft,
          finalY
        )
      }
      
      const safeAnneeLabel = filters.anneeLabel?.replace(/\s+/g, '_') || 'export'
      const fileName = `activites_${safeAnneeLabel}_${dateStr.replace(/[:\s]/g, '-')}.pdf`
      
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating || activites.length === 0}
      className="px-4 py-2 bg-white text-red-500 text-sm hover:bg-red-50 transition-colors border border-red-300  flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></span>
          Génération...
        </>
      ) : (
        <>
          <PiFilePdfFill className='text-red-500 text-base' />
          Exporter PDF
        </>
      )}
    </button>
  )
}