import { Outlet } from 'react-router-dom'
import OwnerHeader from '../owner/ownerHeader'
import FloatingAIAssistant from '../owner/aiAssistant'

export default function OwnerLayout() {
  return (
    <div className='min-h-screen bg-[#f0f2f5]'>
      <OwnerHeader />
      <main className='pt-14'>
        <Outlet />
      </main>
      <FloatingAIAssistant />
    </div>
  )
}