import { useSyncExternalStore } from 'react'
import { getTaxProfileRevision, subscribeTaxProfileChanges } from '../utils/taxProfileUpdates'

export function useTaxProfileRevision() {
  return useSyncExternalStore(subscribeTaxProfileChanges, getTaxProfileRevision)
}
