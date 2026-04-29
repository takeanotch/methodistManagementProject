'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import {TextStyle} from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface TipTapEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="toolbar flex flex-wrap gap-1 p-3 border-b border-gray-200 bg-gray-50">
      {/* Texte */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
          title="Gras (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
          title="Italique (Ctrl+I)"
        >
          <span className="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('underline') ? 'bg-gray-300' : ''}`}
          title="Souligné (Ctrl+U)"
        >
          <span className="underline">U</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('strike') ? 'bg-gray-300' : ''}`}
          title="Barré"
        >
          <span className="line-through">S</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('highlight') ? 'bg-yellow-200' : ''}`}
          title="Surligner"
        >
          <span>🖍️</span>
        </button>
      </div>

      {/* Titres */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''}`}
          title="Titre 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''}`}
          title="Titre 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''}`}
          title="Titre 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-3 py-2 rounded hover:bg-gray-200 transition text-sm ${editor.isActive('paragraph') ? 'bg-gray-300' : ''}`}
          title="Paragraphe"
        >
          P
        </button>
      </div>

      {/* Listes */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          title="Liste à puces"
        >
          <span>• Liste</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          title="Liste numérotée"
        >
          <span>1. Liste</span>
        </button>
      </div>

      {/* Alignement */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
          title="Aligner à gauche"
        >
          <span>⬅️</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          title="Centrer"
        >
          <span>⬅️➡️</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          title="Aligner à droite"
        >
          <span>➡️</span>
        </button>
      </div>

      {/* Lien */}
      <div className="flex gap-1 border-r border-gray-300 pr-3 mr-2">
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('link') ? 'bg-gray-300' : ''}`}
          title="Insérer un lien"
        >
          <span>🔗 Lien</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="p-2 rounded hover:bg-gray-200 transition"
          title="Supprimer le lien"
        >
          <span>🔓</span>
        </button>
      </div>

      {/* Couleurs */}
      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-600">Texte:</label>
          <input
            type="color"
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 p-0.5 border border-gray-300 rounded cursor-pointer"
            title="Couleur du texte"
          />
        </div>
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetColor().run()}
          className="p-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
          title="Réinitialiser la couleur"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default function TipTapEditor({ 
  value, 
  onChange, 
  placeholder = 'Commencez à écrire...',
  minHeight = '200px'
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
        style: `min-height: ${minHeight}; padding: 1rem;`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html)
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [editor, value])

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}