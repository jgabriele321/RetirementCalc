import { useState, useEffect } from 'react'

interface BucketInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  icon?: React.ReactNode
  description?: string
  className?: string
}

export function BucketInput({
  label,
  value,
  onChange,
  placeholder = "0",
  icon,
  description,
  className = ""
}: BucketInputProps) {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // Format value for display
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? value.toString() : '')
    }
  }, [value, isFocused])

  // Parse currency input
  const parseInput = (input: string): number => {
    // Remove non-digit characters except decimal point
    const cleaned = input.replace(/[^\d.]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : Math.max(0, Math.round(parsed))
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    setDisplayValue(input)
    
    // Parse and update value in real-time
    const numericValue = parseInput(input)
    onChange(numericValue)
  }

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true)
    // Show raw number when focused
    setDisplayValue(value > 0 ? value.toString() : '')
  }

  const handleBlur = () => {
    setIsFocused(false)
    // Format final value
    const numericValue = parseInput(displayValue)
    onChange(numericValue)
  }

  // Format display value with currency
  const getFormattedDisplay = (): string => {
    if (isFocused) {
      return displayValue
    }
    return value > 0 ? `$${value.toLocaleString()}` : ''
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        {icon && (
          <div className="text-dark/60 flex-shrink-0">
            {icon}
          </div>
        )}
        <label className="block text-sm font-medium text-dark/70 flex-grow">
          {label}
        </label>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {!isFocused && value > 0 ? null : (
            <span className="text-dark/40">$</span>
          )}
        </div>
        
        <input
          type="text"
          inputMode="numeric"
          value={isFocused ? displayValue : getFormattedDisplay()}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`input-field pl-8 ${
            value > 0 ? 'font-medium' : ''
          }`}
        />
      </div>
      
      {description && (
        <div className="text-xs text-dark/50">
          {description}
        </div>
      )}
    </div>
  )
}