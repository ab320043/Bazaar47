'use client'

import { useState } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('cart') : null
      return saved ? (JSON.parse(saved) as CartItem[]) : []
    } catch {
      return []
    }
  })

  const addItem = (item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      let newItems
      
      if (existing) {
        newItems = prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      } else {
        newItems = [...prev, item]
      }
      
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id)
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id)
      return
    }
    
    setItems(prev => {
      const newItems = prev.map(i =>
        i.id === id ? { ...i, quantity } : i
      )
      localStorage.setItem('cart', JSON.stringify(newItems))
      return newItems
    })
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem('cart')
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    totalPrice,
  }
}