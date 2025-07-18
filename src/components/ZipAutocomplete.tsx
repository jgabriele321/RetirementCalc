import { useState, useEffect, useRef } from 'react'
import { useCostOfLiving } from '../hooks/useCostOfLiving'
import { validateZipCode } from '../utils/calculations'

interface ZipAutocompleteProps {
  label: string
  value: string
  onChange: (zipCode: string) => void
  placeholder?: string
  className?: string
}

interface ZipSuggestion {
  zipCode: string
  state: string
  rpp: number
  isExact: boolean
}

export function ZipAutocomplete({ 
  label, 
  value, 
  onChange, 
  placeholder = "Enter ZIP code",
  className = "" 
}: ZipAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value)
  const [suggestions, setSuggestions] = useState<ZipSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isValid, setIsValid] = useState(true)
  
  const { data, lookupZip } = useCostOfLiving()
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Generate suggestions based on input
  useEffect(() => {
    if (!data || !inputValue.trim()) {
      setSuggestions([])
      return
    }

    const query = inputValue.replace(/\D/g, '')
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    const allZips = Object.keys(data)
    const matchingSuggestions: ZipSuggestion[] = []

    // Find ZIP codes that start with the query
    for (const zipCode of allZips) {
      if (zipCode.startsWith(query)) {
        const zipData = data[zipCode]
        matchingSuggestions.push({
          zipCode,
          state: zipData.state,
          rpp: zipData.rpp_all,
          isExact: zipCode === query
        })
      }
      
      // Limit suggestions to prevent performance issues
      if (matchingSuggestions.length >= 10) break
    }

    // Sort by exact match first, then by ZIP code
    matchingSuggestions.sort((a, b) => {
      if (a.isExact && !b.isExact) return -1
      if (!a.isExact && b.isExact) return 1
      return a.zipCode.localeCompare(b.zipCode)
    })

    setSuggestions(matchingSuggestions)
  }, [inputValue, data])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setShowSuggestions(true)
    setSelectedIndex(-1)
    
    // Validate ZIP code format
    const validation = validateZipCode(newValue)
    setIsValid(validation.isValid || newValue.length === 0)
  }

  // Handle input blur
  const handleBlur = () => {
    // Delay to allow for suggestion clicks
    setTimeout(() => {
      setShowSuggestions(false)
      
      // Validate and format final value
      const validation = validateZipCode(inputValue)
      if (validation.isValid) {
        const result = lookupZip(validation.formatted)
        if (result.isFound) {
          setInputValue(validation.formatted)
          onChange(validation.formatted)
        } else {
          setIsValid(false)
        }
      }
    }, 200)
  }

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion: ZipSuggestion) => {
    setInputValue(suggestion.zipCode)
    onChange(suggestion.zipCode)
    setShowSuggestions(false)
    setIsValid(true)
    inputRef.current?.focus()
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Show validation status
  const getValidationIcon = () => {
    if (!inputValue.trim()) return null
    
    const result = lookupZip(inputValue)
    if (result.isFound && !result.isFallback) {
      return <span className="text-green-500">✓</span>
    } else if (result.isFound && result.isFallback) {
      return <span className="text-yellow-500">⚠</span>
    } else if (!isValid) {
      return <span className="text-red-500">✗</span>
    }
    return null
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-dark/70 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`input-field pr-8 ${!isValid ? 'border-red-500 ring-red-200' : ''}`}
          maxLength={5}
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {getValidationIcon()}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.zipCode}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-dark">{suggestion.zipCode}</div>
                  <div className="text-sm text-dark/60">{suggestion.state}</div>
                </div>
                <div className="text-sm text-dark/60">
                  RPP: {suggestion.rpp.toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Validation message */}
      {!isValid && inputValue.trim() && (
        <div className="mt-1 text-sm text-red-600">
          Please enter a valid 5-digit ZIP code
        </div>
      )}
      
      {/* Status message */}
      {isValid && inputValue.trim() && (
        <div className="mt-1 text-sm text-dark/60">
          {(() => {
            const result = lookupZip(inputValue)
            if (result.isFound && !result.isFallback) {
              return `✓ Found: ${result.data?.state} (RPP: ${result.data?.rpp_all.toFixed(1)})`
            } else if (result.isFound && result.isFallback) {
              return `⚠ Using ${result.fallbackType} average: ${result.data?.state} (RPP: ${result.data?.rpp_all.toFixed(1)})`
            }
            return ''
          })()}
        </div>
      )}
    </div>
  )
}