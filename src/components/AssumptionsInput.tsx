import type { RetirementAssumptions } from '../utils/calculations'

interface AssumptionsInputProps {
  assumptions: RetirementAssumptions
  onChange: (assumptions: RetirementAssumptions) => void
  retirementYears?: number
  className?: string
}

export function AssumptionsInput({ assumptions, onChange, retirementYears = 15, className = "" }: AssumptionsInputProps) {
  
  const handleChange = (field: keyof RetirementAssumptions, value: number) => {
    // Round to 2 decimal places for percentage fields
    if (field === 'withdrawalRate' || field === 'inflationRate' || field === 'expectedReturn') {
      value = Math.round(value * 10000) / 10000 // Round to 4 decimal places (2 decimal places when displayed as percentage)
    }
    onChange({
      ...assumptions,
      [field]: value
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Current Savings - Prominent Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-dark mb-3">Current Retirement Savings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-dark/70 mb-2">
              Already Saved for Retirement
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-dark/40 text-lg">$</span>
              </div>
              <input
                type="number"
                value={assumptions.currentSavings}
                onChange={(e) => handleChange('currentSavings', parseFloat(e.target.value) || 0)}
                className="input-field pl-8 text-lg font-medium"
                step="5000"
                min="0"
                max="10000000"
                placeholder="0"
              />
            </div>
            <div className="text-xs text-dark/60 mt-1">
              Include 401(k), IRA, savings, investments, etc.
            </div>
            
            {/* Quick amount buttons */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-dark/60 mr-1">Quick amounts:</span>
              {[0, 10000, 25000, 50000, 100000, 250000].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleChange('currentSavings', amount)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    assumptions.currentSavings === amount 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  ${amount === 0 ? '0' : `${amount / 1000}K`}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-green-700">
            {assumptions.currentSavings > 0 ? (
              <div className="bg-white rounded p-3">
                <div className="font-medium">Great start! 🎉</div>
                <div className="text-xs text-green-600 mt-1">
                  Your existing savings will grow to approximately <strong>${(assumptions.currentSavings * Math.pow(assumptions.expectedReturn, retirementYears)).toLocaleString()}</strong> in {retirementYears} years 
                  (assuming {(assumptions.expectedReturn * 100).toFixed(1)}% returns), reducing how much you need to save monthly.
                </div>
              </div>
            ) : (
              <div className="text-green-600 text-xs">
                💡 <strong>Tip:</strong> Even if you haven't started saving yet, it's never too late! 
                Any amount you already have will significantly reduce your monthly savings requirements.
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-dark">Financial Assumptions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Withdrawal Rate */}
        <div>
          <label className="block text-sm font-medium text-dark/70 mb-2">
            Withdrawal Rate
          </label>
          <div className="relative">
            <input
              type="number"
              value={(assumptions.withdrawalRate * 100).toFixed(2)}
              onChange={(e) => handleChange('withdrawalRate', parseFloat(e.target.value) / 100 || 0.04)}
              className="input-field pr-8"
              step="0.01"
              min="1.0"
              max="15.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-dark/40 text-sm">%</span>
            </div>
          </div>
          <div className="text-xs text-dark/50 mt-1">
            Annual withdrawal from retirement savings (4% rule)
          </div>
        </div>

        {/* Inflation Rate */}
        <div>
          <label className="block text-sm font-medium text-dark/70 mb-2">
            Inflation Rate
          </label>
          <div className="relative">
            <input
              type="number"
              value={(assumptions.inflationRate * 100).toFixed(2)}
              onChange={(e) => handleChange('inflationRate', parseFloat(e.target.value) / 100 || 0.025)}
              className="input-field pr-8"
              step="0.01"
              min="0.0"
              max="10.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-dark/40 text-sm">%</span>
            </div>
          </div>
          <div className="text-xs text-dark/50 mt-1">
            Annual inflation rate (historical avg ~2.5%)
          </div>
        </div>

        {/* Expected Return */}
        <div>
          <label className="block text-sm font-medium text-dark/70 mb-2">
            Expected Return
          </label>
          <div className="relative">
            <input
              type="number"
              value={(assumptions.expectedReturn * 100).toFixed(2)}
              onChange={(e) => handleChange('expectedReturn', parseFloat(e.target.value) / 100 || 0.07)}
              className="input-field pr-8"
              step="0.01"
              min="1.0"
              max="15.0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-dark/40 text-sm">%</span>
            </div>
          </div>
          <div className="text-xs text-dark/50 mt-1">
            Expected annual return on investments (S&P 500 avg ~7%)
          </div>
        </div>
      </div>

      {/* Quick preset buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-dark/60 mr-2">Quick presets:</span>
        <button
          onClick={() => onChange({ withdrawalRate: 0.04, inflationRate: 0.025, expectedReturn: 0.07, currentSavings: assumptions.currentSavings })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Conservative (4%, 2.5%, 7%)
        </button>
        <button
          onClick={() => onChange({ withdrawalRate: 0.035, inflationRate: 0.03, expectedReturn: 0.08, currentSavings: assumptions.currentSavings })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Moderate (3.5%, 3%, 8%)
        </button>
        <button
          onClick={() => onChange({ withdrawalRate: 0.03, inflationRate: 0.025, expectedReturn: 0.09, currentSavings: assumptions.currentSavings })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Aggressive (3%, 2.5%, 9%)
        </button>
      </div>

      {/* Real return calculation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">Real Return (after inflation)</div>
          <div className="text-blue-600">
            {assumptions.expectedReturn > assumptions.inflationRate 
              ? `≈ ${((assumptions.expectedReturn - assumptions.inflationRate) * 100).toFixed(1)}% annually`
              : `Warning: Expected return is below inflation rate!`
            }
          </div>
          <div className="text-xs text-blue-600 mt-1">
            This is your actual purchasing power growth after accounting for inflation.
          </div>
        </div>
      </div>
    </div>
  )
}