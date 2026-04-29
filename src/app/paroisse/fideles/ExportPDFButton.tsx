

// app/fideles/ExportPDFButton.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PiFilePdfFill } from 'react-icons/pi'

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  contact: string
  adresse: string | null
  actif: boolean
  sexe: string | null
  annee_naissance: number | null
  fidele_type: string | null
  paroisse_id?: number | null
  paroisse?: {
    id: number
    nom: string
  }
  compte?: any
}

interface StructureInfo {
  region: string | null
  conference: string | null
  district: string | null
  paroisse: string | null
}

interface ExportPDFButtonProps {
  fideles: Fidele[]
  filters: {
    anneeLabel: string
    paroisseNom: string | null
    filterActif?: string
    filterSexe?: string
    filterType?: string
  }
  structureInfo?: StructureInfo | null
}

const FIDELE_TYPE_LABELS: Record<string, string> = {
  'enfant': 'Enfant',
  'jeune': 'Jeune',
  'adulte': 'Adulte',
  'vieillard': 'Vieillard',
}

export default function ExportPDFButton({ fideles, filters, structureInfo }: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getSexeLabel = (sexe: string | null) => {
    if (sexe === 'M') return 'M'
    if (sexe === 'F') return 'F'
    return '-'
  }

  const getFideleTypeLabel = (type: string | null) => {
    if (!type) return '-'
    return FIDELE_TYPE_LABELS[type] || type
  }

  const getAge = (anneeNaissance: number | null) => {
    if (!anneeNaissance) return '-'
    const currentYear = new Date().getFullYear()
    return (currentYear - anneeNaissance).toString()
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
      
      const marginLeft = 15
      const marginRight = 15
      const tableWidth = pageWidth - marginLeft - marginRight

      // Charger la police Lora
      try {
        const fontResponse = await fetch('/lora.ttf')
        const fontBuffer = await fontResponse.arrayBuffer()
        const fontBase64 = btoa(
          new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        
        doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
        doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
        doc.addFileToVFS('Lora-Bold.ttf', fontBase64)
        doc.addFont('Lora-Bold.ttf', 'Lora', 'bold')
      } catch (fontError) {
        console.warn('Impossible de charger la police Lora, utilisation de la police par défaut', fontError)
      }
      
      // Charger et ajouter le logo
      const logoUrl = '/logo.png'
      const logoImg = new Image()
      logoImg.crossOrigin = 'Anonymous'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
        logoImg.src = logoUrl
      })

      const logoSize = 16
      const logoX = marginLeft
      const logoY = 10

      doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)

      // Utiliser les informations de structure passées en prop
      const regionNom = structureInfo?.region || '-'
      const conferenceNom = structureInfo?.conference || '-'
      const districtNom = structureInfo?.district || '-'
      const paroisseNom = structureInfo?.paroisse || filters.paroisseNom || '-'

      // En-tête - Tout en gras et même taille
      const headerFontSize = 11
      doc.setFont('Lora', 'bold')
      doc.setFontSize(headerFontSize)
      doc.setTextColor(0, 0, 0)
      
      // Toutes les lignes en gras et même taille
      doc.text('EGLISE METHODISTE UNIE', pageWidth / 2, logoY + 6, { align: 'center' })
      doc.text(regionNom.toUpperCase(), pageWidth / 2, logoY + 13, { align: 'center' })
      doc.text(conferenceNom.toUpperCase(), pageWidth / 2, logoY + 20, { align: 'center' })
      doc.text(districtNom.toUpperCase(), pageWidth / 2, logoY + 27, { align: 'center' })
      doc.text(`PAROISSE ${paroisseNom.toUpperCase()}`, pageWidth / 2, logoY + 34, { align: 'center' })

      // Titre du document
      doc.setFontSize(12)
      doc.text('LISTE DES FIDÈLES', pageWidth / 2, logoY + 44, { align: 'center' })

      // Filtres appliqués
      doc.setFont('Lora', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(80, 80, 80)
      
      let filterText = `Année : ${filters.anneeLabel || 'En cours'}`
      if (filters.filterActif && filters.filterActif !== 'all') {
        filterText += ` | Statut : ${filters.filterActif === 'actif' ? 'Actifs' : 'Inactifs'}`
      }
      if (filters.filterSexe && filters.filterSexe !== 'all') {
        const sexeLabels: Record<string, string> = { 'M': 'Hommes', 'F': 'Femmes' }
        filterText += ` | Sexe : ${sexeLabels[filters.filterSexe] || filters.filterSexe}`
      }
      if (filters.filterType && filters.filterType !== 'all') {
        const typeLabels: Record<string, string> = {
          'enfant': 'Enfants',
          'jeune': 'Jeunes',
          'adulte': 'Adultes',
          'vieillard': 'Vieillards',
          'non_renseigne': 'Non renseigné'
        }
        filterText += ` | Catégorie : ${typeLabels[filters.filterType] || filters.filterType}`
      }
      
      doc.text(filterText, marginLeft, logoY + 51)

      // Date d'export
      const today = new Date()
      const dateStr = today.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.setFontSize(7)
      doc.setTextColor(0, 0, 0)
      doc.text(`Exporté le ${dateStr}`, pageWidth - marginRight, logoY + 51, { align: 'right' })

      // Ligne de séparation
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(marginLeft, logoY + 54, pageWidth - marginRight, logoY + 54)

      // Données du tableau (sans Statut et Compte)
      const tableData = fideles.map((fidele, index) => {
        return [
          (index + 1).toString(),
          `${fidele.nom} ${fidele.post_nom || ''} ${fidele.prenom}`.trim().replace(/\s+/g, ' '),
          getFideleTypeLabel(fidele.fidele_type),
          getSexeLabel(fidele.sexe),
          getAge(fidele.annee_naissance),
          fidele.contact,
          fidele.adresse || '-',
        ]
      })

      // En-têtes (sans Statut et Compte)
      const headers = [
        'N°',
        'Nom complet',
        'Catégorie',
        'Sexe',
        'Âge',
        'Contact',
        'Adresse',
      ]

      let pageCount = 0
      
      // Largeurs des colonnes pour 7 colonnes en A4 portrait
      const colWidths = [
        tableWidth * 0.06,  // N°
        tableWidth * 0.22,  // Nom
        tableWidth * 0.12,  // Catégorie
        tableWidth * 0.08,  // Sexe
        tableWidth * 0.07,  // Âge
        tableWidth * 0.20,  // Contact
        tableWidth * 0.25,  // Adresse
      ]
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: logoY + 58,
        styles: {
          font: 'Lora',
          fontSize: 7,
          cellPadding: 2.5,
          textColor: [0, 0, 0],
          lineColor: [150, 150, 150],
          lineWidth: 0.2,
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
          lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { cellWidth: colWidths[0], halign: 'center' },
          1: { cellWidth: colWidths[1] },
          2: { cellWidth: colWidths[2], halign: 'center' },
          3: { cellWidth: colWidths[3], halign: 'center' },
          4: { cellWidth: colWidths[4], halign: 'center' },
          5: { cellWidth: colWidths[5] },
          6: { cellWidth: colWidths[6] },
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248],
        },
        margin: { left: marginLeft, right: marginRight },
        didDrawPage: (data) => {
          pageCount++
          
          doc.setFont('Lora', 'normal')
          doc.setFontSize(7)
          doc.setTextColor(100, 100, 100)
          
          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.3)
          doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
          
          doc.text(`Page ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
          doc.text(
            `Total : ${fideles.length} fidèle${fideles.length > 1 ? 's' : ''}`,
            pageWidth - marginRight,
            pageHeight - 6,
            { align: 'right' }
          )
        },
      })

      const totalPages = (doc as any).internal.pages.length - 1
      
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFont('Lora', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        
        doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
        doc.text(
          `Total : ${fideles.length} fidèle${fideles.length > 1 ? 's' : ''}`,
          pageWidth - marginRight,
          pageHeight - 6,
          { align: 'right' }
        )
      }

      // Résumé
      doc.setPage(totalPages)
      const finalY = (doc as any).lastAutoTable.finalY + 8
      
      const actifs = fideles.filter(f => f.actif).length
      const hommes = fideles.filter(f => f.sexe === 'M').length
      const femmes = fideles.filter(f => f.sexe === 'F').length
      
      // Statistiques par catégorie
      const enfants = fideles.filter(f => f.fidele_type === 'enfant').length
      const jeunes = fideles.filter(f => f.fidele_type === 'jeune').length
      const adultes = fideles.filter(f => f.fidele_type === 'adulte').length
      const vieillards = fideles.filter(f => f.fidele_type === 'vieillard').length
      
      if (finalY < pageHeight - 25) {
        doc.setFont('Lora', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        doc.text('Résumé :', marginLeft, finalY)
        
        doc.setFont('Lora', 'normal')
        doc.setFontSize(7)
        
        // Première ligne : stats générales
        const resumeText1 = `Actifs : ${actifs} | Hommes : ${hommes} | Femmes : ${femmes}`
        doc.text(resumeText1, marginLeft, finalY + 5)
        
        // Deuxième ligne : stats par catégorie
        const resumeText2 = `Enfants : ${enfants} | Jeunes : ${jeunes} | Adultes : ${adultes} | Vieillards : ${vieillards}`
        doc.text(resumeText2, marginLeft, finalY + 10)
      }
      
      const fileName = `fideles_${paroisseNom.toLowerCase().replace(/\s+/g, '_')}_${filters.anneeLabel.replace(/\s+/g, '_')}_${dateStr.replace(/[:\s]/g, '-')}.pdf`
      
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
      disabled={isGenerating || fideles.length === 0}
      className="px-4 py-2 bg-white text-red-500 text-sm hover:bg-red-50 transition-colors border border-red-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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