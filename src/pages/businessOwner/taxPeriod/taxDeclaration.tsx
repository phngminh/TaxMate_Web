import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  PlusCircle,
  Send
} from 'lucide-react'
import {
  useEffect,
  useState
} from 'react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  createTaxDeclaration,
  exportTaxDeclarationDocument,
  getTaxDeclarationByTaxPeriod,
  submitTaxDeclaration
} from '../../../apis/taxDeclaration.api'

import {
  getTaxPeriodById
} from '../../../apis/taxPeriod.api'

import type {
  TaxDeclaration
} from '../../../types/taxDeclaration.type'

import type {
  TaxPeriodDetail
} from '../../../types/taxPeriod.type'

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatDate(
  value?: string | null
) {
  if (!value) return 'Chưa có'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định'
  }

  return date.toLocaleDateString('vi-VN')
}

function InfoRow({
  label,
  value,
  highlight
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className='flex items-center justify-between gap-6 border-b border-gray-100 py-4 last:border-b-0'>
      <span className='text-sm text-gray-500'>
        {label}
      </span>

      <span
        className={`text-right text-sm font-bold ${
          highlight
            ? 'text-red-600'
            : 'text-gray-800'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isProcessing,
  onConfirm,
  onCancel
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isProcessing?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
      role='presentation'
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='confirm-dialog-title'
        aria-describedby='confirm-dialog-description'
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
      >
        <div className='flex items-start gap-4'>
          <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600'>
            <AlertTriangle size={22} />
          </div>

          <div className='min-w-0'>
            <h2
              id='confirm-dialog-title'
              className='text-lg font-black text-gray-900'
            >
              {title}
            </h2>

            <p
              id='confirm-dialog-description'
              className='mt-2 text-sm leading-6 text-gray-500'
            >
              {description}
            </p>
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            disabled={isProcessing}
            onClick={onCancel}
            className='h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
          >
            Hủy
          </button>

          <button
            type='button'
            disabled={isProcessing}
            onClick={onConfirm}
            className='h-11 min-w-32 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300'
          >
            {isProcessing ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaxDeclarationPage() {
  const navigate = useNavigate()

  const { taxPeriodId } = useParams<{
    taxPeriodId: string
  }>()

  const [
    taxPeriod,
    setTaxPeriod
  ] =
    useState<TaxPeriodDetail | null>(
      null
    )

  const [
    declaration,
    setDeclaration
  ] =
    useState<TaxDeclaration | null>(
      null
    )

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    isCreating,
    setIsCreating
  ] = useState(false)

  const [
    isExporting,
    setIsExporting
  ] = useState(false)

  const [
    isSubmitting,
    setIsSubmitting
  ] = useState(false)

  const [
    isSubmitConfirmOpen,
    setIsSubmitConfirmOpen
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadData() {
      if (!taxPeriodId) {
        setErrorMessage(
          'Không tìm thấy mã kỳ thuế.'
        )
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)

        const [
          periodResult,
          declarationResult
        ] = await Promise.all([
          getTaxPeriodById(
            taxPeriodId
          ),

          getTaxDeclarationByTaxPeriod(
            taxPeriodId
          )
        ])

        if (!active) return

        setTaxPeriod(periodResult)
        setDeclaration(
          declarationResult
        )
      } catch (error) {
        console.error(
          '[TaxDeclaration] Load failed:',
          error
        )

        if (!active) return

        setErrorMessage(
          'Không thể tải dữ liệu tờ khai.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [taxPeriodId])

  async function handleCreate() {
    if (
      !taxPeriodId ||
      !taxPeriod
    ) {
      return
    }

    if (
      taxPeriod.status !== 'Calculated'
    ) {
      toast.warning(
        'Chỉ kỳ thuế đã tính thuế mới có thể tạo tờ khai.'
      )
      return
    }

    try {
      setIsCreating(true)

      const result =
        await createTaxDeclaration(
          taxPeriodId,
          {
            declarationType:
              'Initial',
            supplementNumber: null
          }
        )

      setDeclaration(result)

      toast.success(
        `Đã tạo tờ khai ${result.declarationCode}.`
      )
    } catch (error) {
      console.error(
        '[TaxDeclaration] Create failed:',
        error
      )

      toast.error(
        'Không thể tạo tờ khai.'
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function handleExport() {
    if (!declaration?.id) {
      return
    }

    try {
      setIsExporting(true)

      const result =
        await exportTaxDeclarationDocument(
          declaration.id
        )

      const url =
        URL.createObjectURL(
          result.blob
        )

      const anchor =
        document.createElement('a')

      anchor.href = url
      anchor.download =
        result.fileName

      document.body.appendChild(
        anchor
      )

      anchor.click()

      document.body.removeChild(
        anchor
      )

      URL.revokeObjectURL(url)

      toast.success(
        'Xuất tờ khai thành công.'
      )
    } catch (error) {
      console.error(
        '[TaxDeclaration] Export failed:',
        error
      )

      toast.error(
        'Không thể xuất tờ khai.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  function handleSubmit() {
    if (!declaration?.id) {
      toast.warning(
        'Bạn cần tạo tờ khai trước khi gửi.'
      )
      return
    }

    if (
      declaration.status ===
      'Submitted'
    ) {
      toast.info(
        'Tờ khai này đã được gửi.'
      )
      return
    }

    setIsSubmitConfirmOpen(true)
  }

  async function confirmSubmit() {
    if (!declaration?.id) {
      return
    }

    try {
      setIsSubmitting(true)

      const result =
        await submitTaxDeclaration(
          declaration.id
        )

      setDeclaration(result)
      setIsSubmitConfirmOpen(false)

      toast.success(
        `Tờ khai ${result.declarationCode} đã được gửi thành công.`
      )
    } catch (error) {
      console.error(
        '[TaxDeclaration] Submit failed:',
        error
      )

      toast.error(
        'Không thể gửi tờ khai.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <p className='font-semibold text-gray-500'>
          Đang tải tờ khai...
        </p>
      </div>
    )
  }

  if (
    errorMessage ||
    !taxPeriod
  ) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <div className='text-center'>
          <AlertTriangle
            size={48}
            className='mx-auto text-red-500'
          />

          <p className='mt-4 font-bold'>
            {errorMessage}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto max-w-6xl'>
        <button
          type='button'
          onClick={() =>
            navigate(-1)
          }
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600'
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>

        <div className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex flex-wrap items-center justify-between gap-5'>
            <div className='flex items-center gap-4'>
              <div className='flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
                <FileText size={28} />
              </div>

              <div>
                <h1 className='text-2xl font-black'>
                  Tờ khai thuế
                </h1>

                <p className='mt-1 text-sm text-gray-500'>
                  Kiểm tra thông tin
                  trước khi xuất hồ sơ.
                </p>
              </div>
            </div>

            {declaration && (
              <div className='text-right'>
                <p className='text-xs font-semibold uppercase text-gray-400'>
                  Mã tờ khai
                </p>

                <p className='mt-1 text-lg font-black text-red-600'>
                  {declaration.declarationCode}
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                    declaration.status ===
                    'Submitted'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {declaration.status ===
                  'Submitted'
                    ? 'Đã gửi'
                    : 'Bản nháp'}
                </span>
              </div>
            )}
          </div>
        </div>

        {!declaration ? (
          <div className='mt-6 rounded-2xl bg-white p-10 text-center shadow-sm'>
            <PlusCircle
              size={52}
              className='mx-auto text-gray-300'
            />

            <h2 className='mt-4 text-xl font-black'>
              Chưa có tờ khai
            </h2>

            <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500'>
              Kỳ thuế đã được tính.
              Bạn có thể tạo tờ khai
              01/CNKD từ dữ liệu hiện
              tại.
            </p>

            <button
              type='button'
              disabled={isCreating}
              onClick={handleCreate}
              className='mt-6 h-12 rounded-xl bg-red-600 px-7 text-sm font-bold text-white hover:bg-red-700 disabled:bg-gray-300'
            >
              {isCreating
                ? 'Đang tạo...'
                : 'Tạo tờ khai'}
            </button>
          </div>
        ) : (
          <>
            <div className='mt-6 grid gap-6 lg:grid-cols-2'>
              <div className='rounded-2xl bg-white p-6 shadow-sm'>
                <h2 className='mb-4 text-lg font-black'>
                  Thông tin người nộp
                  thuế
                </h2>

                <InfoRow
                  label='Tên người nộp thuế'
                  value={
                    declaration.taxpayerName
                  }
                />

                <InfoRow
                  label='Mã số thuế'
                  value={
                    declaration.taxCode
                  }
                />

                <InfoRow
                  label='Địa chỉ'
                  value={
                    declaration.taxpayerAddress
                  }
                />

                <InfoRow
                  label='Mẫu tờ khai'
                  value={
                    declaration.formCode
                  }
                />

                <InfoRow
                  label='Phiên bản'
                  value={String(
                    declaration.version
                  )}
                />

                <InfoRow
                  label='Ngày tạo'
                  value={formatDate(
                    declaration.generatedAt
                  )}
                />

                {declaration.submittedAt && (
                  <InfoRow
                    label='Ngày gửi'
                    value={formatDate(
                      declaration.submittedAt
                    )}
                  />
                )}
              </div>

              <div className='rounded-2xl bg-white p-6 shadow-sm'>
                <h2 className='mb-4 text-lg font-black'>
                  Tổng hợp nghĩa vụ thuế
                </h2>

                <InfoRow
                  label='Tổng doanh thu'
                  value={formatMoney(
                    declaration.totalRevenue
                  )}
                />

                <InfoRow
                  label='Thuế GTGT'
                  value={formatMoney(
                    declaration.totalVatTaxAmount
                  )}
                />

                <InfoRow
                  label='Thuế TNCN'
                  value={formatMoney(
                    declaration.totalPersonalIncomeTaxAmount
                  )}
                />

                <InfoRow
                  label='Thuế GTGT được miễn'
                  value={formatMoney(
                    declaration.vatExemptionAmount
                  )}
                />

                <InfoRow
                  label='Thuế TNCN được miễn'
                  value={formatMoney(
                    declaration.personalIncomeTaxExemptionAmount
                  )}
                />

                <InfoRow
                  label='Thuế GTGT phải nộp'
                  value={formatMoney(
                    declaration.vatPayableAmount
                  )}
                />

                <InfoRow
                  label='Thuế TNCN phải nộp'
                  value={formatMoney(
                    declaration.personalIncomeTaxPayableAmount
                  )}
                />

                <InfoRow
                  label='Tổng thuế phải nộp'
                  value={formatMoney(
                    declaration.totalTaxPayableAmount
                  )}
                  highlight
                />
              </div>
            </div>

            {declaration.lines.length >
              0 && (
              <div className='mt-6 overflow-hidden rounded-2xl bg-white shadow-sm'>
                <div className='border-b border-gray-100 p-6'>
                  <h2 className='text-lg font-black'>
                    Chi tiết hoạt động
                    kinh doanh
                  </h2>
                </div>

                <div className='overflow-x-auto'>
                  <table className='w-full min-w-225 text-left'>
                    <thead className='bg-gray-50 text-xs uppercase text-gray-500'>
                      <tr>
                        <th className='px-5 py-4'>
                          Hoạt động
                        </th>

                        <th className='px-5 py-4 text-right'>
                          Doanh thu
                        </th>

                        <th className='px-5 py-4 text-right'>
                          Thuế GTGT
                        </th>

                        <th className='px-5 py-4 text-right'>
                          Thuế TNCN
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {declaration.lines.map(
                        (line) => (
                          <tr
                            key={
                              line.id
                            }
                            className='border-t border-gray-100'
                          >
                            <td className='px-5 py-4'>
                              <p className='font-bold text-gray-800'>
                                {
                                  line.businessActivityName
                                }
                              </p>

                              <p className='mt-1 text-xs text-gray-400'>
                                {
                                  line.businessActivityCode
                                }
                              </p>
                            </td>

                            <td className='px-5 py-4 text-right font-semibold'>
                              {formatMoney(
                                line.totalRevenue
                              )}
                            </td>

                            <td className='px-5 py-4 text-right'>
                              {formatMoney(
                                line.vatTaxAmount
                              )}
                            </td>

                            <td className='px-5 py-4 text-right'>
                              {formatMoney(
                                line.personalIncomeTaxAmount
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className='mt-6 flex flex-wrap justify-end gap-3'>
              <button
                type='button'
                disabled={isExporting}
                onClick={() => {
                  void handleExport()
                }}
                className='flex h-12 items-center gap-2 rounded-xl border border-red-600 bg-white px-7 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400'
              >
                <Download size={18} />

                {isExporting
                  ? 'Đang xuất...'
                  : 'Xuất tờ khai DOCX'}
              </button>

              {declaration.status ===
              'Submitted' ? (
                <div className='flex h-12 items-center gap-2 rounded-xl bg-green-100 px-7 text-sm font-bold text-green-700'>
                  <CheckCircle2 size={18} />

                  Tờ khai đã được gửi
                </div>
              ) : (
                <button
                  type='button'
                  disabled={isSubmitting}
                  onClick={() => {
                    void handleSubmit()
                  }}
                  className='flex h-12 items-center gap-2 rounded-xl bg-red-600 px-7 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300'
                >
                  <Send size={18} />

                  {isSubmitting
                    ? 'Đang gửi...'
                    : 'Gửi tờ khai'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={isSubmitConfirmOpen}
        title='Xác nhận gửi tờ khai'
        description='Sau khi gửi, tờ khai sẽ chuyển sang trạng thái Đã gửi. Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.'
        confirmLabel='Gửi tờ khai'
        isProcessing={isSubmitting}
        onCancel={() =>
          setIsSubmitConfirmOpen(false)
        }
        onConfirm={() => {
          void confirmSubmit()
        }}
      />
    </div>
  )
}