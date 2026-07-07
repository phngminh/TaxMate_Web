import { useState } from 'react'
import { X, Maximize2, Minimize2, Paperclip, Send } from 'lucide-react'
import imgRobot from '../../assets/AI.png'

interface FloatingAIAssistantProps {
  onClick?: () => void
}

export default function FloatingAIAssistant({ onClick }: FloatingAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  if (isOpen) {
    return (
      <div 
        className={`fixed z-50 flex flex-col bg-[#f0f2f5] shadow-2xl transition-all duration-300 ${
          isExpanded 
            ? 'inset-0' 
            : 'bottom-4 right-4 h-[600px] w-[380px] rounded-2xl border border-gray-200'
        }`}
      >
        <div className={`flex items-center justify-between bg-white px-4 py-3 shadow-sm ${!isExpanded ? 'rounded-t-2xl' : ''}`}>
          <div className='flex items-center gap-3'>
            <div className='relative flex size-10 overflow-hidden rounded-full border border-purple-100 bg-white'>
              <img src={imgRobot} alt='AI assistant' className='size-full object-cover' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-gray-800'>AI trợ lý</h3>
                <span className='rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-600'>
                  Online
                </span>
              </div>
              <p className='text-xs text-gray-500'>Tôi có thể giúp gì cho bạn hôm nay?</p>
            </div>
          </div>
          <div className='flex items-center gap-2 text-gray-400'>
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className='rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-600'
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button 
              onClick={() => {
                setIsOpen(false)
                setIsExpanded(false)
              }}
              className='rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-600'
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          <div className='flex justify-end'>
            <div className='max-w-[80%] rounded-2xl rounded-tr-sm bg-[#6b4cfa] px-4 py-2.5 text-sm text-white'>
              Nghĩa vụ thuế là gì?
              <div className='mt-1 text-right text-[10px] text-purple-200'>09:41</div>
            </div>
          </div>

          <div className='flex gap-2'>
            <div className='size-8 shrink-0 overflow-hidden rounded-full border border-purple-100 bg-white mt-1'>
              <img src={imgRobot} alt='AI' className='size-full object-cover' />
            </div>
            <div className='max-w-[80%] space-y-2'>
              <div className='rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-gray-700 shadow-sm'>
                Nghĩa vụ thuế là trách nhiệm của cá nhân hoặc tổ chức phải thực hiện theo quy định của pháp luật về thuế.
                <div className='mt-1 text-right text-[10px] text-gray-400'>09:41</div>
              </div>

              <div className='rounded-2xl bg-white px-4 py-3 text-sm text-gray-700 shadow-sm'>
                <div className='mb-2 font-semibold text-gray-800'>Các nghĩa vụ thuế chính gồm:</div>
                <ul className='space-y-2'>
                  <li className='flex gap-2'><span className='text-[#6b4cfa]'>✔</span> Đăng ký thuế</li>
                  <li className='flex gap-2'><span className='text-[#6b4cfa]'>✔</span> Khai thuế</li>
                  <li className='flex gap-2'><span className='text-[#6b4cfa]'>✔</span> Nộp thuế đầy đủ, đúng hạn</li>
                  <li className='flex gap-2'><span className='text-[#6b4cfa]'>✔</span> Chấp hành kiểm tra, thanh tra thuế</li>
                  <li className='flex gap-2'><span className='text-[#6b4cfa]'>✔</span> Cung cấp thông tin, hồ sơ theo...</li>
                </ul>
                <div className='mt-2 text-right text-[10px] text-gray-400'>09:42</div>
              </div>
            </div>
          </div>
          
          <div className='flex justify-end'>
            <div className='max-w-[80%] rounded-2xl rounded-tr-sm bg-[#6b4cfa] px-4 py-2.5 text-sm text-white'>
              Thời hạn nộp thuế TNDN tạm tính?
              <div className='mt-1 text-right text-[10px] text-purple-200'>09:42</div>
            </div>
          </div>

          <div className='flex gap-2'>
            <div className='size-8 shrink-0 overflow-hidden rounded-full border border-purple-100 bg-white mt-1'>
              <img src={imgRobot} alt='AI' className='size-full object-cover' />
            </div>
            <div className='max-w-[80%] space-y-2'>
              <div className='rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-gray-700 shadow-sm'>
                Thuế TNDN tạm tính được nộp theo quý, chậm nhất là ngày cuối...
                <div className='mt-3 rounded-xl bg-purple-50 p-3'>
                  <div className='mb-1 text-xs font-semibold text-gray-800'>Ví dụ:</div>
                  <ul className='space-y-1 text-xs text-gray-600'>
                    <li>• Quý I (01/01 - 31/03): nộp chậm nhất 30/04</li>
                    <li>• Quý II (01/04 - 30/06): nộp chậm nhất 31/07</li>
                    <li>• Quý III (01/07 - 30/09): nộp chậm nhất 31/10</li>
                    <li>• Quý IV (01/10 - 31/12): nộp chậm nhất 31/01</li>
                  </ul>
                </div>
                <div className='mt-2 text-right text-[10px] text-gray-400'>09:42</div>
              </div>
            </div>
          </div>
        </div>

        <div className='flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide'>
          <button className='flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100'>
            <span className='text-blue-500'>🔍</span> Tra cứu mã số thuế
          </button>
          <button className='flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100'>
            <span className='text-blue-500'>📖</span> Hướng dẫn kê khai
          </button>
        </div>

        <div className={`bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] ${!isExpanded ? 'rounded-b-2xl' : ''}`}>
          <div className='flex items-center gap-2'>
            <button className='p-2 text-gray-400 transition-colors hover:text-gray-600'>
              <Paperclip size={20} />
            </button>
            <div className='flex-1'>
              <input 
                type='text'
                placeholder='Nhập tin nhắn của bạn...'
                className='w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-colors focus:border-[#6b4cfa] focus:outline-none focus:ring-1 focus:ring-[#6b4cfa]'
              />
            </div>
            <button className='flex size-9 items-center justify-center rounded-full bg-[#6b4cfa] text-white transition-colors hover:bg-[#5a3de0]'>
              <Send size={16} className='-ml-0.5' />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed bottom-10 right-8 z-30'>
      <button
        type='button'
        onClick={() => {
          setIsOpen(true)
          if (onClick) onClick()
        }}
        className='group overflow-hidden rounded-[32px] border border-[#ffa7a4] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
      >
        <div
          className='flex items-center'
          style={{ width: 350, height: 71 }}
        >
          <div className='flex-1 px-6 py-2 text-left'>
            <div className='text-[14px] font-bold leading-tight text-[#6b0b0b]'>
              Bạn cần hỗ trợ?{' '}
              <span className='text-[#edfd13]'>★★★</span>
            </div>

            <div className='mt-0.5 max-w-[175px] text-[10px] italic leading-tight text-[#4b4b4b]'>
              Chat với trợ lý AI để được giải đáp mọi thắc mắc nhanh chóng!
            </div>
          </div>

          <div
            className='relative flex shrink-0 items-end justify-end pr-2'
            style={{ width: 109, height: 77 }}
          >
            <img
              src={imgRobot}
              alt='AI assistant'
              className='size-full object-cover transition-transform duration-300 group-hover:scale-105'
            />
          </div>
        </div>
      </button>
    </div>
  )
}