
// components/SimpleFormattedEditor.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, Underline, Highlighter, List } from 'lucide-react'

interface SimpleFormattedEditorProps {
  value: string
  onChange: (text: string) => void
  placeholder?: string
  minHeight?: string
}

export default function SimpleFormattedEditor({ 
  value, 
  onChange, 
  placeholder = 'Rédigez votre contenu...',
  minHeight = '150px'
}: SimpleFormattedEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const lastValueRef = useRef(value)
  const isInternalChange = useRef(false)
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const pendingFormatsRef = useRef<Set<string>>(new Set())

  // Détecter si le curseur est dans un format spécifique
  const hasFormat = useCallback((format: string): boolean => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return false

    let node: Node | null = selection.anchorNode
    if (!node) return false

    // Si le nœud est un nœud texte, prendre son parent
    if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
      node = node.parentNode
    }

    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        const tagName = element.tagName.toLowerCase()
        
        switch (format) {
          case 'bold':
            if (tagName === 'strong') return true
            break
          case 'italic':
            if (tagName === 'em') return true
            break
          case 'underline':
            if (tagName === 'u') return true
            break
          case 'highlight':
            if (tagName === 'mark') return true
            break
        }
      }
      node = node.parentNode
    }
    
    return false
  }, [])

  // Mettre à jour les formats actifs
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>()
    if (hasFormat('bold')) formats.add('bold')
    if (hasFormat('italic')) formats.add('italic')
    if (hasFormat('underline')) formats.add('underline')
    if (hasFormat('highlight')) formats.add('highlight')
    setActiveFormats(formats)
  }, [hasFormat])

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.addEventListener('click', updateActiveFormats)
      editorRef.current.addEventListener('keyup', updateActiveFormats)
      document.addEventListener('selectionchange', updateActiveFormats)
    }
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('click', updateActiveFormats)
        editorRef.current.removeEventListener('keyup', updateActiveFormats)
      }
      document.removeEventListener('selectionchange', updateActiveFormats)
    }
  }, [updateActiveFormats])

  // Convertir markdown en HTML
  const parseInlineFormatting = useCallback((text: string): string => {
    if (!text) return ''
    
    let processed = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    
    const applyAllFormats = (str: string): string => {
      let result = str
      
      // Appliquer les formats dans l'ordre
      result = result.replace(/==(.+?)==/g, (_, content) => 
        `<mark style="background-color: #FEF08A; padding: 0 3px; border-radius: 2px; color: #111;">${applyAllFormats(content)}</mark>`
      )
      
      result = result.replace(/\*\*(.+?)\*\*/g, (_, content) => 
        `<strong style="font-weight: 600; color: #111;">${applyAllFormats(content)}</strong>`
      )
      
      result = result.replace(/\*(.+?)\*/g, (_, content) => 
        `<em style="font-style: italic; color: #374151;">${applyAllFormats(content)}</em>`
      )
      
      result = result.replace(/__(.+?)__/g, (_, content) => 
        `<u style="text-decoration: underline; color: #374151;">${applyAllFormats(content)}</u>`
      )
      
      return result
    }
    
    return applyAllFormats(processed)
  }, [])

  const markdownToHtml = useCallback((text: string) => {
    if (!text || text.trim() === '') return ''

    const lines = text.split('\n')
    let html = ''
    let inList = false
    
    lines.forEach((line) => {
      if (/^## (.+)/.test(line)) {
        if (inList) { html += '</ul>'; inList = false }
        html += `<h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 12px 0 6px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">${parseInlineFormatting(line.substring(3))}</h2>`
        return
      }
      
      if (/^- (.+)/.test(line)) {
        if (!inList) { html += '<ul style="list-style-type: none; padding-left: 0; margin: 4px 0;">'; inList = true }
        html += `<li style="padding-left: 20px; margin: 2px 0; color: #374151; position: relative;"><span style="position: absolute; left: 4px;">•</span><span>${parseInlineFormatting(line.substring(2))}</span></li>`
        return
      }
      
      if (inList) { html += '</ul>'; inList = false }
      
      if (line.trim() === '') {
        html += '<div style="height: 8px;"><br></div>'
        return
      }
      
      html += `<p style="margin: 2px 0; color: #374151; line-height: 1.6;">${parseInlineFormatting(line)}</p>`
    })
    
    if (inList) html += '</ul>'
    return html
  }, [parseInlineFormatting])

  // Extraire le markdown du HTML
  const htmlToMarkdown = useCallback((html: string): string => {
    const div = document.createElement('div')
    div.innerHTML = html
    let markdown = ''
    
    const getTextContentWithFormatting = (element: HTMLElement): string => {
      let text = ''
      Array.from(element.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          text += child.textContent || ''
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement
          const tag = el.tagName.toLowerCase()
          switch (tag) {
            case 'mark': text += '==' + getTextContentWithFormatting(el) + '=='; break
            case 'strong': text += '**' + getTextContentWithFormatting(el) + '**'; break
            case 'em': text += '*' + getTextContentWithFormatting(el) + '*'; break
            case 'u': text += '__' + getTextContentWithFormatting(el) + '__'; break
            case 'span': text += getTextContentWithFormatting(el); break
            default: text += el.textContent || ''
          }
        }
      })
      return text
    }
    
    const processNode = (node: Node): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        markdown += node.textContent || ''
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return
      
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      
      switch (tag) {
        case 'h2': markdown += '## ' + getTextContentWithFormatting(el) + '\n'; break
        case 'p': markdown += getTextContentWithFormatting(el) + '\n'; break
        case 'ul':
          Array.from(el.children).forEach(child => {
            if (child.tagName.toLowerCase() === 'li') {
              const spans = child.querySelectorAll('span')
              const lastSpan = spans[spans.length - 1]
              if (lastSpan) markdown += '- ' + getTextContentWithFormatting(lastSpan) + '\n'
            }
          })
          break
        case 'div':
          if (el.innerHTML === '<br>' || el.innerHTML === '') markdown += '\n'
          else Array.from(el.childNodes).forEach(processNode)
          break
        case 'mark': markdown += '==' + getTextContentWithFormatting(el) + '=='; break
        case 'strong': markdown += '**' + getTextContentWithFormatting(el) + '**'; break
        case 'em': markdown += '*' + getTextContentWithFormatting(el) + '*'; break
        case 'u': markdown += '__' + getTextContentWithFormatting(el) + '__'; break
        case 'br': markdown += '\n'; break
        default: Array.from(el.childNodes).forEach(processNode)
      }
    }
    
    Array.from(div.childNodes).forEach(processNode)
    return markdown.replace(/\n{3,}/g, '\n\n').trim()
  }, [])

  // Synchroniser l'éditeur
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const html = markdownToHtml(value)
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html
        lastValueRef.current = value
      }
    }
  }, [value, markdownToHtml])

  // Gérer les changements
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true
      const html = editorRef.current.innerHTML
      const markdown = htmlToMarkdown(html)
      
      if (markdown !== lastValueRef.current) {
        lastValueRef.current = markdown
        onChange(markdown)
      }
      
      setTimeout(() => {
        isInternalChange.current = false
      }, 0)
    }
  }, [onChange, htmlToMarkdown])

  // Appliquer un format au texte sélectionné ou activer/désactiver pour la suite
  const toggleFormat = useCallback((format: string) => {
    const selection = window.getSelection()
    if (!selection || !editorRef.current) return

    // Si du texte est sélectionné
    if (!selection.isCollapsed && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()

      if (selectedText) {
        // Vérifier si tout le texte sélectionné a déjà ce format
        const hasFormatOnSelection = hasFormat(format)
        
        if (hasFormatOnSelection) {
          // Supprimer le format : extraire le texte brut
          const tempDiv = document.createElement('div')
          tempDiv.appendChild(range.cloneContents())
          const textContent = htmlToMarkdown(tempDiv.innerHTML)
            .replace(/^==|==$/g, '')
            .replace(/^\*\*|\*\*$/g, '')
            .replace(/^\*|\*$/g, '')
            .replace(/^__|__$/g, '')
          
          range.deleteContents()
          range.insertNode(document.createTextNode(textContent))
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          // Appliquer le format
          let formattedHtml = ''
          switch (format) {
            case 'bold':
              formattedHtml = `<strong style="font-weight: 600; color: #111;">${selectedText}</strong>`
              break
            case 'italic':
              formattedHtml = `<em style="font-style: italic; color: #374151;">${selectedText}</em>`
              break
            case 'underline':
              formattedHtml = `<u style="text-decoration: underline; color: #374151;">${selectedText}</u>`
              break
            case 'highlight':
              formattedHtml = `<mark style="background-color: #FEF08A; padding: 0 3px; border-radius: 2px; color: #111;">${selectedText}</mark>`
              break
          }

          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = formattedHtml
          const fragment = document.createDocumentFragment()
          while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild)
          }
          
          range.deleteContents()
          range.insertNode(fragment)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        }
        
        handleInput()
        updateActiveFormats()
        return
      }
    }

    // Pas de sélection : toggle le format pour la frappe à venir
    const newPendingFormats = new Set(pendingFormatsRef.current)
    
    if (newPendingFormats.has(format)) {
      newPendingFormats.delete(format)
    } else {
      newPendingFormats.add(format)
    }
    
    pendingFormatsRef.current = newPendingFormats
    setActiveFormats(newPendingFormats)
    
    // Focus sur l'éditeur
    editorRef.current.focus()
  }, [handleInput, htmlToMarkdown, hasFormat, updateActiveFormats])

  // Intercepter la frappe pour appliquer les formats en attente
  const handleBeforeInput = useCallback((e: any) => {
    const pendingFormats = pendingFormatsRef.current
    
    if (pendingFormats.size > 0 && e.data) {
      e.preventDefault()
      
      let text = e.data
      
      // Appliquer les formats dans l'ordre
      const formatsArray = Array.from(pendingFormats)
      formatsArray.forEach(format => {
        switch (format) {
          case 'bold':
            text = `**${text}**`
            break
          case 'italic':
            text = `*${text}*`
            break
          case 'underline':
            text = `__${text}__`
            break
          case 'highlight':
            text = `==${text}==`
            break
        }
      })
      
      // Insérer le texte formaté
      const selection = window.getSelection()
      if (!selection || !selection.rangeCount) return
      
      const range = selection.getRangeAt(0)
      range.deleteContents()
      
      // Convertir le markdown en HTML pour l'insertion
      const html = parseInlineFormatting(text)
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = html
      const fragment = document.createDocumentFragment()
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      
      range.insertNode(fragment)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
      
      // Désactiver les formats après utilisation
      pendingFormatsRef.current = new Set()
      setActiveFormats(new Set())
      
      handleInput()
    }
  }, [handleInput, parseInlineFormatting])

  // Gérer la liste
  const toggleList = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return

    // Si du texte est sélectionné
    if (!selection.isCollapsed) {
      const range = selection.getRangeAt(0)
      const selectedText = range.toString()
      
      if (selectedText) {
        const listItems = selectedText.split('\n').filter(line => line.trim())
        let listHtml = '<ul style="list-style-type: none; padding-left: 0; margin: 4px 0;">'
        listItems.forEach(item => {
          listHtml += `<li style="padding-left: 20px; margin: 2px 0; color: #374151; position: relative;"><span style="position: absolute; left: 4px;">•</span><span>${item.trim()}</span></li>`
        })
        listHtml += '</ul>'
        
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = listHtml
        const fragment = document.createDocumentFragment()
        while (tempDiv.firstChild) {
          fragment.appendChild(tempDiv.firstChild)
        }
        
        range.deleteContents()
        range.insertNode(fragment)
        range.collapse(false)
        selection.removeAllRanges()
        selection.addRange(range)
        handleInput()
        return
      }
    }

    // Pas de sélection : insérer une nouvelle liste
    const newLi = document.createElement('li')
    newLi.style.cssText = 'padding-left: 20px; margin: 2px 0; color: #374151; position: relative;'
    newLi.innerHTML = '<span style="position: absolute; left: 4px;">•</span><span><br></span>'
    
    const ul = document.createElement('ul')
    ul.style.cssText = 'list-style-type: none; padding-left: 0; margin: 4px 0;'
    ul.appendChild(newLi)
    
    const range = selection.getRangeAt(0)
    range.insertNode(ul)
    
    // Placer le curseur dans le span
    const span = newLi.querySelectorAll('span')[1]
    if (span) {
      range.setStart(span, 0)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
    }
    
    handleInput()
  }, [handleInput])

  // Raccourcis clavier et gestion des listes
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          toggleFormat('bold')
          break
        case 'i':
          e.preventDefault()
          toggleFormat('italic')
          break
        case 'u':
          e.preventDefault()
          toggleFormat('underline')
          break
      }
    }
    
    // Gérer Entrée dans une liste
    if (e.key === 'Enter') {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      
      let node: Node | null = selection.anchorNode
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          if (element.tagName.toLowerCase() === 'li') {
            e.preventDefault()
            
            const newLi = document.createElement('li')
            newLi.style.cssText = 'padding-left: 20px; margin: 2px 0; color: #374151; position: relative;'
            newLi.innerHTML = '<span style="position: absolute; left: 4px;">•</span><span><br></span>'
            
            const parent = element.parentNode
            if (parent) {
              if (element.nextSibling) {
                parent.insertBefore(newLi, element.nextSibling)
              } else {
                parent.appendChild(newLi)
              }
            }
            
            const newSpan = newLi.querySelectorAll('span')[1]
            if (newSpan) {
              const range = document.createRange()
              range.setStart(newSpan, 0)
              range.collapse(true)
              selection.removeAllRanges()
              selection.addRange(range)
            }
            
            handleInput()
            return
          }
        }
        node = node.parentNode
      }
    }
    
    // Backspace sur une liste vide
    if (e.key === 'Backspace') {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return
      
      let node: Node | null = selection.anchorNode
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement
          if (element.tagName.toLowerCase() === 'li') {
            const lastSpan = element.querySelectorAll('span')[element.querySelectorAll('span').length - 1]
            if (lastSpan && (lastSpan.textContent === '' || lastSpan.innerHTML === '<br>')) {
              e.preventDefault()
              
              const parent = element.parentNode
              if (parent) {
                if (parent.children.length === 1) {
                  (parent as Element).remove()
                } else {
                  element.remove()
                }
              }
              
              handleInput()
              return
            }
          }
        }
        node = node.parentNode
      }
    }
  }, [toggleFormat, handleInput])

  // Coller en texte brut
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    range.deleteContents()
    
    const textNode = document.createTextNode(text)
    range.insertNode(textNode)
    range.setStartAfter(textNode)
    range.collapse(true)
    
    selection.removeAllRanges()
    selection.addRange(range)
    
    handleInput()
  }, [handleInput])

  return (
    <div 
      className="border border-gray-200 rounded-lg overflow-hidden bg-white"
      dir="ltr"
      style={{ direction: 'ltr' }}
    >
      {/* Barre d'outils */}
      <div className="flex items-center gap-0.5 p-2 border-b border-gray-200 bg-gray-50" dir="ltr">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleFormat('bold')
          }}
          className={`p-1.5 rounded transition-all ${
            activeFormats.has('bold') 
              ? 'bg-blue-100 text-blue-600 shadow-sm' 
              : 'hover:bg-white hover:shadow-sm text-gray-600'
          }`}
          title="Gras (Ctrl+B)"
        >
          <Bold size={15} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleFormat('italic')
          }}
          className={`p-1.5 rounded transition-all ${
            activeFormats.has('italic') 
              ? 'bg-blue-100 text-blue-600 shadow-sm' 
              : 'hover:bg-white hover:shadow-sm text-gray-600'
          }`}
          title="Italique (Ctrl+I)"
        >
          <Italic size={15} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleFormat('underline')
          }}
          className={`p-1.5 rounded transition-all ${
            activeFormats.has('underline') 
              ? 'bg-blue-100 text-blue-600 shadow-sm' 
              : 'hover:bg-white hover:shadow-sm text-gray-600'
          }`}
          title="Souligné (Ctrl+U)"
        >
          <Underline size={15} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleFormat('highlight')
          }}
          className={`p-1.5 rounded transition-all ${
            activeFormats.has('highlight') 
              ? 'bg-yellow-100 text-yellow-600 shadow-sm' 
              : 'hover:bg-yellow-100 text-yellow-600'
          }`}
          title="Surligner"
        >
          <Highlighter size={15} />
        </button>

        <div className="w-px h-5 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            toggleList()
          }}
          className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-gray-600"
          title="Liste à puces"
        >
          <List size={15} />
        </button>

        <span className="ml-auto text-[10px] text-gray-400 hidden sm:block">
          {activeFormats.size > 0 
            ? `Styles actifs : ${Array.from(activeFormats).join(', ')} - Tapez pour appliquer`
            : 'Sélectionnez du texte ou activez un style'
          }
        </span>
      </div>

      {/* Éditeur WYSIWYG */}
      <div className="relative">
        {!value && (
          <div 
            className="absolute inset-0 p-4 text-gray-400 pointer-events-none select-none"
            style={{ 
              minHeight,
              direction: 'ltr',
              textAlign: 'left'
            }}
          >
            {placeholder}
          </div>
        )}
        
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => {
            setIsFocused(true)
            updateActiveFormats()
          }}
          onBlur={() => setIsFocused(false)}
          onClick={updateActiveFormats}
          className="w-full p-4 outline-none border-0 bg-white text-gray-900"
          style={{ 
            minHeight,
            direction: 'ltr',
            textAlign: 'left',
            cursor: 'text'
          }}
          dir="ltr"
        />
      </div>
    </div>
  )
}