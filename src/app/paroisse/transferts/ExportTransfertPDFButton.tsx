

// app/paroisse/transferts/ExportTransfertPDFButton.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import { PiFilePdfFill } from 'react-icons/pi'

interface Transfert {
  id: number
  sens: 'entrant' | 'sortant'
  statut: 'en_attente' | 'accepte' | 'refuse' | 'annule'
  type_transfert: 'paroisse' | 'mission'
  date_debut: string
  date_fin: string | null
  code_transfert: string | null
  motif: string | null
  fidele: {
    id: number
    nom: string
    post_nom: string
    prenom: string
    contact: string
    sexe: string | null
    annee_naissance: number | null
  }
  source: {
    id: number
    nom: string
  } | null
  destination: {
    id: number
    nom: string
  } | null
}

interface StructureInfo {
  region: string | null
  conference: string | null
  district: string | null
  paroisse: string | null
}

interface ExportTransfertPDFButtonProps {
  transfert: Transfert
  structureInfo: StructureInfo
  currentUserName?: string
}

export default function ExportTransfertPDFButton({ 
  transfert, 
  structureInfo,
  currentUserName = 'Pasteur Principal'
}: ExportTransfertPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const getAge = (anneeNaissance: number | null) => {
    if (!anneeNaissance) return '-'
    const currentYear = new Date().getFullYear()
    return (currentYear - anneeNaissance).toString()
  }

  const getSexeLabel = (sexe: string | null) => {
    if (!sexe) return 'Non précisé'
    if (sexe === 'M') return 'Masculin'
    if (sexe === 'F') return 'Féminin'
    return sexe
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      const marginLeft = 20
      const marginRight = 20
      const contentWidth = pageWidth - marginLeft - marginRight

      // Charger la police Lora
      try {
        const fontResponse = await fetch('/lora.ttf')
        const fontBuffer = await fontResponse.arrayBuffer()
        const fontBase64 = btoa(
          new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        
        doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
        doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
        doc.addFont('Lora-Regular.ttf', 'Lora', 'black')
        doc.addFont('Lora-Regular.ttf', 'Lora', 'bold')
      } catch (fontError) {
        console.warn('Impossible de charger la police Lora', fontError)
      }
      
      // Charger le logo
      const logoImg = new Image()
      logoImg.crossOrigin = 'Anonymous'
      
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve
        logoImg.onerror = reject
        logoImg.src = '/logo.png'
      })

      const logoSize = 20
      const logoX = marginLeft
      const logoY = 15

      doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)

      // En-tête de l'Église
      doc.setFont('Lora', 'normal')
      
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text('EGLISE METHODISTE UNIE', pageWidth / 2, logoY + 8, { align: 'center' })
      
      doc.setFontSize(14)
      doc.text(`REGION EPISCOPALE DU ${structureInfo.region?.toUpperCase() || '-'}`, pageWidth / 2, logoY + 16, { align: 'center' })
      doc.setFontSize(14)
      doc.text(`CONFERENCE ${structureInfo.conference?.toUpperCase() || '-'}`, pageWidth / 2, logoY + 23, { align: 'center' })
      doc.text(`DISTRICT ${structureInfo.district?.toUpperCase() || '-'}`, pageWidth / 2, logoY + 30, { align: 'center' })
      
      doc.setFontSize(14)
      doc.setFont('Lora', 'black')
      doc.text(`PAROISSE ${structureInfo.paroisse?.toUpperCase() || '-'}`, pageWidth / 2, logoY + 39, { align: 'center' })

      // Titre du document selon le statut
      doc.setFontSize(14)
      doc.setFont('Lora', 'bold')
      doc.setTextColor(0, 0, 0)
      
      let titreDocument = ''
      if (transfert.statut === 'accepte') {
        titreDocument = transfert.type_transfert === 'mission' 
          ? 'ATTESTATION DE MISSION' 
          : 'ATTESTATION DE TRANSFERT'
      } else {
        titreDocument = transfert.type_transfert === 'mission' 
          ? 'DEMANDE DE MISSION' 
          : 'DEMANDE DE TRANSFERT'
      }
      
      doc.text(titreDocument, pageWidth / 2, logoY + 55, { align: 'center' })

      // Ligne décorative
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(marginLeft + 30, logoY + 62, pageWidth - marginRight - 30, logoY + 62)

      let yPos = logoY + 78

      // Corps du document
      doc.setFont('Lora', 'normal')
      doc.setFontSize(11)
      
      const paroisseSource = transfert.source?.nom || structureInfo.paroisse || 'Notre Paroisse'
      const paroisseDestination = transfert.destination?.nom || null
      const nomComplet = `${transfert.fidele.nom} ${transfert.fidele.post_nom || ''} ${transfert.fidele.prenom}`.trim().replace(/\s+/g, ' ')
      
      // Texte principal selon le statut et le sens
      let textePrincipal = ''
      let suiteTexte = ''
      
      if (transfert.statut === 'accepte') {
        // ===== TRANSFERT ACCEPTÉ =====
        if (transfert.sens === 'sortant') {
          textePrincipal = `Nous, Paroisse ${paroisseSource}, attestons par la présente que le fidèle `
          suiteTexte = `, a été transféré vers ${paroisseDestination}`
        } else {
          textePrincipal = `Nous, Paroisse ${paroisseDestination}, attestons par la présente avoir reçu le fidèle `
          suiteTexte = ` en provenance de ${paroisseSource}`
        }
      } else {
        // ===== TRANSFERT EN ATTENTE =====
        if (transfert.sens === 'sortant') {
          textePrincipal = `Nous, Paroisse ${paroisseSource}, certifions par la présente que le fidèle `
          suiteTexte = `, est en cours de transfert vers une autre paroisse de l'Église Méthodiste Unie`
        } else {
          textePrincipal = `Nous, soussignés, certifions par la présente que le fidèle `
          suiteTexte = `, est en cours de transfert vers votre paroisse`
        }
      }

      // Fonction pour écrire du texte avec retour à la ligne
      const writeText = (text: string, y: number, fontSize: number = 11): number => {
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, contentWidth)
        doc.text(lines, marginLeft, y)
        return y + (lines.length * (fontSize * 0.4))
      }

      // Première partie
      yPos = writeText(textePrincipal, yPos) + 2

      // Nom du fidèle en gras
      doc.setFont('Lora', 'bold')
      doc.text(nomComplet, marginLeft, yPos)
      const nomWidth = doc.getTextWidth(nomComplet)
      doc.setFont('Lora', 'normal')
      doc.text(suiteTexte, marginLeft + nomWidth + 2, yPos)
      yPos += 8

      // Informations sur le fidèle
      const sexeLabel = getSexeLabel(transfert.fidele.sexe)
      const anneeNaissance = transfert.fidele.annee_naissance || 'non précisé'
      const age = getAge(transfert.fidele.annee_naissance)
      
      yPos = writeText(`Le fidèle ${nomComplet} est né en ${anneeNaissance} (${age}), de sexe ${sexeLabel}. Il est joignable au numéro de téléphone suivant : ${transfert.fidele.contact}.`, yPos)
      yPos += 8

      // Informations sur les paroisses
      if (transfert.sens === 'sortant') {
        yPos = writeText(`Paroisse d'origine : ${paroisseSource}`, yPos)
        yPos += 4
      }
      
      // Ne mentionner la destination QUE si elle existe (transfert accepté)
      if (paroisseDestination && transfert.statut === 'accepte') {
        yPos = writeText(`Paroisse de destination : ${paroisseDestination}`, yPos)
        yPos += 4
      }

      // Type de transfert et dates
      if (transfert.type_transfert === 'mission') {
        const debutLabel = transfert.statut === 'accepte' ? 'a débuté' : 'débutera'
        yPos = writeText(`Il s'agit d'une mission temporaire qui ${debutLabel} le ${new Date(transfert.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, yPos)
        if (transfert.date_fin) {
          yPos = writeText(`et prendra fin le ${new Date(transfert.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}.`, yPos)
        } else {
          yPos = writeText(`.`, yPos)
        }
      } else {
        const dateDebut = new Date(transfert.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        if (transfert.statut === 'accepte') {
          yPos = writeText(`Ce transfert définitif a pris effet à partir du ${dateDebut}.`, yPos)
        } else {
          yPos = writeText(`Ce transfert définitif prendra effet à partir du ${dateDebut}.`, yPos)
        }
      }
      yPos += 8

      // Motif si présent
      if (transfert.motif) {
        const typeLabel = transfert.type_transfert === 'mission' ? 'de la mission' : 'du transfert'
        yPos = writeText(`Motif ${typeLabel} : ${transfert.motif}`, yPos)
        yPos += 8
      }

      // Message final selon le statut
      if (transfert.statut === 'accepte') {
        yPos = writeText(`Ce document est délivré pour servir et valoir ce que de droit. Il atteste officiellement du ${transfert.type_transfert === 'mission' ? 'départ en mission' : 'transfert'} du fidèle susmentionné au sein de l'Église Méthodiste Unie.`, yPos)
      } else {
        if (transfert.sens === 'sortant') {
          yPos = writeText(`Ce document certifie que le fidèle susmentionné quitte notre paroisse pour rejoindre une autre communauté de l'Église Méthodiste Unie. Il est délivré pour servir et valoir ce que de droit auprès de la paroisse d'accueil.`, yPos)
        } else {
          yPos = writeText(`Ce document certifie que le fidèle susmentionné est en cours de transfert vers votre paroisse. Il est délivré pour servir et valoir ce que de droit.`, yPos)
        }
      }
      yPos += 12

      // Code de transfert (si disponible)
      if (transfert.code_transfert) {
        doc.setFont('Lora', 'bold')
        doc.setFontSize(10)
        if (transfert.statut === 'accepte') {
          doc.text('Référence du transfert :', marginLeft, yPos)
          doc.setFont('Lora', 'normal')
          doc.setFontSize(12)
          doc.text(transfert.code_transfert, marginLeft + 55, yPos)
        } else {
          doc.text('Code de transfert :', marginLeft, yPos)
          doc.setFont('Lora', 'normal')
          doc.setFontSize(12)
          doc.text(transfert.code_transfert, marginLeft + 45, yPos)
          
          // Note explicative pour le code
          yPos += 8
          doc.setFont('Lora', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(100, 100, 100)
          doc.text('Ce code à 6 chiffres doit être communiqué à la paroisse de destination pour finaliser le transfert.', marginLeft, yPos)
          doc.setTextColor(0, 0, 0)
        }
        yPos += 15
      }

      // Date du document
      const today = new Date()
      const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      doc.setFont('Lora', 'normal')
      doc.setFontSize(10)
      doc.text(`Fait à ${structureInfo.paroisse || 'ERREUR'}, le ${dateStr}`, marginLeft, yPos)
      
      yPos += 25

      // Signatures
      const colWidth = contentWidth / 2 - 10
      
      // Colonne Pasteur
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.3)
      doc.line(marginLeft, yPos - 5, marginLeft + colWidth, yPos - 5)
      doc.setFont('Lora', 'bold')
      doc.setFontSize(10)
      doc.text('Le Pasteur', marginLeft, yPos)
      doc.setFont('Lora', 'normal')
      doc.setFontSize(9)
      doc.text(currentUserName, marginLeft, yPos + 6)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('(Signature et cachet)', marginLeft, yPos + 12)

      // Colonne Secrétaire
      doc.setDrawColor(0, 0, 0)
      doc.line(pageWidth / 2 + 10, yPos - 5, pageWidth - marginRight, yPos - 5)
      doc.setFont('Lora', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text('Le Secrétaire', pageWidth / 2 + 10, yPos)
      doc.setFont('Lora', 'normal')
      doc.setFontSize(9)
      doc.text('Secrétaire de Paroisse', pageWidth / 2 + 10, yPos + 6)
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text('(Signature)', pageWidth / 2 + 10, yPos + 12)

      // Pied de page
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      const statutLabel = transfert.statut === 'accepte' ? 'Accepté' : 'En attente'
      const sensLabel = transfert.sens === 'sortant' ? 'Sortant' : 'Entrant'
      doc.text(`Document généré le ${today.toLocaleString('fr-FR')} - Réf: TRF-${transfert.id} - Statut: ${statutLabel} (${sensLabel})`, marginLeft, pageHeight - 8)
      doc.text('Église Méthodiste Unie - Bureau de Paroisse', pageWidth - marginRight, pageHeight - 8, { align: 'right' })

      // Nom du fichier
      const typeDoc = transfert.type_transfert === 'mission' ? 'mission' : 'transfert'
      const statutDoc = transfert.statut === 'accepte' ? 'attestation' : 'demande'
      const sensDoc = transfert.sens === 'sortant' ? 'sortant' : 'entrant'
      const fileName = `${statutDoc}_${typeDoc}_${sensDoc}_${transfert.fidele.nom}_${transfert.fidele.prenom}_${dateStr.replace(/\s+/g, '_')}.pdf`
      
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  // Texte du bouton selon le statut et le sens
  const getButtonText = () => {
    if (transfert.statut === 'accepte') {
      return 'Attestation PDF'
    } else {
      return transfert.sens === 'sortant' ? 'Demande de sortie' : 'Demande d\'entrée'
    }
  }

  // Titre du bouton
  const getButtonTitle = () => {
    if (transfert.statut === 'accepte') {
      return "Télécharger l'attestation officielle"
    } else {
      return transfert.sens === 'sortant' 
        ? "Télécharger la demande de transfert sortant" 
        : "Télécharger la demande de transfert entrant"
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="px-3 py-1.5 text-xs bg-white text-red-600 hover:bg-red-50 transition-colors border border-red-300 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      title={getButtonTitle()}
    >
      {isGenerating ? (
        <>
          <span className="animate-spin rounded-full h-3 w-3 border-2 border-red-500 border-t-transparent"></span>
          Génération...
        </>
      ) : (
        <>
          <PiFilePdfFill className='text-red-500 text-sm' />
          {getButtonText()}
        </>
      )}
    </button>
  )
}