import type { SavingsCalculation } from '../utils/calculations'
import { formatCurrency } from '../utils/calculations'

interface SavingsPlanResultsProps {
  currentLocationSavings: SavingsCalculation
  targetLocationSavings: SavingsCalculation
  monthlyDifference: number
  annualDifference: number
  className?: string
}

export function SavingsPlanResults({
  currentLocationSavings,
  targetLocationSavings,
  monthlyDifference,
  annualDifference,
  className = ""
}: SavingsPlanResultsProps) {
  
  const isDifferencePositive = monthlyDifference > 0
  const absoluteMonthlyDiff = Math.abs(monthlyDifference)
  const absoluteAnnualDiff = Math.abs(annualDifference)

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-xl font-semibold text-dark mb-3">
          Required Monthly Savings
        </h3>
        <p className="text-sm text-dark/70 mb-4">
          How much you need to save each month to reach your retirement goal, accounting for your current savings and expected investment return.
        </p>
      </div>

      {/* Current vs Target Savings Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Location Savings */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-dark">Current Location</h4>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark/70">Monthly:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(currentLocationSavings.monthlySavingsNeeded)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark/70">Annually:</span>
              <span className="font-medium">
                {formatCurrency(currentLocationSavings.annualSavingsNeeded)}
              </span>
            </div>
          </div>
        </div>

        {/* Target Location Savings */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-dark">Target Location</h4>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark/70">Monthly:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(targetLocationSavings.monthlySavingsNeeded)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-dark/70">Annually:</span>
              <span className="font-medium">
                {formatCurrency(targetLocationSavings.annualSavingsNeeded)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Savings Difference Summary */}
      <div className={`rounded-lg p-4 border-2 ${
        isDifferencePositive 
          ? 'bg-red-50 border-red-200' 
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-semibold ${
            isDifferencePositive ? 'text-red-800' : 'text-green-800'
          }`}>
            Savings Difference
          </h4>
          <div className={`flex items-center text-sm ${
            isDifferencePositive ? 'text-red-700' : 'text-green-700'
          }`}>
            {isDifferencePositive ? (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {isDifferencePositive ? 'Higher' : 'Lower'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-dark/70">Monthly difference:</span>
            <div className={`font-semibold text-lg ${
              isDifferencePositive ? 'text-red-800' : 'text-green-800'
            }`}>
              {isDifferencePositive ? '+' : '-'}{formatCurrency(absoluteMonthlyDiff)}
            </div>
          </div>
          <div>
            <span className="text-sm text-dark/70">Annual difference:</span>
            <div className={`font-medium ${
              isDifferencePositive ? 'text-red-700' : 'text-green-700'
            }`}>
              {isDifferencePositive ? '+' : '-'}{formatCurrency(absoluteAnnualDiff)}
            </div>
          </div>
        </div>

        <div className={`mt-3 text-sm ${
          isDifferencePositive ? 'text-red-700' : 'text-green-700'
        }`}>
          {isDifferencePositive ? (
            <>
              Moving to your target location will require <strong>{formatCurrency(absoluteMonthlyDiff)}</strong> more 
              per month in retirement savings to maintain the same lifestyle.
            </>
          ) : (
            <>
              Moving to your target location will save you <strong>{formatCurrency(absoluteMonthlyDiff)}</strong> per month 
              in retirement savings while maintaining the same lifestyle.
            </>
          )}
        </div>
      </div>

      {/* Investment Growth Breakdown */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">Investment Growth Projection</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="font-medium text-blue-800">Current Location</div>
            <div className="flex justify-between">
              <span className="text-blue-700">Total contributions:</span>
              <span className="font-medium">{formatCurrency(currentLocationSavings.totalContributions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Investment growth:</span>
              <span className="font-medium">{formatCurrency(currentLocationSavings.investmentGrowth)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="font-medium text-blue-800">Final nest egg:</span>
              <span className="font-semibold">{formatCurrency(currentLocationSavings.requiredNestEgg)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-blue-800">Target Location</div>
            <div className="flex justify-between">
              <span className="text-blue-700">Total contributions:</span>
              <span className="font-medium">{formatCurrency(targetLocationSavings.totalContributions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Investment growth:</span>
              <span className="font-medium">{formatCurrency(targetLocationSavings.investmentGrowth)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-200 pt-2">
              <span className="font-medium text-blue-800">Final nest egg:</span>
              <span className="font-semibold">{formatCurrency(targetLocationSavings.requiredNestEgg)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}