import { useState } from 'react'
import { TrendingUp, CircleDollarSign, Receipt, Store } from 'lucide-react'
import { useBusiness } from '../../../contexts/BusinessContext'
import SalesReport from './salesReport'
import ProfitReport from './profitReport'
import ExpenseReport from './expenseReport'

type Tab = 'sell' | 'profit' | 'expense'

export default function Report() {
  const [activeTab, setActiveTab] = useState<Tab>('sell')
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id

  return (
    <div className='flex flex-col bg-[#f8f9fa] min-h-[calc(100vh-51px)] w-full'>
      <div className='flex grow w-full'>
        {/* Left Sidebar */}
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-4 shrink-0'>
          <span className='text-[13px] font-bold text-gray-500 uppercase tracking-wide'>Báo cáo</span>
          <div className='flex flex-col gap-1'>
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'sell'
                  ? 'bg-[#eef2ff] text-[#4c51bf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <TrendingUp size={17} className={activeTab === 'sell' ? 'text-[#4c51bf]' : 'text-gray-400'} />
              Bán hàng
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'profit'
                  ? 'bg-[#eef2ff] text-[#4c51bf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <CircleDollarSign size={17} className={activeTab === 'profit' ? 'text-[#4c51bf]' : 'text-gray-400'} />
              Lợi nhuận & Thuế
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'expense'
                  ? 'bg-[#eef2ff] text-[#4c51bf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Receipt size={17} className={activeTab === 'expense' ? 'text-[#4c51bf]' : 'text-gray-400'} />
              Chi phí & Dòng tiền
            </button>
          </div>
        </div>

        <div className='grow p-8 overflow-x-auto'>
          {!businessId ? (
            <div className='bg-white border border-[#eef0f2] rounded-[12px] p-12 flex flex-col items-center justify-center text-center gap-4 shadow-[0px_1px_1px_rgba(0,0,0,0.02)] min-h-100 h-full'>
              <div className='size-16 rounded-full bg-red-50 flex items-center justify-center text-[#ef4444]'>
                <Store size={32} />
              </div>
              <div className='flex flex-col gap-1 max-w-sm'>
                <h3 className='text-[16px] font-bold text-gray-800'>Chưa chọn Hộ kinh doanh</h3>
                <p className='text-[13px] text-gray-500'>
                  Vui lòng chọn Hộ kinh doanh ở trình đơn trên góc phải màn hình, hoặc tạo Hộ kinh doanh mới để xem các báo cáo thống kê chi tiết.
                </p>
              </div>
            </div>
          ) : (
            <div className='w-full h-full'>
              {activeTab === 'sell' && <SalesReport businessId={businessId} />}
              {activeTab === 'profit' && <ProfitReport businessId={businessId} />}
              {activeTab === 'expense' && <ExpenseReport businessId={businessId} />}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}