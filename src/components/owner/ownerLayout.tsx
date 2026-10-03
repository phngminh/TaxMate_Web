import { Outlet } from 'react-router-dom'
import OwnerHeader from '../owner/ownerHeader'
import FloatingAIAssistant from '../owner/aiAssistant'
import ThresholdAlertBanner from '../owner/tax/ThresholdAlertBanner'
import { useBusiness } from '../../contexts/BusinessContext'
import { useMockTimeRevision } from '../../hooks/useMockTimeRevision'

export default function OwnerLayout() {
  const { currentBusiness } = useBusiness()
  const mockTimeRevision = useMockTimeRevision()

  return (
    <div className='min-h-screen bg-[#f0f2f5]'>
      <OwnerHeader />
      <main key={mockTimeRevision} className='pt-14'>
        <ThresholdAlertBanner businessId={currentBusiness?.id ?? ''} />
        <Outlet />
      </main>
      <FloatingAIAssistant />
    </div>
  )
}