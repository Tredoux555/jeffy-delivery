import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: boolean | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  hover?: boolean
  interactive?: boolean
}

export function Card({ 
  children, 
  className, 
  padding = 'md', 
  shadow = true,
  hover = false,
  interactive = false
}: CardProps) {
  const paddingClasses = {
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }
  
  const shadowClasses = {
    false: '',
    true: 'shadow-jeffy',
    sm: 'shadow-sm',
    md: 'shadow-jeffy',
    lg: 'shadow-jeffy-lg',
    xl: 'shadow-jeffy-xl',
    '2xl': 'shadow-jeffy-2xl'
  }
  
  const shadowValue = typeof shadow === 'boolean' ? (shadow ? true : false) : shadow
  const shadowClass = shadowClasses[shadowValue as keyof typeof shadowClasses]
  
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200/50 transition-all duration-300',
        paddingClasses[padding],
        shadowClass,
        hover && 'hover:shadow-jeffy-lg hover:-translate-y-1',
        interactive && 'cursor-pointer hover:border-jeffy-yellow/30',
        className
      )}
    >
      {children}
    </div>
  )
}

