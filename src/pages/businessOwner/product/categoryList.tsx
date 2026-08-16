import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Trash2,
  Edit,
  Loader2,
  FolderTree,
  AlertTriangle,
  Search,
  Tag,
  Package,
  Layers,
  X,
  Eye,
  ArrowRight,
  PackageOpen
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useBusiness } from '../../../contexts/BusinessContext'
import path from '../../../constants/path'
import {
  getProductCategories,
  createProductCategory,
  updateProductCategory,
  deleteProductCategory
} from '../../../apis/product.category.api'
import { getAllProducts } from '../../../apis/product.api'
import type {
  ProductCategory,
  CreateProductCategoryRequest,
  UpdateProductCategoryRequest
} from '../../../types/product.category.type'
import type { Product } from '../../../types/product.type'

export default function ProductCategoryList() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id

  // State dữ liệu
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // State Modal Thêm / Sửa
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
  }>({
    name: '',
    description: ''
  })

  // State Modal Xóa
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<ProductCategory | null>(null)
  const [deleteMode, setDeleteMode] = useState<'fallback' | 'force'>('fallback')
  const [fallbackCategoryId, setFallbackCategoryId] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)

  // State Modal Quick View Xem nhanh sản phẩm
  const navigate = useNavigate()
  const [quickViewCategory, setQuickViewCategory] = useState<ProductCategory | null>(null)
  const [quickViewSearch, setQuickViewSearch] = useState('')

  // Lọc sản phẩm cho Quick View
  const quickViewProducts = useMemo(() => {
    if (!quickViewCategory) return []
    let list = products.filter((p) => p.productCategoryId === quickViewCategory.id)
    if (quickViewSearch.trim()) {
      const q = quickViewSearch.toLowerCase().trim()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.productCode && p.productCode.toLowerCase().includes(q))
      )
    }
    return list
  }, [products, quickViewCategory, quickViewSearch])

  // Load danh sách danh mục & sản phẩm
  const loadData = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const [catRes, prodRes] = await Promise.all([
        getProductCategories(businessId),
        getAllProducts(businessId, 1, 1000).catch(() => ({ data: { items: [] } }))
      ])

      if (catRes.success && catRes.data) {
        setCategories(catRes.data)
      }
      if (prodRes.data?.items) {
        setProducts(prodRes.data.items)
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể tải danh sách danh mục')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [businessId])

  // Đếm số sản phẩm theo danh mục
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    products.forEach((p) => {
      if (p.productCategoryId) {
        map[p.productCategoryId] = (map[p.productCategoryId] || 0) + 1
      }
    })
    return map
  }, [products])

  // Lọc theo từ khóa tìm kiếm
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories
    const term = searchTerm.toLowerCase().trim()
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
    )
  }, [categories, searchTerm])

  // Mở modal Thêm mới
  const handleOpenAddModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      description: ''
    })
    setShowFormModal(true)
  }

  // Mở modal Sửa
  const handleOpenEditModal = (cat: ProductCategory) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      description: cat.description || ''
    })
    setShowFormModal(true)
  }

  // Lưu Thêm/Sửa
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục')
      return
    }

    try {
      setActionLoading(true)
      if (editingCategory) {
        // Cập nhật
        const body: UpdateProductCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        }
        const res = await updateProductCategory(editingCategory.id, body)
        if (res.success) {
          toast.success('Cập nhật danh mục thành công!')
          setShowFormModal(false)
          loadData()
        }
      } else {
        // Tạo mới
        const body: CreateProductCategoryRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined
        }
        const res = await createProductCategory(businessId, body)
        if (res.success) {
          toast.success('Tạo danh mục thành công!')
          setShowFormModal(false)
          loadData()
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại.')
    } finally {
      setActionLoading(false)
    }
  }

  // Mở modal Xóa
  const handleOpenDeleteModal = (cat: ProductCategory) => {
    setDeletingCategory(cat)
    setDeleteMode('fallback')
    setFallbackCategoryId('')
    setShowDeleteModal(true)
  }

  // Xác nhận Xóa
  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    const prodCount = productCountMap[deletingCategory.id] || 0

    if (prodCount > 0 && deleteMode === 'fallback' && !fallbackCategoryId) {
      toast.error('Vui lòng chọn danh mục thay thế để nhận các sản phẩm')
      return
    }

    try {
      setIsDeleting(true)
      const res = await deleteProductCategory(
        deletingCategory.id,
        prodCount > 0 && deleteMode === 'fallback' ? fallbackCategoryId : undefined,
        prodCount > 0 && deleteMode === 'force' ? true : false
      )
      if (res.success) {
        toast.success('Xóa danh mục thành công!')
        setShowDeleteModal(false)
        setDeletingCategory(null)
        loadData()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể xóa danh mục.')
    } finally {
      setIsDeleting(false)
    }
  }

  const deletingCategoryProductCount = deletingCategory
    ? productCountMap[deletingCategory.id] || 0
    : 0

  const availableFallbackCategories = deletingCategory
    ? categories.filter((c) => c.id !== deletingCategory.id)
    : []

  return (
    <div className='min-h-[calc(100vh-80px)] bg-slate-50/50 pb-16'>
      {/* Header Banner */}
      <div className='flex items-center justify-between px-8 py-5 gap-4 bg-white border-b border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'>
        <div className='flex-1'>
          <h1 className='text-[20px] font-black text-gray-900 flex items-center gap-2.5'>
            <FolderTree className='text-[#D32F2F] size-5.5' />
            Quản lý Danh mục Sản phẩm
          </h1>
          <p className='text-gray-400 text-xs mt-1 font-medium'>
            Quản lý danh sách danh mục để phân loại món/sản phẩm thuận tiện cho bán hàng POS và quản lý kho
          </p>
        </div>

        {/* Nút Thêm danh mục */}
        <div className='flex gap-3'>
          <div className='flex items-center bg-[#D32F2F] text-white rounded-[10px] overflow-hidden shadow-[0px_4px_10px_rgba(211,47,47,0.2)] hover:shadow-[0px_6px_14px_rgba(211,47,47,0.3)] transition-all'>
            <button
              onClick={handleOpenAddModal}
              className='px-5 py-2.5 text-[14px] font-bold hover:bg-[#B71C1C] active:bg-[#991B1B] transition-colors flex items-center gap-2 cursor-pointer'
            >
              <Plus size={16} strokeWidth={2.5} /> Thêm danh mục
            </button>
          </div>
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-8 pt-6 flex flex-col gap-5'>
        {/* Toolbar & Thống kê */}
        <div className='flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs'>
          {/* Ô tìm kiếm */}
          <div className='relative flex-1 min-w-[280px] max-w-md'>
            <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400' />
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Tìm kiếm danh mục theo tên hoặc mô tả...'
              className='w-full pl-9.5 pr-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 placeholder-gray-400 outline-hidden focus:border-[#D32F2F] transition-all bg-gray-50/50 focus:bg-white'
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Badge thống kê */}
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#D32F2F] rounded-lg text-xs font-bold'>
              <Tag size={14} />
              <span>{categories.length} danh mục</span>
            </div>
            <div className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold'>
              <Package size={14} />
              <span>{products.length} sản phẩm</span>
            </div>
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <div className='bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-20 text-gray-400 gap-3'>
              <Loader2 className='size-8 animate-spin text-[#D32F2F]' />
              <span className='text-xs font-bold'>Đang tải danh sách danh mục...</span>
            </div>
          ) : (
            <div className='overflow-x-auto w-full'>
              {filteredCategories.length > 0 ? (
                <table className='w-full text-left border-collapse'>
                  <thead>
                    <tr className='bg-[#e3effc] text-[#1e3a8a] text-[13px] font-black border-b border-[#cbd5e1]/40 select-none'>
                      <th className='py-3.5 px-5 font-bold w-16 text-center'>STT</th>
                      <th className='py-3.5 px-5 font-bold'>Tên danh mục</th>
                      <th className='py-3.5 px-5 font-bold'>Mô tả</th>
                      <th className='py-3.5 px-5 font-bold text-center w-36'>Số sản phẩm</th>
                      <th className='py-3.5 px-5 font-bold text-center w-28'>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100 text-xs font-semibold text-gray-600'>
                    {filteredCategories.map((c, index) => {
                      const count = productCountMap[c.id] || 0
                      return (
                        <tr key={c.id} className='hover:bg-[#fcfdfe] transition-colors'>
                          <td className='py-4 px-5 text-center text-gray-400 font-mono'>
                            {index + 1}
                          </td>
                          <td className='py-4 px-5'>
                            <div className='flex items-center gap-2 font-bold text-gray-900 text-[13.5px]'>
                              <div className='size-7 rounded-md bg-red-50 text-[#D32F2F] flex items-center justify-center shrink-0'>
                                <Tag size={14} />
                              </div>
                              <span
                                onClick={() => {
                                  setQuickViewCategory(c)
                                  setQuickViewSearch('')
                                }}
                                className='hover:text-[#D32F2F] hover:underline cursor-pointer transition-colors'
                                title='Xem nhanh các sản phẩm trong danh mục'
                              >
                                {c.name}
                              </span>
                            </div>
                          </td>
                          <td className='py-4 px-5 max-w-sm text-gray-500'>
                            {c.description || <span className='text-gray-300 italic'>Chưa có mô tả</span>}
                          </td>
                          <td className='py-4 px-5 text-center'>
                            <button
                              onClick={() => {
                                setQuickViewCategory(c)
                                setQuickViewSearch('')
                              }}
                              className={`px-3 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all hover:scale-105 ${
                                count > 0
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                              }`}
                              title='Xem danh sách sản phẩm'
                            >
                              <Layers size={12} />
                              {count} sản phẩm
                            </button>
                          </td>
                          <td className='py-4 px-5 text-center'>
                            <div className='flex items-center justify-center gap-1'>
                              <button
                                onClick={() => {
                                  setQuickViewCategory(c)
                                  setQuickViewSearch('')
                                }}
                                className='text-slate-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-md transition-colors cursor-pointer'
                                title='Xem nhanh sản phẩm'
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(c)}
                                className='text-slate-400 hover:text-amber-600 p-1.5 hover:bg-amber-50 rounded-md transition-colors cursor-pointer'
                                title='Sửa danh mục'
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteModal(c)}
                                className='text-slate-400 hover:text-[#b90a0a] p-1.5 hover:bg-red-50 rounded-md transition-colors cursor-pointer'
                                title='Xóa danh mục'
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              ) : (
                <div className='text-center py-20 text-slate-400 text-xs font-bold flex flex-col items-center gap-2'>
                  <FolderTree className='size-10 text-gray-300 stroke-1' />
                  <span>
                    {searchTerm
                      ? `Không tìm thấy danh mục nào phù hợp với từ khóa "${searchTerm}".`
                      : 'Chưa có danh mục nào. Hãy nhấn "+ Thêm danh mục" để tạo mới!'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL THÊM / SỬA DANH MỤC */}
      {/* ========================================================================= */}
      {showFormModal && (
        <div className='fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100 shrink-0'>
              <h3 className='text-[16px] font-bold text-gray-900 flex items-center gap-2'>
                <Tag className='text-[#D32F2F] size-5' />
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className='text-gray-400 hover:text-gray-600 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCategory} className='flex flex-col flex-1 overflow-hidden'>
              <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-5'>
                {/* Tên danh mục */}
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-700'>
                    Tên danh mục <span className='text-red-500'>*</span>
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder='Ví dụ: Đồ uống, Món chính, Khai vị...'
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                    autoFocus
                  />
                </div>

                {/* Mô tả */}
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-700'>Mô tả</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder='Nhập mô tả ngắn gọn về danh mục này...'
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 resize-none'
                  />
                </div>
              </div>

              {/* Actions Footer */}
              <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-white'>
                <button
                  type='button'
                  onClick={() => setShowFormModal(false)}
                  disabled={actionLoading}
                  className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50'
                >
                  Hủy
                </button>

                <button
                  type='submit'
                  disabled={actionLoading}
                  className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50'
                >
                  {actionLoading && <Loader2 size={14} className='animate-spin' />}
                  {actionLoading
                    ? editingCategory
                      ? 'Đang lưu...'
                      : 'Đang tạo...'
                    : editingCategory
                    ? 'Lưu thay đổi'
                    : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MODAL XÁC NHẬN XÓA DANH MỤC (STYLE CHUẨN TAXMATE) */}
      {/* ========================================================================= */}
      {showDeleteModal && deletingCategory && (
        <div className='fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='flex items-center gap-2 px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
              <AlertTriangle className='text-[#D32F2F] size-5' />
              <h3 className='text-[16px] font-bold text-gray-900'>Xác nhận xóa danh mục</h3>
            </div>

            {/* Content Body */}
            <div className='px-8 py-6 flex flex-col gap-4'>
              <p className='text-[14px] text-gray-700 leading-6'>
                Bạn có chắc chắn muốn xóa danh mục{' '}
                <span className='font-bold text-gray-900'>"{deletingCategory.name}"</span>?
              </p>

              {deletingCategoryProductCount > 0 ? (
                <div className='bg-amber-50 border border-amber-200 rounded-[10px] p-3.5 flex flex-col gap-2.5'>
                  <p className='text-[13px] text-amber-800 font-semibold leading-5'>
                    ⚠️ Danh mục này đang chứa{' '}
                    <span className='font-extrabold text-red-600'>
                      {deletingCategoryProductCount}
                    </span>{' '}
                    sản phẩm. Vui lòng chọn phương án xử lý:
                  </p>

                  <div className='flex flex-col gap-2.5 mt-1'>
                    {/* Option 1: Chuyển sang danh mục khác */}
                    {availableFallbackCategories.length > 0 && (
                      <label className='flex items-start gap-2 cursor-pointer text-[13px] text-gray-800'>
                        <input
                          type='radio'
                          name='deleteCategoryMode'
                          value='fallback'
                          checked={deleteMode === 'fallback'}
                          onChange={() => setDeleteMode('fallback')}
                          className='mt-1 accent-[#D32F2F]'
                        />
                        <div className='flex-1 flex flex-col gap-1.5'>
                          <span className='font-medium'>Chuyển sản phẩm sang danh mục khác:</span>
                          {deleteMode === 'fallback' && (
                            <select
                              value={fallbackCategoryId}
                              onChange={(e) => setFallbackCategoryId(e.target.value)}
                              className='w-full border border-gray-300 rounded-[8px] px-3 py-1.5 text-[12.5px] bg-white outline-hidden focus:border-[#D32F2F]'
                            >
                              <option value=''>-- Chọn danh mục nhận sản phẩm --</option>
                              {availableFallbackCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </label>
                    )}

                    {/* Option 2: Xóa bắt buộc (gỡ bỏ danh mục) */}
                    <label className='flex items-start gap-2 cursor-pointer text-[13px] text-gray-800'>
                      <input
                        type='radio'
                        name='deleteCategoryMode'
                        value='force'
                        checked={deleteMode === 'force' || availableFallbackCategories.length === 0}
                        onChange={() => setDeleteMode('force')}
                        className='mt-1 accent-[#D32F2F]'
                      />
                      <span className='font-medium'>
                        Xóa bắt buộc (sản phẩm sẽ chuyển về trạng thái không có danh mục)
                      </span>
                    </label>
                  </div>
                </div>
              ) : (
                <p className='text-[13px] text-gray-500'>
                  Hành động này không thể hoàn tác.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className='flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-white'>
              <button
                type='button'
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingCategory(null)
                }}
                className='px-8 py-2 border-2 border-taxmate-red text-taxmate-red text-[13px] font-bold rounded-[8px] hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50'
              >
                Hủy
              </button>

              <button
                type='button'
                disabled={
                  isDeleting ||
                  (deletingCategoryProductCount > 0 &&
                    deleteMode === 'fallback' &&
                    !fallbackCategoryId &&
                    availableFallbackCategories.length > 0)
                }
                onClick={handleConfirmDelete}
                className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] active:bg-[#991B1B] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs cursor-pointer flex items-center gap-2'
              >
                {isDeleting && <Loader2 size={14} className='animate-spin' />}
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL QUICK VIEW SẢN PHẨM ================= */}
      {quickViewCategory && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150'
          onClick={() => setQuickViewCategory(null)}
        >
          <div
            className='bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col overflow-hidden border border-gray-100 transform transition-all'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className='px-6 py-4 bg-[#fcf8f8] border-b border-red-50 flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='size-10 rounded-xl bg-red-50 text-[#D32F2F] flex items-center justify-center shrink-0 shadow-xs'>
                  <Tag size={18} />
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='text-base font-extrabold text-gray-900'>
                      {quickViewCategory.name}
                    </h3>
                    <span className='px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700'>
                      {products.filter((p) => p.productCategoryId === quickViewCategory.id).length} sản phẩm
                    </span>
                  </div>
                  {quickViewCategory.description ? (
                    <p className='text-xs text-gray-500 mt-0.5 line-clamp-1'>
                      {quickViewCategory.description}
                    </p>
                  ) : (
                    <p className='text-xs text-gray-400 mt-0.5 italic'>
                      Chưa có mô tả danh mục
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setQuickViewCategory(null)}
                className='text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Search Bar */}
            <div className='p-4 border-b border-gray-100 bg-white'>
              <div className='relative'>
                <Search size={15} className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
                <input
                  type='text'
                  value={quickViewSearch}
                  onChange={(e) => setQuickViewSearch(e.target.value)}
                  placeholder='Tìm kiếm sản phẩm theo tên hoặc mã món...'
                  className='w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg outline-hidden focus:border-[#D32F2F] font-medium transition-all text-gray-800'
                />
                {quickViewSearch && (
                  <button
                    onClick={() => setQuickViewSearch('')}
                    className='absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer'
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Body: Danh sách sản phẩm dạng Grid */}
            <div className='p-4 max-h-[380px] overflow-y-auto bg-gray-50/50'>
              {quickViewProducts.length > 0 ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                  {quickViewProducts.map((p) => (
                    <div
                      key={p.id}
                      className='bg-white border border-gray-200/80 rounded-xl p-2.5 flex items-center gap-3 hover:border-red-200 hover:shadow-xs transition-all'
                    >
                      {/* Thumbnail */}
                      <div className='size-12 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0'>
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className='size-full object-cover'
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <Package size={18} className='text-gray-400' />
                        )}
                      </div>

                      {/* Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-1.5'>
                          <span className='text-[10px] font-mono text-gray-400 font-bold'>
                            {p.productCode || 'Món'}
                          </span>
                          <span
                            className={`size-1.5 rounded-full ${
                              p.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                            title={p.status === 'Active' ? 'Đang bán' : 'Tạm ngưng'}
                          />
                        </div>
                        <h4 className='text-[13px] font-bold text-gray-800 truncate' title={p.name}>
                          {p.name}
                        </h4>
                        <div className='text-[13px] font-black text-[#D32F2F] mt-0.5'>
                          {Number(p.currentPrice || 0).toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='py-12 flex flex-col items-center justify-center text-center gap-2 text-gray-400'>
                  <PackageOpen size={36} className='stroke-1 text-gray-300' />
                  <span className='text-xs font-semibold'>
                    {quickViewSearch
                      ? `Không tìm thấy sản phẩm nào khớp với "${quickViewSearch}"`
                      : 'Danh mục này chưa có sản phẩm nào.'}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className='px-6 py-3.5 bg-white border-t border-gray-100 flex items-center justify-between gap-3'>
              <button
                type='button'
                onClick={() => setQuickViewCategory(null)}
                className='px-4 py-2 text-xs font-bold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer'
              >
                Đóng
              </button>

              <button
                type='button'
                onClick={() => {
                  const catId = quickViewCategory.id
                  setQuickViewCategory(null)
                  navigate(`${path.BUSINESS_OWNER_PRODUCTS}?category=${catId}`)
                }}
                className='px-4 py-2 text-xs font-bold text-white bg-[#D32F2F] hover:bg-[#b71c1c] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer'
              >
                <span>Quản lý sản phẩm</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
