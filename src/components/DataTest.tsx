import { useCostOfLiving } from '../hooks/useCostOfLiving'
import { calculateRetirementScenario, formatCurrency } from '../utils/calculations'

export function DataTest() {
  const { data, isLoading, error, lookupZip } = useCostOfLiving()

  if (isLoading) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-dark mb-4">Loading Data...</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-dark mb-4">Data Error</h3>
        <div className="text-red-600">
          {error}
        </div>
      </div>
    )
  }

  // Test data lookup
  const nyResult = lookupZip('10001')
  const caResult = lookupZip('90210')

  // Test calculation
  let calculationResult = null
  if (nyResult.data && caResult.data) {
    calculationResult = calculateRetirementScenario(
      {
        currentZip: '10001',
        targetZip: '90210',
        retirementYears: 10,
        monthlySpending: {
          housing: 2000,
          groceries: 800,
          health: 500,
          other: 1200
        },
        assumptions: {
          withdrawalRate: 0.04,
          inflationRate: 0.025
        }
      },
      nyResult.data,
      caResult.data
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Status */}
      <div className="card">
        <h3 className="text-xl font-semibold text-dark mb-4">Data Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>ZIP Codes Loaded:</span>
            <span className="font-mono font-semibold">{data ? Object.keys(data).length : 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="text-green-600 font-semibold">✅ Ready</span>
          </div>
        </div>
      </div>

      {/* ZIP Lookup Test */}
      <div className="card">
        <h3 className="text-xl font-semibold text-dark mb-4">ZIP Code Lookups</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">New York (10001):</h4>
            {nyResult.data ? (
              <div className="text-sm bg-gray-50 p-3 rounded">
                <div>State: {nyResult.data.state}</div>
                <div>All Items RPP: {nyResult.data.rpp_all}</div>
                <div>Housing RPP: {nyResult.data.rpp_housing}</div>
                <div>Fallback: {nyResult.isFallback ? 'Yes' : 'No'}</div>
              </div>
            ) : (
              <div className="text-red-600">Not found</div>
            )}
          </div>

          <div>
            <h4 className="font-semibold">Beverly Hills (90210):</h4>
            {caResult.data ? (
              <div className="text-sm bg-gray-50 p-3 rounded">
                <div>State: {caResult.data.state}</div>
                <div>All Items RPP: {caResult.data.rpp_all}</div>
                <div>Housing RPP: {caResult.data.rpp_housing}</div>
                <div>Fallback: {caResult.isFallback ? 'Yes' : 'No'}</div>
              </div>
            ) : (
              <div className="text-red-600">Not found</div>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Test */}
      {calculationResult && (
        <div className="card">
          <h3 className="text-xl font-semibold text-dark mb-4">Retirement Calculation Test</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">New York (10001)</h4>
              <div className="text-sm space-y-1">
                <div>Annual Spending: {formatCurrency(calculationResult.currentLocation.annualSpending)}</div>
                <div>Inflated (10yr): {formatCurrency(calculationResult.currentLocation.inflatedAnnualSpending)}</div>
                <div>Nest Egg Needed: {formatCurrency(calculationResult.currentLocation.requiredNestEgg)}</div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Beverly Hills (90210)</h4>
              <div className="text-sm space-y-1">
                <div>Annual Spending: {formatCurrency(calculationResult.targetLocation.annualSpending)}</div>
                <div>Inflated (10yr): {formatCurrency(calculationResult.targetLocation.inflatedAnnualSpending)}</div>
                <div>Nest Egg Needed: {formatCurrency(calculationResult.targetLocation.requiredNestEgg)}</div>
                <div>COL Ratio: {calculationResult.targetLocation.costOfLivingRatio.toFixed(2)}x</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Comparison</h4>
            <div className="text-sm space-y-1">
              <div>Nest Egg Difference: {formatCurrency(calculationResult.comparison.nestEggDifference)}</div>
              <div>Percentage Difference: {calculationResult.comparison.percentageDifference.toFixed(1)}%</div>
              <div className={calculationResult.comparison.isCheaper ? 'text-green-600' : 'text-red-600'}>
                {calculationResult.comparison.isCheaper ? '✅ Target is cheaper' : '❌ Target is more expensive'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}