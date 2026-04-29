
// app/conference/pasteurs/ExportPDFButton.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PiFilePdfFill } from 'react-icons/pi'

interface ExportPDFButtonProps {
  pasteurs: any[]
  filters: {
    anneeLabel: string
    districtNom: string | null
    paroisseNom: string | null
    conferenceNom?: string
  }
}

export default function ExportPDFButton({ pasteurs, filters }: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getEtudeLabel = (etude: string) => {
    const labels: Record<string, string> = {
      master: 'Master',
      licence: 'Licence',
      phd: 'PhD/Doctorat',
      autre: 'Autre'
    }
    return labels[etude] || etude
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Format A4 portrait
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Marges du tableau
      const marginLeft = 20
      const marginRight = 20
      const tableWidth = pageWidth - marginLeft - marginRight
      
      // Charger et ajouter le logo
      const logoUrl = '/logo.png'
      const logoImg = new Image()
      logoImg.crossOrigin = 'Anonymous'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
        logoImg.src = logoUrl
      })

      // Dimensions du logo
      const logoSize = 18
      const logoX = marginLeft
      const logoY = 10

      // Ajouter le logo
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)

      // Titre à côté du logo
      doc.setFontSize(18)
      doc.setTextColor(0, 0, 0)
      doc.text('Liste des Pasteurs', logoX + logoSize + 8, logoY + 8)

      // Sous-titre avec les filtres
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      
      let filterText = `Année : ${filters.anneeLabel || 'En cours'}`
      if (filters.paroisseNom) filterText += ` | Paroisse : ${filters.paroisseNom}`
      
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

      // Ligne de séparation
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(marginLeft, logoY + logoSize + 6, pageWidth - marginRight, logoY + logoSize + 6)

      // Données du tableau
      const tableData = pasteurs.map((pasteur, index) => {
        const affectation = pasteur.affectation_actuelle
        const statusJours = affectation ? getDaysUntilEnd(affectation.date_sortie) : null
        
        return [
          (index + 1).toString(),
          `${pasteur.fidele?.nom || ''} ${pasteur.fidele?.prenom || ''}`.trim(),
          pasteur.fidele?.contact || '-',
          getEtudeLabel(pasteur.etude),
          affectation ? affectation.paroisse?.nom || 'Non affecté' : 'Non affecté',
          statusJours !== null ? `${statusJours} j` : '-'
        ]
      })

      // En-têtes du tableau
      const headers = [
        'N°',
        'Nom du pasteur',
        'Contact',
        'Niveau',
        'Paroisse',
        'Fin mandat'
      ]

      let pageCount = 0
      
      // Calcul des largeurs de colonnes (total = tableWidth)
      // Ajustement : plus d'espace pour Contact (+2%), Niveau (+2%), Fin mandat (+2%)
      // Réduction sur Nom (-4%) et Paroisse (-2%)
      const colWidths = [
        tableWidth * 0.08,  // N° - 6%
        tableWidth * 0.23,  // Nom - 24% (réduit de 28%)
        tableWidth * 0.25,  // Contact - 22% (augmenté de 20%)
        tableWidth * 0.17,  // Niveau - 17% (augmenté de 15%)
        tableWidth * 0.17,  // Paroisse - 18% (réduit de 20%)
        tableWidth * 0.10,  // Fin mandat - 13% (augmenté de 11%)
      ]
      
      // Générer le tableau
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: logoY + logoSize + 12,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          textColor: [0, 0, 0],
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          halign: 'left',
          lineWidth: { bottom: 1.5, top: 0, left: 0, right: 0 },
          lineColor: [150, 150, 150],
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { cellWidth: colWidths[0], halign: 'center' },
          1: { cellWidth: colWidths[1] },
          2: { cellWidth: colWidths[2] },
          3: { cellWidth: colWidths[3] },
          4: { cellWidth: colWidths[4] },
          5: { cellWidth: colWidths[5], halign: 'center' },
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        margin: { left: marginLeft, right: marginRight },
        tableLineColor: [200, 200, 200],
        tableLineWidth: 0,
        didDrawPage: () => {
          pageCount++
          
          // Pied de page
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 100)
          
          // Ligne fine avant le pied de page
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.3)
          doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
          
          doc.text(
            `Page ${pageCount}`,
            pageWidth / 2,
            pageHeight - 6,
            { align: 'center' }
          )
          
          doc.text(
            `Total : ${pasteurs.length} pasteur${pasteurs.length > 1 ? 's' : ''}`,
            pageWidth - marginRight,
            pageHeight - 6,
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
        doc.rect(pageWidth / 2 - 20, pageHeight - 8, 40, 4, 'F')
        doc.rect(pageWidth - marginRight - 50, pageHeight - 8, 50, 4, 'F')
        
        // Réécrire avec le total des pages
        doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
        doc.text(
          `Total : ${pasteurs.length} pasteur${pasteurs.length > 1 ? 's' : ''}`,
          pageWidth - marginRight,
          pageHeight - 6,
          { align: 'right' }
        )
      }

      // Résumé sur la dernière page
      doc.setPage(totalPages)
      const finalY = (doc as any).lastAutoTable.finalY + 6
      
      const affectes = pasteurs.filter(p => p.affectation_actuelle).length
      
      if (finalY < pageHeight - 25) {
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        doc.text(`Pasteurs affectés : ${affectes} / ${pasteurs.length}`, marginLeft, finalY)
      }
      
      // Nom du fichier
      const fileName = `pasteurs_${filters.anneeLabel.replace(/\s+/g, '_')}_${dateStr.replace(/[:\s]/g, '-')}.pdf`
      
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  const getDaysUntilEnd = (dateSortie: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const end = new Date(dateSortie)
    end.setHours(0, 0, 0, 0)
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating || pasteurs.length === 0}
      className="px-4 py-2 bg-white text-red-500 text-sm hover:bg-red-50 transition-colors border border-red-300 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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