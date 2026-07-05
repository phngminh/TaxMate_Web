import { Outlet } from 'react-router-dom'
import Sidebar from './adminSidebar'
import Header from './adminHeader'

export default function AdminLayout() {
  return (
    <div className='admin-theme dark min-h-screen bg-background text-foreground font-archivo'>
      <div className='flex h-screen overflow-hidden'>
        <Sidebar />

        <div className='flex-1 flex flex-col min-w-0 overflow-hidden'>
          <Header />
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
