import type { RetirementAssumptions } from '../utils/calculations'

interface AssumptionsInputProps {
  assumptions: RetirementAssumptions
  onChange: (assumptions: RetirementAssumptions) => void
  className?: string
}

export function AssumptionsInput({ assumptions, onChange, className = "" }: AssumptionsInputProps) {
  
  const handleChange = (field: keyof RetirementAssumptions, value: number) => {
    onChange({
      ...assumptions,
      [field]: value
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
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
              value={assumptions.withdrawalRate * 100}
              onChange={(e) => handleChange('withdrawalRate', parseFloat(e.target.value) / 100 || 0.04)}
              className="input-field pr-8"
              step="0.1"
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
              value={assumptions.inflationRate * 100}
              onChange={(e) => handleChange('inflationRate', parseFloat(e.target.value) / 100 || 0.025)}
              className="input-field pr-8"
              step="0.1"
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
              value={assumptions.expectedReturn * 100}
              onChange={(e) => handleChange('expectedReturn', parseFloat(e.target.value) / 100 || 0.07)}
              className="input-field pr-8"
              step="0.1"
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
          onClick={() => onChange({ withdrawalRate: 0.04, inflationRate: 0.025, expectedReturn: 0.07 })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Conservative (4%, 2.5%, 7%)
        </button>
        <button
          onClick={() => onChange({ withdrawalRate: 0.035, inflationRate: 0.03, expectedReturn: 0.08 })}
          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
        >
          Moderate (3.5%, 3%, 8%)
        </button>
        <button
          onClick={() => onChange({ withdrawalRate: 0.03, inflationRate: 0.025, expectedReturn: 0.09 })}
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