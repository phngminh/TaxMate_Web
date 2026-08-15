import {
  useEffect,
  useRef,
  useState
} from 'react'
import {
  X,
  Maximize2,
  Minimize2,
  Paperclip,
  Send
} from 'lucide-react'

import imgRobot from '../../assets/AI.png'
import { askRag } from '../../apis/rag.api'

import type {
  RagChatMessage,
  RagSource
} from '../../types/rag.type'

interface FloatingAIAssistantProps {
  onClick?: () => void
}

function getCurrentTime() {
  return new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function createMessageId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}

function formatUnknownValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string') {
    return value
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function RagSourceItem({
  source
}: {
  source: RagSource
}) {
  const khoan = formatUnknownValue(source.khoan)
  const diem = formatUnknownValue(source.diem)

  return (
    <div className='rounded-lg border border-purple-100 bg-purple-50 p-2.5'>
      <div className='text-xs font-semibold text-gray-800'>
        {source.title || source.document}
      </div>

      <div className='mt-1 text-[11px] text-gray-600'>
        {source.document}
      </div>

      {source.document_code && (
        <div className='mt-1 text-[11px] text-gray-500'>
          Mã văn bản: {source.document_code}
        </div>
      )}

      <div className='mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-gray-500'>
        {source.dieu !== null && (
          <span>Điều {source.dieu}</span>
        )}

        {khoan && (
          <span>Khoản {khoan}</span>
        )}

        {diem && (
          <span>Điểm {diem}</span>
        )}

        {source.page !== null && (
          <span>Trang {source.page}</span>
        )}
      </div>
    </div>
  )
}

function AssistantMessage({
  message
}: {
  message: RagChatMessage
}) {
  return (
    <div className='flex gap-2'>
      <div className='mt-1 size-8 shrink-0 overflow-hidden rounded-full border border-purple-100 bg-white'>
        <img
          src={imgRobot}
          alt='AI'
          className='size-full object-cover'
        />
      </div>

      <div className='max-w-[80%] space-y-2'>
        <div
          className={`rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm shadow-xs ${
            message.isError
              ? 'text-red-600'
              : 'text-gray-700'
          }`}
        >
          <div className='whitespace-pre-wrap break-words'>
            {message.content}
          </div>

          {message.sources &&
            message.sources.length > 0 && (
              <details className='mt-3'>
                <summary className='cursor-pointer text-xs font-semibold text-[#6b4cfa]'>
                  Nguồn tham khảo ({message.sources.length})
                </summary>

                <div className='mt-2 space-y-2'>
                  {message.sources.map(
                    (source, index) => (
                      <RagSourceItem
                        key={`${source.document_code}-${source.page}-${index}`}
                        source={source}
                      />
                    )
                  )}
                </div>
              </details>
            )}

          <div className='mt-2 text-right text-[10px] text-gray-400'>
            {message.time}
          </div>
        </div>
      </div>
    </div>
  )
}

function UserMessage({
  message
}: {
  message: RagChatMessage
}) {
  return (
    <div className='flex justify-end'>
      <div className='max-w-[80%] rounded-2xl rounded-tr-sm bg-[#6b4cfa] px-4 py-2.5 text-sm text-white'>
        <div className='whitespace-pre-wrap break-words'>
          {message.content}
        </div>

        <div className='mt-1 text-right text-[10px] text-purple-200'>
          {message.time}
        </div>
      </div>
    </div>
  )
}

export default function FloatingAIAssistant({
  onClick
}: FloatingAIAssistantProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  const [messages, setMessages] =
    useState<RagChatMessage[]>([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          'Xin chào! Tôi là trợ lý AI của TaxMate. Bạn có thể hỏi tôi về quy định, nghĩa vụ và thủ tục thuế dành cho hộ kinh doanh.',
        time: getCurrentTime()
      }
    ])

  const messageEndRef = useRef<HTMLDivElement | null>(
    null
  )

  useEffect(() => {
    const handleOpenAI = () => {
      setIsVisible(true)
      setIsOpen(true)
      setIsExpanded(true)
    }
    window.addEventListener('open-ai-assistant', handleOpenAI)
    return () => window.removeEventListener('open-ai-assistant', handleOpenAI)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    messageEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    })
  }, [messages, isSending, isOpen])

  async function handleSend(
    overrideQuestion?: string
  ) {
    const question = (
      overrideQuestion ?? input
    ).trim()

    if (!question || isSending) {
      return
    }

    if (question.length > 2000) {
      setMessages((previous) => [
        ...previous,
        {
          id: createMessageId(),
          role: 'assistant',
          content:
            'Câu hỏi không được vượt quá 2000 ký tự.',
          time: getCurrentTime(),
          isError: true
        }
      ])

      return
    }

    const userMessage: RagChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: question,
      time: getCurrentTime()
    }

    setMessages((previous) => [
      ...previous,
      userMessage
    ])

    setInput('')
    setIsSending(true)

    try {
      const result = await askRag({
        question
      })

      if (!result.success) {
        throw new Error(
          'RAG service returned an unsuccessful response.'
        )
      }

      const assistantMessage: RagChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content:
          result.answer ||
          'Không tìm thấy câu trả lời phù hợp.',
        time: getCurrentTime(),
        sources: result.sources ?? []
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage
      ])
    } catch (error) {
      console.error(
        '[AI Assistant] Ask RAG failed:',
        error
      )

      const errorMessage: RagChatMessage = {
        id: createMessageId(),
        role: 'assistant',
        content:
          'Không thể kết nối với trợ lý AI lúc này. Vui lòng thử lại sau.',
        time: getCurrentTime(),
        isError: true
      }

      setMessages((previous) => [
        ...previous,
        errorMessage
      ])
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === 'Enter' &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      void handleSend()
    }
  }

  if (!isVisible) {
    return null
  }

  if (isOpen) {
    return (
      <div
        className={`fixed z-50 flex flex-col bg-[#f0f2f5] shadow-2xl transition-all duration-300 ${
          isExpanded
            ? 'inset-0'
            : 'bottom-4 right-4 h-150 w-95 rounded-2xl border border-gray-200'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between bg-white px-4 py-3 shadow-xs ${
            !isExpanded
              ? 'rounded-t-2xl'
              : ''
          }`}
        >
          <div className='flex items-center gap-3'>
            <div className='relative flex size-10 overflow-hidden rounded-full border border-purple-100 bg-white'>
              <img
                src={imgRobot}
                alt='AI assistant'
                className='size-full object-cover'
              />
            </div>

            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-gray-800'>
                  AI trợ lý
                </h3>

                <span className='rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-600'>
                  Online
                </span>
              </div>

              <p className='text-xs text-gray-500'>
                Tôi có thể giúp gì cho bạn hôm nay?
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 text-gray-400'>
            <button
              type='button'
              onClick={() =>
                setIsExpanded(
                  (previous) => !previous
                )
              }
              className='rounded-lg p-1.5 hover:bg-gray-100 hover:text-gray-600'
            >
              {isExpanded ? (
                <Minimize2 size={18} />
              ) : (
                <Maximize2 size={18} />
              )}
            </button>

            <button
              type='button'
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

        {/* Messages */}
        <div className='flex-1 space-y-4 overflow-y-auto p-4'>
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage
                key={message.id}
                message={message}
              />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
              />
            )
          )}

          {isSending && (
            <div className='flex gap-2'>
              <div className='mt-1 size-8 shrink-0 overflow-hidden rounded-full border border-purple-100 bg-white'>
                <img
                  src={imgRobot}
                  alt='AI'
                  className='size-full object-cover'
                />
              </div>

              <div className='rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm text-gray-500 shadow-xs'>
                <div className='flex items-center gap-1'>
                  <span className='animate-pulse'>
                    Đang tìm kiếm thông tin
                  </span>
                  <span className='animate-bounce'>
                    ...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messageEndRef} />
        </div>

        {/* Quick questions */}
        <div className='flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide'>
          <button
            type='button'
            onClick={() =>
              setInput(
                'Tra cứu thông tin về mã số thuế của hộ kinh doanh'
              )
            }
            disabled={isSending}
            className='flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <span className='text-blue-500'>
              🔍
            </span>
            Tra cứu mã số thuế
          </button>

          <button
            type='button'
            onClick={() =>
              setInput(
                'Hướng dẫn kê khai thuế cho hộ kinh doanh'
              )
            }
            disabled={isSending}
            className='flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50'
          >
            <span className='text-blue-500'>
              📖
            </span>
            Hướng dẫn kê khai
          </button>
        </div>

        {/* Input */}
        <div
          className={`bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] ${
            !isExpanded
              ? 'rounded-b-2xl'
              : ''
          }`}
        >
          <div className='flex items-center gap-2'>
            <button
              type='button'
              disabled
              title='Chức năng đính kèm chưa được hỗ trợ'
              className='p-2 text-gray-300'
            >
              <Paperclip size={20} />
            </button>

            <div className='flex-1'>
              <input
                type='text'
                value={input}
                onChange={(event) =>
                  setInput(event.target.value)
                }
                onKeyDown={handleKeyDown}
                maxLength={2000}
                disabled={isSending}
                placeholder={
                  isSending
                    ? 'Trợ lý đang trả lời...'
                    : 'Nhập tin nhắn của bạn...'
                }
                className='w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm transition-colors focus:border-[#6b4cfa] focus:outline-hidden focus:ring-1 focus:ring-[#6b4cfa] disabled:cursor-not-allowed disabled:opacity-60'
              />
            </div>

            <button
              type='button'
              disabled={
                isSending ||
                input.trim().length === 0
              }
              onClick={() => {
                void handleSend()
              }}
              className='flex size-9 items-center justify-center rounded-full bg-[#6b4cfa] text-white transition-colors hover:bg-[#5a3de0] disabled:cursor-not-allowed disabled:bg-gray-300'
            >
              <Send
                size={16}
                className='-ml-0.5'
              />
            </button>
          </div>

          <div className='mt-1 pr-12 text-right text-[10px] text-gray-400'>
            {input.length}/2000
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='fixed bottom-10 right-8 z-30 group/container'>
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation()
          setIsVisible(false)
        }}
        className='absolute -top-2 -right-2 z-40 flex size-6 items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-500 hover:text-gray-800 opacity-0 group-hover/container:opacity-100 transition-opacity'
      >
        <X size={14} />
      </button>

      <button
        type='button'
        onClick={() => {
          setIsOpen(true)

          if (onClick) {
            onClick()
          }
        }}
        className='group overflow-hidden rounded-[32px] border border-[#ffa7a4] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-lg'
      >
        <div
          className='flex items-center'
          style={{
            width: 350,
            height: 71
          }}
        >
          <div className='flex-1 px-6 py-2 text-left'>
            <div className='text-[14px] font-bold leading-tight text-[#6b0b0b]'>
              Bạn cần hỗ trợ?{' '}
              <span className='text-[#edfd13]'>
                ★★★
              </span>
            </div>

            <div className='mt-0.5 max-w-43.75 text-[10px] italic leading-tight text-[#4b4b4b]'>
              Chat với trợ lý AI để được giải đáp
              mọi thắc mắc nhanh chóng!
            </div>
          </div>

          <div
            className='relative flex shrink-0 items-end justify-end pr-2'
            style={{
              width: 109,
              height: 77
            }}
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