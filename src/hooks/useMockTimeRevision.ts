import { useSyncExternalStore } from 'react'
import { getMockTimeRevision, subscribeMockTimeChanges } from '../utils/mockTime'

export function useMockTimeRevision() {
  return useSyncExternalStore(subscribeMockTimeChanges, getMockTimeRevision)
}
