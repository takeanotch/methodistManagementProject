
// app/paroisse/fideles/[id]/ExportCarteFideleButton.tsx
'use client'

import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { PiAddressBook } from 'react-icons/pi'

interface Fidele {
  id: number
  nom: string
  post_nom: string
  prenom: string
  contact: string
  adresse: string | null
  profile_img: string | null
  created_at: string
  annee_naissance: number | null
  sexe: string | null
  paroisse_id: number | null
  paroisse?: {
    id: number
    nom: string
  } | null
}

interface ExportCarteFideleButtonProps {
  fidele: Fidele
  structureInfo?: {
    region?: string | null
    conference?: string | null
    district?: string | null
  }
}

export default function ExportCarteFideleButton({ 
  fidele, 
  structureInfo = {} 
}: ExportCarteFideleButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [signatureImage, setSignatureImage] = useState<string | null>(null)

  // Charger le logo et la signature au montage du composant
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.src = '/logo.png'
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        setLogoImage(canvas.toDataURL('image/png'))
      } catch (error) {
        console.warn('Impossible de charger le logo:', error)
      }
    }

    const loadSignature = async () => {
      try {
        const img = new Image()
        img.crossOrigin = 'Anonymous'
        img.src = '/sign.png'
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0)
        setSignatureImage(canvas.toDataURL('image/png'))
      } catch (error) {
        console.warn('Impossible de charger la signature:', error)
      }
    }
    
    loadLogo()
    loadSignature()
  }, [])

  const getAge = (anneeNaissance: number | null): string => {
    if (!anneeNaissance) return '-'
    return (new Date().getFullYear() - anneeNaissance).toString()
  }

  const getSexeLabel = (sexe: string | null): string => {
    if (!sexe) return '-'
    if (sexe === 'M') return 'Masculin'
    if (sexe === 'F') return 'Féminin'
    return sexe
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getInitials = (): string => {
    return `${fidele.nom.charAt(0)}${fidele.prenom.charAt(0)}`.toUpperCase()
  }

  const getAvatarColor = (): string => {
    if (fidele.sexe === 'M') return '#DC2626' // blue-600
    if (fidele.sexe === 'F') return '#EF4444' // blue-500
    return '#991B1B' // blue-800
  }

  const generateAvatar = (): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 100
    canvas.height = 100
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Fond avec dégradé
      const gradient = ctx.createLinearGradient(0, 0, 100, 100)
      const baseColor = getAvatarColor()
      gradient.addColorStop(0, baseColor)
      gradient.addColorStop(1, baseColor)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(50, 50, 50, 0, Math.PI * 2)
      ctx.fill()
      
      // Initiales
      ctx.font = 'bold 40px Arial'
      ctx.fillStyle = '#FFFFFF'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(getInitials(), 50, 50)
    }
    
    return canvas.toDataURL('image/png')
  }

  const generateQRCode = async (): Promise<string> => {
    // Contenu du QR code : uniquement paroisse_id et fidele_id
    const qrData = JSON.stringify({
      paroisse_id: fidele.paroisse_id,
      fidele_id: fidele.id
    })
    
    try {
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      return qrDataUrl
    } catch (error) {
      console.error('Erreur génération QR code:', error)
      return ''
    }
  }

  const generatePDF = async () => {
    setIsGenerating(true)
    
    try {
      // Format carte de membre : 85.6mm x 53.98mm (format carte de crédit)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98]
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      const marginLeft = 3
      const marginRight = 3
      const marginTop = 2

      // Fond blanc
      doc.setFillColor(255, 255, 255)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Bordure rouge uniquement
      doc.setDrawColor(220, 38, 38) // Rouge
      doc.setLineWidth(0.8)
      doc.rect(1.5, 1.5, pageWidth - 3, pageHeight - 3)

      // ===== LOGO =====
      if (logoImage) {
        try {
          doc.addImage(logoImage, 'PNG', marginLeft + 2, marginTop + 2, 10, 10)
        } catch (error) {
          console.warn('Erreur ajout logo:', error)
        }
      }

      // ===== PHOTO/Avatar (déplacé plus haut) =====
      const photoX = pageWidth - marginRight - 18
      const photoY = marginTop + 4
      const photoSize = 13
      
      // Cadre photo rouge
      doc.setDrawColor(220, 38, 38) // Rouge
      doc.setLineWidth(0.5)
      doc.rect(photoX, photoY, photoSize, photoSize)
      
      try {
        let imageToUse: string
        
        if (fidele.profile_img) {
          const img = new Image()
          img.crossOrigin = 'Anonymous'
          
          await new Promise((resolve, reject) => {
            img.onload = resolve
            img.onerror = reject
            img.src = fidele.profile_img || '/logo.png'
          })
          
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0)
          imageToUse = canvas.toDataURL('image/jpeg')
        } else {
          imageToUse = generateAvatar()
        }
        
        doc.addImage(imageToUse, 'JPEG', photoX + 0.5, photoY + 0.5, photoSize - 1, photoSize - 1)
      } catch (error) {
        console.warn('Erreur chargement image:', error)
        // Fallback : cercle avec initiales directement dans le PDF
        doc.setFillColor(getAvatarColor() as any)
        doc.circle(photoX + photoSize/2, photoY + photoSize/2, (photoSize-1)/2, 'F')
        doc.setFontSize(6)
        doc.setTextColor(255, 255, 255)
        doc.text(getInitials(), photoX + photoSize/2, photoY + photoSize/2 + 2, { align: 'center' })
      }

      // ===== EN-TÊTE =====
      
      doc.setFontSize(5.5)
      doc.setTextColor(220, 38, 38) // Rouge
      doc.text('ÉGLISE MÉTHODISTE UNIE', pageWidth / 2, marginTop + 5, { align: 'center' })
      
      // Structure ecclésiale
      doc.setFontSize(4)
      doc.setTextColor(100, 100, 100)
      const conferenceText = structureInfo.conference || 'CONFERENCE DU CONGO CENTRAL'
      doc.text(conferenceText, pageWidth / 2, marginTop + 8, { align: 'center' })
      
      doc.setFontSize(7)
      doc.setTextColor(0, 0,0 ) // Rouge
      doc.text('CARTE DE MEMBRE', pageWidth / 2, marginTop + 12, { align: 'center' })

      doc.setDrawColor(212, 175, 55)
      doc.setLineWidth(0.3)
      doc.line(pageWidth * 0.2, marginTop + 14, pageWidth * 0.8, marginTop + 14)

      // ===== INFORMATIONS DU FIDÈLE =====
      
      let yPos = marginTop + 19
      const labelColor: [number, number, number] = [100, 100, 100]
      const valueColor: [number, number, number] = [0, 0, 0]
      
      doc.setFontSize(5.5)
      
      // N° de membre
      doc.setTextColor(...labelColor)
      doc.text('N° Membre:', marginLeft + 2, yPos)
      doc.setTextColor(...valueColor)
      doc.text(fidele.id.toString().padStart(6, '0'), marginLeft + 16, yPos)

      // Date d'inscription
      doc.setTextColor(...labelColor)
      doc.text('Inscrit le:', pageWidth / 2 + 5, yPos)
      doc.setTextColor(...valueColor)
      doc.text(formatDate(fidele.created_at), pageWidth / 2 + 16, yPos)

      yPos += 5.5

      // Nom complet
      doc.setFontSize(7.5)
      doc.setTextColor(220, 38, 38) // Rouge
      const nomComplet = `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`.trim().replace(/\s+/g, ' ')
      doc.text(nomComplet, pageWidth / 2, yPos, { align: 'center' })
      
      yPos += 4.5

      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.1)
      doc.line(marginLeft + 2, yPos, pageWidth - marginRight - 2, yPos)
      
      yPos += 3.5

      doc.setFontSize(5)
      
      // Colonne gauche
      let leftY = yPos
      
      doc.setTextColor(...labelColor)
      doc.text('Sexe:', marginLeft + 2, leftY)
      doc.setTextColor(...valueColor)
      doc.text(getSexeLabel(fidele.sexe), marginLeft + 11, leftY)
      
      leftY += 3
      
      doc.setTextColor(...labelColor)
      doc.text('Né(e) en:', marginLeft + 2, leftY)
      doc.setTextColor(...valueColor)
      const age = getAge(fidele.annee_naissance)
      const naissanceText = fidele.annee_naissance 
        ? `${fidele.annee_naissance} (${age} ans)`
        : '-'
      doc.text(naissanceText, marginLeft + 11, leftY)
      
      leftY += 3
      
      doc.setTextColor(...labelColor)
      doc.text('Contact:', marginLeft + 2, leftY)
      doc.setTextColor(...valueColor)
      doc.text(fidele.contact, marginLeft + 11, leftY)

      // Colonne droite
      let rightY = yPos
      const col2X = pageWidth / 2 + 3
      
      doc.setTextColor(...labelColor)
      doc.text('Paroisse:', col2X, rightY)
      doc.setTextColor(...valueColor)
      const paroisseNom = fidele.paroisse?.nom || '-'
      const paroisseText = paroisseNom.length > 20 ? paroisseNom.substring(0, 18) + '...' : paroisseNom
      doc.text(paroisseText, col2X + 11, rightY)
      
      rightY += 3
      
      // District
      if (structureInfo.district) {
        doc.setTextColor(...labelColor)
        doc.text('District:', col2X, rightY)
        doc.setTextColor(...valueColor)
        doc.text(structureInfo.district, col2X + 11, rightY)
        rightY += 3
      }

      yPos = Math.max(leftY, rightY) + 4

      // Adresse si présente
      if (fidele.adresse) {
        doc.setFontSize(4.5)
        doc.setTextColor(...labelColor)
        doc.text('Adresse:', marginLeft + 2, yPos)
        doc.setTextColor(...valueColor)
        
        const adresseText = fidele.adresse.length > 30 ? fidele.adresse.substring(0, 28) + '...' : fidele.adresse
        doc.text(adresseText, marginLeft + 11, yPos)
        yPos += 3
      }

      // ===== QR CODE =====
      try {
        const qrDataUrl = await generateQRCode()
        if (qrDataUrl) {
          const qrX = pageWidth - marginRight - 12
          const qrY = pageHeight - 15
          const qrSize = 11
          
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
          
          doc.setFontSize(2.5)
          doc.setTextColor(150, 150, 150)
          doc.text('Scanner pour vérifier', qrX + qrSize/2, qrY + qrSize + 2, { align: 'center' })
        }
      } catch (error) {
        console.warn('Erreur génération QR code:', error)
      }

      // Mention légale
      doc.setFontSize(3)
      doc.setTextColor(150, 150, 150)
      doc.text('Carte officielle - Église Méthodiste Unie', marginLeft + 2, pageHeight - 2.5)
      
      // Signature du Pasteur avec image /sign.png
      doc.setDrawColor(220, 38, 38) // Rouge
      doc.setLineWidth(0.2)
      doc.line(marginLeft + 2, pageHeight - 6, marginLeft + 25, pageHeight - 6)
      
      // Ajouter l'image de signature si elle existe
      if (signatureImage) {
        try {
          doc.addImage(signatureImage, 'PNG', marginLeft + 2, pageHeight - 7, 23, 4)
        } catch (error) {
          console.warn('Erreur ajout signature:', error)
        }
      }
      
      doc.setFontSize(2.5)
      doc.setTextColor(150, 150, 150)
      doc.text('Signature du Pasteur', marginLeft + 2, pageHeight - 3.5)

      // Nom du fichier
      const fileName = `carte_membre_${fidele.nom}_${fidele.prenom}_${fidele.id}.pdf`
      
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erreur génération carte PDF:', error)
      alert('Erreur lors de la génération de la carte')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="px-3 py-2 text-sm bg-white text-blue-600 hover:bg-blue-50 transition-colors border border-blue-300  flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Générer la carte de membre au format PDF"
    >
      {isGenerating ? (
        <>
          <span className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></span>
          Génération...
        </>
      ) : (
        <>
          <PiAddressBook size={14} className="text-blue-500" />
          Carte de membre
        </>
      )}
    </button>
  )
}