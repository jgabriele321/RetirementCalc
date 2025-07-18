import { useState, useEffect, useCallback } from 'react'
import type { CostOfLivingDatabase, CostOfLivingData, ZipCodeLookupResult } from '../types/costOfLiving'

interface UseCostOfLivingReturn {
  data: CostOfLivingDatabase | null
  isLoading: boolean
  error: string | null
  lookupZip: (zipCode: string) => ZipCodeLookupResult
  getAllZips: () => string[]
  getStateData: (state: string) => CostOfLivingData[]
}

export function useCostOfLiving(): UseCostOfLivingReturn {
  const [data, setData] = useState<CostOfLivingDatabase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch from public directory
        const response = await fetch('/col_by_zip.json')
        
        if (!response.ok) {
          throw new Error(`Failed to load cost of living data: ${response.status}`)
        }

        const costOfLivingData = await response.json() as CostOfLivingDatabase
        
        if (isMounted) {
          setData(costOfLivingData)
          console.log(`✅ Loaded cost of living data for ${Object.keys(costOfLivingData).length} ZIP codes`)
        }
      } catch (err) {
        if (isMounted) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error loading data'
          setError(errorMessage)
          console.error('❌ Error loading cost of living data:', err)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  // Lookup ZIP code with fallback logic
  const lookupZip = useCallback((zipCode: string): ZipCodeLookupResult => {
    if (!data) {
      return { data: null, isFound: false, isFallback: false }
    }

    // Clean and normalize ZIP code
    const normalizedZip = zipCode.replace(/\D/g, '').padStart(5, '0')
    
    // Direct lookup first
    if (data[normalizedZip]) {
      return {
        data: data[normalizedZip],
        isFound: true,
        isFallback: false
      }
    }

    // Fallback 1: Look for same state ZIP codes and use average
    const stateFromZip = getStateFromZip(normalizedZip)
    if (stateFromZip) {
      const stateData = getStateData(stateFromZip)
      if (stateData.length > 0) {
        const avgData = calculateAverageRPP(stateData)
        return {
          data: { ...avgData, state: stateFromZip, cbsa_code: null },
          isFound: true,
          isFallback: true,
          fallbackType: 'state'
        }
      }
    }

    // Fallback 2: Use national average (100.0 for all RPP values)
    return {
      data: {
        rpp_all: 100.0,
        rpp_housing: 100.0,
        rpp_goods: 100.0,
        rpp_other: 100.0,
        state: stateFromZip || 'US',
        cbsa_code: null
      },
      isFound: true,
      isFallback: true,
      fallbackType: 'state'
    }
  }, [data])

  // Get all available ZIP codes
  const getAllZips = useCallback((): string[] => {
    return data ? Object.keys(data).sort() : []
  }, [data])

  // Get data for a specific state
  const getStateData = useCallback((state: string): CostOfLivingData[] => {
    if (!data) return []
    
    return Object.values(data).filter(item => item.state === state.toUpperCase())
  }, [data])

  // Helper function to determine state from ZIP code
  const getStateFromZip = (zipCode: string): string | null => {
    // This is a simplified ZIP to state mapping
    // In a real application, you'd want a more comprehensive mapping
    const zipToState: { [key: string]: string } = {
      '0': 'MA', '1': 'MA', '2': 'MA', '3': 'NH', '4': 'ME', '5': 'VT',
      '6': 'CT', '7': 'NJ', '8': 'NJ', '9': 'NJ',
      '10': 'NY', '11': 'NY', '12': 'NY', '13': 'NY', '14': 'NY',
      '15': 'PA', '16': 'PA', '17': 'PA', '18': 'PA', '19': 'PA',
      '20': 'DC', '21': 'MD', '22': 'VA', '23': 'VA', '24': 'VA',
      '25': 'MA', '26': 'MA', '27': 'MA',
      '28': 'NC', '29': 'SC',
      '30': 'GA', '31': 'GA', '32': 'FL', '33': 'FL', '34': 'FL',
      '35': 'AL', '36': 'AL', '37': 'TN', '38': 'TN', '39': 'OH',
      '40': 'KY', '41': 'KY', '42': 'PA', '43': 'OH', '44': 'OH', '45': 'OH',
      '46': 'IN', '47': 'IN', '48': 'MI', '49': 'MI',
      '50': 'IA', '51': 'IA', '52': 'IA', '53': 'WI', '54': 'WI',
      '55': 'MN', '56': 'MN', '57': 'MN', '58': 'MN', '59': 'MN',
      '60': 'IL', '61': 'IL', '62': 'IL', '63': 'MO', '64': 'MO', '65': 'MO',
      '66': 'KS', '67': 'KS', '68': 'NE', '69': 'NE',
      '70': 'LA', '71': 'LA', '72': 'AR', '73': 'OK', '74': 'OK',
      '75': 'TX', '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX',
      '80': 'CO', '81': 'CO', '82': 'WY', '83': 'ID', '84': 'UT',
      '85': 'AZ', '86': 'AZ', '87': 'NM', '88': 'NV', '89': 'NV',
      '90': 'CA', '91': 'CA', '92': 'CA', '93': 'CA', '94': 'CA',
      '95': 'CA', '96': 'CA', '97': 'OR', '98': 'WA', '99': 'AK'
    }

    const firstTwo = zipCode.substring(0, 2)
    const firstOne = zipCode.substring(0, 1)
    
    return zipToState[firstTwo] || zipToState[firstOne] || null
  }

  // Calculate average RPP from array of data
  const calculateAverageRPP = (dataArray: CostOfLivingData[]): Omit<CostOfLivingData, 'state' | 'cbsa_code'> => {
    if (dataArray.length === 0) {
      return { rpp_all: 100.0, rpp_housing: 100.0, rpp_goods: 100.0, rpp_other: 100.0 }
    }

    const sum = dataArray.reduce((acc, item) => ({
      rpp_all: acc.rpp_all + item.rpp_all,
      rpp_housing: acc.rpp_housing + item.rpp_housing,
      rpp_goods: acc.rpp_goods + item.rpp_goods,
      rpp_other: acc.rpp_other + item.rpp_other
    }), { rpp_all: 0, rpp_housing: 0, rpp_goods: 0, rpp_other: 0 })

    return {
      rpp_all: Math.round((sum.rpp_all / dataArray.length) * 100) / 100,
      rpp_housing: Math.round((sum.rpp_housing / dataArray.length) * 100) / 100,
      rpp_goods: Math.round((sum.rpp_goods / dataArray.length) * 100) / 100,
      rpp_other: Math.round((sum.rpp_other / dataArray.length) * 100) / 100
    }
  }

  return {
    data,
    isLoading,
    error,
    lookupZip,
    getAllZips,
    getStateData
  }
}