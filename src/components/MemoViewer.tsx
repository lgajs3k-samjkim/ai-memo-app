'use client'

import { useEffect, useCallback, useState } from 'react'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import MarkdownContent from './MarkdownContent'
import { summarizeMemo } from '@/utils/ai'

interface MemoViewerProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onSaveSummary: (id: string, summary: string) => void
}

export default function MemoViewer({
  memo,
  isOpen,
  onClose,
  onEdit,
  onSaveSummary,
}: MemoViewerProps) {
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [summaryError, setSummaryError] = useState('')
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return

    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  useEffect(() => {
    setSummaryError('')
    setIsSummarizing(false)
  }, [memo?.id, isOpen])

  if (!isOpen || !memo) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800',
      work: 'bg-green-100 text-green-800',
      study: 'bg-purple-100 text-purple-800',
      idea: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const handleEdit = () => {
    onEdit(memo)
  }

  const handleSummarize = async () => {
    setSummaryError('')
    setIsSummarizing(true)

    try {
      const summary = await summarizeMemo(memo.title, memo.content)
      onSaveSummary(memo.id, summary)
    } catch (error) {
      setSummaryError(
        error instanceof Error ? error.message : 'AI 요청에 실패했습니다.'
      )
    } finally {
      setIsSummarizing(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-overlay"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={event => event.stopPropagation()}
        data-testid="memo-viewer"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-4">
              <h2
                id="memo-viewer-title"
                className="inline-block text-xl font-semibold text-gray-900 mb-3 rounded-sm px-1 -mx-1 transition-colors hover:bg-orange-500 hover:text-white"
              >
                {memo.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="상세보기 닫기"
              data-testid="close-memo-viewer-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-sm font-medium text-gray-500">
                  요약
                  {memo.summary ? (
                    <span
                      className="ml-2 text-xs text-gray-400 font-normal"
                      data-testid="memo-summary-length"
                    >
                      {memo.summary.length}/200자
                    </span>
                  ) : null}
                </h3>
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="px-3 py-1.5 text-sm bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300 rounded-lg transition-colors"
                  data-testid="ai-summarize-btn"
                >
                  {isSummarizing ? '요약 중...' : 'AI요약'}
                </button>
              </div>
              {summaryError && (
                <p className="text-sm text-red-600 mb-2" data-testid="ai-summarize-error">
                  {summaryError}
                </p>
              )}
              <div
                className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 min-h-[2.5rem]"
                data-testid="memo-summary"
              >
                {memo.summary ? (
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {memo.summary}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">내용</h3>
              <div data-testid="memo-viewer-content">
                <MarkdownContent content={memo.content} />
              </div>
            </div>

            {memo.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">태그</h3>
                <div className="flex gap-2 flex-wrap">
                  {memo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <div>
                <span className="block text-xs text-gray-500 mb-1">
                  작성일
                </span>
                <span>{formatDate(memo.createdAt)}</span>
              </div>
              <div>
                <span className="block text-xs text-gray-500 mb-1">
                  수정일
                </span>
                <span>{formatDate(memo.updatedAt)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={handleEdit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                data-testid="viewer-edit-memo-btn"
              >
                편집하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
