import { useState, useMemo, useRef, useEffect, type ChangeEvent } from 'react'
import { Search, Plus, Scan, Trash2, Edit2, Package, BookOpen, RotateCcw, ImagePlus, FlaskConical, ShoppingBag } from 'lucide-react'
import type { Ingredient } from '../../types/ingredient.type'
import type { ProductIngredient } from '../../types/productIngredient.type'
import { getAllIngredients } from '../../apis/ingredient.api'
import { getProductIngredients } from '../../apis/productIngredient.api'

const INGREDIENTS: Ingredient[] = [
  {
    id: 'ING000001',
    name: 'Bột mì',
    unit: 'kg',
    estimatedPrice: 18000,
    isDeleted: false,
    createdAt: '2025-01-10T08:00:00Z',
    updatedAt: '2025-06-20T10:30:00Z',
  },
  {
    id: 'ING000002',
    name: 'Phô mai Mozzarella',
    unit: 'kg',
    estimatedPrice: 120000,
    isDeleted: false,
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-06-21T11:00:00Z',
  },
  {
    id: 'ING000003',
    name: 'Cà chua',
    unit: 'kg',
    estimatedPrice: 25000,
    isDeleted: false,
    createdAt: '2025-02-01T07:30:00Z',
    updatedAt: '2025-06-22T08:45:00Z',
  },
  {
    id: 'ING000004',
    name: 'Thịt bò',
    unit: 'kg',
    estimatedPrice: 280000,
    isDeleted: false,
    createdAt: '2025-02-10T10:00:00Z',
    updatedAt: '2025-06-23T09:00:00Z',
  },
  {
    id: 'ING000005',
    name: 'Rau diếp',
    unit: 'kg',
    estimatedPrice: 15000,
    isDeleted: true,
    createdAt: '2025-03-05T06:00:00Z',
    updatedAt: '2025-06-24T14:00:00Z',
  },
  {
    id: 'ING000006',
    name: 'Hành tây',
    unit: 'kg',
    estimatedPrice: 20000,
    isDeleted: false,
    createdAt: '2025-03-12T08:30:00Z',
    updatedAt: '2025-06-25T10:00:00Z',
  },
]

const PRODUCT_INGREDIENTS: ProductIngredient[] = [
  {
    productId: 'SP000001',
    ingredientId: 'ING000001',
    ingredientName: 'Bột mì',
    unit: 'kg',
    quantity: 0.5,
  },
  {
    productId: 'SP000001',
    ingredientId: 'ING000002',
    ingredientName: 'Phô mai Mozzarella',
    unit: 'kg',
    quantity: 0.2,
  },
  {
    productId: 'SP000001',
    ingredientId: 'ING000003',
    ingredientName: 'Cà chua',
    unit: 'kg',
    quantity: 0.15,
  },
  {
    productId: 'SP000002',
    ingredientId: 'ING000004',
    ingredientName: 'Thịt bò',
    unit: 'kg',
    quantity: 0.18,
  },
  {
    productId: 'SP000002',
    ingredientId: 'ING000006',
    ingredientName: 'Hành tây',
    unit: 'kg',
    quantity: 0.05,
  },
  {
    productId: 'SP000003',
    ingredientId: 'ING000003',
    ingredientName: 'Cà chua',
    unit: 'kg',
    quantity: 0.1,
  },
]

const fakeFetchIngredients = async (): Promise<Ingredient[]> => {
  void getAllIngredients
  return new Promise((resolve) => setTimeout(() => resolve(INGREDIENTS), 400))
}

const fakeFetchProductIngredients = async (): Promise<ProductIngredient[]> => {
  void getProductIngredients
  return new Promise((resolve) => setTimeout(() => resolve(PRODUCT_INGREDIENTS), 400))
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

type Tab = 'ingredient' | 'recipe'

export default function Ingredient() {
  const [activeTab, setActiveTab] = useState<Tab>('ingredient')
  const [searchQuery, setSearchQuery] = useState('')

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loadingIngredients, setLoadingIngredients] = useState(false)

  const [productIngredients, setProductIngredients] = useState<ProductIngredient[]>([])
  const [loadingRecipes, setLoadingRecipes] = useState(false)

  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)

  const [isAddProductIngredientOpen, setIsAddProductIngredientOpen] = useState(false)
  const [isEditProductIngredientOpen, setIsEditProductIngredientOpen] = useState(false)
  const [editingProductIngredient, setEditingProductIngredient] = useState<ProductIngredient | null>(null)

  const [formName, setFormName] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formPrice, setFormPrice] = useState('')

  const addNewDropdownRef = useRef<HTMLDivElement>(null)
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false)

  const isIngredient = isAddIngredientOpen || isEditIngredientOpen
  const isProductIngredient = isAddProductIngredientOpen || isEditProductIngredientOpen
  const isModalOpen = isIngredient || isProductIngredient

  const isEditing = isEditIngredientOpen || isEditProductIngredientOpen

  const modalTitle = isEditing
  ? isIngredient
    ? 'Chỉnh sửa nguyên liệu'
    : 'Chỉnh sửa công thức'
  : isIngredient
    ? 'Thêm nguyên liệu mới'
    : 'Thêm công thức mới'

  const itemLabel = isIngredient ? 'nguyên liệu' : 'công thức'

  useEffect(() => {
    if (activeTab === 'ingredient') {
      setLoadingIngredients(true)
      fakeFetchIngredients().then((data) => {
        setIngredients(data)
        setLoadingIngredients(false)
      })
    } else {
      setLoadingRecipes(true)
      fakeFetchProductIngredients().then((data) => {
        setProductIngredients(data)
        setLoadingRecipes(false)
      })
    }
    setSearchQuery('')
  }, [activeTab])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addNewDropdownRef.current && !addNewDropdownRef.current.contains(event.target as Node)) {
        setAddNewDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredIngredients = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return ingredients.filter(
      (i) => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q),
    )
  }, [ingredients, searchQuery])

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return productIngredients.filter(
      (pi) =>
        pi.ingredientName.toLowerCase().includes(q) ||
        pi.productId.toLowerCase().includes(q) ||
        pi.ingredientId.toLowerCase().includes(q),
    )
  }, [productIngredients, searchQuery])

  const closeModal = () => {
    setIsAddIngredientOpen(false)
    setIsEditIngredientOpen(false)
    setEditingIngredient(null)
    setIsAddProductIngredientOpen(false)
    setIsEditProductIngredientOpen(false)
    setEditingProductIngredient(null)
    setFormName('')
    setFormUnit('')
    setFormPrice('')
  }

  const handleOpenAddIngredient = () => {
    setFormName('')
    setFormUnit('')
    setFormPrice('')
    setIsAddIngredientOpen(true)
    setAddNewDropdownOpen(false)
  }

  const handleOpenAddProductIngredient = () => {
    setFormName('')
    setFormUnit('')
    setFormPrice('')
    setIsAddProductIngredientOpen(true)
    setAddNewDropdownOpen(false)
  }

  const handleOpenEditIngredient = (ingredient: Ingredient, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingIngredient(ingredient)
    setFormName(ingredient.name)
    setFormUnit(ingredient.unit ?? '')
    setFormPrice(ingredient.estimatedPrice?.toString() ?? '')
    setIsEditIngredientOpen(true)
  }

  const handleOpenEditProductIngredient = (ingredient: ProductIngredient, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingProductIngredient(ingredient)
    setFormName(ingredient.ingredientName)
    setFormPrice(ingredient.quantity?.toString() ?? '')
    setIsEditProductIngredientOpen(true)
  }

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement
  }

  const handleEditIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement
  }

  const handleDeleteIngredient = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: Implement
  }

  const handleAddProductIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement
  }

  const handleEditProductIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement
  }

  const handleDeleteProductIngredient = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    // TODO: Implement
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isIngredient) {
      if (isEditIngredientOpen) {
        handleEditIngredient(e)
      } else {
        handleAddIngredient(e)
      }
      return
    }

    if (isProductIngredient) {
      if (isEditProductIngredientOpen) {
        handleEditProductIngredient(e)
      } else {
        handleAddProductIngredient(e)
      }
      return
    }
  }

  return (
    <div className='flex flex-col bg-[#f8f9fa] min-h-[calc(100vh-51px)] w-full'>
      <div className='flex items-center justify-between px-8 py-4 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='ml-96 flex-1 max-w-4xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-sm focus-within:border-[#D32F2F] focus-within:ring-1 focus-within:ring-[#D32F2F]/20 transition-all'>
          <Scan className='text-[#D32F2F] mr-3 size-5 shrink-0 stroke-[2]' />
          <input
            type='text'
            placeholder='Tìm kiếm thông minh..'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='flex-grow bg-transparent outline-none text-[14px] text-gray-800 placeholder-gray-400 font-medium'
          />
          <Search className='text-gray-400 size-5 shrink-0 hover:text-gray-600 transition-colors cursor-pointer' />
        </div>

        <div className='relative' ref={addNewDropdownRef}>
          <div className='flex items-center bg-[#D32F2F] text-white rounded-[10px] overflow-hidden shadow-[0px_4px_10px_rgba(211,47,47,0.2)] hover:shadow-[0px_6px_14px_rgba(211,47,47,0.3)] transition-all'>
            <button
              onClick={() => setAddNewDropdownOpen(!addNewDropdownOpen)}
              className='px-5 py-2.5 text-[14px] font-bold hover:bg-[#B71C1C] active:bg-[#991B1B] transition-colors flex items-center gap-2'
            >
              <Plus size={16} strokeWidth={2.5} /> Thêm mới
            </button>
          </div>

          {addNewDropdownOpen && (
            <div className='absolute right-0 mt-2 w-52 bg-white border border-gray-100 rounded-[10px] shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150'>
              <button
                onClick={handleOpenAddIngredient}
                className='w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-[#fef2f2] hover:text-[#D32F2F] transition-colors flex items-center gap-2 font-medium'
              >
                <Plus size={14} /> Thêm nguyên liệu
              </button>
              <button
                onClick={handleOpenAddProductIngredient}
                className='w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-[#fef2f2] hover:text-[#D32F2F] transition-colors flex items-center gap-2 font-medium'
              >
                <Plus size={14} /> Thêm công thức
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='flex flex-grow w-full'>
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-4 shrink-0'>
          <span className='text-[13px] font-bold text-gray-500 uppercase tracking-wide'>Danh mục</span>
          <div className='flex flex-col gap-1'>
            <button
              onClick={() => setActiveTab('ingredient')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'ingredient'
                  ? 'bg-[#eef2ff] text-[#4c51bf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Package size={17} className={activeTab === 'ingredient' ? 'text-[#4c51bf]' : 'text-gray-400'} />
              Nguyên liệu
            </button>

            <button
              onClick={() => setActiveTab('recipe')}
              className={`flex items-center gap-3 px-4 py-3 rounded-[10px] text-[13.5px] font-semibold transition-all ${
                activeTab === 'recipe'
                  ? 'bg-[#eef2ff] text-[#4c51bf]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <BookOpen size={17} className={activeTab === 'recipe' ? 'text-[#4c51bf]' : 'text-gray-400'} />
              Công thức
            </button>
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='mt-auto flex items-center justify-center gap-2 border border-dashed border-[#D32F2F] hover:bg-[#fef2f2] text-[#D32F2F] text-[13px] font-bold py-2.5 rounded-[8px] transition-colors'
            >
              <RotateCcw size={14} /> Xoá tìm kiếm
            </button>
          )}
        </div>

        <div className='flex-grow p-8 overflow-x-auto'>
          {activeTab === 'ingredient' && (
            loadingIngredients ? (
              <LoadingSkeleton />
            ) : filteredIngredients.length > 0 ? (
              <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden min-w-[700px]'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40'>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Mã nguyên liệu</th>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Tên nguyên liệu</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center'>Đơn vị tính</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-right'>Giá ước tính</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center'>Trạng thái</th>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Ngày tạo</th>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Cập nhật</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {filteredIngredients.map((item) => (
                      <tr key={item.id} className='hover:bg-[#fcfdfe] transition-colors group'>
                        <td className='py-4 px-6 text-[13.5px] text-gray-500 font-medium'>{item.id}</td>
                        <td className='py-4 px-6 text-[14px] text-gray-900 font-bold'>{item.name}</td>
                        <td className='py-4 px-6 text-center'>
                          <span className='inline-block bg-[#f3f4f6] text-gray-600 text-[12.5px] px-3.5 py-1 rounded-full font-bold border border-gray-200/40'>
                            {item.unit ?? '—'}
                          </span>
                        </td>
                        <td className='py-4 px-6 text-right text-[14px] text-gray-900 font-bold'>
                          {item.estimatedPrice != null
                            ? item.estimatedPrice.toLocaleString('vi-VN') + ' đ'
                            : '—'}
                        </td>
                        <td className='py-4 px-6 text-center'>
                          <span
                            className={`inline-block text-[12px] px-3 py-1 rounded-full font-bold border ${
                              item.isDeleted
                                ? 'bg-red-50 text-red-500 border-red-200/60'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
                            }`}
                          >
                            {item.isDeleted ? 'Đã xoá' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className='py-4 px-6 text-[13px] text-gray-500'>{formatDate(item.createdAt)}</td>
                        <td className='py-4 px-6 text-[13px] text-gray-500'>{formatDate(item.updatedAt)}</td>
                        <td className='py-4 px-6 text-center'>
                          <div className='flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <button
                              onClick={(e) => handleOpenEditIngredient(item, e)}
                              className='p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors'
                              title='Sửa'
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteIngredient(item.id, e)}
                              className='p-1.5 text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors'
                              title='Xoá'
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<Package size={48} className='text-gray-300 mb-4 stroke-[1.5]' />}
                title='Không tìm thấy nguyên liệu nào'
                subtitle='Hãy thêm nguyên liệu mới hoặc thay đổi từ khoá tìm kiếm.'
                onReset={() => setSearchQuery('')}
              />
            )
          )}

          {activeTab === 'recipe' && (
            loadingRecipes ? (
              <LoadingSkeleton />
            ) : filteredRecipes.length > 0 ? (
              <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden min-w-[700px]'>
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40'>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Mã sản phẩm</th>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Mã nguyên liệu</th>
                      <th className='py-4 px-6 font-semibold tracking-wide'>Tên nguyên liệu</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center'>Đơn vị tính</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-right'>Số lượng</th>
                      <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100'>
                    {filteredRecipes.map((pi, idx) => (
                      <tr key={`${pi.productId}-${pi.ingredientId}-${idx}`} className='hover:bg-[#fcfdfe] transition-colors group'>
                        <td className='py-4 px-6 text-[13.5px] text-gray-500 font-medium'>{pi.productId}</td>
                        <td className='py-4 px-6 text-[13.5px] text-gray-500 font-medium'>{pi.ingredientId}</td>
                        <td className='py-4 px-6 text-[14px] text-gray-900 font-bold'>{pi.ingredientName}</td>
                        <td className='py-4 px-6 text-center'>
                          <span className='inline-block bg-[#f3f4f6] text-gray-600 text-[12.5px] px-3.5 py-1 rounded-full font-bold border border-gray-200/40'>
                            {pi.unit ?? '—'}
                          </span>
                        </td>
                        <td className='py-4 px-6 text-right text-[14px] text-gray-900 font-bold'>
                          {pi.quantity}
                        </td>
                        <td className='py-4 px-6 text-center'>
                          <div className='flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                            <button
                              className='p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors'
                              title='Sửa'
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className='p-1.5 text-gray-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors'
                              title='Xoá'
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<FlaskConical size={48} className='text-gray-300 mb-4 stroke-[1.5]' />}
                title='Không tìm thấy công thức nào'
                subtitle='Hãy thêm công thức mới hoặc thay đổi từ khoá tìm kiếm.'
                onReset={() => setSearchQuery('')}
              />
            )
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[16px] font-bold text-gray-900 flex items-center gap-2'>
                <ShoppingBag className='text-[#D32F2F] size-5' />
                {modalTitle}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className='p-6 flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>
                  Tên {itemLabel} <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='Ví dụ: Bột mì, Phô mai...'
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-none focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Đơn vị tính</label>
                  <input
                    type='text'
                    placeholder='Ví dụ: kg, lít...'
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-none focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                  />
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Giá ước tính (đ)</label>
                  <input
                    type='text'
                    placeholder='0'
                    value={formPrice}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '')
                      setFormPrice(clean === '' ? '' : parseInt(clean).toLocaleString('vi-VN'))
                    }}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-none focus:border-[#D32F2F] transition-all font-medium text-gray-800 text-right'
                  />
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={closeModal}
                  className='px-8 py-2 border-2 border-[#D32F2F] text-[#D32F2F] text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-sm'
                >
                  {isEditing ? 'Lưu thay đổi' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden p-6 space-y-3'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='h-10 bg-gray-100 rounded-lg animate-pulse' style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  )
}

function EmptyState({
  icon,
  title,
  subtitle,
  onReset,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onReset: () => void
}) {
  return (
    <div className='flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'>
      {icon}
      <p className='text-gray-500 font-bold text-[15px] mb-2'>{title}</p>
      <p className='text-gray-400 text-[13px] mb-4 text-center max-w-xs'>{subtitle}</p>
      <button
        onClick={onReset}
        className='px-4 py-2 bg-[#D32F2F] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#B71C1C] transition-colors shadow-sm'
      >
        Đặt lại bộ lọc
      </button>
    </div>
  )
}