import {
  Calendar,
  CheckCircle2,
  FileCheck,
  Image as ImageIcon,
  Loader2,
  Receipt,
  Upload,
  X
} from 'lucide-react'
import { useState, useRef } from 'react'
import { toast } from 'react-toastify'

import { recordTaxPeriodPayment } from '../../../apis/taxPeriod.api'
import { uploadImage } from '../../../apis/image.api'
import type {
  TaxPeriodDetail,
  TaxPeriodPaymentSummary
} from '../../../types/taxPeriod.type'

interface ObligationItem {
  taxType: string
  amount: number
  chapterCode?: string | null
  subsectionCode?: string | null
  budgetContent?: string | null
}

interface RecordTaxPaymentModalProps {
  open: boolean
  onClose: () => void
  taxPeriod: TaxPeriodDetail
  obligations?: ObligationItem[]
  onSuccess: (summary: TaxPeriodPaymentSummary) => void
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

export default function RecordTaxPaymentModal({
  open,
  onClose,
  taxPeriod,
  obligations,
  onSuccess
}: RecordTaxPaymentModalProps) {
  const [paymentDate, setPaymentDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [paymentMethod, setPaymentMethod] = useState<'Bank' | 'Cash'>('Bank')
  const [transactionReference, setTransactionReference] = useState('')
  const [receiptFileUrl, setReceiptFileUrl] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  // Calculate default breakdown if obligations not passed
  const items: ObligationItem[] =
    obligations && obligations.length > 0
      ? obligations
      : [
          ...(taxPeriod.vatTaxAmount > 0
            ? [
                {
                  taxType: 'VAT',
                  amount: taxPeriod.vatTaxAmount,
                  chapterCode: '857',
                  subsectionCode: '1701',
                  budgetContent: 'Thuế GTGT hàng SXKD trong nước'
                }
              ]
            : []),
          ...(taxPeriod.personalIncomeTaxAmount > 0
            ? [
                {
                  taxType: 'PIT',
                  amount: taxPeriod.personalIncomeTaxAmount,
                  chapterCode: '857',
                  subsectionCode: '1003',
                  budgetContent: 'Thuế TNCN từ hoạt động SXKD'
                }
              ]
            : [])
        ]

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const url = await uploadImage(file)
      setReceiptFileUrl(url)
      toast.success('Đã tải ảnh chứng từ nộp thuế thành công.')
    } catch (err: any) {
      toast.error(err?.message || 'Không thể tải lên ảnh chứng từ.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!paymentDate) {
      toast.warning('Vui lòng chọn ngày nộp tiền vào NSNN.')
      return
    }

    try {
      setIsSubmitting(true)
      const summary = await recordTaxPeriodPayment(taxPeriod.id, {
        paymentDate: new Date(paymentDate).toISOString(),
        paymentMethod,
        transactionReference: transactionReference.trim() || undefined,
        receiptFileUrl: receiptFileUrl || undefined,
        note: note.trim() || undefined,
        items: items.map((x) => ({
          taxType: x.taxType,
          amount: x.amount,
          stateBudgetChapterCode: x.chapterCode,
          stateBudgetSubsectionCode: x.subsectionCode
        }))
      })

      toast.success('Đã xác nhận nộp tiền thuế vào NSNN thành công.')
      onSuccess(summary)
      onClose()
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || 'Không thể ghi nhận nộp thuế.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs'>
      <div className='relative w-full max-w-xl rounded-2xl bg-white shadow-2xl transition-all'>
        {/* Header */}
        <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700'>
              <Receipt size={22} />
            </div>
            <div>
              <h3 className='text-lg font-black text-gray-900'>
                Xác nhận đã nộp thuế vào NSNN
              </h3>
              <p className='text-xs font-semibold text-gray-500'>
                Kỳ thuế Quý {taxPeriod.quarter}/{taxPeriod.year}
              </p>
            </div>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='p-6'>
          {/* Amount Breakdown */}
          <div className='mb-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-bold text-gray-700'>
                Tổng số tiền nộp ngân sách
              </span>
              <span className='text-lg font-black text-emerald-700'>
                {formatMoney(totalAmount)}
              </span>
            </div>

            <div className='mt-3 space-y-2 border-t border-emerald-200/60 pt-3'>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className='flex items-center justify-between text-xs'
                >
                  <span className='font-medium text-gray-600'>
                    {item.taxType === 'VAT' ? 'Thuế GTGT (VAT)' : 'Thuế TNCN (PIT)'}
                    {item.subsectionCode && (
                      <span className='ml-1 text-gray-400'>
                        (Tiểu mục {item.subsectionCode})
                      </span>
                    )}
                  </span>
                  <span className='font-bold text-gray-800'>
                    {formatMoney(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className='space-y-4'>
            {/* Payment Date & Method */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              <div>
                <label className='mb-1.5 block text-xs font-bold text-gray-700'>
                  Ngày nộp tiền <span className='text-red-500'>*</span>
                </label>
                <div className='relative'>
                  <input
                    type='date'
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className='w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-semibold text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1.5 block text-xs font-bold text-gray-700'>
                  Hình thức nộp
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(e.target.value as 'Bank' | 'Cash')
                  }
                  className='w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm font-semibold text-gray-800 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500'
                >
                  <option value='Bank'>Chuyển khoản (Ngân hàng / eTax Mobile / Kho bạc)</option>
                  <option value='Cash'>Nộp tiền mặt tại Kho bạc / Ngân hàng</option>
                </select>
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className='mb-1.5 block text-xs font-bold text-gray-700'>
                Số giấy nộp tiền / Mã giao dịch ngân hàng (Tùy chọn)
              </label>
              <input
                type='text'
                placeholder='Ví dụ: GNT-20260420-001 hoặc FT261109988'
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className='w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500'
              />
            </div>

            {/* Receipt Upload */}
            <div>
              <label className='mb-1.5 block text-xs font-bold text-gray-700'>
                Ảnh Giấy nộp tiền / Biên lai NSNN (Tùy chọn)
              </label>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                onChange={handleFileUpload}
                className='hidden'
              />

              {receiptFileUrl ? (
                <div className='relative flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/40 p-3'>
                  <div className='flex items-center gap-3 overflow-hidden'>
                    <img
                      src={receiptFileUrl}
                      alt='Receipt preview'
                      className='h-12 w-12 rounded-lg object-cover border border-emerald-200'
                    />
                    <div className='truncate'>
                      <p className='truncate text-xs font-bold text-emerald-800'>
                        Đã đính kèm chứng từ nộp tiền
                      </p>
                      <a
                        href={receiptFileUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='text-[11px] font-semibold text-emerald-600 hover:underline'
                      >
                        Xem ảnh gốc
                      </a>
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => setReceiptFileUrl(null)}
                    className='rounded-lg p-1.5 text-gray-400 hover:bg-gray-200/60 hover:text-red-600'
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  type='button'
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className='flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-4 text-xs font-bold text-gray-600 hover:border-emerald-500 hover:bg-emerald-50/20 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className='animate-spin text-emerald-600' />
                      <span>Đang tải ảnh lên...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} className='text-gray-400' />
                      <span>Bấm để tải lên ảnh Giấy nộp tiền vào NSNN</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Note */}
            <div>
              <label className='mb-1.5 block text-xs font-bold text-gray-700'>
                Ghi chú thêm
              </label>
              <textarea
                rows={2}
                placeholder='Ghi chú thông tin ủy nhiệm chi hoặc tài khoản nộp...'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className='w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500'
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className='mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className='h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-700 hover:bg-gray-50'
            >
              Hủy
            </button>
            <button
              type='submit'
              disabled={isSubmitting || isUploading}
              className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-white shadow-xs hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 transition active:scale-98'
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className='animate-spin' />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Xác nhận đã nộp thuế</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
