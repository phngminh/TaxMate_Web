import storeImage from '../../assets/store.png'
import { Handshake, UtensilsCrossed } from 'lucide-react'

export interface BusinessForm {
  businessName: string
  address: string
  provinceCode: string
  wardCode: string
  categoryId: string
}

const categories = [
  {
    businessCategoryId: '11d1c694-d271-460b-8835-2b2e6a1b8c1d',
    name: 'Ăn uống, nhà hàng (F&B)',
    icon: UtensilsCrossed,
    color: 'text-green-500'
  },
  {
    businessCategoryId: '22d2c694-d271-460b-8835-2b2e6a1b8c2d',
    name: 'Dịch vụ (Service)',
    icon: Handshake,
    color: 'text-purple-500'
  }
]

interface Props {
  open: boolean
  mode: 'initial' | 'add'
  loading: boolean
  form: BusinessForm
  setForm: React.Dispatch<React.SetStateAction<BusinessForm>>
  onClose: () => void
  onSubmit: () => void
}

export default function BusinessModal({
  open,
  mode,
  loading,
  form,
  setForm,
  onClose,
  onSubmit
}: Props) {
  if (!open) return null

  const isInitial = mode === 'initial'

  const updateField = (key: keyof BusinessForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div
      className='fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4'
      onClick={isInitial ? undefined : onClose}
    >
      <div
        className='relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl'
        onClick={(e) => e.stopPropagation()}
      >
        <div className='max-h-[90vh] overflow-y-auto'>
          <div className='mx-auto w-full max-w-130 px-8 py-6'>
            <div className='flex justify-center'>
              <img
                src={storeImage}
                alt='Store'
                className='w-44'
              />
            </div>

            <div className='mt-2 text-center'>
              {isInitial ? (
                <>
                  <h2 className='text-3xl font-bold leading-tight'>
                    Chào mừng đến với
                  </h2>

                  <p className='text-3xl font-bold text-blue-500'>
                    TaxMate
                  </p>

                  <p className='mt-3 text-gray-500'>
                    Hãy thiết lập thông tin cửa hàng của bạn để bắt đầu sử dụng.
                  </p>
                </>
              ) : (
                <p className='text-2xl font-bold text-blue-500'>
                  Tạo hồ sơ cửa hàng mới
                </p>
              )}
            </div>

            <div className='mt-8 space-y-5'>
              <div>
                <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Tên cửa hàng <span className='text-taxmate-red'>*</span>
                </label>

                <input
                  type='text'
                  value={form.businessName}
                  onChange={(e) =>
                    updateField('businessName', e.target.value)
                  }
                  placeholder='Nhập tên cửa hàng'
                  className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                />
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Địa chỉ cửa hàng
                </label>

                <input
                  type='text'
                  value={form.address}
                  onChange={(e) =>
                    updateField('address', e.target.value)
                  }
                  placeholder='Nhập địa chỉ cửa hàng'
                  className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                />
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Mã tỉnh/thành phố
                </label>

                <input
                  type='text'
                  value={form.provinceCode}
                  onChange={(e) =>
                    updateField('provinceCode', e.target.value)
                  }
                  placeholder='Ví dụ: 79'
                  className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                />
              </div>

              <div>
                <label className='mb-2 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Mã quận/huyện
                </label>

                <input
                  type='text'
                  value={form.wardCode}
                  onChange={(e) =>
                    updateField('wardCode', e.target.value)
                  }
                  placeholder='Ví dụ: 26734'
                  className='h-12 w-full rounded-xl border border-gray-300 bg-white py-3 pl-5 pr-5 text-sm text-gray-900 outline-hidden transition-colors placeholder:text-gray-400 focus:border-taxmate-red focus:ring-2 focus:ring-taxmate-red/20'
                />
              </div>

              <div>
                <label className='mb-3 block text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  Loại cửa hàng <span className='text-taxmate-red'>*</span>
                </label>

                <div className='mb-2 space-y-3'>
                  {categories.map((category) => {
                    const selected = form.categoryId === category.businessCategoryId
                    const Icon = category.icon

                    return (
                      <button
                        key={category.businessCategoryId}
                        type='button'
                        onClick={() =>
                          updateField('categoryId', category.businessCategoryId)
                        }
                        className={`flex h-12 w-full items-center justify-between rounded-xl border px-5 py-6 transition-all ${
                          selected
                            ? 'border-taxmate-red bg-taxmate-red/10'
                            : 'border-gray-300 hover:border-taxmate-red'
                        }`}
                      >
                        <div className='flex items-center gap-4'>
                          <Icon
                            className={`h-6 w-6 ${category.color}`}
                          />
                          <span>{category.name}</span>
                        </div>

                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            selected
                              ? 'border-taxmate-red'
                              : 'border-gray-400'
                          }`}
                        >
                          {selected && (
                            <div className='h-3 w-3 rounded-full bg-taxmate-red' />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type='button'
                disabled={loading}
                onClick={onSubmit}
                className='h-14 w-full rounded-xl bg-red-600 text-lg font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {loading
                  ? 'Đang tạo...'
                  : isInitial
                    ? 'Xác nhận'
                    : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}