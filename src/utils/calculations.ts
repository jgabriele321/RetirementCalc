import type { CostOfLivingData } from '../types/costOfLiving'

export interface SpendingBuckets {
  housing: number
  groceries: number
  health: number
  other: number
}

export interface RetirementAssumptions {
  withdrawalRate: number
  inflationRate: number
}

export interface RetirementScenario {
  currentZip: string
  targetZip: string
  retirementYears: number
  monthlySpending: SpendingBuckets
  assumptions: RetirementAssumptions
}

export interface RetirementCalculationResult {
  currentLocation: {
    name: string
    annualSpending: number
    inflatedAnnualSpending: number
    requiredNestEgg: number
    rppData: CostOfLivingData
  }
  targetLocation: {
    name: string
    annualSpending: number
    inflatedAnnualSpending: number
    requiredNestEgg: number
    rppData: CostOfLivingData
    costOfLivingRatio: number
  }
  comparison: {
    annualDifference: number
    nestEggDifference: number
    percentageDifference: number
    isCheaper: boolean
  }
}

export function calculateRetirementScenario(
  scenario: RetirementScenario,
  currentLocationData: CostOfLivingData,
  targetLocationData: CostOfLivingData
): RetirementCalculationResult {
  
  // Calculate cost-of-living ratio
  const costOfLivingRatio = targetLocationData.rpp_all / currentLocationData.rpp_all

  // Current annual spending
  const currentAnnualSpending = (
    scenario.monthlySpending.housing +
    scenario.monthlySpending.groceries +
    scenario.monthlySpending.health +
    scenario.monthlySpending.other
  ) * 12

  // Adjust spending for target location
  const targetAnnualSpending = currentAnnualSpending * costOfLivingRatio

  // Apply inflation over retirement years
  const currentInflatedSpending = currentAnnualSpending * Math.pow(1 + scenario.assumptions.inflationRate, scenario.retirementYears)
  const targetInflatedSpending = targetAnnualSpending * Math.pow(1 + scenario.assumptions.inflationRate, scenario.retirementYears)

  // Calculate required nest egg (4% rule, etc.)
  const currentNestEgg = currentInflatedSpending / scenario.assumptions.withdrawalRate
  const targetNestEgg = targetInflatedSpending / scenario.assumptions.withdrawalRate

  // Calculate differences
  const annualDifference = targetInflatedSpending - currentInflatedSpending
  const nestEggDifference = targetNestEgg - currentNestEgg
  const percentageDifference = ((targetNestEgg - currentNestEgg) / currentNestEgg) * 100

  return {
    currentLocation: {
      name: `Current Location (${scenario.currentZip})`,
      annualSpending: currentAnnualSpending,
      inflatedAnnualSpending: currentInflatedSpending,
      requiredNestEgg: currentNestEgg,
      rppData: currentLocationData
    },
    targetLocation: {
      name: `Target Location (${scenario.targetZip})`,
      annualSpending: targetAnnualSpending,
      inflatedAnnualSpending: targetInflatedSpending,
      requiredNestEgg: targetNestEgg,
      rppData: targetLocationData,
      costOfLivingRatio
    },
    comparison: {
      annualDifference,
      nestEggDifference,
      percentageDifference,
      isCheaper: targetNestEgg < currentNestEgg
    }
  }
}

export function formatCurrency(amount: number, abbreviated: boolean = false): string {
  if (abbreviated && Math.abs(amount) >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (abbreviated && Math.abs(amount) >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatPercentage(percentage: number): string {
  const sign = percentage > 0 ? '+' : ''
  return `${sign}${percentage.toFixed(1)}%`
}

export function validateZipCode(zipCode: string): { isValid: boolean; formatted: string } {
  const cleaned = zipCode.replace(/\D/g, '')
  
  if (cleaned.length === 0) {
    return { isValid: false, formatted: '' }
  }
  
  if (cleaned.length === 5) {
    return { isValid: true, formatted: cleaned }
  }
  
  if (cleaned.length < 5) {
    return { isValid: false, formatted: cleaned.padStart(5, '0') }
  }
  
  // Take first 5 digits if longer
  return { isValid: true, formatted: cleaned.substring(0, 5) }
}