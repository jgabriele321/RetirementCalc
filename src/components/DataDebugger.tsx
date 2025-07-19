import { useCostOfLiving } from '../hooks/useCostOfLiving'

interface DataDebuggerProps {
  zipCode1: string
  zipCode2: string
}

export function DataDebugger({ zipCode1, zipCode2 }: DataDebuggerProps) {
  const { lookupZip, getStateData } = useCostOfLiving()

  if (!zipCode1 || !zipCode2) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <h4 className="font-medium text-yellow-800 mb-2">Data Debugger</h4>
        <p className="text-yellow-700">Enter both ZIP codes to see data debugging information</p>
      </div>
    )
  }

  const result1 = lookupZip(zipCode1)
  const result2 = lookupZip(zipCode2)

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm space-y-4">
      <h4 className="font-medium text-yellow-800">Data Quality Debug Info</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ZIP Code 1 */}
        <div className="bg-white rounded p-3">
          <h5 className="font-medium text-gray-800 mb-2">{zipCode1}</h5>
          {result1.data && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>State:</span>
                <span className="font-medium">{result1.data.state}</span>
              </div>
              <div className="flex justify-between">
                <span>RPP All:</span>
                <span className="font-medium">{result1.data.rpp_all.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Type:</span>
                <span className={`font-medium ${
                  result1.isFallback ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {result1.isFallback ? `Fallback (${result1.fallbackType || 'state avg'})` : 'Direct'}
                </span>
              </div>
              {result1.isFallback && (
                <>
                  <div className="text-orange-600 text-xs mt-2 p-2 bg-orange-50 rounded">
                    <strong>⚠️ Using fallback data!</strong><br />
                    This ZIP code isn't in our database. 
                    {result1.fallbackType === 'state' ? 
                      ` Using average for ${result1.data.state} state.` : 
                      ' Using national average (100.0).'
                    }
                  </div>
                  {result1.data.state && (
                    <div className="text-xs text-gray-600 mt-1">
                      <strong>{result1.data.state} ZIP codes in database:</strong> {getStateData(result1.data.state).length}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ZIP Code 2 */}
        <div className="bg-white rounded p-3">
          <h5 className="font-medium text-gray-800 mb-2">{zipCode2}</h5>
          {result2.data && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>State:</span>
                <span className="font-medium">{result2.data.state}</span>
              </div>
              <div className="flex justify-between">
                <span>RPP All:</span>
                <span className="font-medium">{result2.data.rpp_all.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span>Data Type:</span>
                <span className={`font-medium ${
                  result2.isFallback ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {result2.isFallback ? `Fallback (${result2.fallbackType || 'state avg'})` : 'Direct'}
                </span>
              </div>
              {result2.isFallback && (
                <>
                  <div className="text-orange-600 text-xs mt-2 p-2 bg-orange-50 rounded">
                    <strong>⚠️ Using fallback data!</strong><br />
                    This ZIP code isn't in our database. 
                    {result2.fallbackType === 'state' ? 
                      ` Using average for ${result2.data.state} state.` : 
                      ' Using national average (100.0).'
                    }
                  </div>
                  {result2.data.state && (
                    <div className="text-xs text-gray-600 mt-1">
                      <strong>{result2.data.state} ZIP codes in database:</strong> {getStateData(result2.data.state).length}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Analysis */}
      {result1.data && result2.data && (
        <div className="bg-white rounded p-3">
          <h5 className="font-medium text-gray-800 mb-2">Cost Comparison Analysis</h5>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>RPP Difference:</span>
              <span className="font-medium">
                {(result2.data.rpp_all - result1.data.rpp_all).toFixed(1)} points
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cost Ratio:</span>
              <span className="font-medium">
                {(result2.data.rpp_all / result1.data.rpp_all).toFixed(3)}x
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sanity Check:</span>
              <span className={`font-medium ${
                (result1.isFallback || result2.isFallback) ? 'text-orange-600' : 'text-green-600'
              }`}>
                {(result1.isFallback || result2.isFallback) ? 
                  '⚠️ Unreliable (using fallback data)' : 
                  '✅ Reliable (direct data)'
                }
              </span>
            </div>
          </div>

          {/* Known Issues */}
          {(result1.isFallback || result2.isFallback) && (
            <div className="mt-3 p-2 bg-red-50 rounded text-xs">
              <strong className="text-red-800">Known Data Issues:</strong>
              <ul className="text-red-700 mt-1 space-y-1 list-disc list-inside">
                {result1.isFallback && result1.data.state && getStateData(result1.data.state).length === 0 && (
                  <li>No {result1.data.state} ZIP codes in database - using national average (100.0)</li>
                )}
                {result2.isFallback && result2.data.state && getStateData(result2.data.state).length === 0 && (
                  <li>No {result2.data.state} ZIP codes in database - using national average (100.0)</li>
                )}
                {(result1.isFallback || result2.isFallback) && (
                  <li>Sample dataset only contains 80 ZIP codes - results may not reflect reality</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}