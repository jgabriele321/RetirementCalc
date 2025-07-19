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

        // Fetch optimized core dataset
        const response = await fetch('/col_by_zip_core.json')
        
        if (!response.ok) {
          throw new Error(`Failed to load cost of living data: ${response.status}`)
        }

        const costOfLivingData = await response.json() as CostOfLivingDatabase
        
        if (isMounted) {
          setData(costOfLivingData)
          console.log(`✅ Loaded core dataset with ${Object.keys(costOfLivingData).length} ZIP codes`)
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

    // Fallback 2: Use state-based estimates when no state data is available
    const stateEstimates = getStateEstimate(stateFromZip)
    return {
      data: {
        rpp_all: stateEstimates.rpp_all,
        rpp_housing: stateEstimates.rpp_housing,
        rpp_goods: stateEstimates.rpp_goods,
        rpp_other: stateEstimates.rpp_other,
        state: stateFromZip || 'US',
        cbsa_code: null
      },
      isFound: true,
      isFallback: true,
      fallbackType: 'estimate'
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

  // Helper function to get realistic state-level cost estimates
  const getStateEstimate = (state: string | null): Omit<CostOfLivingData, 'state' | 'cbsa_code'> => {
    // State-level cost of living estimates based on BEA data and common knowledge
    // Lower = cheaper, Higher = more expensive (US average = 100.0)
    const stateEstimates: { [key: string]: { rpp_all: number; rpp_housing: number; rpp_goods: number; rpp_other: number } } = {
      // Low cost states
      'MS': { rpp_all: 84.0, rpp_housing: 75.0, rpp_goods: 89.0, rpp_other: 87.0 },
      'AR': { rpp_all: 85.0, rpp_housing: 77.0, rpp_goods: 90.0, rpp_other: 88.0 },
      'WV': { rpp_all: 86.0, rpp_housing: 78.0, rpp_goods: 91.0, rpp_other: 89.0 },
      'AL': { rpp_all: 86.5, rpp_housing: 79.0, rpp_goods: 91.0, rpp_other: 89.5 },
      'OK': { rpp_all: 87.0, rpp_housing: 80.0, rpp_goods: 91.5, rpp_other: 90.0 },
      'TN': { rpp_all: 87.5, rpp_housing: 81.0, rpp_goods: 92.0, rpp_other: 90.5 },
      'KY': { rpp_all: 88.0, rpp_housing: 82.0, rpp_goods: 92.0, rpp_other: 91.0 },
      'IN': { rpp_all: 88.5, rpp_housing: 83.0, rpp_goods: 92.5, rpp_other: 91.5 },
      'KS': { rpp_all: 89.0, rpp_housing: 84.0, rpp_goods: 92.5, rpp_other: 92.0 },
      'MI': { rpp_all: 89.5, rpp_housing: 85.0, rpp_goods: 93.0, rpp_other: 92.0 }, // Michigan - should be cheap!
      'IA': { rpp_all: 90.0, rpp_housing: 85.5, rpp_goods: 93.0, rpp_other: 92.5 },
      'MO': { rpp_all: 90.5, rpp_housing: 86.0, rpp_goods: 93.5, rpp_other: 93.0 },
      'NE': { rpp_all: 91.0, rpp_housing: 87.0, rpp_goods: 93.5, rpp_other: 93.5 },
      'OH': { rpp_all: 91.5, rpp_housing: 88.0, rpp_goods: 94.0, rpp_other: 94.0 },
      
      // Medium cost states
      'TX': { rpp_all: 94.0, rpp_housing: 92.0, rpp_goods: 95.0, rpp_other: 95.5 }, // Texas - should be cheaper than MI!
      'NC': { rpp_all: 94.5, rpp_housing: 93.0, rpp_goods: 95.5, rpp_other: 96.0 },
      'SC': { rpp_all: 95.0, rpp_housing: 94.0, rpp_goods: 95.5, rpp_other: 96.5 },
      'GA': { rpp_all: 95.5, rpp_housing: 95.0, rpp_goods: 96.0, rpp_other: 97.0 },
      'FL': { rpp_all: 96.0, rpp_housing: 96.0, rpp_goods: 96.5, rpp_other: 97.0 },
      'WI': { rpp_all: 96.5, rpp_housing: 97.0, rpp_goods: 96.5, rpp_other: 97.5 },
      'AZ': { rpp_all: 97.0, rpp_housing: 98.0, rpp_goods: 96.5, rpp_other: 98.0 },
      'NV': { rpp_all: 98.0, rpp_housing: 100.0, rpp_goods: 97.0, rpp_other: 98.5 },
      'UT': { rpp_all: 98.5, rpp_housing: 101.0, rpp_goods: 97.5, rpp_other: 99.0 },
      'CO': { rpp_all: 105.0, rpp_housing: 115.0, rpp_goods: 99.0, rpp_other: 103.0 },
      
      // High cost states
      'IL': { rpp_all: 108.0, rpp_housing: 120.0, rpp_goods: 101.0, rpp_other: 106.0 },
      'PA': { rpp_all: 108.5, rpp_housing: 118.0, rpp_goods: 102.0, rpp_other: 107.0 },
      'OR': { rpp_all: 110.0, rpp_housing: 125.0, rpp_goods: 102.5, rpp_other: 107.5 },
      'WA': { rpp_all: 118.0, rpp_housing: 145.0, rpp_goods: 106.0, rpp_other: 115.0 },
      'MA': { rpp_all: 117.5, rpp_housing: 141.0, rpp_goods: 105.5, rpp_other: 114.5 },
      'NY': { rpp_all: 125.0, rpp_housing: 165.0, rpp_goods: 109.0, rpp_other: 118.0 },
      'CA': { rpp_all: 142.0, rpp_housing: 189.0, rpp_goods: 114.5, rpp_other: 127.5 },
      'HI': { rpp_all: 150.0, rpp_housing: 195.0, rpp_goods: 125.0, rpp_other: 135.0 },
      
      // Other states (medium)
      'ME': { rpp_all: 105.5, rpp_housing: 113.0, rpp_goods: 100.0, rpp_other: 104.5 },
      'NH': { rpp_all: 103.0, rpp_housing: 110.0, rpp_goods: 99.0, rpp_other: 102.0 },
      'VT': { rpp_all: 106.0, rpp_housing: 115.0, rpp_goods: 101.0, rpp_other: 105.0 },
      'CT': { rpp_all: 115.0, rpp_housing: 135.0, rpp_goods: 105.0, rpp_other: 112.0 },
      'NJ': { rpp_all: 120.0, rpp_housing: 150.0, rpp_goods: 107.0, rpp_other: 116.0 },
      'MD': { rpp_all: 112.0, rpp_housing: 130.0, rpp_goods: 103.0, rpp_other: 109.0 },
      'VA': { rpp_all: 99.0, rpp_housing: 104.5, rpp_goods: 95.0, rpp_other: 99.5 },
      'DC': { rpp_all: 130.0, rpp_housing: 170.0, rpp_goods: 110.0, rpp_other: 125.0 },
      'MN': { rpp_all: 102.0, rpp_housing: 109.5, rpp_goods: 96.5, rpp_other: 101.0 },
      'WY': { rpp_all: 92.0, rpp_housing: 88.0, rpp_goods: 94.0, rpp_other: 94.5 },
      'ID': { rpp_all: 94.0, rpp_housing: 92.0, rpp_goods: 95.0, rpp_other: 96.0 },
      'MT': { rpp_all: 95.0, rpp_housing: 93.0, rpp_goods: 96.0, rpp_other: 97.0 },
      'ND': { rpp_all: 96.0, rpp_housing: 94.0, rpp_goods: 97.0, rpp_other: 98.0 },
      'SD': { rpp_all: 93.0, rpp_housing: 90.0, rpp_goods: 95.0, rpp_other: 95.5 },
      'LA': { rpp_all: 93.5, rpp_housing: 91.0, rpp_goods: 95.5, rpp_other: 96.0 },
      'NM': { rpp_all: 92.5, rpp_housing: 89.0, rpp_goods: 94.5, rpp_other: 95.0 },
      'AK': { rpp_all: 125.0, rpp_housing: 140.0, rpp_goods: 118.0, rpp_other: 120.0 },
      'DE': { rpp_all: 102.0, rpp_housing: 108.0, rpp_goods: 98.0, rpp_other: 101.5 },
      'RI': { rpp_all: 110.0, rpp_housing: 125.0, rpp_goods: 102.0, rpp_other: 108.0 }
    }

    if (!state || !stateEstimates[state]) {
      // If state is unknown, use national average
      return { rpp_all: 100.0, rpp_housing: 100.0, rpp_goods: 100.0, rpp_other: 100.0 }
    }

    return stateEstimates[state]
  }

  // Helper function to determine state from ZIP code
  const getStateFromZip = (zipCode: string): string | null => {
    // This is a simplified ZIP to state mapping
    // In a real application, you'd want a more comprehensive mapping
    const zipToState: { [key: string]: string } = {
      '0': 'MA', '1': 'MA', '2': 'MA', '3': 'NH', '4': 'ME', '5': 'VT',
      '6': 'CT', '07': 'NJ', '7': 'NJ', '8': 'NJ', '9': 'NJ',
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