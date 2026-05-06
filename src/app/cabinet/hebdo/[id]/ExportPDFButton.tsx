// // // app/hebdo/[id]/ExportPDFButton.tsx
// // 'use client'

// // import { useState } from 'react'
// // import jsPDF from 'jspdf'
// // import { Download } from 'lucide-react'
// // import { format } from 'date-fns'
// // import { fr } from 'date-fns/locale'

// // interface HebdoSection {
// //   id: number
// //   titre: string
// //   description: string | null
// //   description_html?: string | null
// // }

// // interface HebdoPDFData {
// //   title: string
// //   date: string | Date
// //   theme: string | null
// //   predicateur: string | null
// //   officiants: string[]
// //   activites: string | null
// //   sections?: HebdoSection[]
// //   hierarchy: {
// //     region: string | null
// //     conference: string | null
// //     district: string | null
// //   }
// //   paroisse?: {
// //     nom: string
// //   } | null
// // }

// // interface ExportPDFButtonProps {
// //   hebdo: HebdoPDFData
// // }

// // // Fonction pour convertir le markdown en texte formaté pour le PDF
// // function markdownToFormattedText(markdown: string): string {
// //   if (!markdown) return ''
  
// //   return markdown
// //     .replace(/^## (.+)$/gm, '\n$1\n' + '─'.repeat(40) + '\n')
// //     .replace(/^- (.+)$/gm, '  • $1')
// //     .replace(/==(.+?)==/g, '[SURLIGNÉ] $1 [/SURLIGNÉ]')
// //     .replace(/\*\*(.+?)\*\*/g, '[GRAS] $1 [/GRAS]')
// //     .replace(/\*(.+?)\*/g, '[ITALIQUE] $1 [/ITALIQUE]')
// //     .replace(/__(.+?)__/g, '[SOULIGNÉ] $1 [/SOULIGNÉ]')
// // }

// // export default function ExportPDFButton({ hebdo }: ExportPDFButtonProps) {
// //   const [isGenerating, setIsGenerating] = useState(false)

// //   const parseAndRenderHtml = (
// //     doc: jsPDF, 
// //     html: string, 
// //     startY: number, 
// //     marginLeft: number, 
// //     pageWidth: number,
// //     marginRight: number,
// //     styles: any = {}
// //   ): number => {
// //     if (!html) return startY

// //     // Si le HTML contient déjà du markdown converti, on le traite
// //     const defaultStyles = {
// //       fontSize: 10,
// //       fontFamily: 'Lora',
// //       fontWeight: 'normal',
// //       color: [40, 40, 40],
// //       marginBottom: 5,
// //       marginTop: 3,
// //       marginLeft: 0,
// //       ...styles
// //     }

// //     let yPos = startY
// //     const maxWidth = pageWidth - marginLeft - marginRight - defaultStyles.marginLeft
// //     const pageHeight = doc.internal.pageSize.getHeight()

// //     const tempDiv = document.createElement('div')
// //     tempDiv.innerHTML = html

// //     const processNode = (node: Node, currentStyles: any, indentLevel: number = 0): number => {
// //       const indent = indentLevel * 5

// //       if (node.nodeType === Node.TEXT_NODE) {
// //         const text = node.textContent?.trim() || ''
// //         if (!text) return yPos

// //         doc.setFontSize(currentStyles.fontSize)
// //         doc.setFont(currentStyles.fontFamily, currentStyles.fontWeight)
// //         doc.setTextColor(currentStyles.color[0], currentStyles.color[1], currentStyles.color[2])

// //         // Vérifier si le texte est dans un élément avec style
// //         const parent = node.parentElement
// //         if (parent) {
// //           const tagName = parent.tagName.toLowerCase()
// //           const parentStyle = parent.getAttribute('style') || ''
          
// //           // Gras
// //           if (tagName === 'strong' || parentStyle.includes('font-weight: 600') || parentStyle.includes('font-weight: bold')) {
// //             doc.setFont(currentStyles.fontFamily, 'bold')
// //           }
          
// //           // Italique
// //           if (tagName === 'em' || parentStyle.includes('font-style: italic')) {
// //             doc.setFont(currentStyles.fontFamily, 'italic')
// //           }
          
// //           // Souligné
// //           if (tagName === 'u' || parentStyle.includes('text-decoration: underline')) {
// //             // jsPDF ne supporte pas directement le souligné, on simule
// //             const textWidth = doc.getTextWidth(text)
// //             doc.setDrawColor(currentStyles.color[0], currentStyles.color[1], currentStyles.color[2])
// //             doc.line(
// //               marginLeft + defaultStyles.marginLeft + indent,
// //               yPos + 1,
// //               marginLeft + defaultStyles.marginLeft + indent + textWidth,
// //               yPos + 1
// //             )
// //           }
          
// //           // Surlignage
// //           if (tagName === 'mark' || parentStyle.includes('background-color: #FEF08A')) {
// //             doc.setFillColor(254, 240, 138)
// //             const textWidth = doc.getTextWidth(text)
// //             doc.rect(
// //               marginLeft + defaultStyles.marginLeft + indent,
// //               yPos - currentStyles.fontSize * 0.35,
// //               textWidth,
// //               currentStyles.fontSize * 0.5,
// //               'F'
// //             )
// //           }
// //         }

// //         const lines = doc.splitTextToSize(text, maxWidth - indent)
        
// //         for (const line of lines) {
// //           if (yPos > pageHeight - 25) {
// //             doc.addPage()
// //             yPos = 25
// //           }
// //           doc.text(line, marginLeft + defaultStyles.marginLeft + indent, yPos)
// //           yPos += currentStyles.fontSize * 0.5
// //         }
        
// //         return yPos
// //       }

// //       if (node.nodeType === Node.ELEMENT_NODE) {
// //         const element = node as HTMLElement
// //         const tagName = element.tagName.toLowerCase()
// //         const newStyles = { ...currentStyles }

// //         switch (tagName) {
// //           case 'h2':
// //             newStyles.fontSize = 16
// //             newStyles.fontWeight = 'bold'
// //             newStyles.marginTop = 8
// //             newStyles.marginBottom = 6
// //             newStyles.color = [0, 0, 0]
// //             break
// //           case 'mark':
// //             break
// //           case 'strong':
// //           case 'b':
// //             newStyles.fontWeight = 'bold'
// //             break
// //           case 'em':
// //           case 'i':
// //             break
// //           case 'u':
// //             break
// //           case 'p':
// //             newStyles.marginTop = 4
// //             newStyles.marginBottom = 4
// //             break
// //           case 'div':
// //             if (element.innerHTML === '<br>' || element.innerHTML === '') {
// //               yPos += currentStyles.fontSize * 0.5
// //               return yPos
// //             }
// //             newStyles.marginTop = 2
// //             newStyles.marginBottom = 2
// //             break
// //           case 'br':
// //             yPos += currentStyles.fontSize * 0.5
// //             return yPos
// //         }

// //         if (['p', 'div', 'h2'].includes(tagName)) {
// //           yPos += newStyles.marginTop
// //         }

// //         const children = Array.from(element.childNodes)
// //         for (const child of children) {
// //           yPos = processNode(child, newStyles, indentLevel)
// //         }

// //         if (['p', 'div', 'h2'].includes(tagName)) {
// //           yPos += newStyles.marginBottom
// //         }

// //         return yPos
// //       }

// //       return yPos
// //     }

// //     const bodyChildren = Array.from(tempDiv.childNodes)
// //     for (const child of bodyChildren) {
// //       yPos = processNode(child, defaultStyles)
// //     }

// //     return yPos
// //   }

// //   const generatePDF = async () => {
// //     setIsGenerating(true)
    
// //     try {
// //       const doc = new jsPDF({
// //         orientation: 'portrait',
// //         unit: 'mm',
// //         format: 'a4'
// //       })

// //       const pageWidth = doc.internal.pageSize.getWidth()
// //       const pageHeight = doc.internal.pageSize.getHeight()
// //       const marginLeft = 15
// //       const marginRight = 15

// //       try {
// //         const fontResponse = await fetch('/lora.ttf')
// //         const fontBuffer = await fontResponse.arrayBuffer()
// //         const fontBase64 = btoa(
// //           new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
// //         )
        
// //         doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
// //         doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
// //         doc.addFont('Lora-Regular.ttf', 'Lora', 'bold')
// //         doc.addFont('Lora-Regular.ttf', 'Lora', 'italic')
// //       } catch (fontError) {
// //         console.warn('Impossible de charger la police Lora, utilisation de la police par défaut', fontError)
// //       }

// //       const logoUrl = '/logo.png'
// //       const logoImg = new Image()
// //       logoImg.crossOrigin = 'Anonymous'
      
// //       await new Promise((resolve, reject) => {
// //         logoImg.onload = resolve
// //         logoImg.onerror = reject
// //         logoImg.src = logoUrl
// //       })

// //       const logoSize = 18
// //       const logoX = marginLeft
// //       const logoY = 10

// //       doc.addImage(logoImg, 'PNG', logoX, logoY, logoSize, logoSize)

// //       const regionNom = hebdo.hierarchy?.region || '-'
// //       const conferenceNom = hebdo.hierarchy?.conference || '-'
// //       const districtNom = hebdo.hierarchy?.district || '-'
// //       const paroisseNom = hebdo.paroisse?.nom || '-'

// //       // En-tête
// //       doc.setFont('Lora', 'normal')
// //       doc.setFontSize(13)
// //       doc.setTextColor(0, 0, 0)
// //       doc.text('EGLISE METHODISTE UNIE', pageWidth / 2, logoY + 6, { align: 'center' })
      
// //       doc.setFontSize(9)
// //       doc.text(regionNom.toUpperCase(), pageWidth / 2, logoY + 13, { align: 'center' })
// //       doc.setFontSize(8)
// //       doc.text(conferenceNom.toUpperCase(), pageWidth / 2, logoY + 19, { align: 'center' })
// //       doc.text(districtNom.toUpperCase(), pageWidth / 2, logoY + 25, { align: 'center' })
      
// //       doc.setFontSize(10)
// //       doc.setFont('Lora', 'bold')
// //       doc.text(`PAROISSE ${paroisseNom.toUpperCase()}`, pageWidth / 2, logoY + 33, { align: 'center' })

// //       doc.setFontSize(11)
// //       doc.setTextColor(0, 0, 0)
// //       doc.text(`HEBDOMADAIRE : ${hebdo.title}`, pageWidth / 2, logoY + 43, { align: 'center' })

// //       doc.setFont('Lora', 'normal')
// //       doc.setFontSize(9)
// //       doc.setTextColor(80, 80, 80)
// //       const dateStr = format(new Date(hebdo.date), 'EEEE d MMMM yyyy', { locale: fr })
// //       doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), marginLeft, logoY + 52)

// //       doc.setDrawColor(0, 0, 0)
// //       doc.setLineWidth(0.5)
// //       doc.line(marginLeft, logoY + 56, pageWidth - marginRight, logoY + 56)

// //       let yPos = logoY + 65

// //       // Section Culte
// //       doc.setFontSize(11)
// //       doc.setFont('Lora', 'bold')
// //       doc.setTextColor(0, 0, 0)
// //       doc.text('CULTE', marginLeft, yPos)
      
// //       yPos += 8
// //       doc.setFontSize(10)
// //       doc.setFont('Lora', 'normal')
      
// //       if (hebdo.theme) {
// //         doc.setFont('Lora', 'bold')
// //         doc.text('Thème :', marginLeft, yPos)
// //         doc.setFont('Lora', 'normal')
        
// //         const themeLines = doc.splitTextToSize(hebdo.theme, pageWidth - marginLeft - marginRight - 25)
// //         doc.text(themeLines, marginLeft + 22, yPos)
// //         yPos += (themeLines.length * 5) + 3
// //       }

// //       if (hebdo.predicateur) {
// //         doc.setFont('Lora', 'bold')
// //         doc.text('Prédicateur :', marginLeft, yPos)
// //         doc.setFont('Lora', 'normal')
// //         doc.text(hebdo.predicateur, marginLeft + 32, yPos)
// //         yPos += 7
// //       }

// //       if (hebdo.officiants && hebdo.officiants.length > 0) {
// //         doc.setFont('Lora', 'bold')
// //         doc.text('Officiants :', marginLeft, yPos)
// //         doc.setFont('Lora', 'normal')
        
// //         const officiantsText = hebdo.officiants.join(', ')
// //         const officiantsLines = doc.splitTextToSize(officiantsText, pageWidth - marginLeft - marginRight - 28)
// //         doc.text(officiantsLines, marginLeft + 28, yPos)
// //         yPos += (officiantsLines.length * 5) + 3
// //       }

// //       if (hebdo.activites) {
// //         yPos += 3
// //         doc.setFont('Lora', 'bold')
// //         doc.text('Activités spéciales :', marginLeft, yPos)
// //         yPos += 5
        
// //         // Traiter le markdown des activités
// //         const htmlContent = hebdo.activites
// //         yPos = parseAndRenderHtml(doc, htmlContent, yPos, marginLeft, pageWidth, marginRight, {
// //           fontSize: 10,
// //           fontFamily: 'Lora'
// //         })
        
// //         yPos += 5
// //       }

// //       // Sections
// //       if (hebdo.sections && hebdo.sections.length > 0) {
// //         for (const section of hebdo.sections) {
// //           yPos += 8
          
// //           if (yPos > pageHeight - 40) {
// //             doc.addPage()
// //             yPos = 25
// //           }

// //           doc.setFontSize(11)
// //           doc.setFont('Lora', 'bold')
// //           doc.setTextColor(0, 0, 0)
// //           doc.text(section.titre.toUpperCase(), marginLeft, yPos)
          
// //           yPos += 5
// //           doc.setDrawColor(0, 0, 0)
// //           doc.setLineWidth(0.3)
// //           doc.line(marginLeft, yPos, marginLeft + 60, yPos)
          
// //           yPos += 7
          
// //           if (section.description) {
// //             yPos = parseAndRenderHtml(doc, section.description, yPos, marginLeft, pageWidth, marginRight, {
// //               fontSize: 9,
// //               fontFamily: 'Lora'
// //             })
            
// //             yPos += 5
// //           }
// //         }
// //       }

// //       // Pagination
// //       const totalPages = doc.getNumberOfPages()
// //       for (let i = 1; i <= totalPages; i++) {
// //         doc.setPage(i)
        
// //         doc.setDrawColor(150, 150, 150)
// //         doc.setLineWidth(0.3)
// //         doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
        
// //         doc.setFont('Lora', 'normal')
// //         doc.setFontSize(7)
// //         doc.setTextColor(100, 100, 100)
// //         doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
// //       }

// //       const fileName = `hebdo_${hebdo.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(hebdo.date), 'yyyy-MM-dd')}.pdf`
// //       doc.save(fileName)
      
// //     } catch (error) {
// //       console.error('Erreur génération PDF:', error)
// //       alert('Erreur lors de la génération du PDF')
// //     } finally {
// //       setIsGenerating(false)
// //     }
// //   }

// //   return (
// //     <button
// //       onClick={generatePDF}
// //       disabled={isGenerating}
// //       className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
// //     >
// //       {isGenerating ? (
// //         <>
// //           <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
// //           Génération...
// //         </>
// //       ) : (
// //         <>
// //           <Download size={16} />
// //           Exporter PDF
// //         </>
// //       )}
// //     </button>
// //   )
// // }
// // app/hebdo/[id]/ExportPDFButton.tsx
// 'use client'

// import { useState } from 'react'
// import jsPDF from 'jspdf'
// import { Download } from 'lucide-react'
// import { format } from 'date-fns'
// import { fr } from 'date-fns/locale'

// interface HebdoSection {
//   id: number
//   titre: string
//   description: string | null
// }

// interface HebdoPDFData {
//   title: string
//   date: string | Date
//   theme: string | null
//   predicateur: string | null
//   officiants: string[]
//   activites: string | null
//   sections?: HebdoSection[]
//   hierarchy: {
//     region: string | null
//     conference: string | null
//     district: string | null
//   }
//   paroisse?: {
//     nom: string
//   } | null
// }

// interface ExportPDFButtonProps {
//   hebdo: HebdoPDFData
// }

// // Fonction simplifiée pour parser et rendre le markdown
// function renderFormattedText(
//   doc: jsPDF,
//   text: string,
//   x: number,
//   y: number,
//   maxWidth: number,
//   options: {
//     fontSize?: number
//     fontFamily?: string
//     baseColor?: number[]
//     lineHeight?: number
//   } = {}
// ): number {
//   const {
//     fontSize = 10,
//     fontFamily = 'Lora',
//     baseColor = [55, 65, 81],
//     lineHeight = 5
//   } = options

//   let currentY = y
//   const pageHeight = doc.internal.pageSize.getHeight()

//   // Fonction pour écrire une ligne de texte avec retour à la ligne automatique
//   const writeLine = (lineText: string, indent: number = 0) => {
//     const lines = doc.splitTextToSize(lineText, maxWidth - indent)
    
//     lines.forEach((line: string) => {
//       if (currentY > pageHeight - 25) {
//         doc.addPage()
//         currentY = 25
//       }
      
//       doc.text(line, x + indent, currentY)
//       currentY += lineHeight
//     })
//   }

//   // Fonction pour traiter une portion de texte avec ses styles
//   const processTextSegment = (
//     segment: string, 
//     styles: { bold?: boolean; italic?: boolean; highlight?: boolean; indent?: number },
//     indent: number = 0
//   ) => {
//     // Appliquer les styles
//     if (styles.bold) {
//       doc.setFont(fontFamily, 'bold')
//       doc.setTextColor(0, 0, 0)
//     } else if (styles.italic) {
//       doc.setFont(fontFamily, 'italic')
//       doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
//     } else {
//       doc.setFont(fontFamily, 'normal')
//       doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
//     }
    
//     doc.setFontSize(fontSize)
    
//     // Surlignage (simulé avec un rectangle jaune derrière le texte)
//     if (styles.highlight) {
//       const textWidth = doc.getTextWidth(segment)
//       doc.setFillColor(254, 240, 138) // Jaune clair
//       doc.rect(x + indent, currentY - 4, textWidth, lineHeight + 2, 'F')
//     }
    
//     writeLine(segment, indent)
//   }

//   // Parser le markdown ligne par ligne
//   const lines = text.split('\n')
//   let i = 0

//   while (i < lines.length) {
//     const line = lines[i]

//     // Vérifier si on doit ajouter une nouvelle page
//     if (currentY > pageHeight - 25) {
//       doc.addPage()
//       currentY = 25
//     }

//     // Ligne vide
//     if (line.trim() === '') {
//       currentY += 4
//       i++
//       continue
//     }

//     // Titre ##
//     const headingMatch = line.match(/^## (.+)/)
//     if (headingMatch) {
//       currentY += 4
//       doc.setFont(fontFamily, 'bold')
//       doc.setFontSize(fontSize + 4)
//       doc.setTextColor(0, 0, 0)
      
//       const headingText = processInlineMarkdown(headingMatch[1])
//       writeLine(headingText.text)
      
//       // Ligne de séparation
//       currentY += 2
//       doc.setDrawColor(200, 200, 200)
//       doc.setLineWidth(0.3)
//       doc.line(x, currentY, x + 60, currentY)
//       currentY += 6
      
//       i++
//       continue
//     }

//     // Titre #
//     const heading1Match = line.match(/^# (.+)/)
//     if (heading1Match) {
//       currentY += 4
//       doc.setFont(fontFamily, 'bold')
//       doc.setFontSize(fontSize + 6)
//       doc.setTextColor(0, 0, 0)
      
//       const headingText = processInlineMarkdown(heading1Match[1])
//       writeLine(headingText.text)
      
//       // Ligne de séparation
//       currentY += 2
//       doc.setDrawColor(200, 200, 200)
//       doc.setLineWidth(0.3)
//       doc.line(x, currentY, x + 80, currentY)
//       currentY += 8
      
//       i++
//       continue
//     }

//     // Liste non ordonnée - ou *
//     const listMatch = line.match(/^[-*] (.+)/)
//     if (listMatch) {
//       // Écrire la puce
//       doc.setFont(fontFamily, 'normal')
//       doc.setFontSize(fontSize)
//       doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
//       doc.text('•', x, currentY)
      
//       // Traiter le contenu de la liste
//       const listContent = processInlineMarkdown(listMatch[1])
      
//       // Appliquer les styles du contenu
//       doc.setFont(fontFamily, listContent.bold ? 'bold' : listContent.italic ? 'italic' : 'normal')
//       doc.setTextColor(listContent.bold ? 0 : baseColor[0], listContent.bold ? 0 : baseColor[1], listContent.bold ? 0 : baseColor[2])
      
//       const listLines = doc.splitTextToSize(listContent.text, maxWidth - 8)
//       listLines.forEach((listLine: string) => {
//         if (currentY > pageHeight - 25) {
//           doc.addPage()
//           currentY = 25
//         }
//         doc.text(listLine, x + 6, currentY)
//         currentY += lineHeight
//       })
      
//       currentY += 2
//       i++
//       continue
//     }

//     // Liste ordonnée 1. 2. etc.
//     const orderedListMatch = line.match(/^(\d+)\. (.+)/)
//     if (orderedListMatch) {
//       // Écrire le numéro
//       doc.setFont(fontFamily, 'normal')
//       doc.setFontSize(fontSize)
//       doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
//       doc.text(`${orderedListMatch[1]}.`, x, currentY)
      
//       // Traiter le contenu
//       const listContent = processInlineMarkdown(orderedListMatch[2])
      
//       doc.setFont(fontFamily, listContent.bold ? 'bold' : listContent.italic ? 'italic' : 'normal')
//       doc.setTextColor(listContent.bold ? 0 : baseColor[0], listContent.bold ? 0 : baseColor[1], listContent.bold ? 0 : baseColor[2])
      
//       const listLines = doc.splitTextToSize(listContent.text, maxWidth - 8)
//       listLines.forEach((listLine: string) => {
//         if (currentY > pageHeight - 25) {
//           doc.addPage()
//           currentY = 25
//         }
//         doc.text(listLine, x + 8, currentY)
//         currentY += lineHeight
//       })
      
//       currentY += 2
//       i++
//       continue
//     }

//     // Paragraphe normal avec formatage inline
//     const formattedContent = processInlineMarkdown(line)
    
//     doc.setFont(fontFamily, formattedContent.bold ? 'bold' : formattedContent.italic ? 'italic' : 'normal')
//     doc.setFontSize(fontSize)
//     doc.setTextColor(
//       formattedContent.bold ? 0 : baseColor[0],
//       formattedContent.bold ? 0 : baseColor[1],
//       formattedContent.bold ? 0 : baseColor[2]
//     )
    
//     writeLine(formattedContent.text)
//     currentY += 2
//     i++
//   }

//   return currentY
// }

// // Fonction helper pour traiter le markdown inline
// function processInlineMarkdown(text: string): { text: string; bold: boolean; italic: boolean } {
//   let result = text
//   let isBold = false
//   let isItalic = false
  
//   // Détecter le gras
//   if (result.includes('**')) {
//     isBold = true
//     result = result.replace(/\*\*(.+?)\*\*/g, '$1')
//   }
  
//   // Détecter l'italique
//   if (result.includes('*') && !isBold) {
//     isItalic = true
//     result = result.replace(/\*(.+?)\*/g, '$1')
//   }
  
//   // Supprimer les marqueurs de surlignage
//   result = result.replace(/==(.+?)==/g, '$1')
  
//   // Supprimer les marqueurs de soulignement
//   result = result.replace(/__(.+?)__/g, '$1')
  
//   return { text: result, bold: isBold, italic: isItalic }
// }

// export default function ExportPDFButton({ hebdo }: ExportPDFButtonProps) {
//   const [isGenerating, setIsGenerating] = useState(false)

//   const generatePDF = async () => {
//     setIsGenerating(true)
    
//     try {
//       const doc = new jsPDF({
//         orientation: 'portrait',
//         unit: 'mm',
//         format: 'a4'
//       })

//       const pageWidth = doc.internal.pageSize.getWidth()
//       const pageHeight = doc.internal.pageSize.getHeight()
//       const marginLeft = 15
//       const marginRight = 15
//       const contentWidth = pageWidth - marginLeft - marginRight

//       // Charger la police
//       try {
//         const fontResponse = await fetch('/lora.ttf')
//         const fontBuffer = await fontResponse.arrayBuffer()
//         const fontBase64 = btoa(
//           new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
//         )
        
//         doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
//         doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
//         doc.addFont('Lora-Regular.ttf', 'Lora', 'bold')
//         doc.addFont('Lora-Regular.ttf', 'Lora', 'italic')
//         console.log('Police Lora chargée avec succès')
//       } catch (fontError) {
//         console.warn('Impossible de charger la police Lora, utilisation de la police par défaut', fontError)
//       }

//       // Logo
//       const logoImg = new Image()
//       logoImg.crossOrigin = 'Anonymous'
      
//       await new Promise((resolve, reject) => {
//         logoImg.onload = resolve
//         logoImg.onerror = () => {
//           console.warn('Logo non trouvé, continuation sans logo')
//           resolve(null)
//         }
//         logoImg.src = '/logo.png'
//       })

//       // Ajouter le logo si chargé
//       if (logoImg.width > 0) {
//         const logoSize = 18
//         doc.addImage(logoImg, 'PNG', marginLeft, 10, logoSize, logoSize)
//       }

//       // En-tête
//       const regionNom = hebdo.hierarchy?.region || '-'
//       const conferenceNom = hebdo.hierarchy?.conference || '-'
//       const districtNom = hebdo.hierarchy?.district || '-'
//       const paroisseNom = hebdo.paroisse?.nom || '-'

//       doc.setFont('Lora', 'normal')
//       doc.setFontSize(13)
//       doc.setTextColor(0, 0, 0)
//       doc.text('EGLISE METHODISTE UNIE', pageWidth / 2, 16, { align: 'center' })
      
//       doc.setFontSize(9)
//       doc.text(regionNom.toUpperCase(), pageWidth / 2, 23, { align: 'center' })
//       doc.setFontSize(8)
//       doc.text(conferenceNom.toUpperCase(), pageWidth / 2, 29, { align: 'center' })
//       doc.text(districtNom.toUpperCase(), pageWidth / 2, 35, { align: 'center' })
      
//       doc.setFontSize(10)
//       doc.setFont('Lora', 'bold')
//       doc.text(`PAROISSE ${paroisseNom.toUpperCase()}`, pageWidth / 2, 43, { align: 'center' })

//       doc.setFontSize(11)
//       doc.setTextColor(0, 0, 0)
//       doc.text(`HEBDOMADAIRE : ${hebdo.title}`, pageWidth / 2, 53, { align: 'center' })

//       doc.setFont('Lora', 'normal')
//       doc.setFontSize(9)
//       doc.setTextColor(80, 80, 80)
//       const dateStr = format(new Date(hebdo.date), 'EEEE d MMMM yyyy', { locale: fr })
//       doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), marginLeft, 62)

//       doc.setDrawColor(0, 0, 0)
//       doc.setLineWidth(0.5)
//       doc.line(marginLeft, 66, pageWidth - marginRight, 66)

//       let yPos = 75

//       // Section Culte
//       doc.setFontSize(11)
//       doc.setFont('Lora', 'bold')
//       doc.setTextColor(0, 0, 0)
//       doc.text('CULTE', marginLeft, yPos)
//       yPos += 10

//       if (hebdo.theme) {
//         doc.setFontSize(10)
//         doc.setFont('Lora', 'bold')
//         doc.text('Thème :', marginLeft, yPos)
//         doc.setFont('Lora', 'normal')
        
//         const themeLines = doc.splitTextToSize(hebdo.theme, contentWidth - 25)
//         themeLines.forEach((line: string) => {
//           if (yPos > pageHeight - 25) {
//             doc.addPage()
//             yPos = 25
//           }
//           doc.text(line, marginLeft + 22, yPos)
//           yPos += 5
//         })
//         yPos += 5
//       }

//       if (hebdo.predicateur) {
//         if (yPos > pageHeight - 25) {
//           doc.addPage()
//           yPos = 25
//         }
//         doc.setFontSize(10)
//         doc.setFont('Lora', 'bold')
//         doc.text('Prédicateur :', marginLeft, yPos)
//         doc.setFont('Lora', 'normal')
//         doc.text(hebdo.predicateur, marginLeft + 32, yPos)
//         yPos += 8
//       }

//       if (hebdo.officiants && hebdo.officiants.length > 0) {
//         if (yPos > pageHeight - 25) {
//           doc.addPage()
//           yPos = 25
//         }
//         doc.setFontSize(10)
//         doc.setFont('Lora', 'bold')
//         doc.text('Officiants :', marginLeft, yPos)
//         doc.setFont('Lora', 'normal')
        
//         const officiantsText = hebdo.officiants.join(', ')
//         const officiantsLines = doc.splitTextToSize(officiantsText, contentWidth - 28)
//         officiantsLines.forEach((line: string) => {
//           if (yPos > pageHeight - 25) {
//             doc.addPage()
//             yPos = 25
//           }
//           doc.text(line, marginLeft + 28, yPos)
//           yPos += 5
//         })
//         yPos += 5
//       }

//       // Activités spéciales avec formatage markdown
//       if (hebdo.activites && hebdo.activites.trim()) {
//         yPos += 8
//         if (yPos > pageHeight - 25) {
//           doc.addPage()
//           yPos = 25
//         }
        
//         doc.setFontSize(10)
//         doc.setFont('Lora', 'bold')
//         doc.setTextColor(0, 0, 0)
//         doc.text('Activités spéciales :', marginLeft, yPos)
//         yPos += 8
        
//         // Utiliser le renderer markdown pour les activités
//         doc.setFontSize(9)
//         yPos = renderFormattedText(
//           doc,
//           hebdo.activites,
//           marginLeft,
//           yPos,
//           contentWidth,
//           { fontSize: 9, fontFamily: 'Lora', baseColor: [55, 65, 81], lineHeight: 5 }
//         )
        
//         yPos += 5
//       }

//       // Sections
//       if (hebdo.sections && hebdo.sections.length > 0) {
//         for (const section of hebdo.sections) {
//           yPos += 10
          
//           if (yPos > pageHeight - 40) {
//             doc.addPage()
//             yPos = 25
//           }

//           doc.setFontSize(11)
//           doc.setFont('Lora', 'bold')
//           doc.setTextColor(0, 0, 0)
//           doc.text(section.titre.toUpperCase(), marginLeft, yPos)
          
//           yPos += 6
//           doc.setDrawColor(0, 0, 0)
//           doc.setLineWidth(0.3)
//           doc.line(marginLeft, yPos, marginLeft + 60, yPos)
          
//           yPos += 8
          
//           if (section.description && section.description.trim()) {
//             doc.setFontSize(9)
//             // Utiliser le renderer markdown pour les descriptions de section
//             yPos = renderFormattedText(
//               doc,
//               section.description,
//               marginLeft,
//               yPos,
//               contentWidth,
//               { fontSize: 9, fontFamily: 'Lora', baseColor: [55, 65, 81], lineHeight: 5 }
//             )
            
//             yPos += 5
//           }
//         }
//       }

//       // Ajouter la pagination
//       const totalPages = doc.getNumberOfPages()
//       for (let i = 1; i <= totalPages; i++) {
//         doc.setPage(i)
        
//         doc.setDrawColor(150, 150, 150)
//         doc.setLineWidth(0.3)
//         doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
        
//         doc.setFont('Lora', 'normal')
//         doc.setFontSize(7)
//         doc.setTextColor(100, 100, 100)
//         doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
//       }

//       const fileName = `hebdomadaire_${hebdo.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(hebdo.date), 'yyyy-MM-dd')}.pdf`
//       doc.save(fileName)
      
//     } catch (error) {
//       console.error('Erreur génération PDF:', error)
//       alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   return (
//     <button
//       onClick={generatePDF}
//       disabled={isGenerating}
//       className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//     >
//       {isGenerating ? (
//         <>
//           <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
//           Génération...
//         </>
//       ) : (
//         <>
//           <Download size={16} />
//           Exporter PDF
//         </>
//       )}
//     </button>
//   )
// }

// app/hebdo/[id]/ExportPDFButton.tsx
'use client'

import { useState } from 'react'
import jsPDF from 'jspdf'
import { Download } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface HebdoSection {
  id: number
  titre: string
  description: string | null
}

interface HebdoPDFData {
  title: string
  date: string | Date
  theme: string | null
  predicateur: string | null
  officiants: string[]
  activites: string | null
  sections?: HebdoSection[]
  hierarchy: {
    region: string | null
    conference: string | null
    district: string | null
  }
  paroisse?: {
    nom: string
  } | null
}

interface ExportPDFButtonProps {
  hebdo: HebdoPDFData
}

// Structure pour représenter un segment de texte formaté
interface TextSegment {
  text: string
  bold: boolean
  italic: boolean
  highlight: boolean
  underline: boolean
  strikethrough: boolean
  code: boolean
}

// Fonction pour parser le markdown inline et retourner des segments formatés
function parseInlineMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  let currentIndex = 0
  
  // Expression régulière pour capturer tous les formats inline
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(==(.+?)==)|(__(.+?)__)|(~~(.+?)~~)|(`(.+?)`)/g
  let match: RegExpExecArray | null
  
  while ((match = regex.exec(text)) !== null) {
    // Ajouter le texte avant le match comme segment normal
    if (match.index > currentIndex) {
      segments.push({
        text: text.substring(currentIndex, match.index),
        bold: false,
        italic: false,
        highlight: false,
        underline: false,
        strikethrough: false,
        code: false
      })
    }
    
    // Déterminer le type de formatage
    if (match[1]) {
      // **gras**
      segments.push({
        text: match[2],
        bold: true,
        italic: false,
        highlight: false,
        underline: false,
        strikethrough: false,
        code: false
      })
    } else if (match[3]) {
      // *italique*
      segments.push({
        text: match[4],
        bold: false,
        italic: true,
        highlight: false,
        underline: false,
        strikethrough: false,
        code: false
      })
    } else if (match[5]) {
      // ==surlignage==
      segments.push({
        text: match[6],
        bold: false,
        italic: false,
        highlight: true,
        underline: false,
        strikethrough: false,
        code: false
      })
    } else if (match[7]) {
      // __souligné__
      segments.push({
        text: match[8],
        bold: false,
        italic: false,
        highlight: false,
        underline: true,
        strikethrough: false,
        code: false
      })
    } else if (match[9]) {
      // ~~barré~~
      segments.push({
        text: match[10],
        bold: false,
        italic: false,
        highlight: false,
        underline: false,
        strikethrough: true,
        code: false
      })
    } else if (match[11]) {
      // `code`
      segments.push({
        text: match[12],
        bold: false,
        italic: false,
        highlight: false,
        underline: false,
        strikethrough: false,
        code: true
      })
    }
    
    currentIndex = match.index + match[0].length
  }
  
  // Ajouter le reste du texte
  if (currentIndex < text.length) {
    segments.push({
      text: text.substring(currentIndex),
      bold: false,
      italic: false,
      highlight: false,
      underline: false,
      strikethrough: false,
      code: false
    })
  }
  
  return segments
}

// Fonction pour dessiner du texte formaté dans le PDF
function drawFormattedText(
  doc: jsPDF,
  segments: TextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  baseOptions: {
    fontSize?: number
    fontFamily?: string
    baseColor?: number[]
    lineHeight?: number
  } = {}
): number {
  const {
    fontSize = 10,
    fontFamily = 'Lora',
    baseColor = [55, 65, 81],
    lineHeight = 5
  } = baseOptions
  
  let currentY = y
  const pageHeight = doc.internal.pageSize.getHeight()
  const fullText = segments.map(s => s.text).join('')
  
  // Diviser le texte complet en lignes selon la largeur max
  const lines = doc.splitTextToSize(fullText, maxWidth)
  
  // Pour chaque ligne, recréer les segments avec les bons styles
  let segmentIndex = 0
  let charPosition = 0
  
  for (const line of lines) {
    // Vérifier si on doit ajouter une nouvelle page
    if (currentY > pageHeight - 25) {
      doc.addPage()
      currentY = 25
    }
    
    let xOffset = x
    let remainingLine = line
    
    // Dessiner chaque segment de la ligne
    while (remainingLine.length > 0 && segmentIndex < segments.length) {
      const segment = segments[segmentIndex]
      const segmentText = segment.text.substring(charPosition)
      
      if (remainingLine.startsWith(segmentText) || remainingLine.includes(segmentText)) {
        // Appliquer les styles du segment
        let textColor = baseColor
        
        if (segment.bold) {
          doc.setFont(fontFamily, 'bold')
          textColor = [0, 0, 0]
        } else if (segment.italic) {
          doc.setFont(fontFamily, 'italic')
          textColor = baseColor
        } else {
          doc.setFont(fontFamily, 'normal')
        }
        
        doc.setFontSize(segment.code ? fontSize - 1 : fontSize)
        
        // Couleur de fond pour le code
        if (segment.code) {
          doc.setFillColor(245, 245, 245)
          const codeWidth = doc.getTextWidth(segmentText)
          doc.rect(xOffset - 1, currentY - 4, codeWidth + 2, lineHeight + 3, 'F')
          textColor = [200, 50, 50]
        }
        
        // Surlignage
        if (segment.highlight) {
          const highlightWidth = doc.getTextWidth(segmentText)
          doc.setFillColor(254, 240, 138) // Jaune
          doc.rect(xOffset - 1, currentY - 4, highlightWidth + 2, lineHeight + 3, 'F')
          textColor = [0, 0, 0]
        }
        
        // Soulignement
        if (segment.underline) {
          const underlineWidth = doc.getTextWidth(segmentText)
          doc.setDrawColor(textColor[0], textColor[1], textColor[2])
          doc.setLineWidth(0.3)
          doc.line(xOffset, currentY + 1, xOffset + underlineWidth, currentY + 1)
        }
        
        // Barré
        if (segment.strikethrough) {
          const strikeWidth = doc.getTextWidth(segmentText)
          const textHeight = fontSize * 0.35
          doc.setDrawColor(150, 150, 150)
          doc.setLineWidth(0.3)
          doc.line(xOffset, currentY - textHeight, xOffset + strikeWidth, currentY - textHeight)
        }
        
        // Dessiner le texte
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text(segmentText, xOffset, currentY)
        
        // Mettre à jour les positions
        const textWidth = doc.getTextWidth(segmentText) + 1
        xOffset += textWidth
        remainingLine = remainingLine.substring(segmentText.length)
        
        // Passer au segment suivant
        charPosition = 0
        segmentIndex++
        
        if (segmentIndex >= segments.length) break
      } else {
        // Le segment ne correspond pas, utiliser le texte de la ligne tel quel
        doc.setFont(fontFamily, 'normal')
        doc.setFontSize(fontSize)
        doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
        doc.text(remainingLine, xOffset, currentY)
        break
      }
    }
    
    // Si on a fini tous les segments mais qu'il reste du texte
    if (segmentIndex >= segments.length && remainingLine.length > 0) {
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
      doc.text(remainingLine, xOffset, currentY)
    }
    
    currentY += lineHeight
  }
  
  return currentY
}

// Fonction principale pour rendre du texte markdown
function renderMarkdownText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  options: {
    fontSize?: number
    fontFamily?: string
    baseColor?: number[]
    lineHeight?: number
  } = {}
): number {
  const {
    fontSize = 10,
    fontFamily = 'Lora',
    baseColor = [55, 65, 81],
    lineHeight = 5
  } = options
  
  let currentY = y
  const pageHeight = doc.internal.pageSize.getHeight()
  const lines = text.split('\n')
  
  let i = 0
  while (i < lines.length) {
    // Vérifier nouvelle page
    if (currentY > pageHeight - 25) {
      doc.addPage()
      currentY = 25
    }
    
    const line = lines[i]
    
    // Ligne vide
    if (line.trim() === '') {
      currentY += lineHeight * 0.8
      i++
      continue
    }
    
    // Titre H1
    const h1Match = line.match(/^# (.+)/)
    if (h1Match) {
      currentY += 4
      doc.setFont(fontFamily, 'bold')
      doc.setFontSize(fontSize + 6)
      doc.setTextColor(0, 0, 0)
      
      const segments = parseInlineMarkdown(h1Match[1])
      const fullText = segments.map(s => s.text).join('')
      const titleLines = doc.splitTextToSize(fullText, maxWidth)
      
      for (const titleLine of titleLines) {
        if (currentY > pageHeight - 25) {
          doc.addPage()
          currentY = 25
        }
        doc.text(titleLine, x, currentY)
        currentY += (fontSize + 6) * 0.7
      }
      
      currentY += 2
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(x, currentY, x + 80, currentY)
      currentY += 8
      i++
      continue
    }
    
    // Titre H2
    const h2Match = line.match(/^## (.+)/)
    if (h2Match) {
      currentY += 3
      doc.setFont(fontFamily, 'bold')
      doc.setFontSize(fontSize + 4)
      doc.setTextColor(0, 0, 0)
      
      const segments = parseInlineMarkdown(h2Match[1])
      const fullText = segments.map(s => s.text).join('')
      const titleLines = doc.splitTextToSize(fullText, maxWidth)
      
      for (const titleLine of titleLines) {
        if (currentY > pageHeight - 25) {
          doc.addPage()
          currentY = 25
        }
        doc.text(titleLine, x, currentY)
        currentY += (fontSize + 4) * 0.7
      }
      
      currentY += 2
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(x, currentY, x + 60, currentY)
      currentY += 6
      i++
      continue
    }
    
    // Titre H3
    const h3Match = line.match(/^### (.+)/)
    if (h3Match) {
      currentY += 3
      doc.setFont(fontFamily, 'bold')
      doc.setFontSize(fontSize + 2)
      doc.setTextColor(0, 0, 0)
      
      const segments = parseInlineMarkdown(h3Match[1])
      const fullText = segments.map(s => s.text).join('')
      const titleLines = doc.splitTextToSize(fullText, maxWidth)
      
      for (const titleLine of titleLines) {
        if (currentY > pageHeight - 25) {
          doc.addPage()
          currentY = 25
        }
        doc.text(titleLine, x, currentY)
        currentY += (fontSize + 2) * 0.7
      }
      
      currentY += 5
      i++
      continue
    }
    
    // Liste non ordonnée
    const ulMatch = line.match(/^[-*+] (.+)/)
    if (ulMatch) {
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
      doc.text('•', x, currentY)
      
      const segments = parseInlineMarkdown(ulMatch[1])
      currentY = drawFormattedText(doc, segments, x + 6, currentY, maxWidth - 6, options)
      
      currentY += 1
      i++
      continue
    }
    
    // Liste ordonnée
    const olMatch = line.match(/^(\d+)[.)] (.+)/)
    if (olMatch) {
      doc.setFont(fontFamily, 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(baseColor[0], baseColor[1], baseColor[2])
      doc.text(`${olMatch[1]}.`, x, currentY)
      
      const segments = parseInlineMarkdown(olMatch[2])
      currentY = drawFormattedText(doc, segments, x + 8, currentY, maxWidth - 8, options)
      
      currentY += 1
      i++
      continue
    }
    
    // Citation
    const blockquoteMatch = line.match(/^> (.+)/)
    if (blockquoteMatch) {
      // Barre verticale pour citation
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(1)
      doc.line(x, currentY - 4, x, currentY + lineHeight)
      
      const segments = parseInlineMarkdown(blockquoteMatch[1])
      currentY = drawFormattedText(doc, segments, x + 4, currentY, maxWidth - 4, {
        ...options,
        baseColor: [100, 100, 100]
      })
      
      currentY += 1
      i++
      continue
    }
    
    // Code block
    if (line.startsWith('```')) {
      let codeText = ''
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeText += (codeText ? '\n' : '') + lines[i]
        i++
      }
      i++ // Skip closing ```
      
      const codeLines = codeText.split('\n')
      const codeLineHeight = fontSize * 0.4
      const codePadding = 4
      const codeBlockHeight = (codeLines.length * codeLineHeight) + (codePadding * 2)
      
      if (currentY + codeBlockHeight > pageHeight - 25) {
        doc.addPage()
        currentY = 25
      }
      
      // Fond gris
      doc.setFillColor(245, 245, 245)
      doc.rect(x, currentY - codePadding, maxWidth, codeBlockHeight, 'F')
      
      doc.setFont('Courier', 'normal')
      doc.setFontSize(fontSize - 1)
      doc.setTextColor(60, 60, 60)
      
      codeLines.forEach((codeLine: string, index: number) => {
        doc.text(codeLine, x + codePadding, currentY + (index * codeLineHeight))
      })
      
      currentY += codeBlockHeight + 4
      continue
    }
    
    // Paragraphe normal avec formatage inline
    const segments = parseInlineMarkdown(line)
    if (segments.length > 0) {
      currentY = drawFormattedText(doc, segments, x, currentY, maxWidth, options)
    }
    
    currentY += 1
    i++
  }
  
  return currentY
}

export default function ExportPDFButton({ hebdo }: ExportPDFButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

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
      const marginLeft = 15
      const marginRight = 15
      const contentWidth = pageWidth - marginLeft - marginRight

      // Charger la police Lora
      try {
        const fontResponse = await fetch('/lora.ttf')
        if (fontResponse.ok) {
          const fontBuffer = await fontResponse.arrayBuffer()
          const fontBase64 = btoa(
            new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          )
          
          doc.addFileToVFS('Lora-Regular.ttf', fontBase64)
          doc.addFont('Lora-Regular.ttf', 'Lora', 'normal')
          doc.addFont('Lora-Regular.ttf', 'Lora', 'bold')
          doc.addFont('Lora-Regular.ttf', 'Lora', 'italic')
        }
      } catch (fontError) {
        console.warn('Police Lora non disponible, utilisation de la police par défaut')
      }

      // Logo
      let logoLoaded = false
      const logoImg = new Image()
      logoImg.crossOrigin = 'Anonymous'
      
      try {
        await new Promise((resolve, reject) => {
          logoImg.onload = () => {
            logoLoaded = true
            resolve(null)
          }
          logoImg.onerror = () => resolve(null)
          logoImg.src = '/logo.png'
        })
      } catch (error) {
        console.warn('Logo non disponible')
      }

      // Ajouter le logo
      if (logoLoaded && logoImg.width > 0) {
        doc.addImage(logoImg, 'PNG', marginLeft, 10, 18, 18)
      }

      // En-tête du document
      const regionNom = hebdo.hierarchy?.region || '-'
      const conferenceNom = hebdo.hierarchy?.conference || '-'
      const districtNom = hebdo.hierarchy?.district || '-'
      const paroisseNom = hebdo.paroisse?.nom || '-'

      doc.setFont('Lora', 'normal')
      doc.setFontSize(13)
      doc.setTextColor(0, 0, 0)
      doc.text('EGLISE METHODISTE UNIE', pageWidth / 2, 16, { align: 'center' })
      
      doc.setFontSize(9)
      doc.text(regionNom.toUpperCase(), pageWidth / 2, 23, { align: 'center' })
      doc.setFontSize(8)
      doc.text(conferenceNom.toUpperCase(), pageWidth / 2, 29, { align: 'center' })
      doc.text(districtNom.toUpperCase(), pageWidth / 2, 35, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('Lora', 'bold')
      doc.text(`PAROISSE ${paroisseNom.toUpperCase()}`, pageWidth / 2, 43, { align: 'center' })

      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      const titleText = `HEBDOMADAIRE : ${hebdo.title}`
      doc.text(titleText, pageWidth / 2, 53, { align: 'center' })

      doc.setFont('Lora', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      const dateStr = format(new Date(hebdo.date), 'EEEE d MMMM yyyy', { locale: fr })
      doc.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), marginLeft, 62)

      // Ligne de séparation
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(marginLeft, 66, pageWidth - marginRight, 66)

      let yPos = 75

      // SECTION CULTE
      doc.setFontSize(11)
      doc.setFont('Lora', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('CULTE', marginLeft, yPos)
      yPos += 10

      // Thème
      if (hebdo.theme) {
        doc.setFontSize(10)
        doc.setFont('Lora', 'bold')
        doc.text('Thème :', marginLeft, yPos)
        
        const themeSegments = parseInlineMarkdown(hebdo.theme)
        yPos = drawFormattedText(doc, themeSegments, marginLeft + 22, yPos, contentWidth - 25, {
          fontSize: 10,
          fontFamily: 'Lora',
          baseColor: [0, 0, 0]
        })
        
        yPos += 5
      }

      // Prédicateur
      if (hebdo.predicateur) {
        if (yPos > pageHeight - 25) {
          doc.addPage()
          yPos = 25
        }
        
        doc.setFontSize(10)
        doc.setFont('Lora', 'bold')
        doc.text('Prédicateur :', marginLeft, yPos)
        doc.setFont('Lora', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(hebdo.predicateur, marginLeft + 32, yPos)
        yPos += 8
      }

      // Officiants
      if (hebdo.officiants && hebdo.officiants.length > 0) {
        if (yPos > pageHeight - 25) {
          doc.addPage()
          yPos = 25
        }
        
        doc.setFontSize(10)
        doc.setFont('Lora', 'bold')
        doc.text('Officiants :', marginLeft, yPos)
        doc.setFont('Lora', 'normal')
        doc.setTextColor(0, 0, 0)
        
        const officiantsText = hebdo.officiants.join(', ')
        const officiantsLines = doc.splitTextToSize(officiantsText, contentWidth - 28)
        
        officiantsLines.forEach((line: string) => {
          if (yPos > pageHeight - 25) {
            doc.addPage()
            yPos = 25
          }
          doc.text(line, marginLeft + 28, yPos)
          yPos += 5
        })
        yPos += 5
      }

      // Activités spéciales (avec formatage markdown complet)
      if (hebdo.activites && hebdo.activites.trim()) {
        yPos += 5
        
        if (yPos > pageHeight - 30) {
          doc.addPage()
          yPos = 25
        }
        
        doc.setFontSize(10)
        doc.setFont('Lora', 'bold')
        doc.setTextColor(0, 0, 0)
        doc.text('Activités spéciales :', marginLeft, yPos)
        yPos += 8
        
        // Rendu markdown complet pour les activités
        yPos = renderMarkdownText(doc, hebdo.activites, marginLeft, yPos, contentWidth, {
          fontSize: 9,
          fontFamily: 'Lora',
          baseColor: [55, 65, 81],
          lineHeight: 5
        })
        
        yPos += 5
      }

      // Sections additionnelles
      if (hebdo.sections && hebdo.sections.length > 0) {
        for (const section of hebdo.sections) {
          yPos += 8
          
          if (yPos > pageHeight - 40) {
            doc.addPage()
            yPos = 25
          }

          // Titre de la section
          doc.setFontSize(11)
          doc.setFont('Lora', 'bold')
          doc.setTextColor(0, 0, 0)
          doc.text(section.titre.toUpperCase(), marginLeft, yPos)
          
          yPos += 6
          doc.setDrawColor(0, 0, 0)
          doc.setLineWidth(0.3)
          doc.line(marginLeft, yPos, marginLeft + 60, yPos)
          
          yPos += 8
          
          // Contenu de la section avec formatage markdown
          if (section.description && section.description.trim()) {
            yPos = renderMarkdownText(doc, section.description, marginLeft, yPos, contentWidth, {
              fontSize: 9,
              fontFamily: 'Lora',
              baseColor: [55, 65, 81],
              lineHeight: 5
            })
            
            yPos += 5
          }
        }
      }

      // Pagination
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        
        doc.setDrawColor(150, 150, 150)
        doc.setLineWidth(0.3)
        doc.line(marginLeft, pageHeight - 12, pageWidth - marginRight, pageHeight - 12)
        
        doc.setFont('Lora', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 6, { align: 'center' })
      }

      // Sauvegarder le PDF
      const fileName = `hebdomadaire_${hebdo.title.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(hebdo.date), 'yyyy-MM-dd')}.pdf`
      doc.save(fileName)
      
    } catch (error) {
      console.error('Erreur génération PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating}
      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isGenerating ? (
        <>
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
          Génération...
        </>
      ) : (
        <>
          <Download size={16} />
          Exporter PDF
        </>
      )}
    </button>
  )
}