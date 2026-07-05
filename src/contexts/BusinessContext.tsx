import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { BusinessProfile } from '../types/profile.type'

interface BusinessContextType {
  currentBusiness: BusinessProfile | null
  setCurrentBusiness: (business: BusinessProfile | null) => void
  clearBusiness: () => void
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

interface Props {
  children: ReactNode
}

export const BusinessProvider = ({ children }: Props) => {
  const [currentBusiness, setCurrentBusinessState] =
    useState<BusinessProfile | null>(null)

  const setCurrentBusiness = useCallback((business: BusinessProfile | null) => {
    setCurrentBusinessState(business)
  }, [])

  const clearBusiness = useCallback(() => {
    setCurrentBusinessState(null)
  }, [])

  const value = useMemo(
    () => ({
      currentBusiness,
      setCurrentBusiness,
      clearBusiness
    }),
    [currentBusiness, setCurrentBusiness, clearBusiness]
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