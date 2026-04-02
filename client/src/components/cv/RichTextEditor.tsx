/**
 * Rich Text Editor for CV sections
 * Simple formatting without heavy dependencies
 */

import { useState, useRef, useCallback, useId } from 'react'
import {
  Bold, Italic, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, Link, Undo, Redo,
  Type, Heading
} from '@/components/ui/icons'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  minHeight?: string
  label?: string
  helpText?: string
  id?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Skriv här...',
  maxLength = 2000,
  minHeight = '150px',
  label,
  helpText,
  id: providedId
}: RichTextEditorProps) {
  const generatedId = useId()
  const editorId = providedId || `rich-text-${generatedId}`
  const helpTextId = `${editorId}-help`
  const counterId = `${editorId}-counter`
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [history, setHistory] = useState<string[]>([value])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [showToolbar, setShowToolbar] = useState(true) // Show toolbar by default

  // Simple formatting functions that insert markdown-like syntax
  const insertFormatting = useCallback((before: string, after: string = '') => {
    const textarea = editorRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Save to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newText)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }, [value, onChange, history, historyIndex])

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      onChange(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      onChange(history[historyIndex + 1])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
      
      // Add to history (debounced in real implementation)
      if (newValue !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newValue)
        // Limit history size
        if (newHistory.length > 50) newHistory.shift()
        setHistory(newHistory)
        setHistoryIndex(newHistory.length - 1)
      }
    }
  }

  const charCount = value.length
  const charPercentage = (charCount / maxLength) * 100

  const toolbarButtons = [
    { icon: Bold, action: () => insertFormatting('**', '**'), title: 'Fetstil (Ctrl+B)' },
    { icon: Italic, action: () => insertFormatting('*', '*'), title: 'Kursiv (Ctrl+I)' },
    { icon: null, separator: true },
    { icon: Heading, action: () => insertFormatting('## ', ''), title: 'Rubrik' },
    { icon: Type, action: () => insertFormatting('### ', ''), title: 'Underrubrik' },
    { icon: null, separator: true },
    { icon: List, action: () => insertFormatting('\n- ', ''), title: 'Punktlista' },
    { icon: ListOrdered, action: () => insertFormatting('\n1. ', ''), title: 'Numrerad lista' },
    { icon: Quote, action: () => insertFormatting('\n> ', ''), title: 'Citat' },
    { icon: null, separator: true },
    { icon: Link, action: () => insertFormatting('[', '](url)'), title: 'Länk' },
    { icon: null, separator: true },
    { icon: Undo, action: handleUndo, title: 'Ångra (Ctrl+Z)', disabled: historyIndex === 0 },
    { icon: Redo, action: handleRedo, title: 'Gör om (Ctrl+Y)', disabled: historyIndex >= history.length - 1 },
  ]

  // Keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault()
      insertFormatting('**', '**')
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault()
      insertFormatting('*', '*')
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleUndo()
    }
    if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault()
      handleRedo()
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={editorId} className="text-sm font-medium text-slate-700">{label}</label>
          <button
            type="button"
            onClick={() => setShowToolbar(!showToolbar)}
            aria-expanded={showToolbar}
            aria-controls={`${editorId}-toolbar`}
            className="text-xs text-purple-600 hover:text-purple-700 font-medium"
          >
            {showToolbar ? 'Dölj verktygsfält' : 'Visa verktygsfält'}
          </button>
        </div>
      )}

      {/* Toolbar */}
      {showToolbar && (
        <div
          id={`${editorId}-toolbar`}
          role="toolbar"
          aria-label="Formateringsverktyg"
          aria-controls={editorId}
          className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-lg"
        >
          {toolbarButtons.map((btn, idx) =>
            btn.separator ? (
              <div key={idx} className="w-px h-6 bg-slate-300 mx-1" role="separator" aria-orientation="vertical" />
            ) : (
              <button
                key={idx}
                type="button"
                onClick={btn.action}
                disabled={btn.disabled}
                aria-label={btn.title}
                title={btn.title}
                className={`
                  p-1.5 rounded hover:bg-slate-200 transition-colors
                  ${btn.disabled ? 'opacity-30 cursor-not-allowed' : 'text-slate-600 hover:text-slate-800'}
                `}
              >
                <btn.icon className="w-4 h-4" aria-hidden="true" />
              </button>
            )
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="relative">
        <textarea
          ref={editorRef}
          id={editorId}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-describedby={`${helpText ? helpTextId : ''} ${counterId}`.trim() || undefined}
          aria-label={label || 'Textredigerare'}
          className={`
            w-full px-4 py-3 border border-slate-200
            ${showToolbar ? 'rounded-b-lg' : 'rounded-lg'}
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            text-slate-700 placeholder:text-slate-400
            resize-y
          `}
          style={{ minHeight }}
        />

        {/* Character counter */}
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
          <span
            id={counterId}
            className={`
            text-xs font-medium
            ${charPercentage > 90 ? 'text-red-500' :
              charPercentage > 75 ? 'text-amber-500' : 'text-slate-400'}
          `}
            aria-live="polite"
            aria-atomic="true"
          >
            {charCount}/{maxLength}
          </span>
          <div
            className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={charCount}
            aria-valuemin={0}
            aria-valuemax={maxLength}
            aria-label={`Teckenanvändning: ${charCount} av ${maxLength}`}
          >
            <div
              className={`h-full transition-all duration-300 ${
                charPercentage > 90 ? 'bg-red-500' :
                charPercentage > 75 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(charPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {helpText && (
        <p id={helpTextId} className="text-xs text-slate-500">{helpText}</p>
      )}
    </div>
  )
}
