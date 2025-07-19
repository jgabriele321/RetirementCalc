export interface CostOfLivingData {
  rpp_all: number
  rpp_housing: number
  rpp_goods: number
  rpp_other: number
  state: string
  cbsa_code: string | null
}

export interface CostOfLivingDatabase {
  [zipCode: string]: CostOfLivingData
}

export interface ZipCodeLookupResult {
  data: CostOfLivingData | null
  isFound: boolean
  isFallback: boolean
  fallbackType?: 'state' | 'cbsa' | 'estimate'
}