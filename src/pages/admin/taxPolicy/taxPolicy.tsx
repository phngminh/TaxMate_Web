import axios from 'axios'
import { Calculator, FileText, Save, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { NumericFormat } from 'react-number-format'
import { toast } from 'react-toastify'
import {
  getLatestTaxThreshold,
  updateTaxThreshold,
} from '../../../apis/taxPolicy.api'
import {
  TAX_THRESHOLD_TYPES,
  type TaxThresholdType,
} from '../../../types/taxPolicy.type'

const DEFAULT_THRESHOLD = '1000000000'

interface ThresholdFormState {
  amount: string
  effectiveFrom: string
  updatedAt: string | null
}

function getTodayInputValue() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function initialFormState(): ThresholdFormState {
  return {
    amount: DEFAULT_THRESHOLD,
    effectiveFrom: getTodayInputValue(),
    updatedAt: null,
  }
}

export default function TaxPolicyPage() {
  const [annualPolicy, setAnnualPolicy] = useState(initialFormState)
  const [eInvoicePolicy, setEInvoicePolicy] = useState(initialFormState)
  const [loading, setLoading] = useState(true)
  const [savingType, setSavingType] = useState<TaxThresholdType | null>(null)

  useEffect(() => {
    let active = true
    async function loadThreshold(
      type: TaxThresholdType,
      setState: (state: ThresholdFormState) => void,
    ) {
      const response = await getLatestTaxThreshold(type)
      if (!active) return

      setState({
        amount: String(response.data.amount),
        effectiveFrom: response.data.effectiveFrom,
        updatedAt: response.data.updatedAt,
      })
    }

    async function loadPolicies() {
      try {
        await Promise.all([
          loadThreshold(TAX_THRESHOLD_TYPES.ANNUAL_REVENUE_TAX, setAnnualPolicy),
          loadThreshold(TAX_THRESHOLD_TYPES.E_INVOICE_REQUIREMENT, setEInvoicePolicy),
        ])
      } catch {
        if (active) {
          toast.error('Không thể tải cấu hình chính sách thuế.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadPolicies()
    return () => {
      active = false
    }
  }, [])

  async function handleSave(
    type: TaxThresholdType,
    policy: ThresholdFormState,
    setPolicy: (state: ThresholdFormState) => void,
  ) {
    const amount = Number(policy.amount)
    if (amount <= 0 || !policy.effectiveFrom) {
      toast.error('Số tiền và ngày bắt đầu áp dụng không hợp lệ.')
      return
    }

    setSavingType(type)
    try {
      const response = await updateTaxThreshold(type, {
        amount,
        effectiveFrom: policy.effectiveFrom,
      })

      setPolicy({
        amount: String(response.data.amount),
        effectiveFrom: response.data.effectiveFrom,
        updatedAt: response.data.updatedAt,
      })
      toast.success('Đã lưu cấu hình ngưỡng doanh thu.')
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : null
      toast.error(message || 'Không thể lưu cấu hình chính sách thuế.')
    } finally {
      setSavingType(null)
    }
  }

  return (
    <div className='mx-auto max-w-5xl space-y-6'>
      <div>
        <div className='flex items-center gap-2 text-sm font-semibold text-[#00789C]'>
          <ShieldCheck className='h-4 w-4' />
          Cấu hình hệ thống
        </div>
        <h1 className='mt-1 text-3xl font-bold text-gray-900'>Chính sách thuế</h1>
        <p className='mt-2 text-sm text-gray-500'>
          Mỗi ngưỡng có giá trị và ngày bắt đầu áp dụng riêng. Khi đến ngày hiệu lực, hệ thống tự dùng cấu hình mới nhất.
        </p>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <PolicyField
          icon={<Calculator className='h-6 w-6' />}
          title='Ngưỡng doanh thu chịu thuế'
          description='Dùng để xác định nghĩa vụ thuế, phần doanh thu được trừ và điều kiện mở quy trình kê khai.'
          policy={annualPolicy}
          disabled={loading || savingType !== null}
          saving={savingType === TAX_THRESHOLD_TYPES.ANNUAL_REVENUE_TAX}
          onChange={setAnnualPolicy}
          onSave={() => void handleSave(
            TAX_THRESHOLD_TYPES.ANNUAL_REVENUE_TAX,
            annualPolicy,
            setAnnualPolicy,
          )}
        />

        <PolicyField
          icon={<FileText className='h-6 w-6' />}
          title='Ngưỡng bắt buộc sử dụng HĐĐT'
          description='Dùng riêng cho nghĩa vụ và nội dung cảnh báo hóa đơn điện tử.'
          policy={eInvoicePolicy}
          disabled={loading || savingType !== null}
          saving={savingType === TAX_THRESHOLD_TYPES.E_INVOICE_REQUIREMENT}
          onChange={setEInvoicePolicy}
          onSave={() => void handleSave(
            TAX_THRESHOLD_TYPES.E_INVOICE_REQUIREMENT,
            eInvoicePolicy,
            setEInvoicePolicy,
          )}
        />
      </div>
    </div>
  )
}

interface PolicyFieldProps {
  icon: ReactNode
  title: string
  description: string
  policy: ThresholdFormState
  disabled: boolean
  saving: boolean
  onChange: (state: ThresholdFormState) => void
  onSave: () => void
}

function PolicyField({
  icon,
  title,
  description,
  policy,
  disabled,
  saving,
  onChange,
  onSave,
}: PolicyFieldProps) {
  return (
    <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-[#00789C]/10 text-[#00789C]'>
        {icon}
      </div>
      <h2 className='mt-5 text-lg font-bold text-gray-900'>{title}</h2>
      <p className='mt-2 min-h-12 text-sm leading-6 text-gray-500'>{description}</p>

      <label className='mt-5 block text-sm font-semibold text-gray-700'>
        Số tiền
      </label>
      <div className='relative mt-2'>
        <NumericFormat
          inputMode='numeric'
          value={policy.amount}
          valueIsNumericString
          disabled={disabled}
          thousandSeparator='.'
          decimalSeparator=','
          decimalScale={0}
          allowNegative={false}
          allowLeadingZeros={false}
          onValueChange={({ value }) => onChange({ ...policy, amount: value })}
          className='w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-14 text-lg font-bold text-gray-900 outline-none focus:border-[#00789C] disabled:bg-gray-100'
        />
        <span className='absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400'>đ</span>
      </div>

      <label className='mt-5 block text-sm font-semibold text-gray-700'>
        Ngày bắt đầu áp dụng
      </label>
      <input
        type='date'
        value={policy.effectiveFrom}
        disabled={disabled}
        min='2000-01-01'
        max='2100-12-31'
        onChange={(event) => onChange({
          ...policy,
          effectiveFrom: event.currentTarget.value,
        })}
        className='mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-[#00789C] disabled:bg-gray-100'
      />

      <div className='mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5'>
        <p className='text-xs text-gray-500'>
          {policy.updatedAt
            ? `Cập nhật: ${new Date(policy.updatedAt).toLocaleString('vi-VN')}`
            : 'Chưa có cấu hình được lưu.'}
        </p>
        <button
          type='button'
          disabled={disabled}
          onClick={onSave}
          className='flex items-center gap-2 rounded-xl bg-[#00789C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#006680] disabled:cursor-not-allowed disabled:opacity-60'
        >
          <Save className='h-4 w-4' />
          {saving ? 'Đang lưu...' : 'Lưu ngưỡng'}
        </button>
      </div>
    </div>
  )
}
