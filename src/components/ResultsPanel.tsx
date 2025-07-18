import { useMemo } from 'react'
import { useCostOfLiving } from '../hooks/useCostOfLiving'
import { calculateRetirementScenario, formatCurrency, formatPercentage } from '../utils/calculations'
import type { SpendingBuckets, RetirementAssumptions } from '../utils/calculations'

interface ResultsPanelProps {
  currentZip: string
  targetZip: string
  retirementYears: number
  monthlySpending: SpendingBuckets
  assumptions: RetirementAssumptions
  className?: string
}

export function ResultsPanel({
  currentZip,
  targetZip,
  retirementYears,
  monthlySpending,
  assumptions,
  className = ""
}: ResultsPanelProps) {
  const { lookupZip, isLoading } = useCostOfLiving()

  // Calculate results
  const calculationResult = useMemo(() => {
    if (!currentZip || !targetZip) return null

    const currentResult = lookupZip(currentZip)
    const targetResult = lookupZip(targetZip)

    if (!currentResult.data || !targetResult.data) return null

    return calculateRetirementScenario(
      {
        currentZip,
        targetZip,
        retirementYears,
        monthlySpending,
        assumptions
      },
      currentResult.data,
      targetResult.data
    )
  }, [currentZip, targetZip, retirementYears, monthlySpending, assumptions, lookupZip])

  if (isLoading) {
    return (
      <div className={`card ${className}`}>
        <h3 className="text-2xl font-semibold text-dark mb-6">
          Retirement Comparison
        </h3>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!calculationResult) {
    return (
      <div className={`card ${className}`}>
        <h3 className="text-2xl font-semibold text-dark mb-6">
          Retirement Comparison
        </h3>
        <div className="text-center py-12 text-dark/60">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg font-medium mb-2">Ready to Compare</div>
          <div className="text-sm">
            Enter your current and target ZIP codes to see the cost-of-living comparison
          </div>
        </div>
      </div>
    )
  }

  const { currentLocation, targetLocation, comparison } = calculationResult

  return (
    <div className={`card space-y-6 ${className}`}>
      <h3 className="text-2xl font-semibold text-dark mb-6">
        Retirement Comparison
      </h3>

      {/* Location Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Location */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-800">Current Location</h4>
            <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {currentZip} • {currentLocation.rppData.state}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Cost of Living Index:</span>
              <span className="font-medium text-blue-900">
                {currentLocation.rppData.rpp_all.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Annual Spending:</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(currentLocation.annualSpending)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">At Retirement ({retirementYears}yr):</span>
              <span className="font-medium text-blue-900">
                {formatCurrency(currentLocation.inflatedAnnualSpending)}
              </span>
            </div>
            <div className="border-t border-blue-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-blue-700 font-medium">Nest Egg Needed:</span>
                <span className="font-bold text-blue-900">
                  {formatCurrency(currentLocation.requiredNestEgg)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Target Location */}
        <div className={`border rounded-lg p-4 ${
          comparison.isCheaper 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className={`font-semibold ${
              comparison.isCheaper ? 'text-green-800' : 'text-red-800'
            }`}>
              Target Location
            </h4>
            <div className={`text-xs px-2 py-1 rounded ${
              comparison.isCheaper 
                ? 'text-green-600 bg-green-100' 
                : 'text-red-600 bg-red-100'
            }`}>
              {targetZip} • {targetLocation.rppData.state}
            </div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={comparison.isCheaper ? 'text-green-700' : 'text-red-700'}>
                Cost of Living Index:
              </span>
              <span className={`font-medium ${
                comparison.isCheaper ? 'text-green-900' : 'text-red-900'
              }`}>
                {targetLocation.rppData.rpp_all.toFixed(1)} 
                <span className="ml-1 text-xs">
                  ({targetLocation.costOfLivingRatio.toFixed(2)}x)
                </span>
              </span>
            </div>
            <div className="flex justify-between">
              <span className={comparison.isCheaper ? 'text-green-700' : 'text-red-700'}>
                Annual Spending:
              </span>
              <span className={`font-medium ${
                comparison.isCheaper ? 'text-green-900' : 'text-red-900'
              }`}>
                {formatCurrency(targetLocation.annualSpending)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className={comparison.isCheaper ? 'text-green-700' : 'text-red-700'}>
                At Retirement ({retirementYears}yr):
              </span>
              <span className={`font-medium ${
                comparison.isCheaper ? 'text-green-900' : 'text-red-900'
              }`}>
                {formatCurrency(targetLocation.inflatedAnnualSpending)}
              </span>
            </div>
            <div className={`border-t pt-2 mt-2 ${
              comparison.isCheaper ? 'border-green-200' : 'border-red-200'
            }`}>
              <div className="flex justify-between">
                <span className={`font-medium ${
                  comparison.isCheaper ? 'text-green-700' : 'text-red-700'
                }`}>
                  Nest Egg Needed:
                </span>
                <span className={`font-bold ${
                  comparison.isCheaper ? 'text-green-900' : 'text-red-900'
                }`}>
                  {formatCurrency(targetLocation.requiredNestEgg)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-dark mb-4 text-center">
          Bottom Line Comparison
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-dark mb-1">
              {formatCurrency(Math.abs(comparison.nestEggDifference), true)}
            </div>
            <div className="text-sm text-dark/60">
              {comparison.isCheaper ? 'Less' : 'More'} needed
            </div>
          </div>
          
          <div>
            <div className={`text-2xl font-bold mb-1 ${
              comparison.isCheaper ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatPercentage(Math.abs(comparison.percentageDifference))}
            </div>
            <div className="text-sm text-dark/60">
              {comparison.isCheaper ? 'Cheaper' : 'More expensive'}
            </div>
          </div>
          
          <div>
            <div className={`text-2xl mb-1 ${
              comparison.isCheaper ? 'text-green-600' : 'text-red-600'
            }`}>
              {comparison.isCheaper ? '✅' : '❌'}
            </div>
            <div className="text-sm text-dark/60">
              {comparison.isCheaper ? 'Better deal' : 'Costs more'}
            </div>
          </div>
        </div>

        {/* Key insight */}
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          comparison.isCheaper 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <strong>
            {comparison.isCheaper 
              ? `Moving to ${targetZip} could save you ${formatCurrency(Math.abs(comparison.nestEggDifference))} in retirement needs.`
              : `Moving to ${targetZip} would require ${formatCurrency(Math.abs(comparison.nestEggDifference))} more for retirement.`
            }
          </strong>
        </div>
      </div>

      {/* Methodology note */}
      <div className="text-xs text-dark/50 bg-gray-50 p-3 rounded">
        <strong>Methodology:</strong> Calculations use Regional Price Parities (BEA) data, 
        {assumptions.withdrawalRate * 100}% withdrawal rate, and {assumptions.inflationRate * 100}% annual inflation. 
        Results are estimates for planning purposes only.
      </div>
    </div>
  )
}