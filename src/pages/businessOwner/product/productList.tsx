import { useState, useMemo, useRef, useEffect, type ChangeEvent } from 'react'
import { Search, Plus, ChevronDown, Scan, X, Trash2, Edit2, ShoppingBag, RotateCcw, ImagePlus, Package, AlertTriangle, Lock, Unlock } from 'lucide-react'
import type { Product, ProductForm } from '../../../types/product.type'
import { createProduct, deleteProduct, getAllProducts, toggleProductStatus, updateProduct } from '../../../apis/product.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import { uploadImage } from '../../../apis/image.api'
import type { ProductCategory } from '../../../types/product.category.type'
import { getProductCategories, createProductCategory } from '../../../apis/product.category.api'
import ProductModal from './productModal'
import CategoryModal from './categoryModal'
import { toast } from 'react-toastify'
import { createProductPrice } from '../../../apis/product.price.api'

export default function Product() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Active' | 'Inactive'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [addNewDropdownOpen, setAddNewDropdownOpen] = useState(false)

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false)
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isToggleStatusModalOpen, setIsToggleStatusModalOpen] = useState(false)

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false)
  const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false)

  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  const addNewDropdownRef = useRef<HTMLDivElement>(null)

  const isProduct = isAddProductModalOpen || isEditProductModalOpen
  const isService = isAddServiceModalOpen || isEditServiceModalOpen
  const isModalOpen = isProduct || isService

  const isEditing = isEditProductModalOpen || isEditServiceModalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: ''
  })

  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    productCategoryId: '',
    unit: '',
    price: '',
    description: ''
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  const fetchCategories = async () => {
    if (!businessId) {
      console.error('Missing businessId')
      return
    }

    try {
      const res = await getProductCategories(businessId)
      setCategories(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchProducts = async () => {
    if (!businessId) {
      console.error('Missing businessId')
      return
    }

    try {
      const res = await getAllProducts(businessId)
      setProducts(res.data.items)
      console.log(res)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    if (!businessId) return

    fetchProducts()
    fetchCategories()
  }, [businessId])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || product.productCategoryId === selectedCategory
      const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, selectedCategory, selectedStatus])

  const handleOpenAddProductModal = () => {
    setProductForm({
      name: '',
      productCategoryId: '',
      unit: '',
      price: '',
      description: '',
      imageFile: undefined,
      imagePreview: undefined
    })
    setIsAddProductModalOpen(true)
    setAddNewDropdownOpen(false)
  }

  const handleOpenAddServiceModal = () => {
    setProductForm({
      name: '',
      productCategoryId: '',
      unit: '',
      price: '',
      description: '',
      imageFile: undefined,
      imagePreview: undefined
    })
    setIsAddServiceModalOpen(true)
    setAddNewDropdownOpen(false)
  }

  const closeModal = () => {
    setIsAddProductModalOpen(false)
    setIsEditProductModalOpen(false)

    setIsAddServiceModalOpen(false)
    setIsEditServiceModalOpen(false)

    setSelectedProduct(null)
  }

  const handleOpenEditModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    console.log('Editing product:', product)
    setSelectedProduct(product)
    setProductForm({
      name: product.name,
      productCategoryId: product.productCategoryId ?? '',
      unit: product.unit ?? '',
      price: product.currentPrice?.toLocaleString('vi-VN') ?? '',
      description: product.description ?? '',
      imagePreview: product.imageUrl ?? undefined
    })

    setIsEditProductModalOpen(true)
  }

  const handleImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProductForm(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    }))
  }

  const handleAddCategory = async () => {
    if (!businessId) return
    if (!categoryForm.name.trim()) return

    try {
      const res = await createProductCategory(businessId, {
        name: categoryForm.name.trim(),
        description: categoryForm.description,
        sortOrder: categories.length + 1
      })

      setCategories((prev) => [...prev, res.data])
      setProductForm(prev => ({ ...prev, productCategoryId: res.data.id }))

      setCategoryForm({ name: '', description: '' })
      setIsCreateCategoryModalOpen(false)

      toast.success('Tạo danh mục thành công')
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message ?? 'Có lỗi xảy ra')
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productForm.name.trim()) return

    const priceNum = productForm.price.trim()
      ? Number(productForm.price.replace(/\./g, ''))
      : null

    if (priceNum !== null && isNaN(priceNum)) {
      toast.error('Giá bán không hợp lệ')
      return
    }

    if (!businessId) {
      console.error('Missing businessId')
      return
    }

    try {
      let imageUrl: string | undefined

      if (productForm.imageFile) {
        imageUrl = await uploadImage(productForm.imageFile)
      }

      const body = {
        name: productForm.name.trim(),
        productCategoryId: productForm.productCategoryId || undefined,
        description: productForm.description || undefined,
        unit: productForm.unit || undefined,
        imageUrl
      }

      const res = await createProduct(businessId, body)
      
      if (priceNum !== null) {
        try {
          await createProductPrice(res.data.id, {
            price: priceNum,
            applyDate: new Date().toISOString()
          })
        } catch (priceError) {
          try {
            await deleteProduct(res.data.id)
          } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError)
          }
          throw priceError
        }
      }

      await fetchProducts()
      closeModal()
      toast.success('Tạo sản phẩm thành công.')
    } catch (err) {
      console.error(err)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) return

    const priceNum = productForm.price.trim()
      ? Number(productForm.price.replace(/\./g, ''))
      : null

    if (priceNum !== null && isNaN(priceNum)) {
      toast.error('Giá bán không hợp lệ')
      return
    }

    try {
      let imageUrl = selectedProduct.imageUrl

      if (productForm.imageFile) {
        imageUrl = await uploadImage(productForm.imageFile)
      }

      await updateProduct(selectedProduct.id, {
        name: productForm.name.trim(),
        productCategoryId: productForm.productCategoryId || undefined,
        description: productForm.description || undefined,
        unit: productForm.unit || undefined,
        imageUrl
      })

      const hasPriceChanged = priceNum !== null && priceNum !== (selectedProduct.currentPrice ?? null)

      if (hasPriceChanged) {
        await createProductPrice(selectedProduct.id, {
          price: priceNum,
          applyDate: new Date().toISOString()
        })
      }

      await fetchProducts()
      closeModal()
      toast.success('Cập nhật sản phẩm thành công.')
    } catch (err: any) {
      console.error(err)
      toast.error(
        err?.response?.data?.message ?? 'Không thể cập nhật sản phẩm.'
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (isEditing) {
      handleEditProduct(e)
    } else {
      handleAddProduct(e)
    }
  }

  const handleOpenDeleteModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProduct(product)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return

    try {
      await deleteProduct(selectedProduct.id)
      await fetchProducts()
      toast.success('Xóa sản phẩm thành công.')
    } catch (err) {
      console.error(err)
      toast.error('Không thể xóa sản phẩm.')
    } finally {
      setSelectedProduct(null)
      setIsDeleteModalOpen(false)
    }
  }

  const handleOpenToggleStatusModal = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProduct(product)
    setIsToggleStatusModalOpen(true)
  }

  const handleToggleStatus = async () => {
    if (!selectedProduct) return

    try {
      await toggleProductStatus(selectedProduct.id)
      await fetchProducts()

      toast.success(
        selectedProduct.status === 'Active'
          ? 'Đã ngừng kinh doanh sản phẩm.'
          : 'Đã kích hoạt sản phẩm.'
      )
    } catch (err) {
      console.error(err)
      toast.error('Không thể cập nhật trạng thái.')
    } finally {
      setSelectedProduct(null)
      setIsToggleStatusModalOpen(false)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
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
              <button
                type='button'
                onClick={() => setIsCreateCategoryModalOpen(true)}
                className='text-[12px] font-bold text-[#4c51bf] hover:text-[#3c3f9a] hover:underline'
              >
                Tạo mới
              </button>
            </div>
            <button
              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
              className='w-full border border-gray-300 hover:border-gray-400 rounded-[10px] px-3.5 py-2.5 bg-white text-[13.5px] text-gray-700 flex items-center justify-between shadow-xs transition-all focus:border-[#D32F2F]'
            >
              <span>
                {selectedCategory === 'all'
                  ? 'Tất cả danh mục'
                  : categories.find(c => c.id === selectedCategory)?.name}
              </span>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {categoryDropdownOpen && (
              <div className='absolute left-0 right-0 top-18.5 bg-white border border-gray-100 rounded-[10px] shadow-lg py-1 z-40 max-h-60 overflow-y-auto animate-in fade-in duration-100'>
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setCategoryDropdownOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#fef2f2]
                  ${
                    selectedCategory === 'all'
                      ? 'text-[#D32F2F] font-semibold bg-[#fef2f2]'
                      : 'text-gray-700'
                  }`}
                >
                  Tất cả danh mục
                </button>

                {categories.length === 0 ? (
                  <div className='px-4 py-6 text-center text-sm text-gray-400'>
                    Chưa có danh mục nào
                  </div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setCategoryDropdownOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#fef2f2]
                      ${
                        selectedCategory === category.id
                          ? 'text-[#D32F2F] font-semibold bg-[#fef2f2]'
                          : 'text-gray-700'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className='flex flex-col gap-3'>
            <span className='text-[13px] font-bold text-gray-500'>Trạng thái</span>
            <div className='flex flex-col gap-3.5'>
              {[
                { val: 'all', label: 'Tất cả' },
                { val: 'Active', label: 'Đang kinh doanh' },
                { val: 'Inactive', label: 'Ngừng kinh doanh' }
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

          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all') && (
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
            <div className='bg-white rounded-[12px] border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden min-w-175'>
              <table className='w-full text-left border-collapse'>
                <thead>
                  <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13.5px] font-bold border-b border-[#cbd5e1]/40'>
                    <th className='w-32 px-6 py-4'>Hình ảnh</th>
                    <th className='w-48 px-6 py-4'>Tên sản phẩm</th>
                    <th className='w-48 px-6 py-4'>Danh mục</th>
                    <th className='w-28 px-6 py-4 text-center'>Đơn vị tính</th>
                    <th className='w-40 px-6 py-4 text-right'>Giá bán</th>
                    <th className='w-32 px-6 py-4 text-center'>Ngày tạo</th>
                    <th className='w-36 px-6 py-4 text-center'>Thao tác</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {filteredProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      className='hover:bg-[#fcfdfe] transition-colors group'
                    >
                      <td className='py-3 px-6'>
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className='size-20 rounded-xl object-cover border border-gray-200'
                          />
                        ) : (
                          <div className='size-20 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center'>
                            <Package
                              size={24}
                              className='text-blue-500'
                            />
                          </div>
                        )}
                      </td>
                      <td className='py-4 px-6 text-[14px] text-gray-900 font-bold'>
                        {product.name}
                      </td>
                      <td className='py-4 px-6 text-[13.5px] text-gray-600 font-medium'>
                        {categories.find(c => c.id === product.productCategoryId)?.name ?? 'N/A'}
                      </td>
                      <td className='py-4 px-6 text-center'>
                        <span className='inline-block bg-[#f3f4f6] text-gray-600 text-[12.5px] px-3.5 py-1 rounded-full font-bold border border-gray-200/40'>
                          {product.unit ?? 'N/A'}
                        </span>
                      </td>
                      <td className='py-4 px-6 text-right text-[14.5px] font-bold text-gray-900 whitespace-nowrap'>
                        {
                          product.currentPrice != null
                            ? product.currentPrice.toLocaleString('vi-VN')
                            : 'N/A'
                        }
                      </td>
                      <td className='py-4 px-6 text-center text-[13.5px] text-gray-600 font-medium'>
                        {new Date(product.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className='py-4 px-6 text-center'>
                        <div className='flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity'>
                          <button
                            onClick={(e) => handleOpenEditModal(product, e)}
                            className='p-1.5 text-gray-500 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                            title='Sửa'
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={(e) => handleOpenToggleStatusModal(product, e)}
                            className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                              product.status === 'Active'
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={
                              product.status === 'Active'
                                ? 'Ngừng kinh doanh'
                                : 'Kích hoạt'
                            }
                          >
                            {product.status === 'Active' ? (
                              <Lock size={15} />
                            ) : (
                              <Unlock size={15} />
                            )}
                          </button>

                          <button
                            onClick={(e) => handleOpenDeleteModal(product, e)}
                            className='p-1.5 text-gray-500 hover:text-[#D32F2F] hover:bg-red-50 rounded-md transition-colors cursor-pointer'
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

      <ProductModal
        open={isModalOpen}
        closeModal={closeModal}
        handleSubmit={handleSubmit}
        productForm={productForm}
        setProductForm={setProductForm}
        categories={categories}
        handleImage={handleImage}
        isEditing={isEditing}
        isProduct={isProduct}
        isSubmitting={isSubmitting}
      />

      <CategoryModal
        open={isCreateCategoryModalOpen}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        handleAddCategory={handleAddCategory}
        closeModal={() => setIsCreateCategoryModalOpen(false)}
        isSubmitting={isSubmitting}
      />

      {isDeleteModalOpen && (
        <div className='fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center gap-2 px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <AlertTriangle className='text-[#D32F2F] size-5' />
              <h3 className='text-[16px] font-bold text-gray-900'>
                Xác nhận xóa
              </h3>
            </div>

            <div className='px-8 py-6'>
              <p className='text-[14px] text-gray-700 leading-6'>
                Bạn có chắc chắn muốn xóa{' '}
                <span className='font-bold text-gray-900'>
                  "{selectedProduct?.name}"
                </span>
                ?
              </p>

              <p className='mt-2 text-[13px] text-gray-500'>
                Hành động này không thể hoàn tác.
              </p>
            </div>

            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white'>
              <button
                type='button'
                onClick={() => {
                  setSelectedProduct(null)
                  setIsDeleteModalOpen(false)
                }}
                className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors'
              >
                Hủy
              </button>

              <button
                type='button'
                onClick={handleDeleteProduct}
                className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs'
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {isToggleStatusModalOpen && (
        <div className='fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>

            <div className='flex items-center gap-2 px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <AlertTriangle className='text-[#D32F2F] size-5' />
              <h3 className='text-[16px] font-bold text-gray-900'>
                Xác nhận
              </h3>
            </div>

            <div className='px-8 py-6'>
              <p className='text-[14px] text-gray-700 leading-6'>
                {selectedProduct?.status === 'Active'
                  ? <>Bạn có chắc muốn <span className='font-bold text-[#D32F2F]'>ngừng kinh doanh</span> sản phẩm <span className='font-bold'>"{selectedProduct?.name}"</span>?</>
                  : <>Bạn có chắc muốn <span className='font-bold text-green-600'>kích hoạt</span> sản phẩm <span className='font-bold'>"{selectedProduct?.name}"</span>?</>}
              </p>
            </div>

            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white'>
              <button
                type='button'
                onClick={() => {
                  setSelectedProduct(null)
                  setIsToggleStatusModalOpen(false)
                }}
                className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors'
              >
                Hủy
              </button>

              <button
                type='button'
                onClick={handleToggleStatus}
                className='px-5 py-2 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B]'
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}