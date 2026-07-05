import { Outlet } from 'react-router-dom'
import ComprehensiveSidebar from './ComprehensiveSidebar'
import TopNav from './TopNav'

export default function AdminLayout() {
  return (
    <div className='admin-theme dark min-h-screen bg-background text-foreground font-archivo'>
      <div className='flex h-screen overflow-hidden'>
        <ComprehensiveSidebar />

        <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
          <TopNav />
          <div className='flex-1 overflow-y-auto'>
            <div className='p-8'>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
