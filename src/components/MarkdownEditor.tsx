'use client'

import { useCallback, useRef, useState } from 'react'
import MarkdownContent from './MarkdownContent'

type EditorTab = 'write' | 'preview'

interface MarkdownEditorProps {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

interface ToolbarAction {
  label: string
  title: string
  before: string
  after: string
  placeholder?: string
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  {
    label: 'H',
    title: '제목',
    before: '## ',
    after: '',
    placeholder: '제목',
  },
  {
    label: 'B',
    title: '굵게',
    before: '**',
    after: '**',
    placeholder: '굵은 텍스트',
  },
  {
    label: 'I',
    title: '기울임',
    before: '*',
    after: '*',
    placeholder: '기울임 텍스트',
  },
  {
    label: '목록',
    title: '글머리 기호',
    before: '- ',
    after: '',
    placeholder: '항목',
  },
  {
    label: '링크',
    title: '링크',
    before: '[',
    after: '](https://)',
    placeholder: '링크 텍스트',
  },
  {
    label: '코드',
    title: '코드',
    before: '`',
    after: '`',
    placeholder: '코드',
  },
]

export default function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder = '마크다운으로 메모를 작성하세요',
  rows = 10,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInsert = useCallback(
    (action: ToolbarAction) => {
      const textarea = textareaRef.current
      if (!textarea) {
        onChange(`${value}${action.before}${action.placeholder ?? ''}${action.after}`)
        return
      }

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selected = value.slice(start, end) || action.placeholder || ''
      const nextValue =
        value.slice(0, start) + action.before + selected + action.after + value.slice(end)

      onChange(nextValue)

      requestAnimationFrame(() => {
        textarea.focus()
        const cursorStart = start + action.before.length
        const cursorEnd = cursorStart + selected.length
        textarea.setSelectionRange(cursorStart, cursorEnd)
      })
    },
    [onChange, value]
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div
          className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
          role="tablist"
          aria-label="마크다운 편집 모드"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'write'}
            onClick={() => setActiveTab('write')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'write'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="markdown-write-tab"
          >
            작성
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'preview'}
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            data-testid="markdown-preview-tab"
          >
            미리보기
          </button>
        </div>

        {activeTab === 'write' && (
          <div className="flex flex-wrap gap-1">
            {TOOLBAR_ACTIONS.map(action => (
              <button
                key={action.title}
                type="button"
                onClick={() => handleInsert(action)}
                className="px-2 py-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                title={action.title}
                aria-label={action.title}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'write' ? (
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={event => onChange(event.target.value)}
          className="placeholder-gray-400 text-gray-800 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none font-mono text-sm"
          placeholder={placeholder}
          rows={rows}
          required
          data-testid="markdown-editor-textarea"
        />
      ) : (
        <div
          className="min-h-[220px] w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 overflow-y-auto"
          data-testid="markdown-editor-preview"
        >
          <MarkdownContent content={value} />
        </div>
      )}
    </div>
  )
}
