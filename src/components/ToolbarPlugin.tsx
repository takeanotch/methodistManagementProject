'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, HeadingTagType } from '@lexical/rich-text'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import { useCallback, useEffect, useState } from 'react'
import { $patchStyleText } from '@lexical/selection'
import { $createParagraphNode } from 'lexical'
export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext()
  const [isBold, setIsBold] = useState(false)
  const [isItalic, setIsItalic] = useState(false)
  const [isUnderline, setIsUnderline] = useState(false)
  const [isStrikethrough, setIsStrikethrough] = useState(false)
  const [isHighlighted, setIsHighlighted] = useState(false)
  const [blockType, setBlockType] = useState('paragraph')
  const [textColor, setTextColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')

  const updateToolbar = useCallback(() => {
    const selection = $getSelection()
    if ($isRangeSelection(selection)) {
      // Format texte
      setIsBold(selection.hasFormat('bold'))
      setIsItalic(selection.hasFormat('italic'))
      setIsUnderline(selection.hasFormat('underline'))
      setIsStrikethrough(selection.hasFormat('strikethrough'))
      setIsHighlighted(selection.hasFormat('highlight'))

      // Type de bloc
      const anchorNode = selection.anchor.getNode()
      const element = anchorNode.getKey() === 'root' 
        ? anchorNode 
        : anchorNode.getTopLevelElementOrThrow()
      
      if (element) {
        const type = element.getType()
        if (type === 'heading') {
          const tag = (element as any).getTag()
          setBlockType(tag)
        } else if (type === 'quote') {
          setBlockType('quote')
        } else {
          setBlockType('paragraph')
        }
      }
    }
  }, [])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar()
        return false
      },
      COMMAND_PRIORITY_CRITICAL
    )
  }, [editor, updateToolbar])

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles)
        }
      })
    },
    [editor]
  )

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: value })
      setTextColor(value)
    },
    [applyStyleText]
  )

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ 'background-color': value })
      setBgColor(value)
    },
    [applyStyleText]
  )

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize))
        }
      })
    }
  }

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }
  }

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode())
        }
      })
    }
  }

  const insertLink = useCallback(() => {
    const url = prompt('Entrez l\'URL du lien:')
    if (url) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
    }
  }, [editor])

  return (
    <div className="toolbar flex flex-wrap gap-1 p-3 border-b border-gray-200 bg-gray-50">
      {/* Formatage de texte */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          className={`p-2 rounded hover:bg-gray-200 transition ${isBold ? 'bg-gray-300' : ''}`}
          title="Gras (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          className={`p-2 rounded hover:bg-gray-200 transition ${isItalic ? 'bg-gray-300' : ''}`}
          title="Italique (Ctrl+I)"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          className={`p-2 rounded hover:bg-gray-200 transition ${isUnderline ? 'bg-gray-300' : ''}`}
          title="Souligné (Ctrl+U)"
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          className={`p-2 rounded hover:bg-gray-200 transition ${isStrikethrough ? 'bg-gray-300' : ''}`}
          title="Barré"
        >
          <span className="line-through">S</span>
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')}
          className={`p-2 rounded hover:bg-gray-200 transition ${isHighlighted ? 'bg-yellow-200' : ''}`}
          title="Surligner"
        >
          <span>🖍️</span>
        </button>
      </div>

      {/* Styles de bloc */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={formatParagraph}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${
            blockType === 'paragraph' ? 'bg-gray-300' : ''
          }`}
          title="Paragraphe normal"
        >
          Normal
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h1')}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${
            blockType === 'h1' ? 'bg-gray-300' : ''
          }`}
          title="Titre 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h2')}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${
            blockType === 'h2' ? 'bg-gray-300' : ''
          }`}
          title="Titre 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => formatHeading('h3')}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${
            blockType === 'h3' ? 'bg-gray-300' : ''
          }`}
          title="Titre 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={formatQuote}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${
            blockType === 'quote' ? 'bg-gray-300' : ''
          }`}
          title="Citation"
        >
          ❝ Citation
        </button>
      </div>

      {/* Listes */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          className="p-2 rounded hover:bg-gray-200 transition"
          title="Liste à puces"
        >
          <span>• Liste</span>
        </button>
        <button
          type="button"
          onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
          className="p-2 rounded hover:bg-gray-200 transition"
          title="Liste numérotée"
        >
          <span>1. Liste</span>
        </button>
      </div>

      {/* Lien */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded hover:bg-gray-200 transition"
          title="Insérer un lien"
        >
          <span>🔗 Lien</span>
        </button>
      </div>

      {/* Couleurs */}
      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-600">Texte:</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => onFontColorSelect(e.target.value)}
            className="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer"
            title="Couleur du texte"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-600">Fond:</label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => onBgColorSelect(e.target.value)}
            className="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer"
            title="Couleur de fond"
          />
        </div>
      </div>
    </div>
  )
}