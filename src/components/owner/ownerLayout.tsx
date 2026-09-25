import { Outlet } from 'react-router-dom'
import OwnerHeader from '../owner/ownerHeader'
import FloatingAIAssistant from '../owner/aiAssistant'
import ThresholdAlertBanner from '../owner/tax/ThresholdAlertBanner'
import { useBusiness } from '../../contexts/BusinessContext'

export default function OwnerLayout() {
  const { currentBusiness } = useBusiness()

  return (
    <div className='min-h-screen bg-[#f0f2f5]'>
      <OwnerHeader />
      <main className='pt-14'>
        <ThresholdAlertBanner businessId={currentBusiness?.id ?? ''} />
        <Outlet />
      </main>
      <FloatingAIAssistant />
    </div>
  )
}