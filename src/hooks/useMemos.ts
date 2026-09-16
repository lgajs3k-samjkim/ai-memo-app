'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Memo, MemoFormData } from '@/types/memo'
import { localStorageUtils } from '@/utils/localStorage'
import { seedSampleData } from '@/utils/seedData'

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 메모 로드
  useEffect(() => {
    setLoading(true)
    try {
      // 샘플 데이터 시딩 (기존 데이터가 없을 때만)
      seedSampleData()
      const loadedMemos = localStorageUtils.getMemos()
      setMemos(loadedMemos)
    } catch (error) {
      console.error('Failed to load memos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 메모 생성
  const createMemo = useCallback((formData: MemoFormData): Memo => {
    const newMemo: Memo = {
      id: uuidv4(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    localStorageUtils.addMemo(newMemo)
    setMemos(prev => [newMemo, ...prev])

    return newMemo
  }, [])

  // 메모 업데이트
  const updateMemo = useCallback(
    (id: string, formData: MemoFormData): void => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      const updatedMemo: Memo = {
        ...existingMemo,
        ...formData,
        updatedAt: new Date().toISOString(),
      }

      localStorageUtils.updateMemo(updatedMemo)
      setMemos(prev => prev.map(memo => (memo.id === id ? updatedMemo : memo)))
    },
    [memos]
  )

  // 메모 삭제
  const deleteMemo = useCallback((id: string): void => {
    localStorageUtils.deleteMemo(id)
    setMemos(prev => prev.filter(memo => memo.id !== id))
  }, [])

  const updateSummary = useCallback((id: string, summary: string): void => {
    setMemos(prev => {
      const existingMemo = prev.find(memo => memo.id === id)
      if (!existingMemo) return prev

      const updatedMemo: Memo = {
        ...existingMemo,
        summary,
        updatedAt: new Date().toISOString(),
      }

      localStorageUtils.updateMemo(updatedMemo)
      return prev.map(memo => (memo.id === id ? updatedMemo : memo))
    })
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 모든 메모 삭제
  const clearAllMemos = useCallback((): void => {
    localStorageUtils.clearMemos()
    setMemos([])
    setSearchQuery('')
    setSelectedCategory('all')
  }, [])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,

    // 메모 CRUD
    createMemo,
    updateMemo,
    updateSummary,
    deleteMemo,
    getMemoById,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    clearAllMemos,
  }
}
