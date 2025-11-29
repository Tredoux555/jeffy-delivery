import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export function Input({ 
  label, 
  error, 
  helperText,
  icon,
  className, 
  ...props 
}: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-4 py-3 border rounded-xl',
            'focus:outline-none focus:ring-2 focus:ring-jeffy-yellow focus:border-jeffy-yellow',
            'transition-all duration-200 ease-in-out',
            'placeholder:text-gray-400 placeholder:font-normal',
            'bg-white hover:border-gray-400',
            error && 'border-red-400 focus:ring-red-500 focus:border-red-500',
            !error && 'border-gray-300',
            icon && 'pl-10',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium flex items-center gap-1 animate-fade-in">
          <span className="text-red-500">•</span>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}

