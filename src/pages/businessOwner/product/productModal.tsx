import { Loader2, ShoppingBag, ImagePlus } from 'lucide-react'
import type { ProductForm } from '../../../types/product.type'
import type { Dispatch, SetStateAction } from 'react'

interface ProductModalProps {
  open: boolean
  closeModal: () => void
  handleSubmit: (e: React.FormEvent) => void

  productForm: ProductForm
  setProductForm: Dispatch<SetStateAction<ProductForm>>

  categories: any[]
  handleImage: (e: React.ChangeEvent<HTMLInputElement>) => void

  isEditing: boolean
  isProduct: boolean

  isSubmitting: boolean
}

export default function ProductModal({
  open,
  closeModal,
  handleSubmit,
  productForm,
  setProductForm,
  categories,
  handleImage,
  isEditing,
  isProduct,
  isSubmitting
}: ProductModalProps) {
  if (!open) return null
  const itemLabel = isProduct ? 'sản phẩm' : 'dịch vụ'

  return (
    <div className='fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4'>
      <div className='bg-white rounded-[16px] shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'>
        <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100 shrink-0'>
          <h3 className='text-[16px] font-bold text-gray-900 flex items-center gap-2'>
            <ShoppingBag className='text-[#D32F2F] size-5' />
            {isEditing
              ? isProduct
                ? 'Chỉnh sửa sản phẩm'
                : 'Chỉnh sửa dịch vụ'
              : isProduct
                ? 'Thêm sản phẩm mới'
                : 'Thêm dịch vụ mới'}
          </h3>
        </div>

        <form
          id='product-form'
          onSubmit={handleSubmit}
          className='flex-1 overflow-y-auto p-6 flex flex-col gap-5'
        >
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Tên {itemLabel} <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              required
              placeholder={
                isProduct
                  ? 'Ví dụ: Pepsi, Pizza hải sản...'
                  : 'Ví dụ: Dịch vụ giao hàng...'
              }
              value={productForm.name}
              onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Mô tả {itemLabel}
            </label>
            <input
              type='text'
              placeholder={
                isProduct
                  ? 'Ví dụ: Pizza hải sản với phô mai Mozzarella.'
                  : 'Ví dụ: Dịch vụ giao hàng...'
              }
              value={productForm.description}
              onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-[13px] font-bold text-gray-600'>
                Danh mục
              </label>
              <select
                value={productForm.productCategoryId}
                onChange={(e) => setProductForm(prev => ({ ...prev, productCategoryId: e.target.value }))}
                className='w-full border border-gray-200 bg-white rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
              >
                <option value=''>
                  Chọn danh mục
                </option>

                {categories.map(category => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='flex flex-col gap-1.5'>
              <label className='text-[13px] font-bold text-gray-600'>
                Đơn vị tính
              </label>
              <input
                type='text'
                placeholder={
                  isProduct
                    ? 'Ví dụ: Cái, Chiếc, Bát...'
                    : 'Ví dụ: Giờ, Lần...'
                }
                value={productForm.unit}
                onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                className='w-full border border-gray-200 bg-white rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
              />
            </div>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Giá bán (đ)
            </label>
            <input
              type='text'
              placeholder='0'
              value={productForm.price}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '')
                if (clean === '') {
                  setProductForm(prev => ({ ...prev, price: '' }))
                } else {
                  setProductForm(prev => ({ ...prev, price: parseInt(clean).toLocaleString('vi-VN') }))
                }
              }}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 text-right'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <label className='text-[13px] font-bold text-gray-600'>
              Hình ảnh {itemLabel}
            </label>
            <label
              htmlFor='product-image'
              className='border-2 border-dashed border-gray-300 rounded-xl h-44 flex flex-col items-center justify-center cursor-pointer hover:border-[#D32F2F] transition'
            >
              {productForm.imagePreview ? (
                <img
                  src={productForm.imagePreview}
                  className='h-full w-full object-cover rounded-xl'
                />
              ) : (
                <>
                  <ImagePlus className='w-8 h-8 text-gray-400 mb-2' />
                  <p className='text-sm font-medium text-gray-500'>
                    Kéo thả hoặc nhấp để tải lên hình ảnh
                  </p>
                  <p className='text-xs text-gray-400'>
                    Định dạng: JPG, PNG. Kích thước tối đa: 5MB
                  </p>
                </>
              )}

              <input
                id='product-image'
                type='file'
                accept='image/*'
                hidden
                onChange={handleImage}
              />
            </label>
          </div>
        </form>

        <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white'>
          <button
            type='button'
            onClick={closeModal}
            className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors'
          >
            Hủy
          </button>

          <button
            type='submit'
            form='product-form'
            disabled={isSubmitting}
            className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-70 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs flex items-center gap-2'
          >
            {isSubmitting && (
              <Loader2 className='size-4 animate-spin' />
            )}

            {isSubmitting
              ? 'Đang xử lý...'
              : isEditing
                ? 'Lưu thay đổi'
                : 'Tạo mới'}
          </button>
        </div>
      </div>
    </div>
  )
}