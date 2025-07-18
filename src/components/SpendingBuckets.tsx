import { BucketInput } from './BucketInput'
import type { SpendingBuckets as SpendingBucketsType } from '../utils/calculations'

interface SpendingBucketsProps {
  values: SpendingBucketsType
  onChange: (values: SpendingBucketsType) => void
  className?: string
}

export function SpendingBuckets({ values, onChange, className = "" }: SpendingBucketsProps) {
  const handleBucketChange = (bucket: keyof SpendingBucketsType) => (value: number) => {
    onChange({
      ...values,
      [bucket]: value
    })
  }

  const totalSpending = Object.values(values).reduce((sum, value) => sum + value, 0)

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-dark">Monthly Spending</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <BucketInput
            label="Housing & Utilities"
            value={values.housing}
            onChange={handleBucketChange('housing')}
            placeholder="2,000"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
            description="Rent/mortgage, utilities, property taxes, insurance"
          />
          
          <BucketInput
            label="Food & Groceries"
            value={values.groceries}
            onChange={handleBucketChange('groceries')}
            placeholder="600"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6.5-5H9" />
              </svg>
            }
            description="Groceries, dining out, beverages"
          />
          
          <BucketInput
            label="Healthcare"
            value={values.health}
            onChange={handleBucketChange('health')}
            placeholder="400"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            description="Insurance, prescriptions, medical expenses"
          />
          
          <BucketInput
            label="Other Expenses"
            value={values.other}
            onChange={handleBucketChange('other')}
            placeholder="800"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
            description="Transportation, entertainment, personal care, misc"
          />
        </div>
      </div>
      
      {/* Total Summary */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <div className="text-lg font-semibold text-dark">
            Total Monthly Spending
          </div>
          <div className="text-xl font-bold text-dark">
            ${totalSpending.toLocaleString()}
          </div>
        </div>
        <div className="text-sm text-dark/60 mt-1">
          ${(totalSpending * 12).toLocaleString()} per year
        </div>
      </div>
    </div>
  )
}