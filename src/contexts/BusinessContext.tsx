import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'
import type { ReactNode } from 'react'
import type { BusinessProfile } from '../types/profile.type'

interface BusinessContextType {
  businesses: BusinessProfile[]
  currentBusiness: BusinessProfile | null
  businessId?: string

  setBusinesses: (businesses: BusinessProfile[]) => void
  setCurrentBusiness: (business: BusinessProfile | null) => void
  clearBusiness: () => void
}

const BusinessContext = createContext<BusinessContextType | undefined>(
  undefined
)

interface Props {
  children: ReactNode
}

export const BusinessProvider = ({ children }: Props) => {
  const [businesses, setBusinessesState] = useState<BusinessProfile[]>(() => {
    const saved = localStorage.getItem('businesses')
    return saved ? JSON.parse(saved) : []
  })

  const [currentBusiness, setCurrentBusinessState] =
    useState<BusinessProfile | null>(() => {
      const saved = localStorage.getItem('currentBusiness')
      return saved ? JSON.parse(saved) : null
    })

  const setBusinesses = useCallback((list: BusinessProfile[]) => {
    setBusinessesState(list)
    localStorage.setItem('businesses', JSON.stringify(list))
  }, [])

  const setCurrentBusiness = useCallback(
    (business: BusinessProfile | null) => {
      setCurrentBusinessState(business)

      if (business) {
        localStorage.setItem('currentBusiness', JSON.stringify(business))
      } else {
        localStorage.removeItem('currentBusiness')
      }
    },
    []
  )

  const clearBusiness = useCallback(() => {
    setBusinessesState([])
    setCurrentBusinessState(null)

    localStorage.removeItem('businesses')
    localStorage.removeItem('currentBusiness')
  }, [])

  const value = useMemo(
    () => ({
      businesses,
      currentBusiness,
      businessId: currentBusiness?.id,

      setBusinesses,
      setCurrentBusiness,
      clearBusiness
    }),
    [
      businesses,
      currentBusiness,
      setBusinesses,
      setCurrentBusiness,
      clearBusiness
    ]
  )

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export const useBusiness = () => {
  const context = useContext(BusinessContext)

  if (!context) {
    throw new Error(
      'useBusiness must be used within BusinessProvider'
    )
  }

  return context
}