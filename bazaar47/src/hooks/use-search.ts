'use client'

import { useState, useCallback } from 'react'

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const openSearch = useCallback(() => setIsOpen(true), [])
  const closeSearch = useCallback(() => setIsOpen(false), [])
  const toggleSearch = useCallback(() => setIsOpen(prev => !prev), [])

  return {
    searchQuery,
    setSearchQuery,
    isOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  }
}