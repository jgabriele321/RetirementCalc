interface RetirementSliderProps {
  value: number
  onChange: (years: number) => void
  min?: number
  max?: number
  className?: string
}

export function RetirementSlider({ 
  value, 
  onChange, 
  min = 0, 
  max = 50,
  className = "" 
}: RetirementSliderProps) {
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10)
    onChange(newValue)
  }

  const getTimelineText = (years: number): string => {
    if (years === 0) return "Retire now"
    if (years === 1) return "1 year until retirement"
    return `${years} years until retirement`
  }

  const getRetiringAge = (years: number): string => {
    // Assume current average age is around 35-40
    const currentAge = 35
    const retiringAge = currentAge + years
    return retiringAge <= 65 ? "Early retirement" : retiringAge <= 70 ? "Standard retirement" : "Late retirement"
  }

  // Calculate percentage for slider styling
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-dark">Retirement Timeline</h3>
        <div className="text-sm text-dark/60">
          {getRetiringAge(value)}
        </div>
      </div>
      
      <div className="space-y-3">
        {/* Main value display */}
        <div className="text-center">
          <div className="text-3xl font-bold text-dark">
            {getTimelineText(value)}
          </div>
          {value > 0 && (
            <div className="text-sm text-dark/60 mt-1">
              Allowing for {value} year{value !== 1 ? 's' : ''} of inflation and growth
            </div>
          )}
        </div>

        {/* Slider */}
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={handleSliderChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #0D1B2A 0%, #0D1B2A ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
            }}
          />
          
          {/* Slider markers */}
          <div className="flex justify-between text-xs text-dark/40 mt-2">
            <span>Now</span>
            <span>25yr</span>
            <span>50yr</span>
          </div>
        </div>

        {/* Key milestones */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className={`p-2 rounded text-center ${
            value <= 10 ? 'bg-accentGreen/10 text-accentGreen font-medium' : 'bg-gray-50 text-dark/60'
          }`}>
            <div className="font-medium">0-10 years</div>
            <div>Near-term</div>
          </div>
          
          <div className={`p-2 rounded text-center ${
            value > 10 && value <= 30 ? 'bg-yellow-100 text-yellow-700 font-medium' : 'bg-gray-50 text-dark/60'
          }`}>
            <div className="font-medium">10-30 years</div>
            <div>Long-term</div>
          </div>
          
          <div className={`p-2 rounded text-center ${
            value > 30 ? 'bg-blue-100 text-blue-700 font-medium' : 'bg-gray-50 text-dark/60'
          }`}>
            <div className="font-medium">30+ years</div>
            <div>Very long-term</div>
          </div>
        </div>

        {/* Quick selection buttons */}
        <div className="flex space-x-2 justify-center">
          {[5, 10, 15, 20, 30].map((years) => (
            <button
              key={years}
              onClick={() => onChange(years)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                value === years 
                  ? 'bg-dark text-sand' 
                  : 'bg-gray-100 text-dark/70 hover:bg-gray-200'
              }`}
            >
              {years}yr
            </button>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #0D1B2A;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #0D1B2A;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
        `
      }} />
    </div>
  )
}