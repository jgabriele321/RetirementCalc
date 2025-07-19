import { useState, useEffect } from 'react'
import { InputCard } from './components/InputCard'
import { ResultsPanel } from './components/ResultsPanel'
import type { SpendingBuckets, RetirementAssumptions } from './utils/calculations'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [currentZip, setCurrentZip] = useState("")
  const [targetZip, setTargetZip] = useState("")
  const [retirementYears, setRetirementYears] = useState(15)
  const [monthlySpending, setMonthlySpending] = useState<SpendingBuckets>({
    housing: 2000,
    groceries: 600,
    health: 400,
    other: 800
  })
  const [assumptions, setAssumptions] = useState<RetirementAssumptions>({
    withdrawalRate: 0.04,
    inflationRate: 0.025,
    expectedReturn: 0.07
  })

  // Handle hash-based routing for settings modal
  useEffect(() => {
    const handleHashChange = () => {
      setShowSettings(window.location.hash === '#/settings')
    }
    
    // Check initial hash
    handleHashChange()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const toggleSettings = () => {
    if (showSettings) {
      window.location.hash = ''
    } else {
      window.location.hash = '#/settings'
    }
  }

  // Handle input data changes
  const handleInputDataChange = (data: {
    currentZip: string
    targetZip: string
    retirementYears: number
    monthlySpending: SpendingBuckets
    assumptions: RetirementAssumptions
  }) => {
    setCurrentZip(data.currentZip)
    setTargetZip(data.targetZip)
    setRetirementYears(data.retirementYears)
    setMonthlySpending(data.monthlySpending)
    setAssumptions(data.assumptions)
  }

  // Handle assumptions changes
  const handleAssumptionsChange = (newAssumptions: RetirementAssumptions) => {
    setAssumptions(newAssumptions)
  }

  return (
    <div className="min-h-screen bg-sand">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-dark rounded-lg flex items-center justify-center">
                <span className="text-sand font-bold text-lg">$</span>
              </div>
              <h1 className="text-xl font-bold text-dark">
                Retirement by ZIP
              </h1>
            </div>
            <button 
              onClick={toggleSettings}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Settings"
            >
              <svg className="w-6 h-6 text-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-dark mb-4">
              Compare Retirement Costs by Location
            </h2>
            <p className="text-lg text-dark/70 max-w-2xl mx-auto">
              Adjust your spending for cost-of-living differences across U.S. ZIP codes 
              to see how much you need to retire comfortably.
            </p>
          </div>

          {/* Main Layout - Mobile: Stacked, Desktop: Side-by-side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Input Card */}
            <InputCard onDataChange={handleInputDataChange} />

            {/* Results Panel */}
            <ResultsPanel
              currentZip={currentZip}
              targetZip={targetZip}
              retirementYears={retirementYears}
              monthlySpending={monthlySpending}
              assumptions={assumptions}
            />
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-black/50 transition-opacity"
              onClick={toggleSettings}
            />
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-semibold text-dark mb-4">
                    Settings
                  </h3>
                  <div className="mt-2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark/70 mb-2">
                        Withdrawal Rate
                      </label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={assumptions.withdrawalRate * 100}
                        onChange={(e) => handleAssumptionsChange({
                          ...assumptions,
                          withdrawalRate: parseFloat(e.target.value) / 100 || 0.04
                        })}
                        step="0.1"
                        min="0.1"
                        max="10.0"
                      />
                      <p className="text-sm text-dark/50 mt-1">
                        Annual withdrawal rate (% of retirement savings)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark/70 mb-2">
                        Inflation Rate
                      </label>
                      <input 
                        type="number" 
                        className="input-field" 
                        value={assumptions.inflationRate * 100}
                        onChange={(e) => handleAssumptionsChange({
                          ...assumptions,
                          inflationRate: parseFloat(e.target.value) / 100 || 0.025
                        })}
                        step="0.1"
                        min="0.1"
                        max="10.0"
                      />
                      <p className="text-sm text-dark/50 mt-1">
                        Annual inflation rate (% per year)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-primary ml-3"
                  onClick={toggleSettings}
                >
                  Save Settings
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={toggleSettings}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-dark/60">
            <p>
              <strong>Disclaimer:</strong> This tool is for educational purposes only and does not constitute financial advice.
            </p>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <a href="#" className="hover:text-dark transition-colors">Data Sources</a>
              <a href="#" className="hover:text-dark transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App