import imgRobot from '../../assets/AI.png'

interface FloatingAIAssistantProps {
  onClick?: () => void
}

export default function FloatingAIAssistant({ onClick }: FloatingAIAssistantProps) {
  return (
    <div className='fixed bottom-10 right-8 z-50'>
      <button
        type='button'
        onClick={onClick}
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