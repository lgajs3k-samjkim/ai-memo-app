'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  content: string
  className?: string
}

export default function MarkdownContent({
  content,
  className = '',
}: MarkdownContentProps) {
  if (!content.trim()) {
    return (
      <p className="text-sm text-gray-400" data-testid="markdown-empty">
        미리보기할 내용이 없습니다.
      </p>
    )
  }

  return (
    <div
      className={`markdown-content text-gray-800 ${className}`}
      data-testid="markdown-content"
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
