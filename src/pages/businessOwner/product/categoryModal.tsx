import { Loader2, ShoppingBag } from 'lucide-react'

export default function CategoryModal({
  open,
  categoryForm,
  setCategoryForm,
  handleAddCategory,
  closeModal,
  isSubmitting
}: any) {
  if (!open) return null

  return (
    <div className='fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4'>
      <div className='bg-white rounded-[16px] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'>
        <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100 shrink-0'>
          <h3 className='text-[16px] font-bold text-gray-900 flex items-center gap-2'>
            <ShoppingBag className='text-[#D32F2F] size-5' />
            Tạo danh mục
          </h3>
        </div>

        <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-5'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Tên danh mục <span className='text-red-500'>*</span>
            </label>
            <input
              value={categoryForm.name}
              onChange={(e) => setCategoryForm((prev: any) => ({...prev, name: e.target.value}))}
              placeholder='Ví dụ: Đồ uống'
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Mô tả
            </label>
            <textarea
              rows={3}
              value={categoryForm.description}
              onChange={(e) => setCategoryForm((prev: any) => ({...prev, description: e.target.value}))}
              placeholder='Nhập mô tả danh mục'
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 resize-none'
            />
          </div>
        </div>

        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white'>
          <button
            type='button'
            onClick={closeModal}
            className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors'
          >
            Hủy
          </button>

          <button
            type='button'
            onClick={handleAddCategory}
            disabled={isSubmitting}
            className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] disabled:bg-[#D32F2F]/70 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs flex items-center gap-2'
          >
            {isSubmitting && (
              <div className='size-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
            )}
            {isSubmitting ? 'Đang tạo...' : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  )
}