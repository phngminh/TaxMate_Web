import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isLoading?: boolean
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  isLoading = false,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-[#D32F2F] hover:bg-[#B71C1C]'
      : 'bg-[#4c51bf] hover:bg-[#4338ca]'

  return (
    <div
      className='fixed inset-0 bg-black/40 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-in fade-in duration-200'
      onClick={isLoading ? undefined : onCancel}
    >
      <div
        className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='flex items-center justify-between px-6 py-4 border-b border-gray-100'>
          <div className='flex items-center gap-3'>
            <div
              className={`flex items-center justify-center size-10 rounded-full ${
                variant === 'danger' ? 'bg-red-50 text-[#D32F2F]' : 'bg-indigo-50 text-[#4c51bf]'
              }`}
            >
              <AlertTriangle size={20} />
            </div>
            <h3 className='text-[16px] font-bold text-gray-900'>{title}</h3>
          </div>
          <button
            type='button'
            onClick={onCancel}
            disabled={isLoading}
            className='p-1 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50'
          >
            <X size={18} />
          </button>
        </div>

        <div className='px-6 py-5'>
          <p className='text-[14px] text-gray-600 leading-relaxed'>{message}</p>
        </div>

        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50'>
          <button
            type='button'
            onClick={onCancel}
            disabled={isLoading}
            className='px-5 py-2 border-2 border-gray-200 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-white transition-colors disabled:opacity-50'
          >
            {cancelLabel}
          </button>
          <button
            type='button'
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs disabled:opacity-60 ${confirmBtnClass}`}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
