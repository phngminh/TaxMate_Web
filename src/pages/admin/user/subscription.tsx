import { useCallback, useEffect, useState } from 'react'
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Users,
  CalendarDays,
  Power,
} from 'lucide-react'
import { toast } from 'react-toastify'
import type {
  CreateSubscriptionPlanRequest,
  SubscriptionPlanResponse,
  UpdatePlanFeatureRequest,
  UpdateSubscriptionPlanRequest,
} from '../../../types/subscription.type'
import type { PackageRevenueItem } from '../../../types/dashboard.type'
import { Button } from '../../../components/ui/button'
import {
  createPlan,
  deletePlan,
  getAllAdminPlans,
  togglePlanActive,
  updatePlan,
} from '../../../apis/subscription.api'
import { getPackageRevenue } from '../../../apis/dashboard.api'

const MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

const YEARS = [2024, 2025, 2026, 2027]

type FeatureFormRow = {
  id?: string | null
  featureKey: string
  featureName: string
  isEnabled: boolean
}

type PlanFormState = {
  name: string
  description: string
  monthlyPrice: string
  annualPrice: string
  maxProducts: string
  maxTransactionsPerMonth: string
  sortOrder: string
  features: FeatureFormRow[]
}

const emptyForm = (): PlanFormState => ({
  name: '',
  description: '',
  monthlyPrice: '0',
  annualPrice: '0',
  maxProducts: '',
  maxTransactionsPerMonth: '',
  sortOrder: '0',
  features: [],
})

function formatPrice(amount: number) {
  if (amount === 0) return 'Miễn phí'
  return `${amount.toLocaleString('vi-VN')}đ`
}

function getErrorMessage(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || fallback
}

function planToForm(plan: SubscriptionPlanResponse): PlanFormState {
  return {
    name: plan.name,
    description: plan.description ?? '',
    monthlyPrice: String(plan.monthlyPrice),
    annualPrice: String(plan.annualPrice),
    maxProducts: plan.maxProducts == null ? '' : String(plan.maxProducts),
    maxTransactionsPerMonth:
      plan.maxTransactionsPerMonth == null ? '' : String(plan.maxTransactionsPerMonth),
    sortOrder: String(plan.sortOrder),
    features: plan.features.map((f) => ({
      id: f.id,
      featureKey: f.featureKey,
      featureName: f.featureName,
      isEnabled: f.isEnabled,
    })),
  }
}

function formToCreateRequest(form: PlanFormState): CreateSubscriptionPlanRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    monthlyPrice: Number(form.monthlyPrice) || 0,
    annualPrice: Number(form.annualPrice) || 0,
    maxProducts: form.maxProducts === '' ? null : Number(form.maxProducts),
    maxTransactionsPerMonth:
      form.maxTransactionsPerMonth === '' ? null : Number(form.maxTransactionsPerMonth),
    sortOrder: Number(form.sortOrder) || 0,
    features: form.features.map((f) => ({
      featureKey: f.featureKey.trim() || slugify(f.featureName),
      featureName: f.featureName.trim(),
      isEnabled: f.isEnabled,
    })),
  }
}

function formToUpdateRequest(form: PlanFormState): UpdateSubscriptionPlanRequest {
  const create = formToCreateRequest(form)
  return {
    ...create,
    features: form.features.map((f) => ({
      id: f.id || null,
      featureKey: f.featureKey.trim() || slugify(f.featureName),
      featureName: f.featureName.trim(),
      isEnabled: f.isEnabled,
    })) as UpdatePlanFeatureRequest[],
  }
}

function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '') || 'feature'
  )
}

function TimeFilter({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: number
  year: number
  onMonthChange: (m: number) => void
  onYearChange: (y: number) => void
}) {
  return (
    <div className='flex items-center gap-2'>
      <div className='relative'>
        <CalendarDays className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none' />
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className='pl-10 pr-8 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30 cursor-pointer appearance-none'
        >
          {MONTHS.map((label, idx) => (
            <option key={idx} value={idx + 1}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className='px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30 cursor-pointer'
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>
            Năm {y}
          </option>
        ))}
      </select>
    </div>
  )
}

function PlanFormModal({
  open,
  title,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  form: PlanFormState
  saving: boolean
  onChange: (form: PlanFormState) => void
  onClose: () => void
  onSubmit: () => void
}) {
  if (!open) return null

  const updateFeature = (index: number, patch: Partial<FeatureFormRow>) => {
    const features = form.features.map((f, i) => (i === index ? { ...f, ...patch } : f))
    onChange({ ...form, features })
  }

  const addFeature = () => {
    onChange({
      ...form,
      features: [
        ...form.features,
        { featureKey: '', featureName: '', isEnabled: true },
      ],
    })
  }

  const removeFeature = (index: number) => {
    onChange({
      ...form,
      features: form.features.filter((_, i) => i !== index),
    })
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
        <div className='px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between'>
          <h2 className='text-lg font-bold text-[#0a0a0a]'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            className='p-1.5 hover:bg-[#f9fafb] rounded-sm'
            disabled={saving}
          >
            <X className='w-4 h-4 text-[#6b7280]' />
          </button>
        </div>

        <div className='px-6 py-4 space-y-4'>
          <div>
            <label className='block text-sm font-medium text-[#374151] mb-1'>Tên gói</label>
            <input
              value={form.name}
              onChange={(e) => onChange({ ...form, name: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              placeholder='Ví dụ: Gói Doanh nghiệp'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-[#374151] mb-1'>Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => onChange({ ...form, description: e.target.value })}
              rows={2}
              className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              placeholder='Mô tả ngắn về gói'
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Giá tháng (đ)
              </label>
              <input
                type='number'
                min={0}
                value={form.monthlyPrice}
                onChange={(e) => onChange({ ...form, monthlyPrice: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Giá năm (đ)
              </label>
              <input
                type='number'
                min={0}
                value={form.annualPrice}
                onChange={(e) => onChange({ ...form, annualPrice: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Max sản phẩm
              </label>
              <input
                type='number'
                min={0}
                value={form.maxProducts}
                onChange={(e) => onChange({ ...form, maxProducts: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
                placeholder='Để trống = không giới hạn'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Max giao dịch/tháng
              </label>
              <input
                type='number'
                min={0}
                value={form.maxTransactionsPerMonth}
                onChange={(e) =>
                  onChange({ ...form, maxTransactionsPerMonth: e.target.value })
                }
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
                placeholder='Để trống = không giới hạn'
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-[#374151] mb-1'>
                Thứ tự
              </label>
              <input
                type='number'
                value={form.sortOrder}
                onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
                className='w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
              />
            </div>
          </div>

          <div>
            <div className='flex items-center justify-between mb-2'>
              <label className='text-sm font-medium text-[#374151]'>Tính năng</label>
              <button
                type='button'
                onClick={addFeature}
                className='text-sm text-[#5d2ec0] hover:underline'
              >
                + Thêm tính năng
              </button>
            </div>
            <div className='space-y-2'>
              {form.features.length === 0 && (
                <p className='text-xs text-[#9ca3af]'>Chưa có tính năng nào.</p>
              )}
              {form.features.map((feature, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 p-2 border border-[#f3f4f6] rounded-lg'
                >
                  <input
                    value={feature.featureName}
                    onChange={(e) => updateFeature(index, { featureName: e.target.value })}
                    className='flex-1 px-2 py-1.5 text-sm border border-[#e5e7eb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#5d2ec0]/30'
                    placeholder='Tên tính năng'
                  />
                  <label className='flex items-center gap-1 text-xs text-[#6b7280] whitespace-nowrap'>
                    <input
                      type='checkbox'
                      checked={feature.isEnabled}
                      onChange={(e) => updateFeature(index, { isEnabled: e.target.checked })}
                    />
                    Bật
                  </label>
                  <button
                    type='button'
                    onClick={() => removeFeature(index)}
                    className='p-1 hover:bg-[#fef2f2] rounded-sm'
                  >
                    <Trash2 className='w-3.5 h-3.5 text-[#ef4444]' />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='px-6 py-4 border-t border-[#f3f4f6] flex justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={saving}
            className='px-4'
          >
            Hủy
          </Button>
          <Button
            type='button'
            onClick={onSubmit}
            disabled={saving}
            className='px-4 bg-[#5d2ec0] text-white hover:bg-[#4c25a0]'
          >
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionManagement() {
  const now = new Date()
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([])
  const [revenueByPlanId, setRevenueByPlanId] = useState<
    Record<string, PackageRevenueItem>
  >({})
  const [loading, setLoading] = useState(true)
  const [tableMonth, setTableMonth] = useState(now.getMonth() + 1)
  const [tableYear, setTableYear] = useState(now.getFullYear())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanResponse | null>(null)
  const [form, setForm] = useState<PlanFormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    try {
      const response = await getAllAdminPlans()
      if (!response.success) {
        throw new Error(response.message || 'Không thể tải danh sách gói')
      }
      setPlans(response.data ?? [])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh sách gói đăng ký'))
    }
  }, [])

  const fetchRevenue = useCallback(async (year: number, month: number) => {
    try {
      const response = await getPackageRevenue(year, month)
      if (!response.success) {
        throw new Error(response.message || 'Không thể tải doanh thu')
      }
      const map: Record<string, PackageRevenueItem> = {}
      for (const item of response.data?.packages ?? []) {
        map[item.planId] = item
      }
      setRevenueByPlanId(map)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải doanh thu theo gói'))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchPlans(), fetchRevenue(tableYear, tableMonth)])
      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchRevenue(tableYear, tableMonth)
  }, [tableMonth, tableYear, fetchRevenue])

  const openCreateModal = () => {
    setEditingPlan(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEditModal = (plan: SubscriptionPlanResponse) => {
    setEditingPlan(plan)
    setForm(planToForm(plan))
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditingPlan(null)
    setForm(emptyForm())
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Vui lòng nhập tên gói')
      return
    }

    const actionLabel = editingPlan ? 'cập nhật' : 'tạo'
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionLabel} gói đăng ký này?`)) {
      return
    }

    setSaving(true)
    try {
      if (editingPlan) {
        const response = await updatePlan(editingPlan.id, formToUpdateRequest(form))
        if (!response.success) {
          throw new Error(response.message || 'Cập nhật thất bại')
        }
        toast.success('Cập nhật gói đăng ký thành công')
      } else {
        const response = await createPlan(formToCreateRequest(form))
        if (!response.success) {
          throw new Error(response.message || 'Tạo gói thất bại')
        }
        toast.success('Tạo gói đăng ký thành công')
      }
      setModalOpen(false)
      setEditingPlan(null)
      setForm(emptyForm())
      await Promise.all([fetchPlans(), fetchRevenue(tableYear, tableMonth)])
    } catch (error) {
      toast.error(getErrorMessage(error, `Không thể ${actionLabel} gói đăng ký`))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (plan: SubscriptionPlanResponse) => {
    const nextLabel = plan.isActive ? 'tắt' : 'bật'
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn ${nextLabel} gói "${plan.name}"?`,
      )
    ) {
      return
    }

    setActionId(plan.id)
    try {
      const response = await togglePlanActive(plan.id)
      if (!response.success) {
        throw new Error(response.message || 'Cập nhật trạng thái thất bại')
      }
      toast.success(
        plan.isActive
          ? 'Đã tắt gói đăng ký'
          : 'Đã bật gói đăng ký',
      )
      await fetchPlans()
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể cập nhật trạng thái gói'))
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (plan: SubscriptionPlanResponse) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa gói "${plan.name}"? Hành động này không thể hoàn tác.`,
      )
    ) {
      return
    }

    setActionId(plan.id)
    try {
      const response = await deletePlan(plan.id)
      if (!response.success) {
        throw new Error(response.message || 'Xóa gói thất bại')
      }
      toast.success('Đã xóa gói đăng ký')
      await Promise.all([fetchPlans(), fetchRevenue(tableYear, tableMonth)])
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa gói đăng ký'))
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className='min-h-screen bg-[#f8f9fb] p-5'>
      <div className='space-y-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-[#0a0a0a]'>
              Quản lý gói đăng ký
            </h1>
            <p className='text-sm text-[#6b7280] mt-1'>
              Tạo và quản lý các gói đăng ký cho khách hàng
            </p>
          </div>
          <Button
            onClick={openCreateModal}
            className='flex items-center gap-2 px-4 py-5 bg-[#5d2ec0] text-white rounded-lg text-sm font-medium hover:bg-[#4c25a0] transition-colors shadow-xs'
          >
            <Plus className='w-4 h-4' />
            Tạo gói mới
          </Button>
        </div>

        {loading ? (
          <div className='bg-card border border-border rounded-xl p-10 text-center text-sm text-[#6b7280]'>
            Đang tải dữ liệu...
          </div>
        ) : plans.length === 0 ? (
          <div className='bg-card border border-border rounded-xl p-10 text-center text-sm text-[#6b7280]'>
            Chưa có gói đăng ký nào. Hãy tạo gói mới.
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
            {plans.map((plan) => (
              <div
                key={plan.id}
                className='bg-card border border-border rounded-xl p-6 shadow-xs'
              >
                <div className='flex items-start justify-between mb-4'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-bold text-[#0a0a0a] mb-1'>
                      {plan.name}
                    </h3>
                    <p className='text-sm text-[#6b7280]'>
                      {plan.description || 'Không có mô tả'}
                    </p>
                  </div>
                  <div className='flex items-center gap-1'>
                    <button
                      type='button'
                      title={plan.isActive ? 'Tắt gói' : 'Bật gói'}
                      disabled={actionId === plan.id}
                      onClick={() => handleToggleActive(plan)}
                      className='p-1.5 hover:bg-[#f9fafb] rounded-sm transition-colors disabled:opacity-50'
                    >
                      <Power
                        className={`w-4 h-4 ${plan.isActive ? 'text-[#10b981]' : 'text-[#9ca3af]'}`}
                      />
                    </button>
                    <button
                      type='button'
                      title='Sửa'
                      onClick={() => openEditModal(plan)}
                      className='p-1.5 hover:bg-[#f9fafb] rounded-sm transition-colors'
                    >
                      <Edit3 className='w-4 h-4 text-[#6b7280]' />
                    </button>
                    <button
                      type='button'
                      title='Xóa'
                      disabled={actionId === plan.id}
                      onClick={() => handleDelete(plan)}
                      className='p-1.5 hover:bg-[#fef2f2] rounded-sm transition-colors disabled:opacity-50'
                    >
                      <Trash2 className='w-4 h-4 text-[#ef4444]' />
                    </button>
                  </div>
                </div>

                <div className='mb-6 space-y-1'>
                  <div className='flex items-baseline gap-1'>
                    <span className='text-3xl font-bold text-[#0a0a0a]'>
                      {formatPrice(plan.monthlyPrice)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className='text-sm text-[#9ca3af]'>/tháng</span>
                    )}
                  </div>
                  <p className='text-sm text-[#6b7280]'>
                    Năm:{' '}
                    <span className='font-medium text-[#374151]'>
                      {formatPrice(plan.annualPrice)}
                      {plan.annualPrice > 0 ? '/năm' : ''}
                    </span>
                  </p>
                </div>

                <div className='space-y-3'>
                  <p className='text-xs font-semibold text-[#9ca3af] uppercase tracking-wide'>
                    Tính năng:
                  </p>
                  {plan.features.slice(0, 6).map((feature) => (
                    <div key={feature.id} className='flex items-start gap-2'>
                      {feature.isEnabled ? (
                        <div className='w-4 h-4 rounded-full bg-[#ecfdf5] flex items-center justify-center shrink-0 mt-0.5'>
                          <Check className='w-3 h-3 text-[#10b981]' />
                        </div>
                      ) : (
                        <div className='w-4 h-4 rounded-full bg-[#fef2f2] flex items-center justify-center shrink-0 mt-0.5'>
                          <X className='w-3 h-3 text-[#ef4444]' />
                        </div>
                      )}
                      <span className='text-sm text-[#374151]'>
                        {feature.featureName}
                      </span>
                    </div>
                  ))}
                  {plan.features.length === 0 && (
                    <p className='text-sm text-[#9ca3af]'>Không có tính năng</p>
                  )}
                </div>

                <div className='mt-6 pt-4 border-t border-border'>
                  {plan.isActive ? (
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-[#10b981] bg-[#ecfdf5] px-2 py-1 rounded-full'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#10b981]' />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-[#9ca3af] bg-[#f3f4f6] px-2 py-1 rounded-full'>
                      <span className='w-1.5 h-1.5 rounded-full bg-[#9ca3af]' />
                      Ngừng hoạt động
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className='bg-card border border-border rounded-xl shadow-xs overflow-hidden'>
          <div className='px-6 py-4 flex items-center justify-between'>
            <h3 className='text-base font-bold text-[#0a0a0a]'>
              Chi tiết tất cả gói đăng ký
            </h3>
            <TimeFilter
              month={tableMonth}
              year={tableYear}
              onMonthChange={setTableMonth}
              onYearChange={setTableYear}
            />
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-[#f9fafb]'>
                  <th className='px-6 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Tên gói
                  </th>
                  <th className='px-4 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Giá
                  </th>
                  <th className='px-4 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Số người đăng ký
                  </th>
                  <th className='px-4 py-3.5 text-left text-[13px] font-bold text-[#9ca3af] uppercase tracking-wide'>
                    Doanh thu ({MONTHS[tableMonth - 1]} {tableYear})
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const stats = revenueByPlanId[plan.id]
                  const subscribers = stats?.subscriptionCount ?? 0
                  const revenue = stats?.revenue ?? 0
                  return (
                    <tr
                      key={plan.id}
                      className='border-t border-[#f9fafb] hover:bg-[#f9fafb] transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div>
                          <p className='text-sm font-semibold text-[#0a0a0a]'>
                            {plan.name}
                          </p>
                          <p className='text-xs text-[#9ca3af] mt-0.5'>
                            {plan.description || '—'}
                          </p>
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <div className='text-sm font-medium text-[#0a0a0a]'>
                          {plan.monthlyPrice === 0
                            ? 'Miễn phí'
                            : `${plan.monthlyPrice.toLocaleString('vi-VN')}đ/tháng`}
                        </div>
                        {plan.annualPrice > 0 && (
                          <div className='text-xs text-[#9ca3af] mt-0.5'>
                            {plan.annualPrice.toLocaleString('vi-VN')}đ/năm
                          </div>
                        )}
                      </td>
                      <td className='px-4 py-4'>
                        <div className='flex items-center gap-2'>
                          <Users className='w-4 h-4 text-[#9ca3af]' />
                          <span className='text-sm text-[#374151]'>
                            {subscribers.toLocaleString('vi-VN')}
                          </span>
                        </div>
                      </td>
                      <td className='px-4 py-4'>
                        <span className='text-sm font-medium text-[#0a0a0a]'>
                          {revenue.toLocaleString('vi-VN')}đ
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {!loading && plans.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className='px-6 py-8 text-center text-sm text-[#9ca3af]'
                    >
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <PlanFormModal
        open={modalOpen}
        title={editingPlan ? 'Chỉnh sửa gói đăng ký' : 'Tạo gói đăng ký mới'}
        form={form}
        saving={saving}
        onChange={setForm}
        onClose={closeModal}
        onSubmit={handleSave}
      />
    </div>
  )
}
