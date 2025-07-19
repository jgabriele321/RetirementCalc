import { useState } from 'react'
import { ZipAutocomplete } from './ZipAutocomplete'
import { SpendingBuckets } from './SpendingBuckets'
import { RetirementSlider } from './RetirementSlider'
import { AssumptionsInput } from './AssumptionsInput'
import type { SpendingBuckets as SpendingBucketsType, RetirementAssumptions } from '../utils/calculations'

interface InputCardProps {
  onDataChange: (data: {
    currentZip: string
    targetZip: string
    retirementYears: number
    monthlySpending: SpendingBucketsType
    assumptions: RetirementAssumptions
  }) => void
  className?: string
}

export function InputCard({ onDataChange, className = "" }: InputCardProps) {
  const [currentZip, setCurrentZip] = useState("")
  const [targetZip, setTargetZip] = useState("")
  const [retirementYears, setRetirementYears] = useState(15)
  const [monthlySpending, setMonthlySpending] = useState<SpendingBucketsType>({
    housing: 2000,
    groceries: 600,
    health: 400,
    other: 800
  })
  const [assumptions, setAssumptions] = useState<RetirementAssumptions>({
    withdrawalRate: 0.04,
    inflationRate: 0.025,
    expectedReturn: 0.07,
    currentSavings: 0
  })

  // Update parent component when data changes
  const updateParent = (updates: Partial<{
    currentZip: string
    targetZip: string
    retirementYears: number
    monthlySpending: SpendingBucketsType
    assumptions: RetirementAssumptions
  }>) => {
    const newData = {
      currentZip: updates.currentZip ?? currentZip,
      targetZip: updates.targetZip ?? targetZip,
      retirementYears: updates.retirementYears ?? retirementYears,
      monthlySpending: updates.monthlySpending ?? monthlySpending,
      assumptions: updates.assumptions ?? assumptions
    }

    onDataChange(newData)
  }

  const handleCurrentZipChange = (zip: string) => {
    setCurrentZip(zip)
    updateParent({ currentZip: zip })
  }

  const handleTargetZipChange = (zip: string) => {
    setTargetZip(zip)
    updateParent({ targetZip: zip })
  }

  const handleRetirementYearsChange = (years: number) => {
    setRetirementYears(years)
    updateParent({ retirementYears: years })
  }

  const handleSpendingChange = (spending: SpendingBucketsType) => {
    setMonthlySpending(spending)
    updateParent({ monthlySpending: spending })
  }

  const handleAssumptionsChange = (newAssumptions: RetirementAssumptions) => {
    setAssumptions(newAssumptions)
    updateParent({ assumptions: newAssumptions })
  }

  return (
    <div className={`card space-y-8 ${className}`}>
      <div>
        <h3 className="text-2xl font-semibold text-dark mb-6">
          Your Retirement Scenario
        </h3>
        <p className="text-dark/70 text-sm">
          Enter your current and target locations, spending, and retirement timeline to see how cost-of-living differences affect your retirement needs.
        </p>
      </div>

      {/* ZIP Code Inputs */}
      <div className="space-y-6">
        <h4 className="text-lg font-medium text-dark">Locations</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ZipAutocomplete
            label="Current Location"
            value={currentZip}
            onChange={handleCurrentZipChange}
            placeholder="Enter current ZIP"
          />
          <ZipAutocomplete
            label="Target Location"
            value={targetZip}
            onChange={handleTargetZipChange}
            placeholder="Enter target ZIP"
          />
        </div>
      </div>

      {/* Retirement Timeline */}
      <div className="border-t border-gray-200 pt-8">
        <RetirementSlider
          value={retirementYears}
          onChange={handleRetirementYearsChange}
        />
      </div>

      {/* Spending Buckets */}
      <div className="border-t border-gray-200 pt-8">
        <SpendingBuckets
          values={monthlySpending}
          onChange={handleSpendingChange}
        />
      </div>

      {/* Financial Assumptions */}
      <div className="border-t border-gray-200 pt-8">
        <AssumptionsInput
          assumptions={assumptions}
          onChange={handleAssumptionsChange}
          retirementYears={retirementYears}
        />
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 pt-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-dark mb-2">Scenario Summary</h4>
          <div className="text-sm text-dark/70 space-y-1">
            <div className="flex justify-between">
              <span>Current ZIP:</span>
              <span className="font-medium">{currentZip || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>Target ZIP:</span>
              <span className="font-medium">{targetZip || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span>Years until retirement:</span>
              <span className="font-medium">{retirementYears}</span>
            </div>
            <div className="flex justify-between">
              <span>Monthly spending:</span>
              <span className="font-medium">
                ${Object.values(monthlySpending).reduce((a, b) => a + b, 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Current savings:</span>
              <span className="font-medium">
                ${assumptions.currentSavings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}