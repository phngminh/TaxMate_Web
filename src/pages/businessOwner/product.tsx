import { useState, useMemo, useRef, useEffect, type ChangeEvent } from 'react'
import { Search, Plus, ChevronDown, Scan, X, Trash2, Edit2, ShoppingBag, RotateCcw, ImagePlus } from 'lucide-react'
import type { Product } from '../../types/product.type'

const INITIAL_PRODUCTS: Product[] = [
  { id: 'SP000001', name: 'Pizza', category: 'Fast food', productCategory: 'Ăn uống', unit: 'Cái', currentPrice: 55000, status: 'active', description: 'Pizza hải sản với phô mai Mozzarella' },
  { id: 'SP000002', name: 'Hamburger', category: 'Fast food', productCategory: 'Ăn uống', unit: 'Cái', currentPrice: 35000, status: 'active', description: 'Hamburger thịt bò nướng' },
  { id: 'SP000003', name: 'Coca', category: 'Fast food', productCategory: 'Ăn uống', unit: 'Lon', currentPrice: 20000, status: 'active', description: 'Nước ngọt Coca-Cola' }
]

const CATEGORIES = ['Fast food', 'Món chính', 'Tráng miệng', 'Đồ uống']
const MAIN_CATEGORIES = ['Ăn uống', 'Dịch vụ']
const PRODUCT_UNITS = [ 'Cái', 'Chiếc', 'Đĩa', 'Bát', 'Ly', 'Lon', 'Chai' ]
const SERVICE_UNITS = [ 'Giờ', 'Buổi', 'Ngày', 'Tuần', 'Tháng', 'Lần' ]

export default function Product() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMainCategory, setSelectedMainCategory] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false)

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Product | null>(null)

  const typeDropdownRef = useRef<HTMLDivElement>(null)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const addNewDropdownRef = useRef<HTMLDivElement>(null)

  const isProduct = isAddProductModalOpen || isEditProductModalOpen
  const isService = isAddServiceModalOpen || isEditServiceModalOpen
  const isModalOpen = isProduct || isService

  const isEditing = isEditProductModalOpen || isEditServiceModalOpen

  const modalTitle = isEditing
  ? isProduct
    ? 'Chỉnh sửa sản phẩm'
    : 'Chỉnh sửa dịch vụ'
  : isProduct
    ? 'Thêm sản phẩm mới'
    : 'Thêm dịch vụ mới'

  const itemLabel = isProduct ? 'sản phẩm' : 'dịch vụ'

  const units = isProduct
    ? PRODUCT_UNITS
    : SERVICE_UNITS

  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState(CATEGORIES[0])
  const [formMainCategory, setFormMainCategory] = useState(MAIN_CATEGORIES[0])
  const [formUnit, setFormUnit] = useState(units[0])
  const [formPrice, setFormPrice] = useState('')
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active')
  const [formDescription, setFormDescription] = useState('')
  const [imagePreview, setImagePreview] = useState<string>()
  const [imageFile, setImageFile] = useState<File>()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setTypeDropdownOpen(false)
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false)
      }
      if (addNewDropdownRef.current && !addNewDropdownRef.current.contains(event.target as Node)) {
        setAddNewDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMainCategory = selectedMainCategory === 'all' || product.productCategory === selectedMainCategory
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus

      return matchesSearch && matchesMainCategory && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, selectedMainCategory, selectedCategory, selectedStatus])

  const handleOpenAddProductModal = () => {
    setFormName('')
    setFormCategory(CATEGORIES[0])
    setFormMainCategory(MAIN_CATEGORIES[0])
    setFormUnit(PRODUCT_UNITS[0])
    setFormPrice('')
    setFormDescription('')
    setImageFile(undefined)
    setImagePreview(undefined)
    setIsAddProductModalOpen(true)
    setAddNewDropdownOpen(false)
  }

  const handleOpenAddServiceModal = () => {
    setFormName('')
    setFormCategory(CATEGORIES[0])
    setFormMainCategory(MAIN_CATEGORIES[0])
    setFormUnit(SERVICE_UNITS[0])
    setFormPrice('')
    setFormDescription('')
    setImageFile(undefined)
    setImagePreview(undefined)
    setIsAddServiceModalOpen(true)
    setAddNewDropdownOpen(false)
  }

  const closeModal = () => {
    setIsAddProductModalOpen(false)
    setIsEditProductModalOpen(false)

    setIsAddServiceModalOpen(false)
    setIsEditServiceModalOpen(false)

    setEditingProduct(null)
    setEditingService(null)
  }

  const handleOpenEditModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Editing product:', product)
    setEditingProduct(product)
    setFormName(product.name)
    setFormCategory(product.category)
    setFormMainCategory(product.productCategory || '')
    setFormUnit(product.unit || '')
    setFormPrice(product.currentPrice?.toString() || '')
    setFormStatus(product.status)
    setFormDescription(product.description || '')
    setIsEditProductModalOpen(true)
  }

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formPrice.trim()) return

    const priceNum = Number(formPrice.replace(/\./g, ''))
    if (isNaN(priceNum)) return

    const nextNum = products.length > 0 
      ? Math.max(...products.map(p => parseInt(p.id.replace('SP', '')))) + 1 
      : 1
    const newId = `SP${nextNum.toString().padStart(6, '0')}`

    const newProduct: Product = {
      id: newId,
      name: formName,
      productCategory: formMainCategory,
      category: formCategory,
      unit: formUnit,
      currentPrice: priceNum,
      status: formStatus,
      description: formDescription
    }

    setProducts([newProduct, ...products])
    setIsAddProductModalOpen(false)
  }

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const editingItem = editingProduct ?? editingService
    if (!editingItem || !formName.trim() || !formPrice.trim()) return

    const priceNum = parseFloat(formPrice.replace(/,/g, ''))
    if (isNaN(priceNum)) return

    const updatedProducts = products.map((p) => {
      if (p.id === editingItem.id) {
        return {
          ...p,
          name: formName,
          mainCategory: formMainCategory,
          category: formCategory,
          unit: formUnit,
          price: priceNum,
          status: formStatus,
          description: formDescription
        }
      }
      return p
    })

    setProducts(updatedProducts)
    setIsEditProductModalOpen(false)
    setEditingProduct(null)
    setEditingService(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (isEditing) {
      handleEditProduct(e)
    } else {
      handleAddProduct(e)
    }
  }

  const handleDeleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Bạn có chắc chắn muốn xoá sản phẩm ${id}?`)) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedMainCategory('all')
    setSelectedCategory('all')
    setSelectedStatus('all')
  }

  return (
    <div className='flex flex-col bg-[#f8f9fa] min-h-[calc(100vh-51px)] w-full'>
      <div className='flex items-center justify-between px-8 py-4 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='ml-96 flex-1 max-w-4xl flex items-center bg-white border border-gray-300 rounded-lg px-5 py-2.5 shadow-xs focus-within:border-[#D32F2F] focus-within:ring-1 focus-within:ring-[#D32F2F]/20 transition-all'>
          <Scan className='text-[#D32F2F] mr-3 size-5 shrink-0 stroke-2' />
          <input
            type='text'
            placeholder='Tìm kiếm thông minh..'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='grow bg-transparent outline-hidden text-[14px] text-gray-800 placeholder-gray-400 font-medium'
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
            <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-[10px] shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150'>
              <button
                onClick={handleOpenAddProductModal}
                className='w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-[#fef2f2] hover:text-[#D32F2F] transition-colors flex items-center gap-2 font-medium'
              >
                <Plus size={14} /> Thêm sản phẩm
              </button>
              <button
                onClick={handleOpenAddServiceModal}
                className='w-full text-left px-4 py-2.5 text-[13px] text-gray-700 hover:bg-[#fef2f2] hover:text-[#D32F2F] transition-colors flex items-center gap-2 font-medium'
              >
                <Plus size={14} /> Thêm dịch vụ
              </button>
            </div>
          )}
        </div>
      </div>

      <div className='flex grow w-full'>
        <div className='w-72 bg-white border-r border-[#ffe5e5] p-6 flex flex-col gap-6 shrink-0'>
          <div className='flex flex-col gap-2 relative' ref={categoryDropdownRef}>
            <div className='flex justify-between items-center'>
              <span className='text-[13px] font-bold text-gray-500'>Danh mục sản phẩm</span>
              <span 
                onClick={() => alert('Chức năng tạo mới danh mục')}
                className='text-[12px] font-bold text-[#4c51bf] hover:text-[#3c3f9a] cursor-pointer hover:underline'
              >
                Tạo mới
              </span>
            </div>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className='w-full border border-gray-300 hover:border-gray-400 rounded-[10px] px-3.5 py-2.5 bg-white text-[13.5px] text-gray-700 flex items-center justify-between shadow-xs transition-all focus:border-[#D32F2F]'
            >
              <span>
                {selectedCategory === 'all' ? 'Chọn danh mục sản phẩm' : selectedCategory}
              </span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryDropdownOpen && (
              <div className='absolute left-0 right-0 top-[74px] bg-white border border-gray-100 rounded-[10px] shadow-lg py-1 z-40 max-h-60 overflow-y-auto animate-in fade-in duration-100'>
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setCategoryDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#fef2f2] hover:text-[#D32F2F] transition-colors ${selectedCategory === 'all' ? 'text-[#D32F2F] font-semibold bg-[#fef2f2]/50' : 'text-gray-700'}`}
                >
                  Tất cả danh mục
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setSelectedCategory(c)
                      setCategoryDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#fef2f2] hover:text-[#D32F2F] transition-colors ${selectedCategory === c ? 'text-[#D32F2F] font-semibold bg-[#fef2f2]/50' : 'text-gray-700'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Trạng thái</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'active', label: 'Đang kinh doanh' },
                { val: 'inactive', label: 'Ngừng kinh doanh' }
              ].map((opt) => (
                <label key={opt.val} className='flex items-center gap-3 cursor-pointer group text-[13.5px] text-gray-700 select-none'>
                  <div className='relative flex items-center justify-center shrink-0'>
                    <input
                      type='radio'
                      name='statusFilter'
                      checked={selectedStatus === opt.val}
                      onChange={() => setSelectedStatus(opt.val as any)}
                      className='sr-only'
                    />
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedStatus === opt.val
                        ? 'border-[#D32F2F] bg-white'
                        : 'border-gray-300 group-hover:border-gray-400 bg-white'
                    }`}>
                      {selectedStatus === opt.val && (
                        <div className='size-2.5 rounded-full bg-[#D32F2F] scale-100 transition-all' />
                      )}
                    </div>
                  </div>
                  <span className={`${selectedStatus === opt.val ? 'font-bold text-[#D32F2F]' : 'text-gray-600 group-hover:text-gray-900 font-medium'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {(searchQuery || selectedMainCategory !== 'all' || selectedCategory !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={handleResetFilters}
              className='mt-auto flex items-center justify-center gap-2 border border-dashed border-[#D32F2F] hover:bg-[#fef2f2] text-[#D32F2F] text-[13px] font-bold py-2.5 rounded-[8px] transition-colors'
            >
              <RotateCcw size={14} /> Xoá bộ lọc
            </button>
          )}
        </div>

        <div className='grow p-8 overflow-x-auto'>
          {filteredProducts.length > 0 ? (
            <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden min-w-[700px]'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40'>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Mã sản phẩm</th>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Tên sản phẩm</th>
                    <th className='py-4 px-6 font-semibold tracking-wide'>Danh mục</th>
                    <th className='py-4 px-6 font-semibold tracking-wide text-center'>Đơn vị tính</th>
                    <th className='py-4 px-6 font-semibold tracking-wide text-right'>Giá bán</th>
                    <th className='py-4 px-6 font-semibold tracking-wide text-center w-28'>Thao tác</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className='hover:bg-[#fcfdfe] transition-colors group'
                    >
                      <td className='py-4 px-6 text-[13.5px] text-gray-500 font-medium'>
                        {product.id}
                      </td>
                      <td className='py-4 px-6 text-[14px] text-gray-900 font-bold'>
                        {product.name}
                      </td>
                      <td className='py-4 px-6 text-[13.5px] text-gray-600 font-medium'>
                        {product.category}
                      </td>
                      <td className='py-4 px-6 text-center'>
                        <span className='inline-block bg-[#f3f4f6] text-gray-600 text-[12.5px] px-3.5 py-1 rounded-full font-bold border border-gray-200/40'>
                          {product.unit}
                        </span>
                      </td>
                      <td className='py-4 px-6 text-right text-[14.5px] text-gray-900 font-bold'>
                        {product.currentPrice?.toLocaleString('vi-VN')}
                      </td>
                      <td className='py-4 px-6 text-center'>
                        <div className='flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity'>
                          <button
                            onClick={(e) => handleOpenEditModal(product, e)}
                            className='p-1.5 text-gray-500 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors'
                            title='Sửa'
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProduct(product.id, e)}
                            className='p-1.5 text-gray-500 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors'
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
            <div className='flex flex-col items-center justify-center py-20 px-4 bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'>
              <ShoppingBag size={48} className='text-gray-300 mb-4 stroke-[1.5]' />
              <p className='text-gray-500 font-bold text-[15px] mb-2'>Không tìm thấy sản phẩm nào</p>
              <p className='text-gray-400 text-[13px] mb-4 text-center max-w-xs'>Hãy thử đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc hiện tại của bạn.</p>
              <button
                onClick={handleResetFilters}
                className='px-4 py-2 bg-[#D32F2F] text-white text-[13px] font-bold rounded-[8px] hover:bg-[#B71C1C] transition-colors shadow-xs'
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-xl w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <h3 className='text-[16px] font-bold text-gray-900 flex items-center gap-2'>
                <ShoppingBag className='text-[#D32F2F] size-5' />
                {modalTitle}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className='p-6 flex flex-col gap-4.5'>
              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Tên {itemLabel} <span className='text-red-500'>*</span></label>
                <input
                  type='text'
                  required
                  placeholder={
                    isProduct
                      ? 'Ví dụ: Pepsi, Pizza hải sản...'
                      : 'Ví dụ: Dịch vụ giao hàng...'
                  }
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 mb-5'
                />
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Mô tả {itemLabel}</label>
                <input
                  type='text'
                  required
                  placeholder={
                    isProduct
                      ? 'Ví dụ: Pizza hải sản với phô mai Mozzarella.'
                      : 'Ví dụ: Dịch vụ giao hàng...'
                  }
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 mb-5'
                />
              </div>

              <div className='grid grid-cols-2 gap-4 mb-5'>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Danh mục</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className='w-full border border-gray-200 bg-white rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Đơn vị tính</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className='w-full border border-gray-200 bg-white rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className='flex flex-col gap-1.5'>
                <label className='text-[13px] font-bold text-gray-600'>Giá bán (đ) <span className='text-red-500'>*</span></label>
                <input
                  type='text'
                  required
                  placeholder='0'
                  value={formPrice}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '')

                    console.log({
                      raw: e.target.value,
                      clean,
                      parsed: parseInt(clean)
                    })

                    if (clean === '') {
                      setFormPrice('')
                    } else {
                      setFormPrice(parseInt(clean).toLocaleString('vi-VN'))
                    }
                  }}
                  className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 text-right mb-5'
                />
              </div>

              <div className='flex flex-col gap-2'>
                <label className='text-[13px] font-bold text-gray-600'>Hình ảnh {itemLabel}</label>
                <label
                  htmlFor='product-image'
                  className='border-2 border-dashed border-gray-300 rounded-xl h-44 flex flex-col items-center justify-center cursor-pointer hover:border-[#D32F2F] transition'
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
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

              <div className='flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => {
                    closeModal()
                  }}
                  className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors'
                >
                  Hủy
                </button>
                <button
                  type='submit'
                  className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs'
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