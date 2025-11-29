import React from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  loading?: boolean
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  loading = false,
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:ring-offset-2 touch-manipulation active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none'
  
  const variants = {
    primary: 'bg-jeffy-yellow text-gray-900 hover:bg-jeffy-yellow-dark hover:shadow-jeffy-lg shadow-jeffy hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-jeffy',
    secondary: 'bg-jeffy-grey text-white hover:bg-jeffy-grey-dark shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-md',
    outline: 'border-2 border-jeffy-yellow text-gray-900 hover:bg-jeffy-yellow hover:shadow-jeffy hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-none',
    ghost: 'text-gray-700 hover:bg-jeffy-yellow-light hover:text-gray-900'
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3.5 text-lg'
  }
  
  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}

