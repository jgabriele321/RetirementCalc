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
  expectedReturn: number // Annual expected return (e.g., 0.07 for 7%)
  currentSavings: number // Current retirement savings amount
}

export interface RetirementScenario {
  currentZip: string
  targetZip: string
  retirementYears: number
  monthlySpending: SpendingBuckets
  assumptions: RetirementAssumptions
}

export interface SavingsCalculation {
  requiredNestEgg: number
  monthlySavingsNeeded: number
  annualSavingsNeeded: number
  totalContributions: number
  investmentGrowth: number
}

export interface RetirementCalculationResult {
  currentLocation: {
    name: string
    annualSpending: number
    inflatedAnnualSpending: number
    requiredNestEgg: number
    rppData: CostOfLivingData
    savingsNeeded: SavingsCalculation
  }
  targetLocation: {
    name: string
    annualSpending: number
    inflatedAnnualSpending: number
    requiredNestEgg: number
    rppData: CostOfLivingData
    costOfLivingRatio: number
    savingsNeeded: SavingsCalculation
  }
  comparison: {
    annualDifference: number
    nestEggDifference: number
    percentageDifference: number
    isCheaper: boolean
    savingsDifference: {
      monthlyDifference: number
      annualDifference: number
    }
  }
}

export function calculateMonthlySavingsNeeded(
  targetAmount: number,
  years: number,
  annualReturn: number,
  currentSavings: number = 0
): SavingsCalculation {
  const monthlyReturn = annualReturn / 12
  const totalMonths = years * 12
  
  // Future value of current savings
  const futureValueCurrentSavings = currentSavings * Math.pow(1 + annualReturn, years)
  
  // Amount still needed after growth of current savings
  const stillNeeded = Math.max(0, targetAmount - futureValueCurrentSavings)
  
  // Monthly payment needed using future value of annuity formula
  // PMT = FV * r / ((1 + r)^n - 1)
  let monthlySavings = 0
  if (stillNeeded > 0 && monthlyReturn > 0) {
    monthlySavings = stillNeeded * monthlyReturn / (Math.pow(1 + monthlyReturn, totalMonths) - 1)
  } else if (stillNeeded > 0 && monthlyReturn === 0) {
    // If no return, just divide by number of months
    monthlySavings = stillNeeded / totalMonths
  }
  
  const annualSavings = monthlySavings * 12
  const totalContributions = annualSavings * years + currentSavings
  const investmentGrowth = targetAmount - totalContributions
  
  return {
    requiredNestEgg: targetAmount,
    monthlySavingsNeeded: monthlySavings,
    annualSavingsNeeded: annualSavings,
    totalContributions,
    investmentGrowth: Math.max(0, investmentGrowth)
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

  // Calculate savings needed for each scenario
  const currentSavingsNeeded = calculateMonthlySavingsNeeded(
    currentNestEgg,
    scenario.retirementYears,
    scenario.assumptions.expectedReturn,
    scenario.assumptions.currentSavings
  )

  const targetSavingsNeeded = calculateMonthlySavingsNeeded(
    targetNestEgg,
    scenario.retirementYears,
    scenario.assumptions.expectedReturn,
    scenario.assumptions.currentSavings
  )

  // Calculate differences
  const annualDifference = targetInflatedSpending - currentInflatedSpending
  const nestEggDifference = targetNestEgg - currentNestEgg
  const percentageDifference = ((targetNestEgg - currentNestEgg) / currentNestEgg) * 100

  const monthlyDifference = targetSavingsNeeded.monthlySavingsNeeded - currentSavingsNeeded.monthlySavingsNeeded
  const annualSavingsDifference = targetSavingsNeeded.annualSavingsNeeded - currentSavingsNeeded.annualSavingsNeeded

  return {
    currentLocation: {
      name: `Current Location (${scenario.currentZip})`,
      annualSpending: currentAnnualSpending,
      inflatedAnnualSpending: currentInflatedSpending,
      requiredNestEgg: currentNestEgg,
      rppData: currentLocationData,
      savingsNeeded: currentSavingsNeeded
    },
    targetLocation: {
      name: `Target Location (${scenario.targetZip})`,
      annualSpending: targetAnnualSpending,
      inflatedAnnualSpending: targetInflatedSpending,
      requiredNestEgg: targetNestEgg,
      rppData: targetLocationData,
      costOfLivingRatio,
      savingsNeeded: targetSavingsNeeded
    },
    comparison: {
      annualDifference,
      nestEggDifference,
      percentageDifference,
      isCheaper: targetNestEgg < currentNestEgg,
      savingsDifference: {
        monthlyDifference,
        annualDifference: annualSavingsDifference
      }
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